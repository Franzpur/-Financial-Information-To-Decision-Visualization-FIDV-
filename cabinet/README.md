# 内阁

内阁的工作区。只收整理后的数据、图件、新闻、分析报告。

图件是图、表、示意图。不收应用程序图标，不收启动器图标。

可打印报告在 `reports/`。业主向内阁要报告时才写。不把这些材料写入 `library/worklog`、`library/showable-report/`、`library/bug-report/`。

## 宪制赋权

见 [`AUTHORITY.md`](AUTHORITY.md)：内阁可与业主共规划、可决策、可将规划落地、**可向总参谋部下达指令**；在**三监交回之后、书记之前**可据完成度**多次再令**总参（完善或下一任务；默认至多 5 次，业主指定 N 则从 N）；仍不指挥监理部/档案部；仍不否决业主；公私隔离仍守。

总参指令落盘：`orders/`。多期规划总览落盘：`plans/`（如本地化改革 `plans/SFC-localization-plan.md`，令文 `orders/GS-20261014-LOCAL-P*.md`）。

## 全局改名对照（2026-10-14 业主令；旧文档不改写史实，读旧文请按此对照）

| 旧 | 新 |
|----|----|
| `ind-chain/` | `Ind-Chain/` |
| `class-3-coords/` | `BE-CLASS/` |
| `DATA-SPACE/` | `BE-DATA/` |
| `Standard-Cube`（含 `Standard-Cube.app`） | `Standard-Financial-Charting`（含 `Standard-Financial-Charting.app`） |

不改：`ind_chain.db`（库文件名）、`Partner Work/`、历史 worklog / 已发布报告正文。令文：`orders/GS-20261014-global-rename.md`。

## FE 模块改名对照（2026-10-14 第二轮；令文 `orders/GS-20261014-sfc-rename-r2.md`）

只改模块图 / 文档里的模块 id；JS 文件名、函数名不改；`BE-*` 与 `MODULES-TRACK` 不改。旧令文、笔记、报告不改写史实，读旧文按下表翻译。

| 旧 id | 新 id | 中文名 |
|-------|-------|--------|
| `FE-NAV` | `FE-NAV` | 导航 |
| `FE-GATE` | `FE-BOARD` | 展板 |
| `FE-LIST` | `FE-LIST` | 列表 |
| `FE-LISTING-UI` | `FE-LISTAREA` | 列表属地 |
| `FE-CUBE-BOOT` | `FE-OPENCUBE` | 跳转制图台 |
| `FE-COORD` | `FE-COORDONE` | 摆放坐标 |
| `FE-STATE` | `FE-ACTION` | 操作 |
| `FE-SCENE` | `FE-SCENE` | 场景 |
| `FE-CHROME` | `FE-PANEL` | 面板 |
| `FE-FOCUS-STAGE` | `FE-FOCUS` | 聚焦 |
| `FE-API` | `FE-API` | 接口 |
| `FE-AESTHETIC` | `FE-AESTHETIC` | 前端设计 |

品牌字样：冷启动页与页眉 logo 的 `FIDV` 改 `SFC`（仓库 / 项目名 `FIDV` 不改）。

## 模块跟踪（静态）

真源：仓根 `modules/graph.json`。静态投影：`modules/index.html`（`python3 modules/bake_static.py`）。  
**凡电内阁有令，回报必附当时模块清单与关系展示**（见 `AUTHORITY.md`「模块跟踪展示义务」）。
