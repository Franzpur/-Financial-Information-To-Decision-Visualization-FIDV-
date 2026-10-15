/**
 * FE-NAV — Page routing, URL query helpers, and Backspace upward navigation across
 * `/` (FE-BOARD), `/list` (FE-LIST), and `/cube` (FE-OPENCUBE).
 */

export function currentBics() {
  return new URLSearchParams(location.search).get("bics") || "";
}

export function currentListing() {
  return new URLSearchParams(location.search).get("listingCountry") || "";
}

export function currentQuery() {
  return new URLSearchParams(location.search).get("q") || "";
}

export function gateHref(bics, country) {
  const p = new URLSearchParams();
  if (bics) p.set("bics", bics);
  if (country) p.set("listingCountry", country);
  const q = p.toString();
  return q ? `/?${q}` : "/";
}

export function listHref(bics, country) {
  const p = new URLSearchParams();
  p.set("bics", bics);
  if (country) p.set("listingCountry", country);
  return `/list?${p.toString()}`;
}

export function listLocateHref(bics, ticker) {
  const p = new URLSearchParams();
  p.set("bics", bics);
  p.set("q", ticker);
  return `/list?${p.toString()}`;
}

export function cubeHref() {
  return "/cube";
}

export function cubeCompanyHref(ticker) {
  const t = String(ticker || "").trim();
  if (!t) return "/cube";
  return `/cube?ticker=${encodeURIComponent(t)}`;
}

/** Alt locate token: bare demo cube (not company→cube). */
export function isDemoCubeQuery(q) {
  return String(q || "").trim().toLowerCase() === "/cube";
}

export function assignRoute(href) {
  if (href) location.assign(href);
}

export function replaceRoute(href) {
  if (href) location.replace(href);
}

/** Wire Backspace outside editable inputs to navigate to the URL returned by resolveHref(). */
export function wireBackspaceNav(resolveHref) {
  window.addEventListener("keydown", (e) => {
    if (e.key !== "Backspace" || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    const el = document.activeElement;
    if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
    e.preventDefault();
    const href = typeof resolveHref === "function" ? resolveHref() : "";
    if (href) location.assign(href);
  });
}
