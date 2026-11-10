import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export interface PinInputProps {
  length?: number; // padrão 4
  value: string;   // ex: "12" ou "1234"
  hasError?: boolean;
  isSuccess?: boolean;
  errorMessage?: string;
  label?: string;
}

/**
 * PinInput - Indicador Visual de PIN Cinético (GSAP + Apple HIG Industrial)
 * 4 círculos (dots) de 22px com feedback tátil óptico.
 * Vazio: anel fino sutil
 * Preenchido: pop elástico GSAP + brilho sólido luminoso
 * Erro: shake balístico amortecido
 * Sucesso: onda verde em cascata sequencial
 */
export const PinInput: React.FC<PinInputProps> = ({
  length = 4,
  value,
  hasError = false,
  isSuccess = false,
  errorMessage,
  label,
}) => {
  const slots = Array.from({ length }, (_, i) => i);
  const currentLength = value.length;
  const prevLengthRef = useRef<number>(currentLength);
  const dotsRowRef = useRef<HTMLDivElement>(null);
  const dotElementsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Animação de entrada do dígito individual (Pop elástico)
  useEffect(() => {
    if (currentLength > prevLengthRef.current) {
      const newlyFilledIndex = currentLength - 1;
      const targetDot = dotElementsRef.current[newlyFilledIndex];
      if (targetDot) {
        gsap.killTweensOf(targetDot);
        gsap.fromTo(
          targetDot,
          { scale: 0.45, opacity: 0.6 },
          { scale: 1.18, opacity: 1, duration: 0.22, ease: 'back.out(2.4)' }
        );
      }
    } else if (currentLength < prevLengthRef.current) {
      // Quando apaga dígito, o dot esvaziado dá um leve snap
      const emptiedIndex = currentLength;
      const targetDot = dotElementsRef.current[emptiedIndex];
      if (targetDot) {
        gsap.killTweensOf(targetDot);
        gsap.fromTo(
          targetDot,
          { scale: 1.2 },
          { scale: 1, duration: 0.16, ease: 'power2.out' }
        );
      }
    }
    prevLengthRef.current = currentLength;
  }, [currentLength]);

  // Animação de Erro: Shake Cinético Balístico
  useEffect(() => {
    if (hasError && dotsRowRef.current) {
      gsap.killTweensOf(dotsRowRef.current);
      gsap.fromTo(
        dotsRowRef.current,
        { x: 0 },
        {
          keyframes: [
            { x: -14, duration: 0.05 },
            { x: 14, duration: 0.06 },
            { x: -9, duration: 0.06 },
            { x: 9, duration: 0.06 },
            { x: -4, duration: 0.05 },
            { x: 4, duration: 0.05 },
            { x: 0, duration: 0.05 },
          ],
          ease: 'power2.out',
        }
      );
    }
  }, [hasError]);

  // Animação de Sucesso: Cascata Verde Sequencial
  useEffect(() => {
    if (isSuccess && dotElementsRef.current.length > 0) {
      const validDots = dotElementsRef.current.filter(Boolean);
      gsap.killTweensOf(validDots);
      gsap.fromTo(
        validDots,
        { scale: 1.15 },
        {
          scale: 1.4,
          stagger: 0.045,
          duration: 0.14,
          repeat: 1,
          yoyo: true,
          ease: 'power2.out',
        }
      );
    }
  }, [isSuccess]);

  return (
    <div className={`apple-pin-wrapper ${hasError ? 'shake' : ''} ${isSuccess ? 'success' : ''}`}>
      {label && <span className="apple-pin-label">{label}</span>}

      <div
        ref={dotsRowRef}
        className="apple-pin-dots-row"
        role="status"
        aria-label={`PIN com ${currentLength} de ${length} dígitos preenchidos`}
      >
        {slots.map((index) => {
          const isFilled = index < currentLength;
          return (
            <div
              key={index}
              ref={(el) => {
                dotElementsRef.current[index] = el;
              }}
              className={`apple-pin-dot ${isFilled ? 'filled' : 'empty'} ${hasError ? 'error' : ''} ${isSuccess ? 'success' : ''}`}
            />
          );
        })}
      </div>

      {hasError && errorMessage && (
        <div className="apple-pin-error-msg" role="alert">
          {errorMessage}
        </div>
      )}
    </div>
  );
};
