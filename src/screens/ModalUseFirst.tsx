import React from 'react';
import { Button } from '../components/ui/Button';

interface ModalUseFirstProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBatch?: (batchCode: string) => void;
}

interface ExpiringCan {
  code: string;
  product: string;
  shelf: string;
  openedDays: string;
  balance: string;
  urgency: 'high' | 'medium';
}

const EXPIRING_CANS: ExpiringCan[] = [
  {
    code: '#SY-8821',
    product: 'Verniz PU Alto Sólidos 4:1 (Sayersystem)',
    shelf: 'Prateleira A-02',
    openedDays: 'Aberto há 3 dias',
    balance: '400 ml restantes',
    urgency: 'high',
  },
  {
    code: '#SY-7410',
    product: 'Catalisador PU Médio Homologado',
    shelf: 'Prateleira A-02',
    openedDays: 'Aberto há 2 dias',
    balance: '250 ml restantes',
    urgency: 'high',
  },
  {
    code: '#SY-6032',
    product: 'Laca Branca Fosca 20 Gloss',
    shelf: 'Prateleira B-01',
    openedDays: 'Aberto há 5 dias',
    balance: '650 ml restantes',
    urgency: 'medium',
  },
];

export const ModalUseFirst: React.FC<ModalUseFirstProps> = ({
  isOpen,
  onClose,
  onSelectBatch,
}) => {
  if (!isOpen) return null;

  return (
    <div className="ds-modal-backdrop" role="dialog" aria-modal="true">
      <div className="ds-modal-card ds-modal-standard" style={{ maxWidth: '720px' }}>
        <header className="ds-modal-header" style={{ background: 'var(--card-hover)', borderBottom: '1px solid var(--border)' }}>
          <div className="ds-modal-header-icon" style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}>
            ⚠️
          </div>
          <div className="ds-modal-header-titles">
            <h2 className="ds-modal-title" style={{ color: 'var(--warn)' }}>
              Latas com Prioridade de Uso ("Use Primeiro")
            </h2>
            <p className="ds-modal-sub">
              Produtos já abertos no almoxarifado que precisam ser consumidos antes de abrir novas latas
            </p>
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

        <div className="ds-modal-body" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {EXPIRING_CANS.map((can) => (
              <div
                key={can.code}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text)' }}>
                      {can.product}
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 700,
                        background: 'var(--warn-soft)',
                        color: 'var(--warn)',
                        border: '1px solid var(--warn)',
                      }}
                    >
                      {can.code}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'flex', gap: '14px' }}>
                    <span>📍 {can.shelf}</span>
                    <span>⏳ {can.openedDays}</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Saldo: {can.balance}</span>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    if (onSelectBatch) onSelectBatch(can.code);
                    onClose();
                  }}
                  style={{ minWidth: '120px' }}
                >
                  Usar nesta OS
                </Button>
              </div>
            ))}
          </div>
        </div>

        <footer className="ds-modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
          <Button variant="primary" size="md" onClick={onClose} style={{ minWidth: '160px' }}>
            Entendido, fechar
          </Button>
        </footer>
      </div>
    </div>
  );
};
