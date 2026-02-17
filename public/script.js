/**
 * MOTOR PIRABLOCO - PROTOCOLO SUPREMO
 * Baseado INTEGRALMENTE no principio-dos-6.txt
 */

const PiraBloco = {
    v: new Date().getTime(),
    // Caminho definido na Regra 5 da Lógica da PiraBloco
    pathImagens: "/storage/emulated/0/pirabloco/imagens/itens/",

    async init() {
        console.log("Motor PiraBloco Ligado. Versão: " + this.v);
        await this.carregarEstrutura();
        // Só carrega produtos depois que o main-mount recebeu o body.html
        setTimeout(() => this.carregarProdutos(), 200);
        this.ativarInteracoes();
    },

    async carregarEstrutura() {
        const elementos = [
            { id: 'header-mount', url: 'cabecalho.html' },
            { id: 'main-mount', url: 'body.html' },
            { id: 'footer-mount', url: 'rodape.html' }
        ];

        for (const el of elementos) {
            try {
                const r = await fetch(`${el.url}?v=${this.v}`);
                const html = await r.text();
                document.getElementById(el.id).innerHTML = html;
            } catch (err) {
                console.error("Erro no fetch do elemento: " + el.url);
            }
        }
    },

    async carregarProdutos() {
        // Busca o container dentro do main-mount injetado
        const vitrine = document.getElementById('pb-product-grid') || document.querySelector('.grid-produtos');
        
        if (!vitrine) {
            console.error("ERRO: Container de vitrine não encontrado no body.html");
            return;
        }

        try {
            const r = await fetch(`produtos.json?v=${this.v}`);
            const produtos = await r.json();
            
            vitrine.innerHTML = ""; // Limpa o "Carregando"

            produtos.forEach(p => {
                // Monta o caminho da imagem conforme a Regra 5
                const imgPath = p.imagem.startsWith('http') ? p.imagem : this.pathImagens + p.imagem;

                vitrine.innerHTML += `
                    <div class="pb-card" style="border:1px solid #76c7c0; border-radius:12px; padding:15px; margin:10px; width:220px; text-align:center; background:#fff; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                        <img src="${imgPath}" alt="${p.nome}" style="width:100%; border-radius:8px; height:150px; object-fit:cover;">
                        <h3 style="color:#195961; font-size:1rem; margin:10px 0;">${p.nome}</h3>
                        <p style="color:#2A9D8F; font-weight:bold; font-size:1.1rem;">R$ ${p.preco}</p>
                        <button style="background:#2A9D8F; color:#fff; border:none; padding:10px; border-radius:20px; width:100%; cursor:pointer; font-weight:bold;">Adicionar</button>
                    </div>
                `;
            });
            console.log("Vitrine carregada com " + produtos.length + " itens.");
        } catch (err) {
            console.error("Erro ao processar produtos.json. Verifique a sintaxe do arquivo.");
        }
    },

    ativarInteracoes() {
        // Lógica do Menu Hamburguer integrada
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('pb-mobile-menu');
            const overlay = document.getElementById('pb-overlay-menu');
            
            if (e.target.closest('#pb-menu-trigger')) {
                menu.classList.add('active');
                overlay.classList.add('active');
            }
            if (e.target.closest('#pb-close-menu') || e.target.closest('#pb-overlay-menu')) {
                menu.classList.remove('active');
                overlay.classList.remove('active');
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => PiraBloco.init());
