import { fetchBundle } from "./api.js?v=50";
import { state, readHash, resolveBicsLabel } from "./state.js?v=50";
import { createScene } from "./scene.js?v=50";
import { createUI } from "./ui.js?v=53";

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
    state.shellCube = Boolean(bundle.meta?.shell);
    state.shellAnchor = bundle.meta?.shellAnchor || null;
    if (bundle.meta?.shell && bundle.meta?.tickerFound === false) {
      state.openTickerMiss = true;
    }

    const viewport = document.getElementById("viewport");
    let ui;
    const sceneApi = createScene(viewport, {
      onSelect: (c) => ui?.onSelect(c),
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
  } catch (err) {
    app.hidden = true;
    showError(err);
    throw err;
  }
}

boot();
