import React from 'react';
import { Ambiente, PieceLot } from '../types';
import { MOCK_AMBIENTES } from '../data/mock/mockData';
import { StepIndicator } from '../components/ui/StepIndicator';
import { Button } from '../components/ui/Button';

interface ScreenOSProps {
  selectedOS: string;
  clientName: string;
  projectName: string;
  selectedEnvironment: string;
  onSelectEnvironment: (env: string) => void;
  pieceLot: PieceLot;
  onChangePieceLot: () => void;
  onChangeOS: () => void;
  onScanOS: () => void;
  onNavigate: (screen: 'dashboard' | 'recipe') => void;
  onOpenCancelPrep: () => void;
  ambientes?: Ambiente[];
}

export const ScreenOS: React.FC<ScreenOSProps> = ({
  clientName,
  projectName,
  selectedEnvironment,
  onSelectEnvironment,
  pieceLot,
  onChangePieceLot,
  onChangeOS,
  onScanOS,
  onNavigate,
  onOpenCancelPrep,
  ambientes,
}) => {
  const listaAmbientes = (ambientes || MOCK_AMBIENTES).map(a => ({ name: a.nome, code: a.codigoOS }));
  return (
    <>
      <div className="screen-content-area">
        {/* Indicador de Etapas */}
        <StepIndicator
          steps={[
            { id: 1, label: '1. Identificar OS & Peça', status: 'active' },
            { id: 2, label: '2. Receita & Calculadora', status: 'pending' },
            { id: 3, label: '3. Dosagem & Baixa', status: 'pending' },
          ]}
          onStepClick={(step) => {
            if (step.id === 2) onNavigate('recipe');
          }}
        />

        {/* Botão Ler QR Code em destaque */}
        <div className="btn-scan-os-featured" onClick={onScanOS}>
          <div className="btn-scan-os-left">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M3 7V5a2 2 0 0 1 2-2h2" />
              <path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
              <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              <rect x="7" y="7" width="10" height="10" rx="1" />
            </svg>
            <span>Ler QR Code da OS (Identificação Rápida)</span>
          </div>
          <span style={{ fontSize: '16px', color: 'var(--primary)', fontWeight: 700 }}>
            Preencher dados da ficha impressa →
          </span>
        </div>

        {/* Grid de Seleção da OS */}
        <div className="os-selection-layout">
          {/* Coluna Esquerda */}
          <div className="os-card-group">
            <div className="os-box">
              <div className="os-box-header">
                <span className="os-box-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  1. Ordem de Serviço & Contratante
                </span>
                <span className="badge-validated">✓ Validado</span>
              </div>
              <div className="os-highlight-item">
                <div className="os-highlight-info">
                  <h4>{clientName}</h4>
                  <p style={{ fontSize: 'var(--fs-small)' }}>{projectName}</p>
                </div>
                <button
                  className="btn-action-small"
                  onClick={onChangeOS}
                  style={{ minHeight: '64px', minWidth: '100px', fontSize: 'var(--fs-small)', fontWeight: 700 }}
                  aria-label="Trocar Ordem de Serviço"
                >
                  Trocar OS ⟳
                </button>
              </div>
            </div>

            <div className="os-box">
              <div className="os-box-header">
                <span className="os-box-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18" />
                    <path d="M9 21V9" />
                  </svg>
                  2. Ambiente / Cômodo
                </span>
              </div>
              <div className="environments-grid">
                {listaAmbientes.map((env) => {
                  const isSelected = env.name === selectedEnvironment;
                  return (
                    <div
                      key={env.name}
                      className={`env-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => onSelectEnvironment(env.name)}
                      style={{ minHeight: '64px' }}
                    >
                      <div className="env-chip-header">
                        <span style={{ fontSize: 'var(--fs-small)' }}>{env.name}</span>
                        {isSelected && <span>✓</span>}
                      </div>
                      <span className="env-chip-sub" style={{ fontSize: 'var(--fs-small)' }}>{env.code}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Coluna Direita */}
          <div className="os-card-group">
            <div className="os-box">
              <div className="os-box-header">
                <span className="os-box-title">3. Lote de Peças</span>
                <span className="badge-qty" style={{ fontSize: 'var(--fs-small)' }}>{pieceLot.qty}</span>
              </div>
              <div className="piece-detail-card">
                <div className="piece-header">
                  <div>
                    <h4>{pieceLot.title}</h4>
                    <span style={{ fontSize: 'var(--fs-small)', color: 'var(--warn)', fontWeight: 700 }}>
                      Laca Branca Fosca 20 Gloss
                    </span>
                  </div>
                </div>
                <div className="piece-specs-grid">
                  <div className="spec-item">
                    <strong style={{ fontSize: 'var(--fs-small)' }}>Substrato Base</strong>
                    <span style={{ fontSize: 'var(--fs-small)' }}>{pieceLot.substrate}</span>
                  </div>
                  <div className="spec-item">
                    <strong style={{ fontSize: 'var(--fs-small)' }}>Área Superficial</strong>
                    <span style={{ fontSize: 'var(--fs-small)', fontWeight: 700, color: 'var(--primary)' }}>~ {pieceLot.area}</span>
                  </div>
                </div>
                <div className="piece-change-bar">
                  <span className="piece-change-hint" style={{ fontSize: 'var(--fs-small)' }}>Lote vinculado à OS</span>
                  <button
                    className="btn-action-small"
                    onClick={onChangePieceLot}
                    style={{ minHeight: '64px', minWidth: '120px', fontSize: 'var(--fs-small)', fontWeight: 700 }}
                    aria-label="Alternar lote de peças"
                  >
                    Trocar lote ⟳
                  </button>
                </div>
              </div>
            </div>

            <div className="consumption-box">
              <div className="os-box-header">
                <span className="os-box-title">4. Previsão de Consumo & Rastreabilidade</span>
              </div>
              <div className="consumption-values-row">
                <div className="consumption-val-group">
                  <span>Área Calculada</span>
                  <strong>{pieceLot.area}</strong>
                </div>
                <div className="consumption-val-group highlight">
                  <span>Consumo Estimado</span>
                  <strong>{pieceLot.estVolume}</strong>
                </div>
              </div>
              <p className="consumption-desc">
                🛡️ <strong>Rastreabilidade ativa:</strong> Todo consumo de catalisador e tinta pesado na balança da cabine será vinculado a esta Ordem de Serviço.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra Inferior Fixa */}
      <footer className="ds-bottom-bar">
        <div className="ds-bottom-bar-left">
          <Button variant="secondary" size="md" onClick={() => onNavigate('dashboard')}>
            ← Voltar
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={onOpenCancelPrep}
            style={{ borderColor: 'var(--danger-border)', color: 'var(--danger)' }}
          >
            ✕ Cancelar preparação
          </Button>
        </div>
        <div className="ds-bottom-bar-right">
          <Button variant="primary" size="md" onClick={() => onNavigate('recipe')} style={{ minWidth: '240px' }}>
            Ver receita →
          </Button>
        </div>
      </footer>
    </>
  );
};
