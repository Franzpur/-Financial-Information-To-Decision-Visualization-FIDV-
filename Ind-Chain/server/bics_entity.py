"""BE-BICS-ENTITY — Entity membership SQLite queries, primary L4 resolution, counts, and search."""
from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Any

from listing import country_label, parse_ticker

ROOT = Path(__file__).resolve().parents[1]
ENTITIES_DB = ROOT.parent / "BE-CLASS" / "BICS-Classification" / "bics_entities_20261003.db"
UNRESOLVED_L4 = "unresolved"

_PRIMARY_BY_L4: dict[str, list[tuple[str, str | None]]] | None = None


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


def _collapse_l1_segments(rows: list) -> tuple[list[dict[str, Any]], float | None]:
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


def _entity_if_primary(ticker: str, rows: list, code: str) -> dict[str, Any] | None:
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


def primary_listings_count() -> int:
    """Total distinct primary ticker listings across all L4s."""
    return sum(len(v) for v in _primary_index().values())


def _tickers_under(prefix: str) -> list[tuple[str, str | None]]:
    acc: list[tuple[str, str | None]] = []
    for code, rows in _primary_index().items():
        if not prefix or code.startswith(prefix):
            acc.extend(rows)
    return acc


def count_pack(prefix: str, listing_country: str | None = None) -> dict[str, Any]:
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


def _entity_matches_listing(loc_info: dict[str, Any], loc: str | None) -> bool:
    if loc == "UNMAPPED":
        return bool(loc_info["listingCountryUnmapped"])
    return not loc or loc_info["listingCountry"] == loc


def _entity_pct_sort_key(e: dict[str, Any]) -> tuple:
    pct = e["pct_tot_rev"]
    pct_val = -float(pct) if pct is not None else 0.0
    return (pct is None, pct_val, str(e["name"] or "").lower())


def _entities_for_primary_l4(code: str, loc: str | None) -> list[dict[str, Any]]:
    entities: list[dict[str, Any]] = []
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


def list_bics_entities(
    code: str,
    listing_country: str | None = None,
    *,
    node: dict[str, Any] | None = None,
    ancestors: list[dict[str, Any]] | None = None,
) -> dict[str, Any] | None:
    """Companies whose primary L4 equals this code. One row per Member Ticker.

    Does not call bics_children: that board counts every child. This page only
    needs this prefix's listing distribution plus the entity rows.
    """
    loc = (listing_country or "").strip() or None
    if not node or node.get("level") != 4:
        return None
    board = count_pack(code, loc)
    entities = _entities_for_primary_l4(code, loc)
    return {
        "node": node,
        "ancestors": ancestors if ancestors is not None else [],
        "entities": entities,
        "count": len(entities),
        "totalCount": board["totalCount"],
        "listingCountries": board["listingCountries"],
        "unmappedCount": board["unmappedCount"],
        "listingCountry": loc,
    }


def normalize_ticker_key(raw: str) -> str:
    return " ".join(str(raw or "").strip().upper().split())


def resolve_entity_ticker(raw: str) -> str | None:
    """Map URL/list ticker to a Member Ticker key present in entity_memberships."""
    key = normalize_ticker_key(raw)
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
            if normalize_ticker_key(t) == key:
                return t
        for t in tickers:
            nt = normalize_ticker_key(t)
            if nt.split(" ", 1)[0] == head:
                return t
        return None
    finally:
        conn.close()


def primary_entity_for_ticker(ticker: str) -> dict[str, Any] | None:
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


def entity_by_member_ticker(ticker: str) -> dict[str, Any] | None:
    """Prefer exact Member Ticker; fall back to resolver head match."""
    raw = (ticker or "").strip()
    if not raw:
        return None
    hit = primary_entity_for_ticker(raw)
    if hit:
        return hit
    resolved = resolve_entity_ticker(raw)
    if resolved and resolved != raw:
        return primary_entity_for_ticker(resolved)
    return None


def peer_l4_key(ent: dict[str, Any] | None) -> tuple[str, str]:
    """Return (compact L4 code, display name). Unresolved peers share one slice."""
    if not ent:
        return UNRESOLVED_L4, "Unresolved"
    code = str(ent.get("bics_code_l4") or "").strip()
    name = str(ent.get("l4_name") or "").strip()
    if not code:
        return UNRESOLVED_L4, "Unresolved"
    return code, name or code


def _primary_hit(conn: sqlite3.Connection, ticker: str) -> dict[str, Any] | None:
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


def locate_bics(q: str, limit: int = 8) -> dict[str, Any]:
    """Find a firm's primary L4 from a ticker or name. Empty when the member db is absent."""
    key = normalize_ticker_key(q)
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
