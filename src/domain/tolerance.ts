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

/**
 * Verifica de forma booleana se o valor medido excede a tolerância padrão homologada (5%).
 * Função pura.
 */
export function excedeTolerancia(
  volumeReal: number,
  volumeMeta: number,
  toleranciaPercentual: number = 0.05
): boolean {
  if (volumeMeta <= 0) return volumeReal > 0;
  const limiteMaximo = volumeMeta * (1 + toleranciaPercentual);
  return volumeReal > limiteMaximo;
}

/**
 * Calcula o custo financeiro do excesso em reais com base no preço por litro do produto.
 * Exemplo: 200 ml de produto a R$ 120,00/litro = R$ 24,00.
 * Função pura.
 */
export function calcularCustoExcesso(
  excessoMl: number,
  precoPorLitro: number
): number {
  if (excessoMl <= 0 || precoPorLitro <= 0) return 0;
  const custo = (excessoMl / 1000) * precoPorLitro;
  return Math.round(custo * 100) / 100;
}
