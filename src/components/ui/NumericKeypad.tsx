import React from 'react';

export interface NumericKeypadProps {
  onDigit?: (digit: string) => void;
  onKeyPress?: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  disabled?: boolean;
}

/**
 * NumericKeypad - Teclado Tátil Industrial de 90px
 * Otimizado para operadores com luvas e mãos sujas.
 * Inclui teclas dedicadas de Limpar e Backspace (Apagar).
 */
export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onDigit,
  onKeyPress,
  onBackspace,
  onClear,
  onConfirm,
  confirmLabel = 'Confirmar',
  disabled = false,
}) => {
  const handleDigit = onDigit || onKeyPress || (() => {});
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="ds-numeric-keypad" role="group" aria-label="Teclado numérico industrial">
      <div className="ds-keypad-grid">
        {digits.map((num) => (
          <button
            key={num}
            type="button"
            className="ds-keypad-btn ds-keypad-digit"
            onClick={() => handleDigit(num)}
            disabled={disabled}
          >
            {num}
          </button>
        ))}

        <button
          type="button"
          className="ds-keypad-btn ds-keypad-action ds-keypad-clear"
          onClick={onClear}
          disabled={disabled}
          aria-label="Limpar todos os dígitos"
        >
          Limpar
        </button>

        <button
          type="button"
          className="ds-keypad-btn ds-keypad-digit"
          onClick={() => handleDigit('0')}
          disabled={disabled}
        >
          0
        </button>

        <button
          type="button"
          className="ds-keypad-btn ds-keypad-action ds-keypad-backspace"
          onClick={onBackspace}
          disabled={disabled}
          aria-label="Apagar último dígito"
        >
          ⌫ Apagar
        </button>
      </div>

      {onConfirm && (
        <button
          type="button"
          className="ds-btn ds-btn-primary ds-btn-lg ds-keypad-confirm-btn"
          onClick={onConfirm}
          disabled={disabled}
        >
          {confirmLabel} →
        </button>
      )}
    </div>
  );
};
