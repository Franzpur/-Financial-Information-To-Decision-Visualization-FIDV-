# 本地化改革提交清单（只产出，不执行）

日期 2026-10-14 · 对应令文 `orders/GS-20261014-LOCAL-P4-retire-and-closeout.md` H 段。
**状态（P5 更新，2026-10-15）**：业主 2026-10-15 令本轮免审、截图审完即销毁、随即提交。`git log -1` = `019af67`（GitHub 上同点）；`git diff --cached --name-only` 为空。业主已在 P5 令中授权「做完后提交 GitHub」，门禁（三监通过 + 内阁复核 + 书记 worklog）过后才执行；回退点 `019af67`。

## 1. 拟提交文件（`git status --short` 去 `Partner Work/`、`.vscode/` 后的全集）

### 组 1　产品与脚本（提交信息：「本地化：原生壳 + 内嵌后端 + 自包含打包；退役旧启动器（回退点 019af67）」）

| 状态 | 路径 |
|------|------|
| 修改 | `.gitignore` |
| 修改 | `Ind-Chain/.gitignore` |
| 修改 | `Ind-Chain/scripts/build-standard-financial-charting-app.sh` |
| **删除** | `Ind-Chain/scripts/launcher_gui.py` |
| **删除** | `Ind-Chain/scripts/standard-financial-charting-stub.c` |
| 修改 | `Ind-Chain/scripts/set-command-icon.sh` |
| 新增 | `Ind-Chain/scripts/package-standard-financial-charting.sh`（0755）、`Ind-Chain/scripts/fetch-embedded-python.sh`（0755，P5）、`Ind-Chain/scripts/sfc.entitlements`（P5） |
| 新增 | `Ind-Chain/scripts/regress_all.sh`（0755） |
| 新增 | `Ind-Chain/scripts/regress_api_golden.py` |
| 新增 | `Ind-Chain/scripts/regress_app_lifecycle.sh` |
| 新增 | `Ind-Chain/shell/{main,SFCShell,Backend,ErrorPanel,SelfTest}.swift`（5 个） |
| 修改 | `Ind-Chain/server/app.py`、`Ind-Chain/server/db.py` |
| 修改 | `Ind-Chain/web/cube.html`（仅 importmap 两行） |
| 新增 | `Ind-Chain/web/vendor/three/{LICENSE,README.txt,build/three.module.js,examples/jsm/controls/OrbitControls.js}` |
| 修改 | `modules/graph.json`、`modules/bake_static.py`、`modules/index.html` |
| 修改 | `Standard-Financial-Charting.app/Contents/Info.plist`（P5：版本 2.2 / 4）、`Standard-Financial-Charting.app/Contents/MacOS/Standard-Financial-Charting`（`.app` 二进制只出现这一次；`_CodeSignature/CodeResources` 本次无 diff） |

### 组 2　文档与公私表（提交信息：「本地化：文档、公私表、令文与证据同步」）

| 状态 | 路径 |
|------|------|
| 修改 | `README.md`、`Ind-Chain/README.md`、`Ind-Chain/CONCEPTS.md` |
| 修改 | `PUBLIC-PRIVATE.md`、`POWER-KNOWLEDGE.md`、`agent_tasklist/AESTHETIC.md` |
| 修改 | `cabinet/README.md` |
| 新增 | `cabinet/orders/GS-20261014-LOCAL-P1-shell-window.md`、`…-P2-harden-and-pack.md`、`…-P4-retire-and-closeout.md`、`cabinet/orders/GS-20261015-LOCAL-P5-embed-sign-publish.md`（P5） |
| 新增 | `cabinet/plans/SFC-localization-plan.md` |
| 新增 | `cabinet/notes/LOCAL-commit-manifest-20261014.md`（本文件） |

### 组 3　日志（每次上传必交，见 `PUBLIC-PRIVATE.md` 上传检查 2）

| 状态 | 路径 |
|------|------|
| 新增 | `library/worklog-007.md`（书记 P5 追加后；它在 P4 时已新开，当前未跟踪） |

## 2. 明确排除

| 排除 | 原因 |
|------|------|
| `Partner Work/` | 合作方原件与副本，0 文件被跟踪，数 MB 未跟踪，**不得 add** |
| `.vscode/` | 编辑器本机设置 |
| `dist/`、`build/`（含 `build/python-runtime/` 的 python.org 安装包与抽取物）、`.sfc-stage-*`、分发 zip | 构建产物，`.gitignore` 已忽略（`git check-ignore -v` 实测命中） |
| `cabinet/notes/p4-evidence/`、`p5-evidence/` 截图 | 业主 2026-10-15 令：审完即销毁，已删除，不进仓 |
| `*.p12`、`*.p8`、`*.cer`、`*.mobileprovision`、`*.certSigningRequest`、notarytool 凭据 | 签名机密，永不入仓（`.gitignore` 已拦） |
| `Ind-Chain/data/ind_chain.db`、`*.db-journal` | 生成物，已忽略 |
| `BE-CLASS/BICS-Classification/bics_entities_*.db` 及含它的包 | 彭博数据加工物，仅限内部（`PUBLIC-PRIVATE.md` 第三方数据条款） |
| `*.log`、`__pycache__/` | 运行产物 |
| API 黄金目录（`${TMPDIR:-/tmp}/sfc-golden`） | 含第三方数据，本就在仓外 |

## 3. 命令（只写出，不运行；**不含 `git push`**）

```bash
cd /Volumes/DATA/FIDV
# 组 1
git add -- .gitignore Ind-Chain/.gitignore \
  Ind-Chain/scripts/build-standard-financial-charting-app.sh Ind-Chain/scripts/set-command-icon.sh \
  Ind-Chain/scripts/package-standard-financial-charting.sh Ind-Chain/scripts/regress_all.sh \
  Ind-Chain/scripts/regress_api_golden.py Ind-Chain/scripts/regress_app_lifecycle.sh \
  Ind-Chain/scripts/launcher_gui.py Ind-Chain/scripts/standard-financial-charting-stub.c \
  Ind-Chain/scripts/fetch-embedded-python.sh Ind-Chain/scripts/sfc.entitlements \
  Ind-Chain/shell Ind-Chain/server/app.py Ind-Chain/server/db.py Ind-Chain/web/cube.html \
  Ind-Chain/web/vendor/three modules/graph.json modules/bake_static.py modules/index.html \
  Standard-Financial-Charting.app
# （两个已删除文件用 git add -- <path> 即暂存删除；git add 目录 Ind-Chain/shell 只含 5 个 swift 文件）
git commit -m "本地化：原生壳 + 内嵌后端 + 自包含打包；退役旧启动器（回退点 019af67）"
# 组 2
git add -- README.md Ind-Chain/README.md Ind-Chain/CONCEPTS.md PUBLIC-PRIVATE.md POWER-KNOWLEDGE.md \
  agent_tasklist/AESTHETIC.md cabinet/README.md cabinet/orders/GS-20261014-LOCAL-P1-shell-window.md \
  cabinet/orders/GS-20261014-LOCAL-P2-harden-and-pack.md cabinet/orders/GS-20261014-LOCAL-P4-retire-and-closeout.md \
  cabinet/orders/GS-20261015-LOCAL-P5-embed-sign-publish.md \
  cabinet/plans/SFC-localization-plan.md cabinet/notes/LOCAL-commit-manifest-20261014.md
git commit -m "本地化：文档、公私表、令文与证据同步"
# 组 3
git add -- library/worklog-007.md
git commit -m "worklog: 本地化改革"
# 推送：git fetch，确认可快进后普通 git push（不 force、不 --no-verify）；之后 git ls-remote 核对远端 HEAD
```

提交前核对（每个提交前各跑一次；脚本全文见 `/tmp/sfc-precommit-check.sh`，同下）：

```bash
#!/bin/bash
# usage: precommit-check.sh  (run inside the repo, after `git add`, before `git commit`)
cd /Volumes/DATA/FIDV || exit 2
BAD=$(git diff --cached --name-only | rg -n "Partner Work|\.vscode|^dist/|^build/|\.sfc-stage|\.db$|\.log$|__pycache__|\.zip$|\.p12$|\.p8$|\.cer$|\.pkg$")
[ -z "$BAD" ] && echo "PASS 无排除项被暂存" || { echo "FAIL 排除项被暂存:"; echo "$BAD"; exit 1; }
OUT=$(git diff --cached --name-only | rg -v '^(\.gitignore|Ind-Chain/|modules/|Standard-Financial-Charting\.app/|README\.md|PUBLIC-PRIVATE\.md|POWER-KNOWLEDGE\.md|agent_tasklist/AESTHETIC\.md|cabinet/(README\.md|orders/GS-2026101[45]-LOCAL|plans/SFC-localization|notes/LOCAL-commit-manifest|notes/2026101[45]-)|library/worklog-00[0-9]\.md)')
[ -z "$OUT" ] && echo "PASS 暂存集合 ⊂ 允许清单" || { echo "FAIL 清单外:"; echo "$OUT"; exit 1; }
N=$(git diff --cached --name-only | rg -c '^Standard-Financial-Charting\.app/Contents/MacOS/') ; echo "INFO .app 二进制出现 ${N:-0} 次（组 1 应为 1，其余为 0）"
echo "INFO 暂存条数: $(git diff --cached --name-only | wc -l | tr -d ' ')"
```

**实跑演示**（2026-10-14，未暂存；脚本支持传入清单文件模拟 `--cached`）：

```
$ bash /tmp/sfc-precommit-check.sh /tmp/sfc-proposed-list.txt      # 拟提交 48 条（含 worklog-006）
PASS 无排除项被暂存
PASS 暂存集合 ⊂ 允许清单
INFO .app 二进制出现 1 次
INFO 条数: 48
$ bash /tmp/sfc-precommit-check.sh /tmp/sfc-bad-list.txt           # 反例：混入 Partner Work/、dist/*.zip、ind_chain.db
FAIL 排除项被暂存:  Partner Work/x.xlsx · dist/a.zip · Ind-Chain/data/ind_chain.db      (exit 1)
$ bash /tmp/sfc-precommit-check.sh                                 # 真实暂存区
PASS … PASS …  条数: 0   ；git log -1 = 019af67
```

## 4. 业主决定项（P5 后状态）

| 项 | 状态 |
|----|------|
| 内嵌 Python | **已做（P5）**：python.org 3.14.8 universal2，在 `Contents/Frameworks/Python.framework`；壳优先用包内的 |
| Developer ID 签名 + 公证 | 流水线已做（环境变量驱动，五种失败情形已演示）；**本机无签名身份，现包 ad-hoc、未公证**；业主六步见根 `README.md` |
| `cabinet/` 是否继续进仓 | 业主 2026-10-15 已确认进仓；公开仓含 135 个第三方研报 PDF 为既成事实，不再新增 |
| `--no-entities` 包能否外发 | 业主已授权；该包仍含彭博 BICS 层级、16 家彭博来源数值、NVDA 供应链数据（见 `PUBLIC-PRIVATE.md`） |
| commit / push | 业主已授权，过门禁后执行 |

## 5. 未验清单（如实，P5 更新）

1. 实际鼠标点击红色关闭按钮（自动化只验 `performClose` 等价路径与 Cmd-Q 事件）。
2. 屏幕解锁下肉眼旋转立方体（有 `takeSnapshot` PNG 与 `webglDrawn`，无交互）。
3. 断网冷启动（有 `external==0` 与 vendor 本地化，未真断网）。
4. 把 zip 拷到**无 CLT 的 Mac**与 **Intel 实机**试用（本机已用「候选收窄 + 最小 PATH」模拟无系统 Python，并用 Rosetta 跑了整个壳，但不能替代真机）。
5. **真 Developer ID 身份下的签名、公证、Gatekeeper、library validation 重测：未验**（本机无身份）。ad-hoc 构建对解释器可执行文件加了 `disable-library-validation`，真身份下应不需要，须重测。
6. 窗口位置记忆：用户手动移动 / 缩放后保存、拔显示器 **未验**。
7. WebContent 崩溃自动重载：**未验（读码核验）**，`SFCShell.swift:433-442`。
8. L1 展板：应用内冷启动 `/` 恒带 splash，展板本体用浏览器补拍；P5 证据取 L2 / L4 / 制图台，均为应用内截图。
9. Rosetta 下浮点末位：x86_64 的 `cos` 与 arm64 相差 1 ULP（`ringCos` 末位），API 黄金逐字节 compare 在 Rosetta 下有 7 条（内部包）差异，仅末位，非功能差异；原生 arm64 零差异。
