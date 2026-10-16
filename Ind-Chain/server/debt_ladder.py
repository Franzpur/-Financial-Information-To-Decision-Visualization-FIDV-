"""BE-DEBT — narrow read of a pre-baked quarterly debt-ladder aggregate (data/debt-ladder-<ticker>.json).

Read-only: no workbook, no per-bond rows, no paths in results. Missing file / not applicable -> None.
Applicability (tickers + names) comes from the baked document, not from code.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
_TICKER = re.compile(r"^[A-Z0-9]{1,8}$")


def normalize_ticker(raw: str) -> str:
    """'googl us equity' -> 'GOOGL' (first token, upper); unusable -> ''."""
    parts = str(raw or "").strip().upper().split()
    return parts[0] if parts and _TICKER.match(parts[0]) else ""


def _norm_name(raw: str) -> str:
    return " ".join(str(raw or "").casefold().split())


def _valid(doc: Any) -> bool:
    qs = doc.get("quarters") if isinstance(doc, dict) else None
    return (
        isinstance(doc, dict)
        and doc.get("v") == 1
        and isinstance(doc.get("appliesTo"), dict)
        and isinstance(qs, list)
        and bool(qs)
        and all(isinstance(q, dict) and isinstance(q.get("q"), str) for q in qs)
    )


def ladder_for(ticker: str, name: str = "") -> dict[str, Any] | None:
    key = normalize_ticker(ticker)
    if not key:
        return None
    path = DATA_DIR / f"debt-ladder-{key.lower()}.json"
    if not path.is_file():
        return None
    try:
        doc = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    if not _valid(doc):
        return None
    applies = doc["appliesTo"]
    if key not in [normalize_ticker(t) for t in applies.get("tickers") or []]:
        return None
    names = applies.get("names")
    if names and _norm_name(name) not in {_norm_name(n) for n in names}:
        return None
    return doc
