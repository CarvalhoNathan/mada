import React, { useState } from 'react';
import { RecipeState, Operator, OrdemServico } from '../types';
import { StepIndicator } from '../components/ui/StepIndicator';
import { Button } from '../components/ui/Button';
import { NumberStepper } from '../components/ui/NumberStepper';
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
  operator,
  activeOS,
  onNavigate,
  onCompleteDosing,
  onOpenCancelPrep,
  showToast,
}) => {
  const vol = recipe.totalVolume;
  const os = activeOS || MOCK_ORDENS_SERVICO[0];
  const receita = MOCK_RECEITAS[0];
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

  // Todos os componentes devem ter valor > 0 para liberar a conclusão
  const allDosed = componentes.every((c) => (dosingValues[c.item.id] || 0) > 0);
  const hasAnyValue = componentes.some((c) => (dosingValues[c.item.id] || 0) > 0);

  const handleValueChange = (itemId: number, newValue: number) => {
    setDosingValues((prev) => ({ ...prev, [itemId]: newValue }));
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
      showToast('Preencha a pesagem de todos os 4 componentes antes de concluir.', 'warn');
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
      showToast(`Valor de ${criticalItem.item.item.produtoNome} zerado para repesagem.`, 'info');
      setCriticalItem(null);
    }
  };

  const handleConfirmDesperdicio = (reason: string) => {
    setCriticalItem(null);
    onCompleteDosing(dosingValues, reason);
  };

  const handleBack = () => {
    if (hasAnyValue) {
      if (window.confirm('Existem pesagens registradas nesta tela. Deseja realmente voltar à receita?')) {
        onNavigate('recipe');
      }
    } else {
      onNavigate('recipe');
    }
  };

  return (
    <>
      <div className="screen-content-area" style={{ paddingBottom: '90px' }}>
        {/* Indicador de Etapas: Passo 3 Ativo */}
        <StepIndicator
          steps={[
            { id: 1, label: `1. ${os.numero} (${os.ambienteNome})`, status: 'completed' },
            { id: 2, label: '2. Receita & Calculadora', status: 'completed' },
            { id: 3, label: '3. Dosagem & Baixa', status: 'active' },
          ]}
          onStepClick={(step) => {
            if (step.id === 2) handleBack();
          }}
        />

        {/* Cabeçalho da Tela de Dosagem */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <div>
            <div className="section-tag">03 / DOSAGEM & PESAGEM REAL</div>
            <h2 className="section-title" style={{ fontSize: '24px', margin: '2px 0' }}>
              Pesagem de Componentes • {receita.nome}
            </h2>
            <p className="section-desc" style={{ fontSize: 'var(--fs-small)', margin: 0 }}>
              Operador: <strong>{operator.nome || operator.name}</strong> • Marca homologada: {marca.nome}
            </p>
          </div>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: 'var(--card-hover)',
              border: '1px solid var(--border)',
              fontSize: 'var(--fs-small)',
              fontWeight: 700,
              color: 'var(--text-muted)',
            }}
          >
            Volume Total Meta: <strong style={{ color: 'var(--text)' }}>{vol} ml</strong>
          </div>
        </div>

        {/* Grade 2x2 com os 4 Componentes (otimizada para 1280x800 sem rolagem) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
          }}
        >
          {componentes.map((comp, idx) => {
            const val = dosingValues[comp.item.id] || 0;
            const meta = comp.metaMl;
            const toleranceMax = Math.round(meta * 1.05);
            const isExceeded = excedeTolerancia(val, meta, 0.05);
            const isExactOrWithin = val >= meta && !isExceeded;
            const isUnder = val > 0 && val < meta;
            const diff = val - meta;

            // Cores do Card conforme o estado
            const borderColor = isExceeded
              ? 'var(--danger)'
              : isExactOrWithin
              ? 'var(--ok)'
              : 'var(--border)';

            const badgeBg = isExceeded
              ? 'var(--danger-soft)'
              : isExactOrWithin
              ? 'var(--ok-soft)'
              : isUnder
              ? 'var(--warn-soft)'
              : 'var(--card-hover)';

            const badgeColor = isExceeded
              ? 'var(--danger)'
              : isExactOrWithin
              ? 'var(--ok)'
              : isUnder
              ? 'var(--warn)'
              : 'var(--text-muted)';

            return (
              <div
                key={comp.item.id}
                style={{
                  background: 'var(--card)',
                  border: `2px solid ${borderColor}`,
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isExceeded
                    ? '0 0 0 1px var(--danger)'
                    : isExactOrWithin
                    ? '0 0 0 1px var(--ok)'
                    : 'none',
                }}
              >
                {/* Cabeçalho do Componente */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'var(--card-hover)',
                          color: 'var(--text)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 'var(--fs-small)',
                          fontWeight: 800,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: '18px',
                          fontWeight: 700,
                          color: 'var(--text)',
                        }}
                      >
                        {comp.item.produtoNome}
                      </h4>
                    </div>
                    <span
                      style={{
                        fontSize: 'var(--fs-small)',
                        color: 'var(--text-muted)',
                        display: 'block',
                        marginTop: '2px',
                      }}
                    >
                      Cód: {comp.item.codigoProduto} • Lote: {comp.loteAtivo ? comp.loteAtivo.codigo : 'Padrão'}
                    </span>
                  </div>

                  {/* Badge de Meta e Proporção */}
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'var(--card-hover)',
                        fontSize: 'var(--fs-small)',
                        fontWeight: 700,
                        color: 'var(--text)',
                      }}
                    >
                      Meta: {meta} ml
                    </span>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 'var(--fs-small)',
                        color: 'var(--text-muted)',
                        marginTop: '2px',
                      }}
                    >
                      ~ {comp.pesoMetaG} g
                    </span>
                  </div>
                </div>

                {/* NumberStepper com Alvo de Toque de 64px e passo de 10ml */}
                <NumberStepper
                  value={val}
                  unit="ml"
                  step={10}
                  min={0}
                  max={5000}
                  standardValue={meta}
                  toleranceMax={toleranceMax}
                  onChange={(newVal) => handleValueChange(comp.item.id, newVal)}
                  onOpenKeypad={() => handleOpenKeypad(comp.item.id)}
                />

                {/* Linha de Feedback de Estado */}
                <div
                  style={{
                    marginTop: '8px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: badgeBg,
                    color: badgeColor,
                    fontSize: 'var(--fs-small)',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>
                    {isExceeded
                      ? `⚠️ +${diff} ml acima do padrão (+5%)`
                      : isExactOrWithin
                      ? `✓ Dentro da meta (${val === meta ? 'exato' : `+${diff} ml na tolerância`})`
                      : isUnder
                      ? `Em pesagem (faltam ${meta - val} ml)`
                      : 'Toque em + ou no visor para dosar'}
                  </span>
                  <span>Tolerância máx: {toleranceMax} ml</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Teclado Numérico Direto (NumericKeypad) */}
      {keypadItemId !== null && (
        <div className="ds-modal-backdrop" role="dialog" aria-modal="true">
          <div
            className="ds-modal-card ds-modal-standard"
            style={{ maxWidth: '420px', padding: '20px' }}
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
                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text)' }}>Digitar Volume</h3>
                <span style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>
                  {componentes.find((c) => c.item.id === keypadItemId)?.item.produtoNome}
                </span>
              </div>
              <button
                type="button"
                className="ds-modal-close-btn"
                onClick={() => setKeypadItemId(null)}
              >
                ✕
              </button>
            </div>

            {/* Display do Teclado */}
            <div
              style={{
                height: '70px',
                background: 'var(--card-hover)',
                border: '2px solid var(--border)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '42px',
                fontWeight: 800,
                color: 'var(--text)',
                marginBottom: '16px',
              }}
            >
              {keypadBuffer || '0'} <span style={{ fontSize: '20px', color: 'var(--text-muted)', marginLeft: '6px' }}>ml</span>
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

      {/* Modal Crítico de Excesso (disparado pela dosagem real) */}
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

      {/* Barra Inferior Fixa */}
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
            style={{ minWidth: '260px' }}
          >
            Concluir dosagem →
          </Button>
        </div>
      </footer>
    </>
  );
};
