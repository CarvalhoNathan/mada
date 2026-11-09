import React, { useState } from 'react';
import { AlertOctagon, Beaker, SprayCan, Package, Check, X, History } from 'lucide-react';
import { LocalMistura, Preparacao, ResiduoMisturaOcorrencia } from '../types';
import { Button } from '../components/ui/Button';
import { ORIENTACAO_NEUTRA_POT_LIFE_EXPIRADO } from '../domain/potLife';

interface ModalOcorrenciaMisturaProps {
  isOpen: boolean;
  onClose: () => void;
  preparacao: Preparacao | null;
  historicoOcorrencias: ResiduoMisturaOcorrencia[];
  onConfirmarRegistro: (dados: {
    localMistura: LocalMistura;
    quantidadeRestanteMl?: number;
    ocorrenciaRelacionada: string;
    procedimentoAdotado?: string;
  }) => Promise<void>;
}

const LOCAIS_MISTURA: {
  id: LocalMistura;
  label: string;
  sublabel: string;
}[] = [
  {
    id: 'pistola',
    label: 'Na Pistola de Pintura',
    sublabel: 'Caneca / bico do equipamento',
  },
  {
    id: 'bequer',
    label: 'No Béquer Graduado',
    sublabel: 'Recipiente de dosagem na bancada',
  },
  {
    id: 'outro_recipiente',
    label: 'Em Outro Recipiente',
    sublabel: 'Caneca auxiliar ou tanque de pressão',
  },
];

const DESCRICOES_RAPIDAS: string[] = [
  'Tempo de Pot Life ultrapassado durante operação na cabine',
  'Sobra de mistura catalisada após término de peças do lote',
  'Interrupção operacional na cabine com mistura pronta no equipamento',
  'Variação de viscosidade observada pelo pintor durante aplicação',
];

export const ModalOcorrenciaMistura: React.FC<ModalOcorrenciaMisturaProps> = ({
  isOpen,
  onClose,
  preparacao,
  historicoOcorrencias,
  onConfirmarRegistro,
}) => {
  const [localMistura, setLocalMistura] = useState<LocalMistura>('pistola');
  const [quantidadeRestanteMl, setQuantidadeRestanteMl] = useState<number>(200);
  const [quantidadeConhecida, setQuantidadeConhecida] = useState<boolean>(true);
  const [ocorrenciaRelacionada, setOcorrenciaRelacionada] = useState<string>(
    DESCRICOES_RAPIDAS[0]
  );
  const [procedimentoAdotado, setProcedimentoAdotado] = useState<string>('');
  const [salvando, setSalvando] = useState<boolean>(false);

  if (!isOpen || !preparacao) return null;

  const maxVolume = Math.max(100, preparacao.volumeTotal || 1000);
  const isPotLifeExpirado =
    preparacao.statusPotLife === 'POT_LIFE_EXPIRADO' ||
    preparacao.status === 'POT_LIFE_EXPIRADO' ||
    Boolean(preparacao.potLifeExpiradoEm);

  const handleSalvar = async () => {
    if (salvando) return;
    setSalvando(true);
    try {
      await onConfirmarRegistro({
        localMistura,
        quantidadeRestanteMl: quantidadeConhecida ? quantidadeRestanteMl : undefined,
        ocorrenciaRelacionada,
        procedimentoAdotado: procedimentoAdotado.trim() || undefined,
      });
      onClose();
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className="ds-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-ocorrencia-mistura-title"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(6px)',
        padding: '16px',
      }}
    >
      <div
        className="ds-modal-card ds-modal-standard"
        style={{
          maxWidth: '740px',
          width: '94%',
          maxHeight: '88vh',
          overflowY: 'auto',
          borderRadius: '18px',
          backgroundColor: '#141519',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75)',
          padding: '20px 24px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: isPotLifeExpirado
                  ? 'rgba(239, 68, 68, 0.2)'
                  : 'rgba(245, 158, 11, 0.2)',
                border: `1.5px solid ${isPotLifeExpirado ? '#EF4444' : '#F59E0B'}`,
                color: isPotLifeExpirado ? '#FCA5A5' : '#FDE68A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertOctagon size={24} />
            </div>
            <div>
              <h2
                id="modal-ocorrencia-mistura-title"
                style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: 'var(--text)' }}
              >
                Registro de Ocorrência / Resíduo da Mistura Pronta
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
                {preparacao.ordemServicoNumero} • {preparacao.receitaNome} • Preparação{' '}
                <strong>{preparacao.id}</strong> ({preparacao.cabineNome || 'Cabine 01'})
              </p>
            </div>
          </div>

          <button
            type="button"
            className="ds-modal-close-btn"
            onClick={onClose}
            aria-label="Fechar modal"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'var(--card)',
              color: 'var(--text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Orientação Neutra Obrigatória */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            background: isPotLifeExpirado
              ? 'rgba(239, 68, 68, 0.14)'
              : 'rgba(245, 158, 11, 0.14)',
            border: `1.5px solid ${
              isPotLifeExpirado ? 'rgba(239, 68, 68, 0.45)' : 'rgba(245, 158, 11, 0.45)'
            }`,
            color: isPotLifeExpirado ? '#FCA5A5' : '#FDE68A',
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '14px',
            lineHeight: 1.45,
          }}
        >
          {ORIENTACAO_NEUTRA_POT_LIFE_EXPIRADO}
        </div>

        {/* 1. Onde se encontra a mistura pronta? */}
        <div style={{ marginBottom: '14px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '15px',
              fontWeight: 700,
              color: 'var(--text)',
              marginBottom: '8px',
            }}
          >
            1. Onde se encontra a mistura catalisada?
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {LOCAIS_MISTURA.map((loc) => {
              const selecionado = localMistura === loc.id;
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setLocalMistura(loc.id)}
                  style={{
                    minHeight: '64px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: selecionado ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                    background: selecionado ? 'rgba(59, 130, 246, 0.16)' : 'var(--bg)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: '4px',
                    fontFamily: 'inherit',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 700,
                      fontSize: '14px',
                    }}
                  >
                    {loc.id === 'pistola' ? (
                      <SprayCan size={17} />
                    ) : loc.id === 'bequer' ? (
                      <Beaker size={17} />
                    ) : (
                      <Package size={17} />
                    )}
                    <span>{loc.label}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {loc.sublabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Quantidade restante da mistura (quando conhecida) */}
        <div style={{ marginBottom: '14px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
              2. Quantidade restante da mistura:
            </span>
            <button
              type="button"
              onClick={() => setQuantidadeConhecida((prev) => !prev)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: quantidadeConhecida ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg)',
                color: quantidadeConhecida ? '#6EE7B7' : 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {quantidadeConhecida
                ? '✓ Quantidade estimada conhecida'
                : 'Quantidade não informada'}
            </button>
          </div>

          {quantidadeConhecida && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'var(--bg)',
                padding: '8px 16px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
              }}
            >
              <button
                type="button"
                className="btn-stepper-round"
                onClick={() => setQuantidadeRestanteMl((v) => Math.max(0, v - 50))}
                aria-label="Diminuir 50ml"
              >
                −
              </button>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <strong
                  style={{
                    fontSize: '20px',
                    color: 'var(--text)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {quantidadeRestanteMl} ml
                </strong>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>
                  de {preparacao.volumeTotal} ml preparados na mistura
                </span>
              </div>
              <button
                type="button"
                className="btn-stepper-round"
                onClick={() => setQuantidadeRestanteMl((v) => Math.min(maxVolume, v + 50))}
                aria-label="Aumentar 50ml"
              >
                +
              </button>
            </div>
          )}
        </div>

        {/* 3. Ocorrência relacionada */}
        <div style={{ marginBottom: '14px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '15px',
              fontWeight: 700,
              color: 'var(--text)',
              marginBottom: '8px',
            }}
          >
            3. Motivo / Ocorrência relacionada à mistura:
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              marginBottom: '8px',
            }}
          >
            {DESCRICOES_RAPIDAS.map((desc) => {
              const ativo = ocorrenciaRelacionada === desc;
              return (
                <button
                  key={desc}
                  type="button"
                  onClick={() => setOcorrenciaRelacionada(desc)}
                  style={{
                    minHeight: '44px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: ativo ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: ativo ? 'rgba(59, 130, 246, 0.16)' : 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '13px',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {desc}
                </button>
              );
            })}
          </div>
          <input
            type="text"
            value={ocorrenciaRelacionada}
            onChange={(e) => setOcorrenciaRelacionada(e.target.value)}
            placeholder="Descreva a ocorrência observada na mistura..."
            style={{
              width: '100%',
              minHeight: '44px',
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* 4. Procedimento adotado (opcional, quando validado pela empresa) */}
        <div style={{ marginBottom: '14px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              marginBottom: '6px',
            }}
          >
            4. Destinação ou procedimento adotado (opcional • conforme orientação interna da empresa):
          </label>
          <input
            type="text"
            value={procedimentoAdotado}
            onChange={(e) => setProcedimentoAdotado(e.target.value)}
            placeholder="Informe caso haja orientação do responsável técnico / procedimento validado..."
            style={{
              width: '100%',
              minHeight: '42px',
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Histórico recente de ocorrências desta preparação */}
        {historicoOcorrencias.length > 0 && (
          <div
            style={{
              marginBottom: '14px',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '6px',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text)',
              }}
            >
              <History size={15} />
              <span>Histórico de Ocorrências Registradas ({historicoOcorrencias.length})</span>
            </div>
            {historicoOcorrencias.slice(0, 2).map((oc) => (
              <div
                key={oc.id}
                style={{
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  padding: '4px 0',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <strong>
                  {new Date(oc.registradaEm).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </strong>{' '}
                • Local: <strong>{oc.localMistura.toUpperCase()}</strong> •{' '}
                {oc.quantidadeRestanteMl !== undefined ? `${oc.quantidadeRestanteMl} ml • ` : ''}
                {oc.ocorrenciaRelacionada}
              </div>
            ))}
          </div>
        )}

        {/* Rodapé de Ações */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="md" onClick={handleSalvar} disabled={salvando}>
            <Check size={18} />
            <span>Registrar Ocorrência da Mistura</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
