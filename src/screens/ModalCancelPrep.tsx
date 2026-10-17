import React from 'react';
import { Button } from '../components/ui/Button';

interface ModalCancelPrepProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: () => void;
}

export const ModalCancelPrep: React.FC<ModalCancelPrepProps> = ({
  isOpen,
  onClose,
  onConfirmCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="ds-modal-backdrop" role="dialog" aria-modal="true">
      <div className="ds-modal-card ds-modal-standard" style={{ maxWidth: '560px' }}>
        <header className="ds-modal-header" style={{ background: 'var(--card-hover)', borderBottom: '1px solid var(--border)' }}>
          <div className="ds-modal-header-icon" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
            ✕
          </div>
          <div className="ds-modal-header-titles">
            <h2 className="ds-modal-title" style={{ color: 'var(--text)' }}>
              Cancelar Preparação?
            </h2>
            <p className="ds-modal-sub">Ação de abandono do lote em andamento</p>
          </div>
          <button
            type="button"
            className="ds-modal-close-btn"
            onClick={onClose}
            aria-label="Fechar janela"
          >
            ✕
          </button>
        </header>

        <div className="ds-modal-body" style={{ padding: '24px' }}>
          <p style={{ fontSize: '16px', color: 'var(--text)', lineHeight: 1.5, margin: 0 }}>
            Os produtos e pesagens registrados nesta sessão não serão salvos no estoque nem vinculados à OS. Deseja realmente retornar à tela inicial?
          </p>
        </div>

        <footer className="ds-modal-footer" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border)' }}>
          <Button variant="secondary" size="md" onClick={onClose}>
            Continuar pesando
          </Button>
          <Button variant="danger" size="md" onClick={onConfirmCancel}>
            Sim, cancelar preparação
          </Button>
        </footer>
      </div>
    </div>
  );
};
