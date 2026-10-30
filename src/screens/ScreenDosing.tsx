import React, { useState } from 'react';
import { RecipeState, Operator, OrdemServico, Receita } from '../types';
import { Button } from '../components/ui/Button';
import { NumericKeypad } from '../components/ui/NumericKeypad';
import { ModalCriticalExcess } from './ModalCriticalExcess';
import { calcularFracoesMistura } from '../domain/mixture';
import { excedeTolerancia, calcularCustoExcesso } from '../domain/tolerance';
import { ordenarLotesFEFO } from '../domain/fefo';
import {
  MOCK_RECEITAS,
  MOCK_MARCAS,
  MOCK_PRODUTOS,
  MOCK_LOTES,
  MOCK_ORDENS_SERVICO,
} from '../data';

interface ScreenDosingProps {
  recipe: RecipeState;
  activeRecipe?: Receita;
  operator: Operator;
  activeOS?: OrdemServico;
  onNavigate: (screen: 'recipe' | 'return' | 'dashboard') => void;
  onCompleteDosing: (
    dosingValues: Record<number, number>,
    wasteJustification?: string
  ) => void;
  onOpenCancelPrep: () => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'warn' | 'danger') => void;
}

export const ScreenDosing: React.FC<ScreenDosingProps> = ({
  recipe,
  activeRecipe,
  operator,
  activeOS,
  onNavigate,
  onCompleteDosing,
  onOpenCancelPrep,
  showToast,
}) => {
  const vol = recipe.totalVolume;
  const os = activeOS || MOCK_ORDENS_SERVICO[0];
  const receita = activeRecipe || MOCK_RECEITAS[0];
  const marca = MOCK_MARCAS.find((m) => m.id === receita.marcaId) || { nome: receita.marcaNome };

  // Cálculo das frações meta (em ml e g)
  const itensParaCalculo = receita.itens.map((item) => ({
    papel: item.papel,
    produtoNome: item.produtoNome,
    codigoProduto: item.codigoProduto,
    proporcao: item.proporcao,
    densidade: item.densidade,
  }));

  const fracoes = calcularFracoesMistura(itensParaCalculo, vol);

  // Mapeamento dos itens com metas e produtos
  const componentes = receita.itens.map((item, idx) => {
    const fracao = fracoes[idx];
    const produto = MOCK_PRODUTOS.find((p) => p.id === item.produtoId) || {
      id: item.produtoId,
      preco: 100,
      unidade: 'ml',
    };
    const lotesDoProduto = ordenarLotesFEFO(
      MOCK_LOTES.filter((l) => l.produtoId === item.produtoId)
    );
    const loteAtivo = lotesDoProduto[0];

    return {
      item,
      metaMl: fracao.volumeMl,
      pesoMetaG: fracao.pesoGramas,
      produto,
      loteAtivo,
    };
  });

  // Estado dos valores dosados por item (inicial: 0)
  const [dosingValues, setDosingValues] = useState<Record<number, number>>(() =>
    receita.itens.reduce((acc, it) => ({ ...acc, [it.id]: 0 }), {})
  );

  // Controle do teclado numérico tátil
  const [keypadItemId, setKeypadItemId] = useState<number | null>(null);
  const [keypadBuffer, setKeypadBuffer] = useState<string>('');

  // Controle do Modal de Excesso Crítico
  const [criticalItem, setCriticalItem] = useState<{
    item: (typeof componentes)[0];
    valReal: number;
    diff: number;
    cost: number;
  } | null>(null);

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

    // Nenhum excesso detectado: prosseguir com baixa
    onCompleteDosing(dosingValues);
  };

  const handleRepesarDoZero = () => {
    if (criticalItem) {
      setDosingValues((prev) => ({ ...prev, [criticalItem.item.item.id]: 0 }));
      showToast(`Valor de ${criticalItem.item.item.produtoNome} zerado para redosagem.`, 'info');
      setCriticalItem(null);
    }
  };

  const handleConfirmDesperdicio = (reason: string) => {
    setCriticalItem(null);
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

  return (
    <>
      <main
        className="screen-content-area"
        style={{
          padding: '12px 24px 74px 24px',
          boxSizing: 'border-box',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          overflow: 'hidden',
        }}
      >
        {/* 1. Stepper Unificado Compacto (44px) */}
        <nav className="dosing-step-bar" aria-label="Progresso da preparação">
          <div
            className="dosing-step-pill completed"
            onClick={handleBack}
            role="button"
            tabIndex={0}
            title="Voltar para Peça & O.S."
          >
            <span>✓</span>
            <span>1. Peça & O.S.</span>
          </div>

          <span className="dosing-step-separator" aria-hidden="true">
            →
          </span>

          <div
            className="dosing-step-pill completed"
            onClick={handleBack}
            role="button"
            tabIndex={0}
            title="Voltar para Receita & Cálculo"
          >
            <span>✓</span>
            <span>2. Receita & Cálculo</span>
          </div>

          <span className="dosing-step-separator" aria-hidden="true">
            →
          </span>

          <div className="dosing-step-pill active">
            <span className="dosing-step-dot" aria-hidden="true" />
            <span>3. Dosagem em Béquer (ml)</span>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
              OS <strong style={{ color: 'var(--text)' }}>#{os.numero}</strong> • {os.clienteNome}
            </span>
          </div>
        </nav>

        {/* 2. Cabeçalho Operacional e Contexto do Béquer (48px) */}
        <header className="dosing-header-card">
          <div className="dosing-title-group">
            <h2 className="dosing-main-title">
              Dosagem de Componentes
            </h2>
            <span className="dosing-recipe-pill">
              {receita.nome} • {receita.codigoFormula} • {marca.nome} • Op: {operator.nome}
            </span>
          </div>

          <div className="dosing-header-right">
            <div className="dosing-scale-indicator">
              <span className="dosing-scale-dot" aria-hidden="true" />
              <span>Medição: Béquer Graduado (ml)</span>
            </div>

            <div className="dosing-total-target-pill">
              <span style={{ color: 'var(--text-muted)' }}>Meta:</span>
              <span>{vol.toLocaleString('pt-BR')} ml</span>
            </div>

            <div
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: totalDosed >= vol ? '#4ade80' : 'var(--text-muted)',
                padding: '4px 10px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border)',
              }}
            >
              Dosado: <strong style={{ color: 'var(--text)' }}>{totalDosed.toLocaleString('pt-BR')} ml</strong> ({Math.min(100, Math.round((totalDosed / vol) * 100))}%)
            </div>
          </div>
        </header>

        {/* 3. Grade 2x2 com os 4 Componentes Químicos */}
        <section className="dosing-grid" aria-label="Componentes da mistura">
          {componentes.map((comp, idx) => {
            const val = dosingValues[comp.item.id] || 0;
            const meta = comp.metaMl;
            const toleranceMax = Math.round(meta * 1.05);
            const isExceeded = excedeTolerancia(val, meta, 0.05);
            const isExactOrWithin = val >= meta && !isExceeded;
            const isUnder = val > 0 && val < meta;
            const diff = val - meta;
            const isCatalyst = comp.item.papel.toLowerCase().includes('catalisador');

            // Determina as classes de estado do card
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
                key={comp.item.id}
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
                    <span className="dosing-target-pill">
                      Meta: {meta.toLocaleString('pt-BR')} ml
                    </span>
                    <div className="dosing-target-weight">~ {comp.pesoMetaG} g</div>
                  </div>
                </div>

                {/* Controles de Dosagem e Visor Central */}
                <div className="dosing-controls-row">
                  <button
                    type="button"
                    className="dosing-control-btn"
                    onClick={() => handleValueChange(comp.item.id, val - 10)}
                    disabled={val <= 0}
                    aria-label={`Diminuir 10 ml de ${comp.item.produtoNome}`}
                  >
                    −
                  </button>

                  <div
                    className="dosing-value-display"
                    onClick={() => handleOpenKeypad(comp.item.id)}
                    role="button"
                    tabIndex={0}
                    title="Toque para digitar o valor no teclado numérico"
                  >
                    <div className="dosing-val-num-row">
                      <span className="dosing-val-num">{val.toLocaleString('pt-BR')}</span>
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
                    onClick={() => handleValueChange(comp.item.id, val + 10)}
                    aria-label={`Aumentar 10 ml de ${comp.item.produtoNome}`}
                  >
                    +
                  </button>
                </div>

                {/* Atalhos Rápidos de Simulação para Operador */}
                <div className="dosing-shortcuts-row">
                  <button
                    type="button"
                    className="dosing-shortcut-chip"
                    onClick={() => handleValueChange(comp.item.id, val + 50)}
                  >
                    +50 ml
                  </button>
                  <button
                    type="button"
                    className="dosing-shortcut-chip chip-target"
                    onClick={() => handleValueChange(comp.item.id, meta)}
                  >
                    Meta Exata ({meta} ml)
                  </button>
                  <button
                    type="button"
                    className="dosing-shortcut-chip"
                    onClick={() => handleValueChange(comp.item.id, toleranceMax + 10)}
                    title="Simular teste de excesso crítico (>5%)"
                    style={{ color: '#f87171' }}
                  >
                    +5% Excesso
                  </button>
                  {val > 0 && (
                    <button
                      type="button"
                      className="dosing-shortcut-chip"
                      onClick={() => handleValueChange(comp.item.id, 0)}
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
                  <span>
                    {isExceeded
                      ? `⚠️ +${diff} ml acima do limite seguro (+5%)`
                      : isExactOrWithin
                      ? `✓ ${val === meta ? 'Meta exata atingida' : `Dentro da tolerância (+${diff} ml)`}`
                      : isUnder
                      ? `Em dosagem no béquer (faltam ${meta - val} ml)`
                      : 'Aguardando dosagem no béquer...'}
                  </span>
                  <span>Tolerância máx: {toleranceMax} ml</span>
                </div>
              </article>
            );
          })}
        </section>
      </main>

      {/* Modal de Teclado Numérico Direto (NumericKeypad) */}
      {keypadItemId !== null && (
        <div
          className="ds-modal-backdrop"
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 90,
            padding: '16px',
            boxSizing: 'border-box',
          }}
        >
          <div
            className="ds-modal-card ds-modal-standard"
            style={{
              maxWidth: '440px',
              width: '100%',
              backgroundColor: 'var(--card)',
              border: '1.5px solid var(--border)',
              borderRadius: '20px',
              padding: '20px 24px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--text)', fontWeight: 700 }}>
                  Digitar Volume
                </h3>
                <span style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
                  {componentes.find((c) => c.item.id === keypadItemId)?.item.produtoNome}
                </span>
              </div>
              <button
                type="button"
                className="ds-modal-close-btn"
                onClick={() => setKeypadItemId(null)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Display do Teclado */}
            <div
              style={{
                height: '74px',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '2px solid var(--primary)',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '44px',
                fontWeight: 800,
                color: 'var(--text)',
                marginBottom: '16px',
              }}
            >
              {keypadBuffer || '0'}{' '}
              <span
                style={{
                  fontSize: '22px',
                  color: 'var(--text-muted)',
                  marginLeft: '8px',
                  fontWeight: 600,
                }}
              >
                ml
              </span>
            </div>

            {/* Teclado Numérico */}
            <NumericKeypad
              onDigit={handleKeypadDigit}
              onBackspace={handleKeypadBackspace}
              onClear={handleKeypadClear}
              onConfirm={handleKeypadConfirm}
              confirmLabel="Salvar Valor"
            />
          </div>
        </div>
      )}

      {/* Modal Crítico de Excesso (Intertravamento de Segurança) */}
      {criticalItem && (
        <ModalCriticalExcess
          isOpen={true}
          onClose={() => setCriticalItem(null)}
          onRepesarDoZero={handleRepesarDoZero}
          onConfirmDesperdicio={handleConfirmDesperdicio}
          componentName={criticalItem.item.item.produtoNome}
          targetVolume={criticalItem.item.metaMl}
          actualVolume={criticalItem.valReal}
          excessCost={criticalItem.cost}
        />
      )}

      {/* Barra Inferior Fixa Padronizada (56px) */}
      <footer className="ds-bottom-bar">
        <div className="ds-bottom-bar-left">
          <Button variant="secondary" size="md" onClick={handleBack}>
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
          <Button
            variant="primary"
            size="md"
            onClick={handleAttemptFinish}
            disabled={!allDosed}
            style={{ minWidth: '280px', height: '56px', fontSize: '17px', fontWeight: 700 }}
          >
            Concluir dosagem e dar baixa →
          </Button>
        </div>
      </footer>
    </>
  );
};
