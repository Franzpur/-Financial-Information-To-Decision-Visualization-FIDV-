# Financial Information To Decision Visualization (FIDV)

To standardly visualize statistics to fit human perception, so managers can make decisions more easily.

## Modules

| Path | Description |
|------|-------------|
| [`agent_tasklist/DESIGN.md`](./agent_tasklist/DESIGN.md) | 第一版设计理念。设计前先读 |
| [`ai-chain/`](./ai-chain/) | Decision view. Industry-chain cube. Firms are nodes on slices |
| [`library/`](./library/) | 书记工作区。工作日志为 `worklog-001` 起的分册 |
| [`ai-chain/CONCEPTS.md`](./ai-chain/CONCEPTS.md) | Concept library (ZH/EN): one name for slice, axes, pull |

### Run the AI chain cube

```bash
./Open-AI-Cube.command
# or
cd ai-chain && ./Open-AI-Chain.command
# or
cd ai-chain && python3 scripts/seed.py && python3 server/app.py
```

Then open http://127.0.0.1:8787/.
