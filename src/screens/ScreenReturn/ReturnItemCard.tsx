import React from 'react';
import { AlertTriangle, Check, FileWarning, PackageCheck } from 'lucide-react';
import { ItemDevolucaoComponente, Preparacao, Produto, CriterioChecklistProduto } from '../../types';
import { BeakerVisualizer } from '../../components/ui/BeakerVisualizer';
import { CountNumber } from '../../components/ui/CountNumber';
import { ResultadoAvaliacaoChecklist } from '../../domain/returnFlow';

interface ReturnItemCardProps {
  preparacaoAtual: Preparacao;
  itemAtual: ItemDevolucaoComponente;
  produtoAtual: Produto;
  criteriosProduto: CriterioChecklistProduto[];
  returnVolume: number;
  maxVolume: number;
  pesoEstimadoGramas: number;
  checklist: Record<string, boolean>;
  allChecked: boolean;
  isZeroVolume: boolean;
  itemJaResolvido: boolean;
  avaliacaoChecklist: ResultadoAvaliacaoChecklist;
  onAdjustVolume: (delta: number) => void;
  onSetExactVolume: (val: number) => void;
  onOpenKeypad: () => void;
  onToggleChecklistItem: (id: string) => void;
}

export const ReturnItemCard: React.FC<ReturnItemCardProps> = ({
  preparacaoAtual,
  itemAtual,
  produtoAtual,
  criteriosProduto,
  returnVolume,
  maxVolume,
  pesoEstimadoGramas,
  checklist,
  allChecked,
  isZeroVolume,
  itemJaResolvido,
  avaliacaoChecklist,
  onAdjustVolume,
  onSetExactVolume,
  onOpenKeypad,
  onToggleChecklistItem,
}) => {
  const componentIndex =
    preparacaoAtual.itensDevolucao.findIndex((i) => i.id === itemAtual.id) + 1;

  return (
    <article
      className={`dosing-card ${
        itemAtual.status === 'DESCARTADO_COMO_REFUGO'
          ? 'is-exceeded'
          : allChecked || isZeroVolume
          ? 'is-within'
          : 'is-under'
      } ${itemAtual.papel.toLowerCase().includes('catalisador') ? 'is-catalyst' : ''}`}
      style={{ justifyContent: 'flex-start', gap: '10px' }}
    >
      {/* 1. Cabeçalho Idêntico ao Card de Dosagem */}
      <div className="dosing-card-header">
        <div className="dosing-card-title-group">
          <span className="dosing-step-badge">{componentIndex}</span>
          <div>
            <h3 className="dosing-chem-name">{itemAtual.produtoNome}</h3>
            <div className="dosing-chem-code">
              <span>Cód: {itemAtual.codigoProduto}</span>
              <span>•</span>
              <span>Lote: {itemAtual.loteCodigo}</span>
              <span>•</span>
              <span>Emb: {itemAtual.embalagemId || itemAtual.loteCodigo}</span>
            </div>
          </div>
        </div>

        <div className="dosing-target-box">
          <span className="os-meta-badge os-meta-badge--neutral">
            Retirado: {itemAtual.quantidadeRetiradaMl.toLocaleString('pt-BR')} ml
          </span>
          <div className="dosing-target-weight">
            Saldo inicial: {maxVolume.toLocaleString('pt-BR')} ml
          </div>
        </div>
      </div>

      {/* Alerta quando o produto não possui configuração técnica homologada */}
      {avaliacaoChecklist.requerHomologacaoTecnica && !isZeroVolume && (
        <div
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.14)',
            border: '1px solid rgba(245, 158, 11, 0.45)',
            color: '#FBBF24',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FileWarning size={15} />
          <span>
            Parâmetros específicos pendentes de homologação pelo responsável técnico. Usando checklist padrão.
          </span>
        </div>
      )}

      {/* 2. Linha Central de Controles (BeakerVisualizer + Botões Quadrados + Visor Central Tátil) */}
      <div className="dosing-controls-row">
        <BeakerVisualizer
          value={returnVolume}
          target={maxVolume}
          toleranceMax={maxVolume}
          isExceeded={itemAtual.status === 'DESCARTADO_COMO_REFUGO'}
          isWithin={allChecked || isZeroVolume}
          isCatalyst={itemAtual.papel.toLowerCase().includes('catalisador')}
          markerLabel="LATA"
          unitLabel={isZeroVolume ? 'Esgotada' : allChecked ? 'Aprovada' : 'Sobra'}
        />

        <button
          type="button"
          className="dosing-control-btn"
          onClick={() => onAdjustVolume(-50)}
          disabled={itemJaResolvido || returnVolume <= 0}
          aria-label="Diminuir 50 ml"
        >
          −
        </button>

        <div
          className="dosing-value-display"
          onClick={onOpenKeypad}
          role="button"
          tabIndex={0}
          title="Toque para digitar o saldo restante no teclado numérico"
        >
          <div className="dosing-val-num-row">
            <CountNumber value={returnVolume} className="dosing-val-num" />
            <span className="dosing-val-unit">ml</span>
          </div>
          <span className="dosing-val-sub">
            {returnVolume > 0
              ? `~ ${pesoEstimadoGramas} g restantes • Toque p/ digitar`
              : '0 ml (Sem sobra) • Toque p/ digitar'}
          </span>
        </div>

        <button
          type="button"
          className="dosing-control-btn"
          onClick={() => onAdjustVolume(50)}
          disabled={itemJaResolvido || returnVolume >= maxVolume}
          aria-label="Aumentar 50 ml"
        >
          +
        </button>
      </div>

      {/* 3. Atalhos Rápidos */}
      {!itemJaResolvido && (
        <div className="dosing-shortcuts-row">
          <button
            type="button"
            className="dosing-shortcut-chip"
            onClick={() => onAdjustVolume(50)}
          >
            +50 ml
          </button>
          <button
            type="button"
            className="dosing-shortcut-chip chip-target"
            onClick={() => onSetExactVolume(itemAtual.saldoRestanteInformadoMl)}
          >
            Saldo Sugerido ({itemAtual.saldoRestanteInformadoMl} ml)
          </button>
          <button
            type="button"
            className="dosing-shortcut-chip"
            onClick={() => onSetExactVolume(0)}
            style={
              isZeroVolume
                ? {
                    borderColor: 'var(--ok)',
                    color: '#4ade80',
                    background: 'rgba(16, 185, 129, 0.14)',
                  }
                : undefined
            }
          >
            Lata Esgotou / Sem Sobra (0 ml)
          </button>
        </div>
      )}

      {/* 4. Barra de Status Inferior */}
      <div
        className={`dosing-status-bar ${
          itemAtual.status === 'DESCARTADO_COMO_REFUGO'
            ? 'status-exceeded'
            : allChecked || isZeroVolume
            ? 'status-within'
            : 'status-under'
        }`}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          {isZeroVolume ? (
            <>
              <Check size={14} strokeWidth={2.6} /> Embalagem esgotada (0 ml) — pronta para baixa direta
            </>
          ) : allChecked ? (
            <>
              <Check size={14} strokeWidth={2.6} /> Checklist aprovado ({criteriosProduto.length}/{criteriosProduto.length}) — liberado p/ estoque
            </>
          ) : (
            <>
              <AlertTriangle size={14} strokeWidth={2.4} /> Checklist pendente ({criteriosProduto.length - avaliacaoChecklist.criteriosPendentes.length}/{criteriosProduto.length})
            </>
          )}
        </span>
        <span>Capacidade máx: {maxVolume} ml</span>
      </div>

      {/* 5. Quando o saldo é 0 ml (sem sobra) vs Checklist com sobra */}
      {isZeroVolume ? (
        <div
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.10)',
            border: '1px solid rgba(16, 185, 129, 0.40)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4ADE80', fontWeight: 800, fontSize: '15px' }}>
            <PackageCheck size={18} strokeWidth={2.4} />
            <span>Embalagem Esgotada • Nenhuma sobra física (0 ml)</span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Todo o volume desta embalagem ({itemAtual.quantidadeRetiradaMl} ml) foi consumido na preparação. Não há sobra para retornar à prateleira nem necessidade de preencher o checklist.
          </p>
        </div>
      ) : (
        <div className="checklist-container" style={{ marginTop: '2px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="checklist-title">
              Checklist Homologado ({produtoAtual.papelPadrao.toUpperCase()}):
            </span>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: allChecked ? 'var(--ok)' : 'var(--warn)',
              }}
            >
              {allChecked
                ? '✓ Aprovado p/ estoque'
                : `Pendente (${criteriosProduto.length - avaliacaoChecklist.criteriosPendentes.length}/${criteriosProduto.length})`}
            </span>
          </div>

          {criteriosProduto.map((item) => (
            <div
              key={item.id}
              className={`checklist-row-card ${checklist[item.id] ? 'checked' : ''}`}
              onClick={() => onToggleChecklistItem(item.id)}
              style={{ minHeight: '48px', padding: '6px 12px' }}
            >
              <div className="checklist-checkbox-box" style={{ width: '28px', height: '28px', fontSize: '15px' }}>
                ✓
              </div>
              <span className="checklist-label" style={{ fontSize: '14px' }}>
                {item.label}
              </span>
            </div>
          ))}

          {!allChecked && avaliacaoChecklist.motivoReprovacao && (
            <div
              style={{
                marginTop: '2px',
                padding: '7px 12px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#FCA5A5',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              ⚠️ Bloqueio de estoque: {avaliacaoChecklist.motivoReprovacao}
            </div>
          )}
        </div>
      )}
    </article>
  );
};
