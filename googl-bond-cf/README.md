# GOOGL Bond Liability Cash-Flow (test branch module)

Expand Alphabet / GOOGL bonds from `googl_bond_full.xlsx` (ICBC C / 928) into a **time × USD outflow** chart.

## Design

Matches the AI-chain cube look: dark panels (`#0b0d10` / `#14181e`), accent `#8be0c0`, coupon blue / principal amber stacks.

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

## Run

```bash
./Open-Bond-CF.command
# or
python3 scripts/build_cashflows.py && python3 server/app.py
```

Open http://127.0.0.1:8791/

## Branch

Intended for `cursor/googl-bond-cashflow` — parallel to `ai-chain/`, does not replace the cube.
