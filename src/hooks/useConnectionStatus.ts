import { useState, useEffect } from 'react';

export interface ConnectionStatus {
  isOnline: boolean;
  isServerLocal: boolean;
  isOffline: boolean;
}

export function useConnectionStatus(heartbeatIntervalMs: number = 15000): ConnectionStatus {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isServerLocal, setIsServerLocal] = useState<boolean>(true);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsServerLocal(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Heartbeat leve para verificar resposta do servidor local
    const checkServerHealth = async () => {
      if (!navigator.onLine) {
        setIsServerLocal(false);
        return;
      }
      try {
        const res = await fetch(`/?ping=${Date.now()}`, {
          method: 'HEAD',
          cache: 'no-store',
        });
        setIsServerLocal(res.ok || res.type === 'opaque');
      } catch {
        setIsServerLocal(false);
      }
    };

    const intervalId = setInterval(checkServerHealth, heartbeatIntervalMs);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [heartbeatIntervalMs]);

  const isOffline = !isOnline || !isServerLocal;

  return {
    isOnline,
    isServerLocal,
    isOffline,
  };
}
