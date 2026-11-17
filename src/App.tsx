import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import gsap from 'gsap';
import {
  Operator,
  RecipeState,
  ScreenId,
  Lote,
  Receita,
  Produto,
} from './types';
import { AppShell } from './components/ui/AppShell';
import { StatusBanner } from './components/ui/StatusBanner';
import { Toast } from './components/ui/Toast';
import { PotLifeTimerBanner } from './components/ui/PotLifeTimerBanner';
import { PrepStepperBar } from './components/ui/PrepStepperBar';

import { ScreenAuth } from './screens/ScreenAuth';
import { ScreenDashboard } from './screens/ScreenDashboard';

const ScreenOS = lazy(() =>
  import('./screens/ScreenOS').then((m) => ({ default: m.ScreenOS }))
);
const ScreenRecipe = lazy(() =>
  import('./screens/ScreenRecipe').then((m) => ({ default: m.ScreenRecipe }))
);
const ScreenDosing = lazy(() =>
  import('./screens/ScreenDosing').then((m) => ({ default: m.ScreenDosing }))
);
const ScreenReturn = lazy(() =>
  import('./screens/ScreenReturn').then((m) => ({ default: m.ScreenReturn }))
);
const ScreenInventory = lazy(() =>
  import('./screens/ScreenInventory').then((m) => ({ default: m.ScreenInventory }))
);
const ScreenManager = lazy(() =>
  import('./screens/ScreenManager').then((m) => ({ default: m.ScreenManager }))
);
const QrScannerModal = lazy(() =>
  import('./components/modals/QrScannerModal').then((m) => ({ default: m.QrScannerModal }))
);

import {
  ModalUseFirst,
  ModalCancelPrep,
  ModalQrPackageResult,
  ModalOcorrenciaMistura,
} from './components/modals';

import {
  operadorRepository,
  osRepository,
  loteRepository,
  movimentacaoRepository,
  preparacaoRepository,
  residuoMisturaRepository,
  MOCK_OPERADORES,
  MOCK_ORDENS_SERVICO,
  MOCK_RECEITAS,
  MOCK_LOTES,
  MOCK_PRODUTOS,
} from './data';
import {
  useConnectionStatus,
  usePurchasesRequests,
  usePotLifeTimer,
  useOrderSelection,
  usePreparationWorkflow,
} from './hooks';
import { temItensPendentesDevolucao } from './domain/returnFlow';
import {
  verificarBloqueioNovaPreparacaoCabine,
  verificarPermissaoDevolucaoDuranteAplicacao,
} from './domain/operationalLocks';
import { classificarQrCode } from './domain/qrIdentification';

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
  const prevScreenRef = useRef<ScreenId>('auth');
  const screenStageRef = useRef<HTMLDivElement>(null);
  const [operators, setOperators] = useState<Operator[]>(MOCK_OPERADORES);
  const [selectedOperator, setSelectedOperator] = useState<Operator>(MOCK_OPERADORES[0]);

  // Transição calma e coreografada
  useEffect(() => {
    const prev = prevScreenRef.current;
    prevScreenRef.current = currentScreen;
    if (prev === currentScreen) return;

    const stage = screenStageRef.current;
    if (!stage) return;

    const cards = stage.querySelectorAll(
      '.boardui-card, .os-card-surface, .recipe-header-card, .recipe-volume-strip, .recipe-chem-card, .dosing-card, .ds-kpi-card'
    );
    if (cards.length > 0) {
      gsap.killTweensOf(cards);
      gsap.fromTo(
        cards,
        { y: 12, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.45,
          stagger: 0.045,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        }
      );
    }
  }, [currentScreen]);

  // Modais de Diálogo / Status
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isOccurrenceModalOpen, setIsOccurrenceModalOpen] = useState(false);
  const [isUseFirstModalOpen, setIsUseFirstModalOpen] = useState(false);
  const [isCancelPrepModalOpen, setIsCancelPrepModalOpen] = useState(false);
  const [isShiftSummaryModalOpen, setIsShiftSummaryModalOpen] = useState(false);
  const [preConfirmedRecipe, setPreConfirmedRecipe] = useState(false);
  const [qrPackageModalData, setQrPackageModalData] = useState<{
    codigoLido: string;
    lote?: Lote;
    produto?: Produto;
  } | null>(null);

  // Carregar operadores iniciais do repositório
  useEffect(() => {
    operadorRepository.listar().then((list) => {
      if (list.length > 0) {
        setOperators(list);
        setSelectedOperator(list[0]);
      }
    });
  }, []);

  // Toast
  const [toast, setToast] = useState<{
    message: string;
    type: 'info' | 'ok' | 'warn' | 'danger';
    key: number;
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: 'info' | 'success' | 'warn' | 'danger' = 'info') => {
      const mappedType: 'info' | 'ok' | 'warn' | 'danger' = type === 'success' ? 'ok' : type;
      setToast({ message, type: mappedType, key: Date.now() });
    },
    []
  );

  // Receita de Mistura Homologada (Dinâmica)
  const [selectedRecipe, setSelectedRecipe] = useState<Receita>(MOCK_RECEITAS[0]);
  const [recipe, setRecipe] = useState<RecipeState>(INITIAL_RECIPE);
  const [isRecipeConfirmed, setIsRecipeConfirmed] = useState(false);

  // Dados da OS e Lote gerenciados via hook especializado
  const {
    selectedOSNumber,
    clientName,
    projectName,
    selectedEnvironment,
    pieceLot,
    isOSConfirmed,
    handleConfirmCurrentOS,
    handleResetOSConfirmation,
    setSelectedEnvironment,
    handleSelectPieceLot,
    handleSelectOS,
  } = useOrderSelection({ setRecipe, showToast });

  // Gestão e reposição de Solicitações de Compras
  const {
    solicitacoesCompras,
    handleAdicionarSolicitacao,
    handleRemoverSolicitacao,
    verificarReposicaoAutomaticaEstoque,
  } = usePurchasesRequests(selectedOperator.nome, showToast);

  // Workflow Completo de Preparações, Dosagens e Devoluções
  const {
    lotes,
    movimentacoes,
    preparacoes,
    residuosMistura,
    preparacoesPendentes,
    preparacoesEmConferencia,
    preparacoesHistorico,
    cabineOperador,
    preparacaoAtivaCabine,
    activePreparacao,
    setLotes,
    setMovimentacoes,
    setPreparacoes,
    setResiduosMistura,
    setActivePreparacaoId,
    handleRegisterMixtureOccurrence,
    handleCompleteDosing,
    handleRegisterItemReturn,
    handleMarkStickerPrinted,
    handleFinishPreparacao,
  } = usePreparationWorkflow({
    selectedOperator,
    selectedOSNumber,
    clientName,
    selectedRecipe,
    recipeTotalVolume: recipe.totalVolume,
    showToast,
    onNavigate: (s) => setCurrentScreen(s),
    verificarReposicaoAutomaticaEstoque,
  });

  // Controle de Pot Life e Procedimentos homologados
  const {
    potLife,
    procedimentosPotLife,
    handleSaveProcedimentoPotLife,
    handlePotLifeExpired,
    handleFinishApplication,
  } = usePotLifeTimer({
    preparacaoAtivaCabine,
    preparacoes,
    setPreparacoes,
    cabineNome: cabineOperador.cabineNome,
    showToast,
  });

  // Navegação protegida pelos bloqueios inteligentes de cabine/equipamento
  const handleNavigate = useCallback(
    (targetScreen: ScreenId) => {
      setIsOccurrenceModalOpen(false);
      if (targetScreen !== 'recipe') {
        setPreConfirmedRecipe(false);
      }

      // Ao voltar ao Dashboard, limpa o ID de preparação em foco caso ela já esteja concluída
      if (targetScreen === 'dashboard') {
        setActivePreparacaoId((prevId) => {
          if (!prevId) return null;
          const prep = preparacoes.find((p) => p.id === prevId);
          return prep && temItensPendentesDevolucao(prep) ? prevId : null;
        });
      }

      // Ao iniciar fluxo de nova preparação vindo do dashboard, reinicia travas para exigir confirmação
      if (currentScreen === 'dashboard' && targetScreen === 'os') {
        handleResetOSConfirmation();
        setIsRecipeConfirmed(false);
      }

      // Bloqueio inteligente: impede iniciar nova preparação na mesma cabine enquanto houver aplicação ativa
      if (targetScreen === 'os' || targetScreen === 'recipe' || targetScreen === 'dosing') {
        const verificacao = verificarBloqueioNovaPreparacaoCabine(
          preparacoes,
          cabineOperador.cabineId,
          cabineOperador.cabineNome
        );
        if (!verificacao.permitido) {
          showToast(
            verificacao.motivoBloqueio ||
              'Existe uma aplicação em andamento nesta cabine. Conclua a aplicação antes de iniciar outra preparação.',
            'warn'
          );
          return;
        }
      }

      // Trava Etapa 1: impede avançar para 'recipe' sem antes selecionar/confirmar a Ordem de Serviço
      if (targetScreen === 'recipe' && !isOSConfirmed) {
        showToast(
          'Passo obrigatório: Selecione ou confirme uma Ordem de Serviço antes de avançar para a receita.',
          'warn'
        );
        return;
      }

      // Trava Etapa 2: impede pular para 'dosing' sem antes confirmar a O.S. e escolher a receita
      if (targetScreen === 'dosing') {
        if (!isOSConfirmed) {
          showToast(
            'Passo obrigatório: Selecione uma Ordem de Serviço na Etapa 1 antes de avançar para a dosagem.',
            'warn'
          );
          return;
        }
        if (!isRecipeConfirmed) {
          showToast(
            'Passo obrigatório: Escolha com qual produto/receita você vai preparar antes de avançar para a dosagem.',
            'warn'
          );
          return;
        }
      }

      setCurrentScreen(targetScreen);
    },
    [
      preparacoes,
      cabineOperador,
      showToast,
      setActivePreparacaoId,
      currentScreen,
      isOSConfirmed,
      isRecipeConfirmed,
      handleResetOSConfirmation,
    ]
  );

  const { isOnline, isServerLocal, isOffline } = useConnectionStatus();

  // Ações de Receita
  const handleSetTotalVolume = (vol: number) => {
    setRecipe((prev) => ({ ...prev, totalVolume: vol }));
  };

  const handleAdjustVolume = (delta: number) => {
    setRecipe((prev) => ({
      ...prev,
      totalVolume: Math.max(100, Math.min(5000, prev.totalVolume + delta)),
    }));
  };

  // Scanner de QR Code Real / Atalho (Permite consultas que não interferem na operação ativa)
  const handleOpenQR = () => {
    setIsQrModalOpen(true);
  };

  const handleQrScanSuccess = (code: string) => {
    const resultado = classificarQrCode(
      code,
      MOCK_ORDENS_SERVICO,
      lotes.length > 0 ? lotes : MOCK_LOTES,
      MOCK_PRODUTOS
    );

    if (resultado.tipo === 'ORDEM_SERVICO' && resultado.ordemServico) {
      const verificacao = verificarBloqueioNovaPreparacaoCabine(
        preparacoes,
        cabineOperador.cabineId,
        cabineOperador.cabineNome
      );
      if (!verificacao.permitido) {
        showToast(
          `Consulta OS ${resultado.ordemServico.numero}: ${resultado.ordemServico.clienteNome} (${resultado.ordemServico.ambienteNome}). Nova preparação aguardando liberação da ${cabineOperador.cabineNome}.`,
          'info'
        );
        return;
      }
      handleSelectOS(resultado.ordemServico);
      showToast(`✓ ${resultado.mensagemResumo}`, 'success');
      setCurrentScreen('os');
      return;
    }

    if (resultado.tipo === 'EMBALAGEM_LOTE') {
      showToast(`✓ ${resultado.mensagemResumo}`, 'success');
      setQrPackageModalData({
        codigoLido: code,
        lote: resultado.lote,
        produto: resultado.produto,
      });
      return;
    }

    showToast(`✓ ${resultado.mensagemResumo}`, 'info');
  };

  const handleStartDosing = () => {
    setCurrentScreen('dosing');
  };

  const handleSelectBatch = (batchCode: string) => {
    const verificacao = verificarBloqueioNovaPreparacaoCabine(
      preparacoes,
      cabineOperador.cabineId,
      cabineOperador.cabineNome
    );
    if (!verificacao.permitido) {
      showToast(
        verificacao.motivoBloqueio ||
          'Conclua a aplicação ativa nesta cabine antes de iniciar nova preparação.',
        'warn'
      );
      return;
    }

    const loteSelecionado = lotes.find((l) => l.codigo === batchCode);
    const nomeLower = (loteSelecionado?.produtoNome || '').toLowerCase();

    let receitaVinculada = MOCK_RECEITAS[0];
    if (batchCode.includes('8821') || nomeLower.includes('verniz')) {
      receitaVinculada = MOCK_RECEITAS[1] || MOCK_RECEITAS[0];
    } else if (batchCode.includes('2703') || nomeLower.includes('primer')) {
      receitaVinculada = MOCK_RECEITAS[2] || MOCK_RECEITAS[0];
    } else if (loteSelecionado) {
      const porProduto = MOCK_RECEITAS.find((r) =>
        r.itens.some((it) => it.produtoId === loteSelecionado.produtoId)
      );
      if (porProduto) receitaVinculada = porProduto;
    }

    // Seleciona automaticamente uma O.S. cujo acabamento sugerido seja compatível com a receita do lote prioritário
    const recLower = receitaVinculada.nome.toLowerCase();
    const osCompativel =
      MOCK_ORDENS_SERVICO.find((o) => {
        const acabLower = (o.pecaLote.acabamentoSugerido || '').toLowerCase();
        if (recLower.includes('verniz')) return acabLower.includes('verniz');
        if (recLower.includes('primer')) return acabLower.includes('primer');
        return acabLower.includes('laca');
      }) || MOCK_ORDENS_SERVICO[0];

    handleSelectOS(osCompativel);
    setSelectedRecipe(receitaVinculada);
    setPreConfirmedRecipe(true);
    setIsRecipeConfirmed(true);
    showToast(
      `✓ Lote prioritário ${batchCode} vinculado à ${osCompativel.numero} (${receitaVinculada.nome})!`,
      'success'
    );
    setCurrentScreen('recipe');
  };

  const preparacaoAlvoModalOcorrencia =
    preparacaoAtivaCabine ||
    (potLife?.preparacaoId ? preparacoes.find((p) => p.id === potLife.preparacaoId) : null) ||
    activePreparacao ||
    preparacoes[0] ||
    null;

  return (
    <>
      <AppShell
        appName="Mada Marcenaria • Cabine de Pintura"
        subTitle="Terminal de Dosagem Homologada & Controle FEFO"
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        operator={
          currentScreen !== 'auth'
            ? currentScreen === 'manager' || currentScreen === 'inventory'
              ? {
                  name: 'Fábio (Gestor)',
                  role: 'Supervisor de Cabine',
                }
              : {
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
            setIsShiftSummaryModalOpen(true);
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

        {/* Banner de Cronômetro de Vida Útil da Mistura (Pot Life persistente via timestamp absoluto) */}
        {currentScreen !== 'auth' &&
          currentScreen !== 'manager' &&
          currentScreen !== 'inventory' &&
          potLife && (
            <PotLifeTimerBanner
              potLife={potLife}
              onFinishApplication={handleFinishApplication}
              onOpenOccurrenceModal={() => setIsOccurrenceModalOpen(true)}
              onPotLifeExpired={handlePotLifeExpired}
            />
          )}

        {/* Stepper Persistente nas 3 etapas da Cabine */}
        {(currentScreen === 'os' || currentScreen === 'recipe' || currentScreen === 'dosing') && (
          <PrepStepperBar
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            isOSConfirmed={isOSConfirmed}
            isRecipeConfirmed={isRecipeConfirmed}
            onBlockedStepClick={(_stepId, reason) => showToast(reason, 'warn')}
          />
        )}

        {/* Roteamento de Telas com Transição Coreografada GSAP */}
        <div
          ref={screenStageRef}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
          }}
        >
          {currentScreen === 'auth' && (
            <ScreenAuth
              operators={operators}
              selectedOperator={selectedOperator}
              onSelectOperator={setSelectedOperator}
              onSuccessAuth={() => {
                showToast(`Bem-vindo(a), ${selectedOperator.nome}!`, 'success');
                setCurrentScreen('dashboard');
              }}
              onNavigateToManager={() => {
                showToast('Acesso de Gestor (Fábio) liberado!', 'success');
                setCurrentScreen('manager');
              }}
              isOffline={isOffline}
              showToast={showToast}
              lotes={lotes}
              preparacoes={preparacoes}
            />
          )}

          {currentScreen === 'dashboard' && (
            <ScreenDashboard
              operator={selectedOperator}
              onNavigate={handleNavigate}
              onOpenUseFirstModal={() => setIsUseFirstModalOpen(true)}
              onSimulateQR={handleOpenQR}
              lotes={lotes}
              preparacoesPendentes={preparacoesPendentes}
              preparacoesEmConferencia={preparacoesEmConferencia}
              preparacaoAtivaCabine={preparacaoAtivaCabine}
              onResumePreparacao={(prep) => {
                const permissao = verificarPermissaoDevolucaoDuranteAplicacao(
                  preparacoes,
                  cabineOperador.cabineId,
                  prep.id,
                  cabineOperador.cabineNome
                );
                if (!permissao.permitido) {
                  showToast(
                    permissao.motivoBloqueio ||
                      'Conclua a aplicação ativa nesta cabine antes de iniciar devoluções de outra preparação.',
                    'warn'
                  );
                  return;
                }
                setActivePreparacaoId(prep.id);
                setCurrentScreen('return');
                showToast(
                  `Retomando devolução de ${prep.ordemServicoNumero} (${prep.ambienteNome})...`,
                  'info'
                );
              }}
            />
          )}

          <Suspense
            fallback={
              <div
                className="screen-content-area"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '400px',
                  color: 'var(--text-muted)',
                  fontSize: '18px',
                }}
              >
                Carregando módulo...
              </div>
            }
          >
            {currentScreen === 'os' && (
              <ScreenOS
                selectedOS={selectedOSNumber}
                clientName={clientName}
                projectName={projectName}
                selectedEnvironment={selectedEnvironment}
                onSelectEnvironment={setSelectedEnvironment}
                pieceLot={pieceLot}
                onSelectPieceLot={handleSelectPieceLot}
                onChangePieceLot={() => {
                  const activeOSObj =
                    MOCK_ORDENS_SERVICO.find((o) => o.numero === selectedOSNumber) ||
                    MOCK_ORDENS_SERVICO[0];
                  const amb =
                    activeOSObj.ambientesObra?.find((a) => a.nome === selectedEnvironment) ||
                    activeOSObj.ambientesObra?.[0];
                  const lotesAmb = amb?.lotesPecas || [activeOSObj.pecaLote];
                  if (lotesAmb.length > 1) {
                    const idx = lotesAmb.findIndex(
                      (l) => (l.titulo || l.title) === (pieceLot.titulo || pieceLot.title)
                    );
                    const nextLot = lotesAmb[(idx + 1) % lotesAmb.length];
                    handleSelectPieceLot(nextLot, amb?.nome || selectedEnvironment);
                  }
                }}
                onChangeOS={() => {
                  osRepository.listar().then((ordens) => {
                    const currentIdx = ordens.findIndex((o) => o.numero === selectedOSNumber);
                    const alternada = ordens[(currentIdx + 1) % ordens.length] || ordens[0];
                    handleSelectOS(alternada);
                  });
                }}
                onSelectOS={handleSelectOS}
                onScanOS={handleOpenQR}
                onNavigate={handleNavigate}
                onOpenCancelPrep={() => setIsCancelPrepModalOpen(true)}
                isOSConfirmed={isOSConfirmed}
                onConfirmOS={handleConfirmCurrentOS}
              />
            )}

            {currentScreen === 'recipe' && (
              <ScreenRecipe
                recipe={recipe}
                activeRecipe={selectedRecipe}
                suggestedFinish={pieceLot.acabamentoSugerido}
                lotes={lotes}
                initialConfirmed={preConfirmedRecipe}
                isRecipeConfirmed={isRecipeConfirmed}
                onRecipeConfirmedChange={setIsRecipeConfirmed}
                onSelectRecipe={setSelectedRecipe}
                onSetTotalVolume={handleSetTotalVolume}
                onAdjustVolume={handleAdjustVolume}
                onConfirmWeighing={handleStartDosing}
                onNavigate={handleNavigate}
                onOpenCancelPrep={() => setIsCancelPrepModalOpen(true)}
              />
            )}

            {currentScreen === 'dosing' && (
              <ScreenDosing
                recipe={recipe}
                activeRecipe={selectedRecipe}
                operator={selectedOperator}
                activeOS={
                  MOCK_ORDENS_SERVICO.find((o) => o.numero === selectedOSNumber) ||
                  MOCK_ORDENS_SERVICO[0]
                }
                lotes={lotes}
                onNavigate={handleNavigate}
                onCompleteDosing={handleCompleteDosing}
                onSetTotalVolume={handleSetTotalVolume}
                onOpenCancelPrep={() => setIsCancelPrepModalOpen(true)}
                showToast={showToast}
              />
            )}

            {currentScreen === 'return' && (
              <ScreenReturn
                operator={selectedOperator}
                lotes={lotes}
                activeOS={
                  MOCK_ORDENS_SERVICO.find((o) => o.numero === selectedOSNumber) ||
                  MOCK_ORDENS_SERVICO[0]
                }
                activePreparacao={activePreparacao}
                preparacoesPendentes={preparacoesPendentes}
                preparacoesEmConferencia={preparacoesEmConferencia}
                preparacoesHistorico={preparacoesHistorico}
                residuosMistura={residuosMistura}
                preparacaoAtivaCabine={preparacaoAtivaCabine}
                onSelectPreparacao={(prep) => setActivePreparacaoId(prep.id)}
                onRegisterItemReturn={handleRegisterItemReturn}
                onMarkStickerPrinted={handleMarkStickerPrinted}
                onFinishPreparacao={handleFinishPreparacao}
                onFinishApplication={handleFinishApplication}
                onOpenOccurrenceModal={() => setIsOccurrenceModalOpen(true)}
                onNavigate={handleNavigate}
                showToast={showToast}
              />
            )}

            {currentScreen === 'inventory' && (
              <ScreenInventory
                lotes={lotes}
                preparacoes={preparacoes}
                operator={selectedOperator}
                onNavigate={handleNavigate}
                showToast={showToast}
                solicitacoes={solicitacoesCompras}
                onAdicionarSolicitacao={handleAdicionarSolicitacao}
                onRemoverSolicitacao={handleRemoverSolicitacao}
                onReceberNovoLote={async (novoLote) => {
                  await loteRepository.adicionarSobra(novoLote);
                  const lotesAtualizados = await loteRepository.listar();
                  setLotes(lotesAtualizados);
                }}
              />
            )}

            {currentScreen === 'manager' && (
              <ScreenManager
                operator={selectedOperator}
                onNavigate={handleNavigate}
                showToast={showToast}
                movimentacoes={movimentacoes}
                lotes={lotes}
                preparacoes={preparacoes}
                preparacoesEmConferencia={preparacoesEmConferencia}
                residuosMistura={residuosMistura}
                onResolveConferenceItem={handleRegisterItemReturn}
                procedimentosPotLife={procedimentosPotLife}
                onSaveProcedimentoPotLife={handleSaveProcedimentoPotLife}
                onResetDemoData={async () => {
                  await loteRepository.resetar();
                  await movimentacaoRepository.resetar();
                  await preparacaoRepository.resetar();
                  await residuoMisturaRepository.resetar();
                  const lotesReset = await loteRepository.listar();
                  const movsReset = await movimentacaoRepository.listar();
                  const prepsReset = await preparacaoRepository.listar();
                  const residuosReset = await residuoMisturaRepository.listar();
                  setLotes(lotesReset);
                  setMovimentacoes(movsReset);
                  setPreparacoes(prepsReset);
                  setResiduosMistura(residuosReset);
                  setActivePreparacaoId(null);
                  showToast(
                    '✓ Saldos de estoque, preparações e histórico restaurados para o estado inicial!',
                    'success'
                  );
                }}
              />
            )}
          </Suspense>
        </div>

        {/* Modal de Latas que vencem primeiro ("Use Primeiro") */}
        <ModalUseFirst
          isOpen={isUseFirstModalOpen}
          onClose={() => setIsUseFirstModalOpen(false)}
          onSelectBatch={handleSelectBatch}
          lotes={lotes}
        />

        {/* Modal de Registro de Ocorrência / Resíduo da Mistura Pronta */}
        {isOccurrenceModalOpen && (
          <ModalOcorrenciaMistura
            isOpen={isOccurrenceModalOpen}
            onClose={() => setIsOccurrenceModalOpen(false)}
            preparacao={preparacaoAlvoModalOcorrencia}
            historicoOcorrencias={residuosMistura.filter(
              (r) => r.preparacaoId === preparacaoAlvoModalOcorrencia?.id
            )}
            onConfirmarRegistro={handleRegisterMixtureOccurrence}
          />
        )}

        {/* Modal de Resultado de QR Code de Embalagem / Lote */}
        <ModalQrPackageResult
          isOpen={Boolean(qrPackageModalData)}
          onClose={() => setQrPackageModalData(null)}
          codigoLido={qrPackageModalData?.codigoLido || ''}
          lote={qrPackageModalData?.lote}
          produto={qrPackageModalData?.produto}
          movimentacoes={movimentacoes}
          preparacaoPendente={preparacoesPendentes.find((p) =>
            p.itensDevolucao.some(
              (it) => it.loteId === qrPackageModalData?.lote?.id && it.status === 'PENDENTE'
            )
          )}
          onIrParaEstoque={() => {
            setQrPackageModalData(null);
            setCurrentScreen('inventory');
          }}
          onRegistrarDevolucao={() => {
            const loteAlvo = qrPackageModalData?.lote;
            setQrPackageModalData(null);
            if (loteAlvo) {
              const prepComLote = preparacoesPendentes.find((p) =>
                p.itensDevolucao.some((it) => it.loteId === loteAlvo.id && it.status === 'PENDENTE')
              );
              if (prepComLote) {
                setActivePreparacaoId(prepComLote.id);
              }
            }
            setCurrentScreen('return');
          }}
        />

        {/* Modal Scanner Real de QR Code (WebRTC / Câmera) */}
        {isQrModalOpen && (
          <Suspense fallback={null}>
            <QrScannerModal
              isOpen={isQrModalOpen}
              onClose={() => setIsQrModalOpen(false)}
              onScanSuccess={handleQrScanSuccess}
            />
          </Suspense>
        )}

        {/* Modal de Cancelar Preparação */}
        <ModalCancelPrep
          isOpen={isCancelPrepModalOpen}
          onClose={() => setIsCancelPrepModalOpen(false)}
          onConfirmCancel={() => {
            localStorage.removeItem('mada_active_dosing_draft');
            setIsCancelPrepModalOpen(false);
            setCurrentScreen('dashboard');
            showToast('Preparação cancelada.', 'info');
          }}
        />

        {/* Modal de Resumo do Turno / Trocar Operador */}
        {isShiftSummaryModalOpen && (() => {
          const isManagerSession = currentScreen === 'manager' || currentScreen === 'inventory';
          const prepsDoOperador = isManagerSession
            ? preparacoes
            : preparacoes.filter((p) => p.operadorId === selectedOperator.id);
          const volumeTotalTurno = prepsDoOperador.reduce((acc, p) => acc + p.volumeTotal, 0);
          const itensResolvidosTurno = prepsDoOperador.reduce(
            (acc, p) => acc + p.itensDevolucao.filter((it) => it.status !== 'PENDENTE').length,
            0
          );
          const itensPendentesTurno = prepsDoOperador.reduce(
            (acc, p) => acc + p.itensDevolucao.filter((it) => it.status === 'PENDENTE').length,
            0
          );

          return (
            <div
              className="ds-modal-backdrop"
              role="dialog"
              aria-modal="true"
              aria-label="Resumo do Turno e Troca de Operador"
              onClick={() => setIsShiftSummaryModalOpen(false)}
            >
              <div
                className="os-modal-card-apple"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '520px' }}
              >
                <div className="os-modal-header-apple">
                  <div className="os-modal-header-left">
                    <div
                      className="os-modal-icon-badge"
                      style={{
                        fontWeight: 800,
                        fontSize: '15px',
                        color: 'var(--text)',
                      }}
                    >
                      {isManagerSession
                        ? 'FB'
                        : selectedOperator.nome
                            .split(' ')
                            .map((p) => p[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                    </div>
                    <div>
                      <h3 className="os-modal-title-apple">
                        <span>
                          {isManagerSession ? 'Fábio (Gestor)' : selectedOperator.nome}
                        </span>
                        <span className="os-modal-count-pill">
                          {isManagerSession ? 'Gestão' : cabineOperador.cabineNome}
                        </span>
                      </h3>
                      <p className="os-modal-subtitle-apple">
                        {isManagerSession
                          ? 'Supervisor de Cabine • Resumo Geral da Operação'
                          : `${selectedOperator.papel} • Resumo do turno atual`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsShiftSummaryModalOpen(false)}
                    className="os-modal-close-apple"
                    aria-label="Fechar resumo do turno"
                  >
                    ✕
                  </button>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      background: 'rgba(var(--overlay-rgb), 0.03)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Misturas no Turno
                    </div>
                    <div
                      style={{
                        fontSize: '20px',
                        fontWeight: 800,
                        color: 'var(--text)',
                        marginTop: '4px',
                      }}
                    >
                      {prepsDoOperador.length}{' '}
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                        ({volumeTotalTurno} ml)
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      background: 'rgba(var(--overlay-rgb), 0.03)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Embalagens Rastreadas
                    </div>
                    <div
                      style={{
                        fontSize: '20px',
                        fontWeight: 800,
                        color: itensPendentesTurno > 0 ? 'var(--tint-amber)' : 'var(--tint-emerald)',
                        marginTop: '4px',
                      }}
                    >
                      {itensResolvidosTurno} resolvidas{' '}
                      {itensPendentesTurno > 0 && (
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--tint-amber)' }}>
                          • {itensPendentesTurno} pend.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!isManagerSession && preparacaoAtivaCabine && (
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      fontSize: '13px',
                      color: 'var(--tint-emerald)',
                      fontWeight: 600,
                    }}
                  >
                    ● Aplicação ativa na {cabineOperador.cabineNome}:{' '}
                    <strong>{preparacaoAtivaCabine.ordemServicoNumero}</strong> (
                    {preparacaoAtivaCabine.receitaNome}). O cronômetro de Pot Life continuará salvo.
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                    marginTop: '4px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setIsShiftSummaryModalOpen(false)}
                    style={{
                      minHeight: '46px',
                      padding: '0 18px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg)',
                      color: 'var(--text)',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Continuar no turno
                  </button>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!isManagerSession && itensPendentesTurno > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsShiftSummaryModalOpen(false);
                          setCurrentScreen('return');
                        }}
                        style={{
                          minHeight: '46px',
                          padding: '0 14px',
                          borderRadius: '10px',
                          border: '1px solid rgba(245, 158, 11, 0.45)',
                          background: 'rgba(245, 158, 11, 0.14)',
                          color: 'var(--tint-amber)',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Devolver sobras ({itensPendentesTurno})
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsShiftSummaryModalOpen(false);
                        setCurrentScreen('auth');
                        showToast('Turno encerrado. Selecione o próximo operador.', 'info');
                      }}
                      style={{
                        minHeight: '46px',
                        padding: '0 18px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'var(--primary)',
                        color: 'var(--primary-foreground)',
                        fontSize: '14px',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      Trocar operador →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
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
