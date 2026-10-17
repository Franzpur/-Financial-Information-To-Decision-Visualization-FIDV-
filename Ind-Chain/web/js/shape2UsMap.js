/**
 * C-SHAPE-2 — NVDA US map on s=0, x+/y+ 20×20 UNIT ([GS-20261016-NVDA-SHAPE2-USMAP]).
 * Dense CONUS outline from bundle.usMap.outline; pickable C-POINT spheres + C-REV-LINK arcs.
 */
import * as THREE from "three";
import {
  COLORS,
  chainSphereColor,
  companyByTicker,
  revenueLinkKey,
  state,
} from "./state.js?v=59";
import { UNIT, coordToLocal } from "./coords.js?v=51";

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

function outlineRings(usMapDoc) {
  const rings = usMapDoc?.outline?.rings;
  if (Array.isArray(rings) && rings.length && Array.isArray(rings[0]) && rings[0].length >= 8) {
    return rings;
  }
  // Fallback coarse ring if bake missing.
  return [
    [
      [-124.7, 48.4], [-117.0, 49.0], [-95.2, 49.0], [-83.0, 46.2], [-67.0, 44.8],
      [-70.8, 41.3], [-75.5, 36.6], [-81.5, 30.4], [-89.5, 29.0], [-97.4, 25.9],
      [-106.5, 31.8], [-117.1, 32.5], [-122.5, 37.0], [-124.7, 42.0], [-124.7, 48.4],
    ],
  ];
}

function buildLandMeshes(rings, bounds, frame, nLayers, gap) {
  const group = new THREE.Group();
  group.userData.isShape2Land = true;
  const cx = frame.x0 + frame.w / 2;
  const cy = frame.y0 + frame.h / 2;
  const plateC = toLocal({ s: frame.s - 0.02, x: cx, y: cy }, nLayers, gap);

  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(frame.w * UNIT, frame.h * UNIT),
    new THREE.MeshBasicMaterial({
      color: 0x0c1016,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
  );
  plate.position.copy(plateC);
  plate.rotation.y = Math.PI / 2;
  plate.renderOrder = 1;
  group.add(plate);

  rings.forEach((ring) => {
    const shape = new THREE.Shape();
    ring.forEach(([lon, lat], i) => {
      const c = projectLonLat(lon, lat, bounds, frame);
      const px = (c.x - cx) * UNIT;
      const py = (c.y - cy) * UNIT;
      if (i === 0) shape.moveTo(px, py);
      else shape.lineTo(px, py);
    });
    const land = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({
        color: 0x243445,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      })
    );
    land.position.copy(toLocal({ s: frame.s + 0.01, x: cx, y: cy }, nLayers, gap));
    land.rotation.y = Math.PI / 2;
    land.renderOrder = 2;
    group.add(land);

    // Closed coastline as a thin tube — readable at distance (WebGL ignores Line linewidth).
    const outlinePts = ring.map(([lon, lat]) => {
      const c = projectLonLat(lon, lat, bounds, frame);
      return toLocal({ s: frame.s + 0.05, x: c.x, y: c.y }, nLayers, gap);
    });
    if (outlinePts.length >= 3) {
      const curve = new THREE.CatmullRomCurve3(outlinePts, true, "catmullrom", 0.05);
      const tubular = Math.min(1200, Math.max(200, outlinePts.length));
      const coast = new THREE.Mesh(
        new THREE.TubeGeometry(curve, tubular, 0.035, 5, true),
        new THREE.MeshBasicMaterial({
          color: 0xd0dde8,
          transparent: true,
          opacity: 0.95,
          depthWrite: false,
          toneMapped: false,
        })
      );
      coast.renderOrder = 3;
      coast.userData.isShape2Coast = true;
      group.add(coast);
    }
  });

  return group;
}

function orientSeg(mesh, pa, pb) {
  const yAxis = new THREE.Vector3(0, 1, 0);
  const mid = pa.clone().add(pb).multiplyScalar(0.5);
  const dir = pb.clone().sub(pa);
  const len = Math.max(dir.length(), 1e-4);
  dir.normalize();
  mesh.position.copy(mid);
  mesh.scale.set(1, len, 1);
  mesh.quaternion.setFromUnitVectors(yAxis, dir);
}

function parabolaArc(from, to, side, nLayers, gap, linkKey, peakS = 2.4, segs = 20) {
  const group = new THREE.Group();
  group.userData.isShape2Arc = true;
  group.userData.linkKey = linkKey;
  const mat = new THREE.MeshBasicMaterial({
    color: side === "supplier" ? COLORS.LINK_SUPPLIER : COLORS.LINK_CUSTOMER,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    toneMapped: false,
  });
  const hitMat = new THREE.MeshBasicMaterial({
    color: linkSideFallback(side),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    colorWrite: false,
    toneMapped: false,
  });
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
  const tubes = [];
  const hits = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1, 6), mat);
    tube.userData.isRevenueLink = true;
    tube.userData.linkKey = linkKey;
    tube.userData.isShape2Arc = true;
    tube.renderOrder = 4;
    orientSeg(tube, pts[i], pts[i + 1]);
    group.add(tube);
    tubes.push(tube);

    const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1, 6), hitMat);
    hit.userData.isRevenueLinkHit = true;
    hit.userData.linkKey = linkKey;
    hit.userData.isShape2Arc = true;
    hit.renderOrder = 4;
    orientSeg(hit, pts[i], pts[i + 1]);
    group.add(hit);
    hits.push(hit);
  }
  return { group, tubes, hits, mat, linkKey, side };
}

function linkSideFallback(side) {
  return side === "supplier" ? COLORS.LINK_SUPPLIER : COLORS.LINK_CUSTOMER;
}

function findLinkForPeer(centerCo, peerPoint) {
  const center = companyByTicker(centerCo.ticker);
  const peer = companyByTicker(peerPoint.ticker);
  if (!center || !peer) return null;
  const side = peerPoint.side;
  const links = state.revenueLinks || [];
  return (
    links.find(
      (L) =>
        L &&
        L.side === side &&
        ((L.fromId === center.id && L.toId === peer.id) || (L.fromId === peer.id && L.toId === center.id))
    ) || null
  );
}

/**
 * @param {object} usMapDoc bundle.usMap
 * @param {{nLayers:number, gap:number}} layout
 * @param {{makeLabel?: (company: object, coord: object) => THREE.Object3D|null}} [opts]
 */
export function buildShape2UsMap(usMapDoc, layout, opts = {}) {
  if (!usMapDoc?.center || !Array.isArray(usMapDoc.points)) return null;
  const { nLayers, gap } = layout;
  const bounds = usMapDoc.bounds || { lonMin: -125, lonMax: -66, latMin: 24, latMax: 50 };
  const frame = usMapDoc.mapFrame || { s: 0, x0: 0, y0: 0, w: 20, h: 20 };
  const group = new THREE.Group();
  group.userData.isShape2 = true;

  const rings = outlineRings(usMapDoc);
  group.add(buildLandMeshes(rings, bounds, frame, nLayers, gap));

  const raw = [
    { ...usMapDoc.center, side: "center", ...projectLonLat(usMapDoc.center.lon, usMapDoc.center.lat, bounds, frame) },
    ...usMapDoc.points.map((p) => ({ ...p, ...projectLonLat(p.lon, p.lat, bounds, frame) })),
  ];
  const sep = separatePoints(raw, 0.55);
  const byTicker = new Map();
  const pickMeshes = [];
  const r = UNIT / 2;

  sep.forEach((p) => {
    const company = companyByTicker(p.ticker);
    const color = p.side === "center" ? 0xffffff : chainSphereColor(p);
    const mesh = new THREE.Group();
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(r * (p.side === "center" ? 1.05 : 0.85), 24, 18),
      new THREE.MeshBasicMaterial({ color, toneMapped: false })
    );
    const coord = { s: frame.s + 0.12, x: p.dx, y: p.dy };
    mesh.position.copy(toLocal(coord, nLayers, gap));
    mesh.userData.isShape2Point = true;
    mesh.userData.isCompanyPoint = true;
    mesh.userData.isChainSphere = true;
    mesh.userData.ticker = p.ticker;
    mesh.userData.side = p.side;
    mesh.userData.companyId = company?.id ?? null;
    mesh.userData.basePointR = r;
    mesh.userData.dScale = 1;
    mesh.userData.targetHoverScale = 1;
    mesh.userData.targetOpacity = 1;
    mesh.userData.fill = ball;
    mesh.userData.rim = null;
    ball.userData.companyId = company?.id ?? null;
    ball.userData.isRingFill = true;
    mesh.add(ball);
    mesh.renderOrder = 6;
    group.add(mesh);

    if (company && typeof opts.makeLabel === "function") {
      const label = opts.makeLabel(company, coord);
      if (label) {
        group.add(label);
        mesh.userData.label = label;
        label.visible = true;
      }
    }

    if (company?.id != null) pickMeshes.push(mesh);
    byTicker.set(String(p.ticker).toUpperCase(), { ...coord, side: p.side, companyId: company?.id });
  });

  const linkObjs = [];
  const linkHits = [];
  const from = byTicker.get(String(usMapDoc.center.ticker).toUpperCase());
  if (from) {
    usMapDoc.points.forEach((p) => {
      const to = byTicker.get(String(p.ticker).toUpperCase());
      if (!to || (p.side !== "supplier" && p.side !== "customer")) return;
      const link = findLinkForPeer(usMapDoc.center, p);
      const key = link ? revenueLinkKey(link) : `shape2:${p.side}:${p.ticker}`;
      const arc = parabolaArc(from, to, p.side, nLayers, gap, key);
      group.add(arc.group);
      linkObjs.push({
        side: p.side,
        fromId: link?.fromId ?? null,
        toId: link?.toId ?? null,
        key,
        tube: arc.tubes[0] || null,
        tubes: arc.tubes,
        hits: arc.hits,
        mat: arc.mat,
        link: link || { side: p.side, fromId: null, toId: null, name: p.name, ticker: p.ticker },
      });
      linkHits.push(...arc.hits);
    });
  }

  return {
    group,
    pickMeshes,
    linkHits,
    linkObjs,
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
