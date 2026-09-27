# Financial Information To Decision Visualization (FIDV)

To standardly visualize statistics to fit human perception, so managers can make decisions more easily.

## Modules

| Path | Description |
|------|-------------|
| [`ai-chain/`](./ai-chain/) | AI industry-chain **3D slice cube** — SQLite API + modular web UI (power → models) |
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
