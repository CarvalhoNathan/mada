import React, { useState } from 'react';
import { UserPlus, X, Delete, Check } from 'lucide-react';
import { Operador } from '../../types';

interface ModalNewOperatorProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (operador: Omit<Operador, 'id'>) => Promise<void> | void;
  showToast: (msg: string, type?: 'info' | 'success' | 'warn' | 'danger') => void;
}

const CARGOS_SUGERIDOS = [
  'Pintor Líder',
  'Aplicador PU',
  'Auxiliar de Cabine',
  'Preparador de Superfície',
];

const CABINES_OPCOES = [
  { id: 'CABINE-01', nome: 'Cabine 01' },
  { id: 'CABINE-02', nome: 'Cabine 02' },
];

const DIGITOS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

export const ModalNewOperator: React.FC<ModalNewOperatorProps> = ({
  isOpen,
  onClose,
  onConfirm,
  showToast,
}) => {
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState('Aplicador PU');
  const [cabineId, setCabineId] = useState('CABINE-01');
  const [pin, setPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const cabineSelecionada = CABINES_OPCOES.find((c) => c.id === cabineId) || CABINES_OPCOES[0];

  const handleAppendDigit = (digit: string) => {
    setPin((prev) => (prev.length < 4 ? `${prev}${digit}` : prev));
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClearPin = () => {
    setPin('');
  };

  const handleResetAndClose = () => {
    setNome('');
    setCargo('Aplicador PU');
    setCabineId('CABINE-01');
    setPin('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nomeLimpo = nome.trim();
    const cargoLimpo = cargo.trim();

    if (nomeLimpo.length < 2) {
      showToast('Informe o nome completo do operador.', 'warn');
      return;
    }
    if (!cargoLimpo) {
      showToast('Selecione ou informe a função do operador.', 'warn');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      showToast('Defina um PIN numérico de 4 dígitos para o operador.', 'warn');
      return;
    }

    setIsSaving(true);
    try {
      await onConfirm({
        nome: nomeLimpo,
        papel: `${cargoLimpo} • ${cabineSelecionada.nome}`,
        cabineId: cabineSelecionada.id,
        cabineNome: cabineSelecionada.nome,
        avatar: '',
        pin,
      });
      handleResetAndClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao cadastrar operador.', 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="ds-modal-overlay active"
      role="dialog"
      aria-modal="true"
      aria-label="Cadastrar Novo Operador"
    >
      <div className="ds-modal-card" style={{ maxWidth: '760px', width: '95%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(59, 130, 246, 0.16)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                color: 'var(--tint-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserPlus size={24} />
            </div>
            <div>
              <h3 className="ds-modal-title" style={{ fontSize: '22px', margin: 0 }}>
                Cadastrar Novo Operador
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '16px', color: 'var(--text-muted)' }}>
                O operador ficará disponível imediatamente na tela de login por PIN.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            className="os-bar-btn os-btn-back"
            style={{ minHeight: '64px', minWidth: '64px', padding: '0 18px' }}
            aria-label="Fechar modal"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
            {/* Coluna Esquerda: Nome, Função e Cabine */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                  1. Nome do Operador
                </span>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: João Mendes"
                  autoFocus
                  style={{
                    minHeight: '58px',
                    padding: '0 16px',
                    borderRadius: '12px',
                    border: '1.5px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '18px',
                    fontWeight: 600,
                    fontFamily: 'inherit',
                  }}
                />
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                  2. Função na Cabine
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {CARGOS_SUGERIDOS.map((item) => {
                    const isSelected = cargo === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCargo(item)}
                        style={{
                          minHeight: '64px',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                          background: isSelected ? 'var(--primary-soft)' : 'var(--bg)',
                          color: 'var(--text)',
                          fontSize: '16px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontFamily: 'inherit',
                        }}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                  3. Cabine Padrão
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {CABINES_OPCOES.map((cabine) => {
                    const isSelected = cabineId === cabine.id;
                    return (
                      <button
                        key={cabine.id}
                        type="button"
                        onClick={() => setCabineId(cabine.id)}
                        style={{
                          minHeight: '64px',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                          background: isSelected ? 'var(--primary-soft)' : 'var(--bg)',
                          color: 'var(--text)',
                          fontSize: '17px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        {cabine.nome}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Coluna Direita: PIN Touch de 4 dígitos */}
            <div
              style={{
                background: 'var(--bg)',
                border: '1.5px solid var(--border)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                  4. PIN de Acesso (4 dígitos)
                </span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)' }}>
                  {pin.length}/4
                </span>
              </div>

              {/* Visor dos 4 dígitos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {[0, 1, 2, 3].map((idx) => {
                  const char = pin[idx];
                  return (
                    <div
                      key={idx}
                      style={{
                        height: '58px',
                        borderRadius: '12px',
                        border: char ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                        background: 'var(--card)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '26px',
                        fontWeight: 800,
                        color: 'var(--text)',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      {char || '•'}
                    </div>
                  );
                })}
              </div>

              {/* Teclado numérico tátil */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {DIGITOS.slice(0, 9).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleAppendDigit(d)}
                    style={{
                      minHeight: '64px',
                      borderRadius: '12px',
                      border: '1.5px solid var(--border)',
                      background: 'var(--card)',
                      color: 'var(--text)',
                      fontSize: '22px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {d}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClearPin}
                  style={{
                    minHeight: '64px',
                    borderRadius: '12px',
                    border: '1.5px solid var(--border)',
                    background: 'var(--card)',
                    color: 'var(--text-muted)',
                    fontSize: '16px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Limpar
                </button>
                <button
                  type="button"
                  onClick={() => handleAppendDigit('0')}
                  style={{
                    minHeight: '64px',
                    borderRadius: '12px',
                    border: '1.5px solid var(--border)',
                    background: 'var(--card)',
                    color: 'var(--text)',
                    fontSize: '22px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  aria-label="Apagar dígito"
                  style={{
                    minHeight: '64px',
                    borderRadius: '12px',
                    border: '1.5px solid var(--border)',
                    background: 'var(--card)',
                    color: 'var(--text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Delete size={22} />
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', paddingTop: '8px' }}>
            <button
              type="button"
              onClick={handleResetAndClose}
              style={{
                minHeight: '64px',
                padding: '0 24px',
                borderRadius: '12px',
                border: '1.5px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '18px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                minHeight: '64px',
                padding: '0 28px',
                borderRadius: '12px',
                border: 'none',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                fontSize: '18px',
                fontWeight: 700,
                cursor: isSaving ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontFamily: 'inherit',
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              <Check size={20} strokeWidth={2.5} />
              {isSaving ? 'Salvando...' : 'Cadastrar Operador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
