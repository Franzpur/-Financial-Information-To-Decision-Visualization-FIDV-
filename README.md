# Financial Information To Decision Visualization (FIDV)

To standardly visualize statistics to fit human perception, so managers can make decisions more easily.

The decision view is one cube. Firms are nodes on industry slices. Debt cash flow for a node is a sheet in that same coordinate space, not a second application.

## Modules

| Path | Description |
|------|-------------|
| [`DESIGN.md`](./DESIGN.md) | **第一版设计理念** — 专业化、标准化、可操作化。设计前必读 |
| [`ai-chain/`](./ai-chain/) | Decision view. Industry-chain cube and the debt sheet on a firm node |
| [`googl-bond-cf/`](./googl-bond-cf/) | Debt **data**: expand the GOOGL bond book into the series the cube reads |
| [`WORKLOG.md`](./WORKLOG.md) | Session continuity log (asks / responses / conventions) |
| [`ai-chain/CONCEPTS.md`](./ai-chain/CONCEPTS.md) | **Concept target library** (ZH/EN) — one name for slice, axes, pull, debt sheet |

### Run

```bash
./Open-AI-Cube.command
```

Open http://127.0.0.1:8787/. Click a slice, then a GOOGL node, for the debt sheet.

Rebuild the debt series when the bond book changes:

```bash
cd googl-bond-cf && python3 scripts/build_cashflows.py
```

`./Open-Bond-CF.command` only checks that series as a flat chart on port 8791. It is not the decision view.
