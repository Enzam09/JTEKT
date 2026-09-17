/* ==========================================================================
   localizacao.js
   Responsável por: localizar peça por código/descrição, simular leitura de
   código de barras/QR Code e simular o fluxo de confirmação de retirada.
   ========================================================================== */

const Localizacao = (function () {

  const CODIGOS_DEMO = ['ABC123', 'DEF456', 'XYZ789', 'JT001', 'JT002'];

  function renderDemoCodes() {
    const el = document.getElementById('demoCodes');
    if (!el) return;
    el.innerHTML = CODIGOS_DEMO.map(c => `<button data-codigo="${c}">${c}</button>`).join('');
    el.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('locateInput').value = btn.dataset.codigo;
        esconderScanner();
        buscar(btn.dataset.codigo);
      });
    });
  }

  function mostrarScanner() {
    document.getElementById('scannerArea').classList.remove('hidden');
  }
  function esconderScanner() {
    document.getElementById('scannerArea').classList.add('hidden');
  }

  function buscar(termo) {
    const resultEl = document.getElementById('locateResult');
    resultEl.classList.remove('hidden');

    if (!termo) {
      resultEl.innerHTML = `<div class="result-fail">⚠️ Digite ou escaneie um código para buscar.</div>`;
      return;
    }

    resultEl.innerHTML = `<div class="timing-note">Pesquisando na base de endereçamento...</div>`;

    // Tempo de busca simulado (protótipo) — em um cenário real a consulta
    // seria praticamente instantânea através do endereçamento digital.
    const inicio = performance.now();

    setTimeout(() => {
      const peca = Armazenamento.getPecas().find(p =>
        p.codigo.toLowerCase() === termo.toLowerCase() ||
        p.descricao.toLowerCase().includes(termo.toLowerCase())
      );

      const tempoMs = Math.round(performance.now() - inicio) + Math.round(Math.random() * 300 + 150);

      if (!peca) {
        resultEl.innerHTML = `
          <div class="result-fail">⚠️ PEÇA NÃO ENCONTRADA</div>
          <p style="color:var(--text-secondary);font-size:13.5px;">Nenhuma peça corresponde ao código ou descrição informados. Verifique o código de demonstração ou cadastre a peça em Estoque.</p>
        `;
        return;
      }

      resultEl.innerHTML = `
        <div class="result-ok">✓ PEÇA ENCONTRADA</div>
        <div class="result-grid">
          <div><span>Código</span><b>${peca.codigo}</b></div>
          <div><span>Descrição</span><b>${peca.descricao}</b></div>
          <div><span>Quantidade</span><b>${peca.quantidade} unidades</b></div>
        </div>
        <div class="loc-path">
          <span class="loc-chip">Região ${peca.regiao}</span>
          <span class="loc-chip">Corredor ${peca.corredor}</span>
          <span class="loc-chip">Estante ${peca.estante}</span>
          <span class="loc-chip">Nível ${peca.nivel}</span>
          <span class="loc-chip">Posição ${peca.posicao}</span>
        </div>
        <div class="timing-note">✓ Localização encontrada — tempo simulado: ${(tempoMs / 1000).toFixed(2)}s (&lt; 2 segundos)</div>
        <div class="form-actions">
          <button class="btn btn-primary" id="btnMostrarMapa">🧭 MOSTRAR NO MAPA</button>
          <button class="btn btn-outline" id="btnConfirmarRetirada">CONFIRMAR RETIRADA</button>
        </div>
        <div id="retiradaArea"></div>
      `;

      document.getElementById('btnMostrarMapa').addEventListener('click', () => Mapa.irParaPosicao(peca));
      document.getElementById('btnConfirmarRetirada').addEventListener('click', () => iniciarConfirmacaoRetirada(peca));
    }, 450);
  }

  function iniciarConfirmacaoRetirada(peca) {
    const area = document.getElementById('retiradaArea');
    area.innerHTML = `
      <div class="scanner-area">
        <div class="scanner-box">
          <div class="scanner-line"></div>
          <p>📷 Escaneie o código da posição</p>
        </div>
        <p class="scanner-hint">Código esperado: <strong>${peca.codigo}</strong></p>
        <div class="demo-codes" id="retiradaCodes"></div>
      </div>
      <div id="retiradaResultado"></div>
    `;

    const codigosParaTeste = [peca.codigo, ...CODIGOS_DEMO.filter(c => c !== peca.codigo).slice(0, 2)];
    const codesEl = document.getElementById('retiradaCodes');
    codesEl.innerHTML = codigosParaTeste
      .sort(() => Math.random() - 0.5)
      .map(c => `<button data-codigo="${c}">${c}</button>`).join('');

    codesEl.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => conferirRetirada(peca, btn.dataset.codigo));
    });
  }

  function conferirRetirada(peca, codigoEscaneado) {
    const resultado = document.getElementById('retiradaResultado');
    if (codigoEscaneado === peca.codigo) {
      resultado.innerHTML = `<div class="result-ok" style="margin-top:12px;">✓ RETIRADA CONFIRMADA — Peça correta.</div>`;
      App.notificar(`Retirada de ${peca.codigo} confirmada.`, 'success');
      registrarSaidaRapida(peca);
    } else {
      resultado.innerHTML = `
        <div class="result-fail" style="margin-top:12px;">⚠️ ATENÇÃO — A peça escaneada (${codigoEscaneado}) não corresponde à solicitação (${peca.codigo}).</div>
      `;
      App.notificar('Divergência na conferência de retirada.', 'error');
    }
  }

  function registrarSaidaRapida(peca) {
    const movs = Armazenamento.getMovimentacoes();
    const hoje = new Date();
    const pad = n => String(n).padStart(2, '0');
    movs.unshift({
      id: Armazenamento.getNextMovId(),
      data: `${pad(hoje.getDate())}/${pad(hoje.getMonth() + 1)}/${hoje.getFullYear()}`,
      peca: peca.codigo,
      tipo: 'saida',
      quantidade: 1,
      origem: `Região ${peca.regiao} / Corredor ${peca.corredor} / Estante ${peca.estante}`,
      destino: 'Linha de Produção',
      responsavel: 'Operador'
    });
    Armazenamento.saveMovimentacoes(movs);
    if (window.Movimentacoes) Movimentacoes.render();
    if (window.Dashboard) Dashboard.atualizar();
  }

  function init() {
    renderDemoCodes();

    document.getElementById('btnLocateSearch').addEventListener('click', () => {
      esconderScanner();
      buscar(document.getElementById('locateInput').value.trim());
    });

    document.getElementById('locateInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        esconderScanner();
        buscar(document.getElementById('locateInput').value.trim());
      }
    });

    document.getElementById('btnScan').addEventListener('click', () => {
      const area = document.getElementById('scannerArea');
      area.classList.toggle('hidden');
    });
  }

  return { init, buscar, renderDemoCodes };
})();