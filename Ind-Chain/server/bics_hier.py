"""BE-BICS-HIER — BICS classification tree JSON index and node/children/ancestors projection."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Callable, Optional

ROOT = Path(__file__).resolve().parents[1]
BICS_JSON = ROOT.parent / "BE-CLASS" / "BICS-Classification" / "bics-equity-hierarchy-2024.json"

_BICS_BY_CODE: dict[str, dict[str, Any]] | None = None
_BICS_CHILDREN: dict[str, list[dict[str, Any]]] | None = None

CountFn = Callable[[str, Optional[str]], dict[str, Any]]


def _default_count_pack(_prefix: str, _loc: str | None) -> dict[str, Any]:
    return {
        "companyCount": 0,
        "totalCount": 0,
        "listingCountries": [],
        "unmappedCount": 0,
    }


def bics_public(n: dict[str, Any] | None) -> dict[str, Any] | None:
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


def _bics_index() -> tuple[dict[str, dict[str, Any]], dict[str, list[dict[str, Any]]]]:
    """Load BICS nodes once; index by code and by parentCode ('' = L1)."""
    global _BICS_BY_CODE, _BICS_CHILDREN
    if _BICS_BY_CODE is not None and _BICS_CHILDREN is not None:
        return _BICS_BY_CODE, _BICS_CHILDREN
    by_code: dict[str, dict[str, Any]] = {}
    children: dict[str, list[dict[str, Any]]] = {}
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


def bics_node(code: str) -> dict[str, Any] | None:
    by_code, _ = _bics_index()
    return bics_public(by_code.get(code))


def bics_ancestors(code: str) -> list[dict[str, Any]]:
    """Walk parentCode upward. Root first, exclude the node itself. No child counts."""
    by_code, _ = _bics_index()
    chain: list[dict[str, Any]] = []
    cur = by_code.get(code)
    while cur:
        chain.append(cur)
        pc = cur.get("parentCode")
        cur = by_code.get(pc) if pc else None
    out: list[dict[str, Any]] = []
    for x in reversed(chain[1:]):
        pub = bics_public(x)
        if pub is not None:
            out.append(pub)
    return out


def bics_children(
    parent: str,
    listing_country: str | None = None,
    *,
    count_fn: CountFn | None = None,
) -> dict[str, Any] | None:
    """Children of parent (empty parent = L1). None if parent code is unknown."""
    by_code, kids = _bics_index()
    parent = (parent or "").strip()
    loc = (listing_country or "").strip() or None
    node = by_code.get(parent) if parent else None
    if parent and node is None:
        return None
    counter = count_fn or _default_count_pack
    chain: list[dict[str, Any]] = []
    cur = node
    while cur:
        chain.append(cur)
        pc = cur.get("parentCode")
        cur = by_code.get(pc) if pc else None
    ancestors = [bics_public(x) for x in reversed(chain[1:])]
    children: list[dict[str, Any]] = []
    for n in kids.get(parent, []):
        pub = bics_public(n)
        if not pub:
            continue
        counts = counter(pub.get("bicsCode") or "", loc)
        pub["companyCount"] = counts["companyCount"]
        children.append(pub)
    parent_pub = bics_public(node)
    prefix = parent if parent else ""
    board = counter(prefix, loc)
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


def list_bics_l1(*, count_fn: CountFn | None = None) -> list[dict[str, Any]]:
    """[C-COORD-3] Level-1 industry sectors (compat)."""
    pack = bics_children("", count_fn=count_fn)
    return (pack or {}).get("children") or []
