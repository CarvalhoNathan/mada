import React, { useEffect, useRef, useState, useCallback } from 'react';

export interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (code: string) => void;
  title?: string;
  description?: string;
}

interface QuickOption {
  code: string;
  label: string;
  badge: string;
}

const QUICK_SCAN_OPTIONS: QuickOption[] = [
  { code: 'OS-1084', label: 'OS #1084 — Residência Alphaville (Laca PU)', badge: 'OS' },
  { code: 'OS-1085', label: 'OS #1085 — Cozinha Jardins (Verniz Natural)', badge: 'OS' },
  { code: 'L-PU-2026-088', label: 'Lote L-PU-2026-088 — Sayerlack PU Branco', badge: 'Lote' },
  { code: 'SOBRA-PU-8821', label: 'Sobra #SOBRA-PU-8821 — 400ml restantes', badge: 'Sobra' },
];

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Escanear QR Code',
  description = 'Aponte a câmera do tablet para a ficha da OS ou etiqueta da lata.',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  // Fecha e limpa o stream de vídeo
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setTorchOn(false);
  }, []);

  const handleDetected = useCallback((code: string) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(60);
      } catch {
        // Silencioso
      }
    }
    stopCamera();
    onScanSuccess(code);
    onClose();
  }, [onScanSuccess, onClose, stopCamera]);

  // Inicia a câmera com fallback progressivo
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      setIsRetrying(true);

      // Limpa qualquer stream anterior pendente
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Navegador não suporta acesso direto à câmera.');
      }

      let stream: MediaStream | null = null;

      // 1ª Tentativa: Câmera traseira do tablet / bancada
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
          },
        });
      } catch (err1) {
        console.warn('Tentativa 1 com environment falhou, tentando fallback simples...', err1);
        // 2ª Tentativa: Fallback universal para qualquer câmera (USB, integrada, virtual)
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      if (!stream) {
        throw new Error('Nenhum sinal de vídeo recebido da câmera.');
      }

      streamRef.current = stream;

      // Anexa o stream diretamente ao elemento de vídeo já montado
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Play da câmera prevenido:', playErr);
        }
      }

      setCameraActive(true);

      // Verifica suporte a lanterna
      const track = stream.getVideoTracks()[0];
      const capabilities = (track?.getCapabilities?.() || {}) as { torch?: boolean };
      if (capabilities.torch) {
        setHasTorch(true);
      }

      // BarcodeDetector nativo se suportado
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      if ('BarcodeDetector' in win) {
        const barcodeDetector = new win.BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13'] });
        const scanTimer = window.setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0 && barcodes[0].rawValue) {
                clearInterval(scanTimer);
                handleDetected(barcodes[0].rawValue);
              }
            } catch {
              // frame ignorado
            }
          }
        }, 350);
      }
    } catch (err: unknown) {
      let msg = 'Não foi possível acessar a câmera.';
      if (err instanceof Error) {
        if (err.name === 'NotReadableError' || err.message.includes('Could not start video source')) {
          msg = 'Câmera em uso por outro aplicativo ou bloqueada pelo Windows ("Could not start video source").';
        } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          msg = 'Permissão de câmera não concedida no navegador.';
        } else {
          msg = err.message;
        }
      }
      setCameraError(msg);
      setCameraActive(false);
    } finally {
      setIsRetrying(false);
    }
  }, [handleDetected]);

  // Garante que o stream seja montado ao abrir
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      startCamera();
    }, 0);

    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Sincroniza srcObject caso o elemento de vídeo seja atualizado
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [cameraActive]);

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (track as any).applyConstraints({
          advanced: [{ torch: !torchOn }],
        });
        setTorchOn((prev) => !prev);
      } catch {
        // Silencioso
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ds-modal-backdrop" role="dialog" aria-modal="true">
      <div
        className="ds-modal-card ds-modal-standard"
        style={{
          maxWidth: '620px',
          width: '92%',
          padding: 0,
          backgroundColor: '#141519',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '18px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
        }}
      >
        {/* Cabeçalho do Scanner */}
        <header
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(43, 127, 255, 0.14)',
                color: '#2b7fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
            >
              📷
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#ededed', fontWeight: 700 }}>
                {title}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#a1a1aa' }}>
                {description}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="ds-modal-close-btn"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            aria-label="Fechar scanner"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#71717a',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            ✕
          </button>
        </header>

        {/* Visor de Câmera */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '480px',
              height: '240px',
              background: '#090a0d',
              borderRadius: '14px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* O elemento de vídeo SEMPRE existe no DOM */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: cameraActive ? 'block' : 'none',
              }}
            />

            {/* Retículo e Mira Laser */}
            {cameraActive && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '160px',
                  height: '160px',
                  border: '2px dashed #2b7fff',
                  borderRadius: '12px',
                  pointerEvents: 'none',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: '#22c55e',
                    boxShadow: '0 0 10px #22c55e',
                    opacity: 0.85,
                  }}
                />
              </div>
            )}

            {/* Mensagem quando a câmera estiver inativa ou bloqueada */}
            {!cameraActive && (
              <div
                style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: '#a1a1aa',
                  fontSize: '14px',
                  zIndex: 2,
                  maxWidth: '380px',
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>📸</div>
                <strong style={{ color: '#ededed', display: 'block', marginBottom: '4px' }}>
                  Câmera em modo de bancada
                </strong>
                <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: cameraError ? '#f87171' : '#71717a' }}>
                  {cameraError || 'Aponte o código QR ou clique em uma das etiquetas abaixo para teste rápido.'}
                </p>

                <button
                  type="button"
                  onClick={startCamera}
                  disabled={isRetrying}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'rgba(43, 127, 255, 0.15)',
                    border: '1px solid rgba(43, 127, 255, 0.4)',
                    color: '#60a5fa',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isRetrying ? 'Tentando conectar...' : '🔄 Tentar ligar câmera'}
                </button>
              </div>
            )}

            {/* Controle de Lanterna */}
            {hasTorch && cameraActive && (
              <button
                type="button"
                onClick={toggleTorch}
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  background: torchOn ? '#f59e0b' : 'rgba(0,0,0,0.6)',
                  color: torchOn ? '#000' : '#fff',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  zIndex: 3,
                }}
              >
                🔦 {torchOn ? 'Lanterna Ligada' : 'Ligar Lanterna'}
              </button>
            )}
          </div>

          {/* Atalhos Rápidos de Simulação */}
          <div style={{ width: '100%', marginTop: '16px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#71717a',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Etiquetas de Teste Rápido (Clique para ler):
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {QUICK_SCAN_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => handleDetected(opt.code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    background: '#1a1b20',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    color: '#ededed',
                    fontSize: '13px',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                    minHeight: '48px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(43, 127, 255, 0.15)',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#60a5fa',
                    }}
                  >
                    {opt.badge}
                  </span>
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <footer
          style={{
            padding: '14px 20px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            style={{
              height: '42px',
              padding: '0 20px',
              borderRadius: '10px',
              backgroundColor: '#202127',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#ededed',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
        </footer>
      </div>
    </div>
  );
};
