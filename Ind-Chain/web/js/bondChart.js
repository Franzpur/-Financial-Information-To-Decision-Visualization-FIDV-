/**
 * Bond schedule sparkline for [C-COMPANY-ZOOM] (search-open path).
 * Units: $bn. Hidden entirely when schedule is missing/empty.
 */

const W = 560;
const H = 140;
const PAD = { l: 36, r: 10, t: 12, b: 26 };

function seriesPoints(rows, key, x0, y0, plotW, plotH, yMax) {
  const n = rows.length;
  if (n < 2) return "";
  return rows
    .map((r, i) => {
      const x = x0 + (i / (n - 1)) * plotW;
      const v = Number(r[key]) || 0;
      const y = y0 + plotH - (v / yMax) * plotH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

/** @param {Array<{year:number, principalBn?:number, interestBn?:number, totalBn?:number}>} schedule */
export function bondChartHtml(schedule) {
  if (!Array.isArray(schedule) || schedule.length < 2) return "";

  const rows = schedule
    .filter((r) => r && r.year != null)
    .slice()
    .sort((a, b) => a.year - b.year);
  if (rows.length < 2) return "";

  const yMaxRaw = Math.max(
    ...rows.map((r) =>
      Math.max(Number(r.totalBn) || 0, Number(r.principalBn) || 0, Number(r.interestBn) || 0)
    ),
    0.01
  );
  const step = yMaxRaw <= 0.2 ? 0.05 : yMaxRaw <= 1 ? 0.2 : 0.2;
  const yMax = Math.ceil(yMaxRaw / step) * step;

  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const x0 = PAD.l;
  const y0 = PAD.t;

  const totalPts = seriesPoints(rows, "totalBn", x0, y0, plotW, plotH, yMax);
  const prinPts = seriesPoints(rows, "principalBn", x0, y0, plotW, plotH, yMax);
  const intPts = seriesPoints(rows, "interestBn", x0, y0, plotW, plotH, yMax);

  const yTicks = 3;
  const yTickEls = [];
  for (let i = 0; i <= yTicks; i++) {
    const v = (yMax * i) / yTicks;
    const y = y0 + plotH - (v / yMax) * plotH;
    yTickEls.push(
      `<line class="bond-grid" x1="${x0}" y1="${y.toFixed(1)}" x2="${(x0 + plotW).toFixed(1)}" y2="${y.toFixed(1)}" />` +
        `<text class="bond-tick" x="${x0 - 6}" y="${(y + 3).toFixed(1)}" text-anchor="end">${v.toFixed(v < 1 ? 2 : 1)}</text>`
    );
  }

  const year0 = rows[0].year;
  const year1 = rows[rows.length - 1].year;
  const mid = rows[Math.floor(rows.length / 2)].year;
  const xLabels = [
    { year: year0, i: 0 },
    { year: mid, i: Math.floor(rows.length / 2) },
    { year: year1, i: rows.length - 1 },
  ];
  const xTickEls = xLabels.map(({ year, i }) => {
    const x = x0 + (i / (rows.length - 1)) * plotW;
    return `<text class="bond-tick" x="${x.toFixed(1)}" y="${H - 6}" text-anchor="middle">${year}</text>`;
  });

  return `
    <section class="bond-chart" aria-label="Bond schedule chart">
      <div class="bond-chart-head">
        <span class="bond-chart-title">Bond schedule · $bn</span>
        <span class="bond-chart-legend" aria-hidden="true">
          <span class="bond-leg total"></span>Total
          <span class="bond-leg principal"></span>Principal
          <span class="bond-leg interest"></span>Interest
        </span>
      </div>
      <svg class="bond-chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Bond payments ${year0}–${year1}">
        ${yTickEls.join("")}
        <line class="bond-axis" x1="${x0}" y1="${y0 + plotH}" x2="${x0 + plotW}" y2="${y0 + plotH}" />
        <polyline class="bond-line interest" fill="none" points="${intPts}" />
        <polyline class="bond-line principal" fill="none" points="${prinPts}" />
        <polyline class="bond-line total" fill="none" points="${totalPts}" />
        ${xTickEls.join("")}
      </svg>
    </section>
  `;
}
