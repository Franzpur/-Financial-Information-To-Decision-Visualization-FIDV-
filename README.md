# Financial Information To Decision Visualization (FIDV)

To standardly visualize statistics to fit human perception, so managers can make decisions more easily.

上传范围见 [`PUBLIC-PRIVATE.md`](./PUBLIC-PRIVATE.md)（公私隔离协议）：工程进仓；agent 与调度任务留在各人本机。

## Modules

| Path | Description |
|------|-------------|
| [`agent_tasklist/DESIGN.md`](./agent_tasklist/DESIGN.md) | 第一版设计理念。设计前先读 |
| [`agent_tasklist/AESTHETIC.md`](./agent_tasklist/AESTHETIC.md) | 美学真源（色板、chrome、splash、图标） |
| [`agent_tasklist/INFORMATION.md`](./agent_tasklist/INFORMATION.md) | 数据真源（词条、乱缺、BQLX 公式） |
| `agents/` | 本机工作工具，不随仓。见 `PUBLIC-PRIVATE.md` |
| [`class-3-coords/`](./class-3-coords/) | 3类坐标 / 行业坐标（BICS Equity Hierarchy 2024） |
| [`ai-chain/`](./ai-chain/) | Decision view. Industry-chain cube. Firms are nodes on slices |
| [`library/`](./library/) | 工作日志、可打印读本与运维记录 |
| [`ai-chain/CONCEPTS.md`](./ai-chain/CONCEPTS.md) | Concept library (ZH/EN): one name for slice, axes, pull |

### Run the AI chain cube

```bash
./Open-AI-Cube.command
# or
cd ai-chain && ./Open-AI-Chain.command
# or
cd ai-chain && python3 scripts/seed.py && python3 server/app.py
```

Then open http://127.0.0.1:8787/ (homepage). Cube: http://127.0.0.1:8787/cube
