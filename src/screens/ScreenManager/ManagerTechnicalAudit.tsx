import React, { useState } from 'react';
import { ClipboardCheck, Check, PackageCheck, Trash2, Beaker } from 'lucide-react';
import { Preparacao, ResiduoMisturaOcorrencia, StatusItemDevolucao } from '../../types';
import { Button } from '../../components/ui/Button';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { MOCK_RECEITAS } from '../../data';
import { ORIENTACAO_NEUTRA_POT_LIFE_EXPIRADO } from '../../domain/potLife';

interface ManagerTechnicalAuditProps {
  preparacoesEmConferencia: Preparacao[];
  residuosMistura: ResiduoMisturaOcorrencia[];
  procedimentosPotLife: Record<number, string>;
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
  showToast: (msg: string, type?: 'info' | 'success' | 'warn' | 'danger') => void;
}

export const ManagerTechnicalAudit: React.FC<ManagerTechnicalAuditProps> = ({
  preparacoesEmConferencia,
  residuosMistura,
  procedimentosPotLife,
  onSaveProcedimentoPotLife,
  onResolveConferenceItem,
  showToast,
}) => {
  const [selectedProcRecipeId, setSelectedProcRecipeId] = useState<number>(MOCK_RECEITAS[0].id);
  const [procDraft, setProcDraft] = useState<string>(
    () => procedimentosPotLife[MOCK_RECEITAS[0].id] || ''
  );

  return (
    <>
      {/* 1. Fila de Conferência Técnica & Auditoria de Ocorrências de Pot Life */}
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

      {/* 2. Homologação Técnica do Procedimento Oficial de Pot Life Expirado */}
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
    </>
  );
};
