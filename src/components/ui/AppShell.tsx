import React from 'react';
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
 * Quando autenticado: Barra Lateral Fixa (250px) + Canvas Modular Direito (1030px)
 * Quando em autenticação: Tela cheia com PIN pad Apple HIG
 */
export const AppShell: React.FC<AppShellProps> = ({
  appName = 'Cabine de Pintura',
  operator,
  isWifiConnected = true,
  onOperatorClick,
  currentScreen = 'dashboard',
  onNavigate,
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

  // Se estiver na tela de autenticação, renderiza limpo em tela cheia
  if (currentScreen === 'auth') {
    return (
      <div className="ds-app-shell auth-shell-layout">
        <main className="ds-shell-main" style={{ padding: 0 }}>
          {children}
        </main>
      </div>
    );
  }

  const operatorName = operator?.name || 'Mertcan Esmergul';

  return (
    <div className="boardui-app-layout">
      {/* 1. Barra Lateral BoardUI (Print 1: 250px com perfil, busca e navegação) */}
      <aside className="boardui-sidebar" aria-label="Navegação Lateral">
        {/* Perfil do Usuário com Chevron e Botão Recolher */}
        <div
          className="boardui-user-profile"
          onClick={onOperatorClick}
          role="button"
          tabIndex={0}
          title="Toque para alternar operador"
        >
          <div className="boardui-user-left">
            <div className="boardui-user-avatar">
              {getInitials(operatorName)}
            </div>
            <div className="boardui-user-name">
              {operatorName}
            </div>
            <span className="boardui-user-chevron">↕</span>
          </div>

          <button
            type="button"
            className="boardui-collapse-btn"
            title="Recolher barra lateral"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </button>
        </div>

        {/* Busca Rápida Estilo BoardUI (Busca rápida ⌘L) */}
        <div
          className="boardui-search-input"
          role="button"
          tabIndex={0}
          title="Busca rápida no sistema"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span>Busca rápida</span>
          <kbd className="boardui-search-kbd">⌘L</kbd>
        </div>

        {/* Lista de Navegação Vertical BoardUI */}
        <nav className="boardui-nav-list" aria-label="Menu Principal">
          {/* Principal (Ativo com Pílula Azul Elétrica e Badge) */}
          <button
            type="button"
            className={`boardui-nav-btn ${currentScreen === 'dashboard' ? 'active' : ''}`}
            onClick={() => onNavigate?.('dashboard')}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Principal</span>
            <span className="boardui-nav-badge">152</span>
          </button>

          {/* Quadro de Projetos / Ordens de Serviço */}
          <button
            type="button"
            className={`boardui-nav-btn ${currentScreen === 'os' ? 'active' : ''}`}
            onClick={() => onNavigate?.('os')}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            <span>Quadro de projetos</span>
          </button>

          {/* Marketing / Fórmulas */}
          <button
            type="button"
            className={`boardui-nav-btn ${currentScreen === 'recipe' ? 'active' : ''}`}
            onClick={() => onNavigate?.('recipe')}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 2v7.31L4.14 20a2 2 0 0 0 1.72 3h12.28a2 2 0 0 0 1.72-3L14 9.31V2" />
              <path d="M8.5 2h7" />
              <path d="M7 16h10" />
            </svg>
            <span>Fórmulas & Receitas</span>
          </button>

          {/* Calendário */}
          <button
            type="button"
            className="boardui-nav-btn"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Calendário</span>
          </button>

          {/* Finanças / Balança & Dosagem */}
          <button
            type="button"
            className={`boardui-nav-btn ${currentScreen === 'dosing' ? 'active' : ''}`}
            onClick={() => onNavigate?.('dosing')}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="21" x2="21" y2="21" />
              <line x1="6" y1="21" x2="6" y2="10" />
              <line x1="10" y1="21" x2="10" y2="10" />
              <line x1="14" y1="21" x2="14" y2="10" />
              <line x1="18" y1="21" x2="18" y2="10" />
              <polygon points="12 2 2 7 22 7 12 2" />
            </svg>
            <span>Finanças</span>
          </button>

          {/* Relatório médico / FEFO */}
          <button
            type="button"
            className="boardui-nav-btn"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span>Relatório médico</span>
          </button>

          {/* Chat com IA */}
          <button
            type="button"
            className="boardui-nav-btn"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Chat com IA</span>
          </button>

          {/* Geração de imagens com IA */}
          <button
            type="button"
            className="boardui-nav-btn"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>Geração de imagens com IA</span>
          </button>

          {/* Perfil */}
          <button
            type="button"
            className="boardui-nav-btn"
            onClick={onOperatorClick}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
            <span>Perfil</span>
          </button>
        </nav>

        {/* Espaçador Flexível */}
        <div className="boardui-sidebar-spacer" />

        {/* Rodapé da Sidebar BoardUI (Suporte, Configurações, Equipe BoardUI) */}
        <div className="boardui-sidebar-footer">
          <button
            type="button"
            className="boardui-nav-btn"
            onClick={handleStartCleaning}
            title="Limpar tela (bloqueia o toque por 15 segundos)"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
            </svg>
            <span>Suporte</span>
          </button>

          <button
            type="button"
            className="boardui-nav-btn"
            onClick={onOperatorClick}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Configurações</span>
          </button>

          {/* Equipe BoardUI Pill (Print 1) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 10px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              marginTop: '4px',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isWifiConnected ? '#22c55e' : '#ef4444',
                boxShadow: isWifiConnected ? '0 0 8px #22c55e' : 'none',
              }}
            />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#ededed' }}>
              Equipe BoardUI ({appName})
            </span>
          </div>
        </div>
      </aside>

      {/* 2. Conteúdo Principal BoardUI (Right Canvas) */}
      <main className="boardui-main-canvas">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {children}
        </div>

        {/* Barra Inferior Fixa (se aplicável para telas de fluxo) */}
        {bottomBar && (
          <footer className="ds-shell-bottom-bar" style={{ marginTop: 'auto', flexShrink: 0 }}>
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
      </main>

      {/* 3. Overlay de Modo Limpeza de Tela (15s Touch Lock) */}
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
