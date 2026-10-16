#!/usr/bin/env python3
"""Static purity check for web/js/map/*.js (no node needed): the map modules stay isolated, the paper skin stays self-contained.

Usage: python3 Ind-Chain/scripts/check_map_purity.py
Checks: proj / draw / reg import none of scene/ui/api/state/coords/bondChart and use no DOM / network / clock / randomness;
dock.js (UI) may import api + reg + draw + export only; export.js is the PNG door (DOM/fetch OK); no color literals in proj.js / draw.js / reg.js; css/plot-paper.css uses no product
token / backdrop-filter / gradient and every selector starts with .pm-skin-paper; app.css has no .pm-* rule and no
company-focus--ladder; bondChart.js has no ladder / map code; selfcheck page uses a synthetic fixture and is excluded
from the package find while dock.js / reg.js / plot-paper.css are not.
Run web/selfcheck-map.html in a browser for the behavioural checks (determinism, requires, desc round trip, standalone skin).
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAP = ROOT / "web" / "js" / "map"
BANNED_IMPORT = re.compile(r"""(?:import|from)\s*[^;\n]*["'][^"']*(scene|ui|api|state|coords|bondChart)\.js""")
DOCK_BANNED_IMPORT = re.compile(r"""(?:import|from)\s*[^;\n]*["'][^"']*(scene|ui|state|coords|bondChart)\.js""")
PAPER_BANNED = re.compile(r"var\(--(bg|panel|text|muted|stroke|accent|danger|glass[\w-]*|us|intl)\)|backdrop-filter|gradient|text-shadow|box-shadow|#3cf0ff|#ffb020", re.I)
BANNED_USE = re.compile(r"\b(document|window|fetch|localStorage|XMLHttpRequest|Date\.now|new Date|Math\.random|performance\.now)\b")


def strip_comments(s: str) -> str:
    return re.sub(r"/\*.*?\*/|(?<!:)//[^\n]*", "", s, flags=re.S)


def main() -> int:
    bad: list[str] = []
    files = sorted(MAP.glob("*.js"))
    if not files:
        bad.append("no map/*.js found")
    for f in files:
        src = strip_comments(f.read_text(encoding="utf-8"))
        if f.name in ("dock.js", "export.js"):
            if DOCK_BANNED_IMPORT.search(src):
                bad.append(f"{f.name}: imports scene/ui/state/coords/bondChart (UI map modules: api/reg/draw/export only)")
        else:
            if BANNED_IMPORT.search(src):
                bad.append(f"{f.name}: imports a non-pure module")
            m = BANNED_USE.search(src)
            if m:
                bad.append(f"{f.name}: uses {m.group(0)}")
        if f.name not in ("dock.js", "export.js") and re.search(r"#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(", src):
            bad.append(f"{f.name}: color literal (tone must stay semantic; colors live in plot-paper.css)")
    for need in ("proj.js", "draw.js", "reg.js", "dock.js", "export.js"):
        if not (MAP / need).is_file():
            bad.append(f"map/{need} missing")
    css = ROOT / "web" / "css" / "plot-paper.css"
    if not css.is_file():
        bad.append("css/plot-paper.css missing")
    else:
        code = re.sub(r"/\*.*?\*/", "", css.read_text(encoding="utf-8"), flags=re.S)
        if PAPER_BANNED.search(code):
            bad.append("plot-paper.css: product token / backdrop-filter / gradient / glow / neon in the paper skin")
        sels = [x.strip() for p in re.findall(r"([^{}]+)\{", code) if not p.strip().startswith("@") for x in p.split(",")]
        off = [x for x in sels if not x.startswith(".pm-skin-paper")]
        if off:
            bad.append(f"plot-paper.css: selector not rooted at .pm-skin-paper: {off[0]}")
    app = (ROOT / "web" / "css" / "app.css").read_text(encoding="utf-8")
    if re.search(r"\.pm-|company-focus--ladder", app):
        bad.append("app.css: still carries .pm-* or company-focus--ladder (paper skin owns the figure)")
    bond = strip_comments((ROOT / "web" / "js" / "bondChart.js").read_text(encoding="utf-8"))
    if re.search(r"ladder|map/|fetchDebtLadder|drawPlot", bond, re.I):
        bad.append("bondChart.js: carries ladder / map code (moved to map/dock.js)")
    page = ROOT / "web" / "selfcheck-map.html"
    if not page.is_file() or "synthetic" not in page.read_text(encoding="utf-8").lower():
        bad.append("selfcheck-map.html missing or not marked synthetic")
    pkg = (ROOT / "scripts" / "package-standard-financial-charting.sh").read_text(encoding="utf-8")
    if "! -name selfcheck-map.html" not in pkg:
        bad.append("package script does not exclude selfcheck-map.html")
    for b in bad:
        print("FAIL", b)
    print("map purity:", "FAIL" if bad else "ok", f"({len(files)} files)")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
