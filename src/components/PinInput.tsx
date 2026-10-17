import React from 'react';

export interface PinInputProps {
  length?: number; // padrão 4
  value: string;   // ex: "12" ou "1234"
  hasError?: boolean;
  errorMessage?: string;
  label?: string;
}

/**
 * PinInput - Indicador Visual de PIN (4 dígitos)
 * Estados: vazio, preenchido, erro (com animação de shake e contorno vermelho)
 */
export const PinInput: React.FC<PinInputProps> = ({
  length = 4,
  value,
  hasError = false,
  errorMessage = 'PIN incorreto. Tente novamente.',
  label,
}) => {
  const slots = Array.from({ length }, (_, i) => i);
  const currentLength = value.length;

  return (
    <div className={`ds-pin-container ${hasError ? 'is-error' : ''}`}>
      {label && <span className="ds-pin-label">{label}</span>}

      <div className="ds-pin-slots-row" role="status" aria-label={`PIN com ${currentLength} de ${length} dígitos preenchidos`}>
        {slots.map((index) => {
          const isFilled = index < currentLength;
          return (
            <div
              key={index}
              className={`ds-pin-slot ${isFilled ? 'is-filled' : ''}`}
            >
              <span className="ds-pin-dot" />
            </div>
          );
        })}
      </div>

      <div className="ds-pin-status-message">
        {hasError ? (
          <span className="ds-pin-error-text" role="alert">
            ⚠ {errorMessage}
          </span>
        ) : (
          <span className="ds-pin-info-text">
            {currentLength === length ? '✓ 4 de 4 dígitos inseridos' : `${currentLength} de ${length} dígitos`}
          </span>
        )}
      </div>
    </div>
  );
};
