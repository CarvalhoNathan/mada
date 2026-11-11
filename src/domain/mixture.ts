export interface ItemReceitaParaCalculo {
  papel: string;
  produtoNome?: string;
  codigoProduto?: string;
  proporcao: number;
  densidade: number;
}

export interface FracaoCalculada {
  papel: string;
  nome: string;
  codigoProduto: string;
  proporcao: number;
  volumeMl: number;
  pesoGramas: number;
  densidade: number;
}

/**
 * Calcula os volumes (ml) e pesos (g) de cada fração química da mistura
 * a partir do volume total e de uma receita com N componentes.
 * Função pura, sem dependência de React ou dados externos.
 */
export function calcularFracoesMistura(
  itens: ItemReceitaParaCalculo[],
  volumeTotalMl: number
): FracaoCalculada[] {
  const safeVolume = Number.isFinite(volumeTotalMl) && volumeTotalMl > 0 ? volumeTotalMl : 0;
  if (safeVolume <= 0 || !Array.isArray(itens)) {
    return (itens || []).map((item) => ({
      papel: item?.papel || '',
      nome: item?.produtoNome || item?.papel || '',
      codigoProduto: item?.codigoProduto || '',
      proporcao: Number.isFinite(item?.proporcao) && (item?.proporcao ?? 0) > 0 ? (item.proporcao) : 0,
      volumeMl: 0,
      pesoGramas: 0,
      densidade: Number.isFinite(item?.densidade) && (item?.densidade ?? 0) > 0 ? (item.densidade) : 1,
    }));
  }

  return itens.map((item) => {
    const safeProporcao = Number.isFinite(item?.proporcao) && (item?.proporcao ?? 0) > 0 ? item.proporcao : 0;
    const safeDensidade = Number.isFinite(item?.densidade) && (item?.densidade ?? 0) > 0 ? item.densidade : 1;
    const volumeMl = Math.round(safeVolume * safeProporcao);
    const pesoGramas = Math.round(volumeMl * safeDensidade);

    return {
      papel: item?.papel || '',
      nome: item?.produtoNome || item?.papel || '',
      codigoProduto: item?.codigoProduto || '',
      proporcao: safeProporcao,
      volumeMl,
      pesoGramas,
      densidade: safeDensidade,
    };
  });
}

/**
 * Recalcula o volume total necessário da batelada caso um componente tenha sido
 * dosado em excesso, mantendo a proporção técnica homologada.
 * Exemplo: Se o catalisador (25%) subiu para 450 ml: 450 / 0.25 = 1.800 ml.
 */
export function recalcularVolumePorComponente(
  volumeRealComponente: number,
  proporcaoComponente: number
): number {
  if (
    !Number.isFinite(volumeRealComponente) ||
    !Number.isFinite(proporcaoComponente) ||
    proporcaoComponente <= 0 ||
    volumeRealComponente <= 0
  ) {
    return 0;
  }
  return Math.round(volumeRealComponente / proporcaoComponente);
}
