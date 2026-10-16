# 内阁 → 总参谋部指令（纠偏令）

**令号** GS-20261016-DMAP-UI-PAPER  
**日期** 2026-10-16  
**任务周期** 同一周期（二重映射 · GOOGL 季度偿债压力图）的**纠偏与完善**  
**本周期内阁下令计数** **2 / 5**（第 1 次 = `GS-20261016-DMAP-GOOGL-LADDER-Q`；本令为第 2 次；业主未指定次数，按默认至多 5 次；谏言不计次）  
**谏言** 不发问（业主已把方向说清）。  
**来源** 业主 Purkniv 原话：「我对指令不满意，你在双重映射改革方案的第七章第一节的ui方案很不错，不要舍弃它；另外，作为可导出的预览，双重映射应当采取独立的一套设计模式，而不是继承暗底荧光，我给你发的这张你设计的图，这个白底黑条，实际上整个图设计的模式都不错，尝试实现这一点。」  
**设计真源（图）** `cabinet/reports/figures/googl-ladder-paper-reference.png`（业主所附，即内阁测验成图的屏幕截图；仅含聚合 KPI，不含逐笔）；其源 `cabinet/reports/SFC-googl-quarterly-debt-pressure.html`（CSS 与版式以它为准，**只读参照**，产品代码不得 import、不得读 `cabinet/`）  
**依据** `cabinet/AUTHORITY.md` · 方案 `cabinet/notes/20261016-double-mapping-reform-plan.md` §7（尤 §7.1 版面、§7.2 共存、§7.3 交互链、§7.4 美学）· 前令 `GS-20261016-DMAP-GOOGL-LADDER-Q.md` 及其任务单 `…-tasklist.md` · 纸面 token `.cursor/skills/clerk-showable-report/SKILL.md` · `agent_tasklist/AESTHETIC.md`  
**父代理动作** 将本文**完整**转交 `general-staff`，由其写任务单（可在前令任务单旁另起 `…-UI-PAPER-tasklist.md`，或改前令任务单并标注修订，择一，不得两份并行互相矛盾）；实施由主代理；产品码变更后按既有规则送监理部。内阁不改 `Ind-Chain`；不令监理部 / 档案部。

---

## 一、业主不满的点（纠偏对象）

| # | 前令做法 | 业主意志 | 本令处置 |
|---|----------|----------|----------|
| X1 | 前令 **D1**：图落在 `#companyFocus`，**明确不做** `Map ▾` / dock；任务单「范围收窄」第 1 条再次排除 | 方案 §7.1 的 UI（顶栏 `Map ▾` + 右栏 dock + detail 折叠）**很不错，不要舍弃** | **撤销 D1 与「不做」第 1 条**；恢复并落地 §7.1（见 E1–E3） |
| X2 | 前令 **C 节**：plot 色由现有 token 派生（`--text`/`--muted`/`--stroke`），图随产品暗底玻璃 | 可导出预览必须有**独立设计模式**，不继承暗底荧光；以附图（白底黑条）为真源 | **撤销 C 节的「只由现有 token 派生」**；改立独立纸面皮（见 E4–E6） |
| X3 | 前令 D6 只要求「结构同构」，视觉随产品 | 「整个图设计的模式都不错，尝试实现这一点」 | 结构 + 视觉都以附图为真源；仍**不要求像素一致、不要求中文文案**（见 E7） |

**一句话意志**：把 Φ2 的出口从「藏在公司放大舞台里的一张暗色图」改成「立方体右栏的映射台（`Map ▾` + dock）里的一张**纸面**预览」；预览与将来导出共用**同一套**白底纸面皮，且该皮与 `.cube` 暗色 chrome 互相隔离。

---

## 二、与前令的关系（逐条，勿再歧义）

| 前令条目 | 本令处置 |
|----------|----------|
| D1 落点 `#companyFocus`，不新建 dock | **撤销**。主入口改为 `Map ▾` + dock。GOOGL 图**迁出**放大舞台（E2），不并存 |
| D2 触发：搜索命中自动开舞台；detail 末 `Debt ladder` chip | **改**：chip 保留，点击 = 打开 dock 并选中 `PM-LADDER-Q`（不再开放大舞台）。搜索命中 GOOGL 仍进公司放大（现有语义不变），舞台内只给一行交接（E2） |
| D3 节点归属（id 74、排除 id 85、取数键归一化、不放宽 `focusLayer` 守卫） | **保留**，不动 |
| D4 预烘焙 JSON + `GET /api/debt/ladder` + `BE-DEBT` | **保留**，不动；`fetchDebtLadder` 仍为唯一出口 |
| D5 `FE-MAPPROJ` / `FE-MAPDRAW`、PlotSpec v1（`y0`、band 标签域、`kpis`）、纯函数规约 | **保留**。`FE-MAPDRAW` 仍是**只认 PlotSpec** 的纯串生成器，不知数据来源、不知色值（色只在纸面皮 CSS 里） |
| D6 同构（KPI 四格 / 41 季堆叠 / 年带 / 峰值标 / 图例 / 脚注） | **保留并加强**：视觉也按附图（E5） |
| D7 口径与对拍 | **保留**，不动；烘焙与对拍脚本不改 |
| 旧 `bondChart`（Demo Company 年度折线）| **仍不动**，输出字节与改前一致 |
| 公司放大时隐藏 chrome | **保留**，并把 dock 与 sheet 一并加入隐藏集（方案 §7.2） |
| 合规 1–7（彭博聚合、逐笔不进 UI、`data/debt-ladder-*.json` 不进公开仓 / `-noentities`、不重建 `.app`、断网可用、截图即毁） | **全部保留** |
| 不做：`FE-MAPIN`、`FE-MAPOUT` 实现、`BE-MAPNL`、图↔立方体联动、导出闸、脱敏闸、全映射目录 | **仍不做**。`FE-MAPREG` 与 `FE-MAPDOCK` **从「不建」改为「建」**（最小实现，见 E1） |

> 内阁自认：前令 D1 把业主「用你的方案」窄读成「只在 GOOGL 上出一张图」，并以「目录只有一项没有意义」为由删去 UI 壳。业主已明确不接受。本令不再就此申辩，只收回。

---

## 三、指令正文（须完整执行；任务单逐条可勾）

### E1 映射台壳：恢复方案 §7.1 / §7.2 / §7.3（`FE-MAPDOCK` + `FE-MAPREG` 最小实现）

目录**可以只有一项**（`PM-LADDER-Q`），但壳与交互按方案做，**不得**降格为单按钮或内嵌图：

1. **`Map ▾` 面**：`cube.html` 顶栏右上、`top:56; right:14`（方案 §7.2），沿 `.cube-filter-face/panel/opt` 的面皮（`app.css` 现有 `cube-filter` 系）。下拉按家族分组标题（本令只有「时间」一组也要有分组壳）；条目显示 `名称 + ID`；**不可用条目置灰并写原因**（如无偿债序列的节点：`Select a node with debt data, e.g. GOOGL`）。条目 ≤12 不出搜索框，但组件须支持。
2. **右栏 dock 预览卡**：Map 打开且有可用映射被选中时出现。结构自上而下：标题行（映射名 + ID + `✕`）→ 参数行（按描述符 `params` **自动生成**；`PM-LADDER-Q` 当前无参数则该行不渲染，但生成器必须存在并由自检页用**合成描述符**验证 enum/bool/number 三类）→ **纸面预览区**（E4–E6）→ 脚注行 `n of N · 口径一句` → 操作行 `[Pin] [⤢]`。`Export ▾` **不做**（见「不做」），但预览区 DOM 必须为将来导出留出单一根节点（E6）。
3. **detail 折叠**：dock 打开时 `#detailPanel` 下移到 dock 之下并**折叠成一行**，点击展开；选中公司时内容不丢（方案 §7.2）。dock 高度上限 `100% − (96 + 140)`px，永不压 `#dBox`。
4. **窄屏**：≤980px dock 落成底部抽屉（高 ≤45%），`Map ▾` 面仍在右上；不挡 `#dBox`。
5. **预览触发源**：只有「选中 / 焦点 / 钉住 / 过滤变化、参数变化、数据到达」。**相机、拖动、`d` 滑块不触发重绘**（方案 §7.3.2）。沿现有 `onSelect / onFocusChange / onClear / onReset` 钩子通知 dock；**不新增 scene 对 map 的依赖**，`scene.js` 不改。
6. **Pin**：会话级，上限 6，存 `(mappingId, params, selector{ ticker })` 三元组，列表项一键恢复；不持久（方案 Q8 沿用）。
7. **`FE-MAPREG`**（`map/reg.js`，≲ 60 行）：`list(ctx)`（含可用/不可用+原因）、`get(id)`、`run(id, input, params)`（校验 + `project` + 兜底，不抛）。登记 `PM-LADDER-Q` 一项。`descriptorsJson()` 可选，不强做。
8. **哈希 `#map=PM-LADDER-Q`**：方案 §7.3.7 的可分享项，**非本令必做**；若实施时判断会改动 `state.js` 的 `writeHash` 契约，则**不做并回报**，勿为此扩大改动面。
9. **联动（图→立方体高亮、`mapMarkIds`）**：**仍不做**（无稳定元素 ID，沿前令；CONCEPTS 写明此限，已写则勿重复）。
10. `Map ▾`、dock、sheet 三者在公司放大期间**一并隐藏**（加入 `.company-zoom` 隐藏列表）。

`desc` 往返不变、`map/*` 不 import `scene / ui / api / state` 的前令纯度要求继续有效；`dock.js` 作为 UI 模块**可** import `api.js`（取数）与 `reg.js`、`draw.js`，不得 import `scene.js`。

### E2 迁出：GOOGL 图离开 `#companyFocus`

- 从 `bondChart.js` 移除偿债图加载与渲染路径（`loadLadder`、`probeLadder`、`openLadderFocus`、`company-focus--ladder` 的 class 切换、`bondChart.js` 对 `map/*` 与 `fetchDebtLadder` 的 import）；这些逻辑**搬入** `map/dock.js` / `map/reg.js`（取数缓存、可用性探测）。`bondChart.js` 回到「Demo `bondSchedule` 折线 + `focusPointTargets`」。
- `app.css` 中前令新增的 `.company-focus--ladder` 与其下 `.pm-*` 暗色规则整块**移除**，由 E4 的纸面皮取代（`.ladder-chip` 可保留并并入 dock 面皮）。
- 公司放大舞台对 id 74：仍显示现有 detail 内容；在其下加**一行文字交接** `Debt ladder ▸ open in Map`。点击 = 退出公司放大并打开 dock 选中 `PM-LADDER-Q`。**总参须核实**「退出公司放大」是否与相机约定（改焦点/抽回不动相机；退出恢复进入前位姿）冲突；若冲突，回报并改为纯提示文案（不加按钮），**不得**改相机约定。
- detail 末 `Debt ladder` chip（D2）：行为改为「开 dock 并选中」；出现条件仍是「序列确已取到」，断网 / 404 无入口、无报错。
- **Demo Company 路径输出与改前字节一致**（沿前令基线对拍）。

### E3 `FE-MAPDOCK` 的 sheet 态（⤢）：附图的完整尺寸落点

dock 卡宽度受限（≈ `min(420px, 36vw)`），41 柱 + KPI 四格在卡内必然是**缩略**。为让「附图那样的图」真正可读，本令把方案 P3 的 `⤢` **提前**，并限定为最小实现：

- **`compact`（dock 内）**：KPI 2×2；柱标仅峰值；季标只留年带 + `Q1`（或仅年带）；不出 `<details>`。同一 PlotSpec，同一类名，纸面皮同一 CSS。
- **`sheet`（⤢）**：居中大面，宽 `min(92%, 1100px)`，**1:1 对应附图**：KPI 四格横排、41 柱、每柱季标、年带、前若干峰值标、图例右上、轴单位左上、脚注右下。背景幕为暗色半透明遮罩（产品 chrome 在其下变暗），**sheet 本身是纸**。`Esc` / 点遮罩 / `✕` 关闭；公司放大时不可开。
- 密度切换由 `FE-MAPDRAW` 的**布局参数**承担（如 `drawPlot(spec, { density: "compact" | "sheet" })`），**只改布局，不含色值**。不得用 CSS 容器查询作为唯一手段（WKWebView 最低版本未核，方案 §5.3 同类顾虑）。
- sheet 内**不再复用** `#companyFocus` 元素（那是 E2 迁出的原因）。

### E4 独立纸面设计模式（本令核心）

**命名**：根类 `.pm-skin-paper`（挂在预览区与 sheet 的单一根节点上，见 E6）；变量前缀 `--plot-paper-*`。**自成一系**。

**隔离（硬）**：新建 `Ind-Chain/web/css/plot-paper.css`，**自包含**，满足全部：
1. 不使用产品暗色 token：文件内**不得出现** `var(--bg)`、`var(--text)`、`var(--muted)`、`var(--stroke)`、`var(--accent)`、`var(--glass*)`、`var(--us)`、`var(--intl)`（自检页用文本检查，列入回归）。
2. 不使用 `backdrop-filter`、荧光色（US `#3cf0ff` / 非美 `#ffb020`）、渐变、阴影发光。
3. 选择器全部以 `.pm-skin-paper` 开头；`app.css` 里对 `.pm-*` 的规则**不得**漏入纸面（`app.css` 不再含任何 `.pm-*` 规则，E2）。
4. 字体栈：纸面同族（serif：`"Iowan Old Style","Palatino Linotype",Palatino,"Songti SC","Noto Serif SC",serif`；数字/小字沿试验件用 sans：`-apple-system,"SF Pro Text","PingFang SC","Helvetica Neue",system-ui,sans-serif`）。**禁 CDN / 外部字体**。
5. 与 `.cube` 暗色 chrome 的边界：dock 卡的外壳（标题行、参数行、操作行、`Map ▾` 面）属产品玻璃面皮；**只有预览区是纸**。纸面区与外壳之间留 1px 中性细边与 ≥8px 间距，纸不透明、不受 `opacity` 动画影响。

**token（取自附图实测，同秘书纸面，美工部可微调但须写回 AESTHETIC）**

| 用途 | 变量 | 值 | 附图实测 |
|------|------|-----|---------|
| 纸底 | `--plot-paper-bg` | `#f7f5f0` | `#f6f5f0` |
| 主墨（本金柱、数字、峰值） | `--plot-paper-ink` | `#1a1f26` | `#1a1f25` |
| 次墨（标签、单位、脚注） | `--plot-paper-muted` | `#4a5560` | — |
| 细线 / 票息柱填充 / 网格 | `--plot-paper-rule` | `#c5ccd4` | `#c6cdd3` |
| 年带底（隔年交替） | `--plot-paper-band` | 暖浅米，约 `#efeae4` | `#efeae4` |
| KPI 条带底 | `--plot-paper-fill` | `#ece8e0`（或与纸底同、仅靠细线） | 近纸底 |

- **本金柱** = `--plot-paper-ink` 实心；**票息柱** = `--plot-paper-rule` 填充 + 0.5px `--plot-paper-muted` 描边（附图的「浅灰票息」）；两段之间无缝。
- **无新色相**：全纸面仅 ink / muted / rule / band / fill 五档中性与暖灰。峰值标注靠**字重与墨色**（粗体 ink），不靠彩色；**不用 `--accent`**（前令 §7.4 末条复核项就此关闭）。
- 语义：`tone:"neutral"` → 本金；`tone:"muted"` → 票息。PlotSpec 契约不变，参数里仍不得出现颜色；将来其他映射的新 `tone` 由纸面皮各自映射，不得回流成色值字段。

### E5 附图设计模式（视觉验收清单；对照 `googl-ladder-paper-reference.png`）

美工部以此落 CSS，主代理以此落 `draw.js` 的版式（只改布局/类名，不加色）：

1. **页**：近白暖纸底；上缘一排 **KPI 四格条带**，外框 1px rule、格间竖细线、**无圆角胶囊、无阴影**；大数（serif 600，~24px，tabular-nums）→ 单位行（sans 小字 muted）→ 说明（sans 小字 muted，可两行）。
2. **轴单位**在图左上；**图例**在图右上（方块色标 + 文字），均小字。
3. **纵轴**：整数刻度、左对齐小字；**克制网格**——仅 0.5px rule 水平线（或仅轴线），不画竖网格。
4. **柱**：每季一柱，宽 ≈ band 的 0.66；本金（下）黑、票息（上）浅灰；柱间不描白边。
5. **柱顶数值**：全部小号 muted；**前若干峰值**加粗、ink、略大（`emph`）。
6. **季标**：每柱下 `Q1…Q4`；**年带**：x 轴下年份行 + 年间竖短刻度；**隔年交替的暖米底带**贯穿柱区（附图 2027、2029、2031…）。
7. **脚注**：图右下一行 x 轴口径说明（沿 D6 英文：`Bloomberg-derived · internal use · gross cash flow, before cash & refinancing` 加一句 x 轴口径）。
8. **口径说明（notes）在纸面里是**可见文字**，不是折叠 `<details>`——可打印/导出的面不得有折叠项。dock `compact` 态可收为脚注一句 + `ⓘ`，sheet 态须全展开。

**文案语言**：随产品界面用**英文**（沿前令 D6）；附图为中文，**不要求**文案同构。纸面皮与 `draw.js` 不得假定语言；将来 `zh` 版由映射层换词，不属本令。

### E6 预览与导出共用一套皮（为导出留口，不做导出）

- `drawPlot(spec, opts)` 的输出根节点固定为 `<section class="pm-sheet pm-skin-paper" data-mapping=… data-density=…>…</section>`，**自包含**：不依赖其祖先上的 CSS 变量、不依赖 `app.css`。
- 将来的 `FE-MAPOUT`（SVG/PNG/打印）只取该根节点 + `plot-paper.css`，**不取 dock 外壳**。本令**不做**导出闸、Export 菜单、脱敏闸、剪贴板（沿前令不做 4）。
- **可导出性自证**（硬验收，见 V3）：自检页新增一段「standalone」——一个**只引入 `plot-paper.css`、不引入 `app.css`** 的空白页，渲染同一 PlotSpec，目视结构与附图一致且无缺色。此自检页仍在 `Ind-Chain/web/selfcheck-map.html`，**排除出 `SHELL-PACK` 白名单**（沿方案 R8）。
- `plot-paper.css`、`map/dock.js`、`map/reg.js` 须核实被 `package-standard-financial-charting.sh` 白名单收入（`selfcheck-map.html` 不收）。

### E7 美工部（本令明确调度）

调度 `art-department`，范围：
1. `plot-paper.css` 全部（E4、E5）与纸面 token；
2. dock 面皮（`Map ▾` 面、dock 卡外壳、detail 折叠行、`⤢` sheet 遮罩与关闭钮、窄屏抽屉）：沿 AESTHETIC §2 暗底玻璃与现有 `cube-filter` 皮，**不引入新色相**；
3. 把 AESTHETIC §3 管辖表**增行**（总参任务单授权写入）：`Ind-Chain/web/css/plot-paper.css`、`Ind-Chain/web/js/map/dock.js`（类名层）；并新增一小节「平面映射纸面皮」：**与产品暗底隔离、同族于秘书纸面、预览与导出共用**；修订已有行「平面映射图面 … `--plot-*`」为 `--plot-paper-*`。
4. 回报：纸面皮与 dock 外壳的边界处理、`compact` 与 `sheet` 的观感差异。

信息部：**不调度**（数据未变）。参谋纪要官 / 交叉整合部：不调度。

### E8 CONCEPTS 与模块图

- **CONCEPTS**（`Ind-Chain/CONCEPTS.md`）：改 `PM-LADDER-Q` 与 `C-MAP2` 中「落点在放大舞台」的字句为「落点在 Map dock」；增 `C-MAPDOCK`（映射台壳：Map ▾ / dock / sheet）与 `C-SKIN-PAPER`（独立纸面皮：隔离规则、`.pm-skin-paper`、`--plot-paper-*`、预览与导出共用）。只增本令所需。
- **模块图** `modules/graph.json`：现为 **29 模块 / 40 边**（见下展示）。本令后：
  - 增模块 `FE-MAPREG`（`map/reg.js`）、`FE-MAPDOCK`（`map/dock.js`），均 `fe-map` 区 → **31 模块**；
  - 删边：`FE-FOCUS → FE-MAPPROJ`、`FE-FOCUS → FE-MAPDRAW`、`FE-FOCUS → FE-API`（偿债取数与绘图迁出 `bondChart.js` 后；**总参核实 `bondChart.js` 是否仍有其他 import 再删**）；
  - 增边（拟）：`FE-OPENCUBE → FE-MAPDOCK`（depends，启动挂载）、`FE-MAPDOCK → FE-MAPREG`（calls）、`FE-MAPREG → FE-MAPPROJ`（depends）、`FE-MAPDOCK → FE-MAPDRAW`（calls）、`FE-MAPDOCK → FE-API`（calls）、`FE-AESTHETIC → FE-MAPDOCK`（depends）；若 chip 在 `ui.js`（`FE-PANEL`）直接调 dock，再加 `FE-PANEL → FE-MAPDOCK`（calls）；
  - 预计 **31 模块 / 43–44 边**，**总参在任务单写死最终数**；`FE-AESTHETIC → FE-MAPDRAW`（depends）保留；前令 D3 的「`FE-SCENE → FE-FOCUS` 间接带入 `map/*`」顾虑**因迁出而消失**，任务单记一行。
  - 重烘 `python3 modules/bake_static.py`，0 交叉 / 0 穿框；**此项仍是最后一道工序**。

---

## 四、验收

**V1 版面（硬）** dev `:8787` 的 `/cube`：顶栏右上出现 `Map ▾`；下拉有分组壳与 `PM-LADDER-Q`（无序列节点时置灰并带原因）；搜索 `GOOGL` 或点 id 74 → 选 `PM-LADDER-Q` → 右栏 dock 出现，detail 折叠成一行；id 85 无入口且条目置灰。点 `⤢` 出 sheet。公司放大时 dock/sheet 全隐。≤980px 抽屉不挡 `#dBox`。
**V2 纸面（硬）** dock 内预览与 sheet 均为白底黑本金柱 + 浅灰票息 + KPI 条带 + 隔年米色年带 + 峰值粗标 + 克制网格，结构与 `googl-ladder-paper-reference.png` 逐项对照 E5 清单一一满足；**暗色 chrome 的任何 token 不出现在纸面区**（`plot-paper.css` 文本检查：无 E4.1 所列变量、无 `backdrop-filter`）。
**V3 可导出性（硬）** 自检页 standalone 段：只引 `plot-paper.css` 即可渲染出同一张纸面图；`drawPlot` 根节点自包含。
**V4 迁出（硬）** `bondChart.js` 无 `map/*`、`fetchDebtLadder`、`ladder` 相关代码；`app.css` 无 `.pm-*` 与 `.company-focus--ladder`；Demo Company 放大舞台输出与改前**字节一致**；GOOGL 放大舞台不再画图，仅 detail + 交接行（或纯提示，见 E2）。
**V5 数据与纯函数不退化** 对拍（41 季 + KPI 四值）仍通过；`project()` 字节相同、`desc` 往返、`map/*`（除 `dock.js`）不 import `scene/ui/api/state`；`regress_all.sh quick` 通过；黄金 60 项零差异；静态口不泄漏 `data/`；断网 / 删烘焙 JSON 后无入口、无报错、其余行为不变。
**V6 合规** 前令合规 1–7 全部继续有效；sheet/preview 仍不出逐笔、不画 `n`；纸面脚注保留 `internal use`；不重建 `.app`；烘焙 JSON 与对拍输出不入仓；验收截图用后即毁。
**V7 模块图** 重烘后 31 / 总参写定的边数，0 交叉 / 0 穿框。
**V8 监理部三属**（父代理送）：工程测试（页面可开、dock/sheet 可操作、无阻塞错误）、代码质量（`bondChart.js` 迁出干净、无重复造皮、无未用抽象）、理念贯彻（DESIGN §1 债务风险 ✔；§2 统一审美——**须提请监理部知悉：本令有意让预览采「纸面」而非暗底，这是业主令，依 AESTHETIC 新增「纸面皮」条款判定，不按「第二套皮」处理**；§3 同一三维空间——dock 在立方体页内、选中联动入口在 detail，**图↔立方体高亮联动仍缺**，是有意收窄，非遗漏）。

---

## 五、完成后的对话流（父代理）

1. 三监报告交回 → 父代理对话栏一句 → **内阁窗口**（可再令：本周期剩余 3 次）。
2. **按「双轨」规程问业主**：**预览**（dev `:8787` 中看 dock 与 sheet 效果、是否接受纸面）与**程序**（回归、对拍、打包白名单、模块图）两轨分别请业主确认。内阁不代业主答。
3. 书记最后派一次。

---

## 六、范围提示：本令仍不做

1. 导出（SVG/PNG/CSV/剪贴板/Export 菜单）、脱敏闸；
2. 其余 `PM-*` 映射与 `FE-MAPIN` / `BE-MAPNL`；
3. 图 ↔ 立方体联动、`mapMarkIds`；
4. 改壳、重建根 `.app`；
5. 中文版纸面文案（附图中文仅作版式参照）；
6. 改烘焙口径 / `BE-DEBT` / `/api/debt/ladder`。

## 七、模块跟踪展示（`AUTHORITY.md` 义务；据 `modules/graph.json`，本令下达时）

**29 模块 / 40 边**（calls 20 · depends 17 · contract 3）：

| 区 | 数 | 模块 |
|----|----|------|
| `fe-decision` 决策路径 | 4 | FE-NAV · FE-BOARD · FE-LIST · FE-LISTAREA |
| `fe-cube` 立方体面 | 7 | FE-OPENCUBE · FE-ACTION · FE-COORDONE · FE-SCENE · FE-PANEL · FE-FOCUS · FE-AESTHETIC |
| `fe-api` | 1 | FE-API |
| `fe-map` 平面映射 | 2 | FE-MAPPROJ · FE-MAPDRAW |
| `shell` 壳 | 3 | SHELL-WINDOW · SHELL-PROC · SHELL-PACK |
| `be` 后端 | 12 | BE-HTTP · BE-BUNDLE · BE-DB-DEMO · BE-DB-SHADOW · BE-NVDA-LAYOUT · BE-NVDA-LINKS · BE-DEBT · BE-BICS-HIER · BE-BICS-ENTITY · BE-BICS-AREA · BE-BICS-INGEST · MODULES-TRACK |

与本令相关的关系（现）：`FE-SCENE ─depends─► FE-FOCUS`；`FE-FOCUS ─calls─► FE-MAPPROJ / FE-MAPDRAW / FE-API`（**本令将删**）；`FE-AESTHETIC ─depends─► FE-MAPDRAW`；`FE-API ─contract─► BE-HTTP ─calls─► BE-DEBT`。

目标（本令后）：

```
FE-OPENCUBE ─depends─► FE-MAPDOCK ─calls─► FE-MAPREG ─depends─► FE-MAPPROJ
                          ├─calls─► FE-MAPDRAW ◄─depends─ FE-AESTHETIC ─depends─► FE-MAPDOCK
                          └─calls─► FE-API ─contract─► BE-HTTP ─calls─► BE-DEBT
FE-FOCUS：不再依赖 map/*、不再取偿债数据（回到 Demo bondChart + focusPointTargets）
```

31 模块 / 43–44 边（总参写定）。
