/** Stacked / area chart for coupon + principal (FIDV palette). */

const COLORS = {
  coupon: "#3cf0ff",
  principal: "#ffb020",
  grid: "#243041",
  axis: "#8b98a8",
  year: "#c5d0dc",
  total: "#8be0c0",
  band: "rgba(255,255,255,0.028)",
  tailBand: "rgba(255,176,32,0.045)",
};

function fmtUsd(n, compact = true) {
  if (n == null || Number.isNaN(n)) return "—";
  if (!compact) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);
  }
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

function yearOf(label) {
  const s = String(label);
  if (s.endsWith("+")) return s;
  const m = s.match(/^(\d{4})/);
  return m ? m[1] : s;
}

function isTail(label) {
  return String(label).endsWith("+");
}

/** Cluster consecutive periods that share a year, and pull the residual tail aside. */
function layoutColumns(rows, innerW) {
  const items = rows.map((row, i) => {
    const label = String(row.year);
    return { row, i, label, tail: isTail(label), year: yearOf(label) };
  });
  const groups = [];
  items.forEach((it) => {
    const key = it.tail ? `tail:${it.label}` : it.year;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(it);
    else groups.push({ key, tail: it.tail, year: it.year, label: it.tail ? it.label : it.year, items: [it] });
  });

  const dense = items.length > 48;
  const groupGap = dense ? 0.55 : 0.72;
  const tailExtra = 1.15;
  let weight = 0;
  groups.forEach((g, gi) => {
    if (gi > 0) weight += g.tail ? groupGap + tailExtra : groupGap;
    weight += g.items.length;
  });
  const unit = innerW / Math.max(weight, 1);
  let cursor = 0;
  groups.forEach((g, gi) => {
    if (gi > 0) cursor += (g.tail ? groupGap + tailExtra : groupGap) * unit;
    g.x0 = cursor;
    g.items.forEach((it) => {
      const band = unit;
      const gapFrac = g.items.length > 1 ? (dense ? 0.22 : 0.28) : 0.34;
      const barW = Math.max(1.25, band * (1 - gapFrac));
      it.band = band;
      it.barW = barW;
      it.x = cursor + (band - barW) / 2;
      it.cx = cursor + band / 2;
      cursor += band;
    });
    g.x1 = cursor;
    g.cx = (g.x0 + g.x1) / 2;
  });
  return { groups };
}

function pickGroupLabels(groups, selected) {
  const single = groups.length > 0 && groups.every((g) => g.items.length === 1);
  const minPx = single ? 32 : 40;
  let last = -1e9;
  groups.forEach((g, i) => {
    const edge = i === 0 || i === groups.length - 1;
    const mark = single ? i % 2 === 0 : !g.tail && Number(g.year) % 5 === 0;
    const room = g.cx - last >= minPx;
    g.showLabel = Boolean(edge || (mark && room));
    if (g.showLabel) last = g.cx;
  });
  const lastG = groups[groups.length - 1];
  if (lastG) {
    const prev = [...groups].reverse().find((g) => g.showLabel && g !== lastG);
    if (prev && lastG.cx - prev.cx < minPx && prev !== groups[0]) prev.showLabel = false;
    lastG.showLabel = true;
  }
  if (selected == null) return;
  const hit = groups.find((g) => g.items.some((it) => it.label === String(selected)));
  if (!hit || hit.showLabel) return;
  const hitAt = groups.indexOf(hit);
  const prev = [...groups].reverse().find((g) => groups.indexOf(g) < hitAt && g.showLabel);
  const next = groups.find((g) => groups.indexOf(g) > hitAt && g.showLabel);
  if (prev && hit.cx - prev.cx < minPx && prev !== groups[0]) prev.showLabel = false;
  if (next && next.cx - hit.cx < minPx && next !== lastG) next.showLabel = false;
  hit.showLabel = true;
}

function roundTopPath(x, y, w, h, r) {
  if (h <= 0 || w <= 0) return "";
  const rr = Math.max(0, Math.min(r, w / 2, h));
  if (rr < 0.6) return `M${x},${y}h${w}v${h}h${-w}Z`;
  return `M${x},${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}H${x}Z`;
}

function el(name, attrs) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, String(v)));
  return node;
}

export function drawCashflowChart(svg, rows, opts = {}) {
  const mode = opts.mode || "stack";
  const selected = opts.selectedYear ?? null;
  const onSelect = opts.onSelect || (() => {});
  const onHover = opts.onHover || (() => {});

  const W = svg.clientWidth || 800;
  const H = svg.clientHeight || 420;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("class", selected != null ? "has-selection" : "");
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const pad = { top: 22, right: 12, bottom: 36, left: 58 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  if (!rows.length || innerW < 40 || innerH < 40) return;

  const rawMax = Math.max(...rows.map((r) => (mode === "total" ? r.total : r.coupon + r.principal)), 1);
  const STEP = 5e9;
  const maxY = Math.max(STEP, Math.ceil(rawMax / STEP) * STEP);
  const tickVals = [];
  for (let v = 0; v <= maxY + 1e-6; v += STEP) tickVals.push(v);
  const labelEvery = tickVals.length > 8 ? 2 : 1;

  const { groups } = layoutColumns(rows, innerW);
  pickGroupLabels(groups, selected);

  const defs = el("defs");
  defs.appendChild(gradient("gCoupon", "#8af7ff", "#12839a"));
  defs.appendChild(gradient("gPrincipal", "#ffd48a", "#e3941a"));
  defs.appendChild(gradient("gArea", "rgba(139,224,192,0.28)", "rgba(139,224,192,0.02)"));
  const hatch = el("pattern", {
    id: "tailHatch",
    patternUnits: "userSpaceOnUse",
    width: 6,
    height: 6,
    patternTransform: "rotate(32)",
  });
  hatch.appendChild(el("line", { x1: 0, y1: 0, x2: 0, y2: 6, stroke: "rgba(255,255,255,0.28)", "stroke-width": 1.25 }));
  defs.appendChild(hatch);
  svg.appendChild(defs);

  const g = el("g", { transform: `translate(${pad.left},${pad.top})` });
  svg.appendChild(g);

  groups.forEach((group, gi) => {
    const band = el("rect", {
      x: group.x0,
      y: 0,
      width: Math.max(0, group.x1 - group.x0),
      height: innerH,
      fill: group.tail ? COLORS.tailBand : gi % 2 === 0 ? COLORS.band : "transparent",
    });
    g.appendChild(band);
  });

  tickVals.forEach((val, i) => {
    const y = Math.round(innerH * (1 - val / maxY)) + 0.5;
    g.appendChild(el("line", {
      x1: 0,
      x2: innerW,
      y1: y,
      y2: y,
      stroke: i === 0 ? "#3a4658" : COLORS.grid,
      "stroke-width": 1,
      "stroke-dasharray": i === 0 ? "0" : "2 5",
    }));
    if (i % labelEvery !== 0 && i !== tickVals.length - 1) return;
    const lab = el("text", {
      x: -10,
      y,
      fill: COLORS.axis,
      "font-size": 11,
      "text-anchor": "end",
      "dominant-baseline": "middle",
    });
    lab.textContent = val === 0 ? "$0" : `$${Math.round(val / 1e9)}B`;
    g.appendChild(lab);
  });

  const yOf = (v) => innerH - (v / maxY) * innerH;
  const placed = groups.flatMap((group) => group.items);

  if (mode === "total") {
    const runs = [];
    let run = [];
    placed.forEach((it, idx) => {
      run.push(it);
      const next = placed[idx + 1];
      if (!next || next.tail !== it.tail || (it.tail && next.label !== it.label)) {
        runs.push(run);
        run = [];
      }
    });
    runs.forEach((pts) => {
      if (!pts.length) return;
      const line = pts.map((it) => `${it.cx},${yOf(it.row.total)}`).join(" ");
      const area = `M${pts[0].cx},${innerH} ` + pts.map((it) => `L${it.cx},${yOf(it.row.total)}`).join(" ") + ` L${pts[pts.length - 1].cx},${innerH} Z`;
      g.appendChild(el("path", { d: area, fill: "url(#gArea)" }));
      g.appendChild(el("polyline", {
        points: line,
        fill: "none",
        stroke: COLORS.total,
        "stroke-width": 2,
        "stroke-linejoin": "round",
        "stroke-linecap": "round",
      }));
    });
  }

  placed.forEach((it) => {
    const row = it.row;
    const isSel = selected != null && String(selected) === it.label;
    const hC = (row.coupon / maxY) * innerH;
    const hP = (row.principal / maxY) * innerH;
    const col = el("g", { class: isSel ? "col is-sel" : "col" });
    col.appendChild(el("rect", {
      class: "guide",
      x: it.cx - it.band / 2,
      y: 0,
      width: it.band,
      height: innerH,
    }));

    if (isSel) {
      col.appendChild(el("line", {
        x1: it.cx,
        x2: it.cx,
        y1: 0,
        y2: innerH,
        stroke: COLORS.total,
        "stroke-width": 1,
        opacity: 0.55,
        "pointer-events": "none",
      }));
    }

    if (mode === "stack") {
      let gap = 0;
      if (hC > 7 && hP > 7) gap = 2;
      const prinH = Math.max(0, hP - (gap ? 1 : 0));
      const coupH = Math.max(0, hC - (gap ? 1 : 0));
      const yP = innerH - prinH;
      const yC = yP - gap - coupH;
      const round = it.barW >= 8 ? 3 : 0;
      if (prinH > 0) {
        col.appendChild(el("path", {
          class: "seg",
          d: roundTopPath(it.x, yP, it.barW, prinH, hC > 0 ? 0 : round),
          fill: "url(#gPrincipal)",
        }));
      }
      if (coupH > 0) {
        col.appendChild(el("path", {
          class: "seg",
          d: roundTopPath(it.x, yC, it.barW, coupH, round),
          fill: "url(#gCoupon)",
        }));
      }
      if (it.tail && it.barW >= 8 && prinH + coupH > 0) {
        const top = coupH > 0 ? yC : yP;
        col.appendChild(el("rect", {
          x: it.x,
          y: top,
          width: it.barW,
          height: innerH - top,
          fill: "url(#tailHatch)",
          "pointer-events": "none",
        }));
      }
    } else if (isSel) {
      col.appendChild(el("circle", {
        cx: it.cx,
        cy: yOf(row.total),
        r: 4.5,
        fill: COLORS.total,
        stroke: "#0b0d10",
        "stroke-width": 1.5,
      }));
    }

    const hit = el("rect", {
      x: it.cx - it.band / 2,
      y: 0,
      width: it.band,
      height: innerH,
      fill: "transparent",
      style: "cursor:pointer",
    });
    hit.addEventListener("click", () => onSelect(row));
    hit.addEventListener("mousemove", (ev) => onHover(row, ev));
    hit.addEventListener("mouseleave", () => onHover(null));
    col.appendChild(hit);
    g.appendChild(col);
  });

  g.appendChild(el("line", {
    x1: 0,
    x2: innerW,
    y1: innerH + 0.5,
    y2: innerH + 0.5,
    stroke: "#465368",
    "stroke-width": 1,
  }));

  groups.forEach((group) => {
    if (!group.showLabel) return;
    const tx = el("text", {
      x: group.cx,
      y: innerH + 18,
      fill: group.items.some((it) => String(selected) === it.label) ? COLORS.total : COLORS.year,
      "font-size": 11,
      "text-anchor": "middle",
    });
    tx.textContent = group.label;
    g.appendChild(tx);
  });

  const title = el("title");
  title.textContent = "Bond liability cash-flow";
  svg.insertBefore(title, svg.firstChild);
}

function gradient(id, from, to) {
  const node = el("linearGradient", { id, x1: "0", y1: "0", x2: "0", y2: "1" });
  node.appendChild(el("stop", { offset: "0%", "stop-color": from }));
  node.appendChild(el("stop", { offset: "100%", "stop-color": to }));
  return node;
}

export { fmtUsd, COLORS };
