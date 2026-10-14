"""BE-BUNDLE — explicit mode orchestration (demo | shell | chain).

Builders register from app at import-complete time (no lazy import of app).
HTTP must not hard-code ticker==NVDA; register chain instances here.
"""
from __future__ import annotations

from typing import Any, Callable

from db import connect, list_companies, list_layers, meta

BundleBuilder = Callable[[str], dict[str, Any]]

_CHAIN_REGISTRY: list[tuple[str, Callable[[str], bool], BundleBuilder]] = []
_SHELL_BUILDER: BundleBuilder | None = None


def _normalize_ticker_key(raw: str | None) -> str:
    return " ".join(str(raw or "").strip().upper().split())


def register_chain(
    instance_id: str,
    match: Callable[[str], bool],
    builder: BundleBuilder,
) -> None:
    # Replace same id if re-registered (app reload / tests).
    global _CHAIN_REGISTRY
    _CHAIN_REGISTRY = [row for row in _CHAIN_REGISTRY if row[0] != instance_id]
    _CHAIN_REGISTRY.append((instance_id, match, builder))


def set_shell_builder(builder: BundleBuilder) -> None:
    global _SHELL_BUILDER
    _SHELL_BUILDER = builder


def resolve_bundle_mode(ticker: str | None) -> str:
    """Return demo | shell | chain."""
    if not ticker or not str(ticker).strip():
        return "demo"
    key = _normalize_ticker_key(ticker)
    for _id, match, _builder in _CHAIN_REGISTRY:
        if match(key):
            return "chain"
    return "shell"


def _stamp_mode(payload: dict[str, Any], mode: str) -> dict[str, Any]:
    """Single discriminant: meta.mode. Keep shell/nvdaChain as derived mirrors for one cycle."""
    meta_obj = payload.setdefault("meta", {})
    if isinstance(meta_obj, dict):
        meta_obj["mode"] = mode
        meta_obj["shell"] = mode == "shell"
        meta_obj["nvdaChain"] = mode == "chain"
    return payload


def build_demo_bundle() -> dict[str, Any]:
    """BE-DEMO-DB path only — requires demo SQLite."""
    conn = connect()
    try:
        return _stamp_mode(
            {
                "meta": meta(),
                "layers": list_layers(conn),
                "companies": list_companies(conn),
            },
            "demo",
        )
    finally:
        conn.close()


def build_bundle(ticker: str | None) -> dict[str, Any]:
    """Unique mode dispatch. shell/chain never open BE-DEMO-DB."""
    mode = resolve_bundle_mode(ticker)
    if mode == "demo":
        return build_demo_bundle()
    assert ticker is not None
    key = _normalize_ticker_key(ticker)
    if mode == "chain":
        for _id, match, builder in _CHAIN_REGISTRY:
            if match(key):
                return _stamp_mode(builder(ticker), "chain")
    if _SHELL_BUILDER is None:
        raise RuntimeError("BE-BUNDLE: shell builder not registered")
    return _stamp_mode(_SHELL_BUILDER(ticker), "shell")
