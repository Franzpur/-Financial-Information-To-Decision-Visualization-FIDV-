import { drawCashflowChart, fmtUsd } from "./chart.js";

const loading = document.getElementById("loading");
const app = document.getElementById("app");
const summaryKv = document.getElementById("summaryKv");
const heroTotal = document.getElementById("heroTotal");
const heroSub = document.getElementById("heroSub");
const mixBar = document.getElementById("mixBar");
const mixLabels = document.getElementById("mixLabels");
const chart = document.getElementById("chart");
const chartSub = document.getElementById("chartSub");
const peakChip = document.getElementById("peakChip");
const statusBar = document.getElementById("statusBar");
const detail = document.getElementById("detail");
const yearList = document.getElementById("yearList");
const tip = document.getElementById("tip");
const chartWrap = document.getElementById("chartWrap");

const state = {
  meta: null,
  bonds: [],
  rows: [],
  series: null,
  scale: "quarter",
  mode: "stack",
  selectedPeriod: null,
};

function money(n) {
  return fmtUsd(n, true);
}

function pct(part, whole) {
  if (!whole) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}

function renderSummary() {
  const m = state.meta;
  const whole = m.totalOutflowUsd || 1;
  heroTotal.textContent = money(m.totalOutflowUsd);
  heroSub.textContent = `${m.bondCount} securities · as of ${m.asOf}`;
  mixBar.innerHTML = `
    <span class="coupon" style="width:${(m.totalCouponUsd / whole) * 100}%"></span>
    <span class="principal" style="width:${(m.totalPrincipalUsd / whole) * 100}%"></span>
  `;
  mixLabels.innerHTML = `
    <span>Coupon <b>${pct(m.totalCouponUsd, whole)}</b></span>
    <span>Principal <b>${pct(m.totalPrincipalUsd, whole)}</b></span>
  `;
  summaryKv.innerHTML = `
    <div class="metric coupon"><span>Coupon</span><strong>${money(m.totalCouponUsd)}</strong></div>
    <div class="metric principal"><span>Principal</span><strong>${money(m.totalPrincipalUsd)}</strong></div>
  `;
}

function bondsMaturingIn(periodKey) {
  if (periodKey === "2060+") {
    return state.bonds.filter((b) => Number(String(b.maturity).slice(0, 4)) >= 2060);
  }
  if (/^\d{4}$/.test(String(periodKey))) {
    const y = Number(periodKey);
    return state.bonds.filter((b) => Number(String(b.maturity).slice(0, 4)) === y);
  }
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

function shortLabel(key) {
  const s = String(key);
  if (s.endsWith("+")) return "tail";
  if (s.includes("-Q")) return s.slice(5);
  return s;
}

function renderDetail(row) {
  if (!row) {
    detail.innerHTML = `<p class="empty">Click a column to split that period into coupon and principal, and list bonds maturing in the window.</p>`;
    return;
  }
  const key = periodKey(row);
  const mats = bondsMaturingIn(key).slice().sort((a, b) => b.amtOutUsd - a.amtOutUsd);
  const whole = row.total || 1;
  const list = mats
    .slice(0, 8)
    .map((b) => {
      const rate = b.coupon != null ? `${b.coupon.toFixed(3)}%` : "—";
      return `<div class="mat">
        <div>
          <div class="mat-name">${rate} · ${b.currency}</div>
          <div class="mat-sub">${b.maturity}${b.freqLabel ? ` · ${b.freqLabel}` : ""}</div>
        </div>
        <strong>${money(b.amtOutUsd)}</strong>
      </div>`;
    })
    .join("");
  const matNote = mats.length
    ? `<div class="mat-h">${mats.length} maturing</div>${list}`
    : `<p class="note">No principal due in this window.</p>`;
  detail.innerHTML = `
    <div class="detail-card">
      <h3>${key}</h3>
      <div class="meta">Expanded liability outflow</div>
      <div class="share">
        <span class="principal" style="width:${(row.principal / whole) * 100}%"></span>
        <span class="coupon" style="width:${(row.coupon / whole) * 100}%"></span>
      </div>
      <div class="kv">
        <span>Coupon</span><strong>${money(row.coupon)}</strong>
        <span>Principal</span><strong>${money(row.principal)}</strong>
        <span>Total</span><strong>${money(row.total)}</strong>
      </div>
      ${matNote}
      ${mats.length > 8 ? `<p class="note more">+${mats.length - 8} more</p>` : ""}
    </div>
  `;
}

function miniBar(row) {
  const whole = row.total || 1;
  return `<span class="mini" aria-hidden="true"><i class="p" style="width:${(row.principal / whole) * 100}%"></i><i class="c" style="width:${(row.coupon / whole) * 100}%"></i></span>`;
}

function periodButton(row) {
  const key = periodKey(row);
  const b = document.createElement("button");
  b.type = "button";
  if (String(state.selectedPeriod) === String(key)) b.className = "active";
  const lab = state.scale === "quarter" ? shortLabel(key) : key;
  b.innerHTML = `<span>${lab}</span>${miniBar(row)}<span class="amt">${money(row.total)}</span>`;
  b.addEventListener("click", () => selectPeriod(row));
  return b;
}

function renderYearList() {
  yearList.innerHTML = "";
  yearList.classList.toggle("flat", state.scale === "year");
  if (state.scale === "year") {
    state.rows.forEach((row) => yearList.appendChild(periodButton(row)));
  } else {
    const groups = new Map();
    state.rows.forEach((row) => {
      const key = String(periodKey(row));
      const year = key.endsWith("+") ? "2060+" : key.slice(0, 4);
      if (!groups.has(year)) groups.set(year, []);
      groups.get(year).push(row);
    });
    groups.forEach((rows, year) => {
      const total = rows.reduce((sum, r) => sum + r.total, 0);
      const block = document.createElement("div");
      block.className = "year-block";
      const head = document.createElement("div");
      const active = rows.some((r) => String(periodKey(r)) === String(state.selectedPeriod));
      head.className = active ? "year-h has-active" : "year-h";
      head.innerHTML = `<span>${year}</span><span>${money(total)}</span>`;
      block.appendChild(head);
      rows.forEach((row) => block.appendChild(periodButton(row)));
      yearList.appendChild(block);
    });
  }
  const active = yearList.querySelector("button.active");
  if (active) active.scrollIntoView({ block: "nearest" });
}

function selectPeriod(row) {
  state.selectedPeriod = row ? periodKey(row) : null;
  renderDetail(row);
  renderYearList();
  paint();
  statusBar.textContent = row
    ? `${periodKey(row)} · coupon ${money(row.coupon)} · principal ${money(row.principal)} · total ${money(row.total)}`
    : `${state.scale} · ${state.rows.length} periods · book ${money(state.meta.totalOutflowUsd)}`;
}

function paint() {
  const rows = state.rows.map((r) => ({ ...r, year: periodKey(r) }));
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
      const whole = row.total || 1;
      tip.hidden = false;
      tip.innerHTML = `
        <div class="tip-k">${row.year}</div>
        <div class="tip-row"><span>Coupon</span><b>${money(row.coupon)}</b></div>
        <div class="tip-row"><span>Principal</span><b>${money(row.principal)}</b></div>
        <div class="tip-row"><span>Total</span><b>${money(row.total)}</b></div>
        <div class="tip-bar"><span class="p" style="width:${(row.principal / whole) * 100}%"></span><span class="c" style="width:${(row.coupon / whole) * 100}%"></span></div>
      `;
      const rect = chartWrap.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      tip.style.left = `${Math.min(Math.max(x, 96), rect.width - 96)}px`;
      tip.style.top = `${Math.max(y, 78)}px`;
    },
  });
}

function peakRow() {
  return state.rows.reduce((best, row) => (!best || row.total > best.total ? row : best), null);
}

function renderPeak() {
  const row = peakRow();
  if (!row) {
    peakChip.textContent = "Peak —";
    return;
  }
  peakChip.textContent = `Peak ${periodKey(row)} · ${money(row.total)}`;
}

function applyScale(scale) {
  state.scale = scale;
  if (scale === "year") state.rows = state.series.byYear;
  else state.rows = state.series.byQuarterChart || state.series.byQuarter;
  updateChartSub();
  renderPeak();
}

function updateChartSub() {
  const scaleLabel = state.scale === "year" ? "annual" : "quarterly, clustered by year";
  const modeLabel = state.mode === "stack" ? "stacked" : "total";
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

    document.querySelectorAll(".chip[data-scale]").forEach((btn) => {
      btn.addEventListener("click", () => {
        applyScale(btn.dataset.scale);
        document.querySelectorAll(".chip[data-scale]").forEach((b) => b.classList.toggle("active", b === btn));
        selectPeriod(null);
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
    peakChip.addEventListener("click", () => selectPeriod(peakRow()));
    window.addEventListener("resize", () => paint());
  } catch (err) {
    loading.textContent = String(err && err.message ? err.message : err);
  }
}

boot();
