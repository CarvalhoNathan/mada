import React from 'react';
import { RecipeState } from '../types';
import { StepIndicator } from '../components/ui/StepIndicator';
import { Button } from '../components/ui/Button';
import { calcularFracoesMistura } from '../domain/mixture';
import { ordenarLotesFEFO } from '../domain/fefo';
import {
  MOCK_RECEITAS,
  MOCK_MARCAS,
  MOCK_LOTES,
  MOCK_ORDENS_SERVICO,
} from '../data';

interface ScreenRecipeProps {
  recipe: RecipeState;
  onSetTotalVolume: (vol: number) => void;
  onAdjustVolume: (delta: number) => void;
  onOpenCriticalModal: () => void;
  onConfirmWeighing: () => void;
  onNavigate: (screen: 'os' | 'dashboard') => void;
  onOpenCancelPrep: () => void;
}

const PRESET_VOLUMES = [500, 1000, 1500, 2000];

export const ScreenRecipe: React.FC<ScreenRecipeProps> = ({
  recipe,
  onSetTotalVolume,
  onAdjustVolume,
  onOpenCriticalModal,
  onConfirmWeighing,
  onNavigate,
  onOpenCancelPrep,
}) => {
  const vol = recipe.totalVolume;

  // Receita, marca e OS obtidos dos mocks
  const receita = MOCK_RECEITAS[0];
  const marca = MOCK_MARCAS.find((m) => m.id === receita.marcaId) || { nome: receita.marcaNome };
  const osAtiva = MOCK_ORDENS_SERVICO[0];

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
    <>
      <div className="screen-content-area">
        {/* Indicador de Etapas */}
        <StepIndicator
          steps={[
            { id: 1, label: `1. ${osAtiva.numero} (${osAtiva.ambienteNome})`, status: 'completed' },
            { id: 2, label: '2. Receita & Calculadora', status: 'active' },
            { id: 3, label: '3. Dosagem & Baixa', status: 'pending' },
          ]}
          onStepClick={(step) => {
            if (step.id === 1) onNavigate('os');
          }}
        />

        {/* Barra de Título da Receita carregada dos mocks */}
        <div className="recipe-header-bar">
          <div className="recipe-header-info">
            <h2>{receita.nome}</h2>
            <p>{receita.descricao}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="btn-action-small"
              onClick={onOpenCriticalModal}
              style={{
                borderColor: 'var(--danger-border)',
                color: 'var(--danger)',
                fontWeight: 700,
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Simular excesso de catalisador na balança (+200 ml)"
            >
              <span>⚠️</span> Simular excesso (+200 ml)
            </button>
            <div className="badge-brand-homologated">
              <span>✓</span> MARCA HOMOLOGADA: {marca.nome.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Seletor de Volume Total da Mistura */}
        <div className="volume-control-box">
          <div className="volume-control-label">VOLUME TOTAL DE MISTURA DESEJADO</div>

          <div className="volume-selector-row">
            <button
              className="btn-stepper-round"
              onClick={() => onAdjustVolume(-100)}
              aria-label="Diminuir 100ml"
            >
              −
            </button>
            <div className="volume-display-main">
              <span>{vol.toLocaleString('pt-BR')}</span>
              <span className="volume-display-unit">ml</span>
            </div>
            <button
              className="btn-stepper-round"
              onClick={() => onAdjustVolume(100)}
              aria-label="Aumentar 100ml"
            >
              +
            </button>
          </div>

          {/* Presets rápidos de volume (>= 64px) */}
          <div className="volume-presets-row">
            {PRESET_VOLUMES.map((preset) => {
              const isActive = preset === vol;
              const formattedLabel =
                preset >= 1000
                  ? `${(preset / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 3 })} ml`
                  : `${preset} ml`;
              return (
                <button
                  key={preset}
                  className={`preset-chip-btn ${isActive ? 'active' : ''}`}
                  onClick={() => onSetTotalVolume(preset)}
                >
                  {formattedLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Frações Químicas Calculadas a partir dos itens mockados */}
        <div className="chemicals-grid">
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

            const cardClass =
              item.papel === 'base'
                ? 'chem-card card-base'
                : item.papel === 'catalisador'
                ? 'chem-card card-cat'
                : item.papel === 'diluidor'
                ? 'chem-card card-dil'
                : 'chem-card card-ret';

            return (
              <div key={item.id} className={cardClass}>
                <div className="chem-card-header">
                  <div className="chem-info">
                    <h4>{item.produtoNome}</h4>
                    <span>
                      Cód: {item.codigoProduto} {loteAtivo ? `• Lote ${loteAtivo.codigo}` : ''}
                    </span>
                  </div>
                  <span
                    className="chem-percent-badge"
                    style={
                      item.papel === 'catalisador'
                        ? {
                            background: 'var(--warn-soft)',
                            color: 'var(--warn)',
                            borderColor: 'var(--warn)',
                          }
                        : undefined
                    }
                  >
                    {percentStr}
                  </span>
                </div>

                {isUrgente && loteAtivo && (
                  <div className="badge-use-first-inside">
                    <span>⚠️</span> USE PRIMEIRO: Lata aberta {loteAtivo.codigo} (
                    {loteAtivo.prateleira || 'Almoxarifado'})
                  </div>
                )}

                <div className="chem-values-row">
                  <span
                    className="chem-volume-large"
                    style={item.papel === 'catalisador' ? { color: 'var(--warn)' } : undefined}
                  >
                    {fracao.volumeMl} ml
                  </span>
                  <span className="chem-weight-sub">Peso: {fracao.pesoGramas} g</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Barra Inferior Fixa */}
      <footer className="ds-bottom-bar">
        <div className="ds-bottom-bar-left">
          <Button variant="secondary" size="md" onClick={() => onNavigate('os')}>
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
          <Button variant="primary" size="md" onClick={onConfirmWeighing} style={{ minWidth: '240px' }}>
            Iniciar mistura →
          </Button>
        </div>
      </footer>
    </>
  );
};
