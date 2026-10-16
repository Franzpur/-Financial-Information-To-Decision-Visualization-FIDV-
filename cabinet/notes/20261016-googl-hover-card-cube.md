# 旁注 · GOOGL 悬停卡改 cube 审美 + 折线引线（2026-10-16）

**对应令** `cabinet/orders/GS-20261016-GOOGL-HOVER-CARD.md`（Map 周期第 4 次 / 至多 5；谏言「不发问」）  
**业主原话** 「这个悬停列表应当由球心伸出一个长约5单位的折线与之连接，另外，这个列表应当遵循cube审美而不是平面映射审美，保持暗色调和亮线框。」

## 1. 病因（内阁读码）

`Ind-Chain/web/js/scene.js` 的 `makeGooglCardTexture`（L1113 起）用的是 `plot-paper.css` 的纸面五档色（底 `rgba(247,245,240,.96)`、字 `#1a1f26` / `#4a5560`、活动行 `rgba(26,31,38,.08)`）。纸面皮是业主令定的**可导出平面映射图预览**专用（AESTHETIC「C-SKIN-PAPER」），本应限于 `.pm-skin-paper` 内；B1 实施时把同一套色顺手画进了 3D 场景浮层，才有截图里的浅灰米色卡。  
`updateGooglFileCard`（L1174 起）把卡放在 `球心 + r·1.6 + 卡高·0.55`，即**球正上方紧贴**；函数内**没有任何画线**。截图里的竖线来源须由主代理查明（令 V7）。

## 2. 默认拍板（要点）

- **折线**：两段、一拐点；球心 → 沿根局部 +y **3 UNIT** → 屏幕平面 45° 右上 **2 UNIT**，**总长 5 UNIT 自球心量**。球偏右（NDC x>0.40）镜像向左，±0.05 滞回。
- **为何这样折**：第一段沿 +y 是用户坐标的「上」，与卡原本在球上方的位置一致，也不与 C-REV-LINK 沿 s / x 的连线混；第二段取屏幕平面，因为卡是 billboard，末端必须稳落卡角；45° 与 AESTHETIC 字标「内拐角 45°」同族。
- **卡**：`--glass-strong` 暗底 + 1px `--text` 亮线框 + 直角；字 `--text` / `--muted`；`--accent` 只点睛（标题下细线、活动行竖条）。**不用** `--us` / `--intl`。
- **美学归属**：复用既有 token，**不开新皮、不改 AESTHETIC token、不调度美工部**。但 AESTHETIC 缺一条「场景内浮层禁纸面皮」，建议父代理记一条（令文已写原句）。
- **行为全保**：悬停列全部、点击轮转、仅选中列一行、billboard、NVDA chain 不动。
- **已知取舍（须业主知悉）**：卡和引线**不可拾取**（既有行为）；卡现在离球约 5 UNIT，鼠标要停在球上卡才在，移到卡上就消失。若业主想让卡可停留 / 可点，另令。

## 3. 色值对照（canvas 字面色 ← token）

| 用途 | 值 | token |
|------|-----|-------|
| 卡底 | `rgba(11,13,16,0.55)`（可提到 ≤0.72，须写实测理由） | `--glass-strong` |
| 外框 / 引线 / 主字 | `#e8edf4` | `--text` |
| 次字 / 路径 | `#9aa6b5` | `--muted` |
| 点睛 | `#8be0c0` | `--accent` |
| 可选分隔 | `#2a313c` | `--stroke` |

禁用（纸面六档）：`#f7f5f0` `#1a1f26` `#4a5560` `#c5ccd4` `#efeae4` `#ece8e0`。

## 4. 可复现取证

- 开 demo / shell 的 `/cube`，悬停 GOOGL 白球 → 截图存 `cabinet/notes/googl-hover-evidence/`（令 V1–V5）。
- 机检：`rg -n "f7f5f0|1a1f26|4a5560|c5ccd4|efeae4|ece8e0" Ind-Chain/web/js/scene.js` 在 GOOGL 卡代码区无命中；`python3 Ind-Chain/scripts/check_map_purity.py`。

## 5. 顺带

- `scene.js?v=` 现 `main.js` 为 74、`ui.js` 为 72，不一致；令文要求同步升 **75**。
- 模块图以 `modules/graph.json` 当前 **32 模块 / 45 边**为准，本期不动。
