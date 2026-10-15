"""BE-NVDA-LINKS — NVDA revenue-link chain document loader and dynamic BICS-L4 chain builder.

Never opens BE-DB-DEMO (ind_chain.db). Ring placement delegates to BE-NVDA-LAYOUT (chain_layout).
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Callable, Optional

from chain_layout import assign_nvda_chain_rings

ROOT = Path(__file__).resolve().parents[1]
NVDA_REVENUE_LINKS = ROOT / "data" / "nvda-revenue-links.json"
UNRESOLVED_L4 = "unresolved"
CHAIN_COUNTRIES: dict[str, str] = {
    "US": "United States",
    "KR": "South Korea",
    "TW": "Taiwan",
    "CN": "China",
    "JP": "Japan",
    "NL": "Netherlands",
    "DE": "Germany",
    "FR": "France",
    "CH": "Switzerland",
    "CA": "Canada",
    "SG": "Singapore",
    "GB": "United Kingdom",
    "IL": "Israel",
}

EntityByTickerFn = Callable[[str], Optional[dict[str, Any]]]
PeerL4KeyFn = Callable[[Optional[dict[str, Any]]], tuple[str, str]]

_ENTITY_BY_TICKER: EntityByTickerFn | None = None
_PEER_L4_KEY: PeerL4KeyFn | None = None


def configure_nvda_entity_lookup(
    entity_by_ticker_fn: EntityByTickerFn,
    peer_l4_key_fn: PeerL4KeyFn,
) -> None:
    """Bind public entity lookup callbacks from the HTTP / orchestration boundary."""
    global _ENTITY_BY_TICKER, _PEER_L4_KEY
    _ENTITY_BY_TICKER = entity_by_ticker_fn
    _PEER_L4_KEY = peer_l4_key_fn


def _normalize_ticker_key(raw: str) -> str:
    return " ".join(str(raw or "").strip().upper().split())


def _default_peer_l4_key(ent: dict[str, Any] | None) -> tuple[str, str]:
    if not ent:
        return UNRESOLVED_L4, "Unresolved"
    code = str(ent.get("bics_code_l4") or "").strip()
    name = str(ent.get("l4_name") or "").strip()
    if not code:
        return UNRESOLVED_L4, "Unresolved"
    return code, name or code


def load_nvda_revenue_doc() -> dict[str, Any] | None:
    if not NVDA_REVENUE_LINKS.is_file():
        return None
    try:
        data = json.loads(NVDA_REVENUE_LINKS.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return data if isinstance(data, dict) else None


def _layer_index_by_id(layers: list[dict[str, Any]], layer_id: str) -> int | None:
    for i, L in enumerate(layers):
        if str(L.get("id") or "") == layer_id:
            return i
    return None


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


def _one_nvda_peer(row: dict[str, Any]) -> dict[str, Any] | None:
    side = row.get("side")
    if side not in ("supplier", "customer"):
        return None
    name = str(row.get("name") or "").strip()
    ticker = str(row.get("ticker") or "").strip()
    if not name and not ticker:
        return None
    raw_country = row.get("country")
    country = raw_country if raw_country in ("US", "INTL") else "INTL"
    ent = (_ENTITY_BY_TICKER(ticker) if _ENTITY_BY_TICKER is not None else None) if ticker else None
    key_fn = _PEER_L4_KEY or _default_peer_l4_key
    l4_code, l4_name = key_fn(ent)
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
    peers: list[Any],
    *,
    center_code: str,
    center_l4_name: str,
) -> tuple[list[dict[str, Any]], set[str], set[str], dict[str, str]]:
    """Resolve peer tickers; collect L4 codes by side and display names."""
    resolved_peers: list[dict[str, Any]] = []
    supplier_codes: set[str] = set()
    customer_codes: set[str] = set()
    l4_names: dict[str, str] = {}
    if center_code != UNRESOLVED_L4:
        l4_names[center_code] = center_l4_name

    for row in peers:
        if not isinstance(row, dict):
            continue
        peer = _one_nvda_peer(row)
        if not peer:
            continue
        l4_code = peer["l4_code"]
        if l4_code == UNRESOLVED_L4:
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
) -> list[dict[str, Any]]:
    layers_meta: list[dict[str, Any]] = []
    for i, code in enumerate(ordered_codes):
        blurb = "No entity match" if code == UNRESOLVED_L4 else f"BICS L4 {code}"
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


def _nvda_peer_display(ent: dict[str, Any] | None, row: dict[str, Any]) -> tuple[str, str, str]:
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


def _nvda_peer_rev_bn(ent: dict[str, Any] | None, pct: Any) -> float:
    if ent and ent.get("ind_rev") is not None:
        return float(ent["ind_rev"]) / 1e9
    if isinstance(pct, (int, float)):
        return max(float(pct), 0.1)
    return 1.0


def _nvda_append_company(
    companies: list[dict[str, Any]],
    ticker_to_id: dict[str, int],
    layers_meta: list[dict[str, Any]],
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
        li = _layer_index_by_id(layers_meta, UNRESOLVED_L4)
    if li is None:
        li = 0
    cid = len(companies)
    row: dict[str, Any] = {
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
    companies: list[dict[str, Any]],
    ticker_to_id: dict[str, int],
    layers_meta: list[dict[str, Any]],
    center_ent: dict[str, Any] | None,
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
    resolved_peers: list[dict[str, Any]],
    companies: list[dict[str, Any]],
    ticker_to_id: dict[str, int],
    layers_meta: list[dict[str, Any]],
    nvda_id: int,
) -> list[dict[str, Any]]:
    revenue_links: list[dict[str, Any]] = []
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
        link: dict[str, Any] = {
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


def bundle_nvda_chain(ticker_raw: str) -> dict[str, Any]:
    """NVDA supply-chain cube: dynamic BICS-L4 C-SLICE walls + point-to-point C-REV-LINK.

    Slice count = distinct primary L4 codes among center + peers. Slice name = L4 name.
    """
    doc = load_nvda_revenue_doc() or {}
    raw_peers = doc.get("peers")
    peers = raw_peers if isinstance(raw_peers, list) else []

    center_ticker = str(doc.get("centerTicker") or "NVDA US Equity")
    lookup = _ENTITY_BY_TICKER
    center_ent = (lookup(center_ticker) or lookup("NVDA")) if lookup is not None else None
    key_fn = _PEER_L4_KEY or _default_peer_l4_key
    center_code, center_l4_name = key_fn(center_ent)

    resolved_peers, supplier_codes, customer_codes, l4_names = _resolve_nvda_peers(
        peers, center_code=center_code, center_l4_name=center_l4_name
    )

    ordered_codes = _order_nvda_l4_slices(center_code, supplier_codes, customer_codes)
    if not ordered_codes:
        fallback = center_code or UNRESOLVED_L4
        ordered_codes = [fallback]
        l4_names.setdefault(fallback, center_l4_name or "Unresolved")

    layers_meta = _nvda_layers_meta(ordered_codes, l4_names)
    companies: list[dict[str, Any]] = []
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

    resolved = center_ent["ticker"] if center_ent else center_ticker
    return {
        "meta": {
            "title": "NVIDIA — supply chain cube",
            "countries": dict(CHAIN_COUNTRIES),
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
