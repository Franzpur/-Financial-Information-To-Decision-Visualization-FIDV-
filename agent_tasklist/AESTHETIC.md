# SFC 美学真源（美工部）

美工部判断网页与启动表层美学时，只以本文为准。产品是否服务金融决策，以 `DESIGN.md` 为准（理念贯彻属；终裁为监理部三监报告）。概念与坐标以 `Ind-Chain/CONCEPTS.md` 为准。

目标：把已落地的美学语言写成可复用真源，并在后续功能与分页中**延展同一语言**，不每页另起一套皮。

**简洁是视觉第一要务**（与 DESIGN 一致）：能用色、透明、一字标说清的，不加第二套装饰系统。业主明示的时长（如 splash hold / fade）写入本文后，美工部不得以「简洁」擅自缩短。

---

## 1. 已运用的美学语言

### 色板

| Token | 值 | 用途 |
|-------|-----|------|
| `--bg` | `#0b0d10` | 全幅工程底、开屏底 |
| `--panel` | `#14181e` | 遗留实心面板参考（新 chrome 优先玻璃） |
| `--stroke` | `#2a313c` | 细边 |
| `--text` | `#e8edf4` | 主字 |
| `--muted` | `#9aa6b5` | 次字 |
| `--accent` | `#8be0c0` | 强调、激活 chip、字标下划线 |
| `--us` / `--intl` | `#3cf0ff` / `#ffb020` | **数据语义色**（概念归属 CONCEPTS；美工部不单方面改） |
| `--glass` | `rgba(11,13,16,0.32)` | 浮层 |
| `--glass-strong` | `rgba(11,13,16,0.55)` | 搜索 / 帮助等稍实浮层 |

禁止默认滑向：紫靛渐变主题、暖奶油底+衬线+陶土强调、报纸密栏；避免无必要 glow 堆叠与圆角胶囊滥用（chip 已有形态可沿用）。

### 构图

- **立方体全幅**：`#viewport` 吃满窗口；无左右实心导航栏。
- **浮动 chrome**：搜索置顶、详情右浮、HUD 底浮；玻璃 + 轻 `backdrop-filter`；空白处 pointer-events 透给 canvas。
- **帮助默认关**：`?` 打开，不常驻挡视野。

### Logo 标准（业主说「logo」即按此开发）

产品 splash / home 左标矢量真源：`Ind-Chain/web/index.html` 内 `.splash-logo` 三框。纸面同族反相：`library/showable-report/assets/sfc-logo-frames-paper.svg`（封面 `SFC-plan-cover.html` 已对齐）。

**理念一句话：** 层次感来自三枚竖向圆角矩形**错位相套** + **递减透明度**（前实后虚），不是左右并排实心色块。

| 量 | 值 | 说明 |
|----|-----|------|
| 单框 | `width=18` `height=44` `rx=1.5` | 竖向圆角矩形；宽高比勿改 |
| 起始 x | `8` / `22` / `36` | 步距 **14**；勿改步距或错位量 |
| 纵位 | `y=14`（三框同 y） | 与 splash `viewBox="0 0 280 72"` 对齐 |
| opacity | `0.95` / `0.55` / `0.28` | 前→后递减；fill=`none` |
| stroke | `stroke-width≈1.25`，`stroke-linejoin=round` | 描边框，非填充块 |

**明暗两用色**

| 面 | stroke | 底 |
|----|--------|-----|
| 暗底（产品 splash / home / 启动图标族） | `#e8edf4`（`--text` 族） | 工程 `--bg` 或同族暗底 |
| 纸面反相 | `#1a1f26`（纸面 `--ink`） | 与纸同色透明；矢量直绘 |

**组与露出**

- 可与右侧 **SFC** 衬线字标（Iowan / Palatino / Georgia 栈）+ `--accent` 底线同组（splash / home）。
- **单独露出**时只保留三框（纸面封面、仅标露出等），不另起第二套皮。
- 启动图标 `Ind-Chain/assets/sfc-launcher*` 同族；纸面只用同族反相矢量。

**禁止**

- 勿改步距 **14**、单框 **18×44**、`rx=1.5`，或把相套错位改成并排色块。
- 勿用低分辨率反色位图放大当纸面 / 印刷源；纸面从矢量按上表反相 stroke。
- 勿另起第二套 logo 几何或吉祥物替代三框。

### 字标与开屏（C-SPLASH）

- 居中 **SFC** 字标 + 左侧 **Logo 标准**三框 + accent 细线（几何见上节；现稿勿擅自改形）。
- 入场：约 **0.4s** 轻淡入（`splash-in`）。
- **仅挂在工程首页 `/`（C-HOME）**：清晰态维持约 **2s**，再 **约 4s** opacity 淡出（JS fade fallback **4200ms**）。开屏期实心 `--bg` 盖住门厅，避免与 `.home-logo` 双标叠影；淡出后再露格阵。`?bics=` 下钻不重播。
- **进 `/cube`（含分类入口）不播开屏。**
- 无转圈、无 Loading 长文案、不画视空间球。

### 启动图标与原生壳面板

- 暗底上 **Logo 标准**三框同族 + accent 细线（与 splash 左标同族，非另皮）。
- 源与产物：`Ind-Chain/assets/sfc-launcher-1024.png`、`sfc-launcher.icns`。
- 施加：`Ind-Chain/scripts/set-command-icon.sh` → 根 `Standard-Financial-Charting.app/Contents/Resources/AppIcon.icns`（访达双击 `.app`，无 Terminal）。
- 原 tkinter 启动窗已于 P4 退役；色板见上（BG `#0b0d10`、MUTED `#9aa6b5` 等），原生壳错误面板与窗背景沿用同一板（`Ind-Chain/shell/ErrorPanel.swift`）。

### 工程首页（C-HOME）

- `/`：BICS L1–L3 同一门厅。先 **C-SPLASH**（仅冷进 `/`），再字标同族 + **固定左上**坐标痕迹（`.home-trail-fixed`，`top:14px; left:20px`；钻入不挪位）+ 一枚玻璃直角 **上市地下拉**（关闭面当前国名+角标数；打开后最上搜索、下列 All/各国+角标数）+ 页级公司总数（控件外 muted 一行）+ **相连规则矩形格**（格右上角收录数；格底行业坐标 **只画 4 段** muted tabular，不因变短改字号）。`--accent` 只用于 hover/focus 与字标下划线。无底栏 chip CTA。无新闻。
- **定位输入贯穿 L1–L3**：字标 / lede 下一条细边输入，复用 `.list-filter`（`#homeLocate`，placeholder「Name or ticker」），不搬立方体 `.top-search`。同页下钻 L2/L3 仍留在页眉。框下 `#homeLocateResults` 以 `.home-locate` 为定位包含块**绝对定位**盖住下方门厅，不占文档流（`.home-nations`、`#homeTotal`、`#sectorList` 不因提示下移）。有命中与空态都覆盖：多名命中为 `--panel` 底上的共边细线行（`.home-locate-row`，不限元素类型；与上市地打开面同底，避免门厅字透出），一行公司名 `--text`、ticker 与四段行业坐标 `--muted` tabular；空态只留一条 `.home-locate-empty`（「No matching company.」）。有命中时容器内只放行。键盘当前项 `.home-locate-row.is-on` 与 hover / `:focus-visible` 同用 `--glass-strong` 底与 accent 内描边（描边内收，不撑开行高、不把下层格下推）。无第二套色、无圆角胶囊。冷开屏仍整幅盖住门厅。
- **L4 格进 `/list?bics=`（C-LIST）**，不再下钻 L5–L7，也不因该格是叶而进立方体。浅于 L4 的叶仍可 `/cube?bics=`。
- `/cube`：决策立方体冷启动，**无** splash。

### 四级名单（C-LIST）

- `/list?bics=`：门厅同族（`home-body`、字标、`.home-trail-fixed`、上市地下拉），**无开屏**。名/ticker 筛（`.list-filter`）与国别搜索分属两控件。
- 公司为细线行表（共边 1px `--stroke`，无胶囊）。一行一企。名 `--text`；ticker / 坐标 / 主业 L1 占比 `--muted` tabular。其他一级 + % 用名下 muted 字链（` · `），无 chip。窄屏旁注仍跟在名下。
- 筛名/ticker：trail 下一条细边输入，不搬立方体顶栏搜索皮。
- 表上右对齐一枚直角细边按钮 `#listSortRev`，可见文案 **Revenue**（收入序的外观控件）。玻璃底、`--stroke` 边、`--muted` 字；hover / `:focus-visible` 转为 `--glass-strong` 与 accent 内描边。非 chip、无页眉玻璃链、无页底第二条。
- 空态一条 muted 短句。
- 进立方体只靠名单行（点公司）；无页眉玻璃链、无页底第二条、非 chip 条。

---

## 2. 延展原则（新功能 / 新分页）

1. **先复用 token**：新面只用上表 CSS 变量，不引入第二套色名。
2. **浮于工程区**：新面板默认玻璃浮层，不恢复实心双栏。
3. **一字标族**：品牌露出用 **Logo 标准**三框（可加 SFC 字标 + accent 底线）；不另做吉祥物、不另起第二套皮。
4. **动效克制**：以 opacity / 轻微 scale 为主；不为装饰加粒子或 3D logo。
5. **语义色不动**：US / 非美 / 环导读色变更须同时过 CONCEPTS，不单走美工部。

---

## 3. 管辖路径（专知 = 改码权）

美工部在派用或业主电美工部且任务明确实现时，**可直接改**下表路径之**视觉层**（权知统一，见仓根 `POWER-KNOWLEDGE.md`）。表外与「不独占」行仍无写权；一行同时碰语义行为则交父代理。

| 资产 | 路径 |
|------|------|
| 色板 / chrome / 首页 | `Ind-Chain/web/css/app.css`；`Ind-Chain/web/index.html`（C-HOME + C-SPLASH）；`Ind-Chain/web/js/home.js` |
| 四级名单 | `Ind-Chain/web/list.html`；`Ind-Chain/web/js/list.js` |
| 立方体壳 | `Ind-Chain/web/cube.html`（C-CUBE；无 splash） |
| splash 时序 | `Ind-Chain/web/js/home.js`（hold ~2s → fade ~4s） |
| 面板类名与 HUD 外观 | `Ind-Chain/web/js/ui.js`（视觉层） |
| 启动图标 | `Ind-Chain/assets/sfc-launcher*` |
| 图标脚本 | `Ind-Chain/scripts/set-command-icon.sh` |
| 启动器附着面 | 根 `Standard-Financial-Charting.app` 图标资源；原生壳错误面板色板（沿用本文，`Ind-Chain/shell/ErrorPanel.swift`） |
| Logo 几何真源 | `Ind-Chain/web/index.html`（`.splash-logo` 三框）；纸面同族 `library/showable-report/assets/sfc-logo-frames-paper.svg`（秘书纸面附着；几何以本文 Logo 标准为准） |
| 概念续工指针 | `Ind-Chain/CONCEPTS.md` §10（美学细节回指本文） |

**不独占：** `coords.js`、抽出/焦点几何、`scene.js` 中服务坐标可读性的材质逻辑；启动器进程与端口逻辑。

---

## 4. 与其它角色

| 角色 | 关系 |
|------|------|
| 监理部 | 有代码改动时由父代理送三监报告终裁；理念标准仍是 DESIGN；美工部不写「通过/打回」 |
| 总参谋部 | 可在规划中调度美工部；业主安排下可规划管理美工部角色文件；专知路径内美工部可改码；跨域交父代理；产品终裁仍归监理部 |
| 书记 | 美工部不写 worklog |

*Last updated: 2026-10-13 · Logo 标准写入：三框错位相套比例与明暗两用；权知统一：专知路径内可改码。*
