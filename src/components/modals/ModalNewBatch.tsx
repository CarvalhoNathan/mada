import React from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { MOCK_PRODUTOS } from '../../data';

interface ModalNewBatchProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProdutoId: number;
  onSelectProdutoId: (id: number) => void;
  volumeEntrada: number;
  onSelectVolumeEntrada: (vol: number) => void;
  codigoLoteEntrada: string;
  onConfirmar: () => void;
  volumesDisponiveis?: number[];
}

const DEFAULT_VOLUMES = [900, 1000, 3600, 5000];

export const ModalNewBatch: React.FC<ModalNewBatchProps> = ({
  isOpen,
  onClose,
  selectedProdutoId,
  onSelectProdutoId,
  volumeEntrada,
  onSelectVolumeEntrada,
  codigoLoteEntrada,
  onConfirmar,
  volumesDisponiveis = DEFAULT_VOLUMES,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="ds-modal-overlay active"
      role="dialog"
      aria-modal="true"
      aria-label="Receber Nova Lata no Estoque"
    >
      <div className="ds-modal-card" style={{ maxWidth: '680px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <h3 className="ds-modal-title" style={{ fontSize: '22px', margin: 0 }}>
              Dar Entrada em Nova Lata / Galão
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '16px', color: 'var(--text-muted)' }}>
              Selecione o insumo químico homologado e o volume do recipiente lacrado.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="os-bar-btn os-btn-back"
            style={{ minHeight: '52px', padding: '0 16px' }}
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-muted)' }}>
            1. Produto Químico Homologado:
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
            {MOCK_PRODUTOS.map((prod) => {
              const isSel = prod.id === selectedProdutoId;
              return (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => onSelectProdutoId(prod.id)}
                  style={{
                    minHeight: '64px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: isSel ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                    background: isSel ? 'var(--primary-soft)' : 'var(--bg)',
                    color: 'var(--text)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: '2px',
                    fontFamily: 'inherit',
                  }}
                >
                  <strong style={{ fontSize: '16px' }}>{prod.nome.replace(/^[0-9]+[º°]?\s*/, '')}</strong>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    Ref: {prod.codigo} • {prod.prateleiraPadrao}
                  </span>
                </button>
              );
            })}
          </div>

          <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-muted)', marginTop: '4px' }}>
            2. Volume do Galão / Lata Lacrada:
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {volumesDisponiveis.map((volOpt) => {
              const isVolSel = volOpt === volumeEntrada;
              return (
                <button
                  key={volOpt}
                  type="button"
                  onClick={() => onSelectVolumeEntrada(volOpt)}
                  style={{
                    minHeight: '56px',
                    borderRadius: '12px',
                    border: isVolSel ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                    background: isVolSel ? 'var(--primary-soft)' : 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '17px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {volOpt.toLocaleString('pt-BR')} ml
                </button>
              );
            })}
          </div>
        </div>

        <div className="ds-modal-actions">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="md" onClick={onConfirmar}>
            ✓ Confirmar Entrada ({codigoLoteEntrada})
          </Button>
        </div>
      </div>
    </div>
  );
};
