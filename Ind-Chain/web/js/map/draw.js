/**
 * FE-MAPDRAW — PlotSpec -> HTML/SVG string ([C-PLOT]). Hand-written, no chart library, no CDN.
 * Knows band/linear scales and rect/text/line marks only; does not know where the data came from, and
 * does not know any color: tone is a class, the paper skin (css/plot-paper.css) owns every value.
 * `opts.density` ("compact" | "sheet") changes layout only. The root is self-contained
 * (`.pm-sheet.pm-skin-paper`) so a future exporter can lift it out with plot-paper.css alone.
 * Must not import scene / ui / api / state.
 */

const LAYOUT = {
  sheet: { W: 1040, H: 330, PAD: { l: 40, r: 10, t: 20, b: 44 }, qLabels: true, allValues: true, yearY: 28, tickLen: 32 },
  compact: { W: 372, H: 178, PAD: { l: 20, r: 4, t: 14, b: 22 }, qLabels: false, allValues: false, yearY: 12, tickLen: 16 },
};

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}
const f1 = (x) => x.toFixed(1);
const toneName = (t) => String(t || "neutral").replace(/[^a-z-]/g, "");

function kpiHtml(k) {
  return (
    `<div class="pm-kpi" data-kpi="${esc(k.id)}" title="${esc(k.text)}">` +
    `<div class="pm-kpi-n">${Number(k.value).toFixed(1)}</div>` +
    `<div class="pm-kpi-u">${esc(k.unit)}</div>` +
    `<div class="pm-kpi-t">${esc(k.text)}</div></div>`
  );
}

function pairSvg(spec, L) {
  const { W, H } = L;
  const pair = spec.pair || {};
  const from = esc(pair.fromName || "—");
  const to = esc(pair.toName || "—");
  const side = esc(pair.side === "supplier" ? "supplier" : "customer");
  const pct =
    typeof pair.pct === "number" && Number.isFinite(pair.pct) ? `${pair.pct.toFixed(2)}%` : "share n/a";
  const y = H / 2;
  const x0 = 56;
  const x1 = W - 56;
  const xm = W / 2;
  return (
    `<svg class="pm-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(spec.title)}">` +
    `<circle class="pm-pair-node" cx="${x0}" cy="${y}" r="18" />` +
    `<circle class="pm-pair-node" cx="${x1}" cy="${y}" r="18" />` +
    `<line class="pm-pair-edge pm-tone-${toneName(pair.side === "supplier" ? "muted" : "neutral")}" x1="${x0 + 22}" y1="${y}" x2="${x1 - 22}" y2="${y}" />` +
    `<text class="pm-pair-label" x="${x0}" y="${y + 36}" text-anchor="middle">${from}</text>` +
    `<text class="pm-pair-label" x="${x1}" y="${y + 36}" text-anchor="middle">${to}</text>` +
    `<text class="pm-pair-mid" x="${xm}" y="${y - 10}" text-anchor="middle">${side} · ${esc(pct)}</text>` +
    `</svg>`
  );
}

/** Fallback CONUS if outline bake missing — semantic tones only (colors in plot-paper.css). */
const US_RING_FALLBACK = [
  [-124.7, 48.4], [-117.0, 49.0], [-95.2, 49.0], [-83.0, 46.2], [-67.0, 44.8],
  [-70.8, 41.3], [-75.5, 36.6], [-81.5, 30.4], [-89.5, 29.0], [-97.4, 25.9],
  [-106.5, 31.8], [-117.1, 32.5], [-122.5, 37.0], [-124.7, 42.0], [-124.7, 48.4],
];

function usMapSvg(spec, L) {
  const m = spec.usMap || {};
  const b = m.bounds || { lonMin: -125, lonMax: -66, latMin: 24, latMax: 50 };
  const { W, H, PAD } = L;
  const x0 = PAD.l;
  const y0 = PAD.t;
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const px = (lon) => x0 + ((lon - b.lonMin) / (b.lonMax - b.lonMin)) * iw;
  const py = (lat) => y0 + ih - ((lat - b.latMin) / (b.latMax - b.latMin)) * ih;
  const rings =
    Array.isArray(m.outline?.rings) && m.outline.rings.length
      ? m.outline.rings
      : [US_RING_FALLBACK];
  const land = rings
    .map((ring) => {
      const d =
        ring.map(([lon, lat], i) => `${i ? "L" : "M"}${f1(px(lon))} ${f1(py(lat))}`).join(" ") + " Z";
      return `<path class="pm-us-land" d="${d}" />`;
    })
    .join("");
  const center = m.center || {};
  const cx = px(center.lon);
  const cy = py(center.lat);
  const arcs = (m.points || [])
    .map((p) => {
      const x = px(p.lon);
      const y = py(p.lat);
      const mx = (cx + x) / 2;
      const my = Math.min(cy, y) - 28;
      const tone = p.side === "supplier" ? "muted" : "neutral";
      return `<path class="pm-us-arc pm-tone-${tone}" d="M${f1(cx)} ${f1(cy)} Q${f1(mx)} ${f1(my)} ${f1(x)} ${f1(y)}" fill="none" />` +
        `<circle class="pm-us-dot pm-tone-${tone}" cx="${f1(x)}" cy="${f1(y)}" r="3.2" />`;
    })
    .join("");
  return (
    `<svg class="pm-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(spec.title)}">` +
    land +
    arcs +
    `<circle class="pm-us-hub" cx="${f1(cx)}" cy="${f1(cy)}" r="5" />` +
    `<text class="pm-us-hub-label" x="${f1(cx)}" y="${f1(cy - 10)}" text-anchor="middle">NVDA</text>` +
    `</svg>`
  );
}

function usTablesHtml(spec) {
  const m = spec.usMap || {};
  const cell = (r) => {
    const pct = r.pct == null ? "—" : `${Number(r.pct).toFixed(2)}%`;
    return `<tr><td>${esc(r.name)}</td><td>${esc(r.ticker.split(" ")[0] || r.ticker)}</td><td>${esc(pct)}</td></tr>`;
  };
  const table = (title, rows) =>
    `<div class="pm-us-col"><h4 class="pm-us-h">${esc(title)}</h4>` +
    `<table class="pm-us-table"><thead><tr><th>Name</th><th>Ticker</th><th>Share</th></tr></thead>` +
    `<tbody>${(rows || []).map(cell).join("") || "<tr><td colspan='3'>—</td></tr>"}</tbody></table></div>`;
  return `<div class="pm-us-tables">${table("Suppliers", m.suppliers)}${table("Customers", m.customers)}</div>`;
}

function svgOf(spec, L) {
  if (spec.layout === "pair" || spec.mappingId === "PM-REV-LINK") return pairSvg(spec, L);
  if (spec.layout === "us-map" || spec.mappingId === "PM-US-MAP") return usMapSvg(spec, L);
  const sx = (spec.scales || []).find((s) => s.kind === "band");
  const sy = (spec.scales || []).find((s) => s.kind === "linear");
  if (!sx || !sy) return "";
  const { W, H, PAD } = L;
  const x0 = PAD.l;
  const x1 = W - PAD.r;
  const yt = PAD.t;
  const yb = H - PAD.b;
  const n = sx.domain.length;
  const band = (x1 - x0) / n;
  const bw = band * 0.66;
  const [d0, d1] = sy.domain;
  const px = (label) => x0 + (sx.domain.indexOf(label) + 0.5) * band;
  const py = (v) => yb - ((v - d0) / (d1 - d0)) * (yb - yt);
  const inDomain = (m) => sx.domain.indexOf(m.x) >= 0;

  const out = [`<svg class="pm-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(spec.title)}">`];
  (sx.groups || []).forEach((g, i) => {
    const a = x0 + g.from * band;
    const b = x0 + (g.to + 1) * band;
    if (i % 2 === 1) out.push(`<rect class="pm-yband" x="${f1(a)}" y="${yt}" width="${f1(b - a)}" height="${yb - yt}" />`);
  });
  spec.marks.forEach((m) => {
    if (m.type !== "line") return;
    const y = py(m.y);
    out.push(`<line class="pm-line pm-line-${toneName(m.tone)}" x1="${x0}" x2="${x1}" y1="${f1(y)}" y2="${f1(y)}" />`);
  });
  (sy.ticks || []).forEach((v) => {
    out.push(`<text class="pm-tick" x="${x0 - 5}" y="${f1(py(v) + 3)}" text-anchor="end">${v}</text>`);
  });
  const tops = new Map();
  spec.marks.forEach((m) => {
    if (m.type !== "rect" || !inDomain(m)) return;
    const top = py(m.y);
    const base = py(m.y0);
    if (base - top <= 0) return;
    tops.set(m.x, Math.max(tops.get(m.x) || 0, m.y));
    const title = m.tip ? `<title>${esc(m.tip)}</title>` : "";
    out.push(`<rect class="pm-bar pm-tone-${toneName(m.tone)}" x="${f1(px(m.x) - bw / 2)}" y="${f1(top)}" width="${f1(bw)}" height="${f1(base - top)}">${title}</rect>`);
  });
  const labeled = new Set();
  spec.marks.forEach((m) => {
    if (m.type !== "text" || !inDomain(m)) return;
    labeled.add(m.x);
    out.push(`<text class="pm-val${m.emph ? " pm-peak" : ""}" x="${f1(px(m.x))}" y="${f1(py(m.y) - 4)}" text-anchor="middle">${esc(m.text)}</text>`);
  });
  if (L.allValues) {
    tops.forEach((v, x) => {
      if (!labeled.has(x)) out.push(`<text class="pm-val" x="${f1(px(x))}" y="${f1(py(v) - 4)}" text-anchor="middle">${f1(v)}</text>`);
    });
  }
  if (L.qLabels) {
    (sx.tickLabels || []).forEach((t, i) => {
      out.push(`<text class="pm-qlabel" x="${f1(x0 + (i + 0.5) * band)}" y="${yb + 12}" text-anchor="middle">${esc(t)}</text>`);
    });
  }
  (sx.groups || []).forEach((g, i) => {
    const a = x0 + g.from * band;
    const b = x0 + (g.to + 1) * band;
    const short = !L.qLabels && b - a < 22;
    const label = short ? `'${String(g.label).slice(2)}` : g.label;
    out.push(`<text class="pm-year" x="${f1((a + b) / 2)}" y="${yb + L.yearY}" text-anchor="middle">${esc(label)}</text>`);
    if (i > 0) out.push(`<line class="pm-ytick" x1="${f1(a)}" x2="${f1(a)}" y1="${yb}" y2="${yb + L.tickLen}" />`);
  });
  out.push("</svg>");
  return out.join("");
}

/**
 * @param {object} spec PlotSpec v1 from project(); returns "" when it is not drawable.
 * @param {{density?: "compact"|"sheet"}} [opts]
 */
export function drawPlot(spec, opts = {}) {
  if (!spec || spec.v !== 1 || !Array.isArray(spec.scales) || !Array.isArray(spec.marks)) return "";
  const density = opts.density === "sheet" ? "sheet" : "compact";
  const svg = svgOf(spec, LAYOUT[density]);
  if (!svg) return "";
  const sx = spec.scales.find((s) => s.kind === "band");
  const sy = spec.scales.find((s) => s.kind === "linear");
  const legend = (spec.legend || [])
    .map((l) => `<span class="pm-leg"><i class="pm-sw pm-tone-${toneName(l.tone)}"></i>${esc(l.text)}</span>`)
    .join("");
  const notes = spec.notes || [];
  const sheet = density === "sheet";
  const notesHtml = sheet && notes.length ? `<ul class="pm-notes">${notes.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : "";
  const info = !sheet && notes.length ? ` <span class="pm-info" title="${esc(notes.join(" · "))}">ⓘ</span>` : "";
  const foot = `${sheet && sx ? `x: ${esc(sx.label)} · ` : ""}${esc(spec.footnote || "")}${info}`;
  const tables =
    spec.layout === "us-map" || spec.mappingId === "PM-US-MAP" ? usTablesHtml(spec) : "";
  return (
    `<section class="pm-sheet pm-skin-paper" data-mapping="${esc(spec.mappingId)}" data-density="${density}" aria-label="${esc(spec.title)}">` +
    `<div class="pm-head"><span class="pm-title">${esc(spec.title)}</span>${spec.subtitle && (!sy || spec.subtitle !== sy.label) ? `<span class="pm-sub">${esc(spec.subtitle)}</span>` : ""}</div>` +
    `<div class="pm-kpis">${(spec.kpis || []).map(kpiHtml).join("")}</div>` +
    `<div class="pm-meta"><span class="pm-unit">${esc(sy ? sy.label : "")}</span><span class="pm-legend">${legend}</span></div>` +
    `<div class="pm-chart">${svg}</div>` +
    tables +
    `<p class="pm-foot">${foot}</p>${notesHtml}</section>`
  );
}
