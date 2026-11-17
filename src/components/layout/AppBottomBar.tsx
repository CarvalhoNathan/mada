import React from 'react';
import { BottomBarProps } from './types';

/**
 * AppBottomBar - Barra Inferior Fixa de Ações
 * Utilizada pelas telas operacionais com botão Voltar e Ação Primária.
 */
export const AppBottomBar: React.FC<BottomBarProps> = ({
  onBack,
  backLabel = 'Voltar',
  onPrimary,
  primaryLabel = 'Confirmar e Continuar',
  isPrimaryDisabled = false,
}) => {
  return (
    <footer className="boardui-bottom-bar">
      <div className="boardui-bottom-left">
        {onBack && (
          <button
            type="button"
            className="boardui-btn-secondary"
            onClick={onBack}
          >
            ← {backLabel}
          </button>
        )}
      </div>

      <div className="boardui-bottom-right">
        {onPrimary && (
          <button
            type="button"
            className="boardui-btn-primary"
            onClick={onPrimary}
            disabled={isPrimaryDisabled}
          >
            {primaryLabel} →
          </button>
        )}
      </div>
    </footer>
  );
};
