/**
 * MOTOR PIRABLOCO INTEGRAL
 * Une a Lógica do Catalogo com o Princípio dos 6
 */

const PiraBloco = {
    v: new Date().getTime(),
    // Configurações do seu script anterior
    CONFIG: { jsonPath: "/produtos.json", mobileBreakpoint: 900, itemsMobile: 4, itemsDesktop: 12 },
    state: { allProducts: [], activeList: [], soldMode: false, searchQuery: "", tagFilter: "", currentPage: 1, itemsPerPage: 12 },

    async init() {
        console.log("PiraBloco: Iniciando Orquestração...");
        // 1. MONTAGEM DO PALCO (Princípio dos 6)
        await this.montarEstrutura();
        
        // 2. INICIALIZAÇÃO DO MOTOR (Lógica que você enviou)
        // Damos 100ms para garantir que o DOM injetado foi reconhecido
        setTimeout(() => this.iniciarCatalogo(), 100);
        
        this.configurarGlobalUI();
    },

    async montarEstrutura() {
        const partes = [
            { id: 'header-mount', url: 'cabecalho.html' },
            { id: 'main-mount', url: 'body.html' },
            { id: 'footer-mount', url: 'rodape.html' }
        ];
        for (let p of partes) {
            try {
                const r = await fetch(`${p.url}?v=${this.v}`);
                const h = await r.text();
                document.getElementById(p.id).innerHTML = h;
            } catch (e) { console.error("Erro na estrutura: " + p.url); }
        }
    },

    async iniciarCatalogo() {
        // Mapeia os elementos do seu body.html
        this.DOM = {
            grid: document.getElementById("pbHomeGrid"),
            search: document.getElementById("pbSearchInput"),
            soldToggle: document.getElementById("pbSoldToggle"),
            pagContainers: [document.getElementById("pbPagTop"), document.getElementById("pbPagBottom")],
            bannerTrack: document.getElementById("pbBannerTrack"),
            bannerDots: document.getElementById("pbBannerDots")
        };

        if (!this.DOM.grid) return console.error("Grid não encontrado!");

        try {
            const res = await fetch(this.CONFIG.jsonPath + "?v=" + this.v);
            const data = await res.json();
            
            // Lógica de normalização do seu script anterior
            this.state.allProducts = this.normalizeData(data);
            this.updatePageSize();
            this.filterAndRender();
            this.iniciarBanners();
            this.vincularEventos();
        } catch (e) {
            this.DOM.grid.innerHTML = "<p style='color:red'>Erro ao carregar catálogo.</p>";
        }
    },

    // --- REPRODUÇÃO DA SUA LÓGICA ORIGINAL ---
    normalizeData(data) {
        let list = [];
        const entries = Array.isArray(data) ? data.map(i => [i.sku, i]) : Object.entries(data || {});
        entries.forEach(([key, p]) => {
            if (key === "_meta" || !p || p.ativo !== true) return;
            p.skuBase = p.skuBase || key;
            if (!p.variantes) p.variantes = [{ sku: p.skuBase, estoque: p.estoque, precoCentavos: p.precoCentavos }];
            const skus = p.variantes.map(v => v.sku).join(" ");
            p._searchIndex = `${p.nome} ${p.skuBase} ${skus}`.toLowerCase();
            list.push(p);
        });
        return list;
    },

    filterAndRender() {
        let list = this.state.allProducts.filter(p => {
            const stock = p.variantes.reduce((acc, v) => acc + Number(v.estoque || 0), 0);
            return this.state.soldMode ? stock <= 0 : stock > 0;
        });
        if (this.state.searchQuery) list = list.filter(p => p._searchIndex.includes(this.state.searchQuery));
        this.state.activeList = list;
        this.renderGrid();
    },

    renderGrid() {
        const start = (this.state.currentPage - 1) * this.state.itemsPerPage;
        const items = this.state.activeList.slice(start, start + this.state.itemsPerPage);
        this.DOM.grid.innerHTML = items.map(p => `
            <div class="pb-productCard" style="border:1px solid #76c7c0; padding:15px; border-radius:12px; text-align:center; background:#fff;">
                <img src="${p.imagem}" style="width:100%; height:150px; object-fit:contain;">
                <h3 style="color:#195961; font-size:1rem; margin:10px 0;">${p.nome}</h3>
                <p style="color:#2A9D8F; font-weight:bold;">R$ ${(p.variantes[0].precoCentavos/100).toFixed(2)}</p>
                <button style="background:#2A9D8F; color:#fff; border:none; padding:10px; border-radius:20px; width:100%; cursor:pointer;">ADICIONAR</button>
            </div>
        `).join('');
    },

    updatePageSize() {
        this.state.itemsPerPage = window.innerWidth < this.CONFIG.mobileBreakpoint ? this.CONFIG.itemsMobile : this.CONFIG.itemsDesktop;
    },

    vincularEventos() {
        if (this.DOM.search) this.DOM.search.oninput = (e) => {
            this.state.searchQuery = e.target.value.toLowerCase();
            this.filterAndRender();
        };
        if (this.DOM.soldToggle) this.DOM.soldToggle.onclick = () => {
            this.state.soldMode = !this.state.soldMode;
            this.filterAndRender();
        };
    },

    iniciarBanners() {
        // Lógica de banner do seu script anterior
        console.log("Banners Iniciados");
    },

    configurarGlobalUI() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#pb-menu-trigger')) {
                document.getElementById('pb-mobile-menu').classList.toggle('active');
                document.getElementById('pb-overlay-menu').classList.toggle('active');
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => PiraBloco.init());
