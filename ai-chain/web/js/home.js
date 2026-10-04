/** [C-HOME] + [C-SPLASH] BICS L1–L7 gate; splash only on cold `/`. */

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

function currentBics() {
  return new URLSearchParams(location.search).get("bics") || "";
}

function skipSplash() {
  return Boolean(currentBics()) || sessionStorage.getItem("fidvSplashSeen") === "1";
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

function trailHtml(ancestors, node) {
  const bits = [];
  bits.push(`<a href="/">All</a>`);
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

function cellHref(node) {
  if (node.level === 4) return `/list?bics=${encodeURIComponent(node.bicsCode)}`;
  if (node.isLeaf) return `/cube?bics=${encodeURIComponent(node.bicsCode)}`;
  return `/?bics=${encodeURIComponent(node.bicsCode)}`;
}

function renderCells(listEl, children) {
  listEl.innerHTML = "";
  for (const s of children) {
    const a = document.createElement("a");
    a.className = "home-sector";
    a.href = cellHref(s);
    a.title = s.definition || s.name;
    a.innerHTML =
      `<span class="home-sector-en">${escapeHtml(s.name)}</span>` +
      (s.nameZh ? `<span class="home-sector-zh">${escapeHtml(s.nameZh)}</span>` : "") +
      `<span class="home-sector-code">${escapeHtml(s.legalEntityCoord || s.bicsCode)}</span>`;
    listEl.appendChild(a);
  }
}

async function loadBoard() {
  const list = document.getElementById("sectorList");
  const trail = document.getElementById("homeTrail");
  const lede = document.getElementById("homeLede");
  const parent = currentBics();
  const url = parent
    ? `/api/bics/children?parent=${encodeURIComponent(parent)}`
    : "/api/bics/children";
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`children ${res.status}`);
    const data = await res.json();
    const node = data.parent;
    if (node?.level === 4) {
      location.replace(`/list?bics=${encodeURIComponent(node.bicsCode)}`);
      return;
    }
    if (node?.isLeaf) {
      location.replace(`/cube?bics=${encodeURIComponent(node.bicsCode)}`);
      return;
    }
    const children = data.children || [];
    renderCells(list, children);
    if (node) {
      home?.classList.add("home-drilled");
      if (lede) {
        lede.textContent = `Level ${node.level} · ${node.name} · next board, or a level-4 cell opens the company list.`;
      }
      if (trail) {
        trail.hidden = false;
        trail.innerHTML = trailHtml(data.ancestors || [], node);
      }
    } else if (trail) {
      home?.classList.remove("home-drilled");
      trail.hidden = true;
      trail.innerHTML = "";
    }
  } catch (err) {
    list.innerHTML = `<p class="home-error">Failed to load industry coordinates. Is the server running?</p>`;
    console.error(err);
  }
}

async function bootHome() {
  try {
    const loadPromise = loadBoard();
    if (skipSplash()) {
      if (splash?.isConnected) splash.remove();
      revealHome();
      await loadPromise;
      return;
    }
    await waitTwoFrames();
    await sleep(2000);
    await dismissSplash();
    sessionStorage.setItem("fidvSplashSeen", "1");
    revealHome();
    await loadPromise;
  } catch (err) {
    if (splash?.isConnected) splash.remove();
    revealHome();
    throw err;
  }
}

bootHome();
