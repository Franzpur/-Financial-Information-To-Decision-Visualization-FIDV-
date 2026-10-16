# 内阁 → 总参谋部指令

**令号** GS-20261016-MAP-EXPORT-SPHERE  
**日期** 2026-10-16  
**任务周期** 二重映射 / Map 台周期（承接 `GS-20261016-DMAP-UI-PAPER` 已建 dock；本令补 Map 交互 + 非 NVDA 白球）  
**本周期内阁下令计数** **3 / 5**（第 1 次 = `GS-20261016-DMAP-GOOGL-LADDER-Q`；第 2 次 = `GS-20261016-DMAP-UI-PAPER`；本令为第 3 次；业主未指定次数，按默认至多 5 次；谏言不计次）  
**谏言** 不发问（业主已令「按建议默认拍板 · 直接报文」）。  
**来源** 业主 Purkniv：「电内阁，你本身就有指挥权，你直接报文就行」。含义：旁注 `cabinet/notes/20261016-map-export-shell-sphere-taskpack.md` §6 Q1–Q8 **全部按建议默认拍板**，内阁本回合直接落令，不再等逐题答。  
**依据** `cabinet/AUTHORITY.md` · 旁注 `cabinet/notes/20261016-map-export-shell-sphere-taskpack.md` · 前令 `GS-20261016-DMAP-UI-PAPER.md`（Map ▾ / dock / sheet / 纸面皮已立；导出当时「不做」本令打开）· CONCEPTS `C-MAPDOCK` / `C-MAP2` / `C-POINT` / `C-CUBE`  
**父代理动作** 立即将本文**完整**转交 `general-staff`（「报文」/「电总参谋部」）；总参立意志与正式任务单（可修订旁附草稿 `…-tasklist.md`，不得与本令矛盾）；实施由主代理；产品码变更后走日常**程序监理**（有码即三监，不先问轨）。内阁不改 `Ind-Chain`；不令监理部 / 档案部。美工部 / 信息部 **仅建议总参排单时调度**，内阁不直接派。

---

## 意志（一句）

在已落地的 Map 台（`Map ▾` + dock + sheet + 纸面皮）上，补齐 **导出 / 整台收展 / 图拉长 / 窄窗 detail 折叠**；并把 **demo+shell** 公司点改为 **一类坐标单位直径的白球**（去蓝黄环），为 **GOOGL** 挂文件名环与 billboard 冒出页——**chain / NVDA 不动**。

---

## 定夺（业主强制按建议默认；勿再问）

| # | 题 | 拍板（建议默认 A） |
|---|----|-------------------|
| Q1 | 白球范围 | **`demo` + `shell` 全部公司点改白球**；`chain` / NVDA 不动 |
| Q2 | Map 整台收展 | **已打开 dock 时再点 `Map ▾` 面 = 关闭整台**（清 sheet、解除 detail docked）；未打开则出菜单 |
| Q3 | 导出首版 | **PNG**（纸面根节点 `.pm-sheet.pm-skin-paper` 栅格化）；脱敏门不做 |
| Q4 | 图拉长 | **预览与 sheet 可拖改高度**（宽随容器），保持可读最小宽；不改 PlotSpec 语义 |
| Q5 | GOOGL 文件源 | **文件名含 `googl`（大小写不敏感）的允许列表**；初值用旁注 §4 五行；公开包可不含 gitignored `debt-ladder-googl.json` |
| Q6 | 冒出页内容 | **仅当前选中文件名 + 短相对路径**；轮转只改高亮；不自动打开 Excel / 不 Open in Map |
| Q7 | 窄窗 | **保留 ≤980 底抽屉**，**修好** detail 折叠与叠层 |
| Q8 | 本周期范围 | **A0–A3 + B0–B2（B2 最小硬编码）同一报文** |

**执行序**：先 A 后 B 可并行（两线弱依赖；勿同文件大战时分 PR）。A 线 `A0→A1→A2→A3`；B 线 `B0→B2→B1`。合并点：`cube.html` / `ui.js` 操作行与 CONCEPTS。

---

## 指令正文（须完整执行；任务单逐条可勾）

### A0 · 窄窗 / detail 折叠修复（P0）

- 复现 ≤980 与中等宽度：dock 开时 `#detailPanel` 必 `is-folded` 且可点开；关 dock 时 detail 复位。
- 避免 map「沉底」与 detail 叠穿。
- 改动面：`FE-MAPDOCK` / `FE-PANEL` / `app.css`；自检 `selfcheck-map.html` + 真机缩窗。
- **不做**：取消底抽屉改侧栏（Q7≠B）。

### A1 · Map 整台收展（P0；可与 A0 并行）

- `Map ▾`：无打开映射时仍出菜单；**已打开 dock 时再点 Map 面 = 关闭整台**（清 sheet、解除 detail docked）。
- Esc 梯已含 sheet 的，再明确「关 dock」。
- CONCEPTS `C-MAPDOCK` 补一句整台开关语义。

### A2 · 图拉长（纵横比）（P1）

- dock 预览与 sheet：高度可调（拖柄或 ±），宽随容器；`drawPlot` density 外加容器级 `aspect`/高度 CSS；默认起点保持现纸面比例。
- **不改** PlotSpec 语义。
- **建议总参排单时调度美工部**：仅 `plot-paper.css` / density 尺度统一（内阁不派）。

### A3 · 导出键（P1）

- dock/sheet 操作行加 **Export**（或等价）；导出当前纸面根节点为 **PNG**。
- 浏览器 loopback 先 `Blob` 下载；壳内 WKWebView 下载通道 **单列后续**，本令不做。
- 脱敏门 / PDF / SVG **不做**（CONCEPTS 可写「PNG only, no redaction」）。
- 模块图：可能新增 **`FE-MAPOUT`**（导出门），`FE-MAPDOCK → FE-MAPOUT`（calls）；须进 `modules/graph.json` 并重烘。总参写死最终模块/边数。

### B0 · 非 NVDA 白球（P1）

- `meta.mode !== 'chain'`（即 **demo + shell**）：C-POINT → **白色球**，世界直径 = **1×UNIT**（一类坐标单位长度）；去掉 US/INTL 色环边。
- **`chain` / NVDA 保持现盘+环+边。**
- 改动面：`FE-SCENE` / `coords` 常量；更新 CONCEPTS `C-POINT`。
- 与 A 线弱依赖；同文件冲突时分 PR。

### B2 · GOOGL 文件清单窄口（P2；先于或并行 B1 数据侧）

- 允许列表：文件名含 `googl`；初值硬编码旁注 §4：
  ```
  BE-DATA/ICBC C/928/googl_bond_full.xlsx
  BE-DATA/ICBC C/928/googl_fa_bs.xlsx
  BE-DATA/ICBC C/928/googl_top20 comsumer.xlsx
  BE-DATA/ICBC C/928/googl_top20 supplier.xlsx
  Ind-Chain/data/debt-ladder-googl.json
  ```
- 公开包体：**可不含** gitignored 的 `debt-ladder-googl.json`。
- 交付：`GET` 或烘焙 JSON；**忌任意路径遍历**。
- **建议总参排单时调度信息部** desk=manage 立真源（内阁不派）；本令 B2 最小硬编码即可先通 B1。

### B1 · GOOGL 文件环 UI（P2；依赖 B0 + B2）

- 悬停 **GOOGL** 白球：列出 googl 文件名；点击环状轮转；到底回第一个。
- 冒出页：仅 **文件名 + 短相对路径**；CSS/Three 平面 **billboard**（随视野转）；**球本身不 billboard**。
- 不自动打开 Excel；不「Open in Map」。

---

## 与前令的关系

| 前令（UI-PAPER） | 本令 |
|-----------------|------|
| E6「不做导出」 | **打开**：A3 PNG only |
| E1 窄屏底抽屉 | **保留**并修缺陷（A0） |
| E1 `Map ▾` 开菜单 | **扩展**为整台开关（A1） |
| 纸面根 `.pm-sheet.pm-skin-paper` | **沿用**为导出与拉长目标 |
| 公司点 / C-POINT | **本令新增** B0–B1；chain 不动 |
| 合规 1–7、不重建根 `.app`、断网可用 | **全部保留** |

---

## 不做（本令）

1. 脱敏闸、SVG/PDF 导出、壳 WKWebView 专用下载通道  
2. 取消 ≤980 底抽屉改侧栏  
3. GOOGL 冒出页预览 / Open in Map / 打开 Excel  
4. 正式标签表（信息部建议后续）；任意磁盘遍历  
5. 改 `chain` / NVDA 点形与环边  
6. 图↔立方体联动、`FE-MAPIN`、`BE-MAPNL`  
7. 重建根 `.app`；内阁不令监理部 / 档案部  

---

## 建议总参排单时调度（内阁不直接派）

| 部 | 何时 | 范围 |
|----|------|------|
| **美工部** | A2 / A3 纸面尺度或导出预览需统一皮面时 | `plot-paper.css` / density；Export 钮与操作行沿现玻璃皮，不引入新色相 |
| **信息部** desk=manage | B2 要从硬编码升真源时 | googl 文件名允许列表真源；公开包是否列 gitignored json |

参谋纪要官 / 交叉整合部：不调度。

---

## 验收（硬）

**VA** ≤980：dock 开 → detail folded 可点开；关 dock → detail 复位；无叠穿。  
**VB** 已开 dock 再点 `Map ▾` → 整台关（sheet 清、docked 解除）；未开 → 菜单。  
**VC** 预览/sheet 可拖高；默认比例可读。  
**VD** Export → 下载 PNG；内容为纸面根，不含 dock 外壳 chrome。  
**VE** `/cube` demo 与 `?ticker=` shell：公司点为白球直径 UNIT、无蓝黄环；chain/NVDA 外观与改前一致。  
**VF** GOOGL 悬停出文件名列表；点击轮转；冒出页 billboard、球不转；页上仅文件名+短路径。  
**VG** `regress_all.sh quick` 通过；`selfcheck-map.html` 相关项绿；模块图重烘后总参写定的 N 模块 / M 边，0 交叉 / 0 穿框。  
**VH** 合规前令条款不退化；烘焙敏感 JSON 不入公开仓。

---

## 完成后的对话流（父代理）

1. 实施完成 → 送监理部程序监理（内阁不令；有码即审，不先问轨）。  
2. 三监交回 → 对话栏一句 → **内阁窗口**（本周期剩余 2 次）。  
3. 书记最后派一次。

---

## 模块跟踪展示（`AUTHORITY.md` 义务；下令时据 `modules/graph.json`）

**真源** `modules/graph.json` · **updated** 2026-10-16 · **31 模块 / 44 边** · 静态页 `modules/index.html`

| 区（意） | id |
|----------|-----|
| 决策路径 FE | `FE-NAV` `FE-BOARD` `FE-LIST` `FE-LISTAREA` `FE-OPENCUBE` |
| 立方体面 FE | `FE-ACTION` `FE-COORDONE` `FE-SCENE` `FE-PANEL` `FE-FOCUS` `FE-AESTHETIC` |
| 接口 | `FE-API` |
| 平面映射 FE | `FE-MAPPROJ` `FE-MAPDRAW` `FE-MAPREG` `FE-MAPDOCK` |
| 应用壳 | `SHELL-WINDOW` `SHELL-PROC` `SHELL-PACK` |
| 后端 | `BE-HTTP` `BE-BUNDLE` `BE-DB-DEMO` `BE-DB-SHADOW` `BE-NVDA-LAYOUT` `BE-NVDA-LINKS` `BE-DEBT` `BE-BICS-HIER` `BE-BICS-ENTITY` `BE-BICS-AREA` `BE-BICS-INGEST` |
| 跟踪 | `MODULES-TRACK` |

本令可能增量（总参确认后写死）：`FE-MAPOUT` ← `FE-MAPDOCK` calls；可选 `BE-MAPFILES` 或扩 `BE-HTTP` 读 googl 清单。未改 JSON 前仍为 **31 / 44**。
