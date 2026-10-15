"""BE-DB-SHADOW — Empty-wall shell cube projection for non-chain tickers.

Never opens BE-DB-DEMO (ind_chain.db). Entity lookup is wired via public callbacks.
"""
from __future__ import annotations

from typing import Any, Callable, Optional

SHELL_COUNTRIES: dict[str, str] = {
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

ResolveTickerFn = Callable[[str], Optional[str]]
PrimaryEntityFn = Callable[[str], Optional[dict[str, Any]]]

_RESOLVE_TICKER: ResolveTickerFn | None = None
_PRIMARY_ENTITY: PrimaryEntityFn | None = None


def configure_shadow_lookup(
    resolve_ticker_fn: ResolveTickerFn,
    primary_entity_fn: PrimaryEntityFn,
) -> None:
    """Bind public entity resolution callbacks from the HTTP / orchestration boundary."""
    global _RESOLVE_TICKER, _PRIMARY_ENTITY
    _RESOLVE_TICKER = resolve_ticker_fn
    _PRIMARY_ENTITY = primary_entity_fn


def bundle_shell_ticker(ticker_raw: str) -> dict[str, Any]:
    """Standard shell cube: BICS firm at user (s,x,y)=(5,5,5); no industry slices/rings.

    User s=5 is face-center depth (FACE_SPAN mid), not layer index 0. Shell mode
    ships empty layers so the client skips C-SLICE walls and C-RING guides.
    """
    resolved = _RESOLVE_TICKER(ticker_raw) if _RESOLVE_TICKER is not None else None
    entity = _PRIMARY_ENTITY(resolved) if (resolved and _PRIMARY_ENTITY is not None) else None
    anchor = {"s": 5, "x": 5, "y": 5}
    companies: list[dict[str, Any]] = []
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
    return {
        "meta": {
            "title": (entity["name"] if entity else ticker_raw) + " — decision cube",
            "countries": dict(SHELL_COUNTRIES),
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
