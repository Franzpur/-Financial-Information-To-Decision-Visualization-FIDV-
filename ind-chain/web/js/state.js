/** Shared app state + URL hash sync.
 * Concepts: ../CONCEPTS.md — [C-FOCUS] focusLayer, [C-SELECT] selectedId, [C-FILTER] filterMode.
 */

export const COLORS = {
  US: 0x3cf0ff,
  INTL: 0xffb020,
  PLANE: 0x1a2330,
  EDGE: 0x3a4658,
};

export const state = {
  layers: [],
  companies: [],
  countries: {},
  filterMode: "all",
  focusLayer: null, // [C-FOCUS] slice index or null
  selectedId: null, // [C-SELECT]
  hoverId: null, // [C-HOVER]
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
  /** Standard shell mode (one firm at face center) */
  shellCube: false,
};

export function visibleCompanies() {
  return state.companies.filter(passesFilter);
}

export function passesFilter(c) {
  if (state.filterMode === "us") return c.country === "US";
  if (state.filterMode === "intl") return c.country !== "US";
  return true;
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
      state.focusLayer = hit.layer;
      state.openTickerMiss = false;
    } else {
      state.openTickerMiss = true;
    }
  }
}

export async function resolveBicsLabel() {
  if (!state.bicsCode) return;
  try {
    const res = await fetch(`/api/bics/node?code=${encodeURIComponent(state.bicsCode)}`);
    if (!res.ok) return;
    const data = await res.json();
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
