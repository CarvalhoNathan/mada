import React from 'react';

export type StepStatus = 'completed' | 'active' | 'pending';

export interface StepItem {
  id: string | number;
  label: string;
  sublabel?: string;
  status: StepStatus;
}

export interface StepIndicatorProps {
  steps: StepItem[];
  onStepClick?: (step: StepItem) => void;
}

/**
 * StepIndicator - Stepper Industrial Tablet-First
 * Estados:
 * - concluída: fundo verde suave, borda verde, checkmark branco
 * - ativa: fundo azul suave, borda azul 2px, texto branco em destaque
 * - pendente: fundo cinza escuro, texto esmaecido
 */
export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  onStepClick,
}) => {
  return (
    <nav className="ds-step-indicator" aria-label="Progresso da operação">
      <ol className="ds-step-list">
        {steps.map((step, index) => {
          const isClickable = step.status === 'completed' && onStepClick;

          return (
            <li
              key={step.id}
              className={`ds-step-item ds-step-${step.status} ${isClickable ? 'is-clickable' : ''}`}
              onClick={isClickable ? () => onStepClick(step) : undefined}
              aria-current={step.status === 'active' ? 'step' : undefined}
            >
              <div className="ds-step-badge">
                {step.status === 'completed' ? (
                  <span className="ds-step-check">✓</span>
                ) : (
                  <span className="ds-step-num">{index + 1}</span>
                )}
              </div>

              <div className="ds-step-text">
                <span className="ds-step-label">{step.label}</span>
                {step.sublabel && <span className="ds-step-sub">{step.sublabel}</span>}
              </div>

              {index < steps.length - 1 && <span className="ds-step-divider" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
