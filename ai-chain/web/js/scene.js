import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { COLORS, state, passesFilter, companyById } from "./state.js";

const PLANE_SIZE = 4.2;
const GAP = 0.55;
/** How far a focused slice slides along user-+x (flat pull). */
const PULL_OUT = PLANE_SIZE * 0.7;
/**
 * User axes: orange=slice (Three +X), green=y (Three +Y), blue=x (Three −Z).
 * Origin sits on the −slice, −y, −x corner → Three (−halfStack, −half, +half).
 */
const USER_X_SIGN = -1; // Three.js Z *= USER_X_SIGN for +user-x
const N_LAYERS = () => state.layers.length;

export function createScene(viewport, hooks = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0d10);
  // Soft distant fog only — old near=12 made points vanish when zooming out
  scene.fog = new THREE.Fog(0x0b0d10, 40, 90);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  camera.position.set(8.2, 4.8, 8.2);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  viewport.insertBefore(renderer.domElement, viewport.firstChild);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.rotateSpeed = 0.9;
  controls.panSpeed = 1.35;
  controls.zoomSpeed = 1.15;
  controls.minDistance = 2.8;
  controls.maxDistance = 48;
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN,
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
    pointerState: { x: 0, y: 0, btn: -1 },
    dimTargets: new Map(),
    hooks,
  };

  buildCube(ctx);
  goCornerView(ctx, false);
  wireInput(ctx, viewport);
  resize(ctx, viewport);
  window.addEventListener("resize", () => resize(ctx, viewport));

  function tick() {
    requestAnimationFrame(tick);
    applyKeyboard(ctx);
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
    goCornerView: () => goCornerView(ctx, true),
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
    edges.userData.baseOpacity = 0.65;
    g.add(edges);

    const domainLabel = makeSliceTextPlane(makeDomainLabelTexture(L.name), 1.9, 0.38);
    domainLabel.position.set(0.03, PLANE_SIZE / 2 - 0.28, -PLANE_SIZE / 2 + 1.05);
    domainLabel.userData.isDomainLabel = true;
    domainLabel.userData.baseOpacity = 1;
    g.add(domainLabel);

    for (let r = 1; r <= 10; r++) {
      const rr = (PLANE_SIZE * 0.38) * (r / 10);
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
    const spread = PLANE_SIZE * 0.38;
    // Sit clearly in front of the YZ wall so neighboring slices can't cover the point
    mesh.position.set(0.055 + r, c.y * spread, c.x * spread);
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
    label.position.set(0.07, mesh.position.y + r + 0.12, mesh.position.z);
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
 * Origin at cube bottom-left on the flipped-x side.
 * Orange = slice. Green = y. Blue = x (Three.js −Z from this origin).
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

  const sliceLen = Math.max(g, (n - 1) * g);
  const refLen = PLANE_SIZE;
  const xDir = new THREE.Vector3(0, 0, USER_X_SIGN); // −Z

  axes.add(makeAxisLine(new THREE.Vector3(sliceLen, 0, 0), 0xff6b4a));
  axes.add(makeAxisLine(new THREE.Vector3(0, refLen, 0), 0x6bcf8e));
  axes.add(makeAxisLine(xDir.clone().multiplyScalar(refLen), 0x6aa8ff));

  axes.add(makeAxisArrow(new THREE.Vector3(1, 0, 0), sliceLen, 0xff6b4a));
  axes.add(makeAxisArrow(new THREE.Vector3(0, 1, 0), refLen, 0x6bcf8e));
  axes.add(makeAxisArrow(xDir, refLen, 0x6aa8ff));

  for (let i = 0; i < n; i++) {
    const sx = i * g;
    const tick = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(sx, 0, 0),
        new THREE.Vector3(sx, 0.12, 0),
      ]),
      new THREE.LineBasicMaterial({ color: 0xffb090, transparent: true, opacity: 0.85, depthWrite: false })
    );
    axes.add(tick);
    const num = makeAxisText(String(i), 0.22, 0.18, "#ffc8b0");
    num.position.set(sx, 0.28, 0.02 * USER_X_SIGN);
    axes.add(num);
  }

  const sliceLbl = makeAxisText("slice", 0.55, 0.2, "#ff9a7a");
  sliceLbl.position.set(sliceLen + 0.35, 0.15, 0.02 * USER_X_SIGN);
  axes.add(sliceLbl);

  const yLbl = makeAxisText("y", 0.28, 0.22, "#8eefb0");
  yLbl.position.set(0.05, refLen + 0.28, 0.02 * USER_X_SIGN);
  axes.add(yLbl);

  const xLbl = makeAxisText("x", 0.28, 0.22, "#9ec0ff");
  xLbl.position.set(0.05, 0.15, USER_X_SIGN * (refLen + 0.28));
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

function lerpPullOut(ctx) {
  const k = 0.14;
  ctx.planeGroups.forEach((g, i) => {
    const target = state.focusLayer === i ? PULL_OUT : 0;
    g.userData.targetPull = target;
    const cur = g.userData.pull ?? 0;
    const next = cur + (target - cur) * k;
    g.userData.pull = Math.abs(next - target) < 0.002 ? target : next;
    const baseX = g.userData.baseX ?? layerXNow(i);
    const baseZ = g.userData.baseZ ?? 0;
    // Flat pull along flipped user-+x (Three.js Z * USER_X_SIGN)
    g.position.set(baseX, 0, baseZ + USER_X_SIGN * g.userData.pull);
  });
}

function framingDistance() {
  return Math.max(7.2, Math.hypot(stackWidth(), PLANE_SIZE) * 1.15);
}

/** Upper-right three-face view, mirrored to the flipped-x side. */
function goCornerView(ctx, animate) {
  const d = framingDistance();
  const target = new THREE.Vector3(0, 0, 0);
  // Mirrored to flipped-x side: camera sits along −user-x / outside the origin face
  const pos = new THREE.Vector3(d * 1.02, d * 0.68, USER_X_SIGN * d * 0.78);
  ctx.controls.target.copy(target);
  if (animate) {
    ctx.camera.position.lerp(pos, 1);
  }
  ctx.camera.position.copy(pos);
  ctx.controls.update();
}

function resetCamera(ctx) {
  state.focusLayer = null;
  state.selectedId = null;
  ctx.planeGroups.forEach((g) => {
    g.userData.targetPull = 0;
  });
  goCornerView(ctx, false);
  queueVisibilityTargets(ctx);
  ctx.hooks.onReset?.();
}

function selectCompany(ctx, id) {
  const c = companyById(id);
  if (!c) return;
  state.selectedId = id;
  state.focusLayer = c.layer;
  const mesh = ctx.byId.get(id);
  if (mesh) {
    const world = new THREE.Vector3();
    mesh.getWorldPosition(world);
    ctx.controls.target.lerp(new THREE.Vector3(world.x, 0, 0), 0.35);
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
    g.children.forEach((ch) => {
      if (!ch.material || ch.material.opacity == null) return;
      const base = ch.userData.baseOpacity ?? 1;
      if (ch.userData.isSlicePlane) ch.userData.targetOpacity = dim ? 0.05 : base;
      else if (ch.userData.isRingGuide) ch.userData.targetOpacity = dim ? base * 0.08 : base;
      else if (ch.isLineSegments && !ch.userData.isRingGuide) ch.userData.targetOpacity = dim ? 0.12 : base;
      else if (ch.userData.isDomainLabel) ch.userData.targetOpacity = dim ? 0.15 : base;
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
  const forward = new THREE.Vector3();
  right.setFromMatrixColumn(camera.matrix, 0);
  up.setFromMatrixColumn(camera.matrix, 1);
  forward.setFromMatrixColumn(camera.matrix, 2);
  const delta = new THREE.Vector3();
  if (keys.has("a") || keys.has("arrowleft")) delta.addScaledVector(right, -panSpeed);
  if (keys.has("d") || keys.has("arrowright")) delta.addScaledVector(right, panSpeed);
  if (keys.has("w") || keys.has("arrowup")) delta.addScaledVector(up, panSpeed);
  if (keys.has("s") || keys.has("arrowdown")) delta.addScaledVector(up, -panSpeed);
  // R / F — dolly along view (toward / away from target)
  if (keys.has("r")) delta.addScaledVector(forward, -panSpeed);
  if (keys.has("f")) delta.addScaledVector(forward, panSpeed);
  if (delta.lengthSq() > 0) {
    camera.position.add(delta);
    controls.target.add(delta);
  }
}

function wireInput(ctx, viewport) {
  const el = ctx.renderer.domElement;

  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (["q", "e", "w", "a", "s", "d", "r", "f", "v"].includes(k)) e.preventDefault();
    if (e.key === "Shift") ctx.keys.add("shift");
    else ctx.keys.add(k);
    if (e.key === "[" || e.key === "]") {
      e.preventDefault();
      const step = e.key === "]" ? 1 : -1;
      const n = N_LAYERS();
      const cur = state.focusLayer == null ? Math.round(n / 2) : state.focusLayer;
      state.focusLayer = Math.max(0, Math.min(n - 1, cur + step));
      queueVisibilityTargets(ctx);
      ctx.hooks.onFocusChange?.();
    }
    if (k === "v") {
      goCornerView(ctx, false);
      ctx.hooks.onCornerView?.();
    }
    if (e.key === "Escape") {
      state.focusLayer = null;
      state.selectedId = null;
      state.hoverId = null;
      queueVisibilityTargets(ctx);
      ctx.hooks.onClear?.();
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
  });
  el.addEventListener("pointerup", (e) => {
    if (ctx.pointerState.btn !== 0) return;
    const dx = e.clientX - ctx.pointerState.x;
    const dy = e.clientY - ctx.pointerState.y;
    if (dx * dx + dy * dy < 16) pick(ctx, e);
  });
  el.addEventListener("pointermove", (e) => hover(ctx, e, viewport));
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

function pick(ctx, event) {
  setPointer(ctx, event);
  const hits = ctx.raycaster.intersectObjects(
    ctx.meshes.filter((m) => m.visible),
    false
  );
  if (hits.length) selectCompany(ctx, hits[0].object.userData.companyId);
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
