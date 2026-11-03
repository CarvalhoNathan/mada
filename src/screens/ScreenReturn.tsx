import React, { useState } from 'react';
import { AlertTriangle, Trash2, Printer, Check, Package } from 'lucide-react';
import { Lote, Operator, OrdemServico } from '../types';
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
  lotes?: Lote[];
  activeOS?: OrdemServico;
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
  lotes,
  activeOS,
  onNavigate,
  showToast,
  onConfirmReturn,
  onDiscardWaste,
}) => {
  const lotesDisponiveis = lotes && lotes.length > 0 ? lotes : MOCK_LOTES;
  const [selectedLoteId, setSelectedLoteId] = useState<number>(lotesDisponiveis[0]?.id || 1);
  const [returnVolume, setReturnVolume] = useState(400);
  const maxVolume = 1000;

  // Produto, lote e Ordem de Serviço selecionados dinamicamente
  const loteOriginal = lotesDisponiveis.find((l) => l.id === selectedLoteId) || lotesDisponiveis[0] || MOCK_LOTES[0];
  const produto = MOCK_PRODUTOS.find((p) => p.id === loteOriginal.produtoId) || MOCK_PRODUTOS[4];
  const ordemServico = activeOS || MOCK_ORDENS_SERVICO[0];
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

    showToast(`Etiqueta de sobra impressa! ${returnVolume}ml devolvidos ao estoque.`, 'success');
    setTimeout(() => {
      onNavigate('dashboard');
    }, 1000);
  };

  const handleDiscardRefugo = async () => {
    if (onDiscardWaste) {
      await onDiscardWaste(returnVolume, produto.id);
    }
    showToast(`Sobra de ${returnVolume}ml descartada como refugo químico.`, 'danger');
    setTimeout(() => {
      onNavigate('dashboard');
    }, 800);
  };

  return (
    <>
      <div className="screen-content-area">
        <div className="section-header-compact" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div className="section-tag">03 / DEVOLUÇÃO AO ESTOQUE</div>
            <h2 className="section-title">Devolução de Sobras & Etiqueta</h2>
            <p className="section-desc">Selecione a lata utilizada, informe o saldo restante e gere a etiqueta térmica com QR Code.</p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="os-bar-btn os-btn-back"
            style={{ minHeight: '52px', padding: '0 18px', fontSize: '16px' }}
            title="Imprimir somente a etiqueta térmica Zebra"
          >
            <Printer size={18} strokeWidth={2.2} />
            <span>Testar Impressão Térmica</span>
          </button>
        </div>

        {/* Seletor Tátil de Lata / Insumo Químico em Giro */}
        <div
          role="radiogroup"
          aria-label="Selecione a lata para devolução"
          style={{
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            paddingBottom: '6px',
            marginBottom: '12px',
          }}
        >
          {lotesDisponiveis.slice(0, 6).map((loteItem) => {
            const isSelected = loteItem.id === loteOriginal.id;
            return (
              <button
                key={loteItem.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => {
                  setSelectedLoteId(loteItem.id);
                  setReturnVolume(Math.min(maxVolume, Math.max(100, Math.round(loteItem.quantidadeAtual / 2 / 50) * 50)));
                }}
                style={{
                  minHeight: '54px',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: isSelected ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                  background: isSelected ? 'var(--primary-soft)' : 'var(--card)',
                  color: isSelected ? 'var(--text)' : 'var(--text-muted)',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'inherit',
                }}
              >
                {isSelected ? <Check size={16} strokeWidth={2.8} color="var(--primary)" /> : <Package size={16} strokeWidth={2.2} />}
                <span>{loteItem.produtoNome}</span>
                <span style={{ opacity: 0.75, fontSize: '14px' }}>({loteItem.codigo})</span>
              </button>
            );
          })}
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

          {/* Coluna Direita: Etiqueta Térmica Realista & Refugo */}
          <div className="return-right-col">
            <div className="thermal-sticker-card">
              {/* Serrilha de corte da impressora térmica */}
              <div className="thermal-tear-edge" aria-hidden="true" />

              <div className="sticker-printer-badge">
                <Printer size={12} strokeWidth={2.5} />
                <span>ZEBRA ZT410 • TERMOTRANSFERÊNCIA 203 DPI</span>
              </div>

              <div className="sticker-header">
                <div>
                  <strong style={{ fontSize: '15px', letterSpacing: '0.04em' }}>MADA MARCENARIA</strong>
                  <span style={{ display: 'block', fontSize: '11px', color: '#64748B' }}>CABINE PU • ALMOXARIFADO</span>
                </div>
                <div className="sticker-stamp">
                  REUSO IMEDIATO
                </div>
              </div>

              <div className="sticker-badge-urgent" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <AlertTriangle size={14} strokeWidth={2.4} /> PRIORIDADE FEFO: CONSUMIR ANTES DE VIOLAR LATAS LACRADAS
              </div>

              <div className="sticker-body">
                <div className="sticker-details">
                  <p><strong>PRODUTO:</strong> <span>{produto.nome.toUpperCase()}</span></p>
                  <p><strong>VOLUME REAL:</strong> <strong style={{ color: '#0F172A', fontSize: '15px' }}>{returnVolume} ml</strong> <span style={{ color: '#64748B' }}>(± {saldo.pesoEstimadoGramas}g)</span></p>
                  <p><strong>LOTE GERADO:</strong> <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{loteGerado}</span></p>
                  <p><strong>ORIGEM:</strong> <span>{ordemServico.numero} ({ordemServico.ambienteNome})</span></p>
                  <p><strong>PINTOR:</strong> <span>{operator.nome || operator.name}</span></p>
                  <p><strong>HORA:</strong> <span>{dataFormatada}</span></p>
                </div>

                <div className="sticker-qr-box">
                  <svg viewBox="0 0 100 100" fill="black">
                    <path d="M0 0h30v30H0zm5 5h20v20H5zm35-5h30v30H40zm5 5h20v20H45zM0 40h30v30H0zm5 5h20v20H5zm45 5h10v10H50zm15 0h15v15H65zm0 25h10v10H65zm-25 0h10v10H40zm15 15h10v10H55z" />
                  </svg>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A', marginTop: '4px', letterSpacing: '0.05em' }}>
                    {codigoEtiqueta}
                  </span>
                </div>
              </div>

              {/* Código de barras 1D linear simulado */}
              <div className="sticker-barcode-row" aria-hidden="true">
                <div className="barcode-bars" />
                <span className="barcode-number">*{loteGerado}*</span>
              </div>

              <div className="sticker-footer-note">
                ETIQUETA TÉRMICA PADRÃO ABNT/FEFO • PROIBIDO DESCARTE EM ESGOTO INDUSTRIAL
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
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Trash2 size={18} strokeWidth={2.4} /> Descartar sobra como refugo
                </span>
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
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Printer size={18} strokeWidth={2.4} /> Confirmar sobra e imprimir etiqueta →
            </span>
          </Button>
        </div>
      </footer>
    </>
  );
};
