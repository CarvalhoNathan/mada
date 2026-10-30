import React, { useState } from 'react';
import { Lote, Operador, ScreenId, ItemSolicitacaoCompra } from '../types';
import { Button } from '../components/ui/Button';
import { formatarStatusValidade } from '../domain/fefo';

interface ScreenInventoryProps {
  lotes: Lote[];
  operator: Operador;
  onNavigate: (screen: ScreenId) => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'warn' | 'danger') => void;
  solicitacoes: ItemSolicitacaoCompra[];
  onAdicionarSolicitacao: (item: Omit<ItemSolicitacaoCompra, 'id' | 'solicitadoEm'>) => void;
  onRemoverSolicitacao: (id: string) => void;
}

export const ScreenInventory: React.FC<ScreenInventoryProps> = ({
  lotes,
  operator,
  onNavigate,
  showToast,
  solicitacoes,
  onAdicionarSolicitacao,
  onRemoverSolicitacao,
}) => {
  const [filtro, setFiltro] = useState<'todos' | 'criticos' | 'sobras'>('todos');
  const [abaAtiva, setAbaAtiva] = useState<'estoque' | 'compras'>('estoque');

  // Filtra lotes
  const lotesFiltrados = lotes.filter((l) => {
    if (filtro === 'sobras') return l.codigo.includes('SOBRA') || l.produtoNome.includes('Sobra');
    if (filtro === 'criticos') return l.quantidadeAtual < 1000 || l.statusUrgencia === 'alta';
    return true;
  });

  const handlePedirCompra = (lote: Lote) => {
    const jaExiste = solicitacoes.some((s) => s.produtoId === lote.produtoId);
    if (jaExiste) {
      showToast(`${lote.produtoNome} já está na lista de compras!`, 'info');
      setAbaAtiva('compras');
      return;
    }

    onAdicionarSolicitacao({
      produtoId: lote.produtoId,
      produtoNome: lote.produtoNome,
      codigoProduto: lote.codigo,
      quantidadeSugerida: '1 galão (3,6L) ou 4 latas de 900ml',
      motivo: lote.quantidadeAtual < 1000 ? 'estoque_critico' : 'demanda_os',
      urgencia: lote.quantidadeAtual < 500 ? 'alta' : 'media',
      solicitadoPor: operator.nome,
    });

    showToast(`✓ ${lote.produtoNome} adicionado à lista de compras!`, 'success');
  };

  const handleCopiarListaCompras = () => {
    if (solicitacoes.length === 0) {
      showToast('A lista de solicitação de compras está vazia.', 'info');
      return;
    }

    const texto = [
      `📋 SOLICITAÇÃO DE COMPRAS — MADA MARCENARIA (CABINE DE PINTURA)`,
      `Data: ${new Date().toLocaleDateString('pt-BR')} • Solicitante: ${operator.nome}`,
      `----------------------------------------------------`,
      ...solicitacoes.map(
        (s, idx) =>
          `${idx + 1}. [${s.urgencia === 'alta' ? 'URGENTE' : 'NORMAL'}] ${s.produtoNome} (Ref: ${s.codigoProduto})\n   Qtd Sugerida: ${s.quantidadeSugerida}`
      ),
      `----------------------------------------------------`,
      `Total: ${solicitacoes.length} item(ns) solicitado(s).`,
    ].join('\n');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(texto);
      showToast('✓ Lista copiada para a área de transferência! Cole no WhatsApp de Compras.', 'success');
    } else {
      showToast('Lista gerada com sucesso!', 'info');
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '80px' }}>
      {/* 1. Barra de Topo da Gestão */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '16px 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
            }}
          >
            📦
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>
              Gestão de Estoque & Solicitação de Compras
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
              Controle de frascos químicos, prioridade FEFO por validade e reposição de insumos.
            </p>
          </div>
        </div>

        {/* Abas Alternáveis */}
        <div style={{ display: 'flex', gap: '8px', background: 'var(--card-hover)', padding: '4px', borderRadius: '10px' }}>
          <button
            type="button"
            onClick={() => setAbaAtiva('estoque')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              background: abaAtiva === 'estoque' ? 'var(--primary)' : 'transparent',
              color: abaAtiva === 'estoque' ? '#fff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            📦 Estoque Físico ({lotes.length})
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva('compras')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              background: abaAtiva === 'compras' ? '#10B981' : 'transparent',
              color: abaAtiva === 'compras' ? '#fff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            🛒 Lista de Compras
            {solicitacoes.length > 0 && (
              <span
                style={{
                  background: '#EF4444',
                  color: '#fff',
                  borderRadius: '12px',
                  padding: '1px 7px',
                  fontSize: '11px',
                  fontWeight: 800,
                }}
              >
                {solicitacoes.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Visualização: Aba de Estoque */}
      {abaAtiva === 'estoque' && (
        <>
          {/* Filtros de Lista */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setFiltro('todos')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: filtro === 'todos' ? 'var(--card-hover)' : 'transparent',
                color: filtro === 'todos' ? 'var(--text)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Todos os Lotes ({lotes.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltro('criticos')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: filtro === 'criticos' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                color: filtro === 'criticos' ? '#EF4444' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              ⚠️ Estoque Baixo / Validade Próxima
            </button>
            <button
              type="button"
              onClick={() => setFiltro('sobras')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: filtro === 'sobras' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                color: filtro === 'sobras' ? '#F59E0B' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              ♻️ Latas de Sobras
            </button>
          </div>

          {/* Grid de Cards de Estoque */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {lotesFiltrados.map((lote) => {
              const statusVal = formatarStatusValidade(lote.validade, lote.diasAberto);
              const isBaixo = lote.quantidadeAtual < 1000;
              const naListaCompras = solicitacoes.some((s) => s.produtoId === lote.produtoId);

              return (
                <div
                  key={lote.id || lote.codigo}
                  style={{
                    background: 'var(--card)',
                    border: `1px solid ${isBaixo ? 'rgba(239, 68, 68, 0.4)' : 'var(--border)'}`,
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '16px', color: 'var(--text)' }}>
                        {lote.produtoNome}
                      </strong>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          background: 'var(--card-hover)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        {lote.codigo}
                      </span>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          background:
                            statusVal.nivel === 'urgente'
                              ? 'rgba(239, 68, 68, 0.2)'
                              : 'rgba(245, 158, 11, 0.2)',
                          color: statusVal.nivel === 'urgente' ? '#f87171' : '#fbbf24',
                          border: `1px solid ${statusVal.nivel === 'urgente' ? '#ef4444' : '#f59e0b'}`,
                        }}
                      >
                        {statusVal.rotulo}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '18px', fontSize: '14px', color: 'var(--text-muted)' }}>
                      <span>📍 Localização: {lote.prateleira || 'Almoxarifado'}</span>
                      <span>
                        📊 Saldo:{' '}
                        <strong style={{ color: isBaixo ? '#EF4444' : 'var(--primary)', fontWeight: 700 }}>
                          {lote.quantidadeAtual.toLocaleString('pt-BR')} ml
                        </strong>
                        {isBaixo && ' (Estoque Baixo)'}
                      </span>
                    </div>
                  </div>

                  {/* Ação de Reposição / Compra */}
                  <div>
                    <button
                      type="button"
                      onClick={() => handlePedirCompra(lote)}
                      disabled={naListaCompras}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '10px',
                        border: naListaCompras ? '1px solid #10B981' : '1px solid var(--primary)',
                        background: naListaCompras ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: naListaCompras ? '#10B981' : 'var(--primary)',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: naListaCompras ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {naListaCompras ? '✓ Na Lista de Compras' : '+ Pedir Reposição'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 3. Visualização: Aba da Lista de Compras */}
      {abaAtiva === 'compras' && (
        <div style={{ background: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
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
              onClick={handleCopiarListaCompras}
              disabled={solicitacoes.length === 0}
              style={{
                padding: '10px 20px',
                background: '#10B981',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: solicitacoes.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: solicitacoes.length === 0 ? 0.5 : 1,
              }}
            >
              📋 Copiar Lista (WhatsApp / E-mail)
            </button>
          </div>

          {solicitacoes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>🛒</div>
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
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        color: '#fff',
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
                            color: s.urgencia === 'alta' ? '#f87171' : '#fbbf24',
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

                  <button
                    type="button"
                    onClick={() => onRemoverSolicitacao(s.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--danger)',
                      fontSize: '18px',
                      cursor: 'pointer',
                      padding: '6px 12px',
                    }}
                    title="Remover da lista"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Barra Inferior */}
      <footer className="ds-bottom-bar">
        <div className="ds-bottom-bar-left">
          <Button variant="secondary" size="md" onClick={() => onNavigate('dashboard')}>
            ← Voltar ao Início
          </Button>
        </div>
        <div className="ds-bottom-bar-right">
          <Button variant="primary" size="md" onClick={() => onNavigate('os')}>
            Nova Preparação →
          </Button>
        </div>
      </footer>
    </div>
  );
};
