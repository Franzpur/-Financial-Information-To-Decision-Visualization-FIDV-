#!/usr/bin/env python3
"""Dev-only gold check: baked debt-ladder JSON vs the cabinet trial figure's #plotspec (per quarter, tol 0.001 bn).

Usage (repo root):
    python3 Ind-Chain/scripts/check_debt_ladder_gold.py [--gold PATH.html] [--json PATH.json]

Prints pass/fail counts only; no per-bond data exists on either side and nothing is written to disk.
Not part of the product: reads the cabinet figure as a reference, product code never does.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
GOLD = REPO / "cabinet" / "reports" / "SFC-googl-quarterly-debt-pressure.html"
BAKED = REPO / "Ind-Chain" / "data" / "debt-ladder-googl.json"
TOL = 0.001
KPI = {"par": "127.5", "n": 78, "cum": "35.2", "share": "28", "peak": "6.2", "int4": "5.6"}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--gold", type=Path, default=GOLD)
    ap.add_argument("--json", type=Path, default=BAKED)
    a = ap.parse_args()
    if not a.gold.is_file() or not a.json.is_file():
        print("missing input (gold html or baked json)")
        return 2
    spec = json.loads(re.search(r'id="plotspec">(.*?)</script>', a.gold.read_text(encoding="utf-8"), re.S).group(1))
    doc = json.loads(a.json.read_text(encoding="utf-8"))
    marks = spec["marks"]
    qs = doc["quarters"]
    bad = 0
    if len(marks) != 2 * len(qs):
        print("quarter count differs: gold %d vs baked %d" % (len(marks) // 2, len(qs)))
        return 1
    for j, q in enumerate(qs):
        mp, mi = marks[2 * j], marks[2 * j + 1]
        if mp["x"] != q["q"] or mi["x"] != q["q"]:
            bad += 1
            print("label mismatch", q["q"])
            continue
        # gold stores y0/y per mark: principal = [0, P], coupon = [P, P+I]
        dp = abs(q["principalBn"] - mp["y"])
        dt_ = abs(q["principalBn"] + q["interestBn"] - mi["y"])
        di = abs(q["interestBn"] - (mi["y"] - mi["y0"]))
        # gold rounds three times; interest is checked against its own rounding stack (<= 0.0015)
        if dp > TOL or dt_ > TOL or di > 0.0015 or q["n"] != mp["nRef"]:
            bad += 1
            print("mismatch", q["q"], round(dp, 4), round(dt_, 4), round(di, 4), q["n"], mp["nRef"])
    P = [q["principalBn"] for q in qs]
    I = [q["interestBn"] for q in qs]
    T = [p + i for p, i in zip(P, I)]
    k = {
        "par": "%.1f" % doc["basis"]["parBn"],
        "n": doc["basis"]["n"],
        "cum": "%.1f" % sum(P[: [q["q"] for q in qs].index("2031Q4") + 1]),
        "share": "%.0f" % (sum(P[: [q["q"] for q in qs].index("2031Q4") + 1]) / doc["basis"]["parBn"] * 100),
        "peak": "%.1f" % max(T),
        "int4": "%.1f" % sum(I[:4]),
    }
    kbad = {n: (k[n], KPI[n]) for n in KPI if k[n] != KPI[n]}
    print("quarters %d checked, %d mismatched (tol %.3f)" % (len(qs), bad, TOL))
    print("kpi", "ok" if not kbad else "MISMATCH %r" % kbad, k)
    return 1 if bad or kbad else 0


if __name__ == "__main__":
    sys.exit(main())
