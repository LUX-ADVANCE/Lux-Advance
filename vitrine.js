(() => {
  "use strict";

  const safeFields = "id,nome_exibicao,idade,cidade,estado,pais,descricao,foto_url,galeria_urls,verificacao_status,plano_codigo,plano_nome,selo_codigo,categoria_catalogo,criado_em";
  const state = { profiles: [], category: "todas", city: "", plan: "todos" };
  const grid = document.getElementById("vitrineGrid");
  const count = document.getElementById("resultCount");
  const cityFilter = document.getElementById("cityFilter");
  const contactDialog = document.getElementById("contactDialog");
  const noticeDialog = document.getElementById("noticeDialog");
  const pendingKey = "lux_vitrine_contato_pendente";
  let observer;

  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);

  const normalize = value => String(value ?? "").trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const requestedCategory = normalize(new URLSearchParams(window.location.search).get("categoria"))
    .replace("lgbtq+", "lgbtq");
  if (["feminino", "masculino", "lgbtq"].includes(requestedCategory)) {
    state.category = requestedCategory;
    const selected = document.querySelector(`[data-category="${requestedCategory}"]`);
    if (selected) {
      document.querySelectorAll("#categoryFilters [data-category]").forEach(button => {
        const active = button === selected;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
    }
  }

  function verified(profile) {
    return ["verificada", "verificado", "aprovada", "aprovado"].includes(normalize(profile.verificacao_status));
  }

  function planFor(profile) {
    const code = normalize([profile.selo_codigo, profile.plano_codigo, profile.plano_nome].filter(Boolean).join(" "));
    if (code.includes("diamond")) return "diamond";
    if (["royal", "elite", "desfire", "desire", "vip"].some(name => code.includes(name))) return "vip";
    return "essence";
  }

  function planLabel(profile) {
    const plan = planFor(profile);
    return plan === "diamond" ? "DIAMOND" : plan === "vip" ? "VIP" : "LUX";
  }

  function modelName(profile) {
    return profile.nome_exibicao || profile.apelido || "Perfil LUX";
  }

  function modelCity(profile) {
    return [profile.cidade, profile.estado].filter(Boolean).join(" · ") || "Localização reservada";
  }

  function visibleProfiles() {
    return state.profiles.filter(profile => {
      const category = normalize(profile.categoria_catalogo || "outras").replace("lgbtq+", "lgbtq");
      const categoryMatch = state.category === "todas" || category === state.category;
      const cityMatch = !state.city || normalize(profile.cidade) === normalize(state.city);
      const planMatch = state.plan === "todos" || planFor(profile) === state.plan;
      return categoryMatch && cityMatch && planMatch;
    });
  }

  function card(profile, index) {
    const name = escapeHTML(modelName(profile));
    const city = escapeHTML(modelCity(profile));
    const image = profile.foto_url
      ? `<img src="${escapeHTML(profile.foto_url)}" alt="Foto de ${name}" loading="lazy" referrerpolicy="no-referrer">`
      : `<div class="model-photo-placeholder" aria-label="Foto indisponível">LUX</div>`;
    const safeId = escapeHTML(profile.id);
    return `<article class="model-card" style="transition-delay:${Math.min(index, 8) * 55}ms">
      <div class="model-photo">${image}
        <div class="model-badges">
          <span class="model-badge model-badge-plan">${escapeHTML(planLabel(profile))}</span>
          <span class="model-badge model-badge-verified">✓ Verificada</span>
        </div>
      </div>
      <div class="model-card-copy">
        <h2 class="model-name">${name}</h2>
        <p class="model-city">⌖ ${city}</p>
        <div class="model-card-actions">
          <button class="lux-button lux-button-primary" type="button" data-contact="${safeId}" data-action="chamar">Chamar</button>
          <button class="lux-button lux-button-secondary" type="button" data-contact="${safeId}" data-action="agendar">Agendar</button>
        </div>
      </div>
    </article>`;
  }

  function revealCards() {
    if (observer) observer.disconnect();
    const cards = grid.querySelectorAll(".model-card");
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cards.forEach(card => card.classList.add("is-visible"));
      return;
    }
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    cards.forEach(card => observer.observe(card));
  }

  function render() {
    const profiles = visibleProfiles();
    grid.setAttribute("aria-busy", "false");
    count.textContent = `${profiles.length} ${profiles.length === 1 ? "perfil encontrado" : "perfis encontrados"}`;
    if (!profiles.length) {
      grid.innerHTML = `<div class="empty-state"><span class="state-symbol">◇</span><h2>Nenhum perfil por aqui</h2><p>Não encontramos perfis com essa combinação. Experimente ajustar os filtros.</p><button class="lux-button lux-button-secondary" type="button" data-reset-filters>Limpar filtros</button></div>`;
      return;
    }
    grid.innerHTML = profiles.map(card).join("");
    revealCards();
  }

  function setFilter(group, key, value) {
    state[key] = value;
    document.querySelectorAll(`#${group} [data-${key === "category" ? "category" : "plan"}]`).forEach(button => {
      const active = button.dataset[key] === value;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    render();
  }

  function showNotice(message) {
    document.getElementById("noticeMessage").textContent = message;
    noticeDialog.showModal();
  }

  function openRegistration(profile, action) {
    const pending = { modelId: profile.id, action, returnTo: "./vitrine.html" };
    localStorage.setItem(pendingKey, JSON.stringify(pending));
    document.getElementById("contactModelName").textContent = modelName(profile);
    const query = "?returnTo=./vitrine.html";
    document.getElementById("loginLink").href = `./login.html${query}`;
    document.getElementById("signupLink").href = `./cadastro-usuario.html${query}`;
    contactDialog.showModal();
  }

  async function getContact(modelId) {
    const { data, error } = await window.luxSupabase.rpc("obter_contato_modelo", { p_modelo_id: modelId });
    if (error) throw error;
    const result = Array.isArray(data) ? data[0] : data;
    const phone = String(result?.whatsapp || "").replace(/\D/g, "");
    if (!phone) throw new Error("Este perfil ainda não disponibilizou um contato.");
    return phone;
  }

  async function handleContact(profile, action, button) {
    const client = window.luxSupabase;
    if (!client) return showNotice("Não foi possível conectar ao serviço de acesso. Atualize a página e tente novamente.");
    const originalLabel = button?.textContent;
    if (button) {
      button.disabled = true;
      button.textContent = "Conectando…";
    }
    try {
      const { data: { session } } = await client.auth.getSession();
      if (!session?.user) return openRegistration(profile, action);
      const phone = await getContact(profile.id);
      const message = action === "agendar"
        ? `Olá! Vim pela vitrine LUX e gostaria de agendar com ${modelName(profile)}.`
        : `Olá! Vim pela vitrine LUX e gostaria de falar com ${modelName(profile)}.`;
      window.location.assign(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
    } catch (error) {
      console.error("[LUX vitrine] Não foi possível concluir o contato.");
      showNotice(error?.message || "Não foi possível obter o contato. Tente novamente.");
    } finally {
      if (button?.isConnected) {
        button.disabled = false;
        button.textContent = originalLabel;
      }
    }
  }

  async function runPendingContact() {
    let pending;
    try {
      pending = JSON.parse(localStorage.getItem(pendingKey) || "null");
    } catch {
      localStorage.removeItem(pendingKey);
      return;
    }
    if (!pending || !pending.modelId || !["chamar", "agendar"].includes(pending.action)) return;
    const profile = state.profiles.find(item => item.id === pending.modelId);
    if (!profile) {
      localStorage.removeItem(pendingKey);
      return;
    }
    localStorage.removeItem(pendingKey);
    await handleContact(profile, pending.action);
  }

  function populateCities() {
    const cities = [...new Set(state.profiles.map(profile => String(profile.cidade || "").trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
    cityFilter.innerHTML = `<button class="filter-chip is-active" type="button" data-city="" aria-pressed="true">Todas</button>${cities.map(city => `<button class="filter-chip" type="button" data-city="${escapeHTML(city)}" aria-pressed="false">${escapeHTML(city)}</button>`).join("")}`;
  }

  async function loadProfiles() {
    try {
      if (!window.luxSupabase) throw new Error("Supabase indisponível.");
      const { data, error } = await window.luxSupabase.from("modelo_perfis")
        .select(safeFields)
        .in("verificacao_status", ["verificada", "verificado", "aprovada", "aprovado"])
        .order("criado_em", { ascending: false });
      if (error) throw error;
      state.profiles = (Array.isArray(data) ? data : []).filter(verified);
      populateCities();
      render();
      await runPendingContact();
    } catch (error) {
      console.error("[LUX vitrine] Falha ao carregar os perfis.");
      grid.setAttribute("aria-busy", "false");
      count.textContent = "A vitrine não está disponível no momento.";
      grid.innerHTML = `<div class="error-state"><span class="state-symbol">!</span><h2>Voltamos em instantes</h2><p>Não foi possível carregar os perfis agora. Confira sua conexão e tente novamente.</p><button class="lux-button lux-button-primary" type="button" data-retry>Tentar novamente</button></div>`;
    }
  }

  document.getElementById("categoryFilters").addEventListener("click", event => {
    const button = event.target.closest("[data-category]");
    if (button) setFilter("categoryFilters", "category", button.dataset.category);
  });
  document.getElementById("planFilters").addEventListener("click", event => {
    const button = event.target.closest("[data-plan]");
    if (button) setFilter("planFilters", "plan", button.dataset.plan);
  });
  cityFilter.addEventListener("click", event => {
    const button = event.target.closest("[data-city]");
    if (!button) return;
    state.city = button.dataset.city;
    cityFilter.querySelectorAll("[data-city]").forEach(chip => {
      const active = chip === button;
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-pressed", String(active));
    });
    render();
  });
  grid.addEventListener("click", event => {
    if (event.target.closest("[data-reset-filters]")) {
      state.category = "todas";
      state.city = "";
      state.plan = "todos";
      cityFilter.querySelectorAll("[data-city]").forEach((chip, index) => {
        const active = index === 0;
        chip.classList.toggle("is-active", active);
        chip.setAttribute("aria-pressed", String(active));
      });
      setFilter("categoryFilters", "category", "todas");
      setFilter("planFilters", "plan", "todos");
      return;
    }
    if (event.target.closest("[data-retry]")) return loadProfiles();
    const button = event.target.closest("[data-contact]");
    if (!button) return;
    const profile = state.profiles.find(item => item.id === button.dataset.contact);
    if (profile) handleContact(profile, button.dataset.action, button);
  });
  document.querySelectorAll("[data-close-dialog]").forEach(button => {
    button.addEventListener("click", () => button.closest("dialog").close());
  });
  [contactDialog, noticeDialog].forEach(dialog => {
    dialog.addEventListener("click", event => {
      if (event.target === dialog) dialog.close();
    });
  });
  loadProfiles();
})();
