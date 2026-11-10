import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  PackageCheck,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Clock,
  Trash2,
} from 'lucide-react';
import { ItemDevolucaoComponente, Operator, Preparacao } from '../../types';
import { SaldoDevolucao } from '../../domain/leftover';
import { Button } from '../../components/ui/Button';
import { CountNumber } from '../../components/ui/CountNumber';
import { STATUS_BADGE_MAP } from './types';

interface ReturnThermalStickerProps {
  preparacaoAtual: Preparacao;
  itemAtual: ItemDevolucaoComponente;
  operator: Operator;
  returnVolume: number;
  saldo: SaldoDevolucao;
  allChecked: boolean;
  isZeroVolume: boolean;
  itemJaResolvido: boolean;
  isProcessing: boolean;
  progresso: {
    proximoItemPendenteId: string | null;
  };
  onSelectNextPending?: (id: string) => void;
  onConfirmComponentReturn: () => Promise<void>;
  onConfirmEmptyContainer: () => Promise<void>;
  onMarkConference: () => Promise<void>;
  onDiscardComponent: () => Promise<void>;
  onMarkStickerPrinted?: (preparacaoId: string, itemId: string) => Promise<void>;
  showToast: (msg: string, type?: 'info' | 'success' | 'warn' | 'danger') => void;
}

export const ReturnThermalSticker: React.FC<ReturnThermalStickerProps> = ({
  preparacaoAtual,
  itemAtual,
  operator,
  returnVolume,
  saldo,
  allChecked,
  isZeroVolume,
  itemJaResolvido,
  isProcessing,
  progresso,
  onSelectNextPending,
  onConfirmComponentReturn,
  onConfirmEmptyContainer,
  onMarkConference,
  onDiscardComponent,
  onMarkStickerPrinted,
  showToast,
}) => {
  const cleanLoteCode = itemAtual.loteCodigo.replace(/^#+/, '');
  const loteGeradoPreview =
    itemAtual.loteSobraGeradoCodigo ||
    `#${cleanLoteCode}-SOBRA-0${itemAtual.receitaItemId || 1}`;
  const codigoEtiquetaPreview =
    itemAtual.codigoEtiquetaGerada || `#SOBRA-${cleanLoteCode}-${itemAtual.receitaItemId || 1}`;

  const dataFormatada = itemAtual.registradoEm
    ? new Date(itemAtual.registradoEm).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(loteGeradoPreview, {
      width: 140,
      margin: 1,
      color: { dark: '#0F172A', light: '#FFFFFF' },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        // Ignora erro de geração em ambiente de teste
      });
    return () => {
      active = false;
    };
  }, [loteGeradoPreview]);

  // Impressão complementar de etiqueta térmica Zebra ZT410 (100x50mm com QR Code real)
  const handlePrint = async () => {
    if (onMarkStickerPrinted) {
      await onMarkStickerPrinted(preparacaoAtual.id, itemAtual.id);
    }

    try {
      const printWin = window.open('', '_blank', 'width=520,height=360');
      if (printWin) {
        printWin.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Etiqueta Térmica ${codigoEtiquetaPreview}</title>
  <style>
    @page { size: 100mm 50mm; margin: 0; }
    body {
      margin: 0;
      padding: 10px 14px;
      font-family: Arial, Helvetica, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      box-sizing: border-box;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0F172A;
      padding-bottom: 4px;
      margin-bottom: 6px;
    }
    .title { font-size: 13px; font-weight: 800; letter-spacing: 0.04em; }
    .sub { font-size: 9px; color: #475569; }
    .stamp {
      font-size: 9px;
      font-weight: 800;
      border: 1.5px solid #0F172A;
      padding: 2px 5px;
      border-radius: 4px;
    }
    .fefo-bar {
      background: #FEF3C7;
      border: 1px solid #D97706;
      font-size: 9px;
      font-weight: 800;
      text-align: center;
      padding: 2px 4px;
      margin-bottom: 6px;
    }
    .grid {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }
    .info p {
      margin: 2px 0;
      font-size: 10px;
    }
    .qr-col {
      text-align: center;
    }
    .qr-col img {
      width: 72px;
      height: 72px;
      display: block;
      margin: 0 auto;
    }
    .qr-code-txt {
      font-size: 9px;
      font-weight: 800;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">MADA MARCENARIA • QUÍMICOS</div>
      <div class="sub">RASTREABILIDADE FEFO • ${preparacaoAtual.id}</div>
    </div>
    <div class="stamp">${allChecked ? 'HOMOLOGADO ESTOQUE' : 'CONFERÊNCIA'}</div>
  </div>
  <div class="fefo-bar">PRIORIDADE FEFO: CONSUMIR ANTES DE VIOLAR LATAS LACRADAS</div>
  <div class="grid">
    <div class="info">
      <p><strong>PRODUTO:</strong> ${itemAtual.produtoNome}</p>
      <p><strong>SALDO RESTANTE:</strong> <strong>${returnVolume} ml</strong> (± ${saldo.pesoEstimadoGramas}g)</p>
      <p><strong>LOTE ORIGEM:</strong> ${itemAtual.loteCodigo}</p>
      <p><strong>LOTE SOBRA:</strong> ${loteGeradoPreview}</p>
      <p><strong>ORIGEM:</strong> ${preparacaoAtual.ordemServicoNumero} (${preparacaoAtual.ambienteNome})</p>
      <p><strong>OPERADOR:</strong> ${itemAtual.avaliadoPorNome || operator.nome} • ${dataFormatada}</p>
    </div>
    <div class="qr-col">
      ${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR Code" />` : ''}
      <div class="qr-code-txt">${codigoEtiquetaPreview}</div>
    </div>
  </div>
  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`);
        printWin.document.close();
      }
    } catch {
      // Fallback
    }

    showToast(
      `🖨️ Etiqueta térmica ${codigoEtiquetaPreview} enviada para impressão (${itemAtual.produtoNome})!`,
      'info'
    );
  };

  return (
    <div className="return-right-col">
      <div className="thermal-sticker-card" style={{ padding: '14px 18px 12px 18px', opacity: isZeroVolume ? 0.72 : 1 }}>
        <div className="thermal-tear-edge" aria-hidden="true" />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px',
          }}
        >
          <div className="sticker-printer-badge" style={{ marginBottom: 0 }}>
            <Printer size={12} strokeWidth={2.5} />
            <span>ZEBRA ZT410 • ETIQUETA INDIVIDUAL</span>
          </div>

          {!isZeroVolume && (
            <button
              type="button"
              onClick={handlePrint}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #0F172A',
                background: itemAtual.etiquetaImpressa ? '#DCFCE7' : '#F1F5F9',
                color: '#0F172A',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
              title="Imprimir etiqueta térmica apenas para esta embalagem (não encerra a preparação)"
            >
              <Printer size={12} />
              <span>{itemAtual.etiquetaImpressa ? '✓ Reimprimir Etiqueta' : 'Imprimir Etiqueta'}</span>
            </button>
          )}
        </div>

        <div className="sticker-header">
          <div>
            <strong style={{ fontSize: '15px', letterSpacing: '0.04em' }}>MADA MARCENARIA</strong>
            <span style={{ display: 'block', fontSize: '11px', color: '#64748B' }}>
              RASTREABILIDADE INDIVIDUAL • {preparacaoAtual.id}
            </span>
          </div>
          {isZeroVolume ? (
            <div className="sticker-homologation-stamp">
              <PackageCheck size={14} strokeWidth={2.6} />
              <span>LATA ESGOTADA (0 ML)</span>
            </div>
          ) : allChecked ? (
            <div className="sticker-homologation-stamp">
              <ShieldCheck size={14} strokeWidth={2.6} />
              <span>HOMOLOGADO FEFO</span>
            </div>
          ) : (
            <div className="sticker-stamp" style={{ opacity: 0.85 }}>
              REPROVADO P/ ESTOQUE
            </div>
          )}
        </div>

        <div
          className="sticker-badge-urgent"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}
        >
          <AlertTriangle size={13} strokeWidth={2.4} />{' '}
          {isZeroVolume
            ? 'EMBALAGEM CONSUMIDA INTEGRALMENTE • SEM RETORNO À PRATELEIRA'
            : 'PRIORIDADE FEFO: CONSUMIR ANTES DE VIOLAR LATAS LACRADAS'}
        </div>

        <div className="sticker-body">
          <div className="sticker-details">
            <p>
              <strong>PRODUTO:</strong> <span>{itemAtual.produtoNome.toUpperCase()}</span>
            </p>
            <p>
              <strong>SALDO RESTANTE:</strong>{' '}
              <strong style={{ color: '#0F172A', fontSize: '15px' }}>
                <CountNumber value={returnVolume} format={(n) => `${Math.round(n)} ml`} />
              </strong>{' '}
              <span style={{ color: '#64748B' }}>(± {saldo.pesoEstimadoGramas}g)</span>
            </p>
            <p>
              <strong>LOTE ORIGEM:</strong>{' '}
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{itemAtual.loteCodigo}</span>
            </p>
            <p>
              <strong>LOTE SOBRA:</strong>{' '}
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                {isZeroVolume ? 'N/A (ESGOTADO)' : loteGeradoPreview}
              </span>
            </p>
            <p>
              <strong>ORIGEM:</strong>{' '}
              <span>
                {preparacaoAtual.ordemServicoNumero} ({preparacaoAtual.ambienteNome})
              </span>
            </p>
            <p>
              <strong>AVALIADO POR:</strong>{' '}
              <span>
                {itemAtual.avaliadoPorNome || operator.nome} • {dataFormatada}
              </span>
            </p>
          </div>

          <div className="sticker-qr-box">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Code escaneável ${loteGeradoPreview}`}
                style={{
                  width: '76px',
                  height: '76px',
                  display: 'block',
                  borderRadius: '4px',
                }}
              />
            ) : (
              <svg viewBox="0 0 100 100" fill="black">
                <path d="M0 0h30v30H0zm5 5h20v20H5zm35-5h30v30H40zm5 5h20v20H45zM0 40h30v30H0zm5 5h20v20H5zm45 5h10v10H50zm15 0h15v15H65zm0 25h10v10H65zm-25 0h10v10H40zm15 15h10v10H55z" />
              </svg>
            )}
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#0F172A',
                marginTop: '4px',
                letterSpacing: '0.04em',
              }}
            >
              {codigoEtiquetaPreview}
            </span>
          </div>
        </div>
      </div>

      {/* Botões de Ação Individual para o Componente Selecionado */}
      {itemJaResolvido ? (
        <div
          style={{
            padding: '14px 16px',
            borderRadius: '12px',
            background:
              itemAtual.status === 'DEVOLVIDO_AO_ESTOQUE' ||
              itemAtual.status === 'EMBALAGEM_ESGOTADA'
                ? 'rgba(16, 185, 129, 0.14)'
                : itemAtual.status === 'PENDENTE_DE_CONFERENCIA'
                ? 'rgba(59, 130, 246, 0.14)'
                : 'rgba(239, 68, 68, 0.14)',
            border: `1.5px solid ${
              itemAtual.status === 'DEVOLVIDO_AO_ESTOQUE' ||
              itemAtual.status === 'EMBALAGEM_ESGOTADA'
                ? 'var(--ok)'
                : itemAtual.status === 'PENDENTE_DE_CONFERENCIA'
                ? 'var(--primary)'
                : 'var(--danger)'
            }`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <strong style={{ fontSize: '16px', color: 'var(--text)', display: 'block' }}>
              ✓ Componente já registrado ({STATUS_BADGE_MAP[itemAtual.status].label})
            </strong>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Responsável: {itemAtual.responsavelMovimentacaoNome || operator.nome} • Saldo:{' '}
              {itemAtual.saldoRestanteInformadoMl} ml
            </span>
          </div>
          {progresso.proximoItemPendenteId && onSelectNextPending && (
            <Button
              variant="primary"
              size="md"
              onClick={() => onSelectNextPending(progresso.proximoItemPendenteId!)}
            >
              Próximo Pendente →
            </Button>
          )}
        </div>
      ) : isZeroVolume ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Button
            variant="primary"
            size="md"
            disabled={isProcessing}
            onClick={onConfirmEmptyContainer}
            style={{
              width: '100%',
              fontSize: '18px',
              background: '#10B981',
              borderColor: '#10B981',
            }}
          >
            <PackageCheck size={20} strokeWidth={2.4} />
            <span>Confirmar Sem Sobra / Embalagem Esgotada (0 ml)</span>
          </Button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Button
              variant="secondary"
              size="md"
              disabled={isProcessing}
              onClick={onMarkConference}
              style={{ fontSize: '16px', padding: '0 12px' }}
              title="Separar embalagem para avaliação do responsável técnico"
            >
              <Clock size={17} /> Pendente Conferência
            </Button>

            <Button
              variant="danger"
              size="md"
              disabled={isProcessing}
              onClick={onDiscardComponent}
              style={{ fontSize: '16px', padding: '0 12px' }}
              title="Registrar descarte de embalagem vazia/contaminada"
            >
              <Trash2 size={17} strokeWidth={2.4} /> Descartar Embalagem
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Button
            variant="primary"
            size="md"
            disabled={!allChecked || isProcessing}
            onClick={onConfirmComponentReturn}
            style={{ width: '100%', fontSize: '18px' }}
          >
            <RotateCcw size={18} strokeWidth={2.4} />
            <span>
              Devolver {itemAtual.produtoNome.replace(/^[0-9]+[º°]?\s*/, '')} ao Estoque ({returnVolume} ml)
            </span>
          </Button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Button
              variant="secondary"
              size="md"
              disabled={isProcessing}
              onClick={onMarkConference}
              style={{ fontSize: '16px', padding: '0 12px' }}
              title="Separar embalagem para avaliação do responsável técnico"
            >
              <Clock size={17} /> Pendente Conferência
            </Button>

            <Button
              variant="danger"
              size="md"
              disabled={isProcessing}
              onClick={onDiscardComponent}
              style={{ fontSize: '16px', padding: '0 12px' }}
              title="Registrar descarte desta sobra como refugo químico"
            >
              <Trash2 size={17} strokeWidth={2.4} /> Descartar como Refugo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
