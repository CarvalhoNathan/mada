import React from 'react';

export type CardVariant = 'default' | 'selectable' | 'alert-warn' | 'alert-danger';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  selected?: boolean;
  onSelect?: () => void;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Card - Design System Chão de Fábrica
 * Estados: padrão, selecionável (borda azul + check), com alerta (borda warn/danger)
 */
export const Card: React.FC<CardProps> = ({
  variant = 'default',
  selected = false,
  onSelect,
  headerRight,
  children,
  className = '',
  ...props
}) => {
  const isSelectable = variant === 'selectable';
  const resolvedClass = [
    'ds-card',
    `ds-card-${variant}`,
    selected ? 'is-selected' : '',
    isSelectable ? 'is-clickable' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={resolvedClass}
      onClick={isSelectable ? onSelect : props.onClick}
      role={isSelectable ? 'checkbox' : undefined}
      aria-checked={isSelectable ? selected : undefined}
      tabIndex={isSelectable ? 0 : undefined}
      {...props}
    >
      {/* Checkmark no canto superior direito para cartões selecionáveis */}
      {isSelectable && (
        <span className={`ds-card-check ${selected ? 'is-active' : ''}`} aria-hidden="true">
          ✓
        </span>
      )}

      {headerRight && <div className="ds-card-header-right">{headerRight}</div>}

      <div className="ds-card-content">
        {children}
      </div>
    </div>
  );
};
