import React, { useState } from 'react';
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
  const [selectedModel, setSelectedModel] = useState<string>('fable');
  const [effortLevel, setEffortLevel] = useState<number>(2); // 0: Mínimo, 1: Baixo, 2: Médio, 3: Alto, 4: Máximo
  const [activeSegment, setActiveSegment] = useState<'dia' | 'semana' | 'mes' | 'ano'>('dia');
  const [check1, setCheck1] = useState(true);
  const [check2, setCheck2] = useState(false);
  const [check3, setCheck3] = useState(true);

  // FEFO Priority Batch calculation
  const lotesAtuais = lotes && lotes.length > 0 ? lotes : MOCK_LOTES;
  const lotesOrdenados = ordenarLotesFEFO(lotesAtuais);
  const lotesPrioritarios = lotesOrdenados.filter(
    (l) => l.quantidadeAtual > 0 && ((l.diasAberto ?? 0) > 0 || l.statusUrgencia === 'alta')
  );
  const loteMaisUrgente = lotesPrioritarios[0] || lotesOrdenados[0];
  const totalPrioritarios = lotesPrioritarios.length;

  const effortLabels = ['Mínimo', 'Baixo', 'Médio', 'Alto', 'Inteligente'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '14px' }}>
      {/* 1. Banner FEFO no Estilo BoardUI (Alerta Amber Glass) */}
      <div
        className="boardui-alert-card"
        onClick={onOpenUseFirstModal}
        role="button"
        tabIndex={0}
        title="Toque para ver lotes prioritários FEFO"
        style={{ cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'rgba(245, 158, 11, 0.16)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#ededed', lineHeight: 1.3 }}>
              Use primeiro: {totalPrioritarios} lotes prioritários ({loteMaisUrgente ? `${loteMaisUrgente.produtoNome} • ${loteMaisUrgente.prateleira || 'Prateleira A-02'}` : 'Verniz PU Alto Sólidos • Prateleira A-02'})
            </div>
            <div style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '2px' }}>
              Priorize latas já abertas antes de violar novas latas lacradas no almoxarifado.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenUseFirstModal();
          }}
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.14)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#f59e0b',
            borderRadius: '10px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
        >
          Ver latas prioritárias →
        </button>
      </div>

      {/* 2. Grade de Widgets Modular BoardUI (Print 1: 3 Colunas) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr 0.95fr', gap: '14px', flex: 1, minHeight: 0 }}>
        {/* Coluna 1: Checklist de Etapas + Controles Inferiores */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Card Checklist (Print 1: 3 etapas restantes) */}
          <div className="boardui-widget-card" style={{ flex: 1 }}>
            <div>
              <div className="boardui-checklist-header">
                <div className="boardui-checklist-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#a1a1aa' }}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  <span>3 etapas restantes</span>
                </div>
                <button
                  type="button"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    color: '#71717a',
                    padding: '2px 8px',
                    cursor: 'pointer',
                  }}
                  title="Recolher lista"
                >
                  ─
                </button>
              </div>

              <div className="boardui-checklist-list">
                {/* Etapa 1: Concluída */}
                <div className="boardui-checklist-item done">
                  <div className="boardui-check-icon">✓</div>
                  <span>Ler os arquivos do projeto (OS #8841)</span>
                </div>

                {/* Etapa 2: Concluída */}
                <div className="boardui-checklist-item done">
                  <div className="boardui-check-icon">✓</div>
                  <span>Atualize e instale os lotes de peças</span>
                </div>

                {/* Etapa 3: Ativa (Destaque e Spinner) */}
                <div className="boardui-checklist-item active">
                  <div className="boardui-check-icon" />
                  <span>Implemente a proporção da receita Laca Fosca</span>
                </div>

                {/* Etapa 4: Pendente */}
                <div className="boardui-checklist-item pending">
                  <div className="boardui-check-icon" />
                  <span>Adicionar a opção de pesagem na Balança Toledo...</span>
                </div>

                {/* Etapa 5: Pendente */}
                <div className="boardui-checklist-item pending">
                  <div className="boardui-check-icon" />
                  <span>Execute registro, etiqueta QR e baixa de estoque...</span>
                </div>
              </div>
            </div>

            {/* Ação rápida para abrir OS */}
            <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#71717a' }}>Ordem Ativa: <strong>OS #8841</strong></span>
              <button
                type="button"
                onClick={() => onNavigate('os')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#2b7fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Abrir O.S. →
              </button>
            </div>
          </div>

          {/* Controles Inferiores (Print 1: Dia | Semana | Mês | Ano + Checkboxes) */}
          <div className="boardui-bottom-row">
            <div className="boardui-segmented-control">
              <button
                type="button"
                className={`boardui-segmented-btn ${activeSegment === 'dia' ? 'active' : ''}`}
                onClick={() => setActiveSegment('dia')}
              >
                Dia
              </button>
              <button
                type="button"
                className={`boardui-segmented-btn ${activeSegment === 'semana' ? 'active' : ''}`}
                onClick={() => setActiveSegment('semana')}
              >
                Semana
              </button>
              <button
                type="button"
                className={`boardui-segmented-btn ${activeSegment === 'mes' ? 'active' : ''}`}
                onClick={() => setActiveSegment('mes')}
              >
                Mês
              </button>
              <button
                type="button"
                className={`boardui-segmented-btn ${activeSegment === 'ano' ? 'active' : ''}`}
                onClick={() => setActiveSegment('ano')}
              >
                Ano
              </button>
            </div>

            <div className="boardui-checkbox-group">
              <div
                className="boardui-checkbox-box"
                style={{ cursor: 'pointer', opacity: check1 ? 1 : 0.4 }}
                onClick={() => setCheck1(!check1)}
                role="checkbox"
                aria-checked={check1}
                tabIndex={0}
              >
                ✓
              </div>
              <div
                className="boardui-checkbox-box"
                style={{
                  cursor: 'pointer',
                  backgroundColor: check2 ? '#2b7fff' : 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
                onClick={() => setCheck2(!check2)}
                role="checkbox"
                aria-checked={check2}
                tabIndex={0}
              >
                {check2 ? '✓' : ''}
              </div>
              <div
                className="boardui-checkbox-box"
                style={{ cursor: 'pointer', opacity: check3 ? 1 : 0.4 }}
                onClick={() => setCheck3(!check3)}
                role="checkbox"
                aria-checked={check3}
                tabIndex={0}
              >
                ─
              </div>
            </div>
          </div>
        </div>

        {/* Coluna 2: Card de Modelos (Print 1: Modelos com Radios e Slider de Esforço) */}
        <div className="boardui-widget-card">
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#71717a', marginBottom: '10px' }}>
              Modelos
            </div>

            <div className="boardui-models-list">
              {/* Opção 1: Composer 2.5 */}
              <div
                className={`boardui-model-row ${selectedModel === 'composer' ? 'selected' : ''}`}
                onClick={() => setSelectedModel('composer')}
                role="radio"
                aria-checked={selectedModel === 'composer'}
                tabIndex={0}
              >
                <span className="boardui-model-name">Composer 2.5</span>
                <div className="boardui-radio-dot" />
              </div>

              {/* Opção 2: GPT-5.6 Sol */}
              <div
                className={`boardui-model-row ${selectedModel === 'gpt' ? 'selected' : ''}`}
                onClick={() => setSelectedModel('gpt')}
                role="radio"
                aria-checked={selectedModel === 'gpt'}
                tabIndex={0}
              >
                <span className="boardui-model-name">GPT-5.6 Sol</span>
                <div className="boardui-radio-dot" />
              </div>

              {/* Opção 3: Fable 5 (Selecionado Ativo no Print 1) */}
              <div
                className={`boardui-model-row ${selectedModel === 'fable' ? 'selected' : ''}`}
                onClick={() => setSelectedModel('fable')}
                role="radio"
                aria-checked={selectedModel === 'fable'}
                tabIndex={0}
              >
                <span className="boardui-model-name">Fable 5</span>
                <div className="boardui-radio-dot" />
              </div>

              {/* Opção 4: Sonnet 5 */}
              <div
                className={`boardui-model-row ${selectedModel === 'sonnet' ? 'selected' : ''}`}
                onClick={() => setSelectedModel('sonnet')}
                role="radio"
                aria-checked={selectedModel === 'sonnet'}
                tabIndex={0}
              >
                <span className="boardui-model-name">Sonnet 5</span>
                <div className="boardui-radio-dot" />
              </div>
            </div>

            {/* Slider de Esforço (Print 1: Esforço Médio | Mais rápido. Mais inteligente) */}
            <div className="boardui-slider-box">
              <div className="boardui-slider-header">
                <span>Esforço <strong>{effortLabels[effortLevel]}</strong></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#71717a', marginBottom: '4px' }}>
                <span>Mais rápido.</span>
                <span>Mais inteligente</span>
              </div>
              <div className="boardui-slider-ticks-row">
                {[0, 1, 2, 3, 4].map((idx) => (
                  <div
                    key={idx}
                    onClick={() => setEffortLevel(idx)}
                    style={{
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      className="boardui-slider-tick"
                      style={{
                        backgroundColor: idx === effortLevel ? '#2b7fff' : 'rgba(255, 255, 255, 0.2)',
                        height: idx === effortLevel ? '14px' : '10px',
                        width: idx === effortLevel ? '3px' : '2px',
                      }}
                    />
                  </div>
                ))}
                {/* Thumb estilizado sobre a posição ativa */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${(effortLevel / 4) * 82 + 5}%`,
                    width: '32px',
                    height: '20px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    pointerEvents: 'none',
                    transition: 'left 0.15s ease',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Botão de Ação Primária Azul Elétrico BoardUI */}
          <button
            type="button"
            onClick={() => onNavigate('os')}
            style={{
              width: '100%',
              height: '44px',
              backgroundColor: '#2b7fff',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 0 20px rgba(43, 127, 255, 0.35)',
              marginTop: '12px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>Iniciar Nova Preparação</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>

        {/* Coluna 3: Card de Formulário / Ações Rápidas (Print 1: E-mail, Senha, Botão) */}
        <div className="boardui-widget-card">
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#71717a', marginBottom: '14px' }}>
              Acesso Rápido
            </div>

            {/* Campo E-mail / Identificador */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', color: '#ededed', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                E-mail ou O.S.
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '9px 12px',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <input
                  type="text"
                  defaultValue={operator?.nome ? `${operator.nome.toLowerCase().replace(/\s+/g, '.')}@mada.com.br` : 'operador@mada.com.br'}
                  readOnly
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ededed',
                    fontSize: '14px',
                    width: '100%',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Campo Senha / Token */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', color: '#ededed', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Código do Lote
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '9px 12px',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type="password"
                  defaultValue="••••••••••••"
                  readOnly
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ededed',
                    fontSize: '14px',
                    width: '100%',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Checkbox "Lembrar" */}
            <label className="boardui-checkbox-label" style={{ marginBottom: '14px' }}>
              <div className="boardui-checkbox-box">✓</div>
              <span style={{ fontSize: '13px', color: '#a1a1aa' }}>Lembrar nesta cabine de pintura</span>
            </label>
          </div>

          {/* Botões de Ação na Coluna 3 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={onSimulateQR}
              style={{
                width: '100%',
                height: '42px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ededed',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01" />
              </svg>
              <span>Escanear QR Code</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('return')}
              style={{
                width: '100%',
                height: '42px',
                backgroundColor: '#2b7fff',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 0 15px rgba(43, 127, 255, 0.3)',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Devolver Sobras de Tinta</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
