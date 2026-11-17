import React from 'react';
import { KeyRound, X } from 'lucide-react';

interface AuthHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPin: (pin: string, isManager?: boolean) => void;
}

export const AuthHelpModal: React.FC<AuthHelpModalProps> = ({
  isOpen,
  onClose,
  onSelectPin,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="ds-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-help-modal-title"
      onClick={onClose}
    >
      <div
        className="os-modal-card-apple"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '540px' }}
      >
        {/* Cabeçalho Apple Sheet */}
        <div className="os-modal-header-apple">
          <div className="os-modal-header-left">
            <div className="os-modal-icon-badge" aria-hidden="true">
              <KeyRound size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h3 id="auth-help-modal-title" className="os-modal-title-apple">
                <span>Suporte da Cabine & PINs</span>
                <span className="os-modal-count-pill">3 perfis</span>
              </h3>
              <p className="os-modal-subtitle-apple">
                Toque em uma credencial para testar ou autenticar de imediato.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="os-modal-close-apple"
            aria-label="Fechar suporte de PINs"
          >
            <X size={18} strokeWidth={2.4} />
          </button>
        </div>

        {/* Inset Cards Táteis e Interativos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Card 1: Pintor */}
          <button
            type="button"
            className="os-list-card"
            onClick={() => onSelectPin('1234', false)}
            style={{ padding: '14px 16px' }}
          >
            <div className="os-list-card-row">
              <div>
                <h4 className="os-list-client-name" style={{ fontSize: '16px' }}>
                  Pintores (Carlos, Ana, Marcos)
                </h4>
                <p className="os-list-subtitle-text" style={{ fontSize: '13px', marginTop: '2px' }}>
                  Acesso operacional padrão para preparação, dosagem e devolução
                </p>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '16px',
                  fontWeight: 800,
                  letterSpacing: '2px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.14)',
                  border: '1px solid rgba(16, 185, 129, 0.32)',
                  color: 'var(--tint-emerald)',
                  flexShrink: 0,
                }}
              >
                1234
              </span>
            </div>
          </button>

          {/* Card 2: Supervisor */}
          <button
            type="button"
            className="os-list-card"
            onClick={() => onSelectPin('9999', true)}
            style={{ padding: '14px 16px' }}
          >
            <div className="os-list-card-row">
              <div>
                <h4 className="os-list-client-name" style={{ fontSize: '16px' }}>
                  Supervisor de Cabine (Fábio)
                </h4>
                <p className="os-list-subtitle-text" style={{ fontSize: '13px', marginTop: '2px' }}>
                  PIN Mestre: libera terminal, desbloqueia erros e autoriza excesso (&gt;5%)
                </p>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '16px',
                  fontWeight: 800,
                  letterSpacing: '2px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.14)',
                  border: '1px solid rgba(245, 158, 11, 0.32)',
                  color: 'var(--tint-amber)',
                  flexShrink: 0,
                }}
              >
                9999
              </span>
            </div>
          </button>

          {/* Card 3: Erro */}
          <button
            type="button"
            className="os-list-card"
            onClick={() => onSelectPin('0000', false)}
            style={{ padding: '14px 16px' }}
          >
            <div className="os-list-card-row">
              <div>
                <h4 className="os-list-client-name" style={{ fontSize: '16px' }}>
                  Simular Bloqueio (PIN Incorreto)
                </h4>
                <p className="os-list-subtitle-text" style={{ fontSize: '13px', marginTop: '2px' }}>
                  Testa a animação de vibração e feedback visual de erro no tablet
                </p>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '16px',
                  fontWeight: 800,
                  letterSpacing: '2px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.14)',
                  border: '1px solid rgba(239, 68, 68, 0.32)',
                  color: 'var(--tint-red)',
                  flexShrink: 0,
                }}
              >
                0000
              </span>
            </div>
          </button>
        </div>

        <p style={{ margin: '4px 0 0', textAlign: 'center', fontSize: '13px', color: 'var(--text-tertiary)' }}>
          Toque diretamente em qualquer cartão acima para preencher e validar.
        </p>
      </div>
    </div>
  );
};
