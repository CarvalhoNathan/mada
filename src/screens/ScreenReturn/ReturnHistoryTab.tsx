import React from 'react';
import { History } from 'lucide-react';
import { Preparacao, ResiduoMisturaOcorrencia } from '../../types';
import { STATUS_BADGE_MAP } from './types';

interface ReturnHistoryTabProps {
  preparacoesHistorico: Preparacao[];
  residuosMistura: ResiduoMisturaOcorrencia[];
}

export const ReturnHistoryTab: React.FC<ReturnHistoryTabProps> = ({
  preparacoesHistorico,
  residuosMistura,
}) => {
  return (
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
                <span style={{ color: 'var(--tint-amber-soft)', display: 'block', marginTop: '4px' }}>
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
                  color: 'var(--tint-green)',
                }}
              >
                ✓ Devolução Concluída ({prep.itensDevolucao.length}/{prep.itensDevolucao.length} embalagens)
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
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
  );
};
