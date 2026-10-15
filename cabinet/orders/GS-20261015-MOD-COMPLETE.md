# 内阁 → 总参谋部指令

**令号** `GS-20261015-MOD-COMPLETE`  
**日期** 2026-10-15  
**任务周期** 「模块与代码 1:1 结合」（Module-to-Code 1:1 Physical Alignment）  
**本周期内阁下令计数** **第 1 次 / 至多 5 次**（据 `cabinet/AUTHORITY.md` 多次下令权；谏言不计次）  
**本期** **把 `modules/graph.json` 中全部运行期模块与代码文件做成严格 1:1 物理落位，彻底取代「你中有我、我中有你」的越界直调局面**  
**交** **总参谋部**（父代理须将本文**完整**转交 `general-staff` 立意志与任务单；实施后送监理部三监并审，内阁不令监理部；内阁不改产品码）  
**来源** 业主 Purkniv 授权原话：「先把当前改名与报告提交推送，然后立即启动『模块与代码 1:1 结合』」  
**前置事实** 提交 `ee24eec` 已推送至 `origin/main`，工作树干净。  
**依据** `cabinet/AUTHORITY.md` · `modules/graph.json` · `cabinet/reports/SFC-modularization-plan-v2.html` · `cabinet/orders/GS-20261014-modularization-M1-M4.md`

---

## 谏言结论：**不发问**

业主已明令立即启动「模块与代码 1:1 结合」，前置提交推送已毕；本令不改 `modules/graph.json` 的 26 模块 / 35 边拓扑，只把此前暂居在 `app.py`、`home.js`/`list.js`/`main.js`、`scene.js`/`ui.js`/`bondChart.js` 内的跨模块实现拆回各自物理文件，并保持 60 条 Golden API 响应零差异。目标清楚、边界明确，不弹对话框，直接下令。

---

## 意志（一句）

**在不改变 `modules/graph.json`（26 模块 / 35 边）任何节点与边、且对外 60 条 Golden API 响应与三维/页面交互行为零回归的前提下，将后端与前端尚未独立成文的模块逐一拆入 1:1 物理代码文件，切断一切跨模块私有函数（`_` 前缀）混调，使 import 依赖方向严格服从 `modules/graph.json`，同步更新打包白名单与回归门禁并重编仓内 `.app`。**

---

## 一、1:1 物理落位总表（目标态）

`modules/graph.json` 全部 26 个模块在完成本令后的物理映射如下（**加粗**为本令新建或边界重整的物理文件）：

| 模块 ID | 侧 | 中文名 | 1:1 物理文件（完成态） | 本令动作 |
|---|---|---|---|---|
| **FE-NAV** | FE | 导航 | **`Ind-Chain/web/js/nav.js`** | **新建**：抽离 `home.js` / `list.js` / `main.js` 中的路由构造与返回键导航 |
| **FE-BOARD** | FE | 展板 | `Ind-Chain/web/index.html` + `Ind-Chain/web/js/home.js` | 改为调用 `./nav.js` |
| **FE-LIST** | FE | 列表 | `Ind-Chain/web/list.html` + `Ind-Chain/web/js/list.js` | 改为调用 `./nav.js` |
| **FE-OPENCUBE** | FE | 跳转制图台 | `Ind-Chain/web/cube.html` + `Ind-Chain/web/js/main.js` | 改为调用 `./nav.js` |
| **FE-LISTAREA** | FE | 列表属地 | `Ind-Chain/web/js/nations.js` | 保持（已 1:1） |
| **FE-ACTION** | FE | 操作 | `Ind-Chain/web/js/state.js` | 保持（已 1:1） |
| **FE-COORDONE** | FE | 摆放坐标 | `Ind-Chain/web/js/coords.js` | 保持（已 1:1） |
| **FE-SCENE** | FE | 场景 | **`Ind-Chain/web/js/scene.js`** | **重整**：与 `FE-FOCUS` 划清公开接口，内部按几何 / 拾取输入 / 相机标准视角分节 |
| **FE-PANEL** | FE | 面板 | **`Ind-Chain/web/js/ui.js`** | **重整**：聚焦舞台 overlay 控制器迁往 `bondChart.js`（`FE-FOCUS`），面板只管浮窗与 HUD |
| **FE-FOCUS** | FE | 聚焦 | **`Ind-Chain/web/js/bondChart.js`** | **充实**：合一承载聚焦态计算 / 舞台拉近 overlay（`C-COMPANY-ZOOM`）+ 债券期限图 |
| **FE-API** | FE | 接口 | `Ind-Chain/web/js/api.js` | 保持（已 1:1） |
| **FE-AESTHETIC** | FE | 前端设计 | `Ind-Chain/web/css/app.css` | 保持（已 1:1） |
| **BE-HTTP** | BE | HTTP 入口 | **`Ind-Chain/server/app.py`** | **瘦身**：从 ~1352 行缩至 ~300–360 行，仅留 Handler、`/modules/` 窄口、DB 启动自愈、注册与进程守护 |
| **BE-BUNDLE** | BE | 捆绑编排 | `Ind-Chain/server/bundle_dispatch.py` | 保持（已 1:1） |
| **BE-DB-DEMO** | BE | 演示集 | `Ind-Chain/server/db.py` | 保持（已 1:1） |
| **BE-DB-SHADOW** | BE | 影集 | **`Ind-Chain/server/db_shadow.py`** | **新建**：自 `app.py` 拆出 `bundle_shell_ticker`，严禁触碰演示库连接 |
| **BE-NVDA-LAYOUT** | BE | N布局规划 | `Ind-Chain/server/chain_layout.py` | 保持（已 1:1） |
| **BE-NVDA-LINKS** | BE | N关系集 | **`Ind-Chain/server/nvda_links.py`** | **新建**：自 `app.py` 拆出 NVDA 链文档读取、对端解析与 `bundle_nvda_chain` |
| **BE-BICS-HIER** | BE | BICS分类树 | **`Ind-Chain/server/bics_hier.py`** | **新建**：自 `app.py` 拆出 BICS 层级树 JSON 索引与节点/子节点/祖先查询 |
| **BE-BICS-ENTITY** | BE | BICS公司树 | **`Ind-Chain/server/bics_entity.py`** | **新建**：自 `app.py` 拆出 `bics_entities_20261003.db` 读写、主 L4 归属、地区计数、locate |
| **BE-BICS-AREA** | BE | BICS地区映射 | `Ind-Chain/server/listing.py` | 保持（已 1:1） |
| **BE-BICS-INGEST** | BE | BICS导入 | `BE-CLASS/BICS-Classification/ingest_20261003_entities.py` + `build_bics_hierarchy.py` | 保持（离线脚本，已 1:1） |
| **MODULES-TRACK** | other | 静态模块跟踪 | `modules/graph.json` + `modules/bake_static.py` + `modules/index.html` | 保持（26/35 零 diff） |
| **SHELL-WINDOW** | SHELL | 壳窗口 | `Ind-Chain/shell/{main,SFCShell,ErrorPanel}.swift` | 保持 |
| **SHELL-PROC** | SHELL | 内嵌后端 | `Ind-Chain/shell/{Backend,SelfTest}.swift` | 保持 |
| **SHELL-PACK** | SHELL | 打包 | **`Ind-Chain/scripts/package-standard-financial-charting.sh`** 等 | **更新白名单**：纳入全部新增后端 `.py` 与前端 `.js` |

---

## 二、后端拆分细则（`Ind-Chain/server/`）

**核心铁律**：
- 各文件之间**严禁** import 对方的 `_` 前缀私有函数或私有全局变量。
- Python 模块顶层 `import` 方向**必须服从 `modules/graph.json` 的边**：
  - `BE-HTTP` (`app.py`) → `BE-BUNDLE` (`bundle_dispatch.py`), `BE-BICS-HIER` (`bics_hier.py`), `BE-BICS-ENTITY` (`bics_entity.py`), `BE-BICS-AREA` (`listing.py`), `BE-DB-DEMO` (`db.py` 仅用于 `/api/meta`、`/api/layers`、`/api/companies` 及 `ensure_db`)。
  - `BE-BICS-ENTITY` (`bics_entity.py`) → `BE-BICS-AREA` (`listing.py`)。
  - **注意 `graph.json` 中 `BE-BICS-HIER` 与 `BE-BICS-ENTITY` 之间没有任何边！** 因此 `bics_hier.py` **不得** `import bics_entity`，`bics_entity.py` 也**不得** `import bics_hier`。两者需要协同时（如 `bics_children` 需要各节点公司计数 `count_fn`，`list_bics_entities` 需要 `node` 与 `ancestors`），一律由调用方 `app.py`（`BE-HTTP`，同时拥有 `BE-HTTP → BE-BICS-HIER` 与 `BE-HTTP → BE-BICS-ENTITY` 两条 `calls` 边）通过**公开函数参数注入**或编排组合完成！
  - 同理，`graph.json` 中 `BE-BUNDLE` 调用 `BE-DB-SHADOW` (`db_shadow.py`)、`BE-NVDA-LAYOUT` (`chain_layout.py`)、`BE-NVDA-LINKS` (`nvda_links.py`)，且 `BE-NVDA-LAYOUT → BE-NVDA-LINKS` 为 `depends`。`db_shadow.py` 与 `nvda_links.py` 所需的实体解析函数（`resolve_entity_ticker`、`primary_entity_for_ticker`、`entity_by_member_ticker`、`peer_l4_key`）及 `countries` 元数据，可在 `app.py` 的 `_register_bundle_builders()` 注册时以公开回调/依赖注入传入（或由 `bics_entity.py` 提供公开 API 并在注册层绑定），确保模块边界干净、无循环依赖、无私有符号穿透。

### 1. `BE-BICS-HIER` → `Ind-Chain/server/bics_hier.py`
- **职责**：管理 `BE-CLASS/BICS-Classification/bics-equity-hierarchy-2024.json` 的内存索引与层级树查询。
- **公开 API（全部无 `_` 前缀）**：
  - `BICS_JSON` 路径常量
  - `bics_public(node: dict | None) -> dict | None`
  - `bics_node(code: str) -> dict | None`
  - `bics_ancestors(code: str) -> list[dict]`（供 `BE-HTTP` 传给 `list_bics_entities` 或直接组装）
  - `bics_children(parent: str, listing_country: str | None = None, *, count_fn: Callable[[str, str | None], dict] | None = None) -> dict | None`
  - `list_bics_l1(*, count_fn: Callable[[str, str | None], dict] | None = None) -> list[dict]`
- **边界约束**：不 import `bics_entity`、不 import `sqlite3`、不触碰任何 `.db`。当 `count_fn` 未传时给默认零计数结构，由 `app.py` 传入 `bics_entity.count_pack`。

### 2. `BE-BICS-ENTITY` → `Ind-Chain/server/bics_entity.py`
- **职责**：只读连接 `BE-CLASS/BICS-Classification/bics_entities_20261003.db`，负责主 L4 归属裁定、地区计数包、L4 公司列表查询、公司/代码搜索（locate）及单证券实体解析。
- **依赖**：仅可 import 标准库与 `from listing import country_label, parse_ticker`（对应 `BE-BICS-ENTITY → BE-BICS-AREA`）。**不得** import `bics_hier` 或 `db`。
- **公开 API（全部无 `_` 前缀）**：
  - `ENTITIES_DB` 路径常量
  - `UNRESOLVED_L4 = "unresolved"`
  - `normalize_ticker_key(raw: str) -> str`
  - `primary_listings_count() -> int`（供 `app.py` 的 `ensure_db()` 打印 `[Ind-Chain] primary listings N tickers`，替代原先在 `app.py` 里直读 `_primary_index()`）
  - `count_pack(prefix: str, listing_country: str | None = None) -> dict`
  - `list_bics_entities(code: str, listing_country: str | None = None, *, node: dict | None = None, ancestors: list[dict] | None = None) -> dict | None`（若 `node` 为 `None` 或 `node.get("level") != 4` 返回 `None`；内部不再调 `bics_children`）
  - `locate_bics(q: str, limit: int = 8) -> dict`
  - `resolve_entity_ticker(raw: str) -> str | None`
  - `primary_entity_for_ticker(ticker: str) -> dict | None`
  - `entity_by_member_ticker(ticker: str) -> dict | None`
  - `peer_l4_key(ent: dict | None) -> tuple[str, str]`

### 3. `BE-DB-SHADOW` → `Ind-Chain/server/db_shadow.py`
- **职责**：非链公司空壁标准壳立方体载荷构建（锚定 `(s,x,y)=(5,5,5)`，`layers: []`，`revenueLinks: []`）。
- **公开 API**：
  - `bundle_shell_ticker(ticker_raw: str) -> dict`（或由 `configure_shadow(...)` / 公开导入绑定实体查询与国家字典）。
- **边界约束**：**严禁**打开 `ind_chain.db`（`BE-DB-DEMO`），严禁调用 `db.connect()` / `db.list_companies()` / `db.list_layers()`。国家映射表可取自 `db.COUNTRY_LABEL` 常量（或 `meta()["countries"]` 纯字典），绝不触发 SQLite IO。

### 4. `BE-NVDA-LINKS` → `Ind-Chain/server/nvda_links.py`
- **职责**：读取 `Ind-Chain/data/nvda-revenue-links.json`，解析中心公司与上下游对端 BICS L4 切片，调用 `chain_layout.assign_nvda_chain_rings`（`BE-NVDA-LAYOUT`）生成 `chain` 模式 bundle。
- **公开 API**：
  - `NVDA_REVENUE_LINKS` 路径常量
  - `load_nvda_revenue_doc() -> dict | None`
  - `bundle_nvda_chain(ticker_raw: str) -> dict`
- **边界约束**：严禁打开 `ind_chain.db`（`BE-DB-DEMO`）；通过公开 API 使用 `chain_layout.assign_nvda_chain_rings` 与实体解析函数。

### 5. `BE-HTTP` → `Ind-Chain/server/app.py`（大幅瘦身）
- **职责**：仅保留 HTTP 监听与路由分发（`Handler`）、`/modules/` 窄口静态服务、`ensure_db` / `_quarantine_db` / `_open_checked_db`、`_register_bundle_builders()`、`SFC_PORT` / `SFC_DATA_DIR` / `SFC_PARENT_PID` 守护及 `main()`。
- **行数目标**：从 1,352 行降至 **300–360 行以内**。
- **兼容要求**：保留 `sys.path.insert(0, str(ROOT / "server"))`；对外所有 HTTP 路由、状态码、响应头、JSON 键名与字节序与拆分前 100% 一致（Golden 60 条 0 意外 diff）。

---

## 三、前端拆分与边界重整细则（`Ind-Chain/web/js/` & `Ind-Chain/web/*.html`）

**核心铁律**：
- 浏览器原生 ES Module 加载，不引入任何打包器或构建步骤，不发起任何外部网络请求（`external == 0`）。
- 模块间 import 严格对应 `modules/graph.json` 边，消除三页各自复制粘贴路由构造与 Backspace 监听的散乱状态。

### 1. `FE-NAV` → 新建 `Ind-Chain/web/js/nav.js`
- **职责**：全站唯一路由构造与键盘返回导航模块，落实 `FE-NAV → FE-BOARD → FE-LIST → FE-OPENCUBE` 的物理载体。
- **公开导出（`export function ...`）**：
  - `currentBics(search = location.search)`、`currentListing(search = location.search)`、`currentQuery(search = location.search)`
  - `gateHref(bics, country)`：构造 `/?bics=...&listingCountry=...` 或 `/`
  - `listHref(bics, country)`：构造 `/list?bics=...&listingCountry=...`
  - `listLocateHref(bics, ticker)`：构造 `/list?bics=...&q=...`
  - `cubeHref()`：返回 `"/cube"`
  - `cubeCompanyHref(ticker)`：构造 `/cube?ticker=...`（空回落 `"/cube"`）
  - `isDemoCubeQuery(q)`：判断输入是否为 `"/cube"`
  - `assignRoute(href)` / `replaceRoute(href)`：封装 `location.assign` / `location.replace`
  - `wireBackspaceNav(resolveBackHref)`：统一绑定 `window` 的 `Backspace` 键返回逻辑（统一过滤 `ctrlKey`/`metaKey`/`altKey`/`isComposing` 及 `INPUT`/`TEXTAREA`/`SELECT`/`isContentEditable` 焦点保护；触发时取 `resolveBackHref()` 非空则跳转）。
- **三页接入**：
  - `Ind-Chain/web/js/home.js`（`FE-BOARD`）：从 `./nav.js` import 上述函数，删除本地重复的 `currentBics`、`currentListing`、`gateHref`、`listHref`、`cubeHref`、`isDemoCubeQuery`、`listLocateHref`、`wireBackspaceUp`。
  - `Ind-Chain/web/js/list.js`（`FE-LIST`）：从 `./nav.js` import `currentBics`、`currentListing`、` currentQuery`、`gateHref`、`listHref`、`cubeCompanyHref`、`wireBackspaceNav`，删除本地重复定义。
  - `Ind-Chain/web/js/main.js`（`FE-OPENCUBE`）：从 `./nav.js` import `listHref`、`wireBackspaceNav`，替换本地的 `wireShellBackspace`。

### 2. `FE-FOCUS` (`Ind-Chain/web/js/bondChart.js`) 与 `FE-SCENE` (`Ind-Chain/web/js/scene.js`) 职责归位
- **`FE-FOCUS` (`Ind-Chain/web/js/bondChart.js`)**：
  - 在保留 `bondChartHtml(schedule)` 的基础上，将散落在 `scene.js` 与 `ui.js` 中属于「聚焦态 / 留场切片计算与公司聚焦舞台 overlay（`[C-FOCUS]` / `[C-COMPANY-ZOOM]`）」的逻辑收纳进 `bondChart.js` 并以清晰具名函数导出：
    - 聚焦态/留场切片目标透明与高亮参数计算或聚焦动作辅助（供 `scene.js` 调用，落实 `modules/graph.json` 中 **`FE-SCENE → FE-FOCUS` (`depends`)** 的真实代码依赖！此前 `scene.js` 并未 import `bondChart.js`，图与代码脱节，本令必须补齐 `scene.js` 对 `bondChart.js` 的真实 import）；
    - 公司聚焦舞台控制器 `createCompanyFocusStage({ viewport, companyFocus, companyFocusBody, companyFocusClose, renderDetail, onRequestClear })`（含 `enterCompanyZoom`、`exitCompanyZoom`、`scheduleCompanyZoom`、`cancelPendingZoom`，供 `ui.js` 调用）。
- **`FE-SCENE` (`Ind-Chain/web/js/scene.js`)**：
  - 真实 import `bondChart.js`（`FE-FOCUS`）提供的聚焦态视觉参数/辅助函数（兑现 `FE-SCENE → FE-FOCUS` 边）；
  - 在 `scene.js` 内部以清晰的分节注释与结构整理三大职责块：
    1. **Section 1 · Geometry & Slices (`[C-SLICE]` / `[C-POINT]` / `[C-RING]` / `[C-REV-LINK]` / `[C-AXES]`)**
    2. **Section 2 · Camera & Standard View (`[C-STDVIEW]` / `[C-VIEW-SPACE]`)**
    3. **Section 3 · Focus Transitions, Raycast & Input (`[C-PICK]` / `[C-PULL-ZONE]` / `[C-FOCUS-ACT]`)**
  - 保持对外 `createScene` 与 `STDVIEW_MS` 公开导出签名不变。

---

## 四、打包白名单与回归门禁更新（`SHELL-PACK` & `regress_all.sh`）

### 1. `Ind-Chain/scripts/package-standard-financial-charting.sh`
- 第 93 行附近的 `Resources/sfc` 白名单中，将后端文件列表从：
  ```bash
  for f in app db bundle_dispatch chain_layout listing; do echo "Ind-Chain/server/$f.py"; done
  ```
  更新为完整 9 个后端模块文件：
  ```bash
  for f in app db db_shadow bundle_dispatch chain_layout nvda_links bics_hier bics_entity listing; do echo "Ind-Chain/server/$f.py"; done
  ```
- 前端 `Ind-Chain/web` 已通过 `find . -type f ! -name .DS_Store` 自动纳入 `nav.js`，确认 `allowlist.diff` 校验 100% 通过。

### 2. `Ind-Chain/scripts/regress_all.sh`
- 检查第 82–84 行 `static_checks()` 中的 `web/` 范围检查：
  ```bash
  CHG=$(git status --short -uall -- Ind-Chain/web | rg -v 'cube.html|web/vendor/three/' || true)
  ```
  那是 P1 阶段的临时过滤写法。现在 `ee24eec` 已入库，且本令正当修改/新增 `Ind-Chain/web/js/` 下的模块文件，请将该检查更新为：**禁止 `Ind-Chain/web/` 下出现未入库且非预期的杂散文件（如 `.DS_Store`、`*.bak`、`*.orig` 或未知目录），同时允许 `Ind-Chain/web/js/`、`Ind-Chain/web/*.html`、`Ind-Chain/web/css/` 下的正当模块化改动**（或在工作树提交后保持干净通过，开发期对 `Ind-Chain/web/js/{nav,home,list,main,scene,ui,bondChart}.js` 及 `Ind-Chain/web/{index,list,cube}.html` 放行），确保 `bash Ind-Chain/scripts/regress_all.sh quick` 在提交前后的验证均不误报。

### 3. 重建仓内 `Standard-Financial-Charting.app`
- 运行 `bash Ind-Chain/scripts/build-standard-financial-charting-app.sh`（以及必要时核验打包脚本），确保仓内 `.app` 同步最新代码并通过 `--selftest`。

---

## 五、红线与不做事项

1. **`modules/graph.json` 与 `modules/index.html` 零改动**：本令是让代码追平既有 26 模块 / 35 边蓝图，不增删任何模块或边。
2. **API 契约与视觉行为零改动**：60 条 Golden API 响应必须 0 意外 diff；`DESIGN.md` 与 `AESTHETIC.md` 视觉 token 不变。
3. **公私隔离**：`Partner Work/`、`.vscode/`、`dist/`、`build/`、`bics_entities_*.db`、`ind_chain.db` 严禁入仓。
4. **文档同步**：`Ind-Chain/CONCEPTS.md` 或 `Ind-Chain/README.md` 如涉及物理文件映射表，可做与本令一致的最小事实同步。

---

## 六、验收标准（三监与内阁复核判据）

| # | 验收项 | 判据 |
|---|---|---|
| **M-1** | **后端 1:1 落位与行数** | `Ind-Chain/server/` 下 `app.py`、`db.py`、`db_shadow.py`、`bundle_dispatch.py`、`chain_layout.py`、`nvda_links.py`、`bics_hier.py`、`bics_entity.py`、`listing.py` 九文件齐备；`app.py` ≤ 360 行 |
| **M-2** | **前端 1:1 落位与依赖边兑现** | `Ind-Chain/web/js/nav.js` 存在且被 `home.js`、`list.js`、`main.js` 真实 import；`scene.js` 真实 import `bondChart.js`（兑现 `FE-SCENE → FE-FOCUS`）；`ui.js` 通过 `bondChart.js` 的公开接口驱动 `companyFocus` 舞台 |
| **M-3** | **零跨文件私有符号调用** | 静态扫描 `Ind-Chain/server/*.py`：没有任何 `from <mod> import _...` 或 `<mod>._...` 跨模块私有调用；`bics_hier.py` 与 `bics_entity.py` 互不 import；`db_shadow.py` 与 `nvda_links.py` 不调用 `db.connect()` |
| **M-4** | **单元测试与回归门禁全绿** | `python3 Ind-Chain/server/test_chain_layout.py` 通过；`bash Ind-Chain/scripts/regress_all.sh capture`（在拆分前基线或等价对拍）+ `bash Ind-Chain/scripts/regress_all.sh quick` **ALL PASS**（26/35 模块图机检、静态检查、60 条 Golden API 0 diff） |
| **M-5** | **应用自检与打包白名单** | `Standard-Financial-Charting.app/Contents/MacOS/Standard-Financial-Charting --selftest --start-path "/cube?ticker=NVDA%20US%20Equity"` 返回 `ok: true, external: 0, canvases >= 1, webglDrawn: true`；`package-standard-financial-charting.sh` 白名单含全部新模块文件 |

---

## 七、当时模块清单与模块关系展示（据 `modules/graph.json` 静态真源，26 模块 / 35 边）

静态可打印页：`modules/index.html`（真源：`modules/graph.json`）。

### 模块清单（26）
- **FE · 决策路径 (`fe-decision`, 4)**：`FE-NAV` 导航 (`nav.js`) · `FE-BOARD` 展板 (`home.js`) · `FE-LIST` 列表 (`list.js`) · `FE-LISTAREA` 列表属地 (`nations.js`)
- **FE · 契约枢纽 (`fe-api`, 1)**：`FE-API` 接口 (`api.js`)
- **FE · 立方体面 (`fe-cube`, 7)**：`FE-OPENCUBE` 跳转制图台 (`main.js`) · `FE-ACTION` 操作 (`state.js`) · `FE-COORDONE` 摆放坐标 (`coords.js`) · `FE-SCENE` 场景 (`scene.js`) · `FE-PANEL` 面板 (`ui.js`) · `FE-FOCUS` 聚焦 (`bondChart.js`) · `FE-AESTHETIC` 前端设计 (`app.css`)
- **SHELL · 本地应用壳 (`shell`, 3)**：`SHELL-WINDOW` 壳窗口 · `SHELL-PROC` 内嵌后端 · `SHELL-PACK` 打包
- **BE · 后端与数据 (`be`, 10 + 1)**：`BE-HTTP` (`app.py`) · `BE-BUNDLE` (`bundle_dispatch.py`) · `BE-DB-DEMO` (`db.py`) · `BE-DB-SHADOW` (`db_shadow.py`) · `BE-NVDA-LAYOUT` (`chain_layout.py`) · `BE-NVDA-LINKS` (`nvda_links.py`) · `BE-BICS-HIER` (`bics_hier.py`) · `BE-BICS-ENTITY` (`bics_entity.py`) · `BE-BICS-AREA` (`listing.py`) · `BE-BICS-INGEST` (离线导入脚本) · `MODULES-TRACK` (`modules/`)

### 模块间关系（35 条边）
- **FE 内 `calls`（7）**：`FE-NAV → FE-BOARD` · `FE-BOARD → FE-LIST` · `FE-LIST → FE-OPENCUBE` · `FE-BOARD → FE-API` · `FE-LIST → FE-API` · `FE-OPENCUBE → FE-API` · `FE-SCENE → FE-COORDONE`
- **FE 内 `depends`（10）**：`FE-BOARD → FE-LISTAREA` · `FE-LIST → FE-LISTAREA` · `FE-OPENCUBE → FE-ACTION` · `FE-OPENCUBE → FE-COORDONE` · `FE-OPENCUBE → FE-SCENE` · `FE-OPENCUBE → FE-PANEL` · `FE-SCENE → FE-FOCUS` · `FE-AESTHETIC → FE-BOARD` · `FE-AESTHETIC → FE-LIST` · `FE-AESTHETIC → FE-PANEL`
- **跨侧 `contract`（3）**：`FE-API → BE-HTTP` · `BE-HTTP → MODULES-TRACK` · `SHELL-WINDOW → BE-HTTP`
- **BE 内 `calls`（8）**：`BE-HTTP → BE-BUNDLE` · `BE-HTTP → BE-BICS-HIER` · `BE-HTTP → BE-BICS-ENTITY` · `BE-HTTP → BE-BICS-AREA` · `BE-BUNDLE → BE-DB-DEMO` · `BE-BUNDLE → BE-DB-SHADOW` · `BE-BUNDLE → BE-NVDA-LAYOUT` · `BE-BUNDLE → BE-NVDA-LINKS`
- **BE 内 `depends`（3）**：`BE-NVDA-LAYOUT → BE-NVDA-LINKS` · `BE-BICS-ENTITY → BE-BICS-AREA` · `BE-BICS-INGEST → BE-BICS-ENTITY`
- **SHELL 边（4，连同上列 `SHELL-WINDOW → BE-HTTP` 共 5 条壳边）**：`SHELL-WINDOW → SHELL-PROC` (`depends`) · `SHELL-PROC → BE-HTTP` (`calls`) · `SHELL-PACK → SHELL-WINDOW` (`depends`) · `SHELL-PACK → BE-HTTP` (`depends`)
