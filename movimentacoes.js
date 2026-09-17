/* ==========================================================================
   movimentacoes.js
   Responsável por: entradas, saídas, transferências e histórico de
   movimentações do estoque.
   ========================================================================== */

const Movimentacoes = (function () {

  function tipoLabel(t) {
    return { entrada: 'Entrada', saida: 'Saída', transferencia: 'Transferência' }[t] || t;
  }

  function popularSelectPecas() {
    const sel = document.getElementById('movPeca');
    if (!sel) return;
    const pecas = Armazenamento.getPecas();
    sel.innerHTML = pecas.map(p => `<option value="${p.codigo}">${p.codigo} — ${p.descricao}</option>`).join('');
  }

  function registrar(dados) {
    const movs = Armazenamento.getMovimentacoes();
    dados.id = Armazenamento.getNextMovId();
    const hoje = new Date();
    const pad = n => String(n).padStart(2, '0');
    dados.data = `${pad(hoje.getDate())}/${pad(hoje.getMonth() + 1)}/${hoje.getFullYear()}`;
    movs.unshift(dados);
    Armazenamento.saveMovimentacoes(movs);

    // Atualiza a quantidade da peça conforme o tipo de movimentação.
    const pecas = Armazenamento.getPecas();
    const peca = pecas.find(p => p.codigo === dados.peca);
    if (peca) {
      if (dados.tipo === 'entrada') peca.quantidade += dados.quantidade;
      if (dados.tipo === 'saida') peca.quantidade = Math.max(0, peca.quantidade - dados.quantidade);
      Armazenamento.savePecas(pecas);
    }

    App.notificar(`Movimentação ${dados.id} (${tipoLabel(dados.tipo)}) registrada.`, 'success');
  }

  function render(filtroTipo, filtroPeca) {
    const body = document.getElementById('tabelaMovimentacoesBody');
    if (!body) return;

    let movs = Armazenamento.getMovimentacoes();
    if (filtroTipo) movs = movs.filter(m => m.tipo === filtroTipo);
    if (filtroPeca) movs = movs.filter(m => m.peca.toLowerCase().includes(filtroPeca.toLowerCase()));

    if (movs.length === 0) {
      body.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:20px;">Nenhuma movimentação encontrada.</td></tr>`;
      return;
    }

    body.innerHTML = movs.map(m => `
      <tr>
        <td>${m.id}</td>
        <td>${m.data}</td>
        <td><strong>${m.peca}</strong></td>
        <td><span class="badge badge-${m.tipo}">${tipoLabel(m.tipo)}</span></td>
        <td>${m.quantidade}</td>
        <td>${m.origem || '—'}</td>
        <td>${m.destino || '—'}</td>
        <td>${m.responsavel}</td>
      </tr>
    `).join('');
  }

  function init() {
    popularSelectPecas();
    render();

    document.getElementById('formMovimentacao').addEventListener('submit', (e) => {
      e.preventDefault();
      const peca = document.getElementById('movPeca').value;
      if (!peca) { App.notificar('Cadastre ao menos uma peça antes de registrar movimentações.', 'error'); return; }

      registrar({
        peca,
        tipo: document.getElementById('movTipo').value,
        quantidade: parseInt(document.getElementById('movQuantidade').value, 10) || 1,
        origem: document.getElementById('movOrigem').value.trim(),
        destino: document.getElementById('movDestino').value.trim(),
        responsavel: document.getElementById('movResponsavel').value.trim() || 'Operador'
      });

      document.getElementById('formMovimentacao').reset();
      document.getElementById('movResponsavel').value = 'Operador';
      render(document.getElementById('filterMovTipo').value, document.getElementById('filterMovPeca').value);
      if (window.Dashboard) Dashboard.atualizar();
      if (window.Estoque) Estoque.renderTabela(Armazenamento.getPecas());
    });

    document.getElementById('filterMovTipo').addEventListener('change', aplicarFiltros);
    document.getElementById('filterMovPeca').addEventListener('input', aplicarFiltros);
  }

  function aplicarFiltros() {
    render(document.getElementById('filterMovTipo').value, document.getElementById('filterMovPeca').value.trim());
  }

  return { init, render, registrar, popularSelectPecas, tipoLabel };
})();