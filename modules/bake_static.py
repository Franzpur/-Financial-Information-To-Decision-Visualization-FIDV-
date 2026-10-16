#!/usr/bin/env python3
"""Bake modules/graph.json into modules/index.html (static; file:// OK).

Exhibition layout v3 (bus-style, short straight edges)
  left  : 淡黄 后端   — BE-HTTP is a tall bus bar on the zone's right edge;
                       its children sit in two columns to its left.
  middle: FE-API      — a tall contract bar *outside* every frame, between BE and FE.
  right : 淡绿 决策路径 (NAV→LIST + LISTAREA) over 淡蓝 立方体面 (OPENCUBE→AESTHETIC).
  far right: 淡紫 平面映射 (MAPDRAW / MAPDOCK / MAPREG / MAPPROJ, one column), right of the cube zone.

Everything is routed from named ports on node sides; the geometry checker
(hard) proves 0 cross, 0 overlap, 0 line-through-box, 0 tight-parallel, ports
sit on box edges and tips touch the destination. The SVG is rendered here, in
Python, so the page needs no runtime layout code.
"""
from __future__ import annotations

import html as _html
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
GRAPH_PATH = ROOT / "graph.json"
OUT_PATH = ROOT / "index.html"

# ───────────────────────── geometry ─────────────────────────
NW = 98                  # node width
NHF = 36                 # two-line node: id line + 中文 line
BAR_W = 30               # hub bars (BE-HTTP, FE-API)
TIP = 1.5                # arrow tip stops this far outside the target box
CH_X = 450               # (documentation only)

VB_W, VB_H = 858, 650

# column centres
XC_C, XC_B = 69, 203               # BE: leaf column, mid column
XC_L, XC_R = 463, 601              # FE: left column, right column
X_HTTP, X_API = 295, 359           # bar centres
X_MAP = 775                        # flat-map zone column (right of the cube zone)

# rows
R_NAV, R_GATE, R_LIST = 56, 106, 156
R_LUI = (R_GATE + R_LIST) // 2     # 131
R1, R2, R3, R4 = 234, 284, 334, 384  # cube rows
BE_DEMO, BE_SHELL, BE_CHAIN, BE_NVDA = 230, 280, 330, 380
R_SHELL = 462                      # shell-layer row
BE_BUNDLE = (BE_SHELL + BE_CHAIN) // 2   # 305

NODES: dict[str, tuple[float, float, float, float]] = {
    # id: (cx, cy, w, h)
    "BE-HTTP": (X_HTTP, 221, BAR_W, 354),
    "BE-DEBT": (XC_B, BE_DEMO, NW, NHF),
    "BE-BICS-HIER": (XC_B, R_NAV, NW, NHF),
    "BE-BICS-ENTITY": (XC_B, R_GATE, NW, NHF),
    "BE-BICS-INGEST": (XC_C, R_GATE, NW, NHF),
    "BE-BICS-AREA": (XC_B, R_LIST, NW, NHF),
    "BE-BUNDLE": (XC_B, BE_BUNDLE, NW, NHF),
    "BE-DB-DEMO": (XC_C, BE_DEMO, NW, NHF),
    "BE-DB-SHADOW": (XC_C, BE_SHELL, NW, NHF),
    "BE-NVDA-LAYOUT": (XC_C, BE_CHAIN, NW, NHF),
    "BE-NVDA-LINKS": (XC_C, BE_NVDA, NW, NHF),
    "MODULES-TRACK": (XC_B, BE_NVDA, NW, NHF),
    "FE-API": (X_API, 166, BAR_W, 156),
    "FE-NAV": (XC_L, R_NAV, NW, NHF),
    "FE-BOARD": (XC_L, R_GATE, NW, NHF),
    "FE-LIST": (XC_L, R_LIST, NW, NHF),
    "FE-LISTAREA": (XC_R, R_LUI, NW, NHF),
    "FE-OPENCUBE": (XC_L, R1, NW, NHF),
    "FE-AESTHETIC": (XC_R, R1, NW, NHF),
    "FE-ACTION": (XC_L, R2, NW, NHF),
    "FE-PANEL": (XC_R, R2, NW, NHF),
    "FE-SCENE": (XC_L, R3, NW, NHF),
    "FE-COORDONE": (XC_R, R3, NW, NHF),
    "FE-FOCUS": (XC_L, R4, NW, NHF),
    # flat-map zone (second mapping), right of the cube zone
    "FE-MAPOUT": (X_MAP, 180, NW, NHF),
    "FE-MAPDRAW": (X_MAP, R1, NW, NHF),
    "FE-MAPDOCK": (X_MAP, R2, NW, NHF),
    "FE-MAPREG": (X_MAP, R3, NW, NHF),
    "FE-MAPPROJ": (X_MAP, R4, NW, NHF),
    # shell layer (own zone below FE/BE)
    "SHELL-WINDOW": (XC_L, R_SHELL, NW, NHF),
    "SHELL-PROC": (X_HTTP, R_SHELL, NW, NHF),
    "SHELL-PACK": (XC_C, R_SHELL, NW, NHF),
}

HUBS = {"BE-HTTP", "FE-API"}

REGION_FALLBACK = {
    "FE-NAV": "fe-decision", "FE-BOARD": "fe-decision", "FE-LIST": "fe-decision",
    "FE-LISTAREA": "fe-decision",
    "FE-OPENCUBE": "fe-cube", "FE-ACTION": "fe-cube", "FE-COORDONE": "fe-cube",
    "FE-SCENE": "fe-cube", "FE-PANEL": "fe-cube", "FE-FOCUS": "fe-cube",
    "FE-AESTHETIC": "fe-cube",
    "FE-MAPPROJ": "fe-map", "FE-MAPDRAW": "fe-map", "FE-MAPREG": "fe-map", "FE-MAPDOCK": "fe-map",
    "FE-MAPOUT": "fe-map",
    "FE-API": "fe-api",
    "SHELL-WINDOW": "shell", "SHELL-PROC": "shell", "SHELL-PACK": "shell",
    "BE-HTTP": "be", "BE-BUNDLE": "be", "BE-DB-DEMO": "be", "BE-DB-SHADOW": "be",
    "BE-NVDA-LAYOUT": "be", "BE-NVDA-LINKS": "be", "BE-BICS-HIER": "be",
    "BE-BICS-ENTITY": "be", "BE-BICS-AREA": "be", "BE-BICS-INGEST": "be", "MODULES-TRACK": "be",
    "BE-DEBT": "be",
}

# zone frames: id -> (x0, y0, x1, y1)
ZONES = {
    "be": (8, 22, 320, 412),
    "fe-decision": (388, 22, 682, 184),
    "fe-cube": (388, 200, 682, 412),
    "fe-map": (716, 155, 842, 412),
    "shell": (8, 428, 682, 502),
}
ZONE_STYLE = {
    "be": dict(fill="#fbf4dd", stroke="#c2a557", node="#8c7326", chip="后端"),
    "fe-decision": dict(fill="#e9f5ec", stroke="#6fa77c", node="#3f7a4d", chip="决策路径"),
    "fe-cube": dict(fill="#e7f0f9", stroke="#6f94bb", node="#3d6896", chip="立方体面"),
    "fe-map": dict(fill="#f0e9f5", stroke="#9b7bb8", node="#6b4a8a", chip="平面映射"),
    "shell": dict(fill="#eeede8", stroke="#9a968a", node="#5b574c", chip="壳层"),
}
CHIP_W, CHIP_H = 56, 16   # tab straddling the top border, left aligned at +10


def chip_box(zid: str) -> tuple[float, float, float, float]:
    x0, y0, _, _ = ZONES[zid]
    return (x0 + 10, y0 - CHIP_H / 2, x0 + 10 + CHIP_W, y0 + CHIP_H / 2)


def box(mid: str) -> tuple[float, float, float, float]:
    cx, cy, w, h = NODES[mid]
    return (cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2)


# ───────────────────────── routes (named ports) ─────────────────────────
def L(m: str, dy: float = 0.0) -> tuple[float, float]:   # left port
    x0, _, _, _ = box(m)
    return (x0, NODES[m][1] + dy)


def R(m: str, dy: float = 0.0) -> tuple[float, float]:   # right port
    _, _, x1, _ = box(m)
    return (x1, NODES[m][1] + dy)


def T(m: str, dx: float = 0.0) -> tuple[float, float]:   # top port
    _, y0, _, _ = box(m)
    return (NODES[m][0] + dx, y0)


def B(m: str, dx: float = 0.0) -> tuple[float, float]:   # bottom port
    _, _, _, y1 = box(m)
    return (NODES[m][0] + dx, y1)


def tipL(p):  # arrow enters a left side travelling →
    return (p[0] - TIP, p[1])


def tipR(p):  # arrow enters a right side travelling ←
    return (p[0] + TIP, p[1])


def tipT(p):  # arrow enters a top side travelling ↓
    return (p[0], p[1] - TIP)


def tipB(p):  # arrow enters a bottom side travelling ↑
    return (p[0], p[1] + TIP)


def build_routes() -> dict[str, list[tuple[float, float]]]:
    r: dict[str, list[tuple[float, float]]] = {}

    def add(a: str, b: str, t: str, pts):
        r[f"{a}|{b}|{t}"] = [(float(x), float(y)) for x, y in pts]

    # ── FE spine: NAV → BOARD → LIST → OPENCUBE (straight down) ──
    add("FE-NAV", "FE-BOARD", "calls", [B("FE-NAV"), tipT(T("FE-BOARD"))])
    add("FE-BOARD", "FE-LIST", "calls", [B("FE-BOARD"), tipT(T("FE-LIST"))])
    add("FE-LIST", "FE-OPENCUBE", "calls", [B("FE-LIST"), tipT(T("FE-OPENCUBE"))])

    # ── FE → API bar (straight left across the gutter) ──
    for fe in ("FE-BOARD", "FE-LIST"):
        add(fe, "FE-API", "calls", [L(fe), tipR(R_pt_api(fe))])
    add("FE-OPENCUBE", "FE-API", "calls",
        [L("FE-OPENCUBE", -12), tipR((box("FE-API")[2], NODES["FE-OPENCUBE"][1] - 12))])

    # ── contract: API bar → HTTP bar ──
    y_c = (R_GATE + R_LIST) // 2
    add("FE-API", "BE-HTTP", "contract",
        [(box("FE-API")[0], y_c), tipR((box("BE-HTTP")[2], y_c))])

    # ── decision zone: LISTAREA (gap channel x=518, disjoint spans) ──
    xl_r = XC_L + NW / 2          # right edge of FE left column
    xr_r = XC_R + NW / 2          # right edge of FE right column
    gx = xl_r + 20                # LISTAREA channel
    ch_in, ch_out = xl_r + 12, xl_r + 26   # OPENCUBE gap channels (inner / outer)
    ch_left = XC_L - NW / 2 - 14  # OPENCUBE→SCENE left channel (inner); OPENCUBE→MAPDOCK runs outside it at x=392
    wrap_in, wrap_out = xr_r + 12, xr_r + 22   # AESTHETIC wrap channels
    add("FE-BOARD", "FE-LISTAREA", "depends",
        [R("FE-BOARD", 6), (gx, R_GATE + 6), (gx, R_LUI - 5), tipL(L("FE-LISTAREA", -5))])
    add("FE-LIST", "FE-LISTAREA", "depends",
        [R("FE-LIST", -6), (gx, R_LIST - 6), (gx, R_LUI + 5), tipL(L("FE-LISTAREA", 5))])

    # ── cube zone ──
    add("FE-OPENCUBE", "FE-ACTION", "depends", [B("FE-OPENCUBE"), tipT(T("FE-ACTION"))])
    # OPENCUBE → PANEL (near: upper port, outer channel) / COORDONE (far: lower port, inner channel)
    add("FE-OPENCUBE", "FE-PANEL", "depends",
        [R("FE-OPENCUBE", -6), (ch_out, R1 - 6), (ch_out, R2), tipL(L("FE-PANEL"))])
    add("FE-OPENCUBE", "FE-COORDONE", "depends",
        [R("FE-OPENCUBE", 6), (ch_in, R1 + 6), (ch_in, R3 - 6), tipL(L("FE-COORDONE", -6))])
    # OPENCUBE → SCENE : left-hand channel, below the OPENCUBE→API line
    add("FE-OPENCUBE", "FE-SCENE", "depends",
        [L("FE-OPENCUBE", 12), (ch_left, R1 + 12), (ch_left, R3), tipL(L("FE-SCENE"))])
    add("FE-SCENE", "FE-COORDONE", "calls", [R("FE-SCENE", 6), tipL(L("FE-COORDONE", 6))])
    add("FE-SCENE", "FE-FOCUS", "depends", [B("FE-SCENE"), tipT(T("FE-FOCUS"))])

    # ── AESTHETIC: down to PANEL, and wrap on the right to BOARD / LIST ──
    add("FE-AESTHETIC", "FE-PANEL", "depends", [B("FE-AESTHETIC"), tipT(T("FE-PANEL"))])
    add("FE-AESTHETIC", "FE-LIST", "depends",
        [R("FE-AESTHETIC", -6), (wrap_in, R1 - 6), (wrap_in, R_LIST + 6), tipR(R("FE-LIST", 6))])
    add("FE-AESTHETIC", "FE-BOARD", "depends",
        [R("FE-AESTHETIC", 6), (wrap_out, R1 + 6), (wrap_out, R_GATE - 6), tipR(R("FE-BOARD", -6))])

    # ── flat-map zone: one column DRAW / DOCK / REG / PROJ (top to bottom) right of the cube zone ──
    # Inbound to DOCK's left side (dy -12 / 0 / +12): AESTHETIC (lane x=690), PANEL (straight), OPENCUBE (lane x=700,
    # which arrives from below: it leaves OPENCUBE on the left outside the SCENE channel, runs under the cube zone).
    lane_a, lane_o = 690, 700
    y_below = 407                 # corridor between the FOCUS row (bottom 402) and the cube zone's bottom edge (412)
    x_out = 392                   # outer left lane, beside the cube zone's left border (388)
    add("FE-MAPDOCK", "FE-MAPDRAW", "calls", [T("FE-MAPDOCK"), tipB(B("FE-MAPDRAW"))])
    # MAPOUT above MAPDRAW in the same column; mid-right gutter (API uses a further-right lane).
    # Inside-frame lane x=838 (frame right edge 842; final leg >=12); the API line now runs *outside* the frame (lane_r below).
    add("FE-MAPDOCK", "FE-MAPOUT", "calls",
        [R("FE-MAPDOCK", -10), (838, R2 - 10), (838, 180), tipR(R("FE-MAPOUT"))])
    add("FE-MAPDOCK", "FE-MAPREG", "calls", [B("FE-MAPDOCK"), tipT(T("FE-MAPREG"))])
    add("FE-MAPREG", "FE-MAPPROJ", "depends", [B("FE-MAPREG"), tipT(T("FE-MAPPROJ"))])
    add("FE-AESTHETIC", "FE-MAPDRAW", "depends", [R("FE-AESTHETIC", 12), tipL(L("FE-MAPDRAW", 12))])
    add("FE-PANEL", "FE-MAPDOCK", "calls", [R("FE-PANEL"), tipL(L("FE-MAPDOCK"))])
    add("FE-AESTHETIC", "FE-MAPDOCK", "depends",
        [B("FE-AESTHETIC", 30), (box("FE-AESTHETIC")[2] - 19, (R1 + R2) // 2),
         (lane_a, (R1 + R2) // 2), (lane_a, R2 - 12), tipL(L("FE-MAPDOCK", -12))])
    add("FE-OPENCUBE", "FE-MAPDOCK", "depends",
        [L("FE-OPENCUBE"), (x_out, R1), (x_out, y_below), (lane_o, y_below), (lane_o, R2 + 12),
         tipL(L("FE-MAPDOCK", 12))])
    lane_r = ZONES["fe-map"][2] + 10  # right gutter outside the fe-map frame (x1=842 -> 852), clear of MAPDOCK→MAPOUT
    add("FE-MAPDOCK", "FE-API", "calls",
        [R("FE-MAPDOCK", 10), (lane_r, R2 + 10), (lane_r, 8), (X_API, 8), tipT(T("FE-API"))])

    # ── BE: HTTP bar → children, all horizontal ──
    hx = box("BE-HTTP")[0]
    for child, y in (("BE-BICS-HIER", R_NAV), ("BE-BICS-ENTITY", R_GATE), ("BE-BICS-AREA", R_LIST),
                     ("BE-BUNDLE", BE_BUNDLE)):
        add("BE-HTTP", child, "calls", [(hx, y), tipR(R(child))])
    add("BE-HTTP", "MODULES-TRACK", "contract", [(hx, BE_NVDA), tipR(R("MODULES-TRACK"))])
    add("BE-HTTP", "BE-DEBT", "calls", [(hx, BE_DEMO), tipR(R("BE-DEBT"))])

    add("BE-BICS-ENTITY", "BE-BICS-AREA", "depends", [B("BE-BICS-ENTITY"), tipT(T("BE-BICS-AREA"))])
    add("BE-BICS-INGEST", "BE-BICS-ENTITY", "depends", [R("BE-BICS-INGEST"), tipL(L("BE-BICS-ENTITY"))])

    # ── BE: BUNDLE → four leaves via two nested gap channels (x=144 inner, 132 outer) ──
    add("BE-BUNDLE", "BE-DB-DEMO", "calls",
        [L("BE-BUNDLE", -9), (144, BE_BUNDLE - 9), (144, BE_DEMO), tipR(R("BE-DB-DEMO"))])
    add("BE-BUNDLE", "BE-DB-SHADOW", "calls",
        [L("BE-BUNDLE", -3), (132, BE_BUNDLE - 3), (132, BE_SHELL), tipR(R("BE-DB-SHADOW"))])
    add("BE-BUNDLE", "BE-NVDA-LAYOUT", "calls",
        [L("BE-BUNDLE", 3), (132, BE_BUNDLE + 3), (132, BE_CHAIN), tipR(R("BE-NVDA-LAYOUT"))])
    add("BE-BUNDLE", "BE-NVDA-LINKS", "calls",
        [L("BE-BUNDLE", 9), (144, BE_BUNDLE + 9), (144, BE_NVDA), tipR(R("BE-NVDA-LINKS"))])
    add("BE-NVDA-LAYOUT", "BE-NVDA-LINKS", "depends",
        [B("BE-NVDA-LAYOUT"), tipT(T("BE-NVDA-LINKS"))])
    # ── shell layer: window depends on proc; proc calls HTTP; window's contract rides the gap band ──
    add("SHELL-WINDOW", "SHELL-PROC", "depends", [L("SHELL-WINDOW"), tipR(R("SHELL-PROC"))])
    add("SHELL-PROC", "BE-HTTP", "calls", [T("SHELL-PROC"), tipB(B("BE-HTTP"))])
    gap_y = 420                   # between BE/FE zones (bottom 412) and shell zone (top 428)
    add("SHELL-WINDOW", "BE-HTTP", "contract",
        [T("SHELL-WINDOW"), (NODES["SHELL-WINDOW"][0], gap_y), (X_HTTP + 10, gap_y),
         tipB(B("BE-HTTP", 10))])
    # build-time packaging: PACK → BE-HTTP rides the gap band left of the PROC line; PACK → WINDOW under PROC
    pack_gap = 416
    add("SHELL-PACK", "BE-HTTP", "depends",
        [T("SHELL-PACK", 26), (NODES["SHELL-PACK"][0] + 26, pack_gap), (X_HTTP - 10, pack_gap), tipB(B("BE-HTTP", -10))])
    low_y = 494
    add("SHELL-PACK", "SHELL-WINDOW", "depends",
        [B("SHELL-PACK"), (NODES["SHELL-PACK"][0], low_y), (NODES["SHELL-WINDOW"][0], low_y),
         tipB(B("SHELL-WINDOW"))])
    return r


def R_pt_api(fe: str) -> tuple[float, float]:
    """Point on FE-API's right edge at the same y as the FE node (straight line)."""
    return (box("FE-API")[2], NODES[fe][1])


ROUTES = build_routes()


# ───────────────────────── hard geometry checks ─────────────────────────
def _is_h(a, b, tol=1e-6):
    return abs(a[1] - b[1]) <= tol


def _is_v(a, b, tol=1e-6):
    return abs(a[0] - b[0]) <= tol


def _seg_in_box_interior(a, b, bx, eps=0.6) -> bool:
    x0, y0, x1, y1 = bx
    x0, y0, x1, y1 = x0 + eps, y0 + eps, x1 - eps, y1 - eps
    if _is_h(a, b):
        return y0 < a[1] < y1 and min(a[0], b[0]) < x1 and max(a[0], b[0]) > x0
    if _is_v(a, b):
        return x0 < a[0] < x1 and min(a[1], b[1]) < y1 and max(a[1], b[1]) > y0
    return True  # diagonal segments are forbidden anyway


def _on_border(p, bx, tol=0.6) -> bool:
    x0, y0, x1, y1 = bx
    inx = x0 - tol <= p[0] <= x1 + tol
    iny = y0 - tol <= p[1] <= y1 + tol
    return ((abs(p[0] - x0) <= tol or abs(p[0] - x1) <= tol) and iny) or \
           ((abs(p[1] - y0) <= tol or abs(p[1] - y1) <= tol) and inx)


def _dist_to_box(p, bx) -> float:
    x0, y0, x1, y1 = bx
    dx = max(x0 - p[0], 0, p[0] - x1)
    dy = max(y0 - p[1], 0, p[1] - y1)
    return (dx * dx + dy * dy) ** 0.5


def _pair_issue(s, t, tol=0.5, near=4.5):
    """Return 'cross' | 'overlap' | 'tight' | None for two axis-aligned segments."""
    a1, a2 = s
    b1, b2 = t
    ah, av = _is_h(a1, a2), _is_v(a1, a2)
    bh, bv = _is_h(b1, b2), _is_v(b1, b2)
    if ah and bh:
        d = abs(a1[1] - b1[1])
        ov = min(max(a1[0], a2[0]), max(b1[0], b2[0])) - max(min(a1[0], a2[0]), min(b1[0], b2[0]))
        if d <= tol and ov > tol:
            return "overlap"
        if d < near and ov > tol:
            return "tight"
    elif av and bv:
        d = abs(a1[0] - b1[0])
        ov = min(max(a1[1], a2[1]), max(b1[1], b2[1])) - max(min(a1[1], a2[1]), min(b1[1], b2[1]))
        if d <= tol and ov > tol:
            return "overlap"
        if d < near and ov > tol:
            return "tight"
    elif ah and bv:
        if min(a1[0], a2[0]) - tol <= b1[0] <= max(a1[0], a2[0]) + tol and \
           min(b1[1], b2[1]) - tol <= a1[1] <= max(b1[1], b2[1]) + tol:
            return "cross"
    elif av and bh:
        return _pair_issue(t, s, tol, near)
    return None


def _route_segments(pts):
    return [(pts[i], pts[i + 1]) for i in range(len(pts) - 1)]


def _check_route_set(edges: list[dict]) -> list[str]:
    want = {f"{e['from']}|{e['to']}|{e['type']}" for e in edges}
    missing = [f"missing route: {k}" for k in want - set(ROUTES)]
    stray = [f"stray route: {k}" for k in set(ROUTES) - want]
    return missing + stray


def _route_box_issues(key, segs, boxes, chips) -> list[str]:
    """Diagonals, lines through node boxes, lines through zone tabs."""
    out = [f"diagonal: {key}" for a, b in segs if not (_is_h(a, b) or _is_v(a, b))]
    for m, bx in boxes.items():
        out += [f"line over box {m}: {key} seg[{i}]"
                for i, (a, b) in enumerate(segs) if _seg_in_box_interior(a, b, bx)]
    for z, bx in chips.items():
        out += [f"line over zone tab {z}: {key} seg[{i}]"
                for i, (a, b) in enumerate(segs) if _seg_in_box_interior(a, b, bx, eps=-1.0)]
    return out


def _route_port_issues(key, pts, segs, boxes) -> tuple[list[str], list[str]]:
    """Start on source edge, tip distance at target, minimum shaft before the arrowhead."""
    src, dst, _t = key.split("|")
    problems: list[str] = []
    warnings: list[str] = []
    if not _on_border(pts[0], boxes[src]):
        problems.append(f"start not on {src} edge: {key} {pts[0]}")
    d = _dist_to_box(pts[-1], boxes[dst])
    if not (TIP - 0.6 <= d <= TIP + 0.6):
        problems.append(f"tip not {TIP} from {dst}: {key} d={d:.2f}")
    la, lb = segs[-1]
    if abs(la[0] - lb[0]) + abs(la[1] - lb[1]) < 12:
        warnings.append(f"short final leg: {key}")
    return problems, warnings


def _runs_along_zone_border(a, b, zone) -> bool:
    x0, y0, x1, y1 = zone
    if _is_v(a, b) and (abs(a[0] - x0) < 1.2 or abs(a[0] - x1) < 1.2):
        return min(a[1], b[1]) < y1 and max(a[1], b[1]) > y0
    if _is_h(a, b) and (abs(a[1] - y0) < 1.2 or abs(a[1] - y1) < 1.2):
        return min(a[0], b[0]) < x1 and max(a[0], b[0]) > x0
    return False


def _route_zone_border_issues(key, segs) -> list[str]:
    return [f"along zone border {z}: {key}"
            for z, zone in ZONES.items() for a, b in segs if _runs_along_zone_border(a, b, zone)]


def _check_routes(boxes, chips) -> tuple[list[str], list[str]]:
    problems: list[str] = []
    warnings: list[str] = []
    for key, pts in ROUTES.items():
        segs = _route_segments(pts)
        problems += _route_box_issues(key, segs, boxes, chips)
        p, w = _route_port_issues(key, pts, segs, boxes)
        problems += p
        warnings += w
        problems += _route_zone_border_issues(key, segs)
    return problems, warnings


def _first_pair_issue(segs_a, segs_b):
    for s in segs_a:
        for t in segs_b:
            issue = _pair_issue(s, t)
            if issue:
                return issue
    return None


def _check_route_pairs() -> list[str]:
    keys = list(ROUTES)
    segs = {k: _route_segments(ROUTES[k]) for k in keys}
    out: list[str] = []
    for i, ki in enumerate(keys):
        for kj in keys[i + 1:]:
            issue = _first_pair_issue(segs[ki], segs[kj])
            if issue:
                out.append(f"{issue}: {ki} × {kj}")
    return out


def _rects_apart(a, b, gap: float) -> bool:
    return a[2] + gap <= b[0] or b[2] + gap <= a[0] or a[3] + gap <= b[1] or b[3] + gap <= a[1]


def _check_node_zone(m, bx) -> list[str]:
    """Node inside its own zone with margin ≥ 6, and not intruding any other zone."""
    out: list[str] = []
    z = REGION_FALLBACK.get(m)
    if z in ZONES:
        x0, y0, x1, y1 = ZONES[z]
        if not (bx[0] >= x0 + 6 and bx[2] <= x1 - 6 and bx[1] >= y0 + 6 and bx[3] <= y1 - 6):
            out.append(f"node {m} not inside zone {z} with margin")
    out += [f"node {m} intrudes zone {zid}"
            for zid, zone in ZONES.items() if z != zid and not _rects_apart(bx, zone, 0)]
    return out


def _check_layout_gaps(boxes) -> list[str]:
    out: list[str] = []
    for m, bx in boxes.items():
        out += _check_node_zone(m, bx)
    names = list(ZONES)
    for i, ni in enumerate(names):
        out += [f"zones too close: {ni} {nj}"
                for nj in names[i + 1:] if not _rects_apart(ZONES[ni], ZONES[nj], 8)]
    ids = list(boxes)
    for m in ids:
        out += [f"nodes touch: {m} {n}"
                for n in ids if m < n and not _rects_apart(boxes[m], boxes[n], 4)]
    return out


def check_geometry(edges: list[dict]) -> tuple[list[str], list[str]]:
    boxes = {m: box(m) for m in NODES}
    chips = {z: chip_box(z) for z in ZONES}
    problems = _check_route_set(edges)
    route_problems, warnings = _check_routes(boxes, chips)
    problems += route_problems
    problems += _check_route_pairs()
    problems += _check_layout_gaps(boxes)
    return problems, warnings


# ───────────────────────── SVG rendering ─────────────────────────
EDGE_FE, EDGE_BE, EDGE_X = "#00a86b", "#5dade2", "#e02020"
EDGE_SHELL = "#4a5560"   # graphite: shell-internal
INK, MUTED = "#1a1f26", "#4a5560"
SANS = "'Helvetica Neue', Helvetica, Arial, 'PingFang SC', sans-serif"
SERIF = "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Songti SC', 'Noto Serif SC', serif"


def esc(s: str) -> str:
    return _html.escape(str(s), quote=True)


def fmt(n: float) -> str:
    return ("%.2f" % n).rstrip("0").rstrip(".")


def edge_color(sa: str, sb: str) -> str:
    if sa == "SHELL" and sb == "SHELL":
        return EDGE_SHELL
    if sa == "FE" and sb == "FE":
        return EDGE_FE
    if sa == "BE" and sb == "BE":
        return EDGE_BE
    return EDGE_X


MARKER = {EDGE_FE: "arrow-fe", EDGE_BE: "arrow-be", EDGE_X: "arrow-x", EDGE_SHELL: "arrow-shell"}
DASH = {"calls": "", "depends": "5 3", "contract": "1.6 3"}


def arrow_marker(mid: str, fill: str) -> str:
    return (f'<marker id="{mid}" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="9" '
            f'markerHeight="9" markerUnits="userSpaceOnUse" orient="auto">'
            f'<path d="M0 1.2 L11 6 L0 10.8 z" fill="{fill}"/></marker>')


def _svg_zones() -> list[str]:
    out: list[str] = []
    for zid, (x0, y0, x1, y1) in ZONES.items():
        st = ZONE_STYLE[zid]
        out.append(f'<rect x="{x0}" y="{y0}" width="{x1 - x0}" height="{y1 - y0}" rx="5" '
                   f'fill="{st["fill"]}" stroke="{st["stroke"]}" stroke-width="1.3"/>')
    for zid in ZONES:
        st = ZONE_STYLE[zid]
        cx0, cy0, cx1, cy1 = chip_box(zid)
        out.append(f'<rect x="{fmt(cx0)}" y="{fmt(cy0)}" width="{CHIP_W}" height="{CHIP_H}" rx="8" '
                   f'fill="{st["stroke"]}"/>')
        out.append(f'<text x="{fmt((cx0 + cx1) / 2)}" y="{fmt(cy0 + 11.6)}" text-anchor="middle" '
                   f'font-family="{SERIF}" font-size="10.5" font-weight="700" fill="#ffffff" '
                   f'letter-spacing="0.08em">{esc(st["chip"])}</text>')

    return out


def _svg_hub(mid, cx, cy, w, h, role, zh="") -> str:
    x0, y0 = cx - w / 2, cy - h / 2
    is_api = mid == "FE-API"
    fill = "#e3e8ee" if is_api else "#f3e7bd"
    stroke = "#3a4552" if is_api else "#8c7326"
    return (f'<g><title>{esc(mid)} — {esc(role)}</title>'
            f'<rect x="{fmt(x0)}" y="{fmt(y0)}" width="{fmt(w)}" height="{fmt(h)}" rx="4" '
            f'fill="{fill}" stroke="{stroke}" stroke-width="1.6"/>'
            f'<text transform="translate({fmt(cx + 3.4)} {fmt(cy)}) rotate(-90)" '
            f'text-anchor="middle" font-size="10.5" font-weight="700" letter-spacing="0.06em" '
            f'fill="{INK}">{esc(mid)}{(" " + esc(zh)) if zh else ""}</text></g>')


def _svg_node(mid, cx, cy, w, h, role, zh="") -> str:
    x0, y0 = cx - w / 2, cy - h / 2
    st = ZONE_STYLE.get(REGION_FALLBACK.get(mid, ""), ZONE_STYLE["be"])
    return (f'<g><title>{esc(mid)} — {esc(role)}</title>'
            f'<rect x="{fmt(x0)}" y="{fmt(y0)}" width="{fmt(w)}" height="{fmt(h)}" rx="3" '
            f'fill="#ffffff" fill-opacity="0.94" stroke="{st["node"]}" stroke-width="1.1"/>'
            f'<text x="{fmt(cx)}" y="{fmt(cy - 3.2 if zh else cy + 3.3)}" text-anchor="middle" font-size="9.4" '
            f'fill="{INK}" letter-spacing="0.02em">{esc(mid)}</text>'
            + (f'<text x="{fmt(cx)}" y="{fmt(cy + 9.2)}" text-anchor="middle" font-size="9" '
               f'fill="{st["node"]}">{esc(zh)}</text>' if zh else '')
            + '</g>')


def _svg_nodes(mods: dict) -> list[str]:
    out: list[str] = []
    for mid, (cx, cy, w, h) in NODES.items():
        m = mods.get(mid)
        role = m.get("role", "") if m else ""
        zh = m.get("zh", "") if m else ""
        draw = _svg_hub if mid in HUBS else _svg_node
        out.append(draw(mid, cx, cy, w, h, role, zh))
    return out


def _svg_edges(data: dict, mods: dict) -> list[str]:
    # edges (after nodes: nothing crosses a box, so nothing is hidden)
    out: list[str] = []
    for e in data.get("edges", []):
        key = f"{e['from']}|{e['to']}|{e['type']}"
        pts = ROUTES.get(key)
        a, b = mods.get(e["from"]), mods.get(e["to"])
        if not pts or not a or not b:
            continue
        c = edge_color(a["side"], b["side"])
        d = " ".join(("M" if i == 0 else "L") + f"{fmt(x)} {fmt(y)}" for i, (x, y) in enumerate(pts))
        dash = DASH.get(e["type"], "")
        out.append(f'<path d="{d}" fill="none" stroke="{c}" stroke-width="1.45" stroke-linejoin="round" '
                   f'marker-end="url(#{MARKER[c]})"' + (f' stroke-dasharray="{dash}"' if dash else "")
                   + f'><title>{esc(e["from"])} → {esc(e["to"])} ({esc(e["type"])})</title></path>')
    return out


def _svg_legend() -> list[str]:
    out: list[str] = []
    ly = 518
    out.append(f'<line x1="8" y1="{ly - 10}" x2="{VB_W - 8}" y2="{ly - 10}" stroke="#c5ccd4" stroke-width="0.8"/>')

    def head(x, t):
        return (f'<text x="{x}" y="{ly + 6}" font-family="{SERIF}" font-size="10.5" font-weight="700" '
                f'fill="{INK}" letter-spacing="0.1em">{t}</text>')

    def item_y(i):
        return ly + 26 + i * 17

    out.append(head(16, "分区"))
    zone_items = [("fe-decision", "决策路径 · NAV → LIST"), ("fe-cube", "立方体面 · OPENCUBE → AESTHETIC"),
                  ("fe-map", "平面映射 · MAPDRAW / MAPDOCK / MAPREG / MAPPROJ（第二重映射）"),
                  ("be", "后端 · BE-HTTP 起"), ("shell", "壳层 · SHELL-WINDOW / SHELL-PROC / SHELL-PACK（本地应用）")]
    for i, (zid, label) in enumerate(zone_items):
        st = ZONE_STYLE[zid]
        y = item_y(i)
        out.append(f'<rect x="16" y="{y - 9}" width="20" height="11" rx="2.5" fill="{st["fill"]}" '
                   f'stroke="{st["stroke"]}" stroke-width="1.2"/>'
                   f'<text x="44" y="{y}" font-size="9.4" fill="{MUTED}">{esc(label)}</text>')
    y = item_y(5)
    out.append(f'<rect x="16" y="{y - 9}" width="20" height="11" rx="2.5" fill="#e3e8ee" stroke="#3a4552" '
               f'stroke-width="1.5"/><text x="44" y="{y}" font-size="9.4" fill="{MUTED}">枢纽条 · FE-API / BE-HTTP（框外 / 框缘）</text>')

    out.append(head(330, "边色"))
    for i, (c, label) in enumerate(((EDGE_FE, "翠绿 · 前端内部"), (EDGE_BE, "天青 · 后端内部"),
                                    (EDGE_X, "亮红 · 跨侧"),
                                    (EDGE_SHELL, "石墨 · 壳层内部"))):
        y = item_y(i)
        out.append(f'<path d="M330 {y - 3.5} L364 {y - 3.5}" stroke="{c}" stroke-width="2" fill="none"/>'
                   f'<text x="372" y="{y}" font-size="9.4" fill="{MUTED}">{label}</text>')

    out.append(head(530, "线型"))
    for i, (t, label) in enumerate((("calls", "calls · 实线"), ("depends", "depends · 虚线"),
                                    ("contract", "contract · 点线"))):
        y = item_y(i)
        dash = DASH[t]
        out.append(f'<path d="M530 {y - 3.5} L564 {y - 3.5}" stroke="{INK}" stroke-width="1.6" fill="none"'
                   + (f' stroke-dasharray="{dash}"' if dash else "") + '/>'
                   f'<text x="572" y="{y}" font-size="9.4" fill="{MUTED}">{label}</text>')
    return out


def render_svg(data: dict) -> str:
    mods = {m["id"]: m for m in data.get("modules", [])}
    out: list[str] = []
    out.append(f'<svg id="graph-svg" viewBox="0 0 {VB_W} {VB_H}" xmlns="http://www.w3.org/2000/svg" '
               f'role="img" aria-label="SFC module relation graph" font-family="{SANS}">')
    out.append("<defs>" + arrow_marker("arrow-fe", EDGE_FE) + arrow_marker("arrow-be", EDGE_BE)
               + arrow_marker("arrow-x", EDGE_X) + arrow_marker("arrow-shell", EDGE_SHELL) + "</defs>")
    out += _svg_zones()
    out += _svg_nodes(mods)
    out += _svg_edges(data, mods)
    out += _svg_legend()
    out.append("</svg>")
    return "".join(out)


# ───────────────────────── page template ─────────────────────────
TEMPLATE = r"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>SFC 静态模块关系图</title>
<style>
:root {
  --paper: #f7f5f0;
  --ink: #1a1f26;
  --muted: #4a5560;
  --rule: #c5ccd4;
  --fill: #ece8e0;
  --fe: #2a4a6a;
  --be: #4a3a28;
  --other: #3a4a3a;
}
@page { size: A4; margin: 10mm; }
* { box-sizing: border-box; }
body {
  margin: 0 auto;
  padding: 10mm 10mm 16mm;
  max-width: 210mm;
  color: var(--ink);
  background: var(--paper);
  font-family: "Iowan Old Style", "Palatino Linotype", Palatino, "Songti SC", "Noto Serif SC", serif;
  font-size: 11pt;
  line-height: 1.45;
}
header.head { display: flex; align-items: baseline; justify-content: space-between; gap: 1em;
  border-bottom: 1.5px solid var(--ink); padding-bottom: 0.35em; margin-bottom: 0.5em; }
h1 { font-size: 17pt; font-weight: 600; letter-spacing: 0.04em; margin: 0; }
.brand { letter-spacing: 0.14em; font-size: 10.5pt; margin: 0; color: var(--muted); }
h2 { font-size: 12.5pt; border-bottom: 1px solid var(--rule); padding-bottom: 0.15em; margin-top: 1.35em; }
p { margin: 0.45em 0; }
.cover-meta, .lede, .status { color: var(--muted); font-size: 9.6pt; }
.lede { margin: 0.2em 0 0.6em; }
.no-print { font-size: 10pt; color: var(--muted); border-bottom: 1px solid var(--rule); padding-bottom: 0.6em; margin-bottom: 0.8em; }
table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin: 0.6em 0 1em; }
th, td { border: 1px solid var(--rule); padding: 0.28em 0.45em; text-align: left; vertical-align: top; }
th { background: var(--fill); font-weight: 600; }
code { font-family: "SF Mono", ui-monospace, Menlo, Consolas, monospace; font-size: 0.86em; }
.badge { display: inline-block; border: 1px solid var(--rule); background: var(--fill); padding: 0.05em 0.4em; font-size: 9pt; }
.callout { background: var(--fill); border: 1px solid var(--rule); padding: 0.45em 0.65em; margin: 0.7em 0; font-size: 10pt; }
.fig { margin: 0.4em 0 0.6em; border: 1px solid var(--rule); background: #fcfbf8; padding: 0.4em 0.4em 0.2em; }
.fig svg { display: block; width: 100%; height: auto; }
.fig-cap { font-size: 9pt; color: var(--muted); margin: 0.5em 0 0; }
.tables { break-before: page; }
.side-FE { color: var(--fe); }
.side-BE { color: var(--be); }
.side-SHELL { color: #5b574c; }
.side-other { color: var(--other); }
@media print {
  body { background: white; padding: 0; max-width: none; }
  .no-print { display: none; }
  .fig { background: white; }
}
</style>
</head>
<body>
<p class="no-print">静态页 · 可 <code>file://</code> 直接打开 · 真源 <code>modules/graph.json</code> · 版式与布线在 <code>modules/bake_static.py</code> · 改后运行 <code>python3 modules/bake_static.py</code> 重烘焙</p>
<header class="head">
  <h1>SFC 模块关系图</h1>
  <p class="brand">MODULE MAP · __N_MODS__ 模块 · __N_EDGES__ 边</p>
</header>
<p class="lede">左后端、右前端；中间一根 <strong>FE-API</strong> 枢纽条立在所有框外，是前后端唯一契约口。右侧上淡绿＝决策路径（NAV → LIST），下淡蓝＝立方体面（OPENCUBE → AESTHETIC）；后端淡黄，<code>BE-HTTP</code> 为总线，分派至各子模块；立方体面右侧淡紫＝平面映射（<code>FE-MAPDOCK</code> 映射台 → <code>FE-MAPREG</code> → <code>FE-MAPPROJ</code>，另调 <code>FE-MAPDRAW</code>；第二重映射）。</p>

<div class="fig" id="fig">
__SVG__
</div>
<p class="fig-cap">布线：每条边由节点边缘的固定端口直连或经一条通道折一次、折两次；零交叉、零叠段、线不穿框，箭头止于目标框缘外。</p>

<div class="tables">
<div class="callout" id="status"></div>

<h2>模块清单</h2>
<table id="mod-table">
  <thead><tr><th>id</th><th>中文</th><th>侧</th><th>区</th><th>职责</th></tr></thead>
  <tbody></tbody>
</table>

<h2>关系边</h2>
<table id="edge-table">
  <thead><tr><th>from</th><th>to</th><th>type</th></tr></thead>
  <tbody></tbody>
</table>
</div>

<script id="graph-data" type="application/json">
__GRAPH_JSON__
</script>
<script>
(function () {
  const status = document.getElementById("status");
  const modBody = document.querySelector("#mod-table tbody");
  const edgeBody = document.querySelector("#edge-table tbody");
  const data = JSON.parse(document.getElementById("graph-data").textContent);
  const REGION_FALLBACK = __REGION_FALLBACK_JSON__;
  const REGION_LABEL = { "fe-decision": "决策路径", "fe-cube": "立方体面", "fe-api": "API 枢纽（框外）", "fe-map": "平面映射", "be": "后端", "shell": "壳层" };
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function regionOf(m) {
    if (m.region && REGION_LABEL[m.region]) return m.region;
    return REGION_FALLBACK[m.id] || "";
  }
  const mods = data.modules || [];
  const edges = data.edges || [];
  modBody.innerHTML = mods.map(function (m) {
    const r = regionOf(m);
    return "<tr><td><code>" + esc(m.id) + "</code></td><td>" + esc(m.zh || "") + "</td><td class=\"side-" + esc(m.side) + "\">" +
      esc(m.side) + "</td><td>" + esc(REGION_LABEL[r] || r || "—") +
      "</td><td>" + esc(m.role || "") + "</td></tr>";
  }).join("");
  edgeBody.innerHTML = edges.map(function (e) {
    return "<tr><td><code>" + esc(e.from) + "</code></td><td><code>" + esc(e.to) +
      "</code></td><td>" + esc(e.type) + "</td></tr>";
  }).join("");
  status.innerHTML = "静态烘焙 · version <code>" + esc(data.version) + "</code> · updated <code>" +
    esc(data.updated || "—") + "</code> · " + mods.length + " 模块 · " + edges.length + " 边";
})();
</script>
</body>
</html>
"""


def main() -> None:
    data = json.loads(GRAPH_PATH.read_text(encoding="utf-8"))
    problems, warnings = check_geometry(data.get("edges") or [])
    ids = {m["id"] for m in data.get("modules", [])}
    for i in ids - set(NODES):
        problems.append(f"module without layout: {i}")
    for i in set(NODES) - ids:
        problems.append(f"layout without module: {i}")
    if warnings:
        print(f"geometry warnings ({len(warnings)}):")
        for w in warnings:
            print(f"  ~ {w}")
    if problems:
        print("geometry check FAILED:", file=sys.stderr)
        for p in problems[:60]:
            print(f"  - {p}", file=sys.stderr)
        if len(problems) > 60:
            print(f"  … +{len(problems) - 60} more", file=sys.stderr)
        sys.exit(1)
    print(f"geometry check OK ({len(ROUTES)} routes; 0 cross, 0 overlap, 0 tight, "
          f"0 line-over-box, 0 along-border; ports+tips verified; warnings={len(warnings)})")

    html = (
        TEMPLATE.replace("__SVG__", render_svg(data))
        .replace("__GRAPH_JSON__", json.dumps(data, ensure_ascii=False, indent=2))
        .replace("__REGION_FALLBACK_JSON__", json.dumps(REGION_FALLBACK, ensure_ascii=False))
        .replace("__N_MODS__", str(len(data.get("modules", []))))
        .replace("__N_EDGES__", str(len(data.get("edges", []))))
    )
    OUT_PATH.write_text(html, encoding="utf-8")
    print(f"baked {OUT_PATH.name}: {len(data.get('modules', []))} modules, {len(data.get('edges', []))} edges")


if __name__ == "__main__":
    main()
