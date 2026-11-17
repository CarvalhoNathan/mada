import React, { useState, useEffect } from 'react';
import { Preparacao, ScreenId } from '../../types';

interface ManagerLiveCabinsProps {
  preparacoes: Preparacao[];
  onNavigate: (screen: ScreenId) => void;
}

export const ManagerLiveCabins: React.FC<ManagerLiveCabinsProps> = ({
  preparacoes,
  onNavigate,
}) => {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [cabine2SecRestantes, setCabine2SecRestantes] = useState<number>(14 * 60 + 25);

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
      setCabine2SecRestantes((prev) => (prev > 60 ? prev - 1 : 14 * 60 + 25));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
  const cabine1TotalSec = (prepAtivaCabine1?.potLifeMinutos || 20) * 60;

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
  const cabine2TotalSec = (prepAtivaCabine2?.potLifeMinutos || 25) * 60;

  const formatMmSs = (sec: number) => {
    const s = Math.max(0, Math.floor(sec));
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}
    >
      {/* Card Cabine 01 — Carlos Silva */}
      <div
        style={{
          background: 'var(--card)',
          border: prepAtivaCabine1
            ? '1.5px solid rgba(16, 185, 129, 0.45)'
            : '1px solid var(--border)',
          borderRadius: '16px',
          padding: '18px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: prepAtivaCabine1 ? '#10B981' : '#3B82F6',
                boxShadow: prepAtivaCabine1 ? '0 0 10px #10B981' : '0 0 8px #3B82F6',
              }}
            />
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)' }}>
                Cabine 01 — Pintura Principal
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Pintor Líder: <strong style={{ color: 'var(--text)' }}>Carlos Silva</strong>
              </div>
            </div>
          </div>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 800,
              background: prepAtivaCabine1
                ? 'rgba(16, 185, 129, 0.14)'
                : 'rgba(59, 130, 246, 0.12)',
              border: prepAtivaCabine1
                ? '1px solid rgba(16, 185, 129, 0.35)'
                : '1px solid rgba(59, 130, 246, 0.3)',
              color: prepAtivaCabine1 ? 'var(--tint-emerald)' : 'var(--tint-blue)',
            }}
          >
            {prepAtivaCabine1 ? '● EM APLICAÇÃO AO VIVO' : '● LIVRE P/ NOVA PREPARAÇÃO'}
          </span>
        </div>

        {prepAtivaCabine1 && cabine1RemainingSec !== null ? (
          <>
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(var(--overlay-rgb), 0.03)',
                border: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                  {prepAtivaCabine1.ordemServicoNumero} • {prepAtivaCabine1.clienteNome} (
                  {prepAtivaCabine1.ambienteNome})
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {prepAtivaCabine1.receitaNome} • {prepAtivaCabine1.volumeTotal} ml no béquer
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: cabine1RemainingSec < 300 ? '#EF4444' : 'var(--tint-emerald)',
                  }}
                >
                  {formatMmSs(cabine1RemainingSec)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pot Life restante</div>
              </div>
            </div>

            <div
              style={{
                height: '6px',
                borderRadius: '999px',
                background: 'rgba(var(--overlay-rgb), 0.08)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, Math.max(5, (cabine1RemainingSec / cabine1TotalSec) * 100))}%`,
                  height: '100%',
                  background:
                    cabine1RemainingSec < 300
                      ? '#EF4444'
                      : 'linear-gradient(90deg, #10B981, var(--tint-emerald))',
                  transition: 'width 0.8s linear',
                }}
              />
            </div>
          </>
        ) : (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(var(--overlay-rgb), 0.02)',
              border: '1px dashed var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Pronta para iniciar preparação da próxima O.S.
            </span>
            <button
              type="button"
              onClick={() => onNavigate('os')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.14)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                color: 'var(--tint-blue)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Iniciar dosagem →
            </button>
          </div>
        )}
      </div>

      {/* Card Cabine 02 — Ana Souza (Sempre Ao Vivo na Demonstração) */}
      <div
        style={{
          background: 'var(--card)',
          border: '1.5px solid rgba(16, 185, 129, 0.45)',
          borderRadius: '16px',
          padding: '18px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 10px #10B981',
              }}
            />
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)' }}>
                Cabine 02 — Linha Verniz & Especiais
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Aplicadora PU: <strong style={{ color: 'var(--text)' }}>Ana Souza</strong>
              </div>
            </div>
          </div>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 800,
              background: 'rgba(16, 185, 129, 0.14)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: 'var(--tint-emerald)',
            }}
          >
            ● EM APLICAÇÃO AO VIVO
          </span>
        </div>

        <div
          style={{
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'rgba(var(--overlay-rgb), 0.03)',
            border: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
              OS #8842 • Apartamento Jardins (Home Theater — Painel Ripado Freijó)
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Verniz PU Alto Brilho 4:1 • 1.200 ml dosados na bancada
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                color: 'var(--tint-emerald)',
              }}
            >
              {formatMmSs(cabine2RealSec)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pot Life restante</div>
          </div>
        </div>

        <div
          style={{
            height: '6px',
            borderRadius: '999px',
            background: 'rgba(var(--overlay-rgb), 0.08)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min(100, Math.max(5, (cabine2RealSec / cabine2TotalSec) * 100))}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #10B981, var(--tint-emerald))',
              transition: 'width 0.8s linear',
            }}
          />
        </div>
      </div>
    </div>
  );
};
