import React, { useState } from 'react';
import { Operator } from '../types';
import { Button } from '../components/ui/Button';
import { calcularSaldoDevolucao } from '../domain/leftover';
import {
  MOCK_LOTES,
  MOCK_PRODUTOS,
  MOCK_ORDENS_SERVICO,
  MOCK_CHECKLIST_SOBRAS,
} from '../data';

interface ScreenReturnProps {
  operator: Operator;
  onNavigate: (screen: 'dashboard') => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'warn' | 'danger') => void;
  onConfirmReturn?: (dados: {
    volume: number;
    produtoId: number;
    produtoNome: string;
    loteOriginalCodigo: string;
    loteGeradoCodigo: string;
  }) => Promise<void>;
  onDiscardWaste?: (volume: number, produtoId: number) => Promise<void>;
}

export const ScreenReturn: React.FC<ScreenReturnProps> = ({
  operator,
  onNavigate,
  showToast,
  onConfirmReturn,
  onDiscardWaste,
}) => {
  const [returnVolume, setReturnVolume] = useState(400);
  const maxVolume = 1000;

  // Produto, lote e Ordem de Serviço lidos a partir dos mocks
  const loteOriginal = MOCK_LOTES[0];
  const produto = MOCK_PRODUTOS.find((p) => p.id === loteOriginal.produtoId) || MOCK_PRODUTOS[4];
  const ordemServico = MOCK_ORDENS_SERVICO[0];
  const loteGerado = `${loteOriginal.codigo}-SOBRA-01`;
  const codigoEtiqueta = `#SOBRA-${loteOriginal.codigo.replace('#', '')}`;
  const dataFormatada = new Date().toLocaleDateString('pt-BR');

  // Checklist de integridade química carregado dinamicamente do mock
  const [checklist, setChecklist] = useState<Record<string, boolean>>(
    MOCK_CHECKLIST_SOBRAS.reduce((acc, item) => ({ ...acc, [item.id]: false }), {})
  );

  const saldo = calcularSaldoDevolucao(returnVolume, maxVolume, produto.densidade || 0.95);
  const percent = saldo.porcentagemPreenchimento;

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const allChecked = MOCK_CHECKLIST_SOBRAS.every((item) => checklist[item.id]);

  const adjustVolume = (delta: number) => {
    setReturnVolume((prev) => Math.max(50, Math.min(maxVolume, prev + delta)));
  };

  const handleConfirmReturn = async () => {
    if (!allChecked) {
      showToast('Atenção: Marque todos os itens do checklist de integridade.', 'warn');
      return;
    }

    if (onConfirmReturn) {
      await onConfirmReturn({
        volume: returnVolume,
        produtoId: produto.id,
        produtoNome: produto.nome,
        loteOriginalCodigo: loteOriginal.codigo,
        loteGeradoCodigo: loteGerado,
      });
    }

    showToast(`🖨️ Etiqueta de sobra impressa! ${returnVolume}ml devolvidos ao estoque.`, 'success');
    setTimeout(() => {
      onNavigate('dashboard');
    }, 1000);
  };

  const handleDiscardRefugo = async () => {
    if (onDiscardWaste) {
      await onDiscardWaste(returnVolume, produto.id);
    }
    showToast(`🗑 Sobra de ${returnVolume}ml descartada como refugo químico.`, 'danger');
    setTimeout(() => {
      onNavigate('dashboard');
    }, 800);
  };

  return (
    <>
      <div className="screen-content-area">
        <div className="section-header-compact">
          <div className="section-tag">03 / DEVOLUÇÃO AO ESTOQUE</div>
          <h2 className="section-title">Devolução de Sobras & Etiqueta</h2>
          <p className="section-desc">Pese a sobra na lata para gerar a etiqueta com QR Code e devolver ao estoque.</p>
        </div>

        <div className="return-layout">
          {/* Coluna Esquerda: Frasco e Balança */}
          <div className="bottle-visual-box">
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text)' }}>
                {produto.nome}
              </span>
              <span className="badge-brand-homologated">{loteOriginal.codigo}</span>
            </div>

            {/* Frasco com Líquido Dinâmico e Escala Externa */}
            <div className="bottle-wrapper">
              <div>
                <div className="bottle-neck" />
                <div className="bottle-container">
                  <div className="bottle-liquid" style={{ height: `${percent}%` }}>
                    <span>{returnVolume} ml</span>
                  </div>
                </div>
              </div>
              <div className="bottle-scale-marks">
                <span>1.000 ml</span>
                <span>750 ml</span>
                <span>500 ml</span>
                <span>250 ml</span>
              </div>
            </div>

            {/* Controles de Sobra */}
            <div className="sobra-stepper-box">
              <button
                type="button"
                className="btn-stepper-round"
                onClick={() => adjustVolume(-50)}
                aria-label="Diminuir 50ml"
              >
                −
              </button>
              <div className="sobra-value-center">
                <span className="sobra-val-num">{returnVolume}</span>
                <span className="sobra-val-unit">ml restantes</span>
              </div>
              <button
                type="button"
                className="btn-stepper-round"
                onClick={() => adjustVolume(50)}
                aria-label="Aumentar 50ml"
              >
                +
              </button>
            </div>

            {/* Checklist de Integridade Química */}
            <div className="checklist-container">
              <span className="checklist-title">Checklist de Integridade Química:</span>
              {MOCK_CHECKLIST_SOBRAS.map((item) => (
                <div
                  key={item.id}
                  className={`checklist-row-card ${checklist[item.id] ? 'checked' : ''}`}
                  onClick={() => toggleChecklistItem(item.id)}
                >
                  <div className="checklist-checkbox-box">✓</div>
                  <span className="checklist-label">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Coluna Direita: Etiqueta Térmica & Refugo */}
          <div className="return-right-col">
            <div className="thermal-sticker-card">
              <div className="sticker-badge-urgent">
                ⚠️ PRIORIDADE DE USO IMEDIATO (USAR PRIMEIRO)
              </div>

              <div className="sticker-header">
                <strong>CONTROLE DE SOBRA QUÍMICA</strong>
                <span>ALMOX-PU</span>
              </div>

              <div className="sticker-body">
                <div className="sticker-details">
                  <p><strong>PRODUTO:</strong> {produto.nome.toUpperCase()}</p>
                  <p><strong>SALDO:</strong> <span>{returnVolume} ml</span> (± {saldo.pesoEstimadoGramas}g)</p>
                  <p><strong>LOTE GERADO:</strong> {loteGerado}</p>
                  <p><strong>ORIGEM:</strong> {ordemServico.numero} ({ordemServico.ambienteNome})</p>
                  <p><strong>OPERADOR:</strong> <span>{operator.nome || operator.name}</span></p>
                  <p><strong>DATA:</strong> {dataFormatada}</p>
                </div>

                <div className="sticker-qr-box">
                  <svg viewBox="0 0 100 100" fill="black">
                    <path d="M0 0h30v30H0zm5 5h20v20H5zm35-5h30v30H40zm5 5h20v20H45zM0 40h30v30H0zm5 5h20v20H5zm45 5h10v10H50zm15 0h15v15H65zm0 25h10v10H65zm-25 0h10v10H40zm15 15h10v10H55z" />
                  </svg>
                  <span style={{ fontSize: 'var(--fs-small)', fontWeight: 700, color: 'var(--bg)', marginTop: '4px' }}>
                    {codigoEtiqueta}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '10px', fontSize: 'var(--fs-small)', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '6px' }}>
                DEVOLUÇÃO EM CONFORMIDADE • PROIBIDO DESCARTE EM RALO INDUSTRIAL
              </div>
            </div>

            {/* Botão de Refugo Destrutivo com HoldToConfirm (1,5s) */}
            <div className="refugo-box">
              <Button
                variant="danger"
                size="md"
                holdToConfirm={true}
                onHoldConfirm={handleDiscardRefugo}
                style={{ width: '100%', fontSize: '19px', padding: '0 16px' }}
                title="Segure por 1,5s para confirmar descarte como refugo"
              >
                🗑 Descartar sobra como refugo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Barra Inferior Fixa */}
      <footer className="ds-bottom-bar">
        <div className="ds-bottom-bar-left">
          <Button variant="secondary" size="md" onClick={() => onNavigate('dashboard')}>
            ← Voltar
          </Button>
        </div>
        <div className="ds-bottom-bar-right">
          <Button
            variant="primary"
            size="md"
            onClick={handleConfirmReturn}
            disabled={!allChecked}
            style={{ minWidth: '280px' }}
          >
            🖨️ Confirmar sobra e imprimir etiqueta →
          </Button>
        </div>
      </footer>
    </>
  );
};
