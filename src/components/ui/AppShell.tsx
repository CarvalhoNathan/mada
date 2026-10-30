import React from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { ScreenId } from '../../types';

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
  currentScreen?: ScreenId;
  onNavigate?: (screen: ScreenId) => void;
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
 * AppShell - Design System BoardUI Authentic (1280x800)
 * Cabeçalho Superior Fixo (58px) + Área Central de Conteúdo Sem Rolagem + Barra Inferior Fixa
 */
export const AppShell: React.FC<AppShellProps> = ({
  appName = 'Cabine de Pintura',
  subTitle,
  operator,
  isWifiConnected = true,
  isServerLocal = true,
  onOperatorClick,
  currentScreen = 'dashboard',
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

  // Se estiver na tela de autenticação, renderiza limpo sem cabeçalho
  if (currentScreen === 'auth') {
    return (
      <div className="ds-app-shell auth-shell-layout">
        <main className="ds-shell-main" style={{ padding: 0 }}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="ds-app-shell">
      {/* 1. Cabeçalho Estilo BoardUI (58px fixo, fosco com borda sutil) */}
      <header className="boardui-top-header">
        {/* Marca / Estação */}
        <div className="boardui-header-brand">
          <div className="boardui-brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 2v7.31L4.14 20a2 2 0 0 0 1.72 3h12.28a2 2 0 0 0 1.72-3L14 9.31V2"/>
              <path d="M8.5 2h7"/>
              <path d="M7 16h10"/>
            </svg>
          </div>
          <div className="boardui-brand-text">
            <h1 className="boardui-brand-name">{appName}</h1>
            {subTitle && <span className="boardui-brand-sub">{subTitle}</span>}
          </div>
        </div>

        {/* Lado Direito: Status + Modo Limpeza + Operador */}
        <div className="boardui-header-right">
          {/* Chips de Conexão */}
          <div className="boardui-chips-group">
            <div className={`boardui-chip ${isWifiConnected ? 'online' : 'offline'}`}>
              <div className="boardui-chip-dot" />
              <span>{isWifiConnected ? 'Wi-Fi' : 'Sem Wi-Fi'}</span>
            </div>
            <div className={`boardui-chip ${isServerLocal ? 'online' : 'offline'}`}>
              <div className="boardui-chip-dot" />
              <span>{isServerLocal ? 'Sistema' : 'Offline'}</span>
            </div>
          </div>

          {/* Botão Limpeza de Tela */}
          <button
            type="button"
            className="boardui-clean-btn"
            onClick={handleStartCleaning}
            title="Limpar tela (bloqueia o toque por 15 segundos)"
            aria-label="Limpar tela"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/>
            </svg>
            <span>Limpar tela</span>
          </button>

          {/* Operador Logado - Estilo BoardUI Profile Selector */}
          {operator && (
            <div
              className="boardui-operator-pill"
              onClick={onOperatorClick}
              role={onOperatorClick ? 'button' : undefined}
              title={onOperatorClick ? 'Toque para alternar operador' : undefined}
              aria-label={`Operador logado: ${operator.name}. Toque para trocar de operador.`}
            >
              <div className="boardui-operator-avatar">
                {getInitials(operator.name)}
              </div>
              <span className="boardui-operator-name">{operator.name}</span>
              <span className="boardui-operator-chevron" aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>
                <ChevronsUpDown size={14} />
              </span>
            </div>
          )}
        </div>
      </header>

      {/* 2. Área Central de Conteúdo (Sem rolagem em 1280x800) */}
      <main className="boardui-content-canvas">
        <div className="boardui-content-inner">
          {children}
        </div>
      </main>

      {/* 3. Barra Inferior Fixa (Telas de fluxo) */}
      {bottomBar && (
        <footer className="boardui-bottom-bar">
          <div className="boardui-bottom-left">
            {bottomBar.onBack && (
              <button
                type="button"
                className="boardui-btn-secondary"
                onClick={bottomBar.onBack}
              >
                ← {bottomBar.backLabel || 'Voltar'}
              </button>
            )}
          </div>

          <div className="boardui-bottom-right">
            {bottomBar.onPrimary && (
              <button
                type="button"
                className="boardui-btn-primary"
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
