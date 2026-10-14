# 内阁 → 总参谋部指令

**令号** GS-20261014-SFC-RENAME-R2  
**日期** 2026-10-14  
**任务周期** 新周期（第二轮改名：SFC 品牌字样 + 前端模块 id 改名）  
**本周期内阁下令计数** **1 / 5**（本令为该周期第 1 次；谏言不计次；不含上一周期）  
**来源** 业主 Purkniv 原话「电内阁，不影响启动的就不用改了；然后开始第二轮改名，首先，位于前端冷启动的FIDV改成SFC,进入后logo后面跟着的当然也要改，也从 FIDV改成SFC,然后，下面那根绿线太长了，为什么要延伸到字母右侧那么多呢？不理解，把长的那部分去掉，然后整体重新居中；接下来进行模块改名，分为英文改名和添加中文注释两方面，FE-NAV--FE-NAV 导航；FE-GATE--FE-BOARD 展板；FE-LIST--FE-LIST 列表；FE-LISTING-UI--FE-LISTAREA 列表属地；FE-CUBE-BOOT--FE-OPENCUBE 跳转制图台；FE-COORD--FE-COORDONE 摆放坐标；FE-STATE--FE-ACTION 操作；FE-SCENE--FE-SCENE 场景；FE-CHROME--FE-PANEL 面板；FE-FOCUS-STAGE--FE-FOCUS 聚焦；FE-API--FE-API 接口；FE-AESTHETIC--FE-AESTHETIC 前端设计。」  
**依据** `cabinet/AUTHORITY.md` · 内阁出令前对仓库的实查（下「事实」节）· 上一周期令 `GS-20261014-global-rename.md`（已结，勿重做）  
**父代理动作** 将本文**完整**转交 `general-staff`，立意志与任务单。**调度建议见「分工」节**：A 面建议调度 `art-department`，B 面主代理 / 内阁自落（见下）。产品码变更后按既有规则送监理部。内阁不亲自改产品码；不令监理部 / 档案部。

---

## 意志（一句）

把业主眼前看到的牌子换成 SFC（Standard-Financial-Charting 的缩写），让那根线只托住字、整块居中；把模块图上 FE 十二块的名字换成业主定的新名并加中文名——**只动牌子与图，不动能启动的代码。**

---

## 总则：「不影响启动的就不用改了」界线（业主首句）

业主首句的意思，内阁定夺如下，勿再问业主：

1. 第一轮改名后仍残留的旧名、文档措辞，**不影响启动的，本轮不追**。本轮不做残留清扫。
2. 本轮**只做** A、B 两件事（A 含「线」与「居中」两个小项）。不借机清扫、不借机重构。
3. **不改**：`.js` / `.py` / `.css` 的**文件名**；代码里的**函数名、变量名、CSS 类名**（如 `.splash-logo`、`.home-logo`、`R_GATE`、`R_LUI` 之类）；`FIDV` 作为**仓库 / 项目名**的出现处（`library/`、`worklog`、`cabinet/` 史实、`Partner Work/`、`POWER-KNOWLEDGE.md` 等）；`BE-*` 全部模块 id；`MODULES-TRACK`；区域 id（`fe-decision` / `fe-cube` / `fe-api` / `be`）；边的 `type`。
4. 史实不改写（同上一周期）：`cabinet/orders/GS-2026101*`、`cabinet/notes/**`、`cabinet/reports/**`、`library/worklog-*`、已发布报告。读旧文请按下「改名对照」翻译（内阁已落 `cabinet/README.md`）。

---

## 事实（内阁实查，总参勿凭空重查，可抽检）

### A 面（前端品牌字样与线）

1. 冷启动页与首页页眉**共用同一段 SVG**，viewBox `0 0 280 72`：三片叠立方块（x 8–54）+ 文字 `<text x="72" y="48" font-size="34" letter-spacing="0.22em">FIDV</text>` + 绿线 `<line x1="72" y1="56" x2="248" y2="56" stroke="#8be0c0" stroke-width="1" opacity="0.55"/>`。
   - 出现处：`Ind-Chain/web/index.html` **两处**（冷启动 `#splash` 内 220×56；进入后 `.home-brand` 内 200×52）；`Ind-Chain/web/list.html` **一处**（页眉 logo，同款）。`cube.html` 无 `FIDV`。
2. **线为何过长（业主之问，内阁答）**：线终点写死 `x2=248`，长 176 单位；而 `FIDV` 四个字母在 34px 宋体系 + 0.22em 字距下，从 72 起只排到约 180–182（含尾部字距）。**超出字母右侧约 65 单位，是固定数字没跟文字走。** 换成 3 个字母 `SFC` 后文字更短（约 72→155），不改线则超出更多——所以必须改线。
3. 字母宽度**依赖字体回落**（`Iowan Old Style, Palatino Linotype, Palatino, Georgia, serif`，各机实际字体不同），**不得凭估算写死 x2**；须在浏览器里量（`getBBox()` / `getComputedTextLength()`）或用不依赖字体宽度的写法。
4. 「居中」两层：**冷启动页**由 `.splash{display:grid;place-items:center}` 把整个 SVG 盒居中；但 SVG 盒内内容（方块 8 起、线到 248 止）本身偏左右不对称。线缩短后，**盒内内容左右留白不等**，肉眼偏左。**须重新设 viewBox / 平移内容**，使「方块 + 字 + 线」这一整块的**视觉外接框**水平居中于盒中线（或收紧 viewBox 至内容外接框加等宽边距）。
5. 其他 `FIDV` 字样（**可见者**）：
   - `index.html:6` `<title>FIDV — Industry gate</title>`；`index.html:35` / `list.html:13` `aria-label="FIDV industry gate"`；`list.html:6` `<title>FIDV — Company list</title>`；`Ind-Chain/web/js/list.js:209` `document.title = ...FIDV — ${node.name}`。
   - 业主说「进入后 logo 后面跟着的」= 页眉 logo 里那个 `FIDV` 字母（`index.html` 第二段 SVG + `list.html` 的 SVG）。标签页标题与 `aria-label` 是同一品牌面的残字，**一并改 SFC**（成本为零、不影响启动、避免 logo 是 SFC 而标签页还写 FIDV 的割裂）。
6. 缓存：`index.html` 引用 `/css/app.css?v=41`。若 A 面改了 CSS，**版本号 +1**（`list.html` 同看），否则浏览器可能吃旧样式。若只改 SVG 内联则不必。
7. 同族 logo SVG 还可能在 `cube.html` 之外的页面？内阁已查：`web/` 下 `FIDV` 仅出现在 `index.html`、`list.html`、`js/list.js`。任务单实施前仍须 `rg -n 'FIDV' Ind-Chain/web` 自核一遍。

### B 面（模块 id 改名）

1. `modules/graph.json` **字段仅有** `id` / `side` / `region` / `role` 四个，**没有 `path` 字段**（业主令文里问的 `path`：现状无此字段，**本轮不新增**，见下「graph.json 字段处理」）。FE 节点 12 个，边 30 条（含 FE-* 的边 20 条，与 BE 无关）。
2. `modules/bake_static.py` **有硬编码**，共约 98 处 `FE-*` 引用，分五类：① `NODES` 几何表 L59–70（以 id 为键）；② 区域表 `REGION_OF` 之类 L76–81（以 id 为键）；③ 边的 `add(...)` 调用 L155–200（引用 id 与 `B()/T()/L()/R()` 锚点函数）；④ L480 `mid == "FE-API"`；⑤ 说明文字 L552、L651（lede：「CUBE-BOOT → AESTHETIC」等简称）。
   - **须注意**：烘焙逻辑里 id 既是 JSON 键又是几何键，**改名必须两处同改**，否则 `bake` 会 `KeyError` 或节点落到默认位。
3. `modules/index.html` 是烘焙产物（122 处 `FE-*`），**不手改**，改后跑 `python3 modules/bake_static.py` 重烘焙。
4. 节点盒标准尺寸 `NW, NH = 98, 28`（`bake_static.py:27`），节点内文字 `font-size=9.4`、居中。**中文名放进去会撑破盒子**（例：`FE-OPENCUBE 跳转制图台` 约 118 单位 > 98）。→ 见下「中文注释呈现」。
5. 代码内注释里引用模块 id 的只有两处（内阁实查）：`Ind-Chain/web/js/main.js:26` 注释 `// FE-CUBE-BOOT: ...`；`Ind-Chain/web/js/api.js:1` 注释 `FE-API`（不改名，不动）。`Ind-Chain/CONCEPTS.md:180` 只提 `FE-API`（不改名，不动）。**即：代码侧只需把 `main.js:26` 注释里的 `FE-CUBE-BOOT` 改 `FE-OPENCUBE`。**
6. 文档侧：根 `README.md`、`POWER-KNOWLEDGE.md`、`PUBLIC-PRIVATE.md`、`agent_tasklist/*.md`、`BE-CLASS/**` 经内阁 grep **无** 要改名的 `FE-*` 引用（零命中）。总参仍须在实施前用下节命令自核。
7. 与 BE-* **无重名冲突**：`FE-LISTAREA` ≠ `BE-LISTING`；`FE-COORDONE` 无后端对应；`FE-ACTION` 无冲突；`FE-FOCUS` 无冲突。

---

## A 面指令：品牌字样与绿线

### A1 字样

- `index.html` 冷启动 SVG（`#splash` 内）`FIDV` → `SFC`。
- `index.html` 进入后页眉 SVG（`.home-brand`）`FIDV` → `SFC`。
- `list.html` 页眉 SVG `FIDV` → `SFC`。
- 可见残字同改：上「事实 A.5」所列 `<title>` ×2、`aria-label` ×2、`list.js:209`。→ 均改 `SFC`。破折号 `—` 与其后英文原样保留（`SFC — Industry gate` 等）。
- **不改**：`.splash-logo` 等类名；仓库名 / 项目名 `FIDV`（`README`、`POWER-KNOWLEDGE.md` 等）；`modules/` 页内 `FIDV module relation graph` 的 aria（那是模块页，不是冷启动 / logo；业主本轮未提，**不追**）。

### A2 绿线：去掉超出字母的部分

- 线的**起点**保持与文字起点同 x；**终点**=最后一个字母的**可见字形右缘**，**不含**字尾 `letter-spacing` 的那一段空白（SVG 里 `letter-spacing` 会在末字后也加空隙；若用 `getComputedTextLength()` 量，须减去一个字距 `0.22em × 34 = 7.48`）。
- 终点须**随字体实际排版**而定，不是写死数字：实施用浏览器测量写入最终数值，或改用「线跟文字走」的写法（如把线与字放同一个可测量的框里）。**任选其一，但必须在 Safari / Chrome 各看一眼，线不得再超出字母右缘、也不得短于字母右缘**（允许 ±1 单位的取整差）。
- 线的**颜色、线宽、不透明度（`#8be0c0` / `1` / `0.55`）不变**——业主只嫌长，没嫌颜色。

### A3 整体重新居中

- 「整体」=方块三片 + 字 + 线，一整块。
- 对**冷启动页**：这块的水平外接框，须与屏幕中线对齐；做法是调 viewBox（或在 SVG 内整体 `translate`），使盒内外接框左右留白相等。
- 对**进入后页眉**（`.home-brand`，已 `text-align:center` + `.home-logo{margin:0 auto}`）与 `list.html` 页眉：同款 SVG 同样改线并重新居中；页眉的外层布局不变。
- 验收看**实际渲染**：用 `Ind-Chain/web/index.html` 在 `:8787` 下截图（冷启动期约 2 秒 + 淡出 4 秒，须在开页后即截，或临时延长 splash 仅用于验证，验证完还原）。左右两侧留白差 ≤ 2px。

### A 面分工

- **内阁建议调度 `art-department`**：A1–A3 属于「启动页（splash）+ logo + 整块 glass face」，正是 `art-department` 职权所在（读 `AESTHETIC.md`，在美学路径内实施）。总参谋部据 `agent_tasklist/art-department.md` 自行判定；**若总参判定本次只是三处字符串 + 一根线的几何、不触碰色板与玻璃壳，亦可由主代理直接落地，但须说明理由。** 内阁不替总参决断。
- 美工部范围限定：只许改 `index.html` / `list.html` 里的 SVG、`list.js:209` 的 title 字串，必要时 `app.css` 的 splash 规则；**不许**改 `app.js` 逻辑、`server/`、`graph.json`、`bake_static.py`。
- A 面不涉及 `Ind-Chain/server/`。

---

## B 面指令：模块改名与中文注释

### B1 改名对照（业主原定，勿改）

| # | 旧 id | 新 id | 中文名 | 是否改变 |
|---|--------|--------|--------|----------|
| 1 | `FE-NAV` | `FE-NAV` | 导航 | 仅加中文 |
| 2 | `FE-GATE` | **`FE-BOARD`** | 展板 | 改名 + 加中文 |
| 3 | `FE-LIST` | `FE-LIST` | 列表 | 仅加中文 |
| 4 | `FE-LISTING-UI` | **`FE-LISTAREA`** | 列表属地 | 改名 + 加中文 |
| 5 | `FE-CUBE-BOOT` | **`FE-OPENCUBE`** | 跳转制图台 | 改名 + 加中文 |
| 6 | `FE-COORD` | **`FE-COORDONE`** | 摆放坐标 | 改名 + 加中文 |
| 7 | `FE-STATE` | **`FE-ACTION`** | 操作 | 改名 + 加中文 |
| 8 | `FE-SCENE` | `FE-SCENE` | 场景 | 仅加中文 |
| 9 | `FE-CHROME` | **`FE-PANEL`** | 面板 | 改名 + 加中文 |
| 10 | `FE-FOCUS-STAGE` | **`FE-FOCUS`** | 聚焦 | 改名 + 加中文 |
| 11 | `FE-API` | `FE-API` | 接口 | 仅加中文 |
| 12 | `FE-AESTHETIC` | `FE-AESTHETIC` | 前端设计 | 仅加中文 |

实际改名 **7 个**（GATE、LISTING-UI、CUBE-BOOT、COORD、STATE、CHROME、FOCUS-STAGE）；其余 5 个只加中文。**BE-\* 十个与 `MODULES-TRACK` 一律不改，也不加中文名。**

### B2 界线（业主令文要求明确）

**改**（模块图 / 文档里的「模块 id」，以及注释里的 id 引用）：
- `modules/graph.json`：节点 `id`、边的 `from` / `to`。
- `modules/bake_static.py`：所有硬编码的 FE 模块 id 字串（几何表、区域表、边调用、`mid == "FE-API"`（不变）、说明文字里的简称）。
- `modules/index.html`：**不手改**，重烘焙得到。
- `Ind-Chain/web/js/main.js:26` 注释里的 `FE-CUBE-BOOT` → `FE-OPENCUBE`（唯一一处代码内引用；**只改注释文字**，不触函数）。
- `cabinet/README.md`：内阁已落「FE 模块改名对照」一节（内阁自落，总参勿动）。

**不改**（不影响启动）：
- JS / Python / CSS **文件名**（`home.js`、`list.js`、`nations.js`、`ui.js`、`state.js`、`coords.js`、`scene.js`、`main.js`、`api.js`、`bondChart.js`）。
- 代码里的函数名、变量名、DOM id、CSS 类名、事件名。
- `bake_static.py` 内部**变量名**（`R_GATE`、`R_LUI`、`XC_L` 等）——它们不是模块 id，**不要为了「名实一致」去改**。
- `modules/` 页面的区域 id 与区域标题。
- 已发布报告、历史令文、笔记（见总则 4）。
- `graph.json` 里**未被业主点名的**字段（`side` / `region` / `version` / `note` 的整体框架）。`note` 字段里若出现旧 id 简称（例：`GATE→BICS-HIER`、`CUBE-BOOT→BUNDLE`、`FE-API (region fe-api)`），**只改其中改名了的那几个简称，其余句子不动**；此项允许微调，不得借机重写。

### B3 `graph.json` 的 `path` / `role` 字段处理（业主令文要求给出）

1. **`path`**：`graph.json` 现状**没有此字段**（节点只有 `id` / `side` / `region` / `role`）。**本轮不新增、不补写。** 理由：不影响启动；且旧名 → 新名对应的真实代码文件名**不变**，补写只会造出一份会过期的指针。若业主将来要模块 ↔ 文件对照，**另令**一轮「补 `path`」，届时一次加全。参考（仅供总参 / 业主了解，**不入 graph.json**）：`FE-API`=`web/js/api.js`、`FE-OPENCUBE`=`web/js/main.js`（已核，`main.js:26` 注释即为证）；其余对应 `home.js` / `list.js` / `nations.js` / `ui.js` / `state.js` / `coords.js` / `scene.js` 的归属**内阁未逐一核实**，不得照抄入图。
2. **`role`**：英文描述句**原样保留**，**不随 id 改名重写**。内阁已核十二条 FE `role`，其中**没有任何一条把旧模块 id 写进句子里**（它们是描述语，如 `BICS L1–L3 gate board`、`Cube session state`），所以无需联动。**唯一允许微调**：`FE-BOARD` 的 role 现为 `BICS L1–L3 gate board`，里面的 `gate` 是普通英文词，**不是 id，不动**（若总参 / 业主希望与新名「board」呼应，可改成 `BICS L1–L3 board`，非必须）。
3. **新增一个可选字段 `zh`**（中文名），每个 FE 节点一个，值为 B1 表的「中文名」。BE 与 MODULES-TRACK **不加 `zh`**（`bake_static.py` 读取时 `m.get("zh")` 缺省回退为无）。这是本轮对 `graph.json` **唯一的新字段**。说明（供 `note` 字段一句话带过）：「FE 节点可有 `zh`（中文名）；缺省即无。」
4. `bake_static.py` 里生成 `<title>` 悬浮提示（L483 / L494）与底部表格（L698）时：`<title>` 改为 `FE-BOARD 展板 — <role>`；表格 `role` 列前或加一列「中文」，**总参选其一**，不得破坏现有表格与打印。

### B4 中文注释的呈现（图上每个 FE 节点旁加中文名）

业主要求：**图上每个 FE 模块节点旁加中文名**。落到节点盒（NW×NH=98×28，居中，9.4px）：

- **推荐做法**：节点盒内**两行**：第一行英文 id（字号 9.4、维持原样式），第二行中文名（字号约 8.2、灰一点，如 `MUTED`）。盒高 `NH` 28 → 约 34；FE 节点所在各行的**行距要相应放宽**，所有 `R_*`、`R1..R4`、`R_NAV` 等行坐标整体下推，并保持原有**无交叉、无重合的正交走线**（`bake_static.py` 注释写明：channel + edge-slot orthogonal polylines (no cross / no coincide)）。**这一条是 B 面里最容易出视觉回归的地方。**
- **备选**：保持一行，加宽 `NW`（98 → 约 130）以容下 `FE-OPENCUBE 跳转制图台` 这种最长的。但加宽会撑到框外或挤压通道，需重算 `XC_L`、`XC_R` 与区域框；**不推荐**。
- 无论哪种：BE 节点、枢纽条（`FE-API` 条是纵向窄条，宽 30，高 156）**不要因此变形**；`FE-API` 条的中文「接口」可放在条旁或 `<title>` 里，不强求写进条内。**总参 / 实施者自选，须在任务单说明；视觉验收以「所有文字不溢出盒、所有边仍不交叉」为准。**
- 区域标题与图例里若出现旧简称（`NAV → LIST`、`CUBE-BOOT → AESTHETIC`），按 B1 对照改（`NAV → LIST` 不变；`CUBE-BOOT → AESTHETIC` 改为 `OPENCUBE → AESTHETIC`）。

### B5 替换纪律（吸取上一周期教训）

- **禁止对全仓盲 sed。** 只对 `modules/graph.json`、`modules/bake_static.py`、`Ind-Chain/web/js/main.js`（一处注释）三个文件做。`modules/index.html` 走重烘焙。
- 先长串后短串的顺序仍须守：`FE-LISTING-UI` 先于 `FE-LIST`（`FE-LIST` 本身不改，但**正则 `\bFE-LIST\b` 会把 `FE-LISTING-UI` 误切成 `FE-LIST`+`ING-UI`**，须用 `FE-LIST(?![A-Z-])` 这类否定前瞻，或逐个精确串替换）。同理 `FE-COORD` 不会误碰他名，但仍用精确串。
- 区分大小写；只替换整 id（前后非 `[A-Z-]`）。
- 简称（无 `FE-` 前缀的 `GATE`、`CUBE-BOOT`、`STATE`、`COORD`、`CHROME`、`FOCUS-STAGE`、`LISTING-UI`）在 `bake_static.py` 的**注释与说明文字**里出现的，逐条人读后改；**函数 / 变量 / 键名里的子串不得误改**。

---

## 分工小结

| 面 | 谁做 | 说明 |
|----|------|------|
| A1–A3（SFC 字样、线、居中） | 建议 `art-department`；总参判定 | 触及 splash / logo，属美工部职权 |
| B1–B5（graph.json / bake_static.py / 重烘焙 / main.js 一处注释） | 主代理 | 无美学改动；但 B4 的节点两行化会改图版面，属**视觉面**——**总参可令美工部在 B4 上复核色与字号**，若判无新色则免 |
| `cabinet/README.md` 改名对照 | **内阁已落** | 总参勿动 |
| 书记 / 监理 | 既有流程 | 内阁不令 |

---

## 验收（总参任务单逐条可勾；全部过才算完）

**V1 A 字样**：`rg -n 'FIDV' Ind-Chain/web` **零命中**（`Ind-Chain/web/` 范围内；仓库级 `FIDV` 不在此范围）。`SFC` 出现在：`index.html` ×2（SVG）+ ×1（`<title>`）+ ×1（`aria-label`）；`list.html` ×1（SVG）+ ×1（`<title>`）+ ×1（`aria-label`）；`list.js:209` ×1。

**V2 A 线**：启动页与页眉、`list.html` 页眉三处，线终点与最后字母右缘一致（±1 单位）；用 `Ind-Chain/web` 在 `:8787` 下浏览器实截一张冷启动页、一张首页页眉、一张 `/list` 页眉；线不再有超出字母的尾巴（放大看）。

**V3 A 居中**：冷启动页方块 + 字 + 线整块左右留白差 ≤ 2px（量实际渲染，不是只看 SVG 数字）。页眉同看。

**V4 B id**：`rg -n --pcre2 'FE-(GATE|LISTING-UI|CUBE-BOOT|COORD(?!ONE)|STATE|CHROME|FOCUS-STAGE)' modules/graph.json modules/bake_static.py modules/index.html Ind-Chain/web` **零命中**（`FE-COORD(?!ONE)` 避免把新名 `FE-COORDONE` 误判为残留）。新 id 在 graph.json 与 bake_static.py 中**一一对应**，`python3 modules/bake_static.py` **成功退出**。

**V5 B 图**：`modules/index.html` 仍 **23 模块 / 30 边**（FE 12 · BE 10 · other 1；calls 15 · depends 13 · contract 2）；12 个 FE 节点**每个**都显示中文名；BE 节点**无**中文名；无任何节点文字溢出盒；所有边**仍无交叉、无重合**（对照改前图）；`file://` 可打开；`<title>` 悬浮 / 表格已体现新名 + 中文。

**V6 界线**：`git diff --stat` 里**只出现**：`Ind-Chain/web/index.html`、`Ind-Chain/web/list.html`、`Ind-Chain/web/js/list.js`、（若改）`Ind-Chain/web/css/app.css`、`Ind-Chain/web/js/main.js`（仅注释一行）、`modules/graph.json`、`modules/bake_static.py`、`modules/index.html`；**不得**出现 `server/`、其他 `.js` / `.py`、`library/`、`Partner Work/`、`cabinet/orders/GS-2026101*`（含本令）、`BE-*` 数据目录。

**V7 启动不退化**：`python3 Ind-Chain/server/app.py` 起，`/`、`/list`、`/cube`、`/modules/`、`/modules/graph.json`、`/api/health` 均 200；首页能进入、点 L4 能进列表、列表点公司能进 `/cube`；`main.js` 注释改动后 `node --check Ind-Chain/web/js/main.js`（若本机有 node）或开页无控制台报错。

**V8 缓存**：若改了 `app.css`，`?v=41` 已 +1，三处引用一致。

**不过即返工**：任一项失败，按失败项修，不得带病交监理。

---

## 总参任务单须含的几点

1. 逐文件改动清单（据「事实」与 B5）与每文件替换串；明示**禁止全仓盲 sed**、**区分大小写**、**不碰 Partner Work**。
2. 明写 A / B 分工与是否调度 `art-department` 的判定理由。
3. V1–V8 全部列为可勾验收；A 面验收须含**真实渲染截图**。
4. **不做**：不改 `BE-*`、`MODULES-TRACK`、区域 id；不改 `FIDV` 作仓库 / 项目名处；不改 JS / Python 文件名与函数名；不动 `Partner Work/`；不改 `library/` 与已发布报告；不改 `DESIGN.md`；不借机清扫第一轮残留；不 commit、不 push（除非业主另令）。
5. 记一条提示（不阻塞）：`cabinet/` 史实令文、旧笔记里的模块旧 id 不改写；读旧文按 `cabinet/README.md`「FE 模块改名对照」翻译。

---

*内阁本令计数 1/5。三监交回后，内阁据完成度判是否再令。*
