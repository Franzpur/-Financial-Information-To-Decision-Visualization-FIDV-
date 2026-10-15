# SFC 字标与全称小字：字体建议件

日期：2026-10-15 · 内阁 · 业主令（电内阁）

业主原话：「我觉得开屏和分类ui中的简写可以采用第一种的字体，你看能不能找到或者做出这种字体，然后绿线下方采用这种全称的小字，也是看看能不能找到或做出这种字体。」

本件只是建议。产品代码没有改，字体文件没有下载进仓库。

## 一、现状

「SFC」字标是一段内联 SVG，同一份副本出现在三处。每份都由三框 logo、「SFC」文字和绿色细线组成：

| 页面 | 文件与行号 | 尺寸 |
|------|-----------|------|
| 开屏（C-SPLASH，只在冷进 `/` 时播放） | `Ind-Chain/web/index.html` 13–29 行（文字在 20–26 行，绿线在 27 行） | 220×56 |
| 门厅 / 分类格阵页眉（C-HOME，BICS L1–L3） | `Ind-Chain/web/index.html` 38–54 行（文字在 45–51 行，绿线在 52 行） | 200×52 |
| 公司列表页眉（`/list?bics=`） | `Ind-Chain/web/list.html` 14–30 行（文字在 21–27 行，绿线在 28 行） | 160×42 |

- **字体**：`font-family="Iowan Old Style, Palatino Linotype, Palatino, Georgia, serif"`，`font-size="34"`，`letter-spacing="0.22em"`，填色 `#e8edf4`。这是系统衬线字体，仓库里没有内嵌任何字体文件（全仓没有 `.woff`、`.ttf` 或 `.otf`）。
- **绿线**：`<line x1="72" y1="56" x2="148" y2="56" stroke="#8be0c0" stroke-width="1" opacity="0.55"/>`，颜色就是 `--accent`，只在「SFC」三个字底下。viewBox 是 `0 0 280 72`，线下只剩 16 个单位的高度，放不下一行全称。
- **全称小字**：目前没有。
- **样式**：`Ind-Chain/web/css/app.css` 1184 行的 `.splash-logo` 只设了 `display:block`；517–527 行的 `.home-logo` 只设尺寸。正文字体在 23 行：`ui-sans-serif, system-ui, -apple-system…`。
- **美学真源**：`agent_tasklist/AESTHETIC.md` 58 行写明「SFC 衬线字标（Iowan / Palatino / Georgia 栈）+ `--accent` 底线」，70 行要求「现稿勿擅自改形」。换字体需要同时修改 AESTHETIC.md，这属于美工部的路径。
- **立方体页 `/cube`**：没有字标，不在这次范围内。

## 二、两张图的字体辨认

### 图1：「SFC」简写

图1的特征：极粗、横向加宽（extended）、方角几何、内角带小圆角，S 的末端是斜切的。F 的左上角和 C 的右上角各有一块浅灰三角斜面，像折纸或高光；C 的右下角是切角。

| 候选 | 像在哪里 | 不像在哪里 | 许可证 |
|------|---------|-----------|--------|
| **Tektur**（可变字体，字重 400–900、字宽 75–100） | 字重够粗，方角带切角的气质最接近 | 字宽不如图1那么宽 | SIL OFL 1.1，没有保留字体名（RFN） |
| **Michroma** | 加宽的 Eurostile 式比例最接近图1的宽度 | 只有 Regular 一个字重，太细 | SIL OFL 1.1，没有 RFN |
| **Orbitron**（字重 400–900） | 900 字重够粗，几何方正 | 圆角偏多，没有斜切 | SIL OFL 1.1，**有 RFN「Orbitron」** |

备选：Oxanium（字重 200–800，切角明显）、Chakra Petch（字重 300–700）、Krona One（宽体，有 RFN），都是 OFL。

**结论**：没有任何现成字体带有图1的灰色斜面高光。斜面是图形，不是字形。

### 图2：「STANDARD FINANCIAL CHARTING」全称

图2的特征：细笔画、全大写、几何无衬线、字距很宽。

| 候选 | 说明 | 许可证 |
|------|------|--------|
| **Jost**（可变字体，字重 100–900） | Futura 式几何，Light 或 300 字重加大字距最像图2 | SIL OFL 1.1，没有 RFN |
| **Montserrat**（字重 100–900） | 字形更宽、更圆，300 字重也贴近 | SIL OFL 1.1，没有 RFN |
| **Lexend Exa**（字重 100–900） | 本身就是加宽版，不靠字距也够宽 | SIL OFL 1.1，**有 RFN「RevReading」** |

**零成本备选**：本产品只在 macOS 上运行（.app 加 WKWebView），系统自带 SF Pro。直接写 `font-weight:300; letter-spacing:.3em` 加 `text-transform:uppercase`，已经很接近图2，不需要任何字体文件。SF Pro 不能随产品分发，但调用系统字体不涉及分发。

**许可证核对**（2026-10-15 联网）：以上 9 款都已在 `github.com/google/fonts` 的 `ofl/<name>/OFL.txt` 和 `METADATA.pb` 中确认是 OFL，字重范围也已核对。OFL 允许把字体随 .app 打包、本地内嵌，前提是附上 OFL.txt。注意：抽取子集（subset）在 OFL 下算「修改版」。带 RFN 的字体（Orbitron、Lexend、Krona One）抽子集后不能沿用原名，所以内嵌子集时优先选没有 RFN 的 Jost、Montserrat、Tektur、Michroma。

## 三、自制建议

1. **简写用 SVG 矢量字标，不做完整字体文件。**
   - 理由：只有 S、F、C 三个字，而且是固定品牌字样。做成字体文件需要整套字形、度量和许可证工程，用处只有这三个字，不划算。
   - SVG 字标可以直接画出图1的两块灰色斜面（用 `--muted #9aa6b5` 或降低不透明度的 `--text`）。不需要加载字体，没有字体闪烁（FOUT），离线也不会出问题，和现在的内联 SVG 结构一致，只是把 `<text>` 换成 `<path>`。
   - 做法：以 Tektur 900 或 Michroma 为底稿描轮廓，再按图1加宽、切角、加斜面。用 OFL 字体的轮廓做 logo 属于「用字体制作的作品」，不受 OFL 约束，也不必附 OFL.txt。
   - 三处 SVG 是重复副本，宜抽成一份共享资源，避免三处不同步。具体怎么抽由实施方决定，内阁不定。
2. **全称小字用现成 OFL 字体加 letter-spacing 就够了**，有两条路：
   - A. 内嵌 Jost 或 Montserrat 的 300 字重，抽出只含大写 A–Z 和空格的 woff2 子集（约 5–10 KB）。用 `@font-face` 指向本地路径（例如 `Ind-Chain/web/fonts/`），旁边放 OFL.txt，不走 CDN。
   - B. 全称也转成 SVG 轮廓：效果完全确定，不需要字体文件，但以后改字距要重新导出。
   - 或者先用上面的 SF Pro 零成本备选看效果，再决定是否内嵌。
3. **版面**：27 个字母，以约 7px 字号、0.3em 字距计，宽约 200px，远宽于现在的绿线（约 76 个单位）。需要拉长绿线，或者让小字比线宽；viewBox 的高度也要加大。这一项要等业主定。

## 四、待业主拍板

1. 两张图是业主自己做的，还是来自外部（AI 生成或第三方 logo）？有没有矢量源文件（AI、SVG、Figma）？有源文件就直接用，不用再描。如果来自第三方，要先确认版权。
2. 「绿线」指的是不是现在字标下面那条 `--accent` 细线（三处 SVG 中 y=56 的那条）？全称放在线下时，线要不要拉长到和全称一样宽？
3. 三框 logo 留不留？AESTHETIC.md 把它定为「Logo 标准」，不得另起第二套 logo。只换字体不碰三框，还是新字标取代三框？
4. 「分类 UI」是否只指门厅和列表页眉？立方体页（`/cube`）现在没有字标，要不要加？
5. 图1的灰色斜面在三种尺寸下都保留，还是小尺寸（列表页 160px）时省掉？
6. 启动图标（`sfc-launcher*`）要不要跟着改？不在本令范围内，但会影响整套视觉的统一。
7. 换字需要修改 AESTHETIC.md 58 和 70 行的约定，由美工部或总参谋部落实。内阁不改。

## 附：模块清单与关系（`modules/graph.json` 当时状态，26 个模块、35 条边）

- **前端（FE）**：FE-NAV 导航、FE-BOARD 展板、FE-LIST 列表、FE-OPENCUBE 跳转制图台、FE-LISTAREA 列表属地、FE-ACTION 操作、FE-COORDONE 摆放坐标、FE-SCENE 场景、FE-PANEL 面板、FE-FOCUS 聚焦、FE-API 接口、FE-AESTHETIC 前端设计
- **壳（SHELL）**：SHELL-WINDOW 壳窗口、SHELL-PROC 内嵌后端、SHELL-PACK 打包
- **后端（BE）**：BE-HTTP、BE-BUNDLE 捆绑编排、BE-DB-DEMO 演示集、BE-DB-SHADOW 影集、BE-NVDA-LAYOUT N布局规划、BE-NVDA-LINKS N关系集、BE-BICS-HIER BICS分类树、BE-BICS-ENTITY BICS公司树、BE-BICS-AREA BICS地区映射、BE-BICS-INGEST BICS导入
- **跟踪**：MODULES-TRACK 静态模块跟踪

本件涉及的边：

- FE-AESTHETIC 被 FE-BOARD、FE-LIST、FE-PANEL 依赖（depends）。
- 调用链（calls）：FE-NAV → FE-BOARD → FE-LIST → FE-OPENCUBE。
- FE-BOARD 和 FE-LIST 依赖 FE-LISTAREA（depends），并调用 FE-API（calls）。

字标改动落在 FE-AESTHETIC，影响 FE-BOARD（开屏和门厅）与 FE-LIST（列表页眉）。

完整静态图：`modules/index.html`。
