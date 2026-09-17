/* ==========================================================================
   estoque.js
   Responsável por: cadastro, edição, exclusão, pesquisa e consulta de peças.
   ========================================================================== */

const Estoque = (function () {

  function frequenciaLabel(f) {
    return { alta: 'Alta', media: 'Média', baixa: 'Baixa' }[f] || f;
  }

  function localizacaoTexto(p) {
    return `${p.regiao}-${p.corredor}-${p.estante}-${p.nivel}-${p.posicao}`;
  }

  function localizacaoDoSlotOcupado(p) {
    return Armazenamento.slotId(p.regiao, p.corredor, p.estante, p.nivel, p.posicao);
  }

  // -------------------- Popular selects de endereçamento --------------------
  function popularSelectsEndereco() {
    const fCorredor = document.getElementById('fCorredor');
    const fEstante = document.getElementById('fEstante');
    const fNivel = document.getElementById('fNivel');
    const fPosicao = document.getElementById('fPosicao');
    if (!fCorredor) return;

    const fill = (select, values) => {
      select.innerHTML = values.map(v => `<option value="${v}">${v}</option>`).join('');
    };
    fill(fCorredor, Armazenamento.CORREDORES);
    fill(fEstante, Armazenamento.ESTANTES);
    fill(fNivel, Armazenamento.NIVEIS);
    fill(fPosicao, Armazenamento.POSICOES);
  }

  // -------------------- CRUD --------------------
  function cadastrarPeca(dados) {
    const pecas = Armazenamento.getPecas();

    if (pecas.some(p => p.codigo.toLowerCase() === dados.codigo.toLowerCase())) {
      App.notificar('Já existe uma peça cadastrada com este código.', 'error');
      return false;
    }

    const ocupante = pecas.find(p => localizacaoDoSlotOcupado(p) === localizacaoDoSlotOcupado(dados));
    if (ocupante) {
      App.notificar(`Posição já ocupada pela peça ${ocupante.codigo}. Escolha outra posição.`, 'error');
      return false;
    }

    dados.status = 'ocupado';
    pecas.push(dados);
    Armazenamento.savePecas(pecas);
    App.notificar(`Peça ${dados.codigo} cadastrada com sucesso.`, 'success');
    return true;
  }

  function editarPeca(codigoOriginal, dadosNovos) {
    const pecas = Armazenamento.getPecas();
    const idx = pecas.findIndex(p => p.codigo === codigoOriginal);
    if (idx === -1) return false;

    const conflito = pecas.find((p, i) => i !== idx && localizacaoDoSlotOcupado(p) === localizacaoDoSlotOcupado(dadosNovos));
    if (conflito) {
      App.notificar(`Posição já ocupada pela peça ${conflito.codigo}.`, 'error');
      return false;
    }

    dadosNovos.status = 'ocupado';
    pecas[idx] = dadosNovos;
    Armazenamento.savePecas(pecas);
    App.notificar(`Peça ${dadosNovos.codigo} atualizada.`, 'success');
    return true;
  }

  function excluirPeca(codigo) {
    let pecas = Armazenamento.getPecas();
    pecas = pecas.filter(p => p.codigo !== codigo);
    Armazenamento.savePecas(pecas);
    App.notificar(`Peça ${codigo} removida do estoque.`, 'success');
  }

  function atualizarLocalizacao(codigo, novaLocalizacao) {
    const pecas = Armazenamento.getPecas();
    const idx = pecas.findIndex(p => p.codigo === codigo);
    if (idx === -1) return false;
    Object.assign(pecas[idx], novaLocalizacao);
    Armazenamento.savePecas(pecas);
    return true;
  }

  // -------------------- Pesquisa --------------------
  function pesquisar(termo) {
    const pecas = Armazenamento.getPecas();
    if (!termo) return pecas;
    const t = termo.toLowerCase();
    return pecas.filter(p =>
      p.codigo.toLowerCase().includes(t) ||
      p.descricao.toLowerCase().includes(t) ||
      p.categoria.toLowerCase().includes(t) ||
      localizacaoTexto(p).toLowerCase().includes(t)
    );
  }

  // -------------------- Renderização --------------------
  function renderTabela(lista) {
    const body = document.getElementById('tabelaEstoqueBody');
    if (!body) return;

    if (lista.length === 0) {
      body.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:24px;">Nenhuma peça encontrada.</td></tr>`;
      return;
    }

    body.innerHTML = lista.map(p => `
      <tr>
        <td><strong>${p.codigo}</strong></td>
        <td>${p.descricao}</td>
        <td>${p.categoria}</td>
        <td>${p.quantidade}</td>
        <td><span class="badge badge-${p.frequencia}">${frequenciaLabel(p.frequencia)}</span></td>
        <td>${p.peso} kg</td>
        <td>${localizacaoTexto(p)}</td>
        <td>
          <button class="btn btn-sm btn-outline" data-action="editar" data-codigo="${p.codigo}">Editar</button>
          <button class="btn btn-sm btn-danger" data-action="excluir" data-codigo="${p.codigo}">Excluir</button>
        </td>
      </tr>
    `).join('');

    body.querySelectorAll('[data-action="editar"]').forEach(btn => {
      btn.addEventListener('click', () => carregarParaEdicao(btn.dataset.codigo));
    });
    body.querySelectorAll('[data-action="excluir"]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm(`Confirma a exclusão da peça ${btn.dataset.codigo}?`)) {
          excluirPeca(btn.dataset.codigo);
          atualizarTudoRelacionado();
        }
      });
    });
  }

  function carregarParaEdicao(codigo) {
    const p = Armazenamento.getPecaByCodigo(codigo);
    if (!p) return;
    document.getElementById('pecaEditId').value = p.codigo;
    document.getElementById('fCodigo').value = p.codigo;
    document.getElementById('fCodigo').disabled = true;
    document.getElementById('fDescricao').value = p.descricao;
    document.getElementById('fCategoria').value = p.categoria;
    document.getElementById('fQuantidade').value = p.quantidade;
    document.getElementById('fPeso').value = p.peso;
    document.getElementById('fAltura').value = p.altura;
    document.getElementById('fLargura').value = p.largura;
    document.getElementById('fComprimento').value = p.comprimento;
    document.getElementById('fFrequencia').value = p.frequencia;
    document.getElementById('fRegiao').value = p.regiao;
    document.getElementById('fCorredor').value = p.corredor;
    document.getElementById('fEstante').value = p.estante;
    document.getElementById('fNivel').value = p.nivel;
    document.getElementById('fPosicao').value = p.posicao;
    document.getElementById('formCadastroTitle').textContent = `Editando peça ${p.codigo}`;
    document.getElementById('btnSubmitPeca').textContent = 'SALVAR ALTERAÇÕES';
    document.getElementById('btnCancelEdit').style.display = 'inline-block';
    document.getElementById('formCadastroCard').scrollIntoView({ behavior: 'smooth' });
  }

  function cancelarEdicao() {
    document.getElementById('formCadastroPeca').reset();
    document.getElementById('pecaEditId').value = '';
    document.getElementById('fCodigo').disabled = false;
    document.getElementById('formCadastroTitle').textContent = '+ Cadastrar Peça';
    document.getElementById('btnSubmitPeca').textContent = '+ CADASTRAR PEÇA';
    document.getElementById('btnCancelEdit').style.display = 'none';
  }

  function lerFormulario() {
    return {
      codigo: document.getElementById('fCodigo').value.trim().toUpperCase(),
      descricao: document.getElementById('fDescricao').value.trim(),
      categoria: document.getElementById('fCategoria').value,
      quantidade: parseInt(document.getElementById('fQuantidade').value, 10) || 0,
      peso: parseFloat(document.getElementById('fPeso').value) || 0,
      altura: parseFloat(document.getElementById('fAltura').value) || 0,
      largura: parseFloat(document.getElementById('fLargura').value) || 0,
      comprimento: parseFloat(document.getElementById('fComprimento').value) || 0,
      frequencia: document.getElementById('fFrequencia').value,
      regiao: document.getElementById('fRegiao').value.trim() || '01',
      corredor: document.getElementById('fCorredor').value,
      estante: document.getElementById('fEstante').value,
      nivel: document.getElementById('fNivel').value,
      posicao: document.getElementById('fPosicao').value
    };
  }

  function atualizarTudoRelacionado() {
    renderTabela(Armazenamento.getPecas());
    if (window.Dashboard) Dashboard.atualizar();
    if (window.Mapa) Mapa.render();
    if (window.Movimentacoes) Movimentacoes.popularSelectPecas();
    if (window.Organizacao) Organizacao.popularSelectPecas();
  }

  function init() {
    popularSelectsEndereco();
    renderTabela(Armazenamento.getPecas());

    const search = document.getElementById('estoqueSearch');
    if (search) {
      search.addEventListener('input', () => renderTabela(pesquisar(search.value)));
    }

    const form = document.getElementById('formCadastroPeca');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const dados = lerFormulario();
        if (!dados.codigo || !dados.descricao) {
          App.notificar('Preencha código e descrição.', 'error');
          return;
        }
        const editId = document.getElementById('pecaEditId').value;
        let ok;
        if (editId) {
          ok = editarPeca(editId, dados);
        } else {
          ok = cadastrarPeca(dados);
        }
        if (ok) {
          cancelarEdicao();
          atualizarTudoRelacionado();
        }
      });
    }

    const btnCancel = document.getElementById('btnCancelEdit');
    if (btnCancel) btnCancel.addEventListener('click', cancelarEdicao);
  }

  return {
    init, pesquisar, renderTabela, cadastrarPeca, editarPeca, excluirPeca,
    atualizarLocalizacao, localizacaoTexto, frequenciaLabel,
    atualizarTudoRelacionado, carregarParaEdicao, popularSelectsEndereco
  };
})();