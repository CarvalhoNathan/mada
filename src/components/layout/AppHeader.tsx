import React, { useState, useEffect } from 'react';
import { ChevronsUpDown, Clock, Wifi, WifiOff, Sparkles, Sun, Moon, Download } from 'lucide-react';
import { OperatorInfo } from './types';
import { useTheme } from '../../hooks/useTheme';
import { usePwaInstall } from '../../hooks/usePwaInstall';

export interface AppHeaderProps {
  appName?: string;
  subTitle?: string;
  operator?: OperatorInfo;
  isWifiConnected?: boolean;
  isServerLocal?: boolean;
  onOperatorClick?: () => void;
  onOpenInstallModal: () => void;
  onStartCleaning: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * AppHeader - Cabeçalho Fixo Superior (58px)
 * Exibe identidade da marcenaria, relógio oficial em tempo real,
 * telemetria de conexão, atalhos de tema/PWA/limpeza e avatar do operador logado.
 */
export const AppHeader: React.FC<AppHeaderProps> = ({
  appName = 'Mada Marcenaria • Cabine de Pintura',
  subTitle = 'Terminal de Dosagem Homologada & Controle FEFO',
  operator,
  isWifiConnected = true,
  isServerLocal = true,
  onOperatorClick,
  onOpenInstallModal,
  onStartCleaning,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  const { isInstalled } = usePwaInstall();

  // Relógio Industrial em Tempo Real
  const [currentTime, setCurrentTime] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });
  const [currentDate, setCurrentDate] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', ''));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="boardui-top-header">
      {/* Marca / Estação */}
      <div className="boardui-header-brand">
        <div className="boardui-brand-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 2v7.31L4.14 20a2 2 0 0 0 1.72 3h12.28a2 2 0 0 0 1.72-3L14 9.31V2" />
            <path d="M8.5 2h7" />
            <path d="M7 16h10" />
          </svg>
        </div>
        <div className="boardui-brand-text">
          <h1 className="boardui-brand-name">{appName}</h1>
          {subTitle && <span className="boardui-brand-sub">{subTitle}</span>}
        </div>
      </div>

      {/* Lado Direito: Relógio | Status Conexão | PWA | Tema | Limpar Tela | Operador */}
      <div className="boardui-header-right">
        {/* Relógio Industrial em Tempo Real */}
        <div className="boardui-header-clock" title="Horário oficial da estação de pintura">
          <Clock size={15} strokeWidth={2.2} />
          <span>{currentTime} • {currentDate}</span>
        </div>

        {/* Status de Telemetria (Chip com Wi-Fi) */}
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

        {/* Botão Interativo: Instalar App (visível quando não está em modo standalone) */}
        {!isInstalled && (
          <button
            type="button"
            className="boardui-clean-btn boardui-install-btn"
            onClick={onOpenInstallModal}
            title="Adicionar à tela inicial"
            aria-label="Adicionar à tela inicial"
          >
            <Download size={15} strokeWidth={2.2} />
            <span>Instalar</span>
          </button>
        )}

        {/* Botão Interativo: Alternar Modo Claro / Escuro */}
        <button
          type="button"
          className="boardui-clean-btn boardui-theme-btn"
          onClick={toggleTheme}
          title={isLight ? 'Ativar modo escuro' : 'Ativar modo claro'}
          aria-label={isLight ? 'Ativar modo escuro' : 'Ativar modo claro'}
          aria-pressed={isLight}
        >
          {isLight ? <Moon size={16} strokeWidth={2.2} /> : <Sun size={16} strokeWidth={2.2} />}
        </button>

        {/* Botão Interativo: Limpeza de Tela */}
        <button
          type="button"
          className="boardui-clean-btn"
          onClick={onStartCleaning}
          title="Limpar tela (bloqueia o toque por 15 segundos)"
          aria-label="Limpar tela"
        >
          <Sparkles size={15} strokeWidth={2.2} />
          <span>Limpar tela</span>
        </button>

        {/* Botão Interativo: Operador Logado */}
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
  );
};
