/**
 * Standard-Financial-Charting — Three.js scene.
 * Concept targets: ../CONCEPTS.md  (tags [C-SLICE], [C-PULL], [C-STDVIEW], …)
 * Layout lives in user (s, x, y). See coords.js [C-COORD] / [C-MAP].
 * Three.js positions are produced only by applyCoord / applySliceCoord.
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  COLORS,
  colorCss,
  state,
  passesFilter,
  companyById,
  stayLayers,
  layerIsStay,
  usesWhiteSpheres,
  usesChainSpheres,
  chainSphereColor,
  revenueLinkKey,
  revenueLinkByKey,
} from "./state.js?v=59";
import {
  FACE,
  FACE_SPAN,
  UNIT,
  D_EPS,
  USER_X_SIGN,
  LAYOUT,
  gapMeters,
  gapSafe,
  coordToLocal,
  localToCoord,
  localOffset,
  sliceAnchor,
  companyCoord,
  domainLabelCoord,
  companyLabelCoord,
  ringOffset,
  axisChrome,
  viewSpaceMeters,
  SHELL_ANCHOR,
  SHELL_SPAN_LAYERS,
} from "./coords.js?v=51";
import { focusPointTargets } from "./bondChart.js?v=3";
import { googlFileEntries, isGooglTicker } from "./map/googlFiles.js?v=2";
import { buildShape2UsMap } from "./shape2UsMap.js?v=3";

/* ============================================================================
 * Section 1 · Geometry & Slices ([C-SLICE], [C-RING], [C-POINT], [C-REV-LINK])
 * ========================================================================== */

/** Axis palette matched to concentric rings (cool steel / ice blue). */
/** Demo chain: layers.length. Shell: virtual 11 so user s=5 is mid-stack. */
const N_LAYERS = () => (state.shellCube ? SHELL_SPAN_LAYERS : state.layers.length);
export function createScene(viewport, hooks = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0d10);
  // [C-VIEW-SPACE] Fog / far clip track pull-back radius (R·UNIT), never d.
  // Shell: no fog — one firm + axes must stay sharp (fog made empty pulls read as cloud).
  const viewM = viewSpaceMeters();
  scene.fog = state.shellCube
    ? null
    : new THREE.Fog(0x0b0d10, viewM * 0.45, viewM * 2.0);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, viewM * 2.5);
  camera.position.set(8.2, 4.8, 8.2);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  viewport.insertBefore(renderer.domElement, viewport.firstChild);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  // Low rotate feel for fine aiming; tick() scales mildly with orbit radius
  controls.rotateSpeed = 0.35;
  controls.panSpeed = 1.2;
  controls.zoomSpeed = 2.6;
  // [C-VIEW-SPACE] max pull-back = user radius R via UNIT; minDistance unchanged
  controls.minDistance = 0.35;
  controls.maxDistance = viewM;
  controls.enableZoom = false; // custom wheel below — full exponential range
  // Left = pan (translate); right = orbit (fine rotate)
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.PAN,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.ROTATE,
  };
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
  controls.target.set(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xb8c4d4, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 0.85);
  key.position.set(6, 10, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x6a90ff, 0.25);
  fill.position.set(-5, 2, -4);
  scene.add(fill);

  const root = new THREE.Group();
  scene.add(root);

  const ctx = {
    scene,
    camera,
    renderer,
    controls,
    root,
    planeGroups: [],
    meshes: [],
    byId: new Map(),
    axesGroup: null,
    keys: new Set(),
    raycaster: new THREE.Raycaster(),
    pointer: new THREE.Vector2(),
    pointerState: { x: 0, y: 0, btn: -1, moved: false },
    dimTargets: new Map(),
    baseRotateSpeed: 0.35,
    camAnim: null,
    cubeExit: 0,
    exitStayLayer: null,
    hooks,
  };

  buildCube(ctx);
  goStandardView(ctx, false);
  wireInput(ctx, viewport);
  resize(ctx, viewport);
  window.addEventListener("resize", () => resize(ctx, viewport));

  const faceQuat = new THREE.Quaternion();
  const parentQuat = new THREE.Quaternion();
  function tick() {
    requestAnimationFrame(tick);
    // Farther orbit radius → higher angular speed so on-screen spin matches Q/E better
    const dist = camera.position.distanceTo(controls.target);
    const ref = Math.max(6, framingDistance());
    // Mild distance scale only — keep fine control (avoid multi-turn flicks)
    controls.rotateSpeed = THREE.MathUtils.clamp(
      ctx.baseRotateSpeed * Math.sqrt(dist / ref),
      0.22,
      0.85
    );
    applyKeyboard(ctx);
    stepCamAnim(ctx);
    lerpVisibility(ctx);
    lerpPullOut(ctx);
    controls.update();
    // [C-POINT] Disks / white spheres stay fixed in world; do not billboard.
    // [C-REV-LINK] No midpoint relationship labels — hover source card only.
    updateGooglFileCard(ctx, faceQuat, parentQuat);
    placeRevenueLinks(ctx);
    renderer.render(scene, camera);
  }
  tick();

  return {
    ctx,
    applyVisibility: () => queueVisibilityTargets(ctx),
    layoutPlanes: () => layoutPlanes(ctx),
    resetCamera: () => resetCamera(ctx),
    goStandardView: (animate = true) => goStandardView(ctx, animate !== false),
    focusSlice: (i) => focusSlice(ctx, i),
    clearFocus: () => clearFocus(ctx),
    selectCompany: (id, opts) => selectCompany(ctx, id, opts || {}),
    /** Stills / tests: select revenue link by index into `state.revenueLinks`. */
    selectRevenueLinkAt: (i) => {
      const L = (state.revenueLinks || [])[i | 0];
      if (!L) return false;
      selectLink(ctx, revenueLinkKey(L));
      return true;
    },
    hoverRevenueLinkAt: (i) => {
      const L = (state.revenueLinks || [])[i | 0];
      state.hoverLinkKey = L ? revenueLinkKey(L) : null;
      queueVisibilityTargets(ctx);
      return Boolean(L);
    },
    hoverCompany: (id) => {
      state.hoverId = id;
      queueVisibilityTargets(ctx);
    },
    framingDistance: () => framingDistance(),
    setCubeShape: (n) => {
      const next = n === 2 ? 2 : 1;
      if (state.bundleMode !== "chain" || !state.usMap) {
        state.cubeShape = 1;
      } else {
        state.cubeShape = next;
      }
      if (state.cubeShape === 2) {
        state.selectedLinkKey = null;
        state.hoverLinkKey = null;
      }
      queueVisibilityTargets(ctx);
      ctx.hooks.onShapeChange?.(state.cubeShape);
    },
    /** Call after unhiding #app — resize while display:none yields a 1×1 canvas (cloud blur). */
    resize: () => resize(ctx, viewport),
  };
}

function gapNow() {
  // [C-D] gap = d · UNIT (d=1 default; d=0 stacks)
  return gapMeters(state.d);
}

function gapDivNow() {
  return gapSafe(state.d);
}

function v3(p) {
  return new THREE.Vector3(p.x, p.y, p.z);
}

/** [C-COORD] Place a root child at an absolute user coordinate. */
function applyCoord(object, coord) {
  object.position.copy(v3(coordToLocal(coord, N_LAYERS(), gapNow())));
  object.userData.coord = { s: coord.s, x: coord.x, y: coord.y };
}

/**
 * [C-COORD] Place a slice child. `coord` is the unpulled layout coordinate.
 * The slice group carries pull, so children stay fixed in the slice.
 */
function applySliceCoord(object, sliceIndex, coord) {
  const dx = coord.x - LAYOUT.faceCenter.x;
  const dy = coord.y - LAYOUT.faceCenter.y;
  const ds = coord.s - sliceIndex;
  object.position.copy(v3(localOffset(ds, dx, dy, gapNow())));
  object.userData.coord = { s: coord.s, x: coord.x, y: coord.y };
}

function placeSliceGroup(g, i) {
  applyCoord(g, sliceAnchor(i, g.userData.exitX ?? 0));
}

function pointRadius(_c) {
  // demo+shell white spheres: diameter = 1 class unit (UNIT meters).
  if (usesWhiteSpheres()) return UNIT / 2;
  // Chain (C-REV-LINK): shrink as d→0 so stacked slices do not read as one blob.
  if ((state.revenueLinks || []).length) {
    const d = Number(state.d);
    const t = Number.isFinite(d) ? Math.max(0, Math.min(1, d)) : 1;
    return 0.028 + 0.027 * t;
  }
  return 0.022;
}

function wrapLabelLines(ctx2d, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach((w) => {
    const trial = line ? `${line} ${w}` : w;
    if (ctx2d.measureText(trial).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = trial;
  });
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function makeDomainLabelTexture(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 192;
  const ctx2d = canvas.getContext("2d");
  ctx2d.clearRect(0, 0, canvas.width, canvas.height);
  ctx2d.font = "600 44px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx2d.textAlign = "left";
  ctx2d.textBaseline = "top";
  wrapLabelLines(ctx2d, text, 980).forEach((ln, i) => {
    const x = 16;
    const y = 16 + i * 52;
    ctx2d.lineJoin = "round";
    ctx2d.lineWidth = 8;
    ctx2d.strokeStyle = "rgba(8, 12, 18, 0.92)";
    ctx2d.strokeText(ln, x, y);
    ctx2d.lineWidth = 3;
    ctx2d.strokeStyle = "rgba(180, 230, 255, 0.55)";
    ctx2d.strokeText(ln, x, y);
    ctx2d.fillStyle = "rgba(245, 252, 255, 0.98)";
    ctx2d.fillText(ln, x, y);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeCompanyLabelTexture(text, isUS) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 96;
  const ctx2d = canvas.getContext("2d");
  ctx2d.clearRect(0, 0, canvas.width, canvas.height);
  ctx2d.font = "600 36px ui-sans-serif, system-ui, sans-serif";
  ctx2d.textAlign = "left";
  ctx2d.textBaseline = "middle";
  const x = 12;
  const y = 48;
  ctx2d.lineJoin = "round";
  ctx2d.lineWidth = 7;
  ctx2d.strokeStyle = "rgba(8, 12, 18, 0.92)";
  ctx2d.strokeText(text, x, y);
  ctx2d.lineWidth = 2.5;
  ctx2d.strokeStyle = isUS ? "rgba(60, 240, 255, 0.45)" : "rgba(255, 176, 32, 0.55)";
  ctx2d.strokeText(text, x, y);
  ctx2d.fillStyle = "rgba(245, 252, 255, 0.98)";
  ctx2d.fillText(text, x, y);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeSliceTextPlane(map, width, height) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      map,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      opacity: 1,
    })
  );
  mesh.rotation.y = Math.PI / 2;
  return mesh;
}

function shortName(c) {
  return c.name.length > 18 ? c.name.slice(0, 16) + "..." : c.name;
}

/** demo/shell white-sphere name plate (GS-20261016-GOOGL-HOVER-LABEL). */
const WHITE_LABEL_ABOVE_UNITS = 0.5;

function whiteLabelText(c) {
  let t = String(c?.name || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
  if (t.length > 28) t = `${t.slice(0, 27)}…`;
  return t;
}

function whiteLabelCoord(base, gap) {
  const g = Math.max(gap, D_EPS * UNIT);
  return {
    s: base.s + LAYOUT.companyLabel.liftMeters / g,
    x: base.x,
    y: base.y + WHITE_LABEL_ABOVE_UNITS,
  };
}

function makeWhiteLabelTexture(text) {
  const k = (6 * UNIT) / 512;
  const scale = 2;
  const font = "600 18px ui-sans-serif, system-ui, sans-serif";
  const measure = document.createElement("canvas").getContext("2d");
  measure.font = font;
  const W = Math.max(72, Math.ceil(measure.measureText(text).width) + 24);
  const H = 36;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx2d = canvas.getContext("2d");
  ctx2d.scale(scale, scale);
  ctx2d.fillStyle = "rgba(11, 13, 16, 0.72)";
  ctx2d.fillRect(0, 0, W, H);
  ctx2d.strokeStyle = "rgba(232, 237, 244, 0.9)";
  ctx2d.lineWidth = 1;
  ctx2d.strokeRect(0.5, 0.5, W - 1, H - 1);
  ctx2d.fillStyle = "#e8edf4";
  ctx2d.font = font;
  ctx2d.textAlign = "center";
  ctx2d.textBaseline = "middle";
  ctx2d.fillText(text, W / 2, H / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  if ("SRGBColorSpace" in THREE) tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, w: W * k, h: H * k };
}

function makeWhiteLabelPlane(tex, w, h) {
  const geo = new THREE.PlaneGeometry(w, h);
  geo.translate(0, h / 2, 0);
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
      opacity: 1,
    })
  );
  mesh.rotation.y = Math.PI / 2;
  mesh.userData.isWhiteLabel = true;
  mesh.userData.baseRenderOrder = 7;
  return mesh;
}

function shellCompanyCoord(c) {
  const a = state.shellAnchor || SHELL_ANCHOR;
  return {
    s: c.s != null ? c.s : a.s,
    x: c.x != null ? c.x : a.x,
    y: c.y != null ? c.y : a.y,
  };
}


const _linkY = new THREE.Vector3(0, 1, 0);

function orientLinkCylinder(mesh, la, lb) {
  if (!mesh) return;
  const mid = la.clone().add(lb).multiplyScalar(0.5);
  const dir = lb.clone().sub(la);
  const len = Math.max(dir.length(), 1e-4);
  dir.multiplyScalar(1 / len);
  mesh.position.copy(mid);
  mesh.scale.set(1, len, 1);
  mesh.quaternion.setFromUnitVectors(_linkY, dir);
}

function placeRevenueLinks(ctx) {
  const items = ctx.revenueLinkObjs;
  if (!items || !items.length) return;
  ctx.root.updateMatrixWorld(true);
  const Wa = new THREE.Vector3();
  const Wb = new THREE.Vector3();
  items.forEach((item) => {
    const a = ctx.byId.get(item.fromId);
    const b = ctx.byId.get(item.toId);
    if (!a || !b) return;
    a.getWorldPosition(Wa);
    b.getWorldPosition(Wb);
    const la = ctx.root.worldToLocal(Wa.clone());
    const lb = ctx.root.worldToLocal(Wb.clone());
    orientLinkCylinder(item.tube, la, lb);
    orientLinkCylinder(item.hit, la, lb);
    const hot =
      item.key === state.hoverLinkKey || item.key === state.selectedLinkKey;
    if (item.tube && hot) {
      item.tube.scale.x *= 1.25;
      item.tube.scale.z *= 1.25;
    }
  });
  updateLinkSourceCard(ctx);
}

function linkSideColor(side) {
  return side === "supplier" ? COLORS.LINK_SUPPLIER : COLORS.LINK_CUSTOMER;
}

function makeRevenueLinkTube(side, radius, opts = {}) {
  const mat = new THREE.MeshBasicMaterial({
    color: linkSideColor(side),
    transparent: true,
    opacity: opts.opacity ?? 0.9,
    depthWrite: false,
    toneMapped: false,
    visible: opts.visible !== false,
  });
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 10), mat);
  mesh.userData.isRevenueLink = true;
  mesh.renderOrder = 4;
  return mesh;
}

function buildRevenueLinks(ctx) {
  ctx.revenueLinkObjs = [];
  ctx.revenueLinkHits = [];
  const links = state.revenueLinks;
  if (state.shellCube || !Array.isArray(links) || !links.length) return;
  links.forEach((link) => {
    if (!link || (link.side !== "supplier" && link.side !== "customer")) return;
    const fromId = link.fromId;
    const toId = link.toId;
    if (fromId == null || toId == null) return;
    if (!ctx.byId.has(fromId) || !ctx.byId.has(toId)) return;
    const key = revenueLinkKey(link);
    // Slim cylinder (WebGL ignores Line linewidth) + slightly larger invisible hit volume.
    const tube = makeRevenueLinkTube(link.side, 0.016);
    // Invisible but raycastable hit volume (visible:false meshes are skipped by Raycaster).
    const hit = makeRevenueLinkTube(link.side, 0.055, { opacity: 0 });
    hit.material.transparent = true;
    hit.material.depthWrite = false;
    hit.material.colorWrite = false;
    tube.userData.linkKey = key;
    hit.userData.linkKey = key;
    hit.userData.isRevenueLinkHit = true;
    ctx.root.add(tube);
    ctx.root.add(hit);
    // No midpoint relationship labels — hover source-file card only.
    const item = { side: link.side, fromId, toId, key, tube, hit, link };
    ctx.revenueLinkObjs.push(item);
    ctx.revenueLinkHits.push(hit);
  });
}

function buildCube(ctx) {
  const { root } = ctx;
  while (root.children.length) root.remove(root.children[0]);
  ctx.planeGroups = [];
  ctx.meshes = [];
  ctx.revenueLinkObjs = [];
  ctx.revenueLinkHits = [];
  ctx.shape2 = null; // root children cleared above; drop stale handle
  ctx.byId.clear();
  // [C-CUBE] Shell: no C-SLICE walls, no C-RING guides, no thick bars — firm at (5,5,5). No outer wire cube.
  if (!state.shellCube) {
    state.layers.forEach((L, i) => {
      const g = new THREE.Group();
      g.userData.layer = i;
      g.userData.pull = 0;
      g.userData.targetPull = 0;

      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(FACE, FACE),
        new THREE.MeshStandardMaterial({
          color: COLORS.PLANE,
          transparent: true,
          opacity: 0.3,
          depthWrite: false,
          side: THREE.DoubleSide,
          roughness: 0.9,
          metalness: 0,
        })
      );
      plane.rotation.y = Math.PI / 2;
      plane.renderOrder = 0;
      plane.userData.isSlicePlane = true;
      plane.userData.layerIndex = i;
      plane.userData.baseOpacity = 0.3;
      g.add(plane);

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.PlaneGeometry(FACE, FACE)),
        new THREE.LineBasicMaterial({
          color: COLORS.EDGE,
          transparent: true,
          opacity: 0.7,
          depthWrite: false,
        })
      );
      edges.rotation.y = Math.PI / 2;
      edges.renderOrder = 0;
      edges.userData.isSliceEdge = true;
      edges.userData.baseOpacity = 0.65;
      g.add(edges);

      const domainLabel = makeSliceTextPlane(makeDomainLabelTexture(L.name), 1.9, 0.38);
      applySliceCoord(domainLabel, i, domainLabelCoord(i, gapNow()));
      domainLabel.userData.isDomainLabel = true;
      domainLabel.userData.baseOpacity = 1;
      g.add(domainLabel);

      for (let r = 1; r <= 10; r++) {
        const radiusUser = LAYOUT.ringRadius * (r / 10);
        const liftS = LAYOUT.ringGuideLiftMeters / gapDivNow();
        const pts = [];
        for (let k = 0; k <= 64; k++) {
          const a = (k / 64) * Math.PI * 2;
          const { dx, dy } = ringOffset(radiusUser, a);
          pts.push(v3(localOffset(liftS, dx, dy, gapNow())));
        }
        // Cabinet M2: muted steel guides — outer rings fainter than center.
        const guideOp = r === 10 ? 0.42 : 0.12 + r * 0.018;
        const ringLine = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({
            color: r === 10 ? COLORS.RING_GUIDE_CENTER : COLORS.RING_GUIDE,
            transparent: true,
            opacity: guideOp,
            depthWrite: false,
          })
        );
        ringLine.renderOrder = 1;
        ringLine.userData.isRingGuide = true;
        ringLine.userData.baseOpacity = guideOp;
        g.add(ringLine);
      }

      ctx.planeGroups.push(g);
      root.add(g);
    });
  }

  state.companies.forEach((c) => {
    const isUS = c.country === "US";
    const color = isUS ? COLORS.US : COLORS.INTL;
    const r = pointRadius(c);
    const mesh = new THREE.Group();
    mesh.userData.companyId = c.id;
    mesh.userData.basePointR = r;
    mesh.userData.dScale = 1;
    mesh.userData.targetHoverScale = 1;
    mesh.userData.isCompanyPoint = true;
    mesh.renderOrder = 5;

    if (usesWhiteSpheres() || usesChainSpheres()) {
      // C-POINT: unit spheres — demo/shell white; chain center white / supplier green / customer red.
      const ballColor = usesChainSpheres() ? chainSphereColor(c) : 0xffffff;
      const fillMat = new THREE.MeshBasicMaterial({
        color: ballColor,
        transparent: false,
        depthWrite: true,
        opacity: 1,
        toneMapped: false,
      });
      const fill = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), fillMat);
      fill.userData.companyId = c.id;
      fill.userData.isRingFill = true;
      fill.renderOrder = 5;
      mesh.userData.fill = fill;
      mesh.userData.rim = null;
      mesh.userData.isWhiteSphere = usesWhiteSpheres();
      mesh.userData.isChainSphere = usesChainSpheres();
      mesh.add(fill);
    } else {
      // Legacy disk path (unused while chain uses spheres).
      const fillMat = new THREE.MeshBasicMaterial({
        color: COLORS.RING_FILL,
        transparent: false,
        depthWrite: true,
        opacity: 1,
        toneMapped: false,
        side: THREE.DoubleSide,
      });
      const rimMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.22,
        metalness: 0.05,
        emissive: color,
        emissiveIntensity: isUS ? 0.75 : 0.7,
        transparent: false,
        depthWrite: true,
        opacity: 1,
        side: THREE.DoubleSide,
      });
      const fill = new THREE.Mesh(new THREE.CircleGeometry(r * 0.82, 64), fillMat);
      fill.userData.companyId = c.id;
      fill.userData.isRingFill = true;
      fill.renderOrder = 5;
      const rim = new THREE.Mesh(new THREE.RingGeometry(r * 0.78, r, 64), rimMat);
      rim.userData.companyId = c.id;
      rim.userData.isRingRim = true;
      rim.renderOrder = 6;
      mesh.rotation.y = Math.PI / 2;
      mesh.userData.fill = fill;
      mesh.userData.rim = rim;
      mesh.add(fill);
      mesh.add(rim);
    }

    const sphereLabel = usesWhiteSpheres() || usesChainSpheres();
    const useShellPlace =
      state.shellCube || c.layer == null || !ctx.planeGroups[c.layer];
    if (useShellPlace) {
      const coord = shellCompanyCoord(c);
      c.coord = coord;
      applyCoord(mesh, coord);
      root.add(mesh);
      let label;
      if (sphereLabel) {
        const { tex, w, h } = makeWhiteLabelTexture(whiteLabelText(c));
        label = makeWhiteLabelPlane(tex, w, h);
        applyCoord(label, whiteLabelCoord(coord, gapNow()));
      } else {
        label = makeSliceTextPlane(makeCompanyLabelTexture(shortName(c), isUS), 0.72, 0.14);
        applyCoord(label, companyLabelCoord(coord, r, gapNow()));
      }
      label.visible = true;
      label.renderOrder = 7;
      label.userData.isCompanyLabel = true;
      label.userData.baseOpacity = 1;
      root.add(label);
      mesh.userData.label = label;
    } else {
      const coord = companyCoord(c.layer, c.ringCos, c.ringSin);
      c.coord = coord;
      applySliceCoord(mesh, c.layer, coord);
      ctx.planeGroups[c.layer].add(mesh);
      let label;
      if (sphereLabel) {
        const { tex, w, h } = makeWhiteLabelTexture(whiteLabelText(c));
        label = makeWhiteLabelPlane(tex, w, h);
        applySliceCoord(label, c.layer, whiteLabelCoord(coord, gapNow()));
      } else {
        label = makeSliceTextPlane(makeCompanyLabelTexture(shortName(c), isUS), 0.72, 0.14);
        applySliceCoord(label, c.layer, companyLabelCoord(coord, r, gapNow()));
      }
      label.visible = false;
      label.renderOrder = 7;
      label.userData.isCompanyLabel = true;
      label.userData.baseOpacity = 1;
      ctx.planeGroups[c.layer].add(label);
      mesh.userData.label = label;
    }
    ctx.meshes.push(mesh);
    ctx.byId.set(c.id, mesh);
  });

  buildRevenueLinks(ctx);
  rebuildShape2(ctx);
  layoutPlanes(ctx);
  queueVisibilityTargets(ctx);
  applyCubeShape(ctx);
}

function disposeShape2(ctx) {
  if (ctx.shape2?.dispose) ctx.shape2.dispose();
  if (ctx.shape2?.group?.parent) ctx.shape2.group.parent.remove(ctx.shape2.group);
  ctx.shape2 = null;
}

function rebuildShape2(ctx) {
  disposeShape2(ctx);
  if (state.bundleMode !== "chain" || !state.usMap) return;
  const built = buildShape2UsMap(state.usMap, { nLayers: N_LAYERS(), gap: gapNow() });
  if (!built) return;
  ctx.root.add(built.group);
  built.group.visible = state.cubeShape === 2;
  ctx.shape2 = built;
}

/** Shape 1 = slices + linear C-REV-LINK; Shape 2 = US map (NVDA chain). */
function applyCubeShape(ctx) {
  if (state.cubeShape === 2 && state.bundleMode === "chain" && !ctx.shape2) rebuildShape2(ctx);
  const shape2 = state.cubeShape === 2 && state.bundleMode === "chain" && Boolean(ctx.shape2?.group);
  if (ctx.shape2?.group) ctx.shape2.group.visible = shape2;
  ctx.planeGroups.forEach((g) => {
    g.visible = !shape2;
  });
  if (shape2) {
    (ctx.revenueLinkObjs || []).forEach((item) => {
      if (item.tube) item.tube.visible = false;
      if (item.hit) item.hit.visible = false;
    });
    ctx.meshes.forEach((mesh) => {
      mesh.visible = false;
      if (mesh.userData.label) mesh.userData.label.visible = false;
    });
    if (ctx.googlCard) ctx.googlCard.visible = false;
    if (ctx.linkSourceCard) ctx.linkSourceCard.visible = false;
    if (ctx.axesGroup) ctx.axesGroup.visible = !state.altHideAxes;
  }
}

function layoutPlanes(ctx) {
  ctx.cubeExit = 0;
  ctx.planeGroups.forEach((g, i) => {
    g.userData.pull = 0;
    g.userData.exitX = 0;
    placeSliceGroup(g, i);
  });
  // Shell company points live on root — re-place when d (gap) changes.
  if (state.shellCube) {
    state.companies.forEach((c) => {
      const mesh = ctx.byId.get(c.id);
      if (!mesh) return;
      const coord = shellCompanyCoord(c);
      c.coord = coord;
      const r = pointRadius(c);
      applyCoord(mesh, coord);
      if (mesh.userData.label) {
        const lc =
          usesWhiteSpheres() || usesChainSpheres()
            ? whiteLabelCoord(coord, gapNow())
            : companyLabelCoord(coord, r, gapNow());
        applyCoord(mesh.userData.label, lc);
      }
    });
  }
  // NVDA chain: shrink point rings as d→0 so stacked faces stay readable.
  // dScale multiplies with hover/select scale in lerpVisibility (not absolute).
  if (!state.shellCube && (state.revenueLinks || []).length) {
    state.companies.forEach((c) => {
      const mesh = ctx.byId.get(c.id);
      if (!mesh) return;
      const r = pointRadius(c);
      const base = mesh.userData.basePointR || r;
      const dScale = base > 1e-9 ? r / base : 1;
      mesh.userData.dScale = dScale;
      const h = mesh.userData.targetHoverScale ?? 1;
      mesh.scale.setScalar(dScale * h);
      if (mesh.userData.label && c.coord) {
        const useShell =
          c.layer == null || !ctx.planeGroups[c.layer];
        if (useShell) {
          applyCoord(mesh.userData.label, companyLabelCoord(c.coord, r, gapNow()));
        } else {
          applySliceCoord(
            mesh.userData.label,
            c.layer,
            companyLabelCoord(c.coord, r, gapNow())
          );
        }
      }
    });
  }
  rebuildAxes(ctx);
  placeRevenueLinks(ctx);
  // Shape Two positions depend on gap (s-scale); rebuild when d changes.
  if (state.usMap && state.bundleMode === "chain") rebuildShape2(ctx);
}

/**
 * [C-AXES][C-ORIGIN] User axes from origin: s/y/x in ring ice-blue (−Z for +x).
 */
function rebuildAxes(ctx) {
  if (ctx.axesGroup) {
    ctx.root.remove(ctx.axesGroup);
    ctx.axesGroup.traverse((o) => {
      if (o.geometry) o.geometry.dispose?.();
      if (o.material) {
        if (o.material.map) o.material.map.dispose?.();
        o.material.dispose?.();
      }
    });
    ctx.axesGroup = null;
  }

  const n = N_LAYERS();
  const gap = gapNow();
  const chrome = axisChrome(gap);
  const axes = new THREE.Group();
  applyCoord(axes, { s: 0, x: 0, y: 0 });

  const at = (s, x, y) => v3(localOffset(s, x, y, gap));
  const sDir = new THREE.Vector3(1, 0, 0);
  const yDir = new THREE.Vector3(0, 1, 0);
  const xDir = new THREE.Vector3(0, 0, USER_X_SIGN);

  axes.add(makeAxisLine(at(chrome.sEnd, 0, 0), COLORS.AXIS_S));
  axes.add(makeAxisLine(at(0, 0, chrome.yEnd), COLORS.AXIS_Y));
  axes.add(makeAxisLine(at(0, chrome.xEnd, 0), COLORS.AXIS_X));

  axes.add(makeAxisArrow(sDir, chrome.sEnd * gap, COLORS.AXIS_S));
  axes.add(makeAxisArrow(yDir, chrome.yEnd * UNIT, COLORS.AXIS_Y));
  axes.add(makeAxisArrow(xDir, chrome.xEnd * UNIT, COLORS.AXIS_X));

  // Slice ticks every unit 0..sEnd; emphasize existing layer indices 0..n-1
  for (let i = 0; i <= chrome.sEnd; i++) {
    const isLayer = i < n;
    const tickH = isLayer ? chrome.tickLayerY : chrome.tickMinorY;
    axes.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([at(i, 0, 0), at(i, 0, tickH)]),
        new THREE.LineBasicMaterial({
          color: isLayer ? COLORS.AXIS_TICK_MAJOR : COLORS.AXIS_TICK_MINOR,
          transparent: true,
          opacity: isLayer ? 0.9 : 0.45,
          depthWrite: false,
        })
      )
    );
    if (i % 2 === 0 || isLayer) {
      // Lock to s/y plane (Three.js XY) — never billboard toward camera
      const num = makeSyPlaneLabel(
        String(i),
        isLayer ? 0.26 : 0.2,
        isLayer ? 0.2 : 0.16,
        isLayer ? colorCss(COLORS.AXIS_S) : colorCss(COLORS.AXIS_TICK_MINOR)
      );
      num.position.copy(at(i, 0, tickH + chrome.labelGapY));
      axes.add(num);
    }
  }

  // y ticks: 0 at origin, FACE_SPAN at cube top (also on s/y plane)
  for (const yu of [0, FACE_SPAN]) {
    axes.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([at(0, 0, yu), at(chrome.yTickS, 0, yu)]),
        new THREE.LineBasicMaterial({
          color: COLORS.AXIS_Y,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
        })
      )
    );
    const yl = makeSyPlaneLabel(String(yu), 0.2, 0.16, colorCss(COLORS.AXIS_Y));
    yl.position.copy(at(chrome.yNumeralS, 0, yu));
    axes.add(yl);
  }

  // x ticks: 0 (origin face), FACE_SPAN (far face), 2*FACE_SPAN (axis mark)
  for (const xu of [0, FACE_SPAN, FACE_SPAN * 2]) {
    axes.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([at(0, xu, 0), at(0, xu, chrome.xTickY)]),
        new THREE.LineBasicMaterial({
          color: COLORS.AXIS_X,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
        })
      )
    );
    // x-axis numerals sit in the x/y plane (Three.js YZ)
    const xl = makeXyPlaneLabel(String(xu), 0.2, 0.16, colorCss(COLORS.AXIS_X));
    xl.position.copy(at(0, xu, chrome.xNumeralY));
    axes.add(xl);
  }

  const sliceLbl = makeSyPlaneLabel("s", 0.32, 0.26, colorCss(COLORS.AXIS_S));
  sliceLbl.position.copy(at(chrome.sLabel.s, chrome.sLabel.x, chrome.sLabel.y));
  axes.add(sliceLbl);

  const yLbl = makeSyPlaneLabel("y", 0.28, 0.22, colorCss(COLORS.AXIS_Y));
  yLbl.position.copy(at(chrome.yLabel.s, chrome.yLabel.x, chrome.yLabel.y));
  axes.add(yLbl);

  const xLbl = makeXyPlaneLabel("x", 0.28, 0.22, colorCss(COLORS.AXIS_X));
  xLbl.position.copy(at(chrome.xLabel.s, chrome.xLabel.x, chrome.xLabel.y));
  axes.add(xLbl);

  const originDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  axes.add(originDot);

  ctx.axesGroup = axes;
  ctx.root.add(axes);
  applyAltAxes(ctx);
}

function makeAxisLine(to, color) {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), to]),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false })
  );
}

function makeAxisArrow(dir, length, color) {
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.06, 0.16, 10),
    new THREE.MeshBasicMaterial({ color, depthWrite: false })
  );
  cone.position.copy(dir.clone().multiplyScalar(length));
  cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return cone;
}

function makeAxisText(text, w, h, fill) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 96;
  const ctx2d = canvas.getContext("2d");
  ctx2d.clearRect(0, 0, canvas.width, canvas.height);
  ctx2d.font = "600 48px ui-sans-serif, system-ui, sans-serif";
  ctx2d.textAlign = "center";
  ctx2d.textBaseline = "middle";
  ctx2d.fillStyle = fill;
  ctx2d.fillText(text, 128, 48);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide })
  );
  mesh.renderOrder = 12;
  return mesh;
}

/** Label locked in the s/y plane (Three.js XY). Does not face the camera. */
function makeSyPlaneLabel(text, w, h, fill) {
  const mesh = makeAxisText(text, w, h, fill);
  mesh.rotation.set(0, 0, 0); // PlaneGeometry default = XY = s/y
  mesh.userData.axisPlane = "sy";
  return mesh;
}

/** Label locked in the x/y plane (Three.js YZ). */
function makeXyPlaneLabel(text, w, h, fill) {
  const mesh = makeAxisText(text, w, h, fill);
  mesh.rotation.set(0, Math.PI / 2, 0); // XY → YZ
  mesh.userData.axisPlane = "xy";
  return mesh;
}

/**
 * [C-PULL][C-RETRACT] Stay = pinned ∪ {focus}; non-stay hide in place (no −x park).
 * Placement always exitX=0; visibility handles hide/show.
 */
function lerpPullOut(ctx) {
  ctx.cubeExit = 0;
  ctx.exitStayLayer = null;
  ctx.planeGroups.forEach((g) => {
    g.userData.pull = 0;
    g.userData.exitX = 0;
    placeSliceGroup(g, g.userData.layer);
  });
}

/* ============================================================================
 * Section 2 · Camera & Standard View ([C-STDVIEW], [C-VIEW-SPACE])
 * ========================================================================== */

function framingDistance() {
  const span = Math.max(gapNow(), (N_LAYERS() - 1) * gapNow());
  return Math.max(7.2, Math.hypot(span, FACE) * 1.15);
}

/** [C-MAP] User (s, x, y) → world Three.js, including root yaw. */
function userToWorld(ctx, coord) {
  return ctx.root.localToWorld(v3(coordToLocal(coord, N_LAYERS(), gapNow())));
}

/**
 * [C-STDVIEW] Standard framing in (s, x, y):
 * - focused s*: camera (s*+10, 5, 5) → look (s*, 5, 5) (from +s / front)
 * - no focus: camera (24, 2.1, 2.1) → user origin (0, 0, 0)
 */
function standardPose(ctx) {
  if (state.shellCube) {
    // Face-on pull (s*+10) fills FOV with mid-face only → cyan fog blob.
    // Mid framing: whole wire cube + crisp point, not full overview fade-out.
    const a = state.shellAnchor || SHELL_ANCHOR;
    return {
      pos: userToWorld(ctx, {
        s: a.s + 14,
        x: a.x + 9,
        y: a.y + 9,
      }),
      target: userToWorld(ctx, { s: a.s, x: a.x, y: a.y }),
    };
  }
  if (state.focusLayer != null) {
    const sStar = state.focusLayer;
    const cam = LAYOUT.camera.pulled;
    const look = { s: sStar, x: cam.x, y: cam.y };
    return {
      pos: userToWorld(ctx, { s: sStar + cam.sOffset, x: cam.x, y: cam.y }),
      target: userToWorld(ctx, look),
    };
  }
  const overview = LAYOUT.camera.overview;
  return {
    pos: userToWorld(ctx, overview.pos),
    target: userToWorld(ctx, overview.target),
  };
}

function startCamAnim(ctx, toPos, toTarget, dur = 480) {
  ctx.camAnim = {
    fromPos: ctx.camera.position.clone(),
    fromTarget: ctx.controls.target.clone(),
    toPos: toPos.clone(),
    toTarget: toTarget.clone(),
    t0: performance.now(),
    dur,
  };
}

function stepCamAnim(ctx) {
  const a = ctx.camAnim;
  if (!a) return;
  const u = Math.min(1, (performance.now() - a.t0) / a.dur);
  const e = 1 - (1 - u) ** 3;
  ctx.camera.position.lerpVectors(a.fromPos, a.toPos, e);
  ctx.controls.target.lerpVectors(a.fromTarget, a.toTarget, e);
  if (u >= 1) ctx.camAnim = null;
}


function isEditableFocus() {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return Boolean(el.closest?.("[contenteditable='true'], [contenteditable='']"));
}

export const STDVIEW_MS = 520;

/** [C-STDVIEW] Snap to standardPose for current focus state. */
function goStandardView(ctx, animate = true) {
  const { pos, target } = standardPose(ctx);
  ctx.camAnim = null;
  if (animate) startCamAnim(ctx, pos, target, STDVIEW_MS);
  else {
    ctx.camera.position.copy(pos);
    ctx.controls.target.copy(target);
    ctx.controls.update();
  }
  ctx.hooks.onStandardView?.();
}

function resetCamera(ctx) {
  state.focusLayer = null;
  state.selectedId = null;
  state.hoverId = null;
  state.selectedLinkKey = null;
  state.hoverLinkKey = null;
  state.pinnedLayers = [];
  ctx.cubeExit = 0;
  ctx.exitStayLayer = null;
  ctx.planeGroups.forEach((g) => {
    g.userData.pull = 0;
    g.userData.exitX = 0;
  });
  goStandardView(ctx, true);
  queueVisibilityTargets(ctx);
  ctx.hooks.onReset?.();
}

/* ============================================================================
 * Section 3 · Focus Transitions, Raycast & Input ([C-FOCUS], [C-PICK], [C-PIN])
 * ========================================================================== */

/** [C-FOCUS-ACT][C-PULL][C-RETRACT][C-CAM-HOLD] Toggle/set focus; hide non-stay; do not move camera. */
function focusSlice(ctx, i) {
  if (state.shellCube) return;
  const n = state.layers.length;
  if (i == null || i < 0 || i >= n) return;
  if (state.focusLayer === i) {
    state.focusLayer = null;
    state.selectedId = null;
    state.selectedLinkKey = null;
    state.hoverId = null;
    state.hoverLinkKey = null;
    queueVisibilityTargets(ctx);
    ctx.hooks.onClear?.();
    return;
  }
  state.focusLayer = i;
  state.selectedId = null;
  state.selectedLinkKey = null;
  queueVisibilityTargets(ctx);
  ctx.hooks.onFocusChange?.();
}

/** [C-PIN] Shift+pull-zone toggles pin; does not change focus alone. */
function togglePinLayer(ctx, i) {
  if (state.shellCube) return;
  const n = state.layers.length;
  if (i == null || i < 0 || i >= n) return;
  const pins = state.pinnedLayers || [];
  const idx = pins.indexOf(i);
  if (idx >= 0) pins.splice(idx, 1);
  else pins.push(i);
  pins.sort((a, b) => a - b);
  state.pinnedLayers = pins;
  queueVisibilityTargets(ctx);
  ctx.hooks.onFocusChange?.();
}

/** [C-ESC] Clear select → focus → all pins; camera unchanged. */
function clearFocus(ctx) {
  if (state.selectedLinkKey != null) {
    state.selectedLinkKey = null;
    state.hoverLinkKey = null;
    queueVisibilityTargets(ctx);
    ctx.hooks.onClear?.();
    return;
  }
  if (state.selectedId != null) {
    state.selectedId = null;
    queueVisibilityTargets(ctx);
    if (state.focusLayer != null || (state.pinnedLayers || []).length) {
      ctx.hooks.onFocusChange?.();
    } else ctx.hooks.onClear?.();
    return;
  }
  if (state.focusLayer != null) {
    state.focusLayer = null;
    state.hoverId = null;
    queueVisibilityTargets(ctx);
    ctx.hooks.onClear?.();
    return;
  }
  if ((state.pinnedLayers || []).length) {
    state.pinnedLayers = [];
    state.hoverId = null;
    queueVisibilityTargets(ctx);
    ctx.hooks.onClear?.();
    return;
  }
  ctx.hooks.onClear?.();
}

/** Double-click empty: clear focus only; pins stay. */
function clearFocusKeepPins(ctx) {
  if (state.focusLayer == null) return;
  state.focusLayer = null;
  state.hoverId = null;
  queueVisibilityTargets(ctx);
  ctx.hooks.onClear?.();
}

function selectCompany(ctx, id, opts = {}) {
  const c = companyById(id);
  if (!c) return;
  // GOOGL white-sphere file ring: each click advances; wraps to first.
  if (usesWhiteSpheres() && isGooglTicker(c.ticker)) {
    const n = googlFileEntries().length;
    if (n > 0) {
      state.googlFileIndex = (Number(state.googlFileIndex) + 1) % n;
      ctx.googlCardDirty = true;
    }
  }
  state.selectedLinkKey = null;
  state.hoverLinkKey = null;
  state.selectedId = id;
  if (!state.shellCube && c.layer != null) {
    state.focusLayer = c.layer;
  }
  ctx.camAnim = null;
  ctx.controls.enabled = true;
  queueVisibilityTargets(ctx);
  if (!state.shellCube && opts.standardView) {
    goStandardView(ctx, true);
    ctx.hooks.onSelect?.(c, { standardView: true });
    return;
  }
  ctx.hooks.onSelect?.(c, {});
}

/** GOOGL file-card leader + screen-constant card (GS-20261016-GOOGL-HOVER-LEFT-SCALE). */
const GOOGL_LEADER_UP = 3;
const GOOGL_LEADER_DIAG = 2;
const GOOGL_LEADER_NEAR_D0 = 9.7;
const GOOGL_CARD_PX = 400;
const GOOGL_CARD_PX_MIN = 240;
/** Ball NDC x below this → fold right (card would crowd the left); hysteresis ±0.05. */
const GOOGL_FOLD_BALL_NDC = -0.35;
const GOOGL_FOLD_HYST = 0.05;

function makeGooglCardTexture(entries, activeIndex) {
  // Cube chrome on canvas (AESTHETIC §1 tokens as literals; no paper skin).
  // Hover-only: always list all files (GS-20261016-GOOGL-HOVER-LABEL).
  const W = 512;
  const rowH = 28;
  const pad = 16;
  const lines = entries;
  const H = Math.max(96, pad * 2 + 36 + lines.length * rowH + 8);
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx2d = canvas.getContext("2d");
  ctx2d.scale(scale, scale);
  // alpha 0.72: 0.55 washed out on #0b0d10 fog/bg (cabinet allows ≤0.72 with reason)
  ctx2d.fillStyle = "rgba(11, 13, 16, 0.72)";
  ctx2d.fillRect(0, 0, W, H);
  ctx2d.strokeStyle = "rgba(232, 237, 244, 0.9)";
  ctx2d.lineWidth = 1;
  ctx2d.strokeRect(0.5, 0.5, W - 1, H - 1);
  ctx2d.fillStyle = "#e8edf4";
  ctx2d.font = "600 18px ui-sans-serif, system-ui, sans-serif";
  const title = "GOOGL files";
  ctx2d.fillText(title, pad, pad + 18);
  const tw = ctx2d.measureText(title).width;
  ctx2d.strokeStyle = "rgba(139, 224, 192, 0.55)";
  ctx2d.beginPath();
  ctx2d.moveTo(pad, pad + 24);
  ctx2d.lineTo(pad + tw, pad + 24);
  ctx2d.stroke();
  ctx2d.font = "400 14px ui-monospace, Menlo, monospace";
  lines.forEach((e, i) => {
    const y = pad + 40 + i * rowH;
    const on = i === activeIndex;
    if (on) {
      ctx2d.fillStyle = "rgba(232, 237, 244, 0.08)";
      ctx2d.fillRect(pad - 6, y - 16, W - pad * 2 + 12, rowH - 4);
      ctx2d.fillStyle = "#8be0c0";
      ctx2d.fillRect(pad - 6, y - 16, 2, rowH - 4);
    }
    ctx2d.fillStyle = on ? "#e8edf4" : "#9aa6b5";
    ctx2d.fillText(e.name, pad + 4, y);
    ctx2d.fillStyle = "#9aa6b5";
    ctx2d.font = "400 11px ui-sans-serif, system-ui, sans-serif";
    const short = e.path.length > 56 ? `…${e.path.slice(-54)}` : e.path;
    ctx2d.fillText(short, pad + 4, y + 12);
    ctx2d.font = "400 14px ui-monospace, Menlo, monospace";
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  if ("SRGBColorSpace" in THREE) tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, aspect: W / H };
}

function ensureGooglFileCard(ctx) {
  if (ctx.googlCard) return ctx.googlCard;
  const mat = new THREE.MeshBasicMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  mesh.visible = false;
  mesh.frustumCulled = false;
  mesh.renderOrder = 30;
  mesh.userData.isGooglCard = true;
  ctx.root.add(mesh);
  ctx.googlCard = mesh;
  const leadGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
  ]);
  const leadMat = new THREE.LineBasicMaterial({
    color: 0xe8edf4,
    transparent: true,
    opacity: 0.9,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const lead = new THREE.Line(leadGeo, leadMat);
  lead.visible = false;
  lead.frustumCulled = false;
  lead.renderOrder = 29;
  lead.userData.isGooglLeader = true;
  ctx.root.add(lead);
  ctx.googlLeader = lead;
  ctx.googlLeaderFoldRight = false; // false = fold left (default)
  ctx.googlCardDirty = true;
  return mesh;
}

function linkSourcePaths(link) {
  if (!link) return [];
  if (Array.isArray(link.sourcePaths) && link.sourcePaths.length) {
    return link.sourcePaths.map(String);
  }
  if (link.sourcePath) return [String(link.sourcePath)];
  return [];
}

function makeLinkSourceCardTexture(link) {
  const paths = linkSourcePaths(link);
  const title = link.side === "supplier" ? "supplier link" : "customer link";
  const lines = paths.length ? paths.map((p) => p.split("/").pop() || p) : ["(no source file)"];
  const scale = 2;
  const W = 320;
  const rowH = 22;
  const H = 36 + lines.length * rowH + 12;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const g = canvas.getContext("2d");
  g.scale(scale, scale);
  g.fillStyle = "rgba(11, 13, 16, 0.82)";
  g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(232, 237, 244, 0.9)";
  g.lineWidth = 1;
  g.strokeRect(0.5, 0.5, W - 1, H - 1);
  g.fillStyle = "#e8edf4";
  g.font = "600 13px ui-sans-serif, system-ui, sans-serif";
  g.fillText(title, 12, 22);
  g.font = "12px ui-monospace, Menlo, monospace";
  g.fillStyle = "rgba(232, 237, 244, 0.78)";
  lines.forEach((t, i) => {
    const s = t.length > 42 ? `${t.slice(0, 41)}…` : t;
    g.fillText(s, 12, 42 + i * rowH);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  if ("SRGBColorSpace" in THREE) tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, aspect: W / H };
}

function ensureLinkSourceCard(ctx) {
  if (ctx.linkSourceCard) return ctx.linkSourceCard;
  const mat = new THREE.MeshBasicMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  mesh.visible = false;
  mesh.frustumCulled = false;
  mesh.renderOrder = 31;
  mesh.userData.isLinkSourceCard = true;
  ctx.root.add(mesh);
  ctx.linkSourceCard = mesh;
  return mesh;
}

function updateLinkSourceCard(ctx) {
  const mesh = ensureLinkSourceCard(ctx);
  const key = state.hoverLinkKey;
  const link = key ? revenueLinkByKey(key) : null;
  if (!link) {
    mesh.visible = false;
    return;
  }
  const item = (ctx.revenueLinkObjs || []).find((it) => it.key === key);
  if (!item?.tube || !item.tube.visible) {
    mesh.visible = false;
    return;
  }
  if (ctx.linkSourceCardKey !== key) {
    const { tex, aspect } = makeLinkSourceCardTexture(link);
    if (mesh.material.map) mesh.material.map.dispose();
    mesh.material.map = tex;
    mesh.material.needsUpdate = true;
    ctx.linkSourceCardAspect = aspect;
    ctx.linkSourceCardKey = key;
  }
  const aspect = ctx.linkSourceCardAspect || 1.6;
  const camPos = new THREE.Vector3();
  ctx.camera.getWorldPosition(camPos);
  const mid = new THREE.Vector3();
  item.tube.getWorldPosition(mid);
  const depth = Math.max(0.5, mid.distanceTo(camPos));
  const size = ctx.renderer.getSize(new THREE.Vector2());
  const k2 = 2 * Math.tan(THREE.MathUtils.degToRad(ctx.camera.fov) / 2);
  const wPx = Math.min(280, 0.36 * size.x);
  const wWorld = (wPx * k2 * depth) / size.y;
  mesh.scale.set(wWorld, wWorld / aspect, 1);
  const local = mid.clone();
  ctx.root.worldToLocal(local);
  mesh.position.copy(local);
  mesh.position.y += 0.22;
  mesh.quaternion.copy(ctx.camera.quaternion);
  if (mesh.parent) {
    const pq = new THREE.Quaternion();
    mesh.parent.getWorldQuaternion(pq);
    mesh.quaternion.premultiply(pq.invert());
  }
  mesh.visible = true;
}

function selectLink(ctx, key) {
  if (!key || !revenueLinkByKey(key)) return;
  state.selectedLinkKey = key;
  state.selectedId = null;
  state.hoverId = null;
  queueVisibilityTargets(ctx);
  ctx.hooks.onSelectLink?.(revenueLinkByKey(key));
}

function updateGooglFileCard(ctx, faceQuat, parentQuat) {
  if (!usesWhiteSpheres()) {
    if (ctx.googlCard) ctx.googlCard.visible = false;
    if (ctx.googlLeader) ctx.googlLeader.visible = false;
    return;
  }
  // Hover-only: selected-but-not-hovered shows nothing (GS-20261016-GOOGL-HOVER-LABEL).
  const hover = state.hoverId != null ? companyById(state.hoverId) : null;
  const c = hover && isGooglTicker(hover.ticker) ? hover : null;
  const mesh = ensureGooglFileCard(ctx);
  const lead = ctx.googlLeader;
  if (!c) {
    mesh.visible = false;
    if (lead) lead.visible = false;
    return;
  }
  const host = ctx.byId.get(c.id);
  if (!host || !host.visible) {
    mesh.visible = false;
    if (lead) lead.visible = false;
    return;
  }
  const entries = googlFileEntries();
  if (!entries.length) {
    mesh.visible = false;
    if (lead) lead.visible = false;
    return;
  }
  const idx = ((state.googlFileIndex % entries.length) + entries.length) % entries.length;
  if (ctx.googlCardDirty || ctx.googlCardKey !== `${idx}:${entries.length}`) {
    const { tex, aspect } = makeGooglCardTexture(entries, idx);
    if (mesh.material.map) mesh.material.map.dispose();
    mesh.material.map = tex;
    mesh.material.needsUpdate = true;
    const maxAniso = ctx.renderer?.capabilities?.getMaxAnisotropy?.() || 1;
    tex.anisotropy = Math.max(1, Math.floor(maxAniso / 2));
    ctx.googlCardAspect = aspect;
    ctx.googlCardDirty = false;
    ctx.googlCardKey = `${idx}:${entries.length}`;
  }
  const aspect = ctx.googlCardAspect || 1;
  const center = new THREE.Vector3();
  host.getWorldPosition(center);
  ctx.root.worldToLocal(center);

  // Billboard first so corner offset matches camera.
  faceQuat.copy(ctx.camera.quaternion);
  if (mesh.parent) {
    mesh.parent.getWorldQuaternion(parentQuat);
    faceQuat.premultiply(parentQuat.invert());
  }
  mesh.quaternion.copy(faceQuat);

  const worldCenter = new THREE.Vector3();
  host.getWorldPosition(worldCenter);
  const camQ = new THREE.Quaternion();
  ctx.camera.getWorldQuaternion(camQ);
  const camPos = new THREE.Vector3();
  ctx.camera.getWorldPosition(camPos);
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camQ);
  const depthOf = (pWorld) => Math.max(0.5, pWorld.clone().sub(camPos).dot(fwd));

  const rootQ = new THREE.Quaternion();
  ctx.root.getWorldQuaternion(rootQ);
  const localCam = rootQ.clone().invert().multiply(camQ);
  const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(localCam).normalize();
  const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(localCam).normalize();

  const size = ctx.renderer.getSize(new THREE.Vector2());
  const k2 = 2 * Math.tan(THREE.MathUtils.degToRad(ctx.camera.fov) / 2);
  const wPx = THREE.MathUtils.clamp(
    Math.min(GOOGL_CARD_PX, 0.42 * size.x, 0.3 * size.y * aspect),
    GOOGL_CARD_PX_MIN,
    GOOGL_CARD_PX
  );

  const lam = Math.min(1, depthOf(worldCenter) / GOOGL_LEADER_NEAR_D0);
  const tipFor = (foldRight) => {
    const dir = camRight
      .clone()
      .multiplyScalar(foldRight ? 1 : -1)
      .add(camUp)
      .normalize();
    const elbow = center.clone().add(new THREE.Vector3(0, GOOGL_LEADER_UP * UNIT * lam, 0));
    const tip = elbow.clone().add(dir.multiplyScalar(GOOGL_LEADER_DIAG * UNIT * lam));
    return { elbow, tip };
  };

  // Default fold left; flip right only when the ball itself sits in the left of the view
  // (a 400px card's left-edge test would flip immediately on typical viewports).
  const ballNdc = worldCenter.clone().project(ctx.camera);
  if (!ctx.googlLeaderFoldRight && ballNdc.x < GOOGL_FOLD_BALL_NDC - GOOGL_FOLD_HYST) {
    ctx.googlLeaderFoldRight = true;
  } else if (ctx.googlLeaderFoldRight && ballNdc.x > GOOGL_FOLD_BALL_NDC + GOOGL_FOLD_HYST) {
    ctx.googlLeaderFoldRight = false;
  }

  const foldRight = ctx.googlLeaderFoldRight;
  const { elbow, tip } = tipFor(foldRight);
  const tipWorld = tip.clone();
  ctx.root.localToWorld(tipWorld);
  const wWorld = (wPx * k2 * depthOf(tipWorld)) / size.y;
  mesh.scale.set(wWorld, wWorld / aspect, 1);

  const halfW = wWorld * 0.5;
  const halfH = mesh.scale.y * 0.5;
  // Left fold → bottom-right corner on tip; right fold → bottom-left.
  const cornerLocal = new THREE.Vector3(foldRight ? -halfW : halfW, -halfH, 0);
  cornerLocal.applyQuaternion(faceQuat);
  mesh.position.copy(tip).sub(cornerLocal);

  if (lead) {
    const pos = lead.geometry.attributes.position;
    pos.setXYZ(0, center.x, center.y, center.z);
    pos.setXYZ(1, elbow.x, elbow.y, elbow.z);
    pos.setXYZ(2, tip.x, tip.y, tip.z);
    pos.needsUpdate = true;
    lead.geometry.computeBoundingSphere();
    lead.visible = true;
  }
  mesh.visible = true;
}

function companyOnStay(c) {
  if (state.shellCube || c.layer == null) return true;
  return layerIsStay(c.layer);
}

function applyAltAxes(ctx) {
  if (ctx.axesGroup) ctx.axesGroup.visible = !state.altHideAxes;
}

function queueVisibilityTargets(ctx) {
  const chainMode = !state.shellCube && (state.revenueLinks || []).length > 0;
  const stay = stayLayers();
  const hideChrome = state.altHideRingsSlices;

  state.companies.forEach((c) => {
    const mesh = ctx.byId.get(c.id);
    if (!mesh) return;
    const show = passesFilter(c);
    const onStay = companyOnStay(c);
    const lit = show && onStay;
    if (lit) mesh.visible = true;
    if (mesh.userData.label) {
      mesh.userData.label.visible = state.shellCube
        ? show
        : chainMode
          ? lit
          : lit && stay != null;
    }
    const selected = c.id === state.selectedId;
    const hovered = c.id === state.hoverId;
    const { targetEmissive, targetOpacity, targetHoverScale } = focusPointTargets({
      shellCube: state.shellCube,
      selected,
      hovered,
      lit,
      country: c.country,
      whiteSphere: Boolean(mesh.userData.isWhiteSphere || mesh.userData.isChainSphere),
    });
    mesh.userData.targetEmissive = targetEmissive;
    mesh.userData.targetOpacity = targetOpacity;
    mesh.userData.targetHoverScale = targetHoverScale;
    const rim = mesh.userData.rim;
    const fill = mesh.userData.fill;
    if (rim?.material) {
      rim.material.transparent = true;
      rim.material.depthWrite = false;
    }
    if (fill?.material) {
      fill.material.transparent = true;
      fill.material.depthWrite = false;
    }
    mesh.renderOrder = lit ? 8 : 4;
    if (mesh.userData.label) {
      const label = mesh.userData.label;
      const enlarged = (mesh.userData.targetHoverScale || 1) > 1.001;
      if (label.userData.isWhiteLabel && enlarged) {
        label.material.depthTest = false;
        label.renderOrder = 31;
      } else {
        if (label.material) label.material.depthTest = true;
        label.renderOrder = lit ? 10 : 4;
      }
    }
  });

  (ctx.revenueLinkObjs || []).forEach((item) => {
    const a = companyById(item.fromId);
    const b = companyById(item.toId);
    const showLink = Boolean(
      a &&
        b &&
        passesFilter(a) &&
        passesFilter(b) &&
        companyOnStay(a) &&
        companyOnStay(b)
    );
    const hot =
      item.key === state.hoverLinkKey || item.key === state.selectedLinkKey;
    if (item.tube) {
      item.tube.visible = showLink;
      if (item.tube.material) item.tube.material.opacity = hot ? 1 : 0.82;
    }
    if (item.hit) item.hit.visible = showLink;
  });

  ctx.planeGroups.forEach((g, i) => {
    const onStay = layerIsStay(i);
    const dim = !onStay;
    g.renderOrder = dim ? 0 : 2;
    g.userData.pull = 0;
    const focused = state.focusLayer === i;
    const pinned = (state.pinnedLayers || []).includes(i);
    g.children.forEach((ch) => {
      if (!ch.material || ch.material.opacity == null) return;
      const base = ch.userData.baseOpacity ?? 1;
      if (ch.userData.isSlicePlane) {
        if (hideChrome || dim) ch.userData.targetOpacity = 0;
        else ch.userData.targetOpacity = focused || pinned ? 0.38 : base;
        ch.visible = true;
      } else if (ch.userData.isRingGuide) {
        ch.userData.targetOpacity = hideChrome || dim ? 0 : base;
      } else if (
        ch.userData.isSliceEdge ||
        (ch.isLineSegments && !ch.userData.isRingGuide)
      ) {
        ch.userData.targetOpacity = hideChrome || dim ? 0 : base;
        if (ch.material.color) ch.material.color.setHex(COLORS.EDGE);
      } else if (ch.userData.isDomainLabel) {
        ch.userData.targetOpacity = hideChrome || dim ? 0 : 1;
      }
    });
  });

  applyAltAxes(ctx);
  applyCubeShape(ctx);
}

function lerpPointMaterial(mat, targetEmissive, targetOpacity, k) {
  if (!mat) return;
  if (targetEmissive != null && mat.emissiveIntensity != null) {
    mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * k;
  }
  if (targetOpacity != null) {
    mat.transparent = true;
    mat.depthWrite = false;
    mat.opacity += (targetOpacity - mat.opacity) * k;
    if (targetOpacity >= 0.99 && mat.opacity > 0.98) {
      mat.opacity = 1;
      mat.transparent = false;
      mat.depthWrite = true;
    }
  }
}

function lerpVisibility(ctx) {
  const k = 0.18;
  ctx.meshes.forEach((mesh) => {
    const targetOp = mesh.userData.targetOpacity;
    if (!mesh.visible && !(targetOp > 0.01)) return;
    if (targetOp > 0.01) mesh.visible = true;
    const rim = mesh.userData.rim;
    const fill = mesh.userData.fill;
    if (rim || fill) {
      lerpPointMaterial(
        rim?.material,
        mesh.userData.targetEmissive,
        targetOp,
        k
      );
      lerpPointMaterial(fill?.material, null, targetOp, k);
    } else if (mesh.material) {
      lerpPointMaterial(
        mesh.material,
        mesh.userData.targetEmissive,
        targetOp,
        k
      );
    }
    const dScale = mesh.userData.dScale ?? 1;
    const hover = mesh.userData.targetHoverScale ?? 1;
    const desired = dScale * hover;
    const s = mesh.scale.x + (desired - mesh.scale.x) * k;
    mesh.scale.setScalar(s);
    const op =
      rim?.material?.opacity ??
      mesh.material?.opacity ??
      (targetOp == null ? 1 : targetOp);
    if (targetOp != null && targetOp < 0.01 && op < 0.02) {
      mesh.visible = false;
      if (mesh.userData.label) mesh.userData.label.visible = false;
    }
  });
  ctx.planeGroups.forEach((g) => {
    g.children.forEach((ch) => {
      if (ch.userData.targetOpacity == null || !ch.material) return;
      ch.material.opacity += (ch.userData.targetOpacity - ch.material.opacity) * k;
    });
  });
}

function applyKeyboard(ctx) {
  if (isEditableFocus()) {
    ctx.keys.clear();
    return;
  }
  const { keys, camera, controls, root } = ctx;
  const yawSpeed = 0.035;
  if (keys.has("q")) root.rotation.y += yawSpeed;
  if (keys.has("e")) root.rotation.y -= yawSpeed;

  const fast = keys.has("shift");
  const panSpeed = fast ? 0.22 : 0.12;
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  right.setFromMatrixColumn(camera.matrix, 0);
  up.setFromMatrixColumn(camera.matrix, 1);
  const delta = new THREE.Vector3();
  if (keys.has("a") || keys.has("arrowleft")) delta.addScaledVector(right, -panSpeed);
  if (keys.has("d") || keys.has("arrowright")) delta.addScaledVector(right, panSpeed);
  if (keys.has("w") || keys.has("arrowup")) delta.addScaledVector(up, panSpeed);
  if (keys.has("s") || keys.has("arrowdown")) delta.addScaledVector(up, -panSpeed);
  // R / F — dolly toward / away from orbit target (same axis as wheel, scale with distance)
  if (keys.has("r") || keys.has("f")) {
    const offset = camera.position.clone().sub(controls.target);
    const dist = Math.max(offset.length(), 0.35);
    const dir = offset.multiplyScalar(1 / dist);
    const step = (keys.has("r") ? -1 : 1) * panSpeed * Math.max(dist, 1.2) * 0.085;
    let newDist = dist + step;
    newDist = Math.min(controls.maxDistance, Math.max(controls.minDistance, newDist));
    camera.position.copy(controls.target).addScaledVector(dir, newDist);
  }
  if (delta.lengthSq() > 0) {
    camera.position.add(delta);
    controls.target.add(delta);
  }
}

function wireInput(ctx, viewport) {
  const el = ctx.renderer.domElement;
  el.addEventListener("contextmenu", (e) => e.preventDefault()); // right-drag = rotate

  // Wheel: exponential dolly toward target — wide min/max like R/F reach
  el.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const { camera, controls } = ctx;
      const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
      const dist = offset.length();
      if (dist < 1e-6) return;
      const zoomFactor = Math.exp(e.deltaY * 0.00135);
      let newDist = dist * zoomFactor;
      newDist = Math.min(controls.maxDistance, Math.max(controls.minDistance, newDist));
      offset.setLength(newDist);
      camera.position.copy(controls.target).add(offset);
    },
    { passive: false }
  );

  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (["q", "e", "w", "a", "s", "d", "r", "f", "c"].includes(k)) e.preventDefault();
    if (e.key === "Shift") ctx.keys.add("shift");
    else ctx.keys.add(k);
    if (e.key === "[" || e.key === "]") {
      e.preventDefault();
      const step = e.key === "]" ? 1 : -1;
      const n = N_LAYERS();
      const cur = state.focusLayer == null ? Math.round(n / 2) : state.focusLayer;
      focusSlice(ctx, Math.max(0, Math.min(n - 1, cur + step)));
    }
    if (k === "c") {
      e.preventDefault();
      goStandardView(ctx, true);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      clearFocus(ctx);
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "Shift") ctx.keys.delete("shift");
    else ctx.keys.delete(e.key.toLowerCase());
  });

  el.addEventListener("pointerdown", (e) => {
    ctx.pointerState.x = e.clientX;
    ctx.pointerState.y = e.clientY;
    ctx.pointerState.btn = e.button;
    ctx.pointerState.moved = false;
    if (e.button === 0 || e.button === 2) ctx.camAnim = null; // manual orbit/pan wins
    if (e.button === 1) e.preventDefault();
  });
  el.addEventListener("pointerup", (e) => {
    if (ctx.pointerState.btn === 1) {
      e.preventDefault();
      if (!ctx.pointerState.moved) goStandardView(ctx, true);
      return;
    }
    if (ctx.pointerState.btn !== 0) return;
    if (!ctx.pointerState.moved) pick(ctx, e);
  });
  el.addEventListener("dblclick", (e) => {
    setPointer(ctx, e);
    const companyHits = ctx.raycaster.intersectObjects(
      ctx.meshes.filter((m) => m.visible),
      true
    );
    if (!companyHits.length) clearFocusKeepPins(ctx);
  });
  el.addEventListener("pointermove", (e) => {
    const dx = e.clientX - ctx.pointerState.x;
    const dy = e.clientY - ctx.pointerState.y;
    if (dx * dx + dy * dy > 16) ctx.pointerState.moved = true;
    hover(ctx, e, viewport);
  });
  el.addEventListener("pointerleave", () => {
    state.hoverId = null;
    state.hoverLinkKey = null;
    ctx.hooks.onHover?.(null, null);
    queueVisibilityTargets(ctx);
  });
}

function setPointer(ctx, event) {
  const rect = ctx.renderer.domElement.getBoundingClientRect();
  ctx.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  ctx.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  ctx.raycaster.setFromCamera(ctx.pointer, ctx.camera);
  return rect;
}

/**
 * [C-PULL-ZONE] Square-minus-disk on the slice face, in user (s, x, y):
 * inside the 1×1 face, outside the outermost ring. Hits inside the ring
 * do not toggle focus.
 */
function isPullFrameHit(ctx, hit) {
  const g = hit.object.parent;
  if (!g) return false;
  const rootLocal = ctx.root.worldToLocal(hit.point.clone());
  const coord = localToCoord(rootLocal, N_LAYERS(), gapNow());
  const dx = coord.x - LAYOUT.faceCenter.x;
  const dy = coord.y - LAYOUT.faceCenter.y;
  const half = FACE_SPAN / 2;
  if (Math.abs(dx) > half + 1e-4 || Math.abs(dy) > half + 1e-4) return false;
  const R = LAYOUT.ringRadius;
  return dx * dx + dy * dy > R * R;
}

/** [C-PICK] company first; else revenue-link; else [C-FOCUS-ACT] in [C-PULL-ZONE]. */
function pick(ctx, event) {
  setPointer(ctx, event);
  const companyHits = ctx.raycaster.intersectObjects(
    ctx.meshes.filter((m) => m.visible),
    true
  );
  if (companyHits.length) {
    let id = companyHits[0].object.userData.companyId;
    if (id == null && companyHits[0].object.parent) {
      id = companyHits[0].object.parent.userData.companyId;
    }
    if (id != null) selectCompany(ctx, id);
    return;
  }
  const linkHits = ctx.raycaster.intersectObjects(
    (ctx.revenueLinkHits || []).filter((m) => m.visible),
    false
  );
  if (linkHits.length) {
    const key = linkHits[0].object.userData.linkKey;
    if (key) selectLink(ctx, key);
    return;
  }
  const planes = [];
  ctx.planeGroups.forEach((g) => {
    g.children.forEach((ch) => {
      if (ch.userData && ch.userData.isSlicePlane) planes.push(ch);
    });
  });
  const planeHits = ctx.raycaster.intersectObjects(planes, false);
  if (!planeHits.length) return;
  const hit = planeHits[0];
  if (!isPullFrameHit(ctx, hit)) return;
  const layerIndex = hit.object.userData.layerIndex;
  if (event.shiftKey) togglePinLayer(ctx, layerIndex);
  else focusSlice(ctx, layerIndex);
}

function hover(ctx, event, viewport) {
  const rect = setPointer(ctx, event);
  const hits = ctx.raycaster.intersectObjects(
    ctx.meshes.filter((m) => m.visible),
    true
  );
  let id = hits.length ? hits[0].object.userData.companyId : null;
  if (id == null && hits.length && hits[0].object.parent) {
    id = hits[0].object.parent.userData.companyId;
  }
  let linkKey = null;
  if (id == null) {
    const linkHits = ctx.raycaster.intersectObjects(
      (ctx.revenueLinkHits || []).filter((m) => m.visible),
      false
    );
    if (linkHits.length) linkKey = linkHits[0].object.userData.linkKey || null;
  }
  const linkChanged = linkKey !== state.hoverLinkKey;
  const idChanged = id !== state.hoverId;
  if (linkChanged || idChanged) {
    state.hoverLinkKey = linkKey;
    state.hoverId = id;
    queueVisibilityTargets(ctx);
  }
  if (id != null) {
    const local = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    ctx.hooks.onHover?.(companyById(id), local);
  } else if (idChanged || linkChanged) {
    ctx.hooks.onHover?.(null, null);
  }
}

function resize(ctx, viewport) {
  const w = viewport.clientWidth || 1;
  const h = viewport.clientHeight || 1;
  ctx.camera.aspect = w / h;
  ctx.camera.updateProjectionMatrix();
  ctx.renderer.setSize(w, h, false);
}
