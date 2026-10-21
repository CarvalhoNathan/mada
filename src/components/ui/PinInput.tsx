import React from 'react';

export interface PinInputProps {
  length?: number; // padrão 4
  value: string;   // ex: "12" ou "1234"
  hasError?: boolean;
  isSuccess?: boolean;
  errorMessage?: string;
  label?: string;
}

/**
 * PinInput - Indicador Visual de PIN Minimalista (Estilo Apple HIG)
 * 4 círculos (dots) de 20px com espaçamento de 16px.
 * Vazio: anel fino #334155
 * Preenchido: círculo sólido luminoso #F5F7FA
 * Erro: shake suave e círculos vermelhos #EF4444
 * Sucesso: pulso luminoso verde (#10B981) antes da transição
 */
export const PinInput: React.FC<PinInputProps> = ({
  length = 4,
  value,
  hasError = false,
  isSuccess = false,
  errorMessage,
  label,
}) => {
  const slots = Array.from({ length }, (_, i) => i);
  const currentLength = value.length;

  return (
    <div className={`apple-pin-wrapper ${hasError ? 'shake' : ''} ${isSuccess ? 'success' : ''}`}>
      {label && <span className="apple-pin-label">{label}</span>}

      <div
        className="apple-pin-dots-row"
        role="status"
        aria-label={`PIN com ${currentLength} de ${length} dígitos preenchidos`}
      >
        {slots.map((index) => {
          const isFilled = index < currentLength;
          return (
            <div
              key={index}
              className={`apple-pin-dot ${isFilled ? 'filled' : 'empty'} ${hasError ? 'error' : ''} ${isSuccess ? 'success' : ''}`}
            />
          );
        })}
      </div>

      {hasError && errorMessage && (
        <div className="apple-pin-error-msg" role="alert">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

