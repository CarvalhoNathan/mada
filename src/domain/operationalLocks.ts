import { Operador, Preparacao } from '../types';

export interface ResultadoVerificacaoBloqueio {
  permitido: boolean;
  cabineId: string;
  cabineNome: string;
  preparacaoAtiva?: Preparacao;
  motivoBloqueio?: string;
}

/**
 * Obtém o identificador de cabine/equipamento associado ao operador ou preparação.
 */
export function obterCabineOperador(operador?: Partial<Operador> | null): {
  cabineId: string;
  cabineNome: string;
} {
  if (operador?.cabineId) {
    return {
      cabineId: operador.cabineId,
      cabineNome: operador.cabineNome || operador.cabineId,
    };
  }

  const papel = (operador?.papel || operador?.role || '').toLowerCase();
  if (papel.includes('cabine 02') || papel.includes('cabine 2')) {
    return { cabineId: 'CABINE-02', cabineNome: 'Cabine 02' };
  }

  return { cabineId: 'CABINE-01', cabineNome: 'Cabine 01' };
}

/**
 * Determina se uma preparação ainda está com aplicação ativa ocupando a cabine/pistola.
 * Regra fundamental:
 * - Enquanto `aplicacaoConcluidaEm` não for registrado (e a preparação não estiver encerrada),
 *   a cabine/equipamento permanece ocupada pela aplicação (inclusive se o Pot Life expirar).
 * - Assim que a aplicação é concluída (`aplicacaoConcluidaEm` definido ou `statusAplicacao === 'APLICACAO_CONCLUIDA'`),
 *   o equipamento é liberado imediatamente, mesmo que ainda existam embalagens com devolução pendente.
 */
export function possuiAplicacaoAtiva(preparacao?: Partial<Preparacao> | null): boolean {
  if (!preparacao) return false;
  if (preparacao.status === 'PREPARACAO_ENCERRADA') {
    return false;
  }

  if (
    Boolean(preparacao.aplicacaoConcluidaEm) ||
    preparacao.statusAplicacao === 'APLICACAO_CONCLUIDA' ||
    preparacao.status === 'APLICACAO_CONCLUIDA'
  ) {
    return false;
  }

  // Se possui dosagemConcluidaEm ou statusAplicacao em andamento/expirado/ocorrência sem conclusão da aplicação
  if (
    preparacao.statusAplicacao === 'PREPARACAO_EM_ANDAMENTO' ||
    preparacao.statusAplicacao === 'POT_LIFE_EXPIRADO' ||
    preparacao.statusAplicacao === 'OCORRENCIA_REGISTRADA' ||
    preparacao.status === 'PREPARACAO_EM_ANDAMENTO' ||
    preparacao.status === 'POT_LIFE_EXPIRADO' ||
    preparacao.status === 'OCORRENCIA_REGISTRADA' ||
    Boolean(preparacao.dosagemConcluidaEm)
  ) {
    return true;
  }

  return false;
}

/**
 * Busca se existe uma preparação com aplicação ativa ocupando uma cabine específica.
 * Cabines diferentes (ex: CABINE-01 e CABINE-02) operam de forma independente e simultânea.
 */
export function buscarAplicacaoAtivaPorCabine(
  preparacoes: Preparacao[],
  cabineId: string
): Preparacao | undefined {
  if (!Array.isArray(preparacoes) || !cabineId) return undefined;
  const normalizado = String(cabineId).trim().toUpperCase();
  return preparacoes.find((prep) => {
    if (!prep) return false;
    const prepCabine = (prep.cabineId || 'CABINE-01').trim().toUpperCase();
    return prepCabine === normalizado && possuiAplicacaoAtiva(prep);
  });
}

/**
 * Verifica se é permitido iniciar uma nova preparação ou operação conflitante na cabine informada.
 */
export function verificarBloqueioNovaPreparacaoCabine(
  preparacoes: Preparacao[],
  cabineId: string,
  cabineNome: string = cabineId
): ResultadoVerificacaoBloqueio {
  const ativa = buscarAplicacaoAtivaPorCabine(preparacoes, cabineId);

  if (ativa) {
    return {
      permitido: false,
      cabineId,
      cabineNome: ativa.cabineNome || cabineNome,
      preparacaoAtiva: ativa,
      motivoBloqueio: `Bloqueio operacional (${ativa.cabineNome || cabineNome}): existe uma aplicação em andamento para a ${ativa.ordemServicoNumero} (${ativa.receitaNome}). Conclua a aplicação atual antes de iniciar uma nova preparação nesta cabine.`,
    };
  }

  return {
    permitido: true,
    cabineId,
    cabineNome,
  };
}

/**
 * Verifica se o operador pode iniciar devoluções de sobras.
 * Regra:
 * - Evita que o operador inicie devoluções de sobras NÃO relacionadas à operação atual
 *   enquanto estiver executando uma aplicação ativa na sua cabine.
 * - Permite acessar a própria preparação atual ou realizar devoluções livremente após concluir a aplicação.
 */
export function verificarPermissaoDevolucaoDuranteAplicacao(
  preparacoes: Preparacao[],
  cabineId: string,
  preparacaoAlvoId?: string | null,
  cabineNome: string = cabineId
): ResultadoVerificacaoBloqueio {
  const ativa = buscarAplicacaoAtivaPorCabine(preparacoes, cabineId);

  if (!ativa) {
    return {
      permitido: true,
      cabineId,
      cabineNome,
    };
  }

  // Se o operador tentar iniciar devolução de outra preparação não relacionada enquanto aplica
  if (preparacaoAlvoId && preparacaoAlvoId !== ativa.id) {
    return {
      permitido: false,
      cabineId,
      cabineNome: ativa.cabineNome || cabineNome,
      preparacaoAtiva: ativa,
      motivoBloqueio: `Operação bloqueada na ${ativa.cabineNome || cabineNome}: conclua a aplicação ativa da ${ativa.ordemServicoNumero} antes de movimentar devoluções de outras preparações.`,
    };
  }

  // Se não especificou preparação alvo (ex: clicou em "Devolver sobras" no Dashboard durante aplicação ativa)
  // e a preparação ativa ainda está em aplicação, orienta sobre o contexto ou restringe à preparação ativa
  return {
    permitido: true,
    cabineId,
    cabineNome: ativa.cabineNome || cabineNome,
    preparacaoAtiva: ativa,
  };
}

/**
 * Consultas que não interferem na operação (visualizar OS, preparação atual, estoque e embalagens)
 * são sempre permitidas mesmo durante aplicação ativa.
 */
export function verificarPermissaoConsultaNaoConflitante(): { permitido: true } {
  return { permitido: true };
}
