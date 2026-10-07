/** UI panels. Concepts: ../CONCEPTS.md ([C-STDVIEW], [C-FOCUS], …). */
import {
  state,
  passesFilter,
  writeHash,
  companyById,
  visibleCompanies,
} from "./state.js?v=50";
import { formatCoord } from "./coords.js?v=50";

export function createUI(sceneApi) {
  const detail = document.getElementById("detail");
  const results = document.getElementById("results");
  const statusBar = document.getElementById("statusBar");
  const hoverTip = document.getElementById("hoverTip");
  const navHint = document.getElementById("navHint");
  const helpToggle = document.getElementById("helpToggle");
  let searchTimer = null;

  // Layer list chrome removed — focus via plane click / [ ] / search / right float roster.
  function renderLayers() {}
  function syncLayerActive() {}

  function updateStatus() {
    const vis = visibleCompanies();
    if (state.selectedId != null) {
      const c = companyById(state.selectedId);
      const L = c ? state.layers[c.layer] : null;
      statusBar.textContent = c
        ? `Selected · ${c.name}${c.ticker ? " (" + c.ticker + ")" : ""} · ${L?.name || ""} · Esc clears selection`
        : `Selected · Esc clears`;
      return;
    }
    if (state.focusLayer != null) {
      const L = state.layers[state.focusLayer];
      const n = vis.filter((c) => c.layer === state.focusLayer).length;
      statusBar.textContent = `Slice ${state.focusLayer + 1}: ${L.name} · slice stays · cube exits −x (left) · ${n} visible · C face-on · Esc clears`;
    } else {
      const gate = state.bicsCode
        ? ` · BICS L${state.bicsLevel || "?"} ${state.bicsCode}${state.bicsName ? " " + state.bicsName : ""}`
        : "";
      statusBar.textContent = `All slices · ${vis.length} visible · C standard · click plane or [ ] to focus${gate}`;
    }
  }

  function setDetailDefault() {
    detail.innerHTML = `<p>Click a company or slice. The slice stays; the rest of the cube shifts left along <strong>−x</strong> and fades. Esc clears selection, then focus.</p>`;
  }

  function ringLabel(c) {
    if (c.ring == null) return "—";
    if (c.ring === 10) return "center (100)";
    if (c.ring === 9) return "innermost 90–99.9 (ring 9)";
    if (c.ring === 0) return "outermost 0–9.9 (ring 0)";
    return `${c.ring * 10}–${c.ring * 10 + 9.9} (ring ${c.ring})`;
  }

  function renderDetail(c) {
    const region = state.countries[c.country] || c.country;
    const usTag = c.country === "US" ? "US" : "Non-US";
    const L = c.layer != null ? state.layers[c.layer] : null;
    const ringRow = state.shellCube
      ? ""
      : `<span>Concentric ring</span><span>${ringLabel(c)}</span>`;
    const metaBits = [L?.name || c.note || "", region, usTag].filter(Boolean).join(" | ");
    detail.innerHTML = `
      <h3>${c.name}</h3>
      <div class="meta">${metaBits}</div>
      <div class="kv">
        <span>Ticker</span><span>${c.ticker || "—"}</span>
        <span>Country</span><span>${region}</span>
        <span>Revenue (approx.)</span><span>${c.revBn != null ? `$${c.revBn}B / yr` : "—"}</span>
        <span>Size score</span><span>${c.revScore != null ? c.revScore.toFixed(1) + " / 100" : "—"}</span>
        <span>Position (s, x, y)</span><span>${formatCoord(c.coord)}</span>
        ${ringRow}
        <span>Alphabet link</span><span>${c.valueM != null ? `~$${c.valueM.toFixed(0)}M (GOOGL_SUPPLY)` : "Not in quantified supplier table"}</span>
        <span>Data source</span><span>${c.source || "—"}</span>
        <span>Source note</span><span>${c.sourceDetail || "—"}</span>
        <span>Role note</span><span>${c.note || "—"}</span>
      </div>
    `;
  }

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

  document.querySelectorAll(".chip[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.filterMode = btn.dataset.filter;
      document.querySelectorAll(".chip[data-filter]").forEach((b) =>
        b.classList.toggle("active", b === btn)
      );
      sceneApi.applyVisibility();
      updateStatus();
      writeHash();
      if (state.focusLayer != null) renderLayerRoster(state.focusLayer);
    });
  });

  document.getElementById("resetCam").addEventListener("click", () => {
    sceneApi.resetCamera();
    syncLayerActive();
    setDetailDefault();
    updateStatus();
    writeHash();
  });

  // [C-STDVIEW]
  document.getElementById("standardView").addEventListener("click", () => {
    sceneApi.goStandardView();
  });

  const gapD = document.getElementById("gapD");
  const gapDPct = document.getElementById("gapDPct");
  function syncGapDUI() {
    const pct = Math.round(state.d * 100);
    gapD.value = String(pct);
    gapDPct.textContent = `${pct}%`;
  }
  syncGapDUI();
  gapD.addEventListener("input", () => {
    state.d = Number(gapD.value) / 100;
    gapDPct.textContent = `${gapD.value}%`;
    sceneApi.layoutPlanes();
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
          b.addEventListener("click", () => sceneApi.selectCompany(c.id));
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
    onSelect(c) {
      syncLayerActive();
      renderDetail(c);
      updateStatus();
      writeHash();
    },
    onFocusChange() {
      syncLayerActive();
      if (state.focusLayer != null) renderLayerRoster(state.focusLayer);
      updateStatus();
      writeHash();
    },
    onClear() {
      syncLayerActive();
      setDetailDefault();
      updateStatus();
      writeHash();
      hoverTip.hidden = true;
    },
    onReset() {
      syncLayerActive();
      setDetailDefault();
      updateStatus();
      writeHash();
    },
    hydrateFromHash() {
      document.querySelectorAll(".chip[data-filter]").forEach((b) => {
        b.classList.toggle("active", b.dataset.filter === state.filterMode);
      });
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
