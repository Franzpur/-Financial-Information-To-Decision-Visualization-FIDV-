# 内阁 → 总参谋部指令

**令号** `GS-20261015-RENAME-FIDV-SFC`  
**日期** 2026-10-15  
**任务周期** 「总项目名称改名：FIDV → SFC（Standard-Financial-Charting）」  
**本周期内阁下令计数** **第 1 次 / 至多 5 次**（据 `cabinet/AUTHORITY.md` 多次下令权；谏言不计次）  
**本期** **将全仓活文档、活配置、角色定义与运行期提示文案中称呼总项目名称的「FIDV」及原全称统一改为「SFC（Standard-Financial-Charting）」，重烘 `modules/index.html` 并重编 `.app`**  
**交** **总参谋部**（父代理须将本文**完整**转交 `general-staff` 立意志与任务单；实施后送监理部三监并审，内阁不令监理部；内阁不改产品码）  
**来源** 业主 Purkniv 原话：「电内阁，将现在所有的称呼总项目名称的，原先叫做FIDV的地方，都改作 SFC，全称 Standard-Financial-Charting」  
**依据** `cabinet/AUTHORITY.md` · `cabinet/README.md` · 既有改名令 `GS-20261014-global-rename.md` / `GS-20261014-sfc-rename-r2.md`

---

## 一、内阁谏言判定与范围裁断

### 谏言结论：**不发问**
**一句话理由**：业主把「原总项目简称 `FIDV` → `SFC`、原全称 → `Standard-Financial-Charting`」定得清晰无歧义，不涉及需求分歧或破坏性改写，无需弹窗追问。

### 范围裁断（拍板定案，总参照此立单）

1. **`agents/*.md`（14 个角色定义）与 `agent_tasklist/*.md` 是否算「称呼总项目名称」？**
   - **裁断：算，必须改。** 「你是 FIDV 的××」「FIDV 第一版设计理念」「FIDV 美学真源」「FIDV 数据真源」里的 `FIDV` 正是对总项目名称的直接称呼。现统一改为 `SFC`（全称 `Standard-Financial-Charting`）。
   - **宪制自洽处理**：内阁不亲自写 `DESIGN.md`；但本令是**业主明令全项目改名**，由内阁写入总参指令，交父代理/主代理将 `agent_tasklist/DESIGN.md` 第 1 行 `# FIDV 第一版设计理念` → `# SFC 第一版设计理念`、第 7 行 `**Financial Information to Decision Visualization (FIDV)**` → `**Standard-Financial-Charting (SFC)**` 同步落实（仅改此两处项目名，设计三原则一字不动）。同时保留 `agent_tasklist/*.md` 与 `agents/*.md` 的既有 git 跟踪/忽略状态（被 `.gitignore` 忽略的私路径只改本机文件文字，**严禁 `git add -f`**）。
2. **史实档案是否确应不改？**
   - **裁断：确应不改。** `library/worklog-001…007.md`、`library/bug-report/**`（含 `README.md` 与 `ops-log-001.md`）、`library/showable-report/**`、`cabinet/reports/**`、`cabinet/orders/GS-2026101*`（历史令文）、`cabinet/notes/**`、`cross-integration/reports/**`、`Partner Work/**` 均记录当时史实或属已发布报告/队员件，沿用「史实不改写」铁律。内阁已在 `cabinet/README.md` 登记总项目名对照表供读旧文翻译。
3. **文件路径、文件名、URL、Bundle 标识与 Golden 数据字段是否不改？**
   - **裁断：不改。**
     - 磁盘/仓库路径与 URL：`/Volumes/DATA/FIDV`、GitHub 远端 URL（`…/FIDV.git`）、`Ind-Chain/assets/fidv-launcher.icns` / `fidv-launcher-1024.png`、`cabinet/reports/FIDV-*.html`、`library/showable-report/FIDV-*`——这些是物理路径或外部远端坐标，不是行文里的项目称呼，改之会断链、断脚本、断 GitHub remote。
     - 技术标识符：`local.fidv.Standard-Financial-Charting`（`CFBundleIdentifier`）与 `fidvSplashSeen`（`sessionStorage` 键名）属内部技术键，非称呼语，不动。
     - Golden API 数据字段：`Ind-Chain/data/companies.json` 第 959 行 `note: "Synthetic showcase firm for FIDV demos (not a live issuer)."` 会种子入库并经 `/api/companies` 输出，改之会打破 60 条 Golden API 响应零差异与既有 SQLite 库，**本轮保留不改**（在交回中作为建议项报业主知悉：若日后重采 Golden 基线再行替换）。

---

## 二、改名映射表（精确替换准则）

| 类别 | 旧称呼 | 新称呼 |
|---|---|---|
| **总项目全称 + 简称** | `Financial Information To Decision Visualization (FIDV)` / `Financial Information to Decision Visualization (FIDV)` | `Standard-Financial-Charting (SFC)` |
| **总项目全称（单独出现）** | `Financial Information To Decision Visualization` / `Financial Information to Decision Visualization` | `Standard-Financial-Charting` |
| **总项目简称（行文/标题/注释/UI提示）** | `FIDV` | `SFC` |

---

## 三、逐文件实施清单（活文档 · 活配置 · 运行期提示）

**纪律**：严禁全仓盲 `sed`；只对下表所列活文件逐处替换，区分大小写，不动路径/文件名。

### 1. 仓库根与公共条文面（已跟踪）
- `README.md`：第 1 行 `# Financial Information To Decision Visualization (FIDV)` → `# Standard-Financial-Charting (SFC)`（及文内若有称呼总项目为 `FIDV` 处，不含 git clone URL / 目录名）。
- `PUBLIC-PRIVATE.md`：第 5 行 `不是 FIDV 产品` → `不是 SFC 产品`（文内引用历史报告文件名 `FIDV-…` 属路径/文件名，保留）。
- `BE-CLASS/BICS-Classification/README.md`：第 3 行 `这是 FIDV 的第三类坐标` → `这是 SFC 的第三类坐标`。

### 2. 产品代码、脚本与文档面（`Ind-Chain/`）
- `Ind-Chain/CONCEPTS.md`：
  - 第 10 行 `> Repo: FIDV · path: Ind-Chain/` → `> Project: SFC (Standard-Financial-Charting) · path: Ind-Chain/`（或 `> Repo: SFC (Standard-Financial-Charting) · path: Ind-Chain/`）；
  - 第 182 行 `C-SPLASH` 描述中 `FIDV wordmark` → `SFC wordmark`；
  - 第 245 行 `assets/fidv-launcher*` 为真实文件路径，保留不改。
- `Ind-Chain/scripts/set-command-icon.sh`：
  - 第 2 行注释 `# Sync FIDV launcher icon into Standard-Financial-Charting.app.` → `# Sync SFC launcher icon into Standard-Financial-Charting.app.`（第 3、10 行 `fidv-launcher.icns` 文件名保留）。
- `Ind-Chain/shell/ErrorPanel.swift`：
  - 第 30 行 `"应用包不完整或已被移动。仓内开发版须放在 FIDV 仓库根目录（与 Ind-Chain/ 同级）；分发版请重新解压完整的应用。"` → 将 `FIDV 仓库根目录` 改为 `SFC 仓库根目录`。
  - **注意**：改 `ErrorPanel.swift` 后，**必须运行 `bash Ind-Chain/scripts/build-standard-financial-charting-app.sh` 重建仓内 `Standard-Financial-Charting.app`**，使二进制与源码一致。
- `Ind-Chain/server/app.py`（及 `Ind-Chain/server/*.py`）：若注释中仍有 `local FIDV` 等称呼（如 `Cleartext HTTP is intentional for local FIDV`），一并改为 `local SFC`。

### 3. 静态模块图面（`modules/`）
- `modules/graph.json`：
  - 第 4 行 `"title": "FIDV module graph (W1 track)"` → `"title": "SFC module graph (W1 track)"`。
  - **26 个模块节点与 35 条边一字不动**。
- `modules/bake_static.py`：已为 `SFC`，核对无残留 `FIDV` 后，运行 `python3 modules/bake_static.py` 重新烘焙 `modules/index.html`，使 `modules/index.html` 内嵌 JSON 的 `"title"` 同步更新为 `"SFC module graph (W1 track)"`。

### 4. 任务单、美学/设计/数据真源与代理角色定义面（`agent_tasklist/` · `agents/` · `.cursor/skills/`）
- **注意 git 状态**：仅 `agent_tasklist/DESIGN.md`、`agent_tasklist/AESTHETIC.md`、`agent_tasklist/INFORMATION.md`、`.cursor/skills/clerk-showable-report/SKILL.md` 为已跟踪文件；其余 `agent_tasklist/*.md` 与 `agents/*.md` 属 `.gitignore` 排除的本机规则文件——**只改文件内容，严禁 `git add -f` 将私路径加进暂存区**。
- `agent_tasklist/DESIGN.md`：第 1 行 `FIDV` → `SFC`；第 7 行 `**Financial Information to Decision Visualization (FIDV)**` → `**Standard-Financial-Charting (SFC)**`。
- `agent_tasklist/AESTHETIC.md`：第 1 行 `# FIDV 美学真源（美工部）` → `# SFC 美学真源（美工部）`；第 58、70、105 行中的 `FIDV` 字标描述全部改为 `SFC` 字标（第 60、79、122 行的 `fidv-launcher*` 文件路径保留）。
- `agent_tasklist/INFORMATION.md`：第 1 行 `# FIDV 数据真源（信息部）` → `# SFC 数据真源（信息部）`；第 23 行 `FIDV 拉数说明书` → `SFC 拉数说明书`。
- `agent_tasklist/` 下其余活文件（如 `clerk.md`、`INFORMATION-request.md` 等）与 `agents/*.md` 全部 14 个角色定义文件：将所有称呼项目的 `FIDV`（如 `FIDV 档案部`、`你是 FIDV 的××`、`FIDV General Staff` 等）统一改为 `SFC`（引用 `library/showable-report/FIDV-*.html` 范本文件名处保留）。
- `.cursor/skills/clerk-showable-report/SKILL.md`：
  - 第 3 行 `Writes FIDV printable HTML reports` → `Writes SFC printable HTML reports`；
  - 第 30 行 `封面可单独放大 **FIDV**` → `封面可单独放大 **SFC**`；
  - 第 83 行范本路径 `FIDV-clone-handbook.html`、`FIDV-team-briefing.html` 为真实文件名，保留。

---

## 四、验收标准（三监与内阁复核判据）

| # | 验收项 | 判据 |
|---|---|---|
| **R-1** | **活文件 `FIDV` 残留门** | 在活文件范围内运行 `rg -n 'FIDV|Financial Information [Tt]o Decision Visualization' README.md PUBLIC-PRIVATE.md POWER-KNOWLEDGE.md BE-CLASS Ind-Chain modules agent_tasklist agents .cursor/skills`：命中项**仅剩**物理路径/文件名（`fidv-launcher*`、`FIDV-*.html` 历史报告文件名）及已报备的 `Ind-Chain/data/companies.json:959`；**正文项目称呼 0 残留** |
| **R-2** | **模块图 26/35 与幂等烘焙** | `modules/graph.json` 节点与边仍为 **26 模块 / 35 边**，`title` 为 `"SFC module graph (W1 track)"`；`python3 modules/bake_static.py` 0 cross / 0 overlap 通过且 `modules/index.html` 幂等、无 `FIDV` |
| **R-3** | **回归门禁与 60 条 Golden 零差异** | `bash Ind-Chain/scripts/regress_all.sh quick` **ALL PASS**（26/35 模块图机检、静态检查、60 条 Golden API 0 diff） |
| **R-4** | **仓内 `.app` 重建与双 `--selftest`** | `bash Ind-Chain/scripts/build-standard-financial-charting-app.sh` 重建通过；`Standard-Financial-Charting.app/Contents/MacOS/Standard-Financial-Charting --selftest`（默认页与 `--start-path "/cube?ticker=NVDA%20US%20Equity"`）均返回 `ok: true, external: 0` |
| **R-5** | **公私隔离与史实不动** | `git status --short` 中無 `agents/`、无未跟踪 `agent_tasklist/*`、无 `Partner Work/`、无 `.vscode/`、无 `library/` 史实改动 |

---

## 五、当时模块清单与模块关系展示（据 `modules/graph.json` 静态真源，26 模块 / 35 边）

静态可打印页：`modules/index.html`（真源：`modules/graph.json`；本令仅将 `title` 由 `FIDV module graph (W1 track)` 改为 `SFC module graph (W1 track)`，26 模块与 35 条边结构零改动）。

- **FE（12）**：`FE-NAV` 导航 (`nav.js`) · `FE-BOARD` 展板 (`home.js`) · `FE-LIST` 列表 (`list.js`) · `FE-OPENCUBE` 跳转制图台 (`main.js`) · `FE-LISTAREA` 列表属地 (`nations.js`) · `FE-ACTION` 操作 (`state.js`) · `FE-COORDONE` 摆放坐标 (`coords.js`) · `FE-SCENE` 场景 (`scene.js`) · `FE-PANEL` 面板 (`ui.js`) · `FE-FOCUS` 聚焦 (`bondChart.js`) · `FE-API` 接口 (`api.js`) · `FE-AESTHETIC` 前端设计 (`app.css`)
- **BE（10 + 1）**：`BE-HTTP` (`app.py`) · `BE-BUNDLE` (`bundle_dispatch.py`) · `BE-DB-DEMO` (`db.py`) · `BE-DB-SHADOW` (`db_shadow.py`) · `BE-NVDA-LAYOUT` (`chain_layout.py`) · `BE-NVDA-LINKS` (`nvda_links.py`) · `BE-BICS-HIER` (`bics_hier.py`) · `BE-BICS-ENTITY` (`bics_entity.py`) · `BE-BICS-AREA` (`listing.py`) · `BE-BICS-INGEST` (离线导入脚本) · `MODULES-TRACK` (`modules/`)
- **SHELL（3）**：`SHELL-WINDOW` 壳窗口 · `SHELL-PROC` 内嵌后端 · `SHELL-PACK` 打包
- **35 条边**：FE `calls` 7 + FE `depends` 10 + 跨侧 `contract` 3 (`FE-API→BE-HTTP`, `BE-HTTP→MODULES-TRACK`, `SHELL-WINDOW→BE-HTTP`) + BE `calls` 8 + BE `depends` 3 + SHELL 其余 4 (`SHELL-WINDOW→SHELL-PROC`, `SHELL-PROC→BE-HTTP`, `SHELL-PACK→SHELL-WINDOW`, `SHELL-PACK→BE-HTTP`)。
