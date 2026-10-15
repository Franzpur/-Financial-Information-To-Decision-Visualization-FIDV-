"""BE-NVDA-LAYOUT — pure chain face placement (link-hemisphere).

Input: company rows with side / linkPct + center_id.
Output: same rows with revScore / ring / radial / ringCos / ringSin.
Reusable for any chain instance; today NVDA feeds it via BE-NVDA-LINKS.
"""
from __future__ import annotations

import math
from typing import Any


def _link_score(c: dict[str, Any], lo: float, span: float) -> float:
    """Higher linkPct → higher score → closer to center. Missing pct → 0 (outer)."""
    pct = c.get("linkPct")
    if not isinstance(pct, (int, float)):
        return 0.0
    if span < 1e-9:
        return 100.0
    return max(0.0, min(100.0, ((float(pct) - lo) / span) * 100.0))


def _place_half_disk(group: list[dict[str, Any]], *, supplier: bool) -> None:
    """Open half-disk: supplier ringCos>0 → x<5; customer ringCos<0 → x>5."""
    if not group:
        return
    known = [c for c in group if isinstance(c.get("linkPct"), (int, float))]
    pcts = [float(c["linkPct"]) for c in known]
    lo = min(pcts) if pcts else 0.0
    hi = max(pcts) if pcts else 0.0
    span = hi - lo
    for c in group:
        c["revScore"] = _link_score(c, lo, span)

    group.sort(key=lambda c: (str(c.get("name") or "").lower(), str(c.get("ticker") or "")))
    n = len(group)
    margin = 0.28
    if supplier:
        a0, a1 = -math.pi / 2 + margin, math.pi / 2 - margin
    else:
        a0, a1 = math.pi / 2 + margin, math.pi * 3 / 2 - margin

    for i, c in enumerate(group):
        score = float(c.get("revScore") or 0)
        radial = 0.92 - (score / 100.0) * 0.74
        radial = max(0.18, min(0.95, radial))
        ring = min(9, max(0, int(math.floor((1.0 - radial) * 10))))
        ang = a0 + ((i + 0.5) / n) * (a1 - a0)
        c["ring"] = ring
        c["radial"] = radial
        c["ringCos"] = math.cos(ang) * radial
        c["ringSin"] = math.sin(ang) * radial


def assign_chain_rings(
    companies: list[dict[str, Any]],
    *,
    center_id: int,
) -> list[dict[str, Any]]:
    """Global half-disk placement; center firm at face origin.

    Demo revenue `assign_rings` is not used here.
    """
    centers: list[dict[str, Any]] = []
    suppliers: list[dict[str, Any]] = []
    customers: list[dict[str, Any]] = []
    other: list[dict[str, Any]] = []
    for c in companies:
        if c.get("id") == center_id:
            centers.append(c)
        elif c.get("side") == "supplier":
            suppliers.append(c)
        elif c.get("side") == "customer":
            customers.append(c)
        else:
            other.append(c)

    for c in centers:
        c["revScore"] = 100.0
        c["ring"] = 10
        c["radial"] = 0.0
        c["ringCos"] = 0.0
        c["ringSin"] = 0.0

    _place_half_disk(suppliers, supplier=True)
    _place_half_disk(customers, supplier=False)
    _place_half_disk(other, supplier=True)
    return companies


# Back-compat name used by NVDA chain builder.
assign_nvda_chain_rings = assign_chain_rings
