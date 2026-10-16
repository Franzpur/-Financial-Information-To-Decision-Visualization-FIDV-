# 公私隔离协议

文件名：`PUBLIC-PRIVATE.md`（英文路径，避免读写错误）。条款正文用中文。

补充条款。teamwork 后，**工程跟仓走，工作工具跟个人走**。Agent 是各人的工作方式，不是 SFC 产品。随仓覆盖对方的 agent，会干扰各自的更新判断。每人按自身需要在本机设置 agent。

每次上传 GitHub **只交工程本身**。不交 agent 角色、调度任务、权力规则、Cursor 加载链。

本文件进仓，好让队员看见条款。

---

## 公（上传、队员可见）

| 路径 | 性质 |
|------|------|
| `Ind-Chain/`（含 `CONCEPTS.md`、网页、服务、原生壳源码 `shell/`、构建 / 打包 / 回归脚本、图标） | 工程 |
| `Ind-Chain/web/vendor/three/` | three.js 0.170.0 本地副本（MIT，含 `LICENSE` 与 SHA-256 清单），工程 |
| `modules/` | 模块真源（`graph.json`）与静态投影，工程 |
| `cabinet/` | 整理件、令文、规划。**业主 2026-10-15 已确认 `cabinet/` 进仓**（沿既有跟踪事实）。该目录含第三方研究报告板件与原件 PDF（版权归原出版方），仓库公开期间由业主知悉并承担；**自本日起 `cabinet/` 不再新增第三方研究原件 PDF，只增我们自己写的文件**。历史不改写 |
| `BE-CLASS/`（层级 JSON、ingest、README；生成的 `.db` 仍不跟踪） | 工程 |
| `BE-DATA/`（已跟踪的表与手册；`~$*`、实体 db 仍不跟踪） | 工程 |
| `Standard-Financial-Charting.app`、根 `README.md` | 工程。`.app` 为通用二进制 + ad-hoc 签名（hardened runtime；无 Developer ID 前不公证），**仅在构建脚本或壳源码变化时才重建并提交**，避免无谓的二进制 diff |
| `library/`：worklog、`showable-report/`、`bug-report/` | 队员读本与时间线，仍公开 |
| `agent_tasklist/DESIGN.md` | 产品三持，工程真源 |
| `agent_tasklist/AESTHETIC.md` | 色板 / chrome / splash，工程真源 |
| `agent_tasklist/INFORMATION.md` | 数据词条，工程真源 |
| `PUBLIC-PRIVATE.md` | 本协议，公开 |
| `POWER-KNOWLEDGE.md` | 权知统一补充条款，公开 |

## 私（停跟踪，本机保留）

| 路径 | 性质 |
|------|------|
| `agents/` | 角色说明书 |
| `agent_tasklist/` 除上表三份真源以外的文件（含 `RULE.md`、调度任务、三分部） | 任务与权力 |
| `.cursor/agents/`、`.cursor/skills/` | 本机 Cursor 工具 |
| `cross-integration/` | 队员下载件与功能对比报告，不进仓 |
| `dist/`、`build/`（含 `build/python-runtime/` 内嵌运行时下载缓存与抽取物）、`.sfc-stage-*`、分发 zip | 构建 / 打包产物与暂存（`.gitignore` 已忽略） |
| Developer ID 证书、`.p12`、`.p8`、app 专用密码、notarytool 凭据 | **永不入仓、不入脚本、不入日志**（`.gitignore` 拦 `*.p12`、`*.p8`、`*.cer`、`*.mobileprovision`、`*.certSigningRequest`） |
| `~/Library/Application Support/Standard-Financial-Charting/`、`~/Library/Logs/Standard-Financial-Charting/` | 应用运行期用户数据与日志，不在仓内 |
| 审查 / 验收截图（如 `cabinet/notes/p*-evidence/`、`/tmp` 下的取证 PNG） | **业主 2026-10-15 令：每次审完后即销毁**，不进仓、不留本机，免占空间；回报里写所见即可 |
| `Partner Work/` | 本机合作方原件与副本，0 文件被跟踪，**不得 add** |
| `.vscode/` | 编辑器本机设置 |

历史 commit 里曾经进过仓的 agent 文仍在旧版本里。不改写历史，不 force push。本机文件不删。

---

## 第三方数据条款

两档：

1. **含实体库的包 / `BE-CLASS/BICS-Classification/bics_entities_*.db`**（`dist/internal/`）是彭博数据加工物，**仅限团队内部分发**。不得上传 GitHub（含 Release / Actions artifact）或任何公开网站。同档：`Ind-Chain/data/debt-ladder-*.json`（彭博债券聚合，仅内部；已 `.gitignore`，不进 `-noentities` 包，只可能随 `dist/internal/` 出现；本机烘焙，不 `git add`）。
2. **`-noentities` 外发包**（`dist/noentities/`，zip 名带 `-noentities`）：**业主 2026-10-15 授权可外发**，外发由业主承担许可责任；内阁与工程不替彭博条款或法务背书。该包**仍含**：彭博 BICS 行业层级 JSON（`bics-equity-hierarchy-2024.json`）；`companies.json`（96 家，其中 16 家的 `value_m` 在代码里标注为彭博 Alphabet 供应商关系 `GOOGL_SUPPLY.xlsx`，其余为公开行业图谱）；`nvda-revenue-links.json`（文件自注来源为 Bloomberg Supply Chain Summary 2026-10-05 截图整理 + 旧 json，即含彭博供应链数据）；`layers.json`（自拟层定义，无外部来源标注）；three.js（MIT）与内嵌 Python / OpenSSL 等（声明见包内 `THIRD-PARTY-NOTICES.txt`）。不得上传 GitHub Release，除非业主另令。

API 黄金响应同理，只放仓外临时目录。

---

## 上传检查

1. 只 `git add` 工程路径与本协议、`POWER-KNOWLEDGE.md`、`.gitignore`、根 README。
2. **`library/worklog*` 每次上传都必交**（含本轮书记刚追加的行）。谈完就推时，先记 worklog 再 `git add`；若推送后又记了一条，立刻再交再推，不把 worklog 留在本机。
3. 不要把 `agents/`、`.cursor/`、`cross-integration/`、以及 `agent_tasklist/` 里非三份真源的改动加入提交。
4. 只用**显式路径** `git add -- <路径>`，**禁止 `git add -A` / `git add .`**（仓内同时躺着 `Partner Work/`、`.vscode/`）。
5. 提交前跑一次「拟提交集合 ⊂ 允许清单」的核对：`git diff --cached --name-only | rg -n "Partner Work|\.vscode|^dist/|^build/|\.sfc-stage|\.db$|\.log$|__pycache__"` 必须无输出。
6. **推送前核对仓库可见性**（`gh repo view --json visibility`，无 `gh` 时用 GitHub API），把结果写进回报，不因此改动可见性；**单文件 > 50 MB 的新增物（`.app` 以外）须先停下回报**。
7. 停跟踪用 `git rm --cached`，不要用不带 `--cached` 的 `git rm`。

## Pull

他机若仍跟踪上述私路径，`git pull` 会从**对方工作区删掉**那些文件。这符合「各自配置工具」。若还要留一份参考，先拷到仓外再 pull。
