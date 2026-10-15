# 内阁 → 总参谋部指令

**令号** `GS-20261015-RENAME-FIDV-SFC-R2`  
**日期** 2026-10-15  
**任务周期** 「总项目名称改名第二轮：上一轮保留项全部改为 SFC」  
**本周期内阁下令计数** **第 1 次 / 至多 5 次**（据 `cabinet/AUTHORITY.md` 多次下令权；谏言不计次）  
**本期** **将上一轮 `GS-20261015-RENAME-FIDV-SFC` 保留未改的演示种子 `note`、图标与报告文件名（`fidv-*` / `FIDV-*`）及其全仓路径引用、Bundle ID 与 `sessionStorage` 键全部改为 `sfc` / `SFC`**  
**交** **总参谋部**（父代理须将本文**完整**转交 `general-staff` 立意志与任务单；实施后送监理部三监并审，内阁不令监理部；内阁不改产品码）  
**来源** 业主 Purkniv 原话：「电内阁，我的意见是全部修改。」及业主经中途问询确认的两条边界：① 历史档案只改指向已改名文件的链接/路径，历史叙述正文保持原样；② 磁盘目录 `/Volumes/DATA/FIDV` 与 GitHub 仓库名本次不动，在交回里写清业主自行操作步骤。  
**依据** `cabinet/AUTHORITY.md` · `cabinet/orders/GS-20261015-RENAME-FIDV-SFC.md`

---

## 一、内阁谏言判定

### 谏言结论：**不发问**
**一句话理由**：业主已明令对上一轮保留项「全部修改」，且历史档案正文与本机磁盘目录/GitHub 远端两项边界已由业主亲自拍板确认，范围清晰无歧义。

---

## 二、精确修改范围（四项写死，总参照此立单）

### 1. 演示种子 `note` 字段 + Golden 基线与可再生库同步
- `Ind-Chain/data/companies.json:959`：
  - `"note": "Synthetic showcase firm for FIDV demos (not a live issuer)."` → `"note": "Synthetic showcase firm for SFC demos (not a live issuer)."`
- **重采 Golden 基线与清理可再生演示库**：
  - 删除可再生 SQLite 演示库文件：`Ind-Chain/data/ind_chain.db`（及 `-journal`/`-wal` 若存在）与 `~/Library/Application Support/Standard-Financial-Charting/ind_chain.db`，让后端启动时从更新后的 `companies.json` 自动重新种子建库。
  - 在重采 Golden 前先核对旧 Golden 差异**仅限于**含该 `note` 的响应（如 `/api/bundle` 演示模式、`/api/companies` 等），随后运行 `bash Ind-Chain/scripts/regress_all.sh capture` 更新 Golden 基线，并确认 `regress_all.sh quick` 60 条 Golden 0 diff。

### 2. 文件改名（`fidv-*` / `FIDV-*` → `sfc-*` / `SFC-*`）与全仓链接同步
- **文件改名清单**（已追踪文件一律用 `git mv`，未追踪文件用 `mv`）：
  1. 启动器图标资产：
     - `Ind-Chain/assets/fidv-launcher.icns` → `Ind-Chain/assets/sfc-launcher.icns`
     - `Ind-Chain/assets/fidv-launcher-1024.png` → `Ind-Chain/assets/sfc-launcher-1024.png`
     - `library/showable-report/assets/fidv-launcher-1024.png` → `library/showable-report/assets/sfc-launcher-1024.png`（若存在）
  2. 内阁报告（`cabinet/reports/` 下共 6 份）：
     - `cabinet/reports/FIDV-*.html` → `cabinet/reports/SFC-*.html`
  3. 秘书可打印报告与读本（`library/showable-report/` 下共 8 份 `.html` + 1 份 `.md`，及同名 `.pdf` 若为 `FIDV-*`）：
     - `library/showable-report/FIDV-*` → `library/showable-report/SFC-*`
  4. 运维问题手册 PDF：
     - `library/bug-report/FIDV 问题手册 · GitHub 克隆后分类空.pdf` → `library/bug-report/SFC 问题手册 · GitHub 克隆后分类空.pdf`
- **全仓路径与链接引用同步（除 `Partner Work/` 外）**：
  - 构建与图标脚本：`Ind-Chain/scripts/build-standard-financial-charting-app.sh`、`Ind-Chain/scripts/set-command-icon.sh` 中的 `fidv-launcher.icns` → `sfc-launcher.icns`。
  - 活文档与规则文件：`Ind-Chain/README.md`、`Ind-Chain/CONCEPTS.md`、`PUBLIC-PRIVATE.md`、`POWER-KNOWLEDGE.md`、`agent_tasklist/AESTHETIC.md`、`agent_tasklist/clerk.md`、`.cursor/skills/clerk-showable-report/SKILL.md`、`cabinet/AUTHORITY.md`、`cabinet/README.md` 等处凡引用上述文件路径/文件名的，一律更新为 `sfc-launcher*` / `SFC-*`。
  - 历史档案（`library/worklog-001…007.md`、`library/showable-report/**`、`library/bug-report/**`、`cabinet/reports/**`、`cabinet/orders/**`、`cabinet/notes/**`、`cross-integration/reports/**`）：**仅修改指向上述已改名文件的链接与路径（含 URL 编码的 `FIDV%20` 链接）**，使超链接与路径不断链；**历史叙述正文中的 `FIDV` 字样保持原样不改**。
  - **保留不改的文件名**：本令 `GS-20261015-RENAME-FIDV-SFC-R2.md` 与上一令 `GS-20261015-RENAME-FIDV-SFC.md`（文件名中的 `RENAME-FIDV-SFC` 系描述「从 FIDV 改名为 SFC」这一历史事件本身）。

### 3. 技术标识符改名（Bundle ID 与 `sessionStorage` 键）
- **Bundle ID**：`local.fidv.Standard-Financial-Charting` → `local.sfc.Standard-Financial-Charting`
  - 修改 `Ind-Chain/scripts/build-standard-financial-charting-app.sh`（及 `Standard-Financial-Charting.app/Contents/Info.plist` 或脚本生成处、测试/回归脚本若有引用），然后运行 `bash Ind-Chain/scripts/build-standard-financial-charting-app.sh` 重建仓内 `Standard-Financial-Charting.app`（注：Bundle ID 变更后 macOS 窗口位置记忆将重置，属预期行为）。
- **前端 `sessionStorage` 键**：`fidvSplashSeen` → `sfcSplashSeen`
  - 修改 `Ind-Chain/web/js/home.js`（2 处）。

### 4. 交回中附业主自行改磁盘目录与 GitHub 仓库名操作步骤
- 本次不触碰 `/Volumes/DATA/FIDV` 目录名与 GitHub remote URL，但在最终交回中必须给业主列出清晰的三步操作指南（关闭 Cursor 与运行中 `.app` → 终端 `mv /Volumes/DATA/FIDV /Volumes/DATA/SFC` → GitHub 仓库 Settings Rename 为 `SFC` 并 `git remote set-url origin ...`）。

---

## 三、验收标准（三监与内阁复核判据）

| # | 验收项 | 判据 |
|---|---|---|
| **R2-1** | **文件名与资产零 `fidv` 残留** | `git ls-files` 及全仓文件查找（排除 `Partner Work/` 与 `cabinet/orders/GS-20261015-RENAME-FIDV-SFC*.md`）不再存在任何以 `fidv-` 或 `FIDV-` / `FIDV ` 开头的文件名 |
| **R2-2** | **活文件 `rg -i 'fidv'` 清零门** | 对活代码、活脚本、活配置、活文档（`README.md`、`PUBLIC-PRIVATE.md`、`POWER-KNOWLEDGE.md`、`Ind-Chain/**`、`BE-CLASS/**`、`modules/**`、`agent_tasklist/**`、`agents/**`、`.cursor/skills/**`）运行 `rg -i 'fidv'`：**0 命中**（仅允许物理工作区绝对路径 `/Volumes/DATA/FIDV` 或 GitHub remote URL 若有出现） |
| **R2-3** | **历史档案链接有效且正文未篡改** | 历史报告与 worklog 中指向 `SFC-*.html` / `sfc-launcher*` / `SFC%20问题手册…` 的链接全部指向新文件名，且历史叙述正文未做盲替 |
| **R2-4** | **回归门禁与 26/35 不变** | 重采 Golden 后 `bash Ind-Chain/scripts/regress_all.sh quick` **ALL PASS**（26/35 模块图机检、静态检查、60 条 Golden API 0 diff） |
| **R2-5** | **`.app` 重建与双 `--selftest`** | `Standard-Financial-Charting.app/Contents/Info.plist` 的 `CFBundleIdentifier` 为 `local.sfc.Standard-Financial-Charting`；默认页与 `/cube?ticker=NVDA%20US%20Equity` 双 `--selftest` 均返回 `ok: true, external: 0, webglDrawn: true` |

---

## 四、当时模块清单与关系摘要（静态真源 `modules/graph.json` · `modules/index.html`）

**26 模块 / 35 边保持不变**（无改则略）：FE 12（`FE-NAV`、`FE-BOARD`、`FE-LIST`、`FE-OPENCUBE`、`FE-LISTAREA`、`FE-ACTION`、`FE-COORDONE`、`FE-SCENE`、`FE-PANEL`、`FE-FOCUS`、`FE-API`、`FE-AESTHETIC`）· BE 10 + `MODULES-TRACK`（`BE-HTTP`、`BE-BUNDLE`、`BE-DB-DEMO`、`BE-DB-SHADOW`、`BE-NVDA-LAYOUT`、`BE-NVDA-LINKS`、`BE-BICS-HIER`、`BE-BICS-ENTITY`、`BE-BICS-AREA`、`BE-BICS-INGEST`）· SHELL 3（`SHELL-WINDOW`、`SHELL-PROC`、`SHELL-PACK`）；35 条边（FE 内 17、BE 内 11、SHELL 内 2、跨侧 5）。
