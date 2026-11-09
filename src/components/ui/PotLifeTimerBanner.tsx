import React, { useState, useEffect, useRef } from 'react';
import { AlertOctagon, AlertTriangle, Clock, Check, ClipboardList } from 'lucide-react';
import { CountNumber } from './CountNumber';
import {
  calcularEstadoPotLife,
  ORIENTACAO_NEUTRA_POT_LIFE_EXPIRADO,
} from '../../domain/potLife';

export interface PotLifeState {
  preparacaoId?: string;
  dosagemConcluidaEm?: string; // ISO timestamp absoluto
  startTime: number; // timestamp absoluto em ms
  durationSeconds: number; // derivado de potLifeMinutos homologado na receita
  potLifeMinutos?: number;
  recipeName: string;
  osNumber: string;
  volumeTotal: number;
  cabineNome?: string;
  procedimentoOficialValidado?: string;
}

interface PotLifeTimerBannerProps {
  potLife: PotLifeState | null;
  onFinishApplication: () => void;
  onDiscardHardened?: () => void;
  onOpenOccurrenceModal?: () => void;
  onPotLifeExpired?: (expiredIso: string) => void;
}

function computeCalculation(potLife: PotLifeState | null) {
  if (!potLife) return null;
  const isoStart = potLife.dosagemConcluidaEm || new Date(potLife.startTime).toISOString();
  const minutos = potLife.potLifeMinutos || Math.max(1, Math.round(potLife.durationSeconds / 60));
  return calcularEstadoPotLife(
    isoStart,
    minutos,
    Date.now(),
    potLife.procedimentoOficialValidado
  );
}

export const PotLifeTimerBanner: React.FC<PotLifeTimerBannerProps> = ({
  potLife,
  onFinishApplication,
  onDiscardHardened,
  onOpenOccurrenceModal,
  onPotLifeExpired,
}) => {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const notifiedPrepIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!potLife) {
      return;
    }

    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [potLife]);

  const calc = potLife
    ? calcularEstadoPotLife(
        potLife.dosagemConcluidaEm || new Date(potLife.startTime).toISOString(),
        potLife.potLifeMinutos || Math.max(1, Math.round(potLife.durationSeconds / 60)),
        nowMs,
        potLife.procedimentoOficialValidado
      )
    : computeCalculation(null);

  useEffect(() => {
    if (!potLife || !calc) return;
    const key = potLife.preparacaoId || String(potLife.startTime);
    if (calc.expirado && notifiedPrepIdRef.current !== key) {
      notifiedPrepIdRef.current = key;
      if (onPotLifeExpired) {
        onPotLifeExpired(calc.expiraEmIso);
      }
    }
  }, [potLife, calc, onPotLifeExpired]);

  if (!potLife || !calc) return null;

  const secondsRemaining = calc.segundosRestantes;
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  const isExpired = calc.expirado;
  const isUrgent = calc.proximoLimite;
  const progressPercent = calc.percentualConsumido;

  return (
    <aside
      aria-label="Controle de vida útil da mistura química"
      style={{
        background: isExpired
          ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.25) 0%, rgba(20, 24, 33, 0.95) 100%)'
          : isUrgent
          ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.2) 0%, rgba(20, 24, 33, 0.95) 100%)'
          : 'linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, rgba(20, 24, 33, 0.95) 100%)',
        border: `2px solid ${isExpired ? '#EF4444' : isUrgent ? '#F59E0B' : '#10B981'}`,
        borderRadius: '14px',
        padding: '12px 18px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        boxShadow: isExpired
          ? '0 0 24px rgba(239, 68, 68, 0.4)'
          : isUrgent
          ? '0 0 16px rgba(245, 158, 11, 0.3)'
          : '0 4px 16px rgba(0,0,0,0.3)',
      }}
    >
      {/* Esquerda: Informação e Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 360px' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: isExpired ? '#EF4444' : isUrgent ? '#F59E0B' : '#10B981',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isExpired ? (
            <AlertOctagon size={22} strokeWidth={2.4} />
          ) : isUrgent ? (
            <AlertTriangle size={22} strokeWidth={2.4} />
          ) : (
            <Clock size={22} strokeWidth={2.4} />
          )}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '2px 8px',
                borderRadius: '6px',
                background: isExpired
                  ? 'rgba(239, 68, 68, 0.3)'
                  : isUrgent
                  ? 'rgba(245, 158, 11, 0.3)'
                  : 'rgba(16, 185, 129, 0.3)',
                color: isExpired ? '#FCA5A5' : isUrgent ? '#FDE68A' : '#6EE7B7',
              }}
            >
              {isExpired
                ? 'POT_LIFE_EXPIRADO'
                : isUrgent
                ? 'Alerta Preventivo • Próximo do Limite'
                : 'Mistura Ativa (Pot Life)'}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
              {potLife.cabineNome ? `${potLife.cabineNome} • ` : ''}
              {potLife.osNumber} • {potLife.recipeName} • {potLife.volumeTotal} ml
            </span>
          </div>

          <h4
            style={{
              margin: '4px 0 0',
              fontSize: '14px',
              fontWeight: 700,
              color: isExpired ? '#FCA5A5' : isUrgent ? '#FDE68A' : 'var(--text)',
              lineHeight: 1.35,
            }}
          >
            {isExpired ? ORIENTACAO_NEUTRA_POT_LIFE_EXPIRADO : calc.mensagemContextual}
          </h4>
        </div>
      </div>

      {/* Centro: Cronômetro com Rolagem Numérica + Barra de Progresso */}
      <div style={{ minWidth: '170px', flex: '0 1 230px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginBottom: '5px',
          }}
        >
          <span>Tempo restante:</span>
          <span
            style={{
              fontSize: '16px',
              fontWeight: 800,
              color: isExpired ? '#EF4444' : isUrgent ? '#FDE68A' : '#6EE7B7',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <CountNumber value={minutes} format={(n) => String(Math.round(n)).padStart(2, '0')} />
            <span>:</span>
            <CountNumber value={seconds} format={(n) => String(Math.round(n)).padStart(2, '0')} />
          </span>
        </div>
        <div
          style={{
            height: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: isExpired ? '#EF4444' : isUrgent ? '#F59E0B' : '#10B981',
              transition: 'width 1s linear',
            }}
          />
        </div>
      </div>

      {/* Direita: Ação Direta (Concluir Aplicação ou Registrar Ocorrência se Expirado) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {isExpired && (onOpenOccurrenceModal || onDiscardHardened) && (
          <button
            type="button"
            onClick={onOpenOccurrenceModal || onDiscardHardened}
            style={{
              minHeight: '44px',
              padding: '0 14px',
              background: '#EF4444',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <ClipboardList size={16} strokeWidth={2.4} />
            <span>Registrar Ocorrência</span>
          </button>
        )}

        <button
          type="button"
          onClick={onFinishApplication}
          style={{
            minHeight: '44px',
            padding: '0 16px',
            background: '#10B981',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Check size={16} strokeWidth={2.6} /> Concluir Aplicação na Pistola
        </button>
      </div>
    </aside>
  );
};
