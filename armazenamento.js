/* ==========================================================================
   armazenamento.js
   Responsável por: localStorage, salvar dados, carregar dados, atualizar
   dados, e geração/seed da malha de endereçamento do armazém.
   ========================================================================== */

const Armazenamento = (function () {

  const KEYS = {
    PECAS: 'jss_pecas',
    MOVIMENTACOES: 'jss_movimentacoes',
    SLOTS_OVERRIDE: 'jss_slots_override', // reservado / crítico manuais
    SEEDED: 'jss_seeded_v1'
  };

  // -------------------- Estrutura de endereçamento --------------------
  // Malha de demonstração: Região 01, Corredores 01-04, Estantes 01-02,
  // Níveis 01-04, Posições 01-05 (amostra representativa da capacidade
  // total informada no contexto do projeto: 2.440 posições).
  const REGIOES = ['01'];
  const CORREDORES = ['01', '02', '03', '04'];
  const ESTANTES = ['01', '02'];
  const NIVEIS = ['01', '02', '03', '04'];
  const POSICOES = ['01', '02', '03', '04', '05'];

  function pad(n) { return String(n).padStart(2, '0'); }

  function slotId(regiao, corredor, estante, nivel, posicao) {
    return `${regiao}-${corredor}-${estante}-${nivel}-${posicao}`;
  }

  function gerarTodosOsSlots() {
    const slots = [];
    REGIOES.forEach(regiao => {
      CORREDORES.forEach(corredor => {
        ESTANTES.forEach(estante => {
          NIVEIS.forEach(nivel => {
            POSICOES.forEach(posicao => {
              slots.push({ regiao, corredor, estante, nivel, posicao, id: slotId(regiao, corredor, estante, nivel, posicao) });
            });
          });
        });
      });
    });
    return slots;
  }

  // -------------------- LocalStorage helpers --------------------
  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error('Erro ao carregar', key, e);
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Erro ao salvar', key, e);
      return false;
    }
  }

  // -------------------- Peças --------------------
  function getPecas() { return load(KEYS.PECAS, []); }
  function savePecas(pecas) { save(KEYS.PECAS, pecas); }

  function getPecaByCodigo(codigo) {
    return getPecas().find(p => p.codigo.toLowerCase() === String(codigo).toLowerCase());
  }

  // -------------------- Movimentações --------------------
  function getMovimentacoes() { return load(KEYS.MOVIMENTACOES, []); }
  function saveMovimentacoes(movs) { save(KEYS.MOVIMENTACOES, movs); }

  function getNextMovId() {
    const movs = getMovimentacoes();
    const max = movs.reduce((m, mv) => Math.max(m, parseInt(mv.id.replace(/\D/g, ''), 10) || 0), 0);
    return '#' + String(max + 1).padStart(4, '0');
  }

  // -------------------- Overrides de slot (reservado/crítico) --------------------
  function getSlotOverrides() { return load(KEYS.SLOTS_OVERRIDE, {}); }
  function saveSlotOverrides(overrides) { save(KEYS.SLOTS_OVERRIDE, overrides); }

  // -------------------- Seed de dados fictícios --------------------
  const SEED_PECAS = [
    { codigo: 'ABC123', descricao: 'Componente A - Suporte Metálico', categoria: 'Componente', quantidade: 120, peso: 4.2, altura: 20, largura: 15, comprimento: 30, frequencia: 'alta', regiao: '01', corredor: '03', estante: '02', nivel: '04', posicao: '05' },
    { codigo: 'DEF456', descricao: 'Componente B - Bucha de Vedação', categoria: 'Fixação', quantidade: 340, peso: 0.3, altura: 5, largura: 5, comprimento: 5, frequencia: 'baixa', regiao: '01', corredor: '01', estante: '01', nivel: '03', posicao: '02' },
    { codigo: 'XYZ789', descricao: 'Componente C - Eixo Cardan', categoria: 'Componente', quantidade: 45, peso: 18.5, altura: 12, largura: 12, comprimento: 80, frequencia: 'alta', regiao: '01', corredor: '02', estante: '01', nivel: '01', posicao: '01' },
    { codigo: 'JT001', descricao: 'Rolamento Cônico 30205', categoria: 'Rolamento', quantidade: 210, peso: 0.6, altura: 8, largura: 8, comprimento: 8, frequencia: 'alta', regiao: '01', corredor: '02', estante: '02', nivel: '02', posicao: '03' },
    { codigo: 'JT002', descricao: 'Rolamento Esférico 6205', categoria: 'Rolamento', quantidade: 180, peso: 0.4, altura: 6, largura: 6, comprimento: 6, frequencia: 'alta', regiao: '01', corredor: '02', estante: '02', nivel: '02', posicao: '04' },
    { codigo: 'JT003', descricao: 'Sensor de Posição Angular', categoria: 'Elétrico', quantidade: 60, peso: 0.2, altura: 4, largura: 4, comprimento: 6, frequencia: 'media', regiao: '01', corredor: '03', estante: '01', nivel: '02', posicao: '01' },
    { codigo: 'JT004', descricao: 'Chicote Elétrico Padrão', categoria: 'Elétrico', quantidade: 90, peso: 1.1, altura: 10, largura: 10, comprimento: 40, frequencia: 'media', regiao: '01', corredor: '03', estante: '01', nivel: '02', posicao: '02' },
    { codigo: 'JT005', descricao: 'Mangueira Hidráulica 3/4"', categoria: 'Hidráulico', quantidade: 75, peso: 2.3, altura: 15, largura: 15, comprimento: 100, frequencia: 'media', regiao: '01', corredor: '04', estante: '01', nivel: '01', posicao: '03' },
    { codigo: 'JT006', descricao: 'Válvula Direcional Hidráulica', categoria: 'Hidráulico', quantidade: 22, peso: 6.8, altura: 18, largura: 18, comprimento: 20, frequencia: 'baixa', regiao: '01', corredor: '04', estante: '02', nivel: '01', posicao: '01' },
    { codigo: 'JT007', descricao: 'Parafuso Sextavado M10x40', categoria: 'Fixação', quantidade: 1500, peso: 0.05, altura: 4, largura: 1, comprimento: 4, frequencia: 'alta', regiao: '01', corredor: '01', estante: '01', nivel: '01', posicao: '01' },
    { codigo: 'JT008', descricao: 'Arruela de Pressão M10', categoria: 'Fixação', quantidade: 2200, peso: 0.01, altura: 1, largura: 1, comprimento: 1, frequencia: 'baixa', regiao: '01', corredor: '01', estante: '01', nivel: '04', posicao: '05' },
    { codigo: 'JT009', descricao: 'Coluna de Direção Elétrica', categoria: 'Componente', quantidade: 30, peso: 24.0, altura: 25, largura: 25, comprimento: 120, frequencia: 'alta', regiao: '01', corredor: '02', estante: '01', nivel: '01', posicao: '02' },
    { codigo: 'JT010', descricao: 'Caixa de Engrenagens', categoria: 'Componente', quantidade: 18, peso: 32.5, altura: 30, largura: 30, comprimento: 35, frequencia: 'media', regiao: '01', corredor: '03', estante: '02', nivel: '01', posicao: '01' },
    { codigo: 'JT011', descricao: 'Junta Homocinética', categoria: 'Componente', quantidade: 55, peso: 3.4, altura: 14, largura: 14, comprimento: 14, frequencia: 'media', regiao: '01', corredor: '03', estante: '02', nivel: '03', posicao: '02' },
    { codigo: 'JT012', descricao: 'Filtro Hidráulico', categoria: 'Hidráulico', quantidade: 40, peso: 1.8, altura: 12, largura: 12, comprimento: 22, frequencia: 'baixa', regiao: '01', corredor: '04', estante: '02', nivel: '04', posicao: '04' },
    { codigo: 'JT013', descricao: 'Conector Elétrico 6 Vias', categoria: 'Elétrico', quantidade: 320, peso: 0.03, altura: 2, largura: 2, comprimento: 3, frequencia: 'alta', regiao: '01', corredor: '01', estante: '02', nivel: '01', posicao: '03' },
    { codigo: 'JT014', descricao: 'Retentor de Eixo', categoria: 'Fixação', quantidade: 200, peso: 0.15, altura: 3, largura: 3, comprimento: 3, frequencia: 'media', regiao: '01', corredor: '01', estante: '02', nivel: '02', posicao: '04' },
    { codigo: 'JT015', descricao: 'Módulo de Controle Eletrônico', categoria: 'Elétrico', quantidade: 15, peso: 0.9, altura: 6, largura: 12, comprimento: 16, frequencia: 'baixa', regiao: '01', corredor: '04', estante: '01', nivel: '02', posicao: '05' }
  ];

  function seedIfEmpty() {
    if (load(KEYS.SEEDED, false)) return;

    const pecas = SEED_PECAS.map(p => ({ ...p, status: 'ocupado' }));
    savePecas(pecas);

    const overrides = {};
    // Algumas posições marcadas manualmente como reservadas ou críticas
    // para demonstrar os estados visuais do mapa.
    overrides[slotId('01', '02', '01', '03', '05')] = 'reservado';
    overrides[slotId('01', '03', '01', '04', '01')] = 'reservado';
    overrides[slotId('01', '04', '02', '02', '02')] = 'critico';
    overrides[slotId('01', '01', '02', '04', '01')] = 'critico';
    saveSlotOverrides(overrides);

    const hoje = new Date();
    const dataStr = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

    const movs = [
      { id: '#0001', data: dataStr(hoje), peca: 'ABC123', tipo: 'entrada', quantidade: 50, origem: 'Fornecedor', destino: 'Região 01 / Corredor 03 / Estante 02', responsavel: 'Operador' },
      { id: '#0002', data: dataStr(hoje), peca: 'JT001', tipo: 'entrada', quantidade: 80, origem: 'Fornecedor', destino: 'Região 01 / Corredor 02 / Estante 02', responsavel: 'Operador' },
      { id: '#0003', data: dataStr(hoje), peca: 'DEF456', tipo: 'saida', quantidade: 20, origem: 'Região 01 / Corredor 01 / Estante 01', destino: 'Linha de Produção', responsavel: 'Operador' },
      { id: '#0004', data: dataStr(hoje), peca: 'JT009', tipo: 'transferencia', quantidade: 5, origem: 'Corredor 04', destino: 'Corredor 02', responsavel: 'Operador' },
      { id: '#0005', data: dataStr(hoje), peca: 'XYZ789', tipo: 'saida', quantidade: 10, origem: 'Região 01 / Corredor 02 / Estante 01', destino: 'Linha de Produção', responsavel: 'Operador' }
    ];
    saveMovimentacoes(movs);

    save(KEYS.SEEDED, true);
  }

  function resetDemoData() {
    localStorage.removeItem(KEYS.PECAS);
    localStorage.removeItem(KEYS.MOVIMENTACOES);
    localStorage.removeItem(KEYS.SLOTS_OVERRIDE);
    localStorage.removeItem(KEYS.SEEDED);
    seedIfEmpty();
  }

  function clearAllData() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  }

  return {
    KEYS,
    REGIOES, CORREDORES, ESTANTES, NIVEIS, POSICOES,
    slotId, gerarTodosOsSlots,
    getPecas, savePecas, getPecaByCodigo,
    getMovimentacoes, saveMovimentacoes, getNextMovId,
    getSlotOverrides, saveSlotOverrides,
    seedIfEmpty, resetDemoData, clearAllData
  };
})();