import React, { useState, useEffect, useCallback } from 'react';
import { Operator, PieceLot, RecipeState, ScreenId, Lote, ItemSolicitacaoCompra } from './types';
import { AppShell } from './components/ui/AppShell';
import { StatusBanner } from './components/ui/StatusBanner';
import { Toast } from './components/ui/Toast';
import { QrScannerModal } from './components/ui/QrScannerModal';
import { PotLifeTimerBanner, PotLifeState } from './components/ui/PotLifeTimerBanner';

import { ScreenAuth } from './screens/ScreenAuth';
import { ScreenDashboard } from './screens/ScreenDashboard';
import { ScreenOS } from './screens/ScreenOS';
import { ScreenRecipe } from './screens/ScreenRecipe';
import { ScreenDosing } from './screens/ScreenDosing';
import { ScreenReturn } from './screens/ScreenReturn';
import { ScreenInventory } from './screens/ScreenInventory';

import { ModalUseFirst } from './screens/ModalUseFirst';
import { ModalCancelPrep } from './screens/ModalCancelPrep';

import {
  operadorRepository,
  osRepository,
  loteRepository,
  movimentacaoRepository,
  MOCK_OPERADORES,
  MOCK_ORDENS_SERVICO,
  MOCK_RECEITAS,
  MOCK_LOTES,
} from './data';
import { useConnectionStatus } from './hooks/useConnectionStatus';
import { ordenarLotesFEFO } from './domain/fefo';

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

  // Lotes persistidos
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Carregar operadores e lotes do repositório
  useEffect(() => {
    operadorRepository.listar().then((list) => {
      if (list.length > 0) {
        setOperators(list);
        setSelectedOperator(list[0]);
      }
    });

    loteRepository.listar().then((list) => {
      setLotes(list.length > 0 ? list : MOCK_LOTES);
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
  const [isUseFirstModalOpen, setIsUseFirstModalOpen] = useState(false);
  const [isCancelPrepModalOpen, setIsCancelPrepModalOpen] = useState(false);

  // Controle de Pot Life (Vida Útil da Mistura Catalisada - 20 minutos)
  const [potLife, setPotLife] = useState<PotLifeState | null>(() => {
    try {
      const saved = localStorage.getItem('mada_active_pot_life');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Se ainda não expirou há mais de 1 hora, mantém o timer visível
        if (Date.now() - parsed.startTime < 3600 * 1000) {
          return parsed;
        }
      }
    } catch {
      // Ignora erro de parsing
    }
    return null;
  });

  const handleFinishApplication = () => {
    setPotLife(null);
    localStorage.removeItem('mada_active_pot_life');
    showToast('✓ Aplicação do acabamento finalizada com sucesso dentro do prazo!', 'success');
  };

  const handleDiscardHardened = async () => {
    if (potLife) {
      await movimentacaoRepository.registrar({
        tipo: 'DESCARTE',
        loteId: 1,
        operadorId: selectedOperator.id,
        quantidade: potLife.volumeTotal,
        justificativa: `Descarte obrigatório por cura/endurecimento (>20 min pot life esgotado)`,
        registradaEm: new Date().toISOString(),
      });
      setPotLife(null);
      localStorage.removeItem('mada_active_pot_life');
      showToast(`Refugo químico de ${potLife.volumeTotal}ml registrado no tambor de descarte.`, 'warn');
    }
  };

  // Solicitações de Compras (Gestão de Insumos da Cabine)
  const [solicitacoesCompras, setSolicitacoesCompras] = useState<ItemSolicitacaoCompra[]>(() => {
    try {
      const saved = localStorage.getItem('mada_solicitacoes_compras');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignora erro
    }
    return [
      {
        id: 'sc-1',
        produtoId: 2,
        produtoNome: '2º Catalisador PU Médio',
        codigoProduto: '#SY-7410',
        quantidadeSugerida: '2 galões de 3,6L',
        motivo: 'estoque_critico',
        urgencia: 'alta',
        solicitadoEm: new Date().toISOString(),
        solicitadoPor: 'Carlos Silva',
      },
    ];
  });

  const handleAdicionarSolicitacao = (
    item: Omit<ItemSolicitacaoCompra, 'id' | 'solicitadoEm'>
  ) => {
    const nova: ItemSolicitacaoCompra = {
      ...item,
      id: `sc-${Date.now()}`,
      solicitadoEm: new Date().toISOString(),
    };
    setSolicitacoesCompras((prev) => {
      const atualizada = [nova, ...prev];
      localStorage.setItem('mada_solicitacoes_compras', JSON.stringify(atualizada));
      return atualizada;
    });
  };

  const handleRemoverSolicitacao = (id: string) => {
    setSolicitacoesCompras((prev) => {
      const filtrada = prev.filter((s) => s.id !== id);
      localStorage.setItem('mada_solicitacoes_compras', JSON.stringify(filtrada));
      return filtrada;
    });
    showToast('Item removido da lista de compras.', 'info');
  };
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
  }, [setToast]);

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

  // Scanner de QR Code Real / Atalho
  const handleOpenQR = () => {
    setIsQrModalOpen(true);
  };

  const handleQrScanSuccess = (code: string) => {
    if (code.startsWith('OS-') || code.includes('1084') || code.includes('1085')) {
      const foundOS = MOCK_ORDENS_SERVICO.find((o) =>
        code.includes(o.numero.replace('#', '')) || code.includes(o.numero)
      ) || MOCK_ORDENS_SERVICO[0];
      setClientName(foundOS.clienteNome);
      setProjectName(foundOS.projetoNome);
      setSelectedEnvironment(foundOS.ambienteNome);
      setPieceLot(foundOS.pecaLote);
      showToast(`✓ QR Code lido: ${foundOS.numero} (${foundOS.clienteNome})`, 'success');
      setCurrentScreen('recipe');
    } else if (code.includes('SOBRA') || code.startsWith('L-')) {
      showToast(`✓ Insumo químico identificado: ${code}. Lote priorizado!`, 'success');
      setCurrentScreen('recipe');
    } else {
      showToast(`✓ Código identificado: ${code}`, 'success');
      setCurrentScreen('recipe');
    }
  };

  const handleStartDosing = () => {
    setCurrentScreen('dosing');
  };

  const handleCompleteDosing = async (
    dosingValues: Record<number, number>,
    wasteJustification?: string
  ) => {
    const receita = MOCK_RECEITAS[0];
    const osAtiva = MOCK_ORDENS_SERVICO.find(o => o.clienteNome === clientName) || MOCK_ORDENS_SERVICO[0];

    // Registra uma Movimentacao do tipo RETIRADA por componente via MovimentacaoRepository
    // vinculada à OS e ao operador logado
    for (const item of receita.itens) {
      const quantidade = dosingValues[item.id] || 0;
      if (quantidade > 0) {
        const lotesOrdenados = ordenarLotesFEFO(lotes.filter(l => l.produtoId === item.produtoId));
        const loteId = lotesOrdenados[0]?.id || item.id;

        // Deduz quantidade do lote se existir
        if (lotesOrdenados[0]) {
          const novoSaldo = Math.max(0, lotesOrdenados[0].quantidadeAtual - quantidade);
          await loteRepository.atualizarQuantidade(lotesOrdenados[0].id, novoSaldo);
        }

        await movimentacaoRepository.registrar({
          tipo: 'RETIRADA',
          loteId,
          ordemServicoId: osAtiva.id,
          operadorId: selectedOperator.id,
          quantidade,
          justificativa: wasteJustification,
          registradaEm: new Date().toISOString(),
        });
      }
    }

    const lotesAtualizados = await loteRepository.listar();
    setLotes(lotesAtualizados);

    // Inicia o cronômetro estrito de 20 minutos (Pot Life)
    const newPotLife: PotLifeState = {
      startTime: Date.now(),
      durationSeconds: 20 * 60, // 20 minutos
      recipeName: receita.nome,
      osNumber: osAtiva.numero,
      volumeTotal: recipe.totalVolume,
    };
    setPotLife(newPotLife);
    localStorage.setItem('mada_active_pot_life', JSON.stringify(newPotLife));

    showToast('✓ Dosagem concluída! Cronômetro de 20 min (Pot Life) iniciado.', 'success');
    setCurrentScreen('return');
  };

  const handleSelectBatch = (batchCode: string) => {
    showToast(`✓ Lote prioritário ${batchCode} vinculado a esta ordem de serviço!`, 'success');
    setCurrentScreen('recipe');
  };

  return (
    <>
      <AppShell
        appName="Cabine de Pintura"
      currentScreen={currentScreen}
      onNavigate={(screen) => setCurrentScreen(screen)}
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
            description="Sem comunicação com o sistema. Salvamento de dados e dosagens bloqueados para evitar divergência de estoque."
          />
        </div>
      )}

      {/* Banner de Cronômetro de Vida Útil da Mistura (Pot Life - 20 min) */}
      {currentScreen !== 'auth' && potLife && (
        <PotLifeTimerBanner
          potLife={potLife}
          onFinishApplication={handleFinishApplication}
          onDiscardHardened={handleDiscardHardened}
        />
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
          onSimulateQR={handleOpenQR}
          lotes={lotes}
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
          onScanOS={handleOpenQR}
          onNavigate={(screen) => setCurrentScreen(screen)}
          onOpenCancelPrep={() => setIsCancelPrepModalOpen(true)}
        />
      )}

      {currentScreen === 'recipe' && (
        <ScreenRecipe
          recipe={recipe}
          onSetTotalVolume={handleSetTotalVolume}
          onAdjustVolume={handleAdjustVolume}
          onConfirmWeighing={handleStartDosing}
          onNavigate={(screen) => setCurrentScreen(screen)}
          onOpenCancelPrep={() => setIsCancelPrepModalOpen(true)}
        />
      )}

      {currentScreen === 'dosing' && (
        <ScreenDosing
          recipe={recipe}
          operator={selectedOperator}
          activeOS={MOCK_ORDENS_SERVICO.find(o => o.clienteNome === clientName) || MOCK_ORDENS_SERVICO[0]}
          onNavigate={(screen) => setCurrentScreen(screen)}
          onCompleteDosing={handleCompleteDosing}
          onOpenCancelPrep={() => setIsCancelPrepModalOpen(true)}
          showToast={showToast}
        />
      )}

      {currentScreen === 'return' && (
        <ScreenReturn
          operator={selectedOperator}
          onNavigate={(screen) => setCurrentScreen(screen)}
          showToast={showToast}
          onConfirmReturn={async (dados) => {
            // 1. Registra movimentação do tipo DEVOLUCAO
            await movimentacaoRepository.registrar({
              tipo: 'DEVOLUCAO',
              loteId: 1,
              operadorId: selectedOperator.id,
              quantidade: dados.volume,
              justificativa: `Devolução formal ao estoque: ${dados.volume}ml`,
              registradaEm: new Date().toISOString(),
            });

            // 2. Adiciona o lote de sobra ao estoque
            const dataValidade = new Date();
            dataValidade.setDate(dataValidade.getDate() + 30);
            const validadeStr = dataValidade.toISOString().split('T')[0];

            await loteRepository.adicionarSobra({
              produtoId: dados.produtoId,
              produtoNome: `${dados.produtoNome} (Sobra)`,
              codigo: dados.loteGeradoCodigo,
              validade: validadeStr,
              diasAberto: 1,
              quantidadeAtual: dados.volume,
              statusUrgencia: 'alta',
              prateleira: 'A-01 (Prateleira de Sobras)',
            });

            const lotesAtualizados = await loteRepository.listar();
            setLotes(lotesAtualizados);
          }}
          onDiscardWaste={async (volume) => {
            await movimentacaoRepository.registrar({
              tipo: 'DESCARTE',
              loteId: 1,
              operadorId: selectedOperator.id,
              quantidade: volume,
              justificativa: `Descarte de refugo químico (${volume}ml)`,
              registradaEm: new Date().toISOString(),
            });
          }}
        />
      )}

      {currentScreen === 'inventory' && (
        <ScreenInventory
          lotes={lotes}
          operator={selectedOperator}
          onNavigate={(screen) => setCurrentScreen(screen)}
          showToast={showToast}
          solicitacoes={solicitacoesCompras}
          onAdicionarSolicitacao={handleAdicionarSolicitacao}
          onRemoverSolicitacao={handleRemoverSolicitacao}
        />
      )}

      {/* Modal de Latas que vencem primeiro ("Use Primeiro") */}
      <ModalUseFirst
        isOpen={isUseFirstModalOpen}
        onClose={() => setIsUseFirstModalOpen(false)}
        onSelectBatch={handleSelectBatch}
        lotes={lotes}
      />

      {/* Modal Scanner Real de QR Code (WebRTC / Câmera) */}
      <QrScannerModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onScanSuccess={handleQrScanSuccess}
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

      </AppShell>

      {/* Toast Notificações no topo da raiz da aplicação */}
      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          type={toast.type}
          duration={3500}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default App;
