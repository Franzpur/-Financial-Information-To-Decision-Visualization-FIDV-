# SFC 本地化改革总览规划（网页 → 独立应用）

**业主** Purkniv  
**日期** 2026-10-14  
**业主原话** 「电内阁，指挥进行全部本地化改革，即从一个网页变成一个应用，要求是依旧保留原有的模块结构，本轮你有无限次下令权限，你自己规划一次下令多少，执行多少，把事情做的有条理，把本地化这件事做好。」  
**权限** 本周期内阁下令总参谋部**次数不设上限**（业主明令，覆盖 `AUTHORITY.md` 默认 5 次）。每期一道主令；该期三监后若有缺口，内阁在窗口内可追加「完善令」，不限次。  
**每期流程不变** 内阁令 → 父代理转总参谋部 → 总参出任务单 → 父代理实施 → 监理部三监 → 内阁复核窗口（可再令）→ 全部结束后书记一次。  
**本文性质** 总规划与取舍留痕；不替代各期令文。各期令文在 `cabinet/orders/GS-20261014-LOCAL-P*.md`。

---

## 1. 内阁对「本地化」的定义（业主意图解读，已拍板，勿再问业主）

> **双击 `Standard-Financial-Charting.app` → 得到一个独立应用窗口，窗口内就是原界面；应用自己拉起并管理内置后端，关窗即退、退出不留进程；用户不再需要懂端口、终端、浏览器。数据与计算仍全在本机。**

「本地化」**不是**：改成云端；改前端框架；重写后端；合并 FE/BE；去掉 HTTP。  
「本地化」**是**：把「起服务 + 外部浏览器」这两步，收进一个原生壳。

### 必须保留（红线，贯穿全期）

| 红线 | 内容 |
|------|------|
| 模块结构 | `modules/graph.json` **23 模块 / 30 边**，原 id 与边不改、不合并、不删。**允许新增**壳层模块并同步 `graph.json` + `bake_static.py` 烘焙。 |
| FE/BE 分离 | `Ind-Chain/web/`（FE）与 `Ind-Chain/server/`（BE）仍是两个目录、两套职责。FE 代码（`web/`）**整个周期原则上零改动**。 |
| FE-API 唯一契约口 | 前端只通过 FE-API 说话；壳**不**向页面注入原生桥（不用 `WKScriptMessageHandler` 暴露本机能力给页面）。 |
| W1 窄口 | 浏览器侧（现在是内嵌 WebView）只走 HTTP JSON + 静态；服务端独占 DB / 链文档 / BE-DATA；仍只绑 `127.0.0.1`。壳**不得**为页面开 `file://`、不得放宽静态路由。 |
| 数据与计算在本机 | 无新增外联；无遥测；不需要任何账号。 |
| 公私隔离 | 壳源码是工程，进仓；构建产物（分发包、dmg、build/）与 agent 工具不进仓。`PUBLIC-PRIVATE.md` 的公/私表如有变动，P4 同步。 |
| 开发路径不坏 | `python3 Ind-Chain/server/app.py` 单独起服务、浏览器访问 `127.0.0.1:8787` 仍可用（开发 / 对拍用），默认端口 8787 不变。 |

---

## 2. 技术路线评估与选定

### 2.1 本机事实（内阁实测，2026-10-14）

| 项 | 实测 |
|----|------|
| 系统 | macOS 26.6.2，Apple Silicon |
| Python | `/usr/bin/python3` 3.9.6（CLT 提供，universal x86_64 + arm64e） |
| 编译器 | `swiftc` 6.3.3、`clang` 均在（Command Line Tools，无需 Xcode） |
| **SDK 陷阱** | CLT 默认 SDK 指向 `MacOSX27.0.sdk`，与 swiftc 6.3.3 **不匹配**（`failed to build module 'Swift'`）。**须显式 `-sdk /Library/Developer/CommandLineTools/SDKs/MacOSX26.5.sdk`**；内阁已实编 `import Cocoa; import WebKit; WKWebView(...)` 通过并可运行。`MacOSX26.sdk`、`MacOSX15.4.sdk` 亦可编过（首次冷编译慢，三者合计约 70 秒；先前「26.sdk 卡死」为误判，已更正）。构建脚本须「从新到旧逐个试编一个最小文件（超时 120 秒），选第一个能编过的」，不得写死单一路径。 |
| 无 | `node`、`cargo`/`rustc`、`brew` 不在（Electron / Tauri 均需额外装一整套工具链） |
| pip | 可联网（但见下，本路线不依赖） |
| 现有 .app | `Standard-Financial-Charting.app` = C 桩（Mach-O）→ exec `python3 launcher_gui.py`（tkinter 控制窗）→ 用户自开外部浏览器 |

### 2.2 候选对比

| 方案 | 体积 | 本机现成 | 需额外账号/收费 | git 可管 | .app 可双击 | 脱离终端 | 与现架构契合 | 主要风险 |
|------|------|----------|-----------------|----------|-------------|----------|--------------|----------|
| **A. 原生 Swift + AppKit + WKWebView**（`swiftc` 直编，源码进仓） | **极小**（Mach-O 约百 KB 级，不含 Python） | **是**（CLT 已有） | 否 | **是**（`.swift` 源码文本） | 是 | 是 | **最高**：壳只做「开窗 + 拉子进程 + 载 URL」，FE/BE/FE-API/W1 一概不动 | SDK 选择陷阱（已知、可规避）；需写 ~300 行 Swift |
| B. pywebview（PyObjC） | 小 | 否：需 `pip install pywebview pyobjc-*`；系统 Py3.9 + CLT 的 tkinter 老、PyObjC 轮子体积大；用户机再装依赖 | 否 | 是 | 要自行打包 | 是 | 中 | 运行期依赖用户机 pip 环境，**.app 不自洽**；Python 3.9 即将过时；把「壳」又绑回 Python GUI 栈 |
| C. Electron | 极大（~150–250 MB Chromium + Node） | 否（无 node） | 否 | 可 | 是 | 是 | 低：自带 Chromium、Node 主进程；诱导改成 IPC，易破 W1 / FE-API 口径 | 体积、重复运行时、供应链面大；与「只改壳不改 FE/BE」背离 |
| D. Tauri | 小 | 否（无 rust、无 node） | 否 | 可 | 是 | 是 | 中 | 要装 Rust 整套；Tauri 默认 IPC 桥，须关；对本项目是过度工程 |
| E. 维持 tkinter 控制窗 + 外部浏览器 | — | 是 | — | 是 | 是 | **否** | — | 不满足业主「变成应用」 |
| F. 纯 Python 内嵌 WKWebView（ctypes / 手写 objc runtime） | 小 | 是 | 否 | 是 | 是 | 是 | 中 | 脆；无类型、难维护；还不如直接 Swift |

### 2.3 拍板

**选 A：原生 Swift + AppKit + WKWebView 壳，`swiftc` 编译，嵌入既有 `.app` 包。后端继续用系统 `/usr/bin/python3` 跑现有 stdlib `ThreadingHTTPServer`，由壳作为子进程拉起并管理。**

理由（按重要性）：

1. **最小改动面，最大限度守住模块结构。** 壳只做三件事：开窗、管子进程、把窗口指向 `http://127.0.0.1:<port>/`。FE 与 BE 代码、FE-API 契约、W1 窄口、modules 图**一个字不必动**；壳是在最外面「加一层」，不是「改里面」。
2. **零新增依赖、零账号、零外联。** `swiftc` 与 `clang` 已在 CLT；不装 node / rust / pip 包；不触发任何账号或授权。
3. **体积与可维护。** 壳是几百行 Swift，一个文件（P1），读得懂、改得动；不引入第二套运行时。对比 Electron 的百兆级 Chromium，体积差三个数量级。
4. **系统 WebKit 即满足前端。** 前端是 Three.js（WebGL）+ 原生 JS + 内联 SVG；WKWebView 原生支持 WebGL。内阁在 P1 令里把「WebGL 立方体能出图、交互与 Safari 一致」列为验收，不凭空假设。
5. **git 与公私隔离干净。** 壳源码是文本，进仓、可 diff、可审；产物（二进制 .app 已有先例随仓、分发包与 dmg 不进仓）。
6. **.app 可双击、可脱离终端。** 保留现有 `.app` 骨架（Info.plist、图标、bundle id），只把 `CFBundleExecutable` 从 C 桩换成 Swift Mach-O。
7. **后端仍用系统 Python 的取舍（有意）。** 不把 Python 打进包（python-build-standalone 约 30–60 MB 且需联网下载一份第三方二进制，供应链面增大），P1–P3 默认**依赖系统 `/usr/bin/python3`（CLT 提供）**。这是已知限制，P3 在「分发」里明写前置条件；是否内嵌 Python 作为 P3 的**可选**升级，默认不做，见 §5「业主决定项」。

**否决理由简记**：B 把运行期绑回 pip 环境；C/D 要装整套新工具链且自带 IPC 桥，诱使破 W1；E 不满足；F 脆。

---

## 3. 架构：壳层新增两个模块，原 23 模块 / 30 边不动

```
┌──────────────────────── Standard-Financial-Charting.app（新壳层，Swift）────────────────────────┐
│  SHELL-WINDOW 壳窗口  ──depends──▶  SHELL-PROC 内嵌后端                                         │
│  (NSWindow + WKWebView;                (spawn /usr/bin/python3 app.py;                         │
│   仅载 loopback URL;                     选端口、等就绪、监护、退出清场)                           │
│   外链交系统浏览器)                                │                                             │
└──────────┬──────────────────────────────────────┼─────────────────────────────────────────────┘
           │ contract（仅 HTTP，W1）               │ calls（拉起进程 / 读 /api/health）
           ▼                                       ▼
        BE-HTTP  ◀──────────────  FE-API ◀── FE-*（原样，由 WebView 经 HTTP 取得）
```

新增（`graph.json`，第 P1 期落）：

| id | 中文 | side | region | 角色 |
|----|------|------|--------|------|
| `SHELL-WINDOW` | 壳窗口 | `SHELL` | `shell` | 原生窗口 + WKWebView；只载 `127.0.0.1:<port>`；外链 / `_blank` 交系统浏览器；菜单与快捷键 |
| `SHELL-PROC` | 内嵌后端 | `SHELL` | `shell` | 子进程生命周期：选端口、拉起、就绪探测、监护、退出清场 |

新增边（3 条，类型沿用 `depends` / `calls` / `contract`，不新增类型）：

| from | to | type |
|------|----|------|
| `SHELL-WINDOW` | `SHELL-PROC` | `depends` |
| `SHELL-PROC` | `BE-HTTP` | `calls` |
| `SHELL-WINDOW` | `BE-HTTP` | `contract` |

**不变量**：原 23 个 id 与 30 条边逐条保持（P1 起每期验收都 diff）；总数变为 **25 模块 / 33 边**。若 `bake_static.py` 的 `side` / 区域不支持 `SHELL`，由总参定最小扩展（新增一个区域色与一块版位）；不得因此改动原 23 节点的几何与边的走线。

---

## 4. 分期（4 期；每期一道主令，必要时追加完善令）

| 期 | 名称 | 令号 | 一句话 | 令文 |
|----|------|------|--------|------|
| **P1** | 窗口壳与内嵌后端生命周期 | `GS-20261014-LOCAL-P1` | 双击出独立窗口，窗内是原界面；壳拉起后端、关窗即清场 | **已写盘** `orders/GS-20261014-LOCAL-P1-shell-window.md` |
| **P2**（已并 P3） | 加固 + 离线 + 自包含分发 | `GS-20261014-LOCAL-P2` | 单实例；数据/日志落用户目录；错误面板与崩溃自救；three.js 本地化（FE 例外 E1/E2）；通用二进制；白名单自包含 `.app` + zip；新增模块 `SHELL-PACK`（26/35） | **已写盘** `orders/GS-20261014-LOCAL-P2-harden-and-pack.md`（内含段 I 加固与离线、段 II 分发两段交付） |
| ~~P3~~ | （并入 P2） | — | — | 不单独发令 |
| **P4** | 清理旧路径、文档、模块图、总验收 | `GS-20261014-LOCAL-P4` | 退役 tkinter 启动器与 C 桩；文档与公私表同步；模块图终检；全量回归 | P3 三监通过后写 |
| **P5** | 内嵌 Python · 签名公证流水线 · 外发包 · 提交推送 | `GS-20261015-LOCAL-P5` | 内嵌 python.org universal2 运行时（壳优先包内、系统次选）；Developer ID 签名 / 公证流水线（无身份回落 ad-hoc 并明说，业主侧六步清单）；`-noentities` 外发包与条款；cabinet 进库确认；三监与书记后提交并推送。**不新增模块（26 / 35 不变）**，`web/ server/ modules/` 不动 | **已写盘** `orders/GS-20261015-LOCAL-P5-embed-sign-publish.md`（2026-10-15，第 4 次令；业主新令，P4 令文曾预留 `P5-OPT-embedded-python`） |

### 每期「下多少 / 执行多少」的节奏规则（内阁自定）

1. **一期一令，一令只做该期**；不跨期预支（避免一次令过大、监理难审）。P1 内含 A/B/C/D 四小段，一次实施。
2. **每期必须交付「可双击、可运行」的状态**：任何一期结束，`.app` 都能打开、界面可用；不留「半拆」的中间态。旧启动器在 P4 之前**保留作为回退**。
3. **每期令文固定六节**：意志 / 事实（内阁实查）/ 指令（分段）/ 验收（含回归）/ 不做 / 交回。
4. **三监后内阁复核**：对照该期验收逐项打勾；有缺口就在窗口内追加完善令（不新开期，令号 `…-Pn-FIX1`）；全通过再写下一期令。
5. **回归基线先于改动**（P1 第一步）：在改任何代码**之前**，总参令实施方对现网 `:8787` 抓一份「旧 API 黄金响应」，之后每期都对拍。

### 回归总纲（每期适用，P1 起即建立）

| 编号 | 回归项 | 方法 |
|------|--------|------|
| R1 | 旧 API 响应字节一致 | 改前用旧服务抓 `GOLDEN` 清单；改后经**壳拉起的端口**与 `:8787` 开发路径各抓一遍，`diff` / `sha256` 逐条一致（排除含时间戳字段；若有，列出并说明） |
| R2 | W1 回归 | 越权路径一律 404 / 拒绝：`/../`、`/data/ind_chain.db`、`/BE-DATA/…`、`/BE-CLASS/…`、`/server/app.py`、`/%2e%2e/`；仅绑 `127.0.0.1`（`lsof -nP -iTCP -sTCP:LISTEN` 看不到 `*:port` 或外网地址）；窗口内不得出现 `file://` 加载 |
| R3 | 冷启动 | 杀光 `app.py` 后双击 `.app`：窗口在 ≤ 2 s 内出现；页面在 ≤ 10 s 内可交互（本机基线）；冷启动页（SFC 字样）正常；首启 DB 为空时自动 seed |
| R4 | 退出不留僵尸 | ⌘Q、关窗、`kill -TERM 壳`、`kill -KILL 壳`（最苛刻）四种方式之后，3 秒内 `pgrep -f 'Ind-Chain/server/app.py'` 为空，端口已释放 |
| R5 | 端口被占 | 先用 `python3 -m http.server 8787` 占住 8787，再开 `.app`：应用仍正常启动（P1 靠「总是选空闲端口」天然满足），**且不得杀掉占端口的外部进程**（旧 `launcher_gui.py` 的 `lsof … kill` 行为在新路径中不得出现） |
| R6 | 模块图不变量 | `graph.json` 原 23 id / 30 边 diff 为空；新增仅限本期令许可的 SHELL-* |
| R7 | FE 零改动 | `git diff -- Ind-Chain/web` 为空（P1 / P2 / P3 起每期检查；如有例外须令文明示） |
| R8 | 前端行为一致 | 窗口内：冷启动页 → 展板（L1–L3）→ 列表（L4）→ 制图台（WebGL 立方体）三段逐一走通；与 Safari 同址对拍无功能缺失 |

---

## 5. 业主决定项（仅「只有业主能定」者；均已给默认，默认不发问）

| 项 | 默认方案 | 何时才需业主 |
|----|----------|--------------|
| 是否把 Python 打进 .app（自洽、免 CLT） | **否**，依赖系统 `/usr/bin/python3`，P3 说明前置条件 | 若业主要把 .app 发给**没装 CLT 的机器**，再请业主改为「内嵌」，P3 追加完善令 |
| 签名 / 公证（Developer ID） | **ad-hoc 签名**；他机首次需「右键 → 打开」放行 | 业主要无提示分发给外人时，须业主自有 Apple Developer 账号，内阁不代办 |
| .app 位置 | P1–P2 **仍在仓库根**（壳按相对路径找 `Ind-Chain/`）；P3 起另出自洽版 | — |

结论：**本轮无阻塞项，不发问。**

> **2026-10-15 更新**：业主已就上表两项作出决定——**内嵌 Python：是**（内阁判断为常见做法，见 P5 令「业主问答」①）；**Developer ID 签名 / 公证：要做**，但本机无身份与凭据，故 P5 分两层交付（流水线现在交付、无身份回落 ad-hoc 并明说；业主侧账号 / 证书 / 凭据六步由业主做）。上表「默认」列保留作历史留痕，以 P5 令为准。另：业主确认 `cabinet/` 进库、`--no-entities` 包可外发（条款与风险见 P5 令 D2 / D3）。

---

## 6. 进度账（内阁维护，每期回写）

| 期 | 令出 | 三监 | 内阁复核 | 备注 |
|----|------|------|----------|------|
| P1 | 2026-10-14（第 1 次令） | 第 3 次送审通过（第 1 次因探测超时 10 s≠令文 120 s 与注释不实被打回，已改） | 采信：selftest ok/health/webgl、API 55 条对拍无意外、三种退出清场无残留、原 23/30 未变、web/ 零改；**遗留**：整窗口截图 / WebGL 视觉未验、关闭按钮未 UI 测、three 仍走 CDN、未提交 | 模块 25 / 33 |
| P2（并入 P3） | 2026-10-14（第 2 次令） | 第 1 次送审三属全达标通过（代码质量属因 shell 被拦读码核验；建议收窄 DatabaseError，已改并复测 N7） | **达标，不发 FIX1**。采信：黄金 60 条三处 compare 意外差异 0；原 23/30 与 P1 三边不变；web 仅 cube.html 2 行 + vendor；26/35；通用二进制与签名内阁抽检通过。**遗留**：N6 autosave 保存/恢复、x86_64 后端、R12 展板 L1–L3 影像、WebContent 崩溃 reload 未验；业主清单四项待业主。**新发现**：package 脚本 0644、仓根 `.sfc-stage-*` 未忽略、`set-command-icon.sh` 可能破封印、`Partner Work/` 与 `.vscode/` 未入公私表 → 并入 P4 | 令文 `orders/GS-20261014-LOCAL-P2-harden-and-pack.md`；模块 26 / 35 |
| P3 | 并入 P2 | — | — | 不单独发令 |
| P4 | 2026-10-14（第 3 次令） | **三次送审，第 3 次后达上限**：第 1 次打回（CONCEPTS「壳」两义，已改 App shell 并区分 BE-SHELL）；第 2 次打回（`regress_all.sh` 在 `Ind-Chain/` 下 `--help` 找不到自身，已改 `SELF` 绝对路径）；第 3 次打回（lifecycle 判据 `'ok': False` 引号写错致判据失效；理念贯彻后两次达标）。监理部不再审。 | **采信 A–E、G、H 段完成，收口；不发 FIX1（见下「必做令」判断）。** 采信（父代理实跑）：旧启动器 / C 桩已从工作树删除（未暂存，回退点 `019af67`）；`build --legacy` 退出 2；package 脚本 0755；根 `.gitignore` 加 `.sfc-stage-*`；`set-command-icon.sh` 变更时重签；`regress_all.sh`（quick/full/capture）`full` 七步全 PASS；`.app` 通用二进制 + ad-hoc（`spctl` rejected 属预期）；dist 31 文件白名单，`--no-entities` 与缺库失败已演示；N1/N2/N3/N7/N9/O1/R5/R9/R11/B.5 对 dist 副本实跑；N6 注入存值恢复 / 屏外裁回 / 过小裁最小已验；P4 对产品码与 `modules/` 零改动（32 项 sha 快照 OK）；模块 26 / 35，原 23 / 30 与 `019af67` 一致；提交清单已落盘，未 add / commit / push，`git log -1` = `019af67`。内阁读图（`notes/p4-evidence/` 8 张）：`modules-final` 26 模块 / 35 边、壳区三模块在图下方；`cube-NVDA` 立方体、NVDA 面板、搜索与过滤控件可见；`board-L2/L3/L4`、`list-L4` 层级合计自洽（L2 4791+1042=5833；L3 3021+762+351+657=4791；L4 1515+1506=3021）；L1 应用内快照 `board-L1.png` **只有 splash**（令前已知，应用内冷启动恒带 splash），展板本体仅有浏览器同址补拍 `board-L1-after-splash-BROWSER.png`（12 格，非应用内），**不得写成「应用内已验」**。**⚠ 未经监理部复审的改动（须业主裁定）**：第 3 次打回后，父代理仅把 `regress_app_lifecycle.sh` 中 lifecycle 判据的一行引号改为双引号包住整个模式，并用伪造日志验证好日志不报、坏日志报，且重跑 `full` 七步全 PASS；**此改动三监未见**，属脚本回归判据、非产品码。**遗留 / 未验**（业主清单，不得替业主打勾）：真鼠标点红叉；解锁屏目视旋转立方体；真断网冷启动；zip 他机试用（含无 CLT）；Intel 机；用户手动移动 / 缩放后保存与拔显示器；WebContent 崩溃重载（仅读码核验 `SFCShell.swift:433-442`，未 kill）。**业主决定项**：内嵌 Python、Developer ID 公证、`cabinet/` 是否继续进仓（含 8 张 PNG 约 4 MB）、`--no-entities` 包能否外发、是否 commit / push。**内阁小记**：L1 九宫外 12 格计数之和 98373 对页头 98374（差 1，疑数据口径，非产品缺陷，不拦）；`board-L1.png` 文件名易误读，建议业主或书记认知为「splash 帧」。 |
| P5 | 2026-10-15（第 4 次令） | 待送审（首轮须并审 `regress_all.sh` 第 101 行引号修正） | 待复核 | 内阁谏言「不发问」；拍板不新增模块（内嵌运行时为第三方制品，归 SHELL-PACK 职责扩展 / SHELL-PROC 既有选择职责），26 / 35 不变；现无签名身份，**不得宣称已公证**；提交推送在三监 + 内阁复核 + 书记之后；已知风险：公开仓含 135 个第三方研报 PDF（令 D3） |
