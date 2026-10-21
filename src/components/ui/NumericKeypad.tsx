import React from 'react';

export interface NumericKeypadProps {
  onDigit?: (digit: string) => void;
  onKeyPress?: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  disabled?: boolean;
  confirmDisabled?: boolean;
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
  confirmDisabled = false,
}) => {
  const handleDigit = onDigit || onKeyPress || (() => {});

  const triggerHaptic = (ms = 25) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {
        // Silently ignore if not supported
      }
    }
  };

  const onDigitPress = (num: string) => {
    triggerHaptic(20);
    handleDigit(num);
  };

  const onBackspacePress = () => {
    triggerHaptic(30);
    onBackspace();
  };

  const onClearPress = () => {
    triggerHaptic(35);
    onClear();
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="ds-numeric-keypad" role="group" aria-label="Teclado numérico industrial">
      <div className="ds-keypad-grid">
        {digits.map((num) => (
          <button
            key={num}
            type="button"
            className="ds-keypad-btn ds-keypad-digit"
            onClick={() => onDigitPress(num)}
            disabled={disabled}
          >
            {num}
          </button>
        ))}

        <button
          type="button"
          className="ds-keypad-btn ds-keypad-action ds-keypad-clear"
          onClick={onClearPress}
          disabled={disabled}
          aria-label="Limpar todos os dígitos"
        >
          C
        </button>

        <button
          type="button"
          className="ds-keypad-btn ds-keypad-digit"
          onClick={() => onDigitPress('0')}
          disabled={disabled}
        >
          0
        </button>

        <button
          type="button"
          className="ds-keypad-btn ds-keypad-action ds-keypad-backspace"
          onClick={onBackspacePress}
          disabled={disabled}
          aria-label="Apagar último dígito"
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
            <line x1="18" y1="9" x2="12" y2="15" />
            <line x1="12" y1="9" x2="18" y2="15" />
          </svg>
        </button>
      </div>

      {onConfirm && (
        <button
          type="button"
          className="ds-btn ds-btn-primary ds-btn-lg ds-keypad-confirm-btn"
          onClick={onConfirm}
          disabled={disabled || confirmDisabled}
        >
          {confirmLabel} →
        </button>
      )}
    </div>
  );
};
