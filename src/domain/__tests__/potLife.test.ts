import { describe, it, expect } from 'vitest';
import {
  obterDuracaoPotLifeHomologada,
  calcularEstadoPotLife,
  iniciarAplicacaoPistola,
  sincronizarEstadoPotLifePreparacao,
  registrarOcorrenciaResiduoMistura,
  ORIENTACAO_NEUTRA_POT_LIFE_EXPIRADO,
} from '../potLife';
import { criarPreparacaoDevolucao } from '../returnFlow';
import {
  MOCK_ORDENS_SERVICO,
  MOCK_RECEITAS,
  MOCK_OPERADORES,
  MOCK_LOTES,
  MOCK_PRODUTOS,
} from '../../data/mock/mockData';
import { MockResiduoMisturaRepository } from '../../data/mock/mockRepositories';

describe('Controle de Pot Life, Alertas e Registro de Resíduos da Mistura', () => {
  const os = MOCK_ORDENS_SERVICO[0];
  const receita = MOCK_RECEITAS[0]; // Laca Branca PU • potLifeMinutos: 20
  const operador = MOCK_OPERADORES[0];

  it('deve obter a duração de Pot Life exclusivamente de dados técnicos cadastrados na receita ou produto', () => {
    const duracaoReceitaHomologada = obterDuracaoPotLifeHomologada(receita, MOCK_PRODUTOS);
    expect(duracaoReceitaHomologada).toBe(20);

    // Se nem a receita nem os produtos tiverem potLifeMinutos cadastrado, retorna null (não inventa valor padrão)
    const receitaSemParametro = {
      ...receita,
      potLifeMinutos: undefined,
      itens: [],
    };
    expect(obterDuracaoPotLifeHomologada(receitaSemParametro, [])).toBeNull();
  });

  it('deve iniciar o cronômetro somente na conclusão da dosagem (dosagemConcluidaEm) e manter contagem absoluta', () => {
    const t0Iso = '2026-11-08T15:00:00.000Z';
    const t0Ms = new Date(t0Iso).getTime();

    const prep = criarPreparacaoDevolucao({
      id: 'PREP-POTLIFE-01',
      ordemServico: os,
      receita,
      operador,
      volumeTotal: 1000,
      valoresDosados: { 1: 500, 2: 250, 3: 200, 4: 50 },
      lotesDisponiveis: MOCK_LOTES,
      produtosDisponiveis: MOCK_PRODUTOS,
      criadaEm: t0Iso,
      dosagemConcluidaEm: t0Iso,
    });

    expect(prep.dosagemConcluidaEm).toBe(t0Iso);
    expect(prep.potLifeMinutos).toBe(20);

    // Após 8 minutos (480 segundos) -> Tempo normal
    const apos8MinMs = t0Ms + 8 * 60 * 1000;
    const estado8Min = calcularEstadoPotLife(prep.dosagemConcluidaEm!, prep.potLifeMinutos!, apos8MinMs);
    expect(estado8Min.status).toBe('NORMAL');
    expect(estado8Min.segundosRestantes).toBe(12 * 60);
    expect(estado8Min.expirado).toBe(false);

    // Após 17 minutos (restam 3 min) -> Alerta preventivo (PROXIMO_LIMITE)
    const apos17MinMs = t0Ms + 17 * 60 * 1000;
    const estado17Min = calcularEstadoPotLife(
      prep.dosagemConcluidaEm!,
      prep.potLifeMinutos!,
      apos17MinMs
    );
    expect(estado17Min.status).toBe('PROXIMO_LIMITE');
    expect(estado17Min.proximoLimite).toBe(true);
    expect(estado17Min.segundosRestantes).toBe(3 * 60);
  });

  it('não deve reiniciar o cronômetro quando a mistura é transferida/iniciada na pistola', () => {
    const dosagemIso = '2026-11-08T15:00:00.000Z';
    const inicioPistolaIso = '2026-11-08T15:05:00.000Z';

    const prep = criarPreparacaoDevolucao({
      id: 'PREP-PISTOLA-01',
      ordemServico: os,
      receita,
      operador,
      volumeTotal: 1000,
      valoresDosados: { 1: 500, 2: 250, 3: 200, 4: 50 },
      lotesDisponiveis: MOCK_LOTES,
      dosagemConcluidaEm: dosagemIso,
    });

    const prepEmAplicacao = iniciarAplicacaoPistola(prep, inicioPistolaIso);

    // O timestamp de referência do Pot Life permanece intacto (dosagemConcluidaEm)
    expect(prepEmAplicacao.dosagemConcluidaEm).toBe(dosagemIso);
    expect(prepEmAplicacao.aplicacaoIniciadaEm).toBe(inicioPistolaIso);

    // 10 minutos após a dosagem (5 min após colocar na pistola), devem restar 10 minutos (e não 15!)
    const dezMinAposDosagemMs = new Date('2026-11-08T15:10:00.000Z').getTime();
    const estado = calcularEstadoPotLife(
      prepEmAplicacao.dosagemConcluidaEm!,
      prepEmAplicacao.potLifeMinutos!,
      dezMinAposDosagemMs
    );
    expect(estado.segundosRestantes).toBe(10 * 60);
  });

  it('deve manter o tempo restante exato após recarregar a página, sair ou entrar novamente', () => {
    const dosagemIso = '2026-11-08T16:00:00.000Z';
    // Simula que o operador recarregou a página às 16:14:30
    const reloadMs = new Date('2026-11-08T16:14:30.000Z').getTime();

    const estadoPosReload = calcularEstadoPotLife(dosagemIso, 20, reloadMs);
    expect(estadoPosReload.segundosDecorridos).toBe(14 * 60 + 30);
    expect(estadoPosReload.segundosRestantes).toBe(5 * 60 + 30);
    expect(estadoPosReload.status).toBe('NORMAL');
  });

  it('deve transicionar para POT_LIFE_EXPIRADO, registrar horário de expiração e exibir orientação neutra sem finalizar a aplicação', () => {
    const dosagemIso = '2026-11-08T16:00:00.000Z';
    const apos21MinMs = new Date('2026-11-08T16:21:00.000Z').getTime();

    const prep = criarPreparacaoDevolucao({
      id: 'PREP-EXP-01',
      ordemServico: os,
      receita,
      operador,
      volumeTotal: 1000,
      valoresDosados: { 1: 500, 2: 250, 3: 200, 4: 50 },
      lotesDisponiveis: MOCK_LOTES,
      dosagemConcluidaEm: dosagemIso,
    });

    const prepExpirada = sincronizarEstadoPotLifePreparacao(prep, apos21MinMs);

    expect(prepExpirada.statusPotLife).toBe('POT_LIFE_EXPIRADO');
    expect(prepExpirada.statusAplicacao).toBe('POT_LIFE_EXPIRADO');
    expect(prepExpirada.status).toBe('POT_LIFE_EXPIRADO');
    expect(prepExpirada.potLifeExpiradoEm).toBe('2026-11-08T16:20:00.000Z');
    // Não encerra automaticamente a aplicação
    expect(prepExpirada.aplicacaoConcluidaEm).toBeUndefined();

    // Verifica que a mensagem contextual é a orientação neutra exigida
    const calculo = calcularEstadoPotLife(dosagemIso, 20, apos21MinMs);
    expect(calculo.mensagemContextual).toBe(ORIENTACAO_NEUTRA_POT_LIFE_EXPIRADO);
  });

  it('deve registrar ocorrência e resíduo da mistura na pistola, béquer ou outro recipiente separadamente do estoque', async () => {
    const dosagemIso = '2026-11-08T16:00:00.000Z';
    const apos22MinIso = '2026-11-08T16:22:00.000Z';

    const prep = criarPreparacaoDevolucao({
      id: 'PREP-OCORRENCIA-01',
      ordemServico: os,
      receita,
      operador,
      volumeTotal: 1000,
      valoresDosados: { 1: 500, 2: 250, 3: 200, 4: 50 },
      lotesDisponiveis: MOCK_LOTES,
      dosagemConcluidaEm: dosagemIso,
    });

    const { preparacaoAtualizada, ocorrencia } = registrarOcorrenciaResiduoMistura({
      preparacao: prep,
      operador,
      localMistura: 'pistola',
      quantidadeRestanteMl: 300,
      ocorrenciaRelacionada: 'Tempo de Pot Life ultrapassado com mistura na pistola',
      registradaEm: apos22MinIso,
    });

    expect(ocorrencia.localMistura).toBe('pistola');
    expect(ocorrencia.quantidadeRestanteMl).toBe(300);
    expect(ocorrencia.situacaoPotLife).toBe('POT_LIFE_EXPIRADO');
    expect(ocorrencia.ordemServicoNumero).toBe(os.numero);
    expect(preparacaoAtualizada.status).toBe('OCORRENCIA_REGISTRADA');
    expect(preparacaoAtualizada.ocorrenciasMistura).toHaveLength(1);

    // Os itens de devolução das embalagens originais permanecem intactos e separados
    expect(preparacaoAtualizada.itensDevolucao.every((it) => it.status === 'PENDENTE')).toBe(true);

    // Persistência no repositório próprio de resíduos de mistura
    const repo = new MockResiduoMisturaRepository();
    await repo.resetar();
    await repo.registrar(ocorrencia);
    const listados = await repo.listarPorPreparacao(prep.id);
    expect(listados).toHaveLength(1);
    expect(listados[0].localMistura).toBe('pistola');
  });

  it('deve blindar cálculo de Pot Life contra datas corrompidas ou parâmetros nulos', () => {
    // Data de dosagem vazia ou corrompida: não deve retornar NaN
    const estadoDataInvalida = calcularEstadoPotLife('data-invalida', 20, 1000000);
    expect(Number.isFinite(estadoDataInvalida.duracaoSegundos)).toBe(true);
    expect(Number.isFinite(estadoDataInvalida.segundosRestantes)).toBe(true);
    expect(estadoDataInvalida.duracaoSegundos).toBe(1200); // 20 * 60

    // potLifeMinutos inválido (NaN ou 0): fallback seguro
    const estadoPotLifeZero = calcularEstadoPotLife(new Date().toISOString(), NaN);
    expect(estadoPotLifeZero.duracaoSegundos).toBe(1200);

    // obterDuracaoPotLifeHomologada com receita nula ou itens vazios
    expect(obterDuracaoPotLifeHomologada(null, [])).toBeNull();
    expect(obterDuracaoPotLifeHomologada({ potLifeMinutos: 0, itens: [] }, [])).toBeNull();
  });
});
