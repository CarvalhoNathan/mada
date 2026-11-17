import React, { useState } from 'react';
import { Check, X, FileSpreadsheet, Search } from 'lucide-react';
import { OrdemServico } from '../../types';
import { MOCK_ORDENS_SERVICO } from '../../data/mock/mockData';

export interface OsSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOS: string;
  onSelectOS?: (os: OrdemServico) => void;
}

/**
 * OsSelectionModal - Seletor Tátil de Ordem de Serviço com Spotlight Search
 * Permite buscar instantaneamente por cliente, número de O.S., arquiteto ou ambientes.
 */
export const OsSelectionModal: React.FC<OsSelectionModalProps> = ({
  isOpen,
  onClose,
  selectedOS,
  onSelectOS,
}) => {
  const [osSearchQuery, setOsSearchQuery] = useState('');

  if (!isOpen) return null;

  const query = osSearchQuery.trim().toLowerCase();
  const filtered = MOCK_ORDENS_SERVICO.filter((ordem) => {
    if (!query) return true;
    const matchNumero = ordem.numero.toLowerCase().includes(query);
    const matchCliente = ordem.clienteNome.toLowerCase().includes(query);
    const matchProjeto = (ordem.projetoNome || '').toLowerCase().includes(query);
    const matchAmbientes = ordem.ambientesObra?.some((a) =>
      a.nome.toLowerCase().includes(query)
    );
    return matchNumero || matchCliente || matchProjeto || matchAmbientes;
  });

  return (
    <div
      className="ds-modal-overlay active"
      role="dialog"
      aria-modal="true"
      aria-label="Selecionar Ordem de Serviço"
      onClick={onClose}
    >
      <div
        className="os-modal-card-apple"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal no padrão Apple Sheet */}
        <div className="os-modal-header-apple">
          <div className="os-modal-header-left">
            <div className="os-modal-icon-badge" aria-hidden="true">
              <FileSpreadsheet size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="os-modal-title-apple">
                <span>Selecionar Ordem de Serviço</span>
                <span className="os-modal-count-pill">
                  {MOCK_ORDENS_SERVICO.length} na fila
                </span>
              </h3>
              <p className="os-modal-subtitle-apple">
                Toque na O.S. para carregar seus ambientes e lotes de peças correspondentes.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="os-modal-close-apple"
            aria-label="Fechar seletor de O.S."
          >
            <X size={18} strokeWidth={2.4} />
          </button>
        </div>

        {/* Campo de Busca Estilo Apple Spotlight */}
        <div className="os-modal-search-box">
          <span className="os-modal-search-icon" aria-hidden="true">
            <Search size={18} strokeWidth={2.2} />
          </span>
          <input
            type="text"
            className="os-modal-search-input"
            placeholder="Buscar cliente, número de O.S. ou ambiente..."
            value={osSearchQuery}
            onChange={(e) => setOsSearchQuery(e.target.value)}
            autoFocus
          />
          {osSearchQuery && (
            <button
              type="button"
              className="os-modal-search-clear"
              onClick={() => setOsSearchQuery('')}
              aria-label="Limpar busca"
            >
              <X size={12} strokeWidth={2.8} />
            </button>
          )}
        </div>

        {/* Lista de Ordens de Serviço (Cartões Inset Apple com Micro-chips) */}
        <div className="os-modal-list-container">
          {filtered.length === 0 ? (
            <div className="os-list-empty-feedback">
              Nenhuma Ordem de Serviço encontrada para &ldquo;{osSearchQuery}&rdquo;.
            </div>
          ) : (
            filtered.map((ordem) => {
              const isCurrent = ordem.numero === selectedOS;
              const ambientes = ordem.ambientesObra || [
                { id: ordem.ambienteId || ordem.id, nome: ordem.ambienteNome, lotesPecas: [ordem.pecaLote] },
              ];
              const qtdAmbientes = ambientes.length;

              return (
                <button
                  key={ordem.id}
                  type="button"
                  role="radio"
                  aria-checked={isCurrent}
                  className={`os-list-card ${isCurrent ? 'is-active' : ''}`}
                  onClick={() => {
                    if (onSelectOS) {
                      onSelectOS(ordem);
                    }
                    onClose();
                  }}
                >
                  {/* Linha Superior: Nome do Cliente e Metadados Técnicos à Direita */}
                  <div className="os-list-card-row">
                    <h4 className="os-list-client-name">{ordem.clienteNome}</h4>
                    <div className="os-list-right-meta">
                      <span className="os-badge-code">{ordem.numero}</span>
                      <div className="os-list-radio-apple" aria-hidden="true">
                        {isCurrent && <Check size={17} strokeWidth={2.8} />}
                      </div>
                    </div>
                  </div>

                  {/* Linha Central: Subtítulo do Projeto / Arquiteto */}
                  <p className="os-list-subtitle-text">{ordem.projetoNome}</p>

                  {/* Linha Inferior: Micro-chips de Ambientes Táteis */}
                  <div className="os-list-chips-container">
                    {ambientes.map((amb) => (
                      <span key={amb.id} className="os-list-env-chip">
                        <span style={{ opacity: 0.6 }}>📍</span> {amb.nome}
                      </span>
                    ))}
                    <span className="os-modal-count-pill" style={{ marginLeft: 'auto' }}>
                      {qtdAmbientes === 1 ? '1 ambiente' : `${qtdAmbientes} ambientes`}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
