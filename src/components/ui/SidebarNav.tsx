import React from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SidebarNavProps {
  items: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  brandTitle?: string;
  brandSubtitle?: string;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  items,
  activeId,
  onSelect,
  brandTitle = 'Gerenciador de Químicos',
  brandSubtitle = 'Painel de Gerência'
}) => {
  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: 'var(--card)',
        borderRight: '1.5px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        padding: 'var(--space-24) var(--space-16)'
      }}
    >
      <div style={{ marginBottom: 'var(--space-32)', padding: '0 var(--space-8)' }}>
        <h2 style={{ fontSize: 'var(--fs-h2)', color: 'var(--text)', margin: 0 }}>
          {brandTitle}
        </h2>
        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          {brandSubtitle}
        </span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', flex: 1 }}>
        {items.map(item => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-16)',
                padding: 'var(--space-16)',
                borderRadius: 'var(--radius-card)',
                backgroundColor: isActive ? 'var(--primary-soft)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text)',
                border: isActive ? '1.5px solid var(--primary)' : '1.5px solid transparent',
                fontSize: '16px',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              {item.icon && <span>{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
