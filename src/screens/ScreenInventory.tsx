import React, { useState } from 'react';
import {
  Boxes,
  Package,
  ShoppingCart,
  AlertCircle,
  RotateCcw,
  MapPin,
  Scale,
  Check,
  Plus,
  ClipboardCopy,
  Trash2,
  Search,
  FileText,
} from 'lucide-react';
import { Lote, Operador, ScreenId, ItemSolicitacaoCompra, Preparacao } from '../types';
import { CountNumber } from '../components/ui/CountNumber';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { ModalNewBatch } from './ModalNewBatch';
import { formatarStatusValidade } from '../domain/fefo';
import { MOCK_PRODUTOS } from '../data';

interface ScreenInventoryProps {
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

  // Métricas resumidas para os Stat Tiles do Estoque
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
        <>
          {/* Bento Stat Strip de Estoque com Rolagem Numérica (Stageshow Count + Stat Tiles) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '14px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>
                Saldo químico disponível
              </span>
              <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                <CountNumber value={Math.round(volumeTotalMl / 100)} format={(n) => `${(n / 10).toFixed(1).replace('.', ',')} L`} />
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Distribuído em {lotes.length} latas / galões
              </span>
            </div>

            <div
              style={{
                background: 'var(--card)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '14px',
                padding: '14px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>
                Latas abertas (giro FEFO)
              </span>
              <span style={{ fontSize: '26px', fontWeight: 800, color: '#fbbf24', whiteSpace: 'nowrap' }}>
                <CountNumber value={totalSobrasAtivas} format={(n) => `${Math.round(n)} latas`} />
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Prioridade de uso antes de galões lacrados
              </span>
            </div>

            <div
              style={{
                background: 'var(--card)',
                border: `1px solid ${totalCriticos > 0 ? 'rgba(239, 68, 68, 0.4)' : 'var(--border)'}`,
                borderRadius: '14px',
                padding: '14px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>
                Lotes em nível crítico (&lt;1L)
              </span>
              <span style={{ fontSize: '26px', fontWeight: 800, color: totalCriticos > 0 ? '#f87171' : '#4ade80', whiteSpace: 'nowrap' }}>
                <CountNumber value={totalCriticos} format={(n) => `${Math.round(n)} itens`} />
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {solicitacoes.length} pedido(s) ativo(s) em compras
              </span>
            </div>
          </div>

          {/* Filtros de Lista + Busca Rápida por Lote/Produto/Prateleira */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '16px',
            }}
          >
            <SegmentedControl<'todos' | 'criticos' | 'sobras'>
              ariaLabel="Filtrar lotes do estoque"
              size="sm"
              value={filtro}
              onChange={(val) => setFiltro(val)}
              options={[
                {
                  id: 'todos',
                  label: `Todos os lotes (${lotes.length})`,
                  tone: 'neutral',
                },
                {
                  id: 'criticos',
                  label: 'Estoque baixo / validade próxima',
                  icon: <AlertCircle size={14} strokeWidth={2.4} />,
                  tone: 'danger',
                },
                {
                  id: 'sobras',
                  label: 'Latas de sobras',
                  icon: <RotateCcw size={14} strokeWidth={2.4} />,
                  tone: 'warn',
                },
              ]}
            />

            <div
              style={{
                position: 'relative',
                flex: '1 1 280px',
                maxWidth: '380px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }}
              />
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar lote (#SY-...), produto ou prateleira..."
                style={{
                  width: '100%',
                  minHeight: '40px',
                  padding: '0 14px 0 36px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Grid de Cards de Estoque */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {lotesFiltrados.map((lote) => {
              const statusVal = formatarStatusValidade(lote.validade, lote.diasAberto);
              const isBaixo = lote.quantidadeAtual < 1000;
              const naListaCompras = solicitacoes.some((s) => s.produtoId === lote.produtoId);
              const prepOrigem = preparacoes.find((p) =>
                p.itensDevolucao.some(
                  (it) =>
                    it.loteSobraGeradoCodigo === lote.codigo || it.loteCodigo === lote.codigo
                )
              );

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

                    <div style={{ display: 'flex', gap: '18px', fontSize: '14px', color: 'var(--text-muted)', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} color="var(--primary)" strokeWidth={2.4} /> Localização: {lote.prateleira || 'Almoxarifado'}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Scale size={14} color="var(--primary)" strokeWidth={2.4} /> Saldo:{' '}
                        <strong style={{ color: isBaixo ? '#EF4444' : 'var(--primary)', fontWeight: 700 }}>
                          <CountNumber value={lote.quantidadeAtual} format={(n) => `${Math.round(n).toLocaleString('pt-BR')} ml`} />
                        </strong>
                        {isBaixo && ' (Estoque Baixo)'}
                      </span>
                      {(lote.codigo.includes('SOBRA') || prepOrigem) && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: 'rgba(59, 130, 246, 0.12)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            color: '#93c5fd',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          <FileText size={12} />
                          <span>
                            Origem:{' '}
                            {prepOrigem
                              ? `${prepOrigem.ordemServicoNumero} (${prepOrigem.ambienteNome}) • ${prepOrigem.operadorNome}`
                              : 'Sobra homologada FEFO (Cabine 01)'}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Medidor Visual de Nível do Galão (Stageshow Meter) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px', maxWidth: '420px' }}>
                      <div
                        style={{
                          flex: 1,
                          height: '7px',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(100, Math.max(6, Math.round((lote.quantidadeAtual / 3600) * 100)))}%`,
                            height: '100%',
                            background: isBaixo
                              ? '#EF4444'
                              : statusVal.nivel === 'urgente'
                              ? '#F59E0B'
                              : '#3B82F6',
                            transition: 'width 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', minWidth: '42px' }}>
                        {Math.min(100, Math.round((lote.quantidadeAtual / 3600) * 100))}%
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
                      {naListaCompras ? (
                        <>
                          <Check size={15} strokeWidth={2.6} /> Na Lista de Compras
                        </>
                      ) : (
                        <>
                          <Plus size={15} strokeWidth={2.6} /> Pedir Reposição
                        </>
                      )}
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
                  background: 'rgba(255, 255, 255, 0.05)',
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
                        setSelectedProdutoId(matchingProd.id);
                        setReceivingRequestId(s.id);
                        setIsNewBatchModalOpen(true);
                      }}
                      style={{
                        minHeight: '38px',
                        padding: '0 14px',
                        borderRadius: 'var(--radius-button)',
                        border: '1px solid var(--ok-border)',
                        background: 'var(--ok-soft)',
                        color: '#4ade80',
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
