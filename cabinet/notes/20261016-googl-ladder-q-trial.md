# 2026-10-16 · GOOGL 季度偿债压力定点测验笔记

- 成品：`reports/SFC-googl-quarterly-debt-pressure.html`（+ `.pdf`）；脚本：`reports/_build_googl_ladder.py`。
- 数据：`BE-DATA/ICBC C/928/googl_bond_full.xlsx`，Securities 82 行（全为 Alphabet / GOOGL）。计入 Corporates 78 行；不计 Preferreds 2（完全重复、强制转换性质）、Loans 2（无金额）。
- 口径：本金 = 到期日所在季的 Amt Out；票息 = Coupon × Amt Out ÷ 频率，付息日自 First Coupon Date 顺延至到期；起算 2026Q4；不重估汇率。
- 数据问题：Amt 列实为按发行日汇率折算的美元等值（Context 写 Currency: USD，行内币种却有 7 种）；无 CUSIP/ISIN；无赎回、摊还、汇率列；浮动利率 5 笔；FCF 类字段为公司级重复列。
- 规约缺口：v1 PlotSpec 的 rect 缺堆叠基线（本测验用显式 `y0`）。
- 正式 P2：建议另令信息部立 `BE-DEBT`（债券要素表 → 摄入，带稳定 ID，保留币种/本币面额/汇率/赎回/摊还）。
