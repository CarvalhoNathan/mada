import React, { useState, useRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success';
export type ButtonSize = 'md' | 'lg'; // md: 64px, lg: 96px

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  /** Se true na variante danger, exige segurar 1.5s com barra de progresso para confirmar */
  holdToConfirm?: boolean;
  onHoldConfirm?: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Button - Design System Chão de Fábrica (Tablet 1280x800)
 * Alvos de toque industriais: 64px (md) ou 96px (lg)
 * Feedback tátil: scale .97 + brightness
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  holdToConfirm = false,
  onHoldConfirm,
  icon,
  children,
  className = '',
  onClick,
  ...props
}) => {
  const [holdingProgress, setHoldingProgress] = useState(0);
  const holdIntervalRef = useRef<number | null>(null);

  const startHold = () => {
    if (!holdToConfirm || disabled || isLoading) return;
    const startTime = Date.now();
    const duration = 1500; // 1.5 segundos

    holdIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setHoldingProgress(progress);

      if (progress >= 100) {
        clearInterval(holdIntervalRef.current!);
        holdIntervalRef.current = null;
        setHoldingProgress(0);
        if (onHoldConfirm) onHoldConfirm();
      }
    }, 20);
  };

  const cancelHold = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
      setHoldingProgress(0);
    }
  };

  return (
    <button
      className={`ds-btn ds-btn-${variant} ds-btn-${size} ${isLoading ? 'is-loading' : ''} ${className}`}
      disabled={disabled || isLoading}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      onClick={holdToConfirm ? undefined : onClick}
      {...props}
    >
      {/* Barra de progresso para hold-to-confirm */}
      {holdToConfirm && holdingProgress > 0 && (
        <span
          className="ds-btn-hold-bar"
          style={{ width: `${holdingProgress}%` }}
        />
      )}

      {isLoading ? (
        <span className="ds-btn-spinner" aria-hidden="true" />
      ) : (
        <>
          {icon && <span className="ds-btn-icon">{icon}</span>}
          <span className="ds-btn-label">{children}</span>
          {holdToConfirm && (
            <span className="ds-btn-hold-hint">
              {holdingProgress > 0 ? `${Math.round(holdingProgress)}%` : '(Segure 1.5s)'}
            </span>
          )}
        </>
      )}
    </button>
  );
};
