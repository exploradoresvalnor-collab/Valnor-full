/**
 * Portal Selection Page - Selección de Modo de Juego
 * Versión Minimalista - Optimizada para Móviles y AAA UX
 */

import { useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, AdaptiveDpr, Preload } from '@react-three/drei';
import { useGameModeStore, GameMode } from '../../stores/gameModeStore';
import {
  GiCastle,
  GiCrossedSwords,
  GiSkullCrossedBones,
  GiDragonSpiral,
  GiPowerLightning
} from 'react-icons/gi';
import { SpaceScene } from '../../components/scene/SpaceScene';
import './PortalSelection.css';

const ArrowRightIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

function LoadingFallback() {
  return (
    <mesh>
      <circleGeometry args={[1, 32]} />
      <meshBasicMaterial color="#c2a05d" wireframe />
    </mesh>
  );
}

export default function PortalSelection() {
  const navigate = useNavigate();
  const setMode = useGameModeStore((state) => state.setMode);
  const [hoveredPortal, setHoveredPortal] = useState<GameMode | null>(null);
  const [selectedPortal, setSelectedPortal] = useState<GameMode | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSelectPortal = (mode: GameMode) => {
    if (isTransitioning) return;
    setSelectedPortal(mode);
    setIsTransitioning(true);
    setMode(mode);
    setTimeout(() => navigate('/dashboard'), 1200);
  };

  return (
    <div className={`portal-page minimalist ${isTransitioning ? 'transitioning' : ''}`}>

      <div className="bg-image-overlay">
        <img src="/assets/icons/portada_pc.webp" alt="Valnor Background" />
        <div className="bg-gradient-overlay" />
      </div>

      <div className="altar-ambient-glow" />

      <div className="portal-3d-background">
        <Canvas camera={{ position: [0, 0, 30], fov: 60 }} gl={{ alpha: true }}>
          <Suspense fallback={<LoadingFallback />}>
            <SpaceScene />
            <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} />
            <AdaptiveDpr pixelated />
            <Preload all />
          </Suspense>
        </Canvas>
      </div>

      <div className="portal-content-mini fade-in-magic">

        <header className="portal-header-mini">
          <GiCastle size={32} className="mini-logo" />
          <h1 className="mini-title">ELIGE TU DESTINO</h1>
        </header>

        <div className="portals-container-mini">

          {/* MODO HISTORIA */}
          <div
            className={`mini-portal rpg ${hoveredPortal === 'rpg' ? 'hovered' : ''} ${selectedPortal === 'rpg' ? 'selected' : ''}`}
            onMouseEnter={() => setHoveredPortal('rpg')}
            onMouseLeave={() => setHoveredPortal(null)}
            onClick={() => handleSelectPortal('rpg')}
          >
            <div className="mini-portal-inner">
              <GiCrossedSwords size={40} className="mini-portal-icon" />
              <div className="mini-portal-text">
                <h2 className="mini-portal-title">HISTORIA</h2>
                <p className="mini-portal-desc">Campaña y Mazmorras</p>
              </div>

              <div className="mini-portal-highlights">
                <div className="mini-h"><GiDragonSpiral /> <span>Épico</span></div>
                <div className="mini-h"><GiCastle /> <span>Equipos</span></div>
              </div>

              <button className="mini-portal-btn">
                <span>ENTRAR</span>
                <ArrowRightIcon size={16} />
              </button>
            </div>
          </div>

          {/* MODO SURVIVAL */}
          <div
            className={`mini-portal survival ${hoveredPortal === 'survival' ? 'hovered' : ''} ${selectedPortal === 'survival' ? 'selected' : ''}`}
            onMouseEnter={() => setHoveredPortal('survival')}
            onMouseLeave={() => setHoveredPortal(null)}
            onClick={() => handleSelectPortal('survival')}
          >
            <div className="mini-portal-inner">
              <GiSkullCrossedBones size={40} className="mini-portal-icon" />
              <div className="mini-portal-text">
                <h2 className="mini-portal-title">SURVIVAL</h2>
                <p className="mini-portal-desc">Desafío Infinito</p>
              </div>

              <div className="mini-portal-highlights">
                <div className="mini-h"><GiPowerLightning /> <span>Acción</span></div>
                <div className="mini-h"><GiSkullCrossedBones /> <span>Récord</span></div>
              </div>

              <button className="mini-portal-btn">
                <span>AGUANTAR</span>
                <ArrowRightIcon size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="mini-portal-footer">
          <p>VALNOR © 2026</p>
        </div>
      </div>

      {isTransitioning && (
        <div className={`altar-transition ${selectedPortal}`}>
          <div className="magic-seal-mini" />
          <div className="transition-text-mini">ABRIENDO PORTAL...</div>
        </div>
      )}
    </div>
  );
}
