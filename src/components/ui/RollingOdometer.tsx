import React, { useEffect, useState, useRef, useMemo } from 'react';

export interface RollingOdometerProps {
  value: number;
  format?: (n: number) => string;
  unit?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Duração da rotação mecânica em ms (padrão 420ms) */
  duration?: number;
  /** Stagger entre dígitos da direita para a esquerda em ms */
  stagger?: number;
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const OFFSET_BASE = 10; // Começa no segundo conjunto para permitir giros contínuos

/**
 * RollingOdometer — Inspirado no Number Ticker do Fancy Components e Bencho
 * Medidor mecânico com dígitos de tambor vertical (Geist Mono tabular)
 */
export const RollingOdometer: React.FC<RollingOdometerProps> = ({
  value,
  format,
  unit,
  className = '',
  style,
  duration = 420,
  stagger = 28,
}) => {
  const [mounted, setMounted] = useState(false);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const formattedStr = useMemo(() => {
    if (format) return format(value);
    return Math.round(value).toLocaleString('pt-BR');
  }, [value, format]);

  const chars = formattedStr.split('');

  // Conta quantos dígitos temos para stagger da direita para a esquerda
  let totalDigits = 0;
  for (const c of chars) {
    if (c >= '0' && c <= '9') totalDigits++;
  }

  let digitPosFromRight = totalDigits;

  return (
    <span
      className={`odometer-drum-root ${className}`}
      style={style}
      aria-label={`${formattedStr}${unit ? ` ${unit}` : ''}`}
    >
      <span className="odometer-drum-viewport" aria-hidden="true">
        {chars.map((char, idx) => {
          const isDigit = char >= '0' && char <= '9';

          if (!isDigit) {
            return (
              <span key={`char-${idx}-${char}`} className="odometer-drum-separator">
                {char}
              </span>
            );
          }

          const digit = parseInt(char, 10);
          const colIndex = --digitPosFromRight;
          const targetOffset = -(OFFSET_BASE + digit);

          return (
            <span key={`col-${colIndex}`} className="odometer-drum-column">
              <span
                className="odometer-drum-ribbon"
                style={{
                  transform: mounted ? `translateY(${targetOffset}em)` : `translateY(${targetOffset}em)`,
                  transitionDuration: mounted ? `${duration}ms` : '0ms',
                  transitionDelay: mounted ? `${colIndex * stagger}ms` : '0ms',
                }}
              >
                {DIGITS.map((d, dIdx) => (
                  <span key={dIdx} className="odometer-drum-digit">
                    {d}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
      </span>

      {unit && <span className="odometer-drum-unit" aria-hidden="true">{unit}</span>}
    </span>
  );
};
