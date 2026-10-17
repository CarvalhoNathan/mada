import React from 'react';

export interface NumberStepperProps {
  value: number;
  unit?: string; // 'ml' | 'g' | etc
  step?: number;
  min?: number;
  max?: number;
  standardValue?: number; // Valor padrão homologado
  toleranceMax?: number;  // Limite máximo de tolerância
  onChange: (newValue: number) => void;
  onOpenKeypad?: () => void; // Toque no número abre o teclado numérico grande
  label?: string;
  disabled?: boolean;
}

/**
 * NumberStepper - Entrada Numérica Tátil para Operadores com Luvas
 * Botões − e + de 64px, valor central de 56px (--fs-number)
 * Alerta em vermelho se estiver acima do limite de tolerância
 */
export const NumberStepper: React.FC<NumberStepperProps> = ({
  value,
  unit = 'ml',
  step = 50,
  min = 0,
  max = 10000,
  standardValue,
  toleranceMax,
  onChange,
  onOpenKeypad,
  label,
  disabled = false,
}) => {
  const isOverTolerance = toleranceMax !== undefined && value > toleranceMax;
  const difference = standardValue !== undefined ? value - standardValue : 0;

  const handleDecrement = () => {
    if (disabled) return;
    const next = Math.max(min, value - step);
    onChange(next);
  };

  const handleIncrement = () => {
    if (disabled) return;
    const next = Math.min(max, value + step);
    onChange(next);
  };

  return (
    <div className={`ds-stepper-container ${isOverTolerance ? 'is-over-tolerance' : ''}`}>
      {label && <label className="ds-stepper-label">{label}</label>}

      <div className="ds-stepper-controls">
        <button
          type="button"
          className="ds-stepper-btn ds-stepper-minus"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          aria-label={`Diminuir ${step} ${unit}`}
        >
          −
        </button>

        <div
          className="ds-stepper-value-display"
          onClick={onOpenKeypad}
          role="button"
          tabIndex={0}
          title="Toque para digitar o valor no teclado numérico"
        >
          <span className="ds-stepper-number">{value.toLocaleString('pt-BR')}</span>
          <span className="ds-stepper-unit">{unit}</span>
          <span className="ds-stepper-tap-hint">Toque p/ digitar</span>
        </div>

        <button
          type="button"
          className="ds-stepper-btn ds-stepper-plus"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          aria-label={`Aumentar ${step} ${unit}`}
        >
          +
        </button>
      </div>

      {/* Alerta de tolerância excedida */}
      {isOverTolerance && (
        <div className="ds-stepper-warning-banner" role="alert">
          <span className="ds-stepper-warning-icon">⚠</span>
          <span className="ds-stepper-warning-text">
            <strong>+{difference} {unit}</strong> acima do padrão homologado ({standardValue} {unit})
          </span>
        </div>
      )}
    </div>
  );
};
