//DATABASE
let allRows = [];
let filteredRows = [];

let sortKey = "id";
let sortDir = "asc";

let currentPage = 1;
let pageSize = 50;

let viewMode = "list";

let dbFilterRole = [];
let dbFilterRoleType = [];
let dbFilterGender = [];
let dbFilterElement = [];
let dbFilterAge = [];
let dbFilterSchool = [];
let dbFilterBody = [];
let dbFilterGame = [];
let dbFilterTeam = [];
let dbSearch = "";

let charMoveMap = new Map();

const dbTbody = document.getElementById("db-tbody");
const dbCards = document.getElementById("db-cards");
const dbGrid = document.getElementById("db-grid");
const dbTableWrap = document.getElementById("db-table-wrap");
const dbCount = document.getElementById("db-count");
const dbPagination = document.getElementById("db-pagination");
const pageSizeSelect = document.getElementById("db-pagesize");
const searchInput = document.getElementById("db-search");
const resetBtn = document.getElementById("db-reset");

//FILTROS
function matchesTeamFilter(r) {
  if (!dbFilterTeam.length) return true;
  const teams = VR.splitTeams(VR.displayTeam(r));
  return teams.some(t => dbFilterTeam.includes(t));
}

function matchesGenderFilter(r) {
  if (!dbFilterGender.length) return true;
  const allowed = dbFilterGender.flatMap(g => VR.genderGroupValues(g));
  return allowed.includes(r.Gender);
}

function applyFilters() {
  let list = allRows.filter(r => r.id !== 0 && r.NameJP !== "???" && r.NameEN !== "???"); // sem Custom Avatar / placeholders

  if (dbFilterRole.length) list = list.filter(r => dbFilterRole.includes(r.role));
  if (dbFilterRoleType.length) list = list.filter(r => dbFilterRoleType.includes(r.RoleType));
  if (dbFilterGender.length) list = list.filter(matchesGenderFilter);
  if (dbFilterElement.length) list = list.filter(r => dbFilterElement.includes(r.Element));
  if (dbFilterAge.length) list = list.filter(r => dbFilterAge.includes(r.AgeGroup));
  if (dbFilterSchool.length) list = list.filter(r => dbFilterSchool.includes(r.SchoolYear));
  if (dbFilterBody.length) list = list.filter(r => dbFilterBody.includes(r.Body));
  if (dbFilterGame.length) list = list.filter(r => dbFilterGame.includes(r.Game));
  if (dbFilterTeam.length) list = list.filter(matchesTeamFilter);

  if (dbSearch) {
    const q = dbSearch.toLowerCase();
    list = list.filter(r =>
      r.NameJP?.toLowerCase().includes(q) ||
      r.NameEN?.toLowerCase().includes(q)
    );
  }

  list.sort((a, b) => {
    let va = sortKey === "name" ? VR.displayName(a) : sortKey === "displayTeam" ? VR.displayTeam(a) : a[sortKey];
    let vb = sortKey === "name" ? VR.displayName(b) : sortKey === "displayTeam" ? VR.displayTeam(b) : b[sortKey];
    if (typeof va === "string" || typeof vb === "string") {
      va = (va || "").toString(); vb = (vb || "").toString();
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    va = va || 0; vb = vb || 0;
    return sortDir === "asc" ? va - vb : vb - va;
  });

  filteredRows = list;
  currentPage = 1;
  render();
}

//RENDER
function render() {
  const total = filteredRows.length;
  const size = pageSize === "all" ? total || 1 : pageSize;
  const totalPages = Math.max(1, Math.ceil(total / size));
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * size;
  const pageRows = pageSize === "all" ? filteredRows : filteredRows.slice(start, start + size);

  dbCount.textContent = `${total} character${total === 1 ? "" : "s"} found`;

  dbTableWrap.classList.toggle("hidden", viewMode !== "list");
  dbCards.classList.toggle("hidden", viewMode !== "list");
  dbGrid.classList.toggle("active", viewMode === "grid");

  if (viewMode === "list") {
    renderTable(pageRows);
    renderCards(pageRows);
  } else {
    renderGrid(pageRows);
  }

  renderPagination(totalPages);
  updateSortIndicators();
}

function teamCell(r) {
  const team = VR.displayTeam(r);
  return `<span class="team-cell">${team || "—"}</span>`;
}

function renderTable(pageRows) {
  dbTbody.innerHTML = "";
  pageRows.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.id}</td>
      <td><div class="db-row-img"><img class="ring" style="--ring-color:${VR.elementColor(r.Element)}" src="${r.Image}" loading="lazy"><span>${VR.displayName(r)}</span></div></td>
      <td>${r.role}</td>
      <td>${r.RoleType || "—"}</td>
      <td>${teamCell(r)}</td>
      <td>${r.Game || "—"}</td>
      <td>${r.tier ? `<span class="tier-pill">${r.tier}</span>` : "—"}</td>
    `;
    tr.onclick = () => openModal(r);
    dbTbody.appendChild(tr);
  });
}

function renderCards(pageRows) {
  dbCards.innerHTML = "";
  pageRows.forEach(r => {
    const card = document.createElement("div");
    card.className = "db-card";
    card.innerHTML = `
      <img class="ring" style="--ring-color:${VR.elementColor(r.Element)}" src="${r.Image}" loading="lazy">
      <div class="db-card-info">
        <div class="db-card-name">#${r.id} · ${VR.displayName(r)}</div>
        <div class="db-card-meta">${r.role} · ${r.RoleType || "—"} · <span class="team-cell">${VR.displayTeam(r) || "—"}</span> · ${r.tier || "—"}</div>
      </div>
    `;
    card.onclick = () => openModal(r);
    dbCards.appendChild(card);
  });
}

function renderGrid(pageRows) {
  dbGrid.innerHTML = "";
  pageRows.forEach(r => {
    const c = document.createElement("div");
    c.className = "char-card";
    c.innerHTML = `<img class="ring" style="--ring-color:${VR.elementColor(r.Element)}" src="${r.Image}" loading="lazy"><div class="char-tooltip"><div class="char-name">#${r.id} ${VR.displayName(r)}</div><div class="char-element">${r.Element || ""} · ${VR.displayTeam(r) || "—"}</div></div>`;
    c.onclick = () => openModal(r);
    dbGrid.appendChild(c);
  });
}

function renderPagination(totalPages) {
  dbPagination.innerHTML = "";

  const prev = document.createElement("button");
  prev.textContent = "← Prev";
  prev.disabled = currentPage <= 1 || pageSize === "all";
  prev.onclick = () => { currentPage--; render(); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const label = document.createElement("span");
  label.textContent = "Page";

  const pageInput = document.createElement("input");
  pageInput.type = "number";
  pageInput.min = "1";
  pageInput.max = String(totalPages);
  pageInput.value = String(currentPage);
  pageInput.disabled = pageSize === "all";
  const goToPage = () => {
    let p = parseInt(pageInput.value, 10);
    if (isNaN(p)) p = 1;
    p = Math.min(Math.max(1, p), totalPages);
    currentPage = p;
    render();
  };
  pageInput.addEventListener("change", goToPage);
  pageInput.addEventListener("keydown", e => { if (e.key === "Enter") goToPage(); });

  const of = document.createElement("span");
  of.textContent = `/ ${totalPages}`;

  const next = document.createElement("button");
  next.textContent = "Next →";
  next.disabled = currentPage >= totalPages || pageSize === "all";
  next.onclick = () => { currentPage++; render(); window.scrollTo({ top: 0, behavior: "smooth" }); };

  dbPagination.appendChild(prev);
  dbPagination.appendChild(label);
  dbPagination.appendChild(pageInput);
  dbPagination.appendChild(of);
  dbPagination.appendChild(next);
}

function updateSortIndicators() {
  document.querySelectorAll(".db-table thead th").forEach(th => {
    th.classList.remove("sort-asc", "sort-desc");
    if (th.dataset.key === sortKey) th.classList.add(sortDir === "asc" ? "sort-asc" : "sort-desc");
  });
}

//ORDENAÇÃO
document.querySelectorAll(".db-table thead th").forEach(th => {
  th.addEventListener("click", () => {
    const key = th.dataset.key;
    if (sortKey === key) sortDir = sortDir === "asc" ? "desc" : "asc";
    else { sortKey = key; sortDir = key === "id" ? "asc" : (key === "name" || key === "role" || key === "displayTeam" || key === "Game" || key === "Body" || key === "tier" ? "asc" : "desc"); }
    applyFilters();
  });
});

//VIEW TOGGLE
const viewListBtn = document.getElementById("view-list");
const viewGridBtn = document.getElementById("view-grid");
viewListBtn.onclick = () => { viewMode = "list"; viewListBtn.classList.add("active"); viewGridBtn.classList.remove("active"); render(); };
viewGridBtn.onclick = () => { viewMode = "grid"; viewGridBtn.classList.add("active"); viewListBtn.classList.remove("active"); render(); };

//TAMANHO DA PÁGINA
pageSizeSelect.onchange = e => {
  pageSize = e.target.value === "all" ? "all" : parseInt(e.target.value, 10);
  currentPage = 1;
  render();
};

//MODAL
const modalOverlay = document.getElementById("modal-overlay");
const modalImg = document.getElementById("modal-img");
const modalName = document.getElementById("modal-name");
const modalMeta = document.getElementById("modal-meta");
const modalStatsBasic = document.getElementById("modal-stats-basic");
const modalStatsATDF = document.getElementById("modal-stats-atdf");
const modalMovesSection = document.getElementById("modal-moves-section");
const modalMovesList = document.getElementById("modal-moves-list");

let currentModalChar = null;

function openModal(r) {
  currentModalChar = r;
  renderModal();
  modalOverlay.classList.add("open");
}
function closeModal() {
  modalOverlay.classList.remove("open");
  currentModalChar = null;
}
function renderModal() {
  const r = currentModalChar;
  if (!r) return;
  modalImg.src = r.Image;
  modalImg.style.setProperty("--ring-color", VR.elementColor(r.Element));
  modalName.textContent = `#${r.id} ${VR.displayName(r)}`;
  modalMeta.innerHTML = `${r.role} · <span class="team-cell">${VR.displayTeam(r) || "—"}</span> · ${r.Game || "—"} · ${r.Body || "—"} · ${r.tier ? "Tier " + r.tier : "No tier"}`;

  modalStatsBasic.innerHTML = "";
  VR.BASIC_STATS.forEach(k => {
    modalStatsBasic.innerHTML += `<div class="stat"><span>${k}</span><strong>${r[k]}</strong></div>`;
  });
  modalStatsATDF.innerHTML = "";
  VR.ATDF_STATS.forEach(k => {
    modalStatsATDF.innerHTML += `<div class="stat"><span>${k}</span><strong>${r[k]}</strong></div>`;
  });

  const moves = charMoveMap.get(r.id) || [];
  modalMovesSection.style.display = moves.length ? "" : "none";
  modalMovesList.innerHTML = moves.map(m => `
    <div class="modal-move-item" style="--ring-color:${VR.moveElementColor(m.element)}">
      <div class="modal-move-name">${VR.displayMoveName(m)}</div>
      <span class="move-type-pill modal-move-pill" style="background:${VR.mainTypeColor(m.mainType)}">${m.mainType || "—"}</span>
    </div>
  `).join("");
}

document.getElementById("modal-close").onclick = closeModal;
modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

//FILTROS PAINEL
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

const msGame = createMultiSelect(document.getElementById("ms-game"), {
  placeholder: "Game", onChange: v => { dbFilterGame = v; applyFilters(); }
});
const msTeam = createMultiSelect(document.getElementById("ms-team"), {
  placeholder: "Team", searchable: true, width: 240, onChange: v => { dbFilterTeam = v; applyFilters(); }
});
const msRole = createMultiSelect(document.getElementById("ms-role"), {
  placeholder: "Position", columns: 2, onChange: v => { dbFilterRole = v; applyFilters(); }
});
const msElement = createMultiSelect(document.getElementById("ms-element"), {
  placeholder: "Element", columns: 2, onChange: v => { dbFilterElement = v; applyFilters(); }
});
const msRoleType = createMultiSelect(document.getElementById("ms-roletype"), {
  placeholder: "Role", columns: 2, onChange: v => { dbFilterRoleType = v; applyFilters(); }
});
const msGender = createMultiSelect(document.getElementById("ms-gender"), {
  placeholder: "Gender", columns: 2, onChange: v => { dbFilterGender = v; applyFilters(); }
});
const msBody = createMultiSelect(document.getElementById("ms-body"), {
  placeholder: "Body", columns: 2, onChange: v => { dbFilterBody = v; applyFilters(); }
});
const msAge = createMultiSelect(document.getElementById("ms-age"), {
  placeholder: "Age Group", onChange: v => { dbFilterAge = v; applyFilters(); }
});
const msSchool = createMultiSelect(document.getElementById("ms-school"), {
  placeholder: "School Year", onChange: v => { dbFilterSchool = v; applyFilters(); }
});

resetBtn.onclick = () => {
  dbFilterRole = []; dbFilterRoleType = []; dbFilterGender = []; dbFilterElement = [];
  dbFilterAge = []; dbFilterSchool = []; dbFilterBody = []; dbFilterGame = []; dbFilterTeam = [];
  msGame.clear(); msTeam.clear(); msRole.clear(); msElement.clear(); msRoleType.clear();
  msGender.clear(); msBody.clear(); msAge.clear(); msSchool.clear();
  dbSearch = "";
  clearTimeout(searchDebounce);
  searchInput.value = "";
  applyFilters();
};

let searchDebounce;
searchInput.addEventListener("input", e => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => { dbSearch = e.target.value; applyFilters(); }, 150);
});

//POPULAÇÃO DINAMICA
function populateDynamicFilters() {
  msGame.setOptions(VR.orderByPriority(VR.uniqueValues("Game"), "Game"));
  msRole.setOptions(VR.orderByPriority(["FW", "MF", "DF", "GK"], "Position"));
  msElement.setOptions(VR.orderByPriority(VR.uniqueValues("Element").filter(e => e !== "Void"), "Element"));
  msRoleType.setOptions(VR.orderByPriority(VR.uniqueValues("RoleType"), "RoleType"));
  msGender.setOptions(availableGenderGroups());
  msBody.setOptions(VR.orderByPriority(VR.uniqueValues("Body"), "Body"));
  msAge.setOptions(VR.uniqueValues("AgeGroup"));
  msSchool.setOptions(VR.uniqueValues("SchoolYear"));
  populateTeamFilter();
}

function availableGenderGroups() {
  const raw = new Set(VR.uniqueValues("Gender"));
  return ["Male", "Female", "Unknown/Other"].filter(g => VR.genderGroupValues(g).some(r => raw.has(r)));
}

function populateTeamFilter() {
  const field = VR.getLangFor("team") === "EN" ? "TeamEN" : "TeamJP";
  const teams = VR.uniqueValues(field);
  msTeam.setOptions(teams.map(t => ({ value: t, label: t, search: VR.teamSearchText(t) })));
  dbFilterTeam = msTeam.getSelected();
}

//IDIOMA
document.addEventListener("vr:langchange", () => {
  populateTeamFilter();
  applyFilters();
  if (currentModalChar) renderModal();
});

//INICIALIZAÇÃO
function parseUserIds(str) {
  if (!str) return [];
  return String(str).split(/[,;\n]/).map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
}

VR.load().then(data => {
  allRows = data;
  return VR.loadMoves();
}).then(moves => {
  charMoveMap = new Map();
  moves.forEach(m => {
    parseUserIds(m.users).forEach(id => {
      if (!charMoveMap.has(id)) charMoveMap.set(id, []);
      charMoveMap.get(id).push(m);
    });
  });
  populateDynamicFilters();
  applyFilters();
});
