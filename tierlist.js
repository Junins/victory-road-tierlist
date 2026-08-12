//lógica
let rows = [];
let currentRole = "FW";
let currentMode = "players"; // players | basara | hero
let currentMultiplier = 1.0;
let lastShownChar = null;

const tierBar = document.getElementById("tier-bar");
const tierGrid = document.getElementById("tier-grid");
const statsPanel = document.getElementById("stats-panel");
const statsBasic = document.getElementById("stats-basic");
const statsATDF = document.getElementById("stats-atdf");
const tierSpecialText = document.getElementById("tier-special-text");

const lastSelectedTier = {
  FW: { players: "GO", basara: "Fabled+" },
  MF: { players: "G5+", basara: "Fabled+" },
  DF: { players: "GO", basara: "Fabled+" },
  GK: { players: "G5", basara: "Fabled+" }
};

/* filtros multi-seleção: arrays vazios = sem filtro */
let currentFilterPosition = [];
let currentFilterRoleType = [];
let currentFilterGender = [];
let currentFilterElement = [];
let currentFilterAge = [];
let currentFilterSchool = [];
let currentFilterBody = [];
let currentFilterGame = [];
let currentFilterTeam = [];

const playerLevelSelect = document.getElementById("player-level");

//ESCALA DE STATS
function getScaledStats(obj) {
  const base = {
    Kick: obj.Kick, Control: obj.Control, Technique: obj.Technique,
    Pressure: obj.Pressure, Physical: obj.Physical, Agility: obj.Agility, Intelligence: obj.Intelligence
  };
  const scaled = {};
  for (const k in base) {
    scaled[k] = Math.floor(base[k] * currentMultiplier + 1e-9);
  }
  const derived = VR.calcDerived(scaled);
  const total = Object.values(scaled).reduce((a, b) => a + b, 0);
  return { ...scaled, ...derived, "Total Stats": total };
}

//PAINEL DE STATS
function showStats(obj) {
  lastShownChar = obj;
  statsBasic.innerHTML = "";
  statsATDF.innerHTML = "";

  const s = currentMode === "players" ? getScaledStats(obj) : obj;

  VR.BASIC_STATS.forEach(k => {
    statsBasic.innerHTML += `<div class="stat"><span>${k}</span><strong>${s[k]}</strong></div>`;
  });
  VR.ATDF_STATS.forEach(k => {
    statsATDF.innerHTML += `<div class="stat"><span>${k}</span><strong>${s[k]}</strong></div>`;
  });
}

//TABS
function updateUIVisibility() {
  playerLevelSelect.style.display = currentMode === "players" ? "inline-block" : "none";
}

function updatePositionTabs() {
  const positionTabs = {
    fw: document.getElementById("tab-fw"), mf: document.getElementById("tab-mf"),
    df: document.getElementById("tab-df"), gk: document.getElementById("tab-gk")
  };
  Object.values(positionTabs).forEach(tab => tab.classList.remove("active"));
  switch (currentRole) {
    case "FW": positionTabs.fw.classList.add("active"); break;
    case "MF": positionTabs.mf.classList.add("active"); break;
    case "DF": positionTabs.df.classList.add("active"); break;
    case "GK": positionTabs.gk.classList.add("active"); break;
  }
}

//FILTROS COMUNS
function matchesTeamFilter(c) {
  if (!currentFilterTeam.length) return true;
  const teams = VR.splitTeams(VR.displayTeam(c));
  return teams.some(t => currentFilterTeam.includes(t));
}

function matchesGenderFilter(c) {
  if (!currentFilterGender.length) return true;
  const allowed = currentFilterGender.flatMap(g => VR.genderGroupValues(g));
  return allowed.includes(c.Gender);
}

function applyCommonFilters(chars) {
  if (currentFilterPosition.length) chars = chars.filter(c => currentFilterPosition.includes(c.role));
  if (currentFilterRoleType.length) chars = chars.filter(c => currentFilterRoleType.includes(c.RoleType));
  if (currentFilterGender.length) chars = chars.filter(matchesGenderFilter);
  if (currentFilterElement.length) chars = chars.filter(c => currentFilterElement.includes(c.Element));
  if (currentFilterAge.length) chars = chars.filter(c => currentFilterAge.includes(c.AgeGroup));
  if (currentFilterSchool.length) chars = chars.filter(c => currentFilterSchool.includes(c.SchoolYear));
  if (currentFilterBody.length) chars = chars.filter(c => currentFilterBody.includes(c.Body));
  if (currentFilterGame.length) chars = chars.filter(c => currentFilterGame.includes(c.Game));
  if (currentFilterTeam.length) chars = chars.filter(matchesTeamFilter);
  return chars;
}

function renderCard(p) {
  const c = document.createElement("div");
  c.className = "char-card";
  c.dataset.element = p.Element;
  c.innerHTML = `<img class="ring" style="--ring-color:${VR.elementColor(p.Element)}" src="${p.Image}" loading="lazy"><div class="char-tooltip"><div class="char-name">${VR.displayName(p)}</div><div class="char-element">${p.Element}</div></div>`;
  return c;
}

//BUILD: PLAYERS
function buildPlayers(role) {
  tierBar.innerHTML = "";
  tierGrid.innerHTML = "";
  statsPanel.style.display = "none";

  let chars = rows.filter(r => r.role === role && r.tier);
  chars = applyCommonFilters(chars);

  const tiers = role === "GK" ? ["G5", "G4+", "G4-", "G3+", "G3-", "G2"] :
    role === "MF" ? ["G5+", "G5-", "G4+", "G4-", "G3+", "G3-", "G2+", "G2-"] :
    role === "DF" ? ["GO", "G5 CB", "G5 FB", "G4 CB", "G4 FB", "G3 CB", "G3 FB", "G2"] :
    ["GO", "G5", "G4+", "G4", "G4-", "G3+", "G3-", "G2+", "G2-"];

  tiers.forEach(t => {
    const box = document.createElement("div");
    box.className = "tier-box";
    box.textContent = t;
    if (t === lastSelectedTier[role].players) box.classList.add("active");

    box.onclick = () => {
      tierSpecialText.textContent = "";
      lastSelectedTier[role].players = t;
      Array.from(tierBar.children).forEach(child => child.classList.remove("active"));
      box.classList.add("active");
      tierGrid.innerHTML = "";

      const list = chars.filter(c => c.tier === t);
      if (!list.length) return;

      statsPanel.style.display = "flex";
      if (role === "FW" && t === "GO") {
        tierSpecialText.textContent = "His Abilearn Board gives him better Stats.";
      }
      showStats(list[list.length - 1]);
      list.forEach(p => tierGrid.appendChild(renderCard(p)));
    };
    tierBar.appendChild(box);
  });

  const boxes = tierBar.querySelectorAll(".tier-box");
  let clicked = false;
  boxes.forEach(box => { if (box.textContent === lastSelectedTier[role].players) { box.click(); clicked = true; } });
  if (!clicked && boxes.length > 0) boxes[0].click();
}

//BUILD: HERO
function buildHero(role, selectedTier = null) {
  tierBar.innerHTML = "";
  tierGrid.innerHTML = "";
  statsPanel.style.display = "none";
  tierSpecialText.textContent = "";

  let chars = rows.filter(r => r.role === role);
  chars = applyCommonFilters(chars);

  const roleCfg = VR.HERO_STATS[role];
  Object.keys(roleCfg).forEach(ht => {
    const box = document.createElement("div");
    box.className = "tier-box";
    box.textContent = ht;
    box.onclick = () => {
      Array.from(tierBar.children).forEach(child => child.classList.remove("active"));
      box.classList.add("active");
      tierGrid.innerHTML = "";

      const cfg = roleCfg[ht];
      const baseStats = { ...cfg };
      delete baseStats.ids;
      const derived = VR.calcDerived(baseStats);
      const total = Object.values(baseStats).reduce((a, b) => a + b, 0);
      const statsObj = { ...baseStats, ...derived, "Total Stats": total };

      statsPanel.style.display = "flex";
      showStats(statsObj);

      const filteredChars = chars.filter(c => cfg.ids.includes(c.id));
      filteredChars.forEach(p => tierGrid.appendChild(renderCard(p)));
    };
    tierBar.appendChild(box);
  });

  const boxes = tierBar.querySelectorAll(".tier-box");
  let clicked = false;
  boxes.forEach(box => { if (selectedTier && box.textContent === selectedTier) { box.click(); clicked = true; } });
  if (!clicked && boxes.length > 0) boxes[0].click();
}

//BUILD: BASARA
function buildBasara(role) {
  tierBar.innerHTML = "";
  tierGrid.innerHTML = "";
  statsPanel.style.display = "none";
  tierSpecialText.textContent = "";

  let chars = rows.filter(r => r.role === role);
  chars = applyCommonFilters(chars);

  ["Fabled+", "Fabled-"].forEach(bt => {
    const box = document.createElement("div");
    box.className = "tier-box";
    box.textContent = bt;
    if (bt === lastSelectedTier[role].basara) box.classList.add("active");

    box.onclick = () => {
      lastSelectedTier[role].basara = bt;
      Array.from(tierBar.children).forEach(child => child.classList.remove("active"));
      box.classList.add("active");
      tierGrid.innerHTML = "";

      const cfg = VR.BASARA_STATS[role][bt];
      const baseStats = { ...cfg };
      delete baseStats.tiers;
      const derived = VR.calcDerived(baseStats);
      const total = Object.values(baseStats).reduce((a, b) => a + b, 0);
      const statsObj = { ...baseStats, ...derived, "Total Stats": total };

      statsPanel.style.display = "flex";
      showStats(statsObj);

      const filteredChars = chars.filter(p => cfg.tiers.includes(p.tier));
      filteredChars.forEach(p => tierGrid.appendChild(renderCard(p)));
    };
    tierBar.appendChild(box);
  });

  const boxes = tierBar.querySelectorAll(".tier-box");
  let clicked = false;
  boxes.forEach(box => { if (box.textContent === lastSelectedTier[role].basara) { box.click(); clicked = true; } });
  if (!clicked && boxes.length > 0) boxes[0].click();
}

//CONTROLE GERAL
function build() {
  if (currentMode === "players") buildPlayers(currentRole);
  else if (currentMode === "basara") buildBasara(currentRole);
  else if (currentMode === "hero") buildHero(currentRole);
  updateUIVisibility();
  updatePositionTabs();
}

document.getElementById("tab-players").onclick = () => {
  currentMode = "players";
  document.getElementById("tab-players").classList.add("active");
  document.getElementById("tab-hero").classList.remove("active");
  document.getElementById("tab-basara").classList.remove("active");
  build();
};
document.getElementById("tab-hero").onclick = () => {
  currentMode = "hero";
  document.getElementById("tab-hero").classList.add("active");
  document.getElementById("tab-players").classList.remove("active");
  document.getElementById("tab-basara").classList.remove("active");
  build();
};
document.getElementById("tab-basara").onclick = () => {
  currentMode = "basara";
  document.getElementById("tab-basara").classList.add("active");
  document.getElementById("tab-players").classList.remove("active");
  document.getElementById("tab-hero").classList.remove("active");
  build();
};

document.getElementById("tab-fw").onclick = () => { currentRole = "FW"; build(); };
document.getElementById("tab-mf").onclick = () => { currentRole = "MF"; build(); };
document.getElementById("tab-df").onclick = () => { currentRole = "DF"; build(); };
document.getElementById("tab-gk").onclick = () => { currentRole = "GK"; build(); };

playerLevelSelect.addEventListener("change", e => {
  currentMultiplier = parseFloat(e.target.value);
  if (lastShownChar && currentMode === "players") showStats(lastShownChar);
});

//FILTROS
const filterBtn = document.getElementById("filter-btn");
const filterDropdown = document.getElementById("filter-dropdown");
const resetFiltersBtn = document.getElementById("reset-filters");

filterBtn.onclick = e => {
  e.stopPropagation();
  const langDd = document.getElementById("lang-dropdown");
  if (langDd) langDd.classList.remove("open");
  filterDropdown.style.display = filterDropdown.style.display === "flex" ? "none" : "flex";
};
filterDropdown.onclick = e => e.stopPropagation();
document.addEventListener("click", () => { filterDropdown.style.display = "none"; });

const msGame = createMultiSelect(document.getElementById("ms-game"), {
  placeholder: "Game", onChange: v => { currentFilterGame = v; build(); }
});
const msTeam = createMultiSelect(document.getElementById("ms-team"), {
  placeholder: "Team", searchable: true, width: 240, onChange: v => { currentFilterTeam = v; build(); }
});
const msRole = createMultiSelect(document.getElementById("ms-role"), {
  placeholder: "Position", columns: 2, onChange: v => { currentFilterPosition = v; build(); }
});
const msElement = createMultiSelect(document.getElementById("ms-element"), {
  placeholder: "Element", columns: 2, onChange: v => { currentFilterElement = v; build(); }
});
const msRoleType = createMultiSelect(document.getElementById("ms-roletype"), {
  placeholder: "Role", columns: 2, onChange: v => { currentFilterRoleType = v; build(); }
});
const msGender = createMultiSelect(document.getElementById("ms-gender"), {
  placeholder: "Gender", columns: 2, onChange: v => { currentFilterGender = v; build(); }
});
const msBody = createMultiSelect(document.getElementById("ms-body"), {
  placeholder: "Body", columns: 2, onChange: v => { currentFilterBody = v; build(); }
});
const msAge = createMultiSelect(document.getElementById("ms-age"), {
  placeholder: "Age Group", onChange: v => { currentFilterAge = v; build(); }
});
const msSchool = createMultiSelect(document.getElementById("ms-school"), {
  placeholder: "School Year", onChange: v => { currentFilterSchool = v; build(); }
});

resetFiltersBtn.onclick = () => {
  currentFilterPosition = []; currentFilterRoleType = []; currentFilterGender = []; currentFilterElement = [];
  currentFilterAge = []; currentFilterSchool = []; currentFilterBody = []; currentFilterGame = []; currentFilterTeam = [];
  msGame.clear(); msTeam.clear(); msRole.clear(); msElement.clear(); msRoleType.clear();
  msGender.clear(); msBody.clear(); msAge.clear(); msSchool.clear();
  build();
};

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
  currentFilterTeam = msTeam.getSelected();
}

//BUSCA
const SECRET_IMAGE = "https://dxi4wb638ujep.cloudfront.net/1/prd/assets/4/img/shared/icn_secret_character.png";
const searchBar = document.getElementById("search-bar");
const searchResults = document.getElementById("search-results");

searchBar.addEventListener("input", () => {
  const q = searchBar.value.toLowerCase();
  searchResults.innerHTML = "";
  if (!q) return;

  const filtered = rows.filter(r =>
    r.Image !== SECRET_IMAGE &&
    (r.NameJP?.toLowerCase().includes(q) || r.NameEN?.toLowerCase().includes(q))
  );

  filtered.slice(0, 50).forEach(r => {
    const div = document.createElement("div");
    div.className = "search-item";
    div.innerHTML = `<img class="ring" style="--ring-color:${VR.elementColor(r.Element)}" src="${r.Image}"><span>${VR.displayName(r)} (${VR.getLang() === "EN" ? r.NameJP : r.NameEN || ""})</span>`;
    div.onclick = () => {
      searchResults.innerHTML = "";
      searchBar.value = "";
      currentRole = r.role;
      updatePositionTabs();

      if (currentMode === "players") {
        document.getElementById("tab-players").classList.add("active");
        document.getElementById("tab-basara").classList.remove("active");
        document.getElementById("tab-hero").classList.remove("active");
        lastSelectedTier[r.role].players = r.tier;
        buildPlayers(r.role);
      } else if (currentMode === "basara") {
        document.getElementById("tab-basara").classList.add("active");
        document.getElementById("tab-players").classList.remove("active");
        document.getElementById("tab-hero").classList.remove("active");
        const roleCfg = VR.BASARA_STATS[r.role];
        let foundTier = "Fabled+";
        for (const key in roleCfg) { if (roleCfg[key].tiers.includes(r.tier)) { foundTier = key; break; } }
        lastSelectedTier[r.role].basara = foundTier;
        buildBasara(r.role);
      } else if (currentMode === "hero") {
        document.getElementById("tab-hero").classList.add("active");
        document.getElementById("tab-players").classList.remove("active");
        document.getElementById("tab-basara").classList.remove("active");
        const roleCfg = VR.HERO_STATS[r.role];
        let foundTier = null;
        for (const key in roleCfg) { if (roleCfg[key].ids.includes(r.id)) { foundTier = key; break; } }
        buildHero(r.role, foundTier);
      }
    };
    searchResults.appendChild(div);
  });
});

//IDIOMA
document.addEventListener("vr:langchange", () => {
  populateTeamFilter();
  build();
});

//INICIALIZAÇÃO
VR.load().then(data => {
  rows = data;
  populateDynamicFilters();
  build();
});
