import React, { useState, useEffect } from 'react';
import { AlertOctagon, AlertTriangle, Clock, Check, Trash2 } from 'lucide-react';
import { CountNumber } from './CountNumber';

export interface PotLifeState {
  startTime: number; // timestamp em ms
  durationSeconds: number; // padrão: 20 * 60 = 1200
  recipeName: string;
  osNumber: string;
  volumeTotal: number;
}

interface PotLifeTimerBannerProps {
  potLife: PotLifeState | null;
  onFinishApplication: () => void;
  onDiscardHardened: () => void;
}

function getInitialRemaining(potLife: PotLifeState | null): number {
  if (!potLife) return 0;
  const elapsedSeconds = Math.floor((Date.now() - potLife.startTime) / 1000);
  return Math.max(0, potLife.durationSeconds - elapsedSeconds);
}

export const PotLifeTimerBanner: React.FC<PotLifeTimerBannerProps> = ({
  potLife,
  onFinishApplication,
  onDiscardHardened,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => getInitialRemaining(potLife));

  useEffect(() => {
    if (!potLife) {
      return;
    }

    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - potLife.startTime) / 1000);
      const remaining = Math.max(0, potLife.durationSeconds - elapsedSeconds);
      setSecondsRemaining(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [potLife]);

  if (!potLife) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  const isExpired = secondsRemaining <= 0;
  const isUrgent = secondsRemaining > 0 && secondsRemaining <= 5 * 60; // menos de 5 min

  const progressPercent = Math.min(
    100,
    Math.max(0, ((potLife.durationSeconds - secondsRemaining) / potLife.durationSeconds) * 100)
  );

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
              {isExpired ? 'Mistura Endurecida' : isUrgent ? 'Tempo Crítico' : 'Mistura Ativa (Pot Life)'}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
              {potLife.osNumber} • {potLife.recipeName} • {potLife.volumeTotal} ml
            </span>
          </div>

          <h4
            style={{
              margin: '4px 0 0',
              fontSize: '15px',
              fontWeight: 700,
              color: isExpired ? '#EF4444' : 'var(--text)',
            }}
          >
            {isExpired
              ? 'Tempo de cura (20 min) esgotado! Descarte obrigatório no tambor de refugo.'
              : 'Aplique na pistola antes de endurecer'}
          </h4>
        </div>
      </div>

      {/* Centro: Cronômetro com Rolagem Numérica + Barra de Progresso */}
      <div style={{ minWidth: '180px', flex: 1, maxWidth: '260px' }}>
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

      {/* Direita: Ação Única Direta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {!isExpired ? (
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
            <Check size={16} strokeWidth={2.6} /> Concluir Aplicação
          </button>
        ) : (
          <button
            type="button"
            onClick={onDiscardHardened}
            style={{
              minHeight: '44px',
              padding: '0 16px',
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
            <Trash2 size={16} strokeWidth={2.4} /> Descartar Refugo ({potLife.volumeTotal}ml)
          </button>
        )}
      </div>
    </aside>
  );
};
