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
  const safeEsperado = Number.isFinite(volumeEsperadoMl) ? Math.max(0, volumeEsperadoMl) : 0;
  const safeReal = Number.isFinite(volumeRealMl) ? Math.max(0, volumeRealMl) : 0;
  const safeTol = Number.isFinite(toleranciaPercentual) && toleranciaPercentual >= 0 ? toleranciaPercentual : 0.05;

  if (safeEsperado <= 0) {
    return {
      excedeu: safeReal > 0,
      diferencaMl: safeReal,
      percentualExcesso: safeReal > 0 ? 100 : 0,
      limiteMaximoPermitido: 0,
    };
  }

  const limiteMaximoPermitido = safeEsperado * (1 + safeTol);
  const diferencaBruta = safeReal - safeEsperado;
  const excedeu = safeReal > limiteMaximoPermitido;

  const diferencaMl = diferencaBruta > 0 ? diferencaBruta : 0;
  const percentualExcesso = (diferencaMl / safeEsperado) * 100;

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
  const safeReal = Number.isFinite(volumeReal) ? Math.max(0, volumeReal) : 0;
  const safeMeta = Number.isFinite(volumeMeta) ? Math.max(0, volumeMeta) : 0;
  const safeTol = Number.isFinite(toleranciaPercentual) && toleranciaPercentual >= 0 ? toleranciaPercentual : 0.05;

  if (safeMeta <= 0) return safeReal > 0;
  const limiteMaximo = safeMeta * (1 + safeTol);
  return safeReal > limiteMaximo;
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
  if (
    !Number.isFinite(excessoMl) ||
    !Number.isFinite(precoPorLitro) ||
    excessoMl <= 0 ||
    precoPorLitro <= 0
  ) {
    return 0;
  }
  const custo = (excessoMl / 1000) * precoPorLitro;
  return Math.round(custo * 100) / 100;
}
