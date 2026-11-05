import React, { useState, useCallback, useEffect } from 'react';
import { Check, HelpCircle, ShieldCheck, Wifi, WifiOff, KeyRound, Sparkles, Clock, Shield } from 'lucide-react';
import { Operator } from '../types';
import { PIN_ERRO_SIMULADO, MOCK_SUPERVISOR } from '../data';
import { PinInput } from '../components/ui/PinInput';
import { NumericKeypad } from '../components/ui/NumericKeypad';
import { Button } from '../components/ui/Button';

interface ScreenAuthProps {
  operators: Operator[];
  selectedOperator: Operator;
  onSelectOperator: (op: Operator) => void;
  onSuccessAuth: () => void;
  onNavigateToManager?: () => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'warn' | 'danger') => void;
  isOffline?: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export const ScreenAuth: React.FC<ScreenAuthProps> = ({
  operators,
  selectedOperator,
  onSelectOperator,
  onSuccessAuth,
  onNavigateToManager,
  showToast,
  isOffline = false,
}) => {
  const [pinEntered, setPinEntered] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);

  // Relógio Industrial em Tempo Real
  const [currentTime, setCurrentTime] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });
  const [currentDate, setCurrentDate] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', ''));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Modo Limpeza de Tela Touch (bloqueia o toque por 15s)
  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [cleaningSeconds, setCleaningSeconds] = useState<number>(15);

  const handleStartCleaning = () => {
    setCleaningSeconds(15);
    setIsCleaning(true);
  };

  useEffect(() => {
    if (!isCleaning) return;
    const interval = setInterval(() => {
      setCleaningSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsCleaning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isCleaning]);

  const handleClear = useCallback(() => {
    if (isSuccess) return;
    setPinEntered('');
    setHasError(false);
  }, [isSuccess]);

  const handleBackspace = useCallback(() => {
    if (isSuccess) return;
    if (hasError) setHasError(false);
    setPinEntered(prev => prev.slice(0, -1));
  }, [hasError, isSuccess]);

  const handleSubmit = useCallback((candidatePin?: string) => {
    if (isSuccess) return;
    const pin = candidatePin ?? pinEntered;
    if (isOffline) {
      showToast('Ação indisponível: Sistema offline.', 'danger');
      return;
    }
    if (pin.length < 4) {
      showToast('Por favor, digite os 4 dígitos do seu PIN.', 'warn');
      return;
    }

    const isSupervisorOverride = pin === MOCK_SUPERVISOR.pin;
    const isValid = isSupervisorOverride
      ? true
      : selectedOperator.pin
      ? pin === selectedOperator.pin
      : pin !== PIN_ERRO_SIMULADO;

    if (!isValid || pin === PIN_ERRO_SIMULADO) {
      setHasError(true);
      setTimeout(() => {
        setPinEntered('');
        setHasError(false);
      }, 800);
      return;
    }

    // Microinteração de Sucesso: acende os 4 dots em verde luminoso antes da transição
    setIsSuccess(true);
    setTimeout(() => {
      onSuccessAuth();
      if (isSupervisorOverride) {
        showToast(
          `✓ Acesso liberado pelo Supervisor ${MOCK_SUPERVISOR.nome} para ${selectedOperator.nome || 'Operador'}!`,
          'success'
        );
      }
      setIsSuccess(false);
      setPinEntered('');
    }, 280);
  }, [isSuccess, pinEntered, isOffline, selectedOperator.pin, selectedOperator.nome, showToast, onSuccessAuth]);

  const handleDigit = useCallback((digit: string) => {
    if (hasError || isSuccess) return;
    if (pinEntered.length < 4) {
      const nextPin = pinEntered + digit;
      setPinEntered(nextPin);
      if (nextPin.length === 4) {
        setTimeout(() => {
          handleSubmit(nextPin);
        }, 120);
      }
    }
  }, [hasError, isSuccess, pinEntered, handleSubmit]);

  // Suporte a teclado físico para conveniência e acessibilidade
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSuccess) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        handleClear();
      } else if (e.key === 'Enter') {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSuccess, handleDigit, handleBackspace, handleClear, handleSubmit]);

  const selectedName = selectedOperator.nome || selectedOperator.name || 'Operador';
  const selectedRole = selectedOperator.papel || selectedOperator.role || 'Operador de Pintura';

  return (
    <div className="auth-screen-shell">
      {/* 0. Overlay de Limpeza de Tela Touch (15 segundos) */}
      {isCleaning && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            userSelect: 'none',
          }}
        >
          <Sparkles size={44} color="#FAFAFA" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 8px 0', color: '#FAFAFA' }}>
            Modo de Limpeza de Tela Ativo
          </h2>
          <p style={{ fontSize: '16px', color: '#a1a1aa', margin: '0 0 24px 0' }}>
            Passe o pano no display do tablet. Os toques estão temporariamente bloqueados.
          </p>
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: '#FAFAFA',
              boxShadow: '0 0 24px rgba(255, 255, 255, 0.15)',
            }}
          >
            {cleaningSeconds}s
          </div>
          <button
            type="button"
            onClick={() => setIsCleaning(false)}
            style={{
              marginTop: '28px',
              padding: '10px 22px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              fontSize: '15px',
              cursor: 'pointer',
            }}
          >
            Encerrar limpeza agora
          </button>
        </div>
      )}

      {/* Barra Superior de Identificação da Estação Industrial */}
      <header className="auth-station-bar" aria-label="Identificação da estação">
        <div className="auth-station-brand">
          <div className="boardui-brand-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 2v7.31L4.14 20a2 2 0 0 0 1.72 3h12.28a2 2 0 0 0 1.72-3L14 9.31V2" />
              <path d="M8.5 2h7" />
              <path d="M7 16h10" />
            </svg>
          </div>
          <div className="auth-station-titles">
            <span className="auth-station-title">Mada Marcenaria • Cabine de Pintura</span>
            <span className="auth-station-subtitle">Terminal de Dosagem Homologada & Controle FEFO</span>
          </div>
        </div>

        <div className="auth-station-status">
          {/* Relógio Industrial em Tempo Real */}
          <div className="auth-header-clock" title="Horário oficial da marcenaria">
            <Clock size={15} />
            <span>{currentTime} • {currentDate}</span>
          </div>

          {/* Botão de Limpeza de Tela */}
          <button
            type="button"
            className="boardui-clean-btn"
            onClick={handleStartCleaning}
            title="Limpar tela (bloqueia o toque por 15 segundos)"
            aria-label="Limpar tela"
          >
            <Sparkles size={15} strokeWidth={2.2} />
            <span>Limpar tela</span>
          </button>

          <div className={`auth-status-pill ${isOffline ? 'is-offline' : 'is-online'}`}>
            {isOffline ? <WifiOff size={18} aria-hidden="true" /> : <Wifi size={18} aria-hidden="true" />}
            <span>{isOffline ? 'Terminal Offline' : 'Balança & Estoque Online'}</span>
          </div>
        </div>
      </header>

      <div className="auth-layout-minimal">
        {/* Coluna da Esquerda: Seleção do Pintor */}
        <section className="auth-left-column" aria-label="Seleção de Operador">
          <div className="auth-column-header">
            <h1 className="auth-title-minimal">Quem está pintando?</h1>
            <p className="auth-subtitle-minimal">
              Toque no seu nome e digite o PIN de 4 dígitos para liberar a cabine.
            </p>
          </div>

          <div className="auth-operators-vertical" role="radiogroup" aria-label="Operadores disponíveis">
            {operators.map((op) => {
              const opName = op.nome || op.name || '';
              const opRole = op.papel || op.role || 'Operador de Pintura';
              const isSelected = op.id ? op.id === selectedOperator.id : opName === selectedName;

              return (
                <button
                  key={op.id || opName}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`operator-card-apple ${isSelected ? 'is-active' : ''}`}
                  onClick={() => {
                    onSelectOperator(op);
                    handleClear();
                  }}
                >
                  <div className="operator-avatar-circle" aria-hidden="true">
                    {getInitials(opName)}
                  </div>
                  <div className="operator-info-apple">
                    <span className="operator-name-apple">{opName}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <span className="operator-role-apple">{opRole}</span>
                      {isSelected && (
                        <span className="operator-shift-badge">● No turno</span>
                      )}
                    </div>
                  </div>
                  <div className={`operator-select-indicator ${isSelected ? 'is-selected' : ''}`} aria-hidden="true">
                    {isSelected && <Check size={20} strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Linha de Ações Auxiliares: Acesso Supervisor & Ajuda */}
          <div className="auth-action-buttons-row">
            <button
              type="button"
              className="auth-supervisor-btn"
              onClick={() => {
                if (onNavigateToManager) {
                  onNavigateToManager();
                } else {
                  handleSubmit(MOCK_SUPERVISOR.pin);
                }
              }}
              title="Acesso direto ao painel gerencial do Fábio"
            >
              <Shield size={16} strokeWidth={2.4} color="currentColor" />
              <span>Painel do Gestor (Fábio)</span>
            </button>

            <button
              type="button"
              className="auth-help-btn"
              onClick={() => setIsHelpModalOpen(true)}
            >
              <HelpCircle size={17} aria-hidden="true" />
              <span>PINs Demo</span>
            </button>
          </div>
        </section>

        {/* Coluna da Direita: Teclado Numérico & PIN estilo Apple */}
        <section className="auth-right-column" aria-label="Autenticação com PIN">
          <div className="auth-pin-card-apple">
            <div className="auth-pin-card-header">
              <div className="auth-pin-operator-chip">
                <ShieldCheck size={18} aria-hidden="true" />
                <span>{selectedRole}</span>
              </div>
              <h2 className="auth-pin-title">PIN de {selectedName}</h2>
              <p className="auth-pin-hint">Digite os 4 dígitos para iniciar o turno</p>
            </div>

            <PinInput
              length={4}
              value={pinEntered}
              hasError={hasError}
              isSuccess={isSuccess}
              errorMessage="PIN incorreto. Tente novamente."
            />

            <NumericKeypad
              onDigit={handleDigit}
              onBackspace={handleBackspace}
              onClear={handleClear}
              disabled={isOffline}
            />
          </div>
        </section>
      </div>

      {/* Modal de Ajuda Operacional & Credenciais de Demonstração */}
      {isHelpModalOpen && (
        <div
          className="ds-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-help-modal-title"
          onClick={() => setIsHelpModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div
            className="ds-modal-card ds-modal-standard"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '100%',
              backgroundColor: 'var(--card)',
              border: '1.5px solid var(--border-strong)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#FAFAFA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <KeyRound size={22} />
                </div>
                <div>
                  <h2 id="auth-help-modal-title" style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>
                    Suporte da Cabine & PINs Demo
                  </h2>
                  <p style={{ margin: '2px 0 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>
                    Credenciais homologadas para avaliação do terminal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                aria-label="Fechar ajuda"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  fontSize: '18px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(34, 197, 94, 0.08)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                    Pintores (Carlos, Ana, Marcos)
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    Acesso padrão para preparação, dosagem e devolução
                  </div>
                </div>
                <span
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: 'rgba(34, 197, 94, 0.2)',
                    color: '#4ade80',
                    fontSize: '18px',
                    fontWeight: 800,
                    letterSpacing: '2px',
                  }}
                >
                  1234
                </span>
              </div>

              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                    Supervisor de Cabine (Fábio)
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    PIN Mestre: libera o terminal se o pintor esquecer a senha ou autoriza excesso (&gt;5%)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsHelpModalOpen(false);
                    setPinEntered('9999');
                    setTimeout(() => handleSubmit('9999'), 120);
                  }}
                  title="Toque para liberar com o PIN Mestre 9999"
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.2)',
                    border: '1px solid rgba(245, 158, 11, 0.45)',
                    color: '#fbbf24',
                    fontSize: '18px',
                    fontWeight: 800,
                    letterSpacing: '2px',
                    cursor: 'pointer',
                  }}
                >
                  9999
                </button>
              </div>

              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                    Simular Bloqueio de PIN Incorreto
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    Testa o feedback visual de erro na autenticação
                  </div>
                </div>
                <span
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#f87171',
                    fontSize: '18px',
                    fontWeight: 800,
                    letterSpacing: '2px',
                  }}
                >
                  0000
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <Button variant="secondary" size="md" onClick={() => setIsHelpModalOpen(false)}>
                Fechar
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setIsHelpModalOpen(false);
                  setPinEntered('1234');
                  setTimeout(() => handleSubmit('1234'), 120);
                }}
              >
                Entrar agora com PIN 1234 →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


