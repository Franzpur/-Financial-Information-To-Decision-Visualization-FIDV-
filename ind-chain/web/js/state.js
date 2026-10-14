/** Shared app state + URL hash sync.
 * Concepts: ../CONCEPTS.md — [C-FOCUS] focusLayer, [C-SELECT] selectedId, [C-FILTER] filterMode,
 * [C-ALT] altHide*, [C-PIN] pinnedLayers.
 */
import { fetchBicsNode } from "./api.js?v=51";

export const COLORS = {
  US: 0x3cf0ff,
  INTL: 0xffb020,
  PLANE: 0x1a2330,
  EDGE: 0x3a4658,
  /** C-POINT disk fill (米白) under US/INTL rim. */
  RING_FILL: 0xefe8dc,
  /** C-REV-LINK supplier (墨绿, cabinet M1 brighter). */
  LINK_SUPPLIER: 0x3d8f6a,
  /** C-REV-LINK customer (暗红, cabinet M1 brighter); owner “consumer” = this side. */
  LINK_CUSTOMER: 0xa04848,
  /** C-AXES (cabinet M3 — single source, muted ice). */
  AXIS_S: 0xc8d8ea,
  AXIS_Y: 0x9eb6cc,
  AXIS_X: 0x7a9ab4,
  AXIS_TICK_MAJOR: 0xb0c4d8,
  AXIS_TICK_MINOR: 0x5a7088,
  /** C-RING guides (cabinet M2 — structure, not competing with US cyan). */
  RING_GUIDE: 0x5a7088,
  RING_GUIDE_CENTER: 0x6a8098,
};

/** Hex number → #rrggbb for canvas axis labels. */
export function colorCss(hex) {
  const n = Number(hex) >>> 0;
  return `#${n.toString(16).padStart(6, "0")}`;
}

export const state = {
  layers: [],
  companies: [],
  countries: {},
  filterMode: "all",
  focusLayer: null, // [C-FOCUS] slice index or null
  selectedId: null, // [C-SELECT]
  hoverId: null, // [C-HOVER]
  /** [C-ALT] Hide C-RING guides + C-SLICE chrome; keep points + revenue links. */
  altHideRingsSlices: false,
  /** [C-ALT] Hide C-AXES. */
  altHideAxes: false,
  /** [C-PIN] Extra stay slices (with focusLayer). */
  pinnedLayers: [],
  d: 1, // [C-D] slice gap factor; meters = d·UNIT; UI % = 100·d
  helpOpen: false,
  /** Optional breadcrumb context from URL (does not swap cube data). */
  bicsCode: null,
  bicsName: null,
  bicsLevel: null,
  /** [C-LIST → C-CUBE] Member Ticker from /cube?ticker= */
  openTicker: null,
  /** True when shell bundle had no entity for openTicker */
  openTickerMiss: false,
  /** Standard shell mode (one firm at user (5,5,5); no slices/rings) */
  shellCube: false,
  /** Shell user anchor from bundle.meta.shellAnchor */
  shellAnchor: null,
  /** [C-REV-LINK] Point-to-point edges; peers are real C-POINT companies on demo slices. */
  revenueLinks: [],
};

export function visibleCompanies() {
  return state.companies.filter(passesFilter);
}

export function passesFilter(c) {
  if (state.filterMode === "us") return c.country === "US";
  if (state.filterMode === "intl") return c.country !== "US";
  return true;
}

/**
 * [C-PIN] Stay set = pinned ∪ {focus}. null = overview (no restriction).
 * @returns {Set<number>|null}
 */
export function stayLayers() {
  if (state.shellCube) return null;
  const set = new Set(
    (state.pinnedLayers || []).filter((i) => Number.isInteger(i))
  );
  if (state.focusLayer != null) set.add(state.focusLayer);
  if (set.size === 0) return null;
  return set;
}

/** True if layer index stays visible under current focus/pins. */
export function layerIsStay(i) {
  const stay = stayLayers();
  if (stay == null) return true;
  return stay.has(i);
}

export function normalizeTickerKey(raw) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

/** Match Member Ticker (e.g. CEG US Equity) to demo-chain ticker (e.g. CEG). */
export function companyByTicker(raw) {
  const full = normalizeTickerKey(raw);
  if (!full) return null;
  const head = full.split(" ")[0];
  const exact = state.companies.find((c) => normalizeTickerKey(c.ticker) === full);
  if (exact) return exact;
  const byHead = state.companies.find((c) => normalizeTickerKey(c.ticker) === head);
  if (byHead) return byHead;
  return (
    state.companies.find((c) => {
      const t = normalizeTickerKey(c.ticker);
      return t && (full === t || full.startsWith(`${t} `));
    }) || null
  );
}

export function readHash() {
  const q = new URLSearchParams(location.search);
  const bics = q.get("bics");
  if (bics) state.bicsCode = bics;
  const ticker = q.get("ticker");
  if (ticker) state.openTicker = ticker;

  const h = new URLSearchParams(location.hash.replace(/^#/, ""));
  const slice = h.get("slice");
  const filter = h.get("filter");
  const id = h.get("id");
  if (filter && ["all", "us", "intl"].includes(filter)) {
    state.filterMode = filter;
  }
  if (slice != null && slice !== "") {
    const n = Number(slice);
    if (Number.isInteger(n) && n >= 0 && n < state.layers.length) state.focusLayer = n;
  }
  if (id != null && id !== "") {
    const n = Number(id);
    if (Number.isInteger(n)) state.selectedId = n;
  }

  if (state.openTicker) {
    const hit = companyByTicker(state.openTicker) || state.companies[0] || null;
    if (hit) {
      state.selectedId = hit.id;
      // Shell firms have no layer index — keep focusLayer null (not undefined).
      state.focusLayer =
        !state.shellCube && hit.layer != null && Number.isInteger(hit.layer)
          ? hit.layer
          : null;
      state.openTickerMiss = false;
    } else {
      state.openTickerMiss = true;
    }
  }
}

export async function resolveBicsLabel() {
  if (!state.bicsCode) return;
  try {
    const data = await fetchBicsNode(state.bicsCode);
    const hit = data.node;
    if (hit) {
      state.bicsName = hit.name;
      state.bicsLevel = hit.level;
    }
  } catch {
    /* ignore */
  }
}

export function writeHash() {
  const h = new URLSearchParams();
  if (state.filterMode && state.filterMode !== "all") h.set("filter", state.filterMode);
  if (state.focusLayer != null) h.set("slice", String(state.focusLayer));
  if (state.selectedId != null) h.set("id", String(state.selectedId));
  const next = h.toString();
  const hash = next ? `#${next}` : "";
  if (location.hash !== hash) {
    history.replaceState(null, "", hash || location.pathname + location.search);
  }
}

export function companyById(id) {
  return state.companies.find((c) => c.id === id) || null;
}
