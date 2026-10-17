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
