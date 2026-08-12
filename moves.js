//lógica
let allMoves = [];
let filteredMoves = [];
let charById = new Map();

let currentMainType = "Shot";

let mvSort = "id-asc";
let mvPageSize = 50; // número ou "all"
let mvCurrentPage = 1;

let mvFilterTension = [];
let mvFilterElement = [];
let mvFilterSubType = [];
let mvSearch = "";

const movesGrid = document.getElementById("moves-grid");
const mvCount = document.getElementById("mv-count");
const mvPagination = document.getElementById("mv-pagination");
const mvSearchInput = document.getElementById("mv-search");
const mvSortSelect = document.getElementById("mv-sort");
const mvPageSizeSelect = document.getElementById("mv-pagesize");
const mvResetBtn = document.getElementById("mv-reset");

//COR
function shade(hex, percent) {
  const f = parseInt(hex.slice(1), 16);
  const t = percent < 0 ? 0 : 255;
  const p = Math.abs(percent);
  const R = f >> 16, G = (f >> 8) & 0x00FF, B = f & 0x0000FF;
  return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
}

//PERSONAGENS ASSOCIADOS
function parseUserIds(str) {
  if (!str) return [];
  return String(str).split(/[,;\n]/).map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
}

function parseUserEntries(str) {
  if (!str) return [];
  const entries = [];
  const regex = /(\d+)\s*(?:\(\s*["“]([^"”]*)["”]\s*\))?/g;
  let m;
  while ((m = regex.exec(str)) !== null) {
    entries.push({ id: parseInt(m[1], 10), note: m[2] ? m[2].trim() : null });
  }
  return entries;
}

function charsForMove(m) {
  return parseUserEntries(m.users)
    .map(e => {
      const c = charById.get(e.id);
      return c ? { char: c, note: e.note } : null;
    })
    .filter(Boolean);
}

function escapeAttr(str) {
  return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

//ABAS (mainType)
document.querySelectorAll("#maintype-tabs .tab").forEach(tab => {
  const icon = VR.mainTypeIcon(tab.dataset.type);
  if (icon) tab.innerHTML = `<img class="tab-icon" src="${icon}">${tab.textContent}`;
  tab.addEventListener("click", () => {
    document.querySelectorAll("#maintype-tabs .tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    currentMainType = tab.dataset.type;
    applyMoveFilters();
  });
});

//FILTROS + ORDENAÇÃO
function applyMoveFilters() {
  let list = allMoves.filter(m => VR.normalizeMainType(m.mainType) === currentMainType);

  if (mvFilterTension.length) list = list.filter(m => mvFilterTension.includes(String(m.tension)));
  if (mvFilterElement.length) list = list.filter(m => mvFilterElement.includes(m.element));
  if (mvFilterSubType.length) list = list.filter(m => VR.splitSubTypes(m.subType).some(s => mvFilterSubType.includes(s)));

  if (mvSearch) {
    const q = mvSearch.toLowerCase();
    list = list.filter(m =>
      m.nameJP?.toLowerCase().includes(q) ||
      m.nameEN?.toLowerCase().includes(q)
    );
  }

  const [key, dir] = mvSort.split("-");
  list = list.slice().sort((a, b) => {
    let va, vb;
    if (key === "name") { va = VR.displayMoveName(a); vb = VR.displayMoveName(b); return dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va); }
    if (key === "element") { va = a.element || ""; vb = b.element || ""; return dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va); }
    if (key === "tension") { va = a.tension; vb = b.tension; }
    if (key === "power") { va = a.basePower; vb = b.basePower; }
    if (key === "id") { va = a.id; vb = b.id; }
    return dir === "asc" ? va - vb : vb - va;
  });

  filteredMoves = list;
  mvCurrentPage = 1;
  render();
}

//CARD
function renderMoveCard(m) {
  const card = document.createElement("div");
  card.className = "move-card";

  const elColor = VR.moveElementColor(m.element);
  const elColorStart = shade(elColor, -0.35);
  const elColorEnd = shade(elColor, -0.7);
  const mtColor = VR.mainTypeColor(m.mainType);
  const mtIcon = VR.mainTypeIcon(m.mainType);
  const label = VR.powerLabel(m.mainType);
  const name = VR.displayMoveName(m);

  const thumbHtml = `
    <div class="move-thumb-wrap">
      <img class="move-thumb" src="${m.thumbnail || ""}" loading="lazy" alt="${name}">
      ${m.videolink ? `<video class="move-video" muted loop playsinline preload="none"></video>` : ""}
    </div>`;

  const chars = charsForMove(m);
  const subtypes = VR.splitSubTypes(m.subType);
  const subtypePills = subtypes.map(st => {
    const icon = VR.subTypeIcon(st);
    return `<span class="move-type-pill move-subtype-pill" style="background:${VR.subTypeColor(st)};color:${VR.subTypeTextColor(st)}">${icon ? `<img src="${icon}">` : ""}${VR.subTypeShort(st)}</span>`;
  }).join("");

  card.innerHTML = `
    ${thumbHtml}
    <div class="move-header" style="background:linear-gradient(120deg, ${elColorStart} 0%, ${elColorEnd} 100%)">
      ${mtIcon ? `<img class="move-header-icon" src="${mtIcon}">` : ""}
      <div class="move-header-text">
        <div class="move-name">${name}</div>
      </div>
      <div class="move-power">
        <span class="move-power-label">${label}</span>
        <span class="move-power-value">${m.basePower}</span>
      </div>
    </div>
    <div class="move-meta-row">
      ${currentMainType === "Goalkeep" ? "" : `<span class="move-type-pill" style="background:${mtColor}">${m.mainType || "—"}</span>`}
      ${subtypePills}
      ${chars.length ? `<button class="move-type-pill move-users-toggle" type="button"><img src="${VR.USER_ICON}" class="move-users-icon">${chars.length} <span class="mu-arrow">▾</span></button>` : ""}
      <span class="move-tension"><span class="move-tension-value">${m.tension}T</span></span>
    </div>
    ${chars.length ? `<div class="move-users-panel">${chars.map(({ char: c, note }) => `
        <div class="move-user-item">
          <img class="ring-thin" style="--ring-color:${VR.elementColor(c.Element)}" src="${c.Image}" loading="lazy">
          <span class="mu-name"${note ? ` title="${escapeAttr(note)}"` : ""}>${VR.displayName(c)}</span>
          ${note ? `<span class="move-user-note-flag" title="${escapeAttr(note)}">!</span>` : ""}
        </div>`).join("")}</div>` : ""}
    <div class="move-desc">${m.description || ""}</div>
  `;

  if (chars.length) {
    const toggleBtn = card.querySelector(".move-users-toggle");
    const panel = card.querySelector(".move-users-panel");
    toggleBtn.addEventListener("click", e => {
      e.stopPropagation();
      const open = panel.classList.toggle("open");
      toggleBtn.classList.toggle("open", open);
    });
  }

  // Hover -> GIF
  if (m.videolink) {
    const wrap = card.querySelector(".move-thumb-wrap");
    const video = card.querySelector(".move-video");
    let started = false;
    wrap.addEventListener("mouseenter", () => {
      if (!started) { video.src = m.videolink; started = true; }
      video.currentTime = 0;
      video.play().catch(() => {});
    });
    wrap.addEventListener("mouseleave", () => {
      video.pause();
    });
  }

  return card;
}

//RENDER
function render() {
  const total = filteredMoves.length;
  const size = mvPageSize === "all" ? total || 1 : mvPageSize;
  const totalPages = Math.max(1, Math.ceil(total / size));
  if (mvCurrentPage > totalPages) mvCurrentPage = totalPages;

  const start = (mvCurrentPage - 1) * size;
  const pageRows = mvPageSize === "all" ? filteredMoves : filteredMoves.slice(start, start + size);

  mvCount.textContent = `${total} move${total === 1 ? "" : "s"} found`;

  movesGrid.innerHTML = "";
  pageRows.forEach(m => movesGrid.appendChild(renderMoveCard(m)));

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  mvPagination.innerHTML = "";

  const prev = document.createElement("button");
  prev.textContent = "← Prev";
  prev.disabled = mvCurrentPage <= 1 || mvPageSize === "all";
  prev.onclick = () => { mvCurrentPage--; render(); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const label = document.createElement("span");
  label.textContent = "Page";

  const pageInput = document.createElement("input");
  pageInput.type = "number";
  pageInput.min = "1";
  pageInput.max = String(totalPages);
  pageInput.value = String(mvCurrentPage);
  pageInput.disabled = mvPageSize === "all";
  const goToPage = () => {
    let p = parseInt(pageInput.value, 10);
    if (isNaN(p)) p = 1;
    p = Math.min(Math.max(1, p), totalPages);
    mvCurrentPage = p;
    render();
  };
  pageInput.addEventListener("change", goToPage);
  pageInput.addEventListener("keydown", e => { if (e.key === "Enter") goToPage(); });

  const of = document.createElement("span");
  of.textContent = `/ ${totalPages}`;

  const next = document.createElement("button");
  next.textContent = "Next →";
  next.disabled = mvCurrentPage >= totalPages || mvPageSize === "all";
  next.onclick = () => { mvCurrentPage++; render(); window.scrollTo({ top: 0, behavior: "smooth" }); };

  mvPagination.appendChild(prev);
  mvPagination.appendChild(label);
  mvPagination.appendChild(pageInput);
  mvPagination.appendChild(of);
  mvPagination.appendChild(next);
}

//FILTROS UI
const filterBtn = document.getElementById("filter-btn");
const filterDropdown = document.getElementById("filter-dropdown");

filterBtn.onclick = e => {
  e.stopPropagation();
  const langDd = document.getElementById("lang-dropdown");
  if (langDd) langDd.classList.remove("open");
  filterDropdown.style.display = filterDropdown.style.display === "flex" ? "none" : "flex";
};
filterDropdown.onclick = e => e.stopPropagation();
document.addEventListener("click", () => { filterDropdown.style.display = "none"; });

const msTension = createMultiSelect(document.getElementById("ms-tension"), {
  placeholder: "Tension", columns: 2, onChange: v => { mvFilterTension = v; applyMoveFilters(); }
});
const msElement = createMultiSelect(document.getElementById("ms-element"), {
  placeholder: "Element", columns: 2, onChange: v => { mvFilterElement = v; applyMoveFilters(); }
});
const msSubType = createMultiSelect(document.getElementById("ms-subtype"), {
  placeholder: "Sub Type", columns: 2, onChange: v => { mvFilterSubType = v; applyMoveFilters(); }
});

mvResetBtn.onclick = () => {
  mvFilterTension = []; mvFilterElement = []; mvFilterSubType = [];
  msTension.clear(); msElement.clear(); msSubType.clear();
  mvSearch = ""; mvSearchInput.value = "";
  applyMoveFilters();
};

let mvSearchDebounce;
mvSearchInput.addEventListener("input", e => {
  clearTimeout(mvSearchDebounce);
  mvSearchDebounce = setTimeout(() => { mvSearch = e.target.value; applyMoveFilters(); }, 150);
});

mvSortSelect.addEventListener("change", e => { mvSort = e.target.value; applyMoveFilters(); });
mvPageSizeSelect.addEventListener("change", e => {
  mvPageSize = e.target.value === "all" ? "all" : parseInt(e.target.value, 10);
  mvCurrentPage = 1;
  render();
});

//IDIOMA
document.addEventListener("vr:langchange", () => { render(); });

//INICIALIZAÇÃO
function populateMoveFilters() {
  const tensions = VR.uniqueMoveValues("tension").map(String).sort((a, b) => Number(a) - Number(b));
  msTension.setOptions(tensions.map(t => ({ value: t, label: `${t}T` })));

  const elements = VR.orderByPriority(VR.uniqueMoveValues("element"), "Element");
  msElement.setOptions(elements.map(e => ({ value: e, label: e, icon: VR.moveElementIcon(e) })));

  const subtypes = VR.orderByPriority(VR.uniqueMoveValues("subType"), "subType");
  msSubType.setOptions(subtypes.map(s => ({ value: s, label: s, icon: VR.subTypeIcon(s) })));
}

VR.load().then(chars => {
  charById = new Map(chars.map(c => [c.id, c]));
  return VR.loadMoves();
}).then(data => {
  allMoves = data;
  populateMoveFilters();
  applyMoveFilters();
});
