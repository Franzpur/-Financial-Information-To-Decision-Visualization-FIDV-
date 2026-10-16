# 内阁 → 总参谋部指令（演示静帧 · 与秘书交接口）

**令号** GS-20261016-ICBC-DEMO-STILLS  
**日期** 2026-10-16  
**本周期内阁下令计数** **第 1 次 / 至多 5**（新周期：ICBC CUP 计划书 · GOOGL/NVDA 美观演示静帧；与产品改码周期 `NVDA-SPHERE-LINK` / `GOOGL-HOVER-*` 分立。业主授便宜行事。谏言不计次）  
**本期** **截取 GOOGL + NVDA 演示美观静帧，附短功能介绍，收成可进工行杯计划书的素材包**  
**交** **总参谋部**（父代理将本文**完整**转交 `general-staff` 立意志与任务单；**实截由父代理浏览器执行**；产品码默认不改）  
**秘书** **不通令档案部**。父代理须**另调度** `clerk`（秘书），按本令「交接口」与镜表，把图 + 短功能介绍收成 `library/showable-report/` 下可进计划书的素材包（HTML 展页或 briefing 附件目录；纸面依 `clerk-showable-report`）  
**来源** 业主 Purkniv：「为 googl 和 ndva（NVDA）两个演示截一些美观的图，有一些附上功能介绍，来为 icbc cup 的计划书积累素材……与秘书通力合作……便宜行事、勿请示」  
**依据** `cabinet/AUTHORITY.md` · 旁注 `cabinet/notes/20261016-icbc-demo-stills-intent.md` · `.cursor/skills/clerk-showable-report/SKILL.md`

---

## 谏言

**不发问。** 业主已授便宜行事、勿请示。

---

## 意志（一句）

**立刻为 GOOGL shell 与 NVDA chain 实截最低 8 镜美观静帧，落盘 cabinet staging，再由父代理调度秘书收成计划书可用素材包；默认不改产品码。**

---

## 任务

### T1　总参立单（短）

- 意志一句；任务对齐本令 T2–T4。  
- **不做**产品功能开发（除非截图阻塞且修面积极小——须书面说明）。  
- 不调度监理部、不派书记（由父代理按仓规在周期末处理）。

### T2　父代理实截（主责）

| 项 | 拍板 |
|----|------|
| 基址 | `http://127.0.0.1:8787` |
| GOOGL | `/cube?ticker=GOOGL` |
| NVDA | `/cube?ticker=NVDA` |
| 落盘 | `cabinet/notes/icbc-demo-stills/raw/`（缺目录则建） |
| 镜表 | 旁注正式表；**最低** G01–G04、N01–N04 |
| 质量 | 全页产品 UI；避免 IDE/桌面杂边；悬停态须真悬停后再截；map 须 dock 可见纸面 |
| 复用 | `cabinet/notes/googl-hover-evidence/` 仅作取景参考，不充本轮交付 |

### T3　父代理调度秘书（通力合作）

秘书（clerk）在生图齐套后（或边截边收，但成包以齐套为准）：

1. 读旁注镜表与各镜「附文案要点」。  
2. 按 clerk-showable-report 纸面 token，做**素材展页或 briefing 附件包**（非强制改计划书六章正文）。  
3. 建议产出：  
   - `library/showable-report/SFC-icbc-cup-demo-stills.html`  
   - 图目录 `library/showable-report/SFC-icbc-cup-demo-stills/`（从 raw 复制或链入，秘书定）  
4. 每镜：图 + 标题 + ≤40 字功能介绍；封面一句说明用途「ICBC CUP 计划书素材」。  
5. 内阁**不**写入 `library/`；秘书写入后路径回报父代理即可。

### T4　回报

父代理汇总回内阁窗口（或工作区可见处）：

1. 已截文件列表（相对路径）。  
2. 缺镜 / 失败镜（若有）与是否需极小修码。  
3. 秘书成包路径。  
4. **是否可插入**既有 `SFC-icbc-fintech-proposal` / `SFC-icbc-cup-plan`（建议：本令只积累素材；插入正文另令或下轮）。

---

## 不做

- 不改 `DESIGN.md`、不扩 scope 做新功能。  
- 不把应用图标 / 启动器图标当素材。  
- 内阁不直派书记、不指挥监理部、不亲自截浏览器、不写产品码。  
- 不在本令周期强改计划书 PDF（除非业主另呼）。

---

## 模块跟踪展示（令时义务）

真源 `modules/graph.json` · 静态投影 `modules/index.html`  
本令**预期不改**模块拓扑；截图触及只读：`FE-SCENE`、`FE-PANEL`、`FE-MAPDOCK`、`FE-FOCUS`（GOOGL/NVDA 既有面）。

### 模块清单（当时）

以仓内 `modules/graph.json` 为准；本令为素材工程，不强制改 `updated`。

### 关系简图

```
FE-OPENCUBE → FE-SCENE / FE-PANEL / FE-FOCUS
FE-PANEL → FE-MAPDOCK → {FE-MAPREG, FE-MAPDRAW, FE-MAPOUT}
NVDA: FE-SCENE ← BE-NVDA-LINKS（只读演示）
GOOGL: FE-SCENE 文件环 / 悬停卡（只读演示）
```

---

## 交回期望（致父代理 · 摘要）

| 项 | 内容 |
|----|------|
| 素材镜列表 | 见旁注；最低 8 镜 G01–G04 + N01–N04 |
| 输出目录 | raw → `cabinet/notes/icbc-demo-stills/raw/`；成包 → `library/showable-report/SFC-icbc-cup-demo-stills*` |
| 是否立刻开截 | **是 · 立刻开截** |
| 下一步 | ① 转交总参立短单 ② 浏览器实截 ③ 调度秘书成包 |
