# 内阁旁注 · 模块图分轨无交叉与边色改写

**日期** 2026-10-14  
**业主令** 关系线不得交叉重合；暗青→天青；墨绿→翠绿  
**不发问** · 未令总参 · 未改 ind-chain · 未改边集合（`graph.json` edges 未动，仅 note 色名）

## 落盘

| 项 | 路径 |
|----|------|
| 真源 | `modules/graph.json` |
| 烘焙器（分轨布线 · 边色） | `modules/bake_static.py` |
| 静态投影 | `modules/index.html` |
| 重烘焙 | `python3 modules/bake_static.py` |

## 布线策略（一句）

左后端／右前端竖排不变；每边显式正交折线，BE 左侧嵌套逃逸通道、中缝只留短红 stub、跨侧 API→HTTP 走底裙，边槽分轨使线段既不交叉也不重合。

## 边色（写死）

| 两端 | 色名 | 值 |
|------|------|-----|
| FE↔FE | 翠绿 | `#00a86b` |
| BE↔BE | 天青 | `#5dade2` |
| 跨侧（含 other） | 亮红 | `#e02020` |

线型仍：calls 实 · depends 虚 · contract 点。

## 校验

烘焙后对 33 条 `ROUTES` 做轴对齐线段相交／共线叠段检查：**problems = 0**。
