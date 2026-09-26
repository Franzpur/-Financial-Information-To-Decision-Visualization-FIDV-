import { fetchBundle } from "./api.js";
import { state, readHash } from "./state.js";
import { createScene } from "./scene.js";
import { createUI } from "./ui.js";

const bootError = document.getElementById("bootError");
const loading = document.getElementById("loading");
const app = document.getElementById("app");

function showError(err) {
  bootError.hidden = false;
  bootError.textContent = String(err && err.stack ? err.stack : err);
  bootError.onclick = () => {
    bootError.hidden = true;
  };
}

window.addEventListener("error", (e) => console.error(e.error || e.message));
window.addEventListener("unhandledrejection", (e) => console.error(e.reason));

async function boot() {
  try {
    const bundle = await fetchBundle();
    state.layers = bundle.layers;
    state.companies = bundle.companies;
    state.countries = bundle.meta?.countries || {};

    app.hidden = false;
    loading.hidden = true;
    loading.style.display = "none";
    loading.remove();

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
    ui.hydrateFromHash();
  } catch (err) {
    loading.hidden = true;
    showError(err);
    throw err;
  }
}

boot();
