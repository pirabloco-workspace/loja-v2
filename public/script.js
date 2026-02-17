/**
 * MOTOR PIRABLOCO - PROTOCOLO SUPREMO (PRINCÍPIO DOS 6)
 * Orquestração: Estrutura + JSON + Anti-Cache
 */

const PiraBloco = {
    versao: new Date().getTime(),

    async init() {
        console.log("PiraBloco: Iniciando motor v" + this.versao);
        await this.montarEstrutura();
        await this.carregarProdutos(); // <--- Onde a mágica do JSON acontece
        this.configurarEventosUI();
    },

    // 1. MONTAGEM DA ESTRUTURA (HTML)
    async montarEstrutura() {
        const componentes = [
            { id: 'header-mount', url: 'cabecalho.html' },
            { id: 'main-mount', url: 'body.html' },
            { id: 'footer-mount', url: 'rodape.html' }
        ];

        for (const comp of componentes) {
            try {
                const resp = await fetch(`${comp.url}?v=${this.versao}`);
                const html = await resp.text();
                document.getElementById(comp.id).innerHTML = html;
            } catch (err) {
                console.error("Erro ao montar " + comp.url, err);
            }
        }
    },

    // 2. BUSCA E INJEÇÃO DE PRODUTOS (JSON)
    async carregarProdutos() {
        const vitrine = document.getElementById('pb-product-grid'); // ID que deve estar no seu body.html
        if (!vitrine) return;

        try {
            const resp = await fetch(`produtos.json?v=${this.versao}`);
            const produtos = await resp.json();
            
            vitrine.innerHTML = produtos.map(p => `
                <div class="pb-card">
                    <img src="${p.imagem}" alt="${p.nome}">
                    <h3>${p.nome}</h3>
                    <p class="pb-price">R$ ${p.preco}</p>
                    <button class="pb-btn-add" onclick="PiraBloco.adicionarAoCarrinho('${p.id}')">Adicionar</button>
                </div>
            `).join('');
            
            console.log("PiraBloco: Vitrine atualizada com " + produtos.length + " itens.");
        } catch (err) {
            console.error("Erro ao carregar produtos.json", err);
            vitrine.innerHTML = "<p>Erro ao carregar produtos.</p>";
        }
    },

    // 3. EVENTOS DE INTERFACE (Menu Hambúrguer)
    configurarEventosUI() {
        const btnMenu = document.getElementById('pb-menu-trigger');
        const sidebar = document.getElementById('pb-mobile-menu');
        const overlay = document.getElementById('pb-overlay-menu');
        const btnClose = document.getElementById('pb-close-menu');

        const toggleMenu = () => {
            if(sidebar && overlay) {
                sidebar.classList.toggle('active');
                overlay.classList.toggle('active');
            }
        };

        if (btnMenu) btnMenu.onclick = toggleMenu;
        if (btnClose) btnClose.onclick = toggleMenu;
        if (overlay) overlay.onclick = toggleMenu;
    },

    adicionarAoCarrinho(id) {
        alert("Produto " + id + " adicionado ao carrinho!");
    }
};

document.addEventListener('DOMContentLoaded', () => PiraBloco.init());
