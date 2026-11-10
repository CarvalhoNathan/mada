import { useState, useCallback } from 'react';
import { ItemSolicitacaoCompra, Lote } from '../types';
import { MOCK_PRODUTOS } from '../data';

const STORAGE_KEY = 'mada_solicitacoes_compras';

const INITIAL_REQUESTS: ItemSolicitacaoCompra[] = [
  {
    id: 'sc-1',
    produtoId: 2,
    produtoNome: '2º Catalisador PU Médio',
    codigoProduto: '#SY-7410',
    quantidadeSugerida: '2 galões de 3,6L',
    motivo: 'estoque_critico',
    urgencia: 'alta',
    solicitadoEm: new Date().toISOString(),
    solicitadoPor: 'Carlos Silva',
  },
];

export function usePurchasesRequests(
  operatorName: string,
  showToast: (msg: string, type?: 'info' | 'success' | 'warn' | 'danger') => void
) {
  const [solicitacoesCompras, setSolicitacoesCompras] = useState<ItemSolicitacaoCompra[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignora erro
    }
    return INITIAL_REQUESTS;
  });

  const handleAdicionarSolicitacao = useCallback(
    (item: Omit<ItemSolicitacaoCompra, 'id' | 'solicitadoEm'>) => {
      const nova: ItemSolicitacaoCompra = {
        ...item,
        id: `sc-${Date.now()}`,
        solicitadoEm: new Date().toISOString(),
      };
      setSolicitacoesCompras((prev) => {
        const atualizada = [nova, ...prev];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizada));
        return atualizada;
      });
    },
    []
  );

  const handleRemoverSolicitacao = useCallback(
    (id: string) => {
      setSolicitacoesCompras((prev) => {
        const filtrada = prev.filter((s) => s.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtrada));
        return filtrada;
      });
      showToast('Item removido da lista de compras.', 'info');
    },
    [showToast]
  );

  const verificarReposicaoAutomaticaEstoque = useCallback(
    (lotesAtuais: Lote[]) => {
      const saldosPorProduto: Record<number, number> = {};
      MOCK_PRODUTOS.forEach((p) => {
        saldosPorProduto[p.id] = 0;
      });
      lotesAtuais.forEach((l) => {
        saldosPorProduto[l.produtoId] = (saldosPorProduto[l.produtoId] || 0) + l.quantidadeAtual;
      });

      const novosAlertas: string[] = [];
      setSolicitacoesCompras((prev) => {
        let atualizada = [...prev];
        for (const prod of MOCK_PRODUTOS) {
          const saldoTotal = saldosPorProduto[prod.id] || 0;
          const jaSolicitado = atualizada.some((s) => s.produtoId === prod.id);
          if (saldoTotal < 1000 && !jaSolicitado) {
            const novaSolicitacao: ItemSolicitacaoCompra = {
              id: `sc-auto-${prod.id}-${Date.now()}`,
              produtoId: prod.id,
              produtoNome: prod.nome,
              codigoProduto: prod.codigo,
              quantidadeSugerida: saldoTotal === 0 ? '3 galões de 3,6L (Urgente)' : '2 galões de 3,6L',
              motivo: 'estoque_critico',
              urgencia: 'alta',
              solicitadoEm: new Date().toISOString(),
              solicitadoPor: `Automático (${operatorName})`,
            };
            atualizada = [novaSolicitacao, ...atualizada];
            novosAlertas.push(`${prod.nome} (${saldoTotal} ml)`);
          }
        }
        if (atualizada.length !== prev.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizada));
        }
        return atualizada;
      });

      if (novosAlertas.length > 0) {
        setTimeout(() => {
          showToast(
            `⚠ Estoque crítico (< 1.000 ml): Solicitação de compra gerada automaticamente para ${novosAlertas.join(', ')}.`,
            'warn'
          );
        }, 400);
      }
    },
    [operatorName, showToast]
  );

  return {
    solicitacoesCompras,
    handleAdicionarSolicitacao,
    handleRemoverSolicitacao,
    verificarReposicaoAutomaticaEstoque,
  };
}
