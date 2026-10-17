import React, { useState } from 'react';
import { Operator } from '../types';
import { PIN_ERRO_SIMULADO } from '../data';

interface ScreenAuthProps {
  operators: Operator[];
  selectedOperator: Operator;
  onSelectOperator: (op: Operator) => void;
  onSuccessAuth: () => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'warn' | 'danger') => void;
  isOffline?: boolean;
}

const PIN_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];

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

  const handleKeyPress = (key: string) => {
    if (key === 'C') {
      handleClear();
      return;
    }
    if (key === '⌫') {
      handleBackspace();
      return;
    }
    if (pinEntered.length < 4) {
      if (hasError) setHasError(false);
      setPinEntered(prev => prev + key);
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
      showToast('Ação indisponível: Sistema offline.', 'danger');
      return;
    }
    if (pinEntered.length < 4) {
      showToast('Por favor, digite os 4 dígitos do seu PIN.', 'warn');
      return;
    }
    if (pinEntered === PIN_ERRO_SIMULADO) {
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
            <p className="section-desc">Toque no seu perfil e digite seu PIN de 4 dígitos para entrar.</p>
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
              <h3 className="pin-title">PIN de {selectedOperator.nome || selectedOperator.name}</h3>
              <div className="pin-lock-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            </div>

            {/* Display de 4 Dígitos */}
            <div className={`pin-display-dots ${hasError ? 'error-shake' : ''}`}>
              {[0, 1, 2, 3].map((idx) => {
                const filled = pinEntered.length > idx;
                return (
                  <div key={idx} className={`pin-dot ${filled ? 'filled' : ''}`}>
                    {filled ? '•' : ''}
                  </div>
                );
              })}
            </div>

            {hasError && (
              <div className="pin-error-text">
                PIN incorreto. Tente novamente ou use 1234.
              </div>
            )}
          </div>

          {/* Teclado Numérico (Botões grandes táteis) */}
          <div className="keypad-grid">
            {PIN_KEYS.map((k) => (
              <button
                key={k}
                type="button"
                className={`keypad-btn ${k === 'C' ? 'btn-clear' : ''} ${k === '⌫' ? 'btn-back' : ''}`}
                onClick={() => handleKeyPress(k)}
              >
                {k}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn-enter"
            onClick={handleSubmit}
            disabled={pinEntered.length < 4 || isOffline}
          >
            Entrar no Sistema →
          </button>
        </div>
      </div>
    </div>
  );
};
