# 内阁 → 总参谋部指令

**令号** GS-20261016-GOOGL-HOVER-LEFT-SCALE  
**日期** 2026-10-16  
**本周期内阁下令计数** **新短令，第 1 次 / 至多 5**。Map 周期已于 `GS-20261016-GOOGL-HOVER-LABEL` 满 5 次，本令**不占** Map 周期；系业主另令，另起「GOOGL-HOVER 短周期」单独计数。谏言不计次。  
**本期** **GOOGL 悬停卡：默认折向左；卡在屏幕上固定大小（随相机距离缩放）**  
**交** **总参谋部**（父代理须将本文**完整**转交 `general-staff` 立意志与任务单；产品码由主代理实施；实施后按既有规则送监理部，内阁不令监理部；内阁不改产品码）  
**来源** 业主 Purkniv 原话：「电内阁，改进悬停列表，悬停列表现在默认不相对点在右侧，而是相对点在左侧，视角上这样，因为左侧比较空，然后除了永远正对视角外，应该再固定一下视角里的大小，现在是绝对大小，拉远了根本看不清列表上是什么，尝试把大小做成相对视角固定。」  
**依据** `cabinet/AUTHORITY.md` · 前令 `GS-20261016-GOOGL-HOVER-CARD`（T1 折线、Q3 折向、卡宽 `max(2.4, UNIT·6)`）· `GS-20261016-GOOGL-HOVER-LABEL`（仅悬停出卡）· `Ind-Chain/CONCEPTS.md` C-POINT

---

## 谏言

**不发问。** 两处意志清楚，且都落在一个函数里；Q 全部由内阁拍板（见末表）。

---

## 现状（内阁读码所见；总参可抽检）

文件 `Ind-Chain/web/js/scene.js`（`main.js` / `ui.js` 现均以 **`?v=76`** 引入 `scene.js`——注意不是前令写的 75）：

| 位置 | 内容 |
|------|------|
| L1205–1209 | 局部常量 `GOOGL_LEADER_UP=3`、`GOOGL_LEADER_DIAG=2`、`GOOGL_LEADER_NDC=0.4`、`GOOGL_LEADER_HYST=0.05` |
| L1304 | `ctx.googlLeaderMirrorLeft = false`（默认折向右；`true` = 镜像向左） |
| L1345–1346 | 卡尺寸只在**贴图重建**时设：`w = max(2.4, UNIT*6)`；`mesh.scale.set(w, w/aspect, 1)`。即世界绝对尺寸，拉远即小 |
| L1362–1371 | 折向判定：`ndc.x > 0.40+0.05` → 向左；`< 0.40-0.05` → 回右 |
| L1383 / L1393 | `foldDir = camRight·(mirror?-1:1) + camUp`；近角 `(mirror ? +halfW : -halfW, -halfH)` |
| 相机 | `PerspectiveCamera(42°, …)`（L61），垂直 FOV 42°；透视，故 `scale ∝ 深度` 即屏上恒定 |
| `UNIT` | `coords.js`：`FACE(4.2)/…`，现 ≈ **0.42 m**（世界单位） |

---

## 意志（一句）

**悬停 GOOGL 白球时，卡默认折向视角的左侧（左上），仅当左侧放不下才镜像向右；卡在屏幕上保持大致恒定的像素尺寸，不随相机远近、不随球悬停放大而变；仍永远 billboard。**

---

## 任务

### T1　默认折向左（对调）

只改左右默认与锚角；引线几何（竖 3 UNIT + 屏幕平面 45° 2 UNIT，总长 5 UNIT）**沿用**。

| 项 | 拍板 |
|----|------|
| 状态变量 | `ctx.googlLeaderMirrorLeft` **改名** `ctx.googlLeaderFoldRight`，初值 `false`（= 默认折左）。语义：`false` = 向左上，`true` = 向右上 |
| 第二段方向 | `foldDir = camRight · (foldRight ? +1 : −1) + camUp`，再 `normalize()` |
| 锚角 | **折左：卡右下角贴终点**（`cornerLocal = (+halfW, −halfH, 0)`）；**折右：卡左下角贴终点**（`(−halfW, −halfH, 0)`）。与旧代码写法一致，只是 `mirror` 与 `foldRight` 取反 |
| 翻转判据 | **不再用固定 `NDC x > 0.40`。** 卡现在是固定像素宽，是否放得下取决于卡宽占屏比，故改为「**左折时卡的左缘是否出屏**」：先无论当前状态，算出**折左**时的终点 `tipL`，投到 NDC 得 `tipL.ndc.x`；`leftEdge = tipL.ndc.x − 2·wPx/Wpx`（`wPx` 卡屏宽像素，`Wpx` 视口 CSS 宽）。 |
| 滞回 | `GOOGL_FOLD_EDGE = −0.95`，`GOOGL_FOLD_HYST = 0.05`：`foldRight=false` 时若 `leftEdge < −1.00` → 置 `true`（卡左缘贴到屏边才翻）；`foldRight=true` 时若 `leftEdge > −0.90` → 置 `false`（左侧有 0.05 NDC 余量才回）。 |
| 1440 px 宽屏的体感 | 球的 NDC x 小于约 **−0.40**（约距左缘 430 px）才翻右——恰好是业主原话「球偏左（NDC x 过负阈值）才镜像向右」，只是阈值随窗口/距离自动算，不写死 |
| 删除 | `GOOGL_LEADER_NDC`（0.4）与旧判据；`GOOGL_LEADER_HYST` 可保留改名为 `GOOGL_FOLD_HYST` |

### T2　相对视角固定大小（拍板：按相机深度缩放，仍是 Three 里的 billboard 网格）

**法：** 透视相机下，物体在屏幕上的像素高度 ∝ 世界高度 / 深度。令世界宽 `w = k · depth`，则屏上宽恒为 `wPx`。**不用** CSS2D（会离开场景、失去与球 / 引线同批渲染与 `depthTest:false` 的现有层序），**不用**正交相机，**不改** `main.js` / 相机。

| 项 | 拍板 |
|----|------|
| 深度 `depth` | **终点（tip）在相机前向上的距离**（视空间 −z）：`depth = (tipWorld − camPos) · camForward`，`camForward = (0,0,−1).applyQuaternion(camera.quaternion)`。卡的各点与终点同深度（billboard，角偏移在屏幕平面内），故用 tip 深度最准。`depth = max(depth, 0.5)` 防零 / 负 |
| 每像素世界长 | `wpp = 2 · depth · tan(fov/2) / Hpx`，`fov = ctx.camera.fov`（现 42°，`2·tan21° = 0.7677`），`Hpx` = 视口 CSS 高（`ctx.renderer.getSize(v2).y`，非 DPR 倍数） |
| **目标屏宽 `wPx`** | `wPx = clamp( min(400, 0.42·Wpx, 0.30·Hpx·aspect), 240, 400 )`，常量名 `GOOGL_CARD_PX = 400`。 **默认 400 CSS px 宽**；窗口窄 / 矮时自动收小，下限 240。`aspect = W/H`（贴图逻辑比，5 行时约 2.4：400 px 宽 ≈ 170 px 高，约占 1080p 视口高 16%） |
| **公式（每帧）** | `wWorld = wPx · wpp = wPx · 2·tan(fov/2) · depth / Hpx`；`mesh.scale.set(wWorld, wWorld / aspect, 1)`。即 `k = wPx · 0.7677 / Hpx`（1440×900：`k = 0.341`，depth 12.5 时 `wWorld ≈ 4.3 m`，约旧值 2.52 的 1.7×；depth 25 时 8.5 m，屏上仍 400 px） |
| 与球放大无关 | `depth` 取自**球心→终点**，不含 `host.scale`；球悬停 1.5× 不影响卡尺寸，也不影响引线（起点球心、长度见下） |
| 每帧设 | **缩放从「贴图重建时设」改为「每帧设」**。贴图重建块只存 `ctx.googlCardAspect = aspect`，不再 `mesh.scale.set`。现 L1345–1346 两行删掉 |
| 先后顺序 | 每帧：①算 `center`、`camRight/camUp`、`λ`（见下）→ ②算两个候选 tip（左折为判据、当前折向为终点）→ ③以当前折向 tip 算 `depth`、`wWorld` → ④`mesh.scale` → ⑤按 `halfW/halfH` 算近角偏移，`mesh.position = tip − corner` |
| 世界 vs 根局部 | `ctx.root` 现无缩放（仅位移 / 旋转）。`mesh.scale` 在根局部、`depth` 在世界；二者数值等价。若主代理发现 `root.scale ≠ 1`，须除以 `root.scale.x` 并回报 |

### T3　引线：保留 5 UNIT 绝对长，仅加近距上限

卡改成屏幕恒定后，引线仍是世界 5 UNIT：**远处**引线变短，卡整体贴近球（卡底在终点之上，仍不压球；左折时卡在终点左上，球在终点左下，不重叠）；**近处**引线会变得很长，终点出屏。故加**一道近距上限**，其余不动：

| 项 | 拍板 |
|----|------|
| 引线缩放 `λ` | `λ = min(1, depth_c / D0)`，`depth_c` = **球心**深度（同上法算），`D0 = 9.7`（世界 m）。 推导：令引线竖向跨度 `(3+√2)·UNIT·λ` 不超过屏高 25%（`0.25·0.7677·depth`），得 `D0 = (3+√2)·0.42 / (0.25·0.7677) ≈ 9.66` |
| 作用 | 所有引线长度（竖 3 UNIT、斜 2 UNIT）同乘 `λ`。**默认视距与更远（depth ≥ 9.7）λ=1，总长仍严格 5 UNIT**，前令 V2 照旧可测；只有拉得很近才缩短 |
| 常量 | `GOOGL_LEADER_NEAR_D0 = 9.7`，写在 GOOGL 卡局部常量区 |
| 不做 | 不做「引线也屏幕恒定」——那会让 5 UNIT 失去语义，业主前令明确要 5 UNIT |

### T4　边界与文档

- **改动文件限定**：`Ind-Chain/web/js/scene.js`（GOOGL 卡段：局部常量、`ensureGooglFileCard` 里 `googlLeaderMirrorLeft` 初值、`updateGooglFileCard`）。**`makeGooglCardTexture` 不动**（卡面、字号、贴图尺寸一字不改；若业主嫌 400 px 下路径小字太小，只调 `GOOGL_CARD_PX`，另令）。
- **缓存破坏**：`main.js` 与 `ui.js` 对 `scene.js` 的 `?v=` **同步由 76 升到 77**。
- **文档回写**：`Ind-Chain/CONCEPTS.md` C-POINT（L34）把 *「mirrored left when the ball is in the right of the view」* 改为：
  *「folds to the **left** of the view by default and mirrors to the right only when the page's left edge would leave the screen; the page keeps a roughly constant on-screen size (world width ∝ camera depth, target ≈ 400 CSS px, clamped to the viewport) and does not scale with the ball's hover enlargement」*；
  中文句补：*「默认折向视角左侧，仅左缘出屏才镜像向右；卡在屏幕上大致恒定像素宽（世界宽 ∝ 相机深度，约 400 px），不随球悬停放大」*；页脚 `Last updated` 改当日。
- **不动**：`web/js/map/*`、`plot-paper.css`、`app.css`、`modules/**`、`DESIGN.md`、`AESTHETIC.md`、chain / NVDA 一切。不新增模块或边（`modules/graph.json` 仍 32 / 45，仅 FE-SCENE 受影响）。

---

## 实现参考（给主代理；内阁不改码，仅示意，以现码为准）

```js
const GOOGL_CARD_PX = 400;
const GOOGL_CARD_PX_MIN = 240;
const GOOGL_FOLD_EDGE = -0.95;
const GOOGL_FOLD_HYST = 0.05;
const GOOGL_LEADER_NEAR_D0 = 9.7;

// per frame, after center / camRight / camUp / camera quaternion are known:
const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camQ);
const depthOf = (p) => Math.max(0.5, p.clone().sub(camPos).dot(fwd));   // p, camPos in world
const size = ctx.renderer.getSize(new THREE.Vector2());               // CSS px
const k2 = 2 * Math.tan(THREE.MathUtils.degToRad(ctx.camera.fov) / 2);
const aspect = ctx.googlCardAspect;
const wPx = THREE.MathUtils.clamp(
  Math.min(GOOGL_CARD_PX, 0.42 * size.x, 0.30 * size.y * aspect),
  GOOGL_CARD_PX_MIN, GOOGL_CARD_PX);

const lam = Math.min(1, depthOf(worldCenter) / GOOGL_LEADER_NEAR_D0);
const tipFor = (right) => {
  const dir = camRight.clone().multiplyScalar(right ? 1 : -1).add(camUp).normalize();
  const elbow = center.clone().add(new THREE.Vector3(0, GOOGL_LEADER_UP * UNIT * lam, 0));
  return { elbow, tip: elbow.clone().add(dir.multiplyScalar(GOOGL_LEADER_DIAG * UNIT * lam)) };
};
// fold hysteresis on the LEFT-fold candidate
const tipL = tipFor(false).tip;
const leftEdge = ndcX(tipL) - 2 * wPx / size.x;       // ndcX: root-local → world → project(camera).x
if (!ctx.googlLeaderFoldRight && leftEdge < -1.0) ctx.googlLeaderFoldRight = true;
else if (ctx.googlLeaderFoldRight && leftEdge > GOOGL_FOLD_EDGE + GOOGL_FOLD_HYST) ctx.googlLeaderFoldRight = false;

const { elbow, tip } = tipFor(ctx.googlLeaderFoldRight);
const wWorld = wPx * k2 * depthOf(tipWorld) / size.y;
mesh.scale.set(wWorld, wWorld / aspect, 1);
const halfW = wWorld / 2, halfH = mesh.scale.y / 2;
const cornerLocal = new THREE.Vector3(ctx.googlLeaderFoldRight ? -halfW : +halfW, -halfH, 0)
  .applyQuaternion(faceQuat);
mesh.position.copy(tip).sub(cornerLocal);
```

---

## 验收（三监据此逐项）

| # | 验收项 | 证据 |
|---|--------|------|
| **V1** | **默认折左**：球在视口中部悬停，引线第二段向左上，卡在终点左上，**卡右下角贴终点**；球左侧空区被卡占用 | 截图（`cabinet/notes/googl-hover-evidence/`） |
| **V2** | **翻右**：把球 orbit / 平移到视口最左，卡左缘将出屏时折向右、卡左下角贴终点；回中部折回左；阈值附近不抖（滞回） | 两张截图 + 一句话 |
| **V3** | **固定屏宽**：同一悬停，分别在近、中、远三档相机距离截图，卡屏宽均约 **400 px**（容差 ±8%；窗口过窄时按 clamp）；并用 `Runtime.evaluate` / 临时 selfcheck 打出每帧 `wWorld / depth` 比值恒定 | 三张截图 + 数值 |
| **V4** | **球放大不影响卡**：悬停（球 1.5×）前后，卡屏宽与引线终点不变 | 对比两张图 / 数值 |
| **V5** | **仍 billboard**：orbit 一周，卡始终正对屏幕、不侧倾 | 截图 |
| **V6** | **引线**：depth ≥ 9.7 时总长 = 5·UNIT（±1%），第一段 3、第二段 2；depth < 9.7 时 `λ = depth/9.7` 缩短，近距终点不出屏顶 | 数值 + 近距截图 |
| **V7** | **范围不外溢**：`git diff` 只在 `scene.js` GOOGL 卡段（常量、`ensureGooglFileCard` 初值、`updateGooglFileCard`）、两处 `?v=`、`CONCEPTS.md` C-POINT 一行；`makeGooglCardTexture`、`map/*`、`plot-paper.css`、`app.css` 零 diff；chain / NVDA 无白球、无卡 | `git diff --stat` + 逐 hunk |
| **V8** | **回归**：`python3 Ind-Chain/scripts/check_map_purity.py` 通过；`regress_all.sh` 不降；`?v=` 两处同为 77；`rg "googlLeaderMirrorLeft\|GOOGL_LEADER_NDC" Ind-Chain/web` 无命中 | 命令输出 |

---

## 内阁拍板的默认（Q 全部由内阁答复，不发问）

| 编号 | 问 | 默认 |
|------|----|------|
| **Q1** | 默认折向 | **左上**（视角上相对球在左）；左缘放不下才翻右 |
| **Q2** | 翻转判据 | 左折时**卡左缘 NDC < −1.00** 翻右；回左需 > −0.90（滞回 ±0.05）；非固定 0.40 |
| **Q3** | 锚角 | 折左：卡**右下角**贴终点；折右：卡**左下角**贴终点 |
| **Q4** | 固定大小的做法 | **世界宽 = `wPx·2·tan(fov/2)·depth/Hpx`**（按相机深度缩放，每帧设），不用 CSS2D / 正交相机 |
| **Q5** | 目标尺寸 | **400 CSS px 宽**（5 行时约 170 px 高）；`min(400, 0.42·视口宽, 0.30·视口高·aspect)`，下限 240；窗口大小变化时自动跟随 |
| **Q6** | 深度取哪 | **终点（tip）的相机前向深度**；球放大不计入 |
| **Q7** | 引线是否也屏幕恒定 | **否**，仍世界 5 UNIT；仅 `depth<9.7` 时 `λ=depth/9.7` 缩短（防近距出屏） |
| **Q8** | 卡面 / 字号 | **不改** `makeGooglCardTexture`；400 px 下 14 px 文件名约 11 px、11 px 路径约 8.6 px——若业主嫌路径字小，另令调 `GOOGL_CARD_PX` 或字号 |
| **Q9** | 改哪些文件 | `scene.js` GOOGL 卡段 + `?v=` 两处（76→77）+ `CONCEPTS.md` C-POINT；其余不动 |
| **Q10** | chain / NVDA | **不动** |
| **Q11** | 周期计数 | 新短令第 1 次；不占 Map 周期（已满 5） |

---

## 不做

- 不改卡面绘制、数据、文件清单、点击轮转、仅悬停才显示的行为。
- 不改拾取逻辑（卡与引线仍不可拾取）。
- 不动 `map/*`、纸面皮、`app.css`、`modules/**`、`DESIGN.md`、`AESTHETIC.md`。
- 不调度监理部 / 档案部 / 美工部 / 信息部；不增模块。

---

## 旁注（给总参 / 主代理）

1. **前令文档写 `?v=75`，现码已是 76**；本令以现码为准升 77。
2. **旧阈值 0.40 的来由已失效**：它是按「卡宽 2.5 m、球靠右会被挤出」估的。卡改为固定像素宽后，是否放得下由 `wPx/Wpx` 决定，故本令改为按卡左缘判，不留旧常量，免得两套阈值打架。
3. **卡会变大**：同一默认视距下卡约为旧 1.7×（400 px vs 约 235 px 等效）。这正是业主要的「拉远也看得清」；若业主觉得默认视距下太大，只需把 `GOOGL_CARD_PX` 调小（建议 320），不用改公式。
4. **悬停仍须停在球上才有卡**（前令 Q9，不变）。卡变大后，鼠标移向卡的路径更长，仍会消失——如业主要卡可停留，另令。
5. 窗口极窄（`0.42·Wpx` 起作用）时左折、右折都可能放不下，此时以「左缘不出屏」为准的判据可能来回翻；有滞回压着，不致抖动，不另处理。
6. 卡的 `renderOrder 30` / `depthTest:false` 不变，固定屏宽后卡永远盖在场景上，与前令一致。
