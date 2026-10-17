import React from 'react';

export interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  changePercent?: number; // ex: +5.4%
  changeStatus?: 'ok' | 'warn' | 'danger';
  changeText?: string;
  metaTarget?: string;
  icon?: React.ReactNode;
}

/**
 * KpiCard - Cartão de Métricas para Painel de Gerência (PC Desktop)
 * Layout denso com alta leiturabilidade executiva.
 */
export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  unit,
  changePercent,
  changeStatus = 'ok',
  changeText,
  metaTarget,
  icon,
}) => {
  return (
    <div className="ds-kpi-card">
      <div className="ds-kpi-top">
        <span className="ds-kpi-label">{label}</span>
        {icon && <span className="ds-kpi-icon">{icon}</span>}
      </div>

      <div className="ds-kpi-value-row">
        <span className="ds-kpi-value">{value}</span>
        {unit && <span className="ds-kpi-unit">{unit}</span>}
      </div>

      <div className="ds-kpi-footer">
        {changePercent !== undefined && (
          <span className={`ds-kpi-badge ds-kpi-${changeStatus}`}>
            {changePercent >= 0 ? `+${changePercent}%` : `${changePercent}%`}
          </span>
        )}
        {changeText && <span className="ds-kpi-change-text">{changeText}</span>}
        {metaTarget && <span className="ds-kpi-meta-text">Meta: {metaTarget}</span>}
      </div>
    </div>
  );
};
