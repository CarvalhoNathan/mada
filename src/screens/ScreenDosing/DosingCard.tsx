import React from 'react';
import { AlertTriangle, Check, Layers } from 'lucide-react';
import { ComponenteItemParaDosagem } from './types';
import { BeakerVisualizer } from '../../components/ui/BeakerVisualizer';
import { CountNumber } from '../../components/ui/CountNumber';
import { excedeTolerancia } from '../../domain/tolerance';

interface DosingCardProps {
  comp: ComponenteItemParaDosagem;
  idx: number;
  val: number;
  onValueChange: (itemId: number, newValue: number) => void;
  onOpenKeypad: (itemId: number) => void;
}

export const DosingCard: React.FC<DosingCardProps> = ({
  comp,
  idx,
  val,
  onValueChange,
  onOpenKeypad,
}) => {
  const meta = comp.metaMl;
  const toleranceMax = Math.round(meta * 1.05);
  const isExceeded = excedeTolerancia(val, meta, 0.05);
  const isExactOrWithin = val >= meta && !isExceeded;
  const isUnder = val > 0 && val < meta;
  const diff = val - meta;
  const isCatalyst = comp.item.papel.toLowerCase().includes('catalisador');
  const { planoMultiLote } = comp;
  const aloc0 = planoMultiLote.alocacoes[0];
  const aloc1 = planoMultiLote.alocacoes[1];

  let cardStateClass = '';
  if (isExceeded) {
    cardStateClass = 'is-exceeded';
  } else if (isExactOrWithin) {
    cardStateClass = 'is-within';
  } else if (isUnder) {
    cardStateClass = 'is-under';
  }

  return (
    <article
      className={`dosing-card ${cardStateClass} ${isCatalyst ? 'is-catalyst' : ''}`}
    >
      {/* Cabeçalho do Card */}
      <div className="dosing-card-header">
        <div className="dosing-card-title-group">
          <span className="dosing-step-badge">{idx + 1}</span>
          <div>
            <h3 className="dosing-chem-name">{comp.item.produtoNome}</h3>
            <div className="dosing-chem-code">
              <span>Cód: {comp.item.codigoProduto}</span>
              <span>•</span>
              <span>Lote: {comp.loteAtivo ? comp.loteAtivo.codigo : 'LT-2024-03'}</span>
              {isCatalyst && (
                <span
                  style={{
                    marginLeft: '4px',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: 'rgba(245, 158, 11, 0.18)',
                    color: 'var(--warn)',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  Crítico (±5%)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="dosing-target-box">
          <span className="os-meta-badge os-meta-badge--neutral">
            Meta: {meta.toLocaleString('pt-BR')} ml
          </span>
          <div className="dosing-target-weight">~ {comp.pesoMetaG} g</div>
        </div>
      </div>

      {/* Guia de Complemento Multi-Lote FEFO */}
      {planoMultiLote.precisaComplementar && aloc0 && aloc1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            padding: '6px 10px',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.14)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            fontSize: '12px',
            fontWeight: 600,
            color: '#fcd34d',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={14} style={{ flexShrink: 0 }} />
            <span>
              Complemento FEFO: <strong>1º Esvaziar {aloc0.lote.codigo} ({aloc0.volumeAlocadoMl} ml)</strong> +{' '}
              <strong>2º Completar {aloc1.volumeAlocadoMl} ml de {aloc1.lote.codigo}</strong>
            </span>
          </span>
        </div>
      )}

      {/* Controles de Dosagem e Visor Central com Béquer Graduado */}
      <div className="dosing-controls-row">
        <BeakerVisualizer
          value={val}
          target={meta}
          toleranceMax={toleranceMax}
          isExceeded={isExceeded}
          isWithin={isExactOrWithin}
          isCatalyst={isCatalyst}
        />

        <button
          type="button"
          className="dosing-control-btn"
          onClick={() => onValueChange(comp.item.id, val - 10)}
          disabled={val <= 0}
          aria-label={`Diminuir 10 ml de ${comp.item.produtoNome}`}
        >
          −
        </button>

        <div
          className="dosing-value-display"
          onClick={() => onOpenKeypad(comp.item.id)}
          role="button"
          tabIndex={0}
          title="Toque para digitar o valor no teclado numérico"
        >
          <div className="dosing-val-num-row">
            <CountNumber value={val} className="dosing-val-num" />
            <span className="dosing-val-unit">ml</span>
          </div>
          <span className="dosing-val-sub">
            {val > 0
              ? `~ ${Math.round(val * comp.item.densidade)} g • Toque p/ digitar`
              : 'Toque para digitar'}
          </span>
        </div>

        <button
          type="button"
          className="dosing-control-btn"
          onClick={() => onValueChange(comp.item.id, val + 10)}
          aria-label={`Aumentar 10 ml de ${comp.item.produtoNome}`}
        >
          +
        </button>
      </div>

      {/* Atalhos Rápidos de Simulação para Operador */}
      <div className="dosing-shortcuts-row">
        {planoMultiLote.precisaComplementar && aloc0 ? (
          <button
            type="button"
            className="dosing-shortcut-chip"
            onClick={() => onValueChange(comp.item.id, aloc0.volumeAlocadoMl)}
            style={{
              borderColor: 'rgba(245, 158, 11, 0.45)',
              color: '#fbbf24',
            }}
            title={`Dosar todo o saldo da 1ª lata aberta (${aloc0.lote.codigo})`}
          >
            1ª Lata ({aloc0.volumeAlocadoMl} ml)
          </button>
        ) : (
          <button
            type="button"
            className="dosing-shortcut-chip"
            onClick={() => onValueChange(comp.item.id, val + 50)}
          >
            +50 ml
          </button>
        )}
        <button
          type="button"
          className="dosing-shortcut-chip chip-target"
          onClick={() => onValueChange(comp.item.id, meta)}
        >
          Meta Exata ({meta} ml)
        </button>
        <button
          type="button"
          className="dosing-shortcut-chip"
          onClick={() => onValueChange(comp.item.id, toleranceMax + 10)}
          title="Simular teste de excesso crítico (>5%)"
          style={{ color: '#f87171' }}
        >
          +5% Excesso
        </button>
        {val > 0 && (
          <button
            type="button"
            className="dosing-shortcut-chip"
            onClick={() => onValueChange(comp.item.id, 0)}
          >
            Zerar
          </button>
        )}
      </div>

      {/* Linha de Feedback de Estado / Tolerância */}
      <div
        className={`dosing-status-bar ${
          isExceeded
            ? 'status-exceeded'
            : isExactOrWithin
              ? 'status-within'
              : isUnder
                ? 'status-under'
                : 'status-default'
        }`}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          {isExceeded ? (
            <>
              <AlertTriangle size={14} strokeWidth={2.4} /> +{diff} ml acima do limite seguro (+5%)
            </>
          ) : isExactOrWithin ? (
            <>
              <Check size={14} strokeWidth={2.6} />{' '}
              {val === meta ? 'Meta exata atingida' : `Dentro da tolerância (+${diff} ml)`}
            </>
          ) : isUnder ? (
            planoMultiLote.precisaComplementar && aloc0 && val === aloc0.volumeAlocadoMl ? (
              `1ª lata (${aloc0.lote.codigo}) esvaziada • complete +${meta - val} ml da 2ª lata`
            ) : (
              `Em dosagem no béquer (faltam ${meta - val} ml)`
            )
          ) : (
            'Aguardando dosagem no béquer...'
          )}
        </span>
        <span>Tolerância máx: {toleranceMax} ml</span>
      </div>
    </article>
  );
};
