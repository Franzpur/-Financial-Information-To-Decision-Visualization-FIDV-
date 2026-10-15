# 内阁 → 总参谋部指令

**令号** GS-20261014-LOCAL-P2  
**日期** 2026-10-14  
**任务周期** 「SFC 本地化改革」（网页 → 独立应用），总规划见 `cabinet/plans/SFC-localization-plan.md`  
**本周期内阁下令计数** **第 2 次 / 不设上限**（P1 为第 1 次，三监第 3 次送审通过；谏言不计次）  
**本期** **P2 · 加固 + 离线 + 自包含分发**（内阁将原规划的 P2「加固」与 P3「打包」**合并为一道令**，理由见「并期说明」）  
**交** **总参谋部**（父代理须将本文**完整**转交 `general-staff` 立意志与任务单；产品码变更后按既有规则送监理部，内阁不令监理部；内阁不改产品码）  
**来源** 业主 Purkniv 原话：「指挥进行全部本地化改革，即从一个网页变成一个应用，要求依旧保留原有的模块结构，把本地化这件事做好。」（本轮无限次下令权）  
**依据** `cabinet/AUTHORITY.md` · P1 令 `cabinet/orders/GS-20261014-LOCAL-P1-shell-window.md` · P1 三监结论（见「P1 交付状态」）· 内阁实查（下「事实」）

---

## 意志（一句）

**把「能双击打开的壳」做成「别人也能用、断网也能用、出错有人话、数据不进安装包」的完整本地应用：单实例、数据与日志落用户目录、后端崩了会自救、Three.js 本地化、一个自包含的通用二进制 `.app` + zip。模块结构（原 23 模块 30 边 + 壳层）、FE/BE 分离、FE-API 唯一口、W1 窄口、不外联、公私隔离一概不让。**

---

## P1 交付状态（内阁据业主转述采信；总参可抽检）

- 壳：`Ind-Chain/shell/SFCShell.swift`（NSWindow + WKWebView；仅载 `127.0.0.1:<自选空闲端口>`；外链交系统浏览器；`--selftest`；⌘Q/⌘R/编辑/窗口菜单；信号清场）。
- `app.py`：`SFC_PORT`（1024–65535，非法非零退出，未设为 8787）、`SFC_PARENT_PID`（≤3 s 自清）、`SIGTERM` 优雅退出。
- `build-standard-financial-charting-app.sh`：探测 SDK（逐个 120 s 试编）；`--legacy` 重建 C 桩；`regress_api_golden.py`（55 条）、`regress_app_lifecycle.sh` 已入工作区。
- 模块图 25 / 33，原 23 / 30 未变；`web/` 零改动；三种退出清场无残留。
- **P1 未验、本期必须补的账（取证限制所致）**：① 整窗口截图 / WebGL 立方体**视觉**未验；② 关闭按钮未经 UI 路径测；③ **Three.js 仍从 jsdelivr CDN 加载**，离线时制图台不可用——这是 P1 留下的最大本地化缺口。
- **未提交 / 未 push**（GitHub 在 `019af67`）。本期**不提交、不 push**（提交归业主 / 书记流程，P4 给提交清单）。

---

## 并期说明（内阁取舍，留痕）

| 项 | 取舍 |
|----|------|
| 为何并 P2+P3 | 离线 three（FE 例外）、数据目录外置、单实例、通用二进制与自包含分发彼此咬合：**自包含包要求数据不能写进 `.app`（否则破坏签名封印）→ 必须先有数据目录外置；离线分发要求 three 本地化**。拆开会让第一期结束时仍有「半自洽」的中间态。 |
| 怎样控制风险 | 本令内分**两段交付**（段 I：加固与离线；段 II：打包分发），**每段结束都必须是可双击、可运行、回归全绿的状态**。总参可据此分两轮实施，三监可合并为一次送审，也可分两次；若三监只在段 II 出缺口，内阁走 `…-P2-FIX1` 完善令，不重来段 I。 |
| 仍有后续期 | **有：P4 收尾**（退役旧启动器与 C 桩、文档与公私表同步、模块图终检、全量回归、提交清单）。 |
| 不并入 | 内嵌 Python（见「业主决定项」）；代码签名升级 / 公证（无 Developer ID，内阁不代办）。 |

---

## 总则（本期红线，总参任务单须原样带入）

1. **FE 零改动，唯一例外（须明说，业主已被告知）**：`Ind-Chain/web/**` 仅允许下列**两项**，此外任何文件、任何一行不得动：
   - **(E1) 新增** 目录 `Ind-Chain/web/vendor/three/**`（three.js 的本地副本，见 C 段）。
   - **(E2) 改** `Ind-Chain/web/cube.html` 里 `<script type="importmap">` 中**两个 URL 值**（`"three"` 与 `"three/addons/"`），由 jsdelivr 改为同源相对路径。**不得**动该文件其余任何字符（含 `?v=57`、`<link>`、DOM）。
   验收：`git diff --stat -- Ind-Chain/web` 只出现 `cube.html`（≤ 2 行改）与 `vendor/three/**` 新增；`git diff -U0 -- Ind-Chain/web/cube.html` 逐行贴出。
2. **模块红线**：`modules/graph.json` 原 **23 模块 / 30 边** 逐条不变；P1 新增 `SHELL-WINDOW`、`SHELL-PROC` 与其 3 条边不变；本期**仅**允许新增 1 个模块 `SHELL-PACK` 与 2 条边（见 F 段）。总数 **26 / 35**。**不新增边类型、不合并、不删。**
3. **FE-API / W1 不动**：不加新 API 路由；不放宽静态路由与 `/modules/**` 窄口；`HOST` 仍写死 `127.0.0.1`；壳**不**向页面注入原生桥（无 `WKScriptMessageHandler`；`evaluateJavaScript` / `callAsyncJavaScript` 仍仅限 `--selftest` 诊断用）。
4. **后端改动面（有限放开）**：`server/app.py` 与 `server/db.py` 允许做**且仅做**「数据目录外置」（B 段）与「库损坏自愈」（B.5）。路由、静态根、读库逻辑、响应格式一概不动；R1 黄金对拍必须仍**逐条字节一致**。其余 `server/*.py` 不改。
5. **不外联（本期收紧）**：运行期壳与后端**零**非 loopback 连接；`web/` 里**零**外部 URL 引用（SVG 的 `xmlns` 命名空间字符串除外，须逐条列出）。**唯一允许的网络动作**：C 段取得 three.js 源文件时的**一次性、开发者手动**下载（见 C.1），之后入仓，运行期与构建期都不再联网。无遥测、无自动更新。
6. **公私隔离**：壳源码、构建脚本、`web/vendor/three/**` 进仓；**分发物（zip、`dist/`、`build/`）不进仓**，须入 `.gitignore`；不得把 `bics_entities_*.db`、`ind_chain.db`、日志、黄金响应正文提交。`agent_tasklist/`、`agents/`、`.cursor/`、`cross-integration/` 不动。
7. **开发路径不坏**：`python3 Ind-Chain/server/app.py`（无环境变量）仍监听 `127.0.0.1:8787`、数据仍在 `Ind-Chain/data/`、行为与改前字节一致；`SFC_PORT` / `SFC_PARENT_PID` 语义不变。
8. **旧启动器仍保留作回退**：`launcher_gui.py`、`standard-financial-charting-stub.c`、`--legacy` 本期**不删、不改**（P4 才退役）。
9. **不触碰**：`DESIGN.md`、`library/`、`BE-DATA/`、`BE-CLASS/` 数据本体、`Partner Work/`。
10. **美工部不调度**：窗口与错误面板只用既有 AESTHETIC token（`--bg #0b0d10`、`--muted #9aa6b5`、系统字体、系统按钮），不引入新色、新玻璃壳。图标**不重绘**，仅做尺寸齐全性校验（D.3）。若实施中认为必须新 token / 新图标，**先停下回报**，由总参决定是否调度 `art-department`。
11. **不提交、不 push、不 `git add`。**

---

## 事实（内阁实查，总参勿凭空重查，可抽检）

1. **当前数据流向**：`db.py` 的 `DB_PATH = ROOT/"data"/"ind_chain.db"`、`DATA_DIR = ROOT/"data"`（`ROOT` = `Ind-Chain/`，`__file__` 相对）；`app.py` 的 `NVDA_REVENUE_LINKS = ROOT/data/nvda-revenue-links.json`、`BICS_JSON` / `ENTITIES_DB` = **`ROOT.parent/BE-CLASS/BICS-Classification/…`**（`ENTITIES_DB` 以 `mode=ro` 只读打开）、`MODULES_ROOT = ROOT.parent/modules`。`ensure_db()`：库空即从 `data/companies.json` + `layers.json` seed。**可写文件只有 `ind_chain.db`（及其 `-journal`）和日志；其余皆只读输入。**
2. **仓内现有可写垃圾**：`Ind-Chain/data/` 里同时躺着 `ind_chain.db`、`launcher-last.log`、`shell-last.log`（均已在 `Ind-Chain/.gitignore`）；`__pycache__` 若写进 `.app` 内会**改动已签名的包**。
3. **体量**：`BE-CLASS` 28 MB（其中 `bics_entities_20261003.db` **未被 git 跟踪**——`PUBLIC-PRIVATE.md`「生成的 `.db` 仍不跟踪」）、`BE-DATA` 17 MB（**运行期不读**，仅 ingest 离线脚本用，W1 之外）、`Ind-Chain` 500 KB、`modules` 80 KB、现 `.app` 280 KB。
4. **外部依赖实查**：`web/` 内仅一处外联——`cube.html` 的 importmap（`three@0.170.0` 的 `build/three.module.js` 与 `examples/jsm/`）；`scene.js` 引 `three` 与 `three/addons/controls/OrbitControls.js`；全站无 webfont、无其它 CDN。
5. **工具链**：`swiftc 6.3.3`（须显式 `-sdk`，P1 脚本已探测）、`clang`、`lipo`、`iconutil`、`sips` 均在；**本机有 Rosetta**（`arch -x86_64` 可跑 x86_64 切片，用于验通用二进制）；`/usr/bin/python3` 3.9.6 universal；无 node。
6. **图标**：`Contents/Resources/AppIcon.icns` 46 KB（P1 前即有）；`Ind-Chain/assets/fidv-launcher-1024.png`（若在）为其母图，位置以 `Ind-Chain/assets/` 实查为准。
7. **Python 垫片陷阱**：未装 Command Line Tools 的 Mac 上，`/usr/bin/python3` 是个**垫片**，执行会**弹系统安装对话框**。P1 的 `findPython()` 直接执行它做版本探测，在这类机器上会触发弹窗而非给人话报错。
8. **黄金集**：`/tmp/sfc-golden-p1/`（55 条，P1 抓取，不入仓）；若已不存在，须在改 `app.py` 前对 `:8787` 开发路径**重抓**到新目录，并在笔记里说明（P1 已证 shell 路径与 8787 逐条一致，故可沿用）。
9. **P1 已定的不变量继续有效**：壳每次自选空闲端口；FE 无 `localStorage` / `indexedDB`，仅会话级 `sessionStorage`——**换端口 / 重启后端不丢任何用户状态**，故「崩溃自救换端口重载」无副作用，只有「回到冷启动页」。

---

## 指令

### 段 I · 加固与离线

#### A 段：壳的稳健性（改 `Ind-Chain/shell/*.swift`；SHELL-WINDOW / SHELL-PROC）

**A.1 单实例**
- 在 `Info.plist` 加 `LSMultipleInstancesProhibited = true`（Launch Services 层），**并**在壳内再设一道进程级保险：启动即在数据目录（见 B 段）取 `flock` 排他锁文件（如 `…/.sfc-instance.lock`）；取不到锁 ⇒ 用 `NSRunningApplication.runningApplications(withBundleIdentifier:)` 找到先到者并 `activate`，然后本进程**静默退出（码 0）**，**不得**拉起第二个后端。
- 两份 `.app`（仓内开发版与 `dist/` 分发版）bundle id 相同，则**互斥**——这是预期，须在文档里写明。
- `--selftest` **不受**单实例限制（须能与正在运行的 app 并存，以便自动化与回归），且自检使用独立临时数据目录（见 B.4），不得污染真实数据目录。
- 单实例的第二次激活要把已有窗口带到前台并解除最小化。

**A.2 错误面（取代 P1 的 `NSAlert`）**
- 在窗口内显示**原生 NSView 错误面板**（**不是** WebView 页面，更**不是**经 JS 桥的按钮；背景 `#0b0d10`，标题系统字体白灰、说明用 `--muted`、系统样式按钮）：一行**人话标题** + 一段**原因与办法** + 按钮 **「重试」「显示日志」「退出」**。「显示日志」用 `NSWorkspace.activateFileViewerSelecting` 定位日志文件。
- 必须覆盖并区分的场景（每个有独立文案，中文，不出现 Python 回溯原文，回溯只留在日志）：
  | 场景 | 面板标题（建议） | 要点 |
  |------|------------------|------|
  | 找不到应用资源（`Ind-Chain/server/app.py`；既非分发包内资源也非仓旁） | 找不到应用文件 | 说明应用包不完整或被移动；仓内开发版须放在 FIDV 仓库根 |
  | 无可用 Python | 需要 Python 3.9+ | 说明装 Xcode Command Line Tools（`xcode-select --install`）；**探测须避开垫片弹窗**（A.4） |
  | 后端未在时限内就绪 | 后端启动超时 | 日志位置；重试 |
  | 后端启动即退出 | 后端无法启动 | 取日志**末尾 20 行**中最后一条 `[Ind-Chain]` 起头的行（或最后一行）做「原因摘要」 |
  | 运行中后端退出且自救用尽 | 后端已停止 | 见 A.3 |
  | WebView 载入失败（`didFailProvisionalNavigation` / `didFail`） | 页面无法载入 | 同上 |
- 面板与 WebView **互斥显示**；点「重试」= 走与冷启动**同一条**启动路径（清场旧后端 → 重新拉起 → 就绪后载页）；**不得**出现两个后端子进程。
- 不再使用 `NSAlert` 做这些场景（`--selftest` 路径仍以 JSON 输出 `error` 字段）。

**A.3 崩溃自救（运行期监护）**
- 后端子进程**非预期退出**（非壳主动清场）：自动在**新空闲端口**重启，**最多 3 次 / 滚动 60 秒**；重启成功即 `load` 首页（用户会回到冷启动页，可接受；窗口上先显示 `Restarting…` 淡字，沿用 `statusLabel` 样式）；3 次用尽 ⇒ 错误面板「后端已停止」。
- **卡死检测**：后端进程仍在、但 `/api/health` **连续 3 次**（间隔 5 s、单次超时 2 s）失败 ⇒ 视同崩溃，`SIGTERM→2s→SIGKILL` 后按上条自救。心跳仅在 `.regular` 模式窗口存在期间运行，`--selftest` 关闭。
- `webViewWebContentProcessDidTerminate`（WebContent 进程崩）⇒ 自动 `reload` 一次；30 秒内再崩 ⇒ 错误面板「页面无法载入」。
- **所有重启与清场仍只经同一个清场函数**，只杀自己拉起的子进程；`grep -n "lsof\|pkill\|killall" Ind-Chain/shell/*.swift` 仍为空。

**A.4 Python 探测（避开垫片弹窗）**
- 对 `/usr/bin/python3`：先判断 CLT 是否真实存在（`/Library/Developer/CommandLineTools/usr/bin/python3` 可执行，或 `xcode-select -p` 退出码 0 且其下有 `usr/bin/python3`；任一满足即视为真实）；不满足则**跳过**该候选，**不执行**垫片。`/opt/homebrew/bin/python3`、`/usr/local/bin/python3` 照旧但不是垫片，可直接试。
- 全部不可用 ⇒ A.2 的「需要 Python 3.9+」面板。本机有 CLT，自动化验收用**环境变量注入的假路径**（如 `SFC_PYTHON_CANDIDATES=/nonexistent`，仅 `--selftest` 下生效且仅可**缩小**候选集，不得借此执行任意程序）演示该面板文案分支。
- 探测结果缓存于进程内，不重复起探测子进程。

**A.5 窗口与菜单完善**
- **窗口位置/大小记忆**：`setFrameAutosaveName`（存 `UserDefaults`，domain 为 bundle id）；恢复时**必须裁剪到当前可用屏幕**（防显示器拔掉后窗口在屏外），且不低于最小 960×640。`--selftest` 不记忆。
- 应用菜单「关于」使用 `orderFrontStandardAboutPanel` 带版本号（`CFBundleShortVersionString`）与一行说明「数据与计算全部在本机」（不外链）。
- 增「窗口 / 帮助」菜单项：**「显示日志」「显示数据文件夹」**（均 `activateFileViewerSelecting`；**不加**「在浏览器打开」）。
- 保持：关窗 = 退出；⌘Q / ⌘R / ⌘M / 全屏 / 编辑菜单；`SFC_DEBUG=1` 才可检查。

**A.6 启动超时分级**：数据目录内 `ind_chain.db` **不存在或为空**（首启要 seed）⇒ 就绪等待 **30 s**；否则 **15 s**。首启期间窗口淡字 `Starting…`（沿用 P1 样式）；不加进度条、不加新视觉。

**A.7 自检增强（`--selftest` 仍是诊断，不是用户功能）**：JSON 输出**增加**字段（不删旧字段）：
- `external`：页面发起的**非同源**资源请求数（用 `performance.getEntriesByType('resource')` 逐条比对 `location.origin`，**期望为 0**；`/cube` 路径下尤其要看 three）；
- `dataDir`（实际使用的数据目录）、`bundled`（是否分发包模式）、`pid` / `backendPid`；
- 渲染证据（补 P1 账）：新增 `--snapshot <png>` 的取图方式改为 **`WKWebView.takeSnapshot(with:)`**（只涉及本进程自己的视图，**无需屏幕录制权限，屏幕锁定也可用**），同时在 JSON 里输出 `nonBgRatio`（快照中与 `#0b0d10` 相差明显的像素占比）与 `webglDrawn`（`/cube` 下 canvas 中心区域像素非纯背景）。若 `takeSnapshot` 抓不到 WebGL 层，允许降级为 `NSView.cacheDisplay` / 窗口层捕获，**须在实施笔记写明采用哪种以及为何**，不得空缺。
- 新增 `--selftest-close`：自检页载入完成后，对窗口调用 `performClose(nil)`（等价于点红色关闭按钮的 AppKit 路径），断言 ≤ 3 s 内壳与后端均已退出；输出 `closeExit` 结果。

#### B 段：数据 / 路径外置（改 `app.py` / `db.py` 有限处）

**B.1 环境变量 `SFC_DATA_DIR`**（仅一个新变量）
- `db.py`：若设置，则 `DB_PATH = <SFC_DATA_DIR>/ind_chain.db`（`DATA_DIR` 的**读 seed 输入**语义保持：`companies.json`、`layers.json`、`nvda-revenue-links.json` 仍读自 `ROOT/data/`，因为它们是**只读随包输入**）；未设置 ⇒ **与现在逐字节相同**。路径须为绝对路径、可创建、可写；否则启动即报错退出（非零）并给出原因。
- `app.py`：日志里 `using SQLite → …` 行如实打印实际路径；其余路径常量不改。
- 仅此两处，**不借机重构**。

**B.2 数据目录位置**（由壳设定，**两种模式一致**，含仓内开发版 `.app`）：  
`~/Library/Application Support/Standard-Financial-Charting/`  
- 内含：`ind_chain.db`（及 `-journal`）、`.sfc-instance.lock`。  
- **日志**：`~/Library/Logs/Standard-Financial-Charting/backend.log`；每次启动前把上一份改名 `backend.prev.log`（只留一份；**不写**到 `.app` 内、不写 `Ind-Chain/data/`）。
- 目录权限仅当前用户（0700）。壳设 `SFC_DATA_DIR`、`SFC_PORT`、`SFC_PARENT_PID`、`PYTHONUNBUFFERED=1`，**分发包模式下另设 `PYTHONDONTWRITEBYTECODE=1`**（否则 Python 会往已签名 `.app` 内写 `__pycache__`，破坏封印）。
- `Ind-Chain/data/shell-last.log` 不再被壳写入；其 `.gitignore` 条目**保留**到 P4。

**B.3 资源定位双模式**（壳侧，SHELL-PROC）  
按序判定「应用资源根」`R`：  
1. **分发包模式**：`Bundle.main.resourcePath/sfc/` 下存在 `Ind-Chain/server/app.py` ⇒ `R = <Resources>/sfc/`；`bundled = true`。  
2. **仓旁模式**（P1 行为，保留）：自可执行文件上溯 4 级（`realpath`）得仓根，校验 `Ind-Chain/server/app.py`；`bundled = false`。  
- 两种模式下，后端的 `cwd` 皆为 `<R>/Ind-Chain/`；`app.py` 内以 `__file__` 相对解析的 `BE-CLASS`、`modules` 同位于 `<R>/` 下，**无需再改任何后端路径常量**——这是本期把包内目录布局做成「**与仓库同构**」的原因（见 E.2）。
- 都找不到 ⇒ A.2「找不到应用文件」。

**B.4 自检数据隔离**：`--selftest` 默认使用 `NSTemporaryDirectory()` 下的一次性数据目录与日志，结束即删；`--selftest-keep-data` 才用真实目录。

**B.5 库损坏自愈**（`app.py::ensure_db` 内最小处理）：打开/校验 `ind_chain.db` 抛 `sqlite3.DatabaseError` ⇒ 把坏文件改名为 `ind_chain.db.corrupt-<UTC时间戳>`（只留最近 2 份，更老者删），重建并 seed，日志写明；**绝不**因此删除用户其它文件。验收见 N7。

#### C 段：Three.js 本地化（FE 例外 E1 / E2）

**C.1 取得源文件（一次性、开发者手动、固定版本）**：three.js **精确版本 `0.170.0`**（与现 importmap 同版本，保证行为一致）。来源须是官方 npm 包（`registry.npmjs.org` 的 `three-0.170.0.tgz`）或与之字节一致的 jsdelivr 对应文件；**取得后记录并入仓** `Ind-Chain/web/vendor/three/README.txt`：版本、来源 URL、**每个入仓文件的 SHA-256**、MIT 许可证全文（随 `LICENSE` 入仓）。若沙盒阻断下载，实施方按权限流程申请网络授权，**不得**手搓、改写或从不明镜像取文件。
**C.2 入仓范围（最小集）**：保持与 CDN **同构的目录**（使相对 import 不需改写）：  
- `Ind-Chain/web/vendor/three/build/three.module.js`（及其在 r170 中所依赖的同目录文件——**以实际 import 闭包为准**，实施方须扫 `import … from './…'` 列出闭包）  
- `Ind-Chain/web/vendor/three/examples/jsm/controls/OrbitControls.js`（及其闭包）  
- `Ind-Chain/web/vendor/three/LICENSE`、`README.txt`  
- **不入**：`examples/` 其余、`src/`、`.map`、`package.json`、文档。
**C.3 改 importmap（E2）**：`"three": "/vendor/three/build/three.module.js"`，`"three/addons/": "/vendor/three/examples/jsm/"`（同源绝对路径，经现有静态路由 `web/` 提供，**不新增路由**，W1 不变；`vendor/` 位于 `web/` 之下，自然只读、不泄露别处）。
**C.4 离线实证**（取代「相信它能用」）：  
- `--selftest --start-path /cube?…`（选 NVDA 链路 ticker）输出 `external == 0`、`canvases ≥ 1`、`webglDrawn == true`；  
- **断网实测**：在系统网络层面不可用的前提下（可用 `networksetup` 无权限则改用「拔网 / 关 Wi-Fi」由业主复核清单兜底；**自动化替代**：以 `curl --noproxy '*' https://cdn.jsdelivr.net/` 失败 + 在页内对 `performance` 资源列表断言 `external==0` 联合佐证）；  
- `rg -n "https?://" Ind-Chain/web --glob '!vendor/**'` 逐条列出，除 SVG `xmlns` 之外应无命中；  
- 对 `/vendor/three/build/three.module.js` 的 `GET` 返回 200 且 `sha256` 与 `README.txt` 一致；`/vendor/../server/app.py`、`/vendor/%2e%2e/…` 仍 404（W1）。
**C.5 黄金集**：`regress_api_golden.py` 的请求清单**追加**：`/vendor/three/build/three.module.js`（以其 sha256 为准）与 `/cube`（cube.html 因 E2 变化，**须更新其黄金并在笔记说明唯一变化是 importmap 两个 URL**）。其余 55 条仍须逐条不变。

#### D 段：构建与图标（改 `build-standard-financial-charting-app.sh`）

**D.1 通用二进制**：对每个架构（`arm64`、`x86_64`）各自 `swiftc -target <arch>-apple-macos11.0 -O -sdk <探测到的SDK>`（SDK 探测沿用 P1，120 s 试编；**每个架构单独验证可编**），再 `lipo -create` 合并。任一架构失败 ⇒ 整体失败、**不覆盖**已有可用可执行文件、非零退出。`SFC_ARCHS=native` 环境变量可只出宿主架构（开发提速用）。
**D.2 Info.plist**：同步**脚本内嵌模板与仓内现有 `Info.plist` 两处**：`LSMultipleInstancesProhibited=true`；`CFBundleShortVersionString`/`CFBundleVersion` 升 `2.1`/`3`；`NSHumanReadableCopyright`（一行，不含外链）；`LSApplicationCategoryType=public.app-category.finance`；**不加** `NSAllowsArbitraryLoads`（P1 已验 loopback 不需 ATS 键，本期复验：若 `NSAllowsLocalNetworking` 当前存在则保持，不存在则**不加**）；`LSMinimumSystemVersion` 保持 `11.0`。
**D.3 图标校验**：`iconutil -c iconset` 解 `AppIcon.icns`，检查含 16/32/128/256/512 及各 `@2x`（即最大 1024）。**缺哪些就用 `sips` 从现母图缩放补齐**并重新 `iconutil -c icns`；**像素内容不得改**，只做缩放补全。不缺则**不动**，并在笔记写「已齐全」。
**D.4 签名**：保持 ad-hoc；增加签名后自检 `codesign --verify --deep --strict` 退出 0，并 `spctl -a -vv`（预期 **rejected**——ad-hoc 未公证，属已知；笔记里如实写出原文，不得宣称通过 Gatekeeper）。

---

### 段 II · 自包含分发

#### E 段：自包含 `.app` 布局与白名单打包

**E.1 新增脚本 `Ind-Chain/scripts/package-standard-financial-charting.sh`**（纯 bash + 系统工具，无第三方依赖），产出：
- `dist/Standard-Financial-Charting.app`（自包含）
- `dist/Standard-Financial-Charting-<version>-<YYYYMMDD>.zip`（用 `ditto -c -k --keepParent` 打，保留签名与权限；**不用** `zip -r`）
- `dist/SHA256SUMS.txt`
- `dist/README-先读我.txt`（给收件人：前置条件、首次打开方式、数据在哪、如何卸载、已知限制；中文，**见 E.4**）
`dist/` 与 `build/` 写入根 `.gitignore`（若根无 `.gitignore` 则建，内容只含这两项；**不得**改动其它既有忽略语义）。

**E.2 包内布局（与仓库同构，故不改后端路径）**
```
Standard-Financial-Charting.app/Contents/
  Info.plist  PkgInfo
  MacOS/Standard-Financial-Charting         ← 通用二进制（D.1）
  Resources/AppIcon.icns
  Resources/sfc/
    Ind-Chain/server/*.py                    ← 只拷 server/（排除 __pycache__）
    Ind-Chain/web/**                         ← 含 vendor/three
    Ind-Chain/data/{companies.json,layers.json,nvda-revenue-links.json}   ← 仅这三份
    Ind-Chain/scripts/seed.py                ← 若 db.py/app.py 的 seed 路径需要；以实际 import 为准，不需要则不拷
    BE-CLASS/BICS-Classification/bics-equity-hierarchy-2024.json
    BE-CLASS/BICS-Classification/bics_entities_20261003.db   ← 见 E.3
    modules/{graph.json,index.html}          ← 仅 W1 窄口所服务的文件
    VERSION.txt                              ← 版本、构建时间、git 短哈希、SDK、各 sha256 清单摘要
```
- **必须是「白名单」拷贝**（逐文件 / 逐目录显式列出），**不是**「整仓拷贝再剔除」。**绝不**进包：`BE-DATA/`、`Partner Work/`、`library/`、`agent_tasklist/`、`agents/`、`.cursor/`、`cross-integration/`、`cabinet/`、`.git*`、`*.db`（除 E.3 那一份）、`*.log`、`__pycache__`、`ind_chain.db`、`launcher_gui.py`、C 桩源码、`.DS_Store`。
- 拷贝后**自检**：对包内 `Resources/sfc` 递归枚举，与白名单逐项比对，出现任何**白名单外**文件 ⇒ 脚本失败退出（打印多余文件）。

**E.3 实体库的公私与合规（必须明说）**  
`bics_entities_20261003.db` 来自彭博数据加工，**未被 git 跟踪**（`PUBLIC-PRIVATE.md`）。
- 构建机上**存在**则打入包，并在 `README-先读我.txt` 与 `VERSION.txt` 里写明「**本包含第三方数据加工物，仅限团队内部分发，不得公开发布 / 上传公共网站**」。
- **不存在**则脚本**失败**并提示（不静默出一个缺数据的包）；另提供 `--no-entities` 显式开关出「无实体库」包，此时 README 须写明名单功能降级的实际表现（以实测为准：对该情形 `app.py` 如何响应须在笔记里实测并如实写入，若会 500 必须报告，不得隐瞒；**不得**为此改路由语义）。
- 脚本**不得**把该 db 或 `dist/` 加入 git；脚本末尾打印一次性提醒。

**E.4 `README-先读我.txt` 必写内容（用事实填空，不得凭空）**  
① 系统要求：macOS 11+，Apple 芯片或 Intel；② **前置条件：本机须有 Python 3.9+（通常通过 Xcode Command Line Tools 提供）**——这是本期**有意保留**的唯一外部依赖，缺则应用会给出面板提示；③ **首次打开**：未公证，需「右键 → 打开」或 `xattr -dr com.apple.quarantine <路径>`，逐字给命令；④ 数据位置与日志位置（B.2），如何清除（删该目录）；⑤ 单实例说明；⑥ **离线可用**（含 three）；⑦ 版本与校验和；⑧ 内部分发提示（E.3）；⑨ 不收集任何数据、不联网。

**E.5 自包含验证（核心，必须实跑）**
- 把 `dist/…app` 拷到**一个与仓库无关的路径**（如 `/tmp/sfc-pack-test/`）运行。**禁止**为证明「不读仓库」而改名 / 移动真实仓库目录（风险过大）。可验证的做法：对后端进程用 `lsof -p <backend pid>` 与 `ps -o command=` 检视其 `cwd`、`argv`、已打开文件，断言**全部落在 `…/Contents/Resources/sfc/` 与数据目录**（及系统库），`app.py` 路径在包内，且**不含**仓库根路径。
- 在**无 `Ind-Chain/data/ind_chain.db` 的包**（包内本就无）上冷启动：首启 seed 成功，数据落入 `~/Library/Application Support/Standard-Financial-Charting/`；**包内无任何新增 / 修改文件**（对 `Resources/sfc` 做启动前后的 `find … -type f | sort | shasum` 对比，必须一致）；`codesign --verify --deep --strict` 在运行**之后**仍通过（证明未破坏封印）。
- 模拟 **Gatekeeper 隔离**：对测试副本 `xattr -w com.apple.quarantine "0081;00000000;Safari;"`，然后按 README 的 `xattr -dr` 命令解除，应用可打开（**App Translocation** 下路径随机且只读，包内路径定位仍应成立——仅当 `open` 隔离副本能被系统放行时测；若需要 UI 点击放行而无法自动化，**如实标「未验」**并列入业主复核清单）。
- **通用二进制**：`lipo -archs` 为 `x86_64 arm64`；`arch -arm64` 与 `arch -x86_64`（本机有 Rosetta）**各跑一次 `--selftest`**，均输出 `ok:true`。
- 解压 zip 后（`ditto -x -k`）再验一次签名与 `--selftest`。

#### F 段：模块图（原 23 / 30 + 壳层 25 / 33 不动，新增 1 模块 2 边）

- `modules/graph.json` 新增模块：  
  | id | zh | side | region | role（英文，与现有风格一致） |
  |----|----|------|--------|------|
  | `SHELL-PACK` | 打包 | `SHELL` | `shell` | `Build-time packaging: universal binary, allow-listed self-contained .app, zip; not shipped at runtime` |
- 新增边 2 条（**类型沿用 `depends`**，不新增类型）：`SHELL-PACK → SHELL-WINDOW`；`SHELL-PACK → BE-HTTP`（表示打包白名单依赖服务端目录布局；这是跨侧边，沿用既有跨侧红色规则）。
- 总数 **26 / 35**。`bake_static.py` 仅**新增**节点几何与边走线，**原 23 节点与 30 边、P1 的 SHELL-WINDOW / SHELL-PROC 与其 3 边的几何与走线不得改变**；新节点放入既有 `shell` 区的留白，**不得压住任何既有节点或边**；烘焙后 `modules/index.html` 由脚本生成（不手改），并断言「原节点矩形未重叠、原边端点未改、新边不与既有边交叉不重合」（沿用 W1 的「无交叉、无重合」布线规则）。**若新边无法在不动既有布线的前提下无交叉布出，须停下回报**，不得靠改既有走线蒙混。
- `graph.json` 的 `updated`、`note` 如实更新（`note` 增一句「P2: SHELL-PACK」）。

---

## 验收（三监与内阁复核据此逐项打勾；每项需有可复现证据）

### 新增功能与加固

| # | 验收项 | 证据 |
|---|--------|------|
| N1 | **单实例**：已运行时再 `open` 一次 ⇒ 不出现第二个窗口 / 第二个后端；已有窗口被激活；直接 exec 第二个壳二进制亦被 flock 拒绝（码 0 静默退出）；`--selftest` 不受影响 | `pgrep` 计数、`lsof` 看后端数 = 1；命令输出原文 |
| N2 | **错误面板**：构造 4 种故障各演示一次——① 资源缺失（把测试副本 `Resources/sfc` 改名）；② 无 Python（`SFC_PYTHON_CANDIDATES=/nonexistent`）；③ 后端启动即退出（`SFC_PORT` 非法或让 `app.py` 抛错的**测试副本**）；④ 就绪超时（测试副本里让 `/api/health` 久不应答）。各面板标题 / 原因文案与上表一致；「重试」「显示日志」「退出」可用；面板出现期间**无遗留后端进程** | 面板文本导出（可由 `--selftest` JSON 的 `error` / `panel` 字段，或 `takeSnapshot` 快照）；注：**不得**为造故障修改仓内正式代码，只改**测试副本** |
| N3 | **崩溃自救**：运行中 `kill -9 <后端pid>` ⇒ ≤ 10 s 内新端口新后端就绪、窗口重载首页；连杀 4 次（60 s 内）⇒ 第 4 次出现「后端已停止」面板，无无限重启；`kill -STOP <后端pid>` 模拟卡死 ⇒ ≈ 15–20 s 内被判卡死、清场重启 | 时间戳与 `pgrep` 输出；日志相关行 |
| N4 | **数据外置**：运行后 `Ind-Chain/data/` **无**新增或更新的 `ind_chain.db` / 日志（对比启动前后 `mtime`）；真数据在 `~/Library/Application Support/Standard-Financial-Charting/`；日志在 `~/Library/Logs/Standard-Financial-Charting/backend.log`，次次启动轮转出 `backend.prev.log`；两目录权限 0700 | `ls -la`、`stat` 输出 |
| N5 | **开发路径不坏（再验）**：`python3 Ind-Chain/server/app.py` 无环境变量 ⇒ `127.0.0.1:8787`、数据仍写 `Ind-Chain/data/ind_chain.db`；设 `SFC_DATA_DIR=/tmp/x` ⇒ 库落 `/tmp/x`；`SFC_DATA_DIR=/nonexistent/readonly` 非零退出并给原因 | 命令输出 |
| N6 | **窗口记忆**：移动 / 缩放后退出再开，位置大小恢复；把保存的位置改到屏外（改 `defaults`）后再开，窗口被裁回可见屏；最小尺寸生效 | `defaults read` 与窗口 `bounds`（可用 `--selftest` 无法测，则用 AppleScript 读窗口 bounds；无权限则列入业主复核清单并如实标注） |
| N7 | **库损坏自愈**：向数据目录里的 `ind_chain.db` 写入垃圾字节后启动 ⇒ 应用正常起；坏文件被改名为 `.corrupt-<ts>`；库已重建；日志有说明；其它文件未被动 | `ls`、日志原文 |
| N8 | **启动分级**：首启（无库）就绪等待上限 30 s，非首启 15 s；首启 `Starting…` 可见 | 日志与计时 |
| N9 | **无垫片弹窗**：模拟无 CLT（A.4 的候选集收缩）⇒ 不执行 `/usr/bin/python3`、不弹系统安装框，直接出面板 | 进程审计（`log stream` 或 `ps`）+ 面板文案 |

### 离线（three）

| # | 验收项 | 证据 |
|---|--------|------|
| O1 | `/cube` 路径 `--selftest`：`external == 0`、`canvases ≥ 1`、`webglDrawn == true` | JSON 原文 |
| O2 | **FE 例外范围精确**：`git diff --stat -- Ind-Chain/web` 仅 `cube.html`（≤ 2 行改）+ `vendor/three/**` 新增；`cube.html` 的 `-U0` diff 原文 | 命令输出 |
| O3 | `README.txt` 中每个入仓文件的 SHA-256 与磁盘一致，版本 `0.170.0`，含 MIT 许可全文 | `shasum -a 256 -c` 输出 |
| O4 | `rg -n "https?://" Ind-Chain/web --glob '!vendor/**'` 无外部 URL 命中（SVG `xmlns` 逐条解释） | 命令输出 |
| O5 | 制图台**视觉**（补 P1 账）：`--snapshot` 生成的 PNG 里**目视可见**立方体 / 环 / 点（不得空白、不得纯背景）；`nonBgRatio` 给数值；**内阁会读该 PNG** | PNG 路径（放 `/tmp/sfc-evidence/`，不入仓；父代理须在回报里引用路径，必要时复制到 `cabinet/` 供内阁读，但**不要**复制进 `library/`） |

### 自包含分发

| # | 验收项 | 证据 |
|---|--------|------|
| D1 | `package-…sh` 在本机一次成功；产出 `.app`、zip、`SHA256SUMS.txt`、`README-先读我.txt`；`dist/` 未被 git 跟踪（`git status --short` 无 `dist/`；`git check-ignore -v dist` 命中） | 命令输出 |
| D2 | **白名单严格**：包内 `Resources/sfc` 文件清单与 E.2 白名单逐项一致；`BE-DATA`、`Partner Work`、`library`、`.git`、`ind_chain.db`、日志、`__pycache__`、旧启动器均**不在**包内 | `find` 清单 + 比对结果 |
| D3 | **自包含运行**（E.5）：在与仓库无关路径运行；后端 `cwd`/`argv`/打开文件全落包内与数据目录；运行前后包内文件 sha 清单一致；运行后 `codesign --verify --deep --strict` 仍通过 | 命令输出 |
| D4 | **通用二进制**：`lipo -archs` = `x86_64 arm64`；两架构各 `--selftest` 均 `ok:true` | 命令输出 |
| D5 | zip 解压后签名有效、`--selftest` 通过；`SHA256SUMS` 一致 | 命令输出 |
| D6 | `spctl -a -vv` 结果如实记录（预期 rejected）；`README` 的「右键打开 / xattr」步骤逐字可用（对带隔离属性的测试副本实跑 `xattr -dr` 后能启动） | 输出原文 |
| D7 | `README-先读我.txt` 含 E.4 九项；写明「第三方数据加工物仅限内部」 | 文件全文 |
| D8 | 缺实体库时脚本**失败并提示**；`--no-entities` 可出包，且名单降级行为已**实测并如实写入** README | 命令输出 |

### 回归（本期继续全跑，P1 的口径不放松）

| # | 验收项 | 方法 |
|---|--------|------|
| **R1** | 旧 API 响应一致 | 黄金集 `compare`：①壳拉起端口 ②`:8787` 开发路径 ③**分发包拉起端口** 三处各一次；除 C.5 声明的 `/cube` 与新增的 vendor 项外**全部逐条一致**（`modules/graph.json` / `modules/` 页因 F 段变化须按 `--allow-changed` 明列并说明） |
| **R2** | W1 | 越权路径（`/../`、`/%2e%2e/`、`/data/ind_chain.db`、`/server/app.py`、`/BE-DATA/`、`/BE-CLASS/`、`/vendor/../server/app.py`、`/vendor/%2e%2e/server/app.py`、数据目录里的文件名）一律 404 / 拒绝；后端仅 `127.0.0.1:<port>`；窗口内无 `file://` |
| **R3** | 冷启动 | 窗口 ≤ 2 s；页面可交互 ≤ 10 s（分发包 + 首启 seed 单列计时） |
| **R4** | 退出不留僵尸 | ⌘Q、**关闭按钮路径（`--selftest-close`，补 P1 账）**、`SIGTERM` 壳、`SIGKILL` 壳，四种各一次 ≤ 3 s 清场；**对分发包也各做一次** |
| **R5** | 端口被占 | `python3 -m http.server 8787 --bind 127.0.0.1` 占住后开 `.app`：正常、不杀占用者；`grep -n "lsof\|pkill\|killall" Ind-Chain/shell/*.swift` 为空 |
| **R6** | 模块图不变量 | 脚本 diff：原 23 / 30 与 P1 新增 3 边逐条在；总数 **26 / 35**；新增恰为 `SHELL-PACK` 与上列 2 边 |
| **R7** | FE 例外范围 | 见 O2；`git diff -- Ind-Chain/web` 之外的任何 `web/` 文件**零改** |
| **R8** | 开发路径 | 见 N5 |
| **R9** | `SFC_PORT` 校验 | `abc`、`80`、`70000` 非零退出；`18787` 正常 |
| **R10** | 构建稳健 | 一次成功；`--legacy` 仍成功；人为令 SDK 探测失败 / 单一架构失败时**不覆盖**旧可执行文件 |
| **R11** | 无外联 | 壳与后端（含分发包）`lsof -nP -i -a -p <pid>` 仅 `127.0.0.1`；页面 `external == 0` |
| **R12** | 前端三段行为（补 P1 账） | 窗内：冷启动页 → 展板（L1–L3）→ 列表（L4）→ 制图台，用 `--start-path` 逐段 `--selftest` + `--snapshot` 取证（三张 PNG）；与 `:8787` 同址行为对拍无功能缺失 |

### 业主复核清单（自动化无法覆盖，交回时须逐条标「已验 / 未验」，**不得替业主打勾**）

1. 实际鼠标点红色关闭按钮 ⇒ 应用与后端同退（自动化只验了 AppKit `performClose` 等价路径）。
2. 屏幕解锁后目视一次 `/cube`：立方体可旋转缩放（自动化只验了快照像素）。
3. 断开真实网络（关 Wi-Fi）后冷启动一次，制图台仍出图。
4. 把 zip 拷到另一台未装开发环境的 Mac：按 README 右键打开，能用 / 缺 Python 时出面板。

---

## 不做（本期明令不做）

- 不内嵌 Python、不 `pip install`、不下载任何二进制解释器。
- 不做 Developer ID 签名 / 公证 / dmg（无账号；内阁不代办；zip 即可）。
- 不改前端框架、不引入 JS 构建链；不动 `web/` 除 E1/E2。
- 不新增 API 路由；不放宽静态路由；不开放 `file://`；不加 JS 桥。
- 不做自动更新、不做遥测、不做崩溃上报外发。
- 不做多窗口、不做多标签、不做 Dock 菜单、不做 Touch Bar。
- 不删除 `launcher_gui.py`、C 桩、`--legacy`（P4）。
- 不改 `DESIGN.md` / `library/` / `BE-DATA` / `BE-CLASS` 数据 / `Partner Work/`；不提交、不 push。
- 不借机重构 `app.py` / `db.py` / `SFCShell.swift` 既有结构（A–B 段新增功能可拆新 `.swift` 文件放在 `Ind-Chain/shell/`，但不改既有函数的行为语义）。

---

## 业主决定项（均已给默认，**本期不发问**）

| 项 | 默认 | 何时才需业主 |
|----|------|--------------|
| 是否内嵌 Python（免 CLT，对无开发环境的机器更友好） | **否**（保持系统 Python；包会明示前置条件并出面板） | 若业主要把包发给**普遍没装 CLT 的外部人员**，内阁在 P4 前追加「内嵌 Python」可选令（约 +30–60 MB，需下载第三方预编译解释器，须业主点头并指定来源） |
| 签名 / 公证 | ad-hoc；他机首开「右键打开」 | 业主有 Apple Developer ID 并要免提示分发时 |
| 实体库入包 | 入包，但仅限内部分发（E.3） | 业主要对外发包 ⇒ 须用 `--no-entities` 或另行授权数据 |

---

## 分工建议（总参定夺，内阁仅建议）

- **主代理（实施）**：A–F 全部。建议先段 I（A、B、C、D）再段 II（E、F），段 I 完成即可单独回归；两段可合并送审。
- **美工部**：**不调度**（见总则 10）。
- **信息部 / 交叉整合部 / 参谋纪要官**：不调度。
- **给监理部的提示（总参可写入任务单「后续」，内阁不令监理部）**：本期涉及**原生窗口 + 打包产物**，`engineering-test` 须以 `--selftest` JSON、`takeSnapshot` 的 PNG 与**对分发包副本的实跑**为证据；N3（kill -9 / -STOP）、N7（损坏库）、R4（四种退出，分发包亦做）应**实跑**，不凭读码判定；O5 的 PNG 需**被看**（不只看数值）。屏幕锁定 / 无屏幕录制权限时，`takeSnapshot` 方案不依赖二者，应当可用；若仍抓不到，须说明并列入业主复核清单，**不得**写「已验」。

---

## 交回（父代理在三监后回报内阁时须含）

1. 改动文件清单（新增 / 修改，逐路径）；`git diff --stat`；`git status --short` 中确认 `dist/` 与 `build/` 未入。
2. 黄金集：条数（含 C.5 增项）、`compare` 三处（壳拉起 / `:8787` / 分发包）输出原文；`/cube` 黄金变化的 diff（仅 importmap）。
3. 验收 N1–N9、O1–O5、D1–D8、R1–R12 逐项结论与证据；业主复核清单四项**逐条标已验 / 未验**。
4. 实施笔记：快照方案选型与原因；three 的 import 闭包清单与 sha256；图标是否补齐；`spctl` 原文；`--no-entities` 的实测降级表现；任何偏离本令之处及理由。
5. `modules/graph.json` 新旧 diff 摘要（26 / 35）与烘焙后静态页路径。
6. 三监报告结论。

内阁据此做复核：全过 ⇒ 写 **P4 收尾令**（退役旧启动器与 C 桩、README / PUBLIC-PRIVATE / CONCEPTS 同步、`regress_*` 脚本整理、模块图终检、全量回归、提交清单）；有缺口 ⇒ 追加 `GS-20261014-LOCAL-P2-FIX1` 完善令（不计期，不限次）。
