import React, { useState } from 'react';
import { FlaskConical, Check, AlertTriangle, Lock } from 'lucide-react';
import { RecipeState, Receita, Lote } from '../types';
import { CountNumber } from '../components/ui/CountNumber';
import { SegmentedControl } from '../components/ui/SegmentedControl';
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
  lotes?: Lote[];
  onSelectRecipe?: (receita: Receita) => void;
  onSetTotalVolume: (vol: number) => void;
  onAdjustVolume: (delta: number) => void;
  onConfirmWeighing: () => void;
  onNavigate: (screen: 'os' | 'dashboard' | 'dosing') => void;
  onOpenCancelPrep?: () => void;
}

const PRESET_VOLUMES = [500, 1000, 1500, 2000];

export const ScreenRecipe: React.FC<ScreenRecipeProps> = ({
  recipe,
  activeRecipe,
  lotes,
  onSelectRecipe,
  onSetTotalVolume,
  onAdjustVolume,
  onConfirmWeighing,
  onNavigate,
}) => {
  const [isRecipeConfirmed, setIsRecipeConfirmed] = useState(false);

  const vol = recipe.totalVolume;
  const lotesEstoque = lotes && lotes.length > 0 ? lotes : MOCK_LOTES;

  // Receita ativa selecionada ou padrão (continua exibindo a prévia dos dados abaixo)
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

  const handleSelectAndConfirmRecipe = (newId: number) => {
    const found = MOCK_RECEITAS.find((r) => r.id === newId);
    if (found && onSelectRecipe) {
      onSelectRecipe(found);
    }
    setIsRecipeConfirmed(true);
  };

  return (
    <div className="recipe-screen-container">
      {/* 1. Seletor Obrigatório de Receita Homologada com Trava de Confirmação */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: '12px',
          padding: '12px 14px',
          borderRadius: '16px',
          border: isRecipeConfirmed
            ? '1.5px solid var(--ok-border)'
            : '1.5px solid rgba(245, 158, 11, 0.48)',
          background: isRecipeConfirmed
            ? 'rgba(16, 185, 129, 0.05)'
            : 'rgba(245, 158, 11, 0.08)',
          transition: 'all 0.22s ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isRecipeConfirmed ? (
              <Check size={16} strokeWidth={2.8} color="var(--ok)" />
            ) : (
              <Lock size={16} strokeWidth={2.4} color="var(--warn)" />
            )}
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: isRecipeConfirmed ? 'var(--ok)' : 'var(--warn)',
                letterSpacing: '0.01em',
              }}
            >
              {isRecipeConfirmed
                ? `Receita confirmada: ${receita.nome} — ajuste de volume e dosagem liberados`
                : 'Passo obrigatório: escolha abaixo com qual produto/receita você vai preparar esta mistura'}
            </span>
          </div>
          {!isRecipeConfirmed && (
            <span className="os-meta-badge os-meta-badge--amber">
              Toque em uma opção para destravar
            </span>
          )}
        </div>

        <SegmentedControl
          ariaLabel="Selecionar acabamento homologado"
          value={isRecipeConfirmed ? receita.id : -1}
          onChange={handleSelectAndConfirmRecipe}
          options={MOCK_RECEITAS.map((r) => ({
            id: r.id,
            label: r.nome,
            icon:
              isRecipeConfirmed && r.id === receita.id ? (
                <Check size={15} strokeWidth={2.6} />
              ) : (
                <FlaskConical size={15} strokeWidth={2.2} />
              ),
            tone: 'primary',
          }))}
          style={{ width: '100%' }}
        />
      </div>

      {/* Dados da receita permanecem visíveis abaixo, com trava tátil até a escolha da receita */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          flex: 1,
          minHeight: 0,
          opacity: isRecipeConfirmed ? 1 : 0.62,
          filter: isRecipeConfirmed ? 'none' : 'saturate(0.75)',
          transition: 'opacity 0.22s ease, filter 0.22s ease',
        }}
      >
        {/* 2. Cabeçalho da Receita (Apple / Notion) */}
        <div className="recipe-header-card">
          <div className="recipe-title-group">
            <h2 className="recipe-main-title">
              {receita.nome}{' '}
              {!isRecipeConfirmed && (
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--warn)',
                    marginLeft: '8px',
                  }}
                >
                  (Pré-visualização — confirme a receita acima)
                </span>
              )}
            </h2>
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
            <span className="recipe-volume-hint">
              {isRecipeConfirmed
                ? 'Ajuste o volume antes de pesar'
                : 'Selecione a receita acima para ajustar o volume'}
            </span>
          </div>

          <div className="recipe-stepper-row">
            <button
              type="button"
              className="recipe-stepper-btn"
              onClick={() => onAdjustVolume(-100)}
              disabled={!isRecipeConfirmed}
              aria-label="Diminuir 100 ml"
              style={!isRecipeConfirmed ? { cursor: 'not-allowed', opacity: 0.5 } : undefined}
            >
              −
            </button>

            <div className="recipe-volume-display">
              <CountNumber value={vol} className="recipe-volume-num" />
              <span className="recipe-volume-unit">ml</span>
            </div>

            <button
              type="button"
              className="recipe-stepper-btn"
              onClick={() => onAdjustVolume(100)}
              disabled={!isRecipeConfirmed}
              aria-label="Aumentar 100 ml"
              style={!isRecipeConfirmed ? { cursor: 'not-allowed', opacity: 0.5 } : undefined}
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
                  disabled={!isRecipeConfirmed}
                  className={`recipe-preset-chip ${isActive ? 'is-active' : ''}`}
                  onClick={() => onSetTotalVolume(preset)}
                  style={!isRecipeConfirmed ? { cursor: 'not-allowed' } : undefined}
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
              lotesEstoque.filter((l) => l.produtoId === item.produtoId && l.quantidadeAtual > 0)
            );
            const loteAtivo = lotesDoProduto[0];
            const saldoInsuficiente = Boolean(
              loteAtivo && loteAtivo.quantidadeAtual < fracao.volumeMl
            );
            const isUrgente =
              loteAtivo &&
              ((loteAtivo.diasAberto ?? 0) > 0 ||
                loteAtivo.statusUrgencia === 'alta' ||
                saldoInsuficiente);
            const percentStr = `${Math.round(item.proporcao * 100)}%`;

            const isCatalyst = item.papel === 'catalisador';
            const cardVariantClass = isCatalyst ? 'is-catalyst' : '';
            const cleanedName = item.produtoNome.replace(/^[0-9]+[º°]?\s*/, '');
            const cleanLoteCode = loteAtivo ? loteAtivo.codigo.replace(/^#+/, '') : 'SY-5120';
            const roleLabel =
              item.papel.charAt(0).toUpperCase() + item.papel.slice(1).toLowerCase();

            return (
              <div key={item.id} className={`recipe-chem-card ${cardVariantClass}`}>
                <div className="recipe-chem-top">
                  <div className="recipe-chem-role-row">
                    <span className="recipe-chem-role">
                      {idx + 1}º • {roleLabel}
                    </span>
                    <span
                      className={`os-meta-badge ${isCatalyst ? 'os-meta-badge--amber' : 'os-meta-badge--neutral'}`}
                    >
                      {percentStr}
                    </span>
                  </div>
                  <h4 className="recipe-chem-name">{cleanedName}</h4>
                  <span className="recipe-chem-code">Cód: {item.codigoProduto}</span>
                </div>

                {/* Status de Lote / FEFO Ao Vivo */}
                <div className="recipe-chem-fefo-box">
                  {saldoInsuficiente && loteAtivo ? (
                    <div
                      className="recipe-fefo-urgent"
                      title="O volume solicitado na receita é maior que o saldo desta lata aberta"
                    >
                      <span
                        className="recipe-fefo-icon"
                        aria-hidden="true"
                        style={{ display: 'inline-flex', alignItems: 'center' }}
                      >
                        <AlertTriangle size={14} strokeWidth={2.4} />
                      </span>
                      <span className="recipe-fefo-text">
                        #{cleanLoteCode} tem {loteAtivo.quantidadeAtual} ml • complementar lote
                      </span>
                    </div>
                  ) : isUrgente && loteAtivo ? (
                    <div className="recipe-fefo-urgent">
                      <span
                        className="recipe-fefo-icon"
                        aria-hidden="true"
                        style={{ display: 'inline-flex', alignItems: 'center' }}
                      >
                        <AlertTriangle size={14} strokeWidth={2.4} />
                      </span>
                      <span className="recipe-fefo-text">
                        Lata aberta #{cleanLoteCode} ({loteAtivo.quantidadeAtual} ml) •{' '}
                        {loteAtivo.prateleira || 'B-01'}
                      </span>
                    </div>
                  ) : (
                    <div className="recipe-fefo-normal">
                      <span
                        className="recipe-fefo-icon"
                        aria-hidden="true"
                        style={{ display: 'inline-flex', alignItems: 'center' }}
                      >
                        <Check size={14} strokeWidth={2.6} />
                      </span>
                      <span className="recipe-fefo-text">
                        Lote #{cleanLoteCode} (
                        {loteAtivo ? `${loteAtivo.quantidadeAtual} ml` : 'Estoque'})
                      </span>
                    </div>
                  )}
                </div>

                {/* Valores de Dosagem com Rolagem Numérica (Stageshow Count) */}
                <div className="recipe-chem-bottom">
                  <span className={`recipe-chem-vol ${isCatalyst ? 'vol-warn' : ''}`}>
                    <CountNumber value={fracao.volumeMl} format={(n) => `${Math.round(n)} ml`} />
                  </span>
                  <span className="recipe-chem-weight">
                    Peso:{' '}
                    <CountNumber value={fracao.pesoGramas} format={(n) => `${Math.round(n)} g`} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Barra Inferior Padronizada (Cancelar preparação aparece apenas na Dosagem em Béquer) */}
      <footer className="os-bottom-bar-minimal">
        <div className="os-bottom-left">
          <button
            type="button"
            className="os-bar-btn os-btn-back"
            onClick={() => onNavigate('os')}
          >
            ← Voltar
          </button>
        </div>

        <div className="os-bottom-right">
          <button
            type="button"
            className="os-bar-btn os-btn-continue"
            onClick={onConfirmWeighing}
            disabled={!isRecipeConfirmed}
            title={
              isRecipeConfirmed
                ? 'Iniciar dosagem no béquer'
                : 'Selecione primeiro a receita no topo da tela'
            }
          >
            {isRecipeConfirmed ? (
              <>
                <span>Iniciar dosagem no béquer</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            ) : (
              <>
                <Lock size={18} strokeWidth={2.4} />
                <span>Escolha a receita acima para liberar dosagem</span>
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};
