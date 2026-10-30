import React from 'react';
import { FlaskConical, Check, AlertTriangle } from 'lucide-react';
import { RecipeState, Receita } from '../types';
import { calcularFracoesMistura } from '../domain/mixture';
import { ordenarLotesFEFO } from '../domain/fefo';
import {
  MOCK_RECEITAS,
  MOCK_MARCAS,
  MOCK_LOTES,
} from '../data';

interface ScreenRecipeProps {
  recipe: RecipeState;
  activeRecipe?: Receita;
  onSelectRecipe?: (receita: Receita) => void;
  onSetTotalVolume: (vol: number) => void;
  onAdjustVolume: (delta: number) => void;
  onConfirmWeighing: () => void;
  onNavigate: (screen: 'os' | 'dashboard' | 'dosing') => void;
  onOpenCancelPrep: () => void;
}

const PRESET_VOLUMES = [500, 1000, 1500, 2000];

export const ScreenRecipe: React.FC<ScreenRecipeProps> = ({
  recipe,
  activeRecipe,
  onSelectRecipe,
  onSetTotalVolume,
  onAdjustVolume,
  onConfirmWeighing,
  onNavigate,
  onOpenCancelPrep,
}) => {
  const vol = recipe.totalVolume;

  // Receita ativa selecionada ou padrão
  const receita = activeRecipe || MOCK_RECEITAS[0];
  const marca = MOCK_MARCAS.find((m) => m.id === receita.marcaId) || { nome: receita.marcaNome };

  // Cálculo das frações químicas via função pura de domínio a partir dos itens da receita mockada
  const itensParaCalculo = receita.itens.map((item) => ({
    papel: item.papel,
    produtoNome: item.produtoNome,
    codigoProduto: item.codigoProduto,
    proporcao: item.proporcao,
    densidade: item.densidade,
  }));

  const fracoes = calcularFracoesMistura(itensParaCalculo, vol);

  return (
    <div className="recipe-screen-container">
      {/* 1. Stepper de Progresso Industrial (Compacto) */}
      <nav className="os-stepper-bar" aria-label="Etapas da preparação">
        <div
          className="os-step-pill clickable"
          onClick={() => onNavigate('os')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigate('os');
            }
          }}
          title="Voltar para Peça & O.S."
        >
          <span className="os-step-badge">✓</span>
          <span className="os-step-text">Peça & O.S.</span>
        </div>
        <span className="os-step-separator" aria-hidden="true">→</span>
        <div className="os-step-pill active" aria-current="step">
          <span className="os-step-badge">2</span>
          <span className="os-step-text">Receita & Cálculo</span>
        </div>
        <span className="os-step-separator" aria-hidden="true">→</span>
        <div className="os-step-pill pending">
          <span className="os-step-badge">3</span>
          <span className="os-step-text">Dosagem em Béquer</span>
        </div>
      </nav>

      {/* Seletor de Receita Homologada (Acabamento, Verniz ou Fundo Primer) */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
        {MOCK_RECEITAS.map((r) => {
          const isSelected = r.id === receita.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelectRecipe && onSelectRecipe(r)}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: isSelected ? 'rgba(59, 130, 246, 0.18)' : 'var(--card)',
                color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isSelected ? '0 0 12px rgba(59, 130, 246, 0.3)' : 'none',
              }}
            >
              <span>{isSelected ? <Check size={16} strokeWidth={2.6} /> : <FlaskConical size={16} strokeWidth={2.2} />}</span>
              <span>{r.nome}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Cabeçalho da Receita (Apple / Notion) */}
      <div className="recipe-header-card">
        <div className="recipe-title-group">
          <h2 className="recipe-main-title">{receita.nome}</h2>
          <p className="recipe-sub-title">{receita.descricao}</p>
        </div>
        <div className="recipe-brand-pill">
          <span className="recipe-brand-dot" aria-hidden="true" />
          <span>Homologado: {marca.nome}</span>
        </div>
      </div>

      {/* 3. Superfície da Calculadora de Volume */}
      <div className="recipe-volume-surface">
        <div className="recipe-volume-top-row">
          <span className="recipe-volume-label">Volume Total de Mistura Desejado</span>
          <span className="recipe-volume-hint">Ajuste o volume antes de pesar</span>
        </div>

        <div className="recipe-stepper-row">
          <button
            type="button"
            className="recipe-stepper-btn"
            onClick={() => onAdjustVolume(-100)}
            aria-label="Diminuir 100 ml"
          >
            −
          </button>

          <div className="recipe-volume-display">
            <span className="recipe-volume-num">{vol.toLocaleString('pt-BR')}</span>
            <span className="recipe-volume-unit">ml</span>
          </div>

          <button
            type="button"
            className="recipe-stepper-btn"
            onClick={() => onAdjustVolume(100)}
            aria-label="Aumentar 100 ml"
          >
            +
          </button>
        </div>

        {/* Presets Rápidos de Volume (Alvo amplo para luvas) */}
        <div className="recipe-presets-grid" role="group" aria-label="Volumes pré-definidos">
          {PRESET_VOLUMES.map((preset) => {
            const isActive = preset === vol;
            const formattedLabel = `${preset.toLocaleString('pt-BR')} ml`;
            return (
              <button
                key={preset}
                type="button"
                className={`recipe-preset-chip ${isActive ? 'is-active' : ''}`}
                onClick={() => onSetTotalVolume(preset)}
              >
                {formattedLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Grade dos 4 Componentes Químicos */}
      <div className="recipe-chemicals-grid" role="group" aria-label="Componentes da mistura">
        {receita.itens.map((item, idx) => {
          const fracao = fracoes[idx];
          const lotesDoProduto = ordenarLotesFEFO(
            MOCK_LOTES.filter((l) => l.produtoId === item.produtoId)
          );
          const loteAtivo = lotesDoProduto[0];
          const isUrgente =
            loteAtivo &&
            ((loteAtivo.diasAberto ?? 0) > 0 || loteAtivo.statusUrgencia === 'alta');
          const percentStr = `${Math.round(item.proporcao * 100)}%`;

          const isCatalyst = item.papel === 'catalisador';
          const cardVariantClass = isCatalyst ? 'is-catalyst' : '';
          const cleanedName = item.produtoNome.replace(/^[0-9]+[º°]?\s*/, '');
          const cleanLoteCode = loteAtivo ? loteAtivo.codigo.replace(/^#+/, '') : 'SY-5120';

          return (
            <div key={item.id} className={`recipe-chem-card ${cardVariantClass}`}>
              <div className="recipe-chem-top">
                <div className="recipe-chem-role-row">
                  <span className="recipe-chem-role">
                    {idx + 1}º {item.papel.toUpperCase()}
                  </span>
                  <span className={`recipe-chem-percent-pill ${isCatalyst ? 'pill-warn' : ''}`}>
                    {percentStr}
                  </span>
                </div>
                <h4 className="recipe-chem-name">{cleanedName}</h4>
                <span className="recipe-chem-code">Cód: {item.codigoProduto}</span>
              </div>

              {/* Status de Lote / FEFO Alinhado */}
              <div className="recipe-chem-fefo-box">
                {isUrgente && loteAtivo ? (
                  <div className="recipe-fefo-urgent">
                    <span className="recipe-fefo-icon" aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <AlertTriangle size={14} strokeWidth={2.4} />
                    </span>
                    <span className="recipe-fefo-text">
                      Lata aberta #{cleanLoteCode} • {loteAtivo.prateleira || 'B-01'}
                    </span>
                  </div>
                ) : (
                  <div className="recipe-fefo-normal">
                    <span className="recipe-fefo-icon" aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <Check size={14} strokeWidth={2.6} />
                    </span>
                    <span className="recipe-fefo-text">
                      Lote #{cleanLoteCode} • {loteAtivo?.prateleira || 'Estoque'}
                    </span>
                  </div>
                )}
              </div>

              {/* Valores de Dosagem */}
              <div className="recipe-chem-bottom">
                <span className={`recipe-chem-vol ${isCatalyst ? 'vol-warn' : ''}`}>
                  {fracao.volumeMl} ml
                </span>
                <span className="recipe-chem-weight">Peso: {fracao.pesoGramas} g</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Barra Inferior Padronizada */}
      <footer className="os-bottom-bar-minimal">
        <div className="os-bottom-left">
          <button
            type="button"
            className="os-bar-btn os-btn-back"
            onClick={() => onNavigate('os')}
          >
            ← Voltar
          </button>
          <button
            type="button"
            className="os-bar-btn os-btn-cancel"
            onClick={onOpenCancelPrep}
          >
            ✕ Cancelar preparação
          </button>
        </div>

        <div className="os-bottom-right">
          <button
            type="button"
            className="os-bar-btn os-btn-continue"
            onClick={onConfirmWeighing}
          >
            <span>Iniciar dosagem no béquer</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
};
