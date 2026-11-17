import {
  ScreenId,
  Operador,
  Movimentacao,
  Lote,
  Preparacao,
  ResiduoMisturaOcorrencia,
  StatusItemDevolucao,
} from '../../types';

export interface ScreenManagerProps {
  onNavigate: (screen: ScreenId) => void;
  operator: Operador;
  operators?: Operador[];
  onAddOperator?: (operador: Omit<Operador, 'id'>) => Promise<Operador | void>;
  showToast: (msg: string, type?: 'info' | 'success' | 'warn' | 'danger') => void;
  movimentacoes?: Movimentacao[];
  lotes?: Lote[];
  preparacoes?: Preparacao[];
  preparacoesEmConferencia?: Preparacao[];
  residuosMistura?: ResiduoMisturaOcorrencia[];
  procedimentosPotLife?: Record<number, string>;
  onSaveProcedimentoPotLife?: (receitaId: number, procedimento: string) => void;
  onResolveConferenceItem?: (params: {
    preparacaoId: string;
    itemId: string;
    saldoRestanteMl: number;
    destino: Exclude<StatusItemDevolucao, 'PENDENTE'>;
    checklistAprovado: Record<string, boolean>;
    motivoManual?: string;
    aprovacaoConferenciaTecnica?: boolean;
  }) => Promise<void>;
  onResetDemoData?: () => Promise<void>;
}

export interface RowOSConsumo {
  id: string;
  os: string;
  cliente: string;
  ambiente: string;
  operador: string;
  acabamento: string;
  previstoMl: number;
  realMl: number;
  custoTotal: number;
  status: 'conforme' | 'alerta';
  data: string;
  justificativa?: string;
  isLive?: boolean;
}

export const HISTORICO_CONSUMO_MOCK: RowOSConsumo[] = [
  {
    id: '1',
    os: 'OS #8841',
    cliente: 'Residência Fontana',
    ambiente: 'Cozinha Gourmet',
    operador: 'Carlos Silva',
    acabamento: 'Primer Fundo Branco PU (Ref: 24322)',
    previstoMl: 1000,
    realMl: 1040,
    custoTotal: 175.75,
    status: 'conforme',
    data: '29/10/2026',
  },
  {
    id: '2',
    os: 'OS #8842',
    cliente: 'Apartamento Jardins',
    ambiente: 'Suíte Master',
    operador: 'Ana Souza',
    acabamento: 'Laca Branca Fosca 20 Gloss',
    previstoMl: 800,
    realMl: 890,
    custoTotal: 160.20,
    status: 'alerta',
    data: '28/10/2026',
    justificativa: 'Correção de viscosidade • Autorizado por Supervisor Fábio',
  },
  {
    id: '3',
    os: 'OS #8843',
    cliente: 'Residência Alphaville',
    ambiente: 'Living / Painel TV',
    operador: 'Marcos Lima',
    acabamento: 'Verniz PU Alto Brilho 4:1',
    previstoMl: 1500,
    realMl: 1480,
    custoTotal: 222.00,
    status: 'conforme',
    data: '27/10/2026',
  },
  {
    id: '4',
    os: 'OS #8844',
    cliente: 'Vila Nova Conceição',
    ambiente: 'Closet Casal',
    operador: 'Carlos Silva',
    acabamento: 'Primer Fundo Branco PU (Ref: 24322)',
    previstoMl: 1200,
    realMl: 1210,
    custoTotal: 204.49,
    status: 'conforme',
    data: '26/10/2026',
  },
];
