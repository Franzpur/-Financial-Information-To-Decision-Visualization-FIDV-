# 权知统一补充条款

文件名：`POWER-KNOWLEDGE.md`（英文路径，避免读写错误）。条款正文用中文。

与 [`PUBLIC-PRIVATE.md`](./PUBLIC-PRIVATE.md) 并列公开：队员与各自 agent 可读本条款。本文件废止 worklog **#124** 中「唯父代理可写全部产品实现」的解释；改为**专知内写码 + 父代理跨域写码 + 交叉整合部在调度且 mode=implement 时的合并写码 + 监理部三监报告终裁**。

原则：**专有什么知识，就专有什么权力；专有什么权力，就专有什么知识。** 无对应真源专知，则无该域改码权；有改码权，则须维护对应公开真源与实现一致。美工、信息的公开真源仍是 `AESTHETIC.md` / `INFORMATION.md`。交叉整合部不另建公开专知文件；合并成功标准写在下一节写码口，操作步骤在本机私有 `agent_tasklist/cross-integration.md`（不进仓）。

---

## 1. 写码口

| 主体 | 权力 |
|------|------|
| **美工部** | 在 `agent_tasklist/AESTHETIC.md` 专知与下表「美学」路径内，可直接改产品外观相关文件 |
| **信息部** | 在 `agent_tasklist/INFORMATION.md`（及三分部）专知与下表「数据」路径内，可直接改数据工程相关文件 |
| **父代理** | **唯一流程串行口**与**送审口**；跨域、坐标/产品逻辑、未列入专知表的路径的**默认写手**；交叉整合部未获调度或任务不是 `mode=implement` 时，合并仍由父代理写；专部越界时收回改写 |
| **交叉整合部** | 仅当总参谋部任务单写明「调度 `cross-integration`」且 `mode=implement`、功能对比报告里没有未裁决冲突时，可把队员材料与本仓合并进下表「合并」路径。`mode=report` 只写报告，不改产品代码。成功标准：代码数目 1+1≦2（合入后去空白行数不大于本仓侧与材料侧之和，同一功能不抄两份）；功能和质量 1+1≧2（要留的两边功能都在，留下的部分不低于留下它的那一边）。两边行为冲突、不能同时留下时，不改产品代码，报告写明两边，交回待业主裁决，不默认丢弃任一边。不替代监理部，不写通过/打回，不记 worklog，不提交、不推送 |
| **总参谋部 / 参谋纪要官 / 档案部三部 / 监理部及三属 / 内阁** | **不**因本条款获得产品改码权 |

单文件内视觉与逻辑缠在一起 → 拆 diff，或整文件归父代理。美工与信息争同一路径 → 停，问业主，不抢改。没有交叉整合部的合并调度时，这两句仍有效。合并调度且 `mode=implement`、报告无未裁决冲突时，这一次合并所碰的产品文件由交叉整合部按「合并」行改，父代理、美工部、信息部不并行改同一路径。

---

## 2. 权知边界表

| 域 | 可写主体 | 路径 / 范围 | 明确不可 |
|----|----------|-------------|----------|
| **美学** | 美工部 | `ind-chain/web/css/app.css`；`index.html` / `list.html` / `cube.html` 的结构与 class（视觉）；`home.js` / `list.js` / `ui.js` 中 splash 时序、DOM chrome、样式类绑定（**无数据语义**）；`ind-chain/assets/fidv-launcher*`；`set-command-icon.sh`；`launcher_gui.py` 的色板与窗体外观；根 `Standard-Cube.app` 图标资源 | 单方面改 `--us` / `--intl` 等语义色；`coords.js`；`scene.js` 坐标/抽出/焦点几何；`api.js` / `state.js` / `main.js` / `nations.js` 产品流；启动器 Open/Restart/Quit 的进程与端口逻辑 |
| **数据** | 信息部 | `DATA-SPACE/**`（可跟踪表与 pull 公式；禁 `~$*`）；`class-3-coords/BICS-Classification/ingest_*.py`、`build_bics_hierarchy.py`、该目录数据向 README；本机生成 gitignore 的实体 `.db`；`INFORMATION.md` 与 `INFORMATION-*.md` | `ind-chain/server/*`；`ind-chain/data/companies.json` 演示链与 C-CUBE 几何；擅自改 `CONCEPTS.md` 的 C-* 语义；改美学文件 |
| **合并** | 交叉整合部（仅总参谋部调度且 `mode=implement`、报告无未裁决冲突） | `ind-chain/**` 产品源（不含 `data/ind_chain.db`，不含把队员整仓拷入的目录）；`class-3-coords/**` 中该次合并必须改的源与说明（不含生成的 `.db`）；`DATA-SPACE/**` 中该次合并必须改的已跟踪表（禁 `~$*`）；`ind-chain/CONCEPTS.md`、根 `README.md`、`ind-chain/README.md` 里随该行为改变的句子；报告只写 `cross-integration/reports/` | `cross-integration/inbox/**`（材料只读）；监理部、三属、档案部、书记、秘书、运维、内阁的角色与任务真源；`library/worklog*`、`library/showable-report/`、`library/bug-report/`；`cabinet/`；不 `git add` / `commit` / `push`；不把队员下载件提交进本仓 |
| **坐标 / 产品逻辑** | 父代理（默认） | `ind-chain/server/*`；`web/js` 中 api/state/coords/scene/main/nations 等；`CONCEPTS.md`；跨美学+数据+逻辑的一次改动；未列入美学、数据、合并三行的产品路径 | 交叉整合部在未获调度或不是 `mode=implement` 时不写这些路径。已获合并调度且报告无未裁决冲突时，以「合并」行为准 |

一行同时碰样式绑定与语义行为 → 没有合并调度时按「缠在一起」归父代理。已获合并调度且 `mode=implement`、报告无未裁决冲突时，该文件归「合并」行。

---

## 3. 流程与终审

1. 父代理仍串：呼出判定 → 对话刚开始时内阁可谏言（认为不需要则不发问；发问则弹出询问对话框，业主可强制实施）→ **若内阁已下令总参谋部，父代理须完整转交令文** →（若有）总参谋部最先规划 → 按单调度美工 / 信息 / 纪要官 / 交叉整合部 → 美工或信息改专知路径，或交叉整合部在 `mode=implement` 且功能对比报告没有未裁决冲突时改边界表「合并」路径，或父代理改其余跨域 → **凡有产品代码改动，仍由父代理送监理部**（监理部委派三属并列取证 → 三监报告；唯一终裁口）→ 对话栏那一句之后、派书记之前：**内阁可再谏言**；且按 `cabinet/AUTHORITY.md`，内阁可在此窗口据完成度**再令总参谋部**（完善本任务或下一任务）→ 每轮「内阁令 → 转总参 → 实施 → 三监」可循环，**全部内阁令结束后才派书记**。档案部委派其点名的书记、秘书、运维；谈话末项书记仍由父代理派，不经档案部转发。内阁不进三监，**不亲自改产品代码**；可写 `cabinet/`；**可向总参谋部下达指令**，并可在三监交回后、书记前**多次下令**（业主未指定次数时同一任务周期至多 5 次；业主指定「至多 N 次」则从 N；真源 `cabinet/AUTHORITY.md`）；**不**指挥监理部 / 档案部。业主向内阁要可打印报告时，写入 `cabinet/reports/`，不进 `library/showable-report/`。交叉整合部的功能对比报告只写 `cross-integration/reports/`，不进 `cabinet/`、`library/showable-report/`、`library/worklog`。
2. **`DESIGN.md` 仍是理念标准，判断落在理念贯彻属。** 通过 / 打回只出自三监报告：三属都达标才通过，任一不达标整单打回，上限三次。美工部、信息部、交叉整合部不写「通过 / 打回」。监理部及三属不因本条款获得改码权。交叉整合部不替代监理部。
3. 总参谋部规划不写「调度监理部 / 档案部」；**可接受内阁指令**（含同一任务周期内内阁多次再令）并立意志与任务单。不调度内阁。
4. 参谋纪要官仍只读、会话交回，无产品改码权。
5. 交叉整合部不记 worklog，不提交、不推送，不把队员整仓放入可跟踪路径。`cross-integration/inbox/` 没有材料时不对比、不改产品代码。

---

## 4. 与公私隔离

本文件进仓、公开。`agents/`、`agent_tasklist/RULE.md` 等权力细则仍私（见 `PUBLIC-PRIVATE.md`）。公开原则与边界表为准；本机私角色文件须与本文一致，由业主本机父代理维护，**不**随仓覆盖队员工具。

---

## 5. 上传

可与工程一并 `git add`：`POWER-KNOWLEDGE.md`、本条款所要求的公开真源措辞（`AESTHETIC.md` / `INFORMATION.md`）、`PUBLIC-PRIVATE.md`、根 `README.md`、`.gitignore`。不要把 `agents/`、`.cursor/`、`cross-integration/`（队员下载件与功能对比报告）或私有 `RULE`、`agent_tasklist/cross-integration.md` 当作必须上传项。
