/* ==========================================================================
   organizacao.js
   Responsável por: analisar uma peça (frequência, peso, dimensão) e
   calcular, através de um algoritmo baseado em regras, a melhor posição
   de armazenamento disponível — calcularMelhorPosicao(peca).
   ========================================================================== */

const Organizacao = (function () {

  // "Proximidade da produção" simulada: corredores mais baixos são
  // considerados mais próximos da área produtiva neste protótipo.
  const PROXIMIDADE_CORREDOR = { '01': 4, '02': 3, '03': 2, '04': 1 };

  function classificarFrequencia(f) {
    return { alta: 'Alta', media: 'Média', baixa: 'Baixa' }[f] || 'Média';
  }

  function classificarPeso(kg) {
    if (kg >= 15) return 'Pesado';
    if (kg >= 4) return 'Médio';
    return 'Leve';
  }

  function classificarDimensao(peca) {
    const volume = (peca.altura || 0) * (peca.largura || 0) * (peca.comprimento || 0);
    if (volume >= 40000) return 'Grande';
    if (volume >= 8000) return 'Média';
    return 'Pequena';
  }

  /**
   * calcularMelhorPosicao(peca)
   * Percorre todas as posições disponíveis (não ocupadas) e atribui uma
   * pontuação a cada uma, considerando:
   *   + frequência de movimentação (peças de alta frequência pontuam mais
   *     em corredores próximos da produção)
   *   + proximidade da produção
   *   + compatibilidade de peso (peças pesadas pontuam mais em níveis baixos)
   *   + compatibilidade de tamanho (peças grandes pontuam mais em estantes
   *     com mais folga — aqui simulado pelo nível inferior/estante 01)
   *   + disponibilidade (posições ocupadas nunca são recomendadas)
   * A posição com maior pontuação é a recomendada.
   */
  function calcularMelhorPosicao(peca) {
    const todosSlots = Armazenamento.gerarTodosOsSlots();
    const pecas = Armazenamento.getPecas().filter(p => p.codigo !== peca.codigo);
    const overrides = Armazenamento.getSlotOverrides();

    const ocupadas = new Set(pecas.map(p => Armazenamento.slotId(p.regiao, p.corredor, p.estante, p.nivel, p.posicao)));
    const slotAtual = Armazenamento.slotId(peca.regiao, peca.corredor, peca.estante, peca.nivel, peca.posicao);

    const pesoClass = classificarPeso(peca.peso);
    const dimClass = classificarDimensao(peca);
    const freqClass = classificarFrequencia(peca.frequencia);

    const candidatos = todosSlots
      .filter(s => !ocupadas.has(s.id))
      .filter(s => s.id !== slotAtual)
      .filter(s => (overrides[s.id] || 'disponivel') === 'disponivel')
      .map(slot => {
        let pontuacao = 0;
        const motivos = [];

        // --- Frequência x proximidade da produção ---
        const proximidade = PROXIMIDADE_CORREDOR[slot.corredor] || 1;
        if (peca.frequencia === 'alta') {
          pontuacao += proximidade * 3;
          if (proximidade >= 3) motivos.push('Alta frequência de movimentação → posição próxima da produção');
        } else if (peca.frequencia === 'baixa') {
          pontuacao += (5 - proximidade) * 3;
          if (proximidade <= 2) motivos.push('Baixa frequência de movimentação → posição mais distante da produção');
        } else {
          pontuacao += 2 * 2; // frequência média: posição intermediária
        }

        // --- Peso x nível ---
        const nivelNum = parseInt(slot.nivel, 10);
        if (pesoClass === 'Pesado') {
          pontuacao += (5 - nivelNum) * 3;
          if (nivelNum <= 2) motivos.push('Peso elevado → nível inferior adequado ao peso');
        } else if (pesoClass === 'Leve') {
          pontuacao += nivelNum * 1.5;
        } else {
          pontuacao += (5 - Math.abs(nivelNum - 2)) * 1.5;
        }

        // --- Dimensão x compatibilidade ---
        if (dimClass === 'Grande') {
          pontuacao += (nivelNum <= 2 ? 6 : 2);
          if (nivelNum <= 2) motivos.push('Grande dimensão → posição com capacidade compatível');
        } else if (dimClass === 'Média') {
          pontuacao += 4;
        } else {
          pontuacao += 3;
        }

        // --- Disponibilidade (bônus fixo, já que só candidatos livres chegam aqui) ---
        pontuacao += 5;
        motivos.push('Espaço disponível');

        return { slot, pontuacao: Math.round(pontuacao * 10) / 10, motivos };
      })
      .sort((a, b) => b.pontuacao - a.pontuacao);

    return {
      pesoClass, dimClass, freqClass,
      melhor: candidatos[0] || null,
      ranking: candidatos.slice(0, 5)
    };
  }

  function popularSelectPecas() {
    const sel = document.getElementById('orgPecaSelect');
    if (!sel) return;
    const pecas = Armazenamento.getPecas();
    sel.innerHTML = pecas.map(p => `<option value="${p.codigo}">${p.codigo} — ${p.descricao}</option>`).join('');
  }

  function analisar(codigo) {
    const peca = Armazenamento.getPecaByCodigo(codigo);
    if (!peca) return;

    const resultado = calcularMelhorPosicao(peca);

    const analiseEl = document.getElementById('orgAnalise');
    analiseEl.classList.remove('hidden');
    analiseEl.innerHTML = `
      <div class="org-analise-item"><span>Frequência</span><b>${resultado.freqClass}</b></div>
      <div class="org-analise-item"><span>Peso</span><b>${resultado.pesoClass} (${peca.peso} kg)</b></div>
      <div class="org-analise-item"><span>Dimensão</span><b>${resultado.dimClass}</b></div>
    `;

    const recEl = document.getElementById('orgRecomendacao');
    recEl.classList.remove('hidden');

    if (!resultado.melhor) {
      recEl.innerHTML = `<p>⚠️ Não há posições disponíveis na malha de demonstração no momento.</p>`;
      return;
    }

    const { slot, motivos, pontuacao } = resultado.melhor;

    recEl.innerHTML = `
      <h4>RECOMENDAÇÃO DO SISTEMA</h4>
      <div class="loc-path">
        <span class="loc-chip">Região ${slot.regiao}</span>
        <span class="loc-chip">Corredor ${slot.corredor}</span>
        <span class="loc-chip">Estante ${slot.estante}</span>
        <span class="loc-chip">Nível ${slot.nivel}</span>
        <span class="loc-chip">Posição ${slot.posicao}</span>
      </div>
      <p style="font-size:12.5px;color:var(--text-muted);">Pontuação do algoritmo: ${pontuacao}</p>
      <ul class="org-motivos">${motivos.map(m => `<li>✓ ${m}</li>`).join('')}</ul>
      <div class="form-actions">
        <button class="btn btn-primary" id="btnAceitarRecomendacao">ACEITAR RECOMENDAÇÃO</button>
      </div>
      <table class="org-score-table">
        <thead><tr><th>Posição</th><th>Pontuação</th></tr></thead>
        <tbody>
          ${resultado.ranking.map(r => `<tr><td>${r.slot.corredor}-${r.slot.estante}-${r.slot.nivel}-${r.slot.posicao}</td><td>${r.pontuacao}</td></tr>`).join('')}
        </tbody>
      </table>
    `;

    document.getElementById('btnAceitarRecomendacao').addEventListener('click', () => {
      Estoque.atualizarLocalizacao(peca.codigo, {
        regiao: slot.regiao, corredor: slot.corredor, estante: slot.estante, nivel: slot.nivel, posicao: slot.posicao
      });
      App.notificar(`Peça ${peca.codigo} movida para a posição recomendada.`, 'success');
      Estoque.atualizarTudoRelacionado();
      analisar(peca.codigo);
    });
  }

  function init() {
    popularSelectPecas();
    document.getElementById('btnAnalisarPeca').addEventListener('click', () => {
      const codigo = document.getElementById('orgPecaSelect').value;
      if (codigo) analisar(codigo);
    });
  }

  return { init, calcularMelhorPosicao, analisar, popularSelectPecas, classificarFrequencia, classificarPeso, classificarDimensao };
})();