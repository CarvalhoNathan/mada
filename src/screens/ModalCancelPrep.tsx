import React from 'react';
import { AlertTriangle, X, ArrowLeft, Trash2 } from 'lucide-react';
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
    <div
      className="ds-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-cancel-prep-title"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="ds-modal-card ds-modal-standard"
        style={{
          maxWidth: '560px',
          width: '100%',
          borderRadius: '20px',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--glass-modal-shadow)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Cabeçalho com Hairline Specular e Ícone Âmbar/Perigo */}
        <header
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'var(--danger-soft)',
                border: '1px solid var(--danger-border)',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 0 16px rgba(239, 68, 68, 0.20)',
              }}
              aria-hidden="true"
            >
              <AlertTriangle size={24} strokeWidth={2.4} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2
                id="modal-cancel-prep-title"
                style={{
                  margin: 0,
                  fontSize: '20px',
                  color: 'var(--text)',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.25,
                }}
              >
                Cancelar Preparação?
              </h2>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: '14px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.3,
                }}
              >
                Ação de abandono da mistura em andamento
              </p>
            </div>
          </div>

          <button
            type="button"
            className="ds-modal-close-btn"
            onClick={onClose}
            aria-label="Fechar janela"
            style={{
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: '1px solid transparent',
              borderRadius: '12px',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
          >
            <X size={20} strokeWidth={2.2} />
          </button>
        </header>

        {/* Corpo com Aviso Operacional e Callout Destrutivo */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p
            style={{
              fontSize: '16px',
              color: 'var(--text)',
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            Os produtos e pesagens registrados nesta sessão não serão salvos no estoque nem vinculados à Ordem de Serviço.
          </p>

          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid var(--danger-border)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <Trash2 size={18} color="var(--danger)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <span style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              Todo o volume já colocado no béquer precisará ser descartado ou pesado novamente do zero.
            </span>
          </div>
        </div>

        {/* Rodapé Tablet-First com Alvos de Toque Mínimos de 64px */}
        <footer
          style={{
            padding: '16px 24px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            borderTop: '1px solid var(--border)',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          {/* Ação Destrutiva Segura (Hold-to-Confirm para evitar toque acidental de luva) */}
          <Button
            variant="danger"
            size="md"
            holdToConfirm={true}
            onHoldConfirm={onConfirmCancel}
            icon={<Trash2 size={18} />}
            style={{
              minHeight: 'var(--touch-min)',
              minWidth: '220px',
              fontSize: '15px',
              fontWeight: 600,
            }}
          >
            Descartar Lote
          </Button>

          {/* Ação Primária Positiva: Continuar Pesando com Destaque Ergonômico */}
          <Button
            variant="primary"
            size="md"
            onClick={onClose}
            icon={<ArrowLeft size={18} />}
            style={{
              minHeight: 'var(--touch-min)',
              minWidth: '200px',
              fontSize: '16px',
              fontWeight: 700,
              flex: 1,
            }}
          >
            Continuar Pesando
          </Button>
        </footer>
      </div>
    </div>
  );
};
