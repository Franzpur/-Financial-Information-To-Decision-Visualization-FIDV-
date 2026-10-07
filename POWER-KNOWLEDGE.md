# 权知统一补充条款

文件名：`POWER-KNOWLEDGE.md`（英文路径，避免读写错误）。条款正文用中文。

与 [`PUBLIC-PRIVATE.md`](./PUBLIC-PRIVATE.md) 并列公开：队员与各自 agent 可读本条款。本文件废止 worklog **#124** 中「唯父代理可写全部产品实现」的解释；改为**专知内写码 + 父代理跨域写码 + 监理部三监报告终裁**。

原则：**专有什么知识，就专有什么权力；专有什么权力，就专有什么知识。** 无对应真源专知，则无该域改码权；有改码权，则须维护对应公开真源（`AESTHETIC.md` / `INFORMATION.md`）与实现一致。

---

## 1. 写码口

| 主体 | 权力 |
|------|------|
| **美工部** | 在 `agent_tasklist/AESTHETIC.md` 专知与下表「美学」路径内，可直接改产品外观相关文件 |
| **信息部** | 在 `agent_tasklist/INFORMATION.md`（及三分部）专知与下表「数据」路径内，可直接改数据工程相关文件 |
| **父代理** | **唯一流程串行口**；跨域、坐标/产品逻辑、未列入专知表的路径的**默认写手**；专部越界时收回改写 |
| **总参谋部 / 参谋纪要官 / 档案部三部 / 监理部及三属** | **不**因本条款获得产品改码权 |

单文件内视觉与逻辑缠在一起 → 拆 diff，或整文件归父代理。美工与信息争同一路径 → 停，问业主，不抢改。

---

## 2. 权知边界表

| 域 | 可写主体 | 路径 / 范围 | 明确不可 |
|----|----------|-------------|----------|
| **美学** | 美工部 | `ind-chain/web/css/app.css`；`index.html` / `list.html` / `cube.html` 的结构与 class（视觉）；`home.js` / `list.js` / `ui.js` 中 splash 时序、DOM chrome、样式类绑定（**无数据语义**）；`ind-chain/assets/fidv-launcher*`；`set-command-icon.sh`；`launcher_gui.py` 的色板与窗体外观；根 `Standard-Cube.app` 图标资源 | 单方面改 `--us` / `--intl` 等语义色；`coords.js`；`scene.js` 坐标/抽出/焦点几何；`api.js` / `state.js` / `main.js` / `nations.js` 产品流；启动器 Open/Restart/Quit 的进程与端口逻辑 |
| **数据** | 信息部 | `DATA-SPACE/**`（可跟踪表与 pull 公式；禁 `~$*`）；`class-3-coords/BICS-Classification/ingest_*.py`、`build_bics_hierarchy.py`、该目录数据向 README；本机生成 gitignore 的实体 `.db`；`INFORMATION.md` 与 `INFORMATION-*.md` | `ind-chain/server/*`；`ind-chain/data/companies.json` 演示链与 C-CUBE 几何；擅自改 `CONCEPTS.md` 的 C-* 语义；改美学文件 |
| **坐标 / 产品逻辑** | 父代理（默认） | `ind-chain/server/*`；`web/js` 中 api/state/coords/scene/main/nations 等；`CONCEPTS.md`；跨美学+数据+逻辑的一次改动；未列入上两行的产品路径 | — |

一行同时碰样式绑定与语义行为 → 按「缠在一起」归父代理。

---

## 3. 流程与终审

1. 父代理仍串：呼出判定 →（若有）总参谋部最先 → 按单调度美工 / 信息 / 纪要官 → 专部改专知路径或父代理改跨域 → **凡有产品代码改动，仍由父代理送监理部**（三属并列取证 → 三监报告；唯一终裁口）→ 谈话末派书记。
2. **`DESIGN.md` 仍是理念标准，判断落在理念贯彻属。** 通过 / 打回只出自三监报告：三属都达标才通过，任一不达标整单打回，上限三次。美工部、信息部不写「通过 / 打回」。监理部及三属不因本条款获得改码权。
3. 总参谋部规划不写「调度监理部 / 档案部」；硬排除不变。
4. 参谋纪要官仍只读、会话交回，无产品改码权。

---

## 4. 与公私隔离

本文件进仓、公开。`agents/`、`agent_tasklist/RULE.md` 等权力细则仍私（见 `PUBLIC-PRIVATE.md`）。公开原则与边界表为准；本机私角色文件须与本文一致，由业主本机父代理维护，**不**随仓覆盖队员工具。

---

## 5. 上传

可与工程一并 `git add`：`POWER-KNOWLEDGE.md`、本条款所要求的公开真源措辞（`AESTHETIC.md` / `INFORMATION.md`）、`PUBLIC-PRIVATE.md`、根 `README.md`。不要把 `agents/` 或私有 `RULE` 改动当作必须上传项。
