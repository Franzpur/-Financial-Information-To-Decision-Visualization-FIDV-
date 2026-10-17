#!/usr/bin/env python3
"""Bake CONUS coastline ring from Natural Earth 50m admin_0 (public domain).

Usage:
  curl -sL -o /tmp/ne_50m_admin_0_countries.geojson \\
    https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson
  python3 scripts/bake_us_conus_outline.py /tmp/ne_50m_admin_0_countries.geojson

Writes data/geo/us-conus-outline.json (WGS84 rings, AK/HI excluded).
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "geo" / "us-conus-outline.json"
LON0, LON1, LAT0, LAT1 = -125.5, -66.0, 24.0, 49.5
EPS = 0.003
MIN_AREA = 1.0


def area(ring: list) -> float:
    a = 0.0
    for i in range(len(ring) - 1):
        a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
    return abs(a) / 2.0


def ring_in_conus(ring: list) -> bool:
    xs = [p[0] for p in ring]
    ys = [p[1] for p in ring]
    cx, cy = sum(xs) / len(xs), sum(ys) / len(ys)
    return LON0 <= cx <= LON1 and LAT0 <= cy <= LAT1


def douglas_peucker(points: list, eps: float) -> list:
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = points[a][0], points[a][1]
        bx, by = points[b][0], points[b][1]
        dx, dy = bx - ax, by - ay
        den = math.hypot(dx, dy) or 1e-12
        max_d, max_i = -1.0, None
        for i in range(a + 1, b):
            px, py = points[i][0], points[i][1]
            d = abs(dy * px - dx * py + bx * ay - by * ax) / den
            if d > max_d:
                max_d, max_i = d, i
        if max_d > eps and max_i is not None:
            keep[max_i] = True
            stack.append((a, max_i))
            stack.append((max_i, b))
    return [pt for pt, k in zip(points, keep) if k]


def simplify_ring(ring: list, eps: float) -> list:
    pts = ring[:-1] if ring[0] == ring[-1] else list(ring)
    simp = douglas_peucker(pts, eps)
    if simp[0] != simp[-1]:
        simp = simp + [simp[0]]
    return [[round(p[0], 5), round(p[1], 5)] for p in simp]


def main() -> int:
    src = Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/ne_50m_admin_0_countries.geojson")
    if not src.is_file():
        print(f"missing {src}", file=sys.stderr)
        return 1
    data = json.loads(src.read_text(encoding="utf-8"))
    usa = next(
        (
            f
            for f in data["features"]
            if (f.get("properties") or {}).get("ISO_A2", "").upper() == "US"
        ),
        None,
    )
    if not usa:
        print("USA feature not found", file=sys.stderr)
        return 1
    raw = []
    for poly in usa["geometry"]["coordinates"]:
        ext = poly[0]
        if ring_in_conus(ext) and area(ext) >= MIN_AREA:
            raw.append(ext)
    raw.sort(key=area, reverse=True)
    rings = [simplify_ring(r, EPS) for r in raw]
    payload = {
        "source": "Natural Earth ne_50m_admin_0_countries (USA)",
        "license": "Public Domain (Natural Earth)",
        "crs": "WGS84",
        "region": "CONUS",
        "simplifyEpsDeg": EPS,
        "bounds": {"lonMin": -125, "lonMax": -66, "latMin": 24, "latMax": 50},
        "rings": rings,
        "holes": [],
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    n = sum(len(r) for r in rings)
    print(f"wrote {OUT} rings={len(rings)} verts={n} bytes={OUT.stat().st_size}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
