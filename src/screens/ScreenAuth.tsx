import React, { useState } from 'react';
import { Operator } from '../types';
import { NumericKeypad } from '../components/ui/NumericKeypad';
import { PinInput } from '../components/ui/PinInput';
import { Button } from '../components/ui/Button';

interface ScreenAuthProps {
  operators: Operator[];
  selectedOperator: Operator;
  onSelectOperator: (op: Operator) => void;
  onSuccessAuth: () => void;
  isOffline: boolean;
  showToast: (msg: string, type?: 'info' | 'success' | 'warn' | 'danger') => void;
}

export const ScreenAuth: React.FC<ScreenAuthProps> = ({
  operators,
  selectedOperator,
  onSelectOperator,
  onSuccessAuth,
  isOffline,
  showToast,
}) => {
  const [pinEntered, setPinEntered] = useState('');
  const [hasError, setHasError] = useState(false);

  const handleKeyPress = (char: string) => {
    if (isOffline) {
      showToast('Sistema offline. Entrada bloqueada.', 'danger');
      return;
    }
    if (hasError) setHasError(false);

    if (pinEntered.length < 4) {
      setPinEntered(prev => prev + char);
    }
  };

  const handleClear = () => {
    setPinEntered('');
    setHasError(false);
  };

  const handleBackspace = () => {
    if (hasError) setHasError(false);
    setPinEntered(prev => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (isOffline) {
      showToast('Ação indisponível: Servidor local offline.', 'danger');
      return;
    }
    if (pinEntered.length < 4) {
      showToast('Por favor, digite os 4 dígitos do seu PIN.', 'warn');
      return;
    }
    if (pinEntered === '0000') {
      setHasError(true);
      setTimeout(() => {
        setPinEntered('');
        setHasError(false);
      }, 800);
      return;
    }

    onSuccessAuth();
  };

  return (
    <div className="auth-grid">
      {/* Coluna de Operadores */}
      <div className="operators-column">
        <div>
          <div className="section-header-compact">
            <div className="section-tag">01 / IDENTIFICAÇÃO</div>
            <h2 className="section-title">Quem vai usar o sistema?</h2>
            <p className="section-desc">Toque na sua foto e digite seu PIN de 4 dígitos para entrar.</p>
          </div>

          <div className="operators-grid">
            {operators.map((op) => {
              const isSelected = op.name === selectedOperator.name;
              return (
                <div
                  key={op.name}
                  className={`operator-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onSelectOperator(op);
                    handleClear();
                  }}
                >
                  <span className="operator-check-badge">✓</span>
                  <img src={op.avatar} alt={op.name} className="operator-photo" />
                  <div className="operator-card-body">
                    <span className="operator-name">{op.name}</span>
                    <span className="operator-status-label">
                      {isSelected ? 'Selecionado(a)' : 'Toque para selecionar'}
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
            <h4>Não encontrou seu nome ou esqueceu o PIN?</h4>
            <p>Peça ajuda imediata ao encarregado responsável pelo setor de pintura.</p>
          </div>
        </div>
      </div>

      {/* Coluna PIN e Teclado */}
      <div className="pin-column">
        <div className="pin-pad-card">
          <div>
            <div className="pin-header">
              <h3 className="pin-title">PIN de {selectedOperator.name}</h3>
              <div className="pin-lock-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            </div>
            <p className="pin-sub">Digite seu código de 4 dígitos no teclado tátil.</p>

            <PinInput
              length={4}
              value={pinEntered}
              hasError={hasError}
              errorMessage="PIN inválido. Tente novamente."
            />
          </div>

          <NumericKeypad
            onDigit={handleKeyPress}
            onKeyPress={handleKeyPress}
            onClear={handleClear}
            onBackspace={handleBackspace}
            disabled={isOffline}
          />

          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={isOffline || pinEntered.length < 4}
            className="w-full"
            style={{ width: '100%', fontSize: '20px' }}
          >
            Entrar no sistema →
          </Button>
        </div>
      </div>
    </div>
  );
};
