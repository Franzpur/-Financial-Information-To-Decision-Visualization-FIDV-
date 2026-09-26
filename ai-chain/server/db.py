"""SQLite access for the AI industry-chain cube."""
from __future__ import annotations

import math
import sqlite3
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "data" / "ai_chain.db"
DATA_DIR = ROOT / "data"

SCHEMA = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS layers (
  idx INTEGER PRIMARY KEY,
  id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  blurb TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  rev_bn REAL,
  ticker TEXT,
  country TEXT NOT NULL,
  layer_index INTEGER NOT NULL REFERENCES layers(idx),
  note TEXT,
  value_m REAL,
  source TEXT,
  source_detail TEXT
);

CREATE INDEX IF NOT EXISTS idx_companies_layer ON companies(layer_index);
CREATE INDEX IF NOT EXISTS idx_companies_country ON companies(country);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
"""

COUNTRY_LABEL = {
    "US": "United States", "KR": "South Korea", "TW": "Taiwan", "CN": "China", "JP": "Japan",
    "NL": "Netherlands", "DE": "Germany", "FR": "France", "CH": "Switzerland", "CA": "Canada",
    "SG": "Singapore", "GB": "United Kingdom", "IL": "Israel",
}


def connect(db_path: Path | None = None) -> sqlite3.Connection:
    path = db_path or DB_PATH
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(path))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(SCHEMA)
    conn.commit()


def _source_fields(layer_index: int, value_m: float | None) -> tuple[str, str]:
    if value_m is not None:
        return (
            "GOOGL_SUPPLY.xlsx",
            "Bloomberg Alphabet supplier relationship (quantified USD). Gold ring = in this table.",
        )
    if layer_index == 0:
        return (
            "Public industry map",
            "US utility / nuclear PPA coverage for AI data-center load. Not in GOOGL_SUPPLY.",
        )
    if layer_index >= 9:
        return (
            "Public industry map",
            "Hyperscaler / frontier-lab placement for customer-facing end of the chain.",
        )
    return (
        "Public industry map",
        "Standard AI semiconductor / infrastructure map (US-first). Not a quantified row in GOOGL_SUPPLY.",
    )


def seed_from_json(conn: sqlite3.Connection, data_dir: Path | None = None) -> None:
    import json

    d = data_dir or DATA_DIR
    layers = json.loads((d / "layers.json").read_text())
    companies = json.loads((d / "companies.json").read_text())

    conn.execute("DELETE FROM companies")
    conn.execute("DELETE FROM layers")
    for i, L in enumerate(layers):
        conn.execute(
            "INSERT INTO layers (idx, id, name, blurb) VALUES (?, ?, ?, ?)",
            (i, L["id"], L["name"], L.get("blurb") or ""),
        )
    for c in companies:
        src, detail = _source_fields(c["layer_index"], c.get("value_m"))
        conn.execute(
            """
            INSERT INTO companies
              (id, name, rev_bn, ticker, country, layer_index, note, value_m, source, source_detail)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                c["id"],
                c["name"],
                c.get("rev_bn"),
                c.get("ticker"),
                c["country"],
                c["layer_index"],
                c.get("note"),
                c.get("value_m"),
                src,
                detail,
            ),
        )
    conn.commit()


def assign_rings(companies: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Min-max normalize revenue per layer; score 100 → center."""
    by_layer: dict[int, list[dict[str, Any]]] = {}
    for c in companies:
        by_layer.setdefault(c["layer"], []).append(c)

    for arr in by_layer.values():
        revs = [float(c.get("revBn") or 0) for c in arr]
        lo, hi = min(revs), max(revs)
        span = hi - lo
        rings: list[list[dict[str, Any]]] = [[] for _ in range(10)]
        centers: list[dict[str, Any]] = []
        for c in arr:
            rev = float(c.get("revBn") or 0)
            score = 50.0 if span < 1e-9 else ((rev - lo) / span) * 100.0
            score = max(0.0, min(100.0, score))
            c["revScore"] = score
            if score >= 100 - 1e-9:
                c["ring"] = 10
                centers.append(c)
                continue
            ring = min(9, int(math.floor(score / 10)))
            c["ring"] = ring
            rings[ring].append(c)
        for ring, group in enumerate(rings):
            n = len(group)
            for i, c in enumerate(group):
                t = (ring + 0.5) / 10
                radial = 1 - t
                c["radial"] = radial
                ang = 0 if n == 0 else (i / n) * math.pi * 2 + ring * 0.35 + (c.get("layer") or 0) * 0.11
                c["x"] = math.cos(ang) * radial
                c["y"] = math.sin(ang) * radial
        for i, c in enumerate(centers):
            c["radial"] = 0.0
            if len(centers) == 1:
                c["x"] = 0.0
                c["y"] = 0.0
            else:
                ang = (i / len(centers)) * math.pi * 2
                eps = 0.035
                c["x"] = math.cos(ang) * eps
                c["y"] = math.sin(ang) * eps
    return companies


def row_company(r: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": r["id"],
        "name": r["name"],
        "revBn": r["rev_bn"],
        "ticker": r["ticker"] or "",
        "country": r["country"],
        "layer": r["layer_index"],
        "note": r["note"] or "",
        "valueM": r["value_m"],
        "source": r["source"],
        "sourceDetail": r["source_detail"],
    }


def list_layers(conn: sqlite3.Connection) -> list[dict[str, Any]]:
    rows = conn.execute(
        """
        SELECT l.idx, l.id, l.name, l.blurb,
               COUNT(c.id) AS company_count
        FROM layers l
        LEFT JOIN companies c ON c.layer_index = l.idx
        GROUP BY l.idx
        ORDER BY l.idx
        """
    ).fetchall()
    return [
        {
            "idx": r["idx"],
            "id": r["id"],
            "name": r["name"],
            "blurb": r["blurb"],
            "companyCount": r["company_count"],
        }
        for r in rows
    ]


def list_companies(
    conn: sqlite3.Connection,
    *,
    layer: int | None = None,
    country: str | None = None,
    supply_only: bool = False,
    q: str | None = None,
) -> list[dict[str, Any]]:
    # Always ring-normalize on the full set so filters don't shift positions.
    rows = conn.execute("SELECT * FROM companies ORDER BY id").fetchall()
    companies = assign_rings([row_company(r) for r in rows])
    out = companies
    if layer is not None:
        out = [c for c in out if c["layer"] == layer]
    if country == "US":
        out = [c for c in out if c["country"] == "US"]
    elif country == "intl":
        out = [c for c in out if c["country"] != "US"]
    if supply_only:
        out = [c for c in out if c.get("valueM") is not None]
    if q:
        ql = q.lower()
        out = [
            c for c in out
            if ql in c["name"].lower() or ql in (c.get("ticker") or "").lower()
        ]
    return out


def get_company(conn: sqlite3.Connection, company_id: int) -> dict[str, Any] | None:
    companies = list_companies(conn)
    return next((c for c in companies if c["id"] == company_id), None)


def meta() -> dict[str, Any]:
    return {
        "title": "AI Industry Chain Cube",
        "countries": COUNTRY_LABEL,
        "version": 1,
    }
