import { Ambiente, OrdemServico, PieceLot } from '../../types';

export interface ScreenOSProps {
  selectedOS: string;
  clientName: string;
  projectName: string;
  selectedEnvironment: string;
  onSelectEnvironment: (env: string) => void;
  pieceLot: PieceLot;
  onSelectPieceLot?: (lote: PieceLot, envName?: string) => void;
  onChangePieceLot: () => void;
  onChangeOS: () => void;
  onSelectOS?: (os: OrdemServico) => void;
  onScanOS: () => void;
  onNavigate: (screen: 'dashboard' | 'recipe') => void;
  onOpenCancelPrep?: () => void;
  ambientes?: Ambiente[];
  isOSConfirmed?: boolean;
  onConfirmOS?: () => void;
}
