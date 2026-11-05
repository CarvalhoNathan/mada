import React, { useEffect, useState, HTMLAttributes } from 'react';

export interface CountNumberProps extends HTMLAttributes<HTMLSpanElement> {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  stagger?: number;
}

const STRIP = '012345678901234567890123456789'.split('');
const MIDDLE = 10;

const unitOf = (text: string) => {
  const m = /^(.*\d)(\s*)([^\d\s.,]+)$/.exec(text);
  return m
    ? { head: m[1], space: m[2].length > 0, unit: m[3] }
    : { head: text, space: false, unit: '' };
};

export const CountNumber: React.FC<CountNumberProps> = ({
  value,
  format = (n) => Math.round(n).toLocaleString('pt-BR'),
  duration = 460,
  stagger = 32,
  className,
  style,
  ...rest
}) => {
  const text = format(value);
  const { head, space, unit } = unitOf(text);
  const chars = head.split('');

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  let digitCount = 0;
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] >= '0' && chars[i] <= '9') digitCount++;
  }

  let fromRight = digitCount;

  return (
    <span
      {...rest}
      className={`ss-count${className ? ` ${className}` : ''}`}
      data-snap={!mounted ? '' : undefined}
      style={style}
      aria-label={text}
    >
      {chars.map((c, i) => {
        if (c < '0' || c > '9') {
          return (
            <span key={`s-${i}-${c}`} className="ss-count__char" aria-hidden="true">
              {c}
            </span>
          );
        }
        const column = --fromRight;
        const digit = Number(c);
        const at = MIDDLE + digit;
        return (
          <span key={`d-${column}`} className="ss-count__digit" aria-hidden="true">
            <span
              className="ss-count__strip"
              style={{
                transform: `translateY(${-at}em)`,
                transitionDuration: `${duration}ms`,
                transitionDelay: `${column * stagger}ms`,
              }}
            >
              {STRIP.map((n, k) => (
                <span key={k}>{n}</span>
              ))}
            </span>
          </span>
        );
      })}
      {unit && (
        <span className="ss-count__unit" data-space={space || undefined} aria-hidden="true">
          {unit}
        </span>
      )}
    </span>
  );
};
