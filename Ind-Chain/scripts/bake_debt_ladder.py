#!/usr/bin/env python3
"""Dev-time bake: Bloomberg bond export -> Ind-Chain/data/debt-ladder-googl.json (aggregated, no per-bond rows).

Usage (repo root):
    python3 Ind-Chain/scripts/bake_debt_ladder.py [--src PATH.xlsx] [--out PATH.json]

Needs openpyxl (bake-time only; never imported by the server or the embedded runtime).
The output is a Bloomberg-derived aggregate: gitignored (data/debt-ladder-*.json), internal use only.
Rules (PM-LADDER-Q): Corporates with Amt Out only; principal at the calendar quarter of maturity;
coupon cash = coupon x Amt Out / freq from First Coupon Date to maturity; start 2026Q4; no FX revaluation.
"""
from __future__ import annotations

import argparse
import calendar
import collections
import datetime as dt
import json
import sys
from pathlib import Path

try:
    import openpyxl
except ImportError:  # pragma: no cover
    sys.exit("openpyxl is required to bake the debt ladder: pip install openpyxl")

REPO = Path(__file__).resolve().parents[2]
DEFAULT_SRC = REPO / "BE-DATA" / "ICBC C" / "928" / "googl_bond_full.xlsx"
DEFAULT_OUT = REPO / "Ind-Chain" / "data" / "debt-ladder-googl.json"

ASOF = dt.date(2026, 9, 28)
START = dt.date(2026, 10, 1)
Q_FIRST, Q_LAST = (2026, 4), (2036, 4)
FREQ = {"S/A": 6, "Annual": 12, "Qtrly": 3}
# Hard-wired applicability (id 74 yes, id 85 DeepMind no): data owns it, the server/UI only read it.
APPLIES_TO = {
    "tickers": ["GOOGL"],
    "names": ["Alphabet / Google Cloud", "Alphabet", "Alphabet Inc", "Alphabet Inc-A"],
}


def pdate(s: str) -> dt.date:
    y, m, d = map(int, s.split("/"))
    return dt.date(y, m, d)


def addm(d: dt.date, n: int) -> dt.date:
    y = d.year + (d.month - 1 + n) // 12
    m = (d.month - 1 + n) % 12 + 1
    return dt.date(y, m, min(d.day, calendar.monthrange(y, m)[1]))


def qkey(d: dt.date) -> tuple[int, int]:
    return d.year, (d.month - 1) // 3 + 1


def qrange(a: tuple[int, int], b: tuple[int, int]) -> list[tuple[int, int]]:
    out, k = [], a
    while k <= b:
        out.append(k)
        k = (k[0] + k[1] // 4, k[1] % 4 + 1)
    return out


def aggregate(rows: list[dict]) -> dict:
    prin: dict = collections.defaultdict(float)
    intr: dict = collections.defaultdict(float)
    refs: dict = collections.defaultdict(set)  # quarter -> row indexes, only to count n
    excluded: collections.Counter = collections.Counter()
    par_in, n_in, floaters = 0.0, 0, 0
    for i, r in enumerate(rows):
        amt = r["Amt Out"]
        if r["Asset Class"] != "Corporates":
            excluded[r["Asset Class"]] += 1
            continue
        if not amt:
            excluded["no amount outstanding"] += 1
            continue
        n_in += 1
        par_in += amt
        mat = pdate(r["Maturity"])
        step = FREQ[r["Cpn Freq Des"]]
        floaters += r["Cpn Freq Des"] == "Qtrly"
        cpn = r["Coupon"] / 100.0 * amt * step / 12.0
        fc, k, hit = pdate(r["First Coupon Date"]), 0, False
        while True:
            d = addm(fc, k * step)
            k += 1
            if (d - mat).days > 10:
                break
            last = abs((d - mat).days) <= 10  # business-day shift tolerance
            if last:
                d, hit = mat, True
            if d >= START:
                intr[qkey(d)] += cpn
                refs[qkey(d)].add(i)
            if last:
                break
        assert hit, "coupon schedule never reached maturity"
        if mat >= START:
            prin[qkey(mat)] += amt
            refs[qkey(mat)].add(i)
    bn = lambda x: x / 1e9
    quarters = [
        {
            "q": "%dQ%d" % k,
            "principalBn": round(bn(prin.get(k, 0.0)), 4),
            "interestBn": round(bn(intr.get(k, 0.0)), 4),
            "n": len(refs.get(k, ())),
        }
        for k in qrange(Q_FIRST, Q_LAST)
    ]
    labels = {
        "Preferreds": "Preferreds (duplicate rows, mandatory-convertible)",
        "Loans": "Loans (no amount outstanding)",
        "no amount outstanding": "Corporates without amount outstanding",
    }
    ex = [{"reason": labels.get(k, str(k)), "count": n} for k, n in sorted(excluded.items(), key=lambda kv: str(kv[0]))]
    return {"quarters": quarters, "n": n_in, "parBn": round(bn(par_in), 3), "excluded": ex, "floaters": floaters}


def bake(src: Path) -> dict:
    wb = openpyxl.load_workbook(src, data_only=True)
    raw = list(wb["Securities"].iter_rows(values_only=True))
    rows = [dict(zip(raw[0], r)) for r in raw[1:]]
    a = aggregate(rows)
    return {
        "v": 1,
        "issuer": "GOOGL",
        "appliesTo": APPLIES_TO,
        "asOf": ASOF.isoformat(),
        "horizon": ["2026Q4", "2036Q4"],
        "unit": "USD bn-eq",
        "quarters": a["quarters"],
        "basis": {"n": a["n"], "parBn": a["parBn"], "excluded": a["excluded"]},
        "notes": [
            "principal = amount outstanding in the calendar quarter of maturity; no call or amortisation data",
            "amounts are USD-equivalent as delivered by the export (FX appears fixed at issue date)",
            "coupon cash = coupon x outstanding / freq; stub, day-count and business-day shifts ignored",
            "floating-rate notes (%d) extrapolated at current coupon" % a["floaters"],
        ],
        "provenance": {"sources": ["Bloomberg SRCH export (internal)"], "illustrative": False, "thirdParty": True},
    }


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--src", type=Path, default=DEFAULT_SRC)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = ap.parse_args()
    if not args.src.is_file():
        sys.exit("source workbook not found (pass --src)")
    doc = bake(args.src)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    q = doc["quarters"]
    print("baked %d quarters, n=%d, par=%.1f bn" % (len(q), doc["basis"]["n"], doc["basis"]["parBn"]))


if __name__ == "__main__":
    main()
