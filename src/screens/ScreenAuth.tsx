import React, { useState, useCallback, useEffect } from 'react';
import { Check, HelpCircle, KeyRound, Shield, X, Lock } from 'lucide-react';
import { Operator, Lote, Preparacao } from '../types';
import { PIN_ERRO_SIMULADO, MOCK_SUPERVISOR, MOCK_LOTES } from '../data';
import { PinInput } from '../components/ui/PinInput';
import { NumericKeypad } from '../components/ui/NumericKeypad';

interface ScreenAuthProps {
  operators: Operator[];
  selectedOperator: Operator;
  onSelectOperator: (op: Operator) => void;
  onSuccessAuth: () => void;
  onNavigateToManager?: () => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'warn' | 'danger') => void;
  isOffline?: boolean;
  lotes?: Lote[];
  preparacoes?: Preparacao[];
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatMmSs(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec));
  const mm = String(Math.floor(safe / 60)).padStart(2, '0');
  const ss = String(safe % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

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

  // Relógio de simulação em tempo real (1Hz) para mostrar o chão de fábrica vivo
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [cabine2SecRestantes, setCabine2SecRestantes] = useState<number>(14 * 60 + 25);

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
      setCabine2SecRestantes((prev) => (prev > 60 ? prev - 1 : 14 * 60 + 25));
    }, 1000);
    return () => clearInterval(interval);
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

      // Microinteração de Sucesso: acende os 4 dots em verde luminoso antes da transição
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
  const firstName = selectedName.split(' ')[0];

  // Status ao vivo da Cabine 01 e Cabine 02 (a partir das preparações reais)
  const prepAtivaCabine1 = preparacoes.find(
    (p) =>
      (p.cabineId || 'CABINE-01').toUpperCase() === 'CABINE-01' &&
      Boolean(p.dosagemConcluidaEm) &&
      !p.aplicacaoConcluidaEm &&
      p.status !== 'PREPARACAO_ENCERRADA'
  );
  const cabine1RemainingSec = prepAtivaCabine1?.dosagemConcluidaEm
    ? Math.max(
        0,
        (prepAtivaCabine1.potLifeMinutos || 20) * 60 -
          Math.floor((nowMs - new Date(prepAtivaCabine1.dosagemConcluidaEm).getTime()) / 1000)
      )
    : null;

  const prepAtivaCabine2 = preparacoes.find(
    (p) =>
      (p.cabineId || '').toUpperCase() === 'CABINE-02' &&
      Boolean(p.dosagemConcluidaEm) &&
      !p.aplicacaoConcluidaEm &&
      p.status !== 'PREPARACAO_ENCERRADA'
  );
  const cabine2RealSec = prepAtivaCabine2?.dosagemConcluidaEm
    ? Math.max(
        0,
        (prepAtivaCabine2.potLifeMinutos || 25) * 60 -
          Math.floor((nowMs - new Date(prepAtivaCabine2.dosagemConcluidaEm).getTime()) / 1000)
      )
    : cabine2SecRestantes;

  // Quantidade de latas abertas/sobras prioritárias FEFO para exibir no card do auxiliar
  const lotesBase = lotes.length > 0 ? lotes : MOCK_LOTES;
  const totalSobrasFefo = lotesBase.filter((l) => l.diasAberto > 0 && l.quantidadeAtual > 0).length;

  return (
    <div className="auth-screen-shell">
      <div className="auth-layout-minimal">
        {/* Coluna da Esquerda: Seleção do Pintor */}
        <section className="auth-left-column" aria-label="Seleção de Operador">
          <div className="auth-column-header">
            <h1 className="auth-title-minimal">Quem está pintando?</h1>
            <p className="auth-subtitle-minimal">
              Selecione seu perfil e digite o PIN para liberar a cabine.
            </p>
          </div>

          <div className={`auth-operators-vertical ${shakeOperatorList ? 'shake' : ''}`} role="radiogroup" aria-label="Operadores disponíveis">
            {operators.map((op) => {
              const opName = op.nome || op.name || '';
              const opRole = op.papel || op.role || 'Operador de Pintura';
              const isSelected =
                hasPickedOperator &&
                !isManagerAuthMode &&
                (op.id ? op.id === selectedOperator.id : opName === selectedName);

              // Status operacional ao vivo por operador
              const isAna = opName.toLowerCase().includes('ana');
              const isCarlos = opName.toLowerCase().includes('carlos');
              const opAvatarKey = isCarlos ? 'carlos' : isAna ? 'ana' : 'marcos';

              let liveStatusLabel: string;
              let liveStatusTone: 'active-green' | 'info-blue' | 'warn-amber';

              if (isAna) {
                if (prepAtivaCabine2) {
                  liveStatusLabel = `● Aplicando ${prepAtivaCabine2.ordemServicoNumero} • Verniz PU (${formatMmSs(
                    cabine2RealSec
                  )})`;
                  liveStatusTone = 'active-green';
                } else {
                  liveStatusLabel = '● Cabine 02 livre p/ nova O.S.';
                  liveStatusTone = 'info-blue';
                }
              } else if (isCarlos) {
                if (prepAtivaCabine1 && cabine1RemainingSec !== null) {
                  liveStatusLabel = `● Aplicando ${prepAtivaCabine1.ordemServicoNumero} (${formatMmSs(
                    cabine1RemainingSec
                  )})`;
                  liveStatusTone = 'active-green';
                } else {
                  liveStatusLabel = '● Cabine 01 livre p/ nova O.S.';
                  liveStatusTone = 'info-blue';
                }
              } else {
                liveStatusLabel = `● ${totalSobrasFefo} sobras prioritárias FEFO na bancada`;
                liveStatusTone = 'warn-amber';
              }

              const badgeStyles =
                liveStatusTone === 'active-green'
                  ? {
                      background: 'rgba(16, 185, 129, 0.14)',
                      border: '1px solid rgba(16, 185, 129, 0.38)',
                      color: '#34D399',
                    }
                  : liveStatusTone === 'warn-amber'
                  ? {
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.32)',
                      color: '#FBBF24',
                    }
                  : {
                      background: 'rgba(59, 130, 246, 0.12)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: '#60A5FA',
                    };

              return (
                <button
                  key={op.id || opName}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`operator-card-apple ${isSelected ? 'is-active' : ''}`}
                  onClick={() => {
                    setIsManagerAuthMode(false);
                    setHasPickedOperator(true);
                    onSelectOperator(op);
                    handleClear();
                  }}
                >
                  <div
                    className={`operator-avatar-circle operator-avatar-circle--${opAvatarKey}`}
                    aria-hidden="true"
                  >
                    {getInitials(opName)}
                  </div>
                  <div className="operator-info-apple">
                    <span className="operator-name-apple">{opName}</span>
                    <span className="operator-role-apple">{opRole}</span>
                    <span className="operator-status-pill" style={badgeStyles}>
                      {liveStatusLabel}
                    </span>
                  </div>
                  <div
                    className={`operator-select-indicator ${isSelected ? 'is-selected' : ''}`}
                    aria-hidden="true"
                  >
                    {isSelected && <Check size={18} strokeWidth={3} />}
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
                setIsManagerAuthMode(true);
                setHasPickedOperator(false);
                handleClear();
              }}
              style={
                isManagerAuthMode
                  ? {
                      borderColor: 'rgba(245, 158, 11, 0.75)',
                      background: 'rgba(245, 158, 11, 0.18)',
                      color: '#FEF08A',
                      boxShadow: '0 0 16px rgba(245, 158, 11, 0.25)',
                    }
                  : undefined
              }
              title="Requer PIN do Gestor Fábio (9999)"
            >
              <div className="auth-supervisor-icon-box" aria-hidden="true">
                <Shield size={13} strokeWidth={2.4} />
              </div>
              <span>Painel do Gestor (Fábio)</span>
            </button>

            <button
              type="button"
              className="auth-help-btn"
              onClick={() => setIsHelpModalOpen(true)}
              title="Ver PINs para demonstração e suporte"
            >
              <KeyRound size={15} strokeWidth={2.2} aria-hidden="true" />
              <span>PINs Demo</span>
            </button>
          </div>
        </section>

        {/* Coluna da Direita: Teclado Numérico & PIN estilo Apple */}
        <section className="auth-right-column" aria-label="Autenticação com PIN">
          <div
            className="auth-pin-card-apple"
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

      {/* Modal de Ajuda Operacional & Credenciais de Demonstração */}
      {isHelpModalOpen && (
        <div
          className="ds-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-help-modal-title"
          onClick={() => setIsHelpModalOpen(false)}
        >
          <div
            className="os-modal-card-apple"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '540px' }}
          >
            {/* Cabeçalho Apple Sheet */}
            <div className="os-modal-header-apple">
              <div className="os-modal-header-left">
                <div className="os-modal-icon-badge" aria-hidden="true">
                  <KeyRound size={22} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 id="auth-help-modal-title" className="os-modal-title-apple">
                    <span>Suporte da Cabine & PINs</span>
                    <span className="os-modal-count-pill">3 perfis</span>
                  </h3>
                  <p className="os-modal-subtitle-apple">
                    Toque em uma credencial para testar ou autenticar de imediato.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="os-modal-close-apple"
                aria-label="Fechar suporte de PINs"
              >
                <X size={18} strokeWidth={2.4} />
              </button>
            </div>

            {/* Inset Cards Táteis e Interativos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Card 1: Pintor */}
              <button
                type="button"
                className="os-list-card"
                onClick={() => {
                  setIsHelpModalOpen(false);
                  setHasPickedOperator(true);
                  setPinEntered('1234');
                  setTimeout(() => handleSubmit('1234', selectedOperator), 120);
                }}
                style={{ padding: '14px 16px' }}
              >
                <div className="os-list-card-row">
                  <div>
                    <h4 className="os-list-client-name" style={{ fontSize: '16px' }}>
                      Pintores (Carlos, Ana, Marcos)
                    </h4>
                    <p className="os-list-subtitle-text" style={{ fontSize: '13px', marginTop: '2px' }}>
                      Acesso operacional padrão para preparação, dosagem e devolução
                    </p>
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '16px',
                      fontWeight: 800,
                      letterSpacing: '2px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.14)',
                      border: '1px solid rgba(16, 185, 129, 0.32)',
                      color: '#34d399',
                      flexShrink: 0,
                    }}
                  >
                    1234
                  </span>
                </div>
              </button>

              {/* Card 2: Supervisor */}
              <button
                type="button"
                className="os-list-card"
                onClick={() => {
                  setIsHelpModalOpen(false);
                  setIsManagerAuthMode(true);
                  setHasPickedOperator(false);
                  setPinEntered('9999');
                  setTimeout(() => handleSubmit('9999', selectedOperator, true), 120);
                }}
                style={{ padding: '14px 16px' }}
              >
                <div className="os-list-card-row">
                  <div>
                    <h4 className="os-list-client-name" style={{ fontSize: '16px' }}>
                      Supervisor de Cabine (Fábio)
                    </h4>
                    <p className="os-list-subtitle-text" style={{ fontSize: '13px', marginTop: '2px' }}>
                      PIN Mestre: libera terminal, desbloqueia erros e autoriza excesso (&gt;5%)
                    </p>
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '16px',
                      fontWeight: 800,
                      letterSpacing: '2px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: 'rgba(245, 158, 11, 0.14)',
                      border: '1px solid rgba(245, 158, 11, 0.32)',
                      color: '#fbbf24',
                      flexShrink: 0,
                    }}
                  >
                    9999
                  </span>
                </div>
              </button>

              {/* Card 3: Erro */}
              <button
                type="button"
                className="os-list-card"
                onClick={() => {
                  setIsHelpModalOpen(false);
                  setHasPickedOperator(true);
                  setPinEntered('0000');
                  setTimeout(() => handleSubmit('0000', selectedOperator), 120);
                }}
                style={{ padding: '14px 16px' }}
              >
                <div className="os-list-card-row">
                  <div>
                    <h4 className="os-list-client-name" style={{ fontSize: '16px' }}>
                      Simular Bloqueio (PIN Incorreto)
                    </h4>
                    <p className="os-list-subtitle-text" style={{ fontSize: '13px', marginTop: '2px' }}>
                      Testa a animação de vibração e feedback visual de erro no tablet
                    </p>
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '16px',
                      fontWeight: 800,
                      letterSpacing: '2px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.14)',
                      border: '1px solid rgba(239, 68, 68, 0.32)',
                      color: '#f87171',
                      flexShrink: 0,
                    }}
                  >
                    0000
                  </span>
                </div>
              </button>
            </div>

            <p style={{ margin: '4px 0 0', textAlign: 'center', fontSize: '13px', color: 'var(--text-tertiary)' }}>
              Toque diretamente em qualquer cartão acima para preencher e validar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};


