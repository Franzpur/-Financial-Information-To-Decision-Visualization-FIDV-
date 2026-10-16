# 内阁 → 总参谋部指令

**令号** `GS-20261016-NVDA-SHAPE2-USMAP`  
**日期** 2026-10-16  
**任务周期** 「NVDA Shape Two：s=0 美国地图体空间 + PM-US-MAP 映射纸面」  
**本周期内阁下令计数** **第 1 次 / 至多 5 次**（新周期；与已结/并行的 `NVDA-SPHERE-LINK`、`DMAP-*`、`GOOGL-HOVER-*` 分立。业主未另指定次数。谏言不计次）  
**本期** **在体空间立 Shape Two（s=0、x+/y+、20×20 US 地图 + US HQ 点 + NVDA→peer 抛物线细管）；映射侧立 `PM-US-MAP`（美地图 + 下表左 supplier / 右 consumer）；INTL 不进图、脚注说明；壳形式不变**  
**交** **总参谋部**（父代理须将本文**完整**转交 `general-staff` 立意志与任务单；产品码由主代理实施；实施后按既有规则送监理部，内阁不令监理部；内阁不改产品码）  
**来源** 业主 Purkniv「电内阁」+ 全权便宜行事；原话与收口见旁注 `cabinet/notes/20261016-nvda-shape2-usmap-intent.md`  
**依据** `cabinet/AUTHORITY.md` · `Ind-Chain/CONCEPTS.md` C-COORD / C-REV-LINK / C-MAP2 / C-POINT · `agent_tasklist/AESTHETIC.md` · 既有 NVDA 链令 `GS-20261016-NVDA-SPHERE-LINK`

---

## 谏言

**不发问。** 业主已授全权并命「自己全权负责搞成」；范围可由内阁拍板，无需弹窗。

---

## 意志（一句）

**为 NVDA chain 增加第二种体空间展演 Shape Two：在 s=0 的 x+/y+ 平面铺 20×20 UNIT 美国地图，只标美国公司总部，关系线自 NVDA 以抛物线细管连出；并做同叙事的纸面映射 `PM-US-MAP`（上图下表：左 supplier、右 consumer）；INTL 不进地图。**

---

## 范围裁断（拍板定案，总参照此立单）

| # | 项 | 裁断 |
|---|----|------|
| D1 | Shape Two 与现切片布局 | **并存**。现有 BICS 切片 + 环 + 直线 C-REV-LINK **不删**。Shape Two 为可切换的第二种展演（入口总参定：A/F 子项、Map 旁钮、或 cube 面控件均可；须可回切）。 |
| D2 | 地图几何 | 用户坐标：**s = 0**；图幅落在 **x∈[0,20]、y∈[0,20]**（x+、y+）；边长 **20 UNIT**。底板为可读的美国本土轮廓（州界精度总参自定；须美观、轻量）。 |
| D3 | 谁上地图 | **仅** `nvda-revenue-links.json` 中 `country === "US"` 的 peer + 中心 **NVDA**。**INTL 不标点、不画线**。脚注：`INTL peers: N`（可附短名单或「见 JSON」）。 |
| D4 | HQ 坐标 | 需经纬度或已投影的地图 (u,v)。无仓内真源则：**信息部或主代理现造** `Ind-Chain/data/` 下 HQ 表（推荐 `data/links/nvda-us-hq.json`：ticker → lat/lon 或 mapXY）；公开可核的总部城市即可，不要求彭博字段。 |
| D5 | 近点微隔开 | 投影后欧氏距离过近的 HQ，在**显示坐标**上做小幅排斥/抖动（建议最小间距 ~0.4–0.6 UNIT）；**保留**原始 lat/lon 字段不动。属体空间审美，非改地理事实。 |
| D6 | 抛物线 | 自 **NVDA HQ** 到各 US peer HQ；弧在 **s=0 平面内**（或微抬 +s 以免 z-fight，总参定一档 ≤0.05 UNIT）。气质：「导弹」抛物线。 |
| D7 | 线宽 / 色 | **宽窄不变** = 与**当前** C-REV-LINK **细管**同径（非 SPHERE-LINK 令里「加粗命中」的可见加粗若已落地，则以**可见细管直径**为准，勿再加粗）。色：supplier 墨绿 / customer（consumer）暗红，与现链一致。 |
| D8 | 点形 | 沿用链上三色小球（白 / 绿 / 红）；名牌规则可与 Shape One 同构，或地图上用更短标签——总参择一，勿两套打架。 |
| D9 | 壳 | **壳的形式不变**：不改 SHELL 窗框、冷启动、启动器图标。 |
| D10 | 映射 | 新临时 mapping **`PM-US-MAP`**：纸面美美国地图 + 同批 US 点与关系弧（或等价示意）+ **图下双列表**（左 supplier、右 consumer：名 / ticker / pct 若有）。纸面皮 `C-SKIN-PAPER` / `plot-paper`。入口：Map dock；何时默认打开由总参定（建议：进入 Shape Two 时同步可出该纸面，或 Map ▾ 可选）。 |
| D11 | Cisco 等双边 | 地图 **一点一 HQ**；若同 ticker 兼 supplier 与 customer，可画 **两条**抛物线（两侧色）或一点双色环——默认 **两条线**。表中左右各列一行。 |
| D12 | 标准制图 | **不立**正式制图规范；临时图规允许好看优先。 |

---

## 任务（总参据此立任务单）

### T1　数据：US HQ + INTL 脚注清单

- 从 `data/nvda-revenue-links.json` 过滤 `country=US`（令时约 **27** peer + NVDA）。  
- 现造 HQ 坐标表（见 D4）；打包进 `data/` allow-list（若有）。  
- INTL（令时约 **21**）仅进脚注文案 / `notes`，不进点集。

### T2　体空间 Shape Two（FE-SCENE + 坐标）

- 在 **s=0**、**x+/y+** 放置 **20×20** 美国地图网格/轮廓。  
- 标 US HQ；近点微隔开（D5）。  
- NVDA→peer **抛物线细管**（D6–D7）。  
- 与 Shape One（切片）切换；切走时不破坏既有选中/过滤状态的合理默认（总参写清）。  
- **CONCEPTS**：新增 **C-SHAPE-2**（或等价 ID）活文案；注明与 C-CUBE / C-REV-LINK 关系。

### T3　映射 `PM-US-MAP`（fe-map 四件套）

- `FE-MAPREG` 注册 `PM-US-MAP`。  
- `FE-MAPPROJ`：纯函数 → PlotSpec（地图 marks + 双列表数据；无色）。  
- `FE-MAPDRAW`：纸面美渲染（上图下表；左 supplier / 右 consumer）。  
- `FE-MAPDOCK`：可预览；导出若已有 PNG 通路则一并可用。  
- 与既有 `PM-LADDER-Q` / `PM-REV-LINK` **不互相覆盖默认**除非用户选了该 mapping。

### T4　美学与壳

- 体空间：地图与抛物线服从体空间层次，勿抢切片主叙事以外的噪声。  
- 映射：纸面皮、好看优先；可调度美工部仅当总参任务单写明「新纸面表面」——默认主代理在现 `plot-paper` 内完成。  
- **SHELL 形式不变**（D9）。

### T5　CONCEPTS / 回归

- 更新 CONCEPTS：C-SHAPE-2、PM-US-MAP、INTL 脚注规则。  
- `regress_all` 快速档仍通；手测 `/cube?ticker=NVDA`：切 Shape Two → 见 20×20 美图与抛物线；Map 出 `PM-US-MAP` 上图下表；INTL 不出现在图上。

---

## 不做

- 不把 INTL 总部画进美国地图（含「境外插针」方案——本令否决）。  
- 不改壳窗/启动器/冷启动品牌动效。  
- 不删 Shape One 切片布局与现有直线 C-REV-LINK。  
- 不立「标准制图」长文。  
- 内阁不改 `Ind-Chain` 产品码。

---

## 模块跟踪展示（令时义务）

真源 `modules/graph.json` · 静态投影 `modules/index.html`（`file://` OK）  
**当时**：**32 模块 / 45 边** · `updated` 2026-10-16  

本令**预期**主改：`FE-SCENE`（Shape Two）、`FE-ACTION`（模式切换）、`FE-COORDONE`（若地图投放走用户坐标）、`BE-NVDA-LINKS` 或旁路 HQ JSON、`FE-MAPREG` / `FE-MAPPROJ` / `FE-MAPDRAW` / `FE-MAPDOCK`（`PM-US-MAP`）。**默认可不改** `modules/graph.json` 拓扑；若 HQ 走新 BE 窄口再增边。

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

1. 意志一句 + 任务单（建议 T1–T5）。  
2. **立刻开做**（业主全权；本令即开工令）。  
3. 实施后送监理部；三监通过则本周期可不再令（内阁窗口另计）。  
4. 回报写明：Shape Two 切换入口、HQ 数据路径、抛物线实现要点、`PM-US-MAP` 预览入口、INTL 脚注文案。
