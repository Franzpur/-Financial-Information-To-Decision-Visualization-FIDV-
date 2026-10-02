/**
 * AI Chain Cube — Three.js scene.
 * Concept targets: ../CONCEPTS.md  (tags [C-SLICE], [C-PULL], [C-STDVIEW], …)
 * Layout lives in user (s, x, y). See coords.js [C-COORD] / [C-MAP].
 * Three.js positions are produced only by applyCoord / applySliceCoord.
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { COLORS, state, passesFilter, companyById } from "./state.js";
import {
  FACE,
  FACE_SPAN,
  UNIT,
  USER_X_SIGN,
  LAYOUT,
  gapMeters,
  gapSafe,
  cubeExitX,
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
} from "./coords.js";

/** Axis palette matched to concentric rings (cool steel / ice blue). */
const AXIS_S = 0xd4e8ff; // = ring r=10
const AXIS_Y = 0xb0cce8;
const AXIS_X = 0x8eb6d8; // = ring guides
const AXIS_S_CSS = "#d4e8ff";
const AXIS_Y_CSS = "#b0cce8";
const AXIS_X_CSS = "#8eb6d8";
const AXIS_TICK_MAJOR = 0xc0d8f0;
const AXIS_TICK_MINOR = 0x5a7088;
const N_LAYERS = () => state.layers.length;
export function createScene(viewport, hooks = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0d10);
  // [C-VIEW-SPACE] Fog / far clip track pull-back radius (R·UNIT), never d
  const viewM = viewSpaceMeters();
  scene.fog = new THREE.Fog(0x0b0d10, viewM * 0.45, viewM * 2.0);

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
    boxHelper: null,
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
    renderer.render(scene, camera);
  }
  tick();

  return {
    ctx,
    applyVisibility: () => queueVisibilityTargets(ctx),
    layoutPlanes: () => layoutPlanes(ctx),
    resetCamera: () => resetCamera(ctx),
    goStandardView: () => goStandardView(ctx, true),
    focusSlice: (i) => focusSlice(ctx, i),
    clearFocus: () => clearFocus(ctx),
    selectCompany: (id) => selectCompany(ctx, id),
    framingDistance: () => framingDistance(),
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

function buildCube(ctx) {
  const { root } = ctx;
  while (root.children.length) root.remove(root.children[0]);
  ctx.planeGroups = [];
  ctx.meshes = [];
  ctx.byId.clear();
  ctx.boxHelper = null;

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
        depthWrite: false, // do not occlude company points behind/through the glass
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
      const ringLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({
          color: r === 10 ? 0xd4e8ff : 0x8eb6d8,
          transparent: true,
          opacity: r === 10 ? 0.85 : 0.42 + r * 0.028,
          depthWrite: false,
        })
      );
      ringLine.renderOrder = 1;
      ringLine.userData.isRingGuide = true;
      ringLine.userData.baseOpacity = r === 10 ? 0.85 : 0.42 + r * 0.028;
      g.add(ringLine);
    }

    ctx.planeGroups.push(g);
    root.add(g);
  });

  state.companies.forEach((c) => {
    const isUS = c.country === "US";
    const color = isUS ? COLORS.US : COLORS.INTL;
    const r = pointRadius(c);
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(r, 16, 12),
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.22,
        metalness: 0.05,
        emissive: color,
        emissiveIntensity: isUS ? 1.35 : 1.4,
        // Opaque by default so points win depth tests against glass slices
        transparent: false,
        depthWrite: true,
        opacity: 1,
      })
    );
    mesh.userData.companyId = c.id;
    mesh.renderOrder = 5;
    // [C-POINT] Layout coordinate on the unpulled face, from ringCos/ringSin.
    const coord = companyCoord(c.layer, c.ringCos, c.ringSin);
    c.coord = coord;
    applySliceCoord(mesh, c.layer, coord);
    ctx.planeGroups[c.layer].add(mesh);
    ctx.meshes.push(mesh);
    ctx.byId.set(c.id, mesh);

    const label = makeSliceTextPlane(makeCompanyLabelTexture(shortName(c), isUS), 0.72, 0.14);
    applySliceCoord(label, c.layer, companyLabelCoord(coord, r, gapNow()));
    label.visible = false;
    label.renderOrder = 7;
    label.userData.isCompanyLabel = true;
    label.userData.baseOpacity = 1;
    ctx.planeGroups[c.layer].add(label);
    mesh.userData.label = label;
  });

  layoutPlanes(ctx);
  queueVisibilityTargets(ctx);
}

function layoutPlanes(ctx) {
  const exit = ctx.cubeExit ?? 0;
  const stay =
    state.focusLayer != null ? state.focusLayer : ctx.exitStayLayer;
  ctx.planeGroups.forEach((g, i) => {
    g.userData.pull = 0;
    g.userData.exitX = stay != null && i !== stay ? exit : 0;
    placeSliceGroup(g, i);
  });
  syncFrame(ctx);
  rebuildAxes(ctx);
}

/** [C-COORD] Wire cube around user (s, x, y) from the padded unit cube. */
function syncFrame(ctx) {
  if (ctx.boxHelper) {
    ctx.root.remove(ctx.boxHelper);
    ctx.boxHelper.geometry?.dispose?.();
    ctx.boxHelper.material?.dispose?.();
    ctx.boxHelper = null;
  }
  const n = N_LAYERS();
  const gap = gapNow();
  const padS = LAYOUT.framePad.sMeters / gapDivNow();
  const padF = LAYOUT.framePad.faceMeters / UNIT;
  const min = coordToLocal({ s: -padS, x: -padF, y: -padF }, n, gap);
  const max = coordToLocal(
    { s: n - 1 + padS, x: FACE_SPAN + padF, y: FACE_SPAN + padF },
    n,
    gap
  );
  const box = new THREE.Box3().setFromPoints([v3(min), v3(max)]);
  const helper = new THREE.Box3Helper(box, 0x2a3545);
  helper.material.transparent = true;
  helper.material.depthWrite = false;
  helper.material.opacity = state.focusLayer == null ? 0.35 : 0;
  helper.position.copy(v3(localOffset(0, -(ctx.cubeExit ?? 0), 0, gap)));
  ctx.root.add(helper);
  ctx.boxHelper = helper;
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

  axes.add(makeAxisLine(at(chrome.sEnd, 0, 0), AXIS_S));
  axes.add(makeAxisLine(at(0, 0, chrome.yEnd), AXIS_Y));
  axes.add(makeAxisLine(at(0, chrome.xEnd, 0), AXIS_X));

  axes.add(makeAxisArrow(sDir, chrome.sEnd * gap, AXIS_S));
  axes.add(makeAxisArrow(yDir, chrome.yEnd * UNIT, AXIS_Y));
  axes.add(makeAxisArrow(xDir, chrome.xEnd * UNIT, AXIS_X));

  // Slice ticks every unit 0..sEnd; emphasize existing layer indices 0..n-1
  for (let i = 0; i <= chrome.sEnd; i++) {
    const isLayer = i < n;
    const tickH = isLayer ? chrome.tickLayerY : chrome.tickMinorY;
    axes.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([at(i, 0, 0), at(i, 0, tickH)]),
        new THREE.LineBasicMaterial({
          color: isLayer ? AXIS_TICK_MAJOR : AXIS_TICK_MINOR,
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
        isLayer ? AXIS_S_CSS : "#7a90a8"
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
        new THREE.LineBasicMaterial({ color: AXIS_Y, transparent: true, opacity: 0.9, depthWrite: false })
      )
    );
    const yl = makeSyPlaneLabel(String(yu), 0.2, 0.16, AXIS_Y_CSS);
    yl.position.copy(at(chrome.yNumeralS, 0, yu));
    axes.add(yl);
  }

  // x ticks: 0 (origin face), FACE_SPAN (far face), 2*FACE_SPAN (axis mark)
  for (const xu of [0, FACE_SPAN, FACE_SPAN * 2]) {
    axes.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([at(0, xu, 0), at(0, xu, chrome.xTickY)]),
        new THREE.LineBasicMaterial({ color: AXIS_X, transparent: true, opacity: 0.9, depthWrite: false })
      )
    );
    // x-axis numerals sit in the x/y plane (Three.js YZ)
    const xl = makeXyPlaneLabel(String(xu), 0.2, 0.16, AXIS_X_CSS);
    xl.position.copy(at(0, xu, chrome.xNumeralY));
    axes.add(xl);
  }

  const sliceLbl = makeSyPlaneLabel("s", 0.32, 0.26, AXIS_S_CSS);
  sliceLbl.position.copy(at(chrome.sLabel.s, chrome.sLabel.x, chrome.sLabel.y));
  axes.add(sliceLbl);

  const yLbl = makeSyPlaneLabel("y", 0.28, 0.22, AXIS_Y_CSS);
  yLbl.position.copy(at(chrome.yLabel.s, chrome.yLabel.x, chrome.yLabel.y));
  axes.add(yLbl);

  const xLbl = makeXyPlaneLabel("x", 0.28, 0.22, AXIS_X_CSS);
  xLbl.position.copy(at(chrome.xLabel.s, chrome.xLabel.x, chrome.xLabel.y));
  axes.add(xLbl);

  const originDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  axes.add(originDot);

  ctx.axesGroup = axes;
  ctx.root.add(axes);
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

/** [C-PULL][C-RETRACT] Focused slice stays. Exit eases along −x out and +x back; frame follows. */
function lerpPullOut(ctx) {
  if (state.focusLayer != null) ctx.exitStayLayer = state.focusLayer;
  const stay =
    state.focusLayer != null ? state.focusLayer : ctx.exitStayLayer;
  const target = state.focusLayer == null ? 0 : cubeExitX();
  const cur = ctx.cubeExit ?? 0;
  const diff = target - cur;
  const k = 0.13 + Math.min(0.12, Math.abs(diff) * 0.12);
  const next = cur + diff * k;
  ctx.cubeExit = Math.abs(next - target) < 0.001 ? target : next;
  ctx.planeGroups.forEach((g, i) => {
    g.userData.pull = 0;
    g.userData.exitX = stay != null && i !== stay ? ctx.cubeExit : 0;
    placeSliceGroup(g, i);
  });
  if (state.focusLayer == null && ctx.cubeExit < 0.001) {
    ctx.cubeExit = 0;
    ctx.exitStayLayer = null;
  }
  placeFrame(ctx);
}

function placeFrame(ctx) {
  const frame = ctx.boxHelper;
  if (!frame?.material) return;
  frame.position.copy(v3(localOffset(0, -(ctx.cubeExit ?? 0), 0, gapNow())));
  const target = state.focusLayer == null ? 0.35 : 0;
  const mat = frame.material;
  mat.transparent = true;
  mat.opacity += (target - mat.opacity) * 0.18;
  if (Math.abs(mat.opacity - target) < 0.01) mat.opacity = target;
}

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


/** [C-STDVIEW] Snap to standardPose for current focus state. */
function goStandardView(ctx, animate = true) {
  const { pos, target } = standardPose(ctx);
  ctx.camAnim = null;
  if (animate) startCamAnim(ctx, pos, target, 520);
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

/** [C-FOCUS-ACT][C-PULL][C-RETRACT][C-CAM-HOLD] Toggle/set focus; pull via visibility; do not move camera. */
function focusSlice(ctx, i) {
  const n = N_LAYERS();
  if (i == null || i < 0 || i >= n) return;
  if (state.focusLayer === i) {
    ctx.exitStayLayer = state.focusLayer;
    state.focusLayer = null;
    state.selectedId = null;
    state.hoverId = null;
    queueVisibilityTargets(ctx);
    ctx.hooks.onClear?.();
    return;
  }
  state.focusLayer = i;
  ctx.exitStayLayer = i;
  state.selectedId = null;
  queueVisibilityTargets(ctx);
  // Keep current camera — no recenter toward cube interior
  ctx.hooks.onFocusChange?.();
}

/** [C-ESC] Clear select first, then focus; camera unchanged. */
function clearFocus(ctx) {
  if (state.selectedId != null) {
    state.selectedId = null;
    queueVisibilityTargets(ctx);
    if (state.focusLayer != null) ctx.hooks.onFocusChange?.();
    else ctx.hooks.onClear?.();
    return;
  }
  if (state.focusLayer != null) {
    ctx.exitStayLayer = state.focusLayer;
    state.focusLayer = null;
    state.hoverId = null;
    queueVisibilityTargets(ctx);
    ctx.hooks.onClear?.();
    return;
  }
  ctx.hooks.onClear?.();
}

function selectCompany(ctx, id) {
  const c = companyById(id);
  if (!c) return;
  state.selectedId = id;
  state.focusLayer = c.layer;
  ctx.exitStayLayer = c.layer;
  const mesh = ctx.byId.get(id);
  if (mesh?.userData.coord) {
    const base = mesh.userData.coord;
    const world = userToWorld(ctx, { s: base.s, x: base.x, y: base.y });
    const toTarget = new THREE.Vector3(world.x, world.y * 0.35, 0);
    startCamAnim(ctx, ctx.camera.position.clone(), toTarget, 420);
  }
  queueVisibilityTargets(ctx);
  ctx.hooks.onSelect?.(c);
}

function queueVisibilityTargets(ctx) {
  state.companies.forEach((c) => {
    const mesh = ctx.byId.get(c.id);
    if (!mesh) return;
    const show = passesFilter(c);
    const onFocus = state.focusLayer == null || c.layer === state.focusLayer;
    mesh.visible = show;
    if (mesh.userData.label) {
      mesh.userData.label.visible = show && state.focusLayer != null && c.layer === state.focusLayer;
    }
    const selected = c.id === state.selectedId;
    const hovered = c.id === state.hoverId;
    // Off-focus: crush emissive + opacity (must use transparent materials or glow stays lit)
    const targetEmissive = selected ? 2.2 : hovered ? 1.9 : onFocus ? (c.country === "US" ? 1.35 : 1.25) : 0.06;
    const targetOpacity = onFocus ? 1 : 0;
    const targetScale = selected ? 1.4 : hovered ? 1.25 : onFocus ? 1 : 0.55;
    mesh.userData.targetEmissive = targetEmissive;
    mesh.userData.targetOpacity = targetOpacity;
    mesh.userData.targetScale = targetScale;
    // Opacity always lerps; transparent while fading so fade-in matches fade-out.
    const mat = mesh.material;
    mat.transparent = true;
    mat.depthWrite = false;
    mesh.renderOrder = onFocus ? 8 : 4;
    if (mesh.userData.label) mesh.userData.label.renderOrder = onFocus ? 10 : 4;
  });

  ctx.planeGroups.forEach((g, i) => {
    const dim = state.focusLayer != null && i !== state.focusLayer;
    // Focused slice draws after dimmed neighbors so its points stay visible
    g.renderOrder = dim ? 0 : 2;
    g.userData.pull = 0;
    const focused = state.focusLayer === i;
    g.children.forEach((ch) => {
      if (!ch.material || ch.material.opacity == null) return;
      const base = ch.userData.baseOpacity ?? 1;
      if (ch.userData.isSlicePlane) {
        ch.userData.targetOpacity = dim ? 0 : focused ? 0.38 : base;
      } else if (ch.userData.isRingGuide) {
        ch.userData.targetOpacity = dim ? 0 : base;
      } else if (ch.userData.isSliceEdge || (ch.isLineSegments && !ch.userData.isRingGuide)) {
        ch.userData.targetOpacity = dim ? 0 : base;
        if (ch.material.color) ch.material.color.setHex(COLORS.EDGE);
      } else if (ch.userData.isDomainLabel) {
        ch.userData.targetOpacity = dim ? 0 : 1;
      }
    });
  });
}

function lerpVisibility(ctx) {
  const k = 0.18;
  ctx.meshes.forEach((mesh) => {
    if (!mesh.visible) return;
    const mat = mesh.material;
    if (mesh.userData.targetEmissive != null) {
      mat.emissiveIntensity += (mesh.userData.targetEmissive - mat.emissiveIntensity) * k;
    }
    if (mesh.userData.targetOpacity != null) {
      mat.transparent = true;
      mat.depthWrite = false;
      mat.opacity += (mesh.userData.targetOpacity - mat.opacity) * k;
      if (mesh.userData.targetOpacity >= 0.99 && mat.opacity > 0.98) {
        mat.opacity = 1;
        mat.transparent = false;
        mat.depthWrite = true;
      }
    }
    if (mesh.userData.targetScale != null) {
      const s = mesh.scale.x + (mesh.userData.targetScale - mesh.scale.x) * k;
      mesh.scale.setScalar(s);
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
    const companyHits = ctx.raycaster.intersectObjects(ctx.meshes.filter((m) => m.visible), false);
    if (!companyHits.length) clearFocus(ctx);
  });
  el.addEventListener("pointermove", (e) => {
    const dx = e.clientX - ctx.pointerState.x;
    const dy = e.clientY - ctx.pointerState.y;
    if (dx * dx + dy * dy > 16) ctx.pointerState.moved = true;
    hover(ctx, e, viewport);
  });
  el.addEventListener("pointerleave", () => {
    state.hoverId = null;
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

/** [C-PICK] company first; else [C-FOCUS-ACT] only in [C-PULL-ZONE]. */
function pick(ctx, event) {
  setPointer(ctx, event);
  const companyHits = ctx.raycaster.intersectObjects(
    ctx.meshes.filter((m) => m.visible),
    false
  );
  if (companyHits.length) {
    selectCompany(ctx, companyHits[0].object.userData.companyId);
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
  focusSlice(ctx, hit.object.userData.layerIndex);
}

function hover(ctx, event, viewport) {
  const rect = setPointer(ctx, event);
  const hits = ctx.raycaster.intersectObjects(
    ctx.meshes.filter((m) => m.visible),
    false
  );
  const id = hits.length ? hits[0].object.userData.companyId : null;
  if (id !== state.hoverId) {
    state.hoverId = id;
    queueVisibilityTargets(ctx);
    const c = id != null ? companyById(id) : null;
    const local = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    ctx.hooks.onHover?.(c, local);
  } else if (id != null) {
    ctx.hooks.onHover?.(companyById(id), {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }
}

function resize(ctx, viewport) {
  const w = viewport.clientWidth || 1;
  const h = viewport.clientHeight || 1;
  ctx.camera.aspect = w / h;
  ctx.camera.updateProjectionMatrix();
  ctx.renderer.setSize(w, h, false);
}
