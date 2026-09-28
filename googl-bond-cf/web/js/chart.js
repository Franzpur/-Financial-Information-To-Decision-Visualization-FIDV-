/** Stacked / line chart for annual coupon + principal (FIDV palette). */

const COLORS = {
  coupon: "#6aa8ff",
  principal: "#ffb020",
  grid: "#2a313c",
  axis: "#9aa6b5",
  total: "#8be0c0",
  barHover: "#e8edf4",
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

export function drawCashflowChart(svg, rows, opts = {}) {
  const mode = opts.mode || "stack";
  const selected = opts.selectedYear ?? null;
  const onSelect = opts.onSelect || (() => {});
  const onHover = opts.onHover || (() => {});

  const W = svg.clientWidth || 800;
  const H = svg.clientHeight || 420;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const pad = { top: 18, right: 16, bottom: 42, left: 58 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  if (!rows.length || innerW < 40 || innerH < 40) return;

  const maxY = Math.max(
    ...rows.map((r) => (mode === "total" ? r.total : r.coupon + r.principal)),
    1
  );
  const n = rows.length;
  const gap = 0.22;
  const band = innerW / n;
  const barW = band * (1 - gap);

  const g = el("g", { transform: `translate(${pad.left},${pad.top})` });
  svg.appendChild(g);

  // grid
  const ticks = 5;
  for (let i = 0; i <= ticks; i++) {
    const t = i / ticks;
    const y = innerH * (1 - t);
    const val = maxY * t;
    g.appendChild(
      el("line", {
        x1: 0,
        x2: innerW,
        y1: y,
        y2: y,
        stroke: COLORS.grid,
        "stroke-width": 1,
        opacity: i === 0 ? 0.9 : 0.45,
      })
    );
    const lab = el("text", {
      x: -8,
      y: y + 3,
      fill: COLORS.axis,
      "font-size": 10,
      "text-anchor": "end",
    });
    lab.textContent = fmtUsd(val);
    g.appendChild(lab);
  }

  rows.forEach((row, i) => {
    const x = i * band + (band - barW) / 2;
    const hC = (row.coupon / maxY) * innerH;
    const hP = (row.principal / maxY) * innerH;
    const label = String(row.year);
    const isSel = selected != null && String(selected) === label;

    if (mode === "stack") {
      const yP = innerH - hP;
      const yC = yP - hC;
      const principal = el("rect", {
        x,
        y: yP,
        width: barW,
        height: Math.max(0, hP),
        fill: COLORS.principal,
        opacity: isSel ? 1 : 0.88,
        rx: 2,
        style: "cursor:pointer",
      });
      const coupon = el("rect", {
        x,
        y: yC,
        width: barW,
        height: Math.max(0, hC),
        fill: COLORS.coupon,
        opacity: isSel ? 1 : 0.88,
        rx: 2,
        style: "cursor:pointer",
      });
      const hit = el("rect", {
        x: i * band,
        y: 0,
        width: band,
        height: innerH,
        fill: isSel ? "rgba(139,224,192,0.08)" : "transparent",
        style: "cursor:pointer",
      });
      const bind = (node) => {
        node.addEventListener("click", () => onSelect(row));
        node.addEventListener("mousemove", (ev) => onHover(row, ev));
        node.addEventListener("mouseleave", () => onHover(null));
      };
      bind(hit);
      bind(principal);
      bind(coupon);
      g.appendChild(hit);
      g.appendChild(principal);
      g.appendChild(coupon);
    } else {
      // total as thin bar for hit + polyline drawn later
      const h = (row.total / maxY) * innerH;
      const bar = el("rect", {
        x,
        y: innerH - h,
        width: barW,
        height: Math.max(0, h),
        fill: COLORS.total,
        opacity: isSel ? 0.95 : 0.35,
        rx: 2,
        style: "cursor:pointer",
      });
      bar.addEventListener("click", () => onSelect(row));
      bar.addEventListener("mousemove", (ev) => onHover(row, ev));
      bar.addEventListener("mouseleave", () => onHover(null));
      g.appendChild(bar);
    }

    const skip = n > 24 ? i % 2 !== 0 : false;
    if (!skip || isSel) {
      const tx = el("text", {
        x: i * band + band / 2,
        y: innerH + 16,
        fill: isSel ? COLORS.total : COLORS.axis,
        "font-size": 10,
        "text-anchor": "middle",
      });
      tx.textContent = label.length > 5 ? label.slice(2) : label;
      g.appendChild(tx);
    }
  });

  if (mode === "total") {
    const pts = rows
      .map((row, i) => {
        const cx = i * band + band / 2;
        const cy = innerH - (row.total / maxY) * innerH;
        return `${cx},${cy}`;
      })
      .join(" ");
    g.appendChild(
      el("polyline", {
        points: pts,
        fill: "none",
        stroke: COLORS.total,
        "stroke-width": 2.2,
        "stroke-linejoin": "round",
      })
    );
  }
}

function el(name, attrs) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, String(v)));
  return node;
}

export { fmtUsd, COLORS };
