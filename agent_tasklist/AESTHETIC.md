# FIDV 美学真源（美工部）

美工部判断网页与启动表层美学时，只以本文为准。产品是否服务金融决策，以 `DESIGN.md` 为准（总监）。概念与坐标以 `ai-chain/CONCEPTS.md` 为准。

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

### 启动图标

- 暗底上三片纵切片 + accent 细线，与 splash 左标同族。
- 源与产物：`ai-chain/assets/fidv-launcher-1024.png`、`fidv-launcher.icns`。
- 施加：`ai-chain/scripts/set-command-icon.sh` → `Open-AI-Chain.command` 与根 `Open-AI-Cube.command`。
- Git 不保证 resource fork；克隆后需重跑脚本。

### 工程首页（C-HOME）

- `/`：BICS L1–L7 同一门厅。先 **C-SPLASH**（仅冷进 `/`），再字标同族 + 一条坐标痕迹 + **相连规则矩形格**（`gap:0`，共 1px `--stroke`，无圆角色胶囊）。`--accent` 只用于 hover/focus 与字标下划线，**不对 Technology(19) 单开主路径**。无底栏 chip CTA。无新闻/统计。
- 非叶格进 `/?bics=` 同版面下一层；叶格进 `/cube?bics=`，**无** splash。
- `/cube`：决策立方体冷启动，**无** splash。

---

## 2. 延展原则（新功能 / 新分页）

1. **先复用 token**：新面只用上表 CSS 变量，不引入第二套色名。
2. **浮于工程区**：新面板默认玻璃浮层，不恢复实心双栏。
3. **一字标族**：品牌露出用 FIDV 字标或切片意象，不另做吉祥物。
4. **动效克制**：以 opacity / 轻微 scale 为主；不为装饰加粒子或 3D logo。
5. **语义色不动**：US / 非美 / 环导读色变更须同时过 CONCEPTS，不单走美工部。

---

## 3. 管辖路径（文档归属；本次不搬目录）

| 资产 | 路径 |
|------|------|
| 色板 / chrome / 首页 | `ai-chain/web/css/app.css`；`ai-chain/web/index.html`（C-HOME + C-SPLASH）；`ai-chain/web/js/home.js` |
| 立方体壳 | `ai-chain/web/cube.html`（C-CUBE；无 splash） |
| splash 时序 | `ai-chain/web/js/home.js`（hold ~2s → fade ~4s） |
| 面板类名与 HUD 外观 | `ai-chain/web/js/ui.js`（视觉层） |
| 启动图标 | `ai-chain/assets/fidv-launcher*` |
| 图标脚本 | `ai-chain/scripts/set-command-icon.sh` |
| 启动器附着面 | `ai-chain/Open-AI-Chain.command`、`Open-AI-Cube.command` |
| 概念续工指针 | `ai-chain/CONCEPTS.md` §10（美学细节回指本文） |

**不独占：** `coords.js`、抽出/焦点几何、`scene.js` 中服务坐标可读性的材质逻辑。

---

## 4. 与其它角色

| 角色 | 关系 |
|------|------|
| 总监 | 有代码改动时仍终审 DESIGN；美工部不写「通过/打回」 |
| 总参谋部 | 可在规划中调度美工部；业主安排下可规划管理美工部角色文件；美工部仍只出方案不改仓；产品终审仍归总监 |
| 书记 | 美工部不写 worklog |

*Last updated: 2026-10-03 · 首版由总参谋部立美工部时写入现行语言。*
