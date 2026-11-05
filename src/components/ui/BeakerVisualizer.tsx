import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { AlertTriangle, Check } from 'lucide-react';

export interface BeakerVisualizerProps {
  value: number; // ml dosados
  target: number; // meta em ml
  toleranceMax?: number; // limite superior seguro em ml
  isExceeded: boolean;
  isWithin: boolean;
  isCatalyst?: boolean;
}

/**
 * BeakerVisualizer - Béquer Graduado Industrial
 * Representação vetorial com menisco de líquido animado em tempo real,
 * graduações táteis e feedback cromático de segurança (Azul -> Verde -> Vermelho).
 */
export const BeakerVisualizer: React.FC<BeakerVisualizerProps> = ({
  value,
  target,
  toleranceMax,
  isExceeded,
  isWithin,
  isCatalyst = false,
}) => {
  const safeTarget = target > 0 ? target : 100;
  const ratio = value / safeTarget;
  // Limita a exibição do líquido visualmente entre 0% e 110%
  const fillPct = Math.max(0, Math.min(110, ratio * 100));
  const roundedPct = Math.round(ratio * 100);

  // Altura total útil da proveta em pixels
  const beakerHeight = 88;
  const beakerWidth = 46;
  const liquidHeight = (fillPct / 110) * (beakerHeight - 8);

  const beakerWrapRef = useRef<HTMLDivElement>(null);
  const liquidRectRef = useRef<SVGRectElement>(null);
  const meniscusRef = useRef<SVGEllipseElement>(null);
  const prevValueRef = useRef<number>(value);
  const prevExceededRef = useRef<boolean>(isExceeded);

  // Física de líquido e ondulação de menisco (slosh wave) quando o operador despeja insumo (+10ml / +50ml)
  useEffect(() => {
    const targetY = beakerHeight - 4 - liquidHeight;
    const targetH = liquidHeight + 10;

    if (liquidRectRef.current) {
      gsap.to(liquidRectRef.current, {
        attr: { y: targetY, height: targetH },
        duration: 0.45,
        ease: 'elastic.out(1, 0.55)',
        overwrite: 'auto',
      });
    }

    if (meniscusRef.current) {
      gsap.to(meniscusRef.current, {
        attr: { cy: targetY },
        duration: 0.45,
        ease: 'elastic.out(1, 0.55)',
        overwrite: 'auto',
      });
    }

    if (value !== prevValueRef.current && value > 0 && meniscusRef.current) {
      gsap.fromTo(
        meniscusRef.current,
        { attr: { ry: 6.5 } },
        {
          attr: { ry: 3 },
          duration: 0.65,
          ease: 'elastic.out(1.4, 0.3)',
          overwrite: 'auto',
        }
      );
    }
    prevValueRef.current = value;
  }, [value, liquidHeight, beakerHeight]);

  // Shake tátil de alerta caso o líquido ultrapasse a tolerância crítica (+5%)
  useEffect(() => {
    if (isExceeded && !prevExceededRef.current && beakerWrapRef.current) {
      gsap.fromTo(
        beakerWrapRef.current,
        { x: -6 },
        {
          x: 0,
          duration: 0.48,
          ease: 'elastic.out(2.5, 0.15)',
          clearProps: 'transform',
        }
      );
    }
    prevExceededRef.current = isExceeded;
  }, [isExceeded]);

  // Cor semântica do líquido
  let liquidGradientId = 'liquid-blue';
  let glowColor = 'rgba(56, 189, 248, 0.4)';
  let borderColor = 'rgba(56, 189, 248, 0.6)';

  if (isExceeded) {
    liquidGradientId = 'liquid-red';
    glowColor = 'rgba(239, 68, 68, 0.6)';
    borderColor = '#EF4444';
  } else if (isWithin) {
    liquidGradientId = 'liquid-green';
    glowColor = 'rgba(34, 197, 94, 0.6)';
    borderColor = '#22C55E';
  }

  // Posição Y da linha da meta (100%)
  const targetLineY = beakerHeight - (100 / 110) * (beakerHeight - 8) - 4;
  // Posição Y da tolerância máxima (+5%) se fornecida
  const tolerancePct = toleranceMax ? Math.min(110, (toleranceMax / safeTarget) * 100) : 105;
  const toleranceLineY = beakerHeight - (tolerancePct / 110) * (beakerHeight - 8) - 4;

  return (
    <div
      className="beaker-visualizer"
      title={`Nível do béquer: ${value} ml de ${target} ml (${roundedPct}%)`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        userSelect: 'none',
      }}
    >
      <div
        ref={beakerWrapRef}
        style={{
          position: 'relative',
          width: `${beakerWidth}px`,
          height: `${beakerHeight}px`,
          filter: value > 0 ? `drop-shadow(0 0 10px ${glowColor})` : 'none',
          transition: 'filter 0.3s ease',
        }}
      >
        <svg
          width={beakerWidth}
          height={beakerHeight}
          viewBox={`0 0 ${beakerWidth} ${beakerHeight}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Gradiente Azul (Em dosagem) */}
            <linearGradient id="liquid-blue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>

            {/* Gradiente Verde (Meta Conforme) */}
            <linearGradient id="liquid-green" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ADE80" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            {/* Gradiente Vermelho (Excesso Crítico) */}
            <linearGradient id="liquid-red" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F87171" />
              <stop offset="100%" stopColor="#B91C1C" />
            </linearGradient>

            {/* Máscara interna do corpo do béquer para conter o líquido */}
            <clipPath id="beaker-inner-clip">
              <path
                d={`M 6 4 
                    L 4 4 
                    C 3 4 2 5 2 6 
                    L 2 10 
                    L 6 10 
                    L 6 ${beakerHeight - 8} 
                    C 6 ${beakerHeight - 2} 10 ${beakerHeight - 2} 14 ${beakerHeight - 2} 
                    L ${beakerWidth - 14} ${beakerHeight - 2} 
                    C ${beakerWidth - 10} ${beakerHeight - 2} ${beakerWidth - 6} ${beakerHeight - 2} ${beakerWidth - 6} ${beakerHeight - 8} 
                    L ${beakerWidth - 6} 4 
                    Z`}
              />
            </clipPath>
          </defs>

          {/* 1. Fundo do Vidro */}
          <path
            d={`M 6 6 L ${beakerWidth - 6} 6 L ${beakerWidth - 6} ${beakerHeight - 8} C ${beakerWidth - 6} ${beakerHeight - 2} ${beakerWidth - 10} ${beakerHeight - 2} ${beakerWidth - 14} ${beakerHeight - 2} L 14 ${beakerHeight - 2} C 10 ${beakerHeight - 2} 6 ${beakerHeight - 2} 6 ${beakerHeight - 8} Z`}
            fill="rgba(255, 255, 255, 0.03)"
          />

          {/* 2. Líquido com Menisco Graduado */}
          {value > 0 && (
            <g clipPath="url(#beaker-inner-clip)">
              <rect
                ref={liquidRectRef}
                x="0"
                y={beakerHeight - 4 - liquidHeight}
                width={beakerWidth}
                height={liquidHeight + 10}
                fill={`url(#${liquidGradientId})`}
                opacity={0.88}
              />
              {/* Menisco da superfície do líquido */}
              <ellipse
                ref={meniscusRef}
                cx={beakerWidth / 2}
                cy={beakerHeight - 4 - liquidHeight}
                rx={beakerWidth / 2 - 6}
                ry="3"
                fill="rgba(255, 255, 255, 0.35)"
              />
            </g>
          )}

          {/* 3. Traços de Graduação do Béquer */}
          {/* Marca de 25% */}
          <line
            x1="8"
            y1={beakerHeight - (25 / 110) * (beakerHeight - 8) - 4}
            x2="15"
            y2={beakerHeight - (25 / 110) * (beakerHeight - 8) - 4}
            stroke="rgba(255, 255, 255, 0.28)"
            strokeWidth="1.5"
          />
          {/* Marca de 50% */}
          <line
            x1="8"
            y1={beakerHeight - (50 / 110) * (beakerHeight - 8) - 4}
            x2="18"
            y2={beakerHeight - (50 / 110) * (beakerHeight - 8) - 4}
            stroke="rgba(255, 255, 255, 0.35)"
            strokeWidth="1.5"
          />
          {/* Marca de 75% */}
          <line
            x1="8"
            y1={beakerHeight - (75 / 110) * (beakerHeight - 8) - 4}
            x2="15"
            y2={beakerHeight - (75 / 110) * (beakerHeight - 8) - 4}
            stroke="rgba(255, 255, 255, 0.28)"
            strokeWidth="1.5"
          />

          {/* Marca Crítica de 100% (Meta Exata) */}
          <line
            x1="6"
            y1={targetLineY}
            x2={beakerWidth - 6}
            y2={targetLineY}
            stroke={isWithin ? '#4ADE80' : isExceeded ? '#EF4444' : 'rgba(255, 255, 255, 0.65)'}
            strokeWidth="2"
            strokeDasharray={isWithin || isExceeded ? 'none' : '3 2'}
          />

          {/* Linha limite de tolerância máxima (+5%) */}
          <line
            x1="8"
            y1={toleranceLineY}
            x2={beakerWidth - 8}
            y2={toleranceLineY}
            stroke={isExceeded ? '#EF4444' : 'rgba(239, 68, 68, 0.45)'}
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />

          {/* 4. Contorno de Vidro e Bico de Despejo */}
          {/* Bico de vertedouro na esquerda */}
          <path
            d={`M 2 5 
                L 6 9 
                L 6 ${beakerHeight - 8} 
                C 6 ${beakerHeight - 2} 10 ${beakerHeight - 2} 14 ${beakerHeight - 2} 
                L ${beakerWidth - 14} ${beakerHeight - 2} 
                C ${beakerWidth - 10} ${beakerHeight - 2} ${beakerWidth - 6} ${beakerHeight - 2} ${beakerWidth - 6} ${beakerHeight - 8} 
                L ${beakerWidth - 6} 5 
                L ${beakerWidth - 2} 5`}
            stroke={borderColor}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Brilho de reflexo do vidro na parede direita */}
          <line
            x1={beakerWidth - 9}
            y1="14"
            x2={beakerWidth - 9}
            y2={beakerHeight - 16}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>

        {/* Marcador flutuante da meta (100%) à direita do béquer */}
        <div
          style={{
            position: 'absolute',
            top: `${targetLineY - 8}px`,
            left: `${beakerWidth + 2}px`,
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.04em',
            color: isWithin ? '#4ADE80' : isExceeded ? '#F87171' : 'var(--text-muted)',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
          }}
        >
          <span>META</span>
          {isWithin && <Check size={11} strokeWidth={3} />}
          {isExceeded && <AlertTriangle size={11} strokeWidth={3} />}
        </div>
      </div>

      {/* Pílula de Progresso / Porcentagem Numérica */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '2px',
          minWidth: '58px',
        }}
      >
        <span
          style={{
            fontVariantNumeric: 'tabular-nums',
            fontSize: '18px',
            fontWeight: 800,
            lineHeight: 1,
            color: isExceeded ? '#EF4444' : isWithin ? '#10B981' : value > 0 ? '#38BDF8' : 'var(--text-muted)',
          }}
        >
          {roundedPct}%
        </span>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--text-muted)',
          }}
        >
          {isExceeded ? 'Excesso' : isWithin ? 'Atingida' : isCatalyst ? 'Béquer PU' : 'Béquer'}
        </span>
      </div>
    </div>
  );
};
