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
  mode: "stack",
  selectedYear: null,
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

function bondsMaturingIn(yearKey) {
  if (yearKey === "2060+") {
    return state.bonds.filter((b) => Number(String(b.maturity).slice(0, 4)) >= 2060);
  }
  const y = Number(yearKey);
  return state.bonds.filter((b) => Number(String(b.maturity).slice(0, 4)) === y);
}

function renderDetail(row) {
  if (!row) {
    detail.innerHTML = `<p>Click a bar to expand that year’s coupon vs principal and related maturities.</p>`;
    return;
  }
  const mats = bondsMaturingIn(row.year);
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
    <h3>${row.year}</h3>
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
    const b = document.createElement("button");
    b.type = "button";
    b.className = String(state.selectedYear) === String(row.year) ? "active" : "";
    b.innerHTML = `<span>${row.year}</span><span>${money(row.total)}</span>`;
    b.addEventListener("click", () => selectYear(row));
    yearList.appendChild(b);
  });
}

function selectYear(row) {
  state.selectedYear = row ? row.year : null;
  renderDetail(row);
  renderYearList();
  paint();
  statusBar.textContent = row
    ? `Year ${row.year} · coupon ${money(row.coupon)} · principal ${money(row.principal)} · total ${money(row.total)}`
    : `All years · ${state.rows.length} buckets · total ${money(state.meta.totalOutflowUsd)}`;
}

function paint() {
  drawCashflowChart(chart, state.rows, {
    mode: state.mode,
    selectedYear: state.selectedYear,
    onSelect: (row) => selectYear(row),
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

async function boot() {
  try {
    const res = await fetch("/api/bundle");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const bundle = await res.json();
    state.meta = bundle.meta;
    state.bonds = bundle.bonds;
    state.rows = bundle.series.byYear;
    loading.hidden = true;
    app.hidden = false;
    renderSummary();
    chartSub.textContent = `stacked · USD · as of ${state.meta.asOf}`;
    selectYear(null);
    paint();

    document.querySelectorAll(".chip[data-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.mode = btn.dataset.mode;
        document.querySelectorAll(".chip[data-mode]").forEach((b) => b.classList.toggle("active", b === btn));
        chartSub.textContent =
          state.mode === "stack"
            ? `stacked · USD · as of ${state.meta.asOf}`
            : `total line · USD · as of ${state.meta.asOf}`;
        paint();
      });
    });
    document.getElementById("resetSel").addEventListener("click", () => selectYear(null));
    window.addEventListener("resize", () => paint());
  } catch (err) {
    loading.textContent = String(err && err.message ? err.message : err);
  }
}

boot();
