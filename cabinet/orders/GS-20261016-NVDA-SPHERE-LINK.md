# 内阁 → 总参谋部指令

**令号** GS-20261016-NVDA-SPHERE-LINK  
**日期** 2026-10-16  
**本周期内阁下令计数** **第 1 次 / 至多 5**（新周期：NVDA 链点球色 / 可点线 / 来源 Excel / map 关系纸面；与已结 Map·GOOGL 悬停周期 `DMAP-*` / `GOOGL-HOVER-*` 分立。业主未另指定次数。谏言不计次）  
**本期** **NVDA chain：三色小球 + shell 对齐名牌 + 可点加粗收入线 + 现造来源 Excel 写入边路径 + 选线出 map 关系纸面（临时图规）**  
**交** **总参谋部**（父代理须将本文**完整**转交 `general-staff` 立意志与任务单；产品码由主代理实施；实施后按既有规则送监理部，内阁不令监理部；内阁不改产品码）  
**来源** 业主 Purkniv 原话（整包 + 续答，见旁注 `cabinet/notes/20261016-nvda-sphere-link-intent.md`）  
**依据** `cabinet/AUTHORITY.md` · `Ind-Chain/CONCEPTS.md` C-POINT / C-LABEL / C-REV-LINK / C-MAPDOCK · W1 A2（JSON 不向浏览器泄漏库文件作**可读句柄**；展示用相对路径字符串允许，仿 GOOGL 文件环）· `agent_tasklist/AESTHETIC.md` 色板

---

## 谏言

**不发问。** 两处歧义已由业主续答收口（见下「意志」）。

---

## 意志（一句）

**NVDA 链上点改成与壳一致的小球（中心白、供绿、消红），名牌跟壳对齐；收入线加粗可悬停可选中，悬停列出边数据里指向现造 Excel 的路径；选中线时 Map dock 出双方关系纸面（图规由实施方临时自定，不挡工期）。**

---

## 两问正式收口（勿再问业主）

| # | 裁定 |
|---|------|
| **Q1 来源路径** | 在 **`Ind-Chain/data/` 某一子目录**（推荐 `Ind-Chain/data/links/`）**现造**与现有 `nvda-revenue-links.json` peer 数据对应的 Excel；边（或文档）写入**仓内相对路径**字段，悬停列表读该字段。数值来自已有 JSON，不要求彭博原件。 |
| **Q2 map 关系纸面** | **临时图规**：父代理 / 主代理喜欢怎么画怎么画；标准制图未立前不阻塞。最低可读：双方名、侧别（supplier/consumer）、pct（若有）、来源路径注。选中线驱动 Map dock 预览（新 mapping id 或 dock 专用输入均可，总参拍板）。 |

---

## 任务（总参据此立任务单）

### T1　数据：现造 Excel + 边写路径

| 项 | 拍板默认 |
|----|----------|
| 落点 | `Ind-Chain/data/links/`（新建）；至少一册，例如 `nvda-revenue-links.xlsx`，表体由 `nvda-revenue-links.json` 的 peers 生成（side / name / ticker / spendPct|revPct） |
| 边字段 | 在 JSON（及 BE-NVDA-LINKS 产出）为每条 peer 边增加可展示路径，如 `sourcePath: "data/links/nvda-revenue-links.xlsx"`（仓相对；可多文件则数组 `sourcePaths`）。文档级旧 `source` 文案可保留作注，**悬停列表以路径字段为准** |
| W1 | 浏览器只展示路径字符串；**不得**把该路径挂成可下载静态句柄、不得教 FE `fetch` 打开 xlsx。服务端读 JSON/布局照旧 |
| 打包 | 若 SHELL-PACK allow-list 含 `data/`，把新 xlsx 纳入；否则总参在任务单注明并补白名单 |

### T2　C-POINT（chain / NVDA）：三色小球

| 角色 | 形 | 色 |
|------|----|----|
| 中心 NVDA | 球，直径 1×UNIT | **白**（与 demo/shell 白球同族） |
| supplier | 同尺寸球 | **绿**（可与 `COLORS.LINK_SUPPLIER` 同系或略亮，总参定一档字面色并写 CONCEPTS） |
| consumer（业主用语；代码侧 = customer） | 同尺寸球 | **红**（同系 `COLORS.LINK_CUSTOMER`） |

- 废除（或不再用于 NVDA chain 点）米白盘 + US/INTL 色环作为主点形；球**非** billboard；悬停放大 ~1.5× 沿用。  
- `usesWhiteSpheres()` 若仅 demo/shell，须扩展或另开 chain 球路径——**不得**把 NVDA 仍画成盘。  
- 其他 `?ticker=` shell 行为不变。

### T3　C-LABEL：名牌与壳对齐

- chain / NVDA 点名牌改用与 demo/shell **白球名牌同构**：暗玻璃底 + 亮线框；底边中心在球心 **+y 0.5 UNIT**；长边 ∥ 用户 x；法向 +s；**不** billboard；文案小写 name（≤28 + `…`）。  
- 旧 outlined 文字标签从 NVDA chain 点上撤掉。

### T4　C-REV-LINK：加粗 + 悬停/选中 + 来源列表

- 线加粗到**指针易命中**（可见 stroke + 必要则透明 hit 管/加宽拾取）；可 hover、可 click 选中。  
- 悬停：仿 GOOGL 文件卡气质（cube 暗底亮线框），列表列出该边 `sourcePath(s)`（文件名 + 短路径）；有折线引线则与 GOOGL 卡同族规则，避免再造一套纸面皮。  
- 选中态：线高亮；与点选互斥规则总参写清（建议：选线时清点选或保留中心钉，勿双焦点打架）。

### T5　Map：选线 → 双方关系纸面

- 选中一根 C-REV-LINK 时，打开 / 刷新 **C-MAPDOCK** 纸面预览为**该边双方关系**的纸面版（非债务梯，除非总参论证复用 PM-LADDER 不合理——默认**新临时 mapping**，如 `PM-REV-LINK`）。  
- 图规：**临时**，实施方自定；须可读、纸面皮（`plot-paper` / C-SKIN-PAPER）。  
- 未选线时 Map 既有行为（含 PM-LADDER-Q）不回退。

### T6　CONCEPTS / 回归

- 更新 C-POINT、C-LABEL、C-REV-LINK、C-MAPDOCK（及必要时 C-MAP 注册）活文案。  
- `regress_all` 快速档仍通；链页 `/cube?ticker=NVDA` 手测：三色球、名牌、线悬停路径、选线出关系纸面。

---

## 不做

- 不立「标准制图」规范文档（业主明言以后才有）。  
- 不改 BICS 树、不改 demo 96 家点形（除非为共享球材质抽公共函数——允许）。  
- 不把 Excel 路径变成浏览器可下载真源。  
- 内阁不改 `Ind-Chain` 产品码。

---

## 模块跟踪展示（令时义务）

真源 `modules/graph.json` · 静态投影 `modules/index.html`（`file://` OK）  
**当时**：**32 模块 / 45 边** · `updated` 2026-10-16  

本令**预期**主改：`FE-SCENE`、`FE-ACTION`（若选中态）、`BE-NVDA-LINKS`（边字段 + 数据文件）、`FE-MAPREG` / `FE-MAPPROJ` / `FE-MAPDRAW` / `FE-MAPDOCK`（关系纸面）。**不强制**改 `modules/graph.json` 拓扑，除非新增独立 mapping 模块——默认可落在现有 fe-map 四件套内。

### 模块清单

| id | 中文 | side | region |
|----|------|------|--------|
| FE-NAV | 导航 | FE | fe-decision |
| FE-BOARD | 展板 | FE | fe-decision |
| FE-LIST | 列表 | FE | fe-decision |
| FE-OPENCUBE | 跳转制图台 | FE | fe-cube |
| FE-LISTAREA | 列表属地 | FE | fe-decision |
| FE-ACTION | 操作 | FE | fe-cube |
| FE-COORDONE | 摆放坐标 | FE | fe-cube |
| FE-SCENE | 场景 | FE | fe-cube |
| FE-PANEL | 面板 | FE | fe-cube |
| FE-FOCUS | 聚焦 | FE | fe-cube |
| FE-API | 接口 | FE | fe-api |
| FE-AESTHETIC | 前端设计 | FE | fe-cube |
| FE-MAPPROJ | 映射投影 | FE | fe-map |
| FE-MAPDRAW | 映射绘制 | FE | fe-map |
| FE-MAPREG | 映射注册 | FE | fe-map |
| FE-MAPDOCK | 映射台 | FE | fe-map |
| FE-MAPOUT | 映射导出 | FE | fe-map |
| SHELL-WINDOW | 壳窗口 | SHELL | shell |
| SHELL-PROC | 内嵌后端 | SHELL | shell |
| SHELL-PACK | 打包 | SHELL | shell |
| BE-HTTP | — | BE | be |
| BE-BUNDLE | 捆绑编排 | BE | be |
| BE-DB-DEMO | 演示集 | BE | be |
| BE-DB-SHADOW | 影集 | BE | be |
| BE-NVDA-LAYOUT | N布局规划 | BE | be |
| BE-NVDA-LINKS | N关系集 | BE | be |
| BE-DEBT | 偿债窄口 | BE | be |
| BE-BICS-HIER | BICS分类树 | BE | be |
| BE-BICS-ENTITY | BICS公司树 | BE | be |
| BE-BICS-AREA | BICS地区映射 | BE | be |
| BE-BICS-INGEST | BICS导入 | BE | be |
| MODULES-TRACK | 静态模块跟踪 | other | be |

### 关系简图（边类型）

```
FE-NAV → FE-BOARD → FE-LIST → FE-OPENCUBE
FE-* → FE-API → BE-HTTP → BE-BUNDLE → {BE-DB-DEMO, BE-DB-SHADOW, BE-NVDA-LAYOUT, BE-NVDA-LINKS}
BE-NVDA-LAYOUT → BE-NVDA-LINKS
FE-OPENCUBE / FE-PANEL / FE-AESTHETIC → FE-MAPDOCK → {FE-MAPREG, FE-MAPDRAW, FE-MAPOUT, FE-API}
FE-MAPREG → FE-MAPPROJ · FE-AESTHETIC → FE-MAPDRAW
BE-HTTP → BE-DEBT · BE-HTTP → MODULES-TRACK
SHELL-* ↔ BE-HTTP
```

完整边表见 `modules/graph.json`；图见 `modules/index.html`。

---

## 交回期望（总参 / 主代理）

1. 意志一句 + 任务单（T1–T6）。  
2. 实施后送监理部；三监通过则本周期可不再令（内阁窗口另计）。  
3. 回报写明：Excel 实际路径、边字段名、map mapping id、球色字面值。
