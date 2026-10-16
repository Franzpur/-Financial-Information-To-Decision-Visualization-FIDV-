# 内阁报告库

业主向内阁要可打印报告时，报告写在这里。

纸面与秘书读本同一套：纸色、墨色、细线、宋体。不另做一套皮。

不写入 `library/showable-report/`。

`SFC-ai-chain-risk-charts.html` 是《AI产业链及其风险》。Bloomberg Intelligence 的 44 份不进入这份结论。配图在 `figures/`。

`SFC-bank-chart-logic.html` 是《头部投行的画图逻辑》，用来对照可视化工程。同样不含 Bloomberg Intelligence，配图共用 `figures/`。

`SFC-all-charts.html` 是制图展开。1172 张，按分析公司分列。图下中文是该图或该组图在原文里的观点，并注明来源和作者。配图在 `plates/`。

`SFC-interactive-autonomous-charting-view.html` 是《交互性与自主作图：从静态展厅到约束坐标制图台》：深度剖析为何严格锁死 SFC 三类坐标与四项原语恰恰是扩展金融图种（单中心链、多跳级联链、债务到期墙、同业集中度对标、跨界渗透、压力演进）的数学前提，解剖当前 `bundle_nvda_chain` 的五重耦合与 `shell` 空墙断头路，并提出声明式 `ChartSpec` 架构（非令）。

`SFC-three-interaction-modes-and-llm-view.html` 是《三种目标交互方式与大模型架构裁决》：深度剖析简单自然语言指令、表类数据输入（含 BICS 2.8 万企自动左连接富化）、手动制图操作（约束结构操作而非自由拖拽 XYZ）如何汇入同一 `ChartSpec` 状态机，并裁决大模型在何处有利、哪两条红线防乱、为何现有 26 模块架构零重塑（非令；姊妹篇）。

`SFC-double-mapping-reform-plan.html` 是《二重映射改革方案》的可打印版（2026-10-16，业主令「把它写成html」；非令）：第二重映射 Φ2（立方体坐标与元素 → 平面图）的概念定义、对业主原话的三处纠偏、映射目录 `PM-*`、`MapInput / Descriptor / PlotSpec` 接口、拟增模块区 `fe-map`、UI 草图、P0–P4 分阶段、风险 R1–R13、待拍板 Q1–Q12 与令文触发条件。白底纸面、A4、封面 `.cover--paper`、无 CDN；纸面 token 与组件类名取自 `library/showable-report/SFC-icbc-fintech-proposal-template.html`（只读借用，未改）。ASCII 草图已改为内联 SVG。原文在 `cabinet/notes/20261016-double-mapping-reform-plan.md`，未改。`SFC-double-mapping-reform-plan.pdf` 是同页 Chrome headless 打印件（26 页，供核对分页；以 html 为准）。

`SFC-googl-quarterly-debt-pressure.html` 是《GOOGL 季度偿债压力平面图 · 二重映射定点测验》（2026-10-16，业主令「定点的二次映射改革」；测验件，非令）：照《二重映射改革方案》试制一幅 Φ2 平面图，映射 `PM-LADDER-Q`（`PM-LADDER` 加季度桶）。读 `BE-DATA/ICBC C/928/googl_bond_full.xlsx`（82 行，计入 78 行公司债，在外面额合计 127.5 bn 美元等值），按到期日与付息日落入日历季，输出 2026Q4–2036Q4 的本金 + 票息堆叠柱，另附 2037–2046 年度尾部。A4 横向 4 页：主图、Φ1/Φ2 与 PlotSpec 摘要、数据摸底与聚合口径、局限与对 `bondChart` 的对照。手写 SVG，无 CDN，白底纸面。**含彭博导出加工物，默认不随外发包；公开仓推送须业主知悉**；不含逐笔债券明细。`SFC-googl-quarterly-debt-pressure.pdf` 是同页 Chrome headless 打印件（以 html 为准）。`_build_googl_ladder.py` 是生成该页的一次性脚本（只读 `BE-DATA`、只写本目录，依赖 openpyxl）；完整 PlotSpec 内嵌于 html 末尾。测验笔记在 `cabinet/notes/20261016-googl-ladder-q-trial.md`。
