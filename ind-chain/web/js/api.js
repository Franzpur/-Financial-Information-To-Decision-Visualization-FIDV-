/** API client for the Standard-Cube backend. */

export async function fetchBundle() {
  const url = new URL("/api/bundle", window.location.origin);
  const ticker = new URLSearchParams(location.search).get("ticker");
  if (ticker) url.searchParams.set("ticker", ticker);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`API /api/bundle failed (${res.status})`);
  return res.json();
}

export async function searchCompanies(q) {
  const url = new URL("/api/companies", window.location.origin);
  url.searchParams.set("q", q);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`search failed (${res.status})`);
  return res.json();
}
