/**
 * FE-MAPOUT — PNG export of the paper root (`.pm-sheet.pm-skin-paper`).
 * Composites title / KPI text from the DOM with a rasterized `.pm-svg` (CSS inlined into the SVG).
 * No foreignObject (unreliable across browsers). No dock chrome. No redaction.
 */
const PAPER_CSS = "/css/plot-paper.css?v=4";
const BG = "#f7f5f0";
const INK = "#1a1f26";
const MUTED = "#4a5560";

function basename(mappingId) {
  const id = String(mappingId || "map").replace(/[^A-Za-z0-9._-]+/g, "-");
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `${id}-${stamp}.png`;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function rasterizeSvg(svgEl, cssText) {
  const clone = svgEl.cloneNode(true);
  if (!clone.getAttribute("xmlns")) clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const vb = clone.viewBox?.baseVal;
  const w = Math.max(1, Math.round(vb?.width || svgEl.clientWidth || 372));
  const h = Math.max(1, Math.round(vb?.height || svgEl.clientHeight || 178));
  clone.setAttribute("width", String(w));
  clone.setAttribute("height", String(h));
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = cssText || "";
  clone.insertBefore(style, clone.firstChild);
  const xml = new XMLSerializer().serializeToString(clone);
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  try {
    const img = await loadImage(url);
    return { img, w, h };
  } finally {
    /* data URI — nothing to revoke */
  }
}

function drawKpis(ctx, root, x, y, width) {
  const kpis = [...root.querySelectorAll(".pm-kpi")];
  if (!kpis.length) return y;
  const cols = Math.min(4, kpis.length);
  const cellW = width / cols;
  const rowH = 64;
  const rows = Math.ceil(kpis.length / cols);
  ctx.strokeStyle = "#c5ccd4";
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, rowH * rows - 1);
  kpis.forEach((el, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = x + col * cellW;
    const cy = y + row * rowH;
    if (col > 0) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy + rowH);
      ctx.stroke();
    }
    if (row > 0) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + cellW, cy);
      ctx.stroke();
    }
    const n = el.querySelector(".pm-kpi-n")?.textContent?.trim() || "";
    const u = el.querySelector(".pm-kpi-u")?.textContent?.trim() || "";
    const t = el.querySelector(".pm-kpi-t")?.textContent?.trim() || "";
    ctx.fillStyle = INK;
    ctx.font = "600 22px 'Iowan Old Style', Palatino, serif";
    ctx.fillText(n, cx + 10, cy + 28);
    ctx.fillStyle = MUTED;
    ctx.font = "400 11px -apple-system, system-ui, sans-serif";
    if (u) ctx.fillText(u, cx + 10, cy + 44);
    if (t) ctx.fillText(t.slice(0, 42), cx + 10, cy + 58);
  });
  return y + rowH * rows + 12;
}

/**
 * @param {HTMLElement} host  element that contains `.pm-sheet.pm-skin-paper`
 * @param {{filename?: string}} [opts]
 * @returns {Promise<boolean>} true when a download was started
 */
export async function exportPaperPng(host, opts = {}) {
  const root = host?.querySelector?.(".pm-sheet.pm-skin-paper");
  if (!root) return false;
  const svgEl = root.querySelector("svg.pm-svg");
  if (!svgEl) return false;

  let css = "";
  try {
    css = await fetch(PAPER_CSS).then((r) => (r.ok ? r.text() : ""));
  } catch {
    css = "";
  }

  const { img, w: chartW, h: chartH } = await rasterizeSvg(svgEl, css);
  const padX = 36;
  const padTop = 28;
  const title = root.querySelector(".pm-title")?.textContent?.trim() || root.getAttribute("aria-label") || "";
  const sub = root.querySelector(".pm-sub")?.textContent?.trim() || "";
  const unit = root.querySelector(".pm-unit")?.textContent?.trim() || "";
  const foot = root.querySelector(".pm-foot")?.textContent?.trim() || "";
  const outW = Math.max(chartW + padX * 2, 720);
  const scale = outW / (chartW + padX * 2);
  const chartDrawW = chartW * scale;
  const chartDrawH = chartH * scale;

  const canvas = document.createElement("canvas");
  const probe = canvas.getContext("2d");
  if (!probe) return false;
  // Measure header + kpis height with a temporary pass on an oversized canvas later cropped — allocate generously.
  const headerH = title ? 48 : 12;
  const kpiH = root.querySelectorAll(".pm-kpi").length ? Math.ceil(root.querySelectorAll(".pm-kpi").length / 4) * 64 + 12 : 0;
  const metaH = unit ? 22 : 0;
  const footH = foot ? 28 : 0;
  const outH = padTop + headerH + kpiH + metaH + chartDrawH + footH + 24;
  const px = 2;
  canvas.width = Math.ceil(outW * px);
  canvas.height = Math.ceil(outH * px);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(px, 0, 0, px, 0, 0);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, outW, outH);

  let y = padTop;
  if (title) {
    ctx.fillStyle = INK;
    ctx.font = "600 18px 'Iowan Old Style', Palatino, serif";
    ctx.fillText(title, padX, y + 18);
    if (sub) {
      ctx.fillStyle = MUTED;
      ctx.font = "400 12px -apple-system, system-ui, sans-serif";
      ctx.fillText(sub, padX, y + 36);
    }
    y += headerH;
  }
  y = drawKpis(ctx, root, padX, y, outW - padX * 2);
  if (unit) {
    ctx.fillStyle = MUTED;
    ctx.font = "400 11px -apple-system, system-ui, sans-serif";
    ctx.fillText(unit, padX, y + 12);
    y += metaH;
  }
  ctx.drawImage(img, padX, y, chartDrawW, chartDrawH);
  y += chartDrawH + 10;
  if (foot) {
    ctx.fillStyle = MUTED;
    ctx.font = "400 11px -apple-system, system-ui, sans-serif";
    ctx.fillText(foot.slice(0, 120), padX, y + 12);
  }

  const png = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!png) return false;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(png);
  a.download = opts.filename || basename(root.dataset.mapping);
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return true;
}
