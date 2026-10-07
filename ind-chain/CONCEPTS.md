# Standard-Cube (ind-chain) — Concept Target Library  
# 标准立方体 — 概念靶向库

> **Purpose / 用途**  
> Bilingual glossary of *agent-pointing* concepts for this module.  
> After archive, port, or long pause: **read this file before changing 3D/UX code**.  
> 中英对照；封存、移植或隔久再开时，**先读本文再改三维/交互**。  
>
> **Canonical home / 真源**  
> Repo: FIDV · path: `ind-chain/` · entry: `Standard-Cube.app` (GUI) · port **8787**  
>
> **Code tags / 代码标注**  
> Comments use `[C-ID]` matching rows below (e.g. `[C-SLICE]`, `[C-STDVIEW]`).

---

## 0. How agents should use this / 智能体用法

| Step | EN | 中 |
|------|----|----|
| 1 | Resolve user words → concept ID | 把用户口语映射到概念 ID |
| 2 | Prefer IDs over synonyms in edits | 改代码时用 ID，勿混用近义词 |
| 3 | Do not break “Frozen rules” | 勿违反「冻结约定」 |
| 4 | Update this file when a new lasting concept appears | 出现可复用新概念时同步更新本文 |

---

## 1. Scene objects / 场景对象

| ID | EN | 中 | Meaning / 含义 | Code anchors / 代码锚点 |
|----|----|----|----------------|-------------------------|
| **C-CUBE** | industry-chain cube | 产业链立方体 | Whole 3D stack of slices along **s** | `buildCube`, `root` |
| **C-SLICE** | slice / layer / plane | 切片 / 层 / 平面 | One YZ wall = one industry stage; index `i` = user **s\*** | `planeGroups[i]`, `state.layers[i]`, `state.focusLayer` |
| **C-POINT** | company point / sphere | 点球 / 公司点 | One company on a slice; emissive sphere; **center coplanar** with slice | `ctx.meshes`, `ctx.byId` |
| **C-RING** | concentric ring | 同心环 / 营收环 | In-slice radius from revenue score 0–100; ring 10 = exact center | `revScore`, `ring`, ring guides |
| **C-SUPPLY** | optional supply field | 可选供应字段 | Optional `valueM` on a company record may still come from legacy tables. **Not drawn** as a gold ring; no Alphabet-only filter. | `valueM` |
| **C-LABEL** | coplanar label | 共面标签 | Domain/company text glued to slice (not billboard) | `isDomainLabel`, company label planes |
| **C-EDGE** | slice edge | 切片描边 | Slice outline in resting blue (`COLORS.EDGE`); focus does not recolor it | `isSliceEdge` |
| **C-AXES** | user axes | 用户坐标轴 | **s/y/x** in ring-matched ice/steel blues from user origin | `rebuildAxes`, `axesGroup` |
| **C-COORD** | position coordinate `(s, x, y)` | 1类坐标 / 位置坐标 | User coordinate. The only placement language in the cube. `x` and `y` mean only this. Edit `LAYOUT` or an object's coord; do not place with raw Three XYZ | `coords.js`, `applyCoord`, `applySliceCoord` |

**Synonyms to normalize / 口语归一**

- 切片 = slice = layer = 层 = plane（无常驻层列表；切层靠点面 / `[` `]` / 搜索）  
- 点球 = 点 = sphere = company point  
- 环 = concentric ring（营收尺度；不是供应商金环；金环视觉已废）  
- 布局坐标 = 用户坐标 = 1类坐标 = 位置坐标 `(s, x, y)`  
- 环上坐标 = 2类坐标 = 相对坐标 `ringCos` / `ringSin`  
- 行业坐标 = 3类坐标 = industry coordinate = `legalEntityCoord`（BICS；旧称「法人坐标」仍可口语，字段名未改）  
- 右 = +x；左 = −x；上 = +y；下 = −y；前 = +s；后 = −s  
- 电力端 = 后 = −s（小 s）；模型端 = 前 = +s（大 s）。勿把电力叫「左」
- 视空间 = 视野球 = view space = max pull-back（半径默认 200 用户单位）
- d = 切片间距因子 = slice gap factor（默认 1 = 100%；UI 0%–200%）

---

## 2. Coordinate system / 坐标系

| ID | EN | 中 | Rule / 约定 |
|----|----|----|-------------|
| **C-USER-AXES** | user axes `(s, x, y)` | 用户轴 | Product language. Tuple order is **s, then x, then y**. **Not** raw Three.js XYZ. |
| **C-DIR** | direction names | 方向指称 | **右=+x，左=−x，上=+y，下=−y，前=+s，后=−s**。口语「左」不得指电力端或 −s。 |
| **C-AXIS-S** | **s** (slice axis) | **s** 轴（切片轴） | Front / back. **+s** front, **−s** back. **1 s-unit = `UNIT`** (same meters as 1 x / 1 y). Layer index `i` ⇒ **s = i**. Power is back (small s); models are front (large s). Three.js **+X**. |
| **C-AXIS-Y** | **y** | **y** 轴 | Up / down on the face. **+y** up, **−y** down. **1 y-unit = `UNIT`**. Face spans **y∈[0,10]**. Three.js **+Y**. |
| **C-AXIS-X** | **x** | **x** 轴 | Right / left on the face. **+x** right, **−x** left. **1 x-unit = `UNIT`**. Face spans **x∈[0,10]**. Three.js **−Z** via `USER_X_SIGN = -1`. |
| **C-ORIGIN** | user origin | 用户原点 | Corner **(s, x, y)=(0, 0, 0)**. Three: `(−halfStack, −FACE/2, +FACE/2)`. |
| **C-VIEW-SPACE** | view space | 视空间 / 视野球 | Sphere about **C-ORIGIN**, radius **R** in user units (default **200**; `1 s = 1 x = 1 y`). Farthest camera pull-back vs OrbitControls `target` is `R · UNIT` (always **UNIT**, never multiply by **d**). Not drawn. Not axis length. | `LAYOUT.viewSpace`, `viewSpaceMeters`, `controls.maxDistance` |
| **C-MAP** | user → Three | 用户→引擎映射 | `coordToLocal` / `userToWorld`: `X += s·gap`, `Y += y·UNIT`, `Z += USER_X_SIGN·x·UNIT`, then `root.localToWorld` (honors Q/E yaw). `UNIT = FACE/10`; `gap = d·UNIT`. |
| **C-COORD** | position coordinate | 1类坐标 / 位置坐标 | User `(s, x, y)`. The only placement in the cube. `x` and `y` mean only this pair. A focused slice stays; `sliceAnchor` shifts the rest along **−x**. Company `coord` is the face position. |
| **C-COORD-2** | relative coordinate | 2类坐标 / 相对坐标 | Ring placement `ringCos` / `ringSin`. Not called `x` or `y`. `companyCoord` projects them into 位置坐标. |
| **C-COORD-3** | industry coordinate | 3类坐标 / 行业坐标 | One industry code per company (optional). **Authoritative:** Bloomberg BICS Equity Hierarchy 2024 compact `bicsCode` (length `2×level`, levels 1–7). **Product field** `legalEntityCoord`: stored as fixed **7×2** hyphenated segments, right-pad `00` for shallow leaves (e.g. leaf L4 → `10-10-13-12-00-00-00`). **If the winning membership has empty `% Tot Rev`**, the **entity** coord in list API is `'-'` + that 7×2 (e.g. `-50-12-10-10-00-00-00`); hierarchy **node** coords stay unsigned. **Gate / list chrome shows the first 4 groups only** and **keeps a leading `-`** (`-50-12-10-10`); L5–L7 including pad `00` are hidden, not deleted. Empty `%` is not 100. May hang a non-leaf code (= coarser class). Library: `class-3-coords/BICS-Classification/`. **Not a position, not drawn on the cube.** |

```
User (s, x, y)   Three.js (under root)
─────────────────────────────────────
+s  (ice)        +X
+y  (steel)      +Y
+x  (ring blue)  −Z  (USER_X_SIGN = -1)
```

Position changes go through `ind-chain/web/js/coords.js` (`LAYOUT`, or an object's `{s, x, y}`). Scene code calls `applyCoord` / `applySliceCoord`.

**Do not / 禁止**

- Do not call user-**x** “depth in Three +Z” without `USER_X_SIGN`.  
- Do not treat **s\*** as world meters; it is **layer index / gap units**.

---

## 3. States / 状态

| ID | EN | 中 | State field / 字段 | Behavior / 行为 |
|----|----|----|-------------------|-----------------|
| **C-FOCUS** | focused slice | 焦点切片 | `state.focusLayer = i \| null` | One slice stays put; the rest of the cube shifts along **−x** (left) and fades. |
| **C-SELECT** | selected company | 选中公司 | `state.selectedId` | Detail panel; stronger emissive. Esc clears this first. |
| **C-HOVER** | hover | 悬停 | `state.hoverId` | Tooltip only. |
| **C-DIM** | off-focus fade | 离焦淡出 / 抽回淡入 | — | Non-focus slices fade to opacity 0. Retract fades back to resting opacity on the same lerp as exit. Materials stay `transparent` while fading. |
| **C-FILTER** | filter mode | 过滤 | `state.filterMode` | `all` / `us` / `intl`. |
| **C-D** | slice gap factor | 切片间距 d | `state.d` | Default **1** (= 100%). Meters between slices = `d · UNIT`. UI slider 0%–200% → `d ∈ [0, 2]`. Replaces former explode toggle. |

**Esc hierarchy / Esc 分层** `[C-ESC]`  
1) clear **select** → 2) clear **focus** → keep camera.

---

## 4. Actions / 动作

| ID | EN | 中 | What happens / 效果 | Code |
|----|----|----|---------------------|------|
| **C-PULL** | cube exit | 抽出 | Focused slice stays at its **s** and **x∈[0,10]**. The rest of the cube shifts together along **−x** (left) by `cubeExitX()` (= `FACE_SPAN` = 10) and fades out. | `lerpPullOut`, `sliceAnchor`, `cubeExitX` |
| **C-RETRACT** | retract | 抽回 | Focus cleared; the cube eases back along **+x** and fades in on the same timing as exit fade-out (`lerpPullOut` + `lerpVisibility`). **Camera must not auto-yaw toward origin.** | `focusSlice` toggle / `clearFocus` |
| **C-PULL-ZONE** | pull-frame hit zone | 抽出点击区 | Square∖disk on slice face: inside 1×1 square, **outside** outermost concentric ring. Misses inside the ring do **not** toggle focus. Tested in user `(s, x, y)`. | `isPullFrameHit`, `LAYOUT.ringRadius` |
| **C-FOCUS-ACT** | focus slice | 聚焦切片 | Set `focusLayer`; the slice stays, the cube exits. Via plane click, `[` `]`, or pick/search a company on that slice. No permanent layer-list chrome. | `focusSlice` |
| **C-PICK** | pick company | 点选公司 | Raycast sphere → select + focus its layer. Plane toggle only if hit is in **C-PULL-ZONE**. | `pick`, `selectCompany` |
| **C-STDVIEW** | standard view | 标准视角 | Snap camera to canonical pose for current focus state. Hotkey **C** / button / middle-click. | `goStandardView`, `standardPose` |
| **C-RESET** | reset view | 重置 | Clear focus/select; go standard overview pose. | `resetCamera` |

**Camera rule / 相机约定** `[C-CAM-HOLD]`  
Changing or clearing slice focus **must not** animate orbit target into the cube interior. Only **C-STDVIEW** / **C-RESET** / explicit pick framing may move the camera.

**View space / 视空间** `[C-VIEW-SPACE]`  
Orbit dolly (wheel / **R·F**) clamps at `controls.maxDistance = LAYOUT.viewSpace.radius · UNIT`. Standard poses stay inside the ball (`‖overview‖≈38 < 200`). This edition limits distance to `target`, not a hard shell about the origin after pan.

---

## 5. Standard view poses / 标准视角位姿 `[C-STDVIEW]`

User coordinates `(s, x, y)`. Looking direction via OrbitControls `target`. Numbers live in `LAYOUT.camera`.

| Mode | Camera `(s, x, y)` | Look-at | 中文说明 |
|------|--------------------|---------|----------|
| **Focused** (`focusLayer = s*`) | `(s* + 10, 5, 5)` | `(s*, 5, 5)` (from **+s** / front) | 从前方正对留在原地的面心（x=5, y=5） |
| **Overview** (no focus) | `(24, 21, 21)` | user origin `(0, 0, 0)` | 未聚焦总览 |

Removed / 已废弃：旧「角视图 corner view」与 **V / Home** 绑定（勿恢复 unless product asks）。

---

## 6. Controls / 操控

| Input | Action | Concept |
|-------|--------|---------|
| Left-drag | pan (translate) | — |
| Right-drag | orbit (fine; low rotateSpeed) | — |
| Scroll | exponential dolly | — |
| Middle-click | **C-STDVIEW** | standard view |
| **C** | **C-STDVIEW** | 标准视角 |
| **Q / E** | yaw whole `root` | — |
| **W A S D** | pan | — |
| **R / F** | dolly | — |
| **[ / ]** | prev/next focus slice | **C-FOCUS-ACT** + **C-PULL** |
| **Esc** | layered clear | **C-ESC** |
| **?** | help overlay | Default **closed**; chrome is floating over the full-bleed cube (no solid sidebars) |
| HUD **d** slider | slice spacing 0%–200% | **C-D** |
| Click slice **frame** (square∖ring) | focus/toggle that slice | **C-FOCUS-ACT** / **C-PULL-ZONE** |
| Double-click empty | clear focus | **C-RETRACT** path |
| Click company point | select | **C-PICK** |

---

## 7. Data concepts / 数据概念

| ID | EN | 中 | Notes |
|----|----|----|-------|
| **C-LAYER-DATA** | layer record | 层数据 | `layers.json` / API; order 0 Power → 10 Models |
| **C-COMPANY** | company record | 公司 | `revBn`, `revScore`, `ring`, `ringCos`, `ringSin`, `country`, optional `valueM`, optional `legalEntityCoord` / industry code (empty until attached) |
| **C-US / C-INTL** | US / non-US | 美 / 非美 | Colors cyan / orange (`#3cf0ff` / `#ffb020`) |
| **C-HOME** | engineering home | 工程首页 | Gate at `/`: BICS **L1–L3** same board (`/?bics=`). Optional `?listingCountry=` (ISO or `UNMAPPED`) via a **searchable listing-country dropdown** (not a chip wall; not cube `?country=`). **Level-4** cell → **C-LIST**. Breadcrumb **fixed** top-left (`All / …`). Sector cells show **4-segment** industry coords (`displayIndustryCoord`) and subtree **company counts**. Header one **Decision cube** → **C-CUBE** overview (`/cube`). Hosts **C-SPLASH** (cold `/` only). | `web/index.html`, `home.js`, `nations.js`, `GET /api/bics/children` |
| **C-LIST** | L4 company list | 四级公司名单 | `/list?bics=<L4 compact>` plus optional `?listingCountry=`. One company per full **Member Ticker**, only if this L4 is its **primary** (numeric `% Tot Rev` wins; empty still gets a primary via the same sort, entity coord prefixed `-`). Industry coord column uses **4-segment** chrome (keeps leading `-`). Other L1 shares as annotations. Country from yellow-key (see **C-LISTING**). No splash. Header **Decision cube** → overview `/cube`. **Row click** → `/cube?ticker=` (**company→cube**). | `web/list.html`, `list.js`, `GET /api/bics/entities` |
| **C-LISTING** | listing country | 上市地 | ISO from Bloomberg yellow-key **exchange token** (second-last before `Equity`/`Corp`/…), mapped in `server/listing.py`. **Not** headquarters. **Not** an 8th industry axis. Unmapped venues stay **Unmapped**. Distinct from cube **C-US / C-INTL**. Changing country on C-HOME / C-LIST is in-page `history` + refetch — no document reload, no splash, keep board scroll. |
| **C-CUBE** | decision cube SPA | 决策立方体页 | Full-bleed cube. Bare `/cube` = demo AI chain (`GET /api/bundle`, 11 slices + rings). **company→cube** `/cube?ticker=` = **standard shell**: **no** industry slice walls, **no** ring guides; one BICS primary firm at user **(s,x,y)=(5,5,5)** (`shellAnchor`; layer index ≠ s). **class→cube**: header → overview only. No splash. L4 cells → C-LIST. | `web/cube.html`, `main.js`, `/api/bundle` |
| **C-SPLASH** | splash | 开屏 | Only on **C-HOME**: FIDV wordmark → clear hold ~**2s** → fade ~**4s**. `/list` and `/cube` play no splash. | `#splash` in `index.html`, `home.js` |
| **C-RING-SCORE** | ring score | 环分数 | Per-slice min–max → 0–100; **100 = exact center** |

---

## 8. Symbol map / 符号对照（代码）

| Symbol | Concept ID | Note |
|--------|------------|------|
| `state.focusLayer` | C-FOCUS | `null` = overview |
| `state.selectedId` | C-SELECT | |
| `cubeExitX()` | C-PULL | one face width along **−x** (left); = `FACE_SPAN` (10) |
| `USER_X_SIGN` | C-AXIS-X | `-1` |
| `FACE` | face edge meters | physical PlaneGeometry edge |
| `FACE_SPAN` | face edge user units | `10` — vertices 0 and 10 |
| `UNIT` / `GAP` | C-AXIS-S/X/Y unit | meters per 1 user-s / x / y when **d=1** (`FACE/10`) |
| `state.d` / `gapMeters` | C-D | slice gap factor; `gap = d·UNIT`; UI % = `100·d` |
| `LAYOUT.viewSpace` / `viewSpaceMeters` | C-VIEW-SPACE | user radius R (200); meters = `R·UNIT` |
| `controls.maxDistance` | C-VIEW-SPACE | = `viewSpaceMeters()` |
| `coordToLocal` / `userToWorld` | C-MAP | argument is `{s, x, y}` |
| `applyCoord` / `applySliceCoord` | C-COORD | only placement API in the scene |
| `company.coord` | C-COORD | unpulled 位置坐标 `(s, x, y)` |
| `ringCos` / `ringSin` | C-COORD-2 | 相对坐标；`companyCoord` 投影成位置坐标 |
| `legalEntityCoord` | C-COORD-3 | 行业坐标；库内节点 7×2 无符号；企业主业空 `% Tot Rev` 时名单字段前加 `-`；闸门/名单 **只显示前 4 段** 且保留负号（`displayIndustryCoord`）；权威码 `bicsCode` |
| `standardPose` / `goStandardView` | C-STDVIEW | |
| `focusSlice` / `clearFocus` | C-FOCUS-ACT / C-ESC | |
| `lerpPullOut` | C-PULL / C-RETRACT | exit and retract share the same ease; no camera |
| `lerpVisibility` | C-DIM / C-RETRACT | fade-out and fade-in share the same k |
| `isSlicePlane` | C-SLICE | pick target for plane click |

---

## 9. Frozen rules / 冻结约定（续做勿回退）

1. 1类坐标 / 位置坐标 is **`(s, x, y)`**, not raw Three XYZ. `x` and `y` mean only this. Move things by editing coordinates in `coords.js`. 2类坐标 / 相对坐标 is `ringCos` / `ringSin`. 3类坐标 / 行业坐标 is `legalEntityCoord`（BICS **存储** 7×2，库在 `class-3-coords/BICS-Classification/`；企业主业空占比时名单坐标加 `-`；**闸门与名单 chrome 只画前 4 段并保留前导 `-`**），不参与摆放。  
2. Focus keeps the slice. The rest of the cube exits along user **−x** (left) only, by `cubeExitX`. Do not call 「左」 **−s**. Do not move the focused slice.  
3. Focus change / retract → **hold camera** (`C-CAM-HOLD`).  
4. Standard overview / focused poses stay as §5 until explicitly revised.  
5. Dimmed points need `transparent: true` or opacity is ignored.  
6. Labels stay **coplanar** on the slice (no CSS2D billboard).  
7. Server owns ring layout; browser does not re-scale rings on filter.  
8. Default: **do not leave :8787 running** unless user asks.

---

## 10. Continuity pointers / 续工指针

| Doc | Role |
|-----|------|
| **This file** | Concept targets (agent-facing) |
| [`library/worklog-001.md`](../library/worklog-001.md) | Session asks/answers + history |
| [`README.md`](./README.md) | Run / API |
| `web/js/scene.js` | 3D + camera + pick (`[C-*]` tags) |
| `web/index.html` + `home.js` | **C-HOME** L1–L3 board + **C-SPLASH** + header Decision cube; L4 cells → **C-LIST** |
| `web/list.html` + `list.js` | **C-LIST** L4 company table (no splash) |
| `web/cube.html` + `web/css/app.css` | **C-CUBE** full-bleed cube; floating chrome; **no splash**; aesthetics → `agent_tasklist/AESTHETIC.md` |
| `web/js/main.js` | Cube boot only; reads `?bics=` |
| `assets/fidv-launcher*` + `scripts/set-command-icon.sh` | Launcher icons（美工部管辖） |
| `GET /api/bics/children` | C-COORD-3 children of `parent` (empty = L1) |
| `GET /api/bics/entities` | member companies whose primary L4 is `?bics=`（含空 `% Tot Rev` 胜出；此时 `legal_entity_coord` 带 `-`） |
| `GET /api/bics/node` | One BICS node by `code` (any level) |
| `GET /api/bics/l1` | Compat: L1 sectors only |
| 信息部 / `agent_tasklist/INFORMATION.md` | 数据目录、调用词条、乱缺建议、BQLX 公式方案 |
| `web/js/state.js` | Shared state |
| `web/js/ui.js` | Panels / status / buttons |

**One-liner resume / 一句话续工**  
立方体 = 沿 **s** 堆的 **切片**；位置一律 **(s, x, y)**；面 **x,y∈[0,10]**；**1 s = 1 x = 1 y = UNIT**；右=+x 左=−x 上=+y 下=−y 前=+s 后=−s；焦点切片不动，离焦立方体沿 **−x** 左移淡出；**C** = 标准视角；切层/抽回不扭相机。

---

*Last updated: 2026-10-02 · Coordinates are `(s, x, y)` in `web/js/coords.js`. Keep in sync with `LAYOUT.camera` and hotkeys in `scene.js`.*
