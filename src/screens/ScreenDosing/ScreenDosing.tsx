import React, { useState, useEffect } from 'react';
import { RotateCcw, Check } from 'lucide-react';
import { ScreenDosingProps, ComponenteItemParaDosagem } from './types';
import { DosingCard } from './DosingCard';
import { DosingKeypadModal } from './DosingKeypadModal';
import { CountNumber } from '../../components/ui/CountNumber';
import { ModalCriticalExcess } from '../../components/modals';
import { calcularFracoesMistura } from '../../domain/mixture';
import { excedeTolerancia, calcularCustoExcesso } from '../../domain/tolerance';
import { ordenarLotesFEFO, alocarConsumoMultiLoteFEFO } from '../../domain/fefo';
import {
  MOCK_RECEITAS,
  MOCK_MARCAS,
  MOCK_PRODUTOS,
  MOCK_LOTES,
  MOCK_ORDENS_SERVICO,
} from '../../data';

export const ScreenDosing: React.FC<ScreenDosingProps> = ({
  recipe,
  activeRecipe,
  operator,
  activeOS,
  lotes,
  onNavigate,
  onCompleteDosing,
  onSetTotalVolume,
  onOpenCancelPrep,
  showToast,
}) => {
  const vol = recipe.totalVolume;
  const os = activeOS || MOCK_ORDENS_SERVICO[0];
  const receita = activeRecipe || MOCK_RECEITAS[0];
  const marca = MOCK_MARCAS.find((m) => m.id === receita.marcaId) || { nome: receita.marcaNome };
  const lotesEstoque = lotes && lotes.length > 0 ? lotes : MOCK_LOTES;

  // Cálculo das frações meta (em ml e g)
  const itensParaCalculo = receita.itens.map((item) => ({
    papel: item.papel,
    produtoNome: item.produtoNome,
    codigoProduto: item.codigoProduto,
    proporcao: item.proporcao,
    densidade: item.densidade,
  }));

  const fracoes = calcularFracoesMistura(itensParaCalculo, vol);

  // Mapeamento dos itens com metas, produtos e plano multi-lote FEFO
  const componentes: ComponenteItemParaDosagem[] = receita.itens.map((item, idx) => {
    const fracao = fracoes[idx];
    const produto = MOCK_PRODUTOS.find((p) => p.id === item.produtoId) || {
      id: item.produtoId,
      preco: 100,
      unidade: 'ml',
    };
    const lotesFiltrados = lotesEstoque.filter(
      (l) => l.produtoId === item.produtoId && l.quantidadeAtual > 0
    );
    const lotesDoProduto = ordenarLotesFEFO(lotesFiltrados);
    const loteAtivo = lotesDoProduto[0];
    const planoMultiLote = alocarConsumoMultiLoteFEFO(lotesFiltrados, fracao.volumeMl);

    return {
      item,
      metaMl: fracao.volumeMl,
      pesoMetaG: fracao.pesoGramas,
      produto,
      loteAtivo,
      planoMultiLote,
    };
  });

  // Estado dos valores dosados por item (com recuperação automática de rascunho)
  const [restoredFromDraft] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('mada_active_dosing_draft');
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return Boolean(
        parsed &&
          parsed.osNumero === os.numero &&
          parsed.receitaId === receita.id &&
          parsed.values &&
          Object.values(parsed.values).some((v) => Number(v) > 0)
      );
    } catch {
      return false;
    }
  });

  const [dosingValues, setDosingValues] = useState<Record<number, number>>(() => {
    const empty = receita.itens.reduce((acc, it) => ({ ...acc, [it.id]: 0 }), {});
    try {
      const raw = localStorage.getItem('mada_active_dosing_draft');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          parsed.osNumero === os.numero &&
          parsed.receitaId === receita.id &&
          parsed.values
        ) {
          return { ...empty, ...parsed.values };
        }
      }
    } catch {
      // Ignora erro de parse
    }
    return empty;
  });

  useEffect(() => {
    try {
      const hasAny = Object.values(dosingValues).some((v) => v > 0);
      if (hasAny) {
        localStorage.setItem(
          'mada_active_dosing_draft',
          JSON.stringify({
            osNumero: os.numero,
            receitaId: receita.id,
            volumeTotal: vol,
            values: dosingValues,
            updatedAt: new Date().toISOString(),
          })
        );
      } else {
        localStorage.removeItem('mada_active_dosing_draft');
      }
    } catch {
      // Ignora erro de quota
    }
  }, [dosingValues, os.numero, receita.id, vol]);

  // Controle do teclado numérico tátil
  const [keypadItemId, setKeypadItemId] = useState<number | null>(null);
  const [keypadBuffer, setKeypadBuffer] = useState<string>('');

  // Controle do Modal de Excesso Crítico
  const [criticalItem, setCriticalItem] = useState<{
    item: ComponenteItemParaDosagem;
    valReal: number;
    diff: number;
    cost: number;
  } | null>(null);

  // Estado de confirmação no próprio botão (Stageshow States + Check)
  const [submitState, setSubmitState] = useState<'idle' | 'saving' | 'done'>('idle');

  // Verificações de conclusão
  const allDosed = componentes.every((c) => (dosingValues[c.item.id] || 0) > 0);
  const hasAnyValue = componentes.some((c) => (dosingValues[c.item.id] || 0) > 0);
  const totalDosed = componentes.reduce((sum, c) => sum + (dosingValues[c.item.id] || 0), 0);

  const handleValueChange = (itemId: number, newValue: number) => {
    setDosingValues((prev) => ({ ...prev, [itemId]: Math.max(0, newValue) }));
  };

  const handleOpenKeypad = (itemId: number) => {
    setKeypadItemId(itemId);
    const curr = dosingValues[itemId];
    setKeypadBuffer(curr > 0 ? String(curr) : '');
  };

  const handleKeypadDigit = (digit: string) => {
    if (keypadBuffer.length < 5) {
      setKeypadBuffer((prev) => (prev === '0' ? digit : prev + digit));
    }
  };

  const handleKeypadBackspace = () => {
    setKeypadBuffer((prev) => prev.slice(0, -1));
  };

  const handleKeypadClear = () => {
    setKeypadBuffer('');
  };

  const handleKeypadConfirm = () => {
    if (keypadItemId !== null) {
      const parsed = parseInt(keypadBuffer, 10) || 0;
      handleValueChange(keypadItemId, parsed);
      setKeypadItemId(null);
      setKeypadBuffer('');
    }
  };

  const handleAttemptFinish = () => {
    if (!allDosed) {
      showToast('Preencha a dosagem de todos os 4 componentes antes de concluir.', 'warn');
      return;
    }

    // Verificar se algum componente excedeu a tolerância de 5%
    const itemComExcesso = componentes.find((c) => {
      const val = dosingValues[c.item.id] || 0;
      return excedeTolerancia(val, c.metaMl, 0.05);
    });

    if (itemComExcesso) {
      const valReal = dosingValues[itemComExcesso.item.id] || 0;
      const diff = valReal - itemComExcesso.metaMl;
      const cost = calcularCustoExcesso(diff, itemComExcesso.produto.preco || 0);

      setCriticalItem({
        item: itemComExcesso,
        valReal,
        diff,
        cost,
      });
      return;
    }

    if (submitState !== 'idle') return;
    setSubmitState('saving');
    window.setTimeout(() => {
      setSubmitState('done');
      window.setTimeout(() => {
        localStorage.removeItem('mada_active_dosing_draft');
        onCompleteDosing(dosingValues);
      }, 360);
    }, 220);
  };

  const handleRepesarDoZero = () => {
    if (criticalItem) {
      setDosingValues((prev) => ({ ...prev, [criticalItem.item.item.id]: 0 }));
      showToast(`Valor de ${criticalItem.item.item.produtoNome} zerado para redosagem.`, 'info');
      setCriticalItem(null);
    }
  };

  const handleRecalcularProporcoes = () => {
    if (!criticalItem) return;
    const proporcaoItem = criticalItem.item.item.proporcao;
    if (proporcaoItem <= 0) return;

    const novoVolumeTotal = Math.min(5000, Math.round(criticalItem.valReal / proporcaoItem));
    if (onSetTotalVolume) {
      onSetTotalVolume(novoVolumeTotal);
    }

    setCriticalItem(null);
    showToast(
      `✓ Mistura recalculada para ${novoVolumeTotal.toLocaleString('pt-BR')} ml! Complete os demais itens na nova meta.`,
      'success'
    );
  };

  const handleConfirmDesperdicio = (reason: string) => {
    setCriticalItem(null);
    localStorage.removeItem('mada_active_dosing_draft');
    onCompleteDosing(dosingValues, reason);
  };

  const handleBack = () => {
    if (hasAnyValue) {
      if (
        window.confirm(
          'Existem pesagens registradas nesta tela. Deseja realmente voltar à receita?'
        )
      ) {
        onNavigate('recipe');
      }
    } else {
      onNavigate('recipe');
    }
  };

  const activeKeypadComp = componentes.find((c) => c.item.id === keypadItemId);

  return (
    <>
      <main
        className="screen-content-area"
        style={{
          padding: '0 24px 96px 24px',
          boxSizing: 'border-box',
          minHeight: '100%',
          height: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* Cabeçalho Operacional Limpo */}
        <header className="recipe-header-card" style={{ marginBottom: '2px' }}>
          <div className="recipe-title-group">
            <h2 className="recipe-main-title">
              Dosagem de Componentes — {receita.nome}
            </h2>
            <p className="recipe-sub-title">
              {os.numero.startsWith('OS') ? os.numero : `OS #${os.numero}`} ({os.clienteNome}) •{' '}
              {marca.nome} • Operador: {operator.nome}
            </p>
          </div>

          <div className="dosing-header-right">
            {restoredFromDraft && hasAnyValue && (
              <span
                className="os-meta-badge os-meta-badge--amber"
                title="Valores de pesagem restaurados automaticamente após atualização da tela"
              >
                <RotateCcw size={12} style={{ marginRight: '4px' }} />
                Rascunho recuperado
              </span>
            )}
            <span className="os-meta-badge os-meta-badge--neutral">
              Meta:{' '}
              <CountNumber value={vol} format={(n) => `${Math.round(n).toLocaleString('pt-BR')} ml`} />
            </span>

            <span
              className={`os-meta-badge ${
                totalDosed >= vol ? 'os-meta-badge--primary' : 'os-meta-badge--neutral'
              }`}
            >
              Dosado:{' '}
              <strong>
                <CountNumber
                  value={totalDosed}
                  format={(n) => `${Math.round(n).toLocaleString('pt-BR')} ml`}
                />
              </strong>{' '}
              (
              <CountNumber
                value={Math.min(100, Math.round((totalDosed / vol) * 100))}
                format={(n) => `${Math.round(n)}%`}
              />
              )
            </span>
          </div>
        </header>

        {/* Grade 2x2 com os 4 Componentes Químicos */}
        <section className="dosing-grid" aria-label="Componentes da mistura">
          {componentes.map((comp, idx) => (
            <DosingCard
              key={comp.item.id}
              comp={comp}
              idx={idx}
              val={dosingValues[comp.item.id] || 0}
              onValueChange={handleValueChange}
              onOpenKeypad={handleOpenKeypad}
            />
          ))}
        </section>
      </main>

      {/* Modal de Teclado Numérico Direto */}
      <DosingKeypadModal
        isOpen={keypadItemId !== null}
        productName={activeKeypadComp?.item.produtoNome || ''}
        buffer={keypadBuffer}
        onDigit={handleKeypadDigit}
        onBackspace={handleKeypadBackspace}
        onClear={handleKeypadClear}
        onConfirm={handleKeypadConfirm}
        onClose={() => setKeypadItemId(null)}
      />

      {/* Modal Crítico de Excesso (Intertravamento de Segurança) */}
      {criticalItem && (
        <ModalCriticalExcess
          isOpen={true}
          onClose={() => setCriticalItem(null)}
          onRepesarDoZero={handleRepesarDoZero}
          onRecalcularReceita={handleRecalcularProporcoes}
          onConfirmDesperdicio={handleConfirmDesperdicio}
          componentName={criticalItem.item.item.produtoNome}
          targetVolume={criticalItem.item.metaMl}
          actualVolume={criticalItem.valReal}
          excessCost={criticalItem.cost}
        />
      )}

      {/* Barra Inferior Padronizada */}
      <footer className="os-bottom-bar-minimal">
        <div className="os-bottom-left">
          <button
            type="button"
            className="os-bar-btn os-btn-back"
            onClick={handleBack}
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
            className={`os-bar-btn os-btn-continue ${submitState === 'done' ? 'is-success' : ''}`}
            onClick={handleAttemptFinish}
            disabled={!allDosed || submitState !== 'idle'}
            style={{
              minWidth: '310px',
              transition: 'background-color 0.2s ease, transform 0.15s ease',
            }}
          >
            {submitState === 'saving' ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                ● Gravando baixa FEFO...
              </span>
            ) : submitState === 'done' ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Check size={20} strokeWidth={3} /> Baixa registrada na OS!
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                Concluir dosagem e dar baixa →
              </span>
            )}
          </button>
        </div>
      </footer>
    </>
  );
};
