import React from 'react';

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
      <div
        className="ds-modal-card ds-modal-standard"
        style={{
          maxWidth: '560px',
          width: '92%',
          borderRadius: '18px',
          backgroundColor: '#141519',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            padding: '16px 22px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              ✕
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#ededed', fontWeight: 700, lineHeight: 1.25 }}>
                Cancelar Preparação?
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#a1a1aa', lineHeight: 1.2 }}>
                Ação de abandono do lote em andamento
              </p>
            </div>
          </div>
          <button
            type="button"
            className="ds-modal-close-btn"
            onClick={onClose}
            aria-label="Fechar janela"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#71717a',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            ✕
          </button>
        </header>

        <div style={{ padding: '24px 22px' }}>
          <p style={{ fontSize: '15px', color: '#d4d4d8', lineHeight: 1.55, margin: 0 }}>
            Os produtos e pesagens registrados nesta sessão não serão salvos no estoque nem vinculados à OS. Deseja realmente retornar à tela inicial?
          </p>
        </div>

        <footer
          style={{
            padding: '16px 22px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              height: '46px',
              padding: '0 22px',
              borderRadius: '10px',
              backgroundColor: '#202127',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#ededed',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            Continuar pesando
          </button>
          <button
            type="button"
            onClick={onConfirmCancel}
            style={{
              height: '46px',
              padding: '0 22px',
              borderRadius: '10px',
              backgroundColor: '#ef4444',
              border: 'none',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 0 16px rgba(239, 68, 68, 0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            Sim, cancelar preparação
          </button>
        </footer>
      </div>
    </div>
  );
};
