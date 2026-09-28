#!/usr/bin/env python3
"""Expand GOOGL bond book into USD liability cash-flow schedule (coupon + principal)."""
from __future__ import annotations

import json
import math
from collections import defaultdict
from datetime import date, datetime
from pathlib import Path

try:
    import openpyxl
except ImportError as e:
    raise SystemExit("Need openpyxl: pip3 install --user openpyxl") from e

ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / "data" / "googl_bond_full.xlsx"
OUT_BONDS = ROOT / "data" / "bonds.json"
OUT_SERIES = ROOT / "data" / "cashflow_series.json"

# Approximate FX → USD (snapshot for visualization; not live market)
FX_TO_USD = {
    "USD": 1.0,
    "EUR": 1.08,
    "GBP": 1.27,
    "JPY": 0.0067,
    "AUD": 0.65,
    "CHF": 1.12,
    "CAD": 0.73,
}

FREQ_MAP = {
    "S/A": 2,
    "Semi-Annual": 2,
    "Annual": 1,
    "Qtrly": 4,
    "Quarterly": 4,
}


def parse_date(x) -> date | None:
    if x is None or (isinstance(x, float) and math.isnan(x)):
        return None
    if isinstance(x, datetime):
        return x.date()
    if isinstance(x, date):
        return x
    if isinstance(x, str):
        s = x.strip()
        if not s or s.startswith("#"):
            return None
        for fmt in ("%Y/%m/%d", "%Y-%m-%d", "%m/%d/%Y"):
            try:
                return datetime.strptime(s, fmt).date()
            except ValueError:
                continue
    return None


def add_months(d: date, months: int) -> date:
    y = d.year + (d.month - 1 + months) // 12
    m = (d.month - 1 + months) % 12 + 1
    # clamp day
    for day in (d.day, 30, 29, 28):
        try:
            return date(y, m, day)
        except ValueError:
            continue
    return date(y, m, 1)


def load_bonds() -> list[dict]:
    wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
    ws = wb["Securities"]
    rows = list(ws.iter_rows(values_only=True))
    header = [str(h).strip() if h is not None else "" for h in rows[0]]
    bonds = []
    for i, row in enumerate(rows[1:], start=1):
        if not row or row[1] is None:
            continue
        raw = dict(zip(header, row))
        ccy = str(raw.get("Currency") or "USD").strip().upper()
        amt = raw.get("Amt Out")
        if amt is None:
            amt = raw.get("Amt Issued")
        try:
            amt = float(amt)
        except (TypeError, ValueError):
            continue
        if amt <= 0:
            continue
        coupon = raw.get("Coupon")
        try:
            coupon = float(coupon)
        except (TypeError, ValueError):
            coupon = None
        freq_raw = str(raw.get("Cpn Freq Des") or "").strip()
        freq = FREQ_MAP.get(freq_raw)
        if freq is None and coupon is not None:
            freq = 2  # default semi-annual
        fx = FX_TO_USD.get(ccy, 1.0)
        issue = parse_date(raw.get("Issue Date"))
        mat = parse_date(raw.get("Maturity"))
        first = parse_date(raw.get("First Coupon Date")) or issue
        if not mat:
            continue
        bond = {
            "id": i,
            "issuer": raw.get("Issuer Name") or "Alphabet Inc",
            "ticker": raw.get("Ticker") or "GOOGL",
            "coupon": coupon,
            "issueDate": issue.isoformat() if issue else None,
            "maturity": mat.isoformat(),
            "currency": ccy,
            "amtOut": amt,
            "amtOutUsd": amt * fx,
            "fxToUsd": fx,
            "freq": freq,
            "freqLabel": freq_raw or "S/A",
            "firstCoupon": first.isoformat() if first else None,
            "assetClass": raw.get("Asset Class"),
        }
        bonds.append(bond)
    wb.close()
    return bonds


def expand_bond(b: dict, asof: date) -> list[dict]:
    """Coupon payments + principal at maturity, in USD."""
    events = []
    mat = parse_date(b["maturity"])
    first = parse_date(b["firstCoupon"]) or parse_date(b["issueDate"]) or asof
    amt_usd = b["amtOutUsd"]
    coupon = b["coupon"]
    freq = b["freq"]

    if coupon is not None and freq:
        period_months = 12 // freq
        pay = amt_usd * (coupon / 100.0) / freq
        d = first
        # walk forward if first coupon already past asof — still include future pays
        guard = 0
        while d < asof and guard < 500:
            d = add_months(d, period_months)
            guard += 1
        while d <= mat and guard < 2000:
            if d >= asof:
                events.append(
                    {
                        "date": d.isoformat(),
                        "year": d.year,
                        "quarter": f"{d.year}-Q{(d.month - 1) // 3 + 1}",
                        "kind": "coupon",
                        "amountUsd": pay,
                        "bondId": b["id"],
                    }
                )
            d = add_months(d, period_months)
            guard += 1

    # principal at maturity
    if mat >= asof:
        events.append(
            {
                "date": mat.isoformat(),
                "year": mat.year,
                "quarter": f"{mat.year}-Q{(mat.month - 1) // 3 + 1}",
                "kind": "principal",
                "amountUsd": amt_usd,
                "bondId": b["id"],
            }
        )
    return events


def aggregate(events: list[dict]) -> dict:
    by_year = defaultdict(lambda: {"coupon": 0.0, "principal": 0.0, "total": 0.0})
    by_quarter = defaultdict(lambda: {"coupon": 0.0, "principal": 0.0, "total": 0.0})
    for e in events:
        y = by_year[e["year"]]
        q = by_quarter[e["quarter"]]
        y[e["kind"]] += e["amountUsd"]
        y["total"] += e["amountUsd"]
        q[e["kind"]] += e["amountUsd"]
        q["total"] += e["amountUsd"]

    years = sorted(by_year)
    # Cap ultra-long tail into 2060+ bucket for chart readability (keep detail in JSON)
    chart_years = []
    tail = {"year": "2060+", "coupon": 0.0, "principal": 0.0, "total": 0.0, "years": []}
    for y in years:
        row = {
            "year": y,
            "coupon": round(by_year[y]["coupon"], 2),
            "principal": round(by_year[y]["principal"], 2),
            "total": round(by_year[y]["total"], 2),
        }
        if y >= 2060:
            tail["coupon"] += row["coupon"]
            tail["principal"] += row["principal"]
            tail["total"] += row["total"]
            tail["years"].append(y)
        else:
            chart_years.append(row)
    if tail["total"] > 0:
        tail["coupon"] = round(tail["coupon"], 2)
        tail["principal"] = round(tail["principal"], 2)
        tail["total"] = round(tail["total"], 2)
        chart_years.append(tail)

    quarters = [
        {
            "quarter": q,
            "coupon": round(by_quarter[q]["coupon"], 2),
            "principal": round(by_quarter[q]["principal"], 2),
            "total": round(by_quarter[q]["total"], 2),
        }
        for q in sorted(by_quarter)
    ]
    return {"byYear": chart_years, "byQuarter": quarters, "eventCount": len(events)}


def main():
    asof = date(2026, 9, 28)  # SRCH create date from Context sheet
    bonds = load_bonds()
    all_events = []
    for b in bonds:
        all_events.extend(expand_bond(b, asof))

    series = aggregate(all_events)
    meta = {
        "title": "GOOGL bond liability cash-flow expansion",
        "source": "ICBC C / 928 / googl_bond_full.xlsx",
        "asOf": asof.isoformat(),
        "bondCount": len(bonds),
        "fxNote": "Non-USD notionals converted with static FX snapshot for viz only",
        "fxToUsd": FX_TO_USD,
        "totalCouponUsd": round(sum(e["amountUsd"] for e in all_events if e["kind"] == "coupon"), 2),
        "totalPrincipalUsd": round(sum(e["amountUsd"] for e in all_events if e["kind"] == "principal"), 2),
        "totalOutflowUsd": round(sum(e["amountUsd"] for e in all_events), 2),
    }

    OUT_BONDS.write_text(json.dumps({"meta": meta, "bonds": bonds}, indent=2), encoding="utf-8")
    OUT_SERIES.write_text(
        json.dumps({"meta": meta, "series": series}, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {OUT_BONDS} ({len(bonds)} bonds)")
    print(f"Wrote {OUT_SERIES} ({series['eventCount']} events, {len(series['byYear'])} year buckets)")
    print(f"Total outflow USD ~ {meta['totalOutflowUsd']:,.0f}")


if __name__ == "__main__":
    main()
