import React from 'react';
import {
  AlertCircle,
  RotateCcw,
  Search,
  MapPin,
  Scale,
  FileText,
  Check,
  Plus,
} from 'lucide-react';
import { Lote, ItemSolicitacaoCompra, Preparacao } from '../../types';
import { CountNumber } from '../../components/ui/CountNumber';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { formatarStatusValidade } from '../../domain/fefo';

interface TabStockFEFOProps {
  lotes: Lote[];
  lotesFiltrados: Lote[];
  volumeTotalMl: number;
  totalSobrasAtivas: number;
  totalCriticos: number;
  solicitacoes: ItemSolicitacaoCompra[];
  preparacoes: Preparacao[];
  filtro: 'todos' | 'criticos' | 'sobras';
  busca: string;
  onFiltroChange: (filtro: 'todos' | 'criticos' | 'sobras') => void;
  onBuscaChange: (busca: string) => void;
  onPedirCompra: (lote: Lote) => void;
}

export const TabStockFEFO: React.FC<TabStockFEFOProps> = ({
  lotes,
  lotesFiltrados,
  volumeTotalMl,
  totalSobrasAtivas,
  totalCriticos,
  solicitacoes,
  preparacoes,
  filtro,
  busca,
  onFiltroChange,
  onBuscaChange,
  onPedirCompra,
}) => {
  return (
    <>
      {/* Bento Stat Strip de Estoque com Rolagem Numérica */}
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
          <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--tint-amber)', whiteSpace: 'nowrap' }}>
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
          <span style={{ fontSize: '26px', fontWeight: 800, color: totalCriticos > 0 ? 'var(--tint-red)' : 'var(--tint-green)', whiteSpace: 'nowrap' }}>
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
          onChange={onFiltroChange}
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
            onChange={(e) => onBuscaChange(e.target.value)}
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
                      color: statusVal.nivel === 'urgente' ? 'var(--tint-red)' : 'var(--tint-amber)',
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
                        color: 'var(--tint-blue-soft)',
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

                {/* Medidor Visual de Nível do Galão */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px', maxWidth: '420px' }}>
                  <div
                    style={{
                      flex: 1,
                      height: '7px',
                      borderRadius: '4px',
                      background: 'rgba(var(--overlay-rgb), 0.08)',
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
                  onClick={() => onPedirCompra(lote)}
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
  );
};
