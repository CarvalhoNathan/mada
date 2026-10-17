import React from 'react';

export interface ChecklistRowProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  /** NUNCA vem pré-marcada por padrão no processo produtivo */
  onChange: (checked: boolean) => void;
  required?: boolean;
  disabled?: boolean;
}

/**
 * ChecklistRow - Linha de Validação Química (Tablet Chão de Fábrica)
 * Altura tátil >= 72px. O operador toca em qualquer lugar da linha para alternar.
 * Regra: NUNCA vem pré-marcada para garantir verificação consciente com luvas.
 */
export const ChecklistRow: React.FC<ChecklistRowProps> = ({
  id,
  label,
  description,
  checked,
  onChange,
  required = false,
  disabled = false,
}) => {
  return (
    <div
      id={id}
      className={`ds-checklist-row ${checked ? 'is-checked' : ''} ${disabled ? 'is-disabled' : ''}`}
      onClick={() => !disabled && onChange(!checked)}
      role="checkbox"
      aria-checked={checked}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
          e.preventDefault();
          onChange(!checked);
        }
      }}
    >
      <div className="ds-checklist-box">
        {checked && <span className="ds-checklist-check-icon">✓</span>}
      </div>

      <div className="ds-checklist-content">
        <span className="ds-checklist-label">
          {label}
          {required && <span className="ds-checklist-required" title="Obrigatório">*</span>}
        </span>
        {description && <span className="ds-checklist-desc">{description}</span>}
      </div>

      <div className="ds-checklist-status-badge">
        {checked ? (
          <span className="ds-badge ds-badge-ok">Validado</span>
        ) : (
          <span className="ds-badge ds-badge-warn">Pendente</span>
        )}
      </div>
    </div>
  );
};
