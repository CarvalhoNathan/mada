import React from 'react';
import { ChevronsUpDown, Clock, Wifi, WifiOff, Sparkles } from 'lucide-react';
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
  appName = 'Mada Marcenaria • Cabine de Pintura',
  subTitle = 'Terminal de Dosagem Homologada & Controle FEFO',
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

  // Relógio Industrial em Tempo Real (Permanente em todas as telas)
  const [currentTime, setCurrentTime] = React.useState<string>(() => {
    const now = new Date();
    return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });
  const [currentDate, setCurrentDate] = React.useState<string>(() => {
    const now = new Date();
    return now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  });

  React.useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', ''));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
    <div className={`ds-app-shell ${currentScreen === 'auth' ? 'auth-shell-layout' : ''}`}>
      {/* 1. Cabeçalho Padronizado Único (58px fixo, compartilhado antes e depois do login) */}
      <header className="boardui-top-header">
        {/* Marca / Estação */}
        <div className="boardui-header-brand">
          <div className="boardui-brand-icon" aria-hidden="true">
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

        {/* Lado Direito Padronizado: Relógio em Tempo Real | Status Opção B (Chip Verde) | Limpar Tela | Operador */}
        <div className="boardui-header-right">
          {/* Relógio Industrial em Tempo Real */}
          <div className="boardui-header-clock" title="Horário oficial da estação de pintura">
            <Clock size={15} strokeWidth={2.2} />
            <span>{currentTime} • {currentDate}</span>
          </div>

          {/* Status de Telemetria Padronizado (Opção B - Chip Verde Suave com Wi-Fi) */}
          <div
            className={`boardui-status-pill ${isWifiConnected && isServerLocal ? 'is-online' : 'is-offline'}`}
            title={
              isWifiConnected && isServerLocal
                ? 'Balança, Wi-Fi e banco local sincronizados'
                : 'Falha de conexão com balança ou servidor'
            }
          >
            {isWifiConnected && isServerLocal ? (
              <Wifi size={17} strokeWidth={2.2} aria-hidden="true" />
            ) : (
              <WifiOff size={17} strokeWidth={2.2} aria-hidden="true" />
            )}
            <span>{isWifiConnected && isServerLocal ? 'Balança & Estoque Online' : 'Terminal Offline'}</span>
          </div>

          {/* Botão Interativo: Limpeza de Tela */}
          <button
            type="button"
            className="boardui-clean-btn"
            onClick={handleStartCleaning}
            title="Limpar tela (bloqueia o toque por 15 segundos)"
            aria-label="Limpar tela"
          >
            <Sparkles size={15} strokeWidth={2.2} />
            <span>Limpar tela</span>
          </button>

          {/* Botão Interativo: Operador Logado (oculto na tela de login para evitar redundância) */}
          {operator && (
            <button
              type="button"
              className="boardui-operator-pill"
              onClick={onOperatorClick}
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
            </button>
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
