/**
 * FE-FOCUS — Focus-stage transitions ([C-FOCUS], [C-COMPANY-ZOOM]), point focus targets,
 * and bond schedule sparkline ($bn, hidden when schedule is missing/empty).
 */
import { state } from "./state.js?v=58";

const W = 560;
const H = 140;
const PAD = { l: 36, r: 10, t: 12, b: 26 };
const ZOOM_MS = 450;

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

/**
 * Compute target emissive, opacity, and hover scale for a company point under [C-FOCUS].
 */
export function focusPointTargets({ shellCube, selected, hovered, lit, country, whiteSphere }) {
  const noEmissive = shellCube || whiteSphere;
  const targetEmissive = noEmissive
    ? null
    : selected
      ? 2.2
      : hovered
        ? 1.9
        : lit
          ? country === "US"
            ? 0.75
            : 0.7
          : 0.06;
  const targetOpacity = lit ? 1 : 0;
  const targetHoverScale = selected
    ? whiteSphere || shellCube
      ? 1.45
      : 1.4
    : hovered
      ? 1.5
      : lit
        ? 1
        : 0.55;
  return { targetEmissive, targetOpacity, targetHoverScale };
}

/**
 * [C-COMPANY-ZOOM] Focus-stage controller for search-opened companies on a focused slice.
 */
export function createCompanyFocusStage({
  viewport,
  companyFocus,
  companyFocusBody,
  companyFocusClose,
  detailMarkup,
  renderDetail,
  onRequestClearFocus,
}) {
  let zoomToken = 0;
  let zoomOpen = false;
  let zoomExitTimer = null;
  let pendingZoomTimer = null;

  function cancelPendingZoom() {
    if (pendingZoomTimer != null) {
      clearTimeout(pendingZoomTimer);
      pendingZoomTimer = null;
    }
  }

  function enterCompanyZoom(c) {
    if (!companyFocus || !viewport || !c) return;
    if (state.focusLayer == null) return;
    cancelPendingZoom();
    if (zoomExitTimer != null) {
      clearTimeout(zoomExitTimer);
      zoomExitTimer = null;
    }
    zoomToken += 1;
    companyFocusBody.innerHTML = detailMarkup(c) + bondChartHtml(c.bondSchedule);
    companyFocus.hidden = false;
    companyFocus.setAttribute("aria-hidden", "false");
    renderDetail(c);
    requestAnimationFrame(() => {
      if (state.focusLayer == null || state.selectedId !== c.id) return;
      viewport.classList.add("company-zoom");
      companyFocus.classList.add("is-open");
      zoomOpen = true;
    });
  }

  function exitCompanyZoom() {
    cancelPendingZoom();
    if (!companyFocus || !viewport) return;
    if (!zoomOpen && companyFocus.hidden) return;
    const token = ++zoomToken;
    viewport.classList.remove("company-zoom");
    companyFocus.classList.remove("is-open");
    zoomOpen = false;
    if (zoomExitTimer != null) clearTimeout(zoomExitTimer);
    zoomExitTimer = setTimeout(() => {
      zoomExitTimer = null;
      if (token !== zoomToken) return;
      companyFocus.hidden = true;
      companyFocus.setAttribute("aria-hidden", "true");
      companyFocusBody.innerHTML = "";
    }, ZOOM_MS);
  }

  function scheduleCompanyZoom(c, delayMs) {
    cancelPendingZoom();
    const id = c.id;
    pendingZoomTimer = setTimeout(() => {
      pendingZoomTimer = null;
      if (state.selectedId !== id || state.focusLayer == null) return;
      enterCompanyZoom(c);
    }, delayMs);
  }

  if (companyFocusClose) {
    companyFocusClose.addEventListener("click", (e) => {
      e.stopPropagation();
      onRequestClearFocus?.();
    });
  }
  if (companyFocus) {
    companyFocus.addEventListener("click", (e) => {
      if (e.target.closest(".company-focus-inner")) return;
      if (e.target.closest(".company-focus-close")) return;
      onRequestClearFocus?.();
    });
  }

  return {
    enterCompanyZoom,
    exitCompanyZoom,
    scheduleCompanyZoom,
    cancelPendingZoom,
  };
}
