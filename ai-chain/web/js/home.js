/** [C-HOME] BICS L1 gate — fetch sectors, link into /cube?bics= */
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
      a.innerHTML = `<span class="home-sector-en">${escapeHtml(s.name)}</span>` +
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

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

loadL1();
