/**
 * FE-MAPDOCK — the map desk ([C-MAPDOCK]): `Map ▾` face + right-hand dock card + `⤢` sheet.
 * Owns UI wiring only: fetch via api.js, catalog via reg.js, drawing via draw.js, PNG via export.js.
 * The paper area is one self-contained root (`.pm-sheet.pm-skin-paper`) swapped by innerHTML; the
 * dock shell around it (title, params, ops) is product chrome. Redraw triggers: select / focus / clear /
 * reset / pin / param / data arrival. Camera, drag and the `d` slider never reach this module.
 * Must not import scene.
 */
import { fetchDebtLadder } from "../api.js?v=52";
import { list, get, run, cleanParams } from "./reg.js?v=4";
import { drawPlot } from "./draw.js?v=4";
import { exportPaperPng } from "./export.js?v=3";

const PIN_MAX = 6;
const SEARCH_MIN = 12;
const PAPER_H_COMPACT = 178;
const PAPER_H_MIN = 120;
const PAPER_H_MAX = 420;
const PAPER_W_MIN = 300;
const PAPER_W_MAX = 720;
const SHEET_H_DEFAULT = 330;
const SHEET_H_MIN = 200;
const SHEET_H_MAX = 640;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** Param controls from a descriptor schema: enum -> select, bool -> checkbox, int/number -> range. */
export function paramsHtml(schema, values = {}) {
  return Object.keys(schema || {})
    .map((k) => {
      const s = schema[k];
      const v = k in values ? values[k] : s.default;
      const key = esc(k);
      if (s.type === "enum") {
        const opts = (s.options || []).map((o) => `<option value="${esc(o)}"${o === v ? " selected" : ""}>${esc(o)}</option>`).join("");
        return `<label class="map-param">${key}<select data-p="${key}">${opts}</select></label>`;
      }
      if (s.type === "bool") return `<label class="map-param"><input type="checkbox" data-p="${key}"${v ? " checked" : ""}>${key}</label>`;
      if (s.type === "int" || s.type === "number") {
        const step = s.step ?? (s.type === "int" ? 1 : 0.1);
        return `<label class="map-param">${key}<input type="range" data-p="${key}" min="${s.min ?? 0}" max="${s.max ?? 100}" step="${step}" value="${esc(v)}"><output>${esc(v)}</output></label>`;
      }
      return "";
    })
    .join("");
}

export function readParams(root, schema) {
  const out = {};
  root.querySelectorAll("[data-p]").forEach((el) => {
    out[el.dataset.p] = el.type === "checkbox" ? el.checked : el.type === "range" ? Number(el.value) : el.value;
  });
  return cleanParams(schema, out);
}

/**
 * @param {{viewport: HTMLElement, getSelected: () => object|null, getSelectedLink?: () => object|null,
 *   getCompany?: (id:number) => object|null,
 *   findCompany: (sel:{ticker:string,name:string}) => object|null, pick: (id:number) => void}} deps
 */
export function createDock({ viewport, getSelected, getSelectedLink, getUsMap, getCompany, findCompany, pick }) {
  const $ = (id) => document.getElementById(id);
  const face = $("cubeMapFace");
  const panel = $("cubeMapPanel");
  const card = $("mapDock");
  const paper = $("mapDockPaper");
  const sheet = $("mapSheet");
  const detailPanel = $("detailPanel");
  if (!face || !panel || !card || !paper || !sheet) return { probe: async () => false, open() {}, onSelect() {}, onFocusChange() {}, onClear() {}, onReset() {}, refresh() {} };

  const cache = new Map();
  let active = null;
  let params = {};
  let doc = null;
  /** @type {{debtLadder: boolean|null, revLink: boolean, usMap: boolean}|null} */
  let avail = { debtLadder: false, revLink: false, usMap: false };
  let spec = null;
  let token = 0;
  let query = "";
  let pins = [];
  let wide = true;
  let folded = true;
  let paperH = PAPER_H_COMPACT;
  let paperW = null; // null → CSS default; set by dragging the paper left edge
  let sheetH = SHEET_H_DEFAULT;

  // [PM-LADDER-Q] one cached lookup per ticker|name; a miss (404, offline, unusable payload) is a silent null.
  function load(c) {
    const ticker = String((c && c.ticker) || "").trim();
    if (!ticker || c.bondSchedule) return Promise.resolve(null);
    const key = `${ticker}|${c.name || ""}`;
    let p = cache.get(key);
    if (!p) {
      p = fetchDebtLadder(ticker, c.name)
        .then((d) => (d && run("PM-LADDER-Q", d, {}).ok ? d : null))
        .catch(() => null);
      cache.set(key, p);
    }
    return p;
  }
  const probe = (c) => load(c).then(Boolean);

  function placeDetail() {
    if (!detailPanel) return;
    wide = window.matchMedia("(min-width: 981px)").matches;
    const dockOpen = !card.hidden;
    // Wide: detail sits under the dock card. Narrow: dock is a bottom drawer; still fold detail.
    const dockedLayout = dockOpen && wide;
    detailPanel.classList.toggle("is-docked", dockedLayout);
    detailPanel.classList.toggle("is-folded", dockOpen && folded);
    detailPanel.classList.toggle("is-map-open", dockOpen && !wide);
    if (!dockedLayout) {
      detailPanel.style.top = "";
      detailPanel.style.width = "";
      detailPanel.style.maxHeight = "";
      return;
    }
    const top = Math.round(card.getBoundingClientRect().bottom - viewport.getBoundingClientRect().top + 8);
    detailPanel.style.top = `${top}px`;
    detailPanel.style.width = `${card.offsetWidth}px`;
    detailPanel.style.maxHeight = `calc(100% - ${top + 76}px)`;
  }

  function closeDesk() {
    active = null;
    params = {};
    spec = null;
    closeSheet();
    setPanel(false);
    paint();
  }

  function applyChartHeight(host, h) {
    if (!host) return;
    host.style.setProperty("--map-paper-h", `${h}px`);
    const chart = host.querySelector(".pm-chart");
    if (chart) chart.style.height = `${h}px`;
    const svg = host.querySelector(".pm-svg");
    if (svg) {
      svg.setAttribute("height", String(h));
      svg.style.height = `${h}px`;
      svg.style.width = "100%";
    }
  }
  function applyPaperHeight() {
    applyChartHeight(paper, paperH);
  }
  function applySheetHeight() {
    applyChartHeight($("mapSheetBody"), sheetH);
  }
  function paperWidthCap() {
    wide = window.matchMedia("(min-width: 981px)").matches;
    const room = Math.max(PAPER_W_MIN, viewport.clientWidth - 48);
    return Math.min(PAPER_W_MAX, room);
  }
  function applyPaperWidth() {
    if (paperW == null) return;
    wide = window.matchMedia("(min-width: 981px)").matches;
    const w = Math.max(PAPER_W_MIN, Math.min(paperWidthCap(), paperW));
    paperW = w;
    if (wide) {
      // Dock is right-anchored → larger width grows into the empty left.
      card.style.width = `${w}px`;
      paper.style.width = "";
    } else {
      card.style.width = "";
      paper.style.width = `${w}px`;
    }
  }
  /** Bottom edge → height; left edge → width (drag left to widen). Sheet: height only. */
  function wireStretch(el, getH, setH, minH, maxH, after, opts = {}) {
    const { width = false } = opts;
    el?.addEventListener("pointerdown", (e) => {
      const rect = el.getBoundingClientRect();
      const nearLeft = width && e.clientX - rect.left <= 12;
      const nearBottom = rect.bottom - e.clientY <= 12;
      if (!nearLeft && !nearBottom) return;
      e.preventDefault();
      e.stopPropagation();
      wide = window.matchMedia("(min-width: 981px)").matches;
      const startX = e.clientX;
      const startY = e.clientY;
      const startH = getH();
      const startW = paperW ?? (wide ? card.offsetWidth : paper.offsetWidth);
      const move = (ev) => {
        if (nearBottom) {
          setH(Math.max(minH, Math.min(maxH, startH + (ev.clientY - startY))));
        }
        if (nearLeft) {
          paperW = Math.max(PAPER_W_MIN, Math.min(paperWidthCap(), startW + (startX - ev.clientX)));
          applyPaperWidth();
        }
        after();
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });
  }

  function renderPanel() {
    const selected = getSelectedLink?.() || getSelected() || getUsMap?.();
    const items = list({ selected, avail: avail || { debtLadder: false, revLink: false, usMap: false } });
    const q = query.trim().toLowerCase();
    const shown = items.filter((it) => !q || `${it.name} ${it.id}`.toLowerCase().includes(q));
    const groups = [...new Set(shown.map((it) => it.family))];
    panel.innerHTML =
      (items.length > SEARCH_MIN ? `<input class="map-search" type="search" placeholder="Search maps…" value="${esc(query)}" />` : "") +
      groups
        .map(
          (g) =>
            `<div class="map-group">${esc(g)}</div>` +
            shown
              .filter((it) => it.family === g)
              .map(
                (it) =>
                  `<button type="button" class="cube-filter-opt map-opt${it.available ? "" : " is-off"}${it.id === active && it.available ? " is-on" : ""}" data-map="${esc(it.id)}"${it.available ? "" : ` aria-disabled="true" title="${esc(it.reason)}"`}>` +
                  `<span class="map-opt-name">${esc(it.name)}</span><span class="map-opt-id">${esc(it.id)}</span>` +
                  (it.available ? "" : `<span class="map-opt-why">${esc(it.reason)}</span>`) +
                  `</button>`
              )
              .join("")
        )
        .join("");
  }

  function renderPins() {
    const el = $("mapDockPins");
    if (!el) return;
    el.hidden = pins.length === 0;
    el.innerHTML = pins.map((p, i) => `<button type="button" class="map-pin" data-pin="${i}" title="${esc(p.id)}">${esc(p.selector.ticker || p.selector.name)}</button>`).join("");
    const btn = $("mapPin");
    if (btn) btn.disabled = pins.length >= PIN_MAX;
  }

  function renderCard() {
    const a = avail || { debtLadder: false, revLink: false };
    const m = active ? get(active) : null;
    const need = m?.desc?.requires?.[0];
    const ready = m && need && a[need] === true;
    const r = ready && doc ? run(active, doc, params) : null;
    const show = Boolean(r && r.ok);
    const wasHidden = card.hidden;
    card.hidden = !show;
    face.parentElement.classList.toggle("is-active", show);
    if (!show) {
      spec = null;
      paper.innerHTML = "";
      placeDetail();
      return;
    }
    if (wasHidden) folded = true;
    spec = r.spec;
    $("mapDockTitle").textContent = m.name;
    $("mapDockId").textContent = m.id;
    const row = $("mapDockParams");
    const schema = Object.fromEntries(m.expose.map((k) => [k, m.desc.params[k]]));
    row.hidden = m.expose.length === 0;
    if (!row.hidden && !row.contains(document.activeElement)) row.innerHTML = paramsHtml(schema, cleanParams(m.desc.params, params));
    paper.innerHTML = drawPlot(spec, { density: "compact" });
    applyPaperHeight();
    applyPaperWidth();
    const n = spec.basis?.n ?? 1;
    const excluded = spec.basis?.excluded || [];
    const total = n + excluded.reduce((s, e) => s + (e.count | 0), 0);
    $("mapDockFoot").textContent = `${n} of ${total} ${m.noun} · ${spec.basis?.mode || "pair"}`;
    renderPins();
    placeDetail();
  }

  function paint() {
    renderPanel();
    if (avail !== null) renderCard();
  }

  function linkDoc(link) {
    const from = getCompany?.(link.fromId);
    const to = getCompany?.(link.toId);
    const paths = Array.isArray(link.sourcePaths)
      ? link.sourcePaths.map(String)
      : link.sourcePath
        ? [String(link.sourcePath)]
        : [];
    return {
      v: 1,
      side: link.side,
      fromName: from?.name || "NVIDIA",
      toName: to?.name || link.name || "Peer",
      pct: typeof link.pct === "number" ? link.pct : null,
      sourcePaths: paths,
    };
  }

  function refresh() {
    const link = getSelectedLink?.();
    if (link) {
      token += 1;
      active = "PM-REV-LINK";
      params = {};
      doc = linkDoc(link);
      avail = { debtLadder: false, revLink: true, usMap: Boolean(getUsMap?.()) };
      paint();
      return;
    }
    const us = getUsMap?.();
    const c = getSelected();
    const t = ++token;
    if (!c && !us) {
      doc = null;
      avail = { debtLadder: false, revLink: false, usMap: false };
      if (active === "PM-REV-LINK" || active === "PM-US-MAP") active = null;
      paint();
      return;
    }
    if (active === "PM-REV-LINK") active = null;
    if (!c && us) {
      doc = us;
      avail = { debtLadder: false, revLink: false, usMap: true };
      if (active === "PM-LADDER-Q" || active === "PM-REV-LINK") active = null;
      paint();
      return;
    }
    avail = { debtLadder: null, revLink: false, usMap: Boolean(us) };
    paint();
    load(c).then((d) => {
      if (t !== token) return;
      doc = d;
      avail = { debtLadder: Boolean(d), revLink: false, usMap: Boolean(getUsMap?.()) };
      if (!active && d) active = "PM-LADDER-Q";
      paint();
    });
  }

  function setPanel(open) {
    panel.hidden = !open;
    face.parentElement.classList.toggle("is-open", open);
    face.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) renderPanel();
  }

  function openSheet() {
    if (!spec || viewport.classList.contains("company-zoom")) return;
    $("mapSheetBody").innerHTML = drawPlot(spec, { density: "sheet" });
    applySheetHeight();
    sheet.hidden = false;
    $("mapSheetClose")?.focus();
  }
  function closeSheet() {
    sheet.hidden = true;
    $("mapSheetBody").innerHTML = "";
  }

  face.addEventListener("click", (e) => {
    e.stopPropagation();
    // [C-MAPDOCK] Already open → click Map face closes the whole desk; otherwise open the menu.
    if (!card.hidden) {
      closeDesk();
      return;
    }
    setPanel(panel.hidden);
  });
  panel.addEventListener("click", (e) => {
    const opt = e.target.closest(".map-opt");
    if (!opt || opt.classList.contains("is-off")) return;
    active = opt.dataset.map;
    params = {};
    setPanel(false);
    paint();
  });
  panel.addEventListener("input", (e) => {
    if (!e.target.classList.contains("map-search")) return;
    query = e.target.value;
    renderPanel();
    panel.querySelector(".map-search")?.focus();
  });
  document.addEventListener("pointerdown", (e) => {
    if (!panel.hidden && !face.parentElement.contains(e.target)) setPanel(false);
  });
  $("mapDockClose")?.addEventListener("click", () => closeDesk());
  $("mapExpand")?.addEventListener("click", openSheet);
  $("mapExport")?.addEventListener("click", () => {
    const host = !sheet.hidden ? $("mapSheetBody") : paper;
    exportPaperPng(host).catch(() => {});
  });
  $("mapPin")?.addEventListener("click", () => {
    const c = getSelected();
    if (!c || !active || pins.length >= PIN_MAX) return;
    const p = { id: active, params: { ...params }, selector: { ticker: c.ticker || "", name: c.name || "" } };
    if (!pins.some((q) => JSON.stringify(q) === JSON.stringify(p))) pins.push(p);
    renderPins();
  });
  $("mapDockPins")?.addEventListener("click", (e) => {
    const b = e.target.closest(".map-pin");
    const p = b && pins[Number(b.dataset.pin)];
    if (!p) return;
    active = p.id;
    params = { ...p.params };
    const cur = getSelected();
    const c = findCompany(p.selector);
    if (c && (!cur || cur.id !== c.id)) pick(c.id);
    else paint();
  });
  const rowEl = $("mapDockParams");
  let debounce = null;
  rowEl?.addEventListener("input", () => {
    const m = get(active);
    if (!m) return;
    rowEl.querySelectorAll("output").forEach((o) => (o.value = o.previousElementSibling.value));
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      params = readParams(rowEl, Object.fromEntries(m.expose.map((k) => [k, m.desc.params[k]])));
      renderCard();
    }, 80);
  });
  detailPanel?.addEventListener("click", (e) => {
    if (card.hidden) return;
    if (folded) folded = false;
    else if (e.target.closest("h3")) folded = true;
    else return;
    placeDetail();
  });
  sheet.addEventListener("click", (e) => {
    if (e.target === sheet || e.target.closest("#mapSheetClose")) closeSheet();
  });
  // Esc: sheet first, then whole desk; capture so the cube ladder does not also fire.
  window.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Escape") return;
      if (!sheet.hidden) {
        e.stopPropagation();
        e.preventDefault();
        closeSheet();
        return;
      }
      if (!card.hidden || !panel.hidden) {
        e.stopPropagation();
        e.preventDefault();
        closeDesk();
      }
    },
    true
  );
  // Paper: left edge widens (right dock grows left); bottom edge stretches height. Sheet: height only.
  wireStretch(
    paper,
    () => paperH,
    (h) => (paperH = h),
    PAPER_H_MIN,
    PAPER_H_MAX,
    () => {
      applyPaperHeight();
      placeDetail();
    },
    { width: true }
  );
  wireStretch($("mapSheetBody"), () => sheetH, (h) => (sheetH = h), SHEET_H_MIN, SHEET_H_MAX, applySheetHeight);
  window.addEventListener("resize", () => {
    applyPaperWidth();
    placeDetail();
  });

  renderPanel();
  return {
    probe,
    /** Select a mapping (e.g. from the detail chip or the company-zoom hand-off). */
    open(id = "PM-LADDER-Q") {
      if (!get(id)) return;
      active = id;
      params = {};
      refresh();
    },
    refresh,
    onSelect() {
      if (!sheet.hidden) closeSheet();
      refresh();
    },
    onSelectLink() {
      if (!sheet.hidden) closeSheet();
      refresh();
    },
    onShapeChange(shape) {
      if (!sheet.hidden) closeSheet();
      if (shape === 2 && getUsMap?.()) {
        active = "PM-US-MAP";
        params = {};
        doc = getUsMap();
        avail = { debtLadder: false, revLink: false, usMap: true };
        paint();
        return;
      }
      if (active === "PM-US-MAP") active = null;
      refresh();
    },
    onFocusChange: refresh,
    onClear: refresh,
    onReset: refresh,
  };
}
