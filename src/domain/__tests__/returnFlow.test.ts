import { describe, it, expect } from 'vitest';
import {
  criarPreparacaoDevolucao,
  registrarConclusaoAplicacao,
  registrarMovimentacaoComponente,
  calcularProgressoDevolucao,
  avaliarChecklistProduto,
  encerrarPreparacao,
  filtrarPreparacoesPendentesDevolucao,
  filtrarPreparacoesEmConferencia,
  filtrarPreparacoesHistoricoConcluido,
  temItensPendentesDevolucao,
} from '../returnFlow';
import { classificarQrCode } from '../qrIdentification';
import {
  MOCK_ORDENS_SERVICO,
  MOCK_RECEITAS,
  MOCK_OPERADORES,
  MOCK_LOTES,
  MOCK_PRODUTOS,
  MOCK_CHECKLIST_SOBRAS,
} from '../../data/mock/mockData';
import { MockPreparacaoRepository } from '../../data/mock/mockRepositories';

describe('Fluxo de Devolução Individual por Componente e Rastreabilidade', () => {
  const os = MOCK_ORDENS_SERVICO[0];
  const receita = MOCK_RECEITAS[0]; // 4 componentes: Base, Catalisador, Diluidor, Retardador
  const operador = MOCK_OPERADORES[0];

  it('deve criar uma preparação com 4 registros de devolução pendentes e manter a devolução pendente após concluir a aplicação', () => {
    const prep = criarPreparacaoDevolucao({
      id: 'PREP-TEST-01',
      ordemServico: os,
      receita,
      operador,
      volumeTotal: 1000,
      valoresDosados: { 1: 500, 2: 250, 3: 200, 4: 50 },
      lotesDisponiveis: MOCK_LOTES,
    });

    expect(prep.itensDevolucao).toHaveLength(4);
    expect(prep.itensDevolucao.every((i) => i.status === 'PENDENTE')).toBe(true);

    // Concluir a aplicação na pistola não encerra as movimentações de devolução
    const prepPosAplicacao = registrarConclusaoAplicacao(prep);
    expect(prepPosAplicacao.aplicacaoConcluidaEm).toBeDefined();
    expect(prepPosAplicacao.status).toBe('APLICACAO_CONCLUIDA');

    const progresso = calcularProgressoDevolucao(prepPosAplicacao);
    expect(progresso.pendentes).toBe(4);
    expect(progresso.podeFinalizarPreparacao).toBe(false);
  });

  it('deve permitir devolver o componente 1, descartar o 2, devolver o 3 e devolver o 4 sem encerrar prematuramente', () => {
    let prep = criarPreparacaoDevolucao({
      id: 'PREP-TEST-02',
      ordemServico: os,
      receita,
      operador,
      volumeTotal: 1000,
      valoresDosados: { 1: 500, 2: 250, 3: 200, 4: 50 },
      lotesDisponiveis: MOCK_LOTES,
    });

    const checklistCompleto = { chk1: true, chk2: true, chk3: true };

    // 1. Devolver Laca Branca (Item 1)
    const r1 = registrarMovimentacaoComponente({
      preparacao: prep,
      itemId: 'PREP-TEST-02-ITEM-1',
      saldoRestanteMl: 500,
      destino: 'DEVOLVIDO_AO_ESTOQUE',
      checklistAprovado: checklistCompleto,
      operador,
      criteriosAplicaveis: MOCK_PRODUTOS[0].criteriosDevolucao || MOCK_CHECKLIST_SOBRAS,
    });

    expect(r1.sucesso).toBe(true);
    prep = r1.preparacaoAtualizada;
    expect(prep.status).toBe('DEVOLUCAO_EM_ANDAMENTO');
    expect(r1.proximoItemPendenteId).toBe('PREP-TEST-02-ITEM-2');
    expect(calcularProgressoDevolucao(prep).podeFinalizarPreparacao).toBe(false);

    // Tentativa de encerrar com 3 pendentes deve ser bloqueada
    const tentativaEncerrar = encerrarPreparacao(prep);
    expect(tentativaEncerrar.sucesso).toBe(false);

    // 2. Descartar Catalisador (Item 2) como refugo
    const r2 = registrarMovimentacaoComponente({
      preparacao: prep,
      itemId: 'PREP-TEST-02-ITEM-2',
      saldoRestanteMl: 120,
      destino: 'DESCARTADO_COMO_REFUGO',
      checklistAprovado: { chk1: false, chk2: true, chk3: true },
      operador,
      criteriosAplicaveis: MOCK_PRODUTOS[1].criteriosDevolucao || MOCK_CHECKLIST_SOBRAS,
    });

    expect(r2.sucesso).toBe(true);
    prep = r2.preparacaoAtualizada;
    expect(prep.status).toBe('DEVOLUCAO_EM_ANDAMENTO');
    expect(r2.proximoItemPendenteId).toBe('PREP-TEST-02-ITEM-3');
    expect(calcularProgressoDevolucao(prep).podeFinalizarPreparacao).toBe(false);

    // 3. Devolver Diluidor (Item 3)
    const r3 = registrarMovimentacaoComponente({
      preparacao: prep,
      itemId: 'PREP-TEST-02-ITEM-3',
      saldoRestanteMl: 800,
      destino: 'DEVOLVIDO_AO_ESTOQUE',
      checklistAprovado: { chk1: true, chk2: true },
      operador,
      criteriosAplicaveis: MOCK_PRODUTOS[2].criteriosDevolucao || MOCK_CHECKLIST_SOBRAS,
    });

    expect(r3.sucesso).toBe(true);
    prep = r3.preparacaoAtualizada;
    expect(r3.proximoItemPendenteId).toBe('PREP-TEST-02-ITEM-4');
    expect(calcularProgressoDevolucao(prep).podeFinalizarPreparacao).toBe(false);

    // 4. Devolver Retardador (Item 4)
    const r4 = registrarMovimentacaoComponente({
      preparacao: prep,
      itemId: 'PREP-TEST-02-ITEM-4',
      saldoRestanteMl: 450,
      destino: 'DEVOLVIDO_AO_ESTOQUE',
      checklistAprovado: { chk1: true, chk2: true },
      operador,
      criteriosAplicaveis: MOCK_PRODUTOS[3].criteriosDevolucao || MOCK_CHECKLIST_SOBRAS,
    });

    expect(r4.sucesso).toBe(true);
    prep = r4.preparacaoAtualizada;
    expect(prep.status).toBe('DEVOLUCAO_CONCLUIDA');
    expect(prep.statusDevolucao).toBe('DEVOLUCAO_CONCLUIDA');
    expect(r4.proximoItemPendenteId).toBeNull();
    expect(calcularProgressoDevolucao(prep).podeFinalizarPreparacao).toBe(true);
  });

  it('deve remover imediatamente a preparação concluída da lista de pendências e nunca reexibir seus 4 componentes como pendentes ao voltar ao início', async () => {
    const repo = new MockPreparacaoRepository();
    await repo.resetar();

    let prep = criarPreparacaoDevolucao({
      id: 'PREP-NAO-REAPARECER',
      ordemServico: os,
      receita,
      operador,
      volumeTotal: 1000,
      valoresDosados: { 1: 500, 2: 250, 3: 200, 4: 50 },
      lotesDisponiveis: MOCK_LOTES,
    });

    const checklistCompleto = { chk1: true, chk2: true, chk3: true };

    // Resolve todos os 4 itens (mesmo sem clicar em "Encerrar Preparação Completa")
    for (const item of prep.itensDevolucao) {
      const res = registrarMovimentacaoComponente({
        preparacao: prep,
        itemId: item.id,
        saldoRestanteMl: 300,
        destino: 'DEVOLVIDO_AO_ESTOQUE',
        checklistAprovado: checklistCompleto,
        operador,
        criteriosAplicaveis: MOCK_CHECKLIST_SOBRAS,
      });
      prep = res.preparacaoAtualizada;
    }

    await repo.salvar(prep);

    // 1. Verifica que temItensPendentesDevolucao é false
    expect(temItensPendentesDevolucao(prep)).toBe(false);

    // 2. Verifica que a preparação NÃO aparece em listarPendentesDevolucao()
    const pendentes = await repo.listarPendentesDevolucao();
    expect(pendentes.find((p) => p.id === 'PREP-NAO-REAPARECER')).toBeUndefined();

    // 3. Verifica que a preparação está disponível apenas no histórico concluído
    const historico = await repo.listarHistoricoConcluidas();
    expect(historico.find((p) => p.id === 'PREP-NAO-REAPARECER')).toBeDefined();

    await repo.resetar();
  });

  it('deve separar componentes com PENDENTE_DE_CONFERENCIA na seção própria sem misturá-los como devolução pendente', () => {
    let prep = criarPreparacaoDevolucao({
      id: 'PREP-CONFERENCIA-SEPARADA',
      ordemServico: os,
      receita,
      operador,
      volumeTotal: 1000,
      valoresDosados: { 1: 500, 2: 250, 3: 200, 4: 50 },
      lotesDisponiveis: MOCK_LOTES,
    });

    const checklistCompleto = { chk1: true, chk2: true, chk3: true };

    // Item 1 vai para conferência técnica; Itens 2, 3 e 4 são devolvidos ao estoque
    prep = registrarMovimentacaoComponente({
      preparacao: prep,
      itemId: 'PREP-CONFERENCIA-SEPARADA-ITEM-1',
      saldoRestanteMl: 400,
      destino: 'PENDENTE_DE_CONFERENCIA',
      checklistAprovado: { chk1: false, chk2: true, chk3: true },
      operador,
      criteriosAplicaveis: MOCK_CHECKLIST_SOBRAS,
    }).preparacaoAtualizada;

    for (const id of [
      'PREP-CONFERENCIA-SEPARADA-ITEM-2',
      'PREP-CONFERENCIA-SEPARADA-ITEM-3',
      'PREP-CONFERENCIA-SEPARADA-ITEM-4',
    ]) {
      prep = registrarMovimentacaoComponente({
        preparacao: prep,
        itemId: id,
        saldoRestanteMl: 200,
        destino: 'DEVOLVIDO_AO_ESTOQUE',
        checklistAprovado: checklistCompleto,
        operador,
        criteriosAplicaveis: MOCK_CHECKLIST_SOBRAS,
      }).preparacaoAtualizada;
    }

    expect(prep.statusDevolucao).toBe('AGUARDANDO_CONFERENCIA');

    // Não deve aparecer como pendente de devolução pelo operador
    expect(filtrarPreparacoesPendentesDevolucao([prep])).toHaveLength(0);

    // Deve aparecer na seção específica de conferência técnica
    const emConferencia = filtrarPreparacoesEmConferencia([prep]);
    expect(emConferencia).toHaveLength(1);
    expect(emConferencia[0].id).toBe('PREP-CONFERENCIA-SEPARADA');

    // E não deve aparecer como histórico totalmente concluído ainda
    expect(filtrarPreparacoesHistoricoConcluido([prep])).toHaveLength(0);

    // Quando a conferência técnica aprova o item pendente de conferência:
    const resConferencia = registrarMovimentacaoComponente({
      preparacao: prep,
      itemId: 'PREP-CONFERENCIA-SEPARADA-ITEM-1',
      saldoRestanteMl: 400,
      destino: 'DEVOLVIDO_AO_ESTOQUE',
      checklistAprovado: {},
      operador,
      criteriosAplicaveis: MOCK_CHECKLIST_SOBRAS,
      aprovacaoConferenciaTecnica: true,
    });

    expect(resConferencia.sucesso).toBe(true);
    const prepPosConferencia = resConferencia.preparacaoAtualizada;
    expect(prepPosConferencia.statusDevolucao).toBe('DEVOLUCAO_CONCLUIDA');
    expect(filtrarPreparacoesEmConferencia([prepPosConferencia])).toHaveLength(0);
    expect(filtrarPreparacoesHistoricoConcluido([prepPosConferencia])).toHaveLength(1);
  });

  it('deve permitir confirmar componente zerado / sem sobra (EMBALAGEM_ESGOTADA com 0 ml) sem exigir checklist de armazenamento', () => {
    const prep = criarPreparacaoDevolucao({
      id: 'PREP-ZERO-SOBRA',
      ordemServico: os,
      receita,
      operador,
      volumeTotal: 1000,
      valoresDosados: { 1: 500, 2: 250, 3: 200, 4: 50 },
      lotesDisponiveis: MOCK_LOTES,
    });

    const resultado = registrarMovimentacaoComponente({
      preparacao: prep,
      itemId: 'PREP-ZERO-SOBRA-ITEM-2', // Catalisador que veio com 0 ml restantes
      saldoRestanteMl: 0,
      destino: 'EMBALAGEM_ESGOTADA',
      checklistAprovado: {}, // Não exige checklist pois a lata esgotou
      operador,
      criteriosAplicaveis: MOCK_PRODUTOS[1].criteriosDevolucao || MOCK_CHECKLIST_SOBRAS,
    });

    expect(resultado.sucesso).toBe(true);
    expect(resultado.itemAtualizado?.status).toBe('EMBALAGEM_ESGOTADA');
    expect(resultado.itemAtualizado?.saldoRestanteInformadoMl).toBe(0);
    expect(resultado.proximoItemPendenteId).toBe('PREP-ZERO-SOBRA-ITEM-1');

    const progresso = calcularProgressoDevolucao(resultado.preparacaoAtualizada);
    expect(progresso.embalagensEsgotadas).toBe(1);
    expect(progresso.pendentes).toBe(3);
  });

  it('deve bloquear devolução ao estoque quando o checklist do produto for reprovado e impedir devolução duplicada', () => {
    const prep = criarPreparacaoDevolucao({
      id: 'PREP-TEST-03',
      ordemServico: os,
      receita,
      operador,
      volumeTotal: 1000,
      valoresDosados: { 1: 500, 2: 250, 3: 200, 4: 50 },
      lotesDisponiveis: MOCK_LOTES,
    });

    // Tenta devolver ao estoque com checklist incompleto
    const reprovado = registrarMovimentacaoComponente({
      preparacao: prep,
      itemId: 'PREP-TEST-03-ITEM-1',
      saldoRestanteMl: 400,
      destino: 'DEVOLVIDO_AO_ESTOQUE',
      checklistAprovado: { chk1: true, chk2: false, chk3: true },
      operador,
      criteriosAplicaveis: MOCK_PRODUTOS[0].criteriosDevolucao || MOCK_CHECKLIST_SOBRAS,
    });

    expect(reprovado.sucesso).toBe(false);
    expect(reprovado.erro).toContain('vedação');

    // Aprova e devolve
    const aprovado = registrarMovimentacaoComponente({
      preparacao: prep,
      itemId: 'PREP-TEST-03-ITEM-1',
      saldoRestanteMl: 400,
      destino: 'DEVOLVIDO_AO_ESTOQUE',
      checklistAprovado: { chk1: true, chk2: true, chk3: true },
      operador,
      criteriosAplicaveis: MOCK_PRODUTOS[0].criteriosDevolucao || MOCK_CHECKLIST_SOBRAS,
    });
    expect(aprovado.sucesso).toBe(true);

    // Tenta devolver novamente a mesma embalagem -> bloqueado contra duplicidade
    const duplicado = registrarMovimentacaoComponente({
      preparacao: aprovado.preparacaoAtualizada,
      itemId: 'PREP-TEST-03-ITEM-1',
      saldoRestanteMl: 400,
      destino: 'DEVOLVIDO_AO_ESTOQUE',
      checklistAprovado: { chk1: true, chk2: true, chk3: true },
      operador,
      criteriosAplicaveis: MOCK_PRODUTOS[0].criteriosDevolucao || MOCK_CHECKLIST_SOBRAS,
    });
    expect(duplicado.sucesso).toBe(false);
    expect(duplicado.erro).toContain('não pode ser movimentado duplicadamente');
  });

  it('deve avaliar critérios específicos por produto e sinalizar quando requer homologação técnica', () => {
    const primerNaoHomologado = MOCK_PRODUTOS.find((p) => p.id === 6);
    const avaliacao = avaliarChecklistProduto(primerNaoHomologado, MOCK_CHECKLIST_SOBRAS, {
      chk1: true,
      chk2: true,
      chk3: true,
    });

    expect(avaliacao.aprovado).toBe(true);
    expect(avaliacao.requerHomologacaoTecnica).toBe(true);
  });

  it('deve classificar corretamente códigos QR entre Ordem de Serviço e Embalagem/Lote', () => {
    const qrOS = classificarQrCode('OS #8843', MOCK_ORDENS_SERVICO, MOCK_LOTES, MOCK_PRODUTOS);
    expect(qrOS.tipo).toBe('ORDEM_SERVICO');
    expect(qrOS.ordemServico?.numero).toBe('OS #8843');

    const qrLote = classificarQrCode('#SY-7410', MOCK_ORDENS_SERVICO, MOCK_LOTES, MOCK_PRODUTOS);
    expect(qrLote.tipo).toBe('EMBALAGEM_LOTE');
    expect(qrLote.lote?.codigo).toBe('#SY-7410');

    const qrEtiquetaSobra = classificarQrCode(
      '#SOBRA-SY-6032-1',
      MOCK_ORDENS_SERVICO,
      MOCK_LOTES,
      MOCK_PRODUTOS
    );
    expect(qrEtiquetaSobra.tipo).toBe('EMBALAGEM_LOTE');
    expect(qrEtiquetaSobra.lote?.codigo).toBe('#SY-6032');
  });
});
