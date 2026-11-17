import React, { useState, useEffect } from 'react';
import { AppShellProps } from './types';
import { AppHeader } from './AppHeader';
import { AppBottomBar } from './AppBottomBar';
import { ScreenCleanOverlay } from './ScreenCleanOverlay';
import { ModalPwaInstall } from '../modals/ModalPwaInstall';

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
  const [isCleaning, setIsCleaning] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const handleStartCleaning = () => {
    setCountdown(15);
    setIsCleaning(true);
  };

  useEffect(() => {
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
      {/* 1. Cabeçalho Superior Fixo (58px) */}
      <AppHeader
        appName={appName}
        subTitle={subTitle}
        operator={operator}
        isWifiConnected={isWifiConnected}
        isServerLocal={isServerLocal}
        onOperatorClick={onOperatorClick}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onStartCleaning={handleStartCleaning}
      />

      {/* 2. Área Central de Conteúdo (Sem rolagem em 1280x800) */}
      <main className="boardui-content-canvas">
        <div className="boardui-content-inner">
          {children}
        </div>
      </main>

      {/* 3. Barra Inferior Fixa (Ações das telas de fluxo) */}
      {bottomBar && (
        <AppBottomBar
          onBack={bottomBar.onBack}
          backLabel={bottomBar.backLabel}
          onPrimary={bottomBar.onPrimary}
          primaryLabel={bottomBar.primaryLabel}
          isPrimaryDisabled={bottomBar.isPrimaryDisabled}
        />
      )}

      {/* 4. Overlay de Modo Limpeza de Tela (15s Touch Lock) */}
      {isCleaning && (
        <ScreenCleanOverlay
          countdown={countdown}
          onCancel={() => setIsCleaning(false)}
        />
      )}

      {/* 5. Modal de Instalação PWA */}
      <ModalPwaInstall
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
};
