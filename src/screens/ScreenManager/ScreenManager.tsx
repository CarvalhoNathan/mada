import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  RotateCcw,
  PackageCheck,
} from 'lucide-react';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { ScrubDataPoint } from '../../components/ui/ScrubChart';
import {
  MOCK_OPERADORES,
  MOCK_ORDENS_SERVICO,
  MOCK_LOTES,
} from '../../data';
import {
  RowOSConsumo,
  ScreenManagerProps,
  HISTORICO_CONSUMO_MOCK,
} from './types';
import { ManagerLiveCabins } from './ManagerLiveCabins';
import { ManagerKpiCards } from './ManagerKpiCards';
import { ManagerTechnicalAudit } from './ManagerTechnicalAudit';
import { ManagerConsolidatedTable } from './ManagerConsolidatedTable';

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
  const [periodo, setPeriodo] = useState<'7d' | '30d' | '90d'>('30d');
  const multiplicadorPeriodo = periodo === '7d' ? 0.35 : periodo === '90d' ? 2.8 : 1;

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

  // Cálculos consolidados dinâmicos
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

  // Pontos cronológicos para o gráfico interativo de Scrub
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
      ...historicoCombinado.map(
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
              color: 'var(--tint-blue)',
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

      {/* 2. Monitoramento Ao Vivo das Cabines 01 e 02 */}
      <ManagerLiveCabins preparacoes={preparacoes} onNavigate={onNavigate} />

      {/* 3. KPIs e Gráfico ScrubChart */}
      <ManagerKpiCards
        economiaSobrasNum={economiaSobrasNum}
        totalLatasSobra={totalLatasSobra}
        totalRealLitrosNum={totalRealLitrosNum}
        totalCustoRealNum={totalCustoRealNum}
        taxaVariacaoNum={taxaVariacaoNum}
        custoM2Num={custoM2Num}
        pontosGrafico={pontosGrafico}
        periodLabelText={periodLabelText}
      />

      {/* 4. Auditoria Técnica e Procedimentos de Pot Life */}
      <ManagerTechnicalAudit
        preparacoesEmConferencia={preparacoesEmConferencia}
        residuosMistura={residuosMistura}
        procedimentosPotLife={procedimentosPotLife}
        onSaveProcedimentoPotLife={onSaveProcedimentoPotLife}
        onResolveConferenceItem={onResolveConferenceItem}
        showToast={showToast}
      />

      {/* 5. Tabela Detalhada por O.S. */}
      <ManagerConsolidatedTable historicoCombinado={historicoCombinado} />

      {/* 6. Rodapé Fixo Padronizado */}
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
