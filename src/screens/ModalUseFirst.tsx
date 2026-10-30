import React from 'react';
import { AlertTriangle, MapPin, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Lote } from '../types';
import { MOCK_LOTES } from '../data/mock/mockData';
import { ordenarLotesFEFO, formatarStatusValidade } from '../domain/fefo';

interface ModalUseFirstProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBatch?: (batchCode: string) => void;
  lotes?: Lote[];
}

export const ModalUseFirst: React.FC<ModalUseFirstProps> = ({
  isOpen,
  onClose,
  onSelectBatch,
  lotes,
}) => {
  if (!isOpen) return null;

  const lotesPrioritarios = ordenarLotesFEFO(lotes || MOCK_LOTES).filter(
    (l) => l.quantidadeAtual > 0 && l.diasAberto > 0
  );

  return (
    <div className="ds-modal-backdrop" role="dialog" aria-modal="true">
      <div className="ds-modal-card ds-modal-standard" style={{ maxWidth: '720px' }}>
        <header className="ds-modal-header" style={{ background: 'var(--card-hover)', borderBottom: '1px solid var(--border)' }}>
          <div className="ds-modal-header-icon" style={{ background: 'var(--warn-soft)', color: 'var(--warn)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={22} strokeWidth={2.4} />
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
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={20} />
          </button>
        </header>

        <div className="ds-modal-body" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {lotesPrioritarios.map((lote) => {
              const statusVal = formatarStatusValidade(lote.validade, lote.diasAberto);

              return (
                <div
                  key={lote.codigo}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderRadius: '10px',
                    background: 'var(--card)',
                    border: `1px solid ${statusVal.nivel === 'urgente' ? 'var(--danger-border)' : 'var(--border)'}`,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text)' }}>
                        {lote.produtoNome}
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
                        {lote.codigo}
                      </span>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 700,
                          background: statusVal.nivel === 'urgente' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: statusVal.nivel === 'urgente' ? '#f87171' : '#fbbf24',
                          border: `1px solid ${statusVal.nivel === 'urgente' ? '#ef4444' : '#f59e0b'}`,
                        }}
                      >
                        {statusVal.rotulo}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'flex', gap: '14px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} strokeWidth={2.4} color="var(--primary)" /> {lote.prateleira}
                      </span>
                      <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Saldo: {lote.quantidadeAtual} ml restantes</span>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      if (onSelectBatch) onSelectBatch(lote.codigo);
                      onClose();
                    }}
                    style={{ minWidth: '120px' }}
                  >
                    Usar este lote
                  </Button>
                </div>
              );
            })}
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
