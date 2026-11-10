import {
  Operator,
  OrdemServico,
  Preparacao,
  StatusItemDevolucao,
  ResiduoMisturaOcorrencia,
  Lote,
} from '../../types';

export type ReturnTabId = 'pendentes' | 'conferencia' | 'historico';

export interface ScreenReturnProps {
  operator: Operator;
  lotes?: Lote[];
  activeOS?: OrdemServico;
  activePreparacao?: Preparacao | null;
  preparacoesPendentes?: Preparacao[];
  preparacoesEmConferencia?: Preparacao[];
  preparacoesHistorico?: Preparacao[];
  residuosMistura?: ResiduoMisturaOcorrencia[];
  preparacaoAtivaCabine?: Preparacao | null;
  onSelectPreparacao?: (prep: Preparacao) => void;
  onRegisterItemReturn?: (params: {
    preparacaoId: string;
    itemId: string;
    saldoRestanteMl: number;
    destino: Exclude<StatusItemDevolucao, 'PENDENTE'>;
    checklistAprovado: Record<string, boolean>;
    motivoManual?: string;
    aprovacaoConferenciaTecnica?: boolean;
  }) => Promise<void>;
  onMarkStickerPrinted?: (preparacaoId: string, itemId: string) => Promise<void>;
  onFinishPreparacao?: (preparacaoId: string) => Promise<void>;
  onFinishApplication?: () => Promise<void>;
  onOpenOccurrenceModal?: () => void;
  onNavigate: (screen: 'dashboard' | 'os') => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'warn' | 'danger') => void;
  onConfirmReturn?: (dados: {
    volume: number;
    produtoId: number;
    produtoNome: string;
    loteOriginalCodigo: string;
    loteGeradoCodigo: string;
  }) => Promise<void>;
  onDiscardWaste?: (volume: number, produtoId: number) => Promise<void>;
}

export const STATUS_BADGE_MAP: Record<
  StatusItemDevolucao,
  { label: string; bg: string; border: string; color: string }
> = {
  PENDENTE: {
    label: 'Pendente',
    bg: 'rgba(245, 158, 11, 0.14)',
    border: 'rgba(245, 158, 11, 0.4)',
    color: '#FBBF24',
  },
  DEVOLVIDO_AO_ESTOQUE: {
    label: 'Devolvida',
    bg: 'rgba(16, 185, 129, 0.16)',
    border: 'rgba(16, 185, 129, 0.45)',
    color: '#4ADE80',
  },
  EMBALAGEM_ESGOTADA: {
    label: 'Sem Sobra (0 ml)',
    bg: 'rgba(16, 185, 129, 0.16)',
    border: 'rgba(16, 185, 129, 0.45)',
    color: '#4ADE80',
  },
  DESCARTADO_COMO_REFUGO: {
    label: 'Descartado',
    bg: 'rgba(239, 68, 68, 0.16)',
    border: 'rgba(239, 68, 68, 0.45)',
    color: '#F87171',
  },
  PENDENTE_DE_CONFERENCIA: {
    label: 'Em Conferência',
    bg: 'rgba(59, 130, 246, 0.16)',
    border: 'rgba(59, 130, 246, 0.45)',
    color: '#60A5FA',
  },
};
