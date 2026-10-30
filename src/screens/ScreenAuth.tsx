import React, { useState, useCallback, useEffect } from 'react';
import { Check, HelpCircle, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
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
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

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

    const isValid = selectedOperator.pin
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
      setIsSuccess(false);
      setPinEntered('');
    }, 280);
  }, [isSuccess, pinEntered, isOffline, selectedOperator.pin, showToast, onSuccessAuth]);

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
      {/* Barra Superior de Identificação da Estação Industrial */}
      <header className="auth-station-bar" aria-label="Identificação da estação">
        <div className="auth-station-brand">
          <div className="boardui-brand-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 2v7.31L4.14 20a2 2 0 0 0 1.72 3h12.28a2 2 0 0 0 1.72-3L14 9.31V2" />
              <path d="M8.5 2h7" />
              <path d="M7 16h10" />
            </svg>
          </div>
          <div className="auth-station-titles">
            <span className="auth-station-title">Mada Marcenaria • Cabine de Pintura</span>
            <span className="auth-station-subtitle">Terminal de Dosagem Homologada & Controle FEFO</span>
          </div>
        </div>

        <div className="auth-station-status">
          <div className={`auth-status-pill ${isOffline ? 'is-offline' : 'is-online'}`}>
            {isOffline ? <WifiOff size={18} aria-hidden="true" /> : <Wifi size={18} aria-hidden="true" />}
            <span>{isOffline ? 'Terminal Offline' : 'Balança & Estoque Online'}</span>
          </div>
        </div>
      </header>

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
                    <span className="operator-role-apple">{opRole}</span>
                  </div>
                  <div className={`operator-select-indicator ${isSelected ? 'is-selected' : ''}`} aria-hidden="true">
                    {isSelected && <Check size={20} strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="auth-help-link-subtle"
            onClick={() => {
              showToast('Solicite assistência ao supervisor Fábio para redefinir seu PIN (Demo: 1234).', 'info');
            }}
          >
            <HelpCircle size={20} aria-hidden="true" />
            <span>Esqueceu o PIN ou precisa de ajuda?</span>
          </button>
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
    </div>
  );
};


