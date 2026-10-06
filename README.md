# Financial Information To Decision Visualization (FIDV)

To standardly visualize statistics to fit human perception, so managers can make decisions more easily.

## Modules

| Path | Description |
|------|-------------|
| [`agent_tasklist/DESIGN.md`](./agent_tasklist/DESIGN.md) | 第一版设计理念。设计前先读 |
| [`agent_tasklist/AESTHETIC.md`](./agent_tasklist/AESTHETIC.md) | 美工部美学真源（色板、chrome、splash、图标） |
| [`agent_tasklist/INFORMATION.md`](./agent_tasklist/INFORMATION.md) | 信息部数据真源（词条、乱缺、BQLX 公式） |
| [`agents/`](./agents/) | 子代理：总监、总参谋部、书记处（书记 / 秘书 / 运维）、美工部、信息部 |
| [`class-3-coords/`](./class-3-coords/) | 3类坐标 / 行业坐标（BICS Equity Hierarchy 2024） |
| [`ai-chain/`](./ai-chain/) | Decision view. Industry-chain cube. Firms are nodes on slices |
| [`library/`](./library/) | 书记处工作区。worklog 在根下归书记；[`bug-report/`](./library/bug-report/) 归运维；[`showable-report/`](./library/showable-report/) 归秘书 |
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
