export interface ResultadoTolerancia {
  excedeu: boolean;
  diferencaMl: number;
  percentualExcesso: number;
  limiteMaximoPermitido: number;
}

/**
 * Verifica se um volume pesado/retirado ultrapassa o limite tolerado pela receita.
 * Tolerância padrão: 5% (0.05).
 * Função pura.
 */
export function verificarToleranciaExcesso(
  volumeEsperadoMl: number,
  volumeRealMl: number,
  toleranciaPercentual: number = 0.05
): ResultadoTolerancia {
  if (volumeEsperadoMl <= 0) {
    return {
      excedeu: volumeRealMl > 0,
      diferencaMl: Math.max(0, volumeRealMl),
      percentualExcesso: volumeRealMl > 0 ? 100 : 0,
      limiteMaximoPermitido: 0,
    };
  }

  const limiteMaximoPermitido = volumeEsperadoMl * (1 + toleranciaPercentual);
  const diferencaBruta = volumeRealMl - volumeEsperadoMl;
  const excedeu = volumeRealMl > limiteMaximoPermitido;

  const diferencaMl = diferencaBruta > 0 ? diferencaBruta : 0;
  const percentualExcesso = (diferencaMl / volumeEsperadoMl) * 100;

  return {
    excedeu,
    diferencaMl,
    percentualExcesso: Math.round(percentualExcesso * 10) / 10,
    limiteMaximoPermitido: Math.round(limiteMaximoPermitido),
  };
}
