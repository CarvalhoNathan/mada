import React from 'react';
import { Operator } from '../types';

interface ScreenDashboardProps {
  operator: Operator;
  onNavigate: (screen: 'auth' | 'os' | 'recipe' | 'return') => void;
  onOpenUseFirstModal: () => void;
  onSimulateQR: () => void;
}

export const ScreenDashboard: React.FC<ScreenDashboardProps> = ({
  operator,
  onNavigate,
  onOpenUseFirstModal,
  onSimulateQR,
}) => {
  const fullName = operator.nome || operator.name || 'Operador';
  const firstName = fullName.split(' ')[0];

  return (
    <div className="screen-content-area">
      <div className="dashboard-top-row">
        <div>
          <div className="section-tag">02 / CENTRAL DE AÇÕES</div>
          <h2 className="section-title">O que vamos fazer, {firstName}?</h2>
          <p className="section-desc">Escolha uma ação operacional para a Cabine de Pintura.</p>
        </div>
      </div>

      {/* Alerta de Validade: "Use Primeiro" */}
      <div className="use-first-banner" onClick={onOpenUseFirstModal} title="Toque para ver a lista de latas que vencem primeiro">
        <div className="use-first-left">
          <div className="use-first-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="use-first-info">
            <h3>Use primeiro: 3 latas de Verniz PU vencem esta semana (Prateleira A-02)</h3>
            <p>Priorize latas já abertas no almoxarifado antes de violar novas latas lacradas.</p>
          </div>
        </div>
        <div className="use-first-action">
          <span>Ver latas prioritárias →</span>
        </div>
      </div>

      {/* Tríade de Ações Principais */}
      <div className="actions-triad-grid">
        {/* Ação 1: Nova Preparação */}
        <div className="action-card card-primary" onClick={() => onNavigate('os')}>
          <div className="action-card-header">
            <div className="action-icon-circle">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M10 2v7.31L4.14 20a2 2 0 0 0 1.72 3h12.28a2 2 0 0 0 1.72-3L14 9.31V2" />
                <path d="M8.5 2h7" />
              </svg>
            </div>
            <svg className="action-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
          <div className="action-card-body">
            <h3 className="action-title">Nova preparação</h3>
            <p className="action-desc">Consulte a receita oficial e prepare a mistura por cliente, projeto e ambiente.</p>
          </div>
        </div>

        {/* Ação 2: Devolver Sobras */}
        <div className="action-card card-white" onClick={() => onNavigate('return')}>
          <div className="action-card-header">
            <div className="action-icon-circle">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </div>
            <svg className="action-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
          <div className="action-card-body">
            <h3 className="action-title">Devolver sobras</h3>
            <p className="action-desc">Pese a sobra na lata, emita etiqueta com QR Code e devolva o saldo ao estoque.</p>
          </div>
        </div>

        {/* Ação 3: Escanear QR Code */}
        <div className="action-card card-qr" onClick={onSimulateQR}>
          <div className="action-card-header">
            <div className="action-icon-circle">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                <rect x="7" y="7" width="10" height="10" rx="1" />
              </svg>
            </div>
            <svg className="action-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
          <div className="action-card-body">
            <h3 className="action-title">Escanear QR Code</h3>
            <p className="action-desc">Identifique instantaneamente a Ordem de Serviço ou consulte o saldo restante de uma lata.</p>
          </div>
        </div>
      </div>

      {/* Rodapé Informativo da Cabine */}
      <div className="dashboard-footer-status">
        <div className="dash-status-item">
          <span className="dash-status-label">Posto Operacional:</span>
          <span className="dash-status-val">Cabine PU 01 • Ativa</span>
        </div>
        <div className="dash-status-item">
          <span className="dash-status-label">Turno Atual:</span>
          <span className="dash-status-val">Manhã • Laca & Verniz</span>
        </div>
        <div className="dash-status-item">
          <span className="dash-status-label">Supervisão:</span>
          <span className="dash-status-val">Fábio (Online)</span>
        </div>
      </div>
    </div>
  );
};
