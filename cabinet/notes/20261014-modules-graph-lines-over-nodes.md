# 内阁旁注 · 模块框不遮关系线与箭头

**日期** 2026-10-14  
**业主令** 模块框不得遮住线和箭头；须能辨哪根线指向哪、是否另指别模块  
**不发问** · 未令总参 · 未改 ind-chain · `graph.json` 边集合未动

## 落盘

| 项 | 路径 |
|----|------|
| 真源 | `modules/graph.json` |
| 烘焙器 | `modules/bake_static.py` |
| 静态投影 | `modules/index.html` |
| 重烘焙 | `python3 modules/bake_static.py` |

## 改动（一句）

SVG **先画模块框、后画关系线**（线与箭头在上层）；箭头 marker 加大且终点停在框缘外约 3px；多线入同一模块时错开锚点；烘焙时硬检无交叉／无叠段，节点穿越仅软警告。

## 校验

`python3 modules/bake_static.py` → `hard problems=0`（33 routes）；soft warnings = 线段从节点上穿过（刻意：线在上、框半透明，不遮箭头）。
