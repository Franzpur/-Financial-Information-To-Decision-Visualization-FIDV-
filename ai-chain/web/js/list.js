/** [C-LIST] L4 BICS membership list from 20261003. No splash. */

const table = document.getElementById("listTable");
const trail = document.getElementById("listTrail");
const lede = document.getElementById("listLede");
const note = document.getElementById("listNote");
const filterEl = document.getElementById("listFilter");
const cubeLink = document.getElementById("listCubeLink");

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

function trailHtml(ancestors, node) {
  const bits = [`<a href="/">All</a>`];
  for (const a of ancestors) {
    bits.push(`<span class="home-trail-sep">/</span>`);
    bits.push(
      `<a href="/?bics=${encodeURIComponent(a.bicsCode)}">${escapeHtml(a.name)}</a>`,
    );
  }
  if (node) {
    bits.push(`<span class="home-trail-sep">/</span>`);
    bits.push(`<span class="home-trail-current">${escapeHtml(node.name)}</span>`);
  }
  return bits.join("");
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

function rowHtml(e) {
  return (
    `<div class="list-row" role="row">` +
    `<span class="list-name">${escapeHtml(e.name || "")}${otherNote(e)}</span>` +
    `<span class="list-ticker">${escapeHtml(e.ticker || "")}</span>` +
    `<span class="list-coord">${escapeHtml(e.legal_entity_coord || e.bics_code_l4 || "")}</span>` +
    `<span class="list-pct">${fmtPct(e.pct_tot_rev)}</span>` +
    `</div>`
  );
}

function visibleRows(q) {
  const needle = q.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((e) => {
    const name = String(e.name || "").toLowerCase();
    const ticker = String(e.ticker || "").toLowerCase();
    return name.includes(needle) || ticker.includes(needle);
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
    note.textContent = `${shown.length} of ${rows.length} companies · primary L4 · 20261003`;
}

async function bootList() {
  const code = currentBics();
  if (!code) {
    note.textContent = "Missing ?bics= level-4 code.";
    return;
  }
  try {
    const res = await fetch(`/api/bics/entities?bics=${encodeURIComponent(code)}`);
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
    if (trail) trail.innerHTML = trailHtml(data.ancestors || [], node);
    if (cubeLink) cubeLink.href = `/cube?bics=${encodeURIComponent(code)}`;
    document.title = node ? `FIDV — ${node.name}` : document.title;
    render("");
  } catch (err) {
    note.textContent = "Failed to load companies. Is the server running?";
    console.error(err);
  }
}

filterEl?.addEventListener("input", () => render(filterEl.value));
bootList();
