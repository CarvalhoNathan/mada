import React, { useState } from 'react';
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
} from 'lucide-react';
import { KpiCard } from '../components/ui/KpiCard';
import { DataTable } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { ScreenId, Operador } from '../types';

interface ScreenManagerProps {
  onNavigate: (screen: ScreenId) => void;
  operator: Operador;
  showToast: (msg: string, type?: 'info' | 'success' | 'warn' | 'danger') => void;
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
}) => {
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'conforme' | 'alerta'>('todos');

  // Cálculos consolidados
  const totalRealLitros = (HISTORICO_CONSUMO_MOCK.reduce((acc, r) => acc + r.realMl, 0) / 1000).toFixed(1);
  const totalCustoReal = HISTORICO_CONSUMO_MOCK.reduce((acc, r) => acc + r.custoTotal, 0).toFixed(2);
  const totalPrevistoMl = HISTORICO_CONSUMO_MOCK.reduce((acc, r) => acc + r.previstoMl, 0);
  const totalRealMl = HISTORICO_CONSUMO_MOCK.reduce((acc, r) => acc + r.realMl, 0);
  const taxaVariacao = (((totalRealMl - totalPrevistoMl) / totalPrevistoMl) * 100).toFixed(1);

  const dadosFiltrados = HISTORICO_CONSUMO_MOCK.filter((r) => {
    if (filtroStatus === 'conforme') return r.status === 'conforme';
    if (filtroStatus === 'alerta') return r.status === 'alerta';
    return true;
  });

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

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleExportarRelatorio}
            style={{
              padding: '10px 18px',
              background: 'var(--card-hover)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Download size={16} strokeWidth={2.4} /> Exportar CSV
          </button>
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            style={{
              padding: '10px 18px',
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Ir para Operação Tablet →
          </button>
        </div>
      </div>

      {/* 2. Grid de 4 KPIs Gerenciais (KpiCard) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <KpiCard
          label="Total Consumido no Mês"
          value={totalRealLitros}
          unit="Litros"
          changeText={`R$ ${totalCustoReal} em químicos apontados`}
          changeStatus="ok"
          icon={<FlaskConical size={22} color="#3B82F6" strokeWidth={2.4} />}
        />
        <KpiCard
          label="Variação Previsto vs Real"
          value={`+${taxaVariacao}%`}
          changeText="Meta SMART: manter abaixo de +5%"
          changeStatus={Number(taxaVariacao) <= 5 ? 'ok' : 'warn'}
          icon={<Target size={22} color="#10B981" strokeWidth={2.4} />}
        />
        <KpiCard
          label="Economia com Sobras"
          value="R$ 412,00"
          changeText="7 latas reintegradas com etiqueta QR"
          changeStatus="ok"
          icon={<RotateCcw size={22} color="#10B981" strokeWidth={2.4} />}
        />
        <KpiCard
          label="Custo Médio / m² Pintado"
          value="R$ 18,20"
          unit="/ m²"
          changeText="Base: Primer Branco + Laca PU"
          changeStatus="ok"
          icon={<Ruler size={22} color="#F59E0B" strokeWidth={2.4} />}
        />
      </div>

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

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setFiltroStatus('todos')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: filtroStatus === 'todos' ? 'var(--card-hover)' : 'transparent',
                color: filtroStatus === 'todos' ? 'var(--text)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Todos ({HISTORICO_CONSUMO_MOCK.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('conforme')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: filtroStatus === 'conforme' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                color: filtroStatus === 'conforme' ? '#10B981' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Check size={14} strokeWidth={2.4} /> Conforme (Tolerância &lt;5%)
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('alerta')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: filtroStatus === 'alerta' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                color: filtroStatus === 'alerta' ? '#EF4444' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <AlertTriangle size={14} strokeWidth={2.4} /> Alerta de Excesso
            </button>
          </div>
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
              render: (row: RowOSConsumo) => <span style={{ fontSize: '13px', fontWeight: 600 }}>{row.acabamento}</span>,
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
                return (
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 700 }}>{row.realMl} ml</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                      (meta: {row.previstoMl} ml)
                    </span>
                    {diff > 0 && (
                      <span style={{ display: 'block', fontSize: '11px', color: '#EF4444', fontWeight: 700 }}>
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
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: row.status === 'conforme' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: row.status === 'conforme' ? '#10B981' : '#EF4444',
                    border: `1px solid ${row.status === 'conforme' ? '#10B981' : '#EF4444'}`,
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

      {/* Rodapé Fixo */}
      <footer className="ds-bottom-bar">
        <div className="ds-bottom-bar-left">
          <Button variant="secondary" size="md" onClick={() => onNavigate('dashboard')}>
            ← Voltar ao Chão de Fábrica
          </Button>
        </div>
        <div className="ds-bottom-bar-right">
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Logado como: <strong>{operator.nome}</strong> (Perfil: {operator.papel})
          </span>
        </div>
      </footer>
    </div>
  );
};
