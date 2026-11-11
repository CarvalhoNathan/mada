export interface ItemComValidade {
  diasAberto?: number;
  validade?: string;
  statusUrgencia?: 'alta' | 'media' | 'normal' | string;
}

/**
 * Ordena lotes e recipientes pela regra FEFO (First-Expired, First-Out):
 * 1. Latas já abertas (diasAberto > 0) têm prioridade máxima, ordenadas pelas abertas há mais tempo.
 * 2. Em seguida, latas pela data de validade mais próxima (menor data ISO).
 * Função pura, não muta o array original.
 */
export function ordenarLotesFEFO<T extends ItemComValidade>(lotes: T[]): T[] {
  return [...lotes].sort((a, b) => {
    const aAberto = (a.diasAberto ?? 0) > 0;
    const bAberto = (b.diasAberto ?? 0) > 0;

    // Ambas abertas: a que está aberta há mais tempo vem primeiro
    if (aAberto && bAberto) {
      const diasA = a.diasAberto ?? 0;
      const diasB = b.diasAberto ?? 0;
      if (diasA !== diasB) {
        return diasB - diasA; // mais dias aberto primeiro
      }
    }

    // Uma aberta e a outra fechada: aberta tem prioridade
    if (aAberto && !bAberto) return -1;
    if (!aAberto && bAberto) return 1;

    // Ambas no mesmo estado de abertura: comparar data de validade (YYYY-MM-DD)
    if (a.validade && b.validade) {
      return a.validade.localeCompare(b.validade);
    }
    if (a.validade && !b.validade) return -1;
    if (!a.validade && b.validade) return 1;

    return 0;
  });
}

/**
 * Calcula a quantidade de dias restantes até o vencimento.
 * Retorna número negativo se já estiver vencido.
 */
export function calcularDiasAteVencimento(validade: string, dataReferencia: Date = new Date()): number {
  if (!validade || typeof validade !== 'string') return 999;
  const parts = validade.split('-').map(Number);
  if (parts.length !== 3 || parts.some((p) => !Number.isFinite(p) || p < 0)) return 999;
  const [ano, mes, dia] = parts;
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return 999;
  const dataVal = new Date(ano, mes - 1, dia);
  if (isNaN(dataVal.getTime()) || dataVal.getDate() !== dia) return 999;
  // Zera horas para comparação puramente por dias
  const dataRef = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth(), dataReferencia.getDate());
  const diffMs = dataVal.getTime() - dataRef.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Formata um badge amigável de status de validade e tempo aberto
 */
export function formatarStatusValidade(validade: string, diasAberto = 0, dataRef = new Date()): {
  rotulo: string;
  nivel: 'urgente' | 'alerta' | 'normal';
} {
  const diasRestantes = calcularDiasAteVencimento(validade, dataRef);

  if (diasRestantes < 0) {
    return {
      rotulo: `🚨 Vencido há ${Math.abs(diasRestantes)} dias`,
      nivel: 'urgente',
    };
  }

  if (diasAberto > 0 && diasRestantes <= 15) {
    return {
      rotulo: `🚨 Aberto (${diasAberto}d) e vence em ${diasRestantes}d`,
      nivel: 'urgente',
    };
  }

  if (diasAberto > 0) {
    return {
      rotulo: `⚡ Aberto há ${diasAberto} dias (prioridade)`,
      nivel: 'alerta',
    };
  }

  if (diasRestantes <= 15) {
    return {
      rotulo: `⚠️ Validade crítica (${diasRestantes} dias)`,
      nivel: 'urgente',
    };
  }

  if (diasRestantes <= 30) {
    return {
      rotulo: `⚠️ Vence em ${diasRestantes} dias`,
      nivel: 'alerta',
    };
  }

  return {
    rotulo: `📅 Validade: ${validade.split('-').reverse().join('/')} (${diasRestantes}d)`,
    nivel: 'normal',
  };
}

export interface AlocacaoLoteFEFO<T> {
  lote: T;
  volumeAlocadoMl: number;
  saldoRestanteLoteMl: number;
  esgotouLote: boolean;
}

/**
 * Calcula a alocação de consumo em múltiplos lotes segundo a prioridade FEFO:
 * Quando a primeira lata aberta (sobra prioritária) possui saldo insuficiente para
 * cobrir a meta da receita (ex.: lata aberta tem 87 ml e a meta pede 263 ml),
 * aloca os 87 ml da 1ª lata (zerando-a) e complementa os 176 ml restantes do 2º lote FEFO.
 */
export function alocarConsumoMultiLoteFEFO<
  T extends ItemComValidade & { id: number; codigo: string; quantidadeAtual: number }
>(
  lotesDisponiveis: T[],
  volumeNecessarioMl: number
): {
  alocacoes: AlocacaoLoteFEFO<T>[];
  precisaComplementar: boolean;
  volumeFaltanteEstoqueMl: number;
} {
  const ordenados = ordenarLotesFEFO(lotesDisponiveis.filter((l) => l.quantidadeAtual > 0));
  const alocacoes: AlocacaoLoteFEFO<T>[] = [];
  let restanteParaAlocar = Math.max(0, Math.round(volumeNecessarioMl));

  for (const lote of ordenados) {
    if (restanteParaAlocar <= 0) break;
    const disponivelNoLote = Math.max(0, Math.round(lote.quantidadeAtual));
    if (disponivelNoLote <= 0) continue;

    const alocado = Math.min(disponivelNoLote, restanteParaAlocar);
    const saldoRestanteLoteMl = disponivelNoLote - alocado;

    alocacoes.push({
      lote,
      volumeAlocadoMl: alocado,
      saldoRestanteLoteMl,
      esgotouLote: saldoRestanteLoteMl === 0,
    });

    restanteParaAlocar -= alocado;
  }

  return {
    alocacoes,
    precisaComplementar: alocacoes.length > 1,
    volumeFaltanteEstoqueMl: Math.max(0, restanteParaAlocar),
  };
}
