
const VR = (function () {

//CONFIG
  const SHEET_ID  = "1JCUvtXL8Bgmr7L1BtUYxNHERsZ_5BIJvU6Rlr5ot2Yk";
  const GID_MAIN  = "1077770618";
  const GID_STATS = "425305907";
  const GID_MOVES = "1043985764";
  const URL_MAIN  = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${GID_MAIN}`;
  const URL_STATS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${GID_STATS}`;
  const URL_MOVES = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${GID_MOVES}`;

  const BASIC_STATS = ["Kick", "Control", "Technique", "Pressure", "Physical", "Agility", "Intelligence", "Total Stats"];
  const ATDF_STATS  = ["Shot AT", "Focus AT", "Focus DF", "Scramble AT", "Scramble DF", "Castle Wall DF", "KP"];

//SPECIAL MOVES
  const MOVE_ELEMENT_COLORS = { Fire: "#e5483b", Forest: "#4caf50", Mountain: "#e0932e", Wind: "#3aa0e0", Void: "#8b5cf6" };
  const MAIN_TYPE_COLORS   = { Shot: "#7a1616", Offense: "#1d5c2e", Offence: "#1d5c2e", Defense: "#17395c", Defence: "#17395c", Goalkeep: "#a69b5c" };
  const SUB_TYPE_COLORS    = {
    "Counter Shot": "#a02222", "Long Shot": "#1f7a45", "Shot Block": "#25408f",
    "Keshin": "#5a2f85", "Soul": "#8fd3e8", "Catch": "#a68b1f", "Punch": "#a68b1f"
  };
  const SUB_TYPE_DARK_TEXT = { "Soul": true };
  function subTypeTextColor(t) { return SUB_TYPE_DARK_TEXT[t] ? "#0a0f1c" : "#fff"; }

  function normKey(s) { return String(s || "").replace(/\s+/g, "").toLowerCase(); }

  const MAIN_TYPE_ICON_FILE = { shot: "Shot.png", offense: "Offence.png", offence: "Offence.png", defense: "Defence.png", defence: "Defence.png", goalkeep: "Goalkeep.png" };
  const SUB_TYPE_ICON_PATH = {
    countershot: "assets/subType/CounterShot.png",
    longshot: "assets/subType/LongShot.png",
    shotblock: "assets/subType/ShotBlock.png",
    keshin: "assets/subType/keshin.png",
    soul: "assets/subType/soul.png",
    catch: "assets/mainType/Goalkeep.png",
    punch: "assets/mainType/Goalkeep.png"
  };
  const ELEMENT_ICON_FILE   = { fire: "Fire.png", forest: "Forest.png", mountain: "Mountain.png", wind: "Wind.png" }; // Void ainda não tem ícone

  function mainTypeColor(t) { return MAIN_TYPE_COLORS[t] || "#3a4568"; }
  function subTypeColor(t) { return SUB_TYPE_COLORS[t] || "#8595bd"; }
  function moveElementColor(el) { return MOVE_ELEMENT_COLORS[el] || "#3a4568"; }

  const SUB_TYPE_SHORT = { "Counter Shot": "Counter", "Long Shot": "Long", "Shot Block": "Block" };
  function subTypeShort(t) { return SUB_TYPE_SHORT[t] || t; }

  const USER_ICON = "assets/icons/user.png";
  function mainTypeIcon(t) { const f = MAIN_TYPE_ICON_FILE[normKey(t)]; return f ? `assets/mainType/${f}` : null; }
  function subTypeIcon(t) { return SUB_TYPE_ICON_PATH[normKey(t)] || null; }
  function moveElementIcon(el) { const f = ELEMENT_ICON_FILE[normKey(el)]; return f ? `assets/element/${f}` : null; }

  function splitSubTypes(str) {
    if (!str) return [];
    return String(str).split(",").map(s => s.trim()).filter(Boolean);
  }

//ORDENAÇÃO FIXA DE FILTROS
  const FILTER_ORDER = {
    Position: ["GK", "FW", "MF", "DF"],
    Element: ["Wind", "Forest", "Fire", "Mountain", "Void"],
    Body: ["Average", "Small", "Large", "Tall", "Muscular", "Stocky"],
    RoleType: ["Player", "Manager", "Coordinator"],
    subType: ["Long Shot", "Shot Block", "Counter Shot", "Override", "Catch", "Punch", "Keshin", "Soul"],
    Game: [
      "Inazuma Eleven",
      "Inazuma Eleven 2: Firestorm / Blizzard",
      "Inazuma Eleven 3: Lightning Bolt / Bomb Blast / Team Ogre Attacks!",
      "Inazuma Eleven GO: Light / Shadow",
      "Inazuma Eleven GO Chrono Stones: Wildfire / Thunderflash",
      "Inazuma Eleven GO Galaxy: Big Bang / Supernova",
      "Inazuma Eleven Ares",
      "Inazuma Eleven Orion",
      "Inazuma Eleven: Victory Road"
    ]
  };

  function orderByPriority(values, priorityKey) {
    const order = FILTER_ORDER[priorityKey] || [];
    return values.slice().sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      if (ia === -1 && ib === -1) return String(a).localeCompare(String(b));
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }

  const GENDER_GROUPS = { "Male": ["Male"], "Female": ["Female"], "Unknown/Other": ["Neutral", "Unknown"] };
  function genderGroupOf(g) {
    for (const key in GENDER_GROUPS) { if (GENDER_GROUPS[key].includes(g)) return key; }
    return g;
  }
  function genderGroupValues(groupLabel) { return GENDER_GROUPS[groupLabel] || [groupLabel]; }

  function powerLabel(mainType) {
    const k = normKey(mainType);
    return (k === "defense" || k === "defence" || k === "goalkeep") ? "DF" : "AT";
  }

  function normalizeMainType(t) {
    const k = normKey(t);
    if (k === "shot") return "Shot";
    if (k === "offense" || k === "offence") return "Offence";
    if (k === "defense" || k === "defence") return "Defence";
    if (k === "goalkeep") return "Goalkeep";
    return t;
  }

  function displayMoveName(move) {
    if (!move) return "";
    return getLangFor("hissatsu") === "EN" ? (move.nameEN || move.nameJP || "") : (move.nameJP || move.nameEN || "");
  }

  let moveRows = [];
  let movesLoadPromise = null;

  function loadMoves() {
    if (movesLoadPromise) return movesLoadPromise;
    movesLoadPromise = fetch(URL_MOVES)
      .then(r => r.text())
      .then(text => {
        const json = JSON.parse(text.substring(47, text.length - 2));
        const headers = json.table.cols.map(c => c.label);
        moveRows = json.table.rows.map((row, i) => {
          const values = {};
          headers.forEach((h, idx) => { values[h] = row.c[idx]?.v ?? ""; });
          return {
            id: values.ID !== undefined && values.ID !== "" ? Number(values.ID) : i,
            nameJP: values.nameJP,
            nameEN: values.nameEN,
            thumbnail: values.thumbnail,
            videolink: values.videolink,
            mainType: values.mainType,
            subType: values.subType,
            element: values.element,
            tension: Number(values.tension) || 0,
            basePower: Number(values.basePower) || 0,
            users: values.users,
            description: values.description
          };
        }).filter(m => m.nameJP || m.nameEN);
        return moveRows;
      });
    return movesLoadPromise;
  }

  function uniqueMoveValues(field) {
    const set = new Set();
    moveRows.forEach(m => {
      if (!m[field]) return;
      if (field === "subType") splitSubTypes(m[field]).forEach(s => set.add(s));
      else set.add(m[field]);
    });
    return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)));
  }

//TIERS ORIGINAIS
  const GK_TIERS = [{ tier: "G5", Total: 689, KP: 955 }, { tier: "G4+", Total: 674, KP: 940 }, { tier: "G3+", Total: 674, KP: 934 }, { tier: "G4-", Total: 667, KP: 935 }, { tier: "G3-", Total: 667, KP: 925 }, { tier: "G2", Total: 656, KP: 913 }];
  const FW_TIERS = [{ tier: "G5", Shot: 236, Total: 692 }, { tier: "G4+", Shot: 233, Total: 682 }, { tier: "G4", Shot: 232, Total: 671 }, { tier: "G4-", Shot: 230, Total: 666 }, { tier: "G3+", Shot: 226, Total: 692 }, { tier: "G3-", Shot: 224, Total: 683 }, { tier: "G2+", Shot: 221, Total: 672 }, { tier: "G2-", Shot: 219, Total: 665 }];
  const MF_TIERS = [
    { tier: "G5+", FocusAT: 281, FocusDF: 189, Total: 693 }, { tier: "G5-", FocusAT: 277, FocusDF: 259, Total: 683 }, { tier: "G4+", FocusAT: 275, FocusDF: 255, Total: 672 },
    { tier: "G3+", FocusAT: 273, FocusDF: 253, Total: 667 }, { tier: "G4-", FocusAT: 273, FocusDF: 251, Total: 693 }, { tier: "G3-", FocusAT: 270, FocusDF: 248, Total: 684 },
    { tier: "G2+", FocusAT: 266, FocusDF: 244, Total: 672 }, { tier: "G2-", FocusAT: 264, FocusDF: 242, Total: 667 }
  ];
  const DF_TIERS = [
    { tier: "GO", CastleWallDF: 214, FocusDF: 254, Total: 690 }, { tier: "G5 CB", CastleWallDF: 211, FocusDF: 248, Total: 675 }, { tier: "G5 FB", CastleWallDF: 207, FocusDF: 254, Total: 691 },
    { tier: "G4 CB", CastleWallDF: 209, FocusDF: 248, Total: 671 }, { tier: "G4 FB", CastleWallDF: 203, FocusDF: 248, Total: 674 },
    { tier: "G3 CB", CastleWallDF: 208, FocusDF: 244, Total: 663 }, { tier: "G3 FB", CastleWallDF: 202, FocusDF: 248, Total: 672 }, { tier: "G2", CastleWallDF: 199, FocusDF: 246, Total: 663 }
  ];

//HERO BASARA CONFIG
  const HERO_STATS = {
    FW: {
      "HERO+": { ids: [2, 1105, 1122, 1135, 1772, 1916, 2080, 2437, 2704, 2715, 3506, 3516, 3522, 3572, 3649, 3960, 4086, 4087, 4116, 4127, 4139, 4539, 4556, 4651, 4827, 4858, 5762], Kick: 203, Control: 193, Technique: 176, Pressure: 148, Physical: 142, Agility: 142, Intelligence: 156 },
      "HERO-": { ids: [1166, 3483, 4390, 4416, 4434, 4860, 4893, 4912], Kick: 191, Control: 187, Technique: 170, Pressure: 152, Physical: 148, Agility: 142, Intelligence: 168 }
    },
    MF: {
      "HERO+": { ids: [1134, 2436, 3963, 4053, 4598, 4650, 4725, 4770], Kick: 168, Control: 193, Technique: 194, Pressure: 148, Physical: 142, Agility: 142, Intelligence: 175 },
      "HERO-": { ids: [15, 29, 185, 1068, 1776, 2438, 4060, 4859, 4864], Kick: 175, Control: 187, Technique: 183, Pressure: 152, Physical: 154, Agility: 142, Intelligence: 168 }
    },
    DF: {
      "HERO+": { ids: [5, 6, 1248, 1773, 2440, 3486, 4410, 4861], Kick: 151, Control: 158, Technique: 159, Pressure: 170, Physical: 176, Agility: 152, Intelligence: 191 }
    },
    GK: {
      "HERO+": { ids: [1, 20, 1070, 1226, 1957, 2373, 2439, 2441, 2678, 3961], Kick: 151, Control: 162, Technique: 151, Pressure: 165, Physical: 176, Agility: 186, Intelligence: 162 },
      "HERO-": { ids: [4652, 4863], Kick: 151, Control: 162, Technique: 151, Pressure: 170, Physical: 176, Agility: 179, Intelligence: 162 }
    }
  };

  const BASARA_STATS = {
    FW: {
      "Fabled+": { tiers: ["GO", "G5", "G4+", "G4", "G4-"], Kick: 243, Control: 231, Technique: 211, Pressure: 177, Physical: 170, Agility: 170, Intelligence: 187 },
      "Fabled-": { tiers: ["G3+", "G3-", "G2+", "G2-"], Kick: 229, Control: 224, Technique: 204, Pressure: 182, Physical: 177, Agility: 170, Intelligence: 201 }
    },
    GK: {
      "Fabled+": { tiers: ["G5", "G4+", "G4-", "G2"], Kick: 180, Control: 194, Technique: 182, Pressure: 197, Physical: 211, Agility: 222, Intelligence: 194 },
      "Fabled-": { tiers: ["G3+", "G3-"], Kick: 180, Control: 194, Technique: 182, Pressure: 204, Physical: 211, Agility: 214, Intelligence: 194 }
    },
    MF: {
      "Fabled+": { tiers: ["G5+", "G5-", "G4+", "G3+"], Kick: 201, Control: 231, Technique: 232, Pressure: 177, Physical: 170, Agility: 170, Intelligence: 210 },
      "Fabled-": { tiers: ["G4-", "G3-", "G2+", "G2-"], Kick: 210, Control: 224, Technique: 219, Pressure: 182, Physical: 184, Agility: 170, Intelligence: 201 }
    },
    DF: {
      "Fabled+": { tiers: ["GO", "G5 CB", "G4 CB", "G3 CB"], Kick: 172, Control: 180, Technique: 177, Pressure: 211, Physical: 219, Agility: 182, Intelligence: 243 },
      "Fabled-": { tiers: ["G5 FB", "G4 FB", "G3 FB", "G2"], Kick: 180, Control: 189, Technique: 190, Pressure: 204, Physical: 211, Agility: 182, Intelligence: 229 }
    }
  };

  const CUSTOM_TIERS = { FW: "G3-", MF: "G3-", DF: "G4 FB", GK: "G3+" };

//ELEMENTOS
  const ELEMENT_COLORS = {
    Wind: "#33d9ff",
    Forest: "#7cff6b",
    Fire: "#ff6b5b",
    Mountain: "#e0a458"
  };
  function elementColor(el) {
    return ELEMENT_COLORS[el] || "#3a4568";
  }

  function splitTeams(str) {
    if (!str) return [];
    return String(str).split("\n").map(s => s.trim()).filter(Boolean);
  }

//FÓRMULAS
  function floor(v) { return Math.floor(v); }

  function calcDerived(s) {
    return {
      "Shot AT": floor(s.Kick + s.Control),
      "Focus AT": floor((s.Control + s.Technique) + (s.Kick * 0.5)),
      "Focus DF": floor((s.Intelligence + s.Technique) + (s.Agility * 0.5)),
      "Scramble AT": floor(s.Physical + s.Intelligence),
      "Scramble DF": floor(s.Pressure + s.Intelligence),
      "Castle Wall DF": floor(s.Physical + s.Pressure),
      "KP": floor((s.Agility * 4) + (s.Physical * 3) + (s.Pressure * 2))
    };
  }

  function calcTier(obj) {
    if (obj.role === "GK") { for (const t of GK_TIERS) if (obj["Total Stats"] >= t.Total && obj.KP >= t.KP) return t.tier; }
    else if (obj.role === "FW") { for (const t of FW_TIERS) if (obj["Shot AT"] >= t.Shot && obj["Total Stats"] >= t.Total) return t.tier; }
    else if (obj.role === "MF") { for (const t of MF_TIERS) if (obj["Focus AT"] >= t.FocusAT && obj["Focus DF"] >= t.FocusDF && obj["Total Stats"] >= t.Total) return t.tier; }
    else if (obj.role === "DF") { for (const t of DF_TIERS) if (obj["Castle Wall DF"] >= t.CastleWallDF && obj["Focus DF"] >= t.FocusDF && obj["Total Stats"] >= t.Total) return t.tier; }
    return null;
  }

  function getImagePath(id, url) {
    const localImages = [];
    if (localImages.includes(Number(id))) return `images/${id}.png`;
    return url;
  }

  const LANG_KEYS = { name: "vr_lang_name", team: "vr_lang_team", hissatsu: "vr_lang_hissatsu" };

  function getLangFor(key) {
    return localStorage.getItem(LANG_KEYS[key] || key) || "JP";
  }
  function setLangFor(key, l) {
    localStorage.setItem(LANG_KEYS[key] || key, l);
    document.dispatchEvent(new CustomEvent("vr:langchange", { detail: { key, lang: l } }));
  }
  function toggleLangFor(key) {
    setLangFor(key, getLangFor(key) === "JP" ? "EN" : "JP");
  }

  function getLang() { return getLangFor("name"); }
  function setLang(l) { setLangFor("name", l); }
  function toggleLang() { toggleLangFor("name"); }

  function displayName(obj) {
    if (!obj) return "";
    return getLangFor("name") === "EN" ? (obj.NameEN || obj.NameJP || "") : (obj.NameJP || obj.NameEN || "");
  }
  function displayTeam(obj) {
    if (!obj) return "";
    return getLangFor("team") === "EN" ? (obj.TeamEN || obj.TeamJP || "") : (obj.TeamJP || obj.TeamEN || "");
  }

//CARREGAMENTO DOS DADOS
  let rows = [];
  let loadPromise = null;

  function load() {
    if (loadPromise) return loadPromise;
    loadPromise = fetch(URL_MAIN)
      .then(r => r.text())
      .then(text => {
        const json = JSON.parse(text.substring(47, text.length - 2));
        const headers = json.table.cols.map(c => c.label);

        rows = json.table.rows.map(row => {
          const values = {};
          headers.forEach((h, i) => { values[h] = row.c[i]?.v ?? ""; });

          const obj = {
            id: Number(values.ID),
            role: values.Position,
            RoleType: values.Role, // Player / Coordinator / Manager
            name: values.NameJP,
            NameJP: values.NameJP,
            NameEN: values.NameEN,
            "Name(Localised)": values.NameEN,
            Gender: values.Gender,
            Element: values.Element,
            AgeGroup: values["Age Group"],
            SchoolYear: values["School Year"],
            TeamEN: values.TeamEN || values.TeamJP || "",
            TeamJP: values.TeamJP || values.TeamEN || "",
            Game: values.Game,
            Body: values.Body,
            Image: getImagePath(values.ID, values.Image),
            Kick: Number(values.Kick),
            Control: Number(values.Control),
            Technique: Number(values.Technique),
            Pressure: Number(values.Pressure),
            Physical: Number(values.Physical),
            Agility: Number(values.Agility),
            Intelligence: Number(values.Intelligence)
          };

          const derived = calcDerived(obj);
          Object.assign(obj, derived);
          obj["Total Stats"] = obj.Kick + obj.Control + obj.Technique + obj.Pressure + obj.Physical + obj.Agility + obj.Intelligence;
          obj.tier = calcTier(obj);

          // Forçar GO do FW
          if (obj.id === 4858 && obj.role === "FW") obj.tier = "GO";

          return obj;
        });

        /* CUSTOM AVATAR */
        ["FW", "MF", "DF", "GK"].forEach(role => {
          rows.unshift({
            id: 0, role, RoleType: "",
            name: "Custom Avatar", NameJP: "Custom Avatar", NameEN: "Custom Avatar", "Name(Localised)": "Custom Avatar",
            Gender: "", Element: "", AgeGroup: "", SchoolYear: "",
            TeamEN: "", TeamJP: "", Game: "", Body: "",
            Image: "assets/icons/0.png",
            Kick: 0, Control: 0, Technique: 0, Pressure: 0, Physical: 0, Agility: 0, Intelligence: 0,
            "Shot AT": 0, "Focus AT": 0, "Focus DF": 0, "Scramble AT": 0, "Scramble DF": 0, "Castle Wall DF": 0, KP: 0,
            "Total Stats": 0,
            tier: CUSTOM_TIERS[role]
          });
        });

        return rows;
      });
    return loadPromise;
  }

  function uniqueValues(field, excludeCustom = true) {
    const set = new Set();
    rows.forEach(r => {
      if (excludeCustom && r.id === 0) return;
      if (!r[field]) return;
      if (field === "TeamEN" || field === "TeamJP" || field === "Team") {
        splitTeams(r[field]).forEach(t => { if (t !== "?" && t !== "???") set.add(t); });
      } else {
        const v = r[field];
        if (v !== "?" && v !== "???") set.add(v);
      }
    });
    return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)));
  }

  let teamPairCache = null;
  function buildTeamPairs() {
    if (teamPairCache) return teamPairCache;
    const jpToEn = new Map();
    const enToJp = new Map();
    rows.forEach(r => {
      const jp = splitTeams(r.TeamJP);
      const en = splitTeams(r.TeamEN);
      const len = Math.max(jp.length, en.length);
      for (let i = 0; i < len; i++) {
        const j = jp[i], e = en[i];
        if (j && e) { jpToEn.set(j, e); enToJp.set(e, j); }
      }
    });
    teamPairCache = { jpToEn, enToJp };
    return teamPairCache;
  }
  function teamSearchText(teamName) {
    const { jpToEn, enToJp } = buildTeamPairs();
    const alt = jpToEn.get(teamName) || enToJp.get(teamName) || "";
    return alt ? `${teamName} ${alt}` : teamName;
  }

  return {
    URL_MAIN, URL_STATS, BASIC_STATS, ATDF_STATS,
    GK_TIERS, FW_TIERS, MF_TIERS, DF_TIERS,
    HERO_STATS, BASARA_STATS, CUSTOM_TIERS,
    calcDerived, calcTier, load,
    get rows() { return rows; },
    uniqueValues, splitTeams, teamSearchText, elementColor,
    getLang, setLang, toggleLang, getLangFor, setLangFor, toggleLangFor, displayName, displayTeam,
    orderByPriority, genderGroupOf, genderGroupValues,
    loadMoves, uniqueMoveValues, displayMoveName, splitSubTypes, subTypeTextColor,
    get moves() { return moveRows; },
    mainTypeColor, subTypeColor, moveElementColor, subTypeShort, USER_ICON,
    mainTypeIcon, subTypeIcon, moveElementIcon, powerLabel, normalizeMainType
  };
})();
