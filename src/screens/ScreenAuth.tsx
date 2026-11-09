import React, { useState, useCallback, useEffect } from 'react';
import { Check, HelpCircle, ShieldCheck, KeyRound, Shield } from 'lucide-react';
import { Operator } from '../types';
import { PIN_ERRO_SIMULADO, MOCK_SUPERVISOR } from '../data';
import { PinInput } from '../components/ui/PinInput';
import { NumericKeypad } from '../components/ui/NumericKeypad';
import { Button } from '../components/ui/Button';

interface ScreenAuthProps {
  operators: Operator[];
  selectedOperator: Operator;
  onSelectOperator: (op: Operator) => void;
  onSuccessAuth: () => void;
  onNavigateToManager?: () => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'warn' | 'danger') => void;
  isOffline?: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export const ScreenAuth: React.FC<ScreenAuthProps> = ({
  operators,
  selectedOperator,
  onSelectOperator,
  onSuccessAuth,
  onNavigateToManager,
  showToast,
  isOffline = false,
}) => {
  const [pinEntered, setPinEntered] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);

  const handleClear = useCallback(() => {
    if (isSuccess) return;
    setPinEntered('');
    setHasError(false);
  }, [isSuccess]);

  const handleBackspace = useCallback(() => {
    if (isSuccess) return;
    if (hasError) setHasError(false);
    setPinEntered(prev => prev.slice(0, -1));
  }, [hasError, isSuccess]);

  const handleSubmit = useCallback((candidatePin?: string) => {
    if (isSuccess) return;
    const pin = candidatePin ?? pinEntered;
    if (isOffline) {
      showToast('Ação indisponível: Sistema offline.', 'danger');
      return;
    }
    if (pin.length < 4) {
      showToast('Por favor, digite os 4 dígitos do seu PIN.', 'warn');
      return;
    }

    const isSupervisorOverride = pin === MOCK_SUPERVISOR.pin;
    const isValid = isSupervisorOverride
      ? true
      : selectedOperator.pin
      ? pin === selectedOperator.pin
      : pin !== PIN_ERRO_SIMULADO;

    if (!isValid || pin === PIN_ERRO_SIMULADO) {
      setHasError(true);
      setTimeout(() => {
        setPinEntered('');
        setHasError(false);
      }, 800);
      return;
    }

    // Microinteração de Sucesso: acende os 4 dots em verde luminoso antes da transição
    setIsSuccess(true);
    setTimeout(() => {
      onSuccessAuth();
      if (isSupervisorOverride) {
        showToast(
          `✓ Acesso liberado pelo Supervisor ${MOCK_SUPERVISOR.nome} para ${selectedOperator.nome || 'Operador'}!`,
          'success'
        );
      }
      setIsSuccess(false);
      setPinEntered('');
    }, 280);
  }, [isSuccess, pinEntered, isOffline, selectedOperator.pin, selectedOperator.nome, showToast, onSuccessAuth]);

  const handleDigit = useCallback((digit: string) => {
    if (hasError || isSuccess) return;
    if (pinEntered.length < 4) {
      const nextPin = pinEntered + digit;
      setPinEntered(nextPin);
      if (nextPin.length === 4) {
        setTimeout(() => {
          handleSubmit(nextPin);
        }, 120);
      }
    }
  }, [hasError, isSuccess, pinEntered, handleSubmit]);

  // Suporte a teclado físico para conveniência e acessibilidade
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSuccess) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        handleClear();
      } else if (e.key === 'Enter') {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSuccess, handleDigit, handleBackspace, handleClear, handleSubmit]);

  const selectedName = selectedOperator.nome || selectedOperator.name || 'Operador';
  const selectedRole = selectedOperator.papel || selectedOperator.role || 'Operador de Pintura';

  return (
    <div className="auth-screen-shell">
      <div className="auth-layout-minimal">
        {/* Coluna da Esquerda: Seleção do Pintor */}
        <section className="auth-left-column" aria-label="Seleção de Operador">
          <div className="auth-column-header">
            <h1 className="auth-title-minimal">Quem está pintando?</h1>
            <p className="auth-subtitle-minimal">
              Toque no seu nome e digite o PIN de 4 dígitos para liberar a cabine.
            </p>
          </div>

          <div className="auth-operators-vertical" role="radiogroup" aria-label="Operadores disponíveis">
            {operators.map((op) => {
              const opName = op.nome || op.name || '';
              const opRole = op.papel || op.role || 'Operador de Pintura';
              const isSelected = op.id ? op.id === selectedOperator.id : opName === selectedName;

              return (
                <button
                  key={op.id || opName}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`operator-card-apple ${isSelected ? 'is-active' : ''}`}
                  onClick={() => {
                    onSelectOperator(op);
                    handleClear();
                  }}
                >
                  <div className="operator-avatar-circle" aria-hidden="true">
                    {getInitials(opName)}
                  </div>
                  <div className="operator-info-apple">
                    <span className="operator-name-apple">{opName}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <span className="operator-role-apple">{opRole}</span>
                      {isSelected && (
                        <span className="operator-shift-badge">● No turno</span>
                      )}
                    </div>
                  </div>
                  <div className={`operator-select-indicator ${isSelected ? 'is-selected' : ''}`} aria-hidden="true">
                    {isSelected && <Check size={20} strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Linha de Ações Auxiliares: Acesso Supervisor & Ajuda */}
          <div className="auth-action-buttons-row">
            <button
              type="button"
              className="auth-supervisor-btn"
              onClick={() => {
                if (onNavigateToManager) {
                  onNavigateToManager();
                } else {
                  handleSubmit(MOCK_SUPERVISOR.pin);
                }
              }}
              title="Acesso direto ao painel gerencial do Fábio"
            >
              <Shield size={16} strokeWidth={2.4} color="currentColor" />
              <span>Painel do Gestor (Fábio)</span>
            </button>

            <button
              type="button"
              className="auth-help-btn"
              onClick={() => setIsHelpModalOpen(true)}
            >
              <HelpCircle size={17} aria-hidden="true" />
              <span>PINs Demo</span>
            </button>
          </div>
        </section>

        {/* Coluna da Direita: Teclado Numérico & PIN estilo Apple */}
        <section className="auth-right-column" aria-label="Autenticação com PIN">
          <div className="auth-pin-card-apple">
            <div className="auth-pin-card-header">
              <div className="auth-pin-operator-chip">
                <ShieldCheck size={18} aria-hidden="true" />
                <span>{selectedRole}</span>
              </div>
              <h2 className="auth-pin-title">PIN de {selectedName}</h2>
              <p className="auth-pin-hint">Digite os 4 dígitos para iniciar o turno</p>
            </div>

            <PinInput
              length={4}
              value={pinEntered}
              hasError={hasError}
              isSuccess={isSuccess}
              errorMessage="PIN incorreto. Tente novamente."
            />

            <NumericKeypad
              onDigit={handleDigit}
              onBackspace={handleBackspace}
              onClear={handleClear}
              disabled={isOffline}
            />
          </div>
        </section>
      </div>

      {/* Modal de Ajuda Operacional & Credenciais de Demonstração */}
      {isHelpModalOpen && (
        <div
          className="ds-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-help-modal-title"
          onClick={() => setIsHelpModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div
            className="ds-modal-card ds-modal-standard"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '100%',
              backgroundColor: 'var(--card)',
              border: '1.5px solid var(--border-strong)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#FAFAFA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <KeyRound size={22} />
                </div>
                <div>
                  <h2 id="auth-help-modal-title" style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>
                    Suporte da Cabine & PINs Demo
                  </h2>
                  <p style={{ margin: '2px 0 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>
                    Credenciais homologadas para avaliação do terminal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                aria-label="Fechar ajuda"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  fontSize: '18px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(34, 197, 94, 0.08)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                    Pintores (Carlos, Ana, Marcos)
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    Acesso padrão para preparação, dosagem e devolução
                  </div>
                </div>
                <span
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: 'rgba(34, 197, 94, 0.2)',
                    color: '#4ade80',
                    fontSize: '18px',
                    fontWeight: 800,
                    letterSpacing: '2px',
                  }}
                >
                  1234
                </span>
              </div>

              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                    Supervisor de Cabine (Fábio)
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    PIN Mestre: libera o terminal se o pintor esquecer a senha ou autoriza excesso (&gt;5%)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsHelpModalOpen(false);
                    setPinEntered('9999');
                    setTimeout(() => handleSubmit('9999'), 120);
                  }}
                  title="Toque para liberar com o PIN Mestre 9999"
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.2)',
                    border: '1px solid rgba(245, 158, 11, 0.45)',
                    color: '#fbbf24',
                    fontSize: '18px',
                    fontWeight: 800,
                    letterSpacing: '2px',
                    cursor: 'pointer',
                  }}
                >
                  9999
                </button>
              </div>

              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                    Simular Bloqueio de PIN Incorreto
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    Testa o feedback visual de erro na autenticação
                  </div>
                </div>
                <span
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#f87171',
                    fontSize: '18px',
                    fontWeight: 800,
                    letterSpacing: '2px',
                  }}
                >
                  0000
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <Button variant="secondary" size="md" onClick={() => setIsHelpModalOpen(false)}>
                Fechar
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setIsHelpModalOpen(false);
                  setPinEntered('1234');
                  setTimeout(() => handleSubmit('1234'), 120);
                }}
              >
                Entrar agora com PIN 1234 →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


