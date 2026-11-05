import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScreenId } from '../../types';

interface PrepStepperBarProps {
  currentScreen: 'os' | 'recipe' | 'dosing';
  onNavigate: (screen: ScreenId) => void;
}

const STEPS: { id: 'os' | 'recipe' | 'dosing'; num: number; label: string }[] = [
  { id: 'os', num: 1, label: 'Peça & O.S.' },
  { id: 'recipe', num: 2, label: 'Receita & Cálculo' },
  { id: 'dosing', num: 3, label: 'Dosagem em Béquer' },
];

/**
 * PrepStepperBar — Stepper persistente entre as 3 etapas de preparação.
 * Segue a regra de Benji Taylor (motion.md #93 & #112):
 * "Keep header, outer surface and action positions steady while variable content changes inside"
 * "A selection ring or highlight moving between items uses Follow, so it keeps momentum when retargeted"
 */
export const PrepStepperBar: React.FC<PrepStepperBarProps> = ({
  currentScreen,
  onNavigate,
}) => {
  const pillRef = useRef<HTMLSpanElement>(null);
  const stepRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const firstRender = useRef(true);

  const activeIdx = STEPS.findIndex((s) => s.id === currentScreen);

  useEffect(() => {
    const pill = pillRef.current;
    const stepEl = stepRefs.current.get(currentScreen);
    if (!pill || !stepEl) return;

    const targetX = stepEl.offsetLeft;
    const targetY = stepEl.offsetTop;
    const targetW = stepEl.offsetWidth;
    const targetH = stepEl.offsetHeight;

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
      // Curva Travel de Benji Taylor (motion.md #55): cubic-bezier(0.45, 0, 0.1, 1) -> power3.inOut / expo.out
      gsap.to(pill, {
        x: targetX,
        y: targetY,
        width: targetW,
        height: targetH,
        opacity: 1,
        duration: 0.52,
        ease: 'expo.out',
        overwrite: 'auto',
      });
    }
  }, [currentScreen]);

  return (
    <nav
      className="os-stepper-bar"
      aria-label="Etapas da preparação"
      style={{ position: 'relative' }}
    >
      {/* Pílula deslizante contínua (Follow) que viaja entre Etapa 1 -> 2 -> 3 */}
      <span
        ref={pillRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          borderRadius: 'var(--radius-button)',
          background: 'var(--primary-soft)',
          border: '1px solid var(--primary-border)',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0,
          boxSizing: 'border-box',
        }}
      />

      {STEPS.map((step, idx) => {
        const isActive = step.id === currentScreen;
        const isCompleted = idx < activeIdx;
        const isClickable = idx !== activeIdx && (isCompleted || idx === activeIdx + 1);

        return (
          <React.Fragment key={step.id}>
            {idx > 0 && (
              <span className="os-step-separator" aria-hidden="true">
                →
              </span>
            )}
            <div
              ref={(el) => {
                if (el) stepRefs.current.set(step.id, el);
                else stepRefs.current.delete(step.id);
              }}
              className={`os-step-pill ${isActive ? 'active' : ''} ${
                isClickable ? 'clickable' : 'pending'
              }`}
              aria-current={isActive ? 'step' : undefined}
              role={isClickable ? 'button' : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onClick={() => {
                if (isClickable) onNavigate(step.id);
              }}
              onKeyDown={(e) => {
                if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onNavigate(step.id);
                }
              }}
              style={{
                position: 'relative',
                zIndex: 1,
                background: 'transparent',
                borderColor: 'transparent',
              }}
            >
              <span
                className="os-step-badge"
                style={{
                  backgroundColor: isActive
                    ? 'var(--primary)'
                    : isCompleted
                    ? 'var(--ok-soft)'
                    : 'rgba(255, 255, 255, 0.08)',
                  color: isActive
                    ? '#ffffff'
                    : isCompleted
                    ? '#4ade80'
                    : 'var(--text-muted)',
                  transition: 'background-color 0.3s ease, color 0.3s ease',
                }}
              >
                {isCompleted ? '✓' : step.num}
              </span>
              <span className="os-step-text">{step.label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </nav>
  );
};
