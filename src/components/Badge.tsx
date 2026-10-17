import React from 'react';

export type BadgeVariant = 'ok' | 'warn' | 'danger' | 'info';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Badge / Chip - Rótulos de Estado Industrial
 * Regra: Texto sempre >= 16px (--fs-small), fundo translúcido (~15% opacidade)
 * e ícone obrigatório para acessibilidade de cores.
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'info',
  icon,
  children,
  className = '',
  ...props
}) => {
  const defaultIcons = {
    ok: '✓',
    warn: '⚠',
    danger: '✕',
    info: 'ℹ',
  };

  return (
    <span className={`ds-badge ds-badge-${variant} ${className}`} {...props}>
      <span className="ds-badge-icon" aria-hidden="true">
        {icon || defaultIcons[variant]}
      </span>
      <span className="ds-badge-label">{children}</span>
    </span>
  );
};
