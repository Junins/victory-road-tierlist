function createMultiSelect(container, { placeholder = "Todos", searchable = false, columns = 1, width = null, onChange }) {
  const state = { options: [], selected: new Set() };

  const wrapper = document.createElement("div");
  wrapper.className = "ms-wrapper";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "ms-btn";

  const panel = document.createElement("div");
  panel.className = "ms-panel";
  const effectiveWidth = width || (columns > 1 ? columns * 160 : null);
  if (effectiveWidth) { panel.style.width = effectiveWidth + "px"; panel.style.minWidth = effectiveWidth + "px"; }

  let searchInput = null;
  if (searchable) {
    searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.className = "ms-search";
    searchInput.placeholder = "Digite para buscar...";
    panel.appendChild(searchInput);
  }

  const list = document.createElement("div");
  list.className = "ms-list";
  if (columns > 1) {
    list.classList.add("ms-list-compact");
    if (columns === 2) list.classList.add("ms-list-compact-2");
    list.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
  }
  panel.appendChild(list);

  wrapper.appendChild(btn);
  wrapper.appendChild(panel);
  container.appendChild(wrapper);

  function norm(o) {
    return typeof o === "object" && o !== null
      ? { value: o.value, label: o.label ?? o.value, icon: o.icon ?? null, search: o.search ?? null }
      : { value: o, label: o, icon: null, search: null };
  }

  function renderLabel() {
    if (state.selected.size === 0) btn.textContent = placeholder;
    else if (state.selected.size === 1) {
      const opt = state.options.find(o => norm(o).value === Array.from(state.selected)[0]);
      btn.textContent = opt ? norm(opt).label : placeholder;
    }
    else btn.textContent = `${placeholder} (${state.selected.size})`;
    btn.classList.toggle("ms-btn-active", state.selected.size > 0);
  }

  function renderList(filterText = "") {
    list.innerHTML = "";
    const ft = filterText.trim().toLowerCase();
    const normalized = state.options.map(norm);
    const opts = ft ? normalized.filter(o => (String(o.label) + " " + (o.search || "")).toLowerCase().includes(ft)) : normalized;

    if (!opts.length) {
      list.innerHTML = `<div class="ms-empty">Nenhuma opção</div>`;
      return;
    }

    opts.forEach(o => {
      const row = document.createElement("label");
      row.className = "ms-item";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = state.selected.has(o.value);
      cb.addEventListener("change", () => {
        if (cb.checked) state.selected.add(o.value); else state.selected.delete(o.value);
        renderLabel();
        onChange(Array.from(state.selected));
      });
      row.appendChild(cb);
      if (o.icon) {
        const img = document.createElement("img");
        img.src = o.icon;
        img.className = "ms-item-icon";
        row.appendChild(img);
      }
      const span = document.createElement("span");
      span.textContent = o.label;
      row.appendChild(span);
      list.appendChild(row);
    });
  }

  btn.addEventListener("click", e => {
    e.stopPropagation();
    document.querySelectorAll(".ms-panel.open").forEach(p => { if (p !== panel) p.classList.remove("open"); });
    const opening = !panel.classList.contains("open");
    panel.classList.toggle("open", opening);
    if (opening && searchInput) searchInput.focus();
  });
  panel.addEventListener("click", e => e.stopPropagation());
  document.addEventListener("click", () => panel.classList.remove("open"));
  if (searchInput) searchInput.addEventListener("input", () => renderList(searchInput.value));

  renderLabel();

  return {
    setOptions(opts) {
      state.options = opts;
      const values = opts.map(o => norm(o).value);
      Array.from(state.selected).forEach(s => { if (!values.includes(s)) state.selected.delete(s); });
      renderLabel();
      renderList(searchInput ? searchInput.value : "");
    },
    getSelected() { return Array.from(state.selected); },
    clear() { state.selected.clear(); renderLabel(); renderList(searchInput ? searchInput.value : ""); },
    close() { panel.classList.remove("open"); }
  };
}
