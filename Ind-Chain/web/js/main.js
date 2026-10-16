import { fetchBundle } from "./api.js?v=52";
import { state, readHash, resolveBicsLabel, companyById, revenueLinkByKey } from "./state.js?v=59";
import { createScene } from "./scene.js?v=85";
import { createUI } from "./ui.js?v=77";
import { createDock } from "./map/dock.js?v=7";
import { listHref, wireBackspaceNav } from "./nav.js?v=1";

const bootError = document.getElementById("bootError");
const app = document.getElementById("app");

function showError(err) {
  bootError.hidden = false;
  bootError.textContent = String(err && err.stack ? err.stack : err);
  // Keep the message visible — clicking only blurs selection, does not clear the error.
  bootError.onclick = (e) => e.stopPropagation();
}

window.addEventListener("error", (e) => console.error(e.error || e.message));
window.addEventListener("unhandledrejection", (e) => console.error(e.reason));

/** [C-CUBE] No splash here — C-SPLASH lives on C-HOME only. */
async function boot() {
  try {
    const bundle = await fetchBundle();
    state.layers = Array.isArray(bundle.layers) ? bundle.layers : [];
    state.companies = Array.isArray(bundle.companies) ? bundle.companies : [];
    state.countries = bundle.meta?.countries || {};
    // FE-OPENCUBE: meta.mode is the discriminant (demo | shell | chain).
    const mode = bundle.meta?.mode;
    state.shellCube = mode === "shell" || (mode == null && Boolean(bundle.meta?.shell));
    state.bundleMode = mode === "chain" ? "chain" : state.shellCube ? "shell" : mode === "demo" ? "demo" : "demo";
    state.shellAnchor = bundle.meta?.shellAnchor || null;
    state.revenueLinks = Array.isArray(bundle.revenueLinks) ? bundle.revenueLinks : [];
    state.usMap = bundle.usMap && typeof bundle.usMap === "object" ? bundle.usMap : null;
    state.cubeShape = 1;
    if (state.shellCube && bundle.meta?.tickerFound === false) {
      state.openTickerMiss = true;
    }

    const viewport = document.getElementById("viewport");
    let ui;
    let dock;
    // [C-MAPDOCK] dock hears the same four hooks as ui; the scene itself never knows about it.
    const sceneApi = createScene(viewport, {
      onSelect: (c, meta) => {
        ui?.onSelect(c, meta || {});
        dock?.onSelect();
      },
      onSelectLink: () => {
        dock?.onSelectLink();
      },
      onFocusChange: () => {
        ui?.onFocusChange();
        dock?.onFocusChange();
      },
      onClear: () => {
        ui?.onClear();
        dock?.onClear();
      },
      onReset: () => {
        ui?.onReset();
        dock?.onReset();
      },
      onHover: (c, local) => ui?.showHover(c, local),
      onShapeChange: (shape) => {
        dock?.onShapeChange?.(shape);
      },
    });
    dock = createDock({
      viewport,
      getSelected: () => (state.selectedId == null ? null : companyById(state.selectedId) || null),
      getSelectedLink: () => revenueLinkByKey(state.selectedLinkKey),
      getUsMap: () => state.usMap,
      getCompany: (id) => companyById(id),
      findCompany: ({ ticker, name }) => state.companies.find((c) => c.ticker === ticker && c.name === name) || state.companies.find((c) => ticker && c.ticker === ticker) || null,
      pick: (id) => sceneApi.selectCompany(id),
    });
    ui = createUI(sceneApi, { dock });
    ui.renderLayers();
    readHash();
    await resolveBicsLabel();
    ui.hydrateFromHash();

    // Demo stills / compositor: `?stills=1` exposes a narrow stills surface only (no ctx).
    if (new URLSearchParams(location.search).get("stills") === "1") {
      window.__sfcStills = {
        selectRevenueLinkAt: (i) => sceneApi.selectRevenueLinkAt(i),
        hoverRevenueLinkAt: (i) => sceneApi.hoverRevenueLinkAt(i),
        hoverCompany: (id) => sceneApi.hoverCompany(id),
        clearFocus: () => sceneApi.clearFocus(),
        goStandardView: (animate) => sceneApi.goStandardView(animate),
      };
    }

    // Reveal only after a successful scene build (avoid empty viewport behind the error).
    // CRITICAL: createScene resized while #app was display:none → 1×1 WebGL buffer.
    // CSS then stretched that pixel into a blurry "cloud". Resize after unhide.
    app.hidden = false;
    bootError.hidden = true;
    sceneApi.resize();
    requestAnimationFrame(() => sceneApi.resize());
    wireShellBackspace();
  } catch (err) {
    app.hidden = true;
    showError(err);
    throw err;
  }
}

function wireShellBackspace() {
  wireBackspaceNav(() => {
    const detail = state.shellCube ? state.companies[0]?.sourceDetail : "";
    return detail ? listHref(detail, "") : "";
  });
}

boot();
