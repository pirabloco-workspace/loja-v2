/**
 * MOTOR PIRABLOCO - VERSÃO REPARO PUBLIC
 * Focado em encontrar o produtos.json dentro da pasta public
 */

const PiraBloco = {
    v: new Date().getTime(),

    async init() {
        console.log("Motor PiraBloco: Iniciando v" + this.v);
        // 1. Carrega a estrutura primeiro
        await this.carregarEstrutura();
        
        // 2. Aguarda o DOM renderizar e tenta carregar os dados
        // Mudamos o caminho para 'produtos.json' (sem a barra inicial) para garantir
        setTimeout(() => this.carregarDados(), 300);
    },

    async carregarEstrutura() {
        const partes = [
            { id: 'header-mount', url: 'cabecalho.html' },
            { id: 'main-mount', url: 'body.html' },
            { id: 'footer-mount', url: 'rodape.html' }
        ];
        for (let p of partes) {
            try {
                const r = await fetch(`${p.url}?v=${this.v}`);
                if (r.ok) {
                    const h = await r.text();
                    document.getElementById(p.id).innerHTML = h;
                }
            } catch (e) { console.error("Erro ao carregar parte:", p.url); }
        }
    },

    async carregarDados() {
        // Busca o container pbHomeGrid que estava no seu script original
        const grid = document.getElementById('pbHomeGrid') || document.getElementById('pb-product-grid');
        
        if (!grid) {
            console.error("Lógica PiraBloco: Container de produtos não encontrado.");
            return;
        }

        try {
            // O AJUSTE: Tentando carregar sem a barra inicial para o Firebase entender que está na raiz da public
            const r = await fetch(`produtos.json?v=${this.v}`);
            if (!r.ok) throw new Error("Não foi possível ler o arquivo produtos.json");
            
            const dados = await r.json();
            
            // Limpa o sinal de carregamento
            grid.innerHTML = "";

            // Lógica de renderização simplificada com suas cores oficiais (#195961, #2A9D8F)
            dados.forEach(p => {
                grid.innerHTML += `
                    <div class="pb-card" style="border:1px solid #76c7c0; border-radius:12px; padding:15px; margin:10px; width:220px; text-align:center; background:#fff; display:inline-block; vertical-align:top; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                        <img src="${p.imagem}" style="width:100%; border-radius:8px; height:150px; object-fit:cover; margin-bottom:10px;">
                        <h3 style="color:#195961; font-size:1rem; height:40px; overflow:hidden;">${p.nome}</h3>
                        <p style="color:#2A9D8F; font-weight:bold; font-size:1.1rem;">R$ ${p.preco}</p>
                        <button style="background:#2A9D8F; color:#fff; border:none; padding:10px; border-radius:20px; width:100%; cursor:pointer; font-weight:bold; margin-top:10px;">Comprar</button>
                    </div>
                `;
            });
            console.log("Sucesso: " + dados.length + " produtos carregados da pasta public.");
        } catch (e) {
            console.error("Erro PiraBloco:", e);
            grid.innerHTML = `<p style="color:red; padding:20px;">Erro ao conectar com o banco de blocos: ${e.message}</p>`;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => PiraBloco.init());
