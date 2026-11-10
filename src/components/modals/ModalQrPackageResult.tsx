import React from 'react';
import { Package, History, RotateCcw, Boxes, X, MapPin, Calendar } from 'lucide-react';
import { Lote, Produto, Movimentacao, Preparacao } from '../../types';
import { Button } from '../ui/Button';
import { formatarStatusValidade } from '../../domain/fefo';

interface ModalQrPackageResultProps {
  isOpen: boolean;
  onClose: () => void;
  codigoLido: string;
  lote?: Lote;
  produto?: Produto;
  movimentacoes: Movimentacao[];
  preparacaoPendente?: Preparacao;
  onRegistrarDevolucao: () => void;
  onIrParaEstoque: () => void;
}

export const ModalQrPackageResult: React.FC<ModalQrPackageResultProps> = ({
  isOpen,
  onClose,
  codigoLido,
  lote,
  produto,
  movimentacoes,
  preparacaoPendente,
  onRegistrarDevolucao,
  onIrParaEstoque,
}) => {
  if (!isOpen || !lote) return null;

  const statusVal = formatarStatusValidade(lote.validade, lote.diasAberto);
  const movsDoLote = movimentacoes.filter((m) => m.loteId === lote.id).slice(0, 4);

  return (
    <div className="ds-modal-backdrop" role="dialog" aria-modal="true" aria-label="Inspeção de Embalagem por QR Code">
      <div className="ds-modal-card ds-modal-standard" style={{ maxWidth: '680px', width: '92%' }}>
        <header
          className="ds-modal-header"
          style={{
            background: 'var(--card-hover)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'var(--primary-soft)',
                border: '1px solid var(--primary-border)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Package size={24} strokeWidth={2.3} />
            </div>
            <div>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--ok)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                QR Code de Embalagem Identificado ({codigoLido})
              </span>
              <h2 className="ds-modal-title" style={{ margin: '2px 0 0', fontSize: '21px' }}>
                {lote.produtoNome}
              </h2>
            </div>
          </div>

          <button
            type="button"
            className="ds-modal-close-btn"
            onClick={onClose}
            aria-label="Fechar detalhes da embalagem"
            style={{ minWidth: '48px', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={20} />
          </button>
        </header>

        <div className="ds-modal-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Resumo de Saldo, Lote e Localização */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              background: 'var(--bg)',
              padding: '14px 18px',
              borderRadius: '14px',
              border: '1px solid var(--border)',
            }}
          >
            <div>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'block' }}>Lote / Código</span>
              <strong style={{ fontSize: '18px', fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
                {lote.codigo}
              </strong>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                Ref: {produto?.codigo || 'Homologado'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'block' }}>Saldo Atual na Lata</span>
              <strong style={{ fontSize: '22px', color: 'var(--ok)', fontFamily: 'var(--font-mono)' }}>
                {lote.quantidadeAtual.toLocaleString('pt-BR')} ml
              </strong>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                ~ {Math.round(lote.quantidadeAtual * (produto?.densidade || 0.95))} g
              </span>
            </div>

            <div>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'block' }}>Local & Validade</span>
              <strong style={{ fontSize: '15px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={14} /> {lote.prateleira}
              </strong>
              <span
                style={{
                  fontSize: '13px',
                  color: statusVal.nivel === 'urgente' ? 'var(--danger)' : 'var(--warn)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '2px',
                  fontWeight: 600,
                }}
              >
                <Calendar size={13} /> {statusVal.rotulo}
              </span>
            </div>
          </div>

          {/* Alerta se este lote faz parte de uma preparação com devolução pendente */}
          {preparacaoPendente && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'var(--warn-soft)',
                border: '1px solid var(--warn-border)',
                color: 'var(--warn)',
                fontSize: '15px',
                fontWeight: 600,
              }}
            >
              ⚡ Esta embalagem consta com devolução pendente na {preparacaoPendente.ordemServicoNumero} ({preparacaoPendente.ambienteNome}).
            </div>
          )}

          {/* Histórico recente de movimentações do lote */}
          <div>
            <h3
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <History size={16} /> Histórico de Movimentações da Embalagem
            </h3>
            {movsDoLote.length === 0 ? (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'var(--bg)',
                  border: '1px dashed var(--border)',
                  fontSize: '15px',
                  color: 'var(--text-muted)',
                }}
              >
                Lote em estoque ativo ({lote.diasAberto > 0 ? `aberto há ${lote.diasAberto} dia(s)` : 'embalagem lacrada'}). Sem movimentações registradas nesta sessão.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {movsDoLote.map((m, i) => (
                  <div
                    key={m.id || i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      fontSize: '14px',
                    }}
                  >
                    <div>
                      <strong
                        style={{
                          color:
                            m.tipo === 'DEVOLUCAO'
                              ? 'var(--ok)'
                              : m.tipo === 'DESCARTE'
                              ? 'var(--danger)'
                              : 'var(--text)',
                        }}
                      >
                        {m.tipo}
                      </strong>{' '}
                      <span style={{ color: 'var(--text-muted)' }}>
                        • {m.justificativa || 'Movimentação operacional'}
                      </span>
                    </div>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>{m.quantidade} ml</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <footer
          className="ds-modal-footer"
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <Button variant="secondary" size="md" onClick={onIrParaEstoque}>
            <Boxes size={18} /> Ver no Estoque
          </Button>

          <Button variant="primary" size="md" onClick={onRegistrarDevolucao}>
            <RotateCcw size={18} /> Registrar Devolução / Sobra →
          </Button>
        </footer>
      </div>
    </div>
  );
};
