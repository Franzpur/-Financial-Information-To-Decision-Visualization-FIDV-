#!/usr/bin/env python3
"""一次性脚本（内阁 · 2026-10-16 定点测验）
读 BE-DATA/ICBC C/928/googl_bond_full.xlsx → 聚合 PM-LADDER-Q → 手写 SVG → 写
cabinet/reports/SFC-googl-quarterly-debt-pressure.html

只读 BE-DATA；只写 cabinet/reports/。不触产品代码。无第三方依赖之外：openpyxl。
用法：python3 cabinet/reports/_build_googl_ladder.py
"""
import calendar
import collections
import datetime as dt
import hashlib
import json
import math
import os

import openpyxl

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC_REL = "BE-DATA/ICBC C/928/googl_bond_full.xlsx"
OUT = os.path.join(ROOT, "cabinet", "reports", "SFC-googl-quarterly-debt-pressure.html")

ASOF = dt.date(2026, 9, 28)      # Context 表：Created on 09/28/2026
START = dt.date(2026, 10, 1)     # 起算季 2026Q4
Q_FIRST = (2026, 4)
Q_LAST = (2036, 4)
FREQ = {"S/A": 6, "Annual": 12, "Qtrly": 3}


# ---------------------------------------------------------------- 读数
def pdate(s):
    y, m, d = map(int, s.split("/"))
    return dt.date(y, m, d)


def addm(d, n):
    y = d.year + (d.month - 1 + n) // 12
    m = (d.month - 1 + n) % 12 + 1
    return dt.date(y, m, min(d.day, calendar.monthrange(y, m)[1]))


def qkey(d):
    return (d.year, (d.month - 1) // 3 + 1)


def qlabel(k):
    return "%dQ%d" % k


def qrange(a, b):
    out, k = [], a
    while k <= b:
        out.append(k)
        k = (k[0] + (k[1] // 4), k[1] % 4 + 1)
    return out


wb = openpyxl.load_workbook(os.path.join(ROOT, SRC_REL), data_only=True)
rows = list(wb["Securities"].iter_rows(values_only=True))
hdr = rows[0]
R = [dict(zip(hdr, r)) for r in rows[1:]]
N_ALL = len(R)
by_class = collections.Counter(r["Asset Class"] for r in R)
by_ccy = collections.Counter(r["Currency"] for r in R)
by_freq = collections.Counter(r["Cpn Freq Des"] for r in R)

# ---------------------------------------------------------------- 聚合
prin = collections.defaultdict(float)     # 季/年桶：到期本金（USD 等值）
intr = collections.defaultdict(float)
prin_y = collections.defaultdict(float)
intr_y = collections.defaultdict(float)
n_in = 0
excluded = []                              # (理由, 行)
refs_q = collections.defaultdict(set)      # 季 → 行序（仅供 ref 计数）
par_in = 0.0
prin_tail47 = 0.0
n_tail47 = 0
floaters = 0
for i, r in enumerate(R):
    amt = r["Amt Out"]
    if r["Asset Class"] != "Corporates":
        excluded.append((r["Asset Class"], r))
        continue
    if not amt:
        excluded.append(("无在外金额", r))
        continue
    n_in += 1
    par_in += amt
    mat = pdate(r["Maturity"])
    step = FREQ[r["Cpn Freq Des"]]
    if r["Cpn Freq Des"] == "Qtrly":
        floaters += 1
    cpn = r["Coupon"] / 100.0 * amt * step / 12.0   # 每期票息现金（USD 等值）
    fc = pdate(r["First Coupon Date"])
    k, hit = 0, False
    while True:
        d = addm(fc, k * step)
        k += 1
        if (d - mat).days > 10:
            break
        last = abs((d - mat).days) <= 10          # 工作日顺延容差 10 天
        if last:
            d = mat
            hit = True
        if d >= START:
            intr[qkey(d)] += cpn
            intr_y[d.year] += cpn
            refs_q[qkey(d)].add(i)
        if last:
            break
    assert hit, "票息表未落在到期日：%r" % (r,)
    if mat >= START:
        prin[qkey(mat)] += amt
        prin_y[mat.year] += amt
        refs_q[qkey(mat)].add(i)
        if mat.year >= 2047:
            prin_tail47 += amt
            n_tail47 += 1

QS = qrange(Q_FIRST, Q_LAST)
bn = lambda x: x / 1e9
P = [bn(prin.get(k, 0.0)) for k in QS]
I = [bn(intr.get(k, 0.0)) for k in QS]
T = [p + i for p, i in zip(P, I)]
assert abs(sum(prin_y.values()) - par_in) < 1, "本金对账失败"
assert all(r["Amt Issued"] == r["Amt Out"] for r in R if r["Amt Issued"] and r["Amt Out"])
n_pref = sum(1 for e in excluded if e[0] == "Preferreds")
n_loan = sum(1 for e in excluded if e[0] == "Loans")
pref_amt = [bn(e[1]["Amt Out"]) for e in excluded if e[0] == "Preferreds"]
loan_mat = [e[1]["Maturity"] for e in excluded if e[0] == "Loans"]
assert n_pref == 2 and n_loan == 2

# 年度尾部 2037–2046
TY = list(range(2037, 2047))
TP = [bn(prin_y.get(y, 0.0)) for y in TY]
TI = [bn(intr_y.get(y, 0.0)) for y in TY]

# KPI
cum_to_2031 = sum(P[: QS.index((2031, 4)) + 1])
share_to_2031 = cum_to_2031 / bn(par_in) * 100
cum_to_2036 = sum(P)
peak_idx = sorted(range(len(QS)), key=lambda j: -T[j])[:6]
peak_set = set(peak_idx)
pk = max(range(len(QS)), key=lambda j: T[j])
first_prin = next(j for j, v in enumerate(P) if v > 0)
avg12_int = sum(I[:12]) / 12
int_year1 = sum(I[:4])
prin_peak = max(range(len(QS)), key=lambda j: P[j])

# ---------------------------------------------------------------- PlotSpec
YMAX = math.ceil(max(T))
spec = {
    "v": 1,
    "mappingId": "PM-LADDER-Q",
    "params": {
        "bucket": "quarter",
        "horizon": [qlabel(Q_FIRST), qlabel(Q_LAST)],
        "interest": "include",
        "measure": "cash",
        "fx": "as-delivered",
        "scope": "GOOGL",
    },
    "basis": {
        "mode": "single-company",
        "n": n_in,
        "excluded": [
            {"reason": "Preferreds（重复且强制转换性质）", "count": n_pref},
            {"reason": "Loans（无在外金额）", "count": n_loan},
        ],
    },
    "title": "GOOGL 季度偿债压力",
    "subtitle": "到期本金 + 票息现金 · USD bn 等值 · 2026Q4–2036Q4",
    "scales": [
        {"id": "x", "kind": "band", "domain": [qlabel(k) for k in QS], "label": "日历季度", "unit": "quarter"},
        {"id": "y", "kind": "linear", "domain": [0, YMAX], "label": "偿债现金", "unit": "USD bn-eq"},
    ],
    "marks": [],
    "legend": [{"tone": "neutral", "text": "到期本金"}, {"tone": "muted", "text": "票息现金"}],
    "notes": [
        "amounts are USD-equivalent as delivered by the export (FX appears fixed at issue date)",
        "coupon cash = coupon x outstanding / freq; stub, day-count and business-day shifts ignored",
        "floating-rate notes (%d) extrapolated at current coupon" % floaters,
    ],
    "provenance": {"sources": [SRC_REL], "illustrative": False, "thirdParty": True},
}
for j, k in enumerate(QS):
    nref = len(refs_q.get(k, ()))
    spec["marks"].append({"type": "rect", "x": qlabel(k), "y0": 0.0, "y": round(P[j], 3), "tone": "neutral", "nRef": nref})
    spec["marks"].append({"type": "rect", "x": qlabel(k), "y0": round(P[j], 3), "y": round(P[j] + I[j], 3), "tone": "muted", "nRef": nref})
spec_json = json.dumps(spec, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
spec_hash = hashlib.sha256(spec_json.encode("utf-8")).hexdigest()[:12]

# ---------------------------------------------------------------- SVG：主图
def f1(x):
    return "%.1f" % x


def chart_quarterly():
    W, H = 1040, 336
    x0, x1 = 54, W - 12
    yt, yb = 40, 284
    n = len(QS)
    band = (x1 - x0) / n
    bw = band * 0.66
    sy = lambda v: yb - v / YMAX * (yb - yt)
    o = []
    o.append('<svg class="plot" viewBox="0 0 %d %d" role="img" aria-label="GOOGL 季度偿债压力：到期本金与票息现金堆叠柱，2026Q4 至 2036Q4">' % (W, H))
    # 年带（奇数年铺 fill）
    yrs = collections.OrderedDict()
    for j, k in enumerate(QS):
        yrs.setdefault(k[0], []).append(j)
    for y, js in yrs.items():
        a, b = x0 + js[0] * band, x0 + (js[-1] + 1) * band
        if y % 2 == 1:
            o.append('<rect x="%s" y="%d" width="%s" height="%d" class="yband"/>' % (f1(a), yt, f1(b - a), yb - yt))
    # 网格与 Y 刻度
    for v in range(0, YMAX + 1):
        y = sy(v)
        o.append('<line x1="%d" x2="%d" y1="%s" y2="%s" class="%s"/>' % (x0, x1, f1(y), f1(y), "axis" if v == 0 else "grid"))
        o.append('<text x="%d" y="%s" class="tk" text-anchor="end">%d</text>' % (x0 - 6, f1(y + 3), v))
    o.append('<text x="%d" y="14" class="ax">USD bn 等值 / 季</text>' % (x0 - 44))
    # 图例
    lx = x1 - 238
    o.append('<rect x="%d" y="6" width="10" height="10" class="b-prin"/><text x="%d" y="15" class="lg">到期本金</text>' % (lx, lx + 15))
    o.append('<rect x="%d" y="6" width="10" height="10" class="b-int"/><text x="%d" y="15" class="lg">票息现金（含到期当季末笔）</text>' % (lx + 74, lx + 89))
    # 柱
    for j, k in enumerate(QS):
        cx = x0 + (j + 0.5) * band
        xl = cx - bw / 2
        yp = sy(P[j])
        yi = sy(T[j])
        if P[j] > 0:
            o.append('<rect x="%s" y="%s" width="%s" height="%s" class="b-prin"/>' % (f1(xl), f1(yp), f1(bw), f1(yb - yp)))
        if I[j] > 0:
            o.append('<rect x="%s" y="%s" width="%s" height="%s" class="b-int"/>' % (f1(xl), f1(yi), f1(bw), f1(yp - yi)))
        cls = "vl pk" if j in peak_set else "vl"
        o.append('<text x="%s" y="%s" class="%s" text-anchor="middle">%.1f</text>' % (f1(cx), f1(yi - 3.5), cls, T[j]))
        mark = ""
        if k == (2029, 2):
            mark = "†"
        if k == (2027, 2):
            mark = "‡"
        o.append('<text x="%s" y="%d" class="ql" text-anchor="middle">Q%d%s</text>' % (f1(cx), yb + 12, k[1], mark))
    # 年标签 + 分隔
    for y, js in yrs.items():
        a, b = x0 + js[0] * band, x0 + (js[-1] + 1) * band
        o.append('<text x="%s" y="%d" class="yl" text-anchor="middle">%d</text>' % (f1((a + b) / 2), yb + 29, y))
        if y != 2026:
            o.append('<line x1="%s" x2="%s" y1="%d" y2="%d" class="tick"/>' % (f1(a), f1(a), yb, yb + 34))
    o.append('<text x="%d" y="%d" class="ax" text-anchor="end">X：日历季度（到期日 / 票息日所在季）</text>' % (x1, H - 4))
    o.append("</svg>")
    return "\n".join(o)


def chart_tail():
    W, H = 560, 250
    x0, x1 = 50, W - 10
    yt, yb = 34, 200
    ymax = math.ceil(max(p + i for p, i in zip(TP, TI)) * 2) / 2.0
    ymax = max(ymax, 1.0)
    n = len(TY)
    band = (x1 - x0) / n
    bw = band * 0.62
    sy = lambda v: yb - v / ymax * (yb - yt)
    o = ['<svg class="plot" viewBox="0 0 %d %d" role="img" aria-label="GOOGL 2037–2046 年度偿债：到期本金与票息现金">' % (W, H)]
    step = 0.5 if ymax <= 3 else 1.0
    v = 0.0
    while v <= ymax + 1e-9:
        y = sy(v)
        o.append('<line x1="%d" x2="%d" y1="%s" y2="%s" class="%s"/>' % (x0, x1, f1(y), f1(y), "axis" if v == 0 else "grid"))
        o.append('<text x="%d" y="%s" class="tk" text-anchor="end">%.1f</text>' % (x0 - 6, f1(y + 3), v))
        v += step
    o.append('<text x="%d" y="14" class="ax">USD bn 等值 / 年（刻度独立于主图）</text>' % (x0 - 44))
    for j, y in enumerate(TY):
        cx = x0 + (j + 0.5) * band
        xl = cx - bw / 2
        yp, yi = sy(TP[j]), sy(TP[j] + TI[j])
        if TP[j] > 0:
            o.append('<rect x="%s" y="%s" width="%s" height="%s" class="b-prin"/>' % (f1(xl), f1(yp), f1(bw), f1(yb - yp)))
        if TI[j] > 0:
            o.append('<rect x="%s" y="%s" width="%s" height="%s" class="b-int"/>' % (f1(xl), f1(yi), f1(bw), f1(yp - yi)))
        o.append('<text x="%s" y="%s" class="vl" text-anchor="middle">%.1f</text>' % (f1(cx), f1(yi - 3.5), TP[j] + TI[j]))
        o.append('<text x="%s" y="%d" class="ql" text-anchor="middle">%d</text>' % (f1(cx), yb + 14, y))
    o.append('<text x="%d" y="%d" class="ax" text-anchor="end">X：日历年（不再分季）</text>' % (x1, H - 6))
    o.append("</svg>")
    return "\n".join(o)


# ---------------------------------------------------------------- 文案与 HTML
def fmt(x, d=1):
    return ("%." + str(d) + "f") % x


pkq = qlabel(QS[pk])
ppq = qlabel(QS[prin_peak])
top3 = sorted(peak_idx, key=lambda j: QS[j])
peaks_txt = "、".join("%s（%.1f）" % (qlabel(QS[j]), T[j]) for j in top3)
spec_show = {k: v for k, v in spec.items() if k != "marks"}
spec_show["marks"] = [
    "rect × %d（%d 季 × {本金, 票息}；纯数据见内嵌 JSON）" % (len(spec["marks"]), len(QS)),
    spec["marks"][0],
    spec["marks"][1],
    "…",
]
cj = lambda v: json.dumps(v, ensure_ascii=False, separators=(", ", ": "))
spec_pre = "{\n" + ",\n".join(" %s: %s" % (json.dumps(k), cj(v)) for k, v in spec_show.items()) + "\n}"

usd_par = bn(sum(r["Amt Out"] for r in R if r["Asset Class"] == "Corporates" and r["Currency"] == "USD" and r["Amt Out"]))
ccy_line = " · ".join("%s %d" % (c, by_ccy[c]) for c in ["USD", "EUR", "JPY", "AUD", "GBP", "CHF", "CAD"])

HTML = r"""<!DOCTYPE html>
<html lang="zh-Hans">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>GOOGL 季度偿债压力平面图 · 二重映射定点测验</title>
<!--
  SFC 内阁 · 定点测验件（2026-10-16）。由 cabinet/reports/_build_googl_ladder.py 生成。
  纸面 token 同秘书纸面（--ink/--muted/--rule/--paper/--fill），手写 SVG，无 CDN。
  含彭博导出加工物，默认不随外发包；公开仓推送须业主知悉。
  打印：Chrome → A4 横向 → 勾选「背景图形」→ 关闭页眉页脚。
-->
<style>
:root { --ink:#1a1f26; --muted:#4a5560; --rule:#c5ccd4; --paper:#f7f5f0; --fill:#ece8e0; --desk:#d8d5ce;
  --serif:"Iowan Old Style","Palatino Linotype",Palatino,"Songti SC","Noto Serif SC",serif;
  --sans:-apple-system,"SF Pro Text","PingFang SC","Helvetica Neue",system-ui,sans-serif;
  --mono:ui-monospace,"SF Mono",Menlo,monospace; }
* { box-sizing:border-box; }
html { background:var(--desk); -webkit-print-color-adjust:exact; print-color-adjust:exact; }
body { margin:0; padding:8mm 0 12mm; color:var(--ink); font-family:var(--serif); font-size:9.6pt; line-height:1.55; }
@page { size:A4 landscape; margin:11mm 13mm 11mm; }
.no-print { width:273mm; margin:0 auto 4mm; font:9pt/1.5 var(--sans); color:var(--muted); }
.sheet { width:273mm; margin:0 auto 8mm; padding:0 0 1mm; background:var(--paper); box-shadow:0 1px 2px rgba(26,31,38,.14),0 10px 30px rgba(26,31,38,.14); padding:9mm 10mm; }
.sheet { break-after:page; }
.sheet:last-child { break-after:auto; }
@media print {
  html, body { background:#fff; } body { padding:0; }
  .no-print { display:none !important; }
  .sheet { width:auto; margin:0; padding:0; background:none; box-shadow:none; }
}
.kicker { font:300 7.5pt/1 var(--sans); letter-spacing:.28em; color:var(--muted); margin:0 0 2.2mm; }
h1 { margin:0; font-size:18pt; font-weight:600; letter-spacing:.04em; line-height:1.25; }
h2 { margin:4mm 0 2mm; font-size:11.5pt; font-weight:600; letter-spacing:.04em; border-bottom:1px solid var(--rule); padding-bottom:1mm; }
h3 { margin:3mm 0 1mm; font-size:10pt; font-weight:600; }
p { margin:0 0 1.6mm; }
.lede, .meta { color:var(--muted); font-size:9.2pt; }
.meta { font-family:var(--sans); font-size:8pt; letter-spacing:.04em; margin:1.2mm 0 2.6mm; }
.banner { background:var(--fill); border:1px solid var(--rule); padding:1.6mm 3mm; margin:0 0 3mm; font:8.6pt/1.5 var(--sans); }
.banner b { font-weight:600; }
.kpis { display:flex; border:1px solid var(--rule); margin:0 0 2.4mm; }
.kpi { flex:1; padding:1.6mm 3mm; border-left:1px solid var(--rule); font-family:var(--sans); }
.kpi:first-child { border-left:0; }
.kpi .n { font:600 14pt/1.15 var(--serif); font-variant-numeric:tabular-nums; }
.kpi .u { font-size:7.6pt; color:var(--muted); }
.kpi .t { font-size:7.8pt; color:var(--muted); line-height:1.35; margin-top:.4mm; }
svg.plot { display:block; width:100%; height:auto; }
svg .grid { stroke:var(--rule); stroke-width:.5; }
svg .axis { stroke:var(--ink); stroke-width:.8; }
svg .tick { stroke:var(--rule); stroke-width:.6; }
svg .yband { fill:var(--fill); opacity:.75; }
svg .b-prin { fill:var(--ink); }
svg .b-int { fill:var(--rule); stroke:var(--muted); stroke-width:.5; }
svg text { font-family:var(--sans); fill:var(--ink); }
svg .tk { font-size:9.5px; fill:var(--muted); }
svg .ax { font-size:9.5px; fill:var(--muted); }
svg .lg { font-size:10px; fill:var(--ink); }
svg .vl { font-size:8.4px; fill:var(--muted); }
svg .vl.pk { font-size:9.6px; font-weight:700; fill:var(--ink); }
svg .ql { font-size:8.4px; fill:var(--muted); }
svg .yl { font-size:10.5px; font-weight:600; fill:var(--ink); }
.fn { font:7.6pt/1.5 var(--sans); color:var(--muted); margin-top:1.6mm; }
.fn b { color:var(--ink); font-weight:600; }
table { width:100%; border-collapse:collapse; font:8.3pt/1.45 var(--sans); margin:1.4mm 0 2.4mm; page-break-inside:avoid; }
th, td { border:1px solid var(--rule); padding:.3em .5em; text-align:left; vertical-align:top; }
th { background:var(--fill); font-weight:600; }
td.n { font-variant-numeric:tabular-nums; text-align:right; }
code, pre { font-family:var(--mono); }
code { font-size:8pt; }
pre { margin:0; padding:2.2mm 3mm; background:#efece6; border:1px solid var(--rule); font-size:6.9pt; line-height:1.38; white-space:pre-wrap; overflow:hidden; }
.cols { display:flex; gap:6mm; }
.cols > div { flex:1; min-width:0; }
.cols > .w55 { flex:1.15; }
.cols > .w45 { flex:.85; }
ul { margin:0 0 2mm; padding-left:4.2mm; } li { margin:0 0 .8mm; }
</style>
</head>
<body>
<p class="no-print">浏览器打开 → 打印 → A4 横向 → 勾选「背景图形」→ 存 PDF → 关闭页眉网址。以 HTML 为准。</p>

<!-- ============ 第 1 页：主图 ============ -->
<section class="sheet">
  <p class="kicker">SFC CABINET · 二重映射 · 定点测验件 · 2026-10-16</p>
  <h1>GOOGL 季度偿债压力平面图 · 二重映射定点测验</h1>
  <p class="meta">映射 PM-LADDER-Q（PM-LADDER 加季度桶）· 数据 Bloomberg SRCH 导出，截至 2026-09-28 · 视野 2026Q4–2036Q4 · USD bn 等值</p>
  <div class="banner"><b>含彭博导出加工物，默认不随外发包；公开仓推送须业主知悉。</b> 本件只放聚合后的季度序列与汇总，不含逐笔债券明细。出处与口径见脚注与第 3 页。</div>

  <div class="kpis">
    <div class="kpi"><div class="n">@@PAR@@</div><div class="u">USD bn 等值 · @@NIN@@ 笔公司债在外</div><div class="t">已计入的在外面额合计（不含优先股、贷款）</div></div>
    <div class="kpi"><div class="n">@@CUM31@@</div><div class="u">USD bn · 占 @@SH31@@%</div><div class="t">2026Q4–2031Q4 累计到期本金；2027 年全年仅 1.0</div></div>
    <div class="kpi"><div class="n">@@PEAK@@</div><div class="u">USD bn · @@PEAKQ@@</div><div class="t">单季合计最高；前六高：@@PEAKS@@</div></div>
    <div class="kpi"><div class="n">@@INT1@@</div><div class="u">USD bn · 未来 4 季票息</div><div class="t">前 12 季季均票息约 @@AVGINT@@；季际起伏由付息月决定</div></div>
  </div>

  @@SVGQ@@

  <p class="fn"><b>读法</b>　柱高 = 该季到期本金 + 该季票息现金；深色为本金，浅色为票息。2027 年的压力几乎全是票息（约 1.2–1.6 / 季，付息集中在 2、5、8、11 月，故 Q1 最高、Q4 最低）；本金自 @@FIRSTP@@ 起零星进入，2028Q3 起成规模。到期墙是尖峰型而非平台型：@@PEAKS@@。柱顶数字为该季合计，粗体为前六高。<br>
  <b>†</b> 2029Q2 另有 2 行优先股（6.25% 强制转换性质，各 @@PREF@@ bn，两行完全重复）<b>未计入</b>；计一笔则该季本金 @@P29@@ → @@P29B@@。<b>‡</b> 2027Q2 另有一笔贷款到期（@@LOANM@@），表内无金额，<b>未计入</b>，该季压力被低估。<br>
  <b>来源</b> <code>@@SRC@@</code> · Securities 表 @@NALL@@ 行（Alphabet Inc / GOOGL 全部）→ 计入 @@NIN@@ 行，剔除 @@NEX@@ 行 · 聚合规则见第 3 页。<b>边界</b> 彭博数据仅本机测验展示。</p>
</section>

<!-- ============ 第 2 页：Φ1/Φ2 + PlotSpec + 尾部 ============ -->
<section class="sheet">
  <h2>一 · 二重映射在本测验里的位置</h2>
  <table>
    <tr><th style="width:15%">层</th><th style="width:34%">本测验做了什么</th><th>跳过什么 / 备注</th></tr>
    <tr><td>Φ1（数据 → 立方体坐标）</td><td>仅注明「单公司 GOOGL 元素」：一个元素，带一份债券要素表。不生成 <code>s, x, y, radial</code>。</td><td>不开立方体页，不读 <code>companies.json</code>；Φ1 与 Φ2 的“共用量原值”规则（方案 §5.2）在本件无对象可校。</td></tr>
    <tr><td>Φ2（元素 + 参数 → PlotSpec）</td><td>读表 → 按到期日 / 付息日落入季度桶 → 本金与票息分系列 → 输出 PlotSpec（右）→ 手写 SVG 渲染。</td><td>本件的 <code>project()</code> 与渲染都在一次性脚本里，渲染器不知数据来源，只认 band / linear 两刻度与 rect 标记，符合方案 <code>FE-MAPDRAW</code> 的收窄。</td></tr>
    <tr><td>映射 ID</td><td><code>PM-LADDER-Q</code>，不另立名：它是 <code>PM-LADDER</code> 的粒度参数（<code>bucket: year | quarter</code>），年度模式即原 <code>PM-LADDER</code>。</td><td>若正式目录要避免“同一映射双口径”，把 <code>-Q</code> 并入参数 <code>bucket</code>，ID 仍叫 <code>PM-LADDER</code>。</td></tr>
  </table>

  <div class="cols">
    <div class="w55">
      <h3>PlotSpec 摘要（v1 · sha256 前 12 位 <code>@@HASH@@</code>）</h3>
      <pre>@@SPECPRE@@</pre>
      <p class="fn">完整规约（含 @@NMARK@@ 个 rect 的数值）内嵌于本页末尾 <code>&lt;script type="application/json" id="plotspec"&gt;</code>。数值定 3 位小数、键排序，同表同参数字节相同，可作 golden。</p>
    </div>
    <div class="w45">
      <h3>尾部：2037–2046 年度（不再分季）</h3>
      @@SVGT@@
      <p class="fn">视野外的更长端：2047 年起到期本金合计 <b>@@TAIL47@@</b> bn（@@NT47@@ 笔，含 2075 年一笔与 2126 年百年英镑债），本图不画。注意 2045、2046 年度合计（@@T45@@、@@T46@@）高于任一单季，但那是<b>年度</b>口径，不可与主图柱高直接比较；2037 年起票息逐年递减（2037 年约 @@I37@@ bn）。</p>
    </div>
  </div>

</section>

<section class="sheet">
  <h2>二 · 数据摸底（聚合级，非明细）</h2>
  <table>
    <tr><th style="width:18%">项</th><th>所见</th></tr>
    <tr><td>工作表</td><td><code>Securities</code>（A1:S83，82 行 × 19 列）与 <code>Context</code>（检索条件：Ticker = GOOGL、Active；创建于 2026-09-28 17:36 HKT；“Currency: USD”）。</td></tr>
    <tr><td>列</td><td>Asset Class、Issuer Name、Ticker、Coupon、Issue Date、Maturity、Currency、Amt Issued、Amt Out、Mid Yield、CDS、G-/OAS-Spread、First Coupon Date、Interest Accrual Dt、Interest Accrued、FCF to DSR、FCF/Tot Dbt、Cpn Freq Des。<b>无 CUSIP / ISIN 列</b>，无评级、无赎回条款、无汇率列。</td></tr>
    <tr><td>行</td><td>Issuer 全为 Alphabet Inc、Ticker 全为 GOOGL（82/82，无需过滤子公司）。类别：Corporates @@C_CORP@@、Preferreds @@C_PREF@@、Loans @@C_LOAN@@。</td></tr>
    <tr><td>币种列</td><td>@@CCY@@（笔数）。但 <b>Amt 列并非本币面额</b>：同币种同发行日的各笔金额都是同一个小数汇率的整倍数（如 AUD 2026-08-27 一批 = 0.7197 × 0.5 / 0.75 / 1.0 / 1.5 bn），故判断为<b>美元等值，按发行日汇率折算</b>。</td></tr>
    <tr><td>日期</td><td>文本 <code>YYYY/M/D</code>；债券到期最近 2027-08-15，最远 2126-02-13（百年债）；一笔贷款 2027-04-13 到期更近，但无金额。</td></tr>
    <tr><td>金额</td><td><code>Amt Issued</code> 与 <code>Amt Out</code> 逐行相等（有金额的 80 行），无摊还、无回购痕迹。Corporates 合计 @@PAR@@ bn 等值，其中 USD 币种 @@USDPAR@@ bn。</td></tr>
    <tr><td>票息</td><td>Coupon 为百分数；频率 S/A @@F_SA@@、Annual @@F_AN@@、Qtrly @@F_Q@@、无 @@F_NA@@。Qtrly 的 @@NFL@@ 笔票息为长小数（如 4.3857），属浮动利率票据的当前票息。</td></tr>
  </table>

  <h2>三 · 聚合口径（最稳妥取法）</h2>
  <table>
    <tr><th style="width:17%">要素</th><th>规则</th><th style="width:26%">理由</th></tr>
    <tr><td>纳入</td><td>Asset Class = Corporates 且 Amt Out 非空非零：@@NIN@@ 行。</td><td>只有它有确定的在外金额与到期。</td></tr>
    <tr><td>不纳入</td><td>Preferreds @@C_PREF@@ 行（6.25% 季付，2029-05-15；两行票息、到期、金额完全相同，疑为同一证券重复列示；强制转换性质，非现金还本）；Loans @@C_LOAN@@ 行（Amt Out 为空 / 0）。</td><td>避免重复计 @@PREF2@@ bn 的幽灵本金；缺金额的行不猜。</td></tr>
    <tr><td>本金</td><td>到期日所在日历季，计 Amt Out（USD 等值）；到期日 &lt; 2026-10-01 的行不计（本表无此类）。无提前赎回、无摊还。</td><td>表内无赎回 / 摊还字段。</td></tr>
    <tr><td>票息</td><td>每期票息 = Coupon% × Amt Out ÷ 年付息次数（S/A=2、Annual=1、Qtrly=4）。付息日从 First Coupon Date 起按间隔月数顺延，止于到期日（到期日 ±10 天内视为同日，吸收工作日顺延）；落在 2026-10-01 及以后的计入其所在季。到期当季的末笔票息与本金同季。</td><td>无付息日历字段，只能由首息日与频率推。</td></tr>
    <tr><td>汇率</td><td>不重估，沿用导出的 USD 等值。</td><td>表无汇率；重估须另取行情。</td></tr>
    <tr><td>起算与对账</td><td>起算 2026Q4（数据截至 2026-09-28，避开残季）。全期本金（含 2036Q4 以后）与 Amt Out 合计对账一致：@@PAR@@ bn。</td><td>脚本内 assert。</td></tr>
  </table>

</section>

<!-- ============ 第 4 页：局限 / 对照 ============ -->
<section class="sheet">
  <div class="cols">
    <div>
      <h2>四 · 局限与发现的数据问题</h2>
      <ul>
        <li><b>“压力”仅为毛现金流。</b>未减现金、未计 FCF、未计再融资；FCF/Tot Dbt 等为公司级字段，在每行重复，不是债券级，本图不用。要谈“能不能还”须并列现金（<code>googl_fa_bs.xlsx</code>），建议另立 <code>PM-LADDER-COVER</code>，本测验未做。</li>
        <li><b>优先股重复两行、贷款无金额</b>（见 † ‡）。两项都可能让个别季偏低或偏高，已在图上标注而非静默丢弃。</li>
        <li><b>汇率为发行日汇率，非现值。</b>非美元债占 @@NONUSD@@%；现值重估后各季会有 ±若干 % 的偏差。</li>
        <li><b>浮动利率 @@NFL@@ 笔按当前票息外推</b>；首期长短息当整期，未做日计数 / 工作日顺延，季度归属在季末边缘日可能差一季（影响票息，不影响本金）。</li>
        <li><b>无稳定元素 ID。</b>没有 CUSIP / ISIN，PlotSpec 的 <code>ref</code> 在本测验只能记 <code>nRef</code> 计数；正式摄入必须带 ID，否则图与立方体无法联动、导出无法脱敏。</li>
        <li><b>快照会过期。</b>表为 2026-09-28 导出；发行日期（2026-02 至 2026-08）密集，数日内就可能新增，图上“2026Q4–2027Q1”的票息随之变。</li>
      </ul>
    </div>
    <div>
      <h2>五 · 与方案 PM-LADDER / 现有 bondChart 对照</h2>
      <table>
        <tr><th style="width:20%"></th><th>现有 <code>bondChart</code></th><th>本测验 <code>PM-LADDER-Q</code></th></tr>
        <tr><td>粒度</td><td>年（<code>bondSchedule.year</code>）</td><td>季；年为其上卷</td></tr>
        <tr><td>形态</td><td>560×140 折线缩略图，三线（合计 / 本金 / 利息）</td><td>堆叠柱，本金与票息分层，柱顶标合计</td></tr>
        <tr><td>数据</td><td>仅 Demo Company 演示值（✔）</td><td>真实 GOOGL 82 行（◐ 未摄入，直读表）</td></tr>
        <tr><td>可比性</td><td colspan="2">本件的季序列按年上卷即为 <code>{year, principalBn, interestBn, totalBn}</code>，可原样喂 <code>bondChart</code>；方案 P2 “同一 bondSchedule 数值逐点一致”的验收法在此成立。</td></tr>
        <tr><td>缺口</td><td colspan="2">v1 PlotSpec 的 rect 缺<b>堆叠基线</b>：本件用显式 <code>y0</code> 解决，建议 P0 冻结时写入标记通道（<code>y0</code> 或 <code>stack</code>）；band 刻度需带标签域（本件 41 个季标）。</td></tr>
      </table>
      <h3>脱敏结构示意（取整，非表内逐笔）</h3>
      <table>
        <tr><th>币种</th><th>类型</th><th>付息</th><th>到期年</th><th>规模量级</th></tr>
        <tr><td>USD</td><td>固定</td><td>S/A</td><td>2031</td><td>≈3.5 bn</td></tr>
        <tr><td>EUR</td><td>固定</td><td>年付</td><td>2034</td><td>≈1.8 bn 等值</td></tr>
        <tr><td>AUD</td><td>浮动</td><td>季付</td><td>2031</td><td>≈1.1 bn 等值</td></tr>
        <tr><td>GBP</td><td>固定</td><td>年付</td><td>2126</td><td>≈1.4 bn 等值</td></tr>
      </table>
    </div>
  </div>
  <p class="fn">口径与边界：本件由内阁以一次性脚本生成，不改 <code>Ind-Chain/</code>、<code>modules/</code>；数据取仓内跟踪路径 <code>@@SRC@@</code>，未触 <code>Partner Work/</code>。含彭博导出加工物，默认不随外发包（<code>PUBLIC-PRIVATE.md</code> 第三方数据条款）。内阁不为彭博条款背书。</p>
</section>

<script type="application/json" id="plotspec">@@SPECJSON@@</script>
</body>
</html>
"""

p29 = bn(prin.get((2029, 2), 0.0))
rep = {
    "PAR": fmt(bn(par_in)),
    "NIN": str(n_in),
    "CUM31": fmt(cum_to_2031),
    "SH31": fmt(share_to_2031, 0),
    "PEAK": fmt(T[pk]),
    "PEAKQ": pkq,
    "PEAKS": peaks_txt,
    "INT1": fmt(int_year1),
    "AVGINT": fmt(avg12_int),
    "FIRSTP": qlabel(QS[first_prin]),
    "PREF": fmt(pref_amt[0], 3),
    "PREF2": fmt(sum(pref_amt), 3),
    "P29": fmt(p29, 2),
    "P29B": fmt(p29 + pref_amt[0], 2),
    "LOANM": loan_mat[0].replace("/", "-") if False else "2027-04-13",
    "SRC": SRC_REL,
    "NALL": str(N_ALL),
    "NEX": str(N_ALL - n_in),
    "SVGQ": chart_quarterly(),
    "SVGT": chart_tail(),
    "HASH": spec_hash,
    "SPECPRE": spec_pre.replace("&", "&amp;").replace("<", "&lt;"),
    "NMARK": str(len(spec["marks"])),
    "TAIL47": fmt(bn(prin_tail47)),
    "NT47": str(n_tail47),
    "I37": fmt(TI[0]),
    "T45": fmt(TP[TY.index(2045)] + TI[TY.index(2045)]),
    "T46": fmt(TP[TY.index(2046)] + TI[TY.index(2046)]),
    "C_CORP": str(by_class["Corporates"]),
    "C_PREF": str(by_class["Preferreds"]),
    "C_LOAN": str(by_class["Loans"]),
    "CCY": ccy_line,
    "USDPAR": fmt(usd_par),
    "F_SA": str(by_freq["S/A"]),
    "F_AN": str(by_freq["Annual"]),
    "F_Q": str(by_freq["Qtrly"]),
    "F_NA": str(sum(v for k, v in by_freq.items() if k not in FREQ)),
    "NFL": str(floaters),
    "NONUSD": fmt((1 - usd_par / bn(par_in)) * 100, 0),
    "SPECJSON": spec_json,
}
out = HTML
for k, v in rep.items():
    out = out.replace("@@%s@@" % k, v)
assert "@@" not in out, [s for s in out.split("@@")[1::2]][:5]
with open(OUT, "w", encoding="utf-8") as fh:
    fh.write(out)

print("wrote", OUT)
print("rows", N_ALL, "in", n_in, "par", fmt(bn(par_in), 3), "cum2031", fmt(cum_to_2031, 2), fmt(share_to_2031, 1) + "%")
print("peak", pkq, fmt(T[pk], 2), "| peaks", peaks_txt, "| first prin", qlabel(QS[first_prin]), "| prin peak", ppq, fmt(P[prin_peak], 2))
print("int yr1", fmt(int_year1, 2), "avg12", fmt(avg12_int, 2), "tail47", fmt(bn(prin_tail47), 2), n_tail47, "I37", fmt(TI[0], 2))
print("nonUSD share", fmt((1 - usd_par / bn(par_in)) * 100, 1), "hash", spec_hash)
