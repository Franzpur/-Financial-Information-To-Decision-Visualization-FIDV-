# 内阁旁注 · 模块关系图重画

**日期** 2026-10-14  
**业主令** 关系图画的太难看了，再画的有逻辑些  
**不发问** · 未令总参 · 未开 M5 · 未改 ind-chain

## 落盘

| 项 | 路径 |
|----|------|
| 真源 | `modules/graph.json` |
| 烘焙器（布局逻辑） | `modules/bake_static.py` |
| 静态投影 | `modules/index.html` |
| 重烘焙 | `python3 modules/bake_static.py` |

## 新图逻辑（一句）

按产品决策路径分层：上行 NAV→GATE→LIST→CUBE（LISTING-UI 旁挂）→ 立方体簇 → 横切 API/AESTHETIC → 后端 HTTP／BUNDLE 分岔／闸门契约对齐上行；正交折线，calls 实／depends 虚／contract 点。

## 边微调

原 `FE-NAV` 扇出至 GATE／LIST／CUBE，改为顺序路径：`FE-NAV→FE-GATE→FE-LIST→FE-CUBE-BOOT`（其余边保留）。
