import React, { useState, useMemo, useEffect } from 'react';
import QRCode from 'qrcode';
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
import { BeakerVisualizer } from '../components/ui/BeakerVisualizer';
import { NumericKeypad } from '../components/ui/NumericKeypad';
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
  onFinishApplication?: () => Promise<void>;
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

  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(loteGeradoPreview, {
      width: 140,
      margin: 1,
      color: { dark: '#0F172A', light: '#FFFFFF' },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        // Ignora erro de geração em ambiente de teste
      });
    return () => {
      active = false;
    };
  }, [loteGeradoPreview]);

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

  // Impressão complementar de etiqueta térmica Zebra ZT410 (100x50mm com QR Code real)
  const handlePrintComponentSticker = async () => {
    if (!preparacaoAtual || !itemAtual) return;
    if (onMarkStickerPrinted) {
      await onMarkStickerPrinted(preparacaoAtual.id, itemAtual.id);
    }

    try {
      const printWin = window.open('', '_blank', 'width=520,height=360');
      if (printWin) {
        printWin.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Etiqueta Térmica ${codigoEtiquetaPreview}</title>
  <style>
    @page { size: 100mm 50mm; margin: 0; }
    body {
      margin: 0;
      padding: 10px 14px;
      font-family: Arial, Helvetica, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      box-sizing: border-box;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0F172A;
      padding-bottom: 4px;
      margin-bottom: 6px;
    }
    .title { font-size: 13px; font-weight: 800; letter-spacing: 0.04em; }
    .sub { font-size: 9px; color: #475569; }
    .stamp {
      font-size: 9px;
      font-weight: 800;
      border: 1.5px solid #0F172A;
      padding: 2px 5px;
      border-radius: 4px;
    }
    .fefo-bar {
      background: #FEF3C7;
      border: 1px solid #D97706;
      font-size: 9px;
      font-weight: 800;
      text-align: center;
      padding: 2px 4px;
      margin-bottom: 6px;
    }
    .grid {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }
    .info p {
      margin: 2px 0;
      font-size: 10px;
    }
    .qr-col {
      text-align: center;
    }
    .qr-col img {
      width: 72px;
      height: 72px;
      display: block;
      margin: 0 auto;
    }
    .qr-code-txt {
      font-size: 9px;
      font-weight: 800;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">MADA MARCENARIA • QUÍMICOS</div>
      <div class="sub">RASTREABILIDADE FEFO • ${preparacaoAtual.id}</div>
    </div>
    <div class="stamp">${allChecked ? 'HOMOLOGADO ESTOQUE' : 'CONFERÊNCIA'}</div>
  </div>
  <div class="fefo-bar">PRIORIDADE FEFO: CONSUMIR ANTES DE VIOLAR LATAS LACRADAS</div>
  <div class="grid">
    <div class="info">
      <p><strong>PRODUTO:</strong> ${itemAtual.produtoNome}</p>
      <p><strong>SALDO RESTANTE:</strong> <strong>${returnVolume} ml</strong> (± ${saldo.pesoEstimadoGramas}g)</p>
      <p><strong>LOTE ORIGEM:</strong> ${itemAtual.loteCodigo}</p>
      <p><strong>LOTE SOBRA:</strong> ${loteGeradoPreview}</p>
      <p><strong>ORIGEM:</strong> ${preparacaoAtual.ordemServicoNumero} (${preparacaoAtual.ambienteNome})</p>
      <p><strong>OPERADOR:</strong> ${itemAtual.avaliadoPorNome || operator.nome} • ${dataFormatada}</p>
    </div>
    <div class="qr-col">
      ${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR Code" />` : ''}
      <div class="qr-code-txt">${codigoEtiquetaPreview}</div>
    </div>
  </div>
  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`);
        printWin.document.close();
      }
    } catch {
      // Fallback caso o bloqueador de popups impeça a janela de impressão
    }

    showToast(
      `🖨️ Etiqueta térmica ${codigoEtiquetaPreview} enviada para impressão (${itemAtual.produtoNome})!`,
      'info'
    );
  };

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
            {/* Barra de Progresso e Seleção dos 4 Componentes da Preparação (No padrão visual da Dosagem) */}
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
                          : 'rgba(255, 255, 255, 0.08)'
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

            {/* Área Principal 2 Colunas: Esquerda (Card no padrão do Béquer + Checklist) | Direita (Etiqueta Térmica + Destino) */}
            <div className="return-layout">
              {/* Coluna Esquerda: Embalagem em Foco no mesmo padrão de DosingCard + BeakerVisualizer */}
              <article
                className={`dosing-card ${
                  itemAtual.status === 'DESCARTADO_COMO_REFUGO'
                    ? 'is-exceeded'
                    : allChecked || isZeroVolume
                    ? 'is-within'
                    : 'is-under'
                } ${itemAtual.papel.toLowerCase().includes('catalisador') ? 'is-catalyst' : ''}`}
                style={{ justifyContent: 'flex-start', gap: '10px' }}
              >
                {/* 1. Cabeçalho Idêntico ao Card de Dosagem */}
                <div className="dosing-card-header">
                  <div className="dosing-card-title-group">
                    <span className="dosing-step-badge">
                      {preparacaoAtual.itensDevolucao.findIndex((i) => i.id === itemAtual.id) + 1}
                    </span>
                    <div>
                      <h3 className="dosing-chem-name">{itemAtual.produtoNome}</h3>
                      <div className="dosing-chem-code">
                        <span>Cód: {itemAtual.codigoProduto}</span>
                        <span>•</span>
                        <span>Lote: {itemAtual.loteCodigo}</span>
                        <span>•</span>
                        <span>Emb: {itemAtual.embalagemId || itemAtual.loteCodigo}</span>
                      </div>
                    </div>
                  </div>

                  <div className="dosing-target-box">
                    <span className="os-meta-badge os-meta-badge--neutral">
                      Retirado: {itemAtual.quantidadeRetiradaMl.toLocaleString('pt-BR')} ml
                    </span>
                    <div className="dosing-target-weight">
                      Saldo inicial: {maxVolume.toLocaleString('pt-BR')} ml
                    </div>
                  </div>
                </div>

                {/* Alerta quando o produto não possui configuração técnica homologada */}
                {avaliacaoChecklist.requerHomologacaoTecnica && !isZeroVolume && (
                  <div
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: 'rgba(245, 158, 11, 0.14)',
                      border: '1px solid rgba(245, 158, 11, 0.45)',
                      color: '#FBBF24',
                      fontSize: '13px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <FileWarning size={15} />
                    <span>
                      Parâmetros específicos pendentes de homologação pelo responsável técnico. Usando checklist padrão.
                    </span>
                  </div>
                )}

                {/* 2. Linha Central de Controles Idêntica à Dosagem (BeakerVisualizer + Botões Quadrados + Visor Central Tátil) */}
                <div className="dosing-controls-row">
                  <BeakerVisualizer
                    value={returnVolume}
                    target={maxVolume}
                    toleranceMax={maxVolume}
                    isExceeded={itemAtual.status === 'DESCARTADO_COMO_REFUGO'}
                    isWithin={allChecked || isZeroVolume}
                    isCatalyst={itemAtual.papel.toLowerCase().includes('catalisador')}
                    markerLabel="LATA"
                    unitLabel={isZeroVolume ? 'Esgotada' : allChecked ? 'Aprovada' : 'Sobra'}
                  />

                  <button
                    type="button"
                    className="dosing-control-btn"
                    onClick={() => adjustVolume(-50)}
                    disabled={itemJaResolvido || returnVolume <= 0}
                    aria-label="Diminuir 50 ml"
                  >
                    −
                  </button>

                  <div
                    className="dosing-value-display"
                    onClick={handleOpenKeypad}
                    role="button"
                    tabIndex={0}
                    title="Toque para digitar o saldo restante no teclado numérico"
                  >
                    <div className="dosing-val-num-row">
                      <CountNumber value={returnVolume} className="dosing-val-num" />
                      <span className="dosing-val-unit">ml</span>
                    </div>
                    <span className="dosing-val-sub">
                      {returnVolume > 0
                        ? `~ ${saldo.pesoEstimadoGramas} g restantes • Toque p/ digitar`
                        : '0 ml (Sem sobra) • Toque p/ digitar'}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="dosing-control-btn"
                    onClick={() => adjustVolume(50)}
                    disabled={itemJaResolvido || returnVolume >= maxVolume}
                    aria-label="Aumentar 50 ml"
                  >
                    +
                  </button>
                </div>

                {/* 3. Atalhos Rápidos no mesmo padrão dos chips da Dosagem */}
                {!itemJaResolvido && (
                  <div className="dosing-shortcuts-row">
                    <button
                      type="button"
                      className="dosing-shortcut-chip"
                      onClick={() => adjustVolume(50)}
                    >
                      +50 ml
                    </button>
                    <button
                      type="button"
                      className="dosing-shortcut-chip chip-target"
                      onClick={() => setExactVolume(itemAtual.saldoRestanteInformadoMl)}
                    >
                      Saldo Sugerido ({itemAtual.saldoRestanteInformadoMl} ml)
                    </button>
                    <button
                      type="button"
                      className="dosing-shortcut-chip"
                      onClick={() => setExactVolume(0)}
                      style={
                        isZeroVolume
                          ? {
                              borderColor: 'var(--ok)',
                              color: '#4ade80',
                              background: 'rgba(16, 185, 129, 0.14)',
                            }
                          : undefined
                      }
                    >
                      Lata Esgotou / Sem Sobra (0 ml)
                    </button>
                  </div>
                )}

                {/* 4. Barra de Status Inferior no mesmo padrão do DosingCard */}
                <div
                  className={`dosing-status-bar ${
                    itemAtual.status === 'DESCARTADO_COMO_REFUGO'
                      ? 'status-exceeded'
                      : allChecked || isZeroVolume
                      ? 'status-within'
                      : 'status-under'
                  }`}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {isZeroVolume ? (
                      <>
                        <Check size={14} strokeWidth={2.6} /> Embalagem esgotada (0 ml) — pronta para baixa direta
                      </>
                    ) : allChecked ? (
                      <>
                        <Check size={14} strokeWidth={2.6} /> Checklist aprovado ({criteriosProduto.length}/{criteriosProduto.length}) — liberado p/ estoque
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={14} strokeWidth={2.4} /> Checklist pendente ({criteriosProduto.length - avaliacaoChecklist.criteriosPendentes.length}/{criteriosProduto.length})
                      </>
                    )}
                  </span>
                  <span>Capacidade máx: {maxVolume} ml</span>
                </div>

                {/* 5. Quando o saldo restante é 0 ml (não teve sobra), dispensa o checklist e orienta a baixa direta */}
                {isZeroVolume ? (
                  <div
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      background: 'rgba(16, 185, 129, 0.10)',
                      border: '1px solid rgba(16, 185, 129, 0.40)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4ADE80', fontWeight: 800, fontSize: '15px' }}>
                      <PackageCheck size={18} strokeWidth={2.4} />
                      <span>Embalagem Esgotada • Nenhuma sobra física (0 ml)</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      Todo o volume desta embalagem ({itemAtual.quantidadeRetiradaMl} ml) foi consumido na preparação. Não há sobra para retornar à prateleira nem necessidade de preencher o checklist.
                    </p>
                  </div>
                ) : (
                  /* Checklist de Integridade Química Homologado por Produto (somente quando há sobra > 0 ml) */
                  <div className="checklist-container" style={{ marginTop: '2px' }}>
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
                          ? '✓ Aprovado p/ estoque'
                          : `Pendente (${criteriosProduto.length - avaliacaoChecklist.criteriosPendentes.length}/${criteriosProduto.length})`}
                      </span>
                    </div>

                    {criteriosProduto.map((item) => (
                      <div
                        key={item.id}
                        className={`checklist-row-card ${checklist[item.id] ? 'checked' : ''}`}
                        onClick={() => toggleChecklistItem(item.id)}
                        style={{ minHeight: '48px', padding: '6px 12px' }}
                      >
                        <div className="checklist-checkbox-box" style={{ width: '28px', height: '28px', fontSize: '15px' }}>
                          ✓
                        </div>
                        <span className="checklist-label" style={{ fontSize: '14px' }}>
                          {item.label}
                        </span>
                      </div>
                    ))}

                    {!allChecked && avaliacaoChecklist.motivoReprovacao && (
                      <div
                        style={{
                          marginTop: '2px',
                          padding: '7px 12px',
                          borderRadius: '8px',
                          background: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          color: '#FCA5A5',
                          fontSize: '13px',
                          fontWeight: 600,
                        }}
                      >
                        ⚠️ Bloqueio de estoque: {avaliacaoChecklist.motivoReprovacao}
                      </div>
                    )}
                  </div>
                )}
              </article>

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
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt={`QR Code escaneável ${loteGeradoPreview}`}
                          style={{
                            width: '76px',
                            height: '76px',
                            display: 'block',
                            borderRadius: '4px',
                          }}
                        />
                      ) : (
                        <svg viewBox="0 0 100 100" fill="black">
                          <path d="M0 0h30v30H0zm5 5h20v20H5zm35-5h30v30H40zm5 5h20v20H45zM0 40h30v30H0zm5 5h20v20H5zm45 5h10v10H50zm15 0h15v15H65zm0 25h10v10H65zm-25 0h10v10H40zm15 15h10v10H55z" />
                        </svg>
                      )}
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

      {/* Modal de Teclado Numérico Direto (NumericKeypad idêntico à Dosagem em Béquer) */}
      {isKeypadOpen && itemAtual && (
        <div
          className="ds-modal-backdrop"
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 90,
            padding: '16px',
            boxSizing: 'border-box',
          }}
        >
          <div
            className="ds-modal-card ds-modal-standard"
            style={{
              maxWidth: '440px',
              width: '100%',
              backgroundColor: 'var(--card)',
              border: '1.5px solid var(--border)',
              borderRadius: '20px',
              padding: '20px 24px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--text)', fontWeight: 700 }}>
                  Digitar Saldo Restante
                </h3>
                <span style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
                  {itemAtual.produtoNome} ({itemAtual.loteCodigo})
                </span>
              </div>
              <button
                type="button"
                className="ds-modal-close-btn"
                onClick={() => setIsKeypadOpen(false)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                height: '74px',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '2px solid var(--primary)',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '44px',
                fontWeight: 800,
                color: 'var(--text)',
                marginBottom: '16px',
              }}
            >
              {keypadBuffer || '0'}{' '}
              <span
                style={{
                  fontSize: '22px',
                  color: 'var(--text-muted)',
                  marginLeft: '8px',
                  fontWeight: 600,
                }}
              >
                ml
              </span>
            </div>

            <NumericKeypad
              onDigit={handleKeypadDigit}
              onBackspace={handleKeypadBackspace}
              onClear={handleKeypadClear}
              onConfirm={handleKeypadConfirm}
              confirmLabel="Salvar Saldo"
            />
          </div>
        </div>
      )}

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
