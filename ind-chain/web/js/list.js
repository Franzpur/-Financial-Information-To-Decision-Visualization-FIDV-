/** [C-LIST] L4 BICS membership list from 20261003. No splash. */

import { renderNations } from "./nations.js?v=33";
import { displayIndustryCoord } from "./coords.js?v=35";

if ("scrollRestoration" in history) history.scrollRestoration = "manual";

const table = document.getElementById("listTable");
const trail = document.getElementById("listTrail");
const lede = document.getElementById("listLede");
const note = document.getElementById("listNote");
const filterEl = document.getElementById("listFilter");

let rows = [];

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function currentBics() {
  return new URLSearchParams(location.search).get("bics") || "";
}

function currentListing() {
  return new URLSearchParams(location.search).get("listingCountry") || "";
}

function gateHref(bics, country) {
  const p = new URLSearchParams();
  if (bics) p.set("bics", bics);
  if (country) p.set("listingCountry", country);
  const q = p.toString();
  return q ? `/?${q}` : "/";
}

function listHref(bics, country) {
  const p = new URLSearchParams();
  p.set("bics", bics);
  if (country) p.set("listingCountry", country);
  return `/list?${p.toString()}`;
}

function trailHtml(ancestors, node, country) {
  const bits = [`<a href="${escapeHtml(gateHref("", country))}">All</a>`];
  for (const a of ancestors) {
    bits.push(`<span class="home-trail-sep">/</span>`);
    bits.push(
      `<a href="${escapeHtml(gateHref(a.bicsCode, country))}">${escapeHtml(a.name)}</a>`,
    );
  }
  if (node) {
    bits.push(`<span class="home-trail-sep">/</span>`);
    bits.push(`<span class="home-trail-current">${escapeHtml(node.name)}</span>`);
  }
  return bits.join("");
}

function bindNations(el, nations, total, country, bics) {
  renderNations(el, nations, total, country, (code) => listHref(bics, code), (code, href) =>
    applyListing(href, true),
  );
}

function fmtPct(v) {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}%`;
}

function otherNote(e) {
  const segs = e.other_segments || [];
  if (!segs.length) return "";
  const bits = segs.map((s) => `${escapeHtml(s.l1)} ${fmtPct(s.pct)}`);
  return `<span class="list-other">Also ${bits.join(" · ")}</span>`;
}

function cubeCompanyHref(ticker) {
  const t = String(ticker || "").trim();
  if (!t) return "/cube";
  return `/cube?ticker=${encodeURIComponent(t)}`;
}

function rowHtml(e) {
  const href = cubeCompanyHref(e.ticker);
  const label = escapeHtml(e.name || e.ticker || "Open cube");
  return (
    `<a class="list-row" role="row" href="${escapeHtml(href)}" title="Open decision cube for this company">` +
    `<span class="list-name">${escapeHtml(e.name || "")}${otherNote(e)}</span>` +
    `<span class="list-ticker">${escapeHtml(e.ticker || "")}</span>` +
    `<span class="list-coord">${escapeHtml(displayIndustryCoord(e.legal_entity_coord || e.bics_code_l4 || ""))}</span>` +
    `<span class="list-pct">${fmtPct(e.pct_tot_rev)}</span>` +
    `<span class="visually-hidden">Open cube · ${label}</span>` +
    `</a>`
  );
}

let byRevenue = false;

function visibleRows(q) {
  const needle = q.trim().toLowerCase();
  const matched = !needle
    ? rows
    : rows.filter((e) => {
        const name = String(e.name || "").toLowerCase();
        const ticker = String(e.ticker || "").toLowerCase();
        return name.includes(needle) || ticker.includes(needle);
      });
  if (!byRevenue) return matched;
  return [...matched].sort((a, b) => {
    const aEmpty = a.ind_rev == null;
    const bEmpty = b.ind_rev == null;
    if (aEmpty !== bEmpty) return aEmpty ? 1 : -1;
    if (!aEmpty && Number(a.ind_rev) !== Number(b.ind_rev)) return Number(b.ind_rev) - Number(a.ind_rev);
    return String(a.name || "").toLowerCase().localeCompare(String(b.name || "").toLowerCase());
  });
}

function render(q) {
  const shown = visibleRows(q);
  if (!shown.length) {
    table.innerHTML = "";
    note.textContent = rows.length
      ? "No rows match this filter."
      : "No member companies for this level-4 coordinate (this class has no 20261003 depth).";
    return;
  }
  table.setAttribute("role", "table");
  table.innerHTML =
    `<div class="list-head" role="row">` +
    `<span role="columnheader">Company</span><span role="columnheader">Ticker</span>` +
    `<span role="columnheader">Industry coord</span><span role="columnheader">L1 rev %</span>` +
    `</div>` +
    shown.map(rowHtml).join("");
  note.textContent = `${shown.length} of ${rows.length} companies · primary L4 · click a row to open that company in the cube`;
}

function renderTotal(el, count, total, country) {
  if (!el) return;
  if (country) {
    el.textContent = `${count} companies in this filter · ${total} in this class`;
  } else {
    el.textContent = `${total} companies in this class`;
  }
}

async function applyListing(href, push) {
  const y =
    typeof document.getElementById("nationList")?._nationScrollY === "number"
      ? document.getElementById("nationList")._nationScrollY
      : window.scrollY;
  if (document.activeElement && document.activeElement !== document.body) {
    document.activeElement.blur();
  }
  if (push) history.pushState({ scrollY: y }, "", href);
  await loadList();
  restoreScroll(y);
}

function restoreScroll(y) {
  const apply = () => window.scrollTo(0, y);
  apply();
  requestAnimationFrame(() => {
    apply();
    requestAnimationFrame(apply);
  });
  setTimeout(apply, 0);
  setTimeout(apply, 80);
}

async function loadList() {
  const code = currentBics();
  const loc = currentListing();
  if (!code) {
    note.textContent = "Missing ?bics= level-4 code.";
    return;
  }
  try {
    const qs = new URLSearchParams({ bics: code });
    if (loc) qs.set("listingCountry", loc);
    const res = await fetch(`/api/bics/entities?${qs.toString()}`);
    if (res.status === 400) {
      note.textContent = "This page lists level-4 classes only.";
      return;
    }
    if (!res.ok) throw new Error(`entities ${res.status}`);
    const data = await res.json();
    const node = data.node;
    rows = data.entities || [];
    if (lede && node) {
      lede.textContent = `Level 4 · ${node.name} · ${data.count || 0} companies`;
    }
    if (trail) trail.innerHTML = trailHtml(data.ancestors || [], node, loc);
    bindNations(
      document.getElementById("nationList"),
      data.listingCountries,
      data.totalCount,
      loc,
      code,
    );
    renderTotal(document.getElementById("listTotal"), data.count, data.totalCount, loc);
    document.title = node ? `FIDV — ${node.name}` : document.title;
    render(filterEl?.value || "");
    note.textContent = `${visibleRows(filterEl?.value || "").length} of ${rows.length} companies · primary L4 · click a row to open that company in the cube`;
  } catch (err) {
    note.textContent = "Failed to load companies. Is the server running?";
    console.error(err);
  }
}

const presetQ = new URLSearchParams(location.search).get("q") || "";
if (filterEl && presetQ) filterEl.value = presetQ;
filterEl?.addEventListener("input", () => render(filterEl.value));
document.getElementById("listSortRev")?.addEventListener("click", (e) => {
  byRevenue = !byRevenue;
  e.currentTarget.setAttribute("aria-pressed", byRevenue ? "true" : "false");
  render(filterEl?.value || "");
});
function wireBackspaceUp() {
  window.addEventListener("keydown", (e) => {
    if (e.key !== "Backspace" || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    const el = document.activeElement;
    if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
    e.preventDefault();
    const links = trail?.querySelectorAll("a");
    const href = links?.length ? links[links.length - 1].getAttribute("href") : "";
    if (href) location.assign(href);
  });
}

loadList();
wireBackspaceUp();
window.addEventListener("popstate", () => {
  loadList().then(() => {
    const y = history.state?.scrollY;
    if (typeof y === "number") restoreScroll(y);
  });
});
