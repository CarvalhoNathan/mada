import { Operator, Lote, Preparacao } from '../../types';

export interface ScreenAuthProps {
  operators: Operator[];
  selectedOperator: Operator;
  onSelectOperator: (op: Operator) => void;
  onSuccessAuth: () => void;
  onNavigateToManager?: () => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'warn' | 'danger') => void;
  isOffline?: boolean;
  lotes?: Lote[];
  preparacoes?: Preparacao[];
}
