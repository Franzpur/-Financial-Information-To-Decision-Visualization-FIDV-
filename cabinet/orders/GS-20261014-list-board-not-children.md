# 内阁 → 总参谋部指令

**令号** GS-20261014-LIST-BOARD  
**日期** 2026-10-14  
**任务周期** 新周期（名单接口勿再借用闸门的下级整板）  
**本周期内阁下令计数** **1 / 5 · 已结**（本令为该周期第 1 次；三监第 1 次送审通过后内阁判定满意，**不再令**；余 4 次作废；谏言不计次；上一 W1 周期已结，不计入本周期）  
**来源** 业主 Purkniv 原话「电内阁，在保证前端负责交互，后端负责数据存储的基础上，你觉得这个调用有没有麻烦，重复，膈应人的地方，尝试优化之。」  
**依据** `cabinet/AUTHORITY.md` · W1 打开权（浏览器只认 HTTP JSON / 静态；库与链文档只在服务端）· 既有令 `cabinet/orders/GS-20261014-modularization-M1-M4.md`、`cabinet/orders/GS-20261014-W1-modules-track.md`（均已结，勿空转重做）  
**父代理动作** 将本文**完整**转交 `general-staff`，立意志与任务单；实施由主代理；产品码变更后按既有规则送监理部。内阁不亲自改 `ind-chain`；不令监理部 / 档案部。

---

## 意志（一句）

名单接口在组 L4 公司行之前，借用了闸门的「下级整板」函数，把每个 L5 的公司数都数了一遍再扔掉。改成只数这一级自己的上市地面分布，祖先链照旧。不新开路由，不改前端热路径，不重做 M1–M4。

---

## 定夺（已拍板，勿再问业主）

1. **本周期只做这一处**：`list_bics_entities` 不得再调用 `bics_children`。闸门 `/api/bics/children` 仍要下级公司数，函数本体留给闸门。
2. **明确不做**（内阁已判断为留着，勿顺手优化）：
   - 不合并闸门与名单对同一上市地面的各一次请求。两页、两级前缀，各拉一次是对的。
   - 不抽取 `home.js` / `list.js` 里重复的站内链接查询串。HTTP 查询串已在 `api.js` 收口。
   - 不删除响应里的 `listingCountry` 回声字段。前端不读它，删了不减少调用。
   - 不删除未使用的 `searchCompanies`，不删除立方体 `resolveBicsLabel`（名单进立方体的热路径不带 `?bics=`，不会双调）。
   - 不拆进程，不开 M5，不把 FE/BE 再物理拆细，不空转重做 M1–M4。
3. **图已由内阁自落，总参勿改 `modules/`。** 三条跨侧合约边（`FE-GATE→BE-BICS-HIER`、`FE-LIST→BE-ENTITY`、`FE-CUBE-BOOT→BE-BUNDLE`）已从 `modules/graph.json` 去掉并重新烘焙 `modules/index.html`。它们与 `FE-* → FE-API → BE-HTTP` 重复，读起来像浏览器直接打开库模块。跨侧数据契约只剩 `FE-API→BE-HTTP`，另保留 `BE-HTTP→MODULES-TRACK` 窄口。
4. **不发问。** 业主已令尝试优化。总参勿就「要不要做更细拆分 / 要不要顺手清死代码」回问业主。

---

## 指令正文（须完整执行）

### 问题（写死）

`ind-chain/server/app.py` 的 `list_bics_entities` 调用 `bics_children(code, loc)`。该函数对父节点的**每一个下级**各跑一遍 `_count_pack`，再对父节点自己跑一遍。层级 JSON（`class-3-coords/BICS-Classification/bics-equity-hierarchy-2024.json`）里 227 个 L4 中有 176 个带下级，合计 697 个 L5。名单响应只用祖先、`totalCount`、`listingCountries`、`unmappedCount`；下级数组与下级 `companyCount` 全部丢弃。公司行另由 `_entities_for_primary_l4` 取出。这是同一次 HTTP 里的重复计算，不是前端双请求。

### 改法

- `GET /api/bics/entities` 仍**一次**返回名单页正在读的字段：`node`、`ancestors`、`entities`、`count`、`totalCount`、`listingCountries`、`unmappedCount`，以及现有的 `listingCountry` 回声（本令不删）。
- **祖先**：沿现有层级索引向上走。不得借走祖先之机把每个下级再数一遍。
- **上市地面分布与 `totalCount`**：对该 L4 前缀只调用一次现有计数（`_count_pack` 或与之等价的一趟）。不得按 L5 再数。
- **公司行**：仍走现有 `_entities_for_primary_l4`。不要把计数与公司行合成一套新算法；优先就是「别调用 `bics_children`」。
- **不新增** HTTP 路径。消费字段不变，则**不改** `ind-chain/web/js`。
- `/api/bics/children` 行为不变：闸门格子上的 `companyCount` 仍在。
- W1 照旧：响应里不得出现库文件路径，浏览器仍只认 HTTP JSON / 静态。

### 验收（可检）

1. 代码上 `list_bics_entities` **不再调用** `bics_children`。
2. 打开一个有 L5 的 L4：`/list?bics=10101010`（Advertising & Marketing，2 个下级）。公司行、面包屑祖先、上市地面筹码与改前一致（同一库、同一过滤）。
3. 换上市地面过滤，例如 `/list?bics=10101010&listingCountry=US`：仍是**一次**请求；行是过滤后的；筹码上的各国计数仍是该类的全量分布（与今日语义相同，不是只剩被过滤的一国）。
4. 闸门 `/` 与下钻 L2/L3：格子人数仍在，不回归。
5. 无新路由。若必须改前端才能保住上述字段，本令未完成，收窄回去，不要扩成前后端重接。

### 不做（本令内）

- 不把闸门的 children 响应缓存给名单页复用。
- 不合并 `home.js` / `list.js` 的 `gateHref` / `listHref`。
- 不删除 `listingCountry` 回声、`searchCompanies`、立方体 `resolveBicsLabel`。
- 不改 `modules/graph.json` 与 `modules/index.html`（内阁已改）。
- 不重做 M1–M4，不开 M5，不拆进程，不更细拆 FE/BE 目录。
