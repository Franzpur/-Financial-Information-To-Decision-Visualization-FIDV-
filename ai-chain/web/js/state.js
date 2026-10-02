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
  /** [C-HOME] BICS L1 code from /cube?bics= — context only until companies attach */
  bicsCode: null,
  bicsName: null,
};

export function visibleCompanies() {
  return state.companies.filter(passesFilter);
}

export function passesFilter(c) {
  if (state.filterMode === "us") return c.country === "US";
  if (state.filterMode === "intl") return c.country !== "US";
  return true;
}

export function readHash() {
  const q = new URLSearchParams(location.search);
  const bics = q.get("bics");
  if (bics) state.bicsCode = bics;

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
}

export async function resolveBicsLabel() {
  if (!state.bicsCode) return;
  try {
    const res = await fetch("/api/bics/l1");
    if (!res.ok) return;
    const data = await res.json();
    const hit = (data.sectors || []).find((s) => s.bicsCode === state.bicsCode);
    if (hit) state.bicsName = hit.name;
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
