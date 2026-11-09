import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Trash2,
  Printer,
  Check,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ListChecks,
  RotateCcw,
  FileWarning,
  History,
  ClipboardCheck,
  Beaker,
  PackageCheck,
} from 'lucide-react';
import {
  Lote,
  Operator,
  OrdemServico,
  Preparacao,
  ItemDevolucaoComponente,
  StatusItemDevolucao,
  ResiduoMisturaOcorrencia,
} from '../types';
import { Button } from '../components/ui/Button';
import { CountNumber } from '../components/ui/CountNumber';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { calcularSaldoDevolucao } from '../domain/leftover';
import {
  calcularProgressoDevolucao,
  avaliarChecklistProduto,
} from '../domain/returnFlow';
import {
  MOCK_PRODUTOS,
  MOCK_CHECKLIST_SOBRAS,
} from '../data';

interface ScreenReturnProps {
  operator: Operator;
  lotes?: Lote[];
  activeOS?: OrdemServico;
  activePreparacao?: Preparacao | null;
  preparacoesPendentes?: Preparacao[];
  preparacoesEmConferencia?: Preparacao[];
  preparacoesHistorico?: Preparacao[];
  residuosMistura?: ResiduoMisturaOcorrencia[];
  preparacaoAtivaCabine?: Preparacao | null;
  onSelectPreparacao?: (prep: Preparacao) => void;
  onRegisterItemReturn?: (params: {
    preparacaoId: string;
    itemId: string;
    saldoRestanteMl: number;
    destino: Exclude<StatusItemDevolucao, 'PENDENTE'>;
    checklistAprovado: Record<string, boolean>;
    motivoManual?: string;
    aprovacaoConferenciaTecnica?: boolean;
  }) => Promise<void>;
  onMarkStickerPrinted?: (preparacaoId: string, itemId: string) => Promise<void>;
  onFinishPreparacao?: (preparacaoId: string) => Promise<void>;
  onOpenOccurrenceModal?: () => void;
  onNavigate: (screen: 'dashboard' | 'os') => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'warn' | 'danger') => void;
  onConfirmReturn?: (dados: {
    volume: number;
    produtoId: number;
    produtoNome: string;
    loteOriginalCodigo: string;
    loteGeradoCodigo: string;
  }) => Promise<void>;
  onDiscardWaste?: (volume: number, produtoId: number) => Promise<void>;
}

const STATUS_BADGE_MAP: Record<
  StatusItemDevolucao,
  { label: string; bg: string; border: string; color: string }
> = {
  PENDENTE: {
    label: 'Pendente',
    bg: 'rgba(245, 158, 11, 0.14)',
    border: 'rgba(245, 158, 11, 0.4)',
    color: '#FBBF24',
  },
  DEVOLVIDO_AO_ESTOQUE: {
    label: 'Devolvida',
    bg: 'rgba(16, 185, 129, 0.16)',
    border: 'rgba(16, 185, 129, 0.45)',
    color: '#4ADE80',
  },
  EMBALAGEM_ESGOTADA: {
    label: 'Sem Sobra (0 ml)',
    bg: 'rgba(16, 185, 129, 0.16)',
    border: 'rgba(16, 185, 129, 0.45)',
    color: '#4ADE80',
  },
  DESCARTADO_COMO_REFUGO: {
    label: 'Descartado',
    bg: 'rgba(239, 68, 68, 0.16)',
    border: 'rgba(239, 68, 68, 0.45)',
    color: '#F87171',
  },
  PENDENTE_DE_CONFERENCIA: {
    label: 'Em Conferência',
    bg: 'rgba(59, 130, 246, 0.16)',
    border: 'rgba(59, 130, 246, 0.45)',
    color: '#60A5FA',
  },
};

type ReturnTabId = 'pendentes' | 'conferencia' | 'historico';

export const ScreenReturn: React.FC<ScreenReturnProps> = ({
  operator,
  activeOS,
  activePreparacao,
  preparacoesPendentes = [],
  preparacoesEmConferencia = [],
  preparacoesHistorico = [],
  residuosMistura = [],
  preparacaoAtivaCabine = null,
  onSelectPreparacao,
  onRegisterItemReturn,
  onMarkStickerPrinted,
  onFinishPreparacao,
  onOpenOccurrenceModal,
  onNavigate,
  showToast,
}) => {
  // Três abas únicas sem redundância:
  // 1. 'pendentes' (mostra diretamente a devolução em andamento dos componentes pendentes, ou o estado vazio quando 0)
  // 2. 'conferencia' (itens encaminhados para conferência técnica)
  // 3. 'historico' (preparações concluídas e resíduos de mistura)
  const [viewMode, setViewMode] = useState<ReturnTabId>('pendentes');

  // Preparação sendo trabalhada no momento
  const preparacaoAtual: Preparacao | null = useMemo(() => {
    if (activePreparacao) return activePreparacao;
    if (preparacoesPendentes.length > 0) return preparacoesPendentes[0];
    return null;
  }, [activePreparacao, preparacoesPendentes]);

  const totalItensPendentes = useMemo(
    () =>
      preparacoesPendentes.reduce(
        (acc, p) => acc + p.itensDevolucao.filter((it) => it.status === 'PENDENTE').length,
        0
      ),
    [preparacoesPendentes]
  );

  // Item selecionado manualmente dentro da preparação atual
  const [selectedItemId, setSelectedItemId] = useState<string>('');

  const itemAtual: ItemDevolucaoComponente | undefined = useMemo(() => {
    if (!preparacaoAtual) return undefined;
    const manualMatch = preparacaoAtual.itensDevolucao.find((i) => i.id === selectedItemId);
    if (manualMatch) return manualMatch;
    const firstPending = preparacaoAtual.itensDevolucao.find((i) => i.status === 'PENDENTE');
    return firstPending || preparacaoAtual.itensDevolucao[0];
  }, [preparacaoAtual, selectedItemId]);

  const produtoAtual = useMemo(() => {
    if (itemAtual) {
      return MOCK_PRODUTOS.find((p) => p.id === itemAtual.produtoId) || MOCK_PRODUTOS[0];
    }
    return MOCK_PRODUTOS[0];
  }, [itemAtual]);

  const criteriosProduto = useMemo(() => {
    return produtoAtual.criteriosDevolucao && produtoAtual.criteriosDevolucao.length > 0
      ? produtoAtual.criteriosDevolucao
      : MOCK_CHECKLIST_SOBRAS;
  }, [produtoAtual]);

  // Estado por item para evitar setState síncrono em useEffect ao alternar entre componentes
  const [volumesByItemId, setVolumesByItemId] = useState<Record<string, number>>({});
  const [checklistsByItemId, setChecklistsByItemId] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const [isProcessing, setIsProcessing] = useState(false);

  const returnVolume = useMemo(() => {
    if (!itemAtual) return 400;
    const saved = volumesByItemId[itemAtual.id];
    return saved !== undefined ? saved : itemAtual.saldoRestanteInformadoMl;
  }, [itemAtual, volumesByItemId]);

  const checklist = useMemo(() => {
    if (!itemAtual) return {};
    const saved = checklistsByItemId[itemAtual.id];
    if (saved) return saved;
    return criteriosProduto.reduce(
      (acc, c) => ({
        ...acc,
        [c.id]: Boolean(itemAtual.checklistAprovado?.[c.id]),
      }),
      {} as Record<string, boolean>
    );
  }, [itemAtual, checklistsByItemId, criteriosProduto]);

  const maxVolume = Math.max(1000, itemAtual?.saldoInicialLataMl || 1000);
  const saldo = calcularSaldoDevolucao(returnVolume, maxVolume, produtoAtual.densidade || 0.95);
  const percent = saldo.porcentagemPreenchimento;

  const avaliacaoChecklist = avaliarChecklistProduto(
    produtoAtual,
    MOCK_CHECKLIST_SOBRAS,
    checklist
  );
  const allChecked = avaliacaoChecklist.aprovado;
  const isZeroVolume = returnVolume <= 0;

  const progresso = useMemo(() => {
    if (!preparacaoAtual) {
      return {
        totalComponentes: 0,
        resolvidos: 0,
        concluidosDefinitivos: 0,
        pendentes: 0,
        emConferencia: 0,
        devolvidosEstoque: 0,
        embalagensEsgotadas: 0,
        descartadosRefugo: 0,
        podeFinalizarPreparacao: false,
        todosDefinitivamenteConcluidos: false,
        proximoItemPendenteId: null,
      };
    }
    return calcularProgressoDevolucao(preparacaoAtual);
  }, [preparacaoAtual]);

  const itemJaResolvido =
    itemAtual?.status === 'DEVOLVIDO_AO_ESTOQUE' ||
    itemAtual?.status === 'EMBALAGEM_ESGOTADA' ||
    itemAtual?.status === 'DESCARTADO_COMO_REFUGO' ||
    itemAtual?.status === 'PENDENTE_DE_CONFERENCIA';

  const toggleChecklistItem = (id: string) => {
    if (!itemAtual || itemJaResolvido) {
      return;
    }
    setChecklistsByItemId((prev) => {
      const current = prev[itemAtual.id] || checklist;
      return {
        ...prev,
        [itemAtual.id]: {
          ...current,
          [id]: !current[id],
        },
      };
    });
  };

  const adjustVolume = (delta: number) => {
    if (!itemAtual || itemJaResolvido) {
      return;
    }
    setVolumesByItemId((prev) => {
      const current = prev[itemAtual.id] !== undefined ? prev[itemAtual.id] : returnVolume;
      return {
        ...prev,
        [itemAtual.id]: Math.max(0, Math.min(maxVolume, current + delta)),
      };
    });
  };

  const setExactVolume = (val: number) => {
    if (!itemAtual || itemJaResolvido) return;
    setVolumesByItemId((prev) => ({
      ...prev,
      [itemAtual.id]: Math.max(0, Math.min(maxVolume, val)),
    }));
  };

  const direcionarProximoPendente = (prep: Preparacao, currentId: string) => {
    const nextPending = prep.itensDevolucao.find(
      (i) => i.id !== currentId && i.status === 'PENDENTE'
    );
    if (nextPending) {
      setSelectedItemId(nextPending.id);
    }
  };

  // Ação 1A: Confirmar devolução ao estoque (quando há sobra > 0 ml e checklist aprovado)
  const handleConfirmComponentReturn = async () => {
    if (!preparacaoAtual || !itemAtual || isProcessing) return;

    if (itemJaResolvido) {
      showToast('Este componente já foi registrado e não pode ser movimentado duplicadamente.', 'warn');
      return;
    }

    if (returnVolume <= 0) {
      await handleConfirmEmptyContainer();
      return;
    }

    if (!allChecked) {
      showToast(
        avaliacaoChecklist.motivoReprovacao ||
          'Marque todos os critérios obrigatórios do checklist antes de devolver ao estoque.',
        'warn'
      );
      return;
    }

    setIsProcessing(true);
    try {
      if (onRegisterItemReturn) {
        await onRegisterItemReturn({
          preparacaoId: preparacaoAtual.id,
          itemId: itemAtual.id,
          saldoRestanteMl: returnVolume,
          destino: 'DEVOLVIDO_AO_ESTOQUE',
          checklistAprovado: checklist,
        });
      }
      direcionarProximoPendente(preparacaoAtual, itemAtual.id);
    } finally {
      setIsProcessing(false);
    }
  };

  // Ação 1B: Confirmar Embalagem Esgotada / Sem Sobra (quando returnVolume === 0 ml)
  const handleConfirmEmptyContainer = async () => {
    if (!preparacaoAtual || !itemAtual || isProcessing || itemJaResolvido) return;

    setIsProcessing(true);
    try {
      if (onRegisterItemReturn) {
        await onRegisterItemReturn({
          preparacaoId: preparacaoAtual.id,
          itemId: itemAtual.id,
          saldoRestanteMl: 0,
          destino: 'EMBALAGEM_ESGOTADA',
          checklistAprovado: checklist,
          motivoManual: 'Embalagem consumida integralmente na dosagem (0 ml de sobra)',
        });
      }
      direcionarProximoPendente(preparacaoAtual, itemAtual.id);
    } finally {
      setIsProcessing(false);
    }
  };

  // Ação 2: Descartar componente selecionado como refugo químico
  const handleDiscardComponent = async () => {
    if (!preparacaoAtual || !itemAtual || isProcessing || itemJaResolvido) return;

    setIsProcessing(true);
    try {
      if (onRegisterItemReturn) {
        await onRegisterItemReturn({
          preparacaoId: preparacaoAtual.id,
          itemId: itemAtual.id,
          saldoRestanteMl: returnVolume,
          destino: 'DESCARTADO_COMO_REFUGO',
          checklistAprovado: checklist,
          motivoManual: !allChecked
            ? avaliacaoChecklist.motivoReprovacao
            : 'Descarte de sobra / refugo químico',
        });
      }
      direcionarProximoPendente(preparacaoAtual, itemAtual.id);
    } finally {
      setIsProcessing(false);
    }
  };

  // Ação 3: Registrar como Pendente de Conferência Técnica
  const handleMarkConference = async () => {
    if (!preparacaoAtual || !itemAtual || isProcessing || itemJaResolvido) return;

    setIsProcessing(true);
    try {
      if (onRegisterItemReturn) {
        await onRegisterItemReturn({
          preparacaoId: preparacaoAtual.id,
          itemId: itemAtual.id,
          saldoRestanteMl: returnVolume,
          destino: 'PENDENTE_DE_CONFERENCIA',
          checklistAprovado: checklist,
          motivoManual:
            avaliacaoChecklist.motivoReprovacao ||
            'Encaminhado para conferência do responsável técnico',
        });
      }
      direcionarProximoPendente(preparacaoAtual, itemAtual.id);
    } finally {
      setIsProcessing(false);
    }
  };

  // Impressão complementar de etiqueta térmica (NUNCA encerra a preparação automaticamente)
  const handlePrintComponentSticker = async () => {
    if (!preparacaoAtual || !itemAtual) return;
    if (onMarkStickerPrinted) {
      await onMarkStickerPrinted(preparacaoAtual.id, itemAtual.id);
    }
    showToast(
      `🖨️ Etiqueta térmica ${
        itemAtual.codigoEtiquetaGerada || `#SOBRA-${itemAtual.loteCodigo.replace(/^#+/, '')}`
      } impressa para ${itemAtual.produtoNome}!`,
      'info'
    );
  };

  // Encerramento formal da preparação inteira (somente quando todos os componentes estiverem resolvidos)
  const handleFinishAll = async () => {
    if (!preparacaoAtual || !progresso.podeFinalizarPreparacao) {
      showToast('Resolva todos os componentes pendentes antes de encerrar a preparação.', 'warn');
      return;
    }
    if (onFinishPreparacao) {
      await onFinishPreparacao(preparacaoAtual.id);
    }
  };

  const cleanLoteCode = itemAtual ? itemAtual.loteCodigo.replace(/^#+/, '') : 'SY-6032';
  const loteGeradoPreview =
    itemAtual?.loteSobraGeradoCodigo ||
    `#${cleanLoteCode}-SOBRA-0${itemAtual?.receitaItemId || 1}`;
  const codigoEtiquetaPreview =
    itemAtual?.codigoEtiquetaGerada || `#SOBRA-${cleanLoteCode}-${itemAtual?.receitaItemId || 1}`;
  const dataFormatada = itemAtual?.registradoEm
    ? new Date(itemAtual.registradoEm).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <div className="screen-content-area">
        {/* 1. Cabeçalho Unificado (Sem redundância entre "Devolução Atual" e "Pendentes") */}
        <header className="recipe-header-card" style={{ marginBottom: '10px', padding: '12px 18px' }}>
          <div className="recipe-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 className="recipe-main-title" style={{ fontSize: '20px' }}>
                {viewMode === 'conferencia'
                  ? 'Embalagens Aguardando Conferência Técnica'
                  : viewMode === 'historico'
                  ? 'Histórico de Devoluções Concluídas & Resíduos'
                  : preparacaoAtual
                  ? `Devolução por Componente — ${preparacaoAtual.ordemServicoNumero}`
                  : 'Central de Devoluções de Sobras'}
              </h2>
              {viewMode === 'pendentes' && preparacaoAtual && (
                <span className="os-meta-badge os-meta-badge--primary">
                  Progresso: {progresso.resolvidos} de {progresso.totalComponentes} componentes resolvidos
                </span>
              )}
            </div>
            <p className="recipe-sub-title" style={{ fontSize: '15px' }}>
              {viewMode === 'conferencia'
                ? 'Itens encaminhados para avaliação do responsável técnico antes de reintegração ou descarte.'
                : viewMode === 'historico'
                ? 'Registro auditável de preparações com devolução concluída e ocorrências de mistura.'
                : preparacaoAtual
                ? `${preparacaoAtual.clienteNome || activeOS?.clienteNome || 'Mada Marcenaria'} • Ambiente: ${
                    preparacaoAtual.ambienteNome || activeOS?.ambienteNome || 'Cabine'
                  } • Responsável: ${preparacaoAtual.operadorNome || operator.nome}`
                : 'Todas as embalagens das preparações recentes já foram processadas.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {onOpenOccurrenceModal && preparacaoAtual && (
              <Button
                variant="secondary"
                size="md"
                onClick={onOpenOccurrenceModal}
                style={{ minHeight: '42px', padding: '0 12px', fontSize: '14px' }}
              >
                <Beaker size={15} />
                <span>Resíduo da Mistura</span>
              </Button>
            )}

            <SegmentedControl<ReturnTabId>
              ariaLabel="Alternar entre seções de devolução"
              size="sm"
              value={viewMode}
              onChange={(val) => setViewMode(val)}
              options={[
                {
                  id: 'pendentes',
                  label: `Devolução Pendente (${totalItensPendentes})`,
                  icon: <ListChecks size={15} strokeWidth={2.4} />,
                  tone: totalItensPendentes > 0 ? 'warn' : 'primary',
                },
                {
                  id: 'conferencia',
                  label: `Conferência (${preparacoesEmConferencia.length})`,
                  icon: <ClipboardCheck size={15} strokeWidth={2.4} />,
                  tone: 'primary',
                },
                {
                  id: 'historico',
                  label: `Concluídas (${preparacoesHistorico.length})`,
                  icon: <History size={15} strokeWidth={2.4} />,
                  tone: 'neutral',
                },
              ]}
            />
          </div>
        </header>

        {/* Se houver mais de 1 preparação pendente na fila, exibe seletor rápido para alternar entre elas */}
        {viewMode === 'pendentes' && preparacoesPendentes.length > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)' }}>
              Preparações com devolução pendente:
            </span>
            {preparacoesPendentes.map((prep) => {
              const isCurrent = preparacaoAtual?.id === prep.id;
              const pendentesCount = prep.itensDevolucao.filter(
                (i) => i.status === 'PENDENTE'
              ).length;
              return (
                <button
                  key={prep.id}
                  type="button"
                  onClick={() => {
                    if (
                      preparacaoAtivaCabine &&
                      preparacaoAtivaCabine.id !== prep.id
                    ) {
                      showToast(
                        `Operação bloqueada: conclua a aplicação ativa da ${preparacaoAtivaCabine.ordemServicoNumero} antes de iniciar devoluções de outra preparação.`,
                        'warn'
                      );
                      return;
                    }
                    if (onSelectPreparacao) onSelectPreparacao(prep);
                  }}
                  style={{
                    minHeight: '38px',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    border: isCurrent ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: isCurrent ? 'rgba(59, 130, 246, 0.18)' : 'var(--card)',
                    color: 'var(--text)',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {prep.ordemServicoNumero} • {prep.ambienteNome} ({pendentesCount} pendentes)
                </button>
              );
            })}
          </div>
        )}

        {/* ABA 1: DEVOLUÇÃO PENDENTE (FLUXO DIRETO POR COMPONENTE OU ESTADO VAZIO) */}
        {viewMode === 'pendentes' && !preparacaoAtual && (
          <div
            style={{
              background: 'var(--card)',
              border: '1.5px solid var(--border)',
              borderRadius: '16px',
              padding: '32px 24px',
              textAlign: 'center',
            }}
          >
            <CheckCircle2 size={38} color="var(--ok)" style={{ margin: '0 auto 10px' }} />
            <h3 style={{ fontSize: '20px', color: 'var(--text)', marginBottom: '6px' }}>
              Nenhuma devolução pendente no momento
            </h3>
            <p style={{ fontSize: '16px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Todas as embalagens utilizadas nas preparações já foram devolvidas ao estoque, baixadas como esgotadas, descartadas ou encaminhadas para conferência.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {preparacoesEmConferencia.length > 0 && (
                <Button variant="secondary" size="md" onClick={() => setViewMode('conferencia')}>
                  Ver Itens em Conferência ({preparacoesEmConferencia.length})
                </Button>
              )}
              {preparacoesHistorico.length > 0 && (
                <Button variant="secondary" size="md" onClick={() => setViewMode('historico')}>
                  Consultar Histórico Concluído ({preparacoesHistorico.length})
                </Button>
              )}
              <Button variant="primary" size="md" onClick={() => onNavigate('os')}>
                Iniciar Nova Preparação →
              </Button>
            </div>
          </div>
        )}

        {viewMode === 'pendentes' && preparacaoAtual && itemAtual && (
          <>
            {/* Barra de Progresso e Seleção dos 4 Componentes da Preparação */}
            <div
              role="tablist"
              aria-label="Componentes utilizados na preparação"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.max(1, preparacaoAtual.itensDevolucao.length)}, 1fr)`,
                gap: '10px',
                marginBottom: '12px',
              }}
            >
              {preparacaoAtual.itensDevolucao.map((comp, idx) => {
                const isSelected = comp.id === itemAtual.id;
                const badge = STATUS_BADGE_MAP[comp.status];
                const cleanName = comp.produtoNome.replace(/^[0-9]+[º°]?\s*/, '');

                return (
                  <button
                    key={comp.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedItemId(comp.id)}
                    style={{
                      minHeight: '68px',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: isSelected ? 'rgba(255, 255, 255, 0.10)' : 'var(--card)',
                      border: isSelected
                        ? '2px solid var(--primary)'
                        : `1.5px solid ${comp.status === 'PENDENTE' ? 'var(--border)' : badge.border}`,
                      color: 'var(--text)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '4px',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                        {idx + 1}. {cleanName}
                      </span>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: 800,
                          background: badge.bg,
                          border: `1px solid ${badge.border}`,
                          color: badge.color,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '13px',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      <span>{comp.loteCodigo}</span>
                      <span>
                        {comp.status === 'PENDENTE'
                          ? `Usado: ${comp.quantidadeRetiradaMl}ml`
                          : `${comp.saldoRestanteInformadoMl}ml`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Área Principal 2 Colunas: Esquerda (Inspeção + Volume + Checklist do Produto) | Direita (Etiqueta Térmica + Destino) */}
            <div className="return-layout">
              {/* Coluna Esquerda: Embalagem em Foco e Checklist Homologado */}
              <div className="bottle-visual-box">
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '17px', color: 'var(--text)', display: 'block' }}>
                      {itemAtual.produtoNome}
                    </span>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                      Retirado na dosagem: <strong>{itemAtual.quantidadeRetiradaMl} ml</strong> • Embalagem:{' '}
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{itemAtual.embalagemId || itemAtual.loteCodigo}</span>
                    </span>
                  </div>
                  <span className="os-meta-badge os-meta-badge--primary">{itemAtual.loteCodigo}</span>
                </div>

                {/* Alerta quando o produto não possui configuração técnica homologada */}
                {avaliacaoChecklist.requerHomologacaoTecnica && !isZeroVolume && (
                  <div
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      marginBottom: '6px',
                      borderRadius: '10px',
                      background: 'rgba(245, 158, 11, 0.14)',
                      border: '1px solid rgba(245, 158, 11, 0.45)',
                      color: '#FBBF24',
                      fontSize: '14px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <FileWarning size={16} />
                    <span>
                      Parâmetros específicos pendentes de homologação pelo responsável técnico. Usando checklist padrão.
                    </span>
                  </div>
                )}

                {/* Frasco + Stepper de Saldo Restante + Atalho Sem Sobra (0 ml) */}
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    margin: '4px 0',
                  }}
                >
                  <div className="bottle-wrapper" style={{ margin: 0 }}>
                    <div>
                      <div className="bottle-neck" />
                      <div className="bottle-container" style={{ height: '105px', width: '96px' }}>
                        <div className="bottle-liquid" style={{ height: `${percent}%` }}>
                          <span>{returnVolume} ml</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
                      Informe o saldo restante na embalagem:
                    </span>
                    <div className="sobra-stepper-box" style={{ margin: '4px 0' }}>
                      <button
                        type="button"
                        className="btn-stepper-round"
                        onClick={() => adjustVolume(-50)}
                        disabled={itemJaResolvido}
                        aria-label="Diminuir 50ml"
                      >
                        −
                      </button>
                      <div className="sobra-value-center" style={{ minWidth: '185px' }}>
                        <CountNumber value={returnVolume} className="sobra-val-num" />
                        <span className="sobra-val-unit">ml restantes</span>
                      </div>
                      <button
                        type="button"
                        className="btn-stepper-round"
                        onClick={() => adjustVolume(50)}
                        disabled={itemJaResolvido}
                        aria-label="Aumentar 50ml"
                      >
                        +
                      </button>
                    </div>

                    {!itemJaResolvido && returnVolume > 0 && (
                      <button
                        type="button"
                        onClick={() => setExactVolume(0)}
                        style={{
                          marginTop: '6px',
                          padding: '5px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: 'var(--text-muted)',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Lata esgotou / Sem sobra (0 ml)
                      </button>
                    )}
                  </div>
                </div>

                {/* Quando o saldo restante é 0 ml (não teve sobra), dispensa o checklist e orienta a baixa direta */}
                {isZeroVolume ? (
                  <div
                    style={{
                      width: '100%',
                      marginTop: '8px',
                      padding: '16px 18px',
                      borderRadius: '14px',
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1.5px solid rgba(16, 185, 129, 0.45)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4ADE80', fontWeight: 800, fontSize: '16px' }}>
                      <PackageCheck size={20} strokeWidth={2.4} />
                      <span>Embalagem Esgotada • Nenhuma sobra física (0 ml)</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text)', lineHeight: 1.45 }}>
                      Todo o volume desta embalagem ({itemAtual.quantidadeRetiradaMl} ml) foi consumido na preparação. Não há sobra para retornar à prateleira nem necessidade de preencher o checklist de armazenamento.
                    </p>
                  </div>
                ) : (
                  /* Checklist de Integridade Química Homologado por Produto (somente quando há sobra > 0 ml) */
                  <div className="checklist-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="checklist-title">
                        Checklist Homologado ({produtoAtual.papelPadrao.toUpperCase()}):
                      </span>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: allChecked ? 'var(--ok)' : 'var(--warn)',
                        }}
                      >
                        {allChecked
                          ? '✓ Aprovado para retornar ao estoque'
                          : `Pendente (${criteriosProduto.length - avaliacaoChecklist.criteriosPendentes.length}/${criteriosProduto.length})`}
                      </span>
                    </div>

                    {criteriosProduto.map((item) => (
                      <div
                        key={item.id}
                        className={`checklist-row-card ${checklist[item.id] ? 'checked' : ''}`}
                        onClick={() => toggleChecklistItem(item.id)}
                        style={{ minHeight: '52px', padding: '8px 14px' }}
                      >
                        <div className="checklist-checkbox-box" style={{ width: '30px', height: '30px', fontSize: '17px' }}>
                          ✓
                        </div>
                        <span className="checklist-label" style={{ fontSize: '15px' }}>
                          {item.label}
                        </span>
                      </div>
                    ))}

                    {!allChecked && avaliacaoChecklist.motivoReprovacao && (
                      <div
                        style={{
                          marginTop: '4px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          color: '#FCA5A5',
                          fontSize: '14px',
                          fontWeight: 600,
                        }}
                      >
                        ⚠️ Bloqueio de estoque: {avaliacaoChecklist.motivoReprovacao}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Coluna Direita: Etiqueta Térmica Individual & Ações de Destino do Componente */}
              <div className="return-right-col">
                <div className="thermal-sticker-card" style={{ padding: '14px 18px 12px 18px', opacity: isZeroVolume ? 0.72 : 1 }}>
                  <div className="thermal-tear-edge" aria-hidden="true" />

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px',
                    }}
                  >
                    <div className="sticker-printer-badge" style={{ marginBottom: 0 }}>
                      <Printer size={12} strokeWidth={2.5} />
                      <span>ZEBRA ZT410 • ETIQUETA INDIVIDUAL</span>
                    </div>

                    {!isZeroVolume && (
                      <button
                        type="button"
                        onClick={handlePrintComponentSticker}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #0F172A',
                          background: itemAtual.etiquetaImpressa ? '#DCFCE7' : '#F1F5F9',
                          color: '#0F172A',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                        title="Imprimir etiqueta térmica apenas para esta embalagem (não encerra a preparação)"
                      >
                        <Printer size={12} />
                        <span>{itemAtual.etiquetaImpressa ? '✓ Reimprimir Etiqueta' : 'Imprimir Etiqueta'}</span>
                      </button>
                    )}
                  </div>

                  <div className="sticker-header">
                    <div>
                      <strong style={{ fontSize: '15px', letterSpacing: '0.04em' }}>MADA MARCENARIA</strong>
                      <span style={{ display: 'block', fontSize: '11px', color: '#64748B' }}>
                        RASTREABILIDADE INDIVIDUAL • {preparacaoAtual.id}
                      </span>
                    </div>
                    {isZeroVolume ? (
                      <div className="sticker-homologation-stamp">
                        <PackageCheck size={14} strokeWidth={2.6} />
                        <span>LATA ESGOTADA (0 ML)</span>
                      </div>
                    ) : allChecked ? (
                      <div className="sticker-homologation-stamp">
                        <ShieldCheck size={14} strokeWidth={2.6} />
                        <span>HOMOLOGADO FEFO</span>
                      </div>
                    ) : (
                      <div className="sticker-stamp" style={{ opacity: 0.85 }}>
                        REPROVADO P/ ESTOQUE
                      </div>
                    )}
                  </div>

                  <div
                    className="sticker-badge-urgent"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}
                  >
                    <AlertTriangle size={13} strokeWidth={2.4} />{' '}
                    {isZeroVolume
                      ? 'EMBALAGEM CONSUMIDA INTEGRALMENTE • SEM RETORNO À PRATELEIRA'
                      : 'PRIORIDADE FEFO: CONSUMIR ANTES DE VIOLAR LATAS LACRADAS'}
                  </div>

                  <div className="sticker-body">
                    <div className="sticker-details">
                      <p>
                        <strong>PRODUTO:</strong> <span>{itemAtual.produtoNome.toUpperCase()}</span>
                      </p>
                      <p>
                        <strong>SALDO RESTANTE:</strong>{' '}
                        <strong style={{ color: '#0F172A', fontSize: '15px' }}>
                          <CountNumber value={returnVolume} format={(n) => `${Math.round(n)} ml`} />
                        </strong>{' '}
                        <span style={{ color: '#64748B' }}>(± {saldo.pesoEstimadoGramas}g)</span>
                      </p>
                      <p>
                        <strong>LOTE ORIGEM:</strong>{' '}
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{itemAtual.loteCodigo}</span>
                      </p>
                      <p>
                        <strong>LOTE SOBRA:</strong>{' '}
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          {isZeroVolume ? 'N/A (ESGOTADO)' : loteGeradoPreview}
                        </span>
                      </p>
                      <p>
                        <strong>ORIGEM:</strong>{' '}
                        <span>
                          {preparacaoAtual.ordemServicoNumero} ({preparacaoAtual.ambienteNome})
                        </span>
                      </p>
                      <p>
                        <strong>AVALIADO POR:</strong>{' '}
                        <span>
                          {itemAtual.avaliadoPorNome || operator.nome} • {dataFormatada}
                        </span>
                      </p>
                    </div>

                    <div className="sticker-qr-box">
                      <svg viewBox="0 0 100 100" fill="black">
                        <path d="M0 0h30v30H0zm5 5h20v20H5zm35-5h30v30H40zm5 5h20v20H45zM0 40h30v30H0zm5 5h20v20H5zm45 5h10v10H50zm15 0h15v15H65zm0 25h10v10H65zm-25 0h10v10H40zm15 15h10v10H55z" />
                      </svg>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          color: '#0F172A',
                          marginTop: '4px',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {codigoEtiquetaPreview}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação Individual para o Componente Selecionado */}
                {itemJaResolvido ? (
                  <div
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      background:
                        itemAtual.status === 'DEVOLVIDO_AO_ESTOQUE' ||
                        itemAtual.status === 'EMBALAGEM_ESGOTADA'
                          ? 'rgba(16, 185, 129, 0.14)'
                          : itemAtual.status === 'PENDENTE_DE_CONFERENCIA'
                          ? 'rgba(59, 130, 246, 0.14)'
                          : 'rgba(239, 68, 68, 0.14)',
                      border: `1.5px solid ${
                        itemAtual.status === 'DEVOLVIDO_AO_ESTOQUE' ||
                        itemAtual.status === 'EMBALAGEM_ESGOTADA'
                          ? 'var(--ok)'
                          : itemAtual.status === 'PENDENTE_DE_CONFERENCIA'
                          ? 'var(--primary)'
                          : 'var(--danger)'
                      }`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '16px', color: 'var(--text)', display: 'block' }}>
                        ✓ Componente já registrado ({STATUS_BADGE_MAP[itemAtual.status].label})
                      </strong>
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                        Responsável: {itemAtual.responsavelMovimentacaoNome || operator.nome} • Saldo:{' '}
                        {itemAtual.saldoRestanteInformadoMl} ml
                      </span>
                    </div>
                    {progresso.proximoItemPendenteId && (
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => setSelectedItemId(progresso.proximoItemPendenteId!)}
                      >
                        Próximo Pendente →
                      </Button>
                    )}
                  </div>
                ) : isZeroVolume ? (
                  /* Quando o item veio zerado / sem sobra (0 ml): opção clara e direta de confirmar embalagem esgotada */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Button
                      variant="primary"
                      size="md"
                      disabled={isProcessing}
                      onClick={handleConfirmEmptyContainer}
                      style={{
                        width: '100%',
                        fontSize: '18px',
                        background: '#10B981',
                        borderColor: '#10B981',
                      }}
                    >
                      <PackageCheck size={20} strokeWidth={2.4} />
                      <span>
                        Confirmar Sem Sobra / Embalagem Esgotada (0 ml)
                      </span>
                    </Button>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <Button
                        variant="secondary"
                        size="md"
                        disabled={isProcessing}
                        onClick={handleMarkConference}
                        style={{ fontSize: '16px', padding: '0 12px' }}
                        title="Separar embalagem para avaliação do responsável técnico"
                      >
                        <Clock size={17} /> Pendente Conferência
                      </Button>

                      <Button
                        variant="danger"
                        size="md"
                        disabled={isProcessing}
                        onClick={handleDiscardComponent}
                        style={{ fontSize: '16px', padding: '0 12px' }}
                        title="Registrar descarte de embalagem vazia/contaminada"
                      >
                        <Trash2 size={17} strokeWidth={2.4} /> Descartar Embalagem
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Quando há sobra (> 0 ml): exige checklist aprovado para devolver ao estoque */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Button
                      variant="primary"
                      size="md"
                      disabled={!allChecked || isProcessing}
                      onClick={handleConfirmComponentReturn}
                      style={{ width: '100%', fontSize: '18px' }}
                    >
                      <RotateCcw size={18} strokeWidth={2.4} />
                      <span>
                        Devolver {itemAtual.produtoNome.replace(/^[0-9]+[º°]?\s*/, '')} ao Estoque ({returnVolume} ml)
                      </span>
                    </Button>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <Button
                        variant="secondary"
                        size="md"
                        disabled={isProcessing}
                        onClick={handleMarkConference}
                        style={{ fontSize: '16px', padding: '0 12px' }}
                        title="Separar embalagem para avaliação do responsável técnico"
                      >
                        <Clock size={17} /> Pendente Conferência
                      </Button>

                      <Button
                        variant="danger"
                        size="md"
                        disabled={isProcessing}
                        onClick={handleDiscardComponent}
                        style={{ fontSize: '16px', padding: '0 12px' }}
                        title="Registrar descarte desta sobra como refugo químico"
                      >
                        <Trash2 size={17} strokeWidth={2.4} /> Descartar como Refugo
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ABA 2: ITENS AGUARDANDO CONFERÊNCIA TÉCNICA */}
        {viewMode === 'conferencia' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {preparacoesEmConferencia.length === 0 ? (
              <div
                style={{
                  background: 'var(--card)',
                  border: '1.5px solid var(--border)',
                  borderRadius: '16px',
                  padding: '28px 24px',
                  textAlign: 'center',
                }}
              >
                <ClipboardCheck size={36} color="var(--primary)" style={{ margin: '0 auto 10px' }} />
                <h3 style={{ fontSize: '19px', color: 'var(--text)', marginBottom: '6px' }}>
                  Nenhuma embalagem aguardando conferência técnica
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
                  Quando uma embalagem tiver divergência de checklist ou aguardar validação técnica, ela aparecerá nesta fila específica.
                </p>
              </div>
            ) : (
              preparacoesEmConferencia.map((prep) => {
                const itensConferencia = prep.itensDevolucao.filter(
                  (it) => it.status === 'PENDENTE_DE_CONFERENCIA'
                );
                return (
                  <div
                    key={prep.id}
                    style={{
                      background: 'var(--card)',
                      border: '1.5px solid rgba(59, 130, 246, 0.45)',
                      borderRadius: '16px',
                      padding: '16px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div>
                        <span className="os-meta-badge os-meta-badge--primary">{prep.ordemServicoNumero}</span>
                        <strong style={{ fontSize: '17px', color: 'var(--text)', marginLeft: '10px' }}>
                          {prep.clienteNome} • {prep.ambienteNome} ({prep.id})
                        </strong>
                      </div>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '13px',
                          fontWeight: 700,
                          background: 'rgba(59, 130, 246, 0.16)',
                          border: '1px solid rgba(59, 130, 246, 0.45)',
                          color: '#60A5FA',
                        }}
                      >
                        {itensConferencia.length} item(ns) aguardando conferência técnica
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                      {itensConferencia.map((it) => (
                        <div
                          key={it.id}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '12px',
                            background: 'var(--bg)',
                            border: '1px solid rgba(59, 130, 246, 0.4)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '10px',
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: '16px', color: 'var(--text)', display: 'block' }}>
                              {it.produtoNome} ({it.loteCodigo})
                            </strong>
                            <span style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                              Saldo informado: <strong>{it.saldoRestanteInformadoMl} ml</strong> • Resp:{' '}
                              {it.responsavelMovimentacaoNome || prep.operadorNome}
                            </span>
                            {it.motivoReprovacao && (
                              <span style={{ fontSize: '13px', color: '#93C5FD', display: 'block', marginTop: '4px' }}>
                                Observação: {it.motivoReprovacao}
                              </span>
                            )}
                          </div>

                          {/* Botões de Decisão da Conferência Técnica */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            {it.saldoRestanteInformadoMl > 0 && (
                              <Button
                                variant="primary"
                                size="md"
                                disabled={isProcessing}
                                onClick={async () => {
                                  if (!onRegisterItemReturn) return;
                                  setIsProcessing(true);
                                  try {
                                    await onRegisterItemReturn({
                                      preparacaoId: prep.id,
                                      itemId: it.id,
                                      saldoRestanteMl: it.saldoRestanteInformadoMl,
                                      destino: 'DEVOLVIDO_AO_ESTOQUE',
                                      checklistAprovado: it.checklistAprovado || {},
                                      aprovacaoConferenciaTecnica: true,
                                    });
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                style={{ background: '#10B981', borderColor: '#10B981', fontSize: '14px', minHeight: '44px', padding: '0 14px' }}
                              >
                                <Check size={15} strokeWidth={2.6} />
                                <span>Aprovar p/ Estoque ({it.saldoRestanteInformadoMl} ml)</span>
                              </Button>
                            )}

                            <Button
                              variant={it.saldoRestanteInformadoMl <= 0 ? 'primary' : 'secondary'}
                              size="md"
                              disabled={isProcessing}
                              onClick={async () => {
                                if (!onRegisterItemReturn) return;
                                setIsProcessing(true);
                                try {
                                  await onRegisterItemReturn({
                                    preparacaoId: prep.id,
                                    itemId: it.id,
                                    saldoRestanteMl: 0,
                                    destino: 'EMBALAGEM_ESGOTADA',
                                    checklistAprovado: it.checklistAprovado || {},
                                    motivoManual: 'Conferência concluída: embalagem sem sobra (0 ml)',
                                  });
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              style={{ fontSize: '14px', minHeight: '44px', padding: '0 14px' }}
                            >
                              <PackageCheck size={15} />
                              <span>Confirmar Sem Sobra (0 ml)</span>
                            </Button>

                            <Button
                              variant="danger"
                              size="md"
                              disabled={isProcessing}
                              onClick={async () => {
                                if (!onRegisterItemReturn) return;
                                setIsProcessing(true);
                                try {
                                  await onRegisterItemReturn({
                                    preparacaoId: prep.id,
                                    itemId: it.id,
                                    saldoRestanteMl: it.saldoRestanteInformadoMl,
                                    destino: 'DESCARTADO_COMO_REFUGO',
                                    checklistAprovado: it.checklistAprovado || {},
                                    motivoManual: 'Reprovado na conferência técnica • Descarte como refugo',
                                  });
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              style={{ fontSize: '14px', minHeight: '44px', padding: '0 14px' }}
                            >
                              <Trash2 size={15} />
                              <span>Descartar Refugo</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ABA 3: HISTÓRICO DE DEVOLUÇÕES CONCLUÍDAS & RESÍDUOS DA MISTURA */}
        {viewMode === 'historico' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {residuosMistura.length > 0 && (
              <div
                style={{
                  background: 'var(--card)',
                  border: '1.5px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                }}
              >
                <h3 style={{ margin: '0 0 10px', fontSize: '17px', color: 'var(--text)' }}>
                  Registros de Ocorrências e Resíduos de Mistura Pronta ({residuosMistura.length})
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                  {residuosMistura.map((oc) => (
                    <div
                      key={oc.id}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        fontSize: '14px',
                      }}
                    >
                      <strong style={{ color: 'var(--text)', display: 'block' }}>
                        {oc.ordemServicoNumero} • {oc.receitaNome} ({oc.cabineId})
                      </strong>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>
                        Local: <strong>{oc.localMistura.toUpperCase()}</strong>
                        {oc.quantidadeRestanteMl !== undefined ? ` • Volume: ${oc.quantidadeRestanteMl} ml` : ''} •
                        Pot Life: <strong>{oc.situacaoPotLife}</strong>
                      </span>
                      <span style={{ color: '#FDE68A', display: 'block', marginTop: '4px' }}>
                        Ocorrência: {oc.ocorrenciaRelacionada}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {preparacoesHistorico.length === 0 ? (
              <div
                style={{
                  background: 'var(--card)',
                  border: '1.5px solid var(--border)',
                  borderRadius: '16px',
                  padding: '28px 24px',
                  textAlign: 'center',
                }}
              >
                <History size={36} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
                <h3 style={{ fontSize: '19px', color: 'var(--text)', marginBottom: '6px' }}>
                  Nenhuma preparação concluída no histórico ainda
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
                  Assim que todos os componentes de uma preparação forem devolvidos, baixados como sem sobra ou descartados, o registro completo fica disponível aqui para consulta.
                </p>
              </div>
            ) : (
              preparacoesHistorico.map((prep) => (
                <div
                  key={prep.id}
                  style={{
                    background: 'var(--card)',
                    border: '1.5px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <span className="os-meta-badge os-meta-badge--primary">{prep.ordemServicoNumero}</span>
                      <strong style={{ fontSize: '17px', color: 'var(--text)', marginLeft: '10px' }}>
                        {prep.clienteNome} • {prep.ambienteNome} ({prep.receitaNome})
                      </strong>
                    </div>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '13px',
                        fontWeight: 700,
                        background: 'rgba(16, 185, 129, 0.16)',
                        border: '1px solid rgba(16, 185, 129, 0.45)',
                        color: '#4ADE80',
                      }}
                    >
                      ✓ Devolução Concluída ({prep.itensDevolucao.length}/{prep.itensDevolucao.length} embalagens)
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    {prep.itensDevolucao.map((it) => {
                      const badge = STATUS_BADGE_MAP[it.status];
                      return (
                        <div
                          key={it.id}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '10px',
                            background: 'var(--bg)',
                            border: `1px solid ${badge.border}`,
                          }}
                        >
                          <strong style={{ fontSize: '14px', color: 'var(--text)', display: 'block' }}>
                            {it.produtoNome.replace(/^[0-9]+[º°]?\s*/, '')}
                          </strong>
                          <span style={{ fontSize: '12px', color: badge.color, fontWeight: 700, display: 'block' }}>
                            {badge.label} • {it.saldoRestanteInformadoMl} ml
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {it.loteSobraGeradoCodigo || it.loteCodigo}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Barra Inferior Fixa: Voltar (Preservando Estado para Retomada) e Encerrar Preparação (Bloqueado se houver pendências) */}
      <footer className="os-bottom-bar-minimal">
        <div className="os-bottom-left">
          <button
            type="button"
            className="os-bar-btn os-btn-back"
            onClick={() => {
              if (preparacaoAtual && progresso.pendentes > 0) {
                showToast(
                  `Estado salvo! ${progresso.pendentes} embalagem(ns) continuam pendentes para retomada.`,
                  'info'
                );
              }
              onNavigate('dashboard');
            }}
          >
            ← Pausar / Voltar ao Início
          </button>
        </div>

        <div className="os-bottom-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {preparacaoAtual && (
            <span style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: 600 }}>
              {progresso.podeFinalizarPreparacao
                ? '✓ Todos os componentes resolvidos!'
                : `Faltam ${progresso.pendentes} de ${progresso.totalComponentes} componentes`}
            </span>
          )}

          {preparacaoAtual && (
            <button
              type="button"
              className={`os-bar-btn os-btn-continue ${progresso.podeFinalizarPreparacao ? 'is-success' : ''}`}
              onClick={handleFinishAll}
              disabled={!progresso.podeFinalizarPreparacao}
              style={{ minWidth: '300px' }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Check size={20} strokeWidth={2.8} />
                <span>
                  {progresso.podeFinalizarPreparacao
                    ? 'Encerrar Preparação Completa →'
                    : `Resolva os ${progresso.pendentes} itens pendentes`}
                </span>
              </span>
            </button>
          )}
        </div>
      </footer>
    </>
  );
};
