import React from 'react';
import { AlertTriangle, MapPin, X, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Lote } from '../../types';
import { MOCK_LOTES } from '../../data/mock/mockData';
import { ordenarLotesFEFO, formatarStatusValidade } from '../../domain/fefo';

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
          maxWidth: '680px',
          width: '92%',
          padding: '22px 24px',
          gap: '16px',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* Cabeçalho Apple HIG Sheet */}
        <div className="os-modal-header-apple">
          <div className="os-modal-header-left">
            <div
              className="os-modal-icon-badge"
              aria-hidden="true"
              style={{
                background: 'rgba(245, 158, 11, 0.14)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: 'var(--tint-amber)',
              }}
            >
              <AlertTriangle size={22} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="os-modal-title-apple">
                <span>Latas com Prioridade de Uso</span>
                <span className="os-modal-count-pill">{lotesPrioritarios.length} latas</span>
              </h3>
              <p className="os-modal-subtitle-apple">
                Produtos já abertos no almoxarifado que precisam ser consumidos antes de abrir novas embalagens (FEFO).
              </p>
            </div>
          </div>
          <button
            type="button"
            className="os-modal-close-apple"
            onClick={onClose}
            aria-label="Fechar janela"
          >
            <X size={18} strokeWidth={2.4} />
          </button>
        </div>

        {/* Lista de Latas Prioritárias em Inset Grouped Cards */}
        <div className="os-modal-list-container" style={{ maxHeight: '52vh' }}>
          {lotesPrioritarios.length === 0 ? (
            <div className="os-list-empty-feedback" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={36} color="#10B981" />
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>Nenhuma lata aberta pendente</div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                Todas as embalagens no estoque estão lacradas ou dentro da validade adequada.
              </p>
            </div>
          ) : (
            lotesPrioritarios.map((lote) => {
              const statusVal = formatarStatusValidade(lote.validade, lote.diasAberto);
              const isUrgent = statusVal.nivel === 'urgente';

              return (
                <div
                  key={lote.codigo}
                  className={`usefirst-card ${isUrgent ? 'usefirst-card--urgent' : ''}`}
                >
                  <div className="usefirst-info">
                    <div className="usefirst-top-row">
                      <span className="usefirst-prod-name">{lote.produtoNome}</span>
                      <span className="usefirst-badge-code">{lote.codigo}</span>
                      <span
                        className={`usefirst-badge-status ${
                          isUrgent ? 'usefirst-badge-status--urgent' : 'usefirst-badge-status--warn'
                        }`}
                      >
                        {statusVal.rotulo}
                      </span>
                    </div>
                    <div className="usefirst-meta-row">
                      <span className="usefirst-meta-shelf">
                        <MapPin size={13} strokeWidth={2.4} color="var(--tint-blue)" /> {lote.prateleira}
                      </span>
                      <span className="usefirst-meta-sep">•</span>
                      <span>
                        Saldo: <strong className="usefirst-meta-balance">{lote.quantidadeAtual} ml</strong> restantes
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="usefirst-btn-select"
                    onClick={() => {
                      if (onSelectBatch) onSelectBatch(lote.codigo);
                      onClose();
                    }}
                    title={`Usar lote ${lote.codigo} na preparação`}
                  >
                    <span>Usar este lote</span>
                    <ArrowRight size={15} strokeWidth={2.4} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé Apple Sheet */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginTop: '4px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              height: '42px',
              padding: '0 22px',
              borderRadius: '12px',
              background: 'rgba(var(--overlay-rgb), 0.07)',
              border: '1px solid rgba(var(--overlay-rgb), 0.14)',
              color: 'var(--text)',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Entendido, fechar
          </button>
        </div>
      </div>
    </div>
  );
};
