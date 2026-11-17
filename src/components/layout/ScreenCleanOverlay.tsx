import React from 'react';

export interface ScreenCleanOverlayProps {
  countdown: number;
  onCancel: () => void;
}

/**
 * ScreenCleanOverlay - Modo Limpeza de Tela com Bloqueio de Toques (15s)
 * Permite higienizar a superfície de vidro do tablet na marcenaria sem acionar botões acidentalmente.
 */
export const ScreenCleanOverlay: React.FC<ScreenCleanOverlayProps> = ({
  countdown,
  onCancel,
}) => {
  return (
    <div
      className="ds-clean-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Modo Limpeza de Tela Ativo"
    >
      <div className="ds-clean-card">
        <div className="ds-clean-circle-box">
          <svg className="ds-clean-progress-ring" width="130" height="130" viewBox="0 0 130 130">
            <circle
              className="ds-clean-ring-bg"
              cx="65"
              cy="65"
              r="56"
              strokeWidth="8"
            />
            <circle
              className="ds-clean-ring-bar"
              cx="65"
              cy="65"
              r="56"
              strokeWidth="8"
              style={{
                strokeDasharray: 2 * Math.PI * 56,
                strokeDashoffset: (2 * Math.PI * 56) * (1 - countdown / 15),
              }}
            />
          </svg>
          <span className="ds-clean-countdown">{countdown}s</span>
        </div>

        <div className="ds-clean-text-group">
          <h2 className="ds-clean-title">Modo Limpeza de Tela</h2>
          <p className="ds-clean-desc">
            Toques na tela bloqueados temporariamente. Passe uma flanela para higienizar o vidro do tablet.
          </p>
        </div>

        <button
          type="button"
          className="ds-clean-cancel-btn"
          onClick={onCancel}
        >
          Desbloquear agora
        </button>
      </div>
    </div>
  );
};
