import React, { useState } from 'react';
import { Check, AlertTriangle } from 'lucide-react';
import { DataTable } from '../../components/ui/DataTable';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { RowOSConsumo } from './types';

interface ManagerConsolidatedTableProps {
  historicoCombinado: RowOSConsumo[];
}

export const ManagerConsolidatedTable: React.FC<ManagerConsolidatedTableProps> = ({
  historicoCombinado,
}) => {
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'conforme' | 'alerta'>('todos');

  const dadosFiltrados = historicoCombinado.filter((item) => {
    if (filtroStatus === 'conforme') return item.status === 'conforme';
    if (filtroStatus === 'alerta') return item.status === 'alerta';
    return true;
  });

  return (
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
                  <span style={{ fontSize: '12px', color: 'var(--tint-amber)', fontWeight: 600, display: 'block', marginTop: '2px' }}>
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
                      background: 'rgba(var(--overlay-rgb), 0.08)',
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
                  color: row.status === 'conforme' ? 'var(--tint-green)' : 'var(--tint-red)',
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
  );
};
