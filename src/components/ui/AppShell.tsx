import React from 'react';

export interface OperatorInfo {
  name: string;
  avatarUrl?: string;
  role?: string;
}

export interface AppShellProps {
  appName?: string;
  subTitle?: string;
  operator?: OperatorInfo;
  isWifiConnected?: boolean;
  isServerLocal?: boolean;
  onOperatorClick?: () => void;
  // Barra inferior
  bottomBar?: {
    backLabel?: string;
    onBack?: () => void;
    primaryLabel?: string;
    onPrimary?: () => void;
    isPrimaryDisabled?: boolean;
    primaryIcon?: React.ReactNode;
  };
  children: React.ReactNode;
}

/**
 * AppShell - Moldura Principal Tablet (1280x800)
 * Cabeçalho fixo + Conteúdo dimensionado para caber SEM rolagem + Barra inferior fixa
 */
export const AppShell: React.FC<AppShellProps> = ({
  appName = 'Gerenciador de Químicos',
  subTitle = 'MADA MARCENARIA • SETOR DE PINTURA',
  operator,
  isWifiConnected = true,
  isServerLocal = true,
  onOperatorClick,
  bottomBar,
  children,
}) => {
  return (
    <div className="ds-app-shell">
      {/* 1. Cabeçalho Fixo */}
      <header className="ds-shell-header">
        <div className="ds-shell-brand">
          <div className="ds-shell-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 2v7.31L4.14 20a2 2 0 0 0 1.72 3h12.28a2 2 0 0 0 1.72-3L14 9.31V2"/>
              <path d="M8.5 2h7"/>
              <path d="M7 16h10"/>
            </svg>
          </div>
          <div className="ds-shell-titles">
            <h1 className="ds-shell-app-name">{appName}</h1>
            <span className="ds-shell-sub-name">{subTitle}</span>
          </div>
        </div>

        <div className="ds-shell-header-right">
          {/* Status de Conexão */}
          <div className="ds-shell-chips-group">
            <span className={`ds-badge ${isWifiConnected ? 'ds-badge-ok' : 'ds-badge-danger'}`}>
              <span className="ds-dot" /> {isWifiConnected ? 'Wi-Fi OK' : 'Sem Wi-Fi'}
            </span>
            <span className={`ds-badge ${isServerLocal ? 'ds-badge-ok' : 'ds-badge-danger'}`}>
              <span className="ds-dot" /> {isServerLocal ? 'Sistema OK' : 'Offline'}
            </span>
          </div>

          {/* Operador Logado */}
          {operator && (
            <div
              className="ds-shell-operator-card"
              onClick={onOperatorClick}
              role={onOperatorClick ? 'button' : undefined}
              title={onOperatorClick ? 'Toque para trocar de operador' : undefined}
            >
              {operator.avatarUrl ? (
                <img src={operator.avatarUrl} alt={operator.name} className="ds-shell-avatar" />
              ) : (
                <div className="ds-shell-avatar-fallback">{operator.name.charAt(0)}</div>
              )}
              <div className="ds-shell-operator-meta">
                <span className="ds-shell-operator-name">{operator.name}</span>
                <span className="ds-shell-operator-role">{operator.role || 'Operador Conectado'}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 2. Área Central de Conteúdo (Sem rolagem em 1280x800) */}
      <main className="ds-shell-main">
        <div className="ds-shell-content-container">
          {children}
        </div>
      </main>

      {/* 3. Barra Inferior Fixa */}
      {bottomBar && (
        <footer className="ds-shell-bottom-bar">
          <div className="ds-shell-bottom-left">
            {bottomBar.onBack && (
              <button
                type="button"
                className="ds-btn ds-btn-secondary ds-btn-md"
                onClick={bottomBar.onBack}
              >
                ← {bottomBar.backLabel || 'Voltar'}
              </button>
            )}
          </div>

          <div className="ds-shell-bottom-right">
            {bottomBar.onPrimary && (
              <button
                type="button"
                className="ds-btn ds-btn-primary ds-btn-lg"
                onClick={bottomBar.onPrimary}
                disabled={bottomBar.isPrimaryDisabled}
              >
                {bottomBar.primaryLabel || 'Confirmar e Continuar'} →
              </button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
};
