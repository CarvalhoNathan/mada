import React, { useState } from 'react';
import { Operator } from '../types';
import { Button } from '../components/ui/Button';

interface ScreenReturnProps {
  operator: Operator;
  onNavigate: (screen: 'dashboard') => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'warn' | 'danger') => void;
}

export const ScreenReturn: React.FC<ScreenReturnProps> = ({
  operator,
  onNavigate,
  showToast,
}) => {
  const [returnVolume, setReturnVolume] = useState(400);
  const maxVolume = 1000;

  const [checklist, setChecklist] = useState({
    chk1: false,
    chk2: false,
    chk3: false,
  });

  const percent = Math.round((returnVolume / maxVolume) * 100);

  const toggleChecklistItem = (key: 'chk1' | 'chk2' | 'chk3') => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = checklist.chk1 && checklist.chk2 && checklist.chk3;

  const adjustVolume = (delta: number) => {
    setReturnVolume(prev => Math.max(50, Math.min(maxVolume, prev + delta)));
  };

  const handleConfirmReturn = () => {
    if (!allChecked) {
      showToast('Atenção: Marque todos os 3 itens do checklist de integridade.', 'warn');
      return;
    }

    showToast(`🖨️ Etiqueta de sobra impressa! ${returnVolume}ml devolvidos ao estoque.`, 'success');
    setTimeout(() => {
      onNavigate('dashboard');
    }, 1200);
  };

  const handleDiscardRefugo = () => {
    showToast(`🗑 Sobra de ${returnVolume}ml descartada como refugo químico.`, 'danger');
    onNavigate('dashboard');
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
                Verniz PU Alto Sólidos 4:1
              </span>
              <span className="badge-brand-homologated">#SY-8821</span>
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
              <div
                className={`checklist-row-card ${checklist.chk1 ? 'checked' : ''}`}
                onClick={() => toggleChecklistItem('chk1')}
              >
                <div className="checklist-checkbox-box">✓</div>
                <span className="checklist-label">Sem contaminação com catalisador ou água</span>
              </div>

              <div
                className={`checklist-row-card ${checklist.chk2 ? 'checked' : ''}`}
                onClick={() => toggleChecklistItem('chk2')}
              >
                <div className="checklist-checkbox-box">✓</div>
                <span className="checklist-label">Vedação hermética (tampa original lacrada)</span>
              </div>

              <div
                className={`checklist-row-card ${checklist.chk3 ? 'checked' : ''}`}
                onClick={() => toggleChecklistItem('chk3')}
              >
                <div className="checklist-checkbox-box">✓</div>
                <span className="checklist-label">Pureza química (livre de solvente ou pó de lixa)</span>
              </div>
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
                  <p><strong>PRODUTO:</strong> VERNIZ PU 4:1</p>
                  <p><strong>SALDO:</strong> <span>{returnVolume} ml</span> (± {Math.round(returnVolume * 0.95)}g)</p>
                  <p><strong>LOTE GERADO:</strong> #PU-8821-SOBRA-01</p>
                  <p><strong>ORIGEM:</strong> OS #8841 (Cozinha)</p>
                  <p><strong>OPERADOR:</strong> <span>{operator.name}</span></p>
                  <p><strong>DATA:</strong> 17/10/2026</p>
                </div>

                <div className="sticker-qr-box">
                  <svg viewBox="0 0 100 100" fill="black">
                    <path d="M0 0h30v30H0zm5 5h20v20H5zm35-5h30v30H40zm5 5h20v20H45zM0 40h30v30H0zm5 5h20v20H5zm45 5h10v10H50zm15 0h15v15H65zm0 25h10v10H65zm-25 0h10v10H40zm15 15h10v10H55z" />
                  </svg>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', marginTop: '4px' }}>
                    #SOBRA-8821
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '6px' }}>
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
