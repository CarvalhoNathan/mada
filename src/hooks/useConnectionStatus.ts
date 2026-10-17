import { useState, useEffect } from 'react';

export interface ConnectionStatus {
  isOnline: boolean;
  isServerLocal: boolean;
  isSystemOnline: boolean;
  isOffline: boolean;
}

/**
 * Hook de monitoramento de conectividade da aplicação fabril.
 *
 * O que o heartbeat consulta hoje:
 * - Em ambientes com servidor remoto/backend dedicado, o heartbeat realiza um ping
 *   periódico HTTP HEAD (`/?ping=${Date.now()}`) para confirmar que o servidor web/API
 *   está acessível e respondendo sem travamento.
 * - No modo mock (`VITE_DATA_SOURCE === 'mock'`), a aplicação opera com repositórios em
 *   memória e não depende de um servidor local nem gera tráfego de rede desnecessário.
 *   Neste modo, o status online do sistema é mantido sincronizado com `navigator.onLine`.
 */
export function useConnectionStatus(heartbeatIntervalMs: number = 15000): ConnectionStatus {
  const isMockMode = (import.meta.env.VITE_DATA_SOURCE || 'mock') === 'mock';

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSystemOnline, setIsSystemOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsSystemOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsSystemOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // No modo mock, não acessa servidor local; simula status online diretamente
    if (isMockMode) {
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    // Para outros ambientes de dados conectados, verifica saúde da conexão
    const checkServerHealth = async () => {
      if (!navigator.onLine) {
        setIsSystemOnline(false);
        return;
      }
      try {
        const res = await fetch(`/?ping=${Date.now()}`, {
          method: 'HEAD',
          cache: 'no-store',
        });
        setIsSystemOnline(res.ok || res.type === 'opaque');
      } catch {
        setIsSystemOnline(false);
      }
    };

    const intervalId = setInterval(checkServerHealth, heartbeatIntervalMs);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [heartbeatIntervalMs, isMockMode]);

  const isOffline = !isOnline || !isSystemOnline;

  return {
    isOnline,
    isServerLocal: isSystemOnline,
    isSystemOnline,
    isOffline,
  };
}
