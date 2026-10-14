# 内阁旁注 · 模块图左后右前与三色边

**日期** 2026-10-14  
**业主令** 前端在右、后端在左（勿再上下堆致过宽）；FE内墨绿、BE内暗青、跨侧亮红  
**不发问** · 未令总参 · 未改 ind-chain

## 落盘

| 项 | 路径 |
|----|------|
| 真源 | `modules/graph.json` |
| 烘焙器（布局 · 边色） | `modules/bake_static.py` |
| 静态投影 | `modules/index.html` |
| 重烘焙 | `python3 modules/bake_static.py` |

## 布局（一句）

竖向画布、纸面宽度内：左栏后端（HTTP／闸门契约／BUNDLE 分岔／ingest·track），右栏前端（NAV→GATE→LIST→CUBE · 立方体簇 · 横切）。

## 边色（写死）

| 两端 | 色 | 值 |
|------|----|-----|
| FE↔FE | 墨绿 | `#1f4d3a` |
| BE↔BE | 暗青 | `#1a4a4f` |
| 跨侧（FE↔BE · 含 other） | 亮红 | `#e02020` |

线型仍：calls 实 · depends 虚 · contract 点。
