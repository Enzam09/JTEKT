/* ==========================================================================
   app.js
   Responsável por: inicialização, navegação entre páginas, eventos gerais,
   carregamento dos módulos e notificações (toasts).
   ========================================================================== */

const App = (function () {

  function irParaPagina(pagina) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const page = document.getElementById('page-' + pagina);
    const nav = document.querySelector(`.nav-item[data-page="${pagina}"]`);
    if (page) page.classList.add('active');
    if (nav) nav.classList.add('active');

    fecharSidebarMobile();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function fecharSidebarMobile() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');
  }

  function abrirSidebarMobile() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebarOverlay').classList.add('show');
  }

  function notificar(mensagem, tipo) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo === 'error' ? 'toast-error' : tipo === 'success' ? 'toast-success' : ''}`;
    toast.textContent = mensagem;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3800);
  }

  function initNavegacao() {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => irParaPagina(btn.dataset.page));
    });

    document.getElementById('btnMenuToggle').addEventListener('click', abrirSidebarMobile);
    document.getElementById('sidebarOverlay').addEventListener('click', fecharSidebarMobile);
  }

  function initConfiguracoes() {
    document.getElementById('btnResetDemo').addEventListener('click', () => {
      if (confirm('Restaurar os dados de demonstração? Isso substituirá os dados atuais.')) {
        Armazenamento.resetDemoData();
        recarregarModulosDeDados();
        notificar('Dados de demonstração restaurados.', 'success');
      }
    });

    document.getElementById('btnClearAll').addEventListener('click', () => {
      if (confirm('Tem certeza? Todos os dados salvos serão apagados permanentemente.')) {
        Armazenamento.clearAllData();
        Armazenamento.seedIfEmpty();
        recarregarModulosDeDados();
        notificar('Todos os dados foram apagados e a base de demonstração foi recriada.', 'success');
      }
    });
  }

  function recarregarModulosDeDados() {
    Estoque.renderTabela(Armazenamento.getPecas());
    Estoque.popularSelectsEndereco && Estoque.popularSelectsEndereco();
    Movimentacoes.popularSelectPecas();
    Movimentacoes.render();
    Organizacao.popularSelectPecas();
    Mapa.render();
    Dashboard.atualizar();
  }

  function init() {
    Armazenamento.seedIfEmpty();

    initNavegacao();

    Estoque.init();
    Mapa.init();
    Localizacao.init();
    Organizacao.init();
    Movimentacoes.init();
    Dashboard.init();
    Demo.init();

    initConfiguracoes();
  }

  return { init, irParaPagina, notificar };
})();

document.addEventListener('DOMContentLoaded', App.init);