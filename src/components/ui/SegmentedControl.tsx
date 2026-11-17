import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export interface SegmentedOption<T extends string | number> {
  id: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  tone?: 'primary' | 'ok' | 'warn' | 'danger' | 'neutral';
}

interface SegmentedControlProps<T extends string | number> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}

const TONE_STYLES: Record<
  NonNullable<SegmentedOption<string>['tone']>,
  { bg: string; border: string; text: string }
> = {
  primary: {
    bg: 'var(--primary-soft)',
    border: 'var(--primary-border)',
    text: 'var(--text)',
  },
  ok: {
    bg: 'var(--ok-soft)',
    border: 'var(--ok-border)',
    text: 'var(--tint-green)',
  },
  warn: {
    bg: 'var(--warn-soft)',
    border: 'var(--warn-border)',
    text: 'var(--tint-amber)',
  },
  danger: {
    bg: 'var(--danger-soft)',
    border: 'var(--danger-border)',
    text: 'var(--tint-red)',
  },
  neutral: {
    bg: 'var(--card-hover)',
    border: 'rgba(var(--overlay-rgb), 0.14)',
    text: 'var(--text)',
  },
};

/**
 * SegmentedControl - Controle segmentado com pílula deslizante via GSAP (Stageshow Follow).
 * A pílula de seleção mantém o momento físico quando o usuário troca de opção.
 */
export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'md',
  style,
}: SegmentedControlProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const btnRefs = useRef<Map<T, HTMLButtonElement>>(new Map());
  const firstRender = useRef(true);

  const activeOpt = options.find((o) => o.id === value);
  const activeTone = TONE_STYLES[activeOpt?.tone || 'primary'];

  useEffect(() => {
    const pill = pillRef.current;
    const btn = btnRefs.current.get(value);
    if (!pill) return;
    if (!btn) {
      gsap.set(pill, { opacity: 0 });
      return;
    }

    const targetX = btn.offsetLeft;
    const targetW = btn.offsetWidth;
    const targetH = btn.offsetHeight;
    const targetY = btn.offsetTop;

    if (firstRender.current) {
      gsap.set(pill, {
        x: targetX,
        y: targetY,
        width: targetW,
        height: targetH,
        opacity: 1,
      });
      firstRender.current = false;
    } else {
      // Regra de Benji Taylor (motion.md #55 & #111):
      // "Landings are soft: decelerate over the last third, back to size before arrival, no bounce"
      gsap.to(pill, {
        x: targetX,
        y: targetY,
        width: targetW,
        height: targetH,
        opacity: 1,
        duration: 0.42,
        ease: 'expo.out',
        overwrite: 'auto',
      });
    }
  }, [value, options]);

  const minHeight = size === 'sm' ? '36px' : '40px';
  const fontSize = size === 'sm' ? '13px' : '14px';
  const paddingX = size === 'sm' ? '12px' : '15px';

  return (
    <div
      ref={trackRef}
      role="group"
      aria-label={ariaLabel}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px',
        borderRadius: '14px',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        overflowX: 'auto',
        maxWidth: '100%',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {/* Pílula deslizante animada por GSAP */}
      <span
        ref={pillRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          borderRadius: 'var(--radius-button)',
          background: activeTone.bg,
          border: `1px solid ${activeTone.border}`,
          pointerEvents: 'none',
          opacity: 0,
          zIndex: 0,
          transition: 'background-color 0.2s ease, border-color 0.2s ease',
          boxSizing: 'border-box',
        }}
      />

      {options.map((opt) => {
        const isActive = opt.id === value;
        const optTone = TONE_STYLES[opt.tone || 'primary'];

        return (
          <button
            key={String(opt.id)}
            ref={(el) => {
              if (el) {
                btnRefs.current.set(opt.id, el);
              } else {
                btnRefs.current.delete(opt.id);
              }
            }}
            type="button"
            onClick={() => onChange(opt.id)}
            style={{
              position: 'relative',
              zIndex: 1,
              minHeight,
              padding: `0 ${paddingX}`,
              borderRadius: 'var(--radius-button)',
              border: '1px solid transparent',
              background: 'transparent',
              color: isActive ? optTone.text : 'var(--text-muted)',
              fontSize,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              fontFamily: 'inherit',
              transition: 'color 0.18s ease',
            }}
          >
            {opt.icon && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: isActive ? (opt.tone ? optTone.text : 'var(--primary)') : 'var(--text-muted)',
                }}
              >
                {opt.icon}
              </span>
            )}
            <span>{opt.label}</span>
            {opt.badge}
          </button>
        );
      })}
    </div>
  );
}
