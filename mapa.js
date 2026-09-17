/* ==========================================================================
   mapa.js
   Responsável por: montar o mapa visual do armazém (grid de posições),
   exibir detalhes ao clicar em uma posição e destacar posições localizadas.
   ========================================================================== */

const Mapa = (function () {

  function statusDoSlot(slotId, pecas, overrides) {
    const ocupante = pecas.find(p => Armazenamento.slotId(p.regiao, p.corredor, p.estante, p.nivel, p.posicao) === slotId);
    if (ocupante) return { status: 'ocupado', peca: ocupante };
    if (overrides[slotId]) return { status: overrides[slotId], peca: null };
    return { status: 'disponivel', peca: null };
  }

  function popularFiltros() {
    const selRegiao = document.getElementById('mapRegiao');
    const selEstante = document.getElementById('mapEstante');
    const selNivel = document.getElementById('mapNivel');
    if (!selRegiao) return;

    selRegiao.innerHTML = Armazenamento.REGIOES.map(r => `<option value="${r}">Região ${r}</option>`).join('');
    selEstante.innerHTML = Armazenamento.ESTANTES.map(e => `<option value="${e}">Estante ${e}</option>`).join('');
    selNivel.innerHTML = Armazenamento.NIVEIS.map(n => `<option value="${n}">Nível ${n}</option>`).join('');
  }

  function render(highlightSlotId) {
    const mapEl = document.getElementById('warehouseMap');
    if (!mapEl) return;

    const regiao = document.getElementById('mapRegiao').value || Armazenamento.REGIOES[0];
    const estante = document.getElementById('mapEstante').value || Armazenamento.ESTANTES[0];
    const nivel = document.getElementById('mapNivel').value || Armazenamento.NIVEIS[0];

    const pecas = Armazenamento.getPecas();
    const overrides = Armazenamento.getSlotOverrides();

    mapEl.innerHTML = Armazenamento.CORREDORES.map(corredor => {
      const slots = Armazenamento.POSICOES.map(posicao => {
        const id = Armazenamento.slotId(regiao, corredor, estante, nivel, posicao);
        const info = statusDoSlot(id, pecas, overrides);
        const isHighlight = id === highlightSlotId ? 'highlight' : '';
        return `<button class="slot ${info.status} ${isHighlight}" data-slot="${id}" title="${id}">${posicao}</button>`;
      }).join('');
      return `<div class="corridor-row"><div class="corridor-label">Corredor ${corredor}</div><div class="corridor-slots">${slots}</div></div>`;
    }).join('');

    mapEl.querySelectorAll('.slot').forEach(btn => {
      btn.addEventListener('click', () => mostrarDetalheSlot(btn.dataset.slot));
    });

    if (highlightSlotId) {
      const alvo = mapEl.querySelector(`[data-slot="${highlightSlotId}"]`);
      if (alvo) alvo.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }

  function mostrarDetalheSlot(slotId) {
    const [regiao, corredor, estante, nivel, posicao] = slotId.split('-');
    const pecas = Armazenamento.getPecas();
    const overrides = Armazenamento.getSlotOverrides();
    const info = statusDoSlot(slotId, pecas, overrides);

    const card = document.getElementById('mapDetailCard');
    card.classList.remove('hidden');

    const statusLabel = { disponivel: 'Disponível', ocupado: 'Ocupado', reservado: 'Reservado', critico: 'Crítico' }[info.status];

    card.innerHTML = `
      <h3>Posição ${corredor}-${estante}-${nivel}-${posicao}</h3>
      <div class="result-grid">
        <div><span>Região</span><b>${regiao}</b></div>
        <div><span>Corredor</span><b>${corredor}</b></div>
        <div><span>Estante</span><b>${estante}</b></div>
        <div><span>Nível</span><b>${nivel}</b></div>
        <div><span>Posição</span><b>${posicao}</b></div>
        <div><span>Status</span><b>${statusLabel}</b></div>
      </div>
      ${info.peca ? `
        <div class="result-grid">
          <div><span>Peça</span><b>${info.peca.codigo}</b></div>
          <div><span>Descrição</span><b>${info.peca.descricao}</b></div>
          <div><span>Quantidade</span><b>${info.peca.quantidade}</b></div>
        </div>
      ` : `<p style="color:var(--text-muted);font-size:13px;">Nenhuma peça armazenada nesta posição.</p>`}
    `;
  }

  function irParaPosicao(peca) {
    App.irParaPagina('enderecamento');
    document.getElementById('mapRegiao').value = peca.regiao;
    document.getElementById('mapEstante').value = peca.estante;
    document.getElementById('mapNivel').value = peca.nivel;
    const slotId = Armazenamento.slotId(peca.regiao, peca.corredor, peca.estante, peca.nivel, peca.posicao);
    render(slotId);
    setTimeout(() => mostrarDetalheSlot(slotId), 50);
  }

  function init() {
    popularFiltros();
    render();
    ['mapRegiao', 'mapEstante', 'mapNivel'].forEach(id => {
      document.getElementById(id).addEventListener('change', () => render());
    });
  }

  return { init, render, mostrarDetalheSlot, irParaPosicao, statusDoSlot };
})();