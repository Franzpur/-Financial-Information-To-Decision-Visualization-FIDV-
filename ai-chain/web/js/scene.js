/**
 * AI Chain Cube — Three.js scene.
 * Concept targets: ../CONCEPTS.md  (tags [C-SLICE], [C-PULL], [C-STDVIEW], …)
 * User axes (x,y,s) ≠ raw Three XYZ — see [C-USER-AXES] / [C-MAP].
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { COLORS, state, passesFilter, companyById } from "./state.js";

const PLANE_SIZE = 4.2; // [C-AXIS-X]/[C-AXIS-Y] unit length (cube face edge)
const GAP = 0.55; // base [C-AXIS-S] unit (= one slice gap when not exploded)
/**
 * [C-PULL] One user-x unit = cube depth = PLANE_SIZE (Three.js).
 * Pull moves a slice fully from user-x [0,1] into [1,2].
 */
const PULL_OUT = PLANE_SIZE;
/** [C-RING] Outer concentric-ring radius in slice local YZ (= max company spread). */
const RING_SPREAD = PLANE_SIZE * 0.38;
/** Axis palette matched to concentric rings (cool steel / ice blue). */
const AXIS_S = 0xd4e8ff; // = ring r=10
const AXIS_Y = 0xb0cce8;
const AXIS_X = 0x8eb6d8; // = ring guides
const AXIS_S_CSS = "#d4e8ff";
const AXIS_Y_CSS = "#b0cce8";
const AXIS_X_CSS = "#8eb6d8";
const AXIS_TICK_MAJOR = 0xc0d8f0;
const AXIS_TICK_MINOR = 0x5a7088;
/**
 * [C-USER-AXES] s→Three+X; y→Three+Y; x→Three−Z (colors match rings).
 * [C-ORIGIN] (−slice,−y,−x) → Three (−halfStack, −half, +half).
 * Cube face: user-x∈[0,1], user-y∈[0,1].
 */
const USER_X_SIGN = -1; // [C-AXIS-X] Three.js Z *= USER_X_SIGN for +user-x
const N_LAYERS = () => state.layers.length;

export function createScene(viewport, hooks = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0d10);
  // Far fog so deep wheel-zoom still has atmosphere without eating the cube early
  scene.fog = new THREE.Fog(0x0b0d10, 55, 380);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 600);
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
  // Match R/F reach: allow near contact and very distant framing
  controls.minDistance = 0.35;
  controls.maxDistance = 320;
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
    financeSlice: null, // [C-FINSLICE]
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

function layerX(i) {
  const n = N_LAYERS();
  const width = (n - 1) * GAP;
  return -width / 2 + i * GAP;
}

function stackWidth() {
  return Math.max(GAP, (N_LAYERS() - 1) * GAP) + (state.exploded ? GAP * 2.2 : 0);
}

function gapNow() {
  return state.exploded ? GAP * 2.2 : GAP;
}

function layerXNow(i) {
  const n = N_LAYERS();
  const g = gapNow();
  const width = (n - 1) * g;
  return -width / 2 + i * g;
}

function pointRadius(c) {
  if (c.valueM != null) return Math.min(0.042, 0.022 + Math.sqrt(c.valueM) / 620);
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
    g.userData.baseX = 0;
    g.userData.baseZ = 0;

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE),
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
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE)),
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
    domainLabel.position.set(0.03, PLANE_SIZE / 2 - 0.28, -PLANE_SIZE / 2 + 1.05);
    domainLabel.userData.isDomainLabel = true;
    domainLabel.userData.baseOpacity = 1;
    g.add(domainLabel);

    for (let r = 1; r <= 10; r++) {
      const rr = RING_SPREAD * (r / 10);
      const pts = [];
      for (let k = 0; k <= 64; k++) {
        const a = (k / 64) * Math.PI * 2;
        pts.push(new THREE.Vector3(0.008, Math.sin(a) * rr, Math.cos(a) * rr));
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

  const w = stackWidth() + 0.5;
  const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(w, PLANE_SIZE + 0.45, PLANE_SIZE + 0.45));
  const box = new THREE.BoxHelper(boxMesh, 0x2a3545);
  box.material.transparent = true;
  box.material.opacity = 0.35;
  root.add(box);
  ctx.boxHelper = box;

  state.companies.forEach((c) => {
    const isUS = c.country === "US";
    const isSupply = c.valueM != null;
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
    const spread = RING_SPREAD;
    // [C-POINT] Sphere center coplanar with the YZ slice (local x = 0)
    mesh.position.set(0, c.y * spread, c.x * spread);
    ctx.planeGroups[c.layer].add(mesh);
    ctx.meshes.push(mesh);
    ctx.byId.set(c.id, mesh);

    if (isSupply) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r * 1.6, 0.005, 8, 20),
        new THREE.MeshBasicMaterial({
          color: COLORS.SUPPLY,
          depthWrite: false,
          transparent: true,
          opacity: 1,
        })
      );
      ring.rotation.y = Math.PI / 2;
      ring.position.copy(mesh.position);
      ring.renderOrder = 6;
      ring.userData.companyId = c.id;
      ctx.planeGroups[c.layer].add(ring);
      mesh.userData.ring = ring;
    }

    const label = makeSliceTextPlane(makeCompanyLabelTexture(shortName(c), isUS), 0.72, 0.14);
    label.position.set(0.02, mesh.position.y + r + 0.12, mesh.position.z);
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
  ctx.planeGroups.forEach((g, i) => {
    const pull = g.userData.pull ?? 0;
    g.userData.baseX = layerXNow(i);
    g.userData.baseZ = 0;
    // Pull along flipped user-x (Three.js −Z)
    g.position.set(g.userData.baseX, 0, g.userData.baseZ + USER_X_SIGN * pull);
    g.userData.targetPull = state.focusLayer === i ? PULL_OUT : 0;
  });
  if (ctx.boxHelper) {
    ctx.root.remove(ctx.boxHelper);
    const w = stackWidth() + 0.5;
    const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(w, PLANE_SIZE + 0.45, PLANE_SIZE + 0.45));
    const helper = new THREE.BoxHelper(boxMesh, 0x2a3545);
    helper.material.transparent = true;
    helper.material.opacity = 0.35;
    ctx.root.add(helper);
    ctx.boxHelper = helper;
  }
  rebuildAxes(ctx);
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
  const g = gapNow();
  const halfStack = ((n - 1) * g) / 2;
  // Opposite Z corner vs previous: origin at +Z face, user-+x points toward −Z
  const origin = new THREE.Vector3(-halfStack, -PLANE_SIZE / 2, PLANE_SIZE / 2);
  const axes = new THREE.Group();
  axes.position.copy(origin);

  const sliceUnit = g; // 1 s-unit = 1 slice gap
  const sliceLen = sliceUnit * 20; // s-axis length in gap-units
  // User unit on x/y = cube face = PLANE_SIZE; x drawn to ~2.25, y matches x
  const unit = PLANE_SIZE;
  const xLen = unit * 2.25;
  const yLen = xLen;
  const xDir = new THREE.Vector3(0, 0, USER_X_SIGN); // −Z

  axes.add(makeAxisLine(new THREE.Vector3(sliceLen, 0, 0), AXIS_S));
  axes.add(makeAxisLine(new THREE.Vector3(0, yLen, 0), AXIS_Y));
  axes.add(makeAxisLine(xDir.clone().multiplyScalar(xLen), AXIS_X));

  axes.add(makeAxisArrow(new THREE.Vector3(1, 0, 0), sliceLen, AXIS_S));
  axes.add(makeAxisArrow(new THREE.Vector3(0, 1, 0), yLen, AXIS_Y));
  axes.add(makeAxisArrow(xDir, xLen, AXIS_X));

  // Slice ticks every unit 0..20; emphasize existing layer indices 0..n-1
  for (let i = 0; i <= 20; i++) {
    const sx = i * sliceUnit;
    const isLayer = i < n;
    const tickH = isLayer ? 0.14 : 0.08;
    axes.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(sx, 0, 0),
          new THREE.Vector3(sx, tickH, 0),
        ]),
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
      num.position.set(sx, tickH + 0.18, 0);
      axes.add(num);
    }
  }

  // y ticks: 0 at origin, 1 at cube top (also on s/y plane)
  for (const yu of [0, 1]) {
    const yy = yu * unit;
    axes.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, yy, 0),
          new THREE.Vector3(0.14, yy, 0),
        ]),
        new THREE.LineBasicMaterial({ color: AXIS_Y, transparent: true, opacity: 0.9, depthWrite: false })
      )
    );
    const yl = makeSyPlaneLabel(String(yu), 0.2, 0.16, AXIS_Y_CSS);
    yl.position.set(0.32, yy, 0);
    axes.add(yl);
  }

  // x ticks: 0 (origin face), 1 (far face / cube), 2 (pulled-out far edge)
  for (const xu of [0, 1, 2]) {
    const xz = USER_X_SIGN * xu * unit;
    axes.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, xz),
          new THREE.Vector3(0, 0.14, xz),
        ]),
        new THREE.LineBasicMaterial({ color: AXIS_X, transparent: true, opacity: 0.9, depthWrite: false })
      )
    );
    // x-axis numerals sit in the x/y plane (Three.js YZ)
    const xl = makeXyPlaneLabel(String(xu), 0.2, 0.16, AXIS_X_CSS);
    xl.position.set(0, 0.32, xz);
    axes.add(xl);
  }

  const sliceLbl = makeSyPlaneLabel("s", 0.32, 0.26, AXIS_S_CSS);
  sliceLbl.position.set(sliceLen + 0.4, 0.22, 0);
  axes.add(sliceLbl);

  const yLbl = makeSyPlaneLabel("y", 0.28, 0.22, AXIS_Y_CSS);
  yLbl.position.set(0.08, yLen + 0.28, 0);
  axes.add(yLbl);

  const xLbl = makeXyPlaneLabel("x", 0.28, 0.22, AXIS_X_CSS);
  xLbl.position.set(0, 0.22, USER_X_SIGN * (xLen + 0.28));
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

/** [C-PULL][C-RETRACT] Ease slice along +x; camera untouched. */
function lerpPullOut(ctx) {
  ctx.planeGroups.forEach((g, i) => {
    const target = state.focusLayer === i ? PULL_OUT : 0;
    g.userData.targetPull = target;
    const cur = g.userData.pull ?? 0;
    const diff = target - cur;
    const k = 0.13 + Math.min(0.12, Math.abs(diff) / PULL_OUT * 0.12);
    const next = cur + diff * k;
    g.userData.pull = Math.abs(next - target) < 0.003 ? target : next;
    const baseX = g.userData.baseX ?? layerXNow(i);
    const baseZ = g.userData.baseZ ?? 0;
    g.position.set(baseX, 0, baseZ + USER_X_SIGN * g.userData.pull);
  });
}

function framingDistance() {
  return Math.max(7.2, Math.hypot(stackWidth(), PLANE_SIZE) * 1.15);
}


/** [C-MAP] User (x,y,s) → root-local Three.js. s-unit = slice gap; x/y-unit = PLANE_SIZE. */
function userOriginLocal() {
  const n = N_LAYERS();
  const g = gapNow();
  const halfStack = ((n - 1) * g) / 2;
  return new THREE.Vector3(-halfStack, -PLANE_SIZE / 2, PLANE_SIZE / 2);
}

function userToLocal(xu, yu, su) {
  const o = userOriginLocal();
  const sliceUnit = gapNow();
  const unit = PLANE_SIZE;
  return new THREE.Vector3(
    o.x + su * sliceUnit,
    o.y + yu * unit,
    o.z + USER_X_SIGN * xu * unit
  );
}

function userToWorld(ctx, xu, yu, su) {
  return ctx.root.localToWorld(userToLocal(xu, yu, su));
}

/**
 * [C-STDVIEW] Standard framing (user coords):
 * - focused s*: camera (1.5, 0.5, s*+10) → look (1.5, 0.5, s*) (−s, pulled face)
 * - no focus: camera (2.1, 2.1, 24) → user origin
 */
function standardPose(ctx) {
  if (state.focusLayer != null) {
    const sStar = state.focusLayer;
    // Face the pulled slice (x∈[1,2] → center x=1.5)
    return {
      pos: userToWorld(ctx, 1.5, 0.5, sStar + 10),
      target: userToWorld(ctx, 1.5, 0.5, sStar),
    };
  }
  return {
    pos: userToWorld(ctx, 2.1, 2.1, 24),
    target: userToWorld(ctx, 0, 0, 0),
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
  if (a.kind === "finance") {
    const pose = financePose(ctx);
    if (!pose) {
      ctx.camAnim = null;
      return;
    }
    const toOffset = pose.pos.clone().sub(pose.target);
    const fromDir = a.fromOffset.clone().normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(fromDir, toOffset.clone().normalize());
    const swung = new THREE.Quaternion().slerpQuaternions(new THREE.Quaternion(), q, e);
    const dir = fromDir.applyQuaternion(swung);
    const len = THREE.MathUtils.lerp(a.fromOffset.length(), Math.max(toOffset.length(), 0.35), e);
    const target = a.fromTarget.clone().lerp(pose.target, e);
    ctx.controls.target.copy(target);
    ctx.camera.position.copy(target).addScaledVector(dir, len);
  } else {
    ctx.camera.position.lerpVectors(a.fromPos, a.toPos, e);
    ctx.controls.target.lerpVectors(a.fromTarget, a.toTarget, e);
  }
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
  hideFinanceSlice(ctx);
  state.focusLayer = null;
  state.selectedId = null;
  state.hoverId = null;
  ctx.planeGroups.forEach((g) => {
    g.userData.targetPull = 0;
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
    hideFinanceSlice(ctx);
    state.focusLayer = null;
    state.selectedId = null;
    state.hoverId = null;
    queueVisibilityTargets(ctx);
    ctx.hooks.onClear?.();
    return;
  }
  hideFinanceSlice(ctx);
  state.focusLayer = i;
  state.selectedId = null;
  queueVisibilityTargets(ctx);
  // Keep current camera — no recenter toward cube interior
  ctx.hooks.onFocusChange?.();
}

/** [C-ESC] Clear select first, then focus; camera unchanged. */
function clearFocus(ctx) {
  if (state.selectedId != null) {
    hideFinanceSlice(ctx);
    state.selectedId = null;
    queueVisibilityTargets(ctx);
    if (state.focusLayer != null) ctx.hooks.onFocusChange?.();
    else ctx.hooks.onClear?.();
    return;
  }
  if (state.focusLayer != null) {
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
  if (isGooglPoint(c) && state.googlBond) {
    showFinanceSlice(ctx, c);
    queueVisibilityTargets(ctx);
    startFinanceYaw(ctx);
  } else {
    hideFinanceSlice(ctx);
    const mesh = ctx.byId.get(id);
    if (mesh) {
      const world = new THREE.Vector3();
      mesh.getWorldPosition(world);
      const toTarget = new THREE.Vector3(world.x, world.y * 0.35, 0);
      startCamAnim(ctx, ctx.camera.position.clone(), toTarget, 420);
    }
    queueVisibilityTargets(ctx);
  }
  ctx.hooks.onSelect?.(c);
}

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

function startFinanceYaw(ctx) {
  const pose = financePose(ctx);
  if (!pose) return;
  const fromTarget = ctx.controls.target.clone();
  const fromOffset = ctx.camera.position.clone().sub(fromTarget);
  if (fromOffset.lengthSq() < 1e-8) fromOffset.set(0, 0.2, 1);
  ctx.camAnim = {
    kind: "finance",
    fromTarget,
    fromOffset,
    t0: performance.now(),
    dur: 820,
  };
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
    0x8be0c0,
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
    if (hC > 0.006) addStack(plot, x0, baseY, barW, hC, COLORS.US, z);
    if (hP > 0.006) addStack(plot, x0, baseY + hC + gap, barW, hP, COLORS.INTL, z);
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
    0x8be0c0,
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

function queueVisibilityTargets(ctx) {
  state.companies.forEach((c) => {
    const mesh = ctx.byId.get(c.id);
    if (!mesh) return;
    const show = passesFilter(c);
    const onFocus = state.focusLayer == null || c.layer === state.focusLayer;
    mesh.visible = show;
    if (mesh.userData.ring) mesh.userData.ring.visible = show;
    if (mesh.userData.label) {
      mesh.userData.label.visible = show && state.focusLayer != null && c.layer === state.focusLayer;
    }
    const selected = c.id === state.selectedId;
    const hovered = c.id === state.hoverId;
    // Off-focus: crush emissive + opacity (must use transparent materials or glow stays lit)
    const targetEmissive = selected ? 2.2 : hovered ? 1.9 : onFocus ? (c.country === "US" ? 1.35 : 1.25) : 0.06;
    const targetOpacity = onFocus ? 1 : 0.1;
    const targetScale = selected ? 1.4 : hovered ? 1.25 : onFocus ? 1 : 0.55;
    mesh.userData.targetEmissive = targetEmissive;
    mesh.userData.targetOpacity = targetOpacity;
    mesh.userData.targetScale = targetScale;
    // Focused opaque for depth; dimmed must be transparent or opacity is ignored
    const mat = mesh.material;
    if (onFocus) {
      mat.transparent = false;
      mat.depthWrite = true;
      mat.opacity = Math.max(mat.opacity, 0.99);
    } else {
      mat.transparent = true;
      mat.depthWrite = false;
    }
    mesh.renderOrder = onFocus ? 8 : 4;
    if (mesh.userData.ring) {
      mesh.userData.ring.renderOrder = onFocus ? 9 : 4;
      mesh.userData.ring.material.transparent = true;
      mesh.userData.ring.material.opacity = onFocus ? 1 : 0.12;
    }
    if (mesh.userData.label) mesh.userData.label.renderOrder = onFocus ? 10 : 4;
  });

  ctx.planeGroups.forEach((g, i) => {
    const dim = state.focusLayer != null && i !== state.focusLayer;
    // Focused slice draws after dimmed neighbors so its points stay visible
    g.renderOrder = dim ? 0 : 2;
    g.userData.targetPull = state.focusLayer === i ? PULL_OUT : 0;
    const focused = state.focusLayer === i;
    g.children.forEach((ch) => {
      if (!ch.material || ch.material.opacity == null) return;
      const base = ch.userData.baseOpacity ?? 1;
      if (ch.userData.isSlicePlane) {
        ch.userData.targetOpacity = dim ? 0.04 : focused ? 0.38 : base;
      } else if (ch.userData.isRingGuide) {
        ch.userData.targetOpacity = dim ? base * 0.08 : base;
      } else if (ch.userData.isSliceEdge || (ch.isLineSegments && !ch.userData.isRingGuide)) {
        ch.userData.targetOpacity = dim ? 0.1 : focused ? 1 : base;
        if (ch.material.color) ch.material.color.setHex(focused ? 0x8be0c0 : COLORS.EDGE);
      } else if (ch.userData.isDomainLabel) {
        ch.userData.targetOpacity = dim ? 0.15 : 1;
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
      // Opacity only affects drawing when transparent === true
      const dimming = mesh.userData.targetOpacity < 0.99;
      if (dimming) {
        mat.transparent = true;
        mat.depthWrite = false;
      }
      mat.opacity += (mesh.userData.targetOpacity - mat.opacity) * k;
      if (!dimming && mat.opacity > 0.98) {
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
 * [C-PULL-ZONE] Square-minus-circle on the slice face (user 1×1):
 * inside |y|,|x_face| ≤ face/2, outside outermost ring (RING_SPREAD).
 * Hits inside the ring field do not toggle focus — avoids miss-click retract.
 */
function isPullFrameHit(hit) {
  const plane = hit.object;
  const g = plane.parent;
  if (!g) return false;
  const local = g.worldToLocal(hit.point.clone());
  const fy = local.y;
  const fz = local.z; // face axes on YZ wall
  const half = PLANE_SIZE / 2;
  if (Math.abs(fy) > half + 1e-4 || Math.abs(fz) > half + 1e-4) return false;
  const r2 = fy * fy + fz * fz;
  const R = RING_SPREAD;
  return r2 > R * R;
}

/** [C-PICK] finance toggle, then company, else [C-FOCUS-ACT] only in [C-PULL-ZONE]. */
function pick(ctx, event) {
  setPointer(ctx, event);
  if (ctx.financeSlice) {
    const toggles = [];
    ctx.financeSlice.traverse((o) => {
      if (o.userData && o.userData.isFinanceToggle) toggles.push(o);
    });
    if (toggles.length && ctx.raycaster.intersectObjects(toggles, false).length) {
      toggleFinanceScale(ctx);
      return;
    }
  }
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
  if (!isPullFrameHit(hit)) return;
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
