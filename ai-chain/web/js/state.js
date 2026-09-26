/** Shared app state + URL hash sync. */

export const COLORS = {
  US: 0x3cf0ff,
  INTL: 0xff3b4a,
  SUPPLY: 0xe8d44a,
  PLANE: 0x1a2330,
  EDGE: 0x3a4658,
};

export const state = {
  layers: [],
  companies: [],
  countries: {},
  filterMode: "all",
  focusLayer: null,
  selectedId: null,
  hoverId: null,
  exploded: false,
  helpOpen: true,
};

export function visibleCompanies() {
  return state.companies.filter(passesFilter);
}

export function passesFilter(c) {
  if (state.filterMode === "us") return c.country === "US";
  if (state.filterMode === "intl") return c.country !== "US";
  if (state.filterMode === "supply") return c.valueM != null;
  return true;
}

export function readHash() {
  const h = new URLSearchParams(location.hash.replace(/^#/, ""));
  const slice = h.get("slice");
  const filter = h.get("filter");
  const id = h.get("id");
  if (filter && ["all", "us", "intl", "supply"].includes(filter)) {
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
