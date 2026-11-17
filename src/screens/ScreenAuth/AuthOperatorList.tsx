import React from 'react';
import { Check, Shield, KeyRound } from 'lucide-react';
import { Operator, Lote, Preparacao } from '../../types';
import { MOCK_LOTES } from '../../data';

interface AuthOperatorListProps {
  operators: Operator[];
  selectedOperator: Operator;
  hasPickedOperator: boolean;
  isManagerAuthMode: boolean;
  shakeOperatorList: boolean;
  lotes: Lote[];
  preparacoes: Preparacao[];
  nowMs: number;
  cabine2SecRestantes: number;
  onSelectOperator: (op: Operator, el: HTMLElement) => void;
  onSelectManager: (el: HTMLElement) => void;
  onOpenHelpModal: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatMmSs(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec));
  const mm = String(Math.floor(safe / 60)).padStart(2, '0');
  const ss = String(safe % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export const AuthOperatorList: React.FC<AuthOperatorListProps> = ({
  operators,
  selectedOperator,
  hasPickedOperator,
  isManagerAuthMode,
  shakeOperatorList,
  lotes,
  preparacoes,
  nowMs,
  cabine2SecRestantes,
  onSelectOperator,
  onSelectManager,
  onOpenHelpModal,
}) => {
  const selectedName = selectedOperator.nome || selectedOperator.name || 'Operador';

  // Status ao vivo da Cabine 01 e Cabine 02 (a partir das preparações reais)
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

  const lotesBase = lotes.length > 0 ? lotes : MOCK_LOTES;
  const totalSobrasFefo = lotesBase.filter((l) => l.diasAberto > 0 && l.quantidadeAtual > 0).length;

  return (
    <section className="auth-left-column" aria-label="Seleção de Operador">
      <div className="auth-column-header">
        <h1 className="auth-title-minimal">Quem está pintando?</h1>
        <p className="auth-subtitle-minimal">
          Selecione seu perfil e digite o PIN para liberar a cabine.
        </p>
      </div>

      <div
        className={`auth-operators-vertical ${shakeOperatorList ? 'shake' : ''}`}
        role="radiogroup"
        aria-label="Operadores disponíveis"
      >
        {operators.map((op) => {
          const opName = op.nome || op.name || '';
          const opRole = op.papel || op.role || 'Operador de Pintura';
          const isSelected =
            hasPickedOperator &&
            !isManagerAuthMode &&
            (op.id ? op.id === selectedOperator.id : opName === selectedName);

          const isAna = opName.toLowerCase().includes('ana');
          const isCarlos = opName.toLowerCase().includes('carlos');
          const isMarcos = opName.toLowerCase().includes('marcos');
          const opAvatarKey = isCarlos ? 'carlos' : isAna ? 'ana' : 'marcos';

          let liveStatusLabel: string;
          let liveStatusTone: 'active-green' | 'info-blue' | 'warn-amber';

          if (isAna) {
            if (prepAtivaCabine2) {
              liveStatusLabel = `Aplicando ${prepAtivaCabine2.ordemServicoNumero} • Verniz PU (${formatMmSs(
                cabine2RealSec
              )})`;
              liveStatusTone = 'active-green';
            } else {
              liveStatusLabel = 'Cabine 02 livre p/ nova O.S.';
              liveStatusTone = 'info-blue';
            }
          } else if (isCarlos) {
            if (prepAtivaCabine1 && cabine1RemainingSec !== null) {
              liveStatusLabel = `Aplicando ${prepAtivaCabine1.ordemServicoNumero} (${formatMmSs(
                cabine1RemainingSec
              )})`;
              liveStatusTone = 'active-green';
            } else {
              liveStatusLabel = 'Cabine 01 livre p/ nova O.S.';
              liveStatusTone = 'info-blue';
            }
          } else if (isMarcos) {
            liveStatusLabel = `${totalSobrasFefo} sobras prioritárias FEFO na bancada`;
            liveStatusTone = 'warn-amber';
          } else {
            liveStatusLabel = `${op.cabineNome || 'Cabine 01'} • Pronto para operar`;
            liveStatusTone = 'info-blue';
          }

          const badgeStyles =
            liveStatusTone === 'active-green'
              ? {
                  background: 'rgba(16, 185, 129, 0.14)',
                  border: '1px solid rgba(16, 185, 129, 0.38)',
                  color: 'var(--tint-emerald)',
                }
              : liveStatusTone === 'warn-amber'
              ? {
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.32)',
                  color: 'var(--tint-amber)',
                }
              : {
                  background: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: 'var(--tint-blue)',
                };

          return (
            <button
              key={op.id || opName}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`operator-card-apple ${isSelected ? 'is-active' : ''}`}
              onClick={(e) => onSelectOperator(op, e.currentTarget)}
            >
              <div
                className={`operator-avatar-circle operator-avatar-circle--${opAvatarKey}`}
                aria-hidden="true"
              >
                {getInitials(opName)}
              </div>
              <div className="operator-info-apple">
                <span className="operator-name-apple">{opName}</span>
                <span className="operator-role-apple">{opRole}</span>
                <span className="operator-status-pill" style={badgeStyles}>
                  <span className={`status-beacon status-beacon--${liveStatusTone}`} aria-hidden="true" />
                  <span>{liveStatusLabel}</span>
                </span>
              </div>
              <div
                className={`operator-select-indicator ${isSelected ? 'is-selected' : ''}`}
                aria-hidden="true"
              >
                {isSelected && <Check size={18} strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Linha de Ações Auxiliares: Acesso Supervisor & Ajuda */}
      <div className="auth-action-buttons-row">
        <button
          type="button"
          className="auth-supervisor-btn"
          onClick={(e) => onSelectManager(e.currentTarget)}
          style={
            isManagerAuthMode
              ? {
                  borderColor: 'rgba(245, 158, 11, 0.75)',
                  background: 'rgba(245, 158, 11, 0.18)',
                  color: '#FEF08A',
                  boxShadow: '0 0 16px rgba(245, 158, 11, 0.25)',
                }
              : undefined
          }
          title="Requer PIN do Gestor Fábio (9999)"
        >
          <div className="auth-supervisor-icon-box" aria-hidden="true">
            <Shield size={13} strokeWidth={2.4} />
          </div>
          <span>Painel do Gestor (Fábio)</span>
        </button>

        <button
          type="button"
          className="auth-help-btn"
          onClick={onOpenHelpModal}
          title="Ver PINs para demonstração e suporte"
        >
          <KeyRound size={15} strokeWidth={2.2} aria-hidden="true" />
          <span>PINs Demo</span>
        </button>
      </div>
    </section>
  );
};
