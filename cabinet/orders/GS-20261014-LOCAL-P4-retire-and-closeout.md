# 内阁 → 总参谋部指令

**令号** GS-20261014-LOCAL-P4  
**日期** 2026-10-14  
**任务周期** 「SFC 本地化改革」（网页 → 独立应用），总规划见 `cabinet/plans/SFC-localization-plan.md`  
**本周期内阁下令计数** **第 3 次 / 不设上限**（P1 第 1 次、P2 第 2 次；谏言不计次；P3 已并入 P2，不单独发令）  
**本期** **P4 · 收尾：退役旧启动器、文档与公私表同步、regress 整理、模块图终检、全量回归、提交清单**  
**交** **总参谋部**（父代理须将本文**完整**转交 `general-staff` 立意志与任务单；产品码与脚本变更后按既有规则送监理部，内阁不令监理部；内阁不改产品码）  
**来源** 业主 Purkniv 原话：「指挥进行全部本地化改革，即从一个网页变成一个应用，要求依旧保留原有的模块结构，把本地化这件事做好。」（本轮无限次下令权）  
**依据** `cabinet/AUTHORITY.md` · P1/P2 令 · 总规划 §4–§5 · P2 交回六节与三监第 1 次通过（业主转述，内阁采信）· 内阁实查（下「事实」）

---

## 内阁对 P2 的复核（留痕）

**结论：达标，发 P4；不追加 `P2-FIX1`。**

| 项 | 内阁判断 |
|----|----------|
| 红线 | 采信：`web/` 仅 `cube.html` 2+/2− 与 `vendor/three/**` 新增；原 23/30 与 P1 三边几何、路由不变；黄金 60 条三处 compare 意外差异 0；新增模块恰为 `SHELL-PACK` 与 2 条 `depends`（26/35）；不新增路由、不放宽 W1。内阁抽检：仓内 `.app` 为 `x86_64 arm64` 通用二进制，`codesign --verify --deep --strict` 通过，`AppIcon.icns` 与 `Ind-Chain/assets/fidv-launcher.icns` 字节一致；`bake_static.py` 重烘焙两次 `modules/index.html` 逐字节相同（幂等）。 |
| 诊断开关 | `--selftest-click/-frame`、`SFC_ASSUME_NO_CLT`、`SFC_PYTHON_CANDIDATES` 经查均以 `selfTestMode` 为前提，运行态无效，**可接受**。`SFC_ENTITIES_REL` 在打包脚本内（构建期测缺库路径），不进运行期，**可接受**。P4 复核时再确认（Q8）。 |
| 偏离 | 壳区框 `y1 492→502`、图例下移 10：属区域框与图例，非节点/边，**追认**；P4 终检须以 `019af67` 为基线列明这唯一两项位移（Q5）。构建脚本以模板为 `Info.plist` 单一来源：**追认**，且优于令文。 |
| 未验缺口（均为取证条件所限、已如实披露，**不构成打回**） | ① N6 窗口位置 autosave 保存/恢复未实测（仅验 `clampFrame`）→ **P4 尽力补验**（Q6.4），不能则列业主清单；② x86_64 后端未验（本机 CLT Python 仅 arm64）→ **不补**，转业主清单第 5 条（Intel 机）；③ R12 展板 L1–L3 只有启动页影像 → **P4 必补**（Q6.3，内阁将读图）；④ `WebContent` 崩溃自动 reload 未实测 → P4 尽力，不能则如实标「未验（读码核验）」；⑤ 业主复核清单四项（真鼠标点关闭 / 解锁目视旋转立方体 / 断网冷启动 / 他机试用 zip）仍待业主。 |
| 内阁新发现（P4 必收） | a. `Ind-Chain/scripts/package-standard-financial-charting.sh` 权限 **0644**（其余 `.sh` 皆 0755，git 模式 100755）→ 补 `chmod +x`；b. 构建脚本在仓根暂存 `.sfc-stage-<pid>.app`，中途被杀会遗留，**未被忽略**，有误提交风险 → 根 `.gitignore` 加 `.sfc-stage-*`；c. `set-command-icon.sh` 直接 `cp` 进已签名的 `.app/Contents/Resources`，**若图标真换了会破坏 ad-hoc 封印**（现状字节相同故无事）→ 见 B.3；d. `Partner Work/`（0 文件被跟踪、数 MB 未跟踪）与 `.vscode/` 不在 `PUBLIC-PRIVATE.md` 任何表内，`git add -A` 会把它们一并卷入 → 见 D 与 H。 |

---

## 意志（一句）

**把旧路径（tkinter 启动器、C 桩、`--legacy`）安全退役，让「新壳是唯一入口」成为仓内每一份文档与脚本的共同事实；用一个入口脚本把全部回归串起来并跑一遍全量；模块图一字不动地终检；交出一份精确到路径、可核对的提交清单——本期不改 `web/`、`server/`、`shell/*.swift`、`modules/graph.json`，不提交、不 push。**

---

## 总则（本期红线，总参任务单须原样带入）

1. **本期不改产品码**：`Ind-Chain/web/**`、`Ind-Chain/server/**`、`Ind-Chain/shell/*.swift`、`modules/graph.json`、`modules/bake_static.py`、`modules/index.html` 在 P4 起止**逐文件 sha256 不变**（任务开始先落快照，结束比对，快照放 `/tmp/sfc-p4-snapshot.txt`，不入仓；证据贴原文）。若实施中认为必须改，**先停下回报**，不得顺手改。
2. **P4 允许改的只有下列**：`Ind-Chain/scripts/**`（B、C 段）、`Ind-Chain/README.md`、`Ind-Chain/CONCEPTS.md`（仅 E 段所列）、`Ind-Chain/.gitignore`（仅注释/小项）、根 `README.md`、根 `.gitignore`（仅加 `.sfc-stage-*`）、`PUBLIC-PRIVATE.md`、`POWER-KNOWLEDGE.md`（仅 §29 美学行措辞）、`agent_tasklist/AESTHETIC.md`（仅 E.4 所列措辞，**不改任何 token / 色值 / 版面**）、仓内 `Standard-Financial-Charting.app`（仅经构建脚本重建）。其余一概不动。
3. **模块红线**：26 模块 / 35 边；原 23/30、P1 的 `SHELL-WINDOW` / `SHELL-PROC` 与其 3 边、P2 的 `SHELL-PACK` 与其 2 边**逐条不变**；P4 **不新增、不删除、不合并、不改名任何模块或边**，也**不改 `graph.json` 的 `updated`/`note`**（见 F 段理由）。
4. **FE/BE/FE-API/W1 口径不动**：无新路由，`HOST` 仍 `127.0.0.1`，壳无原生桥，页面 `external == 0`。
5. **公私隔离**：`dist/`、`build/`、zip、`.sfc-stage-*`、`~/Library/Application Support|Logs/Standard-Financial-Charting/`、`bics_entities_*.db`、`ind_chain.db`、日志、黄金响应正文**一概不进仓、不进提交清单**。`library/`、`cabinet/` 已跟踪内容不由本期改写；`library/` 历史 worklog、`showable-report/`、`bug-report/`、旧令文 `cabinet/orders/*` **不改写史实**（旧文提到 `launcher_gui.py` 等属历史，保留）。`Partner Work/` 不动、不删、不 add。
6. **不提交、不 `git add`、不 push**（GitHub 现在 `019af67`）。提交清单只**产出**（H 段），由业主令下才执行。
7. **不删除任何本机忽略文件**：`Ind-Chain/data/{launcher-last,shell-last}.log` 属业主本机残留，只停止被写入，不动它们。
8. **美工部**：不为新 token / 新图标调度；仅当总参认为 `AESTHETIC.md` 措辞改动宜经美工部，可调度 `art-department` **只做措辞**（E.4）。其余部门不调度。
9. **不借机重构**，不借机升版本号（`CFBundleShortVersionString=2.1` / `CFBundleVersion=3` 保持，除非构建脚本单一来源机制自身要求）。

---

## 事实（内阁实查，总参勿凭空重查，可抽检）

1. **旧路径的全部残留引用（`library/`、`cabinet/orders|plans|reports`、`BE-DATA/`、`Partner Work/` 之外）**：
   | 文件 | 位置 | 性质 |
   |------|------|------|
   | `Ind-Chain/scripts/launcher_gui.py`（6.1 KB，tkinter；内含 `lsof … kill` 旧逻辑）、`standard-financial-charting-stub.c`（2.7 KB） | 两个**已跟踪**文件 | 退役对象 |
   | `Ind-Chain/scripts/build-standard-financial-charting-app.sh` | 头注释 5 行、`SRC_C`、`MODE=legacy` 分支（clang 编桩）、参数 `--legacy` | 须删分支 |
   | 根 `README.md` L29、L34、L36 | `python3 Ind-Chain/scripts/launcher_gui.py`；「需带 tkinter 的 Python 3」；「GUI: Open homepage / Restart / Quit」 | 须改写 |
   | `Ind-Chain/README.md` L16、L19、L28、L38、L42 | Layout 块列 `launcher_gui.py`；「native Mach-O stub → launcher_gui.py」；Run 块；「GUI buttons」；`data/ind_chain.db` 被说成由「launcher」重生 | 须改写 |
   | `Ind-Chain/CONCEPTS.md` L242 | 「Launcher icons（美工部管辖）」行 | **图标仍在、该行基本成立**，仅作核对；另需增「本地应用」小节（E.3） |
   | `PUBLIC-PRIVATE.md` 公表第 1 行 | 「Ind-Chain/（含 CONCEPTS.md、网页、服务、**GUI 启动器**、图标）」 | 须改写并补行（D 段） |
   | `POWER-KNOWLEDGE.md` §29 美学行 | 「`launcher_gui.py` 的色板与窗体外观」「启动器 Open/Restart/Quit 的进程与端口逻辑」 | 须改写措辞 |
   | `agent_tasklist/AESTHETIC.md` L80、L123–124 | 「集成启动窗（`launcher_gui.py`）tkinter 小窗……Open homepage/Restart/Quit」；图标脚本、启动器附着面行 | 须标注已退役（E.4） |
   | `Ind-Chain/.gitignore` L8–9 | `data/launcher-last.log`、`data/shell-last.log` | 保留（见 B.4） |
   | `Ind-Chain/scripts/regress_api_golden.py` L77 | `GET /Ind-Chain/data/shell-last.log` | 是 W1 **负探针**（应 404），**保留** |
2. **无任何运行期代码引用旧启动器**：`Ind-Chain/server/`、`Ind-Chain/shell/`、`Ind-Chain/web/` 对 `launcher_gui` / stub / `--legacy` 零引用（内阁 `rg` 实查）。故退役不触产品运行路径。
3. **回退点**：`019af67` 是最后一个含旧启动器与 C 桩的提交；退役后回退 = 从该提交取回两文件，不依赖工作树。
4. **工作树现状（`git status --short`，已去掉 `Partner Work/`）**：已改 `.gitignore`、`Ind-Chain/.gitignore`、`build-…-app.sh`、`app.py`、`db.py`、`web/cube.html`、`.app/Info.plist`、`.app/MacOS/…`、`cabinet/README.md`、`modules/{bake_static.py,graph.json,index.html}`；未跟踪 `.vscode/`、`package-…sh`、`regress_api_golden.py`、`regress_app_lifecycle.sh`、`Ind-Chain/shell/`、`Ind-Chain/web/vendor/`、`cabinet/orders/…LOCAL-P*`、`cabinet/plans/`。`library/worklog-006.md` 已存在。`dist/`、`build/` 存在且被忽略。
5. **脚本现状**：`build-…-app.sh`（0755，通用二进制、staging 签名后原子换入）、`package-…sh`（**0644**）、`regress_api_golden.py`（0644，`python3` 调用，可）、`regress_app_lifecycle.sh`（0755；默认黄金目录写死 `/tmp/sfc-golden-p2`——带期号，易过时）。**黄金响应正文含彭博加工的实体数据，不入仓**，故每次回归须在基线上现抓。
6. **`set-command-icon.sh`**：把 `assets/fidv-launcher.icns` `cp` 进 `.app/Contents/Resources/AppIcon.icns` 并 `touch`、`lsregister`。构建脚本（P2 D.3）已有同一份拷贝并随后签名。**旧脚本在图标真被替换后会破坏已签名封印**。
7. **工具链**：`swiftc 6.3.3`（SDK 须探测）、`lipo`、`codesign`、Rosetta 均在；`/usr/bin/python3` 3.9.6（本机仅 arm64 切片被验）。
8. **跟踪的 `.app`**：`Standard-Financial-Charting.app/Contents/{Info.plist,MacOS/…,PkgInfo,Resources/AppIcon.icns,_CodeSignature/CodeResources}` 均已跟踪，二进制约 730 KB；每次重建都会产生**二进制与签名文件的 diff**。

---

## 指令

### A 段：退役范围（改 `Ind-Chain/scripts/**`）

**A.1 删除（工作树删除，不 `git add`；`git rm` 亦不得带 `--cached` 以外的暗示——只删文件，暂存留给业主令）**
- `Ind-Chain/scripts/launcher_gui.py`
- `Ind-Chain/scripts/standard-financial-charting-stub.c`

**A.2 构建脚本去 legacy**
- 删除头注释 `--legacy` 行、`SRC_C`、整个 `MODE=legacy` 分支（含 clang 编桩与其 SDK 候选循环）；保留且不改：Swift 通用二进制、SDK 探测、staging 签名后原子换入、plist 单一来源、图标齐全性校验。
- **参数解析**：任何不识别的位置参数（含旧的 `--legacy`）⇒ 打印一行人话（「`--legacy` 已于 P4 退役；最后含旧启动器的提交是 019af67」）并**非零退出（2）**，**不得**静默忽略后照常构建。无参数行为不变。
- 构建脚本头注释同步（去掉 tkinter / 桩 / 「until P4」字样）。

**A.3 保留不动（并说明理由，写入实施笔记）**：`seed.py`（README 的 headless 路径与首启 seed 仍用）、`regress_api_golden.py`、`regress_app_lifecycle.sh`、`build-…-app.sh`、`package-…sh`、`Ind-Chain/assets/fidv-launcher*`（图标母图，文件名**不改**）、`Ind-Chain/data/{companies,layers,nvda-revenue-links}.json`。

### B 段：风险处置（本期要做的小修）

**B.1 `package-…sh` 补可执行位**（`chmod +x`），并确认 `git ls-files -s` 将显示 100755（工作树模式正确即可）。
**B.2 根 `.gitignore` 增一行 `.sfc-stage-*`**（仓根构建暂存目录）。其余既有忽略语义**不动**。
**B.3 `set-command-icon.sh`**：保留文件名与用法（美学真源与文档均指向它），**仅追加**：拷贝后若内容与原先**不同**（`cmp`），随即对该 `.app` 执行 `codesign --force --deep --sign -` 并 `codesign --verify --deep --strict`，失败则非零退出；内容相同则只 `touch` + `lsregister`（现状）。头注释说明「推荐路径是换母图后跑 `build-…-app.sh`」。
**B.4 `Ind-Chain/.gitignore`**：`data/launcher-last.log`、`data/shell-last.log` 两行**保留**，各加一行注释「legacy: no longer written (P4)」；**不删**，因为既有开发者机器上仍有这些文件。
**B.5 诊断开关核对（Q8）**：确认 `SFC_ASSUME_NO_CLT`、`SFC_PYTHON_CANDIDATES`、`--selftest-click`、`--selftest-frame` 在**非 `--selftest`** 下无任何效果；以实测佐证（设置它们后正常启动，行为不变、候选集不被缩小）。这是运行期安全项（防止环境变量诱导壳执行或跳过 Python 探测）。若核对发现可被运行态利用，**停下回报**，不得自行改 `shell/*.swift`——另由内阁出 `P4-FIX1`。

### C 段：regress 脚本整理（只动 `Ind-Chain/scripts/`）

**不搬家、不改名**（旧令文与笔记引用 `scripts/regress_*`，搬家会让史实对不上），只做：

**C.1 新增一个总入口 `Ind-Chain/scripts/regress_all.sh`**（0755；纯 bash + python3 stdlib）：
- `quick`：模块终检（F 段全部机检）+ 静态检（`rg -n "https?://" Ind-Chain/web --glob '!vendor/**'` 仅 SVG `xmlns`；`rg -n "lsof|pkill|killall" Ind-Chain/shell` 为空；`web/` 变更范围 = `cube.html` 2 行 + `vendor/three/**`；`vendor/three` 的 `shasum -c`）+ 对开发路径 `:8787` 的 API 黄金 `compare`（黄金缺失则提示先 `capture` 并**非零退出**，不得静默通过）。
- `full`：`quick` + `regress_app_lifecycle.sh`（对仓内 `.app`）+ 对 `dist/` 分发包同一套（`APP=` 指向 `dist/…app`）+ `--selftest`（含 `/cube?ticker=NVDA` 的 `external==0 / canvases≥1 / webglDrawn`）。
- `capture`：对开发路径抓黄金到 `SFC_GOLDEN`（默认 `${TMPDIR:-/tmp}/sfc-golden`，**去掉期号**）。
- 每步输出 `PASS/FAIL` 单行，总结行与退出码一致；不依赖仓内可写；不杀端口占用者；仅信号自己拉起的进程；已有实例在跑 ⇒ 拒绝并非零退出。
- `--help` 打印用法与各环境变量（`SFC_GOLDEN`、`APP`、`SFC_ARCHS`）。
**C.2** `regress_app_lifecycle.sh` 默认黄金目录由 `/tmp/sfc-golden-p2` 改为 `${SFC_GOLDEN:-${TMPDIR:-/tmp}/sfc-golden}`（与 C.1 一致），其余逻辑不动；`regress_api_golden.py` 请求清单**不增不减**（60 条，`shell-last.log` 负探针保留）。
**C.3** 三个 `regress_*` 与 `package-…sh` 头部各有 3–6 行用法注释，互相指引；在 `Ind-Chain/README.md` 增一节「Regression」（E.2）写清 `quick` / `full` 的用途与前置条件（无其它实例运行、黄金需现抓、不入仓）。

### D 段：`PUBLIC-PRIVATE.md` 同步（公私隔离；仅改措辞与补行，不改协议原则）

1. 公表第 1 行改为：「`Ind-Chain/`（含 `CONCEPTS.md`、网页、服务、**原生壳源码 `shell/`**、构建 / 打包 / 回归脚本、图标）」。
2. 公表补行：`Ind-Chain/web/vendor/three/`（three.js 0.170.0 本地副本，MIT，含 `LICENSE` 与 SHA-256 清单）；`modules/`（模块真源与静态投影）；`cabinet/`（整理件、令文、规划——**沿既有跟踪事实**，现已跟踪 1358 个文件；业主若要改为不进仓，须另令，P4 不动）。
3. 私表（或新增「不进仓」表）补行：`dist/`、`build/`、`.sfc-stage-*`、分发 zip；运行期用户数据 `~/Library/Application Support/Standard-Financial-Charting/`、`~/Library/Logs/Standard-Financial-Charting/`；`Partner Work/`（本机合作方原件与副本，0 文件被跟踪，**不得 add**）；`.vscode/`（编辑器本机设置）。
4. **第三方数据条款**（新增一段，必须有）：`BE-CLASS/BICS-Classification/bics_entities_*.db` 与**含它的分发包**是彭博数据加工物，**仅限团队内部分发**，不得上传 GitHub（含 Release / Actions artifact）或任何公开网站；`--no-entities` 包可外发的前提是业主另行确认。
5. 「上传检查」增两条：① 只用**显式路径** `git add -- <路径>`，**禁止 `git add -A` / `git add .`**（仓内同时躺着 `Partner Work/`、`.vscode/`）；② 提交前跑一次「拟提交集合 ⊂ 允许清单」的核对（H.2）。
6. 本表所述「`Standard-Financial-Charting.app`、根 `README.md`」保留为公；补一句「`.app` 为通用二进制 + ad-hoc 签名，**仅在构建脚本变化或壳源码变化时才重建并提交**，避免无谓的二进制 diff」。

### E 段：文档同步

**E.1 根 `README.md`**：「Run Standard-Financial-Charting」整节重写，只含事实：
- 双击 `Standard-Financial-Charting.app`（原生窗口；应用自拉起内置后端，关窗即退）；
- 前置条件：macOS 11+；本机 Python 3.9+（通常由 Xcode Command Line Tools 提供；缺则应用出面板）；
- 开发路径：`python3 Ind-Chain/server/app.py`（`127.0.0.1:8787`，数据在 `Ind-Chain/data/`）；`cd Ind-Chain && python3 scripts/seed.py` 的 headless 路径可留；
- 构建 / 打包 / 回归三条命令（`build-…-app.sh`、`package-…sh`、`regress_all.sh`）各一行；
- 数据与日志位置（`~/Library/Application Support/Standard-Financial-Charting/`、`~/Library/Logs/Standard-Financial-Charting/backend.log`）；单实例；离线可用（three 已本地化）；
- **删除** `launcher_gui.py`、tkinter、「GUI: Open homepage / Restart / Quit」全部字样；Modules 表不增删既有行（可补一行 `modules/` 若原表无）。
**E.2 `Ind-Chain/README.md`**：Layout 块去掉 `launcher_gui.py`，增 `shell/`（Swift 源）、`scripts/`（build / package / regress / seed / set-command-icon）；「Root entry」改述 Swift 壳；Run 块与「GUI buttons」段按 E.1 重写（`data/ind_chain.db` 不再由 launcher 重生，改述「开发路径由 seed / 首启 `ensure_db` 生成；应用路径在用户目录」）；增「Environment」表（`SFC_PORT`、`SFC_PARENT_PID`、`SFC_DATA_DIR` 三者语义与校验）与「Regression」节；API 表与其余内容**不改**。
**E.3 `Ind-Chain/CONCEPTS.md`**：仅**追加**，不改既有概念行与定义。在 §10 续工指针表追加 `shell/`、`scripts/build-…`、`scripts/package-…`、`scripts/regress_*` 四行；在合适位置新增一小节「Local app / 本地应用」，双语，定义：**壳**（SHELL-WINDOW）、**内嵌后端**（SHELL-PROC）、**打包**（SHELL-PACK）、**数据目录**（用户目录，与包分离）、**自包含包**（白名单、与仓库同构布局）、**不变量**（壳不注入桥、只载 loopback、W1 窄口、FE 经 FE-API）；页脚 `Last updated` 改为当日。L242 的 Launcher icons 行**保持**（图标仍是该文件名）。
**E.4 `agent_tasklist/AESTHETIC.md` 与 `POWER-KNOWLEDGE.md` §29**（措辞，**不改 token**）：
- AESTHETIC L80「集成启动窗（`launcher_gui.py`）……」整段改为一行**已退役说明**（保留色板数值本身，因为壳错误面板与窗背景仍用 `--bg #0b0d10`、`--muted #9aa6b5`）：「原 tkinter 启动窗已于 P4 退役；色板见上，原生壳错误面板沿用同一板」。L123–124 两行中的 `launcher_gui.py` 项删去，图标脚本行保留。
- POWER-KNOWLEDGE §29 美学行：删「`launcher_gui.py` 的色板与窗体外观」，改「原生壳错误面板的色板（沿用 AESTHETIC）」；禁区列删「启动器 Open/Restart/Quit 的进程与端口逻辑」，改「壳的进程 / 端口 / 清场逻辑（`Ind-Chain/shell/`）」。
- 这两处只是文字，由主代理或（总参认为合适时）`art-department` 仅做措辞；**不得**借机改任何视觉规范。

### F 段：模块图终检（不调整任何模块）

**判断（内阁拍板）**：P4 **不新增、不删除、不调整**任何模块或边。理由：被退役的 `launcher_gui.py` 与 C 桩在 `graph.json` 里**本就没有对应模块**（23 模块覆盖 FE/BE，SHELL-* 三模块覆盖新壳 / 后端拉起 / 打包），退役不改变任何模块职责或依赖；若为「记录退役」而改 `updated`/`note`，会让 `graph.json` 与 `index.html` 与 P2 三监所验版本产生无谓差异。**故 `graph.json`、`bake_static.py`、`index.html` P4 零 diff**，只做机检：
1. 与 P4 开始快照 sha256 比对一致（总则 1）；
2. **26 模块 / 35 边**；原 23 id + 30 边与 `git show 019af67:modules/graph.json` 逐条一致；P1 三边、P2 两边逐条在；新增集合恰为 `{SHELL-WINDOW, SHELL-PROC, SHELL-PACK}` 与上述 5 边；边类型仅 `depends|calls|contract`；
3. `python3 modules/bake_static.py` 重烘焙后 `modules/index.html` **逐字节不变**（幂等）；`rg -n "fetch\(|XMLHttpRequest|https?://" modules/index.html` 仅 SVG `xmlns`（静态页不依赖运行期请求）；
4. 几何：以 `019af67` 的 `modules/index.html` 为基线，原 23 节点矩形、30 边折线逐一相等；差异**只允许**壳区框 `y1`（492→502）与图例位移 10，并列明；新增 3 节点不压既有节点与边；新增边无交叉、不重合；
5. 浏览器 / `file://` 各开一次 `modules/index.html`，截图一张存 `/tmp/sfc-evidence/modules-final.png`（内阁将读该图；不入仓）。

### G 段：全量回归与构建终验（顺序固定）

0. **开始前**：在开发路径 `:8787` 现抓黄金（server 自 P2 未改，抓取即基线）；落快照（总则 1）；记录 `git status --short`（去 `Partner Work/`）。
1. 做 A–E 段改动。
2. **重建一次**仓内 `.app`（`SFC_ARCHS` 默认通用）：`lipo -archs` = `x86_64 arm64`；`codesign --verify --deep --strict` 通过；`spctl -a -vv` 原文如实贴出（预期 rejected，不得宣称通过 Gatekeeper）；`Info.plist` 版本仍 2.1/3。验证 R10：令 SDK 探测失败 / 单一架构失败各演示一次，**旧可执行文件不被覆盖**、非零退出；`build … --legacy` 非零退出并给话。
3. **重新打包**：`package-…sh` 一次成功；白名单自检 D2 重跑通过（`Resources/sfc` 内无 `launcher_gui.py`、`*.c`、`*.db`（除实体库）、日志、`__pycache__`）；`--no-entities` 与缺库失败各演示一次（沿 P2 D8）。
4. 跑 `regress_all.sh full`，另手动补：N1、N2①②、N3（一次 `kill -9` + 一次 `kill -STOP`）、N7、N9、O1，对象为**新建的 `dist/` 分发包副本**（拷到与仓库无关路径，沿 P2 E.5）；R4 四种退出对仓内 `.app` 与分发包各一遍；R5、R9、R11 各一遍。
5. **补账（P2 遗留）**：见验收 Q6.3 / Q6.4。

### H 段：提交清单（只产出，不执行）

**H.1 产出物**：`cabinet/notes/LOCAL-commit-manifest-20261014.md`（由实施方写入；内阁已授权此处落盘），含：
- 拟提交文件**逐路径**清单（`git status --short` 去 `Partner Work/`、`.vscode/` 后的全集，逐条标「新增 / 修改 / 删除」与所属提交组）；
- **明确排除清单**（含原因）：`Partner Work/`、`.vscode/`、`dist/`、`build/`、`.sfc-stage-*`、`ind_chain.db`、`*.log`、`bics_entities_*.db`、`__pycache__`；
- 建议分组（三提交，**不拆文件块**，仅按文件分）：
  1. **产品与脚本**：`Ind-Chain/shell/`、`Ind-Chain/server/{app,db}.py`、`Ind-Chain/web/cube.html`、`Ind-Chain/web/vendor/three/`、`Ind-Chain/scripts/*`（含**删除** `launcher_gui.py`、`standard-financial-charting-stub.c`）、`Ind-Chain/.gitignore`、根 `.gitignore`、`modules/{graph.json,bake_static.py,index.html}`、`Standard-Financial-Charting.app/**`。信息行写明「退役旧启动器；回退点 019af67」。
  2. **文档与公私表**：根 `README.md`、`Ind-Chain/{README,CONCEPTS}.md`、`PUBLIC-PRIVATE.md`、`POWER-KNOWLEDGE.md`、`agent_tasklist/AESTHETIC.md`、`cabinet/{README.md,orders/GS-20261014-LOCAL-P*.md,plans/SFC-localization-plan.md,notes/LOCAL-commit-manifest-*.md}`。
  3. **日志**：`library/worklog-006.md`（及书记之后追加的行）——**每次上传必交**（`PUBLIC-PRIVATE.md` 上传检查 2）。
- **执行命令**（只写出，不运行）：逐路径的 `git add -- <path>`；`git rm` 对应两删除（工作树已删，`git add -- <path>` 即暂存删除亦可，择一写明）；提交信息草稿；**不含 `git push`**；末尾注明「推送须业主令」。
- **提交前核对脚本**（只写出并**实际跑一次**作演示）：`git status --short | rg -v '^(\?\?| M| D|A )\s'`；暂存集合 vs 清单的差集必须为空；`git diff --cached --name-only | rg -n "Partner Work|\.vscode|^dist/|^build/|\.sfc-stage|\.db$|\.log$|__pycache__"` 必须无输出；`git diff --cached --stat` 中 `.app` 二进制只出现一次。
**H.2** 一并列「业主决定项」状态（本令下节）与「未验清单」（Q 末）。

---

## 验收（三监与内阁复核据此逐项打勾；每项须有可复现证据）

| # | 验收项 | 证据 |
|---|--------|------|
| **Q1** | **退役**：两文件不在工作树；`rg -n "launcher_gui|standard-financial-charting-stub|--legacy|tkinter" -- . ':!library' ':!cabinet' ':!Partner Work' ':!BE-DATA' ':!.git'` 仅命中：构建脚本的 `--legacy` 拒绝提示、`POWER-KNOWLEDGE`/`AESTHETIC` 的「已退役」说明、`regress_api_golden.py` 的 `shell-last.log` 负探针（逐条列出并解释，其余为 0）；`build … --legacy` 退出码 2 且输出含 `019af67`；无参构建不变 | 命令输出原文 |
| **Q2** | **构建与打包终验**：通用二进制、签名校验、`spctl` 原文、R10（SDK 失败 / 单架构失败不覆盖）、打包一次成功、D2 白名单重跑、`--no-entities` 与缺库失败演示、`package-…sh` 为 0755 | 命令输出 |
| **Q3** | **文档**：E.1–E.4 逐条完成；根 / Ind-Chain README 命令**逐条可执行**（实跑 README 里每条非破坏命令一遍，贴结果）；相对链接全部有效（一段脚本扫 `[](./…)` 目标存在）；`rg -n "Open homepage|Restart|Quit|tkinter" README.md Ind-Chain/README.md` 为空 | 命令输出 |
| **Q4** | **公私**：`git check-ignore -v dist build .sfc-stage-x.app` 均命中；`PUBLIC-PRIVATE.md` 含 D.1–D.6；H.1 的提交前核对**实跑**输出附上；拟提交集合中无 `Partner Work/`、`.vscode/`、`*.db`、`*.log`、`dist/`、`build/`、zip | 命令输出 + 清单 |
| **Q5** | **模块图终检**（F 段 1–5 全部）：sha256 与开始快照一致、26/35、原 23/30 对 `019af67` 逐条等同、新增集合恰为 SHELL-* 与 5 边、烘焙幂等、静态页无 `fetch`、几何差异仅列明两项；PNG 一张（内阁读图） | 脚本输出 + PNG 路径 |
| **Q6** | **全量回归**（G 段 4、5）：<br>6.1 **R1** 三处 compare（`:8787`、仓内 `.app` 拉起、`dist/` 分发包拉起），60 条，意外差异 0（仅 `/cube`、`/cube/`、`/cube.html`、`/modules/`、`/modules/graph.json` 为已声明差异，且与 P2 一致）；<br>6.2 R2 W1 越权（含 `/vendor/../server/app.py`、`/vendor/%2e%2e/…`、`/data/ind_chain.db`、`/BE-DATA/`、`/BE-CLASS/`、数据目录文件名）全 404；R3 冷启动计时（沿 P2 口径）；R4 四种退出 × 仓内 / 分发包；R5 端口被占；R9 `SFC_PORT`；R11 仅 `127.0.0.1`；`external==0`；<br>6.3 **R12 补账（必须）**：用 `--start-path` 分别取 **展板 L1、L2、L3**（及列表 L4、制图台 `/cube?ticker=NVDA`）各一张 `--snapshot` PNG（共 ≥5 张），存 `/tmp/sfc-evidence/`；**主代理须自己看过**并在回报中写每张所见（栏目名 / 数量 / 立方体可见与否），并**把这些 PNG 复制到 `cabinet/` 下**（如 `cabinet/notes/p4-evidence/`）供内阁读；与 `:8787` 同址的 DOM 文本对拍无功能缺失；<br>6.4 **N6 / WebContent 补验（尽力）**：窗口位置记忆——移动 / 缩放后退出再开，用 `defaults read` 与（有权限则）AppleScript 读窗口 bounds 对比；把存值改到屏外后再开应被裁回；若无辅助功能权限，**如实标「未验」**并入业主清单，不得写「已验」；`WebContent` 崩溃 reload——能安全定位**本应用自己的** WebContent 子进程则 `kill -9` 一次，观察 reload；不能安全定位**不得**按名字 `pkill`，如实标「未验（读码核验）」 | 命令输出、PNG、`defaults`/日志 |
| **Q7** | **regress 整理**：`regress_all.sh` 0755；`--help`；`quick`、`full` 各跑一次全 PASS；黄金缺失时非零退出；已有实例在跑时拒绝；`regress_app_lifecycle.sh` 默认黄金目录已去期号；`regress_api_golden.py` 仍 60 条 | 命令输出 |
| **Q8** | **诊断开关核对**（B.5）：非 `--selftest` 下设 `SFC_ASSUME_NO_CLT=1`、`SFC_PYTHON_CANDIDATES=/nonexistent`、`--selftest-click retry`、`--selftest-frame 0,0,10,10`，应用**照常启动**、候选集不缩小、无面板；`grep` 出这些开关在源码中的门控处（行号） | 命令输出 |
| **Q9** | **不动产品码**（总则 1）：`web/`、`server/`、`shell/*.swift`、`modules/{graph.json,bake_static.py,index.html}` 的 sha256 与开始快照**逐项一致**；`git diff --stat -- Ind-Chain/web Ind-Chain/server` 与 P2 结束时相同 | 快照比对原文 |
| **Q10** | **提交清单**（H 段）：文件落盘；三组完整；排除清单完整；核对脚本已实跑；**未** `git add`、未 commit、未 push（`git diff --cached --name-only` 为空；`git log -1` 仍为 `019af67`） | 命令输出 |

### 业主复核清单（自动化无法覆盖，交回时须逐条标「已验 / 未验」，**不得替业主打勾**）

1. 实际鼠标点红色关闭按钮 ⇒ 应用与后端同退（自动化只验 AppKit `performClose` 等价路径）。
2. 屏幕解锁后目视一次 `/cube`：立方体可旋转缩放。
3. 断开真实网络（关 Wi-Fi）后冷启动一次，制图台仍出图。
4. 把 zip 拷到另一台未装开发环境的 Mac：按 README 右键打开；能用，或缺 Python 时出面板。
5. **（新增）** 在一台 **Intel Mac** 上冷启动（x86_64 后端本机未验）。
6. **（新增，若 Q6.4 未能自动补验）** 移动窗口后重开，位置被记住；拔掉副屏后窗口不在屏外。

---

## 不做（本期明令不做）

- 不改 `web/`、`server/`、`shell/*.swift`、`modules/graph.json` / `bake_static.py` / `index.html`；不新增 / 删除 / 调整任何模块或边。
- 不内嵌 Python、不 `pip install`、不下载二进制解释器；不做 Developer ID 签名 / 公证 / dmg。
- 不搬家、不改名 `regress_*`、`build-…`、`package-…`、`fidv-launcher*` 图标文件；不新增 API 路由、不放宽 W1。
- 不删除 `Ind-Chain/data/*.log` 与任何忽略文件；不动 `Partner Work/`、`.vscode/`、`BE-DATA/`、`library/`、旧令文。
- 不改 `DESIGN.md`；不改 `AESTHETIC.md` 任何 token；不调度美工部做视觉。
- **不提交、不 `git add`、不 push。**

---

## 业主决定项（内阁判断：**两项均仍留业主，本期不发问、不实施**）

| 项 | 内阁判断与理由 | 触发条件（何时才需业主） |
|----|----------------|--------------------------|
| **是否内嵌 Python**（免 CLT） | **仍留业主，默认「否」**。理由：① P2 已实证「缺 Python」路径体面（N2②、N9：不执行垫片、不弹系统框、出面板），他机无 CLT 时用户看到的是人话指引而非崩溃；② 内嵌需下载第三方预编译解释器（约 +30–60 MB），**扩大供应链面**，且须对嵌入的每个 Mach-O / dylib 重签，白名单与通用二进制验证面一并扩大；③ x86_64 后端本机无法验证，内嵌后更难自证；④ 决定性证据是**业主复核清单第 4 条（他机试用）**——尚未发生，先看真实反馈，再决定是否值得。 | 业主要把包发给**普遍没装 CLT 的人**，或他机试用显示「装 CLT」门槛不可接受 ⇒ 内阁届时出一道**可选令**（暂记 `P5-OPT-embedded-python`），业主须点头并**指定解释器来源与校验和**。 |
| **Developer ID 签名 / 公证** | **仍留业主，内阁不代办**。ad-hoc 签名使他机首开须「右键 → 打开」或 `xattr -dr`，`spctl` 如实为 rejected；这对**内部小范围分发**可接受，且 README 已逐字写明。 | 业主持有 Apple Developer ID 并要免提示分发时 ⇒ 另令（需账号与证书，内阁不碰密钥）。 |

另：**实体库入包仅限内部**（E.3 / D 段第 4 条）依然有效；业主若要对外发包，须用 `--no-entities` 或另行授权数据。

---

## 本周期是否还有后续期

**P4 是本周期最后一道必需令。** P4 三监通过且内阁复核无缺口 ⇒ 本周期收口，书记记录后结束。可能再有的只有：
1. `P4-FIX1`（三监或内阁复核发现缺口时，不计期、不限次）；
2. 业主在他机试用后另行决定的**可选** `P5-OPT-embedded-python`（见上，**非必需**，业主不令则不发）；
3. Developer ID 公证（业主有账号才有；内阁不代办）。

---

## 当前模块清单与关系（P4 终检基线；26 模块 / 35 边；P4 零改动）

静态页：`modules/index.html`；真源：`modules/graph.json`。

**FE（12）**：`FE-NAV` 导航 · `FE-BOARD` 展板 · `FE-LIST` 列表 · `FE-OPENCUBE` 跳转制图台 · `FE-LISTAREA` 列表属地 · `FE-ACTION` 操作 · `FE-COORDONE` 摆放坐标 · `FE-SCENE` 场景 · `FE-PANEL` 面板 · `FE-FOCUS` 聚焦 · `FE-API` 接口 · `FE-AESTHETIC` 前端设计  
**BE（10 + 1）**：`BE-HTTP` · `BE-BUNDLE` · `BE-DEMO-DB` · `BE-SHELL` · `BE-CHAIN-LAYOUT` · `BE-NVDA-LINKS` · `BE-BICS-HIER` · `BE-ENTITY` · `BE-LISTING` · `BE-INGEST` · `MODULES-TRACK`（region `other`，side BE）  
**SHELL（3）**：`SHELL-WINDOW` 壳窗口 · `SHELL-PROC` 内嵌后端 · `SHELL-PACK` 打包（构建期，不随运行期）

| 类型 | 边（from → to） |
|------|-----------------|
| **FE 内 calls** | NAV→BOARD；BOARD→LIST；LIST→OPENCUBE；BOARD→API；LIST→API；OPENCUBE→API；SCENE→COORDONE |
| **FE 内 depends** | BOARD→LISTAREA；LIST→LISTAREA；OPENCUBE→ACTION；OPENCUBE→COORDONE；OPENCUBE→SCENE；OPENCUBE→PANEL；SCENE→FOCUS；AESTHETIC→BOARD；AESTHETIC→LIST；AESTHETIC→PANEL |
| **跨侧 contract** | **FE-API→BE-HTTP**（唯一 FE→BE 数据契约）；BE-HTTP→MODULES-TRACK（W1 窄口）；SHELL-WINDOW→BE-HTTP |
| **BE calls** | HTTP→BUNDLE；HTTP→BICS-HIER；HTTP→ENTITY；HTTP→LISTING；BUNDLE→DEMO-DB；BUNDLE→SHELL；BUNDLE→CHAIN-LAYOUT；BUNDLE→NVDA-LINKS |
| **BE depends** | CHAIN-LAYOUT→NVDA-LINKS；ENTITY→LISTING；INGEST→ENTITY |
| **SHELL** | SHELL-WINDOW→SHELL-PROC（depends）；SHELL-PROC→BE-HTTP（calls）；SHELL-WINDOW→BE-HTTP（contract）；SHELL-PACK→SHELL-WINDOW（depends）；SHELL-PACK→BE-HTTP（depends，跨侧） |

计数：原 23 / 30 + P1（2 模块 / 3 边）+ P2（1 模块 / 2 边）= **26 / 35**。P4 无增删。旧启动器与 C 桩从未是模块，故退役不触图。

---

## 分工建议（总参定夺，内阁仅建议）

- **主代理（实施）**：A–H 全部；建议顺序 G.0 → A → B → C → E → D → 重建 / 打包 → 回归 → F 机检 → H。
- **美工部**：默认不调度；总参若认为 `AESTHETIC.md` 措辞宜由其落笔，仅限 E.4 文字。
- **信息部 / 交叉整合部 / 参谋纪要官**：不调度。
- **给监理部的提示（总参可写入任务单「后续」，内阁不令监理部）**：本期是**删除 + 文档 + 脚本 + 重建 `.app`**，无产品码改动：`code-quality` 应核「是否只删该删的、没有顺手改」（以 Q9 快照为准）；`engineering-test` 须以**对仓内与 `dist/` 分发包的实跑**与 R12 的 **5 张以上 PNG（被看过）** 为证据，不凭读码；`principle-compliance` 核公私条款与「本地应用不破坏 FE/BE 分离、W1、FE-API」。

---

## 交回（父代理在三监后回报内阁时须含）

1. 改动清单（新增 / 修改 / **删除**，逐路径）；`git status --short`（去 `Partner Work/`）；确认 `dist/`、`build/`、`.sfc-stage-*`、`Partner Work/`、`.vscode/` 未入拟提交集合。
2. Q1–Q10 逐项结论与证据；业主复核清单六项**逐条标已验 / 未验**。
3. 实施笔记：退役范围实际执行与所留保留项的理由；`set-command-icon.sh` 的追加逻辑与演示；`regress_all.sh` 的 `quick` / `full` 输出；诊断开关门控行号；任何偏离本令之处及理由。
4. 模块图终检结果（F 段 1–5）+ 当前模块清单与关系（可复用上节）+ 静态页路径 + PNG 路径。
5. 提交清单文件路径与核对脚本输出。
6. 三监报告结论；是否仍有后续期（内阁预期：无必需后续期）。

内阁据此做复核：全过 ⇒ **本周期收口**（内阁回写 `plans/SFC-localization-plan.md` 进度账，书记记录）；有缺口 ⇒ 追加 `GS-20261014-LOCAL-P4-FIX1`（不计期，不限次）。
