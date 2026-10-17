import React from 'react';

export type StatusBannerVariant = 'info' | 'warn' | 'danger';

export interface StatusBannerProps {
  variant?: StatusBannerVariant;
  title: string;
  description?: string;
  actionButton?: React.ReactNode;
  icon?: React.ReactNode;
}

/**
 * StatusBanner - Faixa de Alerta Superior de Largura Total
 * Utilizado para estados críticos do sistema (ex: "Sem Wi-Fi / Sem Servidor")
 */
export const StatusBanner: React.FC<StatusBannerProps> = ({
  variant = 'danger',
  title,
  description,
  actionButton,
  icon,
}) => {
  const defaultIcons = {
    info: 'ℹ',
    warn: '⚠',
    danger: '⚡',
  };

  return (
    <aside className={`ds-status-banner ds-status-banner-${variant}`} role="alert">
      <div className="ds-status-banner-content">
        <span className="ds-status-banner-icon" aria-hidden="true">
          {icon || defaultIcons[variant]}
        </span>
        <div className="ds-status-banner-text">
          <strong className="ds-status-banner-title">{title}</strong>
          {description && <span className="ds-status-banner-desc"> — {description}</span>}
        </div>
      </div>

      {actionButton && (
        <div className="ds-status-banner-action">
          {actionButton}
        </div>
      )}
    </aside>
  );
};
