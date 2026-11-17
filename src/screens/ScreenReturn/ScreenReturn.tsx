import React, { useState, useMemo } from 'react';
import {
  Check,
  CheckCircle2,
  ListChecks,
  ClipboardCheck,
  History,
  Beaker,
} from 'lucide-react';
import {
  Preparacao,
  ItemDevolucaoComponente,
} from '../../types';
import { Button } from '../../components/ui/Button';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { calcularSaldoDevolucao } from '../../domain/leftover';
import {
  calcularProgressoDevolucao,
  avaliarChecklistProduto,
} from '../../domain/returnFlow';
import {
  MOCK_PRODUTOS,
  MOCK_CHECKLIST_SOBRAS,
} from '../../data';
import { ReturnTabId, ScreenReturnProps, STATUS_BADGE_MAP } from './types';
import { ReturnItemCard } from './ReturnItemCard';
import { ReturnThermalSticker } from './ReturnThermalSticker';
import { ReturnConferenceTab } from './ReturnConferenceTab';
import { ReturnHistoryTab } from './ReturnHistoryTab';
import { ReturnKeypadModal } from './ReturnKeypadModal';

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

  // Estado por item para evitar conflito ao alternar entre componentes
  const [volumesByItemId, setVolumesByItemId] = useState<Record<string, number>>({});
  const [checklistsByItemId, setChecklistsByItemId] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [keypadBuffer, setKeypadBuffer] = useState('');

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
    if (!itemAtual || itemJaResolvido) return;
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
    if (!itemAtual || itemJaResolvido) return;
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

  const handleOpenKeypad = () => {
    if (!itemAtual || itemJaResolvido) return;
    setKeypadBuffer(returnVolume > 0 ? String(returnVolume) : '');
    setIsKeypadOpen(true);
  };

  const handleKeypadDigit = (digit: string) => {
    if (keypadBuffer.length < 5) {
      setKeypadBuffer((prev) => (prev === '0' ? digit : prev + digit));
    }
  };

  const handleKeypadBackspace = () => {
    setKeypadBuffer((prev) => prev.slice(0, -1));
  };

  const handleKeypadClear = () => {
    setKeypadBuffer('');
  };

  const handleKeypadConfirm = () => {
    const parsed = parseInt(keypadBuffer, 10) || 0;
    setExactVolume(parsed);
    setIsKeypadOpen(false);
    setKeypadBuffer('');
  };

  const direcionarProximoPendente = (prep: Preparacao, currentId: string) => {
    const nextPending = prep.itensDevolucao.find(
      (i) => i.id !== currentId && i.status === 'PENDENTE'
    );
    if (nextPending) {
      setSelectedItemId(nextPending.id);
    }
  };

  // Ação 1A: Confirmar devolução ao estoque (> 0 ml e checklist aprovado)
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

  // Ação 1B: Confirmar Embalagem Esgotada / Sem Sobra (0 ml)
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

  // Ação 2: Descartar componente como refugo químico
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

  // Encerramento formal da preparação inteira
  const handleFinishAll = async () => {
    if (!preparacaoAtual || !progresso.podeFinalizarPreparacao) {
      showToast('Resolva todos os componentes pendentes antes de encerrar a preparação.', 'warn');
      return;
    }
    if (onFinishPreparacao) {
      await onFinishPreparacao(preparacaoAtual.id);
    }
  };

  return (
    <>
      <div className="screen-content-area">
        {/* 1. Cabeçalho Unificado */}
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

        {/* Seletor rápido para alternar entre preparações pendentes */}
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

        {/* ABA 1: DEVOLUÇÃO PENDENTE */}
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
              Todas as embalagens das preparações recentes já foram devolvidas ao estoque, baixadas como esgotadas, descartadas ou encaminhadas para conferência.
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
            {/* Barra de Seleção dos Componentes da Preparação */}
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
                const isResolvedOk =
                  comp.status === 'DEVOLVIDO_AO_ESTOQUE' || comp.status === 'EMBALAGEM_ESGOTADA';

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
                      borderRadius: '14px',
                      background: isSelected
                        ? isResolvedOk
                          ? 'rgba(16, 185, 129, 0.12)'
                          : 'rgba(var(--overlay-rgb), 0.08)'
                        : 'var(--card)',
                      border: isSelected
                        ? `2px solid ${isResolvedOk ? 'var(--ok)' : 'var(--primary)'}`
                        : `1.5px solid ${comp.status === 'PENDENTE' ? 'var(--border)' : badge.border}`,
                      boxShadow: isSelected
                        ? isResolvedOk
                          ? '0 0 18px rgba(16, 185, 129, 0.18)'
                          : '0 0 18px rgba(59, 130, 246, 0.14)'
                        : 'none',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '6px',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <span
                          className="dosing-step-badge"
                          style={{
                            width: '22px',
                            height: '22px',
                            fontSize: '12px',
                            borderColor: isResolvedOk ? 'var(--ok)' : undefined,
                            color: isResolvedOk ? 'var(--ok)' : undefined,
                          }}
                        >
                          {idx + 1}
                        </span>
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: 'var(--text)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {cleanName}
                        </span>
                      </div>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontSize: '11px',
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
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      <span>Lote: {comp.loteCodigo}</span>
                      <span>
                        {comp.status === 'PENDENTE'
                          ? `Retirado: ${comp.quantidadeRetiradaMl} ml`
                          : `Saldo: ${comp.saldoRestanteInformadoMl} ml`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Layout 2 Colunas: Esquerda (ItemCard) + Direita (ThermalSticker) */}
            <div className="return-layout">
              <ReturnItemCard
                preparacaoAtual={preparacaoAtual}
                itemAtual={itemAtual}
                produtoAtual={produtoAtual}
                criteriosProduto={criteriosProduto}
                returnVolume={returnVolume}
                maxVolume={maxVolume}
                pesoEstimadoGramas={saldo.pesoEstimadoGramas}
                checklist={checklist}
                allChecked={allChecked}
                isZeroVolume={isZeroVolume}
                itemJaResolvido={itemJaResolvido}
                avaliacaoChecklist={avaliacaoChecklist}
                onAdjustVolume={adjustVolume}
                onSetExactVolume={setExactVolume}
                onOpenKeypad={handleOpenKeypad}
                onToggleChecklistItem={toggleChecklistItem}
              />

              <ReturnThermalSticker
                preparacaoAtual={preparacaoAtual}
                itemAtual={itemAtual}
                operator={operator}
                returnVolume={returnVolume}
                saldo={saldo}
                allChecked={allChecked}
                isZeroVolume={isZeroVolume}
                itemJaResolvido={itemJaResolvido}
                isProcessing={isProcessing}
                progresso={progresso}
                onSelectNextPending={(id) => setSelectedItemId(id)}
                onConfirmComponentReturn={handleConfirmComponentReturn}
                onConfirmEmptyContainer={handleConfirmEmptyContainer}
                onMarkConference={handleMarkConference}
                onDiscardComponent={handleDiscardComponent}
                onMarkStickerPrinted={onMarkStickerPrinted}
                showToast={showToast}
              />
            </div>
          </>
        )}

        {/* ABA 2: CONFERÊNCIA TÉCNICA */}
        {viewMode === 'conferencia' && (
          <ReturnConferenceTab
            preparacoesEmConferencia={preparacoesEmConferencia}
            isProcessing={isProcessing}
            onRegisterItemReturn={onRegisterItemReturn}
          />
        )}

        {/* ABA 3: HISTÓRICO */}
        {viewMode === 'historico' && (
          <ReturnHistoryTab
            preparacoesHistorico={preparacoesHistorico}
            residuosMistura={residuosMistura}
          />
        )}
      </div>

      {/* Modal de Teclado Numérico */}
      {isKeypadOpen && itemAtual && (
        <ReturnKeypadModal
          isOpen={isKeypadOpen}
          itemAtual={itemAtual}
          keypadBuffer={keypadBuffer}
          onDigit={handleKeypadDigit}
          onBackspace={handleKeypadBackspace}
          onClear={handleKeypadClear}
          onConfirm={handleKeypadConfirm}
          onClose={() => setIsKeypadOpen(false)}
        />
      )}

      {/* Barra Inferior Fixa */}
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
