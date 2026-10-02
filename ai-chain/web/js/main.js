import { fetchBundle } from "./api.js";
import { state, readHash, resolveBicsLabel } from "./state.js";
import { createScene } from "./scene.js";
import { createUI } from "./ui.js";

const bootError = document.getElementById("bootError");
const splash = document.getElementById("splash");
const app = document.getElementById("app");

function showError(err) {
  bootError.hidden = false;
  bootError.textContent = String(err && err.stack ? err.stack : err);
  bootError.onclick = () => {
    bootError.hidden = true;
  };
}

/** [C-SPLASH] Fade out after the cube has painted; remove when done. */
function dismissSplash() {
  return new Promise((resolve) => {
    if (!splash || !splash.isConnected) {
      resolve();
      return;
    }
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      splash.remove();
      resolve();
    };
    splash.classList.add("splash-out");
    splash.addEventListener("transitionend", (e) => {
      if (e.propertyName === "opacity") finish();
    });
    setTimeout(finish, 4200);
  });
}

function waitTwoFrames() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

    await waitTwoFrames();
    // [C-SPLASH] Hold logo fully clear for 3s, then fade (4s)
    await sleep(3000);
    await dismissSplash();
  } catch (err) {
    if (splash?.isConnected) splash.remove();
    showError(err);
    throw err;
  }
}

boot();
