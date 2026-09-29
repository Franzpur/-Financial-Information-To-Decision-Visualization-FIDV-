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
| 0 | Read [`DESIGN.md`](../DESIGN.md) before any design change | 改设计前先读仓库根目录的第一版设计理念 |
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
| **C-FINSLICE** | GOOGL financial slice | GOOGL 财务切片 | Sheet stays full slice size, hinged on the industry slice's **right edge** (pulled face, user **x = 2**). The **table** sits on that edge in the **upper half** — same user-x as the slice, not one unit behind. The year/quarter toggle is a small rounded square in the top-right corner. Cashflows from **2080** on fold into one bar (`2080+`). **Baseline** is 45° from **+s** toward **+x** (1s+1x). Bar outlines use the outer-ring stroke. No concentric rings on this sheet. Interest (cyan) on the baseline, principal (amber) above. | `buildFinanceSlice`, `state.googlBond` |
| **C-AXES** | user axes | 用户坐标轴 | **s/y/x** in ring-matched ice/steel blues from user origin | `rebuildAxes`, `axesGroup` |

**Synonyms to normalize / 口语归一**

- 切片 = slice = layer = 层 = plane（UI「Slices」）  
- 点球 = 点 = sphere = company point（勿与「金环」混淆）  
- 环 = concentric ring（营收尺度）；金环 = supplier mark  

---

## 2. Coordinate system / 坐标系

| ID | EN | 中 | Rule / 约定 |
|----|----|----|-------------|
| **C-USER-AXES** | user axes `(x,y,s)` | 用户轴 | Product language. **Not** raw Three.js XYZ. |
| **C-AXIS-S** | **s** (slice axis) | **s** 轴（切片轴） | Along stack. **1 s-unit = one slice gap** (`gapNow()`). Layer index `i` ⇒ **s\* = i**. Three.js **+X**. |
| **C-AXIS-Y** | **y** | **y** 轴 | Up the cube face. **1 y-unit = `PLANE_SIZE`**. Face spans **y∈[0,1]**. Three.js **+Y**. |
| **C-AXIS-X** | **x** | **x** 轴 | Into/out of cube face. **1 x-unit = `PLANE_SIZE`**. Face spans **x∈[0,1]**; pulled far edge **x=2**. Three.js **−Z** via `USER_X_SIGN = -1`. |
| **C-ORIGIN** | user origin | 用户原点 | Corner **(x,y,s)=(0,0,0)** = −x, −y, −s of the cube. Three: `(−halfStack, −PLANE_SIZE/2, +PLANE_SIZE/2)`. |
| **C-MAP** | user → Three | 用户→引擎映射 | `userToLocal` / `userToWorld`: `X += s·gap`, `Y += y·PLANE_SIZE`, `Z += USER_X_SIGN·x·PLANE_SIZE`, then `root.localToWorld` (honors Q/E yaw). |

```
User (x,y,s)     Three.js (under root)
─────────────────────────────────────
+s  (ice)        +X
+y  (steel)      +Y
+x  (ring blue)  −Z  (USER_X_SIGN = -1)
```

**Do not / 禁止**

- Do not call user-**x** “depth in Three +Z” without `USER_X_SIGN`.  
- Do not treat **s\*** as world meters; it is **layer index / gap units**.

---

## 3. States / 状态

| ID | EN | 中 | State field / 字段 | Behavior / 行为 |
|----|----|----|-------------------|-----------------|
| **C-FOCUS** | focused slice | 焦点切片 | `state.focusLayer = i \| null` | One slice active; others **dim**; focused may **pull**. |
| **C-SELECT** | selected company | 选中公司 | `state.selectedId` | Detail panel; stronger emissive. Esc clears this first. |
| **C-HOVER** | hover | 悬停 | `state.hoverId` | Tooltip only. |
| **C-DIM** | off-focus dim | 离焦变暗 | — | Non-focus slices/points lower opacity/emissive; dimmed materials must stay `transparent`. |
| **C-FILTER** | filter mode | 过滤 | `state.filterMode` | `all` / `us` / `intl` / `supply`. |
| **C-EXPLODE** | explode spacing | 爆炸间距 | `state.exploded` | Extra gap between slices. |

**Esc hierarchy / Esc 分层** `[C-ESC]`  
1) clear **select** → 2) clear **focus** → keep camera.

---

## 4. Actions / 动作

| ID | EN | 中 | What happens / 效果 | Code |
|----|----|----|---------------------|------|
| **C-PULL** | pull out | 抽出 | Focused slice translates along **+x** by one face (`PULL_OUT = PLANE_SIZE`): content moves **x∈[0,1] → [1,2]**. | `lerpPullOut`, `targetPull` |
| **C-RETRACT** | retract / pull back | 抽回 | Focus cleared or toggled off; slice returns to **x∈[0,1]**. **Camera must not auto-yaw toward origin.** | `focusSlice` toggle / `clearFocus` |
| **C-PULL-ZONE** | pull-frame hit zone | 抽出点击区 | Square∖disk on slice face: inside 1×1 square, **outside** outermost concentric ring. Misses inside the ring do **not** toggle focus. | `isPullFrameHit`, `RING_SPREAD` |
| **C-FOCUS-ACT** | focus slice | 聚焦切片 | Set `focusLayer`; apply dim + pull. Via plane click, layer list, or `[` `]`. | `focusSlice` |
| **C-PICK** | pick company | 点选公司 | Raycast sphere → select + focus its layer. Plane toggle only if hit is in **C-PULL-ZONE**. | `pick`, `selectCompany` |
| **C-FINOPEN** | open liability slice | 打开财务切片 | Pick ticker **GOOGL**. Sheet attaches to the focused slice's right edge and the camera turns to face it. Esc clears the sheet; camera holds. | `showFinanceSlice`, `startFinanceYaw` |
| **C-STDVIEW** | standard view | 标准视角 | Snap camera to canonical pose for current focus state. Hotkey **C** / button / middle-click. | `goStandardView`, `standardPose` |
| **C-RESET** | reset view | 重置 | Clear focus/select; go standard overview pose. | `resetCamera` |

**Camera rule / 相机约定** `[C-CAM-HOLD]`  
Changing or clearing slice focus **must not** animate orbit target into the cube interior. Only **C-STDVIEW** / **C-RESET** / explicit pick framing may move the camera.

---

## 5. Standard view poses / 标准视角位姿 `[C-STDVIEW]`

User coordinates. Looking direction via OrbitControls `target`.

| Mode | Camera `(x,y,s)` | Look-at | 中文说明 |
|------|------------------|---------|----------|
| **Pulled** (`focusLayer = s*`) | `(1.5, 0.5, s* + 10)` | `(1.5, 0.5, s*)` (−**s**) | 正对抽出切片中心（x=1.5） |
| **Overview** (no focus) | `(2.1, 2.1, 24)` | user origin `(0,0,0)` | 未抽出总览 |

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
| Click **GOOGL** point | liability sheet on the slice's right edge | **C-FINOPEN** |

---

## 7. Data concepts / 数据概念

| ID | EN | 中 | Notes |
|----|----|----|-------|
| **C-LAYER-DATA** | layer record | 层数据 | `layers.json` / API; order 0 Power → 10 Models |
| **C-COMPANY** | company record | 公司 | `revBn`, `revScore`, `ring`, `country`, optional `valueM` |
| **C-US / C-INTL** | US / non-US | 美 / 非美 | Colors cyan / orange (`#3cf0ff` / `#ffb020`) |
| **C-BUNDLE** | API bundle | 启动包 | `GET /api/bundle` bootstraps SPA |
| **C-RING-SCORE** | ring score | 环分数 | Per-slice min–max → 0–100; **100 = exact center** |

---

## 8. Symbol map / 符号对照（代码）

| Symbol | Concept ID | Note |
|--------|------------|------|
| `state.focusLayer` | C-FOCUS | `null` = overview |
| `state.selectedId` | C-SELECT | |
| `PULL_OUT` | C-PULL | `= PLANE_SIZE` |
| `USER_X_SIGN` | C-AXIS-X | `-1` |
| `PLANE_SIZE` | C-AXIS-X/Y unit | face edge length in Three units |
| `gapNow()` / `GAP` | C-AXIS-S unit | |
| `userToWorld` | C-MAP | |
| `standardPose` / `goStandardView` | C-STDVIEW | |
| `focusSlice` / `clearFocus` | C-FOCUS-ACT / C-ESC | |
| `lerpPullOut` | C-PULL / C-RETRACT | easing only; no camera |
| `isSlicePlane` | C-SLICE | pick target for plane click |

---

## 9. Frozen rules / 冻结约定（续做勿回退）

1. User language is **`(x,y,s)`**, not raw Three XYZ.  
2. Pull is along user **+x** only; never along **s**.  
3. Focus change / retract → **hold camera** (`C-CAM-HOLD`).  
4. Standard overview / pulled poses stay as §5 until explicitly revised.  
5. Dimmed points need `transparent: true` or opacity is ignored.  
6. Labels stay **coplanar** on the slice (no CSS2D billboard).  
7. Server owns ring layout; browser does not re-scale rings on filter.  
8. Default: **do not leave :8787 running** unless user asks.

---

## 10. Continuity pointers / 续工指针

| Doc | Role |
|-----|------|
| **This file** | Concept targets (agent-facing) |
| [`WORKLOG.md`](../WORKLOG.md) | Session asks/answers + history |
| [`README.md`](./README.md) | Run / API |
| `web/js/scene.js` | 3D + camera + pick (`[C-*]` tags) |
| `web/js/state.js` | Shared state |
| `web/js/ui.js` | Panels / status / buttons |

**One-liner resume / 一句话续工**  
立方体 = 沿 **s** 堆的 **切片**；点球在切片上；抽出沿 **x** 到 [1,2]；**C** = 标准视角；切层/抽回不扭相机。

---

*Last updated: 2026-09-27 · Keep in sync with `standardPose` and hotkeys in `scene.js`.*
