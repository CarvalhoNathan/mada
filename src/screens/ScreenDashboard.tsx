import React from 'react';
import { Operator, Lote } from '../types';
import { MOCK_LOTES } from '../data';
import { ordenarLotesFEFO } from '../domain/fefo';

interface ScreenDashboardProps {
  operator: Operator;
  onNavigate: (screen: 'auth' | 'os' | 'recipe' | 'return') => void;
  onOpenUseFirstModal: () => void;
  onSimulateQR: () => void;
  lotes?: Lote[];
}

export const ScreenDashboard: React.FC<ScreenDashboardProps> = ({
  operator,
  onNavigate,
  onOpenUseFirstModal,
  onSimulateQR,
  lotes,
}) => {
  const fullName = operator.nome || operator.name || 'Operador';
  const firstName = fullName.split(' ')[0];

  // Cálculo dinâmico do alerta FEFO
  const lotesAtuais = lotes && lotes.length > 0 ? lotes : MOCK_LOTES;
  const lotesOrdenados = ordenarLotesFEFO(lotesAtuais);
  const lotesPrioritarios = lotesOrdenados.filter(
    (l) => l.quantidadeAtual > 0 && ((l.diasAberto ?? 0) > 0 || l.statusUrgencia === 'alta')
  );
  const loteMaisUrgente = lotesPrioritarios[0] || lotesOrdenados[0];
  const totalPrioritarios = lotesPrioritarios.length;

  return (
    <div className="dash-layout-minimal">
      {/* 1. Título Direto e Humanizado (32px, peso 600) */}
      <div className="dash-header-minimal">
        <h2 className="dash-title-minimal">O que vamos fazer, {firstName}?</h2>
      </div>

      {/* 2. Banner FEFO: "Use Primeiro" (Latas Prioritárias) */}
      <div
        className="dash-use-first-banner"
        onClick={onOpenUseFirstModal}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenUseFirstModal();
          }
        }}
        title="Toque para ver a lista de latas que vencem primeiro"
      >
        <div className="dash-use-first-left">
          <div className="dash-use-first-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="dash-use-first-text">
            <h3 className="dash-use-first-title">
              Use primeiro: {totalPrioritarios} lotes prioritários ({loteMaisUrgente ? `${loteMaisUrgente.produtoNome} • ${loteMaisUrgente.prateleira || 'Prateleira B-01'}` : 'Laca Branca Fosca 20 Gloss • Prateleira B-01'})
            </h3>
            <p className="dash-use-first-desc">
              Priorize latas já abertas antes de violar novas latas lacradas.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="dash-use-first-btn"
          onClick={(e) => {
            e.stopPropagation();
            onOpenUseFirstModal();
          }}
        >
          Ver latas prioritárias →
        </button>
      </div>

      {/* 3. Grade das 3 Ações Operacionais */}
      <div className="dash-actions-grid" role="group" aria-label="Ações da cabine de pintura">
        {/* Card 1: Nova Preparação */}
        <div
          className="dash-action-card card-primary-highlight"
          onClick={() => onNavigate('os')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigate('os');
            }
          }}
        >
          <div className="dash-card-header">
            <div className="dash-card-icon-box icon-primary" aria-hidden="true">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2v7.31L4.14 20a2 2 0 0 0 1.72 3h12.28a2 2 0 0 0 1.72-3L14 9.31V2" />
                <path d="M8.5 2h7" />
                <path d="M7 16h10" />
              </svg>
            </div>
            <svg className="dash-card-arrow" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>

          <div className="dash-card-body">
            <h3 className="dash-card-title">Nova preparação</h3>
            <p className="dash-card-desc">
              Consulte a receita oficial e prepare a mistura por cliente, projeto e ambiente.
            </p>
          </div>
        </div>

        {/* Card 2: Devolver Sobras */}
        <div
          className="dash-action-card"
          onClick={() => onNavigate('return')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigate('return');
            }
          }}
        >
          <div className="dash-card-header">
            <div className="dash-card-icon-box" aria-hidden="true">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </div>
            <svg className="dash-card-arrow" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>

          <div className="dash-card-body">
            <h3 className="dash-card-title">Devolver sobras</h3>
            <p className="dash-card-desc">
              Pese a sobra na lata, emita etiqueta com QR Code e devolva o saldo ao estoque.
            </p>
          </div>
        </div>

        {/* Card 3: Escanear QR Code */}
        <div
          className="dash-action-card"
          onClick={onSimulateQR}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSimulateQR();
            }
          }}
        >
          <div className="dash-card-header">
            <div className="dash-card-icon-box" aria-hidden="true">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                <rect x="7" y="7" width="10" height="10" rx="1.5" />
              </svg>
            </div>
            <svg className="dash-card-arrow" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>

          <div className="dash-card-body">
            <h3 className="dash-card-title">Escanear QR Code</h3>
            <p className="dash-card-desc">
              Identifique instantaneamente a Ordem de Serviço ou consulte o saldo de uma lata.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

