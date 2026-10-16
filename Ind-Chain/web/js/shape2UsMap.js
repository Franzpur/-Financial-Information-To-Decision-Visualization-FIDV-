/**
 * C-SHAPE-2 — NVDA US map on s=0, x+/y+ 20×20 UNIT ([GS-20261016-NVDA-SHAPE2-USMAP]).
 * Builds a Three group; does not import scene.js. Caller hides Shape One when active.
 */
import * as THREE from "three";
import { COLORS, chainSphereColor } from "./state.js?v=59";
import { UNIT, coordToLocal } from "./coords.js?v=51";

/** Simplified CONUS outline [lon, lat]. */
const CONUS_RING = [
  [-124.7, 48.4], [-122.8, 48.9], [-117.0, 49.0], [-95.2, 49.0], [-88.0, 47.9],
  [-83.0, 46.2], [-82.4, 43.0], [-74.0, 45.0], [-69.8, 47.3], [-67.0, 44.8],
  [-70.0, 43.0], [-70.8, 41.3], [-73.9, 40.5], [-74.0, 39.0], [-75.5, 36.6],
  [-75.8, 35.2], [-80.8, 32.0], [-81.5, 30.4], [-82.5, 29.0], [-87.5, 30.2],
  [-89.5, 29.0], [-94.0, 29.5], [-97.2, 27.8], [-97.4, 25.9], [-99.5, 26.5],
  [-103.0, 29.0], [-106.5, 31.8], [-111.0, 31.3], [-114.7, 32.7], [-117.1, 32.5],
  [-120.5, 34.5], [-122.5, 37.0], [-124.2, 40.0], [-124.7, 42.0], [-124.7, 48.4],
];

function projectLonLat(lon, lat, bounds, frame) {
  const x = frame.x0 + ((lon - bounds.lonMin) / (bounds.lonMax - bounds.lonMin)) * frame.w;
  const y = frame.y0 + ((lat - bounds.latMin) / (bounds.latMax - bounds.latMin)) * frame.h;
  return { s: frame.s, x, y };
}

function separatePoints(pts, minDist = 0.55, rounds = 24) {
  const out = pts.map((p) => ({ ...p, dx: p.x, dy: p.y }));
  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        let vx = out[j].dx - out[i].dx;
        let vy = out[j].dy - out[i].dy;
        const d = Math.hypot(vx, vy) || 1e-6;
        if (d >= minDist) continue;
        const push = ((minDist - d) / 2) * 0.65;
        vx /= d;
        vy /= d;
        out[i].dx -= vx * push;
        out[i].dy -= vy * push;
        out[j].dx += vx * push;
        out[j].dy += vy * push;
      }
    }
  }
  return out;
}

function toLocal(coord, nLayers, gap) {
  const p = coordToLocal(coord, nLayers, gap);
  return new THREE.Vector3(p.x, p.y, p.z);
}

function parabolaArc(from, to, side, nLayers, gap, peakS = 2.4, segs = 12) {
  const group = new THREE.Group();
  group.userData.isShape2Arc = true;
  const mat = new THREE.MeshBasicMaterial({
    color: side === "supplier" ? COLORS.LINK_SUPPLIER : COLORS.LINK_CUSTOMER,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    toneMapped: false,
  });
  const yAxis = new THREE.Vector3(0, 1, 0);
  const pts = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const lift = 4 * peakS * t * (1 - t);
    pts.push(
      toLocal(
        {
          s: from.s + (to.s - from.s) * t + lift,
          x: from.x + (to.x - from.x) * t,
          y: from.y + (to.y - from.y) * t,
        },
        nLayers,
        gap
      )
    );
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const pa = pts[i];
    const pb = pts[i + 1];
    const mid = pa.clone().add(pb).multiplyScalar(0.5);
    const dir = pb.clone().sub(pa);
    const len = Math.max(dir.length(), 1e-4);
    dir.normalize();
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1, 6), mat);
    mesh.position.copy(mid);
    mesh.scale.set(1, len, 1);
    mesh.quaternion.setFromUnitVectors(yAxis, dir);
    mesh.renderOrder = 4;
    group.add(mesh);
  }
  return group;
}

/**
 * @param {object} usMapDoc bundle.usMap
 * @param {{nLayers:number, gap:number}} layout
 */
export function buildShape2UsMap(usMapDoc, layout) {
  if (!usMapDoc?.center || !Array.isArray(usMapDoc.points)) return null;
  const { nLayers, gap } = layout;
  const bounds = usMapDoc.bounds || { lonMin: -125, lonMax: -66, latMin: 24, latMax: 50 };
  const frame = usMapDoc.mapFrame || { s: 0, x0: 0, y0: 0, w: 20, h: 20 };
  const group = new THREE.Group();
  group.userData.isShape2 = true;

  // Map plate in user x–y at s≈0 → Three YZ after rotation matching slice faces.
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(frame.w * UNIT, frame.h * UNIT),
    new THREE.MeshBasicMaterial({
      color: 0x121820,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
  );
  const plateC = toLocal(
    { s: frame.s - 0.02, x: frame.x0 + frame.w / 2, y: frame.y0 + frame.h / 2 },
    nLayers,
    gap
  );
  plate.position.copy(plateC);
  plate.rotation.y = Math.PI / 2;
  plate.renderOrder = 1;
  group.add(plate);

  const outlinePts = CONUS_RING.map(([lon, lat]) => {
    const c = projectLonLat(lon, lat, bounds, frame);
    return toLocal({ s: frame.s + 0.02, x: c.x, y: c.y }, nLayers, gap);
  });
  const outline = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(outlinePts),
    new THREE.LineBasicMaterial({
      color: 0xb0c4d8,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      toneMapped: false,
    })
  );
  outline.renderOrder = 2;
  group.add(outline);

  const raw = [
    { ...usMapDoc.center, side: "center", ...projectLonLat(usMapDoc.center.lon, usMapDoc.center.lat, bounds, frame) },
    ...usMapDoc.points.map((p) => ({ ...p, ...projectLonLat(p.lon, p.lat, bounds, frame) })),
  ];
  const sep = separatePoints(raw, 0.55);
  const byTicker = new Map();
  const r = UNIT / 2;
  sep.forEach((p) => {
    const color = p.side === "center" ? 0xffffff : chainSphereColor(p);
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(r * (p.side === "center" ? 1.05 : 0.85), 24, 18),
      new THREE.MeshBasicMaterial({ color, toneMapped: false })
    );
    const coord = { s: frame.s + 0.1, x: p.dx, y: p.dy };
    ball.position.copy(toLocal(coord, nLayers, gap));
    ball.userData.isShape2Point = true;
    ball.userData.ticker = p.ticker;
    ball.userData.side = p.side;
    ball.renderOrder = 6;
    group.add(ball);
    byTicker.set(String(p.ticker).toUpperCase(), { ...coord, side: p.side });
  });

  const from = byTicker.get(String(usMapDoc.center.ticker).toUpperCase());
  if (from) {
    usMapDoc.points.forEach((p) => {
      const to = byTicker.get(String(p.ticker).toUpperCase());
      if (!to || (p.side !== "supplier" && p.side !== "customer")) return;
      group.add(parabolaArc(from, to, p.side, nLayers, gap));
    });
  }

  return {
    group,
    dispose() {
      group.traverse((o) => {
        o.geometry?.dispose?.();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
    },
  };
}
