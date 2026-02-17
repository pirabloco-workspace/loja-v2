/* =================================================================
   ARQUIVO: index-script.js (Final - Caminho Certo + Filtros + Botões Qtd)
   ================================================================= */

(() => {
  "use strict";

  // --- 1. CONFIGURAÇÃO ---
  const CONFIG = {
    jsonPath: "/produtos.json", 
    mobileBreakpoint: 900,
    itemsMobile: 4,
    itemsDesktop: 12
  };

  const DOM = {
    grid: document.getElementById("pbHomeGrid"),
    search: document.getElementById("pbSearchInput"),
    soldToggle: document.getElementById("pbSoldToggle"),
    pagContainers: [
      document.getElementById("pbPagTop"), 
      document.getElementById("pbPagBottom")
    ],
    bannerTrack: document.getElementById("pbBannerTrack"),
    bannerDots: document.getElementById("pbBannerDots"),
    modal: document.getElementById("pbModal"),
    modalOverlay: document.getElementById("pbModalOverlay"),
    modalClose: document.getElementById("pbModalClose"),
    deckCards: document.querySelectorAll(".pb-deckCard")
  };

  const state = {
    allProducts: [], activeList: [], soldMode: false, searchQuery: "", tagFilter: "", currentPage: 1, itemsPerPage: 12
  };

  if (!DOM.grid) return;

  /* =================================================================
     2. LÓGICA DE IMAGENS 📸
     ================================================================= */
  const getImages = (prod, n, vSku) => {
    let folder = (prod.imagens?.pasta || "").trim().replace(/^\/+|\/+$/g, '');
    if (!folder) {
        if (prod.tipo === 'P') folder = "imagens/pecas";
        else if (prod.tipo === 'A') folder = "imagens/acessorios";
        else folder = "imagens/itens"; 
    }
    // Garante barra inicial
    if (!folder.startsWith("/")) folder = "/" + folder;

    const ext = (prod.imagens?.ext || "webp").replace(".", "");
    const sku = vSku || prod.skuBase; 
    const isItem = (prod.tipo === 'I' || (sku && sku.startsWith('I')));
    const candidates = [];

    if (isItem) {
        candidates.push(`${folder}/${sku}-${n}.${ext}`);
        if (n === 1) candidates.push(`${folder}/${sku}.${ext}`);
    } else {
        if (n === 1) candidates.push(`${folder}/${sku}.${ext}`);
        else candidates.push(`${folder}/${sku}-${n}.${ext}`);
    }

    if (ext === "webp") {
        const jpgs = candidates.map(c => c.replace(".webp", ".jpg"));
        candidates.push(...jpgs);
    }
    return candidates;
  };

  const applyImage = (imgEl, candidates) => {
    let i = 0;
    const tryNext = () => {
      if (i >= candidates.length) {
        imgEl.src = "https://placehold.co/400x400/f1f5f9/1c5e68?text=Sem+Foto";
        return;
      }
      imgEl.src = candidates[i++];
    };
    imgEl.onerror = tryNext; tryNext();
  };

  /* =================================================================
     3. DADOS & SHUFFLE 🎲
     ================================================================= */
  const toBRL = (cents) => {
    const n = Number(cents);
    return Number.isFinite(n) ? (n / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "R$ --";
  };

  const updatePageSize = () => {
    state.itemsPerPage = window.innerWidth < CONFIG.mobileBreakpoint ? CONFIG.itemsMobile : CONFIG.itemsDesktop;
  };

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const normalizeData = (data) => {
    let list = [];
    const entries = Array.isArray(data) ? data.map(i => [i.sku, i]) : Object.entries(data || {});

    entries.forEach(([key, p]) => {
      if (key === "_meta") return;
      if (!p || p.ativo !== true) return;

      p.skuBase = p.skuBase || key; 
      if (!p.variantes || !Array.isArray(p.variantes)) {
        p.variantes = [{ sku: p.skuBase, estoque: p.estoque, precoCentavos: p.precoCentavos }];
      }

      if (!p.tags) p.tags = [];
      if (p.tema) p.tags.push(p.tema.toLowerCase());
      if (p.tipo === 'I') p.tags.push('minifiguras');
      if (p.tipo === 'P') p.tags.push('pecas');
      if (p.tipo === 'A') p.tags.push('acessorios');

      const skus = p.variantes.map(v => v.sku).join(" ");
      p._searchIndex = `${p.nome} ${p.skuBase} ${skus} ${p.tema||""} ${p.tags.join(" ")}`.toLowerCase();
      list.push(p);
    });

    return shuffleArray(list);
  };

  /* =================================================================
     4. RENDERIZAÇÃO (COM BOTÕES +/-) 🔢
     ================================================================= */
  const renderGrid = () => {
    DOM.grid.innerHTML = "";
    const start = (state.currentPage - 1) * state.itemsPerPage;
    const end = start + state.itemsPerPage;
    const items = state.activeList.slice(start, end);
    const totalPages = Math.ceil(state.activeList.length / state.itemsPerPage);

    if (items.length === 0) {
      DOM.grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#888;">
        <div style="font-size:30px;margin-bottom:10px">🎲</div>Nenhum item encontrado.
      </div>`;
      renderPagination(0);
      return;
    }

    items.forEach(prod => {
      const v = prod.variantes[0];
      const stock = Number(v.estoque || 0); // Pega estoque numérico
      const isSold = stock <= 0;

      const card = document.createElement("div");
      card.className = `pb-productCard ${isSold ? 'is-oos' : ''}`;
      
      // Monta HTML dos Botões (+/-) ou Esgotado
      let actionsHtml = '';
      if (isSold) {
          actionsHtml = `<button class="pb-ctaBtn" disabled style="width:100%; height:40px;">ESGOTADO</button>`;
      } else {
          actionsHtml = `
            <div class="pb-cardActions" onclick="event.stopPropagation()">
                <div class="pb-qtyControl">
                    <button class="pb-qtyBtn js-minus">-</button>
                    <input type="number" class="pb-qtyInput js-input" value="1" min="1" max="${stock}" readonly>
                    <button class="pb-qtyBtn js-plus">+</button>
                </div>
                <button class="pb-ctaBtn js-add">ADICIONAR</button>
            </div>
          `;
      }

      card.innerHTML = `
        <div class="pb-productMedia"><img loading="lazy" alt="${prod.nome}"></div>
        <h3 class="pb-productName">${prod.nome}</h3>
        <div class="pb-priceRow">
            <span class="pb-price">${toBRL(v.precoCentavos)}</span>
            <span class="pb-stockLabel">${isSold ? '0 un' : stock + ' un'}</span>
        </div>
        ${actionsHtml}
      `;

      // Lógica de Imagem
      const img = card.querySelector("img");
      applyImage(img, getImages(prod, 1, v.sku));
      card.querySelector(".pb-productMedia").onclick = () => openModal(prod);

      // Lógica dos Botões
      if (!isSold) {
          const input = card.querySelector(".js-input");
          const btnMinus = card.querySelector(".js-minus");
          const btnPlus = card.querySelector(".js-plus");
          const btnAdd = card.querySelector(".js-add");

          btnMinus.onclick = () => {
              let val = parseInt(input.value);
              if (val > 1) input.value = val - 1;
          };

          btnPlus.onclick = () => {
              let val = parseInt(input.value);
              if (val < stock) input.value = val + 1;
              else showToast(`Máx: ${stock} un`);
          };

          btnAdd.onclick = () => {
              const qtd = parseInt(input.value);
              addToCart(v.sku, qtd, prod.nome);
          };
      }
      
      DOM.grid.appendChild(card);
    });
    
    renderPagination(totalPages);
  };

  // --- PAGINAÇÃO (BOTÕES) ---
  const renderPagination = (totalPages) => {
    DOM.pagContainers.forEach(container => {
        if (!container) return;
        container.innerHTML = "";
        
        if (totalPages <= 1) return;

        // Anterior
        const prevBtn = createPageBtn("‹", () => changePage(state.currentPage - 1), state.currentPage === 1, false);
        container.appendChild(prevBtn);

        // Números
        let startPage, endPage;
        if (totalPages <= 5) {
            startPage = 1; endPage = totalPages;
        } else {
            if (state.currentPage <= 3) { startPage = 1; endPage = 5; }
            else if (state.currentPage + 2 >= totalPages) { startPage = totalPages - 4; endPage = totalPages; }
            else { startPage = state.currentPage - 2; endPage = state.currentPage + 2; }
        }

        if (startPage > 1) {
            container.appendChild(createPageBtn("1", () => changePage(1), false, false));
            if (startPage > 2) container.appendChild(createDots());
        }

        for (let i = startPage; i <= endPage; i++) {
            const isCurrent = (i === state.currentPage);
            container.appendChild(createPageBtn(i, () => changePage(i), false, isCurrent));
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) container.appendChild(createDots());
            container.appendChild(createPageBtn(totalPages, () => changePage(totalPages), false, false));
        }

        // Próximo
        const nextBtn = createPageBtn("›", () => changePage(state.currentPage + 1), state.currentPage === totalPages, false);
        container.appendChild(nextBtn);
    });
  };

  const createPageBtn = (label, onClick, disabled, isCurrent) => {
    const btn = document.createElement("button");
    btn.className = `pb-pageBtn ${isCurrent ? 'is-current' : ''}`;
    btn.textContent = label;
    if (disabled) btn.disabled = true;
    else btn.onclick = onClick;
    return btn;
  };

  const createDots = () => {
      const s = document.createElement("span"); 
      s.textContent = "..."; s.style.color="#999"; s.style.padding="0 4px";
      return s;
  };

  const changePage = (newPage) => {
    state.currentPage = newPage;
    renderGrid();
    const gridTop = DOM.grid.closest('.pb-gridWrap').offsetTop - 20; 
    window.scrollTo({ top: gridTop, behavior: 'smooth' });
  };

  // --- FILTRO E RENDERIZAÇÃO ---
  const filterAndRender = () => {
    // 1. Filtra Disponíveis vs Vendidos
    let list = state.allProducts.filter(p => {
      const total = p.variantes.reduce((acc, v) => acc + Number(v.estoque || 0), 0);
      return state.soldMode ? total <= 0 : total > 0;
    });

    // 2. Filtra por Tag
    if (state.tagFilter && state.tagFilter !== "todos") {
        list = list.filter(p => p.tags.includes(state.tagFilter));
    }

    // 3. Filtra por Busca
    if (state.searchQuery) {
        list = list.filter(p => p._searchIndex.includes(state.searchQuery));
    }

    state.activeList = list;
    state.currentPage = 1;
    renderGrid();
  };

  /* =================================================================
     5. MODAL & CARRINHO
     ================================================================= */
  let mCtx = { prod: null, vIndex: 0 };

  const openModal = (prod) => {
    if (!DOM.modal) return;
    mCtx.prod = prod;
    mCtx.vIndex = prod.variantes.findIndex(v => Number(v.estoque) > 0);
    if(mCtx.vIndex < 0) mCtx.vIndex = 0;
    renderModalContent();
    DOM.modal.style.display = "flex";
    setTimeout(() => DOM.modal.classList.add("is-open"), 10);
  };

  const renderModalContent = () => {
    const p = mCtx.prod;
    const v = p.variantes[mCtx.vIndex];
    const isSold = !p.variantes.some(x => Number(x.estoque) > 0);

    document.getElementById("pbModalTitle").textContent = p.nome;
    document.getElementById("pbModalSku").textContent = `SKU: ${v.sku}`;
    document.getElementById("pbModalPrice").textContent = toBRL(v.precoCentavos);
    document.getElementById("pbModalDesc").innerHTML = p.descricao || "";
    
    const stk = document.getElementById("pbModalStock");
    stk.textContent = isSold ? "Esgotado" : `Estoque: ${v.estoque}`;
    stk.className = isSold ? "pb-chip is-sold" : "pb-chip";

    const thumbs = document.getElementById("pbModalThumbs");
    const mainImg = document.getElementById("pbModalMainImg");
    thumbs.innerHTML = "";
    
    const isItem = (p.tipo === 'I' || p.skuBase.startsWith('I'));
    const qtd = isItem ? Number(p.imagens?.qtd || 1) : 1;

    for (let i = 1; i <= Math.min(qtd, 4); i++) {
        const t = document.createElement("div"); t.className = `pb-thumb ${i===1?'is-active':''}`;
        const img = document.createElement("img");
        applyImage(img, getImages(p, i, v.sku));
        t.appendChild(img);
        t.onclick = () => {
            applyImage(mainImg, getImages(p, i, v.sku));
            Array.from(thumbs.children).forEach(c=>c.classList.remove("is-active"));
            t.classList.add("is-active");
        };
        thumbs.appendChild(t);
    }
    applyImage(mainImg, getImages(p, 1, v.sku));

    const btn = document.getElementById("pbModalAddBtn");
    const qInput = document.getElementById("pbModalQty");
    btn.disabled = isSold;
    btn.textContent = isSold ? "INDISPONÍVEL" : "ADICIONAR";
    qInput.value = 1; qInput.disabled = isSold;
    if(!isSold) qInput.max = v.estoque;

    const newBtn = btn.cloneNode(true); btn.parentNode.replaceChild(newBtn, btn);
    newBtn.onclick = () => {
        if(isSold) return;
        const q = parseInt(qInput.value) || 1;
        addToCart(v.sku, q, p.nome);
        closeModal();
    };
  };

  const closeModal = () => {
    DOM.modal.classList.remove("is-open");
    setTimeout(() => DOM.modal.style.display = "none", 300);
  };

  const addToCart = async (sku, qty, name) => {
    if (window.pbCart && typeof window.pbCart.add === 'function') {
      try {
        await window.pbCart.add({ sku: sku, qty: qty });
        showToast(`+${qty} ${name}`);
      } catch (e) { showToast("Erro."); }
    } else {
      if (!window.pbIsLoggedIn && !window.pbAuthState?.loggedIn) {
        showToast("Faça login");
        setTimeout(() => location.href = "/minha-conta.html", 1000);
      } else {
        showToast("Carrinho indisponível.");
      }
    }
  };

  const showToast = (msg) => {
    let t = document.getElementById("pbToast");
    if (!t) { 
        t = document.createElement("div"); t.id = "pbToast"; 
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.display = "block";
    setTimeout(() => t.style.display = "none", 2500);
  };

  /* =================================================================
     6. INICIALIZAÇÃO
     ================================================================= */
  const init = async () => {
    try {
      updatePageSize();
      // Banner
      let bIdx = 0;
      const slides = DOM.bannerTrack.querySelectorAll(".pb-bannerSlide");
      const dots = DOM.bannerDots.querySelectorAll(".pb-dot");
      if(slides.length > 1) {
          setInterval(() => {
              slides[bIdx].classList.remove("is-active"); dots[bIdx].classList.remove("is-active");
              bIdx = (bIdx + 1) % slides.length;
              slides[bIdx].classList.add("is-active"); dots[bIdx].classList.add("is-active");
          }, 5000);
      }

      const res = await fetch(CONFIG.jsonPath);
      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
      const data = await res.json();
      state.allProducts = normalizeData(data); 

      const params = new URLSearchParams(location.search);
      if (params.get("tag")) state.tagFilter = params.get("tag");
      
      filterAndRender();

      if (params.get("p")) {
          const prod = state.allProducts.find(p => p.variantes.some(v => v.sku === params.get("p")));
          if(prod) openModal(prod);
      }

    } catch(e) {
      console.error(e);
      DOM.grid.innerHTML = `<div style='grid-column:1/-1;text-align:center;padding:40px;color:red'>
        <p>Falha ao carregar catálogo.</p>
        <small>${e.message}</small>
      </div>`;
    }
  };

  // Event Listeners
  DOM.search.oninput = (e) => { 
      state.searchQuery = e.target.value.toLowerCase(); 
      state.currentPage = 1; // Reseta para pág 1 ao buscar
      filterAndRender(); 
  };
  
  DOM.soldToggle.onclick = () => { 
      state.soldMode = !state.soldMode; 
      DOM.soldToggle.classList.toggle("is-active", state.soldMode);
      DOM.soldToggle.querySelector("span").textContent = state.soldMode ? "🔙 Disponíveis" : "👁️ Ver Vendidos";
      state.currentPage = 1;
      filterAndRender(); 
  };

  DOM.modalClose.onclick = closeModal;
  DOM.modalOverlay.onclick = closeModal;
  
  window.addEventListener("resize", () => { 
      const old = state.itemsPerPage; 
      updatePageSize(); 
      if(old !== state.itemsPerPage) renderGrid(); 
  });

  DOM.deckCards.forEach(c => c.onclick = (e) => {
      e.preventDefault();
      const t = new URL(c.href).searchParams.get("tag");
      if(t) { 
          state.tagFilter = t; state.searchQuery=""; DOM.search.value=""; 
          state.currentPage = 1;
          window.scrollTo({top: DOM.grid.closest('.pb-gridWrap').offsetTop - 20, behavior:'smooth'}); 
          filterAndRender(); 
      }
  });

  init();
})();

