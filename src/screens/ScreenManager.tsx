import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  FlaskConical,
  Target,
  RotateCcw,
  Ruler,
  Lightbulb,
  CheckCircle2,
  Check,
  AlertTriangle,
  ClipboardCheck,
  Beaker,
  Trash2,
  PackageCheck,
} from 'lucide-react';
import { KpiCard } from '../components/ui/KpiCard';
import { DataTable } from '../components/ui/DataTable';
import { CountNumber } from '../components/ui/CountNumber';
import { ScrubChart, ScrubDataPoint } from '../components/ui/ScrubChart';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Button } from '../components/ui/Button';
import {
  ScreenId,
  Operador,
  Movimentacao,
  Lote,
  Preparacao,
  ResiduoMisturaOcorrencia,
  StatusItemDevolucao,
} from '../types';
import { MOCK_OPERADORES, MOCK_ORDENS_SERVICO, MOCK_LOTES, MOCK_RECEITAS } from '../data';
import { ORIENTACAO_NEUTRA_POT_LIFE_EXPIRADO } from '../domain/potLife';

interface ScreenManagerProps {
  onNavigate: (screen: ScreenId) => void;
  operator: Operador;
  showToast: (msg: string, type?: 'info' | 'success' | 'warn' | 'danger') => void;
  movimentacoes?: Movimentacao[];
  lotes?: Lote[];
  preparacoes?: Preparacao[];
  preparacoesEmConferencia?: Preparacao[];
  residuosMistura?: ResiduoMisturaOcorrencia[];
  procedimentosPotLife?: Record<number, string>;
  onSaveProcedimentoPotLife?: (receitaId: number, procedimento: string) => void;
  onResolveConferenceItem?: (params: {
    preparacaoId: string;
    itemId: string;
    saldoRestanteMl: number;
    destino: Exclude<StatusItemDevolucao, 'PENDENTE'>;
    checklistAprovado: Record<string, boolean>;
    motivoManual?: string;
    aprovacaoConferenciaTecnica?: boolean;
  }) => Promise<void>;
  onResetDemoData?: () => Promise<void>;
}

interface RowOSConsumo {
  id: string;
  os: string;
  cliente: string;
  ambiente: string;
  operador: string;
  acabamento: string;
  previstoMl: number;
  realMl: number;
  custoTotal: number;
  status: 'conforme' | 'alerta';
  data: string;
  justificativa?: string;
  isLive?: boolean;
}

const HISTORICO_CONSUMO_MOCK: RowOSConsumo[] = [
  {
    id: '1',
    os: 'OS #8841',
    cliente: 'Residência Fontana',
    ambiente: 'Cozinha Gourmet',
    operador: 'Carlos Silva',
    acabamento: 'Primer Fundo Branco PU (Ref: 24322)',
    previstoMl: 1000,
    realMl: 1040,
    custoTotal: 175.75,
    status: 'conforme',
    data: '29/10/2026',
  },
  {
    id: '2',
    os: 'OS #8842',
    cliente: 'Apartamento Jardins',
    ambiente: 'Suíte Master',
    operador: 'Ana Souza',
    acabamento: 'Laca Branca Fosca 20 Gloss',
    previstoMl: 800,
    realMl: 890,
    custoTotal: 160.20,
    status: 'alerta',
    data: '28/10/2026',
    justificativa: 'Correção de viscosidade • Autorizado por Supervisor Fábio',
  },
  {
    id: '3',
    os: 'OS #8843',
    cliente: 'Residência Alphaville',
    ambiente: 'Living / Painel TV',
    operador: 'Marcos Lima',
    acabamento: 'Verniz PU Alto Brilho 4:1',
    previstoMl: 1500,
    realMl: 1480,
    custoTotal: 222.00,
    status: 'conforme',
    data: '27/10/2026',
  },
  {
    id: '4',
    os: 'OS #8844',
    cliente: 'Vila Nova Conceição',
    ambiente: 'Closet Casal',
    operador: 'Carlos Silva',
    acabamento: 'Primer Fundo Branco PU (Ref: 24322)',
    previstoMl: 1200,
    realMl: 1210,
    custoTotal: 204.49,
    status: 'conforme',
    data: '26/10/2026',
  },
];

export const ScreenManager: React.FC<ScreenManagerProps> = ({
  onNavigate,
  operator,
  showToast,
  movimentacoes = [],
  lotes = [],
  preparacoes = [],
  preparacoesEmConferencia = [],
  residuosMistura = [],
  procedimentosPotLife = {},
  onSaveProcedimentoPotLife,
  onResolveConferenceItem,
  onResetDemoData,
}) => {
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'conforme' | 'alerta'>('todos');
  const [selectedProcRecipeId, setSelectedProcRecipeId] = useState<number>(MOCK_RECEITAS[0].id);
  const [procDraft, setProcDraft] = useState<string>(
    () => procedimentosPotLife[MOCK_RECEITAS[0].id] || ''
  );
  const [periodo, setPeriodo] = useState<'7d' | '30d' | '90d'>('30d');
  const multiplicadorPeriodo = periodo === '7d' ? 0.35 : periodo === '90d' ? 2.8 : 1;

  // Relógio em tempo real (1Hz) para monitoramento ao vivo das cabines no painel executivo
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [cabine2SecRestantes, setCabine2SecRestantes] = useState<number>(14 * 60 + 25);

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
      setCabine2SecRestantes((prev) => (prev > 60 ? prev - 1 : 14 * 60 + 25));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const prepAtivaCabine1 = preparacoes.find(
    (p) =>
      (p.cabineId || 'CABINE-01').toUpperCase() === 'CABINE-01' &&
      Boolean(p.dosagemConcluidaEm) &&
      !p.aplicacaoConcluidaEm &&
      p.status !== 'PREPARACAO_ENCERRADA'
  );
  const cabine1RemainingSec = prepAtivaCabine1?.dosagemConcluidaEm
    ? Math.max(
        0,
        (prepAtivaCabine1.potLifeMinutos || 20) * 60 -
          Math.floor((nowMs - new Date(prepAtivaCabine1.dosagemConcluidaEm).getTime()) / 1000)
      )
    : null;
  const cabine1TotalSec = (prepAtivaCabine1?.potLifeMinutos || 20) * 60;

  const prepAtivaCabine2 = preparacoes.find(
    (p) =>
      (p.cabineId || '').toUpperCase() === 'CABINE-02' &&
      Boolean(p.dosagemConcluidaEm) &&
      !p.aplicacaoConcluidaEm &&
      p.status !== 'PREPARACAO_ENCERRADA'
  );
  const cabine2RealSec = prepAtivaCabine2?.dosagemConcluidaEm
    ? Math.max(
        0,
        (prepAtivaCabine2.potLifeMinutos || 25) * 60 -
          Math.floor((nowMs - new Date(prepAtivaCabine2.dosagemConcluidaEm).getTime()) / 1000)
      )
    : cabine2SecRestantes;
  const cabine2TotalSec = (prepAtivaCabine2?.potLifeMinutos || 25) * 60;

  const formatMmSs = (sec: number) => {
    const s = Math.max(0, Math.floor(sec));
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  // Converte movimentações reais registradas na sessão em linhas de auditoria no topo
  const todosLotes = lotes.length > 0 ? lotes : MOCK_LOTES;
  const linhasAoVivo: RowOSConsumo[] = movimentacoes.map((mov, idx) => {
    const osRef = MOCK_ORDENS_SERVICO.find((o) => o.id === mov.ordemServicoId) || MOCK_ORDENS_SERVICO[0];
    const opRef = MOCK_OPERADORES.find((o) => o.id === mov.operadorId) || operator;
    const loteRef = todosLotes.find((l) => l.id === mov.loteId);
    const isDescarte = mov.tipo === 'DESCARTE';
    const isDevolucao = mov.tipo === 'DEVOLUCAO';
    const hasJustification = Boolean(mov.justificativa && !isDevolucao);
    const previsto = isDevolucao ? mov.quantidade : isDescarte ? 0 : mov.quantidade;
    const custoMl = 0.16;

    return {
      id: `live-${mov.id || idx}-${mov.registradaEm}`,
      os: `${osRef.numero} • AO VIVO`,
      cliente: osRef.clienteNome,
      ambiente: osRef.ambienteNome,
      operador: opRef.nome,
      acabamento: isDevolucao
        ? `↺ DEVOLUÇÃO SOBRA: ${loteRef?.produtoNome || 'Insumo Químico'}`
        : isDescarte
        ? `⚠ REFUGO: ${mov.justificativa || 'Descarte químico'}`
        : `${loteRef?.produtoNome || 'Componente Dosado'} (${loteRef?.codigo || 'FEFO'})`,
      previstoMl: previsto,
      realMl: mov.quantidade,
      custoTotal: Number((mov.quantidade * custoMl).toFixed(2)),
      status: isDescarte || hasJustification ? 'alerta' : 'conforme',
      data: new Date(mov.registradaEm).toLocaleDateString('pt-BR'),
      justificativa: mov.justificativa
        ? `${mov.justificativa}${hasJustification ? ' • Autorizado por Supervisor Fábio' : ''}`
        : undefined,
      isLive: true,
    };
  });

  const historicoCombinado = [...linhasAoVivo, ...HISTORICO_CONSUMO_MOCK];

  // Cálculos consolidados dinâmicos (ajustados pelo período selecionado)
  const baseRealMl = historicoCombinado.reduce((acc, r) => acc + r.realMl, 0) * multiplicadorPeriodo;
  const totalRealLitrosNum = Math.round(baseRealMl / 100) / 10;
  const totalCustoRealNum = Math.round(historicoCombinado.reduce((acc, r) => acc + r.custoTotal, 0) * multiplicadorPeriodo);
  const totalPrevistoMl = historicoCombinado.reduce((acc, r) => acc + r.previstoMl, 0);
  const totalRealMl = historicoCombinado.reduce((acc, r) => acc + r.realMl, 0);
  const taxaVariacaoNum = totalPrevistoMl > 0
    ? Number((((totalRealMl - totalPrevistoMl) / totalPrevistoMl) * 100).toFixed(1))
    : 0;

  const totalLatasSobra = Math.max(1, Math.round(7 * multiplicadorPeriodo)) + movimentacoes.filter((m) => m.tipo === 'DEVOLUCAO').length;
  const economiaSobrasNum = Math.round(
    412 * multiplicadorPeriodo +
      movimentacoes.filter((m) => m.tipo === 'DEVOLUCAO').reduce((acc, m) => acc + m.quantidade * 0.14, 0)
  );
  const custoM2Num = periodo === '7d' ? 17 : periodo === '90d' ? 19 : 18;

  const dadosFiltrados = historicoCombinado.filter((r) => {
    if (filtroStatus === 'conforme') return r.status === 'conforme';
    if (filtroStatus === 'alerta') return r.status === 'alerta';
    return true;
  });

  // Pontos cronológicos para o gráfico interativo de Scrub (do mais antigo para o mais recente)
  const pontosGrafico: ScrubDataPoint[] = [...historicoCombinado]
    .reverse()
    .map((r) => ({
      label: `${r.data.slice(0, 5)} • ${r.os.replace(' • AO VIVO', '')}`,
      sublabel: `${r.cliente} (${r.ambiente}) — ${r.operador}`,
      valueMl: Math.round(r.realMl * multiplicadorPeriodo),
      targetMl: Math.round((r.previstoMl > 0 ? r.previstoMl : r.realMl) * multiplicadorPeriodo),
      cost: Number((r.custoTotal * multiplicadorPeriodo).toFixed(2)),
    }));

  const periodLabelText =
    periodo === '7d'
      ? 'Últimos 7 dias'
      : periodo === '90d'
      ? 'Último trimestre'
      : 'Últimos 30 dias';

  const handleExportarRelatorio = () => {
    const csvContent = [
      'OS,Cliente,Ambiente,Operador,Acabamento,Volume Previsto (ml),Volume Real (ml),Custo Real (R$),Status,Data',
      ...dadosFiltrados.map(
        (r) =>
          `"${r.os}","${r.cliente}","${r.ambiente}","${r.operador}","${r.acabamento}",${r.previstoMl},${r.realMl},${r.custoTotal},"${r.status}","${r.data}"`
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_consumo_mada_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Relatório executivo exportado em CSV com sucesso!', 'success');
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '90px' }}>
      {/* 1. Header do Painel */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '20px 28px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)',
              color: '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            <BarChart3 size={26} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--text)' }}>
                Painel do Gestor — Auditoria de Químicos
              </h2>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10B981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                Visão Executiva • Fábio
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
              Comparativo de Previsto vs. Realizado por Ordem de Serviço, auditoria de refugos e custeio real da cabine.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          {/* Controle Segmentado de Período (GSAP Sliding Pill) */}
          <SegmentedControl<'7d' | '30d' | '90d'>
            ariaLabel="Período de análise"
            value={periodo}
            onChange={(val) => setPeriodo(val)}
            options={[
              { id: '7d', label: '7 Dias', tone: 'primary' },
              { id: '30d', label: '30 Dias', tone: 'primary' },
              { id: '90d', label: 'Trimestre', tone: 'primary' },
            ]}
            style={{ background: 'var(--bg)' }}
          />
          {onResetDemoData && (
            <button
              type="button"
              onClick={onResetDemoData}
              style={{
                minHeight: '52px',
                padding: '0 18px',
                background: 'var(--bg)',
                color: 'var(--text-muted)',
                border: '1.5px solid var(--border)',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'inherit',
              }}
              title="Restaurar saldos e histórico padrão de demonstração"
            >
              <RotateCcw size={18} strokeWidth={2.2} /> Restaurar Demo
            </button>
          )}
          <button
            type="button"
            onClick={handleExportarRelatorio}
            style={{
              minHeight: '52px',
              padding: '0 20px',
              background: 'var(--card-hover)',
              color: 'var(--text)',
              border: '1.5px solid var(--border)',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'inherit',
            }}
          >
            <Download size={18} strokeWidth={2.4} /> Exportar CSV
          </button>
          <button
            type="button"
            onClick={() => onNavigate('inventory')}
            style={{
              minHeight: '52px',
              padding: '0 20px',
              background: 'rgba(59, 130, 246, 0.14)',
              color: '#60A5FA',
              border: '1.5px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'inherit',
            }}
          >
            <PackageCheck size={18} strokeWidth={2.4} /> Estoque & Compras
          </button>
          <button
            type="button"
            onClick={() => onNavigate('auth')}
            style={{
              minHeight: '52px',
              padding: '0 20px',
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Trocar Perfil / Sair →
          </button>
        </div>
      </div>

      {/* 1.5. Monitoramento Ao Vivo — Chão de Fábrica (Cabines 01 e 02 em Tempo Real) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Card Cabine 01 — Carlos Silva */}
        <div
          style={{
            background: 'var(--card)',
            border: prepAtivaCabine1
              ? '1.5px solid rgba(16, 185, 129, 0.45)'
              : '1px solid var(--border)',
            borderRadius: '16px',
            padding: '18px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: prepAtivaCabine1 ? '#10B981' : '#3B82F6',
                  boxShadow: prepAtivaCabine1 ? '0 0 10px #10B981' : '0 0 8px #3B82F6',
                }}
              />
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)' }}>
                  Cabine 01 — Pintura Principal
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Pintor Líder: <strong style={{ color: 'var(--text)' }}>Carlos Silva</strong>
                </div>
              </div>
            </div>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 800,
                background: prepAtivaCabine1
                  ? 'rgba(16, 185, 129, 0.14)'
                  : 'rgba(59, 130, 246, 0.12)',
                border: prepAtivaCabine1
                  ? '1px solid rgba(16, 185, 129, 0.35)'
                  : '1px solid rgba(59, 130, 246, 0.3)',
                color: prepAtivaCabine1 ? '#34D399' : '#60A5FA',
              }}
            >
              {prepAtivaCabine1 ? '● EM APLICAÇÃO AO VIVO' : '● LIVRE P/ NOVA PREPARAÇÃO'}
            </span>
          </div>

          {prepAtivaCabine1 && cabine1RemainingSec !== null ? (
            <>
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                    {prepAtivaCabine1.ordemServicoNumero} • {prepAtivaCabine1.clienteNome} (
                    {prepAtivaCabine1.ambienteNome})
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {prepAtivaCabine1.receitaNome} • {prepAtivaCabine1.volumeTotal} ml no béquer
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      color: '#34D399',
                    }}
                  >
                    {formatMmSs(cabine1RemainingSec)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pot Life restante</div>
                </div>
              </div>
              <div
                style={{
                  height: '6px',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.08)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, Math.max(5, (cabine1RemainingSec / cabine1TotalSec) * 100))}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #10B981, #34D399)',
                    transition: 'width 0.8s linear',
                  }}
                />
              </div>
            </>
          ) : (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px dashed var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                  Próxima fila programada: OS #8841 • Residência Fontana
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Cozinha Gourmet • Laca Branca Fosca PU 20 Gloss
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('os')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.14)',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  color: '#60A5FA',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Iniciar dosagem →
              </button>
            </div>
          )}
        </div>

        {/* Card Cabine 02 — Ana Souza (Sempre Ao Vivo na Demonstração) */}
        <div
          style={{
            background: 'var(--card)',
            border: '1.5px solid rgba(16, 185, 129, 0.45)',
            borderRadius: '16px',
            padding: '18px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#10B981',
                  boxShadow: '0 0 10px #10B981',
                }}
              />
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)' }}>
                  Cabine 02 — Linha Verniz & Especiais
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Aplicadora PU: <strong style={{ color: 'var(--text)' }}>Ana Souza</strong>
                </div>
              </div>
            </div>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 800,
                background: 'rgba(16, 185, 129, 0.14)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#34D399',
              }}
            >
              ● EM APLICAÇÃO AO VIVO
            </span>
          </div>

          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                OS #8842 • Apartamento Jardins (Home Theater — Painel Ripado Freijó)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Verniz PU Alto Brilho 4:1 • 1.200 ml dosados na bancada
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: '#34D399',
                }}
              >
                {formatMmSs(cabine2RealSec)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pot Life restante</div>
            </div>
          </div>

          <div
            style={{
              height: '6px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.08)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, Math.max(5, (cabine2RealSec / cabine2TotalSec) * 100))}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #10B981, #34D399)',
                transition: 'width 0.8s linear',
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. Bento Grid de 4 KPIs Gerenciais (Stat Tiles com CountNumber e Hierarquia Hero) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <KpiCard
          isHero={true}
          label="Economia com Sobras (FEFO)"
          value={<CountNumber value={economiaSobrasNum} format={(n) => `R$ ${Math.round(n).toLocaleString('pt-BR')}`} />}
          changeText={`${totalLatasSobra} latas reintegradas com etiqueta QR`}
          changeStatus="ok"
          icon={<RotateCcw size={22} color="#10B981" strokeWidth={2.4} />}
        />
        <KpiCard
          label="Volume Químico Apontado"
          value={<CountNumber value={Math.round(totalRealLitrosNum * 10)} format={(n) => (n / 10).toFixed(1).replace('.', ',')} />}
          unit="Litros"
          changeText={`R$ ${totalCustoRealNum.toLocaleString('pt-BR')} em químicos no período`}
          changeStatus="ok"
          icon={<FlaskConical size={22} color="#3B82F6" strokeWidth={2.4} />}
        />
        <KpiCard
          label="Variação Previsto vs Real"
          value={
            <CountNumber
              value={Math.round(taxaVariacaoNum * 10)}
              format={(n) => `${n >= 0 ? '+' : ''}${(n / 10).toFixed(1).replace('.', ',')}%`}
            />
          }
          changeText="Meta SMART: manter abaixo de +5%"
          changeStatus={taxaVariacaoNum <= 5 ? 'ok' : 'warn'}
          icon={<Target size={22} color="#10B981" strokeWidth={2.4} />}
        />
        <KpiCard
          label="Custo Médio / m² Pintado"
          value={<CountNumber value={custoM2Num} format={(n) => `R$ ${Math.round(n)},20`} />}
          unit="/ m²"
          changeText="Base: Primer Branco + Laca PU"
          changeStatus="ok"
          icon={<Ruler size={22} color="#F59E0B" strokeWidth={2.4} />}
        />
      </div>

      {/* 2.5. Gráfico Interativo de Scrub (Catmull-Rom + Headline Readout com CountNumber) */}
      <ScrubChart points={pontosGrafico} periodLabel={periodLabelText} />

      {/* 3. Seção do Furo do ERP Resolvido (Destaque do Diagnóstico) */}
      <div
        style={{
          background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, rgba(20, 24, 33, 0.95) 100%)',
          border: '1.5px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '14px',
          padding: '16px 22px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981',
            }}
          >
            <Lightbulb size={22} strokeWidth={2.4} />
          </div>
          <div>
            <strong style={{ fontSize: '15px', color: '#10B981' }}>
              Integração de Saídas com o ERP Mada (OC2703 / Ergi Tintas)
            </strong>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              No ERP atual, o card "Total Saídas" registrava 0 UN (R$ 0,00). Com os apontamentos via tablet, já foram integradas{' '}
              <strong style={{ color: 'var(--text)' }}>4 Ordens de Serviço</strong> com baixa de 4,6L de insumos químicos.
            </p>
          </div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#10B981', fontWeight: 700 }}>
          <CheckCircle2 size={16} strokeWidth={2.4} /> Rastreabilidade 100% Ativa
        </span>
      </div>

      {/* 3.5. Fila de Conferência Técnica & Auditoria de Ocorrências de Pot Life */}
      {(preparacoesEmConferencia.length > 0 || residuosMistura.length > 0) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              preparacoesEmConferencia.length > 0 && residuosMistura.length > 0
                ? '1fr 1fr'
                : '1fr',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {/* Card A: Embalagens Aguardando Conferência do Supervisor */}
          {preparacoesEmConferencia.length > 0 && (
            <div
              style={{
                background: 'var(--card)',
                borderRadius: '16px',
                border: '1.5px solid rgba(59, 130, 246, 0.45)',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ClipboardCheck size={22} color="#60A5FA" />
                  <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text)' }}>
                    Fila de Conferência Técnica ({preparacoesEmConferencia.length} OS)
                  </h3>
                </div>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: 'rgba(59, 130, 246, 0.16)',
                    color: '#60A5FA',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                  }}
                >
                  Ação do Responsável Técnico
                </span>
              </div>

              {preparacoesEmConferencia.map((prep) => {
                const itens = prep.itensDevolucao.filter(
                  (it) => it.status === 'PENDENTE_DE_CONFERENCIA'
                );
                return itens.map((it) => (
                  <div
                    key={it.id}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '15px', color: 'var(--text)', display: 'block' }}>
                        {prep.ordemServicoNumero} • {it.produtoNome} ({it.loteCodigo})
                      </strong>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block' }}>
                        Saldo informado: <strong>{it.saldoRestanteInformadoMl} ml</strong> • Operador:{' '}
                        {it.responsavelMovimentacaoNome || prep.operadorNome}
                      </span>
                      {it.motivoReprovacao && (
                        <span style={{ fontSize: '12px', color: '#93C5FD', display: 'block', marginTop: '2px' }}>
                          {it.motivoReprovacao}
                        </span>
                      )}
                    </div>

                    {onResolveConferenceItem && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {it.saldoRestanteInformadoMl > 0 && (
                          <Button
                            variant="primary"
                            size="md"
                            onClick={() =>
                              onResolveConferenceItem({
                                preparacaoId: prep.id,
                                itemId: it.id,
                                saldoRestanteMl: it.saldoRestanteInformadoMl,
                                destino: 'DEVOLVIDO_AO_ESTOQUE',
                                checklistAprovado: it.checklistAprovado || {},
                                aprovacaoConferenciaTecnica: true,
                              })
                            }
                            style={{ background: '#10B981', borderColor: '#10B981', fontSize: '14px', minHeight: '44px', padding: '0 14px' }}
                          >
                            <Check size={15} /> Aprovar ({it.saldoRestanteInformadoMl} ml)
                          </Button>
                        )}

                        <Button
                          variant="secondary"
                          size="md"
                          onClick={() =>
                            onResolveConferenceItem({
                              preparacaoId: prep.id,
                              itemId: it.id,
                              saldoRestanteMl: 0,
                              destino: 'EMBALAGEM_ESGOTADA',
                              checklistAprovado: it.checklistAprovado || {},
                              motivoManual: 'Baixado pelo gestor como embalagem sem sobra (0 ml)',
                            })
                          }
                          style={{ fontSize: '14px', minHeight: '44px', padding: '0 14px' }}
                        >
                          <PackageCheck size={15} /> Sem Sobra (0 ml)
                        </Button>

                        <Button
                          variant="danger"
                          size="md"
                          onClick={() =>
                            onResolveConferenceItem({
                              preparacaoId: prep.id,
                              itemId: it.id,
                              saldoRestanteMl: it.saldoRestanteInformadoMl,
                              destino: 'DESCARTADO_COMO_REFUGO',
                              checklistAprovado: it.checklistAprovado || {},
                              motivoManual: 'Reprovado na conferência técnica pelo gestor',
                            })
                          }
                          style={{ fontSize: '14px', minHeight: '44px', padding: '0 14px' }}
                        >
                          <Trash2 size={15} /> Descartar
                        </Button>
                      </div>
                    )}
                  </div>
                ));
              })}
            </div>
          )}

          {/* Card B: Ocorrências de Pot Life & Resíduos de Mistura Pronta */}
          {residuosMistura.length > 0 && (
            <div
              style={{
                background: 'var(--card)',
                borderRadius: '16px',
                border: '1.5px solid rgba(245, 158, 11, 0.45)',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Beaker size={22} color="#FBBF24" />
                  <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text)' }}>
                    Ocorrências de Pot Life / Mistura ({residuosMistura.length})
                  </h3>
                </div>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: 'rgba(245, 158, 11, 0.16)',
                    color: '#FBBF24',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                  }}
                >
                  Monitoramento de Cabine
                </span>
              </div>

              {residuosMistura.slice(0, 4).map((oc) => (
                <div
                  key={oc.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    fontSize: '14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <strong style={{ color: 'var(--text)' }}>
                      {oc.ordemServicoNumero} • {oc.receitaNome} ({oc.cabineId})
                    </strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(oc.registradaEm).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                    Local: <strong>{oc.localMistura.toUpperCase()}</strong>
                    {oc.quantidadeRestanteMl !== undefined ? ` • Restante: ${oc.quantidadeRestanteMl} ml` : ''} •
                    Status Pot Life: <strong>{oc.situacaoPotLife}</strong> • Pintor: {oc.operadorNome}
                  </span>
                  <span style={{ color: '#FDE68A', display: 'block', marginTop: '4px', fontSize: '13px' }}>
                    Ocorrência: {oc.ocorrenciaRelacionada}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3.5. Homologação Técnica do Procedimento Oficial de Pot Life Expirado */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          padding: '20px 24px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text)' }}>
              Homologação Técnica — Procedimento Oficial p/ Pot Life Expirado
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
              Enquanto não houver procedimento validado pela Mada, o sistema exibe a orientação neutra de segurança.
            </p>
          </div>

          <SegmentedControl<number>
            ariaLabel="Selecionar receita para configurar procedimento de Pot Life"
            size="sm"
            value={selectedProcRecipeId}
            onChange={(id) => {
              setSelectedProcRecipeId(id);
              setProcDraft(procedimentosPotLife[id] || '');
            }}
            options={MOCK_RECEITAS.map((r) => ({
              id: r.id,
              label: r.nome.split(' ')[0] + ' ' + (r.nome.split(' ')[1] || ''),
              tone: procedimentosPotLife[r.id] ? 'ok' : 'neutral',
            }))}
            style={{ background: 'var(--bg)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={procDraft}
            onChange={(e) => setProcDraft(e.target.value)}
            placeholder={`Padrão neutro atual: "${ORIENTACAO_NEUTRA_POT_LIFE_EXPIRADO}"`}
            style={{
              flex: '1 1 360px',
              minHeight: '44px',
              padding: '0 14px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
          />
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              if (onSaveProcedimentoPotLife) {
                onSaveProcedimentoPotLife(selectedProcRecipeId, procDraft.trim());
              }
              showToast(
                procDraft.trim()
                  ? '✓ Procedimento oficial homologado atualizado para esta receita!'
                  : '✓ Restaurada orientação neutra padrão para esta receita.',
                'success'
              );
            }}
            style={{ minHeight: '44px', padding: '0 16px', fontSize: '14px' }}
          >
            <Check size={16} />
            <span>{procDraft.trim() ? 'Homologar Procedimento' : 'Manter Orientação Neutra'}</span>
          </Button>
        </div>
      </div>

      {/* 4. Tabela de Apontamentos por Ordem de Serviço (DataTable) */}
      <div style={{ background: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text)' }}>
              Apontamentos por Ordem de Serviço & Ambiente
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
              Histórico detalhado de dosagens realizadas pelos operadores na cabine.
            </p>
          </div>

          <SegmentedControl<'todos' | 'conforme' | 'alerta'>
            ariaLabel="Filtrar status de apontamentos"
            size="sm"
            value={filtroStatus}
            onChange={(val) => setFiltroStatus(val)}
            options={[
              {
                id: 'todos',
                label: `Todos (${historicoCombinado.length})`,
                tone: 'neutral',
              },
              {
                id: 'conforme',
                label: 'Conforme (<5%)',
                icon: <Check size={14} strokeWidth={2.4} />,
                tone: 'ok',
              },
              {
                id: 'alerta',
                label: 'Excesso',
                icon: <AlertTriangle size={14} strokeWidth={2.4} />,
                tone: 'danger',
              },
            ]}
            style={{ background: 'var(--bg)' }}
          />
        </div>

        <DataTable<RowOSConsumo>
          keyExtractor={(row) => row.id}
          columns={[
            {
              key: 'os',
              header: 'O.S. / Contratante',
              render: (row: RowOSConsumo) => (
                <div>
                  <strong style={{ color: 'var(--text)', display: 'block' }}>{row.os}</strong>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {row.cliente} • {row.ambiente}
                  </span>
                </div>
              ),
            },
            {
              key: 'acabamento',
              header: 'Acabamento & Produto',
              render: (row: RowOSConsumo) => (
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 600, display: 'block' }}>{row.acabamento}</span>
                  {row.justificativa && (
                    <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 600, display: 'block', marginTop: '2px' }}>
                      ↳ {row.justificativa}
                    </span>
                  )}
                </div>
              ),
            },
            {
              key: 'operador',
              header: 'Pintor',
              render: (row: RowOSConsumo) => <span>{row.operador}</span>,
            },
            {
              key: 'consumo',
              header: 'Previsto vs Real',
              render: (row: RowOSConsumo) => {
                const diff = row.realMl - row.previstoMl;
                const ratio = row.previstoMl > 0 ? Math.min(100, Math.round((row.realMl / row.previstoMl) * 100)) : 100;
                return (
                  <div style={{ minWidth: '150px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700 }}>{row.realMl} ml</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                        meta: {row.previstoMl} ml
                      </span>
                    </div>
                    <div
                      style={{
                        height: '6px',
                        width: '100%',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        overflow: 'hidden',
                        marginTop: '5px',
                      }}
                    >
                      <div
                        style={{
                          width: `${ratio}%`,
                          height: '100%',
                          background: diff > row.previstoMl * 0.05 ? '#EF4444' : '#10B981',
                        }}
                      />
                    </div>
                    {diff > 0 && (
                      <span style={{ display: 'block', fontSize: '11px', color: '#EF4444', fontWeight: 700, marginTop: '3px' }}>
                        +{diff} ml excesso
                      </span>
                    )}
                  </div>
                );
              },
            },
            {
              key: 'custoTotal',
              header: 'Custo Químico',
              render: (row: RowOSConsumo) => (
                <strong style={{ color: 'var(--primary)' }}>
                  R$ {row.custoTotal.toFixed(2)}
                </strong>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row: RowOSConsumo) => (
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-badge)',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: row.status === 'conforme' ? 'var(--ok-soft)' : 'var(--danger-soft)',
                    color: row.status === 'conforme' ? '#4ade80' : '#f87171',
                    border: `1px solid ${row.status === 'conforme' ? 'var(--ok-border)' : 'var(--danger-border)'}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {row.status === 'conforme' ? (
                    <>
                      <Check size={12} strokeWidth={2.6} /> Conforme
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={12} strokeWidth={2.6} /> Excesso
                    </>
                  )}
                </span>
              ),
            },
          ]}
          data={dadosFiltrados}
        />
      </div>

      {/* Rodapé Fixo Padronizado */}
      <footer className="os-bottom-bar-minimal">
        <div className="os-bottom-left">
          <button
            type="button"
            className="os-bar-btn os-btn-back"
            onClick={() => onNavigate('dashboard')}
          >
            ← Voltar ao Chão de Fábrica
          </button>
        </div>
        <div className="os-bottom-right">
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Logado como: <strong style={{ color: 'var(--text)' }}>{operator.nome}</strong> (Perfil: {operator.papel})
          </span>
        </div>
      </footer>
    </div>
  );
};
