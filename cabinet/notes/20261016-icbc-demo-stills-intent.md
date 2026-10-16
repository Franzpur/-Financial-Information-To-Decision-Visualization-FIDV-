# ICBC CUP 计划书 · GOOGL / NVDA 演示静帧素材（旁注）

**日期** 2026-10-16  
**业主** Purkniv  
**执行** 内阁  
**令号** `GS-20261016-ICBC-DEMO-STILLS`  
**产品** Ind-Chain · `http://127.0.0.1:8787`  
**授权** 业主点名「电内阁」并授「便宜行事、勿请示」；明言除令总参外与秘书通力合作；截图与成包勿再请示。

---

## 正式意图（一句）

为工行杯（ICBC CUP）计划书积累**美观、可引用**的演示静帧：对 **GOOGL**（shell 文件环 / 悬停卡 / map）与 **NVDA**（chain 三色球 + 收入线 + 关系纸面）各截若干镜，附短功能介绍，由父代理实截、秘书收成可进计划书的素材包。

---

## 边界

| 项 | 裁定 |
|----|------|
| 产品码 | **勿改**（除非截图必需的极小修；须在回报注明） |
| 谏言 | **不发问**（便宜行事已授） |
| 内阁落盘 | 生图与 staging 只进 `cabinet/` |
| 计划书成稿 / 展页 | 秘书按 `clerk-showable-report` 写入 `library/showable-report/`（业主目标明示可走该库） |
| 调度 | 内阁令总参；**不**直派档案部。秘书合作由**父代理**调度 clerk，令文规定规格与交接口 |
| 既有证据图 | `cabinet/notes/googl-hover-evidence/` 可复用为参考，**不**顶替本轮美观静帧 |

---

## 素材镜清单（正式）

命名约定：`{ticker}-{nn}-{slug}.png`，视口尽量全页、无无关 IDE/桌面；优先暗底产品面。

### A · GOOGL（shell · `/cube?ticker=GOOGL`）

| ID | 文件名建议 | 镜意 | 附文案要点（秘书用，≤40 字） |
|----|------------|------|------------------------------|
| G01 | `GOOGL-01-panorama.png` | 全景：白球 + 坐标架 + 名牌，构图干净 | 壳模式：单主体落在立方体决策场 |
| G02 | `GOOGL-02-hover-filecard.png` | 悬停球：暗玻璃「GOOGL files」卡 + 折线引线 | 悬停读出关联文件环，不离开场景 |
| G03 | `GOOGL-03-selected-label.png` | 选中、无悬停：名牌清晰，文件卡收起 | 选中与悬停分工：钉住主体 / 展开文件 |
| G04 | `GOOGL-04-map-ladder.png` | Map dock 开：季度债务梯（或当前 GOOGL map 主纸面） | Map 台把偿债压力落到纸面制图 |
| G05 | `GOOGL-05-map-export-or-chrome.png` | Map 导出壳或 dock 控件一镜（若 G04 已够美可降为备选） | 纸面可导出，对接汇报叙事 |

### B · NVDA（chain · `/cube?ticker=NVDA`）

| ID | 文件名建议 | 镜意 | 附文案要点（秘书用，≤40 字） |
|----|------------|------|------------------------------|
| N01 | `NVDA-01-panorama-spheres.png` | 全景：中心白球 + 供绿 / 消红小球 + 切片墙 | 链模式：三色球标出供消角色 |
| N02 | `NVDA-02-links-overview.png` | 收入线满景（加粗可辨、未强悬停） | 点对点收入线把关系画进立方体 |
| N03 | `NVDA-03-link-hover-card.png` | 悬停一线：来源路径卡（xlsx 路径字符串） | 悬停披露边数据来源路径（展示用） |
| N04 | `NVDA-04-link-selected-map.png` | 选中线 + Map **PM-REV-LINK** 双方关系纸面 | 选线即出关系纸面，供消同屏 |
| N05 | `NVDA-05-peer-focus.png` | 悬停或近景一颗 peer 球 + 名牌（构图点题） | 名牌与壳对齐，角色色一眼可读 |

### C · 跨主体对照（可选，时间够再截）

| ID | 文件名建议 | 镜意 | 附文案要点 |
|----|------------|------|------------|
| X01 | `PAIR-01-shell-vs-chain.png` | 左右或上下拼：GOOGL 壳全景 vs NVDA 链全景（可后期拼，非必浏览器一镜） | 同一立方体，两种叙事模板 |

**最低交付**：G01–G04、N01–N04（8 镜）。G05 / N05 / X01 为加分。

---

## 目录建议

| 角色 | 路径 |
|------|------|
| 生图 staging（父代理落盘） | `cabinet/notes/icbc-demo-stills/raw/` |
| 裁切 / 标注工作区（可选） | `cabinet/notes/icbc-demo-stills/work/` |
| 镜表真源（本文件） | `cabinet/notes/20261016-icbc-demo-stills-intent.md` |
| 令文 | `cabinet/orders/GS-20261016-ICBC-DEMO-STILLS.md` |
| 秘书成包（HTML 展页或 briefing 附件） | `library/showable-report/SFC-icbc-cup-demo-stills/`（图）+ `library/showable-report/SFC-icbc-cup-demo-stills.html`（展页；文件名秘书可微调，须在回报写清） |
| 回流计划书 | 既有 `library/showable-report/SFC-icbc-fintech-proposal.html` / `SFC-icbc-cup-plan.html` 由后续令或秘书另开页插入；**本令不强制改计划书正文** |

---

## 开截裁决

**立刻开截。** 服务已指向 `http://127.0.0.1:8787`；父代理用浏览器实截，勿等业主回岗。
