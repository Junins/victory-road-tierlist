//UI COMPARTILHADA
document.addEventListener("DOMContentLoaded", () => {
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".navlink").forEach(a => {
    const href = a.getAttribute("href");
    if (href === path || (path === "" && href === "index.html")) {
      a.classList.add("active");
    }
  });

  const langBtn = document.getElementById("lang-toggle");
  const langDropdown = document.getElementById("lang-dropdown");
  if (langBtn && langDropdown) {
    langBtn.addEventListener("click", e => {
      e.stopPropagation();
      document.querySelectorAll(".filter-dropdown").forEach(d => { d.style.display = "none"; });
      langDropdown.classList.toggle("open");
    });
    langDropdown.addEventListener("click", e => e.stopPropagation());
    document.addEventListener("click", () => langDropdown.classList.remove("open"));

    const switches = langDropdown.querySelectorAll(".lang-switch");
    const renderSwitches = () => {
      switches.forEach(btn => {
        const key = btn.dataset.langKey;
        const lang = VR.getLangFor(key);
        btn.querySelector(".lang-jp").classList.toggle("active", lang === "JP");
        btn.querySelector(".lang-en").classList.toggle("active", lang === "EN");
      });
    };
    switches.forEach(btn => {
      btn.addEventListener("click", () => {
        VR.toggleLangFor(btn.dataset.langKey);
        renderSwitches();
      });
    });
    renderSwitches();
  }
});
