import React, { useEffect } from 'react';
import { AlertOctagon, Info, X } from 'lucide-react';

export type ModalVariant = 'standard' | 'critical';

export interface ModalProps {
  isOpen: boolean;
  variant?: ModalVariant;
  title: string;
  subtitle?: string;
  /** Número ou valor em destaque (--fs-number) */
  highlightValue?: string;
  highlightLabel?: string;
  /** No máximo uma frase de explicação clara de chão de fábrica */
  explanationSentence?: string;
  primaryAction: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'danger' | 'success';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  children?: React.ReactNode;
}

/**
 * Modal - Diálogo Industrial de Intertravamento
 * Variante "crítica": cabeçalho em vermelho vivo (--danger),
 * valor numérico em destaque (--fs-number: 56px) e frase objetiva.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  variant = 'standard',
  title,
  subtitle,
  highlightValue,
  highlightLabel,
  explanationSentence,
  primaryAction,
  secondaryAction,
  onClose,
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="ds-modal-backdrop" role="dialog" aria-modal="true">
      <div className={`ds-modal-card ds-modal-${variant}`}>
        {/* Cabeçalho */}
        <header className="ds-modal-header">
          <div className="ds-modal-header-icon" aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {variant === 'critical' ? <AlertOctagon size={24} /> : <Info size={24} />}
          </div>
          <div className="ds-modal-header-titles">
            <h2 className="ds-modal-title">{title}</h2>
            {subtitle && <p className="ds-modal-sub">{subtitle}</p>}
          </div>
          {onClose && (
            <button
              type="button"
              className="ds-modal-close-btn"
              onClick={onClose}
              aria-label="Fechar janela"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={20} />
            </button>
          )}
        </header>

        {/* Corpo: número grande + frase explicativa curta */}
        <div className="ds-modal-body">
          {highlightValue && (
            <div className="ds-modal-highlight-box">
              <span className="ds-modal-highlight-number">{highlightValue}</span>
              {highlightLabel && <span className="ds-modal-highlight-label">{highlightLabel}</span>}
            </div>
          )}

          {explanationSentence && (
            <p className="ds-modal-sentence">{explanationSentence}</p>
          )}

          {children}
        </div>

        {/* Barra de Ações: Botões táteis largos (64px) */}
        <footer className="ds-modal-footer">
          {secondaryAction && (
            <button
              type="button"
              className="ds-btn ds-btn-secondary ds-btn-md"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </button>
          )}

          <button
            type="button"
            className={`ds-btn ds-btn-${primaryAction.variant || 'primary'} ds-btn-md`}
            onClick={primaryAction.onClick}
          >
            {primaryAction.label}
          </button>
        </footer>
      </div>
    </div>
  );
};
