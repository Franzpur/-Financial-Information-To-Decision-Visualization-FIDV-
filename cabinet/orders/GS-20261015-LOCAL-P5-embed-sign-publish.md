# 内阁 → 总参谋部指令

**令号** GS-20261015-LOCAL-P5  
**日期** 2026-10-15  
**任务周期** 「SFC 本地化改革」（网页 → 独立应用），总规划见 `cabinet/plans/SFC-localization-plan.md`  
**本周期内阁下令计数** **第 4 次 / 不设上限**（P1 第 1 次、P2 第 2 次、P4 第 3 次；P3 并入 P2；谏言不计次。P4 令文已把「`P5-OPT-embedded-python`」列为本周期可能的后续，故业主本令沿用同周期计数）  
**本期** **P5 · 内嵌 Python 运行时；Developer ID 签名与公证流水线；`--no-entities` 外发包；cabinet 进库；提交并推送 GitHub**  
**交** **总参谋部**（父代理须将本文**完整**转交 `general-staff` 立意志与任务单；产品壳与打包改动后按既有规则送监理部，内阁不令监理部；内阁不改产品码）  
**来源** 业主 Purkniv 原话：「电内阁，内嵌python是否是常见做法，如果是，那就内嵌；做developer id签名和公证；cabinet进库；--no-entities包可以外发，不过你要给我解释解释这是什么意思；做完这些之后提交github，你自己安排指挥。」  
**依据** `cabinet/AUTHORITY.md` · P1/P2/P4 令 · 总规划 §5 业主决定项 · 父代理实测事实（下「事实」）· `cabinet/notes/LOCAL-commit-manifest-20261014.md`

---

## 业主问答（内阁答复；业主原问两条，答案即本令的理由）

### 问①　内嵌 Python 是不是常见做法？

**判断：是常见做法，对「要发给非开发者的 Mac 应用」基本是默认做法。业主既定「是则内嵌」，故本令内嵌；系统 Python 降为次选回落。**

**理由**

1. **不能指望用户机有可用的 Python。** macOS 12.3 起不再预装 Python 2；`/usr/bin/python3` 现在只是一个垫片，机器上没装 Xcode Command Line Tools 时，执行它会弹出「安装开发者工具」的系统框。它装起来后也只是 Apple 提供的 3.9.6，而 3.9 这条线已到官方终止支持期。Apple 自 macOS 10.15 起就在发行说明里声明：脚本语言运行时今后可能不再预装。我们 P2 的验收已证明「缺 Python」路径体面（出面板），但**面板只是承认失败，不是解决问题**。
2. **业界现成路线很多**，都是「把解释器随应用带走」：
   - **py2app**：Mac 老牌，把解释器 + 标准库 + 依赖打进 `.app`；适合「Python 就是应用本体」。
   - **PyInstaller**：把脚本冻结成二进制或目录；跨平台通行。
   - **Briefcase（BeeWare）**：把 Python 支持包做成 framework，放进 `.app/Contents/Frameworks/`，是 Mac 上「宿主壳 + 内嵌 Python」最贴近的现成做法。
   - **python-build-standalone**（`uv` 所用的可重定位发行版）：体积更小、免安装器抽取，但不是 Python 软件基金会（PSF）官方发行。
   - 知名产品随包带解释器的有 Blender、Anki、Calibre 等。
3. **本项目的形状决定选法。** 我们是 Swift 壳 + 一个只用标准库的 `python app.py` 子进程；因此最贴切的是 **「framework 嵌入」（Briefcase 式）**，而**不是**整体冻结：PyInstaller 把 `app.py` 冻进二进制，会让「开发路径 = 应用路径」的同构断掉、让 `regress_*` 对拍失真；py2app 的 launcher 会变成第二个入口，与 Swift 壳抢位。故取 **python.org 官方 universal2 安装包**（x86_64 + arm64，PSF 签名，来源最权威），抽取 `Python.framework`、裁剪、放进 `Contents/Frameworks/`。

**代价（据实，数字为内阁估算，须以实测为准）**

| 项 | 代价 | 缓解 |
|----|------|------|
| **体积** | 现 `.app` 28 MB / zip 6.4 MB；裁剪后的 universal2 运行时估计 **+35~60 MB（app）/ +15~25 MB（zip）** | 去 tkinter、idlelib、test、pip、`Python.app`、`include/`、Tcl/Tk；验收要求写出实测数字 |
| **安全更新** | 解释器随包走，CPython / OpenSSL / SQLite 的漏洞修复**不会自动到用户机**；每次要我们重取新版 → 重打包 → 重签 → 重公证 → 重发。系统 Python 则靠 Apple 更新 | 本应用只绑 `127.0.0.1`、不联网、只跑自家代码，暴露面小；README 与日志写明内嵌版本；建议 CPython 有安全发布时或每季度重建一次（业主定节奏） |
| **签名** | python.org 原签名属 PSF，**重签后原签失效是预期**；包内**每个** Mach-O（`.so` / `.dylib` / 可执行）都必须由我们统一重签，公证还要求 hardened runtime + 安全时间戳；hardened runtime 下嵌入的 Python 可能需要 entitlement（如 `disable-library-validation`） | 由下 B 段实测决定，**最小授权**，能不给就不给 |
| **兼容** | 后端现按 3.9 写、3.9 验；换成新版有弃用 / 行为差异风险 | 全量回归；`regress_all.sh full` 为证 |
| **验证面** | universal2 两个架构都要验；本机 x86_64 只能靠 Rosetta | 验收 Q5 |
| **许可** | PSF License、OpenSSL（Apache-2.0）、SQLite（公有领域）等须随包附声明 | 验收 Q1 |

### 问②　`--no-entities` 包是什么意思？外发意味着什么？

**是什么。** `--no-entities` 是 `package-standard-financial-charting.sh` 的一个开关。默认打出的包带一个**实体库** `BE-CLASS/BICS-Classification/bics_entities_20261003.db`（约 26 MB）：这是**彭博加工出来的约 9.8 万家公司的实体表**（每家公司归哪个 BICS 行业，可按名称 / 代码搜索）。加上 `--no-entities`，打出的包**不装这个库**，其余一样。

**装与不装的区别（构建机实测）**

| | 含实体库包（内部包） | `--no-entities` 包 |
|---|---|---|
| 实体库 | 有（约 9.8 万家公司） | **无** |
| 应用能否起 | 能 | 能（`/api/bics/entities` 返回 200 且 `count=0`，`/api/bics/locate` 无命中，无 500） |
| 展板行业层级（L1–L3） | 可看，带各层公司数 | 可看（层级来自 BICS 层级 JSON） |
| L4 公司名单 | 有 | **空** |
| 搜索 | 有结果 | **无结果** |
| 制图台立方体 | 可用实体库里的公司 | 只有 `data/companies.json` 的演示公司与 `nvda-revenue-links.json` |
| 可外发吗 | **仅限团队内部**（彭博数据加工物） | **业主已授权可外发**（本令落实） |

**「外发」意味着什么。** zip 离开团队，交到**不受我们同一份数据许可约束的人**手里：① 不可撤回，也无法控制对方再转发；② 包里的**一切**从此视为已公开；③ 对方多半是外部人，**没有 Developer ID 签名 + 公证的 zip 在他们的机器上会被 Gatekeeper 拦**（macOS 15 起连「右键 → 打开」都不再行，要进「系统设置 → 隐私与安全性 → 仍要打开」）。所以「外发」与第二项（公证）是连着的。

**`--no-entities` 包「现仍含」的第三方加工物（外发前业主须知悉）**

| 文件 | 性质 | 内阁备注 |
|------|------|----------|
| `…/BICS-Classification/bics-equity-hierarchy-2024.json` | **彭博的 BICS 分类体系**（行业层级与名称 / 代码树） | 该文件、`bics_hierarchy.db`、`2144414.xlsx` 本就在**公开仓库**里；但「已公开」不等于「已获彭博授权」。**业主已授权外发，内阁记为业主决定，不是内阁认定合规**；内阁不替代彭博条款与法务判断 |
| `data/companies.json`（演示公司） | 演示数据 | **来源待核**——令 Q10 要求实施方逐文件写明来源 |
| `data/nvda-revenue-links.json` | NVDA 营收 / 链接数据 | **来源待核**（同上）；可能引自公开财报，也可能含彭博字段 |
| `data/layers.json` | 层定义 | 来源待核（同上） |
| `web/vendor/three/` | three.js 0.170.0，MIT | 合规，随包附 `LICENSE` |
| 内嵌 Python / OpenSSL / SQLite | PSF / Apache-2.0 / 公有领域 | 须随包附声明 |

**本令对外发包的硬要求**：① zip 文件名**带 `-noentities` 后缀**，与内部包肉眼可分；② `README-先读我.txt` 的「内部分发提示」在该变体中改为「**外发版（不含实体库）**」，如实列出**仍含**的 BICS 层级与演示数据；③ `PUBLIC-PRIVATE.md` 第三方数据条款据此改写（含实体库的包**仍仅限内部**）；④ **本轮不上传 GitHub Release**，除非业主另令。

---

## 内阁对本令的复核与拍板（留痕）

### 谏言结论：**不发问**

业主令意志清楚、权界内；风险已全部列为业主知悉项（下），其中公开仓与研报 PDF 一项是**既成事实，本令不加重**（只新增我们自己写的令文 / 计划 / 清单 / 证据）；Developer ID 的账号与凭据业主给不了就**回落并明说**，不构成阻塞。故不弹对话框。**但下列三项知悉项请业主在回报中读到**：D3（公开仓 + 第三方研报 PDF）、D2（外发包仍含彭博 BICS 层级）、B 段（本机无签名身份，**不得宣称已公证**）。

### 拍板：是否新增模块？**不新增。**

内嵌运行时**归 `SHELL-PACK` 的职责扩展**（构建期：取得 / 校验 / 裁剪 / 重签 / 公证），运行期的「选哪个 Python」归 `SHELL-PROC` **既有**职责（探测并拉起后端解释器）。理由：

1. **运行时是第三方制品，不是我们写的模块。** 先例：`web/vendor/three/`（three.js）同样是随包第三方制品，未立模块。模块图记的是**我们的**代码职责与依赖。
2. **没有新的依赖方向。** 内嵌运行时不引入 FE / BE / SHELL 之间任何新边：`SHELL-PROC → BE-HTTP`（calls）、`SHELL-PACK → SHELL-WINDOW` / `SHELL-PACK → BE-HTTP`（depends）已覆盖「打包把壳与后端装在一起、壳拉起后端」。
3. **守 Q9。** 业主与父代理要求 `modules/` 不动；不新增模块 ⇒ `graph.json`、`bake_static.py`、`index.html` 零 diff，**26 模块 / 35 边**不变，原 23 / 30 与 P1–P2 的 5 边逐条保持。
4. **已知的字面滞后**：`graph.json` 里 `SHELL-PACK` 的 `role` 英文行（「universal binary, allow-listed self-contained .app, zip」）未提内嵌运行时；**本期不改它**（改了要重烘焙，与 Q9 冲突）。真源描述以 `Ind-Chain/CONCEPTS.md` §11 追加为准；**下一次**因其它原因动 `graph.json` 时顺带补一句。
5. **何时才需要新模块**：若日后写**我们自己的**运行时管理代码（自动更新、运行时版本迁移、独立的运行时健康检查），那才是新职责，届时另令并同步 `graph.json` + 烘焙（边与烘焙届时再定）。

---

## 意志（一句）

**让应用在没有任何系统 Python 的 Mac 上也能双击即用（内嵌 python.org universal2 运行时，壳优先用包内的、系统的作次选）；把「Developer ID 签名 + 公证」做成一条环境变量驱动的流水线（现在能在无身份下回落并明说，业主有账号后一条命令出公证包，绝不宣称未发生的公证）；产出两种可区分的包（内部含实体库、外发不含）并把条款写实；把整批本地化改革连同 cabinet 令文 / 计划 / 清单 / 证据一次提交并推送，不碰 `web/`、`server/`、`modules/`。**

---

## 总则（本期红线，总参任务单须原样带入）

1. **Q9 式不动清单**：`Ind-Chain/web/**`、`Ind-Chain/server/**`、`modules/{graph.json,bake_static.py,index.html}`、`Ind-Chain/shell/{main,SFCShell,ErrorPanel}.swift` 在 P5 起止**逐文件 sha256 不变**（任务开始先落快照到 `/tmp/sfc-p5-snapshot.txt`，不入仓，结束比对，证据贴原文）。若实施中认为必须改，**先停下回报**，不得顺手改。
2. **P5 允许改的只有下列**（超出即停下回报）：
   - `Ind-Chain/shell/Backend.swift`（Python 选择、环境清洗、日志行）；
   - `Ind-Chain/shell/SelfTest.swift`（**仅**加 selftest 门控的诊断开关与输出 python 路径所需的最小改动）；
   - `Ind-Chain/scripts/build-standard-financial-charting-app.sh`（hardened runtime、entitlements、签名身份）；
   - `Ind-Chain/scripts/package-standard-financial-charting.sh`（嵌入运行时、签名 / 公证流水线、两变体命名与并存、README 变体）；
   - **至多两个新增辅助文件**：`Ind-Chain/scripts/fetch-embedded-python.sh`（取 / 校验 / 抽取 / 裁剪）、`Ind-Chain/scripts/sfc.entitlements`（或同义命名的 plist）；
   - `Ind-Chain/scripts/regress_all.sh`、`regress_app_lifecycle.sh`（仅为纳入内嵌运行时验证步骤）；
   - 文档：根 `README.md`、`Ind-Chain/README.md`、`Ind-Chain/CONCEPTS.md`（§11 **追加**，另仅可改 L271「Self-contained package」一行使之与事实一致，须在交回里标出）、`PUBLIC-PRIVATE.md`；
   - 根 `.gitignore`（仅加凭据类模式，见 C.4）；
   - 仓内 `Standard-Financial-Charting.app`（仅经构建脚本重建；壳源码变了，故按 `PUBLIC-PRIVATE.md` 条款重建并提交）。
3. **模块红线**：26 / 35 不变；不新增、不删除、不改名任何模块或边；`graph.json` 零 diff（见上拍板）。
4. **FE / BE / FE-API / W1 口径不动**：无新路由，`HOST` 仍 `127.0.0.1`，壳无原生桥，页面 `external == 0`。
5. **机密零入仓、零入输出**：签名证书、`.p12` / `.p8`、app 专用密码、notarytool 凭据一概不入仓、不入脚本、不入日志、不入聊天；脚本只读钥匙串里的 profile 名与身份名，**不打印任何机密**。
6. **公私隔离**：`dist/`、`build/`（含下载的 python.org 安装包与抽取物）、`.sfc-stage-*`、zip、`bics_entities_*.db`、`ind_chain.db`、日志、黄金响应正文**不进仓**；`Partner Work/`、`.vscode/` 不 add。
7. **下载只来自 python.org**，且**校验**后才用（见 A.1）；不 `pip install`、不用 Homebrew、不用第三方镜像。
8. **不借机重构**；不动 `DESIGN.md`、`AESTHETIC.md` token；不调度美工部 / 信息部 / 交叉整合部 / 参谋纪要官。
9. **不上传 GitHub Release / Actions artifact**；zip 不入仓。
10. **版本号**：本期是用户可见的功能变更，内阁拍板 **升到 `CFBundleShortVersionString=2.2`、`CFBundleVersion=4`**（经构建脚本既有「Info.plist 单一来源」机制，一处改），业主异议可改回。

---

## 事实（父代理实测，内阁据此写令；总参勿凭空重查，可抽检）

1. **现状分发包靠本机 Python 3.9+**；缺则出面板。`/usr/bin/python3` 是 3.9.6（CLT 提供）；本机仅 arm64 切片被验，Intel / 无 CLT 机器是痛点。壳 `Backend.swift` 的 `PythonProbe` 只探 `/usr/bin/python3`、`/opt/homebrew/bin/python3`、`/usr/local/bin/python3`；`BackendProc` 对 bundled 包设 `PYTHONDONTWRITEBYTECODE=1`（不写进已签名 `.app`）。后端 `server/*.py` 只用标准库（`http.server`、`sqlite3`、`json` 等），**无第三方包**。现包：`dist/` 下 app 28 MB、zip 6.4 MB。
2. **拟用方案**：python.org 官方 **universal2** macOS 安装包（x86_64 + arm64，最低 macOS 11，与 `LSMinimumSystemVersion 11.0` 一致）→ 抽取 `Python.framework` → 裁剪（去 tkinter / idlelib / test / pip / `Python.app` / `include/` / Tcl-Tk）→ 壳优先用包内 python，次选系统 python → 包内所有 Mach-O 统一重签。网络可达 python.org（已测 200）。
3. **签名与公证的本机现实**：`security find-identity -v -p codesigning` = **0 个有效身份**；`notarytool 1.1.2` 存在，但**钥匙串里无任何凭据（keychain profile）**。即：**需要业主的 Apple Developer Program 账号（$99 / 年）、Developer ID Application 证书、notarytool 凭据（app 专用密码或 API 密钥）**。父代理无法替业主取得 ⇒ 令分两层（见 B 段）。
4. **cabinet 已被 git 跟踪**（1358 个文件，约 585 MB，其中 UBS / Bloomberg Intelligence / JP Morgan / Barclays 研报板件与 `BB_*` 原件 PDF 共 **135 个 PDF**），且 **GitHub 仓库是公开的（`visibility=public`，已测）**。故「cabinet 进库」**实际已是事实，且已公开**。`PUBLIC-PRIVATE.md` 写明不改历史、不 force push。
5. **`--no-entities` 实测行为**见上「问②」表；包内仍含 `bics-equity-hierarchy-2024.json`。业主已授权该变体外发。
6. **提交现状**：GitHub 与本地 `git log -1` 仍是 `019af67`；P1–P4 全部改动**尚未提交**（清单在 `cabinet/notes/LOCAL-commit-manifest-20261014.md`，分三组）；`dist/` 现有 `README-先读我.txt`、`SHA256SUMS.txt`、`Standard-Financial-Charting-2.1-20261014.zip`、`.app`。
7. **打包脚本一个陷阱**：`package-…sh` 开头 `rm -rf "$BUILD" "$DIST"`——**连续打两个变体会互相抹掉**。P5 必须让两变体并存（见 C.1）。
8. **签名现状**：构建脚本产出通用二进制 + ad-hoc 签名；`spctl` 如实为 rejected；README 已写「xattr / 右键打开 / macOS 15 仍要打开」。
9. **监理部三次上限**是每次送审周期的规程。上一周期（P4）第 3 次打回项（`regress_all.sh` 第 101 行 `lifecycle()` 判据的引号）已由父代理改正（现为 `"STILL RUNNING|DIFF |refusing|shell processes: [2-9]|'ok': False"`），**但未经复审**。

---

## 指令

### A 段：内嵌 Python 运行时（`fetch-embedded-python.sh` + `Backend.swift` + package 脚本）

**A.1 取得与校验**
- 版本线：python.org 当前处于 bugfix / 安全支持期、且已出过多个 bugfix 小版本的次版本线（**不取刚发布的 `.0` / `.1`**；不低于 3.12）。父代理选定后，把**确切小版本、下载 URL、SHA-256**写进脚本头与 README（SHA-256 以 python.org 发布页公布值为准并与实际下载交叉核对）。
- `pkgutil --check-signature` 核对安装包由 PSF 的 Developer ID 签发，原文贴入证据；SHA-256 不符 ⇒ **非零退出，不使用**。
- 抽取**不得 sudo、不得安装到系统**：用 `pkgutil --expand-full`（或等价）到 `build/python-runtime/`；下载缓存放 `build/`，已被忽略。

**A.2 裁剪与布局**
- 去掉：`tkinter`、`_tkinter*.so`、`idlelib`、`turtle*`、`turtledemo`、`test/` 与各 `tests/`、`ensurepip` 与 `pip`、`Resources/Python.app`、`include/`、`share/`、`config-*`、Tcl/Tk。**保留完整其余标准库**（不为省体积做激进裁剪，以免后端某个 import 悄悄断）。
- 布局：放 `Contents/Frameworks/Python.framework/`（Apple 约定的嵌套代码位置；保留 `Versions/<x.y>/Resources/Info.plist` 与 `Versions/Current` 符号链接，framework 才能被 `codesign` 当作 bundle 封印）。**不得放进 `Resources/sfc/`**（那是白名单自包含区，D2 自检保持原样）。
- **签名前预编译** `.pyc`（`compileall --invalidation-mode checked-hash`），因为已封印的 `.app` 不可写，运行期 `PYTHONDONTWRITEBYTECODE=1` 无法生成缓存，不预编译会拖慢冷启动。
- 裁剪后写出**运行时清单**（文件数、体积、全部 Mach-O 路径与 `lipo -archs`）进构建日志。

**A.3 壳的选择逻辑（`Backend.swift`；只此一处语义变更）**

优先序：**包内 Python → 系统候选（原三条）→ 现有「找不到 Python」面板**。
- 包内 Python 须**先验再用**（与系统 Python 同口径：执行 `-c` 取版本与 `import sqlite3`），失败则**回落到系统候选并在 `backend.log` 写一行原因**，不得静默。
- 启动后端时对**包内**解释器**清洗继承环境**：清除 `PYTHONHOME`、`PYTHONPATH`、`PYTHONSTARTUP`、`PYTHONEXECUTABLE`、`VIRTUAL_ENV`，设 `PYTHONNOUSERSITE=1`（防用户环境污染包内解释器）；`PYTHONDONTWRITEBYTECODE=1` 保留。系统候选路径的现行为**不变**。
- `backend.log` 启动处增一行 `python=<绝对路径> version=<x.y.z> source=bundled|system`（供验收证据）。
- **selftest 门控的诊断开关**：新增 `SFC_IGNORE_BUNDLED_PYTHON=1`（**仅 `--selftest` 下有效**，运行态一律忽略，与 `SFC_PYTHON_CANDIDATES` / `SFC_ASSUME_NO_CLT` 同一门控规则）。
- `CFBundleExecutable` 仍是 Swift 壳；**不新增第二入口**；包内 Python **不是**用户可见的应用。

### B 段：签名与公证（两层；**不得宣称已公证**）

#### B-A 层：现在可交付（打包脚本新增流水线，无身份可回落）

环境变量：

| 变量 | 含义 |
|------|------|
| `SFC_SIGN_IDENTITY` | 钥匙串里的签名身份名（如 `Developer ID Application: 姓名 (TEAMID)`）；**未设** ⇒ ad-hoc |
| `SFC_NOTARY_PROFILE` | `xcrun notarytool store-credentials` 存下的 profile 名；**未设** ⇒ 不公证 |

流水线（**由内向外**签，不用 `--deep` 签，只用 `--deep` 验）：
1. 先签包内全部嵌套 Mach-O（`.so` / `.dylib` / 可执行），再签 `Python.framework`，再签主可执行与 `.app`；每一步 `--options runtime`（hardened runtime）；有真身份时再加 `--timestamp`，ad-hoc 时 `--timestamp=none`。
2. entitlements 走 `sfc.entitlements`，**最小授权**：先以**空 entitlements** 实测（B-A 实测见下），**仅当**实测证明需要才加，且**每加一项在文件里写一行原因**。预期：WKWebView 的 WebContent / GPU / Network 进程是系统签名的独立进程，宿主**不需要** JIT 类 entitlement；我们**不用** App Sandbox，不需网络 entitlement。
3. **有身份且设了 `SFC_NOTARY_PROFILE`**：`ditto -c -k --keepParent` 出临时 zip → `xcrun notarytool submit --keychain-profile "$SFC_NOTARY_PROFILE" --wait` → 失败（`Invalid` / 超时）则打印 `notarytool log` 的**问题摘要**并**非零退出、不产最终 zip** → 成功则 `xcrun stapler staple` → `stapler validate` → `spctl -a -vv -t exec` 须报 `accepted` 且 `source=Notarized Developer ID`，否则失败。
4. **最终 zip 必须在 staple 之后用 `ditto` 重新生成**（先 staple 后压缩，否则分发包里没有公证票据）。
5. 失败 / 回落规则（**一律明说**，禁止静默降级）：

   | 情形 | 行为 |
   |------|------|
   | `SFC_SIGN_IDENTITY` 未设 | ad-hoc；终端与 README **都写「ad-hoc，未公证」** |
   | `SFC_SIGN_IDENTITY` 已设，但钥匙串里找不到该身份 | **非零退出**（业主要了签名，静默降级是危险的） |
   | `SFC_NOTARY_PROFILE` 已设，但身份不是 `Developer ID Application`（含 ad-hoc） | **非零退出** |
   | `SFC_NOTARY_PROFILE` 指向不存在的 profile | **非零退出**，提示 `store-credentials` 用法 |
   | 公证 `Invalid` | **非零退出**，贴日志摘要，不产 zip |
6. `README-先读我.txt` 的第 3 节（首次打开）与签名状态由**脚本依实际结果生成**：公证成功 ⇒ 写「已签名并公证，可直接双击」；否则 ⇒ 沿用现有 xattr / 右键 / macOS 15 说明并写「ad-hoc，未公证」。**不得写死。**
7. **hardened runtime 可运行性先行实测**（无身份也能做）：用 ad-hoc + `-o runtime` 构出包，验证内嵌 Python 与后端、WebGL 页面在 hardened runtime 下正常（见 Q6、Q7）。若 ad-hoc 下因 library validation 拒载包内 `.so`，**不得直接放开**：先判断这是否仅是 ad-hoc 的人为现象（ad-hoc 无 Team ID；同一真身份统一重签后 library validation 通常通过），把「需要 / 不需要 `disable-library-validation`」写成**有证据的结论**；若 ad-hoc 必须加才能跑，则 entitlements 里加上并注明「真身份下须重测、有望去掉」，并把「真身份下重测」列入业主复核清单。

#### B-B 层：业主侧一次性步骤（令文交付清单；内阁不代办，不碰密钥）

1. **加入 Apple Developer Program**（developer.apple.com；个人 $99 / 年；以 Apple 页面为准）。
2. **创建「Developer ID Application」证书**（只有 Account Holder 能创建）：Xcode → Settings → Accounts → Manage Certificates → ＋ → Developer ID Application；或在 developer.apple.com 证书页用钥匙串「证书助理 → 从证书颁发机构请求证书」生成 CSR 上传。私钥留在本机钥匙串；**另做 `.p12` 备份存放到仓外安全处**。
3. 终端核对：`security find-identity -v -p codesigning` 应出现 `Developer ID Application: … (TEAMID)`。
4. **存 notarytool 凭据**（凭据进钥匙串，不入仓不入脚本）：
   ```
   xcrun notarytool store-credentials "sfc-notary" \
     --apple-id "<你的 Apple ID>" --team-id "<TEAMID>" \
     --password "<在 appleid.apple.com 生成的 app 专用密码>"
   ```
   （或用 App Store Connect API 密钥：`--key <.p8路径> --key-id <ID> --issuer <UUID>`。）
5. **一条命令出公证包**：
   ```
   SFC_SIGN_IDENTITY="Developer ID Application: 姓名 (TEAMID)" SFC_NOTARY_PROFILE=sfc-notary \
     bash Ind-Chain/scripts/package-standard-financial-charting.sh [--no-entities]
   ```
6. 验证：`spctl -a -vv -t exec dist/…/Standard-Financial-Charting.app` 应为 `accepted`、`source=Notarized Developer ID`；`xcrun stapler validate` 通过；再把 zip 经浏览器 / AirDrop 下载一遍（带 quarantine）双击无警告。
7. 拿到真身份后，请令父代理**重跑 Q6–Q8**（本期在无身份下做的是 ad-hoc 等价验证，不能代替真身份下的实测）。

### C 段：两种包与外发条款

**C.1 变体与并存**
- 两变体产物**并存**，不互相抹除：`dist/` 下用两个子目录（建议 `dist/internal/` 与 `dist/noentities/`），各自带 app、`README-先读我.txt`、`SHA256SUMS.txt`、zip。脚本开头的 `rm -rf "$DIST"` 改为只清本变体目录。
- zip 名：内部包 `Standard-Financial-Charting-<ver>-<yyyymmdd>.zip`；外发包 `Standard-Financial-Charting-<ver>-<yyyymmdd>-noentities.zip`（**后缀必须有**）。
- 一次运行只出一个变体（沿现 `--no-entities` 开关）；验收要求两个变体各跑一次。

**C.2 README 变体**（脚本生成）
- **内部包**第 8 节保持「内部分发提示」，写「含彭博加工的实体库，仅限团队内部分发」。
- **外发包**第 8 节标题改为 **「外发版（不含实体库）」**，如实列出：不含实体库及其表现（名单空 / 搜索无结果）、**仍含**彭博 BICS 行业层级 JSON 与演示数据（`companies.json`、`nvda-revenue-links.json`、`layers.json`，来源以 Q10 核实结果为准）、three.js（MIT）、Python / OpenSSL / SQLite 声明；并注「`--no-entities` 的外发由业主授权；转发前请自行确认各自许可」。
- 两个变体都须在第 2 节（前置条件）改写为「**无需本机安装 Python**；应用内置 Python <x.y.z>；若内置运行时异常，才回落到本机 Python 3.9+」，并保留 macOS 11 与 Safari 提示。

**C.3 `PUBLIC-PRIVATE.md` 改写**（只改措辞与补行，不改协议原则）
1. **cabinet 行**：由「沿既有跟踪事实；若要改为不进仓，须业主另令」改为「**业主 2026-10-15 已确认 `cabinet/` 进仓**（沿既有跟踪事实）。该目录含第三方研究报告板件与原件 PDF（版权归原出版方），仓库公开期间由业主知悉并承担；**自本日起 `cabinet/` 不再新增第三方研究原件 PDF，只增我们自己写的文件**（令 D3 默认）」。
2. **第三方数据条款**改写为两档：①含实体库的包 / `bics_entities_*.db`：**仅限团队内部**，不得上传 GitHub（含 Release / Actions artifact）或任何公开网站；② `-noentities` 外发包：**业主 2026-10-15 授权可外发**，但仍含彭博 BICS 行业层级与演示数据（逐项来源见 Q10 核实结果），外发由业主承担许可责任；不得上传 GitHub Release，除非业主另令。
3. 私表补：内嵌运行时下载缓存与抽取物（`build/python-runtime/`）；Developer ID 证书、`.p12`、`.p8`、app 专用密码、notarytool 凭据（**永不入仓**）。
4. 上传检查增一条：**推送前核对仓库可见性**（`gh repo view --json visibility` 并把结果写进回报，不因此改动可见性）；**单文件 > 50 MB 的新增物（`.app` 以外）须先停下回报**。

**C.4 根 `.gitignore`**：仅追加凭据类模式 `*.p12`、`*.p8`、`*.cer`、`*.mobileprovision`、`*.certSigningRequest`；其余忽略语义不动。

### D 段：文档同步（只写事实）

- **根 `README.md` / `Ind-Chain/README.md`**：前置条件由「本机 Python 3.9+」改为「应用内置 Python，无需本机安装；仅当内置运行时异常才回落到本机 Python 3.9+」；增「签名与公证」一节（B-A 环境变量表 + B-B 六步），**写明当前状态：本机无签名身份，现包为 ad-hoc**；增「两种包」一节（C.1 / C.2）；构建 / 打包 / 回归三条命令各一行；开发路径（`python3 Ind-Chain/server/app.py`）**不变**，仍用本机 Python。
- **`Ind-Chain/CONCEPTS.md` §11 追加**（双语）：**内嵌运行时（Embedded runtime）**——定义、来源（python.org universal2）、位置（`Contents/Frameworks/Python.framework`）、选择顺序、环境清洗、与 `SHELL-PACK` / `SHELL-PROC` 的归属关系（写明「第三方制品，不是模块」）；**签名 / 公证（Signing / Notarization）**；**外发包（`-noentities`）**。L271 一行改为与事实一致。页脚 `Last updated` 改为当日。
- 若发现 `README` 内相对链接失效，一并修正。

### E 段：验证（顺序固定）

0. **开始前**：落快照（总则 1）；开发路径 `:8787` 现抓黄金（后端未变，抓取即基线）；记录 `git status --short`（去 `Partner Work/`、`.vscode/`）。
1. A → B-A → C → D 段改动。
2. 重建仓内 `.app`；各打一次内部包与外发包；做 ad-hoc + hardened runtime 的全部验证。
3. 跑 `regress_all.sh full`；补 Q3–Q8 专项；留证据 PNG 到 `cabinet/notes/p5-evidence/`（≥ 3 张，**主代理须自己看过**并写每张所见）。
4. 更新提交清单（F 段）。

### F 段：提交并推送（**门禁**：三监通过 + 内阁复核无缺口 + 书记已追加 worklog **之后**才执行）

**F.1 更新清单** `cabinet/notes/LOCAL-commit-manifest-20261014.md`（原地更新并加「P5 增补」节，不另起文件）：把 P5 新增 / 修改的路径逐条并入对应组；明确排除清单加入 `build/python-runtime/`、`*.p12` 等；仍只用**显式路径** `git add -- <path>`，**禁止 `git add -A` / `git add .`**；`Partner Work/`、`.vscode/`、`dist/`、`build/` 不入。拟纳入的 cabinet 路径：`cabinet/orders/GS-2026101[45]-LOCAL-P*.md`（含本令）、`cabinet/plans/SFC-localization-plan.md`、`cabinet/notes/LOCAL-commit-manifest-20261014.md`、`cabinet/notes/p4-evidence/`、`cabinet/notes/p5-evidence/`、`cabinet/README.md`。

**F.2 推送前**：① 过 `PUBLIC-PRIVATE.md` 上传检查（含新增的仓库可见性核对、大文件核对）；② 跑**预提交核对脚本**（`git status --short | rg -v '^(\?\?| M| D|A )\s'`；暂存集合 vs 清单差集为空；`git diff --cached --name-only | rg -n "Partner Work|\.vscode|^dist/|^build/|\.sfc-stage|\.db$|\.log$|__pycache__|\.p12|\.p8"` 无输出；`git diff --cached --stat` 中 `.app` 二进制只出现一次），**输出原文贴入回报**。

**F.3 提交与推送**：分组提交（建议在原三组上，P5 文件按所属并入：① 产品与脚本；② 文档与公私表与令文证据；③ worklog），提交信息中文、写明回退点 `019af67`；`git fetch` 确认可快进后 `git push`（**普通推送**）；**不 `--force`、不 `--no-verify`、不改写历史、不改仓库可见性**。推送后 `git ls-remote` 核对远端 HEAD = 本地 HEAD，贴原文。**若推送失败（凭据 / 网络 / 单文件超限 / 非快进）：不得绕过，原样回报**。推送记录写入 worklog 的下一次提交即可，**不为此再推一次**。

---

## 验收（三监与内阁复核据此逐项打勾；每项须有可复现证据）

| # | 验收项 | 证据 |
|---|--------|------|
| **Q1** | **运行时取得与校验**：确切版本 / URL / SHA-256 已记；`pkgutil --check-signature` 原文（PSF）；抽取未用 sudo、未装进系统；裁剪后「应删项」存在性为 0；运行时清单（文件数 / 体积 / Mach-O 列表）；PSF License 等声明文件随包（路径） | 命令输出 |
| **Q2** | **全 Mach-O 通用且一致**：遍历 `Contents/Frameworks/Python.framework` 与主可执行，逐个 `lipo -archs` 均为 `x86_64 arm64`；**任何单架构 Mach-O ⇒ FAIL**；贴总数 | 脚本输出 |
| **Q3** | **壳选择（无系统 Python 仍起）**：以 `SFC_PYTHON_CANDIDATES=/nonexistent` 收窄候选（selftest 下）且 `PATH` 清到不含任何 python 的最小值：**M1** 内嵌包 ⇒ `ok`、`/api/health` 200、`backend.log` 含 `source=bundled`；**M2（对照）** 同条件加 `SFC_IGNORE_BUNDLED_PYTHON=1` ⇒ 应出「需要 Python」类失败，证明 M1 不是靠系统 Python 过的；**M3** 默认环境 ⇒ 实际运行的是包内 python（`ps` / 日志给路径）；**M4** `SFC_IGNORE_BUNDLED_PYTHON=1` + 默认候选 ⇒ 回落系统 python 且起；**M5** 在**测试副本**上破坏包内解释器 ⇒ 回落系统 python、日志写原因（副本，非分发包）；**M6** 非 selftest 下设 `SFC_IGNORE_BUNDLED_PYTHON=1` 等开关 ⇒ **无效**（行号证门控） | 命令输出 + 源码行号 |
| **Q4** | **arm64 实跑**：内部包与外发包各冷启动，selftest 的 `ok / health / webgl` 全绿；冷启动计时（沿 P2 口径）；`ps -o arch` 或 `file` 证实后端为 arm64 | 命令输出 |
| **Q5** | **x86_64 切片（Rosetta）**：`arch -x86_64 <包内 python> -c 'import platform,sqlite3,ssl; print(platform.machine(), sqlite3.sqlite_version, ssl.OPENSSL_VERSION)'` 输出 `x86_64`；后端在 Rosetta 下冷启动并取到 `/api/health` 200 与至少一条 API 黄金 compare；尽力在 Rosetta 下起整个壳（`arch -x86_64`）跑 selftest，不能则如实标「未验」 | 命令输出 |
| **Q6** | **签名一致与 hardened runtime**：全部 Mach-O `codesign --verify --strict` 通过；`codesign --verify --deep --strict --verbose=2 <app>` 通过；`codesign -dv --verbose=4` 对主可执行与框架内可执行显示**同一签名类别**（ad-hoc 则全 `Signature=adhoc`；真身份则全同 `TeamIdentifier`）且 `flags` 含 `runtime`；`codesign -d --entitlements :-` 贴原文（应为空或仅有 B-A.2 所述并带原因的项）；无 `not signed` / `modified` 类警告；`spctl` 原文如实贴（ad-hoc 下预期 rejected，**不得宣称通过 Gatekeeper**） | 命令输出 |
| **Q7** | **hardened runtime 下运行**：`--selftest`（含 `/cube?ticker=NVDA%20US%20Equity` 的 `external==0 / canvases≥1 / webglDrawn`）全绿；`--snapshot` PNG ≥ 3 张（展板 L2、列表 L4、制图台 NVDA），存 `cabinet/notes/p5-evidence/`；**主代理自己看过**并写每张所见；内阁将读图；`log show` / 控制台无 `library validation` / `killed` / `Code Signature Invalid` 类拒载 | PNG + 命令输出 |
| **Q8** | **签名 / 公证流水线**（B-A 全部）：环境变量表实现；**无身份时的五种情形逐一演示**（未设 ⇒ ad-hoc 并明说；设了不存在的身份 ⇒ 失败；设 profile 但无 Developer ID 身份 ⇒ 失败；profile 不存在 ⇒ 失败；以上均**不打印机密**）；README 的签名状态语句由脚本依实际结果生成（贴 ad-hoc 情形生成的原文）；脚本里 staple 在 zip 之前；**回报中明说：未公证、未真身份验证** | 命令输出 + 脚本行号 |
| **Q9** | **不动清单**：总则 1 所列文件 sha256 与开始快照**逐项一致**；`git diff --stat` 的改动文件集合 ⊂ 总则 2 允许清单（逐项比对，列差集为空）；26 / 35 与原 23 / 30 机检（对 `019af67` 的 `graph.json`）；`modules/index.html` 重烘焙幂等 | 快照比对原文 |
| **Q10** | **两种包的清单与 SHA-256**：两个 zip 的文件名（外发带 `-noentities`）、体积（app MB / zip MB；与「问①」估算对照）、`SHA256SUMS.txt`、`shasum -c` 通过；外发包内 `find` 无 `bics_entities_*.db`，起后 `/api/bics/entities` 200 且 `count=0`、`/api/bics/locate` 无命中、无 500；内部包 `count > 0`；外发包 README 第 8 节**逐字符**为「外发版（不含实体库）」且列出仍含项；**`companies.json`、`nvda-revenue-links.json`、`layers.json` 各写一句来源核实结果**（不能核实则写「来源待核」，交业主）；**两变体并存**（`dist/` 下同时存在） | 命令输出 + 清单 |
| **Q11** | **回归**：`regress_all.sh full` 全 PASS（含新增内嵌运行时步骤）；黄金 60 条 compare 三处（`:8787`、仓内 `.app`、内嵌包）意外差异 0（沿既有已声明差异）；`shasum -c` 的 `vendor/three` 通过 | 命令输出 |
| **Q12** | **生命周期**：R4 四种退出（⌘Q、关窗、`kill -TERM`、`kill -KILL` 壳）后 3 秒内 `pgrep -f` **包内 python 路径**为空、端口已释放；R5 端口被占；R9 `SFC_PORT`；R11 仅 `127.0.0.1`；单实例；`PYTHONDONTWRITEBYTECODE` 确保已封印 `.app` 内无新增 `.pyc`（运行前后 `codesign --verify` 仍过） | 命令输出 |
| **Q13** | **文档与公私**：D 段逐条完成；`rg -n "Needs only the system Python|仅需系统 Python|本机须有 Python 3.9" README.md Ind-Chain/README.md Ind-Chain/CONCEPTS.md` 只剩「回落」语境；`PUBLIC-PRIVATE.md` 含 C.3 四点；根 `.gitignore` 含凭据模式；README 命令逐条可执行；链接有效 | 命令输出 |
| **Q14** | **提交与推送**（F 段，**门禁已过才做**）：清单已更新；预提交核对脚本输出原文；只用显式路径；仓库可见性核对结果；推送成功且 `git ls-remote` 远端 HEAD = 本地 HEAD；**无 force、无 `--no-verify`、无历史改写、无 Release 上传**。推送失败 ⇒ 原样回报，**该项记「未完成」，不得绕过** | 命令输出 |
| **Q15（监理部审查包）** | **首轮送审时一并复核** `Ind-Chain/scripts/regress_all.sh` **第 101 行**的引号修正：该行 `lifecycle()` 判据现为 `rg -q "STILL RUNNING\|DIFF \|refusing\|shell processes: [2-9]\|'ok': False" "$L"`（模式整体用**双引号**包住，内含单引号的 `'ok': False`）；P4 第 3 次打回项为旧写法导致判据失效。复核须以**伪造的好 / 坏日志**各跑一遍判据（好日志不报、坏日志报）并重跑 `regress_all.sh full` 为证；这一项**不计入**本周期三次上限的消耗说明：上一周期上限已用毕，本周期从第 1 次送审重新计数 | 命令输出 |

### 业主复核清单（自动化无法覆盖，交回时须逐条标「已验 / 未验」，**不得替业主打勾**）

1. **B-B 六步**（Apple 账号 → 证书 → 钥匙串核对 → `store-credentials` → 一条命令 → `spctl` 与下载后双击）：**业主做**；做完才有「已公证」。
2. 拿到真身份后**重跑 Q6–Q8**（本期仅 ad-hoc 等价验证）。
3. 把内部包 zip 拷到**无 CLT 的 Mac** 与 **Intel Mac** 冷启动一次（内嵌运行时的核心价值，本机无法替代）。
4. 真鼠标点红叉；解锁屏目视旋转立方体；真断网冷启动（沿 P2 / P4 清单，仍未验）。
5. **外发 `-noentities` 包之前**：业主自读外发版 README；自行确认 `bics-equity-hierarchy-2024.json` 与演示数据的外发许可；Q10 标「来源待核」的文件须业主裁定。
6. **D3**：知悉公开仓内含 135 个第三方研报 PDF（见下）。

---

## 业主决定项（内阁判断与默认；**本期均不发问，默认即执行**）

| 项 | 默认 | 说明 |
|----|------|------|
| **D1　Apple Developer 账号 / 证书 / 凭据** | **业主侧，本期不阻塞**；无身份时回落 ad-hoc 并明说 | 只有业主能取得；B-B 六步即交付物。业主不做，现包与 P4 一样须「右键 / xattr / 仍要打开」 |
| **D2　`-noentities` 外发包仍含彭博 BICS 层级与演示数据** | 业主已授权，**照做并如实写入 README / PUBLIC-PRIVATE** | 「已授权」是业主决定，内阁不替彭博条款与法务背书；建议外发前业主自查许可 |
| **D3　cabinet 公开仓含第三方研报**（UBS / Bloomberg Intelligence / JP Morgan / Barclays 板件与 `BB_*` 原件 PDF 共 135 个，约 585 MB 的 cabinet 整体已在**公开** GitHub 仓） | **现状保留；自本日起 cabinet 不再新增第三方研究原件 PDF**；本期只新增我们自己写的文件；**不改写历史、不 force push**（`PUBLIC-PRIVATE.md` 条款） | **风险（请业主知悉）**：第三方研究报告可能受版权与订阅条款约束，公开仓转载有被要求下架 / 投诉的可能；已推送的历史不会因后续操作消失。**可选后续（须另令）**：`git rm --cached` 使这些 PDF 不再被后续提交跟踪（**不改历史**，历史里仍在）；若要彻底清除须改写历史，**违背现行条款，必须业主明令并另立方案** |
| **D4　版本号 2.2 / 4** | 升 | 业主异议可改回 |
| **D5　内嵌 Python 版本线与更新节奏** | 取 python.org 稳定的 bugfix 线（≥ 3.12，不取 `.0` / `.1`）；CPython 有安全发布或每季度重建一次 | 业主可改节奏 |
| **D6　外发渠道** | **本轮不上传 GitHub Release**；外发由业主自行发放 zip | 业主另令才做 |

---

## 不做（本期明令不做）

- 不改 `web/`、`server/`、`shell/{main,SFCShell,ErrorPanel}.swift`、`modules/**`；不新增 / 删除 / 调整任何模块或边。
- 不 `pip install`、不用第三方 Python 发行版（含 python-build-standalone）、不冻结后端（PyInstaller / py2app 路线）。
- **不宣称已公证 / 已通过 Gatekeeper**，不伪造任何身份或凭据，不代业主申请账号。
- 不做 dmg、不上传 Release / Actions artifact；不改仓库可见性；不改写历史；不 force push；不 `--no-verify`。
- 不 `git add -A` / `git add .`；不 add `Partner Work/`、`.vscode/`、`dist/`、`build/`。
- 不改 `DESIGN.md`；不改 `AESTHETIC.md` token；不调度美工部 / 信息部 / 交叉整合部 / 参谋纪要官。

---

## 指挥安排（业主令「你自己安排指挥」；内阁建议序，总参定夺）

```
内阁令（本文）→ 父代理转 general-staff（意志 + 任务单）
  → 实施（主代理）：E.0 快照 → A → B-A → C → D → E.2/E.3 验证
  → 监理部（既有流程；首轮审查包须含 Q15 与本令的允许改动清单；三次上限为本送审周期规程）
  → 内阁复核窗口（可发 P5-FIX1，不计期不限次）
  → 书记（追加 worklog）
  → F 段：更新清单 → 预提交核对 → 分组提交 → 推送 → ls-remote 核对
```

- **实施顺序理由**：先 A（解释器取得与壳选择，是后续一切的前提）→ B-A（签名在 A 之后才有嵌套 Mach-O 可签）→ C（变体与条款）→ D（文档写事实）→ 验证。F 在**三监与书记之后**，因为 worklog 须随同上传（`PUBLIC-PRIVATE.md` 上传检查 2）。
- **给监理部的提示（总参可写入任务单「后续」，内阁不令监理部）**：本期有**产品壳与打包脚本改动**。`code-quality` 须核：改动集合 ⊂ 允许清单；`Backend.swift` 改动是否收敛在 A.3；`SelfTest.swift` 是否仅限诊断开关；顺带核 Q15。`engineering-test` 须以**对 `dist/` 两种包的实跑**与 ≥ 3 张被看过的 PNG 为证，不凭读码，并做 Q3 的 M1/M2 对照与 Q5 的 Rosetta。`principle-compliance` 核：公私条款（凭据零入仓、外发条款、cabinet 条款）、「不宣称未发生的公证」、不破坏 FE / BE 分离、W1、FE-API。
- **分工**：主代理实施 A–F；其余部门不调度。

---

## 当前模块清单与关系（基线；26 模块 / 35 边；本期零改动；真源 `modules/graph.json`，静态页 `modules/index.html`）

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

计数：23 / 30 + P1（2 / 3）+ P2（1 / 2）= **26 / 35**；P4、P5 无增删。内嵌运行时是第三方制品，不立模块（见上拍板）。

---

## 交回（父代理在三监与推送后回报内阁时须含）

1. 改动清单（新增 / 修改 / 删除，逐路径）；`git status --short`（去 `Partner Work/`、`.vscode/`）；确认 `dist/`、`build/`、`.sfc-stage-*`、凭据类文件未入拟提交集合。
2. Q1–Q15 逐项结论与证据；业主复核清单六项**逐条标已验 / 未验**；**明说「未公证、无真身份验证」**（除非业主已完成 B-B 并重跑）。
3. 实施笔记：运行时版本与 SHA-256；entitlements 实测结论（需要 / 不需要 `disable-library-validation`，及理由）；包体积与 zip 体积；两种包文件清单与 SHA-256；Q10 三份数据文件的来源核实结果；任何偏离本令之处。
4. 模块图机检结果与当前模块清单（可复用上节）；PNG 路径（`cabinet/notes/p5-evidence/`）。
5. 提交清单路径、预提交核对脚本输出、`gh repo view --json visibility` 结果、推送与 `git ls-remote` 原文；推送失败则原样回报。
6. 三监报告结论；是否仍有后续（内阁预期：业主完成 B-B 后的「真身份重跑」为唯一后续）。

内阁据此复核：全过 ⇒ 回写 `plans/SFC-localization-plan.md` 进度账；有缺口 ⇒ 追加 `GS-20261015-LOCAL-P5-FIX1`（不计期，不限次）。
