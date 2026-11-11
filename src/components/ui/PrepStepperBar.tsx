import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Lock } from 'lucide-react';
import { ScreenId } from '../../types';

interface PrepStepperBarProps {
  currentScreen: 'os' | 'recipe' | 'dosing';
  onNavigate: (screen: ScreenId) => void;
  isOSConfirmed?: boolean;
  isRecipeConfirmed?: boolean;
  onBlockedStepClick?: (stepId: 'os' | 'recipe' | 'dosing', reason: string) => void;
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
 *
 * Trava anti-bypass:
 * - Etapa 2 bloqueada até que a Ordem de Serviço seja confirmada na Etapa 1.
 * - Etapa 3 bloqueada até que uma receita seja escolhida/confirmada na Etapa 2.
 */
export const PrepStepperBar: React.FC<PrepStepperBarProps> = ({
  currentScreen,
  onNavigate,
  isOSConfirmed = true,
  isRecipeConfirmed = false,
  onBlockedStepClick,
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

        let canNavigate = false;
        let blockReason = '';

        if (step.id === 'os') {
          // Voltar para O.S. é sempre liberado
          canNavigate = !isActive;
        } else if (step.id === 'recipe') {
          if (currentScreen === 'dosing') {
            // Voltar da dosagem para a receita é liberado
            canNavigate = true;
          } else if (currentScreen === 'os') {
            canNavigate = isOSConfirmed;
            if (!isOSConfirmed) {
              blockReason =
                'Passo obrigatório: Selecione ou confirme a Ordem de Serviço na Etapa 1 para liberar a Receita.';
            }
          }
        } else if (step.id === 'dosing') {
          if (!isOSConfirmed) {
            canNavigate = false;
            blockReason =
              'Passo obrigatório: Selecione ou confirme a Ordem de Serviço na Etapa 1 antes da dosagem.';
          } else if (!isRecipeConfirmed) {
            canNavigate = false;
            blockReason =
              'Passo obrigatório: Escolha com qual produto/receita você vai preparar na Etapa 2 antes de avançar para a dosagem.';
          } else {
            canNavigate = !isActive;
          }
        }

        const isLocked = !isActive && !canNavigate;
        const isClickable = !isActive && canNavigate;

        const handleStepInteraction = () => {
          if (isActive) return;
          if (canNavigate) {
            onNavigate(step.id);
          } else if (blockReason && onBlockedStepClick) {
            onBlockedStepClick(step.id, blockReason);
          }
        };

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
              role="button"
              tabIndex={isClickable || isLocked ? 0 : undefined}
              onClick={handleStepInteraction}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleStepInteraction();
                }
              }}
              title={
                isLocked
                  ? blockReason || 'Etapa bloqueada'
                  : isActive
                  ? `Etapa atual: ${step.label}`
                  : `Ir para ${step.label}`
              }
              style={{
                position: 'relative',
                zIndex: 1,
                background: 'transparent',
                borderColor: 'transparent',
                cursor: isClickable ? 'pointer' : isLocked ? 'not-allowed' : 'default',
              }}
            >
              <span
                className="os-step-badge"
                style={{
                  backgroundColor: isActive
                    ? 'var(--primary)'
                    : isCompleted
                    ? 'var(--ok-soft)'
                    : isLocked
                    ? 'rgba(245, 158, 11, 0.12)'
                    : 'rgba(255, 255, 255, 0.08)',
                  color: isActive
                    ? 'var(--primary-foreground)'
                    : isCompleted
                    ? '#4ade80'
                    : isLocked
                    ? '#fbbf24'
                    : 'var(--text-muted)',
                  border: isLocked
                    ? '1px solid rgba(245, 158, 11, 0.35)'
                    : '1px solid transparent',
                  fontWeight: isActive ? 800 : 700,
                  transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isCompleted ? (
                  '✓'
                ) : isLocked ? (
                  <Lock size={11} strokeWidth={2.8} />
                ) : (
                  step.num
                )}
              </span>
              <span className="os-step-text">{step.label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </nav>
  );
};
