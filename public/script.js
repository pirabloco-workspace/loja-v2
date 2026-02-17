/**
 * MOTOR PIRABLOCO - PROTOCOLO SUPREMO (PRINCÍPIO DOS 6)
 * Orquestração de componentes com Anti-Cache e Lógica de UI
 */

const PiraBloco = {
    versao: new Date().getTime(), // Chave para matar o cache

    async init() {
        console.log("PiraBloco: Iniciando motor v" + this.versao);
        await this.montarEstrutura();
        this.configurarEventosUI();
    },

    // 1. FETCH DOS COMPONENTES (O Shell Fetch com Cache Busting)
    async montarEstrutura() {
        const componentes = [
            { id: 'header-mount', url: 'cabecalho.html' },
            { id: 'main-mount', url: 'body.html' },
            { id: 'footer-mount', url: 'rodape.html' }
        ];

        for (const comp of componentes) {
            try {
                // O segredo anti-cache está aqui: url + timestamp
                const resp = await fetch(`${comp.url}?v=${this.versao}`);
                if (!resp.ok) throw new Error(`Erro ao carregar ${comp.url}`);
                const html = await resp.text();
                document.getElementById(comp.id).innerHTML = html;
                console.log(`PiraBloco: ${comp.url} injetado.`);
            } catch (err) {
                console.error("Erro na montagem:", err);
            }
        }
    },

    // 2. LÓGICA DE INTERAÇÃO (Menu, Modal, Login)
    configurarEventosUI() {
        // Elementos do Cabeçalho Mobile
        const btnMenu = document.getElementById('pb-menu-trigger');
        const btnCloseMenu = document.getElementById('pb-close-menu');
        const sidebar = document.getElementById('pb-mobile-menu');
        const overlay = document.getElementById('pb-overlay-menu');

        // Elementos do Modal de Login
        const btnLoginTrigger = document.querySelector('.pb-btn-login-trigger');
        const modalLogin = document.getElementById('pb-login-modal');
        const btnCloseModal = document.getElementById('pb-close-login');

        // Função abrir/fechar Menu
        const toggleMenu = () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        };

        if (btnMenu) btnMenu.onclick = toggleMenu;
        if (btnCloseMenu) btnCloseMenu.onclick = toggleMenu;
        if (overlay) overlay.onclick = toggleMenu;

        // Função abrir/fechar Modal de Login
        if (btnLoginTrigger) {
            btnLoginTrigger.onclick = () => {
                modalLogin.classList.add('show');
                if(sidebar.classList.contains('active')) toggleMenu(); // Fecha o menu ao abrir login
            };
        }

        if (btnCloseModal) {
            btnCloseModal.onclick = () => modalLogin.classList.remove('show');
        }

        // Fecha modal ao clicar fora dele
        window.onclick = (event) => {
            if (event.target == modalLogin) {
                modalLogin.classList.remove('show');
            }
        };

        console.log("PiraBloco: Eventos de UI configurados.");
    }
};

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => PiraBloco.init());
