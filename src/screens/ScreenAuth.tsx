import React, { useState, useCallback, useEffect } from 'react';
import { Operator } from '../types';
import { PIN_ERRO_SIMULADO } from '../data';
import { PinInput } from '../components/ui/PinInput';
import { NumericKeypad } from '../components/ui/NumericKeypad';

interface ScreenAuthProps {
  operators: Operator[];
  selectedOperator: Operator;
  onSelectOperator: (op: Operator) => void;
  onSuccessAuth: () => void;
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
  showToast,
  isOffline = false,
}) => {
  const [pinEntered, setPinEntered] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);

  const handleClear = useCallback(() => {
    setPinEntered('');
    setHasError(false);
  }, []);

  const handleBackspace = useCallback(() => {
    setHasError(false);
    setPinEntered(prev => prev.slice(0, -1));
  }, []);

  const handleSubmit = useCallback((candidatePin?: string) => {
    const pin = candidatePin ?? pinEntered;
    if (isOffline) {
      showToast('Ação indisponível: Sistema offline.', 'danger');
      return;
    }
    if (pin.length < 4) {
      showToast('Por favor, digite os 4 dígitos do seu PIN.', 'warn');
      return;
    }
    if (pin === PIN_ERRO_SIMULADO) {
      setHasError(true);
      setTimeout(() => {
        setPinEntered('');
        setHasError(false);
      }, 1000);
      return;
    }

    onSuccessAuth();
  }, [pinEntered, isOffline, showToast, onSuccessAuth]);

  const handleDigit = useCallback((digit: string) => {
    if (pinEntered.length < 4) {
      setHasError(false);
      const nextPin = pinEntered + digit;
      setPinEntered(nextPin);
      if (nextPin.length === 4) {
        setTimeout(() => {
          handleSubmit(nextPin);
        }, 150);
      }
    }
  }, [pinEntered, handleSubmit]);

  // Suporte a teclado físico para conveniência e acessibilidade
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [handleDigit, handleBackspace, handleClear, handleSubmit]);

  return (
    <div className="auth-grid">
      {/* Coluna de Operadores */}
      <div className="operators-column">
        <div>
          <div className="section-header-compact">
            <div className="section-tag">01 / IDENTIFICAÇÃO</div>
            <h2 className="section-title">Quem vai usar o sistema?</h2>
            <p className="section-desc" style={{ fontSize: 'var(--fs-small)' }}>
              Toque no seu perfil e digite seu PIN de 4 dígitos para entrar.
            </p>
          </div>

          <div className="operators-grid">
            {operators.map((op) => {
              const opName = op.nome || op.name || '';
              const selectedName = selectedOperator.nome || selectedOperator.name || '';
              const isSelected = op.id ? op.id === selectedOperator.id : opName === selectedName;
              return (
                <div
                  key={op.id || opName}
                  className={`operator-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onSelectOperator(op);
                    handleClear();
                  }}
                  style={{ minHeight: '64px' }}
                >
                  <span className="operator-check-badge">✓</span>
                  <div
                    className="operator-photo"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '26px',
                      fontWeight: 800,
                      color: 'var(--primary)',
                      backgroundColor: 'var(--card-hover)',
                      userSelect: 'none',
                    }}
                    aria-label={`Iniciais de ${opName}`}
                  >
                    {getInitials(opName)}
                  </div>
                  <div className="operator-card-body">
                    <span className="operator-name">{opName}</span>
                    <span className="operator-status-label" style={{ fontSize: 'var(--fs-small)' }}>
                      {isSelected ? '✓ Selecionado(a)' : 'Toque para selecionar'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="help-banner-card">
          <div className="help-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="help-text">
            <h4 style={{ fontSize: 'var(--fs-small)', margin: 0 }}>Não encontrou seu nome ou esqueceu o PIN?</h4>
            <p style={{ fontSize: 'var(--fs-small)', margin: '2px 0 0' }}>Peça ajuda imediata ao encarregado responsável pelo setor de pintura.</p>
          </div>
        </div>
      </div>

      {/* Coluna PIN e Teclado com componentes do Design System */}
      <div className="pin-column">
        <div className="pin-pad-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', marginBottom: '12px' }}>
            <div className="pin-header" style={{ marginBottom: '8px' }}>
              <h3 className="pin-title" style={{ fontSize: '20px', color: 'var(--text)' }}>
                PIN de {selectedOperator.nome || selectedOperator.name}
              </h3>
              <div className="pin-lock-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            </div>

            {/* Componente Canônico PinInput com animação de Shake */}
            <PinInput
              length={4}
              value={pinEntered}
              hasError={hasError}
              errorMessage={
                import.meta.env.DEV
                  ? 'PIN incorreto. Tente novamente ou use 1234.'
                  : 'PIN incorreto. Tente novamente.'
              }
            />
          </div>

          {/* Componente Canônico NumericKeypad com teclas táteis de 90px */}
          <NumericKeypad
            onDigit={handleDigit}
            onBackspace={handleBackspace}
            onClear={handleClear}
            onConfirm={() => handleSubmit()}
            confirmLabel="Entrar no Sistema"
            disabled={isOffline}
            confirmDisabled={pinEntered.length < 4 || isOffline}
          />
        </div>
      </div>
    </div>
  );
};
