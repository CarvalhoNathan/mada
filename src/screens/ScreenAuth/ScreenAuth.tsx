import React, { useState, useCallback, useEffect, useRef } from 'react';
import { KeyRound, Shield, User } from 'lucide-react';
import gsap from 'gsap';
import { Operator } from '../../types';
import { PIN_ERRO_SIMULADO, MOCK_SUPERVISOR } from '../../data';
import { PinInput } from '../../components/ui/PinInput';
import { NumericKeypad } from '../../components/ui/NumericKeypad';
import { ScreenAuthProps } from './types';
import { AuthOperatorList } from './AuthOperatorList';

export const ScreenAuth: React.FC<ScreenAuthProps> = ({
  operators,
  selectedOperator,
  onSelectOperator,
  onSuccessAuth,
  onNavigateToManager,
  showToast,
  isOffline = false,
  lotes = [],
  preparacoes = [],
}) => {
  const [hasPickedOperator, setHasPickedOperator] = useState<boolean>(false);
  const [isManagerAuthMode, setIsManagerAuthMode] = useState<boolean>(false);
  const [pinEntered, setPinEntered] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [shakeOperatorList, setShakeOperatorList] = useState<boolean>(false);

  const layoutRef = useRef<HTMLDivElement>(null);
  const pinCardRef = useRef<HTMLDivElement>(null);

  // Relógio de simulação em tempo real (1Hz)
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [cabine2SecRestantes, setCabine2SecRestantes] = useState<number>(14 * 60 + 25);

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
      setCabine2SecRestantes((prev) => (prev > 60 ? prev - 1 : 14 * 60 + 25));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Animação de montagem GSAP
  useEffect(() => {
    if (!layoutRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.auth-column-header',
        { y: -10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.28, ease: 'power2.out', clearProps: 'all' }
      );
      gsap.fromTo(
        '.operator-card-apple',
        { x: -16, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.24,
          stagger: 0.045,
          ease: 'power2.out',
          delay: 0.04,
          clearProps: 'all',
        }
      );
      gsap.fromTo(
        '.auth-action-buttons-row',
        { y: 10, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.22,
          ease: 'power2.out',
          delay: 0.16,
          clearProps: 'all',
        }
      );
      if (pinCardRef.current) {
        gsap.fromTo(
          pinCardRef.current,
          { x: 16, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.3,
            ease: 'power2.out',
            delay: 0.08,
            clearProps: 'all',
          }
        );
      }
    }, layoutRef);

    return () => ctx.revert();
  }, []);

  const handleClear = useCallback(() => {
    if (isSuccess) return;
    setPinEntered('');
    setHasError(false);
  }, [isSuccess]);

  const handleBackspace = useCallback(() => {
    if (isSuccess || (!hasPickedOperator && !isManagerAuthMode)) return;
    if (hasError) setHasError(false);
    setPinEntered((prev) => prev.slice(0, -1));
  }, [hasError, isSuccess, hasPickedOperator, isManagerAuthMode]);

  const handleSubmit = useCallback(
    (candidatePin?: string, forceOperator?: Operator, forceManagerMode?: boolean) => {
      if (isSuccess) return;
      const managerMode = forceManagerMode ?? isManagerAuthMode;

      if (!hasPickedOperator && !managerMode && !forceOperator) {
        showToast('Selecione primeiro seu perfil de operador na lista à esquerda.', 'warn');
        return;
      }
      const targetOp = forceOperator || selectedOperator;
      const pin = candidatePin ?? pinEntered;
      if (isOffline) {
        showToast('Ação indisponível: Sistema offline.', 'danger');
        return;
      }
      if (pin.length < 4) {
        showToast('Por favor, digite os 4 dígitos do seu PIN.', 'warn');
        return;
      }

      if (managerMode) {
        const isManagerPinValid =
          pin === MOCK_SUPERVISOR.pin || pin === MOCK_SUPERVISOR.pinAlternativo;
        if (!isManagerPinValid || pin === PIN_ERRO_SIMULADO) {
          setHasError(true);
          setTimeout(() => {
            setPinEntered('');
            setHasError(false);
          }, 800);
          return;
        }

        setIsSuccess(true);
        setTimeout(() => {
          if (onNavigateToManager) {
            onNavigateToManager();
          } else {
            onSuccessAuth();
          }
          setIsSuccess(false);
          setPinEntered('');
        }, 280);
        return;
      }

      const isSupervisorOverride = pin === MOCK_SUPERVISOR.pin;
      const isValid = isSupervisorOverride
        ? true
        : targetOp.pin
        ? pin === targetOp.pin
        : pin !== PIN_ERRO_SIMULADO;

      if (!isValid || pin === PIN_ERRO_SIMULADO) {
        setHasError(true);
        setTimeout(() => {
          setPinEntered('');
          setHasError(false);
        }, 800);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        onSuccessAuth();
        if (isSupervisorOverride) {
          showToast(
            `✓ Acesso liberado pelo Supervisor ${MOCK_SUPERVISOR.nome} para ${targetOp.nome || 'Operador'}!`,
            'success'
          );
        }
        setIsSuccess(false);
        setPinEntered('');
      }, 280);
    },
    [
      isSuccess,
      hasPickedOperator,
      isManagerAuthMode,
      selectedOperator,
      pinEntered,
      isOffline,
      showToast,
      onSuccessAuth,
      onNavigateToManager,
    ]
  );

  const handleDigit = useCallback(
    (digit: string) => {
      if (hasError || isSuccess) return;
      if (!hasPickedOperator && !isManagerAuthMode) {
        setShakeOperatorList(true);
        setTimeout(() => setShakeOperatorList(false), 500);
        showToast('Toque primeiro no seu nome na lista ao lado para liberar o PIN.', 'info');
        return;
      }
      if (pinEntered.length < 4) {
        const nextPin = pinEntered + digit;
        setPinEntered(nextPin);
        if (nextPin.length === 4) {
          setTimeout(() => {
            handleSubmit(nextPin);
          }, 120);
        }
      }
    },
    [hasError, isSuccess, hasPickedOperator, isManagerAuthMode, pinEntered, handleSubmit, showToast]
  );

  const handleSelectOperatorWithMotion = useCallback(
    (op: Operator, cardEl?: HTMLElement | null) => {
      setIsManagerAuthMode(false);
      setHasPickedOperator(true);
      onSelectOperator(op);
      handleClear();

      if (cardEl) {
        gsap.killTweensOf(cardEl);
        gsap.fromTo(
          cardEl,
          { scale: 0.985 },
          { scale: 1, duration: 0.16, ease: 'power2.out', clearProps: 'all' }
        );
      }

      if (pinCardRef.current) {
        gsap.killTweensOf(pinCardRef.current);
        gsap.fromTo(
          pinCardRef.current,
          { scale: 0.99 },
          { scale: 1, duration: 0.2, ease: 'power2.out', clearProps: 'all' }
        );
      }
    },
    [onSelectOperator, handleClear]
  );

  const handleSelectManagerWithMotion = useCallback(
    (btnEl?: HTMLElement | null) => {
      setIsManagerAuthMode(true);
      setHasPickedOperator(false);
      handleClear();

      if (btnEl) {
        gsap.killTweensOf(btnEl);
        gsap.fromTo(
          btnEl,
          { scale: 0.97 },
          { scale: 1, duration: 0.16, ease: 'power2.out', clearProps: 'all' }
        );
      }

      if (pinCardRef.current) {
        gsap.killTweensOf(pinCardRef.current);
        gsap.fromTo(
          pinCardRef.current,
          { scale: 0.99 },
          { scale: 1, duration: 0.2, ease: 'power2.out', clearProps: 'all' }
        );
      }
    },
    [handleClear]
  );

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
  const firstName = selectedName.split(' ')[0];

  return (
    <div ref={layoutRef} className="auth-screen-shell">
      <div className="auth-layout-minimal">
        {/* Coluna da Esquerda: Lista de Operadores e Atalhos */}
        <AuthOperatorList
          operators={operators}
          selectedOperator={selectedOperator}
          hasPickedOperator={hasPickedOperator}
          isManagerAuthMode={isManagerAuthMode}
          shakeOperatorList={shakeOperatorList}
          lotes={lotes}
          preparacoes={preparacoes}
          nowMs={nowMs}
          cabine2SecRestantes={cabine2SecRestantes}
          onSelectOperator={handleSelectOperatorWithMotion}
          onSelectManager={handleSelectManagerWithMotion}
        />

        {/* Coluna da Direita: Teclado Numérico & PIN */}
        <section className="auth-right-column" aria-label="Autenticação com PIN">
          <div
            ref={pinCardRef}
            className={`auth-pin-card-apple ${
              isManagerAuthMode
                ? 'is-manager'
                : hasPickedOperator
                ? 'is-ready'
                : 'is-idle'
            }`}
          >
            <div className="auth-pin-card-header">
              {isManagerAuthMode ? (
                <>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: '999px',
                      background: 'rgba(245, 158, 11, 0.14)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      color: 'var(--tint-amber)',
                      fontSize: '12px',
                      fontWeight: 700,
                      marginBottom: '6px',
                    }}
                  >
                    <Shield size={13} strokeWidth={2.4} /> Acesso Restrito • Gestão & Estoque
                  </div>
                  <h2 className="auth-pin-title">PIN do Gestor, Fábio</h2>
                  <p className="auth-pin-hint">
                    Autorização mestra para auditoria e gestão
                  </p>
                </>
              ) : hasPickedOperator ? (
                <>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: '999px',
                      background: 'rgba(59, 130, 246, 0.12)',
                      border: '1px solid rgba(59, 130, 246, 0.32)',
                      color: 'var(--tint-blue-soft)',
                      fontSize: '12px',
                      fontWeight: 700,
                      marginBottom: '6px',
                    }}
                  >
                    <KeyRound size={13} strokeWidth={2.4} /> Terminal Liberado
                  </div>
                  <h2 className="auth-pin-title">Olá, {firstName}! Digite seu PIN</h2>
                  <p className="auth-pin-hint">
                    Insira seus 4 dígitos para liberar a cabine
                  </p>
                </>
              ) : (
                <>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '5px 14px',
                      borderRadius: '999px',
                      background: 'rgba(var(--overlay-rgb), 0.04)',
                      border: '1px solid rgba(var(--overlay-rgb), 0.10)',
                      color: 'var(--text-muted)',
                      fontSize: '12px',
                      fontWeight: 600,
                      marginBottom: '6px',
                    }}
                  >
                    <User size={13} strokeWidth={2.4} />
                    <span>Aguardando identificação</span>
                  </div>
                  <h2 className="auth-pin-title" style={{ opacity: 0.9 }}>Selecione seu perfil</h2>
                  <p className="auth-pin-hint">
                    Toque no seu nome na lista para liberar seu PIN
                  </p>
                </>
              )}
            </div>

            {/* Alternância Dinâmica: Skeleton no Estado Inicial vs Teclado e PIN Reais ao Selecionar */}
            {!hasPickedOperator && !isManagerAuthMode ? (
              <div style={{ width: '100%', marginTop: '4px' }} aria-hidden="true">
                {/* Skeleton dos 4 Dots de PIN */}
                <div className="auth-dots-skeleton-row">
                  <div className="auth-dot-skeleton" />
                  <div className="auth-dot-skeleton" />
                  <div className="auth-dot-skeleton" />
                  <div className="auth-dot-skeleton" />
                </div>

                {/* Skeleton do Teclado Numérico 3x4 */}
                <div className="auth-keypad-skeleton-grid">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="auth-keypad-skeleton-cell" />
                  ))}
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
