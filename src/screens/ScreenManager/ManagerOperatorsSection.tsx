import React from 'react';
import { Users, UserPlus, ShieldCheck } from 'lucide-react';
import { Operador } from '../../types';

interface ManagerOperatorsSectionProps {
  operators: Operador[];
  onOpenNewOperatorModal: () => void;
}

export const ManagerOperatorsSection: React.FC<ManagerOperatorsSectionProps> = ({
  operators,
  onOpenNewOperatorModal,
}) => {
  return (
    <section
      aria-label="Gestão de Operadores"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '24px 28px',
        marginBottom: '24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.14)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: 'var(--tint-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: 'var(--text)' }}>
              Equipe de Operadores ({operators.length})
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '16px', color: 'var(--text-muted)' }}>
              Perfis habilitados para autenticação por PIN nas cabines de pintura.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenNewOperatorModal}
          style={{
            minHeight: '64px',
            padding: '0 22px',
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            border: 'none',
            borderRadius: '12px',
            fontSize: '17px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontFamily: 'inherit',
          }}
        >
          <UserPlus size={20} strokeWidth={2.4} />
          Novo Operador
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '16px',
        }}
      >
        {operators.map((op) => {
          const nome = op.nome || op.name || 'Operador';
          const papel = op.papel || op.role || 'Operador de Pintura';
          const initials = nome
            .trim()
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase() || '')
            .join('');

          return (
            <div
              key={op.id}
              style={{
                background: 'var(--bg)',
                border: '1.5px solid var(--border)',
                borderRadius: '14px',
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '999px',
                  background: 'rgba(59, 130, 246, 0.18)',
                  border: '1.5px solid rgba(59, 130, 246, 0.35)',
                  color: 'var(--tint-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '17px',
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {initials || 'OP'}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: '17px',
                    fontWeight: 700,
                    color: 'var(--text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {nome}
                </div>
                <div
                  style={{
                    fontSize: '16px',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginTop: '2px',
                  }}
                >
                  {papel}
                </div>
              </div>

              <span
                title="Acesso por PIN ativo"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  borderRadius: '999px',
                  background: 'rgba(34, 197, 94, 0.14)',
                  border: '1px solid rgba(34, 197, 94, 0.32)',
                  color: 'var(--ok)',
                  fontSize: '16px',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={16} />
                PIN
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
