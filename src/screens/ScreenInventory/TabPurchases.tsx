import React from 'react';
import { ShoppingCart, ClipboardCopy, Plus, Trash2 } from 'lucide-react';
import { ItemSolicitacaoCompra } from '../../types';
import { MOCK_PRODUTOS } from '../../data';

interface TabPurchasesProps {
  solicitacoes: ItemSolicitacaoCompra[];
  copiedList: boolean;
  onCopiarListaCompras: () => void;
  onRemoverSolicitacao: (id: string) => void;
  onOpenReceberModal: (produtoId: number, solicitacaoId: string) => void;
}

export const TabPurchases: React.FC<TabPurchasesProps> = ({
  solicitacoes,
  copiedList,
  onCopiarListaCompras,
  onRemoverSolicitacao,
  onOpenReceberModal,
}) => {
  return (
    <div style={{ background: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text)' }}>
            Lista de Solicitação de Compras ({solicitacoes.length} itens)
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            Itens solicitados pelos operadores na cabine para envio ao departamento de suprimentos.
          </p>
        </div>

        <button
          type="button"
          onClick={onCopiarListaCompras}
          disabled={solicitacoes.length === 0}
          style={{
            minHeight: '44px',
            padding: '0 20px',
            background: copiedList ? '#059669' : '#10B981',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-button)',
            fontSize: '14px',
            fontWeight: 700,
            cursor: solicitacoes.length === 0 ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            opacity: solicitacoes.length === 0 ? 0.5 : 1,
            fontFamily: 'inherit',
            transition: 'all 0.18s ease',
          }}
        >
          <ClipboardCopy size={16} strokeWidth={2.4} />
          <span>{copiedList ? '✓ Lista copiada!' : 'Copiar lista (WhatsApp / E-mail)'}</span>
        </button>
      </div>

      {solicitacoes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(var(--overlay-rgb), 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto',
              color: 'var(--text-muted)',
            }}
          >
            <ShoppingCart size={28} strokeWidth={2} />
          </div>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Nenhum insumo em solicitação de compra no momento.</p>
          <p style={{ margin: '4px 0 0', fontSize: '14px' }}>
            Acesse a aba de Estoque Físico e clique em "+ Pedir Reposição" nos itens necessários.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {solicitacoes.map((s, idx) => (
            <div
              key={s.id}
              style={{
                padding: '14px 18px',
                borderRadius: '10px',
                background: 'var(--card-hover)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 800,
                  }}
                >
                  {idx + 1}
                </span>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '16px', color: 'var(--text)' }}>{s.produtoNome}</strong>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: s.urgencia === 'alta' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: s.urgencia === 'alta' ? 'var(--tint-red)' : 'var(--tint-amber)',
                      }}
                    >
                      {s.urgencia === 'alta' ? 'Urgente' : 'Normal'}
                    </span>
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    Ref: {s.codigoProduto} • Qtd Sugerida: <strong>{s.quantidadeSugerida}</strong> • Solicitado por: {s.solicitadoPor}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const matchingProd =
                      MOCK_PRODUTOS.find(
                        (p) =>
                          p.id === s.produtoId ||
                          p.nome.toLowerCase().includes(s.produtoNome.toLowerCase()) ||
                          s.produtoNome.toLowerCase().includes(p.nome.replace(/^[0-9]+[º°]?\s*/, '').toLowerCase())
                      ) || MOCK_PRODUTOS[0];
                    onOpenReceberModal(matchingProd.id, s.id);
                  }}
                  style={{
                    minHeight: '38px',
                    padding: '0 14px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--ok-border)',
                    background: 'var(--ok-soft)',
                    color: 'var(--tint-green)',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: 'inherit',
                  }}
                  title="Dar entrada desta lata no estoque e concluir solicitação"
                >
                  <Plus size={15} strokeWidth={2.6} />
                  <span>Receber no estoque</span>
                </button>

                <button
                  type="button"
                  onClick={() => onRemoverSolicitacao(s.id)}
                  style={{
                    background: 'transparent',
                    border: '1px solid transparent',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 'var(--radius-button)',
                  }}
                  title="Remover da lista"
                >
                  <Trash2 size={18} strokeWidth={2.4} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
