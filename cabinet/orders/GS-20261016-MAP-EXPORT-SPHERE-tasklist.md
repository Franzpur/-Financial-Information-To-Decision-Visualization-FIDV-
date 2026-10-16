# 总参谋部任务单 · GS-20261016-MAP-EXPORT-SPHERE

**状态** 正式 · 2026-10-16  
**令文** `cabinet/orders/GS-20261016-MAP-EXPORT-SPHERE.md`  
**旁注** `cabinet/notes/20261016-map-export-shell-sphere-taskpack.md`

## 红线

- 不改 chain / NVDA 点形与环边；不重建根 .app
- 不做脱敏闸、SVG/PDF、任意路径遍历、WKWebView 专用下载
- 公开包可不含 gitignored debt-ladder-googl.json
- 本单无调度句（美工/信息/纪要/交叉整合均不派）

## 次序（两线可并行；勿同文件大战时分提交）

```
A：A0 → A1 → A2 → A3
B：B0 → B2 → B1
合并点：cube.html / ui.js 操作行 · CONCEPTS · modules/graph.json 重烘 → 终值 32/45
```

## A0 · 窄窗 / detail（P0）· FE-MAPDOCK / FE-PANEL / app.css / map/dock.js

- ≤980：dock 开 → #detailPanel 必 is-folded 且可点开；关 dock → detail 复位
- 避免 map 沉底与 detail 叠穿；保留底抽屉
- 自检 selfcheck-map.html + 真机缩窗

## A1 · Map 整台收展（P0）· map/dock.js / ui.js · CONCEPTS C-MAPDOCK

- 未开 dock：Map ▾ 出菜单
- 已开 dock：再点 Map 面 = 关整台（清 sheet、解除 detail docked）
- Esc 梯明确可关 dock

## A2 · 图拉长（P1）· dock.js / plot-paper.css / app.css

- 预览与 sheet 高度可拖（或 ±）；宽随容器；默认比例保持现纸面
- 不改 PlotSpec；drawPlot density 外加容器级高度/aspect

## A3 · PNG 导出（P1）· 新 FE-MAPOUT（map/export.js）

- dock/sheet 操作行加 Export；栅格化 .pm-sheet.pm-skin-paper → PNG Blob 下载
- 不含 dock 外壳 chrome
- modules/graph.json：+FE-MAPOUT（fe-map）；FE-MAPDOCK --calls--> FE-MAPOUT → 终值 32/45；bake_static.py

## B0 · 白球（P1）· scene.js / CONCEPTS C-POINT

- meta.mode !== 'chain'（demo+shell）：白球，直径 1×UNIT；去蓝黄环
- chain/NVDA：外观与改前一致

## B2 · googl 清单硬编码（P2）· FE 常量（近 B1；不新建 BE-MAPFILES）

允许列表（相对仓根短路径）：

```
BE-DATA/ICBC C/928/googl_bond_full.xlsx
BE-DATA/ICBC C/928/googl_fa_bs.xlsx
BE-DATA/ICBC C/928/googl_top20 comsumer.xlsx
BE-DATA/ICBC C/928/googl_top20 supplier.xlsx
Ind-Chain/data/debt-ladder-googl.json
```

- 匹配：文件名含 googl（大小写不敏感）；忌路径遍历
- 公开包展示层可不列不存在的 gitignored json

## B1 · GOOGL 文件环（P2）· scene.js（+必要 UI/CSS）；依赖 B0+B2

- 悬停 GOOGL 白球列文件名；点击环状轮转；到底回第一个
- 冒出页：文件名 + 短相对路径；billboard；球不 billboard
- 不打开 Excel；不 Open in Map

## 验收

令文 VA–VH · `regress_all.sh quick` · `selfcheck-map.html`
