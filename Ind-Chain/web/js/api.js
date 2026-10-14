/** FE-API — single HTTP client for gate / list / cube (M2).
 * Change API_BASE once; pages must not scatter `/api/…` strings.
 */

export const API_BASE = "/api";

function apiUrl(path, params) {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  if (params && typeof params === "object") {
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== "") url.searchParams.set(k, String(v));
    });
  }
  return url;
}

async function getJson(url, label) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${label} failed (${res.status})`);
  return res.json();
}

export async function fetchBundle() {
  const ticker = new URLSearchParams(location.search).get("ticker");
  const url = apiUrl("/bundle", ticker ? { ticker } : undefined);
  return getJson(url, "/bundle");
}

export async function searchCompanies(q) {
  const url = apiUrl("/companies", { q });
  return getJson(url, "/companies");
}

export async function fetchBicsChildren({ parent, listingCountry } = {}) {
  const url = apiUrl("/bics/children", {
    parent: parent || undefined,
    listingCountry: listingCountry || undefined,
  });
  return getJson(url, "/bics/children");
}

export async function fetchBicsLocate(q) {
  const url = apiUrl("/bics/locate", { q });
  return getJson(url, "/bics/locate");
}

export async function fetchBicsNode(code) {
  const url = apiUrl("/bics/node", { code });
  return getJson(url, "/bics/node");
}

export async function fetchBicsEntities({ bics, listingCountry } = {}) {
  const url = apiUrl("/bics/entities", {
    bics,
    listingCountry: listingCountry || undefined,
  });
  return getJson(url, "/bics/entities");
}
