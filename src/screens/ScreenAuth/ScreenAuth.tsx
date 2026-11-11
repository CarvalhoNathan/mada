import React, { useState, useCallback, useEffect, useRef } from 'react';
import { KeyRound, Shield, Lock } from 'lucide-react';
import gsap from 'gsap';
import { Operator } from '../../types';
import { PIN_ERRO_SIMULADO, MOCK_SUPERVISOR } from '../../data';
import { PinInput } from '../../components/ui/PinInput';
import { NumericKeypad } from '../../components/ui/NumericKeypad';
import { ScreenAuthProps } from './types';
import { AuthOperatorList } from './AuthOperatorList';
import { AuthHelpModal } from './AuthHelpModal';

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
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
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
      gsap.from('.auth-column-header', {
        y: -10,
        opacity: 0,
        duration: 0.28,
        ease: 'power2.out',
      });
      gsap.from('.operator-card-apple', {
        x: -16,
        opacity: 0,
        duration: 0.24,
        stagger: 0.045,
        ease: 'power2.out',
        delay: 0.04,
      });
      gsap.from('.auth-action-buttons-row', {
        y: 10,
        opacity: 0,
        duration: 0.22,
        ease: 'power2.out',
        delay: 0.16,
      });
      if (pinCardRef.current) {
        gsap.from(pinCardRef.current, {
          x: 16,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out',
          delay: 0.08,
        });
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
          { scale: 0.98 },
          { scale: 1, duration: 0.22, ease: 'back.out(2)' }
        );
      }

      if (pinCardRef.current) {
        gsap.killTweensOf(pinCardRef.current);
        gsap.fromTo(
          pinCardRef.current,
          { scale: 0.985 },
          { scale: 1, duration: 0.25, ease: 'back.out(1.8)' }
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
          { scale: 0.96 },
          { scale: 1, duration: 0.2, ease: 'back.out(2)' }
        );
      }

      if (pinCardRef.current) {
        gsap.killTweensOf(pinCardRef.current);
        gsap.fromTo(
          pinCardRef.current,
          { scale: 0.985 },
          { scale: 1, duration: 0.25, ease: 'back.out(1.8)' }
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
          onOpenHelpModal={() => setIsHelpModalOpen(true)}
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
                : ''
            }`}
            style={{
              opacity: hasPickedOperator || isManagerAuthMode ? 1 : 0.78,
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
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
                      color: '#FBBF24',
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
                      color: '#93C5FD',
                      fontSize: '12px',
                      fontWeight: 700,
                      marginBottom: '6px',
                    }}
                  >
                    <KeyRound size={13} strokeWidth={2.4} /> Terminal Liberado
                  </div>
                  <h2 className="auth-pin-title">Digite seu PIN, {firstName}</h2>
                  <p className="auth-pin-hint">
                    Insira seus 4 dígitos para autorizar a estação
                  </p>
                </>
              ) : (
                <>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: '999px',
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      color: '#FBBF24',
                      fontSize: '12px',
                      fontWeight: 700,
                      marginBottom: '6px',
                    }}
                  >
                    <Lock size={13} strokeWidth={2.4} /> Aguardando seleção de operador
                  </div>
                  <h2 className="auth-pin-title">Selecione seu perfil</h2>
                  <p className="auth-pin-hint">
                    Toque no seu nome na lista ao lado para liberar o teclado
                  </p>
                </>
              )}
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
              disabled={(!hasPickedOperator && !isManagerAuthMode) || isOffline}
            />
          </div>
        </section>
      </div>

      {/* Modal de Suporte da Cabine & PINs Demo */}
      <AuthHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        onSelectPin={(pin, isManager) => {
          setIsHelpModalOpen(false);
          if (isManager) {
            setIsManagerAuthMode(true);
            setHasPickedOperator(false);
            setPinEntered(pin);
            setTimeout(() => handleSubmit(pin, selectedOperator, true), 120);
          } else {
            setHasPickedOperator(true);
            setPinEntered(pin);
            setTimeout(() => handleSubmit(pin, selectedOperator), 120);
          }
        }}
      />
    </div>
  );
};
