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

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * AppShell - Moldura Principal Tablet (1280x800)
 * Cabeçalho fixo + Conteúdo dimensionado para caber SEM rolagem + Barra inferior fixa
 */
export const AppShell: React.FC<AppShellProps> = ({
  appName = 'Cabine de Pintura',
  subTitle,
  operator,
  isWifiConnected = true,
  isServerLocal = true,
  onOperatorClick,
  bottomBar,
  children,
}) => {
  const [isCleaning, setIsCleaning] = React.useState(false);
  const [countdown, setCountdown] = React.useState(15);

  const handleStartCleaning = () => {
    setCountdown(15);
    setIsCleaning(true);
  };

  React.useEffect(() => {
    if (!isCleaning) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsCleaning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isCleaning]);
  return (
    <div className="ds-app-shell">
      {/* 1. Cabeçalho Compacto (56px) */}
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
            {subTitle && <span className="ds-shell-sub-name">{subTitle}</span>}
          </div>
        </div>

        <div className="ds-shell-header-right">
          {/* Status de Conexão Discreto (ícone + chip sutil) */}
          <div className="ds-shell-chips-group">
            <div className={`ds-status-chip ${isWifiConnected ? 'is-connected' : 'is-disconnected'}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
                <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
                <line x1="12" y1="20" x2="12.01" y2="20"/>
              </svg>
              <span>{isWifiConnected ? 'Wi-Fi' : 'Sem Wi-Fi'}</span>
            </div>
            <div className={`ds-status-chip ${isServerLocal ? 'is-connected' : 'is-disconnected'}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
                <line x1="6" y1="6" x2="6.01" y2="6"/>
                <line x1="6" y1="18" x2="6.01" y2="18"/>
              </svg>
              <span>{isServerLocal ? 'Sistema' : 'Offline'}</span>
            </div>
          </div>

          {/* Botão Modo Limpeza de Tela */}
          <button
            type="button"
            className="ds-shell-clean-btn"
            onClick={handleStartCleaning}
            title="Limpar tela (bloqueia o toque por 15 segundos)"
            aria-label="Limpar tela"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/>
            </svg>
            <span>Limpar tela</span>
          </button>

          {/* Operador Logado */}
          {operator && (
            <div
              className="ds-shell-operator-card"
              onClick={onOperatorClick}
              role={onOperatorClick ? 'button' : undefined}
              title={onOperatorClick ? 'Toque para trocar de operador' : undefined}
              aria-label={`Operador logado: ${operator.name}. Toque para trocar de operador.`}
            >
              <div className="ds-shell-avatar-fallback">
                {getInitials(operator.name)}
              </div>
              <span className="ds-shell-operator-name">{operator.name}</span>
              <button
                type="button"
                className="ds-shell-logout-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onOperatorClick?.();
                }}
                title="Trocar operador"
                aria-label="Trocar operador"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
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

      {/* 4. Overlay de Modo Limpeza de Tela (15s Touch Lock) */}
      {isCleaning && (
        <div
          className="ds-clean-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Modo Limpeza de Tela Ativo"
        >
          <div className="ds-clean-card">
            <div className="ds-clean-circle-box">
              <svg className="ds-clean-progress-ring" width="130" height="130" viewBox="0 0 130 130">
                <circle
                  className="ds-clean-ring-bg"
                  cx="65"
                  cy="65"
                  r="56"
                  strokeWidth="8"
                />
                <circle
                  className="ds-clean-ring-bar"
                  cx="65"
                  cy="65"
                  r="56"
                  strokeWidth="8"
                  style={{
                    strokeDasharray: 2 * Math.PI * 56,
                    strokeDashoffset: (2 * Math.PI * 56) * (1 - countdown / 15),
                  }}
                />
              </svg>
              <span className="ds-clean-countdown">{countdown}s</span>
            </div>

            <div className="ds-clean-text-group">
              <h2 className="ds-clean-title">Modo Limpeza de Tela</h2>
              <p className="ds-clean-desc">
                Toques na tela bloqueados temporariamente. Passe uma flanela para higienizar o vidro do tablet.
              </p>
            </div>

            <button
              type="button"
              className="ds-clean-cancel-btn"
              onClick={() => setIsCleaning(false)}
            >
              Desbloquear agora
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
