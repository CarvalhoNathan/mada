import React from 'react';
import { Layers, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { BeakerVisualizer3D, LiquidLayer } from './BeakerVisualizer3D';

interface ModalBatelada3DProps {
  isOpen: boolean;
  onClose: () => void;
  layers: LiquidLayer[];
  totalTargetMl: number;
  totalDosedMl: number;
  receitaNome: string;
  osNumero: string;
}

export const ModalBatelada3D: React.FC<ModalBatelada3DProps> = ({
  isOpen,
  onClose,
  layers,
  totalTargetMl,
  totalDosedMl,
  receitaNome,
  osNumero,
}) => {
  if (!isOpen) return null;

  const pct = totalTargetMl > 0 ? Math.round((totalDosedMl / totalTargetMl) * 100) : 0;
  const hasExceeded = layers.some((l) => l.isExceeded);

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(5, 10, 20, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Cabeçalho */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa',
              }}
            >
              <Layers size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f8fafc' }}>
                Visor Volumétrico 3D da Mistura
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                {osNumero} • {receitaNome}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar visor 3D"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '20px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo Principal: Canvas 3D + Telemetria de Camadas */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.2fr',
            gap: '20px',
            padding: '24px',
            alignItems: 'center',
          }}
        >
          {/* Renderizador Three.js do Béquer Graduado */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              padding: '12px',
            }}
          >
            <BeakerVisualizer3D
              layers={layers}
              totalCapacityMl={Math.max(totalTargetMl * 1.2, 1000)}
              height={300}
              width={260}
              autoRotate={true}
              showLabels={false}
              isExceeded={hasExceeded}
            />
            <span style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
              ✦ Rotação automática • Nível físico real
            </span>
          </div>

          {/* Lista Telemetria das Camadas Físicas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: hasExceeded
                  ? 'rgba(239, 68, 68, 0.15)'
                  : pct >= 100
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(59, 130, 246, 0.12)',
                border: `1px solid ${
                  hasExceeded
                    ? '#ef4444'
                    : pct >= 100
                    ? '#10b981'
                    : 'rgba(59, 130, 246, 0.3)'
                }`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {hasExceeded ? (
                  <AlertTriangle size={22} color="#ef4444" />
                ) : pct >= 100 ? (
                  <CheckCircle2 size={22} color="#10b981" />
                ) : (
                  <Layers size={22} color="#60a5fa" />
                )}
                <div>
                  <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8' }}>
                    Volume Total Acumulado
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc' }}>
                    {Math.round(totalDosedMl).toLocaleString('pt-BR')} ml{' '}
                    <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 400 }}>
                      / {Math.round(totalTargetMl).toLocaleString('pt-BR')} ml ({pct}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Itens e Camadas Empilhadas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {layers.map((layer) => {
                const layerPct = layer.target > 0 ? Math.round((layer.volume / layer.target) * 100) : 0;
                return (
                  <div
                    key={layer.id}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(30, 41, 59, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '3px',
                          backgroundColor:
                            layer.role === 'base'
                              ? '#3b82f6'
                              : layer.role === 'catalisador'
                              ? '#f59e0b'
                              : layer.role === 'diluidor'
                              ? '#06b6d4'
                              : '#8b5cf6',
                          display: 'inline-block',
                        }}
                      />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#f1f5f9' }}>
                          {layer.label}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'capitalize' }}>
                          {layer.role}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: layer.isExceeded ? '#ef4444' : '#f8fafc',
                        }}
                      >
                        {Math.round(layer.volume)} ml
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Meta: {Math.round(layer.target)} ml ({layerPct}%)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rodapé com botão de fechar tátil para tablet */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '12px 28px',
              borderRadius: '8px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '15px',
              border: 'none',
              cursor: 'pointer',
              minWidth: '160px',
            }}
          >
            Voltar à Balança
          </button>
        </div>
      </div>
    </div>
  );
};
