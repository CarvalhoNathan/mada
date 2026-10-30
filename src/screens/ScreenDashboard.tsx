import React from 'react';
import { Operator, Lote, ScreenId } from '../types';
import { MOCK_LOTES } from '../data';
import { ordenarLotesFEFO } from '../domain/fefo';

interface ScreenDashboardProps {
  operator: Operator;
  onNavigate: (screen: ScreenId) => void;
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
    <div className="boardui-dash-container">
      {/* 1. Título Humanizado e Direto + Acesso a Estoque & Compras */}
      <div
        className="boardui-dash-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <h2 className="boardui-dash-title" style={{ margin: 0 }}>
          O que vamos fazer, {firstName}?
        </h2>
        <button
          type="button"
          onClick={() => onNavigate('inventory')}
          style={{
            background: 'var(--card-hover)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '10px 18px',
            color: 'var(--text)',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
          }}
        >
          📦 Estoque & Lista de Compras
        </button>
      </div>

      {/* 2. Banner de Alerta FEFO "Use Primeiro" (Estilo BoardUI Amber Glass) */}
      <div
        className="boardui-fefo-banner"
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
        <div className="boardui-fefo-left">
          <div className="boardui-fefo-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="boardui-fefo-text">
            <div className="boardui-fefo-title">
              Use primeiro: {totalPrioritarios} lotes prioritários ({loteMaisUrgente ? `${loteMaisUrgente.produtoNome} • ${loteMaisUrgente.prateleira || 'Prateleira A-02'}` : 'Verniz PU Alto Sólidos 4:1 (Sayersystem) • Prateleira A-02'})
            </div>
            <div className="boardui-fefo-desc">
              Priorize latas já abertas antes de violar novas latas lacradas.
            </div>
          </div>
        </div>

        <button
          type="button"
          className="boardui-fefo-btn"
          onClick={(e) => {
            e.stopPropagation();
            onOpenUseFirstModal();
          }}
        >
          Ver latas prioritárias →
        </button>
      </div>

      {/* 3. Grade das 3 Ações Operacionais da Cabine (Estilo BoardUI Card Widgets) */}
      <div className="boardui-cards-grid" role="group" aria-label="Ações da cabine de pintura">
        {/* Card 1: Nova Preparação (Destaque Azul Elétrico BoardUI) */}
        <div
          className="boardui-card primary-card"
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
          <div className="boardui-card-top">
            <div className="boardui-card-icon primary-icon" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2v7.31L4.14 20a2 2 0 0 0 1.72 3h12.28a2 2 0 0 0 1.72-3L14 9.31V2" />
                <path d="M8.5 2h7" />
                <path d="M7 16h10" />
              </svg>
            </div>
            <svg className="boardui-card-arrow" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>

          <div className="boardui-card-body">
            <h3 className="boardui-card-title">Nova preparação</h3>
            <p className="boardui-card-desc">
              Consulte a receita oficial e prepare a mistura por cliente, projeto e ambiente.
            </p>
          </div>

          <div className="boardui-card-bottom">
            <span className="boardui-pill-badge blue-badge">4 OS na fila</span>
            <span className="boardui-card-meta">Última: Cozinha Provençal • há 35 min</span>
          </div>
        </div>

        {/* Card 2: Devolver Sobras */}
        <div
          className="boardui-card"
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
          <div className="boardui-card-top">
            <div className="boardui-card-icon" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </div>
            <svg className="boardui-card-arrow" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>

          <div className="boardui-card-body">
            <h3 className="boardui-card-title">Devolver sobras</h3>
            <p className="boardui-card-desc">
              Pese a sobra na lata, emita etiqueta com QR Code e devolva o saldo ao estoque.
            </p>
          </div>

          <div className="boardui-card-bottom">
            <span className="boardui-pill-badge amber-badge">1 sobra pendente</span>
            <span className="boardui-card-meta">Lote anterior: Laca Branca Fosca</span>
          </div>
        </div>

        {/* Card 3: Escanear QR Code */}
        <div
          className="boardui-card"
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
          <div className="boardui-card-top">
            <div className="boardui-card-icon" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                <rect x="7" y="7" width="10" height="10" rx="1.5" />
              </svg>
            </div>
            <svg className="boardui-card-arrow" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>

          <div className="boardui-card-body">
            <h3 className="boardui-card-title">Escanear QR Code</h3>
            <p className="boardui-card-desc">
              Identifique instantaneamente a Ordem de Serviço ou consulte o saldo de uma lata.
            </p>
          </div>

          <div className="boardui-card-bottom">
            <span className="boardui-pill-badge green-badge">Leitor / Câmera ativo</span>
            <span className="boardui-card-meta">Aproxime a O.S. ou o galão</span>
          </div>
        </div>
      </div>
    </div>
  );
};
