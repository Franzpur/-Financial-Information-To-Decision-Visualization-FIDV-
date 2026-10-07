# FIDV 美学真源（美工部）

美工部判断网页与启动表层美学时，只以本文为准。产品是否服务金融决策，以 `DESIGN.md` 为准（理念贯彻属；终裁为监理部三监报告）。概念与坐标以 `ind-chain/CONCEPTS.md` 为准。

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

### 字标与开屏（C-SPLASH）

- 居中 **FIDV** 衬线字标（Iowan / Palatino / Georgia 栈）+ 左侧三片薄切片意象 + accent 细线。
- 入场：约 **0.4s** 轻淡入（`splash-in`）。
- **仅挂在工程首页 `/`（C-HOME）**：清晰态维持约 **2s**，再 **约 4s** opacity 淡出（JS fade fallback **4200ms**）。开屏期实心 `--bg` 盖住门厅，避免与 `.home-logo` 双标叠影；淡出后再露格阵。`?bics=` 下钻不重播。
- **进 `/cube`（含分类入口）不播开屏。**
- 无转圈、无 Loading 长文案、不画视空间球。

### 启动图标与集成启动窗

- 暗底上三片纵切片 + accent 细线，与 splash 左标同族。
- 源与产物：`ind-chain/assets/fidv-launcher-1024.png`、`fidv-launcher.icns`。
- 施加：`ind-chain/scripts/set-command-icon.sh` → 根 `Standard-Cube.app/Contents/Resources/AppIcon.icns`（访达双击 `.app`，无 Terminal）。
- **集成启动窗**（`ind-chain/scripts/launcher_gui.py`）：tkinter 小窗，色用同一板（BG `#0b0d10`、PANEL `#14181e`、STROKE `#2a313c`、TEXT `#e8edf4`、MUTED `#9aa6b5`、ACCENT `#8be0c0`）。标题 **Standard-Cube**，副标 `ind-chain`。按钮：**Open homepage** / **Restart** / **Quit**。命令跑在后端。

### 工程首页（C-HOME）

- `/`：BICS L1–L3 同一门厅。先 **C-SPLASH**（仅冷进 `/`），再字标同族 + **固定左上**坐标痕迹（`.home-trail-fixed`，`top:14px; left:20px`；钻入不挪位）+ 页眉一枚玻璃链 **Decision cube** + 一枚玻璃直角 **上市地下拉**（关闭面当前国名+角标数；打开后最上搜索、下列 All/各国+角标数）+ 页级公司总数（控件外 muted 一行）+ **相连规则矩形格**（格右上角收录数；格底行业坐标 **只画 4 段** muted tabular，不因变短改字号）。`--accent` 只用于 hover/focus 与字标下划线。无底栏 chip CTA。无新闻。
- **L4 格进 `/list?bics=`（C-LIST）**，不再下钻 L5–L7，也不因该格是叶而进立方体。浅于 L4 的叶仍可 `/cube?bics=`。
- `/cube`：决策立方体冷启动，**无** splash。

### 四级名单（C-LIST）

- `/list?bics=`：门厅同族（`home-body`、字标、`.home-trail-fixed`、上市地下拉），**无开屏**。名/ticker 筛（`.list-filter`）与国别搜索分属两控件。
- 公司为细线行表（共边 1px `--stroke`，无胶囊）。一行一企。名 `--text`；ticker / 坐标 / 主业 L1 占比 `--muted` tabular。其他一级 + % 用名下 muted 字链（` · `），无 chip。窄屏旁注仍跟在名下。
- 筛名/ticker：trail 下一条细边输入，不搬立方体顶栏搜索皮。
- 空态一条 muted 短句。
- 同一 L4 码保留进立方体：品牌头一枚玻璃链 **Decision cube** → `/cube?bics=`，与首页同一控件；无页底第二条、非 chip 条。

---

## 2. 延展原则（新功能 / 新分页）

1. **先复用 token**：新面只用上表 CSS 变量，不引入第二套色名。
2. **浮于工程区**：新面板默认玻璃浮层，不恢复实心双栏。
3. **一字标族**：品牌露出用 FIDV 字标或切片意象，不另做吉祥物。
4. **动效克制**：以 opacity / 轻微 scale 为主；不为装饰加粒子或 3D logo。
5. **语义色不动**：US / 非美 / 环导读色变更须同时过 CONCEPTS，不单走美工部。

---

## 3. 管辖路径（专知 = 改码权）

美工部在派用或业主电美工部且任务明确实现时，**可直接改**下表路径之**视觉层**（权知统一，见仓根 `POWER-KNOWLEDGE.md`）。表外与「不独占」行仍无写权；一行同时碰语义行为则交父代理。

| 资产 | 路径 |
|------|------|
| 色板 / chrome / 首页 | `ind-chain/web/css/app.css`；`ind-chain/web/index.html`（C-HOME + C-SPLASH）；`ind-chain/web/js/home.js` |
| 四级名单 | `ind-chain/web/list.html`；`ind-chain/web/js/list.js` |
| 立方体壳 | `ind-chain/web/cube.html`（C-CUBE；无 splash） |
| splash 时序 | `ind-chain/web/js/home.js`（hold ~2s → fade ~4s） |
| 面板类名与 HUD 外观 | `ind-chain/web/js/ui.js`（视觉层） |
| 启动图标 | `ind-chain/assets/fidv-launcher*` |
| 图标脚本 | `ind-chain/scripts/set-command-icon.sh` |
| 启动器附着面 | 根 `Standard-Cube.app` 图标资源；`launcher_gui.py` 色板与窗体外观 |
| 概念续工指针 | `ind-chain/CONCEPTS.md` §10（美学细节回指本文） |

**不独占：** `coords.js`、抽出/焦点几何、`scene.js` 中服务坐标可读性的材质逻辑；启动器进程与端口逻辑。

---

## 4. 与其它角色

| 角色 | 关系 |
|------|------|
| 监理部 | 有代码改动时由父代理送三监报告终裁；理念标准仍是 DESIGN；美工部不写「通过/打回」 |
| 总参谋部 | 可在规划中调度美工部；业主安排下可规划管理美工部角色文件；专知路径内美工部可改码；跨域交父代理；产品终裁仍归监理部 |
| 书记 | 美工部不写 worklog |

*Last updated: 2026-10-07 · 权知统一：专知路径内可改码。*
