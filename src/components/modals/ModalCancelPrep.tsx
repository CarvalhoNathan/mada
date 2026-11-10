import React from 'react';
import { AlertTriangle, X, ArrowLeft, Trash2 } from 'lucide-react';

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
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div
        className="ds-modal-card"
        style={{
          maxWidth: '680px',
          width: '94%',
          borderRadius: '24px',
          backgroundColor: '#131418',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 28px 72px -12px rgba(0, 0, 0, 0.90)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Cabeçalho */}
        <header
          style={{
            padding: '22px 28px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
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
                background: 'rgba(239, 68, 68, 0.14)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
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
                  fontSize: '21px',
                  color: '#FAFAFA',
                  fontWeight: 700,
                  letterSpacing: '-0.015em',
                  lineHeight: 1.25,
                }}
              >
                Cancelar Preparação?
              </h2>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: '14px',
                  color: '#A1A1AA',
                  lineHeight: 1.2,
                }}
              >
                Ação de abandono da mistura em andamento
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela"
            style={{
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              borderRadius: '10px',
              color: '#71717A',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
          >
            <X size={20} strokeWidth={2.2} />
          </button>
        </header>

        {/* Corpo com Aviso Operacional */}
        <div style={{ padding: '26px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p
            style={{
              fontSize: '16px',
              color: '#D4D4D8',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Os produtos e pesagens registrados nesta sessão não serão salvos no estoque nem vinculados à Ordem de Serviço.
          </p>

          <div
            style={{
              padding: '14px 18px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.24)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Trash2 size={18} color="#EF4444" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '14px', color: '#A1A1AA', lineHeight: 1.45 }}>
              Todo o volume já colocado no béquer precisará ser descartado ou pesado novamente do zero.
            </span>
          </div>
        </div>

        {/* Rodapé Tablet Espaçoso com Grade 50/50 e Botões Alinhados */}
        <footer
          style={{
            padding: '20px 28px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.015)',
          }}
        >
          {/* Botão Secundário: Continuar Pesando */}
          <button
            type="button"
            onClick={onClose}
            style={{
              minHeight: '64px',
              padding: '0 20px',
              borderRadius: '14px',
              backgroundColor: '#1F2026',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FAFAFA',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.15s ease',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            <ArrowLeft size={18} strokeWidth={2.4} />
            Continuar Pesando
          </button>

          {/* Botão Destrutivo: Sim, Cancelar */}
          <button
            type="button"
            onClick={onConfirmCancel}
            style={{
              minHeight: '64px',
              padding: '0 20px',
              borderRadius: '14px',
              backgroundColor: '#DC2626',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#FFFFFF',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 18px rgba(220, 38, 38, 0.35)',
              transition: 'all 0.15s ease',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            <Trash2 size={18} strokeWidth={2.4} />
            Sim, Cancelar
          </button>
        </footer>
      </div>
    </div>
  );
};
