import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { operadorRepository } from '../data';

export interface ModalCriticalExcessProps {
  isOpen: boolean;
  onClose: () => void;
  onRepesarDoZero: () => void;
  onRecalcularReceita?: () => void;
  onConfirmDesperdicio: (reason: string) => void;
  componentName?: string;
  targetVolume?: number;
  excessVolume?: number;
  actualVolume?: number;
  excessCost?: number;
}

const REASONS = [
  { id: 'gotejamento', label: 'Gotejamento do bico da lata' },
  { id: 'falha_operador', label: 'Falha manual do operador' },
  { id: 'descalibracao', label: 'Erro de graduação no béquer' },
  { id: 'supervisor', label: 'Autorização do supervisor' },
];

export const ModalCriticalExcess: React.FC<ModalCriticalExcessProps> = ({
  isOpen,
  onClose,
  onRepesarDoZero,
  onRecalcularReceita,
  onConfirmDesperdicio,
  componentName = 'Catalisador',
  targetVolume = 250,
  excessVolume,
  actualVolume: propActualVolume,
  excessCost,
}) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [supervisorPin, setSupervisorPin] = useState('');
  const [pinStatus, setPinStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  if (!isOpen) return null;

  const actualVolume = propActualVolume ?? (targetVolume + (excessVolume ?? 200));
  const diffVolume = excessVolume ?? Math.max(0, actualVolume - targetVolume);

  const handleSelectReason = (reasonId: string) => {
    setSelectedReason(reasonId);
    if (reasonId !== 'supervisor') {
      setSupervisorPin('');
      setPinStatus('idle');
    }
  };

  const handlePinChange = async (val: string) => {
    setSupervisorPin(val);
    if (val.length === 4) {
      const isValid = await operadorRepository.validarSupervisorPin(val);
      setPinStatus(isValid ? 'valid' : 'invalid');
    } else {
      setPinStatus('idle');
    }
  };

  const isSupervisorValid = selectedReason === 'supervisor' && pinStatus === 'valid';
  const isWasteEnabled =
    selectedReason !== null && (selectedReason !== 'supervisor' || isSupervisorValid);

  return (
    <div
      className="ds-modal-backdrop"
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="modal-critical-card"
        style={{
          maxWidth: '660px',
          width: '100%',
          backgroundColor: 'var(--card)',
          border: '2px solid var(--danger)',
          borderRadius: '20px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(239, 68, 68, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Cabeçalho de Atenção Crítica */}
        <header
          style={{
            background: 'rgba(239, 68, 68, 0.14)',
            borderBottom: '1.5px solid rgba(239, 68, 68, 0.35)',
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'var(--danger)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: 800,
                boxShadow: '0 0 16px rgba(239, 68, 68, 0.6)',
              }}
            >
              ⚡
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '21px',
                  fontWeight: 700,
                  color: '#f87171',
                  letterSpacing: '-0.01em',
                }}
              >
                Excesso de {componentName} Detectado
              </h2>
              <p
                style={{
                  margin: '2px 0 0 0',
                  fontSize: '15px',
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                }}
              >
                Intertravamento de Segurança • Limite de Tolerância (5%) Ultrapassado
              </p>
            </div>
          </div>

          <button
            type="button"
            className="ds-modal-close-btn"
            onClick={onClose}
            aria-label="Fechar janela"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </header>

        {/* Corpo do Diálogo */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Highlight do Excesso */}
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1.5px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '14px',
              padding: '14px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '48px',
                fontWeight: 800,
                color: '#f87171',
                lineHeight: 1,
              }}
            >
              +{diffVolume} ml
            </span>
            <span
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text)',
                marginTop: '6px',
              }}
            >
              Excesso acima da meta homologada ({targetVolume} ml → {actualVolume} ml)
            </span>
            {excessCost !== undefined && excessCost > 0 && (
              <span
                style={{
                  marginTop: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: 'rgba(239, 68, 68, 0.18)',
                  color: '#fca5a5',
                  fontSize: '15px',
                  fontWeight: 700,
                }}
              >
                Custo estimado da perda: R$ {excessCost.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>

          {/* Motivo do Excesso (ChoiceChips) */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Motivo do excesso (obrigatório para descarte):
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {REASONS.map((r) => {
                const isSelected = selectedReason === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelectReason(r.id)}
                    style={{
                      height: '54px',
                      padding: '0 16px',
                      borderRadius: '12px',
                      border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                      background: isSelected ? 'rgba(37, 99, 235, 0.16)' : 'var(--bg)',
                      color: isSelected ? '#93c5fd' : 'var(--text)',
                      fontSize: '16px',
                      fontWeight: isSelected ? 700 : 500,
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'all 0.15s ease',
                      userSelect: 'none',
                    }}
                  >
                    <span
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 800,
                        color: isSelected ? '#ffffff' : 'transparent',
                        background: isSelected ? 'var(--primary)' : 'transparent',
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Caixa de Autorização do Supervisor */}
          {selectedReason === 'supervisor' && (
            <div
              style={{
                padding: '14px 18px',
                background: 'rgba(245, 158, 11, 0.08)',
                borderRadius: '12px',
                border: '1.5px solid rgba(245, 158, 11, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: 'var(--text)',
                  }}
                >
                  PIN do Supervisor Fábio (4 dígitos):
                </label>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Dica: digite 9999 ou 1234
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <input
                  type="password"
                  maxLength={4}
                  value={supervisorPin}
                  onChange={(e) => handlePinChange(e.target.value)}
                  placeholder="••••"
                  autoFocus
                  style={{
                    width: '160px',
                    height: '48px',
                    background: 'var(--bg)',
                    border: `2px solid ${
                      pinStatus === 'valid'
                        ? 'var(--ok)'
                        : pinStatus === 'invalid'
                        ? 'var(--danger)'
                        : 'var(--border)'
                    }`,
                    borderRadius: '10px',
                    color: 'var(--text)',
                    fontSize: '24px',
                    letterSpacing: '8px',
                    textAlign: 'center',
                    fontWeight: 800,
                    outline: 'none',
                  }}
                />
                <div style={{ fontSize: '15px' }}>
                  {pinStatus === 'valid' && (
                    <span style={{ color: '#4ade80', fontWeight: 700 }}>
                      ✓ Autorização confirmada pelo Supervisor Fábio
                    </span>
                  )}
                  {pinStatus === 'invalid' && (
                    <span style={{ color: '#f87171', fontWeight: 700 }}>
                      PIN inválido. Tente 9999 ou 1234.
                    </span>
                  )}
                  {pinStatus === 'idle' && (
                    <span style={{ color: 'var(--text-muted)' }}>
                      Aguardando os 4 dígitos do supervisor...
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé de Ações Operacionais */}
        <footer
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            background: 'rgba(0, 0, 0, 0.25)',
            borderTop: '1px solid var(--border)',
            padding: '16px 24px',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <Button
              variant="secondary"
              size="md"
              onClick={onRepesarDoZero}
              style={{
                flex: 1,
                height: '56px',
                fontSize: '16px',
                fontWeight: 700,
                borderRadius: '12px',
              }}
            >
              ↺ Redosar do zero
            </Button>
            {onRecalcularReceita && (
              <Button
                variant="primary"
                size="md"
                onClick={onRecalcularReceita}
                style={{
                  flex: 1.2,
                  height: '56px',
                  fontSize: '16px',
                  fontWeight: 700,
                  borderRadius: '12px',
                }}
              >
                ⚖️ Recalcular proporções
              </Button>
            )}
          </div>

          <Button
            variant="danger"
            size="md"
            disabled={!isWasteEnabled}
            holdToConfirm={true}
            onHoldConfirm={() => onConfirmDesperdicio(selectedReason || 'manual')}
            style={{
              width: '100%',
              height: '56px',
              fontSize: '16px',
              fontWeight: 700,
              borderRadius: '12px',
            }}
            title={
              !selectedReason
                ? 'Selecione um motivo acima para habilitar'
                : selectedReason === 'supervisor' && !isSupervisorValid
                ? 'Digite o PIN do supervisor para autorizar'
                : 'Segure por 1,5s para registrar desperdício'
            }
          >
            🗑 Confirmar desperdício e registrar na OS
          </Button>
        </footer>
      </div>
    </div>
  );
};
