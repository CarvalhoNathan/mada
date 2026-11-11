import { RecipeState, Operator, OrdemServico, Receita, Lote } from '../../types';
import { AlocacaoLoteFEFO } from '../../domain/fefo';

export interface ScreenDosingProps {
  recipe: RecipeState;
  activeRecipe?: Receita;
  operator: Operator;
  activeOS?: OrdemServico;
  lotes?: Lote[];
  onNavigate: (screen: 'recipe' | 'return' | 'dashboard') => void;
  onCompleteDosing: (
    dosingValues: Record<number, number>,
    wasteJustification?: string
  ) => void;
  onSetTotalVolume?: (vol: number) => void;
  onOpenCancelPrep: () => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'warn' | 'danger') => void;
}

export interface ComponenteItemParaDosagem {
  item: Receita['itens'][0];
  metaMl: number;
  pesoMetaG: number;
  produto: {
    id: number;
    preco?: number;
    unidade?: string;
  };
  loteAtivo?: Lote;
  planoMultiLote: {
    alocacoes: AlocacaoLoteFEFO<Lote>[];
    precisaComplementar: boolean;
    volumeFaltanteEstoqueMl: number;
  };
}
