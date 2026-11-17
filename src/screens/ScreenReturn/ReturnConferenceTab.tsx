import React from 'react';
import { ClipboardCheck, Check, PackageCheck, Trash2 } from 'lucide-react';
import { Preparacao, StatusItemDevolucao } from '../../types';
import { Button } from '../../components/ui/Button';

interface ReturnConferenceTabProps {
  preparacoesEmConferencia: Preparacao[];
  isProcessing: boolean;
  onRegisterItemReturn?: (params: {
    preparacaoId: string;
    itemId: string;
    saldoRestanteMl: number;
    destino: Exclude<StatusItemDevolucao, 'PENDENTE'>;
    checklistAprovado: Record<string, boolean>;
    motivoManual?: string;
    aprovacaoConferenciaTecnica?: boolean;
  }) => Promise<void>;
}

export const ReturnConferenceTab: React.FC<ReturnConferenceTabProps> = ({
  preparacoesEmConferencia,
  isProcessing,
  onRegisterItemReturn,
}) => {
  if (preparacoesEmConferencia.length === 0) {
    return (
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
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {preparacoesEmConferencia.map((prep) => {
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
                  color: 'var(--tint-blue)',
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
                      <span style={{ fontSize: '13px', color: 'var(--tint-blue-soft)', display: 'block', marginTop: '4px' }}>
                        Observação: {it.motivoReprovacao}
                      </span>
                    )}
                  </div>

                  {/* Botões de Decisão da Conferência Técnica */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '6px', borderTop: '1px solid rgba(var(--overlay-rgb), 0.06)' }}>
                    {it.saldoRestanteInformadoMl > 0 && (
                      <Button
                        variant="primary"
                        size="md"
                        disabled={isProcessing}
                        onClick={async () => {
                          if (!onRegisterItemReturn) return;
                          await onRegisterItemReturn({
                            preparacaoId: prep.id,
                            itemId: it.id,
                            saldoRestanteMl: it.saldoRestanteInformadoMl,
                            destino: 'DEVOLVIDO_AO_ESTOQUE',
                            checklistAprovado: it.checklistAprovado || {},
                            aprovacaoConferenciaTecnica: true,
                          });
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
                        await onRegisterItemReturn({
                          preparacaoId: prep.id,
                          itemId: it.id,
                          saldoRestanteMl: 0,
                          destino: 'EMBALAGEM_ESGOTADA',
                          checklistAprovado: it.checklistAprovado || {},
                          motivoManual: 'Conferência concluída: embalagem sem sobra (0 ml)',
                        });
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
                        await onRegisterItemReturn({
                          preparacaoId: prep.id,
                          itemId: it.id,
                          saldoRestanteMl: it.saldoRestanteInformadoMl,
                          destino: 'DESCARTADO_COMO_REFUGO',
                          checklistAprovado: it.checklistAprovado || {},
                          motivoManual: 'Reprovado na conferência técnica • Descarte como refugo',
                        });
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
      })}
    </div>
  );
};
