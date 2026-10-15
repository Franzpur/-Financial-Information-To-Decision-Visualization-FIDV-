#!/usr/bin/env python3
"""AI Chain Cube — lightweight HTTP API + static web server (stdlib only)."""
from __future__ import annotations

import json
import mimetypes
import os
import signal
import sqlite3
import sys
import threading
import time
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "server"))

from listing import country_label, parse_ticker  # noqa: E402
from chain_layout import assign_nvda_chain_rings  # noqa: E402
from db import (  # noqa: E402
    DB_PATH,
    connect,
    get_company,
    init_schema,
    list_companies,
    list_layers,
    meta,
    seed_from_json,
)
from bundle_dispatch import (  # noqa: E402
    build_bundle,
    register_chain,
    set_shell_builder,
)

WEB_ROOT = ROOT / "web"
# W1 narrow mouth: repo-root modules/ only (graph + paper HTML). Not a general static mount.
MODULES_ROOT = (ROOT.parent / "modules").resolve()
NVDA_REVENUE_LINKS = ROOT / "data" / "nvda-revenue-links.json"
BICS_JSON = ROOT.parent / "BE-CLASS" / "BICS-Classification" / "bics-equity-hierarchy-2024.json"
ENTITIES_DB = ROOT.parent / "BE-CLASS" / "BICS-Classification" / "bics_entities_20261003.db"
HOST = "127.0.0.1"
DEFAULT_PORT = 8787
# Shell embedding (SHELL-PROC): SFC_PORT picks the port, SFC_PARENT_PID ties our life to the shell.
SHELL_PORT_ENV = "SFC_PORT"
SHELL_PARENT_ENV = "SFC_PARENT_PID"
DATA_DIR_ENV = "SFC_DATA_DIR"
_MODULES_SUFFIXES = {".html", ".json", ".css", ".js"}

_BICS_BY_CODE: dict | None = None
_BICS_CHILDREN: dict | None = None


def _bics_public(n: dict | None) -> dict | None:
    if not n:
        return None
    return {
        "bicsCode": n.get("bicsCode"),
        "name": n.get("name"),
        "nameZh": n.get("nameZh") or "",
        "definition": n.get("definition") or "",
        "legalEntityCoord": n.get("legalEntityCoord"),
        "level": n.get("level"),
        "isLeaf": bool(n.get("isLeaf")),
        "parentCode": n.get("parentCode"),
    }


def _bics_index() -> tuple[dict, dict]:
    """Load BICS nodes once; index by code and by parentCode ('' = L1)."""
    global _BICS_BY_CODE, _BICS_CHILDREN
    if _BICS_BY_CODE is not None and _BICS_CHILDREN is not None:
        return _BICS_BY_CODE, _BICS_CHILDREN
    by_code: dict = {}
    children: dict = {}
    if BICS_JSON.is_file():
        data = json.loads(BICS_JSON.read_text(encoding="utf-8"))
        for n in data.get("nodes", []):
            code = n.get("bicsCode")
            if not code:
                continue
            by_code[code] = n
            parent = n.get("parentCode") or ""
            children.setdefault(parent, []).append(n)
        for kids in children.values():
            kids.sort(key=lambda r: str(r.get("bicsCode") or ""))
    _BICS_BY_CODE = by_code
    _BICS_CHILDREN = children
    return by_code, children


def bics_node(code: str) -> dict | None:
    by_code, _ = _bics_index()
    return _bics_public(by_code.get(code))


def bics_children(parent: str, listing_country: str | None = None) -> dict | None:
    """Children of parent (empty parent = L1). None if parent code is unknown."""
    by_code, kids = _bics_index()
    parent = (parent or "").strip()
    loc = (listing_country or "").strip() or None
    node = by_code.get(parent) if parent else None
    if parent and node is None:
        return None
    chain = []
    cur = node
    while cur:
        chain.append(cur)
        pc = cur.get("parentCode")
        cur = by_code.get(pc) if pc else None
    ancestors = [_bics_public(x) for x in reversed(chain[1:])]
    children = []
    for n in kids.get(parent, []):
        pub = _bics_public(n)
        if not pub:
            continue
        counts = _count_pack(pub.get("bicsCode") or "", loc)
        pub["companyCount"] = counts["companyCount"]
        children.append(pub)
    parent_pub = _bics_public(node)
    prefix = parent if parent else ""
    board = _count_pack(prefix, loc)
    return {
        "parent": parent_pub,
        "ancestors": ancestors,
        "children": children,
        "companyCount": board["companyCount"],
        "totalCount": board["totalCount"],
        "listingCountries": board["listingCountries"],
        "unmappedCount": board["unmappedCount"],
        "listingCountry": loc,
    }


def list_bics_l1() -> list[dict]:
    """[C-COORD-3] Level-1 industry sectors (compat)."""
    pack = bics_children("")
    return (pack or {}).get("children") or []


def _entities_conn() -> sqlite3.Connection | None:
    if not ENTITIES_DB.is_file():
        return None
    conn = sqlite3.connect(f"file:{ENTITIES_DB}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    return conn


def _primary_sort_key(row: sqlite3.Row) -> tuple:
    pct = row["pct_tot_rev"]
    rev = row["ind_rev"]
    return (
        pct is None,
        -(float(pct) if pct is not None else 0.0),
        rev is None,
        -(float(rev) if rev is not None else 0.0),
        str(row["bics_code_l4"] or ""),
        str(row["source_file"] or ""),
        int(row["id"] or 0),
    )


def _collapse_l1_segments(rows: list) -> tuple[list[dict], float | None]:
    totals: dict[str, float] = {}
    for r in rows:
        l1 = (r["l1_name"] or "").strip()
        pct = r["pct_tot_rev"]
        if not l1 or pct is None:
            continue
        totals[l1] = totals.get(l1, 0.0) + float(pct)
    segs = [{"l1": name, "pct": val} for name, val in totals.items()]
    segs.sort(key=lambda s: (-s["pct"], s["l1"]))
    if not segs:
        return [], None
    return segs, round(sum(s["pct"] for s in segs), 4)


def _tickers_for_l4(conn: sqlite3.Connection, code: str) -> list[str]:
    return [
        r[0]
        for r in conn.execute(
            """SELECT DISTINCT ticker FROM entity_memberships
               WHERE bics_code_l4 = ? AND ticker IS NOT NULL AND ticker != ''""",
            (code,),
        )
    ]


def _memberships_by_ticker(conn: sqlite3.Connection, tickers: list[str]) -> dict[str, list]:
    """Load all membership rows for these tickers. Keys stay parameterized."""
    by_ticker: dict[str, list] = {t: [] for t in tickers}
    conn.execute("CREATE TEMP TABLE IF NOT EXISTS _list_tickers (ticker TEXT PRIMARY KEY)")
    conn.execute("DELETE FROM _list_tickers")
    conn.executemany("INSERT INTO _list_tickers(ticker) VALUES (?)", ((t,) for t in tickers))
    cur = conn.execute(
        """SELECT id, name, ticker, l1_name, l2_name, l3_name, l4_name,
                  bics_code_l4, legal_entity_coord, mkt_cap, ind_rev,
                  pct_tot_rev, source_file
           FROM entity_memberships
           WHERE ticker IN (SELECT ticker FROM _list_tickers)"""
    )
    for row in cur:
        by_ticker[row["ticker"]].append(row)
    return by_ticker


def _entity_coord(row) -> str:
    """Unsigned 7×2 from the library; '-' prefix if the winning % Tot Rev is empty."""
    raw = str(row["legal_entity_coord"] or "").strip()
    if row["pct_tot_rev"] is None and raw and not raw.startswith("-"):
        return "-" + raw
    return raw


def _entity_if_primary(ticker: str, rows: list, code: str) -> dict | None:
    if not rows:
        return None
    primary = min(rows, key=_primary_sort_key)
    if primary["bics_code_l4"] != code:
        return None
    segs, pct_sum = _collapse_l1_segments(rows)
    primary_l1 = (primary["l1_name"] or "").strip()
    return {
        "name": primary["name"],
        "ticker": ticker,
        "l1_name": primary_l1,
        "l4_name": primary["l4_name"],
        "bics_code_l4": primary["bics_code_l4"],
        "legal_entity_coord": _entity_coord(primary),
        "pct_tot_rev": primary["pct_tot_rev"],
        "ind_rev": float(primary["ind_rev"]) if primary["ind_rev"] is not None else None,
        "pct_sum": pct_sum,
        "segments": segs,
        "other_segments": [s for s in segs if s["l1"] != primary_l1],
    }


_PRIMARY_BY_L4: dict[str, list[tuple[str, str | None]]] | None = None


def _primary_index() -> dict[str, list[tuple[str, str | None]]]:
    """Primary L4 memberships: distinct ticker → listing country."""
    global _PRIMARY_BY_L4
    if _PRIMARY_BY_L4 is not None:
        return _PRIMARY_BY_L4
    out: dict[str, list[tuple[str, str | None]]] = {}
    conn = _entities_conn()
    if conn is None:
        _PRIMARY_BY_L4 = {}
        return _PRIMARY_BY_L4
    try:
        by_ticker: dict[str, list] = {}
        cur = conn.execute(
            """SELECT id, name, ticker, l1_name, l2_name, l3_name, l4_name,
                      bics_code_l4, legal_entity_coord, mkt_cap, ind_rev,
                      pct_tot_rev, source_file
               FROM entity_memberships
               WHERE ticker IS NOT NULL AND ticker != ''"""
        )
        for row in cur:
            by_ticker.setdefault(row["ticker"], []).append(row)
        for ticker, rows in by_ticker.items():
            primary = min(rows, key=_primary_sort_key)
            code = str(primary["bics_code_l4"] or "")
            loc = parse_ticker(ticker)["listingCountry"]
            out.setdefault(code, []).append((ticker, loc))
    finally:
        conn.close()
    _PRIMARY_BY_L4 = out
    return out


def _tickers_under(prefix: str) -> list[tuple[str, str | None]]:
    acc: list[tuple[str, str | None]] = []
    for code, rows in _primary_index().items():
        if not prefix or code.startswith(prefix):
            acc.extend(rows)
    return acc


def _count_pack(prefix: str, listing_country: str | None) -> dict:
    rows = _tickers_under(prefix)
    total = len(rows)
    by_c: dict[str, int] = {}
    unmapped = 0
    for _, loc in rows:
        if not loc:
            unmapped += 1
        else:
            by_c[loc] = by_c.get(loc, 0) + 1
    if listing_country == "UNMAPPED":
        filtered = unmapped
    elif listing_country:
        filtered = by_c.get(listing_country, 0)
    else:
        filtered = total
    nations = [
        {"listingCountry": iso, "label": country_label(iso), "count": n}
        for iso, n in sorted(by_c.items(), key=lambda kv: (-kv[1], kv[0]))
    ]
    if unmapped:
        nations.append({"listingCountry": "UNMAPPED", "label": "Unmapped", "count": unmapped})
    return {
        "companyCount": filtered,
        "totalCount": total,
        "listingCountries": nations,
        "unmappedCount": unmapped,
    }


def _entity_matches_listing(loc_info: dict, loc: str | None) -> bool:
    if loc == "UNMAPPED":
        return bool(loc_info["listingCountryUnmapped"])
    return not loc or loc_info["listingCountry"] == loc


def _entity_pct_sort_key(e: dict) -> tuple:
    pct = e["pct_tot_rev"]
    pct_val = -float(pct) if pct is not None else 0.0
    return (pct is None, pct_val, str(e["name"] or "").lower())


def _entities_for_primary_l4(code: str, loc: str | None) -> list[dict]:
    entities: list[dict] = []
    conn = _entities_conn()
    if conn is None:
        return entities
    try:
        by_ticker = _memberships_by_ticker(conn, _tickers_for_l4(conn, code))
        for ticker, rows in by_ticker.items():
            item = _entity_if_primary(ticker, rows, code)
            if not item:
                continue
            loc_info = parse_ticker(ticker)
            if not _entity_matches_listing(loc_info, loc):
                continue
            item.update(loc_info)
            entities.append(item)
        entities.sort(key=_entity_pct_sort_key)
    finally:
        conn.close()
    return entities


def _bics_ancestors(code: str) -> list[dict]:
    """Walk parentCode upward. Root first, exclude the node itself. No child counts."""
    by_code, _ = _bics_index()
    chain = []
    cur = by_code.get(code)
    while cur:
        chain.append(cur)
        pc = cur.get("parentCode")
        cur = by_code.get(pc) if pc else None
    return [_bics_public(x) for x in reversed(chain[1:])]


def list_bics_entities(code: str, listing_country: str | None = None) -> dict | None:
    """Companies whose primary L4 equals this code. One row per Member Ticker.

    Does not call bics_children: that board counts every child. This page only
    needs this prefix's listing distribution plus the entity rows.
    """
    loc = (listing_country or "").strip() or None
    node = bics_node(code)
    if not node or node.get("level") != 4:
        return None
    board = _count_pack(code, loc)
    entities = _entities_for_primary_l4(code, loc)
    return {
        "node": node,
        "ancestors": _bics_ancestors(code),
        "entities": entities,
        "count": len(entities),
        "totalCount": board["totalCount"],
        "listingCountries": board["listingCountries"],
        "unmappedCount": board["unmappedCount"],
        "listingCountry": loc,
    }


def _normalize_ticker_key(raw: str) -> str:
    return " ".join(str(raw or "").strip().upper().split())


def _resolve_entity_ticker(raw: str) -> str | None:
    """Map URL/list ticker to a Member Ticker key present in entity_memberships."""
    key = _normalize_ticker_key(raw)
    if not key:
        return None
    head = key.split(" ", 1)[0]
    conn = _entities_conn()
    if conn is None:
        return None
    try:
        rows = conn.execute(
            """SELECT DISTINCT ticker FROM entity_memberships
               WHERE ticker IS NOT NULL AND ticker != ''"""
        ).fetchall()
        tickers = [str(r["ticker"]) for r in rows]
        for t in tickers:
            if _normalize_ticker_key(t) == key:
                return t
        for t in tickers:
            nt = _normalize_ticker_key(t)
            if nt.split(" ", 1)[0] == head:
                return t
        return None
    finally:
        conn.close()


def _primary_entity_for_ticker(ticker: str) -> dict | None:
    """Winning L4 membership for one Member Ticker (same sort as C-LIST)."""
    conn = _entities_conn()
    if conn is None:
        return None
    try:
        by = _memberships_by_ticker(conn, [ticker])
        rows = by.get(ticker) or []
        if not rows:
            return None
        primary = min(rows, key=_primary_sort_key)
        loc = parse_ticker(ticker)
        iso = loc.get("listingCountry")
        rev = primary["ind_rev"]
        return {
            "name": primary["name"] or "",
            "ticker": ticker,
            "l4_name": (primary["l4_name"] or "").strip(),
            "bics_code_l4": str(primary["bics_code_l4"] or ""),
            "legal_entity_coord": _entity_coord(primary),
            "ind_rev": float(rev) if rev is not None else None,
            "country": "US" if iso == "US" else "INTL",
        }
    finally:
        conn.close()


def _primary_hit(conn: sqlite3.Connection, ticker: str) -> dict | None:
    rows = conn.execute(
        """SELECT id, name, ticker, l4_name, bics_code_l4, legal_entity_coord,
                  pct_tot_rev, ind_rev, source_file
           FROM entity_memberships WHERE ticker = ?""",
        (ticker,),
    ).fetchall()
    if not rows:
        return None
    primary = min(rows, key=_primary_sort_key)
    code = str(primary["bics_code_l4"] or "")
    if not code:
        return None
    return {
        "name": primary["name"] or "",
        "ticker": ticker,
        "bicsCode": code,
        "l4Name": (primary["l4_name"] or "").strip(),
        "legalEntityCoord": _entity_coord(primary),
    }


def locate_bics(q: str, limit: int = 8) -> dict:
    """Find a firm's primary L4 from a ticker or name. Empty when the member db is absent."""
    key = _normalize_ticker_key(q)
    if len(key) < 2:
        return {"hits": [], "exact": False}
    conn = _entities_conn()
    if conn is None:
        return {"hits": [], "exact": False}
    try:
        tickers, by_ticker = _locate_tickers(conn, key, limit)
        hits = []
        for t in tickers[:limit]:
            hit = _primary_hit(conn, t)
            if hit:
                hits.append(hit)
        exact = by_ticker and len(hits) == 1
        return {"hits": hits, "exact": exact}
    finally:
        conn.close()


def _append_unique_tickers(dest: list[str], seen: set[str], rows) -> None:
    for r in rows:
        t = str(r["ticker"])
        if t in seen:
            continue
        seen.add(t)
        dest.append(t)


def _identity_tickers(conn: sqlite3.Connection, key: str) -> list[str]:
    identity: list[str] = []
    seen: set[str] = set()
    _append_unique_tickers(
        identity,
        seen,
        conn.execute(
            """SELECT DISTINCT ticker FROM entity_memberships
               WHERE upper(ticker) = ?""",
            (key,),
        ).fetchall(),
    )
    if " " not in key:
        _append_unique_tickers(
            identity,
            seen,
            conn.execute(
                """SELECT ticker FROM entity_memberships
                   WHERE upper(ticker) = ? OR upper(ticker) LIKE ?
                   GROUP BY ticker
                   ORDER BY MAX(ind_rev) DESC""",
                (key, key + " %"),
            ).fetchall(),
        )
    else:
        _append_unique_tickers(
            identity,
            seen,
            conn.execute(
                """SELECT ticker FROM entity_memberships
                   WHERE upper(ticker) LIKE ?
                   GROUP BY ticker
                   ORDER BY MAX(ind_rev) DESC""",
                (key + "%",),
            ).fetchall(),
        )
    return identity


def _merge_locate_lists(identity: list[str], names: list[str], limit: int) -> list[str]:
    merged: list[str] = []
    in_merged: set[str] = set()
    for t in identity:
        if t in in_merged:
            continue
        in_merged.add(t)
        merged.append(t)
        if len(merged) >= limit:
            break
    if len(merged) >= limit:
        if names and names[0] not in in_merged:
            merged[-1] = names[0]
        return merged
    for t in names:
        if t in in_merged:
            continue
        in_merged.add(t)
        merged.append(t)
        if len(merged) >= limit:
            break
    return merged


def _locate_tickers(conn: sqlite3.Connection, key: str, limit: int) -> tuple[list[str], bool]:
    """Ticker identity first, then a name fragment anywhere in the company name.

    A symbol hit must not hide the name. Name rows are nearest fragment, then revenue.
    `by_ticker` stays true only when the merged list is a single ticker identity.
    """
    identity = _identity_tickers(conn, key)
    name_rows = conn.execute(
        """SELECT ticker FROM entity_memberships
           WHERE upper(name) LIKE ?
           GROUP BY ticker
           ORDER BY MIN(instr(upper(name), ?)) ASC, MAX(ind_rev) DESC
           LIMIT ?""",
        ("%" + key + "%", key, limit),
    ).fetchall()
    names = [str(r["ticker"]) for r in name_rows]
    merged = _merge_locate_lists(identity, names, limit)
    return merged, bool(identity) and len(merged) == 1


def _load_nvda_revenue_doc() -> dict | None:
    if not NVDA_REVENUE_LINKS.is_file():
        return None
    try:
        data = json.loads(NVDA_REVENUE_LINKS.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return data if isinstance(data, dict) else None


def _layer_index_by_id(layers: list[dict], layer_id: str) -> int | None:
    for i, L in enumerate(layers):
        if str(L.get("id") or "") == layer_id:
            return i
    return None


def _entity_by_member_ticker(ticker: str) -> dict | None:
    """Prefer exact Member Ticker; fall back to resolver head match."""
    raw = (ticker or "").strip()
    if not raw:
        return None
    hit = _primary_entity_for_ticker(raw)
    if hit:
        return hit
    resolved = _resolve_entity_ticker(raw)
    if resolved and resolved != raw:
        return _primary_entity_for_ticker(resolved)
    return None


_UNRESOLVED_L4 = "unresolved"


def _peer_l4_key(ent: dict | None) -> tuple[str, str]:
    """Return (compact L4 code, display name). Unresolved peers share one slice."""
    if not ent:
        return _UNRESOLVED_L4, "Unresolved"
    code = str(ent.get("bics_code_l4") or "").strip()
    name = str(ent.get("l4_name") or "").strip()
    if not code:
        return _UNRESOLVED_L4, "Unresolved"
    return code, name or code


def _order_nvda_l4_slices(
    center_code: str | None,
    supplier_codes: set[str],
    customer_codes: set[str],
) -> list[str]:
    """s-order: supplier L4s → center L4 → customer L4s; same side sorted by code.

    A code that appears on both sides is kept once in the supplier block.
    Center's L4 is inserted once between the two blocks.
    """
    sup = sorted(c for c in supplier_codes if c and c != center_code)
    cust = sorted(
        c for c in customer_codes if c and c != center_code and c not in supplier_codes
    )
    out: list[str] = []
    out.extend(sup)
    if center_code:
        out.append(center_code)
    out.extend(cust)
    return out


def _one_nvda_peer(row: dict) -> dict | None:
    side = row.get("side")
    if side not in ("supplier", "customer"):
        return None
    name = str(row.get("name") or "").strip()
    ticker = str(row.get("ticker") or "").strip()
    if not name and not ticker:
        return None
    raw_country = row.get("country")
    country = raw_country if raw_country in ("US", "INTL") else "INTL"
    ent = _entity_by_member_ticker(ticker) if ticker else None
    l4_code, l4_name = _peer_l4_key(ent)
    pct = row.get("spendPct") if side == "supplier" else row.get("revPct")
    return {
        "side": side,
        "name": name,
        "ticker": ticker,
        "country": country,
        "ent": ent,
        "l4_code": l4_code,
        "l4_name": l4_name,
        "pct": pct,
    }


def _resolve_nvda_peers(
    peers: list,
    *,
    center_code: str,
    center_l4_name: str,
) -> tuple[list[dict], set[str], set[str], dict[str, str]]:
    """Resolve peer tickers; collect L4 codes by side and display names."""
    resolved_peers: list[dict] = []
    supplier_codes: set[str] = set()
    customer_codes: set[str] = set()
    l4_names: dict[str, str] = {}
    if center_code != _UNRESOLVED_L4:
        l4_names[center_code] = center_l4_name

    for row in peers:
        if not isinstance(row, dict):
            continue
        peer = _one_nvda_peer(row)
        if not peer:
            continue
        l4_code = peer["l4_code"]
        if l4_code == _UNRESOLVED_L4:
            l4_names[l4_code] = "Unresolved"
        else:
            l4_names[l4_code] = peer["l4_name"]
        if peer["side"] == "supplier":
            supplier_codes.add(l4_code)
        else:
            customer_codes.add(l4_code)
        resolved_peers.append(peer)
    return resolved_peers, supplier_codes, customer_codes, l4_names


def _nvda_layers_meta(
    ordered_codes: list[str],
    l4_names: dict[str, str],
) -> list[dict]:
    layers_meta: list[dict] = []
    for i, code in enumerate(ordered_codes):
        blurb = "No entity match" if code == _UNRESOLVED_L4 else f"BICS L4 {code}"
        layers_meta.append(
            {
                "idx": i,
                "id": code,
                "name": l4_names.get(code) or code,
                "blurb": blurb,
                "companyCount": 0,
            }
        )
    return layers_meta


def _nvda_us_or_intl(country: str | None) -> str:
    return "US" if country == "US" else "INTL"


def _nvda_peer_display(ent: dict | None, row: dict) -> tuple[str, str, str]:
    """Name, ticker, country for a resolved peer row."""
    if ent and ent.get("name"):
        display_name = ent["name"]
    else:
        display_name = row["name"] or row["ticker"]
    if ent and ent.get("ticker"):
        display_ticker = ent["ticker"]
    else:
        display_ticker = row["ticker"] or display_name
    country = ent["country"] if ent else row["country"]
    return display_name, display_ticker, country


def _nvda_peer_rev_bn(ent: dict | None, pct) -> float:
    if ent and ent.get("ind_rev") is not None:
        return float(ent["ind_rev"]) / 1e9
    if isinstance(pct, (int, float)):
        return max(float(pct), 0.1)
    return 1.0


def _nvda_append_company(
    companies: list[dict],
    ticker_to_id: dict[str, int],
    layers_meta: list[dict],
    *,
    name: str,
    ticker: str,
    layer_id: str,
    country: str,
    rev_bn: float,
    note: str,
    source_detail: str,
    legal: str,
    side: str | None = None,
    link_pct: float | None = None,
) -> int:
    key = _normalize_ticker_key(ticker) or name
    if key in ticker_to_id:
        return ticker_to_id[key]
    li = _layer_index_by_id(layers_meta, layer_id)
    if li is None:
        li = _layer_index_by_id(layers_meta, _UNRESOLVED_L4)
    if li is None:
        li = 0
    cid = len(companies)
    row: dict = {
        "id": cid,
        "name": name,
        "ticker": ticker,
        "revBn": float(rev_bn),
        "country": _nvda_us_or_intl(country),
        "layer": int(li),
        "note": note,
        "valueM": None,
        "source": "nvda-revenue-links",
        "sourceDetail": source_detail,
        "legalEntityCoord": legal,
    }
    if side in ("supplier", "customer"):
        row["side"] = side
    if isinstance(link_pct, (int, float)):
        row["linkPct"] = float(link_pct)
    companies.append(row)
    ticker_to_id[key] = cid
    return cid


def _nvda_add_center(
    companies: list[dict],
    ticker_to_id: dict[str, int],
    layers_meta: list[dict],
    center_ent: dict | None,
    center_code: str,
) -> int:
    if center_ent:
        rev = center_ent.get("ind_rev")
        rev_bn = (float(rev) / 1e9) if rev is not None else 100.0
        return _nvda_append_company(
            companies,
            ticker_to_id,
            layers_meta,
            name=center_ent["name"] or "NVIDIA",
            ticker=center_ent["ticker"],
            layer_id=center_code,
            country=center_ent["country"],
            rev_bn=rev_bn,
            note=center_ent.get("l4_name") or "AI accelerators",
            source_detail=center_ent.get("bics_code_l4") or "",
            legal=center_ent.get("legal_entity_coord") or "",
        )
    return _nvda_append_company(
        companies,
        ticker_to_id,
        layers_meta,
        name="NVIDIA",
        ticker="NVDA US Equity",
        layer_id=center_code,
        country="US",
        rev_bn=100.0,
        note="AI accelerators",
        source_detail="",
        legal="",
    )


def _nvda_build_links(
    resolved_peers: list[dict],
    companies: list[dict],
    ticker_to_id: dict[str, int],
    layers_meta: list[dict],
    nvda_id: int,
) -> list[dict]:
    revenue_links: list[dict] = []
    for row in resolved_peers:
        ent = row["ent"]
        display_name, display_ticker, country = _nvda_peer_display(ent, row)
        pct = row["pct"]
        note = ""
        source_detail = ""
        legal = ""
        if ent:
            note = ent.get("l4_name") or ""
            source_detail = ent.get("bics_code_l4") or ""
            legal = ent.get("legal_entity_coord") or ""
        if not note:
            note = row["l4_code"]
        link_pct = float(pct) if isinstance(pct, (int, float)) else None
        peer_id = _nvda_append_company(
            companies,
            ticker_to_id,
            layers_meta,
            name=display_name,
            ticker=display_ticker,
            layer_id=row["l4_code"],
            country=country,
            rev_bn=_nvda_peer_rev_bn(ent, pct),
            note=note,
            source_detail=source_detail,
            legal=legal,
            side=row["side"],
            link_pct=link_pct,
        )
        link = {
            "side": row["side"],
            "fromId": nvda_id,
            "toId": peer_id,
            "name": display_name,
            "country": _nvda_us_or_intl(country),
        }
        if isinstance(pct, (int, float)):
            link["pct"] = float(pct)
        revenue_links.append(link)
    return revenue_links


def bundle_nvda_chain(ticker_raw: str) -> dict:
    """NVDA supply-chain cube: dynamic BICS-L4 C-SLICE walls + point-to-point C-REV-LINK.

    Slice count = distinct primary L4 codes among center + peers. Slice name = L4 name.
    """
    doc = _load_nvda_revenue_doc() or {}
    raw_peers = doc.get("peers")
    peers = raw_peers if isinstance(raw_peers, list) else []

    center_ticker = str(doc.get("centerTicker") or "NVDA US Equity")
    center_ent = _entity_by_member_ticker(center_ticker) or _entity_by_member_ticker("NVDA")
    center_code, center_l4_name = _peer_l4_key(center_ent)

    resolved_peers, supplier_codes, customer_codes, l4_names = _resolve_nvda_peers(
        peers, center_code=center_code, center_l4_name=center_l4_name
    )

    ordered_codes = _order_nvda_l4_slices(center_code, supplier_codes, customer_codes)
    if not ordered_codes:
        fallback = center_code or _UNRESOLVED_L4
        ordered_codes = [fallback]
        l4_names.setdefault(fallback, center_l4_name or "Unresolved")

    layers_meta = _nvda_layers_meta(ordered_codes, l4_names)
    companies: list[dict] = []
    ticker_to_id: dict[str, int] = {}
    nvda_id = _nvda_add_center(companies, ticker_to_id, layers_meta, center_ent, center_code)
    revenue_links = _nvda_build_links(
        resolved_peers, companies, ticker_to_id, layers_meta, nvda_id
    )

    companies = assign_nvda_chain_rings(companies, center_id=nvda_id)
    counts: dict[int, int] = {}
    for c in companies:
        counts[c["layer"]] = counts.get(c["layer"], 0) + 1
    for L in layers_meta:
        L["companyCount"] = counts.get(L["idx"], 0)

    m = meta()
    resolved = center_ent["ticker"] if center_ent else center_ticker
    return {
        "meta": {
            "title": "NVIDIA — supply chain cube",
            "countries": m["countries"],
            "version": 1,
            "shell": False,
            "nvdaChain": True,
            "ticker": ticker_raw,
            "tickerResolved": resolved,
            "tickerFound": True,
            "layerIds": [L["id"] for L in layers_meta],
            "sliceMode": "bics-l4",
            "placeMode": "link-hemisphere",
        },
        "layers": layers_meta,
        "companies": companies,
        "revenueLinks": revenue_links,
    }


def bundle_shell_ticker(ticker_raw: str) -> dict:
    """Standard shell cube: BICS firm at user (s,x,y)=(5,5,5); no industry slices/rings.

    User s=5 is face-center depth (FACE_SPAN mid), not layer index 0. Shell mode
    ships empty layers so the client skips C-SLICE walls and C-RING guides.
    """
    resolved = _resolve_entity_ticker(ticker_raw)
    entity = _primary_entity_for_ticker(resolved) if resolved else None
    anchor = {"s": 5, "x": 5, "y": 5}
    companies: list[dict] = []
    if entity:
        companies.append(
            {
                "id": 0,
                "name": entity["name"],
                "ticker": entity["ticker"],
                # revBn is billions, same scale as the demo chain. ind_rev stays raw USD in the table.
                "revBn": (float(entity["ind_rev"]) / 1e9) if entity["ind_rev"] is not None else 0.0,
                "country": entity["country"],
                "note": entity["l4_name"] or "",
                "valueM": None,
                "source": "bics-entity",
                "sourceDetail": entity["bics_code_l4"] or "",
                "legalEntityCoord": entity["legal_entity_coord"] or "",
                "s": anchor["s"],
                "x": anchor["x"],
                "y": anchor["y"],
            }
        )
    m = meta()
    return {
        "meta": {
            "title": (entity["name"] if entity else ticker_raw) + " — decision cube",
            "countries": m["countries"],
            "version": 1,
            "shell": True,
            "shellAnchor": anchor,
            "ticker": ticker_raw,
            "tickerResolved": resolved,
            "tickerFound": bool(companies),
        },
        "layers": [],
        "companies": companies,
        # Empty-wall shell: no fan / no C-REV-LINK (NVDA uses bundle_nvda_chain instead).
        "revenueLinks": [],
    }


def _quarantine_db() -> None:
    """Rename an unreadable DB (and its journal) aside, keep the newest 2 copies, so ensure_db can rebuild."""
    stamp = time.strftime("%Y%m%dT%H%M%SZ", time.gmtime())
    for suffix in ("", "-journal"):
        src = DB_PATH.with_name(DB_PATH.name + suffix)
        if src.exists():
            src.rename(DB_PATH.with_name(f"{DB_PATH.name}.corrupt-{stamp}{suffix}"))
    old = sorted(DB_PATH.parent.glob(f"{DB_PATH.name}.corrupt-*[0-9Z]"))
    for stale in old[:-2]:
        stale.unlink(missing_ok=True)
        stale.with_name(stale.name + "-journal").unlink(missing_ok=True)


def _open_checked_db() -> sqlite3.Connection | None:
    conn = connect()
    try:
        init_schema(conn)
        if conn.execute("PRAGMA quick_check").fetchone()[0] != "ok":
            raise sqlite3.DatabaseError("quick_check failed")
    except sqlite3.OperationalError:
        conn.close()
        raise  # locked / cannot open: not corruption, never set a healthy DB aside
    except sqlite3.DatabaseError:
        conn.close()
        return None
    return conn


def ensure_db() -> None:
    conn = _open_checked_db()
    if conn is None:
        print(f"[Ind-Chain] SQLite unreadable, set aside and rebuilding → {DB_PATH}", flush=True)
        _quarantine_db()
        conn = connect()
        init_schema(conn)
    n = conn.execute("SELECT COUNT(*) AS n FROM companies").fetchone()["n"]
    if n == 0:
        seed_from_json(conn)
        n = conn.execute("SELECT COUNT(*) AS n FROM companies").fetchone()["n"]
        print(f"[Ind-Chain] seeded SQLite → {DB_PATH} ({n} companies)")
    else:
        print(f"[Ind-Chain] using SQLite → {DB_PATH} ({n} companies)")
    conn.close()
    n_pri = sum(len(v) for v in _primary_index().values())
    print(f"[Ind-Chain] primary listings {n_pri} tickers", flush=True)


def json_bytes(obj) -> bytes:
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


class Handler(BaseHTTPRequestHandler):
    server_version = "AIChainCube/1.0"

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))

    def _cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_json(self, code: int, obj) -> None:
        body = json_bytes(obj)
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def _send_file(self, path: Path) -> None:
        if not path.is_file():
            # No filesystem path in JSON (W1 A2).
            self._send_json(404, {"error": "not found"})
            return
        data = path.read_bytes()
        ctype, _ = mimetypes.guess_type(str(path))
        if path.suffix == ".js":
            ctype = "text/javascript; charset=utf-8"
        elif path.suffix == ".css":
            ctype = "text/css; charset=utf-8"
        elif path.suffix == ".html":
            ctype = "text/html; charset=utf-8"
        elif path.suffix == ".json":
            ctype = "application/json; charset=utf-8"
        self.send_response(200)
        self.send_header("Content-Type", ctype or "application/octet-stream")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-cache")
        self._cors()
        self.end_headers()
        self.wfile.write(data)

    def _send_modules(self, url_path: str) -> bool:
        """Serve only files under MODULES_ROOT. Returns True if handled."""
        if url_path not in ("/modules", "/modules/") and not url_path.startswith("/modules/"):
            return False
        rel = url_path[len("/modules") :].lstrip("/")
        if not rel or rel.endswith("/"):
            rel = (rel + "index.html") if rel else "index.html"
        candidate = (MODULES_ROOT / rel).resolve()
        root_s = str(MODULES_ROOT)
        if not str(candidate).startswith(root_s + "/") and str(candidate) != root_s:
            self._send_json(403, {"error": "forbidden"})
            return True
        if candidate.suffix.lower() not in _MODULES_SUFFIXES:
            self._send_json(403, {"error": "forbidden"})
            return True
        self._send_file(candidate)
        return True

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        try:
            self._route()
        except Exception:  # noqa: BLE001
            traceback.print_exc()
            # W1 A2: never put exception text (may contain paths) in JSON.
            self._send_json(500, {"error": "internal error"})

    def _route(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        qs = parse_qs(parsed.query)

        if path in ("/", "/index.html"):
            self._send_file(WEB_ROOT / "index.html")
            return

        if path in ("/cube", "/cube/", "/cube.html"):
            self._send_file(WEB_ROOT / "cube.html")
            return

        if path in ("/list", "/list/", "/list.html"):
            self._send_file(WEB_ROOT / "list.html")
            return

        if self._send_modules(path):
            return

        if path.startswith("/api/"):
            self._api(path, qs)
            return

        # Static assets under web/ only (W1 A1: no escape to data/, BE-DATA, chain docs).
        rel = path.lstrip("/")
        web_root = WEB_ROOT.resolve()
        candidate = (WEB_ROOT / rel).resolve()
        if not str(candidate).startswith(str(web_root) + "/") and candidate != web_root:
            self._send_json(403, {"error": "forbidden"})
            return
        self._send_file(candidate)

    def _qs0(self, qs: dict, key: str, default: str = "") -> str:
        return (qs.get(key, [default])[0] or default).strip()

    def _bics_children_resp(self, qs: dict) -> None:
        parent = self._qs0(qs, "parent")
        loc = self._qs0(qs, "listingCountry") or None
        pack = bics_children(parent, loc)
        if pack is None:
            self._send_json(404, {"error": "unknown bics parent", "parent": parent})
            return
        self._send_json(200, pack)

    def _bics_node_resp(self, qs: dict) -> None:
        code = self._qs0(qs, "code")
        node = bics_node(code) if code else None
        if not node:
            self._send_json(404, {"error": "unknown bics code", "code": code})
            return
        self._send_json(200, {"node": node})

    def _bics_entities_resp(self, qs: dict) -> None:
        code = self._qs0(qs, "bics")
        loc = self._qs0(qs, "listingCountry") or None
        pack = list_bics_entities(code, loc) if code else None
        if pack is None:
            self._send_json(400, {"error": "bics must be a level-4 code", "bics": code})
            return
        self._send_json(200, pack)

    def _api_bics(self, path: str, qs: dict) -> bool:
        """Handle /api/bics/* ; return True if this path is a BICS route."""
        if path == "/api/bics/l1":
            self._send_json(200, {"sectors": list_bics_l1()})
            return True
        if path == "/api/bics/children":
            self._bics_children_resp(qs)
            return True
        if path == "/api/bics/node":
            self._bics_node_resp(qs)
            return True
        if path == "/api/bics/locate":
            self._send_json(200, locate_bics(self._qs0(qs, "q")))
            return True
        if path == "/api/bics/entities":
            self._bics_entities_resp(qs)
            return True
        return False

    def _api_companies(self, conn, path: str, qs: dict) -> None:
        if path == "/api/companies":
            layer = qs.get("layer", [None])[0]
            layer_i = int(layer) if layer not in (None, "") else None
            supply = qs.get("supply", ["0"])[0] in ("1", "true", "yes")
            companies = list_companies(
                conn,
                layer=layer_i,
                country=qs.get("country", [None])[0],
                supply_only=supply,
                q=qs.get("q", [None])[0],
            )
            self._send_json(200, {"companies": companies, "count": len(companies)})
            return
        cid = int(path.rsplit("/", 1)[-1])
        company = get_company(conn, cid)
        if not company:
            self._send_json(404, {"error": "company not found"})
            return
        self._send_json(200, {"company": company})

    def _api_bundle(self, qs: dict) -> None:
        """BE-BUNDLE via bundle_dispatch — shell/chain never open BE-DEMO-DB."""
        ticker = self._qs0(qs, "ticker")
        self._send_json(200, build_bundle(ticker))

    def _api(self, path: str, qs: dict) -> None:
        if path.startswith("/api/bics/") and self._api_bics(path, qs):
            return
        # Health / bundle do not require demo DB (M1 isolation).
        if path == "/api/health":
            # W1 A2: no library file path handles in browser JSON.
            self._send_json(200, {"ok": True})
            return
        if path == "/api/bundle":
            self._api_bundle(qs)
            return
        conn = connect()
        try:
            if path == "/api/meta":
                self._send_json(200, meta())
                return
            if path == "/api/layers":
                self._send_json(200, {"layers": list_layers(conn)})
                return
            if path == "/api/companies" or path.startswith("/api/companies/"):
                self._api_companies(conn, path, qs)
                return
            self._send_json(404, {"error": "unknown api route", "path": path})
        finally:
            conn.close()


def _register_bundle_builders() -> None:
    """Wire BE-BUNDLE registry once app builders exist (no circular import)."""
    set_shell_builder(bundle_shell_ticker)
    register_chain(
        "nvda",
        lambda key: key.split(" ", 1)[0] == "NVDA",
        bundle_nvda_chain,
    )


_register_bundle_builders()


def _resolve_port() -> tuple[int, bool]:
    """Return (port, from_env). Unset -> 8787; invalid SFC_PORT -> exit non-zero."""
    raw = os.environ.get(SHELL_PORT_ENV)
    if raw is None:
        return DEFAULT_PORT, False
    try:
        port = int(raw)
    except ValueError:
        port = -1
    if not 1024 <= port <= 65535:
        print(f"[Ind-Chain] invalid {SHELL_PORT_ENV}={raw!r} (need integer 1024-65535)", file=sys.stderr, flush=True)
        sys.exit(2)
    return port, True


def _check_data_dir() -> None:
    """SFC_DATA_DIR must be an absolute, creatable, writable directory; else exit 2 with a readable line."""
    raw = os.environ.get(DATA_DIR_ENV)
    if raw is None:
        return
    d = Path(raw)
    problem = None
    if not d.is_absolute():
        problem = "not an absolute path"
    else:
        try:
            d.mkdir(parents=True, exist_ok=True)
        except OSError as exc:
            problem = f"cannot create ({exc.strerror})"
        else:
            if not os.access(d, os.W_OK):
                problem = "not writable"
    if problem:
        print(f"[Ind-Chain] invalid {DATA_DIR_ENV}={raw!r}: {problem}", file=sys.stderr, flush=True)
        sys.exit(2)


def _start_parent_watch() -> None:
    """Exit (hard) if the embedding shell dies, so no orphan server is left behind."""
    raw = os.environ.get(SHELL_PARENT_ENV)
    if raw is None:
        return
    try:
        parent = int(raw)
        if parent <= 1:
            raise ValueError
    except ValueError:
        print(f"[Ind-Chain] ignoring invalid {SHELL_PARENT_ENV}={raw!r}", file=sys.stderr, flush=True)
        return

    def watch() -> None:
        while True:
            time.sleep(1.0)
            try:
                os.kill(parent, 0)
            except ProcessLookupError:
                print("[Ind-Chain] parent gone, exiting", flush=True)
                os._exit(0)
            except PermissionError:
                continue

    threading.Thread(target=watch, daemon=True, name="parent-watch").start()


def _raise_interrupt(_signum, _frame) -> None:
    raise KeyboardInterrupt


def main() -> None:
    port, from_env = _resolve_port()
    _check_data_dir()
    _start_parent_watch()  # before ensure_db(): first-run seed can take seconds
    signal.signal(signal.SIGTERM, _raise_interrupt)
    ensure_db()
    # Loopback-only stdlib server (HOST=127.0.0.1). Cleartext HTTP is intentional for local FIDV.
    httpd = ThreadingHTTPServer((HOST, port), Handler)
    if from_env:
        print(f"[Ind-Chain] port {port}", flush=True)
    print(f"[Ind-Chain] homepage http://{HOST}:{port}/ · list /list · cube /cube · modules /modules/", flush=True)
    print("[Ind-Chain] API: /api/bundle  /api/bics/children  /api/bics/entities  /api/bics/locate  /api/bics/node  /api/health", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[Ind-Chain] stopped")
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
