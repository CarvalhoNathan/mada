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

  return (
    <div className="auth-layout-minimal">
      {/* Coluna da Esquerda: Seleção do Pintor */}
      <section className="auth-left-column" aria-label="Seleção de Operador">
        <h2 className="auth-title-minimal">Quem está pintando?</h2>

        <div className="auth-operators-vertical" role="radiogroup" aria-label="Operadores disponíveis">
          {operators.map((op) => {
            const opName = op.nome || op.name || '';
            const opRole = op.papel || op.role || 'Operador de Pintura';
            const isSelected = op.id ? op.id === selectedOperator.id : opName === selectedName;

            return (
              <div
                key={op.id || opName}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                className={`operator-card-apple ${isSelected ? 'is-active' : ''}`}
                onClick={() => {
                  onSelectOperator(op);
                  handleClear();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectOperator(op);
                    handleClear();
                  }
                }}
              >
                <div className="operator-avatar-circle" aria-hidden="true">
                  {getInitials(opName)}
                </div>
                <div className="operator-info-apple">
                  <span className="operator-name-apple">{opName}</span>
                  <span className="operator-role-apple">{opRole}</span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="auth-help-link-subtle"
          onClick={() => {
            showToast('Solicite assistência ao encarregado para recuperar ou redefinir seu PIN.', 'info');
          }}
        >
          Esqueceu o PIN ou precisa de ajuda?
        </button>
      </section>

      {/* Coluna da Direita: Teclado Numérico & PIN estilo Apple */}
      <section className="auth-right-column" aria-label="Autenticação com PIN">
        <div className="auth-pin-card-apple">
          <div className="auth-pin-card-header">
            <h3 className="auth-pin-title">PIN de {selectedName}</h3>
          </div>

          <PinInput
            length={4}
            value={pinEntered}
            hasError={hasError}
            isSuccess={isSuccess}
            errorMessage="PIN incorreto"
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
  );
};

