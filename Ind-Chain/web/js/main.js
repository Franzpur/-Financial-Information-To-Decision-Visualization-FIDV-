import { fetchBundle } from "./api.js?v=51";
import { state, readHash, resolveBicsLabel } from "./state.js?v=55";
import { createScene } from "./scene.js?v=71";
import { createUI } from "./ui.js?v=68";
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
    state.shellAnchor = bundle.meta?.shellAnchor || null;
    state.revenueLinks = Array.isArray(bundle.revenueLinks) ? bundle.revenueLinks : [];
    if (state.shellCube && bundle.meta?.tickerFound === false) {
      state.openTickerMiss = true;
    }

    const viewport = document.getElementById("viewport");
    let ui;
    const sceneApi = createScene(viewport, {
      onSelect: (c, meta) => ui?.onSelect(c, meta || {}),
      onFocusChange: () => ui?.onFocusChange(),
      onClear: () => ui?.onClear(),
      onReset: () => ui?.onReset(),
      onHover: (c, local) => ui?.showHover(c, local),
    });
    ui = createUI(sceneApi);
    ui.renderLayers();
    readHash();
    await resolveBicsLabel();
    ui.hydrateFromHash();

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
