# 总参谋部任务单 · GS-20261016-DMAP-UI-PAPER

**令文** `cabinet/orders/GS-20261016-DMAP-UI-PAPER.md`  
**日期** 2026-10-16  
**状态** 主代理实施中  
**与前令关系** 修订 `GS-20261016-DMAP-GOOGL-LADDER-Q` 的 D1 与 C 节；冲突处以本单与令文为准。

## 红线

- 烘焙 JSON 不进公开仓 / `-noentities`；根 `.app` 不重建。
- 不改壳 / `scene.js` / 相机 / `coords.js` / `/api/bundle` / `proj.js` / `BE-DEBT`。
- 模块图最终：**31 / 44**。
- 调度：仅美工部。完成后父代理问双轨，勿默认开三属。

## 写死

- 落点：`Map ▾` + 右栏 dock + `⤢` sheet（纸面）；GOOGL 图迁出 `#companyFocus`。
- 纸面：`plot-paper.css` + `.pm-skin-paper` + `--plot-paper-*`，不继承暗底荧光。
- `drawPlot(spec, {density:"compact"|"sheet"})`；根节点 `.pm-sheet.pm-skin-paper`。
- Pin selector `{ticker,name}`；交接行 `Debt ladder ▸ open in Map`。

## 次序

T0 → A（draw/reg）→ C1（bondChart 迁出）→ B（dock/cube/main/ui）→ C2（app.css）→ S 美工部 → D 自检回归 → E CONCEPTS + 模块图重烘 → Z 问双轨。

细则以令文与总参谋部回文为准；实施代理须通读令文全文。
