import React, { useState } from 'react';
import { Check, X, FileSpreadsheet, Layers } from 'lucide-react';
import { Ambiente, AmbienteOS, OrdemServico, PieceLot } from '../types';
import { CountNumber } from '../components/ui/CountNumber';
import { MOCK_ORDENS_SERVICO } from '../data/mock/mockData';

interface ScreenOSProps {
  selectedOS: string;
  clientName: string;
  projectName: string;
  selectedEnvironment: string;
  onSelectEnvironment: (env: string) => void;
  pieceLot: PieceLot;
  onSelectPieceLot?: (lote: PieceLot, envName?: string) => void;
  onChangePieceLot: () => void;
  onChangeOS: () => void;
  onSelectOS?: (os: OrdemServico) => void;
  onScanOS: () => void;
  onNavigate: (screen: 'dashboard' | 'recipe') => void;
  onOpenCancelPrep?: () => void;
  ambientes?: Ambiente[];
}

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
      {/* 2. Área de Trabalho Principal em 2 Colunas */}
      <div className="os-layout-minimal">
        {/* Coluna Esquerda: O.S. & Ambiente */}
        <div className="os-col-left">
          {/* Card da Ordem de Serviço */}
          <div className="os-card-surface">
            <div className="os-card-header-row">
              <span className="os-section-label">Ordem de Serviço Ativa</span>
              <span className="os-meta-badge os-meta-badge--primary">{selectedOS || 'OS #8841'}</span>
            </div>

            <div className="os-info-block">
              <h3 className="os-client-title">{clientName}</h3>
              <p className="os-project-subtitle">{projectName}</p>
            </div>

            <div className="os-card-actions-row">
              <button
                type="button"
                className="os-action-btn os-btn-scan"
                onClick={onScanOS}
                title="Escanear QR Code da Ordem de Serviço"
                aria-label="Escanear QR Code da Ordem de Serviço"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                  <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                  <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                  <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                  <rect x="7" y="7" width="10" height="10" rx="1.5" />
                </svg>
                <span>Ler QR Code</span>
              </button>

              <button
                type="button"
                className="os-action-btn os-btn-secondary"
                onClick={() => {
                  if (onSelectOS) {
                    setIsOsModalOpen(true);
                  } else {
                    onChangeOS();
                  }
                }}
                title="Selecionar Ordem de Serviço na fila"
                aria-label="Alternar Ordem de Serviço"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
                <span>Selecionar O.S. ({MOCK_ORDENS_SERVICO.length})</span>
              </button>
            </div>
          </div>

          {/* Card de Ambientes / Cômodos vinculados exclusivamente à O.S. selecionada */}
          <div className="os-card-surface os-env-surface">
            <div className="os-card-header-row">
              <span className="os-section-label">
                {ambientesDaOS.length === 1
                  ? 'Ambiente / Serviço desta O.S.'
                  : 'Ambientes / Cômodos desta O.S.'}
              </span>
              <span className="os-meta-badge os-meta-badge--neutral">
                {ambientesDaOS.length === 1
                  ? '1 ambiente previsto'
                  : `${ambientesDaOS.length} ambientes na O.S.`}
              </span>
            </div>

            <div
              className="os-env-grid"
              role="radiogroup"
              aria-label="Selecione o ambiente da Ordem de Serviço"
              style={
                ambientesDaOS.length === 1
                  ? { gridTemplateColumns: '1fr' }
                  : undefined
              }
            >
              {ambientesDaOS.map((amb) => {
                const isSelected = amb.nome === ambienteAtual.nome;
                const qtdLotes = amb.lotesPecas.length;
                return (
                  <button
                    key={amb.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`os-env-chip ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleEnvironmentClick(amb)}
                  >
                    <div className="os-env-chip-header">
                      <span className="os-env-name">{amb.nome}</span>
                      {isSelected && (
                        <span className="os-env-check" aria-hidden="true">
                          <Check size={17} strokeWidth={2.8} />
                        </span>
                      )}
                    </div>
                    <span className="os-env-code">
                      {qtdLotes === 1
                        ? `1 lote • ${amb.lotesPecas[0].quantidade}`
                        : `${qtdLotes} lotes de peças previstos`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Coluna Direita: Peça & Consumo Previsto */}
        <div className="os-col-right">
          {/* Card do Lote de Peças vinculado ao Ambiente selecionado */}
          <div className="os-card-surface">
            <div className="os-card-header-row">
              <span className="os-section-label">
                Lote de Peças • {ambienteAtual.nome}
              </span>
              <span className="os-meta-badge os-meta-badge--neutral">
                {lotesDoAmbiente.length > 1
                  ? `Lote ${loteAtualIdx + 1}/${lotesDoAmbiente.length} • ${pieceLot.qty || pieceLot.quantidade || '12 frentes'}`
                  : pieceLot.qty || pieceLot.quantidade || '12 frentes'}
              </span>
            </div>

            <div className="os-piece-info">
              <h3 className="os-piece-title">
                {pieceLot.title || pieceLot.titulo || 'Armários Superiores - Portas 18mm'}
              </h3>
              <div className="os-meta-badge os-meta-badge--amber" style={{ marginTop: '8px' }}>
                <span className="os-finish-dot" aria-hidden="true" />
                <span>{pieceLot.acabamentoSugerido || 'Laca Branca Fosca 20 Gloss'}</span>
              </div>
            </div>

            <div className="os-metrics-row">
              <div className="os-metric-box">
                <span className="os-metric-label">Substrato Base</span>
                <strong className="os-spec-v">
                  {pieceLot.substrate || pieceLot.substrato || 'MDF Cru 18mm Berneck'}
                </strong>
              </div>
              <div className="os-metric-divider" aria-hidden="true" />
              <div className="os-metric-box">
                <span className="os-metric-label">Área Superficial</span>
                <strong className="os-spec-v os-spec-highlight">
                  ~ <CountNumber value={areaNumeric} format={(n) => `${Math.round(n)} m²`} />
                </strong>
              </div>
            </div>

            {lotesDoAmbiente.length > 1 ? (
              <button
                type="button"
                className="os-action-btn os-btn-secondary os-btn-full"
                onClick={handleCycleRoomLot}
                title="Alternar entre os lotes de peças deste ambiente"
                aria-label="Alternar lote de peças deste ambiente"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
                <span>
                  Alternar lote de {ambienteAtual.nome} ({loteAtualIdx + 1}/{lotesDoAmbiente.length})
                </span>
              </button>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  minHeight: '48px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
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

          {/* Card de Métricas de Consumo com Conector Visual (Stageshow Connector + CountNumber) */}
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

      {/* 3. Barra Inferior Padronizada (Cancelar preparação aparece apenas na Dosagem em Béquer) */}
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
          >
            <span>Ver receita e calcular mistura</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </footer>

      {/* Modal Tátil Seletor de Ordem de Serviço */}
      {isOsModalOpen && (
        <div
          className="ds-modal-overlay active"
          role="dialog"
          aria-modal="true"
          aria-label="Selecionar Ordem de Serviço"
        >
          <div className="ds-modal-card" style={{ maxWidth: '720px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'var(--primary-soft)',
                    border: '1.5px solid var(--primary-border)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileSpreadsheet size={24} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="ds-modal-title" style={{ fontSize: '22px', margin: 0 }}>
                    Selecionar Ordem de Serviço na Fila
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '16px', color: 'var(--text-muted)' }}>
                    Toque na O.S. para carregar seus ambientes e lotes de peças correspondentes.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOsModalOpen(false)}
                className="os-bar-btn os-btn-back"
                style={{ minHeight: '52px', padding: '0 16px' }}
                aria-label="Fechar seletor de O.S."
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '55vh', overflowY: 'auto' }}>
              {MOCK_ORDENS_SERVICO.map((ordem) => {
                const isCurrent = ordem.numero === selectedOS;
                const ambientesLista =
                  ordem.ambientesObra && ordem.ambientesObra.length > 0
                    ? ordem.ambientesObra.map((a) => a.nome).join(' + ')
                    : ordem.ambienteNome;
                const qtdAmbientes = ordem.ambientesObra?.length || 1;
                return (
                  <button
                    key={ordem.id}
                    type="button"
                    onClick={() => {
                      if (onSelectOS) {
                        onSelectOS(ordem);
                      }
                      setIsOsModalOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      width: '100%',
                      minHeight: '84px',
                      padding: '16px 20px',
                      borderRadius: '16px',
                      border: isCurrent ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                      background: isCurrent ? 'var(--primary-soft)' : 'var(--bg)',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span className="os-number-tag">{ordem.numero}</span>
                        <strong style={{ fontSize: '18px', color: 'var(--text)' }}>
                          {ordem.clienteNome}
                        </strong>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: 'rgba(255,255,255,0.06)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {qtdAmbientes === 1 ? '1 ambiente' : `${qtdAmbientes} ambientes`}
                        </span>
                      </div>
                      <span style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
                        Ambientes: <strong style={{ color: 'var(--text)' }}>{ambientesLista}</strong> • {ordem.projetoNome}
                      </span>
                    </div>

                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: isCurrent ? '2px solid var(--primary)' : '2px solid var(--border)',
                        background: isCurrent ? 'var(--primary)' : 'var(--card)',
                        color: isCurrent ? 'var(--primary-foreground)' : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isCurrent && <Check size={18} strokeWidth={2.8} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
