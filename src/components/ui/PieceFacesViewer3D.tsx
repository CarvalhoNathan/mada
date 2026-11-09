import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Rotate3d, Eye, CheckCircle2, ShieldAlert } from 'lucide-react';

export interface PieceFacesViewer3DProps {
  title: string;
  substrate: string;
  finish: string;
  area: string;
  thicknessMm?: number; // ex: 18 ou 25
  height?: number;
}

export const PieceFacesViewer3D: React.FC<PieceFacesViewer3DProps> = ({
  title,
  substrate,
  finish,
  area,
  thicknessMm: propThickness,
  height = 190,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeView, setActiveView] = useState<'iso' | 'faceA' | 'faceB'>('iso');
  const targetRotationRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const previousPointerPositionRef = useRef({ x: 0, y: 0 });

  // Detecta espessura e características pelo título/substrato caso não venha explícito
  const thicknessMm =
    propThickness ??
    (title.includes('25mm') || substrate.includes('25mm')
      ? 25
      : title.includes('15mm')
      ? 15
      : 18);

  const isDoubleFaced =
    title.toLowerCase().includes('dois lados') ||
    finish.toLowerCase().includes('2 faces') ||
    finish.toLowerCase().includes('dupla face');

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 380;
    const h = height;

    // 1. Cena e Câmera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / h, 0.1, 50);
    camera.position.set(0, 0.5, 3.8);
    camera.lookAt(0, 0, 0);

    // 2. Renderizador com antialias e alpha para encaixar no tema escuro
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 3. Iluminação PBR de estúdio de marcenaria
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLightFront = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLightFront.position.set(2, 4, 4);
    scene.add(dirLightFront);

    const dirLightBack = new THREE.DirectionalLight(0x93c5fd, 1.0);
    dirLightBack.position.set(-2, -2, -4);
    scene.add(dirLightBack);

    // 4. Criação das Texturas Informativas das Faces (Face A e Face B)
    const createFaceTexture = (
      label: string,
      subLabel: string,
      statusLabel: string,
      isPrimary: boolean
    ) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) return new THREE.CanvasTexture(canvas);

      // Fundo da face com leve vinheta
      const grad = ctx.createLinearGradient(0, 0, 512, 512);
      if (isPrimary) {
        grad.addColorStop(0, '#f8fafc');
        grad.addColorStop(1, '#e2e8f0');
      } else {
        grad.addColorStop(0, '#334155');
        grad.addColorStop(1, '#1e293b');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      // Moldura técnica
      ctx.strokeStyle = isPrimary ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 14;
      ctx.strokeRect(16, 16, 480, 480);

      // Badge de status no topo
      ctx.fillStyle = isPrimary ? '#2563eb' : '#475569';
      ctx.beginPath();
      ctx.roundRect(140, 40, 232, 44, 8);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(statusLabel, 256, 70);

      // Título da Face
      ctx.fillStyle = isPrimary ? '#0f172a' : '#f8fafc';
      ctx.font = 'bold 46px sans-serif';
      ctx.fillText(label, 256, 230);

      // Subtítulo técnico
      ctx.font = '500 24px sans-serif';
      ctx.fillStyle = isPrimary ? '#475569' : '#94a3b8';
      ctx.fillText(subLabel, 256, 280);

      // Indicação de espessura no rodapé
      ctx.font = 'bold 22px monospace';
      ctx.fillStyle = isPrimary ? '#3b82f6' : '#64748b';
      ctx.fillText(`MDF ${thicknessMm}mm • Berneck`, 256, 450);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    };

    const textureFaceA = createFaceTexture(
      'FACE A (EXTERNA)',
      'Laca Fosca 20 Gloss',
      '● PINTAR (2 DEMÃOS)',
      true
    );

    const textureFaceB = createFaceTexture(
      'FACE B (VERSO)',
      isDoubleFaced ? 'Laca Fosca 20 Gloss' : 'Fundo / Contra-face',
      isDoubleFaced ? '● PINTAR (DUPLA FACE)' : '✕ NÃO APLICAR LACA',
      isDoubleFaced
    );

    // 5. Materiais das 6 Faces da Chapa
    // Ordem no Three.js BoxGeometry: [+X, -X, +Y, -Y, +Z, -Z]
    // +Z = Face Frontal (A), -Z = Face Traseira (B)
    // Laterais (+X, -X) e Topos (+Y, -Y) = Bordas
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8, // Ciano de borda selada
      roughness: 0.25,
      metalness: 0.1,
    });

    const faceAMaterial = new THREE.MeshStandardMaterial({
      map: textureFaceA,
      roughness: 0.35, // 20 Gloss acetinado
      metalness: 0.05,
    });

    const faceBMaterial = new THREE.MeshStandardMaterial({
      map: textureFaceB,
      roughness: 0.65,
      metalness: 0.02,
    });

    const materials = [
      edgeMaterial, // Direita (+X)
      edgeMaterial, // Esquerda (-X)
      edgeMaterial, // Topo (+Y)
      edgeMaterial, // Base (-Y)
      faceAMaterial, // Frente (+Z)
      faceBMaterial, // Trás (-Z)
    ];

    // Proporções realistas de porta de armário (ex: 60cm larg x 80cm alt x espessura)
    const pieceWidth = 1.6;
    const pieceHeight = 2.1;
    const pieceDepth = (thicknessMm / 18) * 0.12;

    const geometry = new THREE.BoxGeometry(pieceWidth, pieceHeight, pieceDepth);
    const pieceMesh = new THREE.Mesh(geometry, materials);
    scene.add(pieceMesh);

    // Grupo com leve inclinação isométrica inicial
    pieceMesh.rotation.x = 0.18;
    pieceMesh.rotation.y = -0.45;

    // 6. Manipulação por toque / mouse (Drag 360°)
    let isInteracting = false;
    let idleAngle = pieceMesh.rotation.y;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isInteracting = true;
      isDraggingRef.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      previousPointerPositionRef.current = { x: clientX, y: clientY };
      targetRotationRef.current = null;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - previousPointerPositionRef.current.x;
      const deltaY = clientY - previousPointerPositionRef.current.y;

      pieceMesh.rotation.y += deltaX * 0.012;
      pieceMesh.rotation.x += deltaY * 0.008;

      // Trava inclinação vertical para não capotar a chapa
      pieceMesh.rotation.x = Math.max(-0.5, Math.min(0.5, pieceMesh.rotation.x));

      previousPointerPositionRef.current = { x: clientX, y: clientY };
      idleAngle = pieceMesh.rotation.y;
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
      setTimeout(() => {
        isInteracting = false;
      }, 2000);
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onPointerDown);
    domElement.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    domElement.addEventListener('touchstart', onPointerDown, { passive: true });
    domElement.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // 7. Loop de Renderização
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();

      // Transição suave para alinhamento quando clica em botões [Frente / Verso / Iso]
      if (targetRotationRef.current) {
        pieceMesh.rotation.y += (targetRotationRef.current.y - pieceMesh.rotation.y) * 0.12;
        pieceMesh.rotation.x += (targetRotationRef.current.x - pieceMesh.rotation.x) * 0.12;
      } else if (!isInteracting) {
        // Rotação sutil contínua no modo idle
        idleAngle += delta * 0.25;
        pieceMesh.rotation.y = idleAngle;
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    // Resize
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      camera.aspect = newW / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, height);
    };
    window.addEventListener('resize', handleResize);

    // 8. Cleanup rigoroso WebGL
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('mousedown', onPointerDown);
      domElement.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      domElement.removeEventListener('touchstart', onPointerDown);
      domElement.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);

      geometry.dispose();
      textureFaceA.dispose();
      textureFaceB.dispose();
      materials.forEach((m) => m.dispose());
      renderer.dispose();

      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
    };
  }, [title, substrate, finish, thicknessMm, height, isDoubleFaced]);

  // Controles de câmera com 1 toque rápido (otimizado para operadores com luvas)
  const handleSetView = (view: 'iso' | 'faceA' | 'faceB') => {
    setActiveView(view);
    if (view === 'faceA') {
      targetRotationRef.current = { x: 0, y: 0 }; // Rosto frontal
    } else if (view === 'faceB') {
      targetRotationRef.current = { x: 0, y: Math.PI }; // Verso
    } else {
      targetRotationRef.current = { x: 0.18, y: -0.45 }; // Isométrica
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px',
        backgroundColor: 'rgba(10, 15, 26, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '10px 12px',
        gap: '8px',
        userSelect: 'none',
      }}
    >
      {/* Barra de Título Técnica do Mapa de Faces */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#93c5fd',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          <Rotate3d size={14} />
          Mapa de Faces 3D da Peça
        </span>

        {/* Botões rápidos de alternância com 1 toque */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            onClick={() => handleSetView('faceA')}
            style={{
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '4px',
              border: activeView === 'faceA' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
              backgroundColor: activeView === 'faceA' ? '#1e3a8a' : 'rgba(255,255,255,0.04)',
              color: activeView === 'faceA' ? '#93c5fd' : '#94a3b8',
              cursor: 'pointer',
            }}
          >
            Face A (Frente)
          </button>
          <button
            type="button"
            onClick={() => handleSetView('faceB')}
            style={{
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '4px',
              border: activeView === 'faceB' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
              backgroundColor: activeView === 'faceB' ? '#1e3a8a' : 'rgba(255,255,255,0.04)',
              color: activeView === 'faceB' ? '#93c5fd' : '#94a3b8',
              cursor: 'pointer',
            }}
          >
            Face B (Verso)
          </button>
          <button
            type="button"
            onClick={() => handleSetView('iso')}
            style={{
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '4px',
              border: activeView === 'iso' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
              backgroundColor: activeView === 'iso' ? '#1e3a8a' : 'rgba(255,255,255,0.04)',
              color: activeView === 'iso' ? '#93c5fd' : '#94a3b8',
              cursor: 'pointer',
            }}
          >
            3D 360°
          </button>
        </div>
      </div>

      {/* Canvas Three.js Interativo */}
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: `${height}px`,
          position: 'relative',
          cursor: 'grab',
          touchAction: 'none',
        }}
        title="Arraste para girar a chapa em 360° e inspecionar as faces"
      />

      {/* Legenda de Aplicação Direta para o Pintor */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6px',
          paddingTop: '4px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: '#f8fafc',
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            padding: '4px 6px',
            borderRadius: '4px',
            border: '1px solid rgba(59, 130, 246, 0.25)',
          }}
        >
          <CheckCircle2 size={13} color="#60a5fa" style={{ flexShrink: 0 }} />
          <span>
            <strong>Face A:</strong> Pintar (Laca)
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: isDoubleFaced ? '#f8fafc' : '#94a3b8',
            backgroundColor: isDoubleFaced
              ? 'rgba(59, 130, 246, 0.12)'
              : 'rgba(255, 255, 255, 0.04)',
            padding: '4px 6px',
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {isDoubleFaced ? (
            <CheckCircle2 size={13} color="#60a5fa" style={{ flexShrink: 0 }} />
          ) : (
            <ShieldAlert size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
          )}
          <span>
            <strong>Face B:</strong> {isDoubleFaced ? 'Pintar (2 Faces)' : 'Contra-face'}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: '#f8fafc',
            backgroundColor: 'rgba(56, 189, 248, 0.12)',
            padding: '4px 6px',
            borderRadius: '4px',
            border: '1px solid rgba(56, 189, 248, 0.25)',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '2px',
              backgroundColor: '#38bdf8',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          <span>
            <strong>4 Bordas:</strong> Selar e Laquear
          </span>
        </div>
      </div>
    </div>
  );
};
