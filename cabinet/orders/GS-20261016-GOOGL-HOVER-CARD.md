# 内阁 → 总参谋部指令

**令号** GS-20261016-GOOGL-HOVER-CARD  
**日期** 2026-10-16  
**本周期内阁下令计数** **第 4 次 / 至多 5**（沿 Map 周期：第 1 次 `DMAP-GOOGL-LADDER-Q`、第 2 次 `DMAP-UI-PAPER`、第 3 次 `MAP-EXPORT-SPHERE`；本令是该令 B1「GOOGL 文件环 UI」的返工，故沿同周期计数；业主未另指定次数。谏言不计次）  
**本期** **GOOGL 悬停文件卡：球心伸出 5 单位折线引线 + 卡面改 cube 暗底亮线框**  
**交** **总参谋部**（父代理须将本文**完整**转交 `general-staff` 立意志与任务单；产品码由主代理实施；实施后按既有规则送监理部，内阁不令监理部；内阁不改产品码）  
**来源** 业主 Purkniv 原话：「电内阁，这个悬停列表应当由球心伸出一个长约5单位的折线与之连接，另外，这个列表应当遵循cube审美而不是平面映射审美，保持暗色调和亮线框。」附截图：暗底上 GOOGL 白球上方浮一块**浅灰米色**文件列表（标题 `GOOGL files`、多行文件名 + 路径），球心到列表只有一条**竖直细线**，无折线。  
**依据** `cabinet/AUTHORITY.md` · `GS-20261016-MAP-EXPORT-SPHERE`（B1/B2、Q5）· `agent_tasklist/AESTHETIC.md` §1 色板 / §2 延展原则 / C-SKIN-PAPER 边界 · `Ind-Chain/CONCEPTS.md` C-POINT、C-REV-LINK

---

## 谏言

**不发问。** 业主意志清楚：两处视觉返工，不碰数据、行为、模块。

---

## 现状（内阁读码所见；总参可抽检，勿凭空重查）

文件 `Ind-Chain/web/js/scene.js`（`main.js` 以 `?v=74` 引入；`ui.js` 以 `?v=72` 引入常量 `STDVIEW_MS`）：

| 位置 | 内容 |
|------|------|
| L1113 `makeGooglCardTexture(entries, activeIndex, listAll)` | 画布 512 宽；底 `rgba(247,245,240,0.96)`、描边 `rgba(26,31,38,0.35)`、字 `#1a1f26` / `#4a5560`、活动行底 `rgba(26,31,38,0.08)`——**这是 `plot-paper.css` 的纸面五档色**（`#f7f5f0` / `#1a1f26` / `#4a5560`），被误挪进了 3D 场景。这就是业主看到的「平面映射审美」 |
| L1154 `ensureGooglFileCard(ctx)` | 一个 `PlaneGeometry(1,1)` + `MeshBasicMaterial`（`depthTest:false`，`renderOrder=30`），挂 `ctx.root` |
| L1174 `updateGooglFileCard(ctx, faceQuat, parentQuat)` | `usesWhiteSpheres()` 门控；`hover` 为 GOOGL 则 `listAll=true` 列全部，否则（仅选中）只列活动一行；卡宽 `max(2.4, UNIT·6)`；位置 = 球心 `wp.y += r·1.6 + 卡高·0.55`（即**球正上方紧贴**）；`faceQuat` 取相机朝向，卡 billboard |
| L156 `tick()` | 每帧调 `updateGooglFileCard(ctx, faceQuat, parentQuat)` |
| L1090–1096 `selectCompany` | GOOGL 白球点击 `state.googlFileIndex = (i+1) % n`，`ctx.googlCardDirty = true` |
| `map/googlFiles.js` | `googlFileEntries()` 五条允许列表（含 `debt-ladder-googl.json`）；`isGooglTicker` |

**截图里的「竖直细线」不在 `updateGooglFileCard` 里**：该函数没有画线。总参须让主代理先查明那条线的来源（候选：`ctx.googlCard` 之外的 hover 指示、`ensure*` 之外另一处 `LineBasicMaterial`、或卡与球几何的视觉错觉），**查明后移除或并入本令的引线**，不得与新引线并存。若实为不存在、只是截图中卡面上缘与球相切的视觉感，则在回报里如实写明。

---

## 意志（一句）

**悬停 GOOGL 白球，从球心伸出一条总长 5 个一类坐标单位（5 UNIT）的折线，折线末端接住一块「cube 暗底玻璃 + 亮线框」的文件卡；卡面绝不再带纸面皮；列表内容与点击轮转一概不变。**

---

## 任务（总参据此立任务单）

### T1　折线引线（leader polyline）

| 项 | 拍板默认 |
|----|----------|
| 长度 | **总长 5 UNIT，自球心量起**（`UNIT` 即 C-AXIS 的 1 个坐标单位 = 白球直径；球半径 0.5 UNIT，球体遮住的 0.5 UNIT 仍计入）。**悬停放大（约 1.5×）时长度不变**，起点永远是球心 |
| 形状 | **两段、一个拐点**，拐点圆整为 **45°**（与 AESTHETIC「内拐角 45° 过渡」同族，不用直角圆弧） |
| 第一段 | 自球心沿 **根局部 +y（C-AXIS-Y 向上）** 伸 **3.0 UNIT** 到拐点。理由：卡原本就在球上方，沿 +y 与用户坐标一致，且不与 C-REV-LINK 在 s/x 方向的连线混淆 |
| 第二段 | 自拐点沿**相机屏幕平面内的 45° 方向（右上）** 伸 **2.0 UNIT** 到终点。取屏幕平面而非世界轴：卡是 billboard，引线末端必须稳稳落在卡的角上，不因 orbit 转动而穿卡 |
| 折向镜像 | 默认**向右**；若球心投影后 NDC x > **0.40**，改**向左**（镜像）；设 ±0.05 滞回，防止在阈值上抖动。理由：球靠右时卡会被挤出视口 |
| 终点与卡的锚法 | 卡的**近角**对齐终点：向右折则卡**左下角**落终点，向左折则卡**右下角**落终点；卡因此整体在引线终点的上方外侧，不压住引线、不压住球 |
| 笔 | `THREE.Line`（`LineBasicMaterial`），色 **`#e8edf4`（`--text` 同值）**，`opacity 0.9`，`depthTest:false`，`depthWrite:false`，`renderOrder 29`（卡 30 之下、球之上）；`linewidth` 多数 WebGL 不生效，**不做双线加粗**，保持 1px 细线以呼应亮线框。**可选**：拐点处无装饰；终点无箭头、无圆点（简洁第一） |
| 生命周期 | 与卡同显同隐：`mesh.visible` 为假时引线也隐；仅「选中而非悬停」（`listAll=false`）时**同样画引线**（卡还在，线就在）。每帧随球心 / 相机更新顶点；几何与材质 `dispose` 在场景销毁时同卡一并清 |
| 范围 | 只 `usesWhiteSpheres()`（demo / shell）为真时；**chain / NVDA 一律不画**（沿 `GS-20261016-MAP-EXPORT-SPHERE` 红线） |
| 单位来源 | 全部用 `UNIT`（`FACE/10`），**不写死米数**；`r = host.userData.basePointR || UNIT/2` 已有，勿另造 |

### T2　文件卡改 cube 审美（暗底 + 亮线框）

**只改 `makeGooglCardTexture`（画布绘制）与卡材质；不改卡的数据、行序、文案。** 全部色值取自 AESTHETIC §1 色板，**不引入新 token**：

| 面 | 值（canvas 用字面色，值与 token 一致） | 来源 token |
|----|----------------------------------------|------------|
| 卡底 | `rgba(11, 13, 16, 0.55)` | `--glass-strong` |
| 外框 | **1 逻辑像素亮线框**，色 `#e8edf4`，`globalAlpha 0.9`；**直角，无圆角**；框线贴画布外缘内 0.5px 防裁切 | `--text` |
| 标题 `GOOGL files` / `GOOGL` | `#e8edf4`，600 粗，sans | `--text` |
| 标题下细线 | `#8be0c0`，1px，`opacity 0.55`，宽 = 标题文字宽 | `--accent`（与字标 accent 线同语气） |
| 行：文件名（活动） | `#e8edf4`，mono 14px | `--text` |
| 行：文件名（非活动） | `#9aa6b5` | `--muted` |
| 行：短路径 | `#9aa6b5`，11px sans | `--muted` |
| 活动行标记 | 行左一条 **2px 竖条** `#8be0c0`，行底 `rgba(232,237,244,0.08)` | `--accent` / `--text` 低透明 |
| 行间分隔 | 无（简洁）；若主代理觉得难读，仅可加 1px `#2a313c`（`--stroke`） | `--stroke` |

- **整张卡禁止**：`#f7f5f0`、`#1a1f26`、`#4a5560`、`#c5ccd4`、`#efeae4`、`#ece8e0`（plot-paper 六档）及 `rgba(247,`、`rgba(26, 31`；禁渐变、禁 glow / 阴影、禁圆角、禁 `--us` / `--intl` 色（荧光青 / 琥珀留给数据语义）。
- **清晰度**：画布按 **2× 设备像素**绘制（逻辑 512 宽，画布 1024 宽；`aspect` 仍按逻辑比），线框与小字在放大观察下不糊；`tex.generateMipmaps` 开、`minFilter = LinearMipmapLinear`，`anisotropy` 取渲染器上限的一半即可。
- **可读性底线**：暗底 `0.55` 在亮线与多层切片背景上若字色发灰，**允许把卡底 alpha 提到不超过 `0.72`**（canvas 专用，不新增 CSS token；改了须在回报里写明实测理由）。除此之外不得再改色板。
- **尺寸**：沿用 `w = max(2.4, UNIT·6)`；卡高随行数。引线终点锚点按 T1。

### T3　既有行为不丢（逐项保）

1. **悬停仍列全部 googl 文件**：`listAll = Boolean(hover && isGooglTicker(hover.ticker))`；五条里 `debt-ladder-googl.json` 在公开包缺失时仍如现状（不新增服务端探测）。
2. **点击推进文件环**：`selectCompany` 内 `state.googlFileIndex = (i+1) % n`、`ctx.googlCardDirty = true` **一字不动**；到底回第一个；活动行高亮随之移动。
3. **选中而非悬停**时只列活动一行（`listAll=false`），保持。
4. **卡 billboard、球不 billboard**（C-POINT）；球仍是白球、1 UNIT 直径、悬停约 1.5×。
5. **卡不可拾取**：卡和引线都不进射线拾取集（不改 `pick` 逻辑）；鼠标移到卡上视为离开球，卡随之消失——这是**既有**行为，本令不改（因卡现在离球更远，须在回报写一句「悬停必须停在球上才有卡」，供业主知悉；若业主要求卡可停留，另令）。
6. **缓存键** `${listAll}:${idx}:${entries.length}` 不变；引线每帧更新，不进缓存键。
7. 其它公司（非 GOOGL）一切不变。

### T4　边界与顺手事项

- **改动文件限定**：`Ind-Chain/web/js/scene.js`（主体）；若需新常量（引线长 / 折角 / 阈值）**写在 `scene.js` 内的 GOOGL 卡局部常量区**，不进 `state.js` 的 `COLORS`（色已取现有 token 值，不新增色名）。如必须动他文件，先停下回报。
- **不动**：`web/js/map/*`、`plot-paper.css`（纸面皮保留给导出图预览，与场景浮层互不渗透）、`app.css`、`modules/graph.json`（模块 / 边不增减；以 `modules/graph.json` 当前为准，今为 **32 / 45**）、`DESIGN.md`、`AESTHETIC.md` token。
- **缓存破坏**：改 `scene.js` 后，把 `main.js` 与 `ui.js` 对 `scene.js` 的 `?v=` 引入**同步升到同一个新值**（现 74 / 72 不一致，借此对齐为 **75**）；`googlFiles.js?v=2` 不动（本令不改它）。
- **文档回写（实施时一并做，产品文档属主代理）**：
  - `Ind-Chain/CONCEPTS.md` C-POINT 行（L34）把「the emerging page is billboard, the ball is not」补为：*「…emerging page is billboard; a two-segment leader polyline of total length 5 UNIT (3 UNIT up +y, then 2 UNIT at 45° in the screen plane, mirrored left when the ball is in the right of the view) runs from the ball centre to the page's near corner; the page uses the cube dark glass + bright wire frame (no paper skin).」* 并补中文一句；页脚 `Last updated` 改当日。
  - `Ind-Chain/web/css`、`index.html` 等**不需改**。

---

## 触达 AESTHETIC.md？——**否（不改 token，不改美学规则）；但须记一条**

内阁拍板：这是对**既有 cube chrome token 的复用**（`--glass-strong` / `--text` / `--muted` / `--accent` / `--stroke`），**不是开新皮**，故：

1. **不调度美工部**，`AESTHETIC.md` 色板与 §2 延展原则一字不改。
2. **但** `AESTHETIC.md` 现仅在 §1 写了「平面映射纸面皮」的边界，**没写「3D 场景内浮层不得用纸面皮」**，这次的错误正出于此。建议由**父代理（或下一次电美工部时）在 §1「平面映射纸面皮」末尾或 §2 延展原则末加一条**：  
   > **场景内浮层（3D 里的文字卡、文件卡、标签）一律走 cube 暗底玻璃 + 亮线框（`--glass-strong` / `--text` 线 / `--muted` 字 / `--accent` 点睛），禁用纸面皮；纸面皮只限平面映射预览 / sheet / 导出。**  
   这一条属「记一条」，不改任何 token；内阁不自写（不在内阁可写范围，`AESTHETIC.md` 非 `cabinet/`），**由父代理在实施回合顺手加**，或在回报里标「待记」。
3. **若主代理实施中觉得必须开第三种卡皮**（例如要给卡底加渐变 / 圆角 / 新色），**立即停下回报，转交美工部**，不得自行发明。

---

## 验收（三监与内阁复核据此逐项打勾；每项须有可复现证据）

| # | 验收项 | 证据 |
|---|--------|------|
| **V1** | **引线存在且为折线**：悬停 GOOGL 球，截图见**两段**线（竖 + 右上 45°），拐点清晰，不是一条直线；球心为起点（线从球内出） | 截图（`cabinet/notes/googl-hover-evidence/`，主代理**自己看过**并写所见） |
| **V2** | **总长 5 UNIT**：在代码里或运行时（`console` / 临时 `selfcheck`）算出 `|球心→拐点| + |拐点→终点|` = `5·UNIT`（容差 ±1%）；第一段 3·UNIT，第二段 2·UNIT；悬停放大前后相同 | 命令 / 控制台输出 + 代码行号 |
| **V3** | **折向镜像**：把 GOOGL 球 orbit / 平移到视口右半，折向改左，卡不出屏；回到中间折向回右；阈值附近不抖（滞回有效） | 两张截图 + 一句话 |
| **V4** | **卡面 cube 审美**：暗玻璃底、亮细线框、字 `--text` / `--muted`、`--accent` 点睛；**无**米白底、深字、圆角、渐变、阴影；放大截图看线框无糊 | 截图 + `rg` 证据：`rg -n "f7f5f0|1a1f26|4a5560|c5ccd4|efeae4|ece8e0|247, ?245|26, ?31" Ind-Chain/web/js/scene.js` 在 GOOGL 卡代码区**无命中** |
| **V5** | **行为不丢**：悬停列**全部**五（或公开包四）条；点击逐次推进、到底回首、活动行标记随动；仅选中而非悬停时只一行；非 GOOGL 球不出卡；**NVDA chain 页一切不变**（仍无白球、无卡、无引线） | 逐项截图 / 控制台 |
| **V6** | **卡与引线不可拾取**，pick / hover / select 逻辑零 diff（`git diff` 只在 `makeGooglCardTexture`、`ensureGooglFileCard`、`updateGooglFileCard`、局部常量与 `?v=` 行） | `git diff --stat` + 逐 hunk 说明 |
| **V7** | **「竖直细线」来源已查明**并处置（见现状），回报写明来源与处置 | 回报一句话 |
| **V8** | **纸面皮未渗入场景 / 场景未渗入纸面皮**：`python3 Ind-Chain/scripts/check_map_purity.py` 通过；`plot-paper.css`、`app.css` 无 diff | 命令输出 |
| **V9** | **回归**：`regress_all.sh`（或 `check_map_purity.py` + 既有 selftest）不降；`?v=` 已同步升到 75 | 命令输出 |
| **V10** | **文档**：CONCEPTS C-POINT 已补引线与暗玻璃句（中英）；`Last updated` 已改 | `rg` 输出 |

---

## 内阁拍板的默认（Q 已全部由内阁答复，不发问）

| 编号 | 问 | 默认 |
|------|----|------|
| **Q1** | 5 单位从哪量起 | **球心**，总长（两段之和），不含球半径折扣 |
| **Q2** | 折线几段 | **两段**（竖 3 UNIT + 屏幕 45° 2 UNIT），一个拐点 |
| **Q3** | 折向 | 默认**右上**；球偏右（NDC x>0.40）自动镜像向左，±0.05 滞回 |
| **Q4** | 第一段沿何轴 | **根局部 +y**（C-AXIS-Y），不沿 s / x |
| **Q5** | 引线色 / 粗细 | `#e8edf4`（`--text`），`opacity 0.9`，1px，**不做双线加粗**；无箭头、无端点圆 |
| **Q6** | 卡底与线框 | 底 `--glass-strong`（canvas 可提至 ≤0.72 且须写实测理由）；外框 1px 亮线（`--text`，0.9），直角 |
| **Q7** | 点睛色 | 标题下细线与活动行竖条用 `--accent`；**不用** `--us` / `--intl` |
| **Q8** | 是否调度美工部 / 改 AESTHETIC | **否**；沿用 token；仅「记一条」禁纸面皮入场景的话，由父代理实施回合顺手加或回报标「待记」 |
| **Q9** | 卡是否可交互（可点、可停留） | **否**（不可拾取，既有行为）；若业主要卡可停留，另令 |
| **Q10** | 仅「选中」时是否也画引线 | **是**（卡在线就在） |
| **Q11** | chain / NVDA | **不动** |
| **Q12** | 周期计数 | 沿 Map 周期**第 4 次 / 至多 5**；谏言不计次 |
| **Q13** | `scene.js?v=` | 同步升到 **75**（main.js 与 ui.js 两处） |
| **Q14** | 分辨率 | 画布 2×（逻辑 512 宽、画布 1024 宽），mipmap 开 |

---

## 不做

- 不改数据 / 文件清单 / `googlFiles.js` 允许列表；不新增后端路由；不改 FE-API。
- 不动 `plot-paper.css`、`map/*`、`app.css`、`modules/**`。
- 不为引线加动画、粒子、发光；不加第二块卡；不改白球本体。
- 不调度监理部 / 档案部 / 美工部 / 信息部 / 交叉整合部 / 参谋纪要官；谏言「不发问」，不弹窗。
- 不改 `DESIGN.md`；不改 `AESTHETIC.md` token。

---

## 指挥安排（总参定夺）

```
内阁令（本文）→ 父代理转 general-staff（意志 + 任务单）
  → 主代理实施：查「竖直细线」来源 → T1 引线 → T2 卡面 → T3 回归 → T4 文档 / ?v=
  → 浏览器取证（V1–V5，存 cabinet/notes/googl-hover-evidence/）
  → 监理部（既有流程；内阁不令）
  → 内阁复核窗口（本周期余 1 次令：若 V1–V10 有缺口则 FIX1）
  → 书记
```

**给监理部的提示（总参可写入任务单「后续」，内阁不令监理部）**：本期是**纯视觉返工**，产品码仅 `scene.js` GOOGL 卡段落 + 两处 `?v=` + `CONCEPTS.md` 一行。`code-quality` 核：diff 是否收敛在卡函数与局部常量、是否无溢出；`engineering-test` 须**真打开 demo / shell 页悬停 GOOGL 球取图**，不凭读码；`principle-compliance` 核：是否复用既有 token、是否把纸面皮留在平面映射、简洁是否守住。

---

## 当前模块清单与关系（基线；本期零改动；真源 `modules/graph.json`，当前 **32 模块 / 45 边**；静态页 `modules/index.html`）

本期涉及模块仅 **FE-SCENE**（场景；GOOGL 卡与引线属其材质与几何，坐标语义仍归 FE-COORDONE，不改）。**不增删任何模块或边。** 相关既有边：`FE-OPENCUBE → FE-SCENE`（depends）、`FE-SCENE → FE-COORDONE`（calls）、`FE-SCENE → FE-FOCUS`（depends）。全图以 `modules/index.html` 为准（静态可直接打开）。

---

## 交回（父代理在三监后回报内阁时须含）

1. 改动清单（逐路径）；确认 `plot-paper.css` / `app.css` / `modules/**` 零 diff。
2. V1–V10 逐项结论与证据；截图路径与每张所见。
3. 「竖直细线」来源与处置（V7）。
4. 卡底 alpha 若超出 0.55，写明理由与最终值。
5. `AESTHETIC.md` 的「场景内浮层禁纸面皮」一条：已加 / 待记。
6. 三监报告结论；是否还需 FIX1。
