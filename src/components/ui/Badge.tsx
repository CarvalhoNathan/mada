import React from 'react';
import { Check, AlertTriangle, X, Info } from 'lucide-react';

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
    ok: <Check size={13} strokeWidth={2.8} />,
    warn: <AlertTriangle size={13} strokeWidth={2.8} />,
    danger: <X size={13} strokeWidth={2.8} />,
    info: <Info size={13} strokeWidth={2.8} />,
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
