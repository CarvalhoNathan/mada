import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Camera, RefreshCw, FlipHorizontal, Flashlight, Check } from 'lucide-react';
import jsQR from 'jsqr';

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
  { code: 'OS #8841', label: 'OS #8841 — Residência Fontana (Cozinha Gourmet)', badge: 'OS' },
  { code: 'OS #8843', label: 'OS #8843 — Residência Fontana (Suíte Master)', badge: 'OS' },
  { code: '#SY-7410', label: 'Embalagem #SY-7410 — Catalisador PU Médio (250ml)', badge: 'Embalagem' },
  { code: '#SOBRA-SY-8821', label: 'Sobra #SY-8821 — Verniz PU 4:1 (400ml restantes)', badge: 'Sobra' },
];

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Apresente o QR Code',
  description = 'Apresente a etiqueta ou O.S. em frente à câmera frontal do tablet (suporte na parede).',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [detectedCode, setDetectedCode] = useState<string | null>(null);

  // Para o loop contínuo de escaneamento de QR Code
  const stopScanning = useCallback(() => {
    isScanningRef.current = false;
    if (scanTimerRef.current !== null) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
  }, []);

  // Fecha e limpa o stream de vídeo e scanners
  const stopCamera = useCallback(() => {
    stopScanning();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setTorchOn(false);
  }, [stopScanning]);

  const handleDetected = useCallback((code: string) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(60);
      } catch {
        // Silencioso
      }
    }
    setDetectedCode(code);
    stopScanning();
    setTimeout(() => {
      stopCamera();
      onScanSuccess(code);
      onClose();
      setDetectedCode(null);
    }, 280);
  }, [onScanSuccess, onClose, stopCamera, stopScanning]);

  // Loop de detecção duplo: BarcodeDetector nativo (se suportado) + fallback universal jsQR (Safari / iPadOS)
  const startDetectionLoop = useCallback(() => {
    stopScanning();
    isScanningRef.current = true;

    // 1. Tenta inicializar BarcodeDetector nativo se o browser suportar (Chrome, Edge, etc.)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const hasBarcodeDetector = typeof win !== 'undefined' && 'BarcodeDetector' in win;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let nativeDetector: any = null;

    if (hasBarcodeDetector) {
      try {
        nativeDetector = new win.BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13'] });
      } catch (detectorErr) {
        console.warn('BarcodeDetector nativo indisponível, usando jsQR universal:', detectorErr);
      }
    }

    // 2. Prepara canvas off-screen para captura de frames com jsQR
    if (!canvasRef.current && typeof document !== 'undefined') {
      canvasRef.current = document.createElement('canvas');
    }

    scanTimerRef.current = window.setInterval(async () => {
      if (!isScanningRef.current) return;
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        return;
      }

      // Tentativa A: Detector nativo de hardware
      if (nativeDetector) {
        try {
          const barcodes = await nativeDetector.detect(video);
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            stopScanning();
            handleDetected(barcodes[0].rawValue);
            return;
          }
        } catch {
          // Em caso de falha pontual no detector nativo, o frame passa para o jsQR abaixo
        }
      }

      // Tentativa B: Fallback universal de decodificação de imagem via jsQR (Safari/iPadOS/Firefox)
      const canvas = canvasRef.current;
      if (canvas) {
        try {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            // Downscale controlado para 480px máximo para leitura instantânea sem engasgar tablets
            const targetWidth = Math.min(480, video.videoWidth);
            const scale = targetWidth / video.videoWidth;
            const targetHeight = Math.round(video.videoHeight * scale);

            if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
              canvas.width = targetWidth;
              canvas.height = targetHeight;
            }

            ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
            const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
            const qrCode = jsQR(imageData.data, targetWidth, targetHeight, {
              inversionAttempts: 'attemptBoth',
            });

            if (qrCode && qrCode.data) {
              stopScanning();
              handleDetected(qrCode.data);
              return;
            }
          }
        } catch {
          // Frame com erro descartado silenciosamente para o próximo ciclo
        }
      }
    }, 240);
  }, [handleDetected, stopScanning]);

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

      // 1ª Tentativa: Câmera frontal (selfie) por padrão devido ao tablet preso na parede
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: cameraFacing },
          },
        });
      } catch (err1) {
        console.warn(`Tentativa com ${cameraFacing} falhou, tentando fallback universal...`, err1);
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

      // Inicia o motor de escaneamento contínuo (BarcodeDetector nativo + Fallback jsQR para iPadOS/Safari)
      startDetectionLoop();
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
  }, [startDetectionLoop, cameraFacing]);

  // Garante que o stream seja montado ao abrir ou alternar câmera
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      startCamera();
    }, 0);

    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [isOpen, cameraFacing, startCamera, stopCamera]);

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
    <div
      className="ds-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={() => {
        stopCamera();
        onClose();
      }}
    >
      <div
        className="os-modal-card-apple"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '640px',
          width: '92%',
          padding: '22px 24px',
          gap: '14px',
        }}
      >
        {/* Cabeçalho do Scanner no padrão Apple Sheet */}
        <div className="os-modal-header-apple">
          <div className="os-modal-header-left">
            <div className="os-modal-icon-badge" aria-hidden="true">
              <Camera size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="os-modal-title-apple">
                <span>{title}</span>
              </h3>
              <p className="os-modal-subtitle-apple">
                {description}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="os-modal-close-apple"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            aria-label="Fechar scanner"
          >
            <X size={18} strokeWidth={2.4} />
          </button>
        </div>

        {/* Visor de Câmera Apple HIG */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '210px',
              background: '#090a0d',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.8)',
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
                transform: cameraFacing === 'user' ? 'scaleX(-1)' : 'none',
              }}
            />

            {/* Retículo e Mira Laser Industrial */}
            {cameraActive && (
              <div
                className={`qr-reticle-box ${detectedCode ? 'is-detected' : ''}`}
              >
                {/* 4 Cantos Industriais de Foco */}
                <span className="qr-corner qr-corner--tl" aria-hidden="true" />
                <span className="qr-corner qr-corner--tr" aria-hidden="true" />
                <span className="qr-corner qr-corner--bl" aria-hidden="true" />
                <span className="qr-corner qr-corner--br" aria-hidden="true" />

                {/* Feixe Laser Neon com Varredura Vertical */}
                {!detectedCode && (
                  <div className="qr-laser-line" aria-hidden="true" />
                )}

                {/* Feedback Tátil de QR Code Detectado */}
                {detectedCode && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(16, 185, 129, 0.24)',
                      borderRadius: '12px',
                      color: '#ffffff',
                    }}
                  >
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: '#10B981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 18px rgba(16, 185, 129, 0.85)',
                      }}
                    >
                      <Check size={26} strokeWidth={3} />
                    </div>
                    <span
                      style={{
                        marginTop: '10px',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#4ade80',
                        fontFamily: 'var(--font-mono)',
                        background: 'rgba(0, 0, 0, 0.6)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      {detectedCode}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Mensagem quando a câmera estiver inativa ou bloqueada */}
            {!cameraActive && (
              <div
                style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '14px',
                  zIndex: 2,
                  maxWidth: '380px',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: 'var(--text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 10px auto',
                  }}
                >
                  <Camera size={24} strokeWidth={2.2} />
                </div>
                <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '4px' }}>
                  Câmera em modo de bancada
                </strong>
                <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: cameraError ? '#f87171' : 'var(--text-tertiary)' }}>
                  {cameraError || 'Aponte o código QR ou clique em uma das etiquetas abaixo para teste rápido.'}
                </p>

                <button
                  type="button"
                  onClick={startCamera}
                  disabled={isRetrying}
                  className="os-action-btn"
                  style={{
                    height: '36px',
                    minHeight: '36px',
                    padding: '0 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: 'var(--text)',
                  }}
                >
                  <RefreshCw size={14} className={isRetrying ? 'spin' : ''} />
                  {isRetrying ? 'Tentando conectar...' : 'Tentar ligar câmera'}
                </button>
              </div>
            )}

            {/* Controle de Lanterna e Alternância Frontal/Traseira */}
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                display: 'flex',
                gap: '8px',
                zIndex: 3,
              }}
            >
              <button
                type="button"
                onClick={() => setCameraFacing((prev) => (prev === 'user' ? 'environment' : 'user'))}
                title="Alternar entre câmera frontal (tablet na parede) e traseira"
                style={{
                  background: 'rgba(18, 18, 22, 0.78)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  color: 'var(--text)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '20px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <FlipHorizontal size={13} strokeWidth={2.4} /> {cameraFacing === 'user' ? 'Frontal (Parede)' : 'Traseira'}
              </button>

              {hasTorch && cameraActive && cameraFacing === 'environment' && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  style={{
                    background: torchOn ? '#f59e0b' : 'rgba(18, 18, 22, 0.78)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    color: torchOn ? '#000' : 'var(--text)',
                    border: torchOn ? 'none' : '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '20px',
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Flashlight size={13} strokeWidth={2.4} /> {torchOn ? 'Ligada' : 'Lanterna'}
                </button>
              )}
            </div>
          </div>

          {/* Indicador de Status do Sensor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: cameraActive ? 'var(--ok)' : 'var(--warn)',
                boxShadow: cameraActive ? '0 0 8px var(--ok)' : 'none',
              }}
            />
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {cameraActive ? 'Sensor de leitura ativo (Universal iPad/Android)' : 'Aguardando câmera...'}
            </span>
          </div>

          {/* Atalhos Rápidos de Simulação em Inset Cards */}
          <div style={{ width: '100%', marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Etiquetas de Teste Rápido (toque para simular)
              </span>
              <span className="os-modal-count-pill">
                {QUICK_SCAN_OPTIONS.length} opções
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
              {QUICK_SCAN_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  className="os-list-card"
                  onClick={() => handleDetected(opt.code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    minHeight: '48px',
                    borderRadius: '12px',
                  }}
                  title={opt.label}
                >
                  <span
                    className="os-badge-code"
                    style={{
                      fontSize: '11px',
                      padding: '2px 7px',
                      flexShrink: 0,
                    }}
                  >
                    {opt.badge}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textAlign: 'left',
                    }}
                  >
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
