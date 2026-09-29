/**
 * [C-FINSLICE] Debt sheet in the cube's coordinate space.
 * Interest on the baseline, principal above. From 2080 the tail is one bar.
 */
import * as THREE from "three";
import { COLORS, state } from "./state.js";
import { PLANE_SIZE, USER_X_SIGN } from "./coords.js";

function isGooglPoint(c) {
  return String(c?.ticker || "").toUpperCase() === "GOOGL";
}

function noPick(obj) {
  obj.raycast = () => {};
  return obj;
}

function disposeTree(obj) {
  obj.traverse((node) => {
    if (node.geometry) node.geometry.dispose?.();
    const mat = node.material;
    if (!mat) return;
    if (mat.map) mat.map.dispose?.();
    mat.dispose?.();
  });
}

function hideFinanceSlice(ctx) {
  if (!ctx.financeSlice) return;
  ctx.financeSlice.parent?.remove(ctx.financeSlice);
  disposeTree(ctx.financeSlice);
  ctx.financeSlice = null;
}

/**
 * [C-FINSLICE] Camera sits on the +s face of the sheet (viewNormal = +zAxis).
 * Baseline still runs 45° toward 1s+1x and reads left to right.
 * The opposite face is the mirror across the industry slice and shows the chart backwards.
 */
function financePose(ctx) {
  const g = ctx.financeSlice;
  if (!g) return null;
  const local = g.userData.viewLocal || new THREE.Vector3();
  const target = g.localToWorld(local.clone());
  const q = new THREE.Quaternion();
  g.getWorldQuaternion(q);
  const outward = (g.userData.viewNormal || new THREE.Vector3(0, 0, USER_X_SIGN)).clone().applyQuaternion(q);
  const dist = PLANE_SIZE * 1.85;
  return { pos: target.clone().addScaledVector(outward, dist), target };
}
function financeText(text, width, height, fontPx = 42) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx2d = canvas.getContext("2d");
  ctx2d.clearRect(0, 0, canvas.width, canvas.height);
  ctx2d.font = `600 ${fontPx}px ui-sans-serif, system-ui, sans-serif`;
  ctx2d.textAlign = "center";
  ctx2d.textBaseline = "middle";
  ctx2d.lineJoin = "round";
  ctx2d.lineWidth = 8;
  ctx2d.strokeStyle = "rgba(8, 12, 18, 0.92)";
  ctx2d.strokeText(text, 256, 64);
  ctx2d.lineWidth = 3;
  ctx2d.strokeStyle = "rgba(180, 230, 255, 0.7)";
  ctx2d.strokeText(text, 256, 64);
  ctx2d.fillStyle = "rgba(245, 252, 255, 0.98)";
  ctx2d.fillText(text, 256, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  mesh.renderOrder = 14;
  return noPick(mesh);
}

function ringStroke(points, color, opacity) {
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    })
  );
  line.renderOrder = 12;
  return noPick(line);
}

function loopStroke(points, color, opacity) {
  const line = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    })
  );
  line.renderOrder = 13;
  return noPick(line);
}

const FOLD_YEAR = 2080;

function financeRows(bond, scale) {
  const quarters = (bond.byQuarter || []).filter((r) => !String(r.quarter).endsWith("+"));
  const tail = { coupon: 0, principal: 0, total: 0 };
  if (scale === "quarter") {
    const rows = [];
    let prevYear = "";
    quarters.forEach((r) => {
      const key = String(r.quarter);
      const year = Number(key.slice(0, 4));
      if (year >= FOLD_YEAR) {
        tail.coupon += Number(r.coupon) || 0;
        tail.principal += Number(r.principal) || 0;
        tail.total += Number(r.total) || 0;
        return;
      }
      const mark = String(year) !== prevYear && (year === 2026 || year % 5 === 0);
      prevYear = String(year);
      rows.push({
        coupon: Number(r.coupon) || 0,
        principal: Number(r.principal) || 0,
        total: Number(r.total) || 0,
        tail: false,
        label: mark ? String(year) : null,
      });
    });
    if (tail.total > 0) {
      rows.push({ ...tail, tail: true, label: `${FOLD_YEAR}+` });
    }
    return rows;
  }
  const byYear = new Map();
  quarters.forEach((r) => {
    const year = Number(String(r.quarter).slice(0, 4));
    if (!Number.isFinite(year)) return;
    const folded = year >= FOLD_YEAR;
    const key = folded ? `${FOLD_YEAR}+` : String(year);
    const cur = byYear.get(key) || { coupon: 0, principal: 0, total: 0, year, tail: folded };
    cur.coupon += Number(r.coupon) || 0;
    cur.principal += Number(r.principal) || 0;
    cur.total += Number(r.total) || 0;
    byYear.set(key, cur);
  });
  return [...byYear.keys()]
    .sort((a, b) => (a.endsWith("+") ? 1 : b.endsWith("+") ? -1 : Number(a) - Number(b)))
    .map((key) => {
      const r = byYear.get(key);
      const mark = key === "2026" || r.tail || r.year % 5 === 0;
      return {
        coupon: r.coupon,
        principal: r.principal,
        total: r.total,
        tail: r.tail,
        label: mark ? key : null,
      };
    });
}

function niceTicks(maxT) {
  const raw = Math.max(maxT, 1) / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  const step = (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * pow;
  const top = Math.ceil(maxT / step) * step;
  const ticks = [];
  for (let v = 0; v <= top + step * 0.01; v += step) ticks.push(v);
  return { ticks, axisMax: top || maxT };
}

function fmtAxis(v) {
  if (!v) return "0";
  if (v >= 1e12) return `$${(v / 1e12).toFixed(1)}T`;
  if (v >= 1e9) {
    const b = v / 1e9;
    return `$${b >= 10 ? b.toFixed(0) : b.toFixed(1)}B`;
  }
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v.toFixed(0)}`;
}

/**
 * [C-FINSLICE] Liability sheet stays full slice size.
 * The table fills the sheet's upper half, on the pulled slice (same user-x as the right edge).
 * The green sheet stays on the slice's right edge. Cashflow from 2080 on is one folded bar.
 * Baseline still 45° toward 1s+1x.
 * Fluoro frame, USD ordinate, year/quarter toggle. No concentric rings.
 */
function buildFinanceSlice(bond, scale) {
  const g = new THREE.Group();
  g.userData.isFinance = true;
  const mode = scale === "quarter" ? "quarter" : "year";
  const rows = financeRows(bond, mode);
  const half = PLANE_SIZE / 2;
  const chartH = PLANE_SIZE;
  const chartW = PLANE_SIZE * 1.15;
  const xAxis = new THREE.Vector3(Math.SQRT1_2, 0, -Math.SQRT1_2);
  const yAxis = new THREE.Vector3(0, 1, 0);
  const zAxis = new THREE.Vector3().crossVectors(xAxis, yAxis).normalize();
  // Green sheet stays hinged on the slice's right edge.
  const origin = new THREE.Vector3(0.02, -half, -half);
  const frame = new THREE.Group();
  frame.position.copy(origin);
  frame.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis));
  g.add(frame);

  // Near face when the industry slice is viewed from +s. The back face reads time right-to-left.
  g.userData.viewNormal = zAxis.clone();
  g.userData.financeScale = mode;

  const z = 0;
  const halfH = chartH / 2;
  const gutter = 0.86;
  const baseY = 0.26;
  const span = halfH - baseY - 0.4;
  const plotRight = chartW - 0.1;
  const plotW = Math.max(0.2, plotRight - gutter);
  const maxT = Math.max(...rows.map((r) => r.total), 1);
  const { ticks, axisMax } = niceTicks(maxT);
  const yOf = (v) => baseY + (v / axisMax) * span;

  frame.add(loopStroke(
    [
      new THREE.Vector3(0, 0, z),
      new THREE.Vector3(chartW, 0, z),
      new THREE.Vector3(chartW, chartH, z),
      new THREE.Vector3(0, chartH, z),
    ],
    COLORS.SHEET,
    1
  ));

  // Table in the upper half, left edge on the slice's right edge (pulled face, user x = 2).
  const plot = new THREE.Group();
  plot.position.set(0, halfH, 0);
  frame.add(plot);
  g.userData.viewLocal = origin.clone()
    .addScaledVector(xAxis, chartW / 2)
    .addScaledVector(yAxis, halfH + halfH / 2);

  plot.add(ringStroke(
    [new THREE.Vector3(gutter, baseY, z), new THREE.Vector3(gutter, yOf(axisMax), z)],
    0xd4e8ff,
    0.95
  ));
  ticks.forEach((v) => {
    const y = yOf(v);
    plot.add(ringStroke(
      [new THREE.Vector3(gutter, y, z), new THREE.Vector3(plotRight, y, z)],
      0x8eb6d8,
      v === 0 ? 0.95 : 0.4
    ));
    plot.add(ringStroke(
      [new THREE.Vector3(gutter - 0.07, y, z), new THREE.Vector3(gutter, y, z)],
      0xd4e8ff,
      0.95
    ));
    const lab = financeText(fmtAxis(v), 0.78, 0.2);
    lab.position.set(0.46, y, z + 0.02);
    plot.add(lab);
  });

  let weight = 0;
  rows.forEach((r) => {
    weight += r.tail ? 1.55 : 1;
  });
  const pitch = plotW / Math.max(weight, 1);
  const barW = pitch * (mode === "quarter" ? 0.72 : 0.62);
  let cursor = gutter;
  rows.forEach((row) => {
    if (row.tail) cursor += pitch * 0.55;
    const slot = pitch;
    const x0 = cursor + (slot - barW) / 2;
    const hC = (row.coupon / axisMax) * span;
    const hP = (row.principal / axisMax) * span;
    const gap = hC > 0.02 && hP > 0.02 ? 0.012 : 0;
    if (hC > 0.006) addStack(plot, x0, baseY, barW, hC, COLORS.INTEREST, z);
    if (hP > 0.006) addStack(plot, x0, baseY + hC + gap, barW, hP, COLORS.PRINCIPAL, z);
    if (row.label) {
      const lab = financeText(row.label, row.tail ? 0.46 : 0.34, 0.1);
      lab.position.set(x0 + barW / 2, baseY - 0.1, z + 0.01);
      plot.add(lab);
    }
    cursor += slot;
  });

  addScaleButton(plot, mode === "quarter" ? "Year" : "Quarter", chartW - 0.24, halfH - 0.24, z);
  return g;
}

function roundedSquareShape(size, radius) {
  const s = size / 2;
  const r = Math.min(radius, s);
  const sh = new THREE.Shape();
  sh.moveTo(-s + r, -s);
  sh.lineTo(s - r, -s);
  sh.absarc(s - r, -s + r, r, -Math.PI / 2, 0, false);
  sh.lineTo(s, s - r);
  sh.absarc(s - r, s - r, r, 0, Math.PI / 2, false);
  sh.lineTo(-s + r, s);
  sh.absarc(-s + r, s - r, r, Math.PI / 2, Math.PI, false);
  sh.lineTo(-s, -s + r);
  sh.absarc(-s + r, -s + r, r, Math.PI, Math.PI * 1.5, false);
  return sh;
}

function addScaleButton(frame, label, x, y, z) {
  const size = 0.32;
  const shape = roundedSquareShape(size, 0.08);
  const plate = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshBasicMaterial({
      color: 0x0c1c16,
      transparent: true,
      opacity: 0.94,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  plate.position.set(x, y, z + 0.03);
  plate.userData.isFinanceToggle = true;
  plate.renderOrder = 15;
  frame.add(plate);
  frame.add(loopStroke(
    shape.getPoints(4).map((p) => new THREE.Vector3(x + p.x, y + p.y, z + 0.04)),
    COLORS.SHEET,
    1
  ));
  const lab = financeText(label, size * 0.86, size * 0.36, 78);
  lab.position.set(x, y, z + 0.05);
  frame.add(lab);
}

function addStack(g, x, y, w, h, color, z) {
  const pts = [
    new THREE.Vector3(x, y, z),
    new THREE.Vector3(x + w, y, z),
    new THREE.Vector3(x + w, y + h, z),
    new THREE.Vector3(x, y + h, z),
  ];
  g.add(loopStroke(pts, color, 1));
}

function showFinanceSlice(ctx, company) {
  hideFinanceSlice(ctx);
  const mesh = ctx.byId.get(company.id);
  if (!mesh || !state.googlBond) return;
  const g = buildFinanceSlice(state.googlBond, state.financeScale);
  g.userData.companyId = company.id;
  mesh.parent.add(g);
  ctx.financeSlice = g;
}

function toggleFinanceScale(ctx) {
  const current = ctx.financeSlice;
  if (!current || !state.googlBond) return;
  const parent = current.parent;
  const companyId = current.userData.companyId;
  state.financeScale = state.financeScale === "quarter" ? "year" : "quarter";
  hideFinanceSlice(ctx);
  const g = buildFinanceSlice(state.googlBond, state.financeScale);
  g.userData.companyId = companyId;
  parent.add(g);
  ctx.financeSlice = g;
  ctx.hooks.onFinanceScale?.();
}

export function createFinanceSheet() {
  return {
    isGoogl: isGooglPoint,
    hide: hideFinanceSlice,
    pose: financePose,
    show: showFinanceSlice,
    toggle: toggleFinanceScale,
  };
}
