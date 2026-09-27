/** UI panels. Concepts: ../CONCEPTS.md ([C-STDVIEW], [C-FOCUS], …). */
import {
  state,
  passesFilter,
  writeHash,
  companyById,
  visibleCompanies,
} from "./state.js";

export function createUI(sceneApi) {
  const layerList = document.getElementById("layerList");
  const detail = document.getElementById("detail");
  const results = document.getElementById("results");
  const statusBar = document.getElementById("statusBar");
  const hoverTip = document.getElementById("hoverTip");
  const navHint = document.getElementById("navHint");
  const helpToggle = document.getElementById("helpToggle");
  let searchTimer = null;

  function renderLayers() {
    layerList.innerHTML = "";
    state.layers.forEach((L, i) => {
      const btn = document.createElement("button");
      btn.className = "layer-btn" + (state.focusLayer === i ? " active" : "");
      btn.type = "button";
      btn.title = L.blurb;
      btn.innerHTML = `<span class="idx">${i + 1}</span><span>${L.name}</span><span class="count">${L.companyCount ?? ""}</span>`;
      btn.addEventListener("click", () => {
        sceneApi.focusSlice(i);
      });
      layerList.appendChild(btn);
    });
  }

  function syncLayerActive() {
    [...layerList.children].forEach((c, j) => {
      c.classList.toggle("active", j === state.focusLayer);
    });
  }

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
      statusBar.textContent = `Slice ${state.focusLayer + 1}: ${L.name} · pulled x∈[1,2] · ${n} visible · C face-on · Esc clears`;
    } else {
      statusBar.textContent = `All slices · ${vis.length} visible · C standard · click plane or [ ] to focus`;
    }
  }

  function setDetailDefault() {
    detail.innerHTML = `<p>Click a company, a slice plane, or a layer on the left. Focus pulls the slice into <strong>x∈[1,2]</strong>. Esc clears selection, then focus.</p>`;
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
    const L = state.layers[c.layer];
    detail.innerHTML = `
      <h3>${c.name}</h3>
      <div class="meta">${L?.name || ""} | ${region} | ${usTag}</div>
      <div class="kv">
        <span>Ticker</span><span>${c.ticker || "—"}</span>
        <span>Country</span><span>${region}</span>
        <span>Revenue (approx.)</span><span>${c.revBn != null ? `$${c.revBn}B / yr` : "—"}</span>
        <span>Size score</span><span>${c.revScore != null ? c.revScore.toFixed(1) + " / 100" : "—"}</span>
        <span>Concentric ring</span><span>${ringLabel(c)}</span>
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


  document.getElementById("explode").addEventListener("click", () => {
    state.exploded = !state.exploded;
    sceneApi.layoutPlanes();
  });

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
      if (state.focusLayer != null) renderLayerRoster(state.focusLayer);
      else setDetailDefault();
      updateStatus();
    },
  };
}
