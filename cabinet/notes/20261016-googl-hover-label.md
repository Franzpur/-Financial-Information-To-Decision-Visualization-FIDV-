# 旁注 · 悬停卡只在悬停时显示 + 白球公司名框（2026-10-16）

**对应令** `cabinet/orders/GS-20261016-GOOGL-HOVER-LABEL.md`（Map 周期第 5 次 / 至多 5，末次；谏言「不发问」）  
**业主原话** 「光标不浮于其上时，就不要显示悬停列表了，现在会显示一条，不用显示；另外，现在壳上的公司代码就不要那么写了，在球心正上方0.5个单位，与x平行的方向上，弄一个和悬停列表类似的框，里面写上公司名，比如alphabet inc-a。」

## 1. 病因（读码）

| 业主所见 | 来源 |
|----------|------|
| 光标离开后仍有一条卡 | `scene.js` `updateGooglFileCard`：`c = hover GOOGL ? hover : sel GOOGL ? sel : null`。选中分支让卡在「仅选中」时仍出现，`listAll=false` 只列活动行。前令 T3-3 当时是有意保留，业主现在不要 |
| 壳上「公司代码」描边字 | `makeCompanyLabelTexture`：白字 + 青 / 琥珀描边，`shortName` 18 字截断，位置 `base.y + (r + 0.12 m)/UNIT`，是 chain 时代的字标，被白球沿用。业主口中的「公司代码」指这条名字标 |

标签平面本来就是含 x、y 的竖面（`makeSliceTextPlane` 的 `rotation.y = π/2`，法线 +s，长边沿用户 x，不 billboard）。**取向本来对，要改的是位置、皮、文案。**

## 2. 拍板要点与理由

1. **仅悬停**：删 `sel` 分支，卡永远列全部，`listAll` 参数整个删掉。点击轮转不动（点击时光标仍在球上，卡即时换活动行）。
2. **0.5 UNIT 怎么读**：球半径正好 0.5 UNIT。若按「框中心」放，框盖住半个球；按「框下边中点」放，框下沿与球顶相切，且是「球心正上方 0.5 单位」最自然的读法。**取下边中点。**若业主要框中心，只改一个常量与 `translate`。
3. **与 x 平行**：平面含 x、y，法线 +s，立式；不 billboard。相机从 +s 侧看（标准 / 总览视图皆是），字自左向右读。代价：转到 −s 侧字镜像、正俯视成一条线——「与 x 平行」的必然，本令不补救。
4. **框面**：直接复用悬停卡的 token（`rgba(11,13,16,0.72)` 底、1px `#e8edf4` 线框、`#e8edf4` 600 18px sans 字）。世界尺寸用悬停卡同一像素比例（512 px = 6 UNIT），高约 0.42 UNIT，宽随字。不引入 US / INTL 色。
5. **文案规则（写死）**：`name` 去多余空白后全小写，≤28 字，超出取 27 字 + `…`；不拼 ticker。例 `ALPHABET INC-A` → `alphabet inc-a`。只在前端规整，不改服务端 `name`。
6. **范围**：`usesWhiteSpheres()` 一律新框（demo + shell）。理由：同一种白球在两种页面里读法一致；chain 的盘 + 环是另一种符号，标签不动。
7. **球放大遮挡**：悬停 / 选中时球 1.5× 放大，球顶越过框下沿约 0.25 UNIT。放大期间该球标签切 `depthTest:false`、`renderOrder 31`，下沿不被遮，也压在引线之上。
8. **引线穿框**：GOOGL 悬停时引线第一段沿 +y 穿过框（框占 +0.5 ~ +0.92 UNIT）。**引线不改**，框压在线上，看起来像线穿名牌。若难看，只能在本令内由主代理返工或业主另开周期。
9. **不动 `coords.js`**：新常量与 `whiteLabelCoord` 写在 `scene.js` 局部区，chain 仍用 `companyLabelCoord`。省一次 `coords.js?v=` 连带升级。`scene.js?v=` 升 76。

## 3. 须业主知悉的取舍

- 悬停放大时框不跟升，球顶压住框下沿（靠 `depthTest:false` 让框盖在球上）。
- 背视 / 俯视看框会镜像或成线。
- 本令是本周期**第 5 次（末次）**：之后内阁不能再令，要继续得业主另告次数或重开周期。

## 4. 机检与取证

- `rg -n "listAll" Ind-Chain/web/js/scene.js` 应无命中。
- `rg -n "f7f5f0|1a1f26|4a5560|c5ccd4|efeae4|ece8e0" Ind-Chain/web/js/scene.js` 在卡与框代码区无命中。
- `python3 Ind-Chain/scripts/check_map_purity.py`。
- 浏览器：shell 页悬停 / 移开 / 点击 / 移开 GOOGL；demo 一张；NVDA chain 一张（应与现状一致）。图存 `cabinet/notes/googl-hover-evidence/`，前缀 `label-`。
- 控制台量框位：`label.position.y − mesh.position.y = 0.5·UNIT`（局部，容差 ±1%）。
