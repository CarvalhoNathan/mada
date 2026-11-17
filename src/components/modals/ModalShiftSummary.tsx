import React from 'react';
import { Operator, Preparacao } from '../../types';

export interface ModalShiftSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  isManagerSession: boolean;
  selectedOperator: Operator;
  cabineOperador: { cabineId: string; cabineNome: string };
  preparacaoAtivaCabine: Preparacao | null | undefined;
  preparacoes: Preparacao[];
  onNavigateToReturn: () => void;
  onConfirmSwitchOperator: () => void;
}

/**
 * ModalShiftSummary - Resumo de Produção do Turno & Troca de Operador
 * Exibe quantidade de misturas preparadas, volume total em ml,
 * status das embalagens de sobras (resolvidas vs pendentes) e confirmação de encerramento do turno.
 */
export const ModalShiftSummary: React.FC<ModalShiftSummaryProps> = ({
  isOpen,
  onClose,
  isManagerSession,
  selectedOperator,
  cabineOperador,
  preparacaoAtivaCabine,
  preparacoes,
  onNavigateToReturn,
  onConfirmSwitchOperator,
}) => {
  if (!isOpen) return null;

  const prepsDoOperador = isManagerSession
    ? preparacoes
    : preparacoes.filter((p) => p.operadorId === selectedOperator.id);
  const volumeTotalTurno = prepsDoOperador.reduce((acc, p) => acc + p.volumeTotal, 0);
  const itensResolvidosTurno = prepsDoOperador.reduce(
    (acc, p) => acc + p.itensDevolucao.filter((it) => it.status !== 'PENDENTE').length,
    0
  );
  const itensPendentesTurno = prepsDoOperador.reduce(
    (acc, p) => acc + p.itensDevolucao.filter((it) => it.status === 'PENDENTE').length,
    0
  );

  const operatorInitials = isManagerSession
    ? 'FB'
    : selectedOperator.nome
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

  return (
    <div
      className="ds-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Resumo do Turno e Troca de Operador"
      onClick={onClose}
    >
      <div
        className="os-modal-card-apple"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px' }}
      >
        <div className="os-modal-header-apple">
          <div className="os-modal-header-left">
            <div
              className="os-modal-icon-badge"
              style={{
                fontWeight: 800,
                fontSize: '15px',
                color: 'var(--text)',
              }}
            >
              {operatorInitials}
            </div>
            <div>
              <h3 className="os-modal-title-apple">
                <span>
                  {isManagerSession ? 'Fábio (Gestor)' : selectedOperator.nome}
                </span>
                <span className="os-modal-count-pill">
                  {isManagerSession ? 'Gestão' : cabineOperador.cabineNome}
                </span>
              </h3>
              <p className="os-modal-subtitle-apple">
                {isManagerSession
                  ? 'Supervisor de Cabine • Resumo Geral da Operação'
                  : `${selectedOperator.papel} • Resumo do turno atual`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="os-modal-close-apple"
            aria-label="Fechar resumo do turno"
          >
            ✕
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
          }}
        >
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(var(--overlay-rgb), 0.03)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Misturas no Turno
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--text)',
                marginTop: '4px',
              }}
            >
              {prepsDoOperador.length}{' '}
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                ({volumeTotalTurno} ml)
              </span>
            </div>
          </div>

          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(var(--overlay-rgb), 0.03)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Embalagens Rastreadas
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: itensPendentesTurno > 0 ? 'var(--tint-amber)' : 'var(--tint-emerald)',
                marginTop: '4px',
              }}
            >
              {itensResolvidosTurno} resolvidas{' '}
              {itensPendentesTurno > 0 && (
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--tint-amber)' }}>
                  • {itensPendentesTurno} pend.
                </span>
              )}
            </div>
          </div>
        </div>

        {!isManagerSession && preparacaoAtivaCabine && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              fontSize: '13px',
              color: 'var(--tint-emerald)',
              fontWeight: 600,
            }}
          >
            ● Aplicação ativa na {cabineOperador.cabineNome}:{' '}
            <strong>{preparacaoAtivaCabine.ordemServicoNumero}</strong> (
            {preparacaoAtivaCabine.receitaNome}). O cronômetro de Pot Life continuará salvo.
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
            marginTop: '4px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              minHeight: '46px',
              padding: '0 18px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Continuar no turno
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            {!isManagerSession && itensPendentesTurno > 0 && (
              <button
                type="button"
                onClick={onNavigateToReturn}
                style={{
                  minHeight: '46px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(245, 158, 11, 0.45)',
                  background: 'rgba(245, 158, 11, 0.14)',
                  color: 'var(--tint-amber)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Devolver sobras ({itensPendentesTurno})
              </button>
            )}

            <button
              type="button"
              onClick={onConfirmSwitchOperator}
              style={{
                minHeight: '46px',
                padding: '0 18px',
                borderRadius: '10px',
                border: 'none',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Trocar operador →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
