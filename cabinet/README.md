# 内阁

内阁的工作区。只收整理后的数据、图件、新闻、分析报告。

图件是图、表、示意图。不收应用程序图标，不收启动器图标。

可打印报告在 `reports/`。业主向内阁要报告时才写。不把这些材料写入 `library/worklog`、`library/showable-report/`、`library/bug-report/`。

## 宪制赋权

见 [`AUTHORITY.md`](AUTHORITY.md)：内阁可与业主共规划、可决策、可将规划落地、**可向总参谋部下达指令**；在**三监交回之后、书记之前**可据完成度**多次再令**总参（完善或下一任务；默认至多 5 次，业主指定 N 则从 N）；仍不指挥监理部/档案部；仍不否决业主；公私隔离仍守。

总参指令落盘：`orders/`。

## 模块跟踪（静态）

真源：仓根 `modules/graph.json`。静态投影：`modules/index.html`（`python3 modules/bake_static.py`）。  
**凡电内阁有令，回报必附当时模块清单与关系展示**（见 `AUTHORITY.md`「模块跟踪展示义务」）。
