# 内阁 → 总参谋部指令

**令号** GS-20261014-GLOBAL-RENAME  
**日期** 2026-10-14  
**任务周期** 新周期（全局改名）  
**本周期内阁下令计数** **1 / 5**（本令为第 1 次；谏言不计次）  
**来源** 业主 Purkniv 原话「电内阁，指挥完成全局改名工作，ind-chain改名为Ind-Chain，class-3-coords改名为BE-CLASS，DATA-SPACE改名为BE-DATA，Standard-Cube改名为Standard-Financial-Charting，另外保证改名完成后不要出现bug」；内阁代指挥拍板并下令  
**依据** `cabinet/AUTHORITY.md` · 内阁出令前对仓库的实查（下「事实」节）  
**父代理动作** 将本文**完整**转交 `general-staff`；实施由主代理一次做完（本令属跨美学 + 数据 + 逻辑的一次改动，按 `POWER-KNOWLEDGE.md` 归父代理，**不**拆给美工部 / 信息部 / 交叉整合部）；产品码变更后按既有规则送监理部。内阁不亲自改产品码；不令监理部 / 档案部。

---

## 意志（一句）

把四个名字在仓库里**一次改全**，改后一切照旧能跑，且不留旧名残影——因为本机文件系统不分大小写，「能跑」骗得了人，只有「搜不到旧名」才算改全。

---

## 定夺（已拍板，勿再问业主）

| 旧 | 新 | 备注 |
|----|----|------|
| `ind-chain/` | `Ind-Chain/` | **只是大小写变化**，git 必须两步改名 |
| `class-3-coords/` | `BE-CLASS/` | 含 `BICS-Classification/` 子目录原名不变 |
| `DATA-SPACE/` | `BE-DATA/` | 含 `ICBC C/…` 子树原名不变 |
| `Standard-Cube`（全部出现面） | `Standard-Financial-Charting` | 含 `.app`、可执行名、Bundle 标识、窗口标题、alert 文案、脚本名、API `meta.title`、网页 `<title>` |

衍生命名（总参照此写死）：
- `Standard-Cube.app` → `Standard-Financial-Charting.app`；`Contents/MacOS/Standard-Cube` → `Contents/MacOS/Standard-Financial-Charting`；`CFBundleName` / `CFBundleDisplayName` / `CFBundleExecutable` = `Standard-Financial-Charting`；`CFBundleIdentifier` = `local.fidv.Standard-Financial-Charting`。
- `build-standard-cube-app.sh` → `build-standard-financial-charting-app.sh`；`standard-cube-stub.c` → `standard-financial-charting-stub.c`。
- 日志前缀 `[ind-chain]` → `[Ind-Chain]`。启动器窗口副标题 `ind-chain` → `Ind-Chain`。

**不改（业主未要求或属史实）**
- `ind_chain.db`、`data/ind_chain.db*`、`ai_chain.db` 等**文件名与 `.gitignore` 中这几行**——只改目录名。
- `Partner Work/` 全部（队员件，公私隔离，**一字不碰**）。
- `.git/` 历史。
- **史实不改写**：`library/worklog-001…006.md`、`library/bug-report/ops-log-001.md`、`library/showable-report/**`（已发布报告含 PDF）、`cabinet/reports/**`（已发布）、`cabinet/orders/GS-2026101*`（含本令）、`cabinet/notes/**`、`cabinet/modular-interface-scheme.md`、`cabinet/ICBC-Elliot-integration-advice.md`、`cross-integration/reports/**`。理由：它们记录当时事实，改写即篡史；PDF 无法改。读旧文按 `cabinet/README.md`「全局改名对照」表翻译（内阁已落）。**例外提示**：`library/showable-report/FIDV-clone-handbook.html` 是操作手册，内含旧启动命令，会误导新读者——**本令不改**（`library/` 非实施面），请在任务单里**记一条「建议下一周期令档案部 clerk 另出新版 / 加改名对照页眉」**，由业主定。
- 英文普通词不改：`standard cube shell`、`standardView`、`goStandardView`、`MeshStandardMaterial`、`[C-STDVIEW]`、`Standard AI semiconductor…` 等**不是**产品名 `Standard-Cube`（带连字符、首字母大写的专名），**禁止**误替换。

---

## 事实（内阁实查，总参勿凭空重查，可抽检）

1. **文件系统不分大小写**（`git config core.ignorecase=true`，`/Volumes/DATA` 实测）。后果：① `git mv ind-chain Ind-Chain` 一步改**不会生效**；② 改名后任何漏改的旧大小写路径**仍能跑**，会掩盖遗漏——验收**必须靠 grep**，不能靠「跑得通」；③ 将来在大小写敏感的系统 / 新克隆上漏改处会直接炸。
2. 工作树当前**干净**（仅 `Partner Work/`、`.vscode/settings.json` 为未跟踪；业主件，不碰）。已跟踪文件共 1511 个（`Partner Work/` 无一跟踪）：`ind-chain` 33、`class-3-coords` 7、`DATA-SPACE` 47、`Standard-Cube.app` 5、`modules` 3、`agent_tasklist` 3（DESIGN / AESTHETIC / INFORMATION）、`library` 52、`cabinet` 1356、根文件 4（`.gitignore` / `README.md` / `PUBLIC-PRIVATE.md` / `POWER-KNOWLEDGE.md`）。
3. 运行时**硬路径**（改漏即 bug）：
   - `ind-chain/server/app.py:39-40`：`ROOT.parent / "class-3-coords" / "BICS-Classification" / …json|…db`（BICS JSON、实体库）。
   - `class-3-coords/BICS-Classification/ingest_20261003_entities.py:26-27`：`REPO / "DATA-SPACE" / "ICBC C" / …`（两处）；`REPO = HERE.parents[1]` 靠目录深度，**不变**。
   - `ind-chain/scripts/standard-cube-stub.c:60,94`：C 里写死 `"%s/ind-chain/scripts/launcher_gui.py"` 与 `"%s/ind-chain/data/launcher-last.log"`；`:52` 注释、`:16` alert 文案、`:62` 提示。**该 C 文件改后必须重编译**，否则 `.app` 仍执行旧串（旧串在本机恰能跑，是隐形雷）。
   - `ind-chain/scripts/build-standard-cube-app.sh`：`SRC` / `APP` / `OUT` 变量与**内嵌 Info.plist 模板**（仅当 plist 不存在才写；现存 plist 不会被模板覆盖，须**手改现存 plist**）。
   - `ind-chain/scripts/set-command-icon.sh`：`APP="$REPO/Standard-Cube.app"` 与注释、echo。
   - `ind-chain/scripts/launcher_gui.py`：窗口标题 / 主标签 / 副标签 / alert 文案；端口清理走 `lsof :8787`，不含路径。
   - `ind-chain/server/db.py`：docstring、`meta()["title"] = "Standard-Cube"`（经 `/api/bundle` 的 `meta.title` 输出；前端 JS 无人消费该字段）、`:232` 注释。
   - `ind-chain/web/cube.html` `<title>Standard-Cube</title>`；`web/js/scene.js` 首行注释；`web/js/coords.js:23` 注释。
   - `.gitignore:5` `class-3-coords/BICS-Classification/bics_entities_20261003.db`。**旧路径一旦失效而未同步，26 MB 实体库会作为未跟踪件出现在 `git status`，一次 `git add -A` 就进仓**。注：`DATA-SPACE` 本不在根 `.gitignore`；`ind-chain/.gitignore` 的 `data/…` 相对路径不受影响。
   - `modules/graph.json`：`BE-INGEST.role` = "DATA-SPACE ingest scripts (offline)"（唯一一处）；`modules/index.html` 为烘焙产物（含同句，tooltip 一处）；`modules/bake_static.py` 无旧名。模块 **id 全部不变**。
4. 条文面（须同步文字）：根 `README.md`（含 `Run Standard-Cube` 小节与全部命令）、`PUBLIC-PRIVATE.md`（路径表 17–20 行）、`POWER-KNOWLEDGE.md`（§美学 / 数据 / 合并 / 坐标四行的路径列）、`agent_tasklist/DESIGN.md`（实查**无**旧名，不动）、`agent_tasklist/AESTHETIC.md`（15 处，已跟踪）、`agent_tasklist/INFORMATION.md`（旧名约 13 处，已跟踪）、`ind-chain/README.md`、`ind-chain/CONCEPTS.md`、`class-3-coords/README.md`、`class-3-coords/BICS-Classification/README.md`。
5. 私路径（`.gitignore` 已排除，不入仓；只改文字，**不得因此 `git add -f`**）：`agent_tasklist/` 下其余 ignored 规则文件（`INFORMATION-*.md`、`general-staff.md`、`cross-integration.md`、`RULE.md`、`art-department.md` 等）、`agents/*.md`（旧名约十几处）。`cross-integration/reports/**` 为历史，不改；但 `agent_tasklist/cross-integration.md` 须补一句：**队员件（`cross-integration/inbox/`、`Partner Work/`）仍用旧名 `ind-chain` / `class-3-coords` / `DATA-SPACE`，对照时按 `Ind-Chain↔ind-chain`、`BE-CLASS↔class-3-coords`、`BE-DATA↔DATA-SPACE` 映射，不得因名不同而判「缺失」**。`.cursor/agents`、`.cursor/skills` 实查**无**旧名。
6. 当前 `:8787` **未监听**（curl 实测拒绝连接）；启动器进程是否在跑请实施前再确认。
7. 无独立测试套件；`ruff` / `pyflakes` 本机 PATH 未装。「零新增」按下节**前后对比**口径。
8. 命名提示（不阻塞）：目录名 `BE-CLASS` / `BE-DATA` 与 `graph.json` 里 `BE-*` 模块 id 同前缀，**但无同名模块，不冲突**。任务单勿借机在 graph 里新增 `BE-CLASS` / `BE-DATA` 模块或改任何模块 id（那是下一任务）。

---

## 指令正文（须完整执行，顺序即风险最小序）

### 0. 实施前（基线 + 停服务）
- 停掉 `:8787` 与启动器（`lsof -ti :8787` 后 SIGTERM；退出 `Standard-Cube.app` / `launcher_gui.py` 窗口），避免占文件。
- 记基线到 `/tmp/fidv-rename-baseline/`（**不入仓**）：
  1. 旧树上起一次服务，采 `/api/health`、`/api/bics/entities`（取一个有数据的 L4 查询）、`/api/bics/children`、`/api/bundle?ticker=NVDA` 的响应体（`meta.title` 一行允许变）、`/`、`/list`、`/cube`、`/modules/`、`/modules/graph.json` 状态码，然后停服务。
  2. `git ls-files | rg -v '^Partner Work'` 清单与数量（应为 1511）；`git status --short | rg -v 'Partner Work|\.vscode|cabinet/'` 应为空（`cabinet/` 下有内阁本令落盘的改动，不计）。
  3. `find "Partner Work" -type f -print0 | sort -z | xargs -0 shasum | shasum` 指纹——改名后须**逐字一致**。
  4. `ruff check` / `python3 -m pyflakes`（任一，缺则 `pip install --user`）对 `ind-chain/ class-3-coords/ modules/` 的输出，存为基线。
  5. `rg -n --no-ignore --hidden -F -e 'ind-chain' -e 'class-3-coords' -e 'DATA-SPACE' -e 'Standard-Cube' -e 'standard-cube'`（按下「验收 · 残留门」的排除表）命中清单，作为改前对照与替换逐文件清单。

### 1. 先清点（grep，已由内阁预扫，总参任务单据此列文件）
任务单须**列出逐文件改动清单**（可由上「事实」§3–§5 直接得出），并写明**每个文件替换哪几个串**；**禁止**对全仓盲 `sed`（会碰 Partner Work、史实文件、`ind_chain.db`、英文普通词）。替换只对清单内文件做，且**区分大小写**。

### 2. 两步 git 改名（无内容改动先行，保 rename 可识别）
1. `git mv ind-chain ind-chain__tmp && git mv ind-chain__tmp Ind-Chain`（**两步，缺一不可**）。
2. `git mv class-3-coords BE-CLASS`；`git mv DATA-SPACE BE-DATA`；`git mv Standard-Cube.app Standard-Financial-Charting.app`。
3. `.app` 内：`Contents/MacOS/Standard-Cube` → `Contents/MacOS/Standard-Financial-Charting`（`git mv`）。
4. `Ind-Chain/scripts/` 两个脚本 `git mv` 为新名（见衍生命名）。
5. 确认：`ls -1` 实际大小写为 `Ind-Chain`（`ls` 输出区分显示）；`git ls-files | rg '^(ind-chain|class-3-coords|DATA-SPACE|Standard-Cube)'` 为空；`git status` 显示为 **R（rename）** 而非整库删加。**到此先不改内容**，让 rename 稳定落入索引。
6. 被忽略 / 未跟踪件（`bics_entities_20261003.db`、`Ind-Chain/data/ind_chain.db`、`__pycache__`）随目录一起移动；确认它们仍在新路径下，且 `git status` **没有**把 `bics_entities_20261003.db` 当未跟踪件列出（`.gitignore` 同步前可能列出——先别 `add`，继续第 3 步后复查）。

### 3. 批量改引用（只改清单内文件，区分大小写，顺序：先长串后短串）
- `Standard-Cube.app` → `Standard-Financial-Charting.app`；`build-standard-cube-app` → `build-standard-financial-charting-app`；`standard-cube-stub` → `standard-financial-charting-stub`；`local.fidv.Standard-Cube` → `local.fidv.Standard-Financial-Charting`；其余 `Standard-Cube` → `Standard-Financial-Charting`。
- `class-3-coords` → `BE-CLASS`；`DATA-SPACE` → `BE-DATA`；`ind-chain` → `Ind-Chain`（含 `[ind-chain]` → `[Ind-Chain]`、`python3 ind-chain/scripts/…`、`cd ind-chain`）。**`ind_chain.db`（下划线）不碰。**
- 现存 `Standard-Financial-Charting.app/Contents/Info.plist` **手改**四处名字 + Bundle 标识（模板只在无 plist 时生效）；同步改脚本内嵌模板，二者一致；`plutil -lint` 通过。
- `Ind-Chain/server/app.py`：L39-40 改 `BE-CLASS`；L1100 注释 `DATA-SPACE`→`BE-DATA`；日志前缀。`Ind-Chain/server/db.py`：docstring、`meta()["title"]` → `Standard-Financial-Charting`。
- `Standard-Financial-Charting-stub.c`：全部旧串改完后，**用改好的 `build-standard-financial-charting-app.sh` 重编译**（已有 `codesign --force --deep -s -`），删除遗留旧可执行 / 旧签名残件，确认包内只有新名可执行。
- `.gitignore:5` → `BE-CLASS/BICS-Classification/bics_entities_20261003.db`。`git check-ignore -v BE-CLASS/BICS-Classification/bics_entities_20261003.db` 必须命中。**不得**把任何 `.db` / `~$*` / `agents/` / `agent_tasklist/*`（白名单三份除外）/ `cross-integration/` 误入索引。
- 已跟踪条文面（`README.md` `PUBLIC-PRIVATE.md` `POWER-KNOWLEDGE.md` `agent_tasklist/AESTHETIC.md` `agent_tasklist/INFORMATION.md` 及各子 README / CONCEPTS）：改路径文字；**`PUBLIC-PRIVATE.md` 路径表必须与实际目录一一对应**。`agent_tasklist/DESIGN.md` 无旧名，**不改**。
- 私路径文字（事实 §5）：同样改（含 `agent_tasklist/cross-integration.md` 加映射句），但不入仓。
- `modules/graph.json`：`BE-INGEST.role` 改为 "BE-DATA ingest scripts (offline)"；**模块 id 与边一律不变**；然后 `python3 modules/bake_static.py` 重烘焙，确认 `modules/index.html` 无旧名、产物可 `file://` 打开。

### 4. 重启验证（须实跑，不得只读码）
见「验收」。服务以 `python3 Ind-Chain/scripts/seed.py`（如需）+ `python3 Ind-Chain/server/app.py` 启动；`launcher` 与 `.app` 各冷启一次。

### 5. 条文更新与新条目
- 史实文件不改。`cabinet/README.md` 的改名对照表与 `cabinet/AUTHORITY.md` 旧名括注**已由内阁落盘**，实施者勿动。
- 改名事实由**末位书记**在新条目里一句话注明（旧名→新名、旧条目不改）；总参任务单勿令实施者写 `library/`。

### 6. 交监理
改名属产品码 / 条文变更，实施毕送监理部；监理三部据下「验收」逐条勾。

---

## 验收（总参任务单逐条可勾；全部过才算完）

**V1 残留门**（区分大小写；`--no-ignore --hidden`；二进制/库忽略）：
```
rg -n --no-ignore --hidden -F -e 'ind-chain' -e 'class-3-coords' -e 'DATA-SPACE' -e 'Standard-Cube' -e 'standard-cube' . \
  -g '!Partner Work/**' -g '!.git/**' -g '!library/worklog-00*.md' -g '!library/bug-report/ops-log-001.md' \
  -g '!library/showable-report/**' -g '!cabinet/reports/**' -g '!cabinet/orders/GS-2026101*' -g '!cabinet/notes/**' \
  -g '!cabinet/modular-interface-scheme.md' -g '!cabinet/ICBC-Elliot-integration-advice.md' \
  -g '!cabinet/README.md' -g '!cabinet/AUTHORITY.md' -g '!cross-integration/reports/**' \
  -g '!*.db' -g '!*.log' -g '!*.pdf' -g '!.DS_Store'
```
**零命中**。例外只有：`agent_tasklist/cross-integration.md` 里新增的「队员件仍用旧名」映射句（任务单须写明该句命中为预期并列出）。

**V2 目录与 git**：`ls -1` 实际为 `Ind-Chain` `BE-CLASS` `BE-DATA` `Standard-Financial-Charting.app`；`git ls-files` 无旧前缀；`git status` 重命名显示 `R`（尽量；若个别文件因内容改动过大显示 D/A 须说明）；已跟踪文件总数仍为 1511（rename 不增减）；`Partner Work` 指纹与基线**一致**；无 `.db` / 私规则文件被跟踪；`git check-ignore` 命中实体库。

**V3 服务**（`python3 Ind-Chain/server/app.py` 起）：`/api/health`、`/`、`/list`、`/cube`、`/modules/`、`/modules/graph.json`、`/api/bics/entities?…`、`/api/bics/children`、`/api/bundle?ticker=NVDA`（及 `DEMO`、一个非链 ticker 的 shell 路径）均 **200**；响应体与基线一致（唯一允许差：`meta.title`）；启动日志前缀为 `[Ind-Chain]`；`BICS_JSON` 与实体库路径可读（`/api/bics/*` 有数据，非空表）；W1 回归：静态探测 `/data/ind_chain.db`、`/BE-CLASS/…`、`/BE-DATA/…`、`/../` 均 404 且错误体无绝对路径（A1/A2 不退化）。

**V4 脚本**：`python3 -m py_compile` 通过 `BE-CLASS/BICS-Classification/{build_bics_hierarchy,ingest_20261003_entities}.py`、`Ind-Chain/server/*.py`、`Ind-Chain/scripts/*.py`、`modules/bake_static.py`；`ingest_20261003_entities.py` 的 `SRC_DIRS` 解析到的目录**真实存在**（只做存在性检查或 `--help` / 干跑，**不得覆盖**现有 26 MB 实体库；如需实跑必先备份并说明）。

**V5 启动器 / .app**：`Standard-Financial-Charting.app` 双击或 `open` 可起，窗口标题 / alert 文案均为新名，窗口版面未因名变长而截断（实看）；`file` 显示 Mach-O；`plutil -lint Info.plist`；`CFBundleExecutable` 与 `Contents/MacOS/` 下文件同名；`codesign --verify --deep` 通过；`Ind-Chain/data/launcher-last.log` 重生成后路径为 `…/Ind-Chain/…` 与 `…/Standard-Financial-Charting.app/…`；`python3 Ind-Chain/scripts/launcher_gui.py` 亦可起；`set-command-icon.sh` 可跑。重启后再核 `:8787`。

**V6 静态质量**：`ruff` / `pyflakes`（同基线所用者）前后对比**零新增**；若本机始终装不上，则以 V4 `py_compile` + `compileall` 替代并在任务单写明。

**V7 模块图**：`python3 modules/bake_static.py` 成功；`modules/index.html` 仍 23 模块 / 30 边（FE 12 · BE 10 · other 1；calls 15 · depends 13 · contract 2）；模块 id 与边无变；唯一文字变化为 `BE-INGEST` 的 role / tooltip。

**V8 条文**：`PUBLIC-PRIVATE.md` 路径表与目录一一对应；`POWER-KNOWLEDGE.md` 四行路径列已改；根 `README.md` 运行命令（`open Standard-Financial-Charting.app`、`python3 Ind-Chain/scripts/launcher_gui.py`、`cd Ind-Chain && …`、`./Ind-Chain/scripts/build-standard-financial-charting-app.sh`）**抄一条实跑一条**。

**不过即返工**：任一项失败，按失败项修，不得带病交监理。

---

## 总参任务单须含的几点

1. 逐文件改动清单（据「事实」）与每文件替换串；明示**禁止全仓盲 sed**、**区分大小写**、**不碰 Partner Work / ind_chain.db / 英文普通词**。
2. 上节 §0–§6 顺序，不得调换；两步 git 改名与 `.app` 重编译是**硬步骤**。
3. V1–V8 全部列为可勾验收。
4. 记一条建议：下一周期是否令档案部 clerk 为 `FIDV-clone-handbook` 出带改名对照的新版（业主定）。
5. 记一条提醒业主：Dock / 登录项里若钉了旧 `Standard-Cube.app`，会失效，需重钉；macOS 可能缓存旧 Bundle 标识，必要时 `lsregister -f` 新 `.app`（实施者可做，非必须）。
6. **不做**：不改任何模块 id / 边；不改 `ind_chain.db` 名；不改 `DESIGN.md`；不动 `Partner Work/`；不改 `library/` 与已发布报告；不借机重构路径常量（只改字符串，保持最小改动）；不 push、不 commit（除非业主另令）。

*内阁本令计数 1/5。三监交回后，内阁据完成度判是否再令。*
