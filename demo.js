/* ==========================================================================
   demo.js
   Responsável por: orquestrar o "Modo Demonstração" — uma sequência guiada
   de passos para apresentação do fluxo completo do sistema.
   ========================================================================== */

const Demo = (function () {

  let passoAtual = 0;

  const PASSOS = [
    {
      texto: 'Passo 1 — Problema do estoque: no Dashboard, observe a ocupação de 90% e as 580 posições desperdiçadas identificadas no diagnóstico.',
      acao: () => App.irParaPagina('dashboard')
    },
    {
      texto: 'Passo 2 — Buscar uma peça: acesse "Localizar Peça" e digite ou selecione um código de demonstração (ex: ABC123).',
      acao: () => { App.irParaPagina('localizar'); document.getElementById('locateInput').value = 'ABC123'; }
    },
    {
      texto: 'Passo 3 — Mostrar localização: clique em "BUSCAR" para que o sistema exiba a localização exata da peça.',
      acao: () => Localizacao.buscar('ABC123')
    },
    {
      texto: 'Passo 4 — Mostrar no mapa: clique em "MOSTRAR NO MAPA" para visualizar a posição destacada na malha do armazém.',
      acao: () => {
        const peca = Armazenamento.getPecaByCodigo('ABC123');
        if (peca) Mapa.irParaPosicao(peca);
      }
    },
    {
      texto: 'Passo 5 — Registrar retirada: volte para "Localizar Peça" e clique em "CONFIRMAR RETIRADA" para simular a segunda conferência por leitura de código.',
      acao: () => App.irParaPagina('localizar')
    },
    {
      texto: 'Passo 6 — Confirmação: escaneie (clique) o código correto para validar a retirada com sucesso.',
      acao: () => {}
    },
    {
      texto: 'Passo 7 — Organização Inteligente: acesse a tela e selecione uma peça para o sistema analisar frequência, peso e dimensão.',
      acao: () => App.irParaPagina('organizacao')
    },
    {
      texto: 'Passo 8 — Recomendação de nova posição: clique em "Analisar" para o algoritmo calcular e sugerir a melhor posição disponível.',
      acao: () => {
        const sel = document.getElementById('orgPecaSelect');
        if (sel && sel.options.length) {
          sel.value = sel.options[0].value;
          Organizacao.analisar(sel.value);
        }
      }
    },
    {
      texto: 'Passo 9 — Dashboard atualizado: volte ao Dashboard para mostrar como os indicadores refletem as mudanças em tempo real.',
      acao: () => { App.irParaPagina('dashboard'); Dashboard.atualizar(); }
    }
  ];

  function abrir() {
    passoAtual = 0;
    document.getElementById('demoOverlay').classList.remove('hidden');
    renderPasso();
  }

  function fechar() {
    document.getElementById('demoOverlay').classList.add('hidden');
  }

  function renderPasso() {
    const passo = PASSOS[passoAtual];
    document.getElementById('demoStepText').textContent = passo.texto;
    document.getElementById('demoStepCount').textContent = `${passoAtual + 1} / ${PASSOS.length}`;
    document.getElementById('btnDemoPrev').disabled = passoAtual === 0;
    document.getElementById('btnDemoNext').textContent = passoAtual === PASSOS.length - 1 ? 'Concluir ✓' : 'Próximo ▶';
    try { passo.acao(); } catch (e) { console.error('Erro no passo de demonstração', e); }
  }

  function proximo() {
    if (passoAtual === PASSOS.length - 1) { fechar(); return; }
    passoAtual++;
    renderPasso();
  }

  function anterior() {
    if (passoAtual === 0) return;
    passoAtual--;
    renderPasso();
  }

  function init() {
    document.getElementById('btnDemoTop').addEventListener('click', abrir);
    document.getElementById('btnDemoSide').addEventListener('click', abrir);
    document.getElementById('btnDemoClose').addEventListener('click', fechar);
    document.getElementById('btnDemoNext').addEventListener('click', proximo);
    document.getElementById('btnDemoPrev').addEventListener('click', anterior);
  }

  return { init, abrir, fechar };
})();