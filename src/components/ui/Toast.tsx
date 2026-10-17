import React, { useEffect, useState } from 'react';

export interface ToastProps {
  message: string;
  type?: 'info' | 'ok' | 'warn' | 'danger';
  duration?: number;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onClose
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  const typeStyles: Record<string, { bg: string; color: string; border: string; icon: string }> = {
    info: { bg: 'var(--card)', color: 'var(--text)', border: 'var(--border)', icon: 'ℹ️' },
    ok: { bg: 'var(--ok-soft)', color: 'var(--ok)', border: 'var(--ok-border)', icon: '✓' },
    warn: { bg: 'var(--warn-soft)', color: 'var(--warn)', border: 'var(--warn-border)', icon: '⚠️' },
    danger: { bg: 'var(--danger-soft)', color: 'var(--danger)', border: 'var(--danger-border)', icon: '🛑' }
  };

  const current = typeStyles[type];

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        backgroundColor: current.bg,
        color: current.color,
        border: `2px solid ${current.border}`,
        borderRadius: 'var(--radius-pill)',
        padding: '12px 28px',
        fontSize: 'var(--fs-body)',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        animation: 'slideDownToast 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: 'none'
      }}
    >
      <span>{current.icon}</span>
      <span>{message}</span>
    </div>
  );
};
