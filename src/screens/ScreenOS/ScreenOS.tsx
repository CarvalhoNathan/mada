import React, { useState } from 'react';
import { Check, Layers, Lock } from 'lucide-react';
import { AmbienteOS } from '../../types';
import { CountNumber } from '../../components/ui/CountNumber';
import { MOCK_ORDENS_SERVICO } from '../../data/mock/mockData';
import { ScreenOSProps } from './types';
import { OsSelectionModal } from './OsSelectionModal';

export const ScreenOS: React.FC<ScreenOSProps> = ({
  selectedOS,
  clientName,
  projectName,
  selectedEnvironment,
  onSelectEnvironment,
  pieceLot,
  onSelectPieceLot,
  onChangePieceLot,
  onChangeOS,
  onSelectOS,
  onScanOS,
  onNavigate,
  isOSConfirmed = true,
  onConfirmOS,
}) => {
  const [isOsModalOpen, setIsOsModalOpen] = useState(false);

  const activeOSObj =
    MOCK_ORDENS_SERVICO.find((o) => o.numero === selectedOS) || MOCK_ORDENS_SERVICO[0];

  const ambientesDaOS: AmbienteOS[] =
    activeOSObj.ambientesObra && activeOSObj.ambientesObra.length > 0
      ? activeOSObj.ambientesObra
      : [
          {
            id: activeOSObj.ambienteId || activeOSObj.id,
            nome: activeOSObj.ambienteNome,
            lotesPecas: [activeOSObj.pecaLote],
          },
        ];

  const ambienteAtual =
    ambientesDaOS.find((a) => a.nome === selectedEnvironment) || ambientesDaOS[0];

  const lotesDoAmbiente = ambienteAtual.lotesPecas;
  const loteAtualIdx = Math.max(
    0,
    lotesDoAmbiente.findIndex(
      (l) => (l.titulo || l.title) === (pieceLot.titulo || pieceLot.title)
    )
  );

  const areaNumeric = parseInt((pieceLot.area || '42').replace(/\D/g, ''), 10) || 42;
  const volumeNumeric =
    parseInt((pieceLot.estVolume || pieceLot.volumeEstimado || '1050').replace(/\D/g, ''), 10) ||
    1050;

  const handleEnvironmentClick = (amb: AmbienteOS) => {
    onSelectEnvironment(amb.nome);
    if (amb.lotesPecas.length > 0 && onSelectPieceLot) {
      onSelectPieceLot(amb.lotesPecas[0], amb.nome);
    }
  };

  const handleCycleRoomLot = () => {
    if (lotesDoAmbiente.length <= 1) return;
    const nextIdx = (loteAtualIdx + 1) % lotesDoAmbiente.length;
    const nextLot = lotesDoAmbiente[nextIdx];
    if (onSelectPieceLot) {
      onSelectPieceLot(nextLot, ambienteAtual.nome);
    } else {
      onChangePieceLot();
    }
  };

  return (
    <div className="os-screen-container">
      {/* Banner de Trava Obrigatória de Seleção de O.S. (Padrão idêntico à Etapa 2) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '12px 16px',
          borderRadius: '16px',
          marginBottom: '14px',
          border: isOSConfirmed
            ? '1.5px solid var(--ok-border)'
            : '1.5px solid rgba(245, 158, 11, 0.48)',
          background: isOSConfirmed
            ? 'rgba(16, 185, 129, 0.05)'
            : 'rgba(245, 158, 11, 0.08)',
          transition: 'all 0.22s ease',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isOSConfirmed ? (
            <Check size={16} strokeWidth={2.8} color="var(--ok)" />
          ) : (
            <Lock size={16} strokeWidth={2.4} color="var(--warn)" />
          )}
          <span
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: isOSConfirmed ? 'var(--ok)' : 'var(--warn)',
              letterSpacing: '0.01em',
            }}
          >
            {isOSConfirmed
              ? `Ordem de Serviço confirmada: ${selectedOS} • ${clientName} — ambientes e peças liberados`
              : 'Passo obrigatório: Selecione ou confirme a Ordem de Serviço abaixo para liberar a preparação'}
          </span>
        </div>

        {!isOSConfirmed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onConfirmOS && (
              <button
                type="button"
                onClick={onConfirmOS}
                style={{
                  background: 'rgba(245, 158, 11, 0.2)',
                  border: '1px solid rgba(245, 158, 11, 0.45)',
                  color: '#fbbf24',
                  borderRadius: '8px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Check size={14} strokeWidth={2.8} />
                <span>Confirmar {selectedOS}</span>
              </button>
            )}
            <span className="os-meta-badge os-meta-badge--amber">
              Toque em Selecionar O.S. para escolher
            </span>
          </div>
        )}
      </div>

      {/* 2. Área de Trabalho Principal em 2 Colunas */}
      <div className="os-layout-minimal">
        {/* Coluna Esquerda: O.S. & Ambiente */}
        <div className="os-col-left">
          {/* Card da Ordem de Serviço */}
          <div
            className="os-card-surface"
            style={
              !isOSConfirmed
                ? {
                    border: '1.5px solid rgba(245, 158, 11, 0.4)',
                    boxShadow: '0 0 16px rgba(245, 158, 11, 0.08)',
                  }
                : undefined
            }
          >
            <div className="os-card-header-row">
              <span className="os-section-label">Ordem de Serviço Ativa</span>
              <span
                className={`os-meta-badge ${
                  isOSConfirmed ? 'os-meta-badge--primary' : 'os-meta-badge--amber'
                }`}
              >
                {isOSConfirmed ? selectedOS || 'OS #8841' : '🔒 Aguardando Seleção'}
              </span>
            </div>

            <div className="os-info-block">
              <h2 className="os-client-title">{clientName || 'Residência Fontana • Bloco A'}</h2>
              <p className="os-project-subtitle">
                {projectName || 'Apartamento 402 • Projeto Executivo Arq. Daniela'}
              </p>
            </div>

            <div className="os-card-actions">
              <button
                type="button"
                className="os-action-btn os-btn-scan"
                onClick={onScanOS}
                title="Escanear etiqueta ou ficha técnica com câmera do tablet"
                aria-label="Escanear QR Code da Ordem de Serviço"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
                  <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                  <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
                  <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                  <rect x="7" y="7" width="10" height="10" rx="1"/>
                </svg>
                <span>Escanear QR</span>
              </button>

              <button
                type="button"
                className={`os-action-btn ${
                  !isOSConfirmed ? 'os-btn-scan' : 'os-btn-secondary'
                }`}
                onClick={() => {
                  if (onSelectOS) {
                    setIsOsModalOpen(true);
                  } else {
                    onChangeOS();
                  }
                }}
                style={
                  !isOSConfirmed
                    ? {
                        background: 'rgba(245, 158, 11, 0.16)',
                        border: '1.5px solid rgba(245, 158, 11, 0.5)',
                        color: '#fbbf24',
                      }
                    : undefined
                }
                title="Selecionar Ordem de Serviço na fila"
                aria-label="Alternar Ordem de Serviço"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                <span>Selecionar O.S.</span>
              </button>
            </div>
          </div>

          {/* Card de Ambientes / Cômodos vinculados exclusivamente à O.S. selecionada */}
          <div
            className="os-card-surface os-env-surface"
            style={
              !isOSConfirmed
                ? {
                    opacity: 0.65,
                    transition: 'opacity 0.2s ease',
                  }
                : undefined
            }
          >
            <div className="os-card-header-row">
              <span className="os-section-label">
                {ambientesDaOS.length === 1
                  ? 'Ambiente da Obra'
                  : `Ambientes da Obra (${ambientesDaOS.length})`}
              </span>
              <span className="os-meta-badge os-meta-badge--ghost">Toque para selecionar</span>
            </div>

            <div className="os-env-chips-grid">
              {ambientesDaOS.map((amb) => {
                const isActive = amb.nome === selectedEnvironment;
                return (
                  <button
                    key={amb.id}
                    type="button"
                    className={`os-env-chip ${isActive ? 'is-active' : ''}`}
                    onClick={() => handleEnvironmentClick(amb)}
                  >
                    <span className="os-env-chip-dot" aria-hidden="true" />
                    <span className="os-env-chip-text">{amb.nome}</span>
                    <span className="os-env-chip-count">
                      {amb.lotesPecas.length === 1 ? '1 lote' : `${amb.lotesPecas.length} lotes`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Coluna Direita: Lote de Peças & Previsão de Consumo */}
        <div
          className="os-col-right"
          style={
            !isOSConfirmed
              ? {
                  opacity: 0.65,
                  transition: 'opacity 0.2s ease',
                }
              : undefined
          }
        >
          {/* Card de Peças e Lote Selecionado do Ambiente Atual */}
          <div className="os-card-surface os-lot-surface">
            <div className="os-card-header-row">
              <span className="os-section-label">Lote de Peças • {ambienteAtual.nome}</span>
              <span className="os-meta-badge os-meta-badge--neutral">
                {lotesDoAmbiente.length > 1
                  ? `Lote ${loteAtualIdx + 1}/${lotesDoAmbiente.length} • ${pieceLot.qty || pieceLot.quantidade || '12 frentes'}`
                  : pieceLot.qty || pieceLot.quantidade || '12 frentes'}
              </span>
            </div>

            <div className="os-lot-body">
              <h3 className="os-lot-title">
                {pieceLot.title || pieceLot.titulo || 'Armários Superiores - Portas 18mm'}
              </h3>
              <p className="os-lot-desc">
                <span>{pieceLot.acabamentoSugerido || 'Laca Branca Fosca 20 Gloss'}</span>
                {' • '}
                <span>
                  {pieceLot.substrate || pieceLot.substrato || 'MDF Cru 18mm Berneck'}
                </span>
              </p>
            </div>

            {/* Se o cômodo tiver múltiplos lotes de peças, exibe botão tátil para alternar entre eles */}
            {lotesDoAmbiente.length > 1 ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  minHeight: '48px',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  background: 'rgba(var(--overlay-rgb), 0.04)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={18} color="var(--primary)" />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                    Lote {loteAtualIdx + 1} de {lotesDoAmbiente.length} neste ambiente
                  </span>
                </div>
                <button
                  type="button"
                  className="os-action-btn os-btn-secondary"
                  onClick={handleCycleRoomLot}
                  style={{ minHeight: '38px', padding: '0 14px', fontSize: '13px' }}
                >
                  Alternar Lote
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  minHeight: '48px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(var(--overlay-rgb), 0.03)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                <Layers size={16} />
                <span>Lote único previsto para {ambienteAtual.nome} nesta O.S.</span>
              </div>
            )}
          </div>

          {/* Card de Métricas de Consumo com Conector Visual */}
          <div className="os-card-surface os-metrics-surface">
            <div className="os-card-header-row">
              <span className="os-section-label">Previsão de Consumo Químico</span>
              <span className="os-meta-badge os-meta-badge--primary">
                25 ml / m² homologado
              </span>
            </div>

            <div className="os-metrics-row">
              <div className="os-metric-box">
                <span className="os-metric-label">Área Calculada</span>
                <span className="os-metric-val">
                  <CountNumber value={areaNumeric} format={(n) => `${Math.round(n)} m²`} />
                </span>
              </div>
              <div className="os-metric-divider" aria-hidden="true" />
              <div className="os-metric-box os-metric-box-primary">
                <span className="os-metric-label">Volume Estimado</span>
                <span className="os-metric-val os-metric-val-primary">
                  <CountNumber value={volumeNumeric} format={(n) => `${Math.round(n).toLocaleString('pt-BR')} ml`} />
                </span>
              </div>
            </div>

            <div className="os-trace-note">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>Vinculado à bancada de dosagem e preparação química.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Barra Inferior Padronizada */}
      <footer className="os-bottom-bar-minimal">
        <div className="os-bottom-left">
          <button
            type="button"
            className="os-bar-btn os-btn-back"
            onClick={() => onNavigate('dashboard')}
          >
            ← Voltar
          </button>
        </div>

        <div className="os-bottom-right">
          <button
            type="button"
            className="os-bar-btn os-btn-continue"
            onClick={() => onNavigate('recipe')}
            disabled={!isOSConfirmed}
            style={
              !isOSConfirmed
                ? {
                    opacity: 0.5,
                    cursor: 'not-allowed',
                    border: '1.5px solid rgba(245, 158, 11, 0.4)',
                    background: 'rgba(245, 158, 11, 0.1)',
                    color: 'var(--tint-amber)',
                  }
                : undefined
            }
            title={
              isOSConfirmed
                ? 'Ver receita e calcular mistura'
                : 'Selecione ou confirme a Ordem de Serviço para avançar'
            }
          >
            {!isOSConfirmed ? (
              <>
                <Lock size={18} strokeWidth={2.4} />
                <span>Selecione a O.S. para avançar</span>
              </>
            ) : (
              <>
                <span>Ver receita e calcular mistura</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>
        </div>
      </footer>

      {/* Modal Tátil Seletor de Ordem de Serviço (Apple HIG / Inset Grouped) */}
      <OsSelectionModal
        isOpen={isOsModalOpen}
        onClose={() => setIsOsModalOpen(false)}
        selectedOS={selectedOS}
        onSelectOS={onSelectOS}
      />
    </div>
  );
};
