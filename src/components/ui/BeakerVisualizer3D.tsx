import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface LiquidLayer {
  id: string | number;
  label: string;
  volume: number; // ml dosados
  target: number; // meta ml
  role: 'base' | 'catalisador' | 'diluidor' | 'retardador' | string;
  isExceeded?: boolean;
}

export interface BeakerVisualizer3DProps {
  /** Se fornecido um único valor, atua no modo componente único */
  value?: number;
  target?: number;
  toleranceMax?: number;
  isExceeded?: boolean;
  isWithin?: boolean;
  isCatalyst?: boolean;
  /** Se fornecido `layers`, atua no modo batelada completa (mistura total) */
  layers?: LiquidLayer[];
  totalCapacityMl?: number;
  height?: number;
  width?: number;
  autoRotate?: boolean;
  showLabels?: boolean;
}

// Cores temáticas industriais por papel químico
const ROLE_COLORS: Record<string, { hex: number; opacity: number }> = {
  base: { hex: 0x3b82f6, opacity: 0.88 }, // Azul industrial
  catalisador: { hex: 0xf59e0b, opacity: 0.85 }, // Âmbar / Dourado químico
  diluidor: { hex: 0x06b6d4, opacity: 0.7 }, // Ciano translúcido
  retardador: { hex: 0x8b5cf6, opacity: 0.75 }, // Violeta translúcido
};

export const BeakerVisualizer3D: React.FC<BeakerVisualizer3DProps> = ({
  value = 0,
  target = 100,
  toleranceMax,
  isExceeded = false,
  isWithin = false,
  isCatalyst = false,
  layers,
  totalCapacityMl = 2500,
  height = 240,
  width,
  autoRotate = true,
  showLabels = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const liquidGroupRef = useRef<THREE.Group | null>(null);
  const alertLightRef = useRef<THREE.PointLight | null>(null);

  // Inicialização da Cena 3D Three.js
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const w = width || container.clientWidth || 240;
    const h = height;

    // 1. Cena e Câmera com ângulo isométrico de visualização de chão de fábrica
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 50);
    camera.position.set(0, 1.8, 3.6);
    camera.lookAt(0, 0.9, 0);

    // 2. Renderizador com antialias e alpha transparente para se integrar ao tema escuro
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Sistema de Iluminação de Estúdio Industrial
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 1.2);
    rimLight.position.set(-3, 3, -3);
    scene.add(rimLight);

    // Luz de alerta interna (acende vermelho em excesso crítico)
    const alertLight = new THREE.PointLight(0xff2222, 0, 4);
    alertLight.position.set(0, 1.0, 0);
    scene.add(alertLight);
    alertLightRef.current = alertLight;

    // 4. Estrutura Física do Béquer Graduado (Vidro Borossilicato 3.3)
    const beakerRadius = 0.72;
    const beakerHeight = 2.0;

    const beakerGroup = new THREE.Group();
    scene.add(beakerGroup);

    // Corpo de vidro cilíndrico
    const glassGeo = new THREE.CylinderGeometry(
      beakerRadius,
      beakerRadius * 0.96,
      beakerHeight,
      48,
      1,
      true
    );
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xecfeff,
      transparent: true,
      opacity: 0.28,
      roughness: 0.08,
      metalness: 0.05,
      transmission: 0.75,
      thickness: 0.3,
      ior: 1.5,
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.y = beakerHeight / 2;
    beakerGroup.add(glassMesh);

    // Fundo do béquer
    const bottomGeo = new THREE.CylinderGeometry(
      beakerRadius * 0.96,
      beakerRadius * 0.96,
      0.04,
      48
    );
    const bottomMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.5,
      roughness: 0.2,
    });
    const bottomMesh = new THREE.Mesh(bottomGeo, bottomMat);
    bottomMesh.position.y = 0.02;
    beakerGroup.add(bottomMesh);

    // Graduações táteis e anéis de medição no vidro (25%, 50%, 75%, 100%)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
    });

    [0.25, 0.5, 0.75, 1.0].forEach((ratio) => {
      const ringY = ratio * (beakerHeight * 0.88);
      const ringGeo = new THREE.TorusGeometry(beakerRadius + 0.005, 0.006, 6, 48);
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = ringY;
      beakerGroup.add(ringMesh);
    });

    // Grupo para os cilindros/camadas de líquido
    const liquidGroup = new THREE.Group();
    beakerGroup.add(liquidGroup);
    liquidGroupRef.current = liquidGroup;

    // 5. Loop de Renderização e Animação
    let clock = new THREE.Clock();
    let currentRotation = 0;

    const animate = () => {
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      if (autoRotate) {
        currentRotation += delta * 0.35;
        beakerGroup.rotation.y = currentRotation;
      }

      // Efeito de pulso de alerta vermelho caso esteja em excesso crítico
      if (alertLightRef.current) {
        if (isExceeded) {
          const pulse = (Math.sin(elapsedTime * 8) + 1) * 1.5;
          alertLightRef.current.intensity = pulse;
        } else {
          alertLightRef.current.intensity = 0;
        }
      }

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // 6. Cleanup Rigoroso de Recursos GPU/WebGL ao desmontar
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
      glassGeo.dispose();
      glassMat.dispose();
      bottomGeo.dispose();
      bottomMat.dispose();
      ringMat.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [width, height, autoRotate]);

  // Atualização reativa das camadas e volumes de líquido
  useEffect(() => {
    const liquidGroup = liquidGroupRef.current;
    if (!liquidGroup) return;

    // Remove malhas anteriores de líquido
    while (liquidGroup.children.length > 0) {
      const child = liquidGroup.children[0] as THREE.Mesh;
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
      liquidGroup.remove(child);
    }

    const beakerRadius = 0.70;
    const maxUsableHeight = 2.0 * 0.88; // 88% da altura é 100% da escala

    // MODO A: Batelada com Múltiplas Camadas (Batelada Completa)
    if (layers && layers.length > 0) {
      const safeCapacity = totalCapacityMl > 0 ? totalCapacityMl : 2500;
      let currentBaseY = 0.04;

      layers.forEach((layer) => {
        if (layer.volume <= 0) return;

        const layerHeight = (layer.volume / safeCapacity) * maxUsableHeight;
        if (layerHeight <= 0.005) return;

        const roleCfg = ROLE_COLORS[layer.role] || { hex: 0x3b82f6, opacity: 0.85 };
        let layerColor = roleCfg.hex;

        if (layer.isExceeded) {
          layerColor = 0xef4444; // Vermelho de excesso
        }

        const geo = new THREE.CylinderGeometry(
          beakerRadius,
          beakerRadius,
          layerHeight,
          36,
          1
        );
        const mat = new THREE.MeshStandardMaterial({
          color: layerColor,
          roughness: 0.15,
          metalness: 0.1,
          transparent: true,
          opacity: roleCfg.opacity,
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = currentBaseY + layerHeight / 2;
        liquidGroup.add(mesh);

        // Menisco superior da camada
        const meniscusGeo = new THREE.CircleGeometry(beakerRadius, 36);
        const meniscusMat = new THREE.MeshBasicMaterial({
          color: layerColor,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide,
        });
        const meniscus = new THREE.Mesh(meniscusGeo, meniscusMat);
        meniscus.rotation.x = Math.PI / 2;
        meniscus.position.y = currentBaseY + layerHeight;
        liquidGroup.add(meniscus);

        currentBaseY += layerHeight;
      });
      return;
    }

    // MODO B: Componente Único Individual
    const safeTarget = target > 0 ? target : 100;
    const ratio = Math.max(0, Math.min(1.2, value / safeTarget));
    const liquidHeight = Math.max(0.01, ratio * maxUsableHeight);

    let liquidColor = 0x3b82f6; // Padrão azul
    if (isCatalyst) liquidColor = 0xf59e0b; // Âmbar catalisador
    if (isWithin) liquidColor = 0x10b981; // Verde esmeralda meta atingida
    if (isExceeded) liquidColor = 0xef4444; // Vermelho alerta crítico

    if (value > 0) {
      const geo = new THREE.CylinderGeometry(
        beakerRadius,
        beakerRadius,
        liquidHeight,
        36,
        1
      );
      const mat = new THREE.MeshStandardMaterial({
        color: liquidColor,
        roughness: 0.18,
        metalness: 0.08,
        transparent: true,
        opacity: 0.88,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = 0.04 + liquidHeight / 2;
      liquidGroup.add(mesh);

      // Superfície do menisco
      const meniscusGeo = new THREE.CircleGeometry(beakerRadius, 36);
      const meniscusMat = new THREE.MeshBasicMaterial({
        color: liquidColor,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
      });
      const meniscus = new THREE.Mesh(meniscusGeo, meniscusMat);
      meniscus.rotation.x = Math.PI / 2;
      meniscus.position.y = 0.04 + liquidHeight;
      liquidGroup.add(meniscus);
    }
  }, [value, target, isExceeded, isWithin, isCatalyst, layers, totalCapacityMl]);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        ref={mountRef}
        style={{
          width: width ? `${width}px` : '100%',
          height: `${height}px`,
          position: 'relative',
        }}
      />
      {showLabels && (
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: isExceeded ? '#f87171' : isWithin ? '#34d399' : '#94a3b8',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            padding: '2px 8px',
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            pointerEvents: 'none',
          }}
        >
          {layers
            ? `Mistura: ${Math.round(layers.reduce((acc, l) => acc + l.volume, 0))} / ${totalCapacityMl} ml`
            : `${Math.round(value)} / ${Math.round(target)} ml`}
        </div>
      )}
    </div>
  );
};
