import React from 'react';
import {
  AlertTriangle,
  FlaskConical,
  RotateCcw,
  QrCode,
  ArrowRight,
  Clock,
  Lock,
} from 'lucide-react';
import { Operator, Lote, ScreenId, Preparacao } from '../types';
import { MOCK_LOTES, MOCK_ORDENS_SERVICO } from '../data';
import { ordenarLotesFEFO } from '../domain/fefo';

interface ScreenDashboardProps {
  operator: Operator;
  onNavigate: (screen: ScreenId) => void;
  onOpenUseFirstModal: () => void;
  onSimulateQR: () => void;
  lotes?: Lote[];
  preparacoesPendentes?: Preparacao[];
  preparacoesEmConferencia?: Preparacao[];
  preparacaoAtivaCabine?: Preparacao | null;
  onResumePreparacao?: (prep: Preparacao) => void;
}

export const ScreenDashboard: React.FC<ScreenDashboardProps> = ({
  operator,
  onNavigate,
  onOpenUseFirstModal,
  onSimulateQR,
  lotes,
  preparacoesPendentes = [],
  preparacoesEmConferencia = [],
  preparacaoAtivaCabine = null,
  onResumePreparacao,
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

  // Contagem estrita de embalagens realmente PENDENTES de devolução pelo operador
  const totalItensPendentesDevolucao = preparacoesPendentes.reduce(
    (acc, prep) =>
      acc + prep.itensDevolucao.filter((it) => it.status === 'PENDENTE').length,
    0
  );

  // Contagem separada de embalagens aguardando conferência técnica
  const totalItensEmConferencia = preparacoesEmConferencia.reduce(
    (acc, prep) =>
      acc +
      prep.itensDevolucao.filter((it) => it.status === 'PENDENTE_DE_CONFERENCIA').length,
    0
  );

  const prepDaCabineOperador = preparacoesPendentes.find(
    (p) =>
      (p.cabineId || 'CABINE-01').toUpperCase() ===
      (operator.cabineId || 'CABINE-01').toUpperCase()
  );
  const prepMaisRecentePendente =
    preparacaoAtivaCabine || prepDaCabineOperador || preparacoesPendentes[0];
  const cabineOcupadaPorAplicacao = Boolean(preparacaoAtivaCabine);

  return (
    <div className="boardui-dash-container">
      {/* 1. Cabeçalho Operacional Focado na Cabine */}
      <div className="boardui-dash-header">
        <div className="boardui-dash-greeting">
          <h1 className="boardui-dash-title">
            O que vamos fazer, {firstName}?
          </h1>
          <p className="boardui-dash-subtitle">
            {operatorRole} • Selecione a operação na bancada abaixo
          </p>
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

      {/* 3. Grade das 3 Ações Operacionais da Cabine */}
      <div className="boardui-cards-grid" role="group" aria-label="Ações da cabine de pintura">
        {/* Card 1 (HERO): Nova Preparação (com bloqueio inteligente por cabine se houver aplicação ativa) */}
        <button
          type="button"
          className="boardui-card primary-card"
          onClick={() => onNavigate('os')}
          style={
            cabineOcupadaPorAplicacao
              ? {
                  borderColor: 'rgba(245, 158, 11, 0.55)',
                }
              : undefined
          }
        >
          <div className="boardui-card-top">
            <div className="boardui-card-icon primary-icon" aria-hidden="true">
              {cabineOcupadaPorAplicacao ? (
                <Lock size={28} strokeWidth={2.2} />
              ) : (
                <FlaskConical size={28} strokeWidth={2.2} />
              )}
            </div>
            <ArrowRight className="boardui-card-arrow" size={24} strokeWidth={2.2} aria-hidden="true" />
          </div>

          <div className="boardui-card-body">
            <h2 className="boardui-card-title">Nova preparação</h2>
            <p className="boardui-card-desc">
              {cabineOcupadaPorAplicacao && preparacaoAtivaCabine
                ? `Aplicação ativa em andamento na ${
                    preparacaoAtivaCabine.cabineNome || 'Cabine'
                  } (${preparacaoAtivaCabine.ordemServicoNumero}). Conclua a aplicação na pistola para liberar nova mistura.`
                : 'Vincule a Ordem de Serviço, calcule a receita homologada e pese os componentes com trava anti-erro.'}
            </p>
          </div>

          <div className="boardui-card-bottom">
            <span className={`boardui-pill-badge ${cabineOcupadaPorAplicacao ? 'amber-badge' : 'blue-badge'}`}>
              {cabineOcupadaPorAplicacao && preparacaoAtivaCabine
                ? `${preparacaoAtivaCabine.cabineNome || 'Cabine'} ocupada (${preparacaoAtivaCabine.ordemServicoNumero})`
                : `${totalOrdensFila} OS na fila de pintura`}
            </span>
            <span className="boardui-card-meta">
              {cabineOcupadaPorAplicacao && preparacaoAtivaCabine
                ? `Receita ativa: ${preparacaoAtivaCabine.receitaNome}`
                : `Próxima: ${ultimaOrdem.ambienteNome} (${ultimaOrdem.clienteNome})`}
            </span>
          </div>
        </button>

        {/* Card 2: Devolver Sobras (Central de Devoluções Pendentes) */}
        <button
          type="button"
          className="boardui-card"
          onClick={() => {
            if (prepMaisRecentePendente && onResumePreparacao && preparacoesPendentes.length === 1) {
              onResumePreparacao(prepMaisRecentePendente);
            } else {
              onNavigate('return');
            }
          }}
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
              Central de pendências: recupere preparações interrompidas e registre a devolução ou descarte de cada embalagem utilizada.
            </p>
          </div>

          <div className="boardui-card-bottom">
            <span className={`boardui-pill-badge ${totalItensPendentesDevolucao > 0 ? 'amber-badge' : 'green-badge'}`}>
              <Clock size={14} strokeWidth={2.4} style={{ marginRight: '5px' }} />
              {totalItensPendentesDevolucao > 0
                ? `${totalItensPendentesDevolucao} ${totalItensPendentesDevolucao === 1 ? 'embalagem pendente' : 'embalagens pendentes'}`
                : totalItensEmConferencia > 0
                ? `0 pendentes • ${totalItensEmConferencia} em conferência`
                : 'Nenhuma embalagem pendente'}
            </span>
            <span className="boardui-card-meta">
              {prepMaisRecentePendente
                ? `Retomar: ${prepMaisRecentePendente.ordemServicoNumero} (${prepMaisRecentePendente.ambienteNome})`
                : totalItensEmConferencia > 0
                ? 'Aguardando conferência técnica'
                : 'Todas as devoluções em dia'}
            </span>
          </div>
        </button>

        {/* Card 3: Escanear QR Code (Mecanismo Inteligente de OS e Embalagens) */}
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
              Leitor inteligente: escaneie uma Ordem de Serviço para iniciar preparo ou uma etiqueta de lata para consultar saldo e devolver.
            </p>
          </div>

          <div className="boardui-card-bottom">
            <span className="boardui-pill-badge green-badge">
              Identifica O.S. ou Embalagem
            </span>
            <span className="boardui-card-meta">
              Câmera frontal + simulação rápida
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
