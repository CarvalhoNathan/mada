import React, { useState, useEffect, useCallback } from 'react';
import { Operator, PieceLot, RecipeState, ScreenId } from './types';
import { AppShell } from './components/ui/AppShell';
import { StatusBanner } from './components/ui/StatusBanner';
import { Toast } from './components/ui/Toast';

import { ScreenAuth } from './screens/ScreenAuth';
import { ScreenDashboard } from './screens/ScreenDashboard';
import { ScreenOS } from './screens/ScreenOS';
import { ScreenRecipe } from './screens/ScreenRecipe';
import { ScreenReturn } from './screens/ScreenReturn';

import { ModalCriticalExcess } from './screens/ModalCriticalExcess';
import { ModalUseFirst } from './screens/ModalUseFirst';
import { ModalCancelPrep } from './screens/ModalCancelPrep';

const OPERATORS: Operator[] = [
  {
    name: 'Carlos Silva',
    role: 'Pintor Líder • Cabine 01',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=faces',
  },
  {
    name: 'Ana Souza',
    role: 'Aplicadora PU • Cabine 02',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces',
  },
  {
    name: 'Marcos Lima',
    role: 'Auxiliar de Cabine',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=faces',
  },
];

const INITIAL_PIECE_LOT: PieceLot = {
  title: 'Armários Superiores - Portas 18mm',
  qty: '12 frentes (42 m²)',
  substrate: 'MDF Cru 18mm Berneck',
  area: '42 m²',
  estVolume: '1.050 ml',
};

const INITIAL_RECIPE: RecipeState = {
  totalVolume: 1000,
  proportions: {
    base: 0.50,
    catalisador: 0.25,
    diluidor: 0.20,
    retardador: 0.05,
  },
  densities: {
    base: 1.10,
    catalisador: 0.98,
    diluidor: 0.88,
    retardador: 0.92,
  },
};

export const App: React.FC = () => {
  // Estado de navegação e usuário
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('auth');
  const [selectedOperator, setSelectedOperator] = useState<Operator>(OPERATORS[0]);

  // Dados da OS e Lote
  const [clientName, setClientName] = useState('Residência Fontana • Bloco A');
  const [projectName, setProjectName] = useState('Apartamento 402 • Projeto Executivo Arq. Daniela');
  const [selectedEnvironment, setSelectedEnvironment] = useState('Cozinha Gourmet');
  const [pieceLot, setPieceLot] = useState<PieceLot>(INITIAL_PIECE_LOT);

  // Receita de Mistura
  const [recipe, setRecipe] = useState<RecipeState>(INITIAL_RECIPE);

  // Modais
  const [isCriticalModalOpen, setIsCriticalModalOpen] = useState(false);
  const [isUseFirstModalOpen, setIsUseFirstModalOpen] = useState(false);
  const [isCancelPrepModalOpen, setIsCancelPrepModalOpen] = useState(false);

  // Status de Rede Real (Wi-Fi e Servidor Local)
  const [isWifiConnected, setIsWifiConnected] = useState(navigator.onLine);
  const [isServerLocal, setIsServerLocal] = useState(true);

  // Toast
  const [toast, setToast] = useState<{
    message: string;
    type: 'info' | 'ok' | 'warn' | 'danger';
    key: number;
  } | null>(null);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'warn' | 'danger' = 'info') => {
    const mappedType: 'info' | 'ok' | 'warn' | 'danger' = type === 'success' ? 'ok' : type;
    setToast({ message, type: mappedType, key: Date.now() });
  }, []);

  // Monitoramento de Rede Real
  useEffect(() => {
    const handleOnline = () => {
      setIsWifiConnected(true);
      showToast('Conexão Wi-Fi restabelecida.', 'success');
    };

    const handleOffline = () => {
      setIsWifiConnected(false);
      showToast('Conexão com a rede perdida!', 'danger');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Heartbeat leve para testar conectividade com o servidor local
    const checkServerHealth = async () => {
      if (!navigator.onLine) {
        setIsServerLocal(false);
        return;
      }
      try {
        const res = await fetch(`/?ping=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
        setIsServerLocal(res.ok || res.type === 'opaque');
      } catch {
        setIsServerLocal(false);
      }
    };

    const interval = setInterval(checkServerHealth, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [showToast]);

  const isOffline = !isWifiConnected || !isServerLocal;

  // Ações de Receita
  const handleSetTotalVolume = (vol: number) => {
    setRecipe(prev => ({ ...prev, totalVolume: vol }));
  };

  const handleAdjustVolume = (delta: number) => {
    setRecipe(prev => ({
      ...prev,
      totalVolume: Math.max(100, Math.min(5000, prev.totalVolume + delta)),
    }));
  };

  // Simular QR Scan
  const handleSimulateQR = () => {
    showToast('📷 Câmera do tablet ativa: Lendo QR Code...', 'info');
    setTimeout(() => {
      showToast('✓ Verniz PU Sayersystem Lote #SY-8821 identificado (Saldo: 400ml)', 'success');
      setCurrentScreen('recipe');
    }, 800);
  };

  // Recalcular receita por excesso (+200ml catalisador -> 1800ml total)
  const handleRecalcularReceita = () => {
    handleSetTotalVolume(1800);
    setIsCriticalModalOpen(false);
    showToast('✓ Receita recalculada para 1.800 ml: proporções químicas re-balanceadas!', 'success');
  };

  const handleRepesarDoZero = () => {
    setIsCriticalModalOpen(false);
    showToast('Medição descartada da balança. Balança re-tarada em zero.', 'info');
  };

  const handleConfirmDesperdicio = (reason: string) => {
    setIsCriticalModalOpen(false);
    showToast(`🗑 Desperdício confirmado (${reason}) e registrado na OS (+200ml de catalisador).`, 'warn');
    setCurrentScreen('dashboard');
  };

  const handleConfirmWeighing = () => {
    showToast('✓ Mistura concluída e baixa realizada no estoque com sucesso!', 'success');
    setCurrentScreen('dashboard');
  };

  const handleSelectBatch = (batchCode: string) => {
    showToast(`✓ Lote prioritário ${batchCode} vinculado a esta ordem de serviço!`, 'success');
    setCurrentScreen('recipe');
  };

  return (
    <AppShell
      appName="Gerenciador de Químicos"
      subTitle="MADA MARCENARIA • SETOR DE PINTURA"
      operator={
        currentScreen !== 'auth'
          ? {
              name: selectedOperator.name,
              avatarUrl: selectedOperator.avatar,
              role: selectedOperator.role,
            }
          : undefined
      }
      isWifiConnected={isWifiConnected}
      isServerLocal={isServerLocal}
      onOperatorClick={() => {
        if (currentScreen !== 'auth') {
          setCurrentScreen('auth');
          showToast('Sessão encerrada. Selecione o operador.', 'info');
        }
      }}
    >
      {/* Banner de Estado Offline Crítico */}
      {isOffline && (
        <div style={{ marginBottom: '12px' }}>
          <StatusBanner
            variant="danger"
            title="SISTEMA OFFLINE"
            description="Sem comunicação com o servidor local. Salvamento de dados e pesagens bloqueados para evitar divergência de estoque."
          />
        </div>
      )}

      {/* Roteamento de Telas */}
      {currentScreen === 'auth' && (
        <ScreenAuth
          operators={OPERATORS}
          selectedOperator={selectedOperator}
          onSelectOperator={setSelectedOperator}
          onSuccessAuth={() => {
            showToast(`Bem-vindo(a), ${selectedOperator.name}!`, 'success');
            setCurrentScreen('dashboard');
          }}
          isOffline={isOffline}
          showToast={showToast}
        />
      )}

      {currentScreen === 'dashboard' && (
        <ScreenDashboard
          operator={selectedOperator}
          onNavigate={(screen) => setCurrentScreen(screen)}
          onOpenUseFirstModal={() => setIsUseFirstModalOpen(true)}
          onSimulateQR={handleSimulateQR}
        />
      )}

      {currentScreen === 'os' && (
        <ScreenOS
          selectedOS="OS #8841"
          clientName={clientName}
          projectName={projectName}
          selectedEnvironment={selectedEnvironment}
          onSelectEnvironment={setSelectedEnvironment}
          pieceLot={pieceLot}
          onChangePieceLot={() => {
            setPieceLot(prev =>
              prev.title.includes('Superiores')
                ? {
                    title: 'Bancada Ilha Gourmet - Painéis Ripados',
                    qty: '6 painéis (28 m²)',
                    substrate: 'MDF Cru 25mm Berneck',
                    area: '28 m²',
                    estVolume: '700 ml',
                  }
                : INITIAL_PIECE_LOT
            );
            showToast('Lote de peças alternado.', 'info');
          }}
          onChangeOS={() => {
            setClientName(prev =>
              prev.includes('Fontana') ? 'Edifício Horizon • Cobertura 1201' : 'Residência Fontana • Bloco A'
            );
            setProjectName(prev =>
              prev.includes('Fontana') ? 'Living Integrado • Arq. Roberto Silveira' : 'Apartamento 402 • Projeto Executivo Arq. Daniela'
            );
            showToast('Ordem de Serviço alternada.', 'info');
          }}
          onScanOS={handleSimulateQR}
          onNavigate={(screen) => setCurrentScreen(screen)}
          onOpenCancelPrep={() => setIsCancelPrepModalOpen(true)}
        />
      )}

      {currentScreen === 'recipe' && (
        <ScreenRecipe
          recipe={recipe}
          onSetTotalVolume={handleSetTotalVolume}
          onAdjustVolume={handleAdjustVolume}
          onOpenCriticalModal={() => setIsCriticalModalOpen(true)}
          onConfirmWeighing={handleConfirmWeighing}
          onNavigate={(screen) => setCurrentScreen(screen)}
          onOpenCancelPrep={() => setIsCancelPrepModalOpen(true)}
        />
      )}

      {currentScreen === 'return' && (
        <ScreenReturn
          operator={selectedOperator}
          onNavigate={(screen) => setCurrentScreen(screen)}
          showToast={showToast}
        />
      )}

      {/* Modal Crítico de Excesso (+200ml) */}
      <ModalCriticalExcess
        isOpen={isCriticalModalOpen}
        onClose={() => setIsCriticalModalOpen(false)}
        onRepesarDoZero={handleRepesarDoZero}
        onRecalcularReceita={handleRecalcularReceita}
        onConfirmDesperdicio={handleConfirmDesperdicio}
      />

      {/* Modal de Latas que vencem primeiro ("Use Primeiro") */}
      <ModalUseFirst
        isOpen={isUseFirstModalOpen}
        onClose={() => setIsUseFirstModalOpen(false)}
        onSelectBatch={handleSelectBatch}
      />

      {/* Modal de Cancelar Preparação */}
      <ModalCancelPrep
        isOpen={isCancelPrepModalOpen}
        onClose={() => setIsCancelPrepModalOpen(false)}
        onConfirmCancel={() => {
          setIsCancelPrepModalOpen(false);
          setCurrentScreen('dashboard');
          showToast('Preparação cancelada.', 'info');
        }}
      />

      {/* Toast Notificações */}
      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          type={toast.type}
          duration={3500}
          onClose={() => setToast(null)}
        />
      )}
    </AppShell>
  );
};

export default App;
