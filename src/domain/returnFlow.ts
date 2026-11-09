import {
  Preparacao,
  ItemDevolucaoComponente,
  StatusPreparacao,
  StatusItemDevolucao,
  StatusDevolucaoPreparacao,
  Receita,
  OrdemServico,
  Operador,
  Lote,
  Produto,
  CriterioChecklistProduto,
} from '../types';
import { ordenarLotesFEFO, alocarConsumoMultiLoteFEFO } from './fefo';
import { obterDuracaoPotLifeHomologada } from './potLife';
import { obterCabineOperador } from './operationalLocks';

export interface ParametrosCriacaoPreparacao {
  id?: string;
  ordemServico: OrdemServico;
  receita: Receita;
  operador: Operador;
  volumeTotal: number;
  valoresDosados: Record<number, number>;
  lotesDisponiveis: Lote[];
  produtosDisponiveis?: Produto[];
  criadaEm?: string;
  dosagemConcluidaEm?: string;
  cabineId?: string;
  cabineNome?: string;
}

/**
 * Cria uma nova Preparação após a conclusão da dosagem no béquer, gerando:
 * - Os itens individuais de devolução para cada componente utilizado na receita;
 * - O timestamp absoluto `dosagemConcluidaEm` para início estrito do Pot Life;
 * - A duração técnica homologada `potLifeMinutos` cadastrada na receita/produto;
 * - A vinculação à cabine/equipamento (`cabineId`) para bloqueio operacional inteligente.
 */
export function criarPreparacaoDevolucao(params: ParametrosCriacaoPreparacao): Preparacao {
  const {
    id = `PREP-${Date.now()}`,
    ordemServico,
    receita,
    operador,
    volumeTotal,
    valoresDosados,
    lotesDisponiveis,
    produtosDisponiveis = [],
    criadaEm = new Date().toISOString(),
    dosagemConcluidaEm,
    cabineId,
    cabineNome,
  } = params;

  const timestampDosagem = dosagemConcluidaEm || criadaEm;
  const potLifeHomologado = obterDuracaoPotLifeHomologada(receita, produtosDisponiveis);
  const cabine = obterCabineOperador(operador);

  const itensDevolucao: ItemDevolucaoComponente[] = receita.itens.map((item, idx) => {
    const quantidadeRetiradaMl = valoresDosados[item.id] ?? Math.round(volumeTotal * item.proporcao);
    const lotesProduto = lotesDisponiveis.filter(
      (l) => l.produtoId === item.produtoId && l.quantidadeAtual > 0
    );
    const lotesOrdenados = ordenarLotesFEFO(lotesProduto);
    const planoMultiLote = alocarConsumoMultiLoteFEFO(lotesProduto, quantidadeRetiradaMl);
    const ultimaAlocacao =
      planoMultiLote.alocacoes.length > 0
        ? planoMultiLote.alocacoes[planoMultiLote.alocacoes.length - 1]
        : null;

    const loteOrigem =
      ultimaAlocacao?.lote ||
      lotesOrdenados[0] ||
      lotesDisponiveis.find((l) => l.produtoId === item.produtoId) || {
        id: item.id,
        produtoId: item.produtoId,
        produtoNome: item.produtoNome,
        codigo: `#LT-${item.codigoProduto}`,
        validade: '2027-01-01',
        diasAberto: 1,
        quantidadeAtual: 1000,
        statusUrgencia: 'normal' as const,
        prateleira: 'Prateleira A-01',
      };

    const saldoInicialLataMl = ultimaAlocacao
      ? loteOrigem.quantidadeAtual
      : Math.max(quantidadeRetiradaMl, loteOrigem.quantidadeAtual);
    const saldoRestanteSugerido = ultimaAlocacao
      ? ultimaAlocacao.saldoRestanteLoteMl
      : Math.max(0, saldoInicialLataMl - quantidadeRetiradaMl);
    const cleanCode = loteOrigem.codigo.replace(/^#+/, '');

    return {
      id: `${id}-ITEM-${idx + 1}`,
      preparacaoId: id,
      receitaItemId: item.id,
      produtoId: item.produtoId,
      produtoNome: item.produtoNome,
      codigoProduto: item.codigoProduto,
      papel: item.papel,
      loteId: loteOrigem.id,
      loteCodigo: loteOrigem.codigo,
      embalagemId: `EMB-${cleanCode}-${String(idx + 1).padStart(2, '0')}`,
      prateleiraOrigem: loteOrigem.prateleira || 'Prateleira A-01',
      quantidadeRetiradaMl,
      saldoInicialLataMl,
      saldoRestanteInformadoMl: saldoRestanteSugerido,
      status: 'PENDENTE',
      checklistAprovado: {},
    };
  });

  return {
    id,
    ordemServicoId: ordemServico.id,
    ordemServicoNumero: ordemServico.numero,
    clienteNome: ordemServico.clienteNome,
    projetoNome: ordemServico.projetoNome,
    ambienteNome: ordemServico.ambienteNome,
    receitaId: receita.id,
    receitaNome: receita.nome,
    operadorId: operador.id,
    operadorNome: operador.nome,
    cabineId: cabineId || cabine.cabineId,
    cabineNome: cabineNome || cabine.cabineNome,
    volumeTotal,
    criadaEm,
    dosagemConcluidaEm: timestampDosagem,
    potLifeMinutos: potLifeHomologado ?? undefined,
    status: 'DEVOLUCAO_PENDENTE',
    statusAplicacao: 'PREPARACAO_EM_ANDAMENTO',
    statusPotLife: 'NORMAL',
    statusDevolucao: 'DEVOLUCAO_PENDENTE',
    itensDevolucao,
    ocorrenciasMistura: [],
  };
}

export function itemEstaDefinitivamenteConcluido(status: StatusItemDevolucao): boolean {
  return (
    status === 'DEVOLVIDO_AO_ESTOQUE' ||
    status === 'EMBALAGEM_ESGOTADA' ||
    status === 'DESCARTADO_COMO_REFUGO'
  );
}

/**
 * Calcula o status específico do fluxo de devolução de embalagens da preparação,
 * sem sobrescrever o estado da aplicação ou do Pot Life.
 */
export function calcularStatusDevolucao(preparacao: Preparacao): StatusDevolucaoPreparacao {
  const itens = preparacao.itensDevolucao;
  const total = itens.length;
  if (total === 0) return 'DEVOLUCAO_CONCLUIDA';

  const concluidos = itens.filter((it) => itemEstaDefinitivamenteConcluido(it.status)).length;
  const emConferencia = itens.filter((it) => it.status === 'PENDENTE_DE_CONFERENCIA').length;
  const pendentes = itens.filter((it) => it.status === 'PENDENTE').length;

  if (concluidos === total) {
    return 'DEVOLUCAO_CONCLUIDA';
  }

  if (pendentes === 0 && emConferencia > 0) {
    return 'AGUARDANDO_CONFERENCIA';
  }

  if (concluidos > 0 || emConferencia > 0) {
    return 'DEVOLUCAO_EM_ANDAMENTO';
  }

  return 'DEVOLUCAO_PENDENTE';
}

/**
 * Calcula o status macro coerente da preparação separando a aplicação, o Pot Life e a devolução.
 */
export function calcularStatusPreparacao(preparacao: Preparacao): StatusPreparacao {
  if (preparacao.status === 'PREPARACAO_ENCERRADA') {
    return 'PREPARACAO_ENCERRADA';
  }

  const statusDevolucao = calcularStatusDevolucao(preparacao);

  if (statusDevolucao === 'DEVOLUCAO_CONCLUIDA') {
    return 'DEVOLUCAO_CONCLUIDA';
  }

  if (
    statusDevolucao === 'DEVOLUCAO_EM_ANDAMENTO' ||
    statusDevolucao === 'AGUARDANDO_CONFERENCIA'
  ) {
    return 'DEVOLUCAO_EM_ANDAMENTO';
  }

  if (preparacao.statusAplicacao === 'OCORRENCIA_REGISTRADA') {
    return 'OCORRENCIA_REGISTRADA';
  }

  if (
    preparacao.statusPotLife === 'POT_LIFE_EXPIRADO' &&
    !preparacao.aplicacaoConcluidaEm
  ) {
    return 'POT_LIFE_EXPIRADO';
  }

  if (preparacao.aplicacaoConcluidaEm || preparacao.statusAplicacao === 'APLICACAO_CONCLUIDA') {
    return 'APLICACAO_CONCLUIDA';
  }

  return 'DEVOLUCAO_PENDENTE';
}

/**
 * Conclui a aplicação da mistura (liberando imediatamente a cabine/pistola)
 * sem encerrar automaticamente as movimentações pendentes de devolução de embalagens.
 */
export function registrarConclusaoAplicacao(
  preparacao: Preparacao,
  concluidaEm: string = new Date().toISOString()
): Preparacao {
  const parcial: Preparacao = {
    ...preparacao,
    aplicacaoConcluidaEm: concluidaEm,
    statusAplicacao: 'APLICACAO_CONCLUIDA',
    statusDevolucao: calcularStatusDevolucao(preparacao),
  };

  return {
    ...parcial,
    status: calcularStatusPreparacao(parcial),
  };
}

/**
 * Avalia os critérios de checklist de devolução específicos de um produto.
 */
export interface ResultadoAvaliacaoChecklist {
  aprovado: boolean;
  criteriosPendentes: CriterioChecklistProduto[];
  motivoReprovacao?: string;
  requerHomologacaoTecnica: boolean;
}

export function avaliarChecklistProduto(
  produto: Produto | undefined,
  criteriosFallback: CriterioChecklistProduto[],
  respostas: Record<string, boolean>
): ResultadoAvaliacaoChecklist {
  const criterios =
    produto?.criteriosDevolucao && produto.criteriosDevolucao.length > 0
      ? produto.criteriosDevolucao
      : criteriosFallback;

  const obrigatorios = criterios.filter((c) => c.obrigatorio);
  const pendentes = obrigatorios.filter((c) => !respostas[c.id]);
  const aprovado = pendentes.length === 0;

  return {
    aprovado,
    criteriosPendentes: pendentes,
    motivoReprovacao: !aprovado ? pendentes[0]?.motivoReprovacao : undefined,
    requerHomologacaoTecnica: produto?.configuracaoTecnicaHomologada === false,
  };
}

export interface ProgressoDevolucao {
  totalComponentes: number;
  resolvidos: number;
  concluidosDefinitivos: number;
  pendentes: number;
  emConferencia: number;
  devolvidosEstoque: number;
  embalagensEsgotadas: number;
  descartadosRefugo: number;
  podeFinalizarPreparacao: boolean;
  todosDefinitivamenteConcluidos: boolean;
  proximoItemPendenteId: string | null;
}

/**
 * Calcula o progresso individual e se a preparação inteira pode ser encerrada.
 */
export function calcularProgressoDevolucao(preparacao: Preparacao): ProgressoDevolucao {
  const itens = preparacao.itensDevolucao;
  const totalComponentes = itens.length;
  const devolvidosEstoque = itens.filter((i) => i.status === 'DEVOLVIDO_AO_ESTOQUE').length;
  const embalagensEsgotadas = itens.filter((i) => i.status === 'EMBALAGEM_ESGOTADA').length;
  const descartadosRefugo = itens.filter((i) => i.status === 'DESCARTADO_COMO_REFUGO').length;
  const emConferencia = itens.filter((i) => i.status === 'PENDENTE_DE_CONFERENCIA').length;
  const pendentes = itens.filter((i) => i.status === 'PENDENTE').length;
  const concluidosDefinitivos = devolvidosEstoque + embalagensEsgotadas + descartadosRefugo;

  // Quando não restam itens PENDENTE, a etapa do operador na bancada está concluída
  const todosProcessados = totalComponentes > 0 && pendentes === 0;
  const todosDefinitivamenteConcluidos =
    totalComponentes > 0 && concluidosDefinitivos === totalComponentes;
  const proximoPendente = itens.find((i) => i.status === 'PENDENTE');

  return {
    totalComponentes,
    resolvidos: concluidosDefinitivos + emConferencia,
    concluidosDefinitivos,
    pendentes,
    emConferencia,
    devolvidosEstoque,
    embalagensEsgotadas,
    descartadosRefugo,
    podeFinalizarPreparacao: todosProcessados,
    todosDefinitivamenteConcluidos,
    proximoItemPendenteId: proximoPendente ? proximoPendente.id : null,
  };
}

/**
 * Seletores puros para separar com exatidão:
 * 1. Preparações com componentes realmente PENDENTES de devolução pelo operador;
 * 2. Preparações/componentes aguardando CONFERÊNCIA TÉCNICA;
 * 3. Preparações com devoluções CONCLUÍDAS (histórico).
 */
export function temItensPendentesDevolucao(preparacao: Preparacao): boolean {
  if (
    preparacao.status === 'PREPARACAO_ENCERRADA' ||
    preparacao.status === 'DEVOLUCAO_CONCLUIDA' ||
    preparacao.statusDevolucao === 'DEVOLUCAO_CONCLUIDA'
  ) {
    return false;
  }
  return preparacao.itensDevolucao.some((it) => it.status === 'PENDENTE');
}

export function temItensEmConferencia(preparacao: Preparacao): boolean {
  return preparacao.itensDevolucao.some((it) => it.status === 'PENDENTE_DE_CONFERENCIA');
}

export function devolucaoTotalmenteConcluida(preparacao: Preparacao): boolean {
  return (
    preparacao.itensDevolucao.length > 0 &&
    preparacao.itensDevolucao.every((it) => itemEstaDefinitivamenteConcluido(it.status))
  );
}

export function filtrarPreparacoesPendentesDevolucao(preparacoes: Preparacao[]): Preparacao[] {
  return preparacoes.filter(temItensPendentesDevolucao);
}

export function filtrarPreparacoesEmConferencia(preparacoes: Preparacao[]): Preparacao[] {
  return preparacoes.filter((p) => !temItensPendentesDevolucao(p) && temItensEmConferencia(p));
}

export function filtrarPreparacoesHistoricoConcluido(preparacoes: Preparacao[]): Preparacao[] {
  return preparacoes.filter(
    (p) =>
      p.status === 'PREPARACAO_ENCERRADA' ||
      p.status === 'DEVOLUCAO_CONCLUIDA' ||
      p.statusDevolucao === 'DEVOLUCAO_CONCLUIDA' ||
      devolucaoTotalmenteConcluida(p)
  );
}

export interface ParametrosMovimentacaoComponente {
  preparacao: Preparacao;
  itemId: string;
  saldoRestanteMl: number;
  destino: Exclude<StatusItemDevolucao, 'PENDENTE'>;
  checklistAprovado: Record<string, boolean>;
  operador: Operador;
  criteriosAplicaveis: CriterioChecklistProduto[];
  motivoManual?: string;
  registradoEm?: string;
  aprovacaoConferenciaTecnica?: boolean;
}

export interface ResultadoMovimentacaoComponente {
  sucesso: boolean;
  erro?: string;
  preparacaoAtualizada: Preparacao;
  itemAtualizado?: ItemDevolucaoComponente;
  proximoItemPendenteId: string | null;
}

/**
 * Registra a devolução, descarte ou encaminhamento para conferência de UM componente individual.
 * Garante:
 * - Impedimento de devolução duplicada de embalagem já resolvida;
 * - Validação obrigatória do checklist antes de devolver ao estoque;
 * - Preservação intacta dos demais componentes;
 * - Direcionamento automático para o próximo item pendente sem encerrar a preparação prematuramente;
 * - Quando todos os componentes são devolvidos/descartados, marca `statusDevolucao = 'DEVOLUCAO_CONCLUIDA'`
 *   e `status = 'DEVOLUCAO_CONCLUIDA'`, garantindo que os itens concluídos nunca reapareçam como pendentes.
 */
export function registrarMovimentacaoComponente(
  params: ParametrosMovimentacaoComponente
): ResultadoMovimentacaoComponente {
  const {
    preparacao,
    itemId,
    saldoRestanteMl,
    destino,
    checklistAprovado,
    operador,
    criteriosAplicaveis,
    motivoManual,
    registradoEm = new Date().toISOString(),
    aprovacaoConferenciaTecnica = false,
  } = params;

  const itemExistente = preparacao.itensDevolucao.find((it) => it.id === itemId);
  if (!itemExistente) {
    return {
      sucesso: false,
      erro: 'Componente não encontrado nesta preparação.',
      preparacaoAtualizada: preparacao,
      proximoItemPendenteId: calcularProgressoDevolucao(preparacao).proximoItemPendenteId,
    };
  }

  // Regra de integridade: impedir que uma embalagem já devolvida, esgotada ou descartada seja movimentada duas vezes
  if (itemEstaDefinitivamenteConcluido(itemExistente.status)) {
    return {
      sucesso: false,
      erro: `Este componente (${itemExistente.produtoNome}) já foi registrado e não pode ser movimentado duplicadamente.`,
      preparacaoAtualizada: preparacao,
      proximoItemPendenteId: calcularProgressoDevolucao(preparacao).proximoItemPendenteId,
    };
  }

  // Se for uma aprovação direta da conferência técnica para retorno ao estoque, homologa os critérios obrigatórios
  const checklistEfetivo: Record<string, boolean> = aprovacaoConferenciaTecnica
    ? criteriosAplicaveis.reduce((acc, c) => ({ ...acc, [c.id]: true }), { ...checklistAprovado })
    : checklistAprovado;

  // Se o destino for DEVOLVIDO_AO_ESTOQUE, validar checklist obrigatório e saldo > 0
  const obrigatorios = criteriosAplicaveis.filter((c) => c.obrigatorio);
  const reprovado = obrigatorios.find((c) => !checklistEfetivo[c.id]);

  if (destino === 'DEVOLVIDO_AO_ESTOQUE') {
    if (saldoRestanteMl <= 0) {
      return {
        sucesso: false,
        erro: 'Informe um saldo restante maior que zero para devolver ao estoque, ou registre o descarte/baixa.',
        preparacaoAtualizada: preparacao,
        proximoItemPendenteId: itemExistente.id,
      };
    }

    if (reprovado) {
      return {
        sucesso: false,
        erro:
          reprovado.motivoReprovacao ||
          'Todos os critérios obrigatórios do checklist devem ser aprovados para devolução ao estoque.',
        preparacaoAtualizada: preparacao,
        proximoItemPendenteId: itemExistente.id,
      };
    }
  }

  const cleanLote = itemExistente.loteCodigo.replace(/^#+/, '');
  const sufixoItem = itemExistente.receitaItemId;
  const loteSobraGeradoCodigo =
    destino === 'DEVOLVIDO_AO_ESTOQUE' ? `#${cleanLote}-SOBRA-0${sufixoItem}` : undefined;
  const codigoEtiquetaGerada =
    destino === 'DEVOLVIDO_AO_ESTOQUE' ? `#SOBRA-${cleanLote}-${sufixoItem}` : undefined;

  const itemAtualizado: ItemDevolucaoComponente = {
    ...itemExistente,
    saldoRestanteInformadoMl: destino === 'EMBALAGEM_ESGOTADA' ? 0 : Math.max(0, saldoRestanteMl),
    destino,
    status: destino,
    checklistAprovado: { ...checklistEfetivo },
    motivoReprovacao:
      destino === 'EMBALAGEM_ESGOTADA'
        ? motivoManual || 'Embalagem consumida integralmente na dosagem (0 ml de sobra)'
        : destino !== 'DEVOLVIDO_AO_ESTOQUE'
        ? motivoManual || reprovado?.motivoReprovacao || 'Descarte / conferência operacional'
        : undefined,
    avaliadoPorId: operador.id,
    avaliadoPorNome: operador.nome,
    responsavelMovimentacaoId: operador.id,
    responsavelMovimentacaoNome: operador.nome,
    registradoEm,
    loteSobraGeradoCodigo,
    codigoEtiquetaGerada,
  };

  const novosItens = preparacao.itensDevolucao.map((it) =>
    it.id === itemId ? itemAtualizado : it
  );

  const prepParcial: Preparacao = {
    ...preparacao,
    itensDevolucao: novosItens,
  };

  const novoStatusDevolucao = calcularStatusDevolucao(prepParcial);
  const novoStatusMacro = calcularStatusPreparacao({
    ...prepParcial,
    statusDevolucao: novoStatusDevolucao,
  });

  const preparacaoAtualizada: Preparacao = {
    ...prepParcial,
    statusDevolucao: novoStatusDevolucao,
    status: novoStatusMacro,
  };

  const progresso = calcularProgressoDevolucao(preparacaoAtualizada);

  return {
    sucesso: true,
    preparacaoAtualizada,
    itemAtualizado,
    proximoItemPendenteId: progresso.proximoItemPendenteId,
  };
}

/**
 * Registra a impressão da etiqueta térmica para um componente específico, sem encerrar a preparação.
 */
export function registrarImpressaoEtiquetaComponente(
  preparacao: Preparacao,
  itemId: string
): Preparacao {
  const itens = preparacao.itensDevolucao.map((it) => {
    if (it.id !== itemId) return it;
    const cleanLote = it.loteCodigo.replace(/^#+/, '');
    return {
      ...it,
      etiquetaImpressa: true,
      loteSobraGeradoCodigo: it.loteSobraGeradoCodigo || `#${cleanLote}-SOBRA-0${it.receitaItemId}`,
      codigoEtiquetaGerada: it.codigoEtiquetaGerada || `#SOBRA-${cleanLote}-${it.receitaItemId}`,
    };
  });

  return {
    ...preparacao,
    itensDevolucao: itens,
  };
}

/**
 * Finaliza formalmente a preparação somente quando não houver mais componentes pendentes obrigatórios.
 */
export function encerrarPreparacao(
  preparacao: Preparacao,
  encerradaEm: string = new Date().toISOString()
): { sucesso: boolean; erro?: string; preparacaoAtualizada: Preparacao } {
  const progresso = calcularProgressoDevolucao(preparacao);
  if (!progresso.podeFinalizarPreparacao) {
    return {
      sucesso: false,
      erro: `Ainda existem ${progresso.pendentes} componente(s) pendente(s) de devolução ou descarte.`,
      preparacaoAtualizada: preparacao,
    };
  }

  return {
    sucesso: true,
    preparacaoAtualizada: {
      ...preparacao,
      statusDevolucao: calcularStatusDevolucao(preparacao),
      statusAplicacao: 'APLICACAO_CONCLUIDA',
      aplicacaoConcluidaEm: preparacao.aplicacaoConcluidaEm || encerradaEm,
      status: 'PREPARACAO_ENCERRADA',
      encerradaEm,
    },
  };
}
