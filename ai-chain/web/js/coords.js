/**
 * [C-COORD] Visualization space for the industry-chain cube.
 *
 * 1类坐标，位置坐标：用户坐标 (s, x, y)。立方体里的位置只用这一套。
 * Three.js is only the renderer. To move something, change this coordinate
 * (LAYOUT below, or the object's coord). Do not write raw Three.js positions.
 *
 *   s  front (+s) / back (−s). Layer i sits at s = i.
 *   x  right (+x) / left (−x). A slice face is x∈[0,1].
 *   y  up (+y) / down (−y). Face is y∈[0,1].
 *   Focus keeps that slice. The rest of the cube shifts left along −x by cubeExitX().
 *
 * 调位置：改本文件 LAYOUT，或改对象的 (s, x, y)。不要直接写 Three.js 坐标。
 *
 * 2类坐标，相对坐标：company.ringCos / company.ringSin。不叫 x、y。
 * companyCoord() 把它们投影成位置坐标。
 *
 * 3类坐标，法人坐标：company.legalEntityCoord。格式 00-00-00-00-00-00-0000，
 * 对应 Bloomberg BICS。值待填，不参与摆放。
 */
export const FACE = 4.2; // Three.js meters per 1 user-x or 1 user-y
export const GAP = 0.55; // Three.js meters per 1 user-s when compact
export const GAP_EXPLODED = GAP * 2.2;
/** [C-AXIS-X] +user-x → Three.js −Z. */
export const USER_X_SIGN = -1;

export const LAYOUT = {
  /** Unpulled slice center. The face is the unit square around this point. */
  faceCenter: { x: 0.5, y: 0.5 },
  /** [C-RING] Outermost ring radius, in face units (1 = full edge). */
  ringRadius: 0.38,
  /** [C-LABEL] Domain name on the slice. x/y are absolute user coords on the unpulled face. */
  domainLabel: {
    x: 0.75,
    y: (FACE - 0.28) / FACE,
    liftMeters: 0.03,
  },
  /** Company name sits on the point, nudged +s and +y so it clears the sphere. */
  companyLabel: { liftMeters: 0.02, aboveMeters: 0.12 },
  /** Ring polylines sit a hair in front of the glass (+s). */
  ringGuideLiftMeters: 0.008,
  /** Wireframe padding around the unit cube, in meters (constant on screen when s-gap changes). */
  framePad: { sMeters: 0.25, faceMeters: 0.225 },
  /** [C-AXES] Axis lengths in user units. Tick chrome is derived in axisChrome(). */
  axes: { sEnd: 20, xEnd: 2.25, yEnd: 2.25 },
  /** [C-STDVIEW] Camera and look-at, user (s, x, y). */
  camera: {
    pulled: { sOffset: 10, x: 0.5, y: 0.5 },
    overview: {
      pos: { s: 24, x: 2.1, y: 2.1 },
      target: { s: 0, x: 0, y: 0 },
    },
  },
};

export function sxy(s, x, y) {
  return { s, x, y };
}

export function gapOf(exploded) {
  return exploded ? GAP_EXPLODED : GAP;
}

export function originLocal(nLayers, gap) {
  const halfStack = ((nLayers - 1) * gap) / 2;
  return { x: -halfStack, y: -FACE / 2, z: FACE / 2 };
}

/** (s, x, y) → root-local Three.js {x, y, z}. */
export function coordToLocal(coord, nLayers, gap) {
  const o = originLocal(nLayers, gap);
  return {
    x: o.x + coord.s * gap,
    y: o.y + coord.y * FACE,
    z: o.z + USER_X_SIGN * coord.x * FACE,
  };
}

/** Root-local Three.js {x, y, z} → (s, x, y). */
export function localToCoord(p, nLayers, gap) {
  const o = originLocal(nLayers, gap);
  return {
    s: (p.x - o.x) / gap,
    y: (p.y - o.y) / FACE,
    x: (p.z - o.z) / (USER_X_SIGN * FACE),
  };
}

/**
 * Offset from a parent whose origin is user (s0, x0, y0), in that parent's
 * local Three.js axes. ds/dx/dy are user-unit deltas.
 */
export function localOffset(ds, dx, dy, gap) {
  return {
    x: ds * gap,
    y: dy * FACE,
    z: USER_X_SIGN * dx * FACE,
  };
}

/** [C-PULL] One face width along −x (left). Focused slice stays; the rest of the cube uses this. */
export function cubeExitX() {
  return 1;
}

/** Slice group anchor. exitX moves this slice along −x. The focused slice passes 0. */
export function sliceAnchor(s, exitX = 0) {
  return {
    s,
    x: LAYOUT.faceCenter.x - exitX,
    y: LAYOUT.faceCenter.y,
  };
}

/**
 * Ring (ringCos, ringSin) in [-1, 1] → unpulled user (s, x, y).
 * +ringCos is +Three Z on the slice, which is −user-x (USER_X_SIGN).
 */
export function companyCoord(layer, ringCos, ringSin) {
  return {
    s: layer,
    x: LAYOUT.faceCenter.x + USER_X_SIGN * ringCos * LAYOUT.ringRadius,
    y: LAYOUT.faceCenter.y + ringSin * LAYOUT.ringRadius,
  };
}

export function domainLabelCoord(layer, gap) {
  return {
    s: layer + LAYOUT.domainLabel.liftMeters / gap,
    x: LAYOUT.domainLabel.x,
    y: LAYOUT.domainLabel.y,
  };
}

export function companyLabelCoord(base, radiusMeters, gap) {
  return {
    s: base.s + LAYOUT.companyLabel.liftMeters / gap,
    x: base.x,
    y: base.y + (radiusMeters + LAYOUT.companyLabel.aboveMeters) / FACE,
  };
}

/** Point on a concentric ring, as a user-unit offset from the face center. */
export function ringOffset(radiusUser, angle) {
  return {
    dx: USER_X_SIGN * Math.cos(angle) * radiusUser,
    dy: Math.sin(angle) * radiusUser,
  };
}

/**
 * Axis tick / label coordinates. Lengths sEnd/xEnd/yEnd are user units.
 * The small pads match the previous meter offsets, so they stay put when the
 * s-gap changes (pads are meters ÷ current gap or face).
 */
export function axisChrome(gap) {
  const s = (meters) => meters / gap;
  const u = (meters) => meters / FACE;
  const { sEnd, xEnd, yEnd } = LAYOUT.axes;
  return {
    sEnd,
    xEnd,
    yEnd,
    tickLayerY: u(0.14),
    tickMinorY: u(0.08),
    labelGapY: u(0.18),
    yTickS: s(0.14),
    yNumeralS: s(0.32),
    xTickY: u(0.14),
    xNumeralY: u(0.32),
    sLabel: { s: sEnd + s(0.4), x: 0, y: u(0.22) },
    yLabel: { s: s(0.08), x: 0, y: yEnd + u(0.28) },
    xLabel: { s: 0, x: xEnd + u(0.28), y: u(0.22) },
  };
}

export function formatCoord(coord, digits = 2) {
  if (!coord) return "—";
  const s = Number.isInteger(coord.s) ? String(coord.s) : coord.s.toFixed(digits);
  return `(${s}, ${coord.x.toFixed(digits)}, ${coord.y.toFixed(digits)})`;
}
