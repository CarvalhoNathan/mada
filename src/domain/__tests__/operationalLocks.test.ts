import { describe, it, expect } from 'vitest';
import {
  verificarBloqueioNovaPreparacaoCabine,
  verificarPermissaoDevolucaoDuranteAplicacao,
  verificarPermissaoConsultaNaoConflitante,
  buscarAplicacaoAtivaPorCabine,
  buscarPreparacaoComSobrasPendentesPorCabine,
  possuiSobrasPendentesDevolucao,
} from '../operationalLocks';
import {
  criarPreparacaoDevolucao,
  registrarConclusaoAplicacao,
  registrarMovimentacaoComponente,
} from '../returnFlow';
import {
  MOCK_ORDENS_SERVICO,
  MOCK_RECEITAS,
  MOCK_OPERADORES,
  MOCK_LOTES,
} from '../../data/mock/mockData';
import { MockPreparacaoRepository } from '../../data/mock/mockRepositories';

describe('Bloqueios Operacionais Inteligentes por Cabine/Equipamento', () => {
  const os1 = MOCK_ORDENS_SERVICO[0];
  const os2 = MOCK_ORDENS_SERVICO[1];
  const receita = MOCK_RECEITAS[0];
  const opCabine1 = MOCK_OPERADORES[0]; // Carlos Silva • CABINE-01
  const opCabine2 = MOCK_OPERADORES[1]; // Ana Souza • CABINE-02

  it('deve bloquear nova preparação na Cabine 01 enquanto houver aplicação ativa na Cabine 01, mantendo Cabine 02 livre', () => {
    const prepAtivaCabine1 = criarPreparacaoDevolucao({
      id: 'PREP-CAB1-ATIVA',
      ordemServico: os1,
      receita,
      operador: opCabine1,
      volumeTotal: 1000,
      valoresDosados: { 1: 500, 2: 250, 3: 200, 4: 50 },
      lotesDisponiveis: MOCK_LOTES,
      cabineId: 'CABINE-01',
      cabineNome: 'Cabine 01',
    });

    const listaPreparacoes = [prepAtivaCabine1];

    // Cabine 01 deve estar bloqueada para nova preparação conflitante
    const checkCabine1 = verificarBloqueioNovaPreparacaoCabine(
      listaPreparacoes,
      'CABINE-01',
      'Cabine 01'
    );
    expect(checkCabine1.permitido).toBe(false);
    expect(checkCabine1.preparacaoAtiva?.id).toBe('PREP-CAB1-ATIVA');
    expect(checkCabine1.motivoBloqueio).toContain('Cabine 01');

    // Cabine 02 está livre -> liberada para iniciar nova preparação simultaneamente
    const checkCabine2 = verificarBloqueioNovaPreparacaoCabine(
      listaPreparacoes,
      'CABINE-02',
      'Cabine 02'
    );
    expect(checkCabine2.permitido).toBe(true);
    expect(checkCabine2.preparacaoAtiva).toBeUndefined();

    // Consultas não conflitantes continuam liberadas
    expect(verificarPermissaoConsultaNaoConflitante().permitido).toBe(true);
  });

  it('deve bloquear nova preparação se a preparação anterior na cabine tiver sobras pendentes de devolução, liberando apenas quando todas forem resolvidas', () => {
    const prepCabine1 = criarPreparacaoDevolucao({
      id: 'PREP-CAB1-SOBRAS-PENDENTES',
      ordemServico: os1,
      receita,
      operador: opCabine1,
      volumeTotal: 1000,
      valoresDosados: { 1: 500, 2: 250, 3: 200, 4: 50 },
      lotesDisponiveis: MOCK_LOTES,
      cabineId: 'CABINE-01',
      cabineNome: 'Cabine 01',
    });

    // 1. Conclui a aplicação da pintura na pistola
    const prepPosAplicacao = registrarConclusaoAplicacao(
      prepCabine1,
      '2026-11-08T17:15:00.000Z'
    );

    expect(prepPosAplicacao.statusAplicacao).toBe('APLICACAO_CONCLUIDA');
    expect(prepPosAplicacao.statusDevolucao).toBe('DEVOLUCAO_PENDENTE');
    expect(possuiSobrasPendentesDevolucao(prepPosAplicacao)).toBe(true);
    expect(buscarPreparacaoComSobrasPendentesPorCabine([prepPosAplicacao], 'CABINE-01')).toBeDefined();

    // 2. Trava anti-abandono: tenta iniciar nova preparação com embalagens ainda pendentes na bancada
    const checkComSobras = verificarBloqueioNovaPreparacaoCabine(
      [prepPosAplicacao],
      'CABINE-01',
      'Cabine 01'
    );
    expect(checkComSobras.permitido).toBe(false);
    expect(checkComSobras.motivoBloqueio).toContain('Bloqueio de sobras pendentes');
    expect(checkComSobras.motivoBloqueio).toContain(os1.numero);

    // Cabine 02 opera de forma independente e não é bloqueada
    const checkCabine2 = verificarBloqueioNovaPreparacaoCabine(
      [prepPosAplicacao],
      'CABINE-02',
      'Cabine 02'
    );
    expect(checkCabine2.permitido).toBe(true);

    // 3. O operador resolve todas as embalagens (devolução ao estoque / esgotadas)
    let prepResolvida = prepPosAplicacao;
    for (const item of prepPosAplicacao.itensDevolucao) {
      const res = registrarMovimentacaoComponente({
        preparacao: prepResolvida,
        itemId: item.id,
        saldoRestanteMl: 200,
        destino: 'DEVOLVIDO_AO_ESTOQUE',
        checklistAprovado: {
          'lata-limpa': true,
          'tampa-vedada': true,
          'sem-contaminacao': true,
          'rotulo-legivel': true,
        },
        operador: opCabine1,
        criteriosAplicaveis: [],
      });
      prepResolvida = res.preparacaoAtualizada;
    }

    expect(possuiSobrasPendentesDevolucao(prepResolvida)).toBe(false);

    // 4. Agora que todas as sobras foram conferidas e devolvidas, a Cabine 01 está liberada para a próxima OS!
    const checkLiberado = verificarBloqueioNovaPreparacaoCabine(
      [prepResolvida],
      'CABINE-01',
      'Cabine 01'
    );
    expect(checkLiberado.permitido).toBe(true);
    expect(checkLiberado.preparacaoAtiva).toBeUndefined();
  });

  it('deve impedir que o operador inicie devolução de sobras não relacionadas enquanto aplica na cabine', () => {
    const prepAntigaDevolucao = registrarConclusaoAplicacao(
      criarPreparacaoDevolucao({
        id: 'PREP-ANTIGA-01',
        ordemServico: os1,
        receita,
        operador: opCabine1,
        volumeTotal: 1000,
        valoresDosados: { 1: 500, 2: 250, 3: 200, 4: 50 },
        lotesDisponiveis: MOCK_LOTES,
        cabineId: 'CABINE-01',
      })
    );

    const prepAtivaAgora = criarPreparacaoDevolucao({
      id: 'PREP-ATIVA-AGORA',
      ordemServico: os2,
      receita,
      operador: opCabine1,
      volumeTotal: 700,
      valoresDosados: { 1: 350, 2: 175, 3: 140, 4: 35 },
      lotesDisponiveis: MOCK_LOTES,
      cabineId: 'CABINE-01',
    });

    const lista = [prepAtivaAgora, prepAntigaDevolucao];

    // Tentar movimentar devolução da preparação antiga não relacionada durante aplicação ativa -> bloqueado
    const permOutraPrep = verificarPermissaoDevolucaoDuranteAplicacao(
      lista,
      'CABINE-01',
      'PREP-ANTIGA-01',
      'Cabine 01'
    );
    expect(permOutraPrep.permitido).toBe(false);

    // Acessar a própria preparação ativa -> permitido
    const permPropriaPrep = verificarPermissaoDevolucaoDuranteAplicacao(
      lista,
      'CABINE-01',
      'PREP-ATIVA-AGORA',
      'Cabine 01'
    );
    expect(permPropriaPrep.permitido).toBe(true);

    // Outra cabine (Cabine 02) não é bloqueada pela Cabine 01
    const permCabine2 = verificarPermissaoDevolucaoDuranteAplicacao(
      lista,
      'CABINE-02',
      'PREP-ANTIGA-01',
      'Cabine 02'
    );
    expect(permCabine2.permitido).toBe(true);
    expect(opCabine2.cabineId).toBe('CABINE-02');
  });

  it('deve persistir o bloqueio de cabine através do repositório após recarregamento', async () => {
    const repo = new MockPreparacaoRepository();
    await repo.resetar();

    const novaAtiva = criarPreparacaoDevolucao({
      id: 'PREP-PERSIST-LOCK',
      ordemServico: os1,
      receita,
      operador: opCabine1,
      volumeTotal: 1000,
      valoresDosados: { 1: 500, 2: 250, 3: 200, 4: 50 },
      lotesDisponiveis: MOCK_LOTES,
      cabineId: 'CABINE-01',
      cabineNome: 'Cabine 01',
    });

    await repo.salvar(novaAtiva);

    // Instancia um novo repositório simulando recarregamento da página (F5)
    const repoPosReload = new MockPreparacaoRepository();
    const ativaEncontrada = await repoPosReload.buscarAplicacaoAtivaPorCabine('CABINE-01');
    expect(ativaEncontrada).toBeDefined();
    expect(ativaEncontrada?.id).toBe('PREP-PERSIST-LOCK');

    await repoPosReload.resetar();
  });

  it('deve blindar verificação de bloqueio contra listas nulas, indefinidas ou cabines vazias', () => {
    // Listas nulas ou não-arrays
    // @ts-expect-error teste com tipo inválido para resiliência de runtime
    const checkNull = verificarBloqueioNovaPreparacaoCabine(null, 'CABINE-01');
    expect(checkNull.permitido).toBe(true);

    // Cabine vazia
    const checkVazia = verificarBloqueioNovaPreparacaoCabine([], '');
    expect(checkVazia.permitido).toBe(true);

    // buscarAplicacaoAtivaPorCabine com parâmetros nulos
    // @ts-expect-error teste de runtime
    expect(buscarAplicacaoAtivaPorCabine(undefined, 'CABINE-01')).toBeUndefined();
    expect(buscarAplicacaoAtivaPorCabine([], '')).toBeUndefined();
  });
});
