import React, { useId, useRef, useState } from 'react';
import { CountNumber } from './CountNumber';

export interface ScrubDataPoint {
  label: string;
  sublabel: string;
  valueMl: number;
  targetMl: number;
  cost: number;
}

interface ScrubChartProps {
  points: ScrubDataPoint[];
  periodLabel: string;
}

function computeChartPoints(data: number[], width: number, height: number, maxVal: number) {
  const padX = 12;
  const padY = 14;
  const h = height - padY * 2;
  const top = Math.max(maxVal, 1);
  return data.map((v, i) => ({
    x: padX + (i / Math.max(1, data.length - 1)) * (width - padX * 2),
    y: padY + h - (v / top) * h,
  }));
}

/** Catmull-Rom to cubic Bézier smooth path (from stageshow kit/chart.tsx) */
function smoothPath(p: { x: number; y: number }[]) {
  if (!p.length) return '';
  let d = `M${p[0].x} ${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] ?? p[i];
    const b = p[i];
    const c = p[i + 1];
    const e = p[i + 2] ?? c;
    d += `C${b.x + (c.x - a.x) / 6} ${b.y + (c.y - a.y) / 6} ${c.x - (e.x - b.x) / 6} ${c.y - (e.y - b.y) / 6} ${c.x} ${c.y}`;
  }
  return d;
}

export const ScrubChart: React.FC<ScrubChartProps> = ({ points, periodLabel }) => {
  const id = useId().replace(/:/g, '');
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [scrubX, setScrubX] = useState<number | null>(null);

  const width = 760;
  const height = 164;

  const values = points.map((p) => p.valueMl);
  const targets = points.map((p) => p.targetMl);
  const maxVal = Math.max(...values, ...targets, 100) * 1.1;

  const realPts = computeChartPoints(values, width, height, maxVal);
  const targetPts = computeChartPoints(targets, width, height, maxVal);

  const realLine = smoothPath(realPts);
  const targetLine = smoothPath(targetPts);
  const realFill =
    realPts.length > 1
      ? `${realLine}L${realPts[realPts.length - 1].x} ${height}L${realPts[0].x} ${height}Z`
      : '';

  const totalMl = points.reduce((sum, p) => sum + p.valueMl, 0);
  const totalCost = points.reduce((sum, p) => sum + p.cost, 0);

  const activePoint = activeIndex !== null ? points[activeIndex] : null;
  const activeCoord = activeIndex !== null ? realPts[activeIndex] : null;

  const handlePointerScrub = (clientX: number) => {
    const el = containerRef.current;
    if (!el || realPts.length === 0) return;
    const rect = el.getBoundingClientRect();
    const relX = Math.max(0, Math.min(width, ((clientX - rect.left) / rect.width) * width));

    let nearest = 0;
    for (let i = 1; i < realPts.length; i++) {
      if (Math.abs(realPts[i].x - relX) < Math.abs(realPts[nearest].x - relX)) {
        nearest = i;
      }
    }
    setActiveIndex(nearest);
    setScrubX(realPts[nearest].x);
  };

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '22px 24px',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Headline Readout (Regra do Stageshow: o próprio título/valor principal lê o ponto sob o cursor, sem tooltip cobrindo a linha) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>
            {activePoint
              ? `${activePoint.label} • ${activePoint.sublabel}`
              : `Curva de consumo químico (${periodLabel}) — deslize sobre a linha para inspecionar`}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '14px',
              marginTop: '4px',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              <CountNumber
                value={activePoint ? activePoint.valueMl : totalMl}
                format={(n) => `${Math.round(n).toLocaleString('pt-BR')} ml`}
              />
            </span>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#60a5fa' }}>
              <CountNumber
                value={Math.round((activePoint ? activePoint.cost : totalCost) * 100)}
                format={(n) => `R$ ${(n / 100).toFixed(2).replace('.', ',')}`}
              />
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '3px', borderRadius: '2px', background: '#3B82F6' }} />
            Real dosado
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '2px', borderRadius: '2px', background: 'rgba(148, 163, 184, 0.55)' }} />
            Meta prevista
          </span>
        </div>
      </div>

      {/* Área de Plotagem com Scrubbing (Crosshair) */}
      <div
        ref={containerRef}
        onPointerMove={(e) => handlePointerScrub(e.clientX)}
        onPointerDown={(e) => handlePointerScrub(e.clientX)}
        onPointerLeave={() => {
          setActiveIndex(null);
          setScrubX(null);
        }}
        style={{
          position: 'relative',
          width: '100%',
          height: `${height}px`,
          cursor: 'crosshair',
          touchAction: 'pan-y',
          userSelect: 'none',
        }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%', overflow: 'visible', display: 'block' }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Área suave sob a curva real */}
          {realFill && <path d={realFill} fill={`url(#${id}-area)`} />}

          {/* Linha tracejada discreta da Meta Prevista */}
          {targetLine && (
            <path
              d={targetLine}
              fill="none"
              stroke="rgba(148, 163, 184, 0.35)"
              strokeWidth="1.75"
              strokeDasharray="4 4"
            />
          )}

          {/* Linha contínua principal do Consumo Real */}
          {realLine && (
            <path
              d={realLine}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* Hairline vertical e ponto sobre a curva durante o scrub */}
        {activeCoord && scrubX !== null && (
          <>
            <span
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${(scrubX / width) * 100}%`,
                width: '1px',
                background: 'rgba(255, 255, 255, 0.24)',
                pointerEvents: 'none',
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: `${(activeCoord.x / width) * 100}%`,
                top: `${(activeCoord.y / height) * 100}%`,
                width: '10px',
                height: '10px',
                margin: '-5px 0 0 -5px',
                borderRadius: '50%',
                background: '#3B82F6',
                border: '2px solid var(--card)',
                pointerEvents: 'none',
              }}
            />
          </>
        )}
      </div>

      {/* Eixo X limpo nas extremidades (padrão chart-scrub) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: 'var(--text-muted)',
          marginTop: '-6px',
        }}
      >
        <span>{points[points.length - 1]?.label || 'Início'}</span>
        <span>{points[0]?.label || 'Hoje'}</span>
      </div>
    </div>
  );
};
