import React from 'react';
import { Smartphone, Share, PlusSquare, CheckCircle2, X, Download, ShieldCheck, Zap, WifiOff } from 'lucide-react';
import { usePwaInstall } from '../../hooks/usePwaInstall';

interface ModalPwaInstallProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModalPwaInstall: React.FC<ModalPwaInstallProps> = ({ isOpen, onClose }) => {
  const { isInstalled, isIos, hasPrompt, promptInstall } = usePwaInstall();
  const [installState, setInstallState] = React.useState<'idle' | 'installing' | 'success' | 'dismissed'>('idle');

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    setInstallState('installing');
    const result = await promptInstall();
    if (result === 'accepted') {
      setInstallState('success');
      setTimeout(() => {
        onClose();
      }, 2000);
    } else if (result === 'dismissed') {
      setInstallState('dismissed');
    } else {
      setInstallState('idle');
    }
  };

  return (
    <div
      className="ds-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="os-modal-card-apple"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          width: '92%',
          padding: '24px 26px',
          gap: '18px',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Cabeçalho */}
        <div className="os-modal-header-apple" style={{ alignItems: 'flex-start' }}>
          <div className="os-modal-header-left" style={{ gap: '14px' }}>
            <div
              className="os-modal-icon-badge"
              aria-hidden="true"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(37, 99, 235, 0.16)',
                border: '1px solid rgba(37, 99, 235, 0.35)',
                color: '#38BDF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Smartphone size={24} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="os-modal-title-apple" style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>
                Adicionar à Tela Inicial
              </h3>
              <p className="os-modal-subtitle-apple" style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Mada Marcenaria • Terminal de Químicos
              </p>
            </div>
          </div>
          <button
            type="button"
            className="os-modal-close-apple"
            onClick={onClose}
            aria-label="Fechar modal"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>

        {/* Prévia do Ícone do App */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '14px 18px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
            borderRadius: '14px',
          }}
        >
          <img
            src="/pwa-192x192.png"
            alt="Ícone Mada Químicos"
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
            }}
          />
          <div>
            <strong style={{ display: 'block', fontSize: '0.98rem', color: 'var(--text)' }}>
              Mada Químicos
            </strong>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Aplicativo Web Progressivo (PWA Standalone)
            </span>
          </div>
        </div>

        {/* Benefícios */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.86rem', color: 'var(--text-secondary, #94A3B8)' }}>
            <Zap size={16} color="#38BDF8" strokeWidth={2.4} />
            <span>Acesso instantâneo em tela cheia direto do celular ou tablet</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.86rem', color: 'var(--text-secondary, #94A3B8)' }}>
            <WifiOff size={16} color="#34D399" strokeWidth={2.4} />
            <span>Funciona offline na fábrica com fórmulas e lotes salvos no dispositivo</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.86rem', color: 'var(--text-secondary, #94A3B8)' }}>
            <ShieldCheck size={16} color="#A78BFA" strokeWidth={2.4} />
            <span>Sem barras de URL de navegador, proporcionando experiência de app nativo</span>
          </div>
        </div>

        {/* Conteúdo Dinâmico por Plataforma */}
        {isInstalled ? (
          <div
            style={{
              padding: '14px',
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#4ADE80',
            }}
          >
            <CheckCircle2 size={20} strokeWidth={2.4} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              O aplicativo já está instalado e ativo em modo standalone!
            </span>
          </div>
        ) : isIos ? (
          /* Instruções Específicas para iPhone / iPad Safari */
          <div
            style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.22)',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#60A5FA' }}>
              Como instalar no iPhone / iPad (Safari):
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#93C5FD',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  flexShrink: 0,
                }}
              >
                1
              </div>
              <div style={{ fontSize: '0.86rem', color: 'var(--text)' }}>
                Toque no botão <strong>Compartilhar</strong> na barra inferior do Safari (ícone{' '}
                <Share size={15} style={{ verticalAlign: 'middle', display: 'inline', margin: '0 2px' }} />
                ).
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#93C5FD',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  flexShrink: 0,
                }}
              >
                2
              </div>
              <div style={{ fontSize: '0.86rem', color: 'var(--text)' }}>
                Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong> (ícone{' '}
                <PlusSquare size={15} style={{ verticalAlign: 'middle', display: 'inline', margin: '0 2px' }} />
                ).
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#93C5FD',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  flexShrink: 0,
                }}
              >
                3
              </div>
              <div style={{ fontSize: '0.86rem', color: 'var(--text)' }}>
                Toque em <strong>"Adicionar"</strong> no canto superior direito para fixar o ícone oficial.
              </div>
            </div>
          </div>
        ) : (
          /* Android / Chrome / Desktop */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {hasPrompt ? (
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={installState === 'installing'}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  background: 'var(--primary, #2563EB)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.96rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                  transition: 'opacity 0.2s',
                }}
              >
                <Download size={18} strokeWidth={2.4} />
                <span>
                  {installState === 'installing' ? 'Instalando...' : 'Instalar Agora na Tela Inicial'}
                </span>
              </button>
            ) : (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                  borderRadius: '12px',
                  padding: '14px',
                  fontSize: '0.86rem',
                  color: 'var(--text-muted)',
                  lineHeight: '1.45',
                }}
              >
                Para instalar pelo navegador Android (Chrome/Edge): toque no menu de <strong>três pontos (⋮)</strong> no canto superior direito e selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
              </div>
            )}
          </div>
        )}

        {/* Rodapé */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'var(--text)',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
