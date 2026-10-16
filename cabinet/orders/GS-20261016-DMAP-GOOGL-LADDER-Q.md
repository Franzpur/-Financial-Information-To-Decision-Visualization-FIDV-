# 内阁 → 总参谋部指令

**令号** GS-20261016-DMAP-GOOGL-LADDER-Q  
**日期** 2026-10-16  
**任务周期** 新周期（二重映射 · 第二重 Φ2 定点落地 · GOOGL 季度偿债压力图）  
**本周期内阁下令计数** **1 / 5**（本令为该周期第 1 次；业主未指定次数，按默认至多 5 次；谏言不计次）  
**来源** 业主 Purkniv 原话：「这种图就可以是一种 map 了，尝试用你写的方案，指挥在 googl 节点上实现这个二重映射。」附图 = 内阁 2026-10-16 定点测验成图（KPI 四格 + 本金/票息堆叠柱，2026Q4–2036Q4）。  
**依据** `cabinet/AUTHORITY.md` · 方案 `cabinet/notes/20261016-double-mapping-reform-plan.md`（§3 概念、§4 `PM-LADDER`、§5 接口、§8 合规、§9 P1/P2）· 测验笔记 `cabinet/notes/20261016-googl-ladder-q-trial.md` · 成图 `cabinet/reports/SFC-googl-quarterly-debt-pressure.html`（内嵌 `#plotspec` JSON；脚本 `cabinet/reports/_build_googl_ladder.py` 仅作**读口径参照**，产品代码不得 import、不得读 `cabinet/`）  
**父代理动作** 将本文**完整**转交 `general-staff`，立意志与任务单；实施由主代理；产品码变更后按既有规则送监理部。内阁不亲自改 `Ind-Chain`；不令监理部 / 档案部。

---

## 意志（一句）

业主认定「季度偿债压力图」即为一种 map（`PM-LADDER-Q`）：在立方体 **GOOGL 节点**上，把二重映射的第二重 Φ2（元素 → PlotSpec → 平面图）**定点落地**，使定点测验升级为**产品内可见**；本令是**一个定点切片**，不是全套 `fe-map` 注册表。

---

## 定夺（内阁已拍板，勿再问业主）

### D1 落点：并存于「公司放大舞台」`#companyFocus`，不新建 dock，不替换 `bondChart`

对照三个候选与现状（实测）：

| 候选 | 结论 | 理由 |
|------|------|------|
| 方案 §7 的右栏 `Map ▾` dock | **不做** | dock 是 P2 全套（下拉、参数自动生成、联动、折叠 detail），本令只需一张图；`Map ▾` 目录只有一项没有意义 |
| 右侧 `#detailPanel` 内嵌 | **不做图**，仅放入口 | 面板宽 `min(300px, 100%-28px)`（`app.css:244-267`），41 个季柱 + KPI 四格放不下 |
| 公司放大舞台 `#companyFocus`（`bondChart.js` `createCompanyFocusStage`） | **采用** | 今天唯一承载平面债务图的位置；宽 `min(64%,760px)`，41 柱约 16px/柱可读；公司放大时已隐藏全部 chrome，不与 d 盒/右栏冲突；`FE-FOCUS` 已是「聚焦舞台」模块，职责吻合 |

**与旧 `bondChart` 的关系：并存、分派、不删。** `enterCompanyZoom` 内按数据分派：
- `c.bondSchedule` 存在（Demo Company）→ **原样**走 `bondChartHtml`，输出字节与改前一致；
- 该节点有季度偿债序列（GOOGL）→ 走新 `PM-LADDER-Q`；
- 两者都有 → 不并列，GOOGL 以 `PM-LADDER-Q` 为准（现实中不会发生）。

「年度折线 `bondChart` ↔ 季度堆叠柱」两张图口径不同（年 vs 季、折线 vs 堆叠），**本令不做逐点对照，也不做替换**；替换策略留待 `PM-LADDER` 年度模式落地后的后续令（方案 Q12）。

### D2 「点 GOOGL」的触发路径

现状：只有**搜索命中路径**（`ui.js` 顶栏搜索 → `selectCompany(id,{standardView:true})` → `onSelect` → `scheduleCompanyZoom`）会开放大舞台；**点面 / 点名单行 / 点点**只刷新右侧 detail（`ui.js:427-443`；CONCEPTS 119）。业主说的「点 GOOGL」，需要两条都通：

1. **搜索 `GOOGL`**：沿现有路径自动开放大舞台，舞台内显示 `PM-LADDER-Q`。**不改**搜索路径语义。
2. **点节点 / 点名单行**：右侧 detail 保持现状，**仅对有季度偿债序列的节点**在 detail 末尾加**一个**入口（小 chip，文案 `Debt ladder`），点击打开同一放大舞台（不强制动相机；若须先聚焦本片，沿用 `selectCompany` 已设的 `focusLayer`）。无序列的节点**零变化**。

入口只在序列**确已取到**后出现；取不到则静默无入口（见 D4 / 断网）。

### D3 「GOOGL 节点」是哪一个

演示集里 `ticker = GOOGL` 的有**两条**：id 74「Alphabet / Google Cloud」（layer 9，note「Demand origin」）与 id 85「Google DeepMind」（layer 10）。债券发行人是 Alphabet Inc，不是 DeepMind 这个业务单元。

- **定夺：序列只挂 id 74**；id 85 **不显示**偿债图（显示别人家的债在业务单元上会误导）。
- 链模式（`?ticker=NVDA`）里的客户节点 Alphabet（`ticker: "GOOGL US Equity"`，`nvda-revenue-links.json`）与 shell 模式（`?ticker=GOOGL` 的单点）：**同一取数键（归一化 ticker = `GOOGL`）**；总参核实能否在**不放宽 `enterCompanyZoom` 的 `focusLayer == null` 守卫**（shell 无切片）的前提下一并支持。**必交：演示集 id 74。** 链 / shell **尽力而为**：做不到就在回报里写明原因，**不得**为此全局放松守卫。
- 实现上避免写死 `id === 74`：由服务端响应或数据文件带「适用键」，前端只据响应判定；id 85 排除的逻辑写在数据/契约一处。

### D4 数据：**预烘焙 JSON + 服务端窄口**，不在运行时读 xlsx，不立完整 `BE-DEBT`

- **烘焙**：新脚本 `Ind-Chain/scripts/bake_debt_ladder.py`（开发期工具，读 `BE-DATA/ICBC C/928/googl_bond_full.xlsx`，写 `Ind-Chain/data/debt-ladder-googl.json`）。口径**逐字对齐**测验（见下「口径」）；`openpyxl` 仅烘焙期依赖，**不得**进运行时、不得进内嵌 Python 依赖。
- **运行时**：W1 禁止浏览器 `fetch` 数据文件（`GS-20261014-W1-modules-track.md` A3），所以不能让前端直接读 `data/*.json`。新增只读窄口 **`GET /api/debt/ladder?ticker=<…>`**：服务端读烘焙 JSON，按归一化 ticker 返回；未知 ticker 或文件缺失返回 `404` + 不含路径的短 JSON（符合 W1 A2）。`FE-API` 新增 `fetchDebtLadder(ticker)` 为**唯一**出口。
- **这是对方案 §9「P1–P3 后端零改动」的有意偏离，理由**：方案「零后端」针对纯投影的 P1；债务数据（Q11）本来就要新取数口，W1 又禁前端读文件，**最小合规做法**就是一个窄 GET。仍然**不**做：xlsx 运行时摄入、债券要素表、`BE-DEBT` 的稳定 ID/币种/赎回/摊还（留待信息部另令）。服务端模块名 **`BE-DEBT`**，单文件 `server/debt_ladder.py`，只做「读烘焙 JSON → 校验 → 返回」，≲ 80 行。
- **现有 `/api/bundle` 不改**，黄金响应 60 项零差异；新口不在 60 项内，可增一项仅检结构的检查（不含数值）。
- **烘焙 JSON 形状（v1，聚合，无逐笔）**：  
  `{ v:1, issuer:"GOOGL", appliesTo:{tickers:["GOOGL"], …}, asOf:"2026-09-28", horizon:["2026Q4","2036Q4"], unit:"USD bn-eq", quarters:[{q:"2026Q4", principalBn, interestBn, n}], basis:{n:78, excluded:[{reason,count}]}, notes:[…], provenance:{sources:["Bloomberg SRCH export (internal)"], illustrative:false, thirdParty:true} }`  
  **不得含**：逐笔债券行、到期日清单、票息清单、发行名、任何文件路径、`xlsx` 字样的路径、行 id。`n`（该季参与笔数）只服务 PlotSpec 的 `nRef`，**不在 UI 展示**。

### D5 Φ2 的最小切片（与方案的差异显式列出）

只建两个模块，不建注册表、不建取数层、不建 dock：

| 模块 | 文件 | 职责 | 备注 |
|------|------|------|------|
| `FE-MAPPROJ` | `Ind-Chain/web/js/map/proj.js`（本令只含 `pm-ladder-q`） | `project(input, params) → PlotSpec` **纯函数**；导出 `{ desc, project }` | 描述符只留 `id / requires / params / disclosure:"aggregate" / basis:"population" / dataTier:"bundle+api"`（方案 R1：不预留未用字段） |
| `FE-MAPDRAW` | `Ind-Chain/web/js/map/draw.js` | `PlotSpec → SVG 字符串`，只认 `band`/`linear` 两刻度、`rect`/`text`/`line` 标记；**不知数据来自哪** | 手写 SVG；**禁 CDN、禁图表库** |

**不建**：`FE-MAPIN`（输入来自服务端响应，不读 `state`/`coords.js`）、`FE-MAPREG`、`FE-MAPDOCK`、`FE-MAPOUT`、`BE-MAPNL`。理由：本令只有一个映射、输入不来自立方体坐标，注册表与取数层此刻是纯抽象成本（方案 R1）。

**PlotSpec 契约**：沿方案 §5.1（v1），并吸收测验暴露的三处缺口，写成**冻结增条**（由主代理落入 `Ind-Chain/CONCEPTS.md`，条目 `C-MAP2` 第二重映射、`C-PLOT` PlotSpec，含下列增量）：
1. `marks[].y0`：矩形的显式堆叠基线（rect 为 `[y0, y]` 区间）；
2. `scales[].kind:"band"` 须带**标签域**（41 个季标 `"2026Q4"…`）；
3. 无稳定元素 ID 时：`marks[].ref` 省略，只写 `nRef` 计数；**本令不做图 ↔ 立方体联动**（无 ID 无法回指元素），并在 CONCEPTS 写明此限。
另允许增一个可选顶层字段 `kpis:[{ id, value, unit, text }]`（KPI 四格由 `project()` 在**同一纯函数**内算出，渲染只排版）。

**映射 ID** 用业主所称 **`PM-LADDER-Q`**，不改名。方案/测验提过可并入 `PM-LADDER` 的 `bucket:"year|quarter"` 参数——**记入 CONCEPTS 的待办注记，本令不动**。

**规约纯度**（沿方案 §5.2）：无 DOM、无 fetch、无 `Date.now`/`Math.random`；同输入字节相同输出（数字定精度）；不满足 `requires` 返回 `{ ok:false, reason, hint }` 而不抛；`tone` 为语义色标（`neutral`=本金、`muted`=票息），参数里**不得**出现颜色。`map/*` 不得 import `scene / ui / api / state`。

### D6 同构的含义（验收口径）

**结构同构**，不要求像素/文案一致。须含：
- **KPI 四格**：在外面额合计与笔数 / 2026Q4–2031Q4 累计到期本金与占比 / 单季合计峰值及其季度（并列峰值须处理）/ 未来 4 季票息；
- **堆叠柱**：每季一柱，下段到期本金、上段票息现金；41 季 2026Q4–2036Q4；
- **年带**（x 轴按日历年分组标注）、**峰值标注**（前若干高柱顶标数值）、**图例**、**脚注**（口径一句）；
- **文案语言**：随产品界面用**英文**（`bondChart` 同；测验图为中文，**非**同构要求）。标题类：`GOOGL · Quarterly debt service` / `Principal due` / `Coupon cash` / `USD bn-eq / quarter`；脚注：`Bloomberg-derived · internal use · gross cash flow, before cash & refinancing`。

### D7 口径（烘焙脚本逐字沿用，勿另起）

数据 `Securities` 表 82 行：计入 Corporates 78 行；排除 Preferreds 2（完全重复、强制转换性质）、Loans 2（无在外金额）。本金 = 到期日所在**日历季**的 `Amt Out`；票息 = `Coupon × Amt Out ÷ 频率`（`S/A`=6 月、`Annual`=12、`Qtrly`=3），付息日自 `First Coupon Date` 顺延至到期；**起算 2026Q4**（起点 2026-10-01，截至 2026-09-28）；视野 2026Q4–2036Q4；**不重估汇率**（`Amt Out` 为按发行日汇率折算的美元等值，原样用）；浮动利率 5 笔按当前票息外推；忽略 stub、计息天数、营业日顺延。这些口径**写入烘焙 JSON 的 `notes`** 并在 UI 脚注体现一句。

**对拍（硬验收）**：烘焙结果须与 `cabinet/reports/SFC-googl-quarterly-debt-pressure.html` 内 `#plotspec` JSON **逐季一致**（本金与票息各 41 个值，容差 `0.001` bn；笔数 `n` = 其 `nRef`）；KPI 四格对拍：`127.5 / 78 笔`、`35.2 · 28%`、`6.2`（2029Q1；2031Q3 为 `6.2` 并列）、`5.6`。对拍脚本放 `Ind-Chain/scripts/`（只在本机开发期跑，**输出不落仓、不含逐笔**）；进仓的单测夹具一律**合成数据**（方案 §8.2）。

---

## 指令正文（须完整执行；任务单逐条可勾）

### A. 数据与后端（`BE-DEBT` 窄口）

- **A1** `Ind-Chain/scripts/bake_debt_ladder.py`：按 D4 / D7 烘焙 `Ind-Chain/data/debt-ladder-googl.json`；写明用法；缺 `openpyxl` 时给出清晰错误。
- **A2** `server/debt_ladder.py` + `app.py` 增 `GET /api/debt/ladder`：ticker 归一化（大小写、`GOOGL US Equity` → `GOOGL`）；文件缺失/未知 ticker → `404` 短 JSON，**无绝对路径、无「请打开某文件」类字段**；沿 `nvda_links.py` 对 `data/` 的定位方式，勿另造路径逻辑。
- **A3** `.app` / `SFC_DATA_DIR` 路径下能找到该文件的方式与 `nvda-revenue-links.json` 同类；若不同请回报，不自造。
- **A4** W1 回归（沿 `GS-20261014-W1-modules-track.md` A1–A5）：静态 handler 仍不服务 `data/` 下任何文件（`/data/debt-ladder-googl.json` → 404）；FE 不 `fetch` 数据文件；黄金 60 项零差异。

### B. 前端（`FE-MAPPROJ` / `FE-MAPDRAW` / `FE-FOCUS` / `FE-API`）

- **B1** `map/proj.js`、`map/draw.js` 按 D5；`desc` 须 `JSON.stringify` 往返不变（自检项）。
- **B2** `api.js` 增 `fetchDebtLadder(ticker)`（唯一出口）；拿不到 → 返回 `null`，不抛到 UI。
- **B3** `bondChart.js` 的 `enterCompanyZoom` 按 D1 分派；**Demo Company 路径输出与改前字节一致**（取改前 `bondChartHtml(demo.bondSchedule)` 与舞台 innerHTML 作基线，改后对拍）。`focusPointTargets` 不动。
- **B4** `ui.js`：D2 的入口 chip（仅有序列的节点）；搜索命中路径自动开舞台；公司放大时仍隐藏全部 chrome，退出/Esc/点空白行为与现有放大舞台一致。
- **B5** 断网 / 服务端窄口 404：无入口、无报错横幅、无 console 错误风暴；放大舞台对 id 74 退化为现有 detail 内容。
- **B6** 不改 `scene.js` 的场景逻辑与相机约定；不改 `coords.js`；改 Three 之外的 2D 层即可。

### C. 视觉（可调度美工部）

允许并建议调度**美工部**（`art-department`）：放大舞台内的**图面皮**（KPI 四格网格、堆叠柱、年带、峰值标注、图例、脚注）、**plot token**（方案 §7.4：≤ 6 个新变量，只由现有 token 计算；本金 `--text`、票息 `--muted`，不引入新色相）、必要时**仅对本图**放宽 `#companyFocus` 宽度（以 class 修饰，不动旧 `bondChart` 面）。复核 `--accent` 用于峰值/高亮是否与 AESTHETIC 首页条款冲突（方案 §7.4 末条）。若美工部发现需补 `AESTHETIC §3` 管辖行（`Ind-Chain/web/js/map/**` 视觉层归美工部），**只回报**，改 `AESTHETIC.md` 须业主令或总参任务单（本令授权总参把这一行写入任务单一并改，若总参判断必要）。

### D. 模块图与 CONCEPTS

- **D1** `Ind-Chain/CONCEPTS.md`：增 `C-MAP2`、`C-PLOT`（含 D5 三项增量与 `kpis`）、`PM-LADDER-Q`（含「可并入 `PM-LADDER` 参数」待办注记）。只增本令所需，不扩写全目录。
- **D2** `modules/graph.json` 增：`FE-MAPPROJ`（`map/proj.js`，region 新区 `fe-map` 「平面映射」）、`FE-MAPDRAW`（`map/draw.js`，`fe-map`）、`BE-DEBT`（`server/debt_ladder.py`，`be`）。**模块 26 → 29**。拟增边：`FE-FOCUS → FE-MAPPROJ`（calls）、`FE-FOCUS → FE-MAPDRAW`（calls）、`FE-AESTHETIC → FE-MAPDRAW`（depends）、`BE-HTTP → BE-DEBT`（calls）；取数边（`FE-FOCUS` 或 `FE-PANEL` → `FE-API`，视主代理最终谁调用 `fetchDebtLadder`）若新增，一并计入；**边 35 → 39 或 40**，总参在任务单写死最终数。新区需扩视口并通过 `bake_static.py` 硬检（0 交叉 / 0 穿框，见 `cabinet/notes/20261014-modules-graph-v3-bus-layout.md`）；区色避开已用的绿/蓝/黄/灰。`python3 modules/bake_static.py` 重烘 `modules/index.html`。**此项在代码落定后做，作最后一道工序。**
- **D3** 说明：`FE-SCENE → FE-FOCUS`（depends）已存在，`FE-FOCUS` 今后依赖 2D 绘图，场景模块将**间接**带入 `map/*`。本令接受此事实，**不**为此改边方向；任务单记一行。

---

## 范围收窄说明（相对方案 §9 的 P1+P2）

**本令 = 定点 P2 切片**，只做业主点名的那一件事。收窄理由：方案要求 P0 冻结（Q1–Q5）先于全套 `fe-map`；业主「尝试用方案、在 GOOGL 节点上实现」是对**一张图**的授权，而不是对注册表、下拉目录与大模型接口的授权。全套会同时立 4 模块 + dock + 联动 + 导出，一令难以验收，且 Q6（导出通道，壳无下载委托）、R3（`revBn` 回退）等未决事项会被拖入。

**不做**（除非总参判断本令必须带某一项，并在任务单说明）：
1. 全映射目录 `Map ▾` 下拉与参数面板自动生成；
2. 其余 `PM-*` 映射（`PM-FRONT/STRIP/HEAT-SC` 等）与 `FE-MAPIN/REG/DOCK/OUT`；
3. 图 ↔ 立方体联动（`mapMarkIds`、`focusPointTargets.marked`）——无稳定元素 ID；
4. 导出闸（SVG/PNG/CSV）、脱敏闸——本令图只在应用内显示；
5. 大模型 / `BE-MAPNL` / 任何出站网络；
6. 改壳（`SFCShell.swift`）、重建并提交根目录 `Standard-Financial-Charting.app`；
7. xlsx 运行时摄入、`BE-DEBT` 完整债券要素表、`googl_fa_bs` 现金并列（`PM-LADDER-COVER`）、Demo 与 GOOGL 年↔季对照；
8. 其他公司的偿债序列（只做 GOOGL 一家）。

---

## 合规（硬）

1. **彭博加工物**：`googl_bond_full.xlsx` 与烘焙 JSON 均属彭博数据加工物（`PUBLIC-PRIVATE.md` 第三方数据条款）。
2. **聚合可演示，逐笔不进 UI**：UI、API、烘焙 JSON、CONCEPTS、令文回报都**不得出现逐笔明细**（单笔到期日、票息、面额、发行名）。悬停提示只给「季标 + 本金 + 票息」两数；不画 `n`。注意个别季（如 2027Q3 本金）仅一笔，季汇总近似单笔——这与业主所附图一致、可接受，**但不要再加更细的下钻**。
3. **烘焙 JSON 默认不进公开仓、不进 `-noentities` 外发包**：`Ind-Chain/data/debt-ladder-*.json` 加入 `.gitignore`；打包脚本对 `-noentities` 变体**排除**该文件（`internal` 变体可含）；缺文件时窄口 `404`、前端无入口，**这是预期降级**。理由：仓库公开期间 `Ind-Chain/data/*.json` 现有三份都在跟踪里，不应再添一份彭博聚合；`-noentities` 虽业主授权外发，但「授权」是对已列清单的授权，新增彭博加工聚合应由业主另令。若业主愿意放开，另令改这一条。
4. `PUBLIC-PRIVATE.md` 第三方数据条款第 1 档，由主代理增一句：`Ind-Chain/data/debt-ladder-*.json`（彭博债券聚合，仅内部）。**不得**把烘焙 JSON、对拍输出、含真实数值的 golden 提交；不 `git add` 本地测验产物。
5. **根目录已提交的 `.app` 不重建**（见「不做」6）：否则内嵌副本会把彭博聚合带进公开二进制。要在包内看到该图，走 `dist/internal`（git 忽略、仅内部）。总参须在任务单写明此点，并提醒主代理验收只用 dev 服务与 `dist/internal`。
6. **断网可用**：无 CDN、无外部字体、无出站网络；窄口只在 `127.0.0.1`。
7. 审查截图用完即毁（`PUBLIC-PRIVATE.md` 截图条款）；回报只写所见。

---

## 验收

1. **（硬）点开 GOOGL 能看到与测验图同构的季度压力图**：dev 服务 `:8787` 的 `/cube` 中，搜索 `GOOGL` → 放大舞台显示 KPI 四格 + 41 季堆叠柱 + 年带 + 峰值标注 + 图例 + 脚注（D6）；点节点 id 74 → detail 末出现 `Debt ladder` 入口 → 点击打开同图。id 85（DeepMind）**无**该入口。
2. **对拍（硬）**：烘焙 41 季本金/票息与测验 `#plotspec` 逐季一致；KPI 四格值与附图一致（D7）。
3. **Demo Company 不破**：搜索 `DEMO` 的放大舞台输出与改前字节一致；`bondChartHtml` 未删、未改行为。
4. **纯函数性质**：同输入两次 `project()` 输出字节相同；不满足 `requires` 不抛；`desc` 往返不变；`map/*` 不 import `scene/ui/api/state`。（本机无 node：自检页或回归脚本任选；若用自检页，**须排除出打包白名单** `SHELL-PACK`。）
4b. 进仓夹具为合成数据。
5. **断网可用**：断开网络下功能不变；删除烘焙 JSON 后：无入口、无报错、演示集其余行为不变。
6. **W1 / 黄金**：`regress_all.sh quick` 通过；黄金 60 项零差异；静态口不泄漏 `data/`；无绝对路径。
7. **模块图**：重烘后 29 模块 / 39–40 边（总参写定），0 交叉 / 0 穿框；附当时清单与关系展示（见下）。
8. **监理部三属**：工程测试（页面可开、无阻塞错误；截图用后即毁）、代码质量（不外溢、不重复造 bondChart、无未用抽象）、理念贯彻（DESIGN §1 债务风险 ✔；§2 沿用 token 与统一审美；§3 见下「理念风险」）。

**理念风险（提请监理部知悉，非阻塞）**：DESIGN §3 要求图能在统一三维空间里查看。本令的图在**放大舞台**内，是平面「读图面」，与方案 R10 同——它回答「GOOGL 这家公司的债务压力」，并通过「节点—图」的入口关系挂在立方体坐标之下，但**未做图 ↔ 立方体联动**（无稳定 ID，已明示）。这是有意的收窄，不是遗漏；远期（方案 R10）由「投影墙」承接。

---

## 调度提示

- **美工部**：可调（C 节）。
- **信息部**：**本令不需要**（预烘焙，不立正式摄入）。若总参判断烘焙口径需先清洗（如发现 `googl_bond_full.xlsx` 有本令未覆盖的脏行），才调 `desk=clean` 并回报业主；`desk=manage|request` 本令不用。正式 `BE-DEBT`（债券要素表、稳定 ID、币种/本币面额/汇率/赎回/摊还）仍留另令。
- **参谋纪要官 / 交叉整合部**：不用。
- 实施由主代理；完成后**父代理**送监理部（内阁不令）；之后进入内阁窗口，可据完成度再令（本周期剩余 4 次）。
- 外发边界提醒（总参须在任务单首页重申）：公开仓与 `-noentities` 外发包**默认不含**本令新增的彭博聚合文件；`cabinet/` 已进仓，本令文与回报只写结构性事实和聚合 KPI，不含逐笔。

## 最后一条：模块跟踪展示义务（`AUTHORITY.md`）

本令回报与后续每次内阁回报附当时模块清单与关系。**本令下达时**（改前，据 `modules/graph.json`）：26 模块 / 35 边（calls 16 · depends 16 · contract 3）。与本令相关者：`FE-OPENCUBE ─calls─► FE-API ─contract─► BE-HTTP`；`FE-OPENCUBE ─depends─► FE-SCENE ─depends─► FE-FOCUS`；`FE-OPENCUBE ─depends─► FE-PANEL`；`FE-AESTHETIC ─depends─► FE-PANEL`；`BE-HTTP ─calls─► BE-BUNDLE`。实施后目标：29 / 39–40（D2）。
