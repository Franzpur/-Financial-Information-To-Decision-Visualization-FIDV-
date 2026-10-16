# 内阁旁注 · 二重映射改革方案

**日期** 2026-10-16 · **业主令** 电内阁，要求为「二重映射改革」制定方案 · 只出方案 · 未令总参（理由见 §12）· 未改产品代码 · 未改 `modules/` · 未留截图

业主原话：

> 我正在思考关于二重映射改革的问题，这个意思是，原有的cube结构是为3种交互提供解决摆放、拖动问题，过程可视化，大模型按坐标工作问题的方案，也就是模块中的立方体面那一组，但是这对于成图却又不方便，所以我希望建立基于立方体坐标和元素的二重映射，二重映射未来也将成为一组模块，通过在立方体页面右侧添加一下拉列表，提供非常多样的映射选择，平面制图效果预览，来解决立方体到平面chart的投影问题，为我制定一下方案。

引用约定：`路径:行号` 为 2026-10-16 工作区实测。CONCEPTS 指 `Ind-Chain/CONCEPTS.md`。

---

## 0. 一页摘要

1. **一句话定义**：二重映射 = 第一重 Φ1（元素 → 立方体坐标，已有）+ 第二重 Φ2（立方体坐标与元素 → 平面图，新增）。Φ2 只读、纯函数、输出与渲染分离，不写回立方体。
2. **新增一组模块**「平面映射」（区 `fe-map`）：`FE-MAPIN`、`FE-MAPREG`、`FE-MAPPROJ`、`FE-MAPDRAW`、`FE-MAPDOCK`、`FE-MAPOUT`，另留 P4 可选 `BE-MAPNL`。现图 26 模块 / 35 边，按 P1→P4 逐步到 33 / 48。P1–P3 **后端零改动**（W1 不动）。
3. **先做三个**（仓内数据现成）：`PM-FRONT` 正视、`PM-STRIP` 带状点图、`PM-HEAT-SC` 切片×上市地热力矩阵；P2 加 `PM-LADDER` 债务期限梯，与现有 `bondChart` 对照。
4. **三条纠偏**（§1）：(a) 立方体面今天落地的只有「读图交互」，作图三交互与 `ChartSpec` 仍是研判、仓内无代码；(b) 「拖动」在仓里是**禁止拖对象、只平移相机**；(c) `x, y` 在两种出图模式里信息含量很低（角度是装饰），**三视图的分析价值被高估**，真正有信息的是 `s`、环半径、半盘侧别和属性通道。
5. **最大的三个风险**：链模式 `revBn` 有三级回退而载荷里不标出（§10 R3）；`.app` 的 WKWebView 没有下载委托，导出通道要另选（§8、Q6）；本机没有 node，纯函数的单测要换办法（§9 P1）。
6. 待业主拍板 12 项（§11），阻塞 P0 的只有 Q1–Q5，均已给推荐。

---

## 1. 我对业主原话的理解（含三处纠偏）

### 1.1 采用的理解

- 「3种交互」：按内阁 2026-10-15 读本 `cabinet/reports/SFC-three-interaction-modes-and-llm-view.html`，即 ① 简单自然语言指令、② 表类数据输入、③ 手动制图操作。**这是我的理解，业主若另指（例如三类坐标），请更正**；两种读法下本方案的 Φ2 设计不变，变的只是 §1.2(a) 的叙述。
- 「摆放、拖动、过程可视化、大模型按坐标工作」：立方体把对象放进一套**唯一的坐标语言**（`coords.js`），人与模型都按这套坐标说话，不碰像素和 Three.js 原始坐标。
- 「立方体面那一组」：`modules/graph.json` 中 `region = fe-cube`（图上标签「立方体面」），7 个模块：`FE-OPENCUBE`、`FE-ACTION`、`FE-COORDONE`、`FE-SCENE`、`FE-PANEL`、`FE-FOCUS`、`FE-AESTHETIC`（`graph.json` 各模块 `region` 字段；`modules/bake_static.py:104` 的 `chip="立方体面"`）。
- 「二重映射成为一组模块」：新开一区，与「决策路径」「立方体面」并列，不并入立方体面。

### 1.2 纠偏

**(a) 作图三交互今天并未落地。** 立方体面现在实现的是**读图交互**：聚焦、钉住、过滤、A/F、间距 d、标准视角、公司放大（`state.js:35-65`；CONCEPTS 96-103、114-120）。作图侧（节点增删、切片重排、传导边编辑、表粘贴、自然语言）停在研判层：全仓 `rg -i chartspec|compile_chart` 在 `Ind-Chain/` 下无命中。`ChartSpec` 只存在于 `cabinet/reports/SFC-interactive-autonomous-charting-view.html` §4。所以「立方体为 3 种交互提供方案」应读作：**坐标语言与渲染面已备好、作图入口未建**。

**(b) 「拖动」今天是平移相机，不是拖对象。** CONCEPTS 148-149：左键拖动 = pan，右键拖动 = orbit。三交互读本明确**禁止拖拽对象改 `(x, y)`**（§1.3：面内半径代表金融数值，拖动等于伪造数据）。立方体解决「拖动问题」的办法是：不给对象拖动，位置只由 Φ1 算出。这条对 Φ2 很要紧：**平面图一律只读，不提供拖点改数。**

**(c) `x, y` 的信息含量很低。**

| 模式 | `(ringCos, ringSin)` 来源 | 真正携带信息的量 | 出处 |
|------|--------------------------|------------------|------|
| demo（演示集 96 家 / 11 层） | 半径 = 层内营收 min–max 环分数；**角度 = 均匀撒点 + 环号与层号偏置（装饰）** | 半径、层号 | `db.py:148`；`db.py:166-184`；CONCEPTS 183 |
| chain（NVDA，48 对手方） | 半径 = 全局半盘内关联占比线性映射；**角度 = 同侧按名称排序后均分（装饰）**；半盘侧别 = 供应商 / 客户 | 半径、侧别（`x<5` 供应商，`x>5` 客户） | `chain_layout.py:23-52`（`:45` 半径公式）；`nvda_links.py:393-394`（`placeMode: link-hemisphere`） |
| shell（一家公司） | 无；固定 `(5, 5, 5)` | 无 | `db_shadow.py:42-60`；`coords.js:155-159` |

结论：沿 `s`、`x`、`y` 的**正交三视图**主要是「把立方体压平」，其中 `y` 基本是噪声；分析价值在**属性通道**（营收、占比、行业码、上市地、债务期限）和**聚合**。目录里据此降级侧视，升级通道类与聚合类（§4）。

---

## 2. 现状真源核实

### 2.1 三类坐标

| 类 | 名 | 字段 | 含义与来源 | 出处 |
|----|----|------|-----------|------|
| 1 类 | 位置坐标 | `(s, x, y)` | 立方体里**唯一**摆放语言。`s` 切片序（层 `i` ⇒ `s = i`）；面内 `x, y ∈ [0,10]`；`1 s = 1 x = 1 y = UNIT`；右 `+x`、上 `+y`、前 `+s`；`USER_X_SIGN = -1` | CONCEPTS 42、63-72；`coords.js:25-36, 38-69, 96-103` |
| 2 类 | 相对坐标 | `ringCos`, `ringSin` ∈ [-1,1] | 环上位置，**不叫 x、y**；`companyCoord()` 把它投成位置：`x = 5 + (-1)·ringCos·3.8`，`y = 5 + ringSin·3.8` | CONCEPTS 72；`coords.js:146-152`；`LAYOUT.ringRadius = 3.8`（`coords.js:42`） |
| 3 类 | 行业坐标 | `legalEntityCoord` | BICS 7×2 连字符；企业主业空 `% Tot Rev` 时前加 `-`；chrome 只画前 4 段；**不参与摆放、不画在立方体上**。demo 公司此字段恒为 `""` | CONCEPTS 73；`coords.js:224-232`；`db.py:237` |

另有：`C-MAP` 用户→Three（`coordToLocal`，随 `gap = d·UNIT`）。**`d` 与相机只影响世界米数，不改用户坐标**（CONCEPTS 70；`coords.js:96-103`）。这决定了 Φ2 的输入里**不含相机、不含 d**。

### 2.2 立方体怎么摆放 / 抽出 / 焦点

| 事项 | 现状 | 出处 |
|------|------|------|
| 摆放 | 场景只经 `applyCoord` / `applySliceCoord`；公司 `c.coord` 由场景在建点时写入 | `scene.js:188-203`；写入点 `scene.js:611`（壳）、`scene.js:624`（片内） |
| 壳层坐标 | `shellCompanyCoord` 住在 `scene.js:309-316`，不在 `coords.js` | 同左 |
| 抽出 / 留驻 | Stay = 钉住 ∪ 焦点；非 stay 就地隐藏（无 −x 停靠） | CONCEPTS 96-97、114；`state.js:81-89`；`scene.js:1004-1021` |
| 焦点 / 选中 | `focusLayer`、`selectedId`；选中非壳公司会**同时设焦点**，从而改变 stay 集 | `scene.js:1073-1089` |
| 过滤 | `filterMode` = all / us / intl（`country === "US"`） | `state.js:71-75` |
| 相机约定 | 改焦点 / 抽回**不动相机**；正视位姿 `(s*+10, 5, 5)` 看向 `(s*, 5, 5)`，即从 `+s` 正对面心 | CONCEPTS 123-125、137 |
| 服务端排环 | 浏览器不重算环 | CONCEPTS 225（冻结约定 7） |

### 2.3 「过程可视化」与「大模型按坐标工作」今天指什么

- **过程可视化**：对象状态变化在同一三维空间里连续可见——切片抽出 / 淡出（`lerpPullOut`、`lerpVisibility`）、间距 d 拖拽、标准视角动画、公司放大舞台（CONCEPTS 194-212 符号表）。今天它可视化的是**读图过程**；作图过程（增删节点、改规则）尚无。
- **大模型按坐标工作**：CONCEPTS 首段把本文定义为「agent-pointing 概念靶向库」（CONCEPTS 5-6、17-24）：模型用概念 ID 与坐标元组指称对象，不指像素、不指 mesh。三交互读本进一步规定：模型只输出**操作意图**，不输出坐标浮点，不写无源数据（读本 §2.2 铁律一）。`modular-interface-scheme.md:169-177`、`181-193` 同旨：场景不读 sqlite、不按风险上色、不写 Three 原始坐标。
- 以上两点是**契约**：Φ2 必须沿用同一套词汇与同一条「只给意图、不给数值」的线。

### 2.4 现有平面图与取数

仓内唯一一张平面图：`bondChart.js` 的债券期限折线（`bondChart.js:26-97` `bondChartHtml`），手写 SVG（`viewBox 560×140`，三条线 total / principal / interest）。

```
db.py:205-240  row_company：bond_schedule(JSON 文本) → bondSchedule[{year,principalBn,interestBn,totalBn}]
bondChart.js:160  companyFocusBody.innerHTML = detailMarkup(c) + bondChartHtml(c.bondSchedule)
ui.js:427-443     onSelect(meta.standardView) → scheduleCompanyZoom → enterCompanyZoom
```

- 触发条件窄：**仅搜索命中路径**进入公司放大舞台（CONCEPTS 119）；点面、点名单行不触发。
- 数据窄：全仓只有 Demo Company 一家有 `bond_schedule`（`companies.json:961`；README 66），30 个年度、**演示数值**。
- 渲染与数据**耦合在一个函数里**（取数 + 刻度 + 拼 SVG 字符串）；无 chart-spec 层。
- 同文件还承载 `focusPointTargets`（点高亮目标，`bondChart.js:99-125`），被 `scene.js:39` 引用，调用处 `scene.js:1121`。

### 2.5 `cube.html` 右侧现有版面

| 元素 | 位置 | 出处 |
|------|------|------|
| `?` 帮助钮 | 右上 `top:14 right:14`，28×28 | `css/app.css:1133-1148`；`cube.html:52` |
| Home 链 | `top:14 right:50` | `app.css:180-186`；`cube.html:51` |
| `#detailPanel`（`.float-detail`） | `top:64 right:14`，宽 `min(300px, 100%-28px)`，`max-height: 100%-140px`，可滚动 | `app.css:244-267`；`cube.html:54-59` |
| `#dBox`（间距 d） | 右下 `bottom:14 right:14`，宽 220 | `app.css:973-989`；`cube.html:82-92` |
| 公司放大舞台 `#companyFocus` | 左下大面，宽 `min(64%,760px)`，高 `min(82%,…)` | `app.css:283-308`；`cube.html:61-66` |
| 左侧 Filter / A/F、顶栏搜索、`nav-hint`（`top:64 left:14`） | 左上 | `app.css:95-112, 188-198, 1098-1116` |
| 公司放大时隐藏全部 chrome | `.company-zoom` 选择器列表 | `app.css:76-93` |
| ≤980px 时右卡缩为 `280px`，`top:64` | 媒体查询 | `app.css:1248-1266` |

右栏上段（`top:64` 起）已被 detail 占用，右下是 d 盒；`top:56` 一行目前是空的（左侧 A/F 在 `top:56`）。

### 2.6 当前数据能给 Φ2 什么

| 来源（`meta.mode`） | 元素 | 可用通道 | 要点 |
|---------------------|------|----------|------|
| demo（裸 `/cube`） | 96 家、11 层 | `layer`、`revBn`（**演示数值**，CONCEPTS 175）、`country`（ISO 码：美 70，其余 13 国）、`ring`、`revScore`、`ringCos/Sin`、`valueM`（仅 16 家非空）、`note` | `legalEntityCoord` 恒空；`bondSchedule` 仅 1 家 |
| chain（`?ticker=NVDA`） | 中心 + 48 对手方（供 24 / 客 24） | `layer`（= 主业 L4 切片序）、`side`、`linkPct`、`revBn`、`country`（只有 `US`/`INTL`）、`legalEntityCoord`、`revenueLinks[{fromId,toId,side,pct}]` | `linkPct` 非空：供应商 **1/24**、客户 **14/24**；`revBn` 为**三级回退**（见 R3） |
| shell（其余 ticker） | 1 家 | `revBn`、`country`、`legalEntityCoord`、`s=x=y=5` | 无切片、无环、无连线 |
| 仓内有数据、**载荷里没有** | — | 成员库主业行（`pct_tot_rev`、`ind_rev`、`segments`，`GET /api/bics/entities`）、BICS 节点名（`GET /api/bics/node`，`api.js:47-50`）、`BE-DATA/ICBC C/928/googl_bond_full.xlsx`（债券 82 行：到期日、在外金额、票息、利差等）、`googl_fa_bs.xlsx`（FY2016–FY2025 资产负债表） | 需要新取数口或摄入；债券与财务表**无摄入、无 API**（`modular-interface-scheme.md:197-207` 债务线仍是预留） |

### 2.7 模块图现状（附展示义务）

`modules/graph.json`：**26 模块 / 35 边**（实测：模块 FE 12 + SHELL 3 + BE 10 + other 1；边 calls 16 / depends 16 / contract 3）。立方体面一区 7 模块与区内外连线：

```
FE-OPENCUBE ──depends──► FE-ACTION / FE-COORDONE / FE-SCENE / FE-PANEL
FE-SCENE    ──calls────► FE-COORDONE        FE-SCENE ──depends──► FE-FOCUS
FE-AESTHETIC ─depends──► FE-BOARD / FE-LIST / FE-PANEL
FE-OPENCUBE ──calls────► FE-API ──contract──► BE-HTTP
```

Φ2 新区接入点见 §6。

### 2.8 旧文漂移（读旧文请注意，不改史实）

- `cabinet/modular-interface-scheme.md` 仍写 `ind-chain/`、`class-3-coords/`，并称收入线文件有 `links` / `held`；现文件顶层键是 `peers`（`nvda_links.py:347`）。
- 2026-10-15 两份读本引用 `app.py` 行号（如 `:1253`、`:576–939`）已失效（拆分后 `app.py` 为 354 行）；写「6 层」，实为 11 层（`layers.json`）；连线色 `#1f7a5a/#9e3a34` 与现 `state.js:15-17` 的 `0x3d8f6a/0xa04848` 不一致。本方案以 `state.js` 为准。

---

## 3. 概念定义

### 3.1 形式化

```
E   元素集：公司点、收入线、切片（今天的 state.companies / revenueLinks / layers）
C   立方体坐标：每个元素的 (s, x, y) ⊕ (ringCos, ringSin) ⊕ legalEntityCoord
Φ1  E → C         第一重映射（已有，位于服务端排环 + coords.js；不在本改革范围）
Φ2  (E, C, p) → P 第二重映射（新增）：P 为平面图规约 PlotSpec
R   P → 像素/SVG   渲染（与 Φ2 分离）
```

- Φ1 今天硬编码在 `db.assign_rings`（`db.py:187-202`）与 `chain_layout.assign_chain_rings`（`chain_layout.py:55-88`）。内阁读本设想把它声明化为 `ChartSpec`（3D 作图规约）。**本改革不碰 Φ1。**
- 两份规约对称、互不替代：`ChartSpec` 决定**立方体里放什么**（作图）；`PlotSpec` 决定**把立方体里已有的东西投到哪张平面图**（成图）。命名上避开冲突：平面规约一律叫 **PlotSpec**，映射 ID 前缀 **`PM-`**。

### 3.2 与三类坐标的关系

| Φ2 读取 | 方式 |
|---------|------|
| 1 类 `(s, x, y)` | 经 `coords.js` 的 `companyCoord` / `SHELL_ANCHOR` 取得，**不读 mesh、不读 `c.coord`**（后者由场景副作用写入，`scene.js:611, 624`） |
| 2 类 | 经 `radial = hypot(ringCos, ringSin)`、`side` 等**派生通道**使用；原始 `ringCos/Sin` 仍可读 |
| 3 类 | 经 `legalEntityCoord` 切成 `seg1..seg4`（沿用 `displayIndustryCoord` 的 4 段口径，`coords.js:224-232`） |
| 属性 | `revBn`、`linkPct`、`country`、`valueM`、`bondSchedule`…… 按载荷白名单 |
| 不读 | 相机、`d`、mesh、DOM、sqlite、BE-DATA 文件 |

### 3.3 不破坏「大模型按坐标工作」的五条

1. **词汇同源**：映射通道名 = 字段名 = CONCEPTS 的概念名（`s, x, y, ringCos, ringSin, legalEntityCoord`），不另起术语（DESIGN §2「同一概念只用一个名字」）。
2. **Φ2 只读**：不写回 `state` 的坐标与布局；联动只经「标记集」（§7.3），不经 `selectCompany` 的焦点副作用。
3. **共用量原值输出**：凡与立方体共用的量（`s, x, y, radial`）在 PlotSpec 里**原值**，不重标定；Φ2 可有自己的刻度，但不得反写 Φ1（CONCEPTS 225）。
4. **模型只给意图**：P4 里模型输出限于 `{mappingId, params, selector}`，经描述符 schema 校验；不输出数值、不输出名称之外的明细、不输出 SVG/JS。
5. **选择器是坐标谓词**：`selector` 用坐标语言写，如 `{ s:[3,5], industry:"10-10", side:"customer" }`，由 Φ2 确定性求值；人在面板里、模型在命令里用**同一个**选择器。

---

## 4. 映射目录设想

记法：数据层级 **✔** 载荷内现成；**◐** 仓内有数据，需新取数口或摄入；**✘** 需新数据 / 新模型。模式栏标 demo / chain / shell 是否有意义。★ = 按 DESIGN §1（债务风险、传导关系、集中度）应优先。

### 4.1 目录

| ID | 名称 | 家族 | 输入通道 | 输出平面轴 | 金融场景 | 数据 | 模式 | 阶段 |
|----|------|------|----------|-----------|----------|------|------|------|
| `PM-FRONT` | 正视 | A 正交 | `x, y`；`revBn`→大小；`country`→色 | X=`x`，Y=`y`（保留 0–10 与环导线） | 把单片 / stay 片压成一张面图；**即「标准聚焦视角」的平面版** | ✔ | chain 有义（侧别+半径）；demo 角度装饰→默认 `radial-only`；shell 1 点 | **P1** |
| `PM-TOP` | 俯视 | A | `s, x` | X=`s`，Y=`x` | 供应 / 客户半盘随切片序的分布 | ✔ | chain 有义；demo 弱 | P3 |
| `PM-SIDE` | 侧视 | A | `s, y` | X=`s`，Y=`y` | 完整性；`y` 近乎噪声（§1.2c） | ✔ | 低信息量 | P3 末，可不做 |
| `PM-STRIP` | 带状点图 | B 通道 | `s`；`revBn`；`country` | 带=切片，X=`revBn`（线性/对数） | 同切片内规模分布、头部离散度 | ✔ | demo/chain 有义 | **P1** ★ |
| `PM-RANK` | 排名条形 | B | `revBn`、名称、`s` | 条长=`revBn`，可按切片分面 | 规模排序、成图导出主力 | ✔ | 全 | P3 |
| `PM-SCATTER` | 双通道散点 | B | 任选两个数值通道（`revBn, linkPct, score, radial, s`），大小、色 | 自选 | 规模 vs 关联占比 | ✔ | chain 的 `linkPct` 稀疏（供 1/24），缺值入「n/a 带」，**不插补** | P3 |
| `PM-HEAT-SC` | 切片×上市地矩阵 | C 矩阵 | `s`；`country` | 行=切片，列=国家 / 美非美；格=家数或 Σ`revBn` | 地域集中度、非美暴露 | ✔ | demo 列为 ISO 国家；chain 列仅 US/INTL | **P1** ★ |
| `PM-HEAT-RING` | 切片×环号占用 | C | `s, ring` | 行=切片，列=环 0–10 | 环分数分布（信息量低） | ✔ | 全 | P3 |
| `PM-HEAT-BICS` | 行业码×上市地矩阵 | C | `seg1..seg4`；`country` | 行=BICS 前缀，列=国家 | 行业×地域对标 | ✔ | chain/shell 有；**demo ✘（码为空）** | P3 |
| `PM-TREE` | BICS 层级树 | D 层级 | `seg1..seg4`；BICS 节点名 | 缩进树 / 节点链接 | 当前元素在 BICS 树上的位置 | ◐ L1–L3 名称需 `fetchBicsNode` | chain/shell | P3 |
| `PM-TREEMAP` | 树图 | D | 同上 + `revBn` 面积 | 嵌套矩形 | 规模占比（样本内） | ◐ | chain | P3 |
| `PM-SANKEY` | 桑基 | E 关系 | `revenueLinks{side,pct}`、`s` | 左供应商 → 中心 → 右客户，宽=`pct` | 单锚点上下游暴露、传导关系 | ✔ | chain；**供应商侧 1/24 有占比**，无占比者画细线并标 n/a | P3 ★ |
| `PM-NET` | 径向网络（确定性布局） | E | 连线 + `s` + `radial` | 极坐标：角=侧别/切片序，径=`radial` | 传导关系平面化、可导出 | ✔ | chain（现星型） | P3 |
| `PM-CHORD` | 弦图 | E | 切片×切片连线量 | 圆周弦 | 跨层传导 | ✘ 现数据为星型，退化；待多跳数据 | — | 暂缓 |
| `PM-LADDER` | 债务期限梯 | F 时间 | `bondSchedule{year,principalBn,interestBn,totalBn}` | X=年，Y=$bn（本金/利息堆叠） | 再融资悬崖、到期集中；**DESIGN §1 债务风险** | ✔ 仅 Demo Company（演示值）；◐ GOOGL 债券表未摄入 | 单公司 | **P2**（与 `bondChart` 对照）★ |
| `PM-LINE-FA` | 财务科目时序 | F | 资产负债表科目×年 | X=年，Y=科目值 | 杠杆 / 流动性趋势 | ◐ `googl_fa_bs.xlsx` 未摄入 | 单公司 | P3 之后 |
| `PM-STRESS` | 情景演进 | F | 情景梯度 | 小多图 | 压力测试 | ✘ 新数据 + 新模型（对应 ChartSpec 形式 VI） | — | 远期 |
| `PM-CONC` | 集中度（CR1/CR3/HHI、洛伦兹） | H 占比 | `revBn`，按 `s` | 条 / 曲线 | 切片内寡头程度；**必须标「样本内」**（样本不是市场） | ✔ | demo/chain | P3 ★ |

**小多图不立 ID**：它是通用参数 `facet: "slice" | "side" | "country"`，任何映射都可开（P3）。

### 4.2 数据层级汇总

- ✔ 现成可做：`PM-FRONT/TOP/SIDE/STRIP/RANK/SCATTER/HEAT-SC/HEAT-RING/HEAT-BICS/SANKEY/NET/CONC`，及 `PM-LADDER`（仅演示公司）。
- ◐ 仓内有数据、缺取数口：`PM-TREE/TREEMAP`（要 BICS 名）、`PM-LADDER` 的真实债券、`PM-LINE-FA`。
- ✘ 需新数据：`PM-CHORD`（多跳）、`PM-STRESS`、其他公司的债务期限。

### 4.3 对目录的两条取舍

1. 以 **属性通道与聚合**为主，坐标直投为辅（§1.2c）。
2. `PM-CONC`、`PM-TREEMAP` 的占比若基于对手方样本，会被读成市场结构。描述符里设 `basis: "sample"`，图上固定写「样本内 / sample only」。

---

## 5. 接口设计

### 5.1 三个数据件

```
MapInput（FE-MAPIN 生成的只读快照，v1）
{
  v: 1,
  meta:   { mode:"demo|shell|chain", placeMode, title, illustrative:bool,
            sources:[…],               // 由各元素 source/sourceDetail 去重
            thirdParty:bool },         // 含 bics-entity / nvda-revenue-links 来源即 true
  slices: [{ s, id, name, count }],
  elements:[{ id, name, ticker, s, x, y, ringCos, ringSin, radial, score, side,
              country, revBn, revBnBasis, linkPct, valueM,
              industry:{ coord, seg:[…≤4] }, bond:[…]?, inScope:bool }],
  links:  [{ fromId, toId, side, pct }],
  view:   { focusLayer, pinned:[…], selectedId, filterMode }   // 仅作选择器与标记，不含相机、不含 d
}
```

```
Descriptor（描述符：JSON 可序列化，随映射文件导出）
{
  id:"PM-STRIP", v:1, name:{zh:"带状点图", en:"Strip plot"}, family:"channel",
  requires:{ channels:["s","revBn"], modes:["demo","chain"], minElements:2 },
  coordUse:{ coords:["s"], attrs:["revBn","country"] },
  channelSemantics:{ revBn:"demo=illustrative; chain=see revBnBasis" },
  params:[ {key:"scale", type:"enum", values:["linear","log"], default:"log"},
           {key:"scope", type:"enum", values:["follow","all"], default:"follow"} ],
  facetable:true, basis:"sample|population", disclosure:"aggregate|named",
  dataTier:"bundle|bundle+api|new-data"
}
```

```
PlotSpec（Φ2 的输出，渲染无关，v1）
{
  v:1, mappingId, params:{…有效值…},
  basis:{ mode, placeMode, n, excluded:[{reason, count}] },
  title, subtitle,
  scales:[{ id:"x", kind:"linear|log|band", domain:[…], label, unit }],
  axes:[…],
  marks:[{ type:"point|rect|line|text|link", ref:[元素id…],   // 聚合格可含多个 ref
           x, y, w, h, size, tone:"us|intl|neutral|supplier|customer|muted|mark",
           label? }],
  legend:[{ tone, text }],
  notes:["demo values are illustrative", "linkPct missing for 23/24 suppliers"],
  provenance:{ sources:[…], illustrative:bool, thirdParty:bool }
}
```

### 5.2 契约（写进 P0 冻结）

```
project(input: MapInput, params: object): PlotSpec        // 纯函数
```

- **纯**：无 DOM、无 fetch、无 `Date.now` / `Math.random`；同输入同输出，**字节相同**（数字定精度，元素按 `id` 稳定排序）。这是可做 golden 的前提（`regress_api_golden.py` 的思路，`Ind-Chain/README.md:64`）。
- **不抛**：不满足 `requires` 或参数非法时返回 `{ ok:false, reason, hint }` 的空规约，上游只见「缺」，不见异常（对应 `modular-interface-scheme.md:7` 风险隔离原则）。
- **`tone` 不是颜色**：规约只写语义色标，渲染器映射到现有 token（us/intl 来自 `--us/--intl`，supplier/customer 来自 `COLORS.LINK_*`，`state.js:15-17`；其余来自 AESTHETIC 色板）。参数里**不允许**出现颜色，等于把 AESTHETIC §2「语义色不动」写进接口。
- **`ref`**：每个标记回指元素 `id`，这是联动与导出脱敏的共同基础。
- **与业主建议的签名对照**：业主建议 `project(elements, coords, params)`。我把 `elements` 与 `coords` 合入 `MapInput`，避免二者错位（坐标本就是元素的字段）；语义等价。

### 5.3 注册表

- 一映射一文件，文件导出 `{ desc, project }`；`desc` 必须 `JSON.stringify` 往返不变（自检项）。
- 目录：`Ind-Chain/web/js/map/`（`in.js`、`reg.js`、`proj.js`、`draw.js`、`dock.js`、`out.js`），映射放 `map/catalog/pm-*.js`。沿用仓内 `?v=NN` 缓存口令的导入惯例。
- 业主建议「JSON 描述 + 纯函数」：推荐 **JS 模块里的 JSON 纯对象 `desc`**，而不是独立 `.json` 文件。理由：浏览器 ES 模块导入 JSON 需 import attributes，`.app` 内 WKWebView 的最低系统版本未核；独立 `.json` 则需异步 `fetch` + 打包白名单多一项。`reg.js` 提供 `descriptorsJson()` 导出整份目录给文档与 P4 模型，等效于「JSON 描述」。
- 注册表职责：`list(input)` → 带「可用 / 不可用+原因」的目录（按模式过滤，如 demo 下 `PM-HEAT-BICS` 置灰「行业码为空」）；`get(id)`；`run(id, input, params)` = 校验 + `project` + 兜底。

### 5.4 渲染与参数面板

- `FE-MAPDRAW`：`PlotSpec → SVG 字符串`，只认 5 种标记、3 种刻度，**不知道数据来自哪**。后续 `bondChart` 可改为调用它（P3 评估）。
- 参数面板：由描述符 `params` **自动生成**（enum → 小下拉，bool → 开关，number → 步进滑块）；不为单个映射手写表单。

### 5.5 取数口与 W1

P1–P3 `MAP*` **不 fetch**，不新增 `/api/*`。需要 BICS 名（`PM-TREE`）或成员库（cohort）时，唯一路径是 `FE-API` 新增函数（`api.js` 单一出口，M2 已收拢），并由 `FE-MAPIN` 调用；该改动单列、不进 P1–P2。

---

## 6. 模块图增补方案

### 6.1 命名惯例（取自 `graph.json` 与 1:1 令）

- id 全大写、`FE-` / `BE-` 前缀、单词连写（`FE-OPENCUBE`、`FE-COORDONE`、`FE-LISTAREA`）；中文名 2–5 字（`摆放坐标`、`跳转制图台`）。
- 一模块对应一个物理文件或一个目录（`GS-20261015-MOD-COMPLETE.md` 总表）；边方向服从 import 方向。
- 新区 `region` 值用小写连字符（现有 `fe-decision`、`fe-cube`、`fe-api`、`be`、`shell`）。

### 6.2 拟增模块

新区：`fe-map`，中文「平面映射」。

| id | 中文 | 文件 | 职责 | 阶段 |
|----|------|------|------|------|
| `FE-MAPIN` | 映射取数 | `map/in.js` | **唯一**读 `state` 与 `coords.js` 的映射模块；输出 `MapInput`；是隔离点 | P1 |
| `FE-MAPREG` | 映射注册 | `map/reg.js` | 目录、可用性判定、校验、`run` 兜底 | P1 |
| `FE-MAPPROJ` | 映射算子 | `map/proj.js` + `map/catalog/*` | 全部 `project` 纯函数与描述符 | P1 |
| `FE-MAPDRAW` | 平面绘图 | `map/draw.js` | `PlotSpec → SVG`；token 映射 | P1 |
| `FE-MAPDOCK` | 映射台 | `map/dock.js` | 下拉 + 参数 + 预览 + 联动 + 钉住 | P2 |
| `FE-MAPOUT` | 成图导出 | `map/out.js` | SVG/PNG 导出、脱敏闸、来源脚注 | P3 |
| `BE-MAPNL` | 映射意图 | `server/…` | 自然语言 → `{mappingId, params, selector}`（可选叶子） | P4，可选 |

不新增 `BE-*` 到 P3；债务摄入若做（Q11）另立 `BE-DEBT`，**不计入本表**。

### 6.3 拟增边

| 阶段 | from → to | 类型 | 说明 |
|------|-----------|------|------|
| P1 | `FE-MAPREG` → `FE-MAPPROJ` | depends | 注册表装载算子 |
| P1 | `FE-MAPIN` → `FE-ACTION` | depends | 读 `state`；比现图对 state 的标注更细，**有意为之**：`MAPIN` 是唯一接触 state 的映射模块 |
| P1 | `FE-MAPIN` → `FE-COORDONE` | calls | `companyCoord` / `SHELL_ANCHOR` |
| P1 | `FE-AESTHETIC` → `FE-MAPDRAW` | depends | 沿现有「AESTHETIC → 消费者」方向 |
| P2 | `FE-OPENCUBE` → `FE-MAPDOCK` | depends | 启动时挂载、注入 `sceneApi` 与 ui 钩子 |
| P2 | `FE-MAPDOCK` → `FE-MAPREG` / `FE-MAPIN` / `FE-MAPDRAW` | calls ×3 | |
| P2 | `FE-AESTHETIC` → `FE-MAPDOCK` | depends | |
| P3 | `FE-MAPDOCK` → `FE-MAPOUT`；`FE-MAPOUT` → `FE-MAPDRAW` | calls；depends | |
| P3（可选） | `FE-FOCUS` → `FE-MAPDRAW` | calls | `bondChart` 并入后；注意 `FE-SCENE → FE-FOCUS` 已存在，场景将间接带入 2D 绘图，评估后再定 |
| P4（可选） | `BE-HTTP` → `BE-MAPNL`；`FE-MAPDOCK` → `FE-API` | calls ×2 | 唯一新增外联路径 |

模块 / 边总数：现 26 / 35 → P1 30 / 39 → P2 31 / 44 → P3 32 / 46（含可选 47）→ P4 33 / 48（含可选 49）。边色按现规则：区内与 FE 内为翠绿，无跨侧边。

### 6.4 简图（拟增部分）

```
          ┌──────────── 立方体面（现有）────────────┐
          │ FE-OPENCUBE ─► FE-ACTION/COORDONE/SCENE/PANEL │
          └───┬─────────────────────────▲──────────┘
              │ depends(P2)             │ calls / depends（读，不写）
              ▼                         │
 ┌──── 平面映射（新区 fe-map）──────────┴──────────────────────────┐
 │ FE-MAPDOCK ─calls─► FE-MAPREG ─depends─► FE-MAPPROJ              │
 │     ├────calls────► FE-MAPIN ─► (FE-ACTION · FE-COORDONE，区外)   │
 │     ├────calls────► FE-MAPDRAW ◄─depends─ FE-AESTHETIC            │
 │     └─(P3)calls───► FE-MAPOUT ─depends─► FE-MAPDRAW               │
 │     └─(P4)calls───► FE-API ─► BE-HTTP ─► BE-MAPNL                 │
 └──────────────────────────────────────────────────────────────────┘
```

### 6.5 对静态模块图的工程提示

`modules/bake_static.py` 的版式是**硬编码**：`NODES`（`:48`）、`ZONES`（`:95`）、`ZONE_STYLE`（`:101`）、`REGION_LABEL`（`:717`），烘焙器的硬检要求 0 交叉 / 0 穿框（`cabinet/notes/20261014-modules-graph-v3-bus-layout.md`）。加一区须扩视口（现 `VB_H = 626`）并重排，通过硬检方可烘焙。工作量约 0.5–1 个实施轮次，**随 P1 令一并下**，不在本次动。区色建议避开已用的绿 / 蓝 / 黄 / 灰，交烘焙时定。

---

## 7. UI 方案

### 7.1 版面草图（桌面，≥980px）

现状：

```
┌──────────────────────────────────────────────────────────────┐
│[Filter ▾]  [ Search company or ticker…  ]       [Home]  (?)  │ 14
│[A/F ▾]                                                       │ 56
│                                                ┌────────────┐│
│ (cube canvas)                                  │ detail 300 ││ 64
│                                                │            ││
│                                                └────────────┘│
│ ● ●                                            [d ▕──▽──▏]   │
└──────────────────────────────────────────────────────────────┘
```

方案（Map 关闭 → 打开）：

```
┌──────────────────────────────────────────────────────────────┐
│[Filter ▾]  [ Search company or ticker…  ]       [Home]  (?)  │ 14
│[A/F ▾]                                         [Map ▾]       │ 56  ← 新：同 cube-filter 面皮
│                                                              │
│ (cube canvas)                       ┌──────────────────────┐ │ 96
│                                     │ PM-STRIP 带状点图  ✕ │ │
│        ← 点 / 切片被标记发亮         │ scale[对数▾] scope[随立方体▾] facet[无▾]│
│                                     │ ┌──────────────────┐ │ │
│                                     │ │  plot 360×240    │ │ │
│                                     │ └──────────────────┘ │ │
│                                     │ 48 of 49 · demo·示意  │ │
│                                     │ [Pin] [Export ▾] [⤢] │ │
│                                     ├──────────────────────┤ │
│                                     │ ▸ detail（折叠成一行） │ │
│                                     └──────────────────────┘ │
│ ● ●                                            [d ▕──▽──▏]   │
└──────────────────────────────────────────────────────────────┘
```

下拉面板（沿用 `.cube-filter-face/panel/opt` 的皮，`app.css:95-178`）：

```
[Map ▾]
 ┌──────────────────────────┐
 │ 搜索映射…                 │  ← 条目 >12 时出现（沿用首页上市地下拉的可搜索样式）
 │ ── 正交 ──                │
 │  正视 PM-FRONT            │
 │  俯视 PM-TOP              │
 │ ── 通道 ──                │
 │  带状点图 PM-STRIP        │
 │ ── 矩阵 ──                │
 │  切片×上市地 PM-HEAT-SC   │
 │  行业码×上市地  （灰）     │  ← 不可用：悬停说明「demo：行业码为空」
 │ ── 关系 / 时间 ──         │
 └──────────────────────────┘
```

### 7.2 与现有右侧元素共存

| 现有 | 处理 |
|------|------|
| `?` 与 Home（右上） | 不动 |
| `Map ▾` 面 | 放 `top:56; right:14`，宽与 Filter 面一致（118），避开 `top-search` 的 `right:120` 区间；窄屏落到 detail 之上 |
| `#detailPanel` | Map 开启时下移到 dock 之下并折叠成一行（点击展开）；选中公司时 detail 内容不丢，只是默认折叠 |
| `#dBox`（右下） | 不动；dock 高度上限 `100% − (96 + 140)`，永不压 d 盒 |
| `#companyFocus`（公司放大） | 不动；公司放大期间 dock **一并隐藏**（加入 `app.css:76-93` 的隐藏列表）。dock 的「⤢」放大按钮在 P3 复用同款大面，不另造 |
| `nav-hint` / `?` 帮助 | 增两行说明；不新建帮助层 |
| ≤980px | dock 落成底部抽屉（高 ≤45%），Map 面仍在右上；避免挡住 d 盒 |

### 7.3 交互链

1. **选映射**：下拉选 → 描述符默认参数 → `run` → 预览（一帧内）。不可用条目置灰并写原因。
2. **实时预览**：触发源只有「载荷到达、焦点 / 钉住 / 过滤 / 选中变化、参数变化」。**相机移动、拖动、`d` 滑块不触发**（Φ2 不读它们，§2.1），这是性能与语义的同一个理由。参数滑块去抖 80ms。
3. **范围 `scope`**：默认「随立方体」——预览回答的就是立方体当前显示的那批元素（stay ∩ 过滤）；可改「全部」。图脚常显 `n of N`。
4. **图 → 立方体（高亮）**：点标记 / 格 → 把其 `ref` 写入 `state.mapMarkIds`（新增，P2），场景读它给对应点加亮；**不走 `selectCompany`**，因为它会同时设焦点、改 stay 集、隐藏其他切片（`scene.js:1073-1089`）。落点在 `focusPointTargets` 增 `marked` 入参（`bondChart.js:99-125`，纯函数，易测）。双击标记才等同「选中」。
5. **立方体 → 图**：沿现有钩子（`main.js:38-45` 的 `onSelect / onFocusChange / onClear / onReset`）通知 dock 刷新标记；选中 / 焦点切片 / 钉住在图里加描边。
6. **钉住成图**：把当前 `(mappingId, params, selector)` 三元组存入会话列表（上限 6），列表项可一键恢复。**会话级，不持久**：壳每次启动用随机空闲端口，`localStorage` 随源失效（CONCEPTS 271）；持久化与 `ChartSpec` 存档同做（Q8）。
7. **可分享**：`#map=PM-STRIP&p=scale:log` 写入 `writeHash`（`state.js:175-185`），与既有 `slice/filter/id` 并列；这个三元组即 P4 模型的输出格式。
8. **导出**：见 §8.3。
9. 动效仅 opacity / 轻微 scale（AESTHETIC §2.4）。

### 7.4 与美学规范的关系；是否需美工部

- 全部落在 AESTHETIC §2 延展原则内：复用 token、浮于工程区、无第二套色、语义色不动（`agent_tasklist/AESTHETIC.md:125-131`）。
- 绘图色阶**只能由现有 token 派生**：`tone` → `--us/--intl/--muted/--stroke/--text`，供应/客户用 `COLORS.LINK_*`，选中 / 标记用 `--accent`。热力色阶用 `--text` 对 `--bg` 的明度单色阶（5 档），不引入新色相。建议新增 plot 专用变量 **≤ 6 个**（网格线、轴字、色阶 5 档），只许由现有 token 计算。
- **需要美工部**，在 P2：dock 版面与面皮、plot token、折叠 detail 的细节、窄屏抽屉。理由：AESTHETIC §3 管辖表含 `cube.html`、`app.css`、`ui.js` 视觉层，P2 主要改动正落在这些路径内。
- 需先补一行管辖：`Ind-Chain/web/js/map/**` 的视觉层归美工部（`map/draw.js` 的 token 映射、`map/dock.js` 的类名）。AESTHETIC.md 是公开工程真源，改它须业主令或总参任务单；内阁不改。
- 提醒：AESTHETIC 首页条款「`--accent` 只用于 hover/focus 与字标下划线」（`AESTHETIC.md:101`）属首页语境；本方案把 `--accent` 用作**标记高亮**，与「焦点」同义，请美工部在 P2 复核。

---

## 8. 数据与合规

### 8.1 现行条款要点（`PUBLIC-PRIVATE.md:50-57`）

- 含实体库的包 / `bics_entities_*.db` 为彭博加工物，**仅限团队内部**，不得上传 GitHub 或公开网站。
- `-noentities` 外发包由业主授权，仍含 BICS 层级 JSON、`companies.json`（其中 16 家 `value_m` 标注为彭博 Alphabet 供应商关系）、`nvda-revenue-links.json`（彭博供应链）。
- API 黄金响应只放仓外（`Ind-Chain/README.md:64` 同旨）。
- 审查 / 验收截图用完即毁（`PUBLIC-PRIVATE.md:42`）。`cabinet/` 现已进仓（`PUBLIC-PRIVATE.md:20`），**本文件只写结构性事实与计数，不含彭博明细值**。

### 8.2 预览与导出的边界

| 面 | 规则 |
|----|------|
| **预览**（应用内） | 披露面不大于立方体已显示的内容：只用载荷白名单字段；**不引入** `mkt_cap`、`source_file`、xlsx 路径、行 id（`modular-interface-scheme.md:74` 同禁） |
| **导出**（离开应用） | 描述符声明 `disclosure: aggregate|named`。`aggregate`（计数、占比、矩阵）可导；`named`（含公司名、数值）导出必须带**来源脚注**与「内部使用」字样，字样依 `meta.thirdParty` 与 `source` 字段生成 |
| **每元素 CSV** | 默认**不提供**；只导出**图上已画出**的聚合值（Q7） |
| **外发包**（`-noentities`） | 默认只开 `aggregate` 与演示集（`illustrative`）的导出；`named` 导出须业主另令（Q7） |
| **夹具** | 进仓的单测夹具一律**合成数据**；含真实实体的 golden 只放仓外临时目录 |
| **出站网络** | P1–P3 零出站。P4 若接云端模型，出站包仅含「描述符目录 + 用户原话 + 模式与计数」，**不含公司名、数值、坐标**，且默认关闭（Q10） |

### 8.3 导出通道是个未决工程问题

- 设计要求：DESIGN §3「支持导出一维、二维、三维图表」（`agent_tasklist/DESIGN.md:59`）——Φ2 正是补「二维」。
- 但应用壳 `SFCShell.swift` 没有下载委托（`rg download|WKDownload|NSSavePanel` 无命中），仅 `decidePolicyFor` 与 `createWebViewWith`，非本页链接一律交系统打开（`SFCShell.swift:391-408`）；壳的不变量是**不注入 JS 桥**（CONCEPTS 275）。因此 `<a download>` 在 `.app` 内很可能无效，须实测。
- 可选通道：(a) 复制 PNG / SVG 到剪贴板（研究员的真实用法是贴进 PPT；需在目标 macOS 与壳内实测 `navigator.clipboard.write`）；(b) 后端新增窄口写入 `SFC_DATA_DIR/exports/` 并在界面显示路径（要 `BE-HTTP` 与 `FE-API` 小改）；(c) 改壳加下载委托（重建并重签 `.app`，触 `SHELL-*`）。推荐 (a) 为主、(b) 为 (a) 失败时的退路，**不选 (c)**（Q6）。

---

## 9. 分阶段落地

> 工作量用「实施轮次」（一轮 = 总参任务单 → 主代理实施 → 监理部三监）与人日粗估。均为粗估，未经试做。

| 阶段 | 产出 | 验收 | 涉及部门 | 工作量 | 主要风险 |
|------|------|------|----------|--------|----------|
| **P0 设计冻结** | CONCEPTS 增条：`C-MAP2`（第二重映射）、`C-PLOT`（PlotSpec）、`C-MAPREG`、通道词表；`MapInput / Descriptor / PlotSpec` v1 文本；目录 v1 的 ID 与优先序；拟增模块与边的静态预览；业主答 Q1–Q5 | 业主签字；三件 schema 写入 CONCEPTS；**无代码改动**（监理部「无代码改动，不审」） | 内阁（令）→ 总参谋部（任务单，必要时参谋纪要官钉口谕）；改 CONCEPTS 由主代理落 | 1 轮 / 0.5–1 人日 | 业主对 Φ1 是否纳入本改革未定（Q2） |
| **P1 注册表 + 最小映射** | `FE-MAPIN / REG / PROJ / DRAW` 四模块；`PM-FRONT`、`PM-STRIP`、`PM-HEAT-SC`；模块图重烘（30/39）；无 UI | 同输入两次输出 JSON 字节相同；三模式下 `requires` 判定正确（demo 下 `PM-HEAT-BICS` 不可用）；`ok:false` 路径不抛；`desc` 往返不变；`map/*` 不 import `scene/ui/api`；Golden API 60 项零差异（后端零改动）；`regress_all.sh quick` 含新增检查 | 总参谋部；主代理；监理部三属（工程测试用浏览器自检页；代码质量；理念贯彻）。**不需**美工部、信息部 | 1–2 轮 / 2–3 人日 | 本机**无 node**：纯函数单测要换办法——浏览器内自检页 `web/map-selftest.html`，由监理部「工程测试属」打开；该页**须排除出打包白名单**（SHELL-PACK）；链模式 `revBn` 回退标记（R3）可能需要后端小改并 `--allow-changed` |
| **P2 UI：下拉 + 预览 + 联动** | `FE-MAPDOCK`；`cube.html` 加 `Map ▾` 与 dock；参数自动生成；预览；双向联动（`mapMarkIds` + `focusPointTargets.marked`）；钉住（会话级）；`#map=` 哈希；`PM-LADDER` 与 `bondChart` 对照（同一 `bondSchedule`，数值逐点一致）；31/44 | 选映射到出图 < 100ms（demo 96 家实测）；相机拖动与 d 滑块**不触发**重绘；公司放大时 dock 隐藏；≤980px 不挡 d 盒；`?` 帮助补两行；无新 `/api`；断网可用 | 美工部（版面、plot token）；总参谋部；主代理；监理部三属；**截图用后即毁** | 2 轮 / 3–4 人日 | 版面与 detail 折叠的手感；`AESTHETIC §3` 管辖补行；改动触及 `bondChart.js`、`scene.js` 读 `mapMarkIds`（FE-SCENE 小改，须守 1:1 令的边界） |
| **P3 更多映射 + 导出** | 家族 C/D/E/H 新增约 6–8 个（先 `PM-RANK`、`PM-SANKEY`、`PM-CONC`、`PM-TOP`）；`facet` 参数；`FE-MAPOUT` 与脱敏闸、来源脚注；`bondChart` 并入评估；32/46 | 导出通道实测通过（Q6）；`named` 导出带脚注；外发包默认只开 `aggregate`；`PM-SANKEY` 对 NVDA 供应商侧缺占比正确标 n/a 且不插补 | 总参谋部；美工部（图标、色阶复核）；**信息部**（仅当做 ◐ 类：债券 / 财务摄入，另令）；监理部三属 | 2–3 轮 / 4–6 人日 | 是否内嵌图表库（R4）；导出通道在壳内行不通；`PM-TREE` 需新取数函数（改 `api.js`） |
| **P4 大模型接入（可选）** | P4a：确定性命令栏 + 坐标选择器 DSL（无模型）；P4b：`BE-MAPNL`，自然语言 → `{mappingId, params, selector}`；确认门；33/48 | 非法输出一律拒绝且图不变；出站包无明细（抓包核对）；断网退回 P4a | 总参谋部；主代理；监理部三属；内阁复核出站合规 | 2 轮 / 3–5 人日 | 第一条出站网络（Q10）；与 `ChartSpec` 的 OPS 编译层是否共用同一个模型入口 |

阶段顺序理由：P1 不碰 UI，先把「纯函数 + 契约 + 自检」立住，再接界面；P2 才进入美工部；P3 的导出与债务摄入各自有未决工程问题，单列。

---

## 10. 风险与取舍

| # | 风险 / 取舍 | 内容 | 取向 |
|---|------------|------|------|
| R1 | **过度通用化** | 描述符 + 注册表 + 渲染器 + 参数自动生成是四层抽象；P1 只有 3 个映射时，抽象成本大于收益 | 描述符字段**只保留 P1 用得到的**（`requires / params / disclosure / basis / dataTier`），其余推到出现第二个用例再加；标记类型只开 5 种；不做插件加载，只做静态导入 |
| R2 | **性能** | 当前载荷 ≤ 100 点，预览无压力；一旦取成员库 cohort（`entity_memberships` 实测 117,255 行），SVG 标记数与取数延迟都变成问题 | P1–P3 只读载荷；cohort 作为 Q3 另议；聚合映射在 `project` 内先聚合再出标记；去抖 + 触发源收窄（§7.3） |
| R3 | **`revBn` 语义含回退** | 链模式 `_nvda_peer_rev_bn`：有实体则 `ind_rev/1e9`，否则取占比数值（至少 0.1），再否则 `1.0`（`nvda_links.py:198-203`）。载荷里**没有字段说明用了哪一级**。含 `revBn` 的映射（`PM-STRIP/RANK/CONC/TREEMAP`）可能把占位值画成规模 | P1 前置二选一：(i) `BE-NVDA-LINKS` 增 `revBnBasis` 字段（后端小改，需 `--allow-changed`）；(ii) 不改后端，则 chain 模式下含 `revBn` 的映射一律加警示条并把 `revBnBasis` 置 `unknown`。推荐 (i) |
| R4 | **离线与图表库** | 不得用 CDN。若 P3 需要桑基 / 树图布局算法，可评估 `d3-hierarchy`、`d3-sankey`（多为 ISC / BSD-3 类许可，**版本与许可文本须逐一核实，我未核**），按 three 的先例本地内嵌：放 `web/vendor/`、附 `LICENSE` 与 SHA-256 清单（`PUBLIC-PRIVATE.md:18`）、并入打包白名单。不选 ECharts 类整库（体积、canvas、风格难统一） | P1–P3 手写 SVG；库只在 P3 为桑基 / 树图、且核过许可后引入 |
| R5 | **坐标语义歧义** | 同一个 `x, y` 在 demo 与 chain 里含义不同（§1.2c）；`revScore` 在 demo 是**层内** min–max，在 chain 是**全局半盘**（CONCEPTS 183；`chain_layout.py:25-31`），跨切片比半径只在 chain 有义 | 描述符 `channelSemantics` 声明；图轴标签写明刻度基准（如「层内相对分」）；不适用组合在目录里置灰，不静默出图 |
| R6 | **与 `bondChart` 的整合** | 现有图是公司放大舞台的一部分，走搜索命中路径；若急于替换会动 `FE-FOCUS` / `FE-SCENE` 的边（`FE-SCENE → FE-FOCUS` 已存在） | P2 并存并做逐点对照；P3 对照通过后再评估并入；并入前不删 `bondChartHtml` |
| R7 | **导出通道** | 壳无下载委托（§8.3） | Q6：剪贴板为主，后端窄口为退路，不改壳 |
| R8 | **无 node** | 本机 `which node` 无结果，P1 的纯函数无法用常规 JS 测试跑 | 浏览器内自检页 + 合成夹具；该页不进打包。若业主愿装 node，可改为命令行单测，但**不应因此给产品加 npm 依赖** |
| R9 | **会话级钉住** | 端口随机 → `localStorage` 不可靠 | Q8；与 `ChartSpec` 持久化并案 |
| R10 | **「同一三维空间」理念** | DESIGN §3：一二三维数据都在同一个三维空间（`DESIGN.md:63`）；平面预览像「拆出去的画面」（DESIGN 对照第 3 条，`:73-74`） | 缓解：Φ2 读同一坐标、标记双向联动、哈希可分享、不引入独立数据源。远期选项（不进 P0–P4）：把预览当「投影墙」贴回立方体某一面，让投影真的落在空间里 |
| R11 | **目录膨胀** | 「非常多样」与「简洁是第一要务」（`DESIGN.md:49`）相冲 | 目录分家族折叠；每阶段只加有金融用途的；`PM-SIDE`、`PM-HEAT-RING` 等低信息量项默认不上 |
| R12 | **样本偏差** | 对手方样本不是市场，`PM-CONC`、`PM-TREEMAP` 的占比易被误读 | 描述符 `basis:"sample"`，图面固定「样本内」 |
| R13 | **Φ1 并行改动** | 若同期启动 `ChartSpec`，`ring/side` 的含义可能变 | 两轨只在 `MapInput` 相遇；`MapInput.v` 版本化；`ChartSpec` 轨变更 `placeMode` 语义须同步更新通道词表 |

---

## 11. 待业主拍板（编号，含推荐）

**阻塞 P0**

| # | 问题 | 选项 | **推荐** |
|---|------|------|----------|
| Q1 | 命名：二重映射 = Φ1 + Φ2；平面规约叫 **PlotSpec**（区别于 3D 的 `ChartSpec`）；映射 ID 前缀 `PM-`；新区「平面映射」 | 采纳 / 另议 | **采纳** |
| Q2 | 第一重（Φ1，今天写死在服务端排环）是否纳入本改革做成 `ChartSpec` | 纳入 / 不纳入，两轨独立 | **不纳入**；本改革只做 Φ2，Φ1 保持现状，二者只在 `MapInput` 相遇 |
| Q3 | P1–P2 映射的数据范围 | 仅载荷（立方体内元素）/ 允许取同 L4 的 cohort | **仅载荷**；cohort 留 P3 另议（R2） |
| Q4 | 预览位置 | 右栏卡 / 底部横条 / 居中大面 | **右栏卡**；「放大」在 P3 复用公司放大同款大面 |
| Q5 | 图表实现 | 手写 SVG / 内嵌 D3 子模块 / 整库（ECharts 类） | **手写 SVG（P1–P3）**；桑基、树图布局到 P3 再评估核过许可的 `d3-*` 子模块 |

**可随阶段再定**

| # | 问题 | 选项 | **推荐** |
|---|------|------|----------|
| Q6 | 导出通道（壳无下载委托） | (a) 剪贴板 (b) 后端写 `SFC_DATA_DIR/exports` (c) 改壳加下载 | **(a) 为主，(b) 为退路，不选 (c)**（保持「壳不注入桥」） |
| Q7 | 每元素 CSV 与外发包导出 | 默认关闭、仅聚合；外发包默认只开 aggregate 与演示集 | **默认关闭，另令开启** |
| Q8 | 钉住成图是否持久 | 会话级 / 存 `SFC_DATA_DIR` | **P2 会话级**；持久化与 `ChartSpec` 存档并案 |
| Q9 | 美工部介入 P2，并增 ≤6 个 plot 变量；AESTHETIC §3 补管辖行 | 是 / 否 | **是** |
| Q10 | P4 是否允许云端模型（第一条出站） | 不允许 / 逐项授权 | **P4 先做无模型命令栏；模型默认关，开启须逐项授权，出站包不含明细** |
| Q11 | 债务数据（`BE-DATA/ICBC C/928/googl_bond_full.xlsx` 等）是否与本改革同期摄入 | 同期 / 另令 | **另令**（信息部 manage→clean→request，另立 `BE-DEBT`）；P2 先用 Demo Company 与 `bondChart` 对照 |
| Q12 | `bondChart` 去留 | P3 对照通过后改调 `FE-MAPDRAW` / 长期并存 | **P3 对照通过后并入**；P1–P2 不动 |

另请业主确认两点：§1.1 对「3种交互」的理解；R3 的 (i)（给 `BE-NVDA-LINKS` 加 `revBnBasis`）是否同意作为 P1 的唯一后端小改。

---

## 12. 令文判断

**本次不写令文。** 理由：Q1–Q5 是 P0 的前置，其中 Q2、Q3、Q5 决定模块边界与 P1 范围；在这几项未答之前写令，会把未决事项塞进总参任务单，违背「任务单用语须清楚、验收不得放宽」（`GS-20261014-modularization-M1-M4.md` 任务单用语约束）。

建议的触发：业主答 Q1–Q5 后，内阁拟 `cabinet/orders/GS-20261016-DMAP-P0P1.md`（P0 冻结 + P1 实施，第 1 次 / 至多 5 次，据 `AUTHORITY.md` 多次下令权），并同令附：

- 模块图重烘（`modules/graph.json` 增 4 模块 4 边，`bake_static.py` 增 `fe-map` 区并过硬检，目标 30 / 39）；
- 验收条款抄自 §9 P1；
- 明示「后端零改动」，R3 的 (i) 若业主同意则单列一条后端小改并声明 `--allow-changed`。

届时按 `AUTHORITY.md`「模块跟踪展示义务」附当时模块清单与关系展示。

---

## 13. 本次落盘与未动之物

| 项 | 路径 |
|----|------|
| 本方案 | `cabinet/notes/20261016-double-mapping-reform-plan.md` |
| 真源（均未改） | `modules/graph.json`、`modules/index.html`、`modules/bake_static.py`、`Ind-Chain/**`、`agent_tasklist/**`、`cabinet/AUTHORITY.md` |

不 `git add` / `commit`；不留截图；不动 `library/`。
