# 总参谋部任务单 · GS-20261016-DMAP-GOOGL-LADDER-Q

**令文** `cabinet/orders/GS-20261016-DMAP-GOOGL-LADDER-Q.md`  
**日期** 2026-10-16  
**状态** 主代理实施中  

本文件为总参谋部规划落盘（父代理据 `general-staff` 回文逐字整理）。红线、意志、写死事项、任务条目、验收与合规以该回文为准；实施时对照令文全文。

## 红线（首页重申）

- 烘焙 JSON `Ind-Chain/data/debt-ladder-googl.json` 默认不进公开仓，也不进 `-noentities`。
- 根目录 `.app` 不重建、不 `git add`。
- 验收用 dev `:8787` 与 `dist/internal`。
- 不改壳 / `scene.js` 场景与相机 / `coords.js` / `/api/bundle`。
- 无逐笔明细进 UI/API/JSON/CONCEPTS/回报；不展示 `n`。
- 模块图最终：**29 模块 / 40 边**。
- 窄口：`GET /api/debt/ladder?ticker=&name=`；`appliesTo.names` 含 Alphabet / Google Cloud，不含 DeepMind。
- 取数边：`FE-FOCUS → FE-API`；chip 经 `probeLadder`，不直接调 API。
- 调度：仅美工部（C 节）。信息部 / 纪要 / 交叉整合不调度。

## 实施次序

T0 → A1+V2 → A2–A4 → B1–B6 → C（美工部）→ D1/D1b → 回归 → D2 重烘模块图 → 父代理送监理部。
