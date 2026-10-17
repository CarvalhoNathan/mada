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
  if (volumeTotalMl <= 0) {
    return itens.map((item) => ({
      papel: item.papel,
      nome: item.produtoNome || item.papel,
      codigoProduto: item.codigoProduto || '',
      proporcao: item.proporcao,
      volumeMl: 0,
      pesoGramas: 0,
      densidade: item.densidade,
    }));
  }

  return itens.map((item) => {
    const volumeMl = Math.round(volumeTotalMl * item.proporcao);
    const pesoGramas = Math.round(volumeMl * item.densidade);

    return {
      papel: item.papel,
      nome: item.produtoNome || item.papel,
      codigoProduto: item.codigoProduto || '',
      proporcao: item.proporcao,
      volumeMl,
      pesoGramas,
      densidade: item.densidade,
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
  if (proporcaoComponente <= 0 || volumeRealComponente <= 0) {
    return 0;
  }
  return Math.round(volumeRealComponente / proporcaoComponente);
}
