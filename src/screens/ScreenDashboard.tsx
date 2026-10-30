import React from 'react';
import { Boxes, BarChart3, AlertTriangle, FlaskConical, RotateCcw, QrCode, ArrowRight } from 'lucide-react';
import { Operator, Lote, ScreenId } from '../types';
import { MOCK_LOTES, MOCK_ORDENS_SERVICO } from '../data';
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
  const operatorRole = operator.papel || operator.role || 'Operador de Cabine';

  // Cálculo dinâmico do alerta FEFO e saldos
  const lotesAtuais = lotes && lotes.length > 0 ? lotes : MOCK_LOTES;
  const lotesOrdenados = ordenarLotesFEFO(lotesAtuais);
  const lotesPrioritarios = lotesOrdenados.filter(
    (l) => l.quantidadeAtual > 0 && ((l.diasAberto ?? 0) > 0 || l.statusUrgencia === 'alta')
  );
  const loteMaisUrgente = lotesPrioritarios[0] || lotesOrdenados[0];
  const totalPrioritarios = lotesPrioritarios.length;
  const totalOrdensFila = MOCK_ORDENS_SERVICO.length;
  const ultimaOrdem = MOCK_ORDENS_SERVICO[0];

  return (
    <div className="boardui-dash-container">
      {/* 1. Cabeçalho Operacional + Atalhos Secundários Ergonômicos (>= 64px touch target) */}
      <div className="boardui-dash-header">
        <div className="boardui-dash-greeting">
          <h1 className="boardui-dash-title">
            O que vamos fazer, {firstName}?
          </h1>
          <p className="boardui-dash-subtitle">
            {operatorRole} • Selecione a operação na bancada abaixo
          </p>
        </div>

        <div className="boardui-dash-quick-nav" role="navigation" aria-label="Acessos de gestão e estoque">
          <button
            type="button"
            className="boardui-nav-action-btn"
            onClick={() => onNavigate('inventory')}
          >
            <Boxes size={20} strokeWidth={2.2} aria-hidden="true" />
            <span>Estoque & Compras</span>
          </button>

          <button
            type="button"
            className="boardui-nav-action-btn is-manager"
            onClick={() => onNavigate('manager')}
          >
            <BarChart3 size={20} strokeWidth={2.2} aria-hidden="true" />
            <span>Painel do Gestor</span>
          </button>
        </div>
      </div>

      {/* 2. Banner de Alerta FEFO "Use Primeiro" (Sem botão aninhado, alvo único >= 76px) */}
      <button
        type="button"
        className="boardui-fefo-banner"
        onClick={onOpenUseFirstModal}
        title="Toque para ver a lista de latas que vencem primeiro"
      >
        <div className="boardui-fefo-left">
          <div className="boardui-fefo-icon" aria-hidden="true">
            <AlertTriangle size={24} strokeWidth={2.2} />
          </div>
          <div className="boardui-fefo-text">
            <div className="boardui-fefo-title">
              Use primeiro: {totalPrioritarios} {totalPrioritarios === 1 ? 'lote prioritário' : 'lotes prioritários'} ({loteMaisUrgente ? `${loteMaisUrgente.produtoNome} • ${loteMaisUrgente.prateleira || 'Prateleira A-02'}` : 'Verniz PU Alto Sólidos 4:1 • Prateleira A-02'})
            </div>
            <div className="boardui-fefo-desc">
              Priorize latas já abertas ou próximas do vencimento antes de abrir um galão lacrado.
            </div>
          </div>
        </div>

        <span className="boardui-fefo-btn" aria-hidden="true">
          Ver latas prioritárias <ArrowRight size={18} strokeWidth={2.4} />
        </span>
      </button>

      {/* 3. Grade das 3 Ações Operacionais da Cabine (Botões semânticos de grande área tátil) */}
      <div className="boardui-cards-grid" role="group" aria-label="Ações da cabine de pintura">
        {/* Card 1: Nova Preparação (Destaque Primário) */}
        <button
          type="button"
          className="boardui-card primary-card"
          onClick={() => onNavigate('os')}
        >
          <div className="boardui-card-top">
            <div className="boardui-card-icon primary-icon" aria-hidden="true">
              <FlaskConical size={28} strokeWidth={2.2} />
            </div>
            <ArrowRight className="boardui-card-arrow" size={24} strokeWidth={2.2} aria-hidden="true" />
          </div>

          <div className="boardui-card-body">
            <h2 className="boardui-card-title">Nova preparação</h2>
            <p className="boardui-card-desc">
              Vincule a Ordem de Serviço, calcule a receita homologada e pese os componentes com trava anti-erro.
            </p>
          </div>

          <div className="boardui-card-bottom">
            <span className="boardui-pill-badge blue-badge">
              {totalOrdensFila} OS na fila de pintura
            </span>
            <span className="boardui-card-meta">
              Próxima: {ultimaOrdem.ambienteNome} ({ultimaOrdem.clienteNome})
            </span>
          </div>
        </button>

        {/* Card 2: Devolver Sobras */}
        <button
          type="button"
          className="boardui-card"
          onClick={() => onNavigate('return')}
        >
          <div className="boardui-card-top">
            <div className="boardui-card-icon" aria-hidden="true">
              <RotateCcw size={28} strokeWidth={2.2} />
            </div>
            <ArrowRight className="boardui-card-arrow" size={24} strokeWidth={2.2} aria-hidden="true" />
          </div>

          <div className="boardui-card-body">
            <h2 className="boardui-card-title">Devolver sobras</h2>
            <p className="boardui-card-desc">
              Informe o saldo restante na lata, gere a nova etiqueta QR Code e registre o retorno na prateleira.
            </p>
          </div>

          <div className="boardui-card-bottom">
            <span className="boardui-pill-badge amber-badge">
              {totalPrioritarios} {totalPrioritarios === 1 ? 'lata aberta em giro' : 'latas abertas em giro'}
            </span>
            <span className="boardui-card-meta">
              {loteMaisUrgente ? `Foco: ${loteMaisUrgente.produtoNome}` : 'Rastreabilidade por lote e OS'}
            </span>
          </div>
        </button>

        {/* Card 3: Escanear QR Code */}
        <button
          type="button"
          className="boardui-card"
          onClick={onSimulateQR}
        >
          <div className="boardui-card-top">
            <div className="boardui-card-icon" aria-hidden="true">
              <QrCode size={28} strokeWidth={2.2} />
            </div>
            <ArrowRight className="boardui-card-arrow" size={24} strokeWidth={2.2} aria-hidden="true" />
          </div>

          <div className="boardui-card-body">
            <h2 className="boardui-card-title">Escanear QR Code</h2>
            <p className="boardui-card-desc">
              Aponte a ficha da Ordem de Serviço ou a etiqueta de uma lata para a câmera da estação.
            </p>
          </div>

          <div className="boardui-card-bottom">
            <span className="boardui-pill-badge green-badge">
              Câmera / Leitor pronto
            </span>
            <span className="boardui-card-meta">
              Leitura óptica + simulação rápida
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};

