import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

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
 * NumericKeypad - Teclado Tátil Industrial Cinético (GSAP + Feedback Tátil Óptico)
 * Otimizado para operadores com luvas e dedos com resíduos de solvente.
 * Cada tecla reage com compressão e retorno mecânico (efeito mola de alta precisão).
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
  const containerRef = useRef<HTMLDivElement>(null);
  const wasDisabledRef = useRef<boolean>(disabled);

  // Efeito cascata quando o teclado é destravado
  useEffect(() => {
    if (wasDisabledRef.current && !disabled && containerRef.current) {
      const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('.ds-keypad-btn');
      if (buttons.length > 0) {
        gsap.killTweensOf(buttons);
        gsap.fromTo(
          buttons,
          { scale: 0.94, opacity: 0.75 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.24,
            stagger: 0.012,
            ease: 'back.out(2)',
          }
        );
      }
    }
    wasDisabledRef.current = disabled;
  }, [disabled]);

  const triggerHaptic = (ms = 25) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {
        // Silently ignore if not supported
      }
    }
  };

  const animateButtonPress = (el: HTMLElement | null) => {
    if (!el) return;
    gsap.killTweensOf(el);
    gsap.fromTo(
      el,
      { scale: 0.88 },
      {
        scale: 1,
        duration: 0.18,
        ease: 'back.out(2.4)',
      }
    );
  };

  const onDigitPress = (num: string, e: React.MouseEvent<HTMLButtonElement>) => {
    animateButtonPress(e.currentTarget);
    triggerHaptic(20);
    handleDigit(num);
  };

  const onBackspacePress = (e: React.MouseEvent<HTMLButtonElement>) => {
    animateButtonPress(e.currentTarget);
    triggerHaptic(30);
    onBackspace();
  };

  const onClearPress = (e: React.MouseEvent<HTMLButtonElement>) => {
    animateButtonPress(e.currentTarget);
    triggerHaptic(35);
    onClear();
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div
      ref={containerRef}
      className={`ds-numeric-keypad ${disabled ? 'is-disabled' : 'is-ready'}`}
      role="group"
      aria-label="Teclado numérico industrial"
    >
      <div className="ds-keypad-grid">
        {digits.map((num) => (
          <button
            key={num}
            type="button"
            className="ds-keypad-btn ds-keypad-digit"
            onClick={(e) => onDigitPress(num, e)}
            disabled={disabled}
          >
            <span className="ds-keypad-digit-num">{num}</span>
          </button>
        ))}

        <button
          type="button"
          className="ds-keypad-btn ds-keypad-action ds-keypad-clear"
          onClick={onClearPress}
          disabled={disabled}
          aria-label="Limpar todos os dígitos"
          title="Limpar PIN"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>

        <button
          type="button"
          className="ds-keypad-btn ds-keypad-digit"
          onClick={(e) => onDigitPress('0', e)}
          disabled={disabled}
        >
          <span className="ds-keypad-digit-num">0</span>
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
