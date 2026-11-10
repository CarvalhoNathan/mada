import React, { useState } from 'react';
import {
  Boxes,
  Package,
  ShoppingCart,
  Plus,
} from 'lucide-react';
import { Lote, Operador, ScreenId, ItemSolicitacaoCompra, Preparacao } from '../../types';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { ModalNewBatch } from '../../components/modals';
import { MOCK_PRODUTOS } from '../../data';
import { TabStockFEFO } from './TabStockFEFO';
import { TabPurchases } from './TabPurchases';

export interface ScreenInventoryProps {
  lotes: Lote[];
  operator: Operador;
  onNavigate: (screen: ScreenId) => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'warn' | 'danger') => void;
  solicitacoes: ItemSolicitacaoCompra[];
  preparacoes?: Preparacao[];
  onAdicionarSolicitacao: (item: Omit<ItemSolicitacaoCompra, 'id' | 'solicitadoEm'>) => void;
  onRemoverSolicitacao: (id: string) => void;
  onReceberNovoLote?: (novoLote: Omit<Lote, 'id'>) => Promise<void>;
}

const VOLUMES_ENTRADA = [900, 1000, 3600, 5000];

export const ScreenInventory: React.FC<ScreenInventoryProps> = ({
  lotes,
  operator,
  onNavigate,
  showToast,
  solicitacoes,
  preparacoes = [],
  onAdicionarSolicitacao,
  onRemoverSolicitacao,
  onReceberNovoLote,
}) => {
  const [filtro, setFiltro] = useState<'todos' | 'criticos' | 'sobras'>('todos');
  const [abaAtiva, setAbaAtiva] = useState<'estoque' | 'compras'>('estoque');
  const [busca, setBusca] = useState<string>('');

  // Estado do Modal de Entrada de Nova Lata / Nota Fiscal
  const [isNewBatchModalOpen, setIsNewBatchModalOpen] = useState(false);
  const [selectedProdutoId, setSelectedProdutoId] = useState<number>(MOCK_PRODUTOS[0].id);
  const [volumeEntrada, setVolumeEntrada] = useState<number>(3600);
  const [receivingRequestId, setReceivingRequestId] = useState<string | null>(null);
  const [copiedList, setCopiedList] = useState(false);
  const codigoLoteEntrada = `#SY-${8410 + lotes.length}`;

  const handleConfirmarEntradaLote = async () => {
    const prod = MOCK_PRODUTOS.find((p) => p.id === selectedProdutoId) || MOCK_PRODUTOS[0];
    const validadeDate = new Date();
    validadeDate.setMonth(validadeDate.getMonth() + 6);
    const validadeStr = validadeDate.toISOString().split('T')[0];

    if (onReceberNovoLote) {
      await onReceberNovoLote({
        produtoId: prod.id,
        produtoNome: prod.nome.replace(/^[0-9]+[º°]?\s*/, ''),
        codigo: codigoLoteEntrada,
        validade: validadeStr,
        diasAberto: 0,
        quantidadeAtual: volumeEntrada,
        statusUrgencia: 'normal',
        prateleira: prod.prateleiraPadrao,
      });
    }

    if (receivingRequestId) {
      onRemoverSolicitacao(receivingRequestId);
      setReceivingRequestId(null);
    }

    setIsNewBatchModalOpen(false);
    showToast(`✓ Entrada registrada: ${prod.nome} (${volumeEntrada.toLocaleString('pt-BR')} ml) no estoque!`, 'success');
  };

  // Filtra lotes por categoria + termo de busca rápida
  const lotesFiltrados = lotes.filter((l) => {
    if (filtro === 'sobras' && !(l.codigo.includes('SOBRA') || l.produtoNome.includes('Sobra'))) {
      return false;
    }
    if (filtro === 'criticos' && !(l.quantidadeAtual < 1000 || l.statusUrgencia === 'alta')) {
      return false;
    }
    if (busca.trim()) {
      const q = busca.trim().toLowerCase();
      const matchNome = l.produtoNome.toLowerCase().includes(q);
      const matchCod = l.codigo.toLowerCase().includes(q);
      const matchPrat = (l.prateleira || '').toLowerCase().includes(q);
      return matchNome || matchCod || matchPrat;
    }
    return true;
  });

  // Métricas resumidas
  const volumeTotalMl = lotes.reduce((acc, l) => acc + l.quantidadeAtual, 0);
  const totalCriticos = lotes.filter((l) => l.quantidadeAtual < 1000 || l.statusUrgencia === 'alta').length;
  const totalSobrasAtivas = lotes.filter((l) => l.codigo.includes('SOBRA') || (l.diasAberto ?? 0) > 0).length;

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

    showToast(`${lote.produtoNome} adicionado à lista de compras!`, 'success');
  };

  const handleCopiarListaCompras = () => {
    if (solicitacoes.length === 0) {
      showToast('A lista de solicitação de compras está vazia.', 'info');
      return;
    }

    const texto = [
      `SOLICITAÇÃO DE COMPRAS — MADA MARCENARIA (CABINE DE PINTURA)`,
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
      showToast('Lista copiada para a área de transferência! Cole no WhatsApp de Compras.', 'success');
    } else {
      showToast('Lista gerada com sucesso!', 'info');
    }

    setCopiedList(true);
    window.setTimeout(() => setCopiedList(false), 1800);
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '80px' }}>
      {/* 1. Barra de Topo da Gestão */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
          background: 'var(--card)',
          border: '1.5px solid var(--border)',
          borderRadius: '16px',
          padding: '18px 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Boxes size={24} strokeWidth={2.4} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--text)' }}>
              Gestão de Estoque & Solicitação de Compras
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '16px', color: 'var(--text-muted)' }}>
              Controle de frascos químicos, prioridade FEFO por validade e reposição de insumos.
            </p>
          </div>
        </div>

        {/* Ações e Abas Alternáveis */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setIsNewBatchModalOpen(true)}
            style={{
              minHeight: '52px',
              padding: '0 18px',
              borderRadius: '12px',
              border: '1.5px solid var(--primary)',
              background: 'var(--primary-soft)',
              color: 'var(--text)',
              fontWeight: 700,
              fontSize: '16px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'inherit',
            }}
          >
            <Plus size={18} strokeWidth={2.6} color="var(--primary)" />
            <span>Receber Nova Lata / NF</span>
          </button>

          <SegmentedControl<'estoque' | 'compras'>
            ariaLabel="Alternar aba de estoque e compras"
            value={abaAtiva}
            onChange={(val) => setAbaAtiva(val)}
            options={[
              {
                id: 'estoque',
                label: `Estoque Físico (${lotes.length})`,
                icon: <Package size={17} strokeWidth={2.4} />,
                tone: 'primary',
              },
              {
                id: 'compras',
                label: 'Lista de Compras',
                icon: <ShoppingCart size={17} strokeWidth={2.4} />,
                tone: 'ok',
                badge:
                  solicitacoes.length > 0 ? (
                    <span
                      style={{
                        background: '#EF4444',
                        color: '#fff',
                        borderRadius: 'var(--radius-badge)',
                        padding: '1px 7px',
                        fontSize: '12px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 800,
                      }}
                    >
                      {solicitacoes.length}
                    </span>
                  ) : undefined,
              },
            ]}
            style={{ background: 'var(--bg)' }}
          />
        </div>
      </div>

      {/* 2. Visualização: Aba de Estoque */}
      {abaAtiva === 'estoque' && (
        <TabStockFEFO
          lotes={lotes}
          lotesFiltrados={lotesFiltrados}
          volumeTotalMl={volumeTotalMl}
          totalSobrasAtivas={totalSobrasAtivas}
          totalCriticos={totalCriticos}
          solicitacoes={solicitacoes}
          preparacoes={preparacoes}
          filtro={filtro}
          busca={busca}
          onFiltroChange={setFiltro}
          onBuscaChange={setBusca}
          onPedirCompra={handlePedirCompra}
        />
      )}

      {/* 3. Visualização: Aba da Lista de Compras */}
      {abaAtiva === 'compras' && (
        <TabPurchases
          solicitacoes={solicitacoes}
          copiedList={copiedList}
          onCopiarListaCompras={handleCopiarListaCompras}
          onRemoverSolicitacao={onRemoverSolicitacao}
          onOpenReceberModal={(prodId, reqId) => {
            setSelectedProdutoId(prodId);
            setReceivingRequestId(reqId);
            setIsNewBatchModalOpen(true);
          }}
        />
      )}

      {/* Modal Tátil de Recebimento de Nova Lata / Nota Fiscal */}
      <ModalNewBatch
        isOpen={isNewBatchModalOpen}
        onClose={() => setIsNewBatchModalOpen(false)}
        selectedProdutoId={selectedProdutoId}
        onSelectProdutoId={setSelectedProdutoId}
        volumeEntrada={volumeEntrada}
        onSelectVolumeEntrada={setVolumeEntrada}
        codigoLoteEntrada={codigoLoteEntrada}
        onConfirmar={handleConfirmarEntradaLote}
        volumesDisponiveis={VOLUMES_ENTRADA}
      />

      {/* Barra Inferior Padronizada */}
      <footer className="os-bottom-bar-minimal">
        <div className="os-bottom-left">
          <button
            type="button"
            className="os-bar-btn os-btn-back"
            onClick={() => onNavigate('manager')}
          >
            ← Voltar ao Painel do Gestor
          </button>
        </div>
      </footer>
    </div>
  );
};
