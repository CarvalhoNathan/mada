import React from 'react';

export interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface ChoiceChipsProps {
  options: ChoiceOption[];
  selectedValue: string | null;
  /** NUNCA vem pré-selecionada por padrão conforme diretriz de chão de fábrica */
  onSelect: (value: string) => void;
  label?: string;
  disabled?: boolean;
}

/**
 * ChoiceChips - Opções Grandes de Toque Único (Tablet)
 * Regra: Nenhuma opção vem pré-selecionada para forçar o operador a confirmar explicitamente.
 * Altura tátil >= 64px, feedback com anel azul e check.
 */
export const ChoiceChips: React.FC<ChoiceChipsProps> = ({
  options,
  selectedValue,
  onSelect,
  label,
  disabled = false,
}) => {
  return (
    <div className="ds-choice-chips-container">
      {label && <label className="ds-choice-label">{label}</label>}

      <div className="ds-choice-grid" role="radiogroup" aria-label={label || 'Escolha uma opção'}>
        {options.map((opt) => {
          const isSelected = selectedValue === opt.value;

          return (
            <button
              key={opt.value}
              type="button"
              className={`ds-choice-card ${isSelected ? 'is-selected' : ''}`}
              onClick={() => !disabled && onSelect(opt.value)}
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
            >
              <div className="ds-choice-left">
                {opt.icon && <span className="ds-choice-icon">{opt.icon}</span>}
                <div className="ds-choice-text">
                  <strong className="ds-choice-title">{opt.label}</strong>
                  {opt.description && <span className="ds-choice-desc">{opt.description}</span>}
                </div>
              </div>

              <div className="ds-choice-radio-indicator">
                {isSelected && <span className="ds-choice-radio-inner">✓</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
