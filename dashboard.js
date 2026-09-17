/* ==========================================================================
   dashboard.js
   Responsável por: KPIs, gráficos (canvas vanilla) e atualização dos
   indicadores do painel.
   ========================================================================== */

const Dashboard = (function () {

  // -------------------- Constantes de contexto do projeto --------------------
  // Valores facilmente alteráveis conforme o cenário real da planta.
  const CONTEXTO = {
    capacidadeAtual: 2440,
    ocupacaoPercent: 90,
    posicoesDesperdicadas: 580,
    demanda2030: 1579,
    coberturaNacionalDias: 5,
    coberturaImportadaDiasTexto: '3,3',
    limiteCriticoCirculacao: 85
  };

  // Custo logístico unitário simulado (valores facilmente alteráveis).
  const CUSTO_LOGISTICO_SIMULADO = [
    { label: 'Mar', valor: 18.4 },
    { label: 'Abr', valor: 17.9 },
    { label: 'Mai', valor: 17.2 },
    { label: 'Jun', valor: 16.5 },
    { label: 'Jul', valor: 15.8 },
    { label: 'Ago', valor: 15.1 },
    { label: 'Set', valor: 14.6 }
  ];

  // -------------------- Utilitários de desenho (canvas vanilla) --------------------
  function clear(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawDonut(canvasId, dados, cores) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    clear(ctx, canvas);

    const total = dados.reduce((s, d) => s + d.valor, 0) || 1;
    const cx = canvas.width / 2, cy = canvas.height / 2 - 6;
    const rOut = Math.min(cx, cy) - 12;
    const rIn = rOut * 0.6;

    let anguloAtual = -Math.PI / 2;
    dados.forEach((d, i) => {
      const fatia = (d.valor / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, rOut, anguloAtual, anguloAtual + fatia);
      ctx.closePath();
      ctx.fillStyle = cores[i % cores.length];
      ctx.fill();
      anguloAtual += fatia;
    });

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx, cy, rIn, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    ctx.fillStyle = '#16232f';
    ctx.font = 'bold 18px Segoe UI';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.round((dados[0].valor / total) * 100) + '%', cx, cy);
  }

  function drawBar(canvasId, dados, cor) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    clear(ctx, canvas);

    const padding = 34;
    const w = canvas.width - padding * 1.2;
    const h = canvas.height - padding * 1.6;
    const max = Math.max(...dados.map(d => d.valor), 1);
    const barW = w / dados.length * 0.55;
    const gap = w / dados.length;

    ctx.strokeStyle = '#e2e8ef';
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - 10, canvas.height - padding);
    ctx.stroke();

    dados.forEach((d, i) => {
      const barH = (d.valor / max) * h;
      const x = padding + i * gap + (gap - barW) / 2;
      const y = canvas.height - padding - barH;

      const grad = ctx.createLinearGradient(0, y, 0, canvas.height - padding);
      grad.addColorStop(0, cor[0]);
      grad.addColorStop(1, cor[1]);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, y, barW, barH, 4) : ctx.rect(x, y, barW, barH);
      ctx.fill();

      ctx.fillStyle = '#5c6b7a';
      ctx.font = '11px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, x + barW / 2, canvas.height - padding + 16);
      ctx.fillStyle = '#16232f';
      ctx.font = 'bold 11px Segoe UI';
      ctx.fillText(d.valor, x + barW / 2, y - 6);
    });
  }

  function drawLine(canvasId, dados, cor) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    clear(ctx, canvas);

    const padding = 34;
    const w = canvas.width - padding * 1.2;
    const h = canvas.height - padding * 1.6;
    const valores = dados.map(d => d.valor);
    const max = Math.max(...valores);
    const min = Math.min(...valores);
    const range = (max - min) || 1;
    const stepX = w / (dados.length - 1);

    ctx.strokeStyle = '#e2e8ef';
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - 10, canvas.height - padding);
    ctx.stroke();

    const pontos = dados.map((d, i) => {
      const x = padding + i * stepX;
      const y = canvas.height - padding - ((d.valor - min) / range) * h;
      return { x, y, d };
    });

    // área sob a linha
    ctx.beginPath();
    ctx.moveTo(pontos[0].x, canvas.height - padding);
    pontos.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pontos[pontos.length - 1].x, canvas.height - padding);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, cor + '33');
    grad.addColorStop(1, cor + '00');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    pontos.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = cor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    pontos.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = cor;
      ctx.fill();

      ctx.fillStyle = '#5c6b7a';
      ctx.font = '11px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText(p.d.label, p.x, canvas.height - padding + 16);
    });
  }

  function renderLegend(elId, dados, cores) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.innerHTML = dados.map((d, i) => `<span><span class="swatch" style="background:${cores[i % cores.length]}"></span>${d.label}: <strong>${d.valor}</strong></span>`).join('');
  }

  // -------------------- Cálculo de indicadores --------------------
  function calcularGiro() {
    const pecas = Armazenamento.getPecas();
    const alto = pecas.filter(p => p.frequencia === 'alta').length;
    const medio = pecas.filter(p => p.frequencia === 'media').length;
    const baixo = pecas.filter(p => p.frequencia === 'baixa').length;
    return [
      { label: 'Alto giro', valor: alto },
      { label: 'Médio giro', valor: medio },
      { label: 'Baixo giro', valor: baixo }
    ];
  }

  function calcularMovimentacoesPorCorredor() {
    const movs = Armazenamento.getMovimentacoes();
    const pecas = Armazenamento.getPecas();
    const contagem = {};
    Armazenamento.CORREDORES.forEach(c => contagem[c] = 0);

    movs.forEach(m => {
      const peca = pecas.find(p => p.codigo === m.peca);
      if (peca && contagem[peca.corredor] !== undefined) {
        contagem[peca.corredor]++;
      }
    });

    return Armazenamento.CORREDORES.map(c => ({ label: 'C' + c, valor: contagem[c] }));
  }

  function calcularMovimentacoesPorTipo() {
    const movs = Armazenamento.getMovimentacoes();
    return [
      { label: 'Entrada', valor: movs.filter(m => m.tipo === 'entrada').length },
      { label: 'Saída', valor: movs.filter(m => m.tipo === 'saida').length },
      { label: 'Transf.', valor: movs.filter(m => m.tipo === 'transferencia').length }
    ];
  }

  // -------------------- Alertas --------------------
  function renderAlertas() {
    const bar = document.getElementById('alertsBar');
    if (!bar) return;

    const pecas = Armazenamento.getPecas();
    const semEndereco = pecas.filter(p => !p.corredor || !p.posicao).length;
    const alertas = [];

    if (CONTEXTO.ocupacaoPercent > CONTEXTO.limiteCriticoCirculacao) {
      alertas.push({ tipo: 'warning', texto: `⚠️ Ocupação em ${CONTEXTO.ocupacaoPercent}% — acima de ${CONTEXTO.limiteCriticoCirculacao}%, a circulação das empilhadeiras fica prejudicada.` });
    }
    const movPorCorredor = calcularMovimentacoesPorCorredor();
    const maisMovimentado = [...movPorCorredor].sort((a, b) => b.valor - a.valor)[0];
    if (maisMovimentado && maisMovimentado.valor > 0) {
      alertas.push({ tipo: 'warning', texto: `⚠️ Corredor ${maisMovimentado.label.replace('C', '')} com alta movimentação registrada.` });
    }
    if (semEndereco > 0) {
      alertas.push({ tipo: 'warning', texto: `⚠️ ${semEndereco} peça(s) sem endereço completo.` });
    }
    alertas.push({ tipo: 'warning', texto: `⚠️ ${CONTEXTO.posicoesDesperdicadas} posições desperdiçadas identificadas no diagnóstico atual.` });
    alertas.push({ tipo: 'ok', texto: '✓ Estoque atualizado.' });
    alertas.push({ tipo: 'ok', texto: '✓ Inventário sincronizado.' });

    bar.innerHTML = alertas.map(a => `<div class="alert-pill alert-${a.tipo}">${a.texto}</div>`).join('');
  }

  // -------------------- Atualização geral --------------------
  function atualizar() {
    // KPI ocupação
    const fill = document.getElementById('ocupacaoFill');
    if (fill) {
      fill.style.width = CONTEXTO.ocupacaoPercent + '%';
      fill.classList.toggle('critical', CONTEXTO.ocupacaoPercent > CONTEXTO.limiteCriticoCirculacao);
    }
    const note = document.getElementById('ocupacaoNote');
    if (note) {
      note.textContent = CONTEXTO.ocupacaoPercent > CONTEXTO.limiteCriticoCirculacao
        ? `Ocupação atual — acima de ${CONTEXTO.limiteCriticoCirculacao}% (circulação crítica)`
        : 'Ocupação atual';
    }

    // Gráfico de ocupação (donut)
    const ocupado = Math.round(CONTEXTO.capacidadeAtual * (CONTEXTO.ocupacaoPercent / 100));
    const disponivel = CONTEXTO.capacidadeAtual - ocupado;
    const dadosOcupacao = [
      { label: 'Ocupado', valor: ocupado },
      { label: 'Disponível', valor: disponivel }
    ];
    drawDonut('chartOcupacao', dadosOcupacao, ['#2f8fd8', '#c9d3db']);
    renderLegend('legendOcupacao', [
      { label: 'Capacidade', valor: CONTEXTO.capacidadeAtual },
      ...dadosOcupacao
    ], ['#16232f', '#2f8fd8', '#c9d3db']);

    // Movimentações por corredor
    drawBar('chartMovCorredor', calcularMovimentacoesPorCorredor(), ['#ff6b2c', '#e85a1c']);

    // Giro de estoque
    const giro = calcularGiro();
    drawDonut('chartGiro', giro, ['#2fb872', '#2f8fd8', '#e5484d']);
    renderLegend('legendGiro', giro, ['#2fb872', '#2f8fd8', '#e5484d']);
    drawDonut('chartGiro2', giro, ['#2fb872', '#2f8fd8', '#e5484d']);
    renderLegend('legendGiro2', giro, ['#2fb872', '#2f8fd8', '#e5484d']);

    // Custo logístico (simulado)
    drawLine('chartCusto', CUSTO_LOGISTICO_SIMULADO.map(c => ({ label: c.label, valor: c.valor })), '#ff6b2c');
    drawLine('chartCusto2', CUSTO_LOGISTICO_SIMULADO.map(c => ({ label: c.label, valor: c.valor })), '#ff6b2c');

    // Indicadores: acuracidade (fixo, meta operacional) e movimentações por período
    drawDonut('chartAcuracidade', [{ label: 'Acuracidade', valor: 99 }, { label: 'Divergência', valor: 1 }], ['#2fb872', '#eef1f4']);
    drawBar('chartMovPeriodo', calcularMovimentacoesPorTipo(), ['#2f8fd8', '#1f6fb2']);

    renderAlertas();
  }

  function init() {
    atualizar();
    window.addEventListener('resize', () => { /* canvas é redesenhado a cada atualizar(); resize simples não recalcula automaticamente para manter simplicidade do protótipo */ });
  }

  return { init, atualizar, CONTEXTO, calcularGiro, calcularMovimentacoesPorCorredor };
})();