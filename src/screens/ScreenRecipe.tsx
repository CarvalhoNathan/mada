import React from 'react';
import { RecipeState } from '../types';
import { StepIndicator } from '../components/ui/StepIndicator';
import { Button } from '../components/ui/Button';

import { calcularFracoesMistura } from '../domain/mixture';

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

  // Cálculo das frações químicas via função pura de domínio
  const itensParaCalculo = [
    { papel: 'base', produtoNome: '1º Base Laca Branca PU', codigoProduto: 'LB-2001', proporcao: recipe.proportions.base, densidade: recipe.densities.base },
    { papel: 'catalisador', produtoNome: '2º Catalisador PU Médio', codigoProduto: 'CT-304', proporcao: recipe.proportions.catalisador, densidade: recipe.densities.catalisador },
    { papel: 'diluidor', produtoNome: '3º Diluidor Poliuretano 8000', codigoProduto: 'DL-800', proporcao: recipe.proportions.diluidor, densidade: recipe.densities.diluidor },
    { papel: 'retardador', produtoNome: '4º Aditivo Retardador', codigoProduto: 'RT-100', proporcao: recipe.proportions.retardador, densidade: recipe.densities.retardador },
  ];

  const fracoes = calcularFracoesMistura(itensParaCalculo, vol);
  const fBase = fracoes[0];
  const fCat = fracoes[1];
  const fDil = fracoes[2];
  const fRet = fracoes[3];

  const volBase = fBase.volumeMl;
  const weightBase = fBase.pesoGramas;

  const volCat = fCat.volumeMl;
  const weightCat = fCat.pesoGramas;

  const volDil = fDil.volumeMl;
  const weightDil = fDil.pesoGramas;

  const volRet = fRet.volumeMl;
  const weightRet = fRet.pesoGramas;

  return (
    <>
      <div className="screen-content-area">
        {/* Indicador de Etapas */}
        <StepIndicator
          steps={[
            { id: 1, label: '1. OS #8841 (Cozinha Gourmet)', status: 'completed' },
            { id: 2, label: '2. Receita & Calculadora', status: 'active' },
            { id: 3, label: '3. Dosagem & Baixa', status: 'pending' },
          ]}
          onStepClick={(step) => {
            if (step.id === 1) onNavigate('os');
          }}
        />

        {/* Barra de Título da Receita */}
        <div className="recipe-header-bar">
          <div className="recipe-header-info">
            <h2>LACA BRANCA FOSCA PU 20 GLOSS</h2>
            <p>Fórmula homologada: FORM-PU-BL20 • Acabamento de Alto Padrão</p>
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
              <span>✓</span> MARCA HOMOLOGADA: SAYERLACK INDUSTRIAL
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
              const formattedLabel = preset >= 1000 ? `${(preset / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 3 })} ml` : `${preset} ml`;
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

        {/* As 4 Frações Químicas Calculadas (Grid horizontal sem rolagem) */}
        <div className="chemicals-grid">
          {/* 1. Base PU */}
          <div className="chem-card card-base">
            <div className="chem-card-header">
              <div className="chem-info">
                <h4>1º Base Laca Branca PU</h4>
                <span>Cód: LB-2001 • Lote #SY-9942</span>
              </div>
              <span className="chem-percent-badge">50%</span>
            </div>
            <div className="chem-values-row">
              <span className="chem-volume-large">{volBase} ml</span>
              <span className="chem-weight-sub">Peso: {weightBase} g</span>
            </div>
          </div>

          {/* 2. Catalisador PU */}
          <div className="chem-card card-cat">
            <div className="chem-card-header">
              <div className="chem-info">
                <h4>2º Catalisador PU Médio</h4>
                <span>Endurecedor • Lote #SY-8821</span>
              </div>
              <span className="chem-percent-badge" style={{ background: 'var(--warn-soft)', color: 'var(--warn)', borderColor: 'var(--warn)' }}>
                25%
              </span>
            </div>
            <div className="badge-use-first-inside">
              <span>⚠️</span> USE PRIMEIRO: Lata aberta #SY-8821 (Almoxarifado A-02)
            </div>
            <div className="chem-values-row">
              <span className="chem-volume-large" style={{ color: 'var(--warn)' }}>
                {volCat} ml
              </span>
              <span className="chem-weight-sub">Peso: {weightCat} g</span>
            </div>
          </div>

          {/* 3. Diluidor Retardado */}
          <div className="chem-card card-dil">
            <div className="chem-card-header">
              <div className="chem-info">
                <h4>3º Diluidor Poliuretano 8000</h4>
                <span>Cód: DL-800 • Viscosidade</span>
              </div>
              <span className="chem-percent-badge">20%</span>
            </div>
            <div className="chem-values-row">
              <span className="chem-volume-large">{volDil} ml</span>
              <span className="chem-weight-sub">Peso: {weightDil} g</span>
            </div>
          </div>

          {/* 4. Aditivo Retardador */}
          <div className="chem-card card-ret">
            <div className="chem-card-header">
              <div className="chem-info">
                <h4>4º Aditivo Retardador</h4>
                <span>Antibranqueamento térmico</span>
              </div>
              <span className="chem-percent-badge">5%</span>
            </div>
            <div className="chem-values-row">
              <span className="chem-volume-large">{volRet} ml</span>
              <span className="chem-weight-sub">Peso: {weightRet} g</span>
            </div>
          </div>
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
