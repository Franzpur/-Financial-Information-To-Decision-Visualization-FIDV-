/** [C-HOME] + [C-SPLASH] BICS L1 gate; splash only on this page. */

const splash = document.getElementById("splash");
const home = document.getElementById("home");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitTwoFrames() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

/** Fade out splash (~4s); remove when done. */
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

function revealHome() {
  if (!home) return;
  home.hidden = false;
  home.classList.remove("home-pending");
  home.classList.add("home-ready");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function loadL1() {
  const list = document.getElementById("sectorList");
  const enter = document.getElementById("enterCube");
  try {
    const res = await fetch("/api/bics/l1");
    if (!res.ok) throw new Error(`l1 ${res.status}`);
    const data = await res.json();
    const sectors = data.sectors || [];
    list.innerHTML = "";
    for (const s of sectors) {
      const a = document.createElement("a");
      a.className = "home-sector" + (s.bicsCode === "19" ? " home-sector-primary" : "");
      a.href = `/cube?bics=${encodeURIComponent(s.bicsCode)}`;
      a.title = s.definition || s.name;
      a.innerHTML =
        `<span class="home-sector-en">${escapeHtml(s.name)}</span>` +
        (s.nameZh ? `<span class="home-sector-zh">${escapeHtml(s.nameZh)}</span>` : "") +
        `<span class="home-sector-code">${escapeHtml(s.legalEntityCoord || s.bicsCode)}</span>`;
      list.appendChild(a);
    }
    const tech = sectors.find((s) => s.bicsCode === "19");
    if (tech && enter) {
      enter.href = `/cube?bics=19`;
      enter.textContent = `Enter ${tech.name} cube`;
    }
  } catch (err) {
    list.innerHTML = `<p class="home-error">Failed to load industry coordinates. Is the server running?</p>`;
    console.error(err);
  }
}

async function bootHome() {
  try {
    // Prefetch sectors under the splash; reveal only after splash ends.
    const loadPromise = loadL1();
    await waitTwoFrames();
    // [C-SPLASH] Hold logo clear ~2s, then fade (~4s)
    await sleep(2000);
    await dismissSplash();
    revealHome();
    await loadPromise;
  } catch (err) {
    if (splash?.isConnected) splash.remove();
    revealHome();
    throw err;
  }
}

bootHome();
