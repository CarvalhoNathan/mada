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
  const max = Math.max(1, volumeMaximoLata);
  const volumeMl = Math.max(0, Math.min(max, volumeRestanteMl));
  const porcentagemPreenchimento = Math.round((volumeMl / max) * 100);
  const pesoEstimadoGramas = Math.round(volumeMl * densidade);

  return {
    volumeMl,
    porcentagemPreenchimento,
    pesoEstimadoGramas,
  };
}
