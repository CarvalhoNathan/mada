import React, { useState, useEffect, useCallback, useRef, useMemo, Suspense, lazy } from 'react';
import gsap from 'gsap';
import {
  Operator,
  PieceLot,
  RecipeState,
  ScreenId,
  Lote,
  ItemSolicitacaoCompra,
  Receita,
  Movimentacao,
  OrdemServico,
  Preparacao,
  Produto,
  StatusItemDevolucao,
  LocalMistura,
  ResiduoMisturaOcorrencia,
} from './types';
import { AppShell } from './components/ui/AppShell';
import { StatusBanner } from './components/ui/StatusBanner';
import { Toast } from './components/ui/Toast';
import { PotLifeTimerBanner, PotLifeState } from './components/ui/PotLifeTimerBanner';
import { PrepStepperBar } from './components/ui/PrepStepperBar';

import { ScreenAuth } from './screens/ScreenAuth';
import { ScreenDashboard } from './screens/ScreenDashboard';
import { ScreenOS } from './screens/ScreenOS';
import { ScreenRecipe } from './screens/ScreenRecipe';
import { ScreenDosing } from './screens/ScreenDosing';
import { ScreenReturn } from './screens/ScreenReturn';

import {
  ModalUseFirst,
  ModalCancelPrep,
  ModalQrPackageResult,
  ModalOcorrenciaMistura,
} from './components/modals';

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
  MOCK_CHECKLIST_SOBRAS,
} from './data';
import { useConnectionStatus, usePurchasesRequests, usePotLifeTimer } from './hooks';
import { ordenarLotesFEFO, alocarConsumoMultiLoteFEFO } from './domain/fefo';
import {
  criarPreparacaoDevolucao,
  registrarConclusaoAplicacao,
  registrarMovimentacaoComponente,
  registrarImpressaoEtiquetaComponente,
  encerrarPreparacao,
  filtrarPreparacoesPendentesDevolucao,
  filtrarPreparacoesEmConferencia,
  filtrarPreparacoesHistoricoConcluido,
  temItensPendentesDevolucao,
} from './domain/returnFlow';
import {
  sincronizarEstadoPotLifePreparacao,
  registrarOcorrenciaResiduoMistura,
  ORIENTACAO_NEUTRA_POT_LIFE_EXPIRADO,
} from './domain/potLife';
import {
  obterCabineOperador,
  buscarAplicacaoAtivaPorCabine,
  verificarBloqueioNovaPreparacaoCabine,
  verificarPermissaoDevolucaoDuranteAplicacao,
} from './domain/operationalLocks';
import { classificarQrCode } from './domain/qrIdentification';

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

  // Lotes, movimentações, preparações e resíduos de mistura persistidos
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [preparacoes, setPreparacoes] = useState<Preparacao[]>([]);
  const [residuosMistura, setResiduosMistura] = useState<ResiduoMisturaOcorrencia[]>([]);
  const [activePreparacaoId, setActivePreparacaoId] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isOccurrenceModalOpen, setIsOccurrenceModalOpen] = useState(false);
  const [qrPackageModalData, setQrPackageModalData] = useState<{
    codigoLido: string;
    lote?: Lote;
    produto?: Produto;
  } | null>(null);

  // Carregar operadores, lotes, movimentações, preparações e resíduos do repositório
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

    movimentacaoRepository.listar().then((list) => {
      setMovimentacoes(list);
    });

    preparacaoRepository.listar().then((list) => {
      setPreparacoes(list);
    });

    residuoMisturaRepository.listar().then((list) => {
      setResiduosMistura(list);
    });
  }, []);

  // Separação estrita entre:
  // 1. Preparações com componentes realmente pendentes de devolução (status === 'PENDENTE')
  // 2. Preparações com componentes aguardando conferência técnica (status === 'PENDENTE_DE_CONFERENCIA')
  // 3. Preparações com devolução concluída (histórico)
  const preparacoesPendentes = useMemo(
    () => filtrarPreparacoesPendentesDevolucao(preparacoes),
    [preparacoes]
  );

  const preparacoesEmConferencia = useMemo(
    () => filtrarPreparacoesEmConferencia(preparacoes),
    [preparacoes]
  );

  const preparacoesHistorico = useMemo(
    () => filtrarPreparacoesHistoricoConcluido(preparacoes),
    [preparacoes]
  );

  // Identificação da cabine do operador atual e verificação de aplicação ativa na cabine
  const cabineOperador = useMemo(
    () => obterCabineOperador(selectedOperator),
    [selectedOperator]
  );

  const preparacaoAtivaCabine = useMemo(
    () => buscarAplicacaoAtivaPorCabine(preparacoes, cabineOperador.cabineId) || null,
    [preparacoes, cabineOperador.cabineId]
  );

  // Preparação em foco na tela de devolução:
  // Prioriza preparação selecionada ou da cabine do operador logado
  const activePreparacao = useMemo(() => {
    if (activePreparacaoId) {
      const encontrada = preparacoes.find((p) => p.id === activePreparacaoId);
      if (encontrada && temItensPendentesDevolucao(encontrada)) {
        return encontrada;
      }
    }
    const daCabine = preparacoesPendentes.find(
      (p) => (p.cabineId || 'CABINE-01').toUpperCase() === cabineOperador.cabineId.toUpperCase()
    );
    return daCabine || preparacoesPendentes[0] || null;
  }, [preparacoes, activePreparacaoId, preparacoesPendentes, cabineOperador.cabineId]);

  // Dados da OS e Lote
  const [selectedOSNumber, setSelectedOSNumber] = useState(MOCK_ORDENS_SERVICO[0].numero);
  const [clientName, setClientName] = useState(MOCK_ORDENS_SERVICO[0].clienteNome);
  const [projectName, setProjectName] = useState(MOCK_ORDENS_SERVICO[0].projetoNome);
  const [selectedEnvironment, setSelectedEnvironment] = useState(MOCK_ORDENS_SERVICO[0].ambienteNome);
  const [pieceLot, setPieceLot] = useState<PieceLot>(INITIAL_PIECE_LOT);

  // Receita de Mistura Homologada (Dinâmica)
  const [selectedRecipe, setSelectedRecipe] = useState<Receita>(MOCK_RECEITAS[0]);
  const [recipe, setRecipe] = useState<RecipeState>(INITIAL_RECIPE);

  // Modais
  const [isUseFirstModalOpen, setIsUseFirstModalOpen] = useState(false);
  const [isCancelPrepModalOpen, setIsCancelPrepModalOpen] = useState(false);
  const [isShiftSummaryModalOpen, setIsShiftSummaryModalOpen] = useState(false);
  const [preConfirmedRecipe, setPreConfirmedRecipe] = useState(false);

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

  // Gestão e reposição de Solicitações de Compras
  const {
    solicitacoesCompras,
    handleAdicionarSolicitacao,
    handleRemoverSolicitacao,
    verificarReposicaoAutomaticaEstoque,
  } = usePurchasesRequests(selectedOperator.nome, showToast);

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

      setCurrentScreen(targetScreen);
    },
    [preparacoes, cabineOperador, showToast]
  );

  const handleSelectPieceLot = (lote: PieceLot, envName?: string) => {
    if (envName) {
      setSelectedEnvironment(envName);
    }
    setPieceLot(lote);
    const parsedVol = parseInt(
      (lote.volumeEstimado || lote.estVolume || '').replace(/\D/g, ''),
      10
    );
    if (parsedVol >= 100 && parsedVol <= 5000) {
      setRecipe((prev) => ({ ...prev, totalVolume: parsedVol }));
    }
    const labelEnv = envName || selectedEnvironment;
    showToast(
      `✓ ${labelEnv}: ${lote.titulo || lote.title} selecionado • Volume previsto: ${lote.volumeEstimado || lote.estVolume}`,
      'info'
    );
  };

  const handleSelectOS = (os: OrdemServico) => {
    const primeiroAmbiente = os.ambientesObra?.[0];
    const envInicial = primeiroAmbiente?.nome || os.ambienteNome;
    const loteInicial = primeiroAmbiente?.lotesPecas?.[0] || os.pecaLote;

    setSelectedOSNumber(os.numero);
    setClientName(os.clienteNome);
    setProjectName(os.projetoNome);
    setSelectedEnvironment(envInicial);
    setPieceLot(loteInicial);
    const parsedVol = parseInt((loteInicial.volumeEstimado || '').replace(/\D/g, ''), 10);
    if (parsedVol >= 100 && parsedVol <= 5000) {
      setRecipe((prev) => ({ ...prev, totalVolume: parsedVol }));
    }
    showToast(
      `✓ ${os.numero} (${envInicial}) vinculada • Meta ajustada para ${loteInicial.volumeEstimado}!`,
      'success'
    );
  };

  // Registro de Ocorrência / Resíduo da Mistura Pronta (separado da devolução de embalagens originais)
  const handleRegisterMixtureOccurrence = async (dados: {
    localMistura: LocalMistura;
    quantidadeRestanteMl?: number;
    ocorrenciaRelacionada: string;
    procedimentoAdotado?: string;
  }) => {
    const alvo =
      preparacaoAtivaCabine ||
      (potLife?.preparacaoId
        ? preparacoes.find((p) => p.id === potLife.preparacaoId)
        : activePreparacao) ||
      preparacoes[0];

    if (!alvo) return;

    const resultado = registrarOcorrenciaResiduoMistura({
      preparacao: alvo,
      operador: selectedOperator,
      localMistura: dados.localMistura,
      quantidadeRestanteMl: dados.quantidadeRestanteMl,
      ocorrenciaRelacionada: dados.ocorrenciaRelacionada,
      procedimentoAdotado: dados.procedimentoAdotado,
    });

    await residuoMisturaRepository.registrar(resultado.ocorrencia);
    await preparacaoRepository.salvar(resultado.preparacaoAtualizada);

    const [prepsAtualizadas, residuosAtualizados] = await Promise.all([
      preparacaoRepository.listar(),
      residuoMisturaRepository.listar(),
    ]);
    setPreparacoes(prepsAtualizadas);
    setResiduosMistura(residuosAtualizados);

    showToast(
      `✓ Ocorrência da mistura registrada (${dados.localMistura.toUpperCase()}) no histórico da ${alvo.ordemServicoNumero}.`,
      'info'
    );
  };

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

  const handleCompleteDosing = async (
    dosingValues: Record<number, number>,
    wasteJustification?: string
  ) => {
    const verificacao = verificarBloqueioNovaPreparacaoCabine(
      preparacoes,
      cabineOperador.cabineId,
      cabineOperador.cabineNome
    );
    if (!verificacao.permitido) {
      showToast(
        verificacao.motivoBloqueio ||
          'Existe uma aplicação em andamento nesta cabine. Conclua a aplicação antes de finalizar nova dosagem.',
        'warn'
      );
      return;
    }

    const receita = selectedRecipe;
    const osAtiva =
      MOCK_ORDENS_SERVICO.find((o) => o.numero === selectedOSNumber) ||
      MOCK_ORDENS_SERVICO.find((o) => o.clienteNome === clientName) ||
      MOCK_ORDENS_SERVICO[0];
    const lotesBase = lotes.length > 0 ? lotes : MOCK_LOTES;
    const dosagemConcluidaIso = new Date().toISOString();

    // Cria a entidade Preparacao com:
    // - dosagemConcluidaEm (referência absoluta para início do Pot Life)
    // - potLifeMinutos homologado da receita/produto
    // - cabineId vinculada ao operador/equipamento
    const novaPreparacao = criarPreparacaoDevolucao({
      id: `PREP-${osAtiva.numero.replace(/\D/g, '')}-${Date.now().toString().slice(-4)}`,
      ordemServico: osAtiva,
      receita,
      operador: selectedOperator,
      volumeTotal: recipe.totalVolume,
      valoresDosados: dosingValues,
      lotesDisponiveis: lotesBase,
      produtosDisponiveis: MOCK_PRODUTOS,
      criadaEm: dosagemConcluidaIso,
      dosagemConcluidaEm: dosagemConcluidaIso,
      cabineId: cabineOperador.cabineId,
      cabineNome: cabineOperador.cabineNome,
    });

    // Registra uma Movimentacao do tipo RETIRADA por componente (suportando alocação multi-lote FEFO)
    for (const item of receita.itens) {
      const quantidade = dosingValues[item.id] || 0;
      if (quantidade > 0) {
        const lotesProduto = lotesBase.filter(
          (l) => l.produtoId === item.produtoId && l.quantidadeAtual > 0
        );
        const planoMultiLote = alocarConsumoMultiLoteFEFO(lotesProduto, quantidade);

        if (planoMultiLote.alocacoes.length > 0) {
          for (const aloc of planoMultiLote.alocacoes) {
            await loteRepository.atualizarQuantidade(aloc.lote.id, aloc.saldoRestanteLoteMl);
            await movimentacaoRepository.registrar({
              preparacaoId: novaPreparacao.id,
              tipo: 'RETIRADA',
              loteId: aloc.lote.id,
              ordemServicoId: osAtiva.id,
              operadorId: selectedOperator.id,
              quantidade: aloc.volumeAlocadoMl,
              justificativa:
                planoMultiLote.precisaComplementar
                  ? `${wasteJustification ? `${wasteJustification} • ` : ''}Complemento multi-lote FEFO (${aloc.lote.codigo})`
                  : wasteJustification,
              registradaEm: dosagemConcluidaIso,
            });
          }
        } else {
          const lotesOrdenados = ordenarLotesFEFO(
            lotesBase.filter((l) => l.produtoId === item.produtoId)
          );
          const loteId = lotesOrdenados[0]?.id || item.id;
          await movimentacaoRepository.registrar({
            preparacaoId: novaPreparacao.id,
            tipo: 'RETIRADA',
            loteId,
            ordemServicoId: osAtiva.id,
            operadorId: selectedOperator.id,
            quantidade,
            justificativa: wasteJustification,
            registradaEm: dosagemConcluidaIso,
          });
        }
      }
    }

    await preparacaoRepository.salvar(novaPreparacao);
    const prepsAtualizadas = await preparacaoRepository.listar();
    setPreparacoes(prepsAtualizadas);
    setActivePreparacaoId(novaPreparacao.id);

    const lotesAtualizados = await loteRepository.listar();
    setLotes(lotesAtualizados);
    verificarReposicaoAutomaticaEstoque(lotesAtualizados);
    const movsAtualizadas = await movimentacaoRepository.listar();
    setMovimentacoes(movsAtualizadas);

    showToast(
      `✓ Dosagem concluída! Pot Life (${novaPreparacao.potLifeMinutos || 20} min) iniciado na ${
        cabineOperador.cabineNome
      }. Registre as ${novaPreparacao.itensDevolucao.length} embalagens.`,
      'success'
    );
    setCurrentScreen('return');
  };

  const handleRegisterItemReturn = async (params: {
    preparacaoId: string;
    itemId: string;
    saldoRestanteMl: number;
    destino: Exclude<StatusItemDevolucao, 'PENDENTE'>;
    checklistAprovado: Record<string, boolean>;
    motivoManual?: string;
    aprovacaoConferenciaTecnica?: boolean;
  }) => {
    const permissao = verificarPermissaoDevolucaoDuranteAplicacao(
      preparacoes,
      cabineOperador.cabineId,
      params.preparacaoId,
      cabineOperador.cabineNome
    );
    if (!permissao.permitido && !params.aprovacaoConferenciaTecnica) {
      showToast(
        permissao.motivoBloqueio ||
          'Conclua a aplicação ativa antes de registrar devoluções de outra preparação.',
        'warn'
      );
      return;
    }

    const prepAlvo = preparacoes.find((p) => p.id === params.preparacaoId);
    if (!prepAlvo) return;

    const itemAlvo = prepAlvo.itensDevolucao.find((i) => i.id === params.itemId);
    if (!itemAlvo) return;

    const produtoRef = MOCK_PRODUTOS.find((pr) => pr.id === itemAlvo.produtoId);
    const criteriosAplicaveis =
      produtoRef?.criteriosDevolucao && produtoRef.criteriosDevolucao.length > 0
        ? produtoRef.criteriosDevolucao
        : MOCK_CHECKLIST_SOBRAS;

    const resultado = registrarMovimentacaoComponente({
      preparacao: prepAlvo,
      itemId: params.itemId,
      saldoRestanteMl: params.saldoRestanteMl,
      destino: params.destino,
      checklistAprovado: params.checklistAprovado,
      operador: selectedOperator,
      criteriosAplicaveis,
      motivoManual: params.motivoManual,
      aprovacaoConferenciaTecnica: params.aprovacaoConferenciaTecnica,
    });

    if (!resultado.sucesso || !resultado.itemAtualizado) {
      showToast(resultado.erro || 'Não foi possível registrar este componente.', 'warn');
      return;
    }

    const itemResolvido = resultado.itemAtualizado;

    if (params.destino === 'DEVOLVIDO_AO_ESTOQUE') {
      await movimentacaoRepository.registrar({
        preparacaoId: prepAlvo.id,
        componenteItemId: itemResolvido.id,
        ordemServicoId: prepAlvo.ordemServicoId,
        operadorId: selectedOperator.id,
        loteId: itemResolvido.loteId,
        tipo: 'DEVOLUCAO',
        quantidade: itemResolvido.saldoRestanteInformadoMl,
        justificativa: `Devolução de sobra (${itemResolvido.produtoNome}): ${itemResolvido.saldoRestanteInformadoMl}ml`,
        registradaEm: itemResolvido.registradoEm || new Date().toISOString(),
      });

      const dataValidade = new Date();
      dataValidade.setDate(dataValidade.getDate() + 30);
      const validadeStr = dataValidade.toISOString().split('T')[0];

      await loteRepository.adicionarSobra({
        produtoId: itemResolvido.produtoId,
        produtoNome: `${itemResolvido.produtoNome.replace(/^[0-9]+[º°]?\s*/, '')} (Sobra)`,
        codigo: itemResolvido.loteSobraGeradoCodigo || `${itemResolvido.loteCodigo}-SOBRA`,
        validade: validadeStr,
        diasAberto: 1,
        quantidadeAtual: itemResolvido.saldoRestanteInformadoMl,
        statusUrgencia: 'alta',
        prateleira: itemResolvido.prateleiraOrigem || 'A-01 (Prateleira de Sobras)',
      });

      showToast(
        `✓ ${itemResolvido.produtoNome}: ${itemResolvido.saldoRestanteInformadoMl}ml devolvidos ao estoque!`,
        'success'
      );
    } else if (params.destino === 'EMBALAGEM_ESGOTADA') {
      // Zera o saldo residual do lote no repositório para que a lata vazia saia do alerta FEFO
      await loteRepository.atualizarQuantidade(itemResolvido.loteId, 0);

      showToast(
        `✓ ${itemResolvido.produtoNome}: baixa de embalagem esgotada (0 ml de sobra) confirmada!`,
        'success'
      );
    } else if (params.destino === 'DESCARTADO_COMO_REFUGO') {
      await movimentacaoRepository.registrar({
        preparacaoId: prepAlvo.id,
        componenteItemId: itemResolvido.id,
        ordemServicoId: prepAlvo.ordemServicoId,
        operadorId: selectedOperator.id,
        loteId: itemResolvido.loteId,
        tipo: 'DESCARTE',
        quantidade: itemResolvido.saldoRestanteInformadoMl,
        justificativa: `Descarte de refugo (${itemResolvido.produtoNome}): ${
          itemResolvido.motivoReprovacao || 'Refugo químico'
        }`,
        registradaEm: itemResolvido.registradoEm || new Date().toISOString(),
      });

      showToast(
        `Refugo registrado para ${itemResolvido.produtoNome} (${itemResolvido.saldoRestanteInformadoMl}ml).`,
        'warn'
      );
    } else {
      showToast(
        `Embalagem de ${itemResolvido.produtoNome} marcada como Pendente de Conferência Técnica.`,
        'info'
      );
    }

    await preparacaoRepository.salvar(resultado.preparacaoAtualizada);
    const prepsAtualizadas = await preparacaoRepository.listar();
    setPreparacoes(prepsAtualizadas);

    // Se todos os componentes pendentes desta preparação foram resolvidos, limpa activePreparacaoId
    // caso o operador retorne ao painel, evitando que a preparação concluída reapareça como pendente.
    if (!temItensPendentesDevolucao(resultado.preparacaoAtualizada)) {
      setActivePreparacaoId(null);
    }

    const lotesAtualizados = await loteRepository.listar();
    setLotes(lotesAtualizados);
    verificarReposicaoAutomaticaEstoque(lotesAtualizados);
    const movsAtualizadas = await movimentacaoRepository.listar();
    setMovimentacoes(movsAtualizadas);
  };

  const handleMarkStickerPrinted = async (preparacaoId: string, itemId: string) => {
    const prepAlvo = preparacoes.find((p) => p.id === preparacaoId);
    if (!prepAlvo) return;
    const prepAtualizada = registrarImpressaoEtiquetaComponente(prepAlvo, itemId);
    await preparacaoRepository.salvar(prepAtualizada);
    const prepsAtualizadas = await preparacaoRepository.listar();
    setPreparacoes(prepsAtualizadas);
  };

  const handleFinishPreparacao = async (preparacaoId: string) => {
    const prepAlvo = preparacoes.find((p) => p.id === preparacaoId);
    if (!prepAlvo) return;
    const res = encerrarPreparacao(prepAlvo);
    if (!res.sucesso) {
      showToast(res.erro || 'Ainda existem pendências nesta preparação.', 'warn');
      return;
    }

    await preparacaoRepository.salvar(res.preparacaoAtualizada);
    const prepsAtualizadas = await preparacaoRepository.listar();
    setPreparacoes(prepsAtualizadas);
    setActivePreparacaoId(null);

    showToast(
      `✓ Preparação ${prepAlvo.ordemServicoNumero} encerrada com todas as embalagens rastreadas!`,
      'success'
    );
    setCurrentScreen('dashboard');
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
          <PrepStepperBar currentScreen={currentScreen} onNavigate={handleNavigate} />
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
            />
          )}

          {currentScreen === 'recipe' && (
            <ScreenRecipe
              recipe={recipe}
              activeRecipe={selectedRecipe}
              suggestedFinish={pieceLot.acabamentoSugerido}
              lotes={lotes}
              initialConfirmed={preConfirmedRecipe}
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
            <Suspense
              fallback={
                <div style={{ padding: '24px', color: 'var(--text-muted)' }}>
                  Carregando estoque...
                </div>
              }
            >
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
            </Suspense>
          )}

          {currentScreen === 'manager' && (
            <Suspense
              fallback={
                <div style={{ padding: '24px', color: 'var(--text-muted)' }}>
                  Carregando painel do gestor...
                </div>
              }
            >
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
            </Suspense>
          )}
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
                      background: 'rgba(255,255,255,0.03)',
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
                      background: 'rgba(255,255,255,0.03)',
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
                        color: itensPendentesTurno > 0 ? '#FBBF24' : '#34D399',
                        marginTop: '4px',
                      }}
                    >
                      {itensResolvidosTurno} resolvidas{' '}
                      {itensPendentesTurno > 0 && (
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#FBBF24' }}>
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
                      color: '#34D399',
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
                          color: '#FBBF24',
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
