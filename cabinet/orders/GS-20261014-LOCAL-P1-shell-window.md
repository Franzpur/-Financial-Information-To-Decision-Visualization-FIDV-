# 内阁 → 总参谋部指令

**令号** GS-20261014-LOCAL-P1  
**日期** 2026-10-14  
**任务周期** 新周期「SFC 本地化改革」（网页 → 独立应用），共规划 P1–P4，见 `cabinet/plans/SFC-localization-plan.md`  
**本周期内阁下令计数** **第 1 次 / 不设上限**（业主明令「无限次下令权限」；谏言不计次；不含此前周期）  
**本期** **P1 · 窗口壳与内嵌后端生命周期**  
**来源** 业主 Purkniv 原话：「电内阁，指挥进行全部本地化改革，即从一个网页变成一个应用，要求是依旧保留原有的模块结构，本轮你有无限次下令权限，你自己规划一次下令多少，执行多少，把事情做的有条理，把本地化这件事做好。」  
**依据** `cabinet/AUTHORITY.md` · `cabinet/plans/SFC-localization-plan.md`（技术路线与红线以该文为准，本令不重复论证）· 内阁实查（下「事实」节）  
**父代理动作** 将本文**完整**转交 `general-staff`，立意志与任务单。产品码变更后按既有规则送监理部（内阁不令监理部）。内阁不亲自改产品码。**调度建议见「分工」节。**

---

## 意志（一句）

**双击 `Standard-Financial-Charting.app`，直接得到一个独立窗口，窗内就是原来的界面；壳自己把后端拉起来，关窗即把后端清干净——用户不再碰终端、端口、浏览器。FE、BE、FE-API、W1 窄口、原 23 模块 30 边，一个字不动。**

---

## 总则（本期红线，总参任务单须原样带入）

1. **FE 零改动**：`Ind-Chain/web/**` 不改（任何文件）。验收 `git diff -- Ind-Chain/web` 为空。
2. **FE-API / W1 不动**：不加新 API 路由语义；不放宽静态路由；仍只绑 `127.0.0.1`；壳**不**向页面注入任何原生桥（不用 `WKScriptMessageHandler` / `evaluateJavaScript` 把本机能力暴露给页面；`evaluateJavaScript` 仅限 `--selftest` 读取诊断用）。
3. **后端语义不动**：仅允许对 `Ind-Chain/server/app.py` 做「启动参数化 + 父进程监护」两处最小改动（见 B 段）。其它 `server/*.py` 不改。
4. **旧启动器保留作回退**：`launcher_gui.py`、`standard-financial-charting-stub.c` **本期不删、不改**（P4 才退役）。构建脚本保留 `--legacy` 可重建旧 C 桩。
5. **开发路径不坏**：`python3 Ind-Chain/server/app.py`（无环境变量）仍监听 `127.0.0.1:8787`，行为与改前字节一致。
6. **不触碰**：`DESIGN.md`、`library/`、`agent_tasklist/`（除调度所需）、`BE-DATA/`、`BE-CLASS/` 数据本体、`Partner Work/`。
7. **不外联**：壳与后端均不发起任何非 loopback 网络请求；无遥测。
8. **公私隔离**：壳源码进仓；运行日志 `Ind-Chain/data/shell-last.log` 须加入 `Ind-Chain/.gitignore`；不得把构建临时目录、黄金响应正文提交。

---

## 事实（内阁实查，总参勿凭空重查，可抽检）

### 现状入口链

1. `Standard-Financial-Charting.app/Contents/MacOS/Standard-Financial-Charting` 是 **C 桩（Mach-O）**，源码 `Ind-Chain/scripts/standard-financial-charting-stub.c`。它从自身路径上溯 4 级得「仓根」，找 `/usr/bin/python3`（须含 `tkinter`），`execl` 跑 `Ind-Chain/scripts/launcher_gui.py`。
2. `launcher_gui.py`：tkinter 小窗，启动时 `seed.py` → `Popen(server/app.py)` → 用户点「Open homepage」调 `webbrowser.open("http://127.0.0.1:8787/")`。**退出时 `lsof -ti :8787` 后对占端口者全部 `SIGTERM`——会误杀外部进程。新壳路径不得继承此行为。**
3. `app.py`：`HOST="127.0.0.1"`、`PORT=8787` 写死（约第 41–42 行）；`main()` 调 `ensure_db()`（库空则自动 seed）后 `ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()`。`/api/health` 返回 `{"ok": true}`，不碰 DB，是现成的就绪探针。路由：`/`、`/list`、`/cube`、静态 `web/**`、`/modules/**`、`/api/health|meta|layers|companies|bundle|bics/{l1,children,node,locate,entities}`。
4. FE 不依赖固定端口：`web/` 内无 `localStorage` / `indexedDB`；仅 `sessionStorage("fidvSplashSeen")`（会话级，冷启动页每次开窗都会出现，符合预期）；页面跳转全为同源相对 `location.assign`。**因此壳每次可用任意空闲端口，无「换端口丢状态」问题。**
5. `.app` 已有 `Info.plist`（bundle id `local.fidv.Standard-Financial-Charting`、`LSMinimumSystemVersion 11.0`、图标 `AppIcon.icns`）、`_CodeSignature`（ad-hoc）。`.app` 整体**已被 git 跟踪**。

### 本机工具链（内阁实测）

6. 有 `swiftc 6.3.3` 与 `clang`（Command Line Tools）；**无** node / rust / brew / Xcode。`/usr/bin/python3` = 3.9.6，universal（x86_64 + arm64e）。
7. **SDK 陷阱（必读）**：CLT 默认 SDK 指向 `MacOSX27.0.sdk`，与 `swiftc 6.3.3` 不匹配，直接 `swiftc x.swift` 会报 `failed to build module 'Swift'; this SDK is not supported by the compiler`。内阁已实证：**`-sdk /Library/Developer/CommandLineTools/SDKs/MacOSX26.5.sdk` 可编过 `import Cocoa; import WebKit; WKWebView(frame:.zero)` 并运行**；`MacOSX26.sdk`、`MacOSX15.4.sdk` 亦实测可编过（首次试编较慢，三个合计约 70 秒，并非卡死；**更正**内阁先前「26.sdk 卡死」的误判）。27.0 / 27 系列与编译器不匹配。构建脚本须**自动探测**：对 `SDKs/MacOSX*.sdk` 由新到旧、各以**最小 Swift 文件 + 120 秒超时**试编（首次冷编译慢，超时不宜短），取第一个能编过的（本机即 26.5）；全不行则打印明确报错并退出非零。**不得把单一 SDK 路径写死。**

---

## 指令

### 步骤 0（先于一切改动）：回归基线——旧 API 黄金响应

1. 新增 `Ind-Chain/scripts/regress_api_golden.py`（纯 stdlib，无第三方依赖），两个子命令：
   - `capture --base http://127.0.0.1:<port> --out <dir>`：对**固定请求清单**逐条 GET，把「状态码 + 响应体字节」存成文件，并写 `MANIFEST.sha256`。
   - `compare --base http://127.0.0.1:<port> --golden <dir>`：重抓并与黄金逐条比对，不一致则非零退出并列出差异。
2. **请求清单**由总参 / 实施方从 `web/js/api.js`、`home.js`、`list.js`、`main.js` 与 `app.py` 路由表读出，须**覆盖每一个路由**，且至少含：`/api/health`、`/api/meta`、`/api/layers`、`/api/companies`（及一个 `/api/companies/<id>`）、`/api/bics/l1`、`/api/bics/children`（至少 2 个不同父节点）、`/api/bics/node`、`/api/bics/locate`、`/api/bics/entities`（含一个带 listing 参数者，若有）、`/api/bundle`（**NVDA** 链路、**一个非链 ticker 走 shell**、**demo** 三种 mode 各一）、`/api/nope`（404 体）、`/`、`/list`、`/cube`、`/css/app.css`、一个 `/js/*.js`、`/modules/graph.json`。请求清单写在脚本内常量里，随脚本入仓。
3. **在改动 `app.py` 之前**，用现有 `python3 Ind-Chain/server/app.py`（8787）抓黄金，存放 `/tmp/sfc-golden-p1/`（**不入仓**）。若某响应含时间戳等天然非确定字段，须在脚本里显式列出并说明排除规则，不得悄悄忽略。
4. 此黄金集在 P2、P3、P4 复用；脚本入仓即为后续各期的对拍工具。

### A 段：Swift 壳（新增模块 `SHELL-WINDOW` 壳窗口）

新增目录与文件（FE/BE 分离不破：壳是第三方位置）：

- `Ind-Chain/shell/SFCShell.swift`（主源码；体量大时可拆多文件，仍在 `Ind-Chain/shell/` 内；**不建 Xcode 工程**，纯 `swiftc` 编译）

行为要求：

1. **窗口**：`NSWindow` + `WKWebView`。标题 `Standard-Financial-Charting`；默认约 1440×900（按主屏可视区裁剪，不超出屏幕）；最小 960×640；居中；红色关闭按钮 = **退出整个应用**（单窗口应用，`applicationShouldTerminateAfterLastWindowClosed → true`）。窗口与 WebView 背景色 **`#0b0d10`**（与冷启动页同色，**不得闪白**）。
2. **先开窗后起服务**：进程启动 ≤ 0.5 s 内窗口即应出现（深色底 + 一行淡色 `Starting…`，系统字体，居中，不得使用任何新配色 token）；待后端就绪再 `load` 页面。
3. **载入**：就绪后 `webView.load(URLRequest(url: http://127.0.0.1:<port>/))`。仅此一个入口 URL。
4. **导航策略（W1 在壳侧的对应物）**：实现 `WKNavigationDelegate.decidePolicyFor` 与 `WKUIDelegate.createWebViewWith`：
   - scheme `http` 且 host `127.0.0.1` 且 port 为本进程后端端口 → 允许；
   - `target=_blank` / `window.open` 指向上述 loopback → 在**同一** WebView 内载入；
   - 其余（`https`、`http` 他址、`mailto` 等）→ **取消**并交 `NSWorkspace.shared.open`（系统浏览器）；
   - `file://`、`javascript:`（非页面自身）、`data:` 导航一律**取消**。
5. **菜单与快捷键**：应用菜单（关于、隐藏、退出 ⌘Q）、编辑菜单（撤销 / 重做 / 剪切 / 拷贝 / 粘贴 / 全选，使列表搜索框可用）、视图菜单（重新载入 ⌘R、进入全屏 ⌃⌘F）、窗口菜单（最小化 ⌘M、缩放）。**不加**「在浏览器打开」。
6. **调试**：仅当环境变量 `SFC_DEBUG=1` 时 `webView.isInspectable = true`（需 macOS 13.3+，须 `#available` 判断）；默认关闭。
7. **加载失败**（`didFailProvisionalNavigation`、后端起不来）：本期给最小处理——`NSAlert` 说明「后端未能启动」+ 日志路径 + 「退出」按钮，退出前清场。更细的错误页、重试在 P2。
8. **自检模式 `--selftest`**（供三监与回归自动化用，**不是**用户功能）：`NSApp.setActivationPolicy(.accessory)`（不进 Dock、不抢焦点）；拉起后端 → 载入 `/` → `didFinish` 后用 `evaluateJavaScript` 读取并向 **stdout 输出单行 JSON**：`{"ok":bool,"port":int,"title":str,"hasSplashOrHome":bool,"webgl":bool,"health":bool}`（`webgl` = 在页内临时 `canvas.getContext("webgl")` 是否非空；`health` = 页内 `fetch("/api/health")` 返回 `ok`），随后**清场并退出**，退出码 0 / 1。若 accessory + 屏外窗口导致 WebView 不渲染，允许改用「透明度 0 的真窗口」；以能稳定拿到结果为准，并在任务单实施笔记里说明采用了哪种。**自检不得依赖外网。**

### B 段：后端启动参数化与父进程监护（新增模块 `SHELL-PROC` 内嵌后端 的另一半；改动仅限 `Ind-Chain/server/app.py`）

1. **端口环境变量 `SFC_PORT`**：`PORT = 8787` 改为从环境变量 `SFC_PORT` 读取；**未设置时仍为 8787**；值须为 1024–65535 的整数，非法则启动即报错退出（非零）并打印原因。`HOST` 仍写死 `127.0.0.1`，**不得**提供任何改 host 的开关。
2. **父进程监护 `SFC_PARENT_PID`**：当环境变量 `SFC_PARENT_PID` 存在且合法时，`main()` 起一个 daemon 线程，每 1 秒检查 `os.getppid() != 该 pid`（或该 pid 已不存在 `os.kill(pid, 0)` 抛 `ProcessLookupError`）；一旦成立 → 立即停止服务并退出进程（`httpd.shutdown()` 后 `sys.exit`，或 `os._exit(0)`，以能在 ≤ 3 s 内确定退出为准）。**目的：壳被 `SIGKILL` 时后端仍能自清，不留僵尸。** 未设置该变量时（开发路径）此线程不存在。
3. **优雅退出**：对 `SIGTERM` 注册处理器，等价 `KeyboardInterrupt` 路径（`serve_forever` 干净返回、关闭监听套接字）。
4. **打印就绪行**沿用现有 `print(... flush=True)`；若改动现有两行打印，**不得改变首行的 URL 文案格式以外的语义**。允许新增一行 `[Ind-Chain] port <n>`（便于日志）。
5. **只此两处**：不借机重构 `app.py`；不改路由、不改静态根、不改 DB 路径。

### C 段：壳的后端生命周期（`SHELL-PROC` 内嵌后端 的壳侧）

1. **定位仓根**：由壳可执行文件路径上溯得 `.app` 所在目录（与 C 桩同口径，需 `realpath` 解析符号链接）；校验 `Ind-Chain/server/app.py` 存在，否则 `NSAlert`「请将 Standard-Financial-Charting.app 放在 FIDV 仓库根目录」并退出。
2. **选 Python**：按序探测 `/usr/bin/python3`、`/opt/homebrew/bin/python3`、`/usr/local/bin/python3`，要求能执行 `-c "import sys; sys.exit(0 if sys.version_info >= (3,9) else 1)"`。**不再要求 tkinter。** 全不可用 → `NSAlert`「未找到 Python 3.9+（可安装 Xcode Command Line Tools）」并退出。
3. **选端口**：壳用 `bind(127.0.0.1, port 0)` 取一个空闲端口、关闭、记下；经环境变量 `SFC_PORT` 传给后端，并设 `SFC_PARENT_PID=<壳 pid>`。**总是自选空闲端口，不依赖 8787**（R5 因而天然成立）。若子进程因端口竞争绑定失败（极小概率），换端口重试，最多 3 次。
4. **拉起**：`Process`（Foundation），`executableURL` = 选定 Python，参数 = `Ind-Chain/server/app.py` 绝对路径，`currentDirectoryURL` = 仓根下 `Ind-Chain/`（与旧启动器 `cwd=ROOT` 同），环境继承 + 上述两变量；stdout / stderr 同写 `Ind-Chain/data/shell-last.log`（每次启动覆盖）。**不调用 `seed.py`**：`ensure_db()` 已负责库空自动 seed（任务单实施时须读代码确认；若发现不成立，须在实施笔记里报告，不得静默补 `seed.py`）。
5. **就绪探测**：每 100 ms `GET http://127.0.0.1:<port>/api/health`（`URLSession`，超时 1 s），≤ 15 s 内返回 `ok:true` 视为就绪；期间子进程若已退出 → 立即走失败路径（A.7）。
6. **退出清场**（任何路径都必须经过同一个清场函数）：对子进程 `SIGTERM` → 最多等 2 s → 仍活则 `SIGKILL` → `waitUntilExit`。触发点：⌘Q、关窗、`applicationShouldTerminate`、壳进程收到 `SIGTERM` / `SIGINT` / `SIGHUP`（用 `DispatchSource.makeSignalSource` 接，转 `NSApp.terminate`）。
7. **绝不**：`lsof` 找端口杀进程；`pkill -f`；杀任何非自己拉起的进程。
8. **单次启动单后端**：本期不做单实例检测（P2）；但同一壳进程内不得出现两个后端子进程（含 ⌘R 重新载入——⌘R **只重载页面，不重启后端**）。

### D 段：构建脚本、.app 换芯、模块图

**D1 构建脚本** 改 `Ind-Chain/scripts/build-standard-financial-charting-app.sh`：
- 默认路径：探测可用 SDK（见事实 7）→ `swiftc -O -sdk <探测结果> -target <宿主架构>-apple-macos11.0 -framework Cocoa -framework WebKit Ind-Chain/shell/*.swift -o <.app>/Contents/MacOS/Standard-Financial-Charting`（本期**只出宿主架构**；通用二进制在 P3）。
- `--legacy`：按旧逻辑用 `clang` 重建 C 桩（保持回退）。
- 保留：写 `PkgInfo`、复制图标、ad-hoc `codesign --force --deep -s -`、`touch`。输出末行打印 `file -b` 结果与所用 SDK。
- `Info.plist`：`CFBundleVersion` / `CFBundleShortVersionString` 升 `2.0` / `2`（壳版本）；**脚本内嵌的 plist 模板与仓内现有 `Info.plist` 须同步**（脚本只在文件不存在时写入，故两处都要改）；其余键不动。**ATS**：实测 WKWebView 载 `http://127.0.0.1` 是否被拦；**仅在被拦时**加 `NSAppTransportSecurity → NSAllowsLocalNetworking = true`，不得加 `NSAllowsArbitraryLoads`。
- 若 `swiftc` 与 SDK 全探测失败，脚本须**不覆盖**现有可用的 `.app` 可执行文件，并非零退出。

**D2 `.app` 换芯**：构建后 `Standard-Financial-Charting.app/Contents/MacOS/Standard-Financial-Charting` 即 Swift 壳；`Info.plist` 的 `CFBundleExecutable`、图标、bundle id **不变**。

**D3 `.gitignore`**：`Ind-Chain/.gitignore` 增 `data/shell-last.log`。

**D4 模块图（壳层新增，原 23 / 30 不动）**：
- `modules/graph.json` 新增两个模块：`SHELL-WINDOW`（zh「壳窗口」，side `SHELL`，region `shell`，role：「Native window + WKWebView; loopback-only navigation; external links to system browser」）、`SHELL-PROC`（zh「内嵌后端」，side `SHELL`，region `shell`，role：「Spawn/watch/reap embedded backend; free-port pick; health probe」）。
- 新增边三条：`SHELL-WINDOW → SHELL-PROC`（`depends`）、`SHELL-PROC → BE-HTTP`（`calls`）、`SHELL-WINDOW → BE-HTTP`（`contract`）。**不新增边类型。**
- `modules/bake_static.py`：为两个新节点增几何与区域表项（需新增 `shell` 区域及其色，使用既有色板邻近色，不引入新玻璃壳 token）；**原 23 节点几何、30 条边的锚点与走线不得改变**；重跑 `python3 modules/bake_static.py` 生成 `modules/index.html`（不手改）。若该脚本因 `side` 值受限需要最小扩展，仅限新增分支，不改既有分支。
- 版面：新区域置于画面既有留白处（BE 区之下或 FE 区之左右任一空地，由总参 / 实施定），**不得压住既有节点或边**；烘焙后目视 + 脚本断言「原节点矩形未重叠、原边端点未改」。
- `graph.json` 的 `updated`、`note` 字段按实际更新。

---

## 验收（三监与内阁复核据此逐项打勾；每项需有可复现证据）

### 功能

| # | 验收项 | 证据 |
|---|--------|------|
| V1 | 双击（或 `open Standard-Financial-Charting.app`）出现**独立窗口**，窗内为冷启动页 → 展板；**无外部浏览器被拉起**，无 tkinter 窗口 | 窗口截图（`screencapture`）；`pgrep -f launcher_gui.py` 为空 |
| V2 | 展板（L1–L3）→ 列表（L4）→ 制图台（WebGL 立方体）三段在窗内逐一走通，与 Safari 同址（`http://127.0.0.1:8787/` 开发路径）对拍无功能缺失 | 三张窗口截图 + 对拍说明；制图台须见立方体 / 环 / 点，不得是空白或白屏 |
| V3 | `--selftest` 输出 `{"ok":true,…,"webgl":true,"health":true}`，退出码 0 | 命令输出原文 |
| V4 | 窗口背景 `#0b0d10`，开窗到出页期间无白闪 | 开窗瞬间截图 / 目视说明 |
| V5 | 外链与 `_blank`：loopback 同窗载入；`https://example.com` 一类交系统浏览器；`file://` 被拒 | 实测说明（可用 `--selftest` 之外的临时手测，或在实施笔记里写清手段） |
| V6 | 菜单：⌘Q、⌘R、⌘C/⌘V（列表搜索框内可粘贴）、⌘M、全屏可用 | 逐键说明 |

### 回归（本期的重头；每项都必须过）

| # | 验收项 | 方法 |
|---|--------|------|
| **R1** | 旧 API 响应一致 | 步骤 0 的 `compare`：对 ①壳拉起的端口 ②开发路径 `:8787` 各跑一次，**全部条目一致**，输出原文入任务单实施笔记 |
| **R2** | W1 回归 | 对壳拉起端口请求：`/../`、`/%2e%2e/`、`/data/ind_chain.db`、`/server/app.py`、`/BE-DATA/`、`/BE-CLASS/`、`/Ind-Chain/data/shell-last.log`，均 404 / 拒绝且不泄露内容；`lsof -nP -iTCP -sTCP:LISTEN` 中后端仅 `127.0.0.1:<port>`，**无 `*:` 或外网地址**；窗口内无 `file://` |
| **R3** | 冷启动 | 先杀净 `app.py`；双击；窗口 ≤ 2 s 出现；页面 ≤ 10 s 可交互（本机实测值写入笔记）；日志可见 `ensure_db` 行 |
| **R4** | 退出不留僵尸 | 四种退出各做一次：⌘Q、点关闭按钮、`kill -TERM <壳pid>`、**`kill -KILL <壳pid>`**。每次之后 ≤ 3 s：`pgrep -f 'Ind-Chain/server/app.py'` 为空，端口已不再监听。**第四种（SIGKILL）是对 B.2 监护的直接验证，缺此项视为不通过** |
| **R5** | 端口被占 | 先 `python3 -m http.server 8787 --bind 127.0.0.1` 占住 8787，再开 `.app`：正常出界面；占端口进程**仍存活**（壳不得杀它）；`grep -n "lsof\|pkill" Ind-Chain/shell/*.swift` 为空 |
| R6 | 模块图不变量 | 用脚本 diff：`graph.json` 原 23 个 id 与 30 条边 **逐条仍在、字段未变**；总数 **25 / 33**；新边恰为上列三条 |
| R7 | FE 零改动 | `git diff --stat -- Ind-Chain/web` 为空 |
| R8 | 开发路径不坏 | 不设 `SFC_PORT` 直接 `python3 Ind-Chain/server/app.py`：监听 8787；无 `SFC_PARENT_PID` 时无监护线程；Ctrl-C 与 `SIGTERM` 均干净退出 |
| R9 | `SFC_PORT` 校验 | `SFC_PORT=abc`、`SFC_PORT=80`、`SFC_PORT=70000` 均启动即报错退出（非零）；`SFC_PORT=18787` 正常 |
| R10 | 构建稳健 | `bash Ind-Chain/scripts/build-standard-financial-charting-app.sh` 在本机一次成功；`--legacy` 亦成功；`file -b` 显示 Mach-O；`codesign -v` 通过（ad-hoc）；人为令 SDK 探测失败时不覆盖旧可执行文件 |
| R11 | 无新外联 | 实施期间对壳进程与后端进程做一次连接审视（`lsof -nP -i -a -p <pid>`），仅见 `127.0.0.1` |

---

## 不做（本期明令不做）

- 不改 `web/**`；不改前端框架；不引入 JS 构建链。
- 不做：单实例、数据目录迁入 `~/Library/Application Support`、窗口位置记忆、崩溃自动重启、更美的错误页（均属 P2）。
- 不做：通用二进制、自洽打包、dmg/zip、图标重绘、签名升级（均属 P3）。
- 不做：删除或改写 `launcher_gui.py`、C 桩源码、旧 `lsof` 逻辑（P4 才退役）。
- 不做：内嵌 Python；不 `pip install` 任何东西。
- 不做：把本机能力暴露给页面（无 JS 桥）。
- 不借机重构 `app.py`；不借机整理 modules 之外的文档（文档同步在 P4）。
- 不动：`BE-*` 全部既有模块 id 与边、`MODULES-TRACK`、区域 id `fe-*`/`be`、边 `type` 取值。

---

## 分工建议（总参定夺，内阁仅建议）

- **主代理（实施）**：步骤 0、A–D 全部（涉及 Swift 壳、`app.py` 窄改、构建脚本、模块图）。
- **美工部**：**不调度**。窗口无新视觉面（深色底 + 一行 `Starting…`，沿用现有色，无 splash/logo/CSS 变更）。若实施中认为需任何新颜色 / 新图标，先停下回报，由总参决定是否调度 `art-department`。
- **信息部**：不调度。
- **交叉整合部 / 参谋纪要官**：不调度。
- **给监理部的提示（总参可写入任务单「后续」，内阁不令监理部）**：本期产品是**原生窗口**，`engineering-test` 取证须以**应用窗口截图**为准（`open` 该 `.app` 后用 `screencapture`；`--selftest` 可作辅助），不能只截浏览器页面；R4 的 SIGKILL 用例与 R5 的占端口用例应实跑，不凭读码判定。

---

## 交回（父代理在三监后回报内阁时须含）

1. 改动文件清单（新增 / 修改，逐路径）；`git diff --stat`。
2. 步骤 0 黄金集：清单条数、`MANIFEST.sha256` 摘要、`compare` 两次输出原文。
3. 验收 V1–V6、R1–R11 逐项结论与证据（截图路径、命令输出）。
4. 实施笔记：`--selftest` 采用的窗口方案；ATS 是否需要加键；`ensure_db` 首启 seed 的确认结果；任何偏离本令之处及理由。
5. `modules/graph.json` 新旧 diff 摘要与烘焙后静态页路径。
6. 三监报告结论。

内阁据此做复核：全过 → 写 P2 令；有缺口 → 追加 `GS-20261014-LOCAL-P1-FIX1` 完善令（不计期，不限次）。
