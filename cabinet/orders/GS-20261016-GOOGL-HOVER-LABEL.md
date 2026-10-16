# 内阁 → 总参谋部指令

**令号** GS-20261016-GOOGL-HOVER-LABEL  
**日期** 2026-10-16  
**本周期内阁下令计数** **第 5 次 / 至多 5**（沿 Map 周期：第 1 次 `DMAP-GOOGL-LADDER-Q`、第 2 次 `DMAP-UI-PAPER`、第 3 次 `MAP-EXPORT-SPHERE`、第 4 次 `GOOGL-HOVER-CARD`；本令承 4 令的返工，业主未另指定次数。**本令是本周期最后一次令**：三监后若仍有缺口，内阁不得再令，须业主重开周期或另告次数。谏言不计次）  
**本期** **悬停文件卡只在悬停时出现；白球公司名改为球心正上方 0.5 UNIT、长边与 x 平行的暗玻璃亮线框**  
**交** **总参谋部**（父代理须将本文**完整**转交 `general-staff` 立意志与任务单；产品码由主代理实施；实施后按既有规则送监理部，内阁不令监理部；内阁不改产品码）  
**来源** 业主 Purkniv 原话：「电内阁，已经不错了，但再改进一下，首先，光标不浮于其上时，就不要显示悬停列表了，现在会显示一条，不用显示；另外，现在壳上的公司代码就不要那么写了，在球心正上方0.5个单位，与x平行的方向上，弄一个和悬停列表类似的框，里面写上公司名，比如alphabet inc-a，现在就改成那种写法，ok？开始指挥。」  
**依据** `cabinet/AUTHORITY.md` · 前令 `GS-20261016-GOOGL-HOVER-CARD`（已落地：暗玻璃卡 + 5 UNIT 折线；该令 T3-3「仅选中显示一行」被本令 T1 撤销）· `agent_tasklist/AESTHETIC.md` §1 色板 · `Ind-Chain/CONCEPTS.md` C-POINT / C-LABEL / C-AXIS-X / C-AXIS-Y

---

## 谏言

**不发问。** 两处意志都清楚，Q 全部由内阁按合理默认拍板（见末表）。

---

## 现状（内阁读码所见；总参可抽检）

文件 `Ind-Chain/web/js/scene.js`（`main.js` / `ui.js` 以 `?v=75` 引入）：

| 位置 | 内容 |
|------|------|
| L1119 `makeGooglCardTexture(entries, activeIndex, listAll)` | 悬停（`listAll=true`）列全部；仅选中（`listAll=false`）列活动一行，标题 `GOOGL`。**业主说的「现在会显示一条」就是这条** |
| L1218–1257 `updateGooglFileCard` | `c = hover GOOGL ? hover : sel GOOGL ? sel : null`——**选中分支（`sel`）是病根**；缓存键 `${listAll}:${idx}:${n}` |
| L1090–1096 `selectCompany` | GOOGL 白球点击 `googlFileIndex=(i+1)%n`、`googlCardDirty=true`（**保留**） |
| L568 `usesWhiteSpheres()` 分支 | 白球 = `state.bundleMode !== "chain"`（demo + shell）；球半径 `UNIT/2` |
| L621–635 shell 公司（`useShellPlace`） | `makeSliceTextPlane(makeCompanyLabelTexture(shortName(c), isUS), 0.72, 0.14)` → `applyCoord(label, companyLabelCoord(coord, r, gapNow()))`，挂 `root` |
| L637–648 demo 公司（落在切片） | 同上，`applySliceCoord(...)`，挂 `planeGroups[layer]`，`visible=false` 由 `queueVisibilityTargets` 控 |
| L676 | `layoutPlanes` 内 shell 公司标签随 `d` 重摆（`companyLabelCoord`） |
| L692–704 | **仅 chain**（`revenueLinks` 非空）标签重摆，**不动** |
| L223–290 `wrapLabelLines` / `makeCompanyLabelTexture` / `shortName` | 描边白字 + 青 / 琥珀描边（US/INTL 色）；`shortName` 18 字截断。chain 继续用 |
| L295–303 `makeSliceTextPlane` | `PlaneGeometry` + `rotation.y = π/2`：**平面含 x 与 y，法线 +s，长边沿用户 x**，不 billboard——取向本来对，病在**位置、皮、文案** |
| `coords.js` L173 `companyLabelCoord` | `y = base.y + (半径 + 0.12 m)/UNIT`，`LAYOUT.companyLabel` = lift 0.02 m / above 0.12 m。**chain 仍用，不改** |

shell 的 `name` 来自 `server/db_shadow.py` `entity["name"]`（BICS 名，常为 `ALPHABET INC-A` 大写）；demo 来自 `data/companies.json`。**本令不改服务端与数据，只在前端渲染时规整。**

---

## 意志（一句）

**文件卡 + 引线只在光标悬停 GOOGL 球时出现，别的情形一概不画；demo / shell 每个白球正上方 0.5 UNIT 处立一块与悬停卡同皮（暗玻璃 + 亮线框）、长边平行用户 x、不转向相机的小框，框里是小写公司名（如 `alphabet inc-a`），取代原来的描边字标。**

---

## 任务（总参据此立任务单）

### T1　悬停门控（撤销「仅选中显示」）

1. `updateGooglFileCard` 改为：`c = hover && isGooglTicker(hover.ticker) ? hover : null`。**删除 `sel` 分支**；`c` 为空即 `mesh.visible=false`、`lead.visible=false` 并返回。
2. 卡永远列全部：`makeGooglCardTexture(entries, activeIndex)` **删去 `listAll` 参数**与「单行 / `GOOGL` 标题」分支；标题固定 `GOOGL files`。缓存键改 `${idx}:${entries.length}`。（删净，不留死分支。）
3. **点击轮转保留**：`selectCompany` 里 `googlFileIndex`、`googlCardDirty` **一字不动**；点击后光标仍在球上（`hoverId` 仍在）→ 卡即时刷新活动行；光标移开 → 卡消失；再悬停 → 活动行仍对。
4. `pointerleave` 清 `hoverId` 的既有逻辑不动（光标出画布卡亦消失）。
5. **范围不变**：仅 `usesWhiteSpheres()`；chain / NVDA 不画；非 GOOGL 球悬停无卡（既有）。
6. 引线（5 UNIT 折线）与卡**同显同隐**，即同样只在悬停时画；引线几何、折向镜像、滞回**不动**。

### T2　白球公司名框（demo + shell）

#### 2.1 位置：球心正上方 0.5 UNIT，框「下边中点」为锚

| 项 | 拍板 |
|----|------|
| 锚 | **球心沿根局部 +y（C-AXIS-Y 向上）0.5 UNIT 处 = 框的下边中点**。0.5 UNIT 恰为静止球的半径，框下沿即与球顶相切，框整体立在球上方。 **不取框中心**：取中心则框盖住半个球 |
| x 向 | 框**水平居中于球心的 x**（用户 x 坐标 = 球心 x）；s 向 = 球心 s + 既有 `LAYOUT.companyLabel.liftMeters / gap`（微前移 0.02 m，防 z-fight） |
| 悬停放大 | 球悬停 / 选中放大（约 1.5×）时，**框不跟着升**，位置仍按静止半径算；球顶会越过框下沿约 0.25 UNIT，**这是接受的取舍**，见 2.5 |
| 落点来源 | 全部用 `UNIT`，不写米数；在 `scene.js` 内写局部常量 `WHITE_LABEL_ABOVE_UNITS = 0.5` 与局部函数 `whiteLabelCoord(base, gap)`（返回 `{s: base.s + lift/g, x: base.x, y: base.y + WHITE_LABEL_ABOVE_UNITS}`）。**不改 `coords.js`**（chain 仍用 `companyLabelCoord`）；再无他处裸写 Three 坐标 |
| 几何 | 框平面 `PlaneGeometry(w, h)` 做 `geometry.translate(0, h/2, 0)`，使**原点在下边中点**；其余沿用 `makeSliceTextPlane` 的 `rotation.y = π/2`（见 2.3）。因此 `applyCoord / applySliceCoord` 传的就是锚点 |
| 重摆 | 三处位置赋值（L629、L642、L676）**凡白球一律换 `whiteLabelCoord`**；L692–704 的 chain 重摆不动。demo 的切片内标签沿用 `applySliceCoord` |

#### 2.2 框面（与悬停卡同皮；cube token；禁纸面皮）

新增 `makeWhiteLabelTexture(text)`，**画布 2× 设备像素**，与悬停卡同一套字面色：

| 面 | 值 | token |
|----|----|-------|
| 底 | `rgba(11, 13, 16, 0.72)` | `--glass-strong`（与悬停卡现值一致） |
| 外框 | 1 逻辑像素亮线框，`#e8edf4`，`globalAlpha 0.9`，**直角**，线贴画布外缘内 0.5px | `--text` |
| 字 | `#e8edf4`，`600 18px ui-sans-serif, system-ui, sans-serif`（**同悬停卡标题字号**），单行，水平 + 垂直居中 | `--text` |
| 无 | 无描边字、无 US / INTL 色、无点睛细线、无发光 / 阴影 / 渐变 / 圆角 | — |

- **世界尺寸**：用悬停卡同一像素比例，`k = 6·UNIT / 512`（卡逻辑宽 512 px = 6 UNIT）。逻辑高 **36 px**（字 18 + 上下各 9），逻辑宽 `W = max(72, ceil(measureText(text)) + 24)`；`w = W·k`、`h = 36·k`（≈ 0.42 UNIT）。`measureText` 在画布上下文设好字体后取。
- 材质：`MeshBasicMaterial({ map, transparent:true, depthWrite:false, toneMapped:false, side:THREE.DoubleSide })`；`tex.generateMipmaps` 开、`minFilter = LinearMipmapLinearFilter`、`anisotropy` 取渲染器上限一半（与悬停卡一致；渲染器在 `ctx` 上，建场景时已有）。
- **禁色**（沿 4 令）：`#f7f5f0`、`#1a1f26`、`#4a5560`、`#c5ccd4`、`#efeae4`、`#ece8e0`、`rgba(247,`、`rgba(26, 31`。
- **不新增 token，不改 `AESTHETIC.md` 色板。**

#### 2.3 取向（拍板）：**立式、法线 +s、长边 ∥ 用户 x、不 billboard**

- 框平面 = 含 **x 与 y** 的竖直面（Three.js 的 YZ 面），**法线朝 +s**，框的长边沿**用户 x 轴**（C-AXIS-X，+x → Three −Z）；沿用 `makeSliceTextPlane` 现有 `rotation.y = π/2`，**文字自左向右即 +x 方向**（标准视图与总览视图下相机在 +s 侧，读序正确）。
- **不进 billboard 循环**：`tick()` 只对 `revenueLinkObjs` 的 label 与 GOOGL 卡转向相机，白球标签**不加入**。
- 取舍写明（业主知悉）：相机转到 −s 侧或正俯视时，框会被背视 / 侧视（`DoubleSide`，背面字镜像，俯视成一条线）。**这是「与 x 平行」的必然，不加补救**；若业主觉得难读，再令加「背向淡出」之类，本令不做。
- **悬停 GOOGL 文件卡仍 billboard**（前令定，不动）。

#### 2.4 文案规则（写死）

```
labelText(c) = collapse-whitespace(String(c.name).trim()).toLowerCase()
if length > 28 : labelText = first 27 chars + "…"
```

- 例：`ALPHABET INC-A` → `alphabet inc-a`；`Alphabet / Google Cloud` → `alphabet / google cloud`；`NVIDIA` → `nvidia`。
- **用 `c.name`，不用 `shortName`**（旧的 18 字截断仅 chain 用）；**不拼 ticker**；shell 与 demo 同一规则。
- 不改服务端 / 数据源的 `name`（`entity["name"]` 仍大写）；规整只在这一个前端函数里。
- `toLowerCase()` 对中日韩无害；超 28 的 `…` 截断按 JS 字符计。

#### 2.5 叠放、遮挡与引线

- 框是**不可拾取**的（不进 `ctx.meshes`），拾取逻辑零 diff。
- 常态：`depthTest:true`（保持与别的球的遮挡关系），`renderOrder` 沿现行（`lit ? 10 : 4`，由 `queueVisibilityTargets` 管）。
- **球放大期间**（`mesh.userData.targetHoverScale > 1` ，即悬停或选中）：该球的标签**切到 `depthTest:false`、`renderOrder 31`**，这样放大的球顶不会遮住框下沿，且**压在 GOOGL 引线（renderOrder 29）之上**。放大结束（`queueVisibilityTargets` 重算时）恢复 `depthTest:true`、原 `renderOrder`。落点：`queueVisibilityTargets`（已逐球设 `label.renderOrder`，同处加一行材质开关即可）；`updateGooglFileCard` 不碰标签。
- **GOOGL 悬停时的几何关系**：引线第一段自球心沿 +y 上升 3 UNIT，必然穿过框（框占 +0.5 ~ +0.92 UNIT）。**拍板：引线不改、框压在引线上**（框底 0.72 不透明，线在框内被遮住，从框顶继续出现，读起来像「线穿过名牌」）。若三监 / 业主认为难看，以 FIX 另议，**本令不动引线**。
- 框的可见性沿既有：shell 随 `show`；demo 随 `lit && stay != null`；chain 不适用。**不新增显隐规则。**

#### 2.6 范围（拍板）：`usesWhiteSpheres()` 为真一律用新框

- **shell + demo 全部白球**用新框；**chain / NVDA 盘 + 环标签完全不动**（`makeCompanyLabelTexture`、`shortName`、`companyLabelCoord`、L692–704 保持原样）。
- 原因：同一个「白球」在 demo 与 shell 里应是同一种读法；只改 shell 会让 demo 与 shell 并排时标签两种皮。chain 的盘 + 环是另一种符号，标签沿现状。

### T3　既有行为不丢（逐项保）

1. 悬停 GOOGL：列全部文件（`googlFileEntries()`，公开包缺 `debt-ladder-googl.json` 时如现状）+ 5 UNIT 两段折线引线 + 镜像滞回，**皆在**。
2. 点击轮转 `googlFileIndex`、到底回首、活动行高亮随动。
3. 球仍是白球、直径 1 UNIT、悬停约 1.5×，不 billboard。
4. 卡、引线、框皆不可拾取；`pick` / `hover` / `selectCompany` 除 `googlFileIndex` 既有行外**零 diff**。
5. 非 GOOGL 球悬停无卡；NVDA chain 页：无白球、无卡、无引线、标签与现状**字节级一致**（`git diff` 不触其分支）。
6. 画布清晰度、`?v=` 之外的行为不改。

### T4　边界与文档

- **改动文件限定**：`Ind-Chain/web/js/scene.js`（主体）；`Ind-Chain/web/js/main.js` 与 `ui.js` 的 `scene.js?v=` **同步升到 76**（两处同值）；`Ind-Chain/CONCEPTS.md`。其它一律不改。
  - `coords.js`：**不改**（`WHITE_LABEL_ABOVE_UNITS` 与 `whiteLabelCoord` 写在 `scene.js` 局部常量区，紧邻 `GOOGL_LEADER_*`）。若实施中证明必须动 `coords.js`，先停下回报，并同步升其 `?v=51`（`scene.js` 与 `ui.js` 两处引入）。
- **不动**：`web/js/map/*`、`plot-paper.css`、`app.css`、`modules/**`（**32 模块 / 45 边**基线不变）、`DESIGN.md`、`AESTHETIC.md` token、服务端、数据。
- **CONCEPTS 回写（实施时一并做）**：
  1. **C-POINT**（L34）：把「GOOGL (demo/shell): hover lists googl-tagged file names …」改写为——*「GOOGL (demo/shell): the file page and its leader appear **only while the pointer is over the ball** (selected-but-not-hovered shows nothing); click still cycles the file ring; …（引线、暗玻璃句保留）」*，并补中文「仅悬停时出现；仅选中不显示」。
  2. **C-LABEL**（L37）补一行或一句：*「demo/shell white spheres: the company name sits in a cube dark-glass bright-frame box, bottom edge centred **0.5 UNIT** above the ball centre (+y), long edge parallel to user x (C-AXIS-X), normal +s, **not** billboard; text is the lower-cased name (≤28 chars, then `…`). chain keeps the outlined text label.」* 中文：白球公司名为暗玻璃亮线框，球心正上方 0.5 单位、长边 ∥ x、不转向相机；文案小写；chain 不变。
  3. 页脚 `Last updated` 改当日。
- **AESTHETIC 待记**（承前令未必已记）：若父代理尚未把「场景内浮层一律走 cube 暗玻璃 + 亮线框，禁纸面皮」加入 `AESTHETIC.md`，本回合顺手加；已加则回报写「已加」。不改任何 token。内阁不自写。
- **若实施中觉得必须开第三种皮**（渐变 / 圆角 / 新色 / 新字体），**立即停下回报，转美工部**。

---

## 验收（三监与内阁复核据此逐项打勾；每项须有可复现证据）

| # | 验收项 | 证据 |
|---|--------|------|
| **V1** | **悬停门控**：shell GOOGL 球，光标在球上 → 见文件卡 + 引线；**光标移出球 → 卡与引线立即消失**；**点击选中后光标移开 → 仍无卡、无一行卡**（本令核心） | 三张截图（悬停 / 移开 / 选中后移开），存 `cabinet/notes/googl-hover-evidence/`，文件名前缀 `label-`；主代理**自己看过**并写所见 |
| **V2** | **轮转仍对**：悬停 → 点击 → 移开 → 再悬停，活动行为下一个；到底回首 | 逐次截图或控制台读 `state.googlFileIndex` |
| **V3** | **残码清净**：`scene.js` 无 `listAll`、无 `sel` 分支驱动卡、无标题 `"GOOGL"` 单行分支 | `rg -n "listAll" Ind-Chain/web/js/scene.js` 无命中；贴 `updateGooglFileCard` 中 `c` 的赋值行 |
| **V4** | **框位**：shell 白球上方有一块框；下边中点在球心 +y **0.5 UNIT**（容差 ±1%）；框 x 居中于球心 | 控制台算 `label.position`（局部）− `mesh.position` 的 y 分量 = `0.5·UNIT`、x 分量 = 0；贴值 |
| **V5** | **取向**：框平面含 x 与 y、法线 +s；绕场景 orbit 时框**不转向相机**（对比 GOOGL 卡转向）；标准视图下字自左向右读 | 读 `label.quaternion` 恒等于 `rotation.y=π/2`；两张不同机位截图 |
| **V6** | **框面**：暗玻璃底、亮细线框、`--text` 字、直角、无描边字、无青 / 琥珀色；放大观察线框不糊 | 截图 + `rg -n "f7f5f0|1a1f26|4a5560|c5ccd4|efeae4|ece8e0|247, ?245|26, ?31" Ind-Chain/web/js/scene.js` 在 `makeWhiteLabelTexture` 与 GOOGL 卡区无命中 |
| **V7** | **文案**：shell GOOGL 显示 `alphabet inc-a`（若源名为 `ALPHABET INC-A`）；demo 随机三家为小写全名；长名 > 28 截 `…` | 截图 + 控制台列 `labelText` 样例 |
| **V8** | **范围**：demo + shell 皆新框；**NVDA chain 页标签、盘 + 环、引线、卡一律不变** | demo / shell / chain 三页截图；`git diff` 不触 L692–704 与 `makeCompanyLabelTexture` / `companyLabelCoord` |
| **V9** | **叠放**：球悬停放大时，框下沿不被球顶遮；GOOGL 悬停时引线穿框处被框压住；放开后恢复 | 截图 + 说明 `depthTest` / `renderOrder` 切换行号 |
| **V10** | **零溢出**：卡、引线、框不可拾取；`pick`/`hover` 零 diff；`plot-paper.css`、`app.css`、`coords.js`、`modules/**` 零 diff | `git diff --stat` + 逐 hunk |
| **V11** | **回归**：`python3 Ind-Chain/scripts/check_map_purity.py` 通过；`regress_all.sh`（或既有 selftest）不降；`scene.js?v=` 在 `main.js` / `ui.js` 同为 76 | 命令输出 |
| **V12** | **文档**：CONCEPTS C-POINT / C-LABEL 已补（中英）、`Last updated` 已改 | `rg` 输出 |

---

## 内阁拍板的默认（Q 已全部由内阁答复，不发问）

| 编号 | 问 | 默认 |
|------|----|------|
| **Q1** | 「选中非悬停」是否保留一行卡 | **一律不显示**；删 `sel` 分支与 `listAll=false` 路径 |
| **Q2** | 点击轮转 | 保留，不改 `selectCompany`；点击时光标在球上卡即时刷新 |
| **Q3** | 「球心正上方 0.5 单位」的框锚 | **框下边中点**在球心 +y 0.5 UNIT（球顶相切）；非框中心 |
| **Q4** | 「与 x 平行」 | 框**长边 ∥ 用户 x**；平面含 x、y，**法线 +s**，立式 |
| **Q5** | 是否 billboard | **否**（白球标签不转向）；GOOGL 悬停卡仍 billboard |
| **Q6** | 框面 | 暗玻璃 `rgba(11,13,16,0.72)` + 1px `#e8edf4` 亮线框 + 直角；字 `#e8edf4` 600 18px sans；无点睛色、无 US/INTL 色 |
| **Q7** | 框尺寸 | 与悬停卡同比例 `k = 6·UNIT/512`；高 36 逻辑 px（≈0.42 UNIT），宽随字（≥72 px），2× 画布 |
| **Q8** | 文案 | `name` 去多余空白、**全小写**、≤28 字否则 `27 字 + …`；不拼 ticker；shell / demo 同规则；不改服务端 name |
| **Q9** | 范围 | **`usesWhiteSpheres()` 一律新框**（shell + demo）；chain / NVDA 盘 + 环标签不动 |
| **Q10** | 球放大时遮挡 | 放大期间该球标签 `depthTest:false`、`renderOrder 31`，压住球顶与引线；放大结束恢复 |
| **Q11** | 引线穿框 | **引线不改**，框压在线上；难看另议 |
| **Q12** | 改 `coords.js`？ | **否**；常量与 `whiteLabelCoord` 在 `scene.js` 局部区 |
| **Q13** | `?v=` | `scene.js` 在 `main.js` / `ui.js` 同步升 **76** |
| **Q14** | 美工部 / AESTHETIC | 不调度；复用既有 token；「场景内浮层禁纸面皮」若未记则顺手记 |
| **Q15** | 周期计数 | **第 5 次 / 至多 5（末次）**；谏言不计次 |

---

## 不做

- 不改数据 / 服务端 / `googlFiles.js` 允许列表 / FE-API。
- 不动 `plot-paper.css`、`map/*`、`app.css`、`coords.js`、`modules/**`、`DESIGN.md`、`AESTHETIC.md` token。
- 不加动画 / 淡出 / 背向补救 / 第二块卡；不改白球本体、引线、chain 标签。
- 不令监理部 / 档案部 / 美工部 / 信息部 / 交叉整合部 / 参谋纪要官。

---

## 指挥安排（总参定夺）

```
内阁令（本文）→ 父代理转 general-staff（意志 + 任务单）
  → 主代理实施：T1 门控 → T2 框（makeWhiteLabelTexture / whiteLabelCoord / 三处换位 / 放大期开关）→ T3 回归 → T4 文档 + ?v=76
  → 浏览器取证（V1–V9，存 cabinet/notes/googl-hover-evidence/label-*）
  → 监理部（既有流程；内阁不令）
  → 书记
  ※ 本令为本周期末次令：三监有缺口时由主代理在同一令内返工，不再另发内阁令
```

**给监理部的提示（总参可写入任务单「后续」，内阁不令监理部）**：产品码仅 `scene.js`（GOOGL 卡门控 + 白球标签新函数 + 三处位置 + 放大期材质开关）+ 两处 `?v=` + `CONCEPTS.md`。`code-quality` 核：是否删净 `listAll` / `sel` 死分支、chain 分支零 diff、diff 是否收敛；`engineering-test` 须**真开 shell 页悬停 GOOGL、移开、点击、移开**取图，并开 demo 与 NVDA chain 各一张；`principle-compliance` 核：框是否复用既有 token、是否保持 C-AXIS-X / C-COORD（坐标经 `applyCoord`，不裸写 Three）、简洁。

---

## 当前模块清单与关系（基线；本期零改动；真源 `modules/graph.json`，**32 模块 / 45 边**；静态页 `modules/index.html`）

本期涉及模块仅 **FE-SCENE**（白球标签与 GOOGL 卡属其材质与几何；坐标语义仍归 FE-COORDONE，不改）。不增删模块或边。

---

## 交回（父代理在三监后回报内阁时须含）

1. 改动清单（逐路径）；确认 `plot-paper.css` / `app.css` / `coords.js` / `modules/**` 零 diff。
2. V1–V12 逐项结论与证据路径、每张截图所见。
3. 「引线穿框」实看效果一句；放大期遮挡处理实看一句。
4. `AESTHETIC.md`「场景内浮层禁纸面皮」：已加 / 待记。
5. 三监报告结论。
