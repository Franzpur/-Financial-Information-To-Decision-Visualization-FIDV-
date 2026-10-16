# 内阁旁注 · Map 导出/收展/拉长/窄窗 + 非 NVDA 白球 / GOOGL 文件环

**日期** 2026-10-16  
**业主** Purkniv · **唤起**「电内阁，根据你认为合理的方式指挥任务」  
**状态** **已按建议默认拍板 · 已报文**（令文 `cabinet/orders/GS-20261016-MAP-EXPORT-SPHERE.md`；草稿任务单 `…-tasklist.md`）· 未改产品代码 · 未改 `modules/` · 未调度美工部/信息部（仅令文内「建议总参排单时调度」）  
**体例** 整理/排单笔记（非 `cabinet/reports/` 可打印报告）

---

## 0. 一页摘要

业主两包工作：**(A) Map 台交互补强**（导出、Map 键收展、图拉长、窄窗布局修复）；**(B) 非 NVDA 公司点改白球**（去蓝黄环；GOOGL 悬停列带 googl 的库文件名，点击轮转；冒出页随视野转、球不转）。

现状要点（仓内已核实）：

| 项 | 现状 | 出处 |
|----|------|------|
| Map 台 | `Map ▾` + `#mapDock` + `#mapSheet` + 纸面皮；**无导出 / 脱敏门** | CONCEPTS `C-MAPDOCK` / `C-MAP2`「Not built: … export」 |
| 窄窗 | ≤980px dock 变底抽屉；`#detailPanel` 与 dock 联动折叠 | `app.css` `@media (max-width: 980px)`；`map/dock.js` `is-docked` / `is-folded` |
| 模式三分 | `demo` 演示集 · `shell` 影集 · `chain` 今仅 NVDA | CONCEPTS `C-CUBE`；`bundle_dispatch` |
| 公司点 | 米白盘 + US 青 / INTL 黄环边（蓝黄环） | CONCEPTS `C-POINT`；`scene.js` ~554–580 |
| 1 类单位 | `UNIT = FACE / FACE_SPAN`；直径「一类坐标单位长度」= **1×UNIT 世界直径** | `coords.js`；CONCEPTS 1 类坐标 |
| googl 文件名（本机扫到） | `BE-DATA/.../googl_*.xlsx`×4 + `Ind-Chain/data/debt-ladder-googl.json` | 见 §4 |

**已拍板**（业主「按建议默认 · 直接报文」）：先 A 后 B 可并行；白球 **demo+shell、不动 NVDA chain**；导出 **PNG**；拉长 **可拖高**；googl = **文件名含 googl**；冒出页 **文件名+短路径**；窄窗 **保留底抽屉修好 detail**；本周期 **A0–A3 + B0–B2 同令**。令文已落：`cabinet/orders/GS-20261016-MAP-EXPORT-SPHERE.md`。

---

## 1. 业主原话（全文）

> 首先，我想要一个map的导出键，我还想要按map键时展开再按收回整个map，然后我需要一个图的拉长功能，现在是一个固定长宽，还有当窗口变小到一定程度时，就会出现显示问题，detail不会收起，map会移动到底部等等；第二大任务是，非nvda那个演示库的所有公司壳改为一个直径为一类坐标单位长度的白色球，把蓝黄环都去掉，当鼠标浮于googl白球上时，显示所有带googl标签的数据库文件名，点一下球移到下一个，到底了之后再点返回到第一个，从球冒出来的页随视野转动，但球本身不需要。

---

## 2. 内阁理解与纠偏

### 2.1 采用的理解

1. **「map 导出键」**：在 Map 台（dock 与/或 sheet）增加导出动作，导出当前纸面图（与 `C-SKIN-PAPER` 同源），不是导出整个立方体截屏。
2. **「按 map 键展开再按收回」**：`Map ▾`（或已选中映射后的 Map 面）作 **整台开关**：开 → 展开 dock（及已打开的 sheet 策略见拍板）；再按 → 收回整台。不是键盘物理 Map 键（除非业主改口）。
3. **「图的拉长」**：纸面预览（及 sheet）今日近似固定长宽；要可拉长/改纵横比，便于读长序列（如偿债梯）。
4. **窄窗问题**：业主观察到 detail 不收、map 沉底。与现设计「≤980 底抽屉」部分重合，但 **detail 折叠失效** 属缺陷，应修；是否取消底抽屉改侧栏缩小，见拍板。
5. **「非 nvda 那个演示库的所有公司壳」**：排除 **chain / NVDA** 的特殊环与边；把其余模式下的公司点（口语「壳」≠ 仅 `meta.mode=shell`）改成 **白球、直径 = 1 类坐标 1 单位（UNIT）**，去掉 US/INTL 色环。**范围 demo / shell / 二者** 见 §6 Q1。
6. **GOOGL 白球**：悬停列出带 googl 标签的数据库文件名；点击在列表中轮转；「冒出页」billboard 随相机，球共面/固定朝向不必 billboard。

### 2.2 纠偏

- 「公司壳」在口语里常指 **C-POINT 网格**；产品里 `shell` 另指 `BE-DB-SHADOW`。排单时应用模式名，避免只改影集漏掉演示集（或反之）。
- CONCEPTS 已写明 **export / redaction 未建**；导出即触及曾规划的 `FE-MAPOUT` 与 `.app` 下载通道（二重映射方案 §8）。浏览器可先 `Blob` 下载，壳内 WKWebView 可能需后续壳令——本包默认 **先浏览器 loopback**。
- 「带 googl 标签」仓内 **无统一 tag 表**；现成是 **文件名含 googl**。若要正式标签，须 **建议报文后调度信息部** 立清单，不可 silently 扫全盘进 UI。

---

## 3. 任务包（优先级 · 依赖 · 建议交谁）

| ID | 包名 | 优先级 | 依赖 | 建议交谁 | 内容 |
|----|------|--------|------|----------|------|
| **A0** | 窄窗 / detail 折叠修复 | P0 | 无 | **总参谋部排单 → 父代理改码**（`FE-MAPDOCK` / `FE-PANEL` / `app.css`） | 复现 ≤980 与中等宽度：dock 开时 detail 必 `is-folded` 可点开；关 dock 时 detail 复位；避免 map「沉底」与 detail 叠穿。自检：`selfcheck-map.html` + 真机缩窗。 |
| **A1** | Map 整台收展 | P0 | A0 可并行 | 同上 | `Map ▾`：无打开映射时仍出菜单；**已打开 dock 时再点 Map 面 = 关闭整台**（清 sheet、解除 detail docked）。可选：Esc 梯已含 sheet，再明确「关 dock」。CONCEPTS `C-MAPDOCK` 补一句。 |
| **A2** | 图拉长（纵横比） | P1 | A1 后或并行 | 父代理；**纸面尺度建议报文后调度美工部**（仅 `plot-paper.css` / density） | dock 预览与 sheet：高度/宽度可调（拖柄或 ±），`drawPlot` density 外加 `aspect` 或容器 CSS；默认起点保持现纸面比例。不改 PlotSpec 语义。 |
| **A3** | 导出键 | P1 | A2 可选；纸面根稳定即可 | 总参排单 → 父代理；模块上可能 **新增 `FE-MAPOUT`（导出门）** 须进 `modules/graph.json` 重烘 | dock/sheet 操作行加 Export；导出当前 `.pm-sheet.pm-skin-paper`（推荐 PNG；备选 SVG）。脱敏门本包 **不做**（CONCEPTS 原「Not built」可先写「PNG only, no redaction」）。壳下载通道单列后续。 |
| **B0** | 非 NVDA 白球 | P1 | 与 A 弱依赖；**勿与 A 同文件大战** 时分 PR | 总参 → 父代理（`FE-SCENE` / `coords` 常量） | `meta.mode !== 'chain'`（或显式 demo+shell）：C-POINT → 白球直径 `UNIT`；去 rim US/INTL；标签策略保持或略缩。**NVDA chain 保持现环+边。** 更新 CONCEPTS `C-POINT`。 |
| **B1** | GOOGL 文件环 UI | P2 | B0；文件清单 | 父代理；**清单真源建议报文后调度信息部**（desk=manage） | 悬停 GOOGL 白球：列出 googl 文件名；点击轮转（环状）；冒出页 CSS/Three 平面 **billboard**，球不 billboard。首版页内容 = 文件名（+相对路径）；不自动打开 Excel。 |
| **B2** | GOOGL 文件清单窄口 | P2 | B1 | **建议报文后调度信息部**；BE 窄口由总参写入任务单 | `GET` 或烘焙 JSON：可展示的 googl 文件名列表（允许列表，忌任意路径遍历）。初值可硬编码 §4 五行，再换真源。 |

**总顺序建议**：`A0 → A1 → A2 → A3` 为一条；`B0 → B2 → B1` 为另一条。两线可并行，合并点在 `cube.html` / `ui.js` 操作行与 CONCEPTS。  
**不交**：监理部、档案部（本笔记不调度）。美工/信息仅「建议报文后调度」。

---

## 4. 现状锚点（实施时对照）

### 4.1 Map

- 模块：`FE-MAPREG` / `FE-MAPPROJ` / `FE-MAPDRAW` / `FE-MAPDOCK`；纸面 `plot-paper.css`；债梯 `BE-DEBT` + `PM-LADDER-Q`。
- 导出未建；Pin / ⤢ 已有。
- 窄窗：`app.css` ~1345+；detail 联动：`map/dock.js`。

### 4.2 公司点 / 模式

| `meta.mode` | 库 | 今日点形 | 本包意图 |
|-------------|-----|----------|----------|
| `demo` | `BE-DB-DEMO` 裸 `/cube` | 米白盘+色环 | → 白球（若 Q1 含 demo） |
| `shell` | `BE-DB-SHADOW` `?ticker=` | 同上（壳坐标） | → 白球（若 Q1 含 shell） |
| `chain` | NVDA | 盘+环 + C-REV-LINK | **不动** |

### 4.3 本机 googl 文件名（2026-10-16 扫）

```
BE-DATA/ICBC C/928/googl_bond_full.xlsx
BE-DATA/ICBC C/928/googl_fa_bs.xlsx
BE-DATA/ICBC C/928/googl_top20 comsumer.xlsx
BE-DATA/ICBC C/928/googl_top20 supplier.xlsx
Ind-Chain/data/debt-ladder-googl.json
```

（`debt-ladder-googl.json` 为 gitignored 烘焙产物；公开包体是否列出见 Q5。）

---

## 5. 模块图快照（电内阁义务 · 当时）

**真源** `modules/graph.json` · **updated** 2026-10-16 · **31 模块 / 44 边**  
**静态页** `modules/index.html`（改图后 `python3 modules/bake_static.py`）

### 5.1 模块清单

| 区（意） | id |
|----------|-----|
| 决策路径 FE | `FE-NAV` `FE-BOARD` `FE-LIST` `FE-LISTAREA` `FE-OPENCUBE` |
| 立方体面 FE | `FE-ACTION` `FE-COORDONE` `FE-SCENE` `FE-PANEL` `FE-FOCUS` `FE-AESTHETIC` |
| 接口 | `FE-API` |
| 平面映射 FE | `FE-MAPPROJ` `FE-MAPDRAW` `FE-MAPREG` `FE-MAPDOCK` |
| 应用壳 | `SHELL-WINDOW` `SHELL-PROC` `SHELL-PACK` |
| 后端 | `BE-HTTP` `BE-BUNDLE` `BE-DB-DEMO` `BE-DB-SHADOW` `BE-NVDA-LAYOUT` `BE-NVDA-LINKS` `BE-DEBT` `BE-BICS-HIER` `BE-BICS-ENTITY` `BE-BICS-AREA` `BE-BICS-INGEST` |
| 跟踪 | `MODULES-TRACK` |

### 5.2 关系（边 · kind）

```
FE-NAV --calls--> FE-BOARD
FE-BOARD --calls--> FE-LIST | FE-API
FE-LIST --calls--> FE-OPENCUBE | FE-API
FE-OPENCUBE --calls--> FE-API
FE-OPENCUBE --depends--> FE-ACTION | FE-COORDONE | FE-SCENE | FE-PANEL | FE-MAPDOCK
FE-API --contract--> BE-HTTP
FE-BOARD|FE-LIST --depends--> FE-LISTAREA
FE-SCENE --calls--> FE-COORDONE ; --depends--> FE-FOCUS
FE-PANEL --calls--> FE-MAPDOCK
FE-AESTHETIC --depends--> FE-BOARD | FE-LIST | FE-PANEL | FE-MAPDRAW | FE-MAPDOCK
FE-MAPDOCK --calls--> FE-MAPREG | FE-MAPDRAW | FE-API
FE-MAPREG --depends--> FE-MAPPROJ
BE-HTTP --calls--> BE-BUNDLE | BE-BICS-* | BE-DEBT ; --contract--> MODULES-TRACK
BE-BUNDLE --calls--> BE-DB-DEMO | BE-DB-SHADOW | BE-NVDA-LAYOUT | BE-NVDA-LINKS
BE-NVDA-LAYOUT --depends--> BE-NVDA-LINKS
BE-BICS-ENTITY --depends--> BE-BICS-AREA ; BE-BICS-INGEST --depends--> BE-BICS-ENTITY
SHELL-WINDOW --depends--> SHELL-PROC ; --contract--> BE-HTTP
SHELL-PROC --calls--> BE-HTTP
SHELL-PACK --depends--> SHELL-WINDOW | BE-HTTP
```

**本包可能增量（待总参确认）**：`FE-MAPOUT`（导出）← `FE-MAPDOCK` calls；可选 `BE-MAPFILES` 或扩 `BE-HTTP` 读 googl 清单（信息部真源）。未改 JSON 前仍为 **31/44**。

---

## 6. 拍板记录（原发问项 · 已全部按建议默认 A）

业主 2026-10-16：「电内阁，你本身就有指挥权，你直接报文就行」→ Q1–Q8 **全部 A**。

| # | 拍板 |
|---|------|
| Q1 | demo+shell 白球；chain/NVDA 不动 |
| Q2 | 已开 dock 再点 `Map ▾` = 关整台 |
| Q3 | PNG |
| Q4 | 可拖改高度 |
| Q5 | 文件名含 googl；§4 初值 |
| Q6 | 文件名 + 短路径 |
| Q7 | 保留底抽屉，修好 detail |
| Q8 | A0–A3 + B0–B2 同报文 |

令文：`cabinet/orders/GS-20261016-MAP-EXPORT-SPHERE.md`  
草稿任务单：`cabinet/orders/GS-20261016-MAP-EXPORT-SPHERE-tasklist.md`

---

## 7. 下一步（父代理）

立即 **「报文」/「电总参谋部」**，完整转交令文；总参立正式任务单后主代理实施。美工/信息仅在令文「建议总参排单时调度」。

---

## 8. 内阁自限

- 不实现 `Ind-Chain` 产品代码。  
- 不指挥监理部、档案部。  
- 本回合已写 `cabinet/orders/GS-20261016-MAP-EXPORT-SPHERE.md`（及 tasklist 草稿）。  
- 不否决；最终决定权在业主。
