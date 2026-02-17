/**
 * MOTOR PIRABLOCO - VERSÃO INTEGRAL
 * Princípio dos 6 + Lógica de Produtos JSON + Cores Oficiais
 */

const PiraBloco = {
    v: new Date().getTime(),
    state: { allProducts: [], currentPage: 1, itemsPerPage: 12 },

    async init() {
        console.log("PiraBloco: Inicializando Motor...");
        await this.carregarEstrutura();
        await this.carregarDados();
        this.configurarUI();
    },

    // 1. Injeção da Estrutura (Princípio dos 6)
    async carregarEstrutura() {
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
            } catch (e) { console.error("Erro ao carregar componente: " + p.url); }
        }
    },

    // 2. Busca de Dados (produtos.json)
    async carregarDados() {
        const grid = document.getElementById('pbHomeGrid') || document.getElementById('pb-product-grid');
        if (!grid) return;

        try {
            const r = await fetch(`/produtos.json?v=${this.v}`);
            if (!r.ok) throw new Error("Erro ao ler JSON");
            const data = await r.json();
            
            // Normaliza os dados (Trata o formato do seu JSON)
            this.state.allProducts = Array.isArray(data) ? data : Object.values(data).filter(p => p.skuBase);
            this.renderizarVitrine(grid);
        } catch (e) {
            console.error("Erro nos dados:", e);
            if(grid) grid.innerHTML = "<p style='color:red'>Erro ao carregar a galáxia de blocos.</p>";
        }
    },

    // 3. Renderização Dinâmica (Cores e Layout)
    renderizarVitrine(container) {
        container.innerHTML = "";
        const items = this.state.allProducts;

        if (items.length === 0) {
            container.innerHTML = "<p>Nenhum item encontrado.</p>";
            return;
        }

        items.forEach(prod => {
            const card = document.createElement("div");
            card.className = "pb-productCard";
            // Estilo inline para garantir as cores oficiais #195961 e #2A9D8F
            card.style = "border:1px solid #76c7c0; border-radius:12px; padding:15px; margin:10px; width:220px; text-align:center; background:#fff; box-shadow:0 4px 6px rgba(0,0,0,0.1); display:inline-block; vertical-align:top;";
            
            card.innerHTML = `
                <img src="${prod.imagem || 'https://placehold.co/200'}" style="width:100%; border-radius:8px; height:150px; object-fit:cover;">
                <h3 style="color:#195961; font-size:1rem; margin:10px 0; height:40px; overflow:hidden;">${prod.nome}</h3>
                <p style="color:#2A9D8F; font-weight:bold; font-size:1.1rem;">R$ ${prod.preco || (prod.variantes ? prod.variantes[0].precoCentavos/100 : '0,00')}</p>
                <button style="background:#2A9D8F; color:#fff; border:none; padding:10px; border-radius:20px; width:100%; cursor:pointer; font-weight:bold;">ADICIONAR</button>
            `;
            container.appendChild(card);
        });
    },

    configurarUI() {
        // Lógica do Menu Hambúrguer (Reutilizando seu clique)
        document.addEventListener('click', (e) => {
            if (e.target.closest('#pb-menu-trigger')) {
                const menu = document.getElementById('pb-mobile-menu');
                if(menu) menu.classList.toggle('active');
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => PiraBloco.init());
