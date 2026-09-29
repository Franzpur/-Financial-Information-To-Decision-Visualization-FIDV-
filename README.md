# Financial Information To Decision Visualization (FIDV)

To standardly visualize statistics to fit human perception, so managers can make decisions more easily.

## Modules

| Path | Description |
|------|-------------|
| [`ai-chain/`](./ai-chain/) | AI industry-chain **3D slice cube** — SQLite API + modular web UI (power → models) |
| [`googl-bond-cf/`](./googl-bond-cf/) | **Test:** GOOGL bond liability cash-flow expansion chart (time × USD) — branch `cursor/googl-bond-cashflow` |
| [`WORKLOG.md`](./WORKLOG.md) | Session continuity log (asks / responses / conventions) |
| [`ai-chain/CONCEPTS.md`](./ai-chain/CONCEPTS.md) | **Concept target library** (ZH/EN) — agent-facing glossary for slice / axes / pull / standard view |

### Run the AI chain cube

```bash
./Open-AI-Cube.command
# or
cd ai-chain && ./Open-AI-Chain.command
# or
cd ai-chain && python3 scripts/seed.py && python3 server/app.py
```

Then open http://127.0.0.1:8787/

### Run the bond cash-flow chart

This page is not on `main`. It lives on `cursor/bond-cf-visual-polish-ad7c` (and the earlier test branch `cursor/googl-bond-cashflow`). Double-clicking `index.html` does nothing useful: the chart loads data from a local API.

On your own machine, from the repo root:

```bash
git fetch origin
git checkout cursor/bond-cf-visual-polish-ad7c
./Open-Bond-CF.command
```

Or, without the launcher:

```bash
cd googl-bond-cf
python3 scripts/build_cashflows.py && python3 server/app.py
```

Then open http://127.0.0.1:8791/

`Open-Bond-CF.command` can be double-clicked on macOS. It rebuilds the cash-flow series, starts the server, and tries to open that URL. Stop it with Ctrl+C in the terminal that launched it. The server is local only; it is not a public website.
