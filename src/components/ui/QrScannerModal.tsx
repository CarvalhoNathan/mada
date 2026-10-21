import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from './Button';

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

  // Fecha e limpa o stream de vídeo
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
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

  // Inicia a câmera quando o modal for aberto
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isMounted = true;
    let scanInterval: number | undefined;

    const startCamera = async () => {
      try {
        setCameraError(null);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Navegador não suporta acesso direto à câmera.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraActive(true);

        // Verifica suporte a lanterna/flash
        const track = stream.getVideoTracks()[0];
        const capabilities = (track?.getCapabilities?.() || {}) as { torch?: boolean };
        if (capabilities.torch) {
          setHasTorch(true);
        }

        // Se o navegador tiver BarcodeDetector nativo (Chrome/Android/Edge)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = window as any;
        if ('BarcodeDetector' in win) {
          const barcodeDetector = new win.BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13'] });
          scanInterval = window.setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState >= 2) {
              try {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0 && barcodes[0].rawValue) {
                  clearInterval(scanInterval);
                  handleDetected(barcodes[0].rawValue);
                }
              } catch {
                // frame ignorado
              }
            }
          }, 350);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Não foi possível acessar a câmera.';
        setCameraError(msg);
        setCameraActive(false);
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (scanInterval) clearInterval(scanInterval);
      stopCamera();
    };
  }, [isOpen, handleDetected, stopCamera]);

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
      <div className="ds-modal-card ds-modal-standard" style={{ maxWidth: '640px', padding: 0 }}>
        {/* Cabeçalho do Scanner */}
        <header
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border)',
            background: 'var(--card-hover)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'var(--primary-soft)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              📷
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text)', fontWeight: 700 }}>
                {title}
              </h3>
              <p style={{ margin: 0, fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>
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
          >
            ✕
          </button>
        </header>

        {/* Visor de Câmera ou Alerta de Falha */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '460px',
              height: '260px',
              background: '#090d16',
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--border)',
            }}
          >
            {cameraActive && (
              <video
                ref={videoRef}
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            )}

            {/* Retículo e linha laser de mira industrial */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '180px',
                height: '180px',
                border: '2px dashed var(--primary)',
                borderRadius: '12px',
                pointerEvents: 'none',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: 'var(--ok)',
                  boxShadow: '0 0 8px var(--ok)',
                  opacity: 0.85,
                }}
              />
            </div>

            {/* Mensagem quando a câmera estiver inativa ou sem permissão */}
            {!cameraActive && (
              <div
                style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 'var(--fs-small)',
                  zIndex: 2,
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📸</div>
                <strong>Câmera em modo de bancada</strong>
                <p style={{ margin: '4px 0 0', fontSize: 'var(--fs-small)' }}>
                  {cameraError || 'Aponte o código ou clique em uma das etiquetas abaixo para teste rápido.'}
                </p>
              </div>
            )}

            {/* Controle de Lanterna se suportado */}
            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  background: torchOn ? 'var(--warn)' : 'rgba(0,0,0,0.6)',
                  color: torchOn ? '#000' : '#fff',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: 'var(--fs-small)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  zIndex: 3,
                }}
              >
                🔦 {torchOn ? 'Lanterna Ligada' : 'Ligar Lanterna'}
              </button>
            )}
          </div>

          {/* Atalhos Rápidos de Simulação (Para teste ágil ou sem câmera) */}
          <div style={{ width: '100%', marginTop: '16px' }}>
            <span
              style={{
                fontSize: 'var(--fs-small)',
                fontWeight: 700,
                color: 'var(--text-muted)',
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
                    background: 'var(--card)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text)',
                    fontSize: 'var(--fs-small)',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                    minHeight: '52px',
                  }}
                >
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'var(--card-hover)',
                      fontSize: '12px',
                      fontWeight: 800,
                      color: 'var(--primary)',
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
            background: 'var(--card-hover)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              stopCamera();
              onClose();
            }}
          >
            Cancelar
          </Button>
        </footer>
      </div>
    </div>
  );
};
