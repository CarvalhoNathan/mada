import React from 'react';
import { ItemDevolucaoComponente } from '../../types';
import { NumericKeypad } from '../../components/ui/NumericKeypad';

interface ReturnKeypadModalProps {
  isOpen: boolean;
  itemAtual: ItemDevolucaoComponente;
  keypadBuffer: string;
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onConfirm: () => void;
  onClose: () => void;
}

export const ReturnKeypadModal: React.FC<ReturnKeypadModalProps> = ({
  isOpen,
  itemAtual,
  keypadBuffer,
  onDigit,
  onBackspace,
  onClear,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="ds-modal-backdrop"
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 90,
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="ds-modal-card ds-modal-standard"
        style={{
          maxWidth: '440px',
          width: '100%',
          backgroundColor: 'var(--card)',
          border: '1.5px solid var(--border)',
          borderRadius: '20px',
          padding: '20px 24px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--text)', fontWeight: 700 }}>
              Digitar Saldo Restante
            </h3>
            <span style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
              {itemAtual.produtoNome} ({itemAtual.loteCodigo})
            </span>
          </div>
          <button
            type="button"
            className="ds-modal-close-btn"
            onClick={onClose}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            height: '74px',
            background: 'rgba(0, 0, 0, 0.35)',
            border: '2px solid var(--primary)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '44px',
            fontWeight: 800,
            color: 'var(--text)',
            marginBottom: '16px',
          }}
        >
          {keypadBuffer || '0'}{' '}
          <span
            style={{
              fontSize: '22px',
              color: 'var(--text-muted)',
              marginLeft: '8px',
              fontWeight: 600,
            }}
          >
            ml
          </span>
        </div>

        <NumericKeypad
          onDigit={onDigit}
          onBackspace={onBackspace}
          onClear={onClear}
          onConfirm={onConfirm}
          confirmLabel="Salvar Saldo"
        />
      </div>
    </div>
  );
};
