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

import {
  operadorRepository,
  osRepository,
  movimentacaoRepository,
  MOCK_OPERADORES,
  MOCK_ORDENS_SERVICO,
} from './data';
import { useConnectionStatus } from './hooks/useConnectionStatus';
import { recalcularVolumePorComponente } from './domain/mixture';

const INITIAL_PIECE_LOT: PieceLot = MOCK_ORDENS_SERVICO[0].pecaLote;

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
  const [operators, setOperators] = useState<Operator[]>(MOCK_OPERADORES);
  const [selectedOperator, setSelectedOperator] = useState<Operator>(MOCK_OPERADORES[0]);

  // Carregar operadores do repositório
  useEffect(() => {
    operadorRepository.listar().then((list) => {
      if (list.length > 0) {
        setOperators(list);
        setSelectedOperator(list[0]);
      }
    });
  }, []);

  // Dados da OS e Lote
  const [clientName, setClientName] = useState(MOCK_ORDENS_SERVICO[0].clienteNome);
  const [projectName, setProjectName] = useState(MOCK_ORDENS_SERVICO[0].projetoNome);
  const [selectedEnvironment, setSelectedEnvironment] = useState(MOCK_ORDENS_SERVICO[0].ambienteNome);
  const [pieceLot, setPieceLot] = useState<PieceLot>(INITIAL_PIECE_LOT);

  // Receita de Mistura
  const [recipe, setRecipe] = useState<RecipeState>(INITIAL_RECIPE);

  // Modais
  const [isCriticalModalOpen, setIsCriticalModalOpen] = useState(false);
  const [isUseFirstModalOpen, setIsUseFirstModalOpen] = useState(false);
  const [isCancelPrepModalOpen, setIsCancelPrepModalOpen] = useState(false);

  // Monitoramento de Rede Real via Hook
  const { isOnline, isServerLocal, isOffline } = useConnectionStatus();

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

  // Recalcular receita por excesso (+200ml catalisador -> 450ml / 0.25 = 1.800ml total)
  const handleRecalcularReceita = () => {
    const volCatalisadorComExcesso = (recipe.totalVolume * recipe.proportions.catalisador) + 200;
    const novoVolume = recalcularVolumePorComponente(volCatalisadorComExcesso, recipe.proportions.catalisador);
    handleSetTotalVolume(novoVolume || 1800);
    setIsCriticalModalOpen(false);
    showToast(`✓ Receita recalculada para ${(novoVolume || 1800).toLocaleString('pt-BR')} ml: proporções químicas re-balanceadas!`, 'success');
  };

  const handleRepesarDoZero = () => {
    setIsCriticalModalOpen(false);
    showToast('Medição descartada da balança. Balança re-tarada em zero.', 'info');
  };

  const handleConfirmDesperdicio = (reason: string) => {
    movimentacaoRepository.registrar({
      loteId: 2,
      tipo: 'DESCARTE',
      quantidade: 200,
      justificativa: reason,
      registradaEm: new Date().toISOString(),
    });
    setIsCriticalModalOpen(false);
    showToast(`🗑 Desperdício confirmado (${reason}) e registrado na OS (+200ml de catalisador).`, 'warn');
    setCurrentScreen('dashboard');
  };

  const handleConfirmWeighing = () => {
    movimentacaoRepository.registrar({
      loteId: 1,
      tipo: 'RETIRADA',
      quantidade: recipe.totalVolume,
      registradaEm: new Date().toISOString(),
    });
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
              name: selectedOperator.nome,
              avatarUrl: selectedOperator.avatar,
              role: selectedOperator.papel,
            }
          : undefined
      }
      isWifiConnected={isOnline}
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
          operators={operators}
          selectedOperator={selectedOperator}
          onSelectOperator={setSelectedOperator}
          onSuccessAuth={() => {
            showToast(`Bem-vindo(a), ${selectedOperator.nome}!`, 'success');
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
              prev.titulo.includes('Superiores')
                ? MOCK_ORDENS_SERVICO[1].pecaLote
                : MOCK_ORDENS_SERVICO[0].pecaLote
            );
            showToast('Lote de peças alternado.', 'info');
          }}
          onChangeOS={() => {
            osRepository.listar().then((ordens) => {
              const alternada = ordens.find(o => o.clienteNome !== clientName) || ordens[0];
              setClientName(alternada.clienteNome);
              setProjectName(alternada.projetoNome);
              showToast('Ordem de Serviço alternada.', 'info');
            });
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
