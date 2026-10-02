# AI Chain Cube — Concept Target Library  
# 产业链立方体 — 概念靶向库

> **Purpose / 用途**  
> Bilingual glossary of *agent-pointing* concepts for this module.  
> After archive, port, or long pause: **read this file before changing 3D/UX code**.  
> 中英对照；封存、移植或隔久再开时，**先读本文再改三维/交互**。  
>
> **Canonical home / 真源**  
> Repo: FIDV · path: `ai-chain/` · entry: `Open-AI-Chain.command` · port **8787**  
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
| **C-SUPPLY** | Alphabet supplier mark | 供应商标记 / 金环 | Gold ring when `valueM` from `GOOGL_SUPPLY` | `COLORS.SUPPLY`, filter `supply` |
| **C-LABEL** | coplanar label | 共面标签 | Domain/company text glued to slice (not billboard) | `isDomainLabel`, company label planes |
| **C-EDGE** | slice edge | 切片描边 | Focused slice edge highlights | `isSliceEdge` |
| **C-AXES** | user axes | 用户坐标轴 | **s/y/x** in ring-matched ice/steel blues from user origin | `rebuildAxes`, `axesGroup` |
| **C-COORD** | position coordinate `(s, x, y)` | 1类坐标 / 位置坐标 | User coordinate. The only placement language in the cube. `x` and `y` mean only this. Edit `LAYOUT` or an object's coord; do not place with raw Three XYZ | `coords.js`, `applyCoord`, `applySliceCoord` |

**Synonyms to normalize / 口语归一**

- 切片 = slice = layer = 层 = plane（UI「Slices」）  
- 点球 = 点 = sphere = company point（勿与「金环」混淆）  
- 环 = concentric ring（营收尺度）；金环 = supplier mark  
- 布局坐标 = 用户坐标 = 1类坐标 = 位置坐标 `(s, x, y)`  
- 环上坐标 = 2类坐标 = 相对坐标 `ringCos` / `ringSin`  
- 法人坐标 = legal entity coordinate = 3类坐标 `legalEntityCoord`  
- 右 = +x；左 = −x；上 = +y；下 = −y；前 = +s；后 = −s  
- 电力端 = 后 = −s（小 s）；模型端 = 前 = +s（大 s）。勿把电力叫「左」

---

## 2. Coordinate system / 坐标系

| ID | EN | 中 | Rule / 约定 |
|----|----|----|-------------|
| **C-USER-AXES** | user axes `(s, x, y)` | 用户轴 | Product language. Tuple order is **s, then x, then y**. **Not** raw Three.js XYZ. |
| **C-DIR** | direction names | 方向指称 | **右=+x，左=−x，上=+y，下=−y，前=+s，后=−s**。口语「左」不得指电力端或 −s。 |
| **C-AXIS-S** | **s** (slice axis) | **s** 轴（切片轴） | Front / back. **+s** front, **−s** back. **1 s-unit = one slice gap** (`gapNow()`). Layer index `i` ⇒ **s = i**. Power is back (small s); models are front (large s). Three.js **+X**. |
| **C-AXIS-Y** | **y** | **y** 轴 | Up / down on the face. **+y** up, **−y** down. **1 y-unit = `FACE`**. Face spans **y∈[0,1]**. Three.js **+Y**. |
| **C-AXIS-X** | **x** | **x** 轴 | Right / left on the face. **+x** right, **−x** left. **1 x-unit = `FACE`**. Face spans **x∈[0,1]**. Three.js **−Z** via `USER_X_SIGN = -1`. |
| **C-ORIGIN** | user origin | 用户原点 | Corner **(s, x, y)=(0, 0, 0)**. Three: `(−halfStack, −FACE/2, +FACE/2)`. |
| **C-MAP** | user → Three | 用户→引擎映射 | `coordToLocal` / `userToWorld`: `X += s·gap`, `Y += y·FACE`, `Z += USER_X_SIGN·x·FACE`, then `root.localToWorld` (honors Q/E yaw). |
| **C-COORD** | position coordinate | 1类坐标 / 位置坐标 | User `(s, x, y)`. The only placement in the cube. `x` and `y` mean only this pair. A focused slice stays; `sliceAnchor` shifts the rest along **−x**. Company `coord` is the face position. |
| **C-COORD-2** | relative coordinate | 2类坐标 / 相对坐标 | Ring placement `ringCos` / `ringSin`. Not called `x` or `y`. `companyCoord` projects them into 位置坐标. |
| **C-COORD-3** | legal entity coordinate | 3类坐标 / 法人坐标 | One per legal entity. Format `00-00-00-00-00-00-0000`, Bloomberg BICS. Field `legalEntityCoord` is empty until filled. Library: `3类坐标库/BICS Classification/`. Not a position, not drawn. |

```
User (s, x, y)   Three.js (under root)
─────────────────────────────────────
+s  (ice)        +X
+y  (steel)      +Y
+x  (ring blue)  −Z  (USER_X_SIGN = -1)
```

Position changes go through `ai-chain/web/js/coords.js` (`LAYOUT`, or an object's `{s, x, y}`). Scene code calls `applyCoord` / `applySliceCoord`.

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
| **C-DIM** | off-focus fade | 离焦淡出 | — | Non-focus slices fade to opacity 0 and must stay `transparent`. Focus cleared restores the resting opacity. |
| **C-FILTER** | filter mode | 过滤 | `state.filterMode` | `all` / `us` / `intl` / `supply`. |
| **C-EXPLODE** | explode spacing | 爆炸间距 | `state.exploded` | Extra gap between slices. |

**Esc hierarchy / Esc 分层** `[C-ESC]`  
1) clear **select** → 2) clear **focus** → keep camera.

---

## 4. Actions / 动作

| ID | EN | 中 | What happens / 效果 | Code |
|----|----|----|---------------------|------|
| **C-PULL** | cube exit | 抽出 | Focused slice stays at its **s** and **x∈[0,1]**. The rest of the cube shifts together along **−x** (left) by `cubeExitX()` (one face) and fades out. | `lerpPullOut`, `sliceAnchor`, `cubeExitX` |
| **C-RETRACT** | retract | 抽回 | Focus cleared; the cube eases back along **+x** to each slice's face and fades in. **Camera must not auto-yaw toward origin.** | `focusSlice` toggle / `clearFocus` |
| **C-PULL-ZONE** | pull-frame hit zone | 抽出点击区 | Square∖disk on slice face: inside 1×1 square, **outside** outermost concentric ring. Misses inside the ring do **not** toggle focus. Tested in user `(s, x, y)`. | `isPullFrameHit`, `LAYOUT.ringRadius` |
| **C-FOCUS-ACT** | focus slice | 聚焦切片 | Set `focusLayer`; the slice stays, the cube exits. Via plane click, layer list, or `[` `]`. | `focusSlice` |
| **C-PICK** | pick company | 点选公司 | Raycast sphere → select + focus its layer. Plane toggle only if hit is in **C-PULL-ZONE**. | `pick`, `selectCompany` |
| **C-STDVIEW** | standard view | 标准视角 | Snap camera to canonical pose for current focus state. Hotkey **C** / button / middle-click. | `goStandardView`, `standardPose` |
| **C-RESET** | reset view | 重置 | Clear focus/select; go standard overview pose. | `resetCamera` |

**Camera rule / 相机约定** `[C-CAM-HOLD]`  
Changing or clearing slice focus **must not** animate orbit target into the cube interior. Only **C-STDVIEW** / **C-RESET** / explicit pick framing may move the camera.

---

## 5. Standard view poses / 标准视角位姿 `[C-STDVIEW]`

User coordinates `(s, x, y)`. Looking direction via OrbitControls `target`. Numbers live in `LAYOUT.camera`.

| Mode | Camera `(s, x, y)` | Look-at | 中文说明 |
|------|--------------------|---------|----------|
| **Focused** (`focusLayer = s*`) | `(s* + 10, 0.5, 0.5)` | `(s*, 0.5, 0.5)` (from **+s** / front) | 从前方正对留在原地的面心（x=0.5） |
| **Overview** (no focus) | `(24, 2.1, 2.1)` | user origin `(0, 0, 0)` | 未聚焦总览 |

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
| **?** | help overlay | — |
| Click slice **frame** (square∖ring) | focus/toggle that slice | **C-FOCUS-ACT** / **C-PULL-ZONE** |
| Double-click empty | clear focus | **C-RETRACT** path |
| Click company point | select | **C-PICK** |

---

## 7. Data concepts / 数据概念

| ID | EN | 中 | Notes |
|----|----|----|-------|
| **C-LAYER-DATA** | layer record | 层数据 | `layers.json` / API; order 0 Power → 10 Models |
| **C-COMPANY** | company record | 公司 | `revBn`, `revScore`, `ring`, `ringCos`, `ringSin`, `country`, optional `valueM`, implicit `legalEntityCoord` (empty) |
| **C-US / C-INTL** | US / non-US | 美 / 非美 | Colors cyan / orange (`#3cf0ff` / `#ffb020`) |
| **C-BUNDLE** | API bundle | 启动包 | `GET /api/bundle` bootstraps SPA |
| **C-RING-SCORE** | ring score | 环分数 | Per-slice min–max → 0–100; **100 = exact center** |

---

## 8. Symbol map / 符号对照（代码）

| Symbol | Concept ID | Note |
|--------|------------|------|
| `state.focusLayer` | C-FOCUS | `null` = overview |
| `state.selectedId` | C-SELECT | |
| `cubeExitX()` | C-PULL | one face width along **−x** (left) |
| `USER_X_SIGN` | C-AXIS-X | `-1` |
| `FACE` | C-AXIS-X/Y unit | face edge length in Three units |
| `gapNow()` / `GAP` | C-AXIS-S unit | |
| `coordToLocal` / `userToWorld` | C-MAP | argument is `{s, x, y}` |
| `applyCoord` / `applySliceCoord` | C-COORD | only placement API in the scene |
| `company.coord` | C-COORD | unpulled 位置坐标 `(s, x, y)` |
| `ringCos` / `ringSin` | C-COORD-2 | 相对坐标；`companyCoord` 投影成位置坐标 |
| `legalEntityCoord` | C-COORD-3 | 法人坐标；格式 `00-00-00-00-00-00-0000`；待填 |
| `standardPose` / `goStandardView` | C-STDVIEW | |
| `focusSlice` / `clearFocus` | C-FOCUS-ACT / C-ESC | |
| `lerpPullOut` | C-PULL / C-RETRACT | easing only; no camera |
| `isSlicePlane` | C-SLICE | pick target for plane click |

---

## 9. Frozen rules / 冻结约定（续做勿回退）

1. 1类坐标 / 位置坐标 is **`(s, x, y)`**, not raw Three XYZ. `x` and `y` mean only this. Move things by editing coordinates in `coords.js`. 2类坐标 / 相对坐标 is `ringCos` / `ringSin`. 3类坐标 / 法人坐标 is `legalEntityCoord`（`00-00-00-00-00-00-0000`，待填），不参与摆放。  
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
| `web/js/state.js` | Shared state |
| `web/js/ui.js` | Panels / status / buttons |

**One-liner resume / 一句话续工**  
立方体 = 沿 **s** 堆的 **切片**；位置一律 **(s, x, y)**；右=+x 左=−x 上=+y 下=−y 前=+s 后=−s；焦点切片不动，离焦立方体沿 **−x** 左移淡出；**C** = 标准视角；切层/抽回不扭相机。

---

*Last updated: 2026-10-02 · Coordinates are `(s, x, y)` in `web/js/coords.js`. Keep in sync with `LAYOUT.camera` and hotkeys in `scene.js`.*
