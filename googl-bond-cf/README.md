# GOOGL bond book → debt series

This folder is the debt **data** pipeline for the cube. It is not a second decision view.

Expand Alphabet / GOOGL bonds from `googl_bond_full.xlsx` into coupon and principal by year and quarter. The cube reads `data/cashflow_series.json` and draws that series on the GOOGL node.

## Data

| File | Role |
|------|------|
| `data/googl_bond_full.xlsx` | Source SRCH export |
| `data/bonds.json` | Normalized bond book |
| `data/cashflow_series.json` | Expanded coupon + principal schedule |

Build:

```bash
python3 scripts/build_cashflows.py
```

Each security expands to:
- periodic **coupon** payments (from first coupon → maturity, by frequency)
- **principal** at maturity  
Non-USD notionals → USD via a static FX snapshot (viz only).

## Check the series

The cube is the view. This flat chart only checks the same numbers:

```bash
./Open-Bond-CF.command
```

http://127.0.0.1:8791/
