/** UI panels. Concepts: ../CONCEPTS.md ([C-STDVIEW], [C-FOCUS], [C-COMPANY-ZOOM], …). */
import {
  state,
  passesFilter,
  writeHash,
  companyById,
} from "./state.js?v=55";
import { formatCoord } from "./coords.js?v=51";
import { createCompanyFocusStage } from "./bondChart.js?v=2";
import { STDVIEW_MS } from "./scene.js?v=71";

export function createUI(sceneApi) {
  const detail = document.getElementById("detail");
  const results = document.getElementById("results");
  const hoverTip = document.getElementById("hoverTip");
  const navHint = document.getElementById("navHint");
  const helpToggle = document.getElementById("helpToggle");
  const viewport = document.getElementById("viewport");
  const companyFocus = document.getElementById("companyFocus");
  const companyFocusBody = document.getElementById("companyFocusBody");
  const companyFocusClose = document.getElementById("companyFocusClose");
  let searchTimer = null;

  // Layer list chrome removed — focus via plane click / [ ] / search / right float roster.
  function renderLayers() {}
  function syncLayerActive() {}

  function updateStatus() {
    /* Bottom status line removed — detail / focus chrome carry state. */
  }

  function setDetailDefault() {
    detail.innerHTML = `<p>Click a company or slice frame to keep that slice; others hide in place. Shift+frame pins more. Esc clears selection, then focus, then pins. A/F hides rings/slices or axes.</p>`;
  }

  function ringLabel(c) {
    if (c.ring == null) return "—";
    if (c.ring === 10) return "center (100)";
    if (c.ring === 9) return "innermost 90–99.9 (ring 9)";
    if (c.ring === 0) return "outermost 0–9.9 (ring 0)";
    return `${c.ring * 10}–${c.ring * 10 + 9.9} (ring ${c.ring})`;
  }

  function formatRevenue(c) {
    if (c.revBn == null) return "—";
    const n = Number(c.revBn);
    if (!Number.isFinite(n)) return "—";
    const abs = Math.abs(n);
    const digits = abs >= 1 ? 1 : 3;
    const sign = n < 0 ? "-" : "";
    return `${sign}$${abs.toFixed(digits)}B`;
  }

  function detailMarkup(c) {
    const region = state.countries[c.country] || c.country;
    const usTag = c.country === "US" ? "US" : "Non-US";
    const L = c.layer != null ? state.layers[c.layer] : null;
    const ringRow = state.shellCube
      ? ""
      : `<span>Concentric ring</span><span>${ringLabel(c)}</span>`;
    const metaBits = [L?.name || c.note || "", region, usTag].filter(Boolean).join(" | ");
    return `
      <h3>${c.name}</h3>
      <div class="meta">${metaBits}</div>
      <div class="kv">
        <span>Ticker</span><span>${c.ticker || "—"}</span>
        <span>Country</span><span>${region}</span>
        <span>Revenue (approx.)</span><span>${formatRevenue(c)}</span>
        <span>${c.side || c.linkPct != null ? "Link score" : "Size score"}</span><span>${c.revScore != null ? c.revScore.toFixed(1) + " / 100" : "—"}</span>
        ${c.side ? `<span>Chain side</span><span>${c.side}</span>` : ""}
        ${c.linkPct != null ? `<span>Link %</span><span>${Number(c.linkPct).toFixed(2)}%</span>` : ""}
        <span>Position (s, x, y)</span><span>${formatCoord(c.coord)}</span>
        ${ringRow}
        <span>Alphabet link</span><span>${c.valueM != null ? `~$${c.valueM.toFixed(0)}M (GOOGL_SUPPLY)` : "Not in quantified supplier table"}</span>
        <span>Data source</span><span>${c.source || "—"}</span>
        <span>Source note</span><span>${c.sourceDetail || "—"}</span>
        <span>Role note</span><span>${c.note || "—"}</span>
      </div>
    `;
  }

  function renderDetail(c) {
    detail.innerHTML = detailMarkup(c);
  }

  const { exitCompanyZoom, scheduleCompanyZoom } = createCompanyFocusStage({
    viewport,
    companyFocus,
    companyFocusBody,
    companyFocusClose,
    detailMarkup,
    renderDetail,
    onRequestClearFocus: () => sceneApi.clearFocus(),
  });

  function renderLayerRoster(layerIdx) {
    const L = state.layers[layerIdx];
    const rows = state.companies.filter((c) => c.layer === layerIdx && passesFilter(c));
    const list = rows
      .map((c) => {
        const src = c.valueM != null ? `GOOGL_SUPPLY (~$${c.valueM.toFixed(0)}M)` : c.source;
        return `<tr data-id="${c.id}"><td>${c.name}</td><td>${c.ticker || "—"}</td><td>$${(c.revBn ?? 0).toFixed(1)}B</td><td>${(c.revScore ?? 0).toFixed(0)}</td><td>${src}</td></tr>`;
      })
      .join("");
    detail.innerHTML = `
      <h3>${L.name}</h3>
      <div class="meta">${L.blurb} | ${rows.length} companies on this slice</div>
      <div class="kv" style="grid-template-columns:1fr; gap:8px;">
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
          <thead>
            <tr style="color:#9aa6b5; text-align:left;">
              <th style="padding:3px 4px;">Company</th>
              <th style="padding:3px 4px;">Ticker</th>
              <th style="padding:3px 4px;">Rev</th>
              <th style="padding:3px 4px;">Score</th>
              <th style="padding:3px 4px;">Source</th>
            </tr>
          </thead>
          <tbody>${list}</tbody>
        </table>
      </div>
    `;
    detail.querySelectorAll("tbody tr").forEach((tr) => {
      tr.style.cursor = "pointer";
      tr.addEventListener("click", () => {
        sceneApi.selectCompany(Number(tr.dataset.id));
      });
    });
  }

  const FILTER_LABELS = {
    all: "All",
    us: "US only",
    intl: "Non-US only",
  };
  const cubeFilter = document.getElementById("cubeFilter");
  const cubeFilterFace = document.getElementById("cubeFilterFace");
  const cubeFilterPanel = document.getElementById("cubeFilterPanel");
  const cubeFilterLabel = document.getElementById("cubeFilterLabel");

  function syncFilterUI() {
    const mode = state.filterMode;
    if (cubeFilterLabel) {
      cubeFilterLabel.textContent = FILTER_LABELS[mode] || FILTER_LABELS.all;
    }
    cubeFilterPanel?.querySelectorAll(".cube-filter-opt").forEach((b) => {
      b.classList.toggle("is-on", b.dataset.filter === mode);
    });
  }

  function placeAltUnderFilter() {
    const alt = document.getElementById("cubeAltFunc");
    if (!alt) return;
    const viewport = document.getElementById("viewport");
    const filterOpen =
      cubeFilter?.classList.contains("is-open") &&
      cubeFilterPanel &&
      !cubeFilterPanel.hidden;
    if (!filterOpen || !viewport) {
      alt.style.top = "";
      return;
    }
    // Measure after panel is laid out (hidden→shown).
    requestAnimationFrame(() => {
      const el = document.getElementById("cubeAltFunc");
      if (!el || !cubeFilterPanel || cubeFilterPanel.hidden) {
        if (el) el.style.top = "";
        return;
      }
      const gap = 4;
      const vRect = viewport.getBoundingClientRect();
      const pRect = cubeFilterPanel.getBoundingClientRect();
      el.style.top = `${Math.round(pRect.bottom - vRect.top + gap)}px`;
    });
  }

  function setCubeFilterOpen(open) {
    if (!cubeFilter || !cubeFilterFace || !cubeFilterPanel) return;
    cubeFilter.classList.toggle("is-open", open);
    cubeFilterFace.setAttribute("aria-expanded", open ? "true" : "false");
    cubeFilterPanel.hidden = !open;
    placeAltUnderFilter();
  }

  function applyFilterMode(mode) {
    if (!["all", "us", "intl"].includes(mode)) return;
    state.filterMode = mode;
    syncFilterUI();
    setCubeFilterOpen(false);
    sceneApi.applyVisibility();
    updateStatus();
    writeHash();
    if (state.focusLayer != null) renderLayerRoster(state.focusLayer);
  }

  syncFilterUI();
  cubeFilterFace?.addEventListener("click", (e) => {
    e.stopPropagation();
    setCubeFilterOpen(cubeFilterPanel?.hidden !== false);
  });
  cubeFilterPanel?.addEventListener("click", (e) => {
    const opt = e.target.closest(".cube-filter-opt");
    if (!opt) return;
    applyFilterMode(opt.dataset.filter);
  });
  // [C-ALT] Alternative functions (A/F) — may stay open together with Filter.
  const cubeAlt = document.getElementById("cubeAltFunc");
  const cubeAltFace = document.getElementById("cubeAltFace");
  const cubeAltPanel = document.getElementById("cubeAltPanel");

  function syncAltUI() {
    const ringsOn = Boolean(state.altHideRingsSlices);
    const axesOn = Boolean(state.altHideAxes);
    cubeAlt?.classList.toggle("is-active", ringsOn || axesOn);
    cubeAltPanel?.querySelectorAll(".cube-filter-opt").forEach((b) => {
      const key = b.dataset.alt;
      const on =
        key === "ringsSlices" ? ringsOn : key === "axes" ? axesOn : false;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function setCubeAltOpen(open) {
    if (!cubeAlt || !cubeAltFace || !cubeAltPanel) return;
    cubeAlt.classList.toggle("is-open", open);
    cubeAltFace.setAttribute("aria-expanded", open ? "true" : "false");
    cubeAltPanel.hidden = !open;
  }

  function applyAltToggle(key) {
    if (key === "ringsSlices") {
      state.altHideRingsSlices = !state.altHideRingsSlices;
    } else if (key === "axes") {
      state.altHideAxes = !state.altHideAxes;
    } else return;
    syncAltUI();
    sceneApi.applyVisibility();
    if (key === "axes") sceneApi.layoutPlanes();
  }

  function hitFilterChrome(t) {
    return Boolean(cubeFilter?.contains(t));
  }
  function hitAltChrome(t) {
    return Boolean(cubeAlt?.contains(t));
  }

  // Outside click: close only the panel whose chrome was not hit (peer chrome ≠ outside).
  document.addEventListener("pointerdown", (e) => {
    const t = e.target;
    if (cubeFilter && cubeFilterPanel && !cubeFilterPanel.hidden) {
      if (!hitFilterChrome(t) && !hitAltChrome(t)) setCubeFilterOpen(false);
    }
    if (cubeAlt && cubeAltPanel && !cubeAltPanel.hidden) {
      if (!hitAltChrome(t) && !hitFilterChrome(t)) setCubeAltOpen(false);
    }
  });

  syncAltUI();
  cubeAltFace?.addEventListener("click", (e) => {
    e.stopPropagation();
    setCubeAltOpen(cubeAltPanel?.hidden !== false);
  });
  cubeAltPanel?.addEventListener("click", (e) => {
    const opt = e.target.closest(".cube-filter-opt");
    if (!opt) return;
    applyAltToggle(opt.dataset.alt);
  });

  const D_SNAPS = [25, 50, 75, 100, 125, 150, 175, 200];
  const D_SNAP_EPS = 4;
  const gapD = document.getElementById("gapD");
  const gapDPct = document.getElementById("gapDPct");
  const gapDThumb = document.getElementById("gapDThumb");
  const gapDTrack = document.getElementById("gapDTrack");

  function snapDPct(pct) {
    const n = Number(pct);
    for (const s of D_SNAPS) {
      if (Math.abs(n - s) <= D_SNAP_EPS) return s;
    }
    return Math.max(0, Math.min(200, Math.round(n)));
  }

  function placeDThumb(pct) {
    if (!gapDThumb || !gapD) return;
    const min = Number(gapD.min) || 0;
    const max = Number(gapD.max) || 200;
    const t = max === min ? 0 : (pct - min) / (max - min);
    gapDThumb.style.left = `${t * 100}%`;
  }

  function applyDPct(rawPct) {
    const snapped = snapDPct(rawPct);
    gapD.value = String(snapped);
    state.d = snapped / 100;
    gapDPct.textContent = `${snapped}%`;
    placeDThumb(snapped);
    sceneApi.layoutPlanes();
    return snapped;
  }

  function pctFromClientX(clientX) {
    if (!gapDTrack) return Math.round(state.d * 100);
    const rect = gapDTrack.getBoundingClientRect();
    const min = Number(gapD.min) || 0;
    const max = Number(gapD.max) || 200;
    const t = rect.width <= 0 ? 0 : Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return min + t * (max - min);
  }

  function syncGapDUI() {
    const pct = Math.round(state.d * 100);
    gapD.value = String(pct);
    gapDPct.textContent = `${pct}%`;
    placeDThumb(pct);
  }
  syncGapDUI();

  // Drag the inverted triangle itself (native range is visual track only).
  let dDragging = false;
  function onDPointerMove(e) {
    if (!dDragging) return;
    applyDPct(pctFromClientX(e.clientX));
  }
  function onDPointerUp(e) {
    if (!dDragging) return;
    dDragging = false;
    gapDThumb?.classList.remove("is-dragging");
    try {
      gapDThumb?.releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
    window.removeEventListener("pointermove", onDPointerMove);
    window.removeEventListener("pointerup", onDPointerUp);
    window.removeEventListener("pointercancel", onDPointerUp);
  }
  gapDThumb?.addEventListener("pointerdown", (e) => {
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    dDragging = true;
    gapDThumb.classList.add("is-dragging");
    gapDThumb.setPointerCapture?.(e.pointerId);
    applyDPct(pctFromClientX(e.clientX));
    window.addEventListener("pointermove", onDPointerMove);
    window.addEventListener("pointerup", onDPointerUp);
    window.addEventListener("pointercancel", onDPointerUp);
  });
  gapDTrack?.addEventListener("pointerdown", (e) => {
    if (e.target === gapDThumb) return;
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    applyDPct(pctFromClientX(e.clientX));
  });
  gapD?.addEventListener("input", () => {
    applyDPct(Number(gapD.value));
  });

  navHint.classList.toggle("hidden", !state.helpOpen);

  document.getElementById("search").addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      results.innerHTML = "";
      if (!q) return;
      state.companies
        .filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.ticker && c.ticker.toLowerCase().includes(q))
        )
        .slice(0, 12)
        .forEach((c) => {
          const b = document.createElement("button");
          b.type = "button";
          b.textContent = `${c.name}${c.ticker ? "  " + c.ticker : ""}`;
          b.addEventListener("click", () =>
            sceneApi.selectCompany(c.id, { standardView: true })
          );
          results.appendChild(b);
        });
    }, 120);
  });

  helpToggle.addEventListener("click", () => {
    state.helpOpen = !state.helpOpen;
    navHint.classList.toggle("hidden", !state.helpOpen);
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
      const ae = document.activeElement;
      if (
        ae &&
        (ae.tagName === "INPUT" ||
          ae.tagName === "TEXTAREA" ||
          ae.tagName === "SELECT" ||
          ae.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      helpToggle.click();
    }
  });

  return {
    renderLayers,
    syncLayerActive,
    updateStatus,
    setDetailDefault,
    renderDetail,
    renderLayerRoster,
    showHover(c, local) {
      if (!c || !local) {
        hoverTip.hidden = true;
        return;
      }
      hoverTip.hidden = false;
      hoverTip.textContent = `${c.name}${c.ticker ? " · " + c.ticker : ""}`;
      hoverTip.style.left = `${local.x}px`;
      hoverTip.style.top = `${local.y}px`;
    },
    onSelect(c, meta = {}) {
      syncLayerActive();
      updateStatus();
      writeHash();
      results.innerHTML = "";
      hoverTip.hidden = true;
      // Search path only: standard view then [C-COMPANY-ZOOM] (+ bond chart when present).
      // Plane pick / layer roster stay owner-side: right detail, no zoom.
      if (meta.standardView && state.focusLayer != null) {
        exitCompanyZoom();
        renderLayerRoster(state.focusLayer);
        scheduleCompanyZoom(c, STDVIEW_MS);
        return;
      }
      exitCompanyZoom();
      renderDetail(c);
    },
    onFocusChange() {
      syncLayerActive();
      exitCompanyZoom();
      if (state.focusLayer != null) renderLayerRoster(state.focusLayer);
      else setDetailDefault();
      updateStatus();
      writeHash();
    },
    onClear() {
      syncLayerActive();
      exitCompanyZoom();
      setDetailDefault();
      updateStatus();
      writeHash();
      hoverTip.hidden = true;
    },
    onReset() {
      syncLayerActive();
      exitCompanyZoom();
      setDetailDefault();
      updateStatus();
      writeHash();
    },
    hydrateFromHash() {
      syncFilterUI();
      syncGapDUI();
      syncLayerActive();
      sceneApi.applyVisibility();
      if (state.selectedId != null) {
        const c = companyById(state.selectedId);
        if (c) {
          sceneApi.selectCompany(c.id);
          return;
        }
      }
      if (state.openTickerMiss && state.openTicker) {
        detail.innerHTML = `<p><strong>${state.openTicker}</strong> was not found in the BICS member library. The standard cube shell is empty — return to the list or try another ticker.</p>`;
        updateStatus();
        return;
      }
      if (state.focusLayer != null) renderLayerRoster(state.focusLayer);
      else setDetailDefault();
      updateStatus();
    },
  };
}
