import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { operadorRepository } from '../data';

interface ModalCriticalExcessProps {
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
  { id: 'descalibracao', label: 'Descalibração da balança' },
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
  const isWasteEnabled = selectedReason !== null && (selectedReason !== 'supervisor' || isSupervisorValid);

  return (
    <div className="ds-modal-backdrop" role="dialog" aria-modal="true">
      <div className="ds-modal-card ds-modal-critical" style={{ maxWidth: '680px' }}>
        {/* Cabeçalho de Atenção Crítica */}
        <header className="ds-modal-header" style={{ background: 'var(--danger-soft)', borderColor: 'var(--danger-border)' }}>
          <div className="ds-modal-header-icon" style={{ background: 'var(--danger)', color: '#fff' }}>
            ⚡
          </div>
          <div className="ds-modal-header-titles">
            <h2 className="ds-modal-title" style={{ color: 'var(--danger)' }}>
              Excesso de {componentName} Detectado
            </h2>
            <p className="ds-modal-sub">Intertravamento de Segurança</p>
          </div>
          <button
            type="button"
            className="ds-modal-close-btn"
            onClick={onClose}
            aria-label="Fechar janela"
          >
            ✕
          </button>
        </header>

        {/* Corpo do Diálogo */}
        <div className="ds-modal-body">
          {/* Valor numérico em 56px */}
          <div className="ds-modal-highlight-box" style={{ background: 'var(--card-hover)', borderColor: 'var(--danger-border)' }}>
            <span className="ds-modal-highlight-number" style={{ color: 'var(--danger)', fontSize: '56px', fontWeight: 800 }}>
              +{diffVolume} ml
            </span>
            <span className="ds-modal-highlight-label" style={{ color: 'var(--text-muted)' }}>
              Excesso Acima do Limite Tolerado ({targetVolume} ml → {actualVolume} ml)
            </span>
            {excessCost !== undefined && excessCost > 0 && (
              <span style={{ marginTop: '8px', fontSize: '15px', color: 'var(--danger)', fontWeight: 700 }}>
                Custo estimado do excesso: R$ {excessCost.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>

          {/* Frase explicativa clara de chão de fábrica */}
          <p className="ds-modal-sentence" style={{ fontSize: '17px', color: 'var(--text)', margin: '14px 0' }}>
            O {componentName.toLowerCase()} ultrapassou o limite seguro. Escolha uma ação operacional para prosseguir:
          </p>

          {/* Seletor de Motivo Obrigatório */}
          <div style={{ margin: '14px 0' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
              Motivo do excesso (obrigatório para descarte):
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {REASONS.map((r) => {
                const isSelected = selectedReason === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelectReason(r.id)}
                    className="just-chip-btn"
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                      background: isSelected ? 'var(--primary-soft)' : 'var(--card)',
                      color: isSelected ? 'var(--text)' : 'var(--text-muted)',
                      fontSize: '15px',
                      fontWeight: isSelected ? 700 : 500,
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>{isSelected ? '✓' : '○'}</span>
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Caixa de PIN do Supervisor (se motivo for supervisor) */}
          {selectedReason === 'supervisor' && (
            <div
              style={{
                marginTop: '12px',
                padding: '14px',
                background: 'var(--card-hover)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
              }}
            >
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                PIN do Supervisor Fábio (4 dígitos):
              </label>
              <input
                type="password"
                maxLength={4}
                value={supervisorPin}
                onChange={(e) => handlePinChange(e.target.value)}
                placeholder="Ex: 9999 ou 1234"
                style={{
                  width: '180px',
                  height: '48px',
                  background: 'var(--bg)',
                  border: `2px solid ${pinStatus === 'valid' ? 'var(--ok)' : pinStatus === 'invalid' ? 'var(--danger)' : 'var(--border)'}`,
                  borderRadius: '6px',
                  color: 'var(--text)',
                  fontSize: '22px',
                  letterSpacing: '6px',
                  textAlign: 'center',
                  fontWeight: 700,
                }}
              />
              <div style={{ marginTop: '6px', fontSize: '13px' }}>
                {pinStatus === 'valid' && (
                  <span style={{ color: 'var(--ok)', fontWeight: 700 }}>✓ Autorização confirmada pelo Supervisor Fábio</span>
                )}
                {pinStatus === 'invalid' && (
                  <span style={{ color: 'var(--danger)', fontWeight: 700 }}>PIN inválido. Tente 9999 ou 1234.</span>
                )}
                {pinStatus === 'idle' && (
                  <span style={{ color: 'var(--text-muted)' }}>Digite 9999 ou 1234 para autorizar.</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Barra de Ações: Repesar, Recalcular e Descartar (Hold to confirm) */}
        <footer
          className="ds-modal-footer"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            background: 'var(--card)',
            borderTop: '1px solid var(--border)',
            padding: '16px 24px',
          }}
        >
          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <Button
              variant="secondary"
              size="md"
              onClick={onRepesarDoZero}
              style={{ flex: 1, height: '56px', fontSize: '16px' }}
            >
              ↺ Repesar do zero
            </Button>
            {onRecalcularReceita && (
              <Button
                variant="primary"
                size="md"
                onClick={onRecalcularReceita}
                style={{ flex: 1.3, height: '56px', fontSize: '16px' }}
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
            style={{ width: '100%', height: '56px', fontSize: '17px' }}
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
