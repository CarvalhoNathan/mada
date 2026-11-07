import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronsRight, Check, Loader2 } from 'lucide-react';

export interface SlideToConfirmProps {
  onConfirm: () => void;
  label?: string;
  confirmedLabel?: string;
  disabledLabel?: string;
  disabled?: boolean;
  isLoading?: boolean;
  isConfirmed?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * SlideToConfirm — Inspirado no Bencho (bencho.dev)
 * Slider tátil anti-acionamento acidental para chão de fábrica (tablet com luvas).
 */
export const SlideToConfirm: React.FC<SlideToConfirmProps> = ({
  onConfirm,
  label = 'Deslize para concluir dosagem →',
  confirmedLabel = 'Concluído e registrado!',
  disabledLabel = 'Dose todos os componentes para liberar',
  disabled = false,
  isLoading = false,
  isConfirmed = false,
  className = '',
  style,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dragProgress, setDragProgress] = useState(0); // 0 a 1
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef(0);
  const maxDragWidthRef = useRef(0);

  // Calcula largura máxima que o thumb pode percorrer
  const updateMaxDrag = useCallback(() => {
    if (containerRef.current) {
      const containerW = containerRef.current.clientWidth;
      const thumbW = 50; // Largura do thumb
      maxDragWidthRef.current = Math.max(0, containerW - thumbW - 8); // 8px de padding total
    }
  }, []);

  useEffect(() => {
    updateMaxDrag();
    window.addEventListener('resize', updateMaxDrag);
    return () => window.removeEventListener('resize', updateMaxDrag);
  }, [updateMaxDrag]);

  // Se for confirmado externamente, vai para 100%
  useEffect(() => {
    if (isConfirmed) {
      setDragProgress(1);
    } else if (!isLoading && !isDragging) {
      setDragProgress(0);
    }
  }, [isConfirmed, isLoading, isDragging]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || isLoading || isConfirmed) return;
    updateMaxDrag();
    if (maxDragWidthRef.current <= 0) return;

    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || disabled || isLoading || isConfirmed) return;

    const deltaX = e.clientX - dragStartXRef.current;
    const progress = Math.max(0, Math.min(1, deltaX / maxDragWidthRef.current));
    setDragProgress(progress);

    // Se atingir 88% durante o arrasto, ativa a confirmação
    if (progress >= 0.88) {
      setIsDragging(false);
      setDragProgress(1);
      onConfirm();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragProgress >= 0.85) {
      setDragProgress(1);
      onConfirm();
    } else {
      // Mola de retorno suave para a estaca zero
      setDragProgress(0);
    }

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // noop
    }
  };

  const handlePointerCancel = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragProgress(0);
    }
  };

  const currentPixelOffset = dragProgress * maxDragWidthRef.current;

  return (
    <div
      ref={containerRef}
      className={`slide-confirm-rail ${disabled ? 'is-disabled' : ''} ${
        isConfirmed ? 'is-confirmed' : ''
      } ${isLoading ? 'is-loading' : ''} ${className}`}
      style={style}
      role="button"
      aria-disabled={disabled}
      aria-label={disabled ? disabledLabel : isConfirmed ? confirmedLabel : label}
    >
      {/* Trilho de progresso preenchido atrás do thumb */}
      <div
        className="slide-confirm-fill"
        style={{
          width: `calc(${currentPixelOffset}px + 50px)`,
          transition: isDragging ? 'none' : 'width 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      />

      {/* Texto de Instrução Central */}
      <div
        className="slide-confirm-text-container"
        style={{
          opacity: disabled ? 0.45 : isConfirmed ? 1 : Math.max(0, 1 - dragProgress * 1.6),
          transition: isDragging ? 'none' : 'opacity 0.2s ease',
        }}
      >
        <span className="slide-confirm-label">
          {disabled
            ? disabledLabel
            : isConfirmed
            ? confirmedLabel
            : isLoading
            ? 'Gravando baixa FEFO...'
            : label}
        </span>
      </div>

      {/* Botão de Arrasto (Thumb Handle) */}
      <div
        className="slide-confirm-thumb"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{
          transform: `translateX(${currentPixelOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {isLoading ? (
          <Loader2 size={20} className="slide-confirm-spinner" />
        ) : isConfirmed ? (
          <Check size={22} strokeWidth={3} className="slide-confirm-check" />
        ) : (
          <ChevronsRight size={22} strokeWidth={2.4} className="slide-confirm-chevrons" />
        )}
      </div>
    </div>
  );
};
