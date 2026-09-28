import { drawCashflowChart, fmtUsd } from "./chart.js";

const loading = document.getElementById("loading");
const app = document.getElementById("app");
const summaryKv = document.getElementById("summaryKv");
const chart = document.getElementById("chart");
const chartSub = document.getElementById("chartSub");
const statusBar = document.getElementById("statusBar");
const detail = document.getElementById("detail");
const yearList = document.getElementById("yearList");
const tip = document.getElementById("tip");
const chartWrap = document.getElementById("chartWrap");

const state = {
  meta: null,
  bonds: [],
  rows: [],
  scale: "quarter", // quarter | year
  mode: "stack",
  selectedPeriod: null,
};

function money(n) {
  return fmtUsd(n, true);
}

function renderSummary() {
  const m = state.meta;
  summaryKv.innerHTML = `
    <span>Securities</span><strong>${m.bondCount}</strong>
    <span>As of</span><strong>${m.asOf}</strong>
    <span>Coupon outflow</span><strong>${money(m.totalCouponUsd)}</strong>
    <span>Principal outflow</span><strong>${money(m.totalPrincipalUsd)}</strong>
    <span>Total expanded CF</span><strong>${money(m.totalOutflowUsd)}</strong>
  `;
}

function bondsMaturingIn(periodKey) {
  if (periodKey === "2060+") {
    return state.bonds.filter((b) => Number(String(b.maturity).slice(0, 4)) >= 2060);
  }
  // Year bucket: "2031"
  if (/^\d{4}$/.test(String(periodKey))) {
    const y = Number(periodKey);
    return state.bonds.filter((b) => Number(String(b.maturity).slice(0, 4)) === y);
  }
  // Quarter bucket: "2031-Q3"
  const m = String(periodKey).match(/^(\d{4})-Q([1-4])$/);
  if (!m) return [];
  const y = Number(m[1]);
  const q = Number(m[2]);
  const startMonth = (q - 1) * 3 + 1;
  const endMonth = startMonth + 2;
  return state.bonds.filter((b) => {
    const d = String(b.maturity);
    const by = Number(d.slice(0, 4));
    const bm = Number(d.slice(5, 7));
    return by === y && bm >= startMonth && bm <= endMonth;
  });
}

function periodKey(row) {
  return row.quarter != null ? row.quarter : row.year;
}

function renderDetail(row) {
  if (!row) {
    detail.innerHTML = `<p>Click a bar to expand that quarter’s coupon vs principal and related maturities.</p>`;
    return;
  }
  const key = periodKey(row);
  const mats = bondsMaturingIn(key);
  const list = mats
    .slice(0, 12)
    .map(
      (b) =>
        `<div style="display:flex;justify-content:space-between;gap:8px;padding:3px 0;border-bottom:1px solid #1c222b;">
          <span>${b.coupon != null ? b.coupon.toFixed(3) + "%" : "—"} · ${b.currency}</span>
          <span>${money(b.amtOutUsd)}</span>
        </div>`
    )
    .join("");
  detail.innerHTML = `
    <h3>${key}</h3>
    <div class="meta">Expanded liability outflows (USD)</div>
    <div class="kv">
      <span>Coupon</span><strong>${money(row.coupon)}</strong>
      <span>Principal</span><strong>${money(row.principal)}</strong>
      <span>Total</span><strong>${money(row.total)}</strong>
      <span>Maturities</span><strong>${mats.length}</strong>
    </div>
    ${mats.length ? `<div style="margin-top:10px;font-size:12px;color:#9aa6b5;">Bonds maturing in window</div>${list}` : ""}
    ${mats.length > 12 ? `<p class="note">+${mats.length - 12} more</p>` : ""}
  `;
}

function renderYearList() {
  yearList.innerHTML = "";
  state.rows.forEach((row) => {
    const key = periodKey(row);
    const b = document.createElement("button");
    b.type = "button";
    b.className = String(state.selectedPeriod) === String(key) ? "active" : "";
    b.innerHTML = `<span>${key}</span><span>${money(row.total)}</span>`;
    b.addEventListener("click", () => selectPeriod(row));
    yearList.appendChild(b);
  });
}

function selectPeriod(row) {
  state.selectedPeriod = row ? periodKey(row) : null;
  renderDetail(row);
  renderYearList();
  paint();
  statusBar.textContent = row
    ? `${periodKey(row)} · coupon ${money(row.coupon)} · principal ${money(row.principal)} · total ${money(row.total)}`
    : `${state.scale} · ${state.rows.length} buckets · total ${money(state.meta.totalOutflowUsd)}`;
}

function paint() {
  // Normalize rows so chart always uses .year as the x label field
  const rows = state.rows.map((r) => ({
    ...r,
    year: periodKey(r),
  }));
  drawCashflowChart(chart, rows, {
    mode: state.mode,
    selectedYear: state.selectedPeriod,
    onSelect: (row) => {
      const raw = state.rows.find((r) => String(periodKey(r)) === String(row.year));
      selectPeriod(raw || row);
    },
    onHover: (row, ev) => {
      if (!row || !ev) {
        tip.hidden = true;
        return;
      }
      tip.hidden = false;
      tip.innerHTML = `<strong>${row.year}</strong><br/>Coupon ${money(row.coupon)} · Principal ${money(row.principal)}<br/>Total ${money(row.total)}`;
      const rect = chartWrap.getBoundingClientRect();
      tip.style.left = `${ev.clientX - rect.left}px`;
      tip.style.top = `${ev.clientY - rect.top}px`;
    },
  });
}

function applyScale(scale) {
  state.scale = scale;
  if (scale === "year") state.rows = state.series.byYear;
  else state.rows = state.series.byQuarterChart || state.series.byQuarter;
  updateChartSub();
}

function updateChartSub() {
  const scaleLabel = state.scale === "year" ? "annual" : "quarterly";
  const modeLabel = state.mode === "stack" ? "stacked" : "total line";
  chartSub.textContent = `${scaleLabel} · ${modeLabel} · USD · as of ${state.meta.asOf}`;
}

async function boot() {

  try {
    const res = await fetch("/api/bundle");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const bundle = await res.json();
    state.meta = bundle.meta;
    state.bonds = bundle.bonds;
    state.series = bundle.series;
    applyScale("quarter");
    loading.hidden = true;
    app.hidden = false;
    renderSummary();
    selectPeriod(null);
    paint();

    document.querySelectorAll(".chip[data-scale]").forEach((btn) => {
      btn.addEventListener("click", () => {
        applyScale(btn.dataset.scale);
        document.querySelectorAll(".chip[data-scale]").forEach((b) => b.classList.toggle("active", b === btn));
        selectPeriod(null);
        paint();
      });
    });
    document.querySelectorAll(".chip[data-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.mode = btn.dataset.mode;
        document.querySelectorAll(".chip[data-mode]").forEach((b) => b.classList.toggle("active", b === btn));
        updateChartSub();
        paint();
      });
    });
    document.getElementById("resetSel").addEventListener("click", () => selectPeriod(null));
    window.addEventListener("resize", () => paint());
  } catch (err) {
    loading.textContent = String(err && err.message ? err.message : err);
  }
}

boot();
