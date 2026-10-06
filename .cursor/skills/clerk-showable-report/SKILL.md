---
name: clerk-showable-report
description: Writes FIDV printable HTML reports, briefings, handbooks, and exhibits into library/showable-report/ using the clerk paper-face of the product type family. Use when the user writes 电秘书, or asks for 秘书, 报告, 汇报, PPT, 展出, 读本, 讲稿, handbook, or showable-report.
---

# 秘书可打印文稿

落盘只在 `library/showable-report/`。不改 `ai-chain/`。不写 worklog。不写 ops-log。

美学真源是 `agent_tasklist/AESTHETIC.md`。产品页是暗底玻璃；纸面是**同族反相**，不是第二套皮。DESIGN：一根线、一个面说清。

执行前读本 skill，再读 `agent_tasklist/clerk.md`。

## Token（纸面只用这些名）

| Token | 值 | 用途 |
|-------|-----|------|
| `--paper` | `#f7f5f0` | 屏幕预览底 |
| `--ink` | `#1a1f26` | 主字（勿纯黑） |
| `--muted` | `#4a5560` | 导语、元数据（勿用屏幕 `#9aa6b5`） |
| `--rule` | `#c5ccd4` | 细边、节题底边 |
| `--fill` | `#ece8e0` | 表头 |
| （pre 底） | `#efece6` | 代码块 |

`@media print`：`body` 底改为 `white`。不要 `--glass`、`backdrop-filter`、产品 `--bg` / `--accent`。

## 同族必须继承

- 字体：`"Iowan Old Style", "Palatino Linotype", Palatino, "Songti SC", "Noto Serif SC", serif`。中文宋体陪衬。不要无衬线标题系统。
- 封面可单独放大 **FIDV**（letter-spacing `0.06em`–`0.08em`）。不要吉祥物、切片 3D、开屏时序。
- 表：`border-collapse`、共边 `1px var(--rule)`、无胶囊、无斑马炫色。表头仅 `--fill`。全宽、左对齐、上对齐、`padding: 0.28em 0.45em`。`page-break-inside: avoid`。
- 节题底边用 `--rule`，不用产品 `--accent`。
- 路径与命令：等宽。
- 无动效。US `#3cf0ff` / 非美 `#ffb020` 不进正文色；截图保持原样。

## 两种版式

**读本 / 手册**（engineering-history、handbook）：A4 **纵向**。

```css
@page { size: A4; margin: 14mm 14mm 16mm; }
body { max-width: 180mm; font-size: 11pt; line-height: 1.45; }
table { font-size: 9.5pt; }
```

**讲稿**（briefing）：A4 **横向**。每 `.slide` 一页。

```css
@page { size: A4 landscape; margin: 10mm; }
body { max-width: 277mm; }
.slide { min-height: 175mm; page-break-after: always; }
table { font-size: 10pt; }
```

打印去掉幻灯细边框。页首 `.no-print` 一句：浏览器打开 → 打印 → 存 PDF → 关掉页眉网址。`@media print` 隐藏该条；链接继承正文色、去下划线。

## 模板

```css
:root {
  --ink: #1a1f26;
  --muted: #4a5560;
  --rule: #c5ccd4;
  --paper: #f7f5f0;
  --fill: #ece8e0;
}
body {
  margin: 0 auto;
  padding: 16mm 16mm 22mm;
  color: var(--ink);
  background: var(--paper);
  font-family: "Iowan Old Style", "Palatino Linotype", Palatino, "Songti SC", "Noto Serif SC", serif;
}
h1 { font-size: 18pt; font-weight: 600; letter-spacing: 0.04em; }
h2 { font-size: 12.5pt; border-bottom: 1px solid var(--rule); }
.lede, .cover-meta { color: var(--muted); font-size: 10pt; }
```

## 禁止

工程 `--bg` 铺纸；玻璃 / 模糊 / glow；紫靛渐变；陶土暖强调；报纸密栏；圆角胶囊；Loading；粒子或 3D logo；纸面另起色名；`--accent` 当标题色或填格；表头深色反白；把截图里的暗 UI 当作纸面底。

范本：`library/showable-report/FIDV-clone-handbook.html`（纵）、`FIDV-team-briefing.html`（横）。
