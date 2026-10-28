import React, { useEffect, useState } from 'react';

export interface ToastProps {
  message: string;
  type?: 'info' | 'ok' | 'warn' | 'danger';
  duration?: number;
  onClose?: () => void;
}

function cleanMessage(text: string): string {
  const prefixes = ['✓', 'ℹ️', 'ℹ', '⚠️', '🛑'];
  let cleaned = text.trim();
  for (const p of prefixes) {
    if (cleaned.startsWith(p)) {
      cleaned = cleaned.slice(p.length).trim();
    }
  }
  return cleaned;
}

/**
 * Toast - Notificações Flutuantes Padrão BoardUI
 * Pílula em vidro fosco (#16171B) posicionada na parte inferior central (bottom: 28px)
 * para NUNCA sobrepor o cabeçalho, chips de rede ou áreas de ação.
 */
export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 3200,
  onClose,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) setTimeout(onClose, 250);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  const displayMessage = cleanMessage(message);

  // Configurações visuais por variante no design BoardUI
  const variantConfig = {
    ok: {
      accentColor: '#22c55e',
      badgeBg: 'rgba(34, 197, 94, 0.15)',
      badgeBorder: 'rgba(34, 197, 94, 0.35)',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    info: {
      accentColor: '#2b7fff',
      badgeBg: 'rgba(43, 127, 255, 0.15)',
      badgeBorder: 'rgba(43, 127, 255, 0.35)',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2b7fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      ),
    },
    warn: {
      accentColor: '#f59e0b',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      badgeBorder: 'rgba(245, 158, 11, 0.35)',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    danger: {
      accentColor: '#ef4444',
      badgeBg: 'rgba(239, 68, 68, 0.15)',
      badgeBorder: 'rgba(239, 68, 68, 0.35)',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
    },
  };

  const current = variantConfig[type] || variantConfig.info;

  return (
    <div
      role="status"
      aria-live="polite"
      className="boardui-toast-pill"
      style={{
        position: 'fixed',
        bottom: '28px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        backgroundColor: '#16171b',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '9999px',
        padding: '8px 18px 8px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.65), 0 0 1px rgba(255, 255, 255, 0.2)',
        animation: 'boarduiToastSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: 'auto',
        maxWidth: '90vw',
      }}
    >
      {/* Ícone Semântico em Pílula */}
      <div
        style={{
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          backgroundColor: current.badgeBg,
          border: `1px solid ${current.badgeBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {current.icon}
      </div>

      {/* Texto da Notificação */}
      <span
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#ededed',
          lineHeight: 1.3,
          letterSpacing: '-0.01em',
        }}
      >
        {displayMessage}
      </span>

      {/* Botão de Fechar Rápido */}
      {onClose && (
        <button
          type="button"
          onClick={() => {
            setVisible(false);
            setTimeout(onClose, 200);
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#71717a',
            fontSize: '14px',
            cursor: 'pointer',
            padding: '2px',
            marginLeft: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Fechar notificação"
        >
          ✕
        </button>
      )}
    </div>
  );
};
