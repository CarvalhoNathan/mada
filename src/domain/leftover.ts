export interface SaldoDevolucao {
  volumeMl: number;
  porcentagemPreenchimento: number;
  pesoEstimadoGramas: number;
}

/**
 * Calcula os parâmetros de devolução de sobra química na lata:
 * volume ajustado aos limites, porcentagem da escala visual do frasco
 * e peso estimado para a balança.
 * Função pura.
 */
export function calcularSaldoDevolucao(
  volumeRestanteMl: number,
  volumeMaximoLata: number = 1000,
  densidade: number = 0.95
): SaldoDevolucao {
  const safeMax = Number.isFinite(volumeMaximoLata) ? Math.max(1, volumeMaximoLata) : 1000;
  const safeRestante = Number.isFinite(volumeRestanteMl) ? Math.max(0, volumeRestanteMl) : 0;
  const safeDensidade = Number.isFinite(densidade) && densidade > 0 ? densidade : 0.95;

  const volumeMl = Math.min(safeMax, safeRestante);
  const porcentagemPreenchimento = Math.round((volumeMl / safeMax) * 100);
  const pesoEstimadoGramas = Math.round(volumeMl * safeDensidade);

  return {
    volumeMl,
    porcentagemPreenchimento,
    pesoEstimadoGramas,
  };
}
