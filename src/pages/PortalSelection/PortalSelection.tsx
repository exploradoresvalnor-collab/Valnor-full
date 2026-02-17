/**
 * Portal Selection Page - Selección de Modo de Juego
 * 
 * Usa la misma escena 3D del Dashboard
 * Diseño horizontal optimizado - Solo vectores SVG
 */

import { useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, AdaptiveDpr, Preload } from '@react-three/drei';
import { useGameModeStore, GameMode } from '../../stores/gameModeStore';
import { GiCastle } from 'react-icons/gi';
import { SpaceScene } from '../../components/scene/SpaceScene';
import './PortalSelection.css';

// ============================================================
// ICONOS SVG VECTORIALES
// ============================================================

const BookIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
);

const BoltIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const SwordIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.25 3.75L3.75 20.25M18 6l-3.75 3.75M12 12l-6 6M6 18l-2.25 2.25M3.75 15.75l4.5-4.5M7.5 12l6-6" />
  </svg>
);

const CastleIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18M4 21V10l2-2V4h2v4l2-2 2 2V4h2v4l2 2v11M9 21v-6h6v6M12 9v3" />
  </svg>
);

const UsersIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const MapIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
  </svg>
);

const SkullIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C7.03 2 3 6.03 3 11c0 2.39.93 4.56 2.45 6.17.35.37.55.87.55 1.39V20c0 .55.45 1 1 1h10c.55 0 1-.45 1-1v-1.44c0-.52.2-1.02.55-1.39C20.07 15.56 21 13.39 21 11c0-4.97-4.03-9-9-9zM9 16c-.83 0-1.5-.67-1.5-1.5S8.17 13 9 13s1.5.67 1.5 1.5S9.83 16 9 16zm6 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
  </svg>
);

const TrophyIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5A3.375 3.375 0 0012.75 11.25h-1.5A3.375 3.375 0 007.5 14.25v4.5m9-10.5h1.5a2.25 2.25 0 002.25-2.25V4.5a.75.75 0 00-.75-.75h-2.25a.75.75 0 00-.75.75v1.5a3 3 0 01-3 3H9a3 3 0 01-3-3V4.5a.75.75 0 00-.75-.75H3a.75.75 0 00-.75.75v1.5A2.25 2.25 0 004.5 8.25H6" />
  </svg>
);

const ChartIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
  </svg>
);

const GemIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12L12 3 3 12l9 9 9-9z" />
    <path d="M3 12h18M12 3v18M7.5 7.5L12 12l4.5-4.5" />
  </svg>
);

const ArrowRightIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

// ============================================================
// LOADING FALLBACK
// ============================================================

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#ffd700" wireframe />
    </mesh>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

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
    
    setTimeout(() => {
      navigate('/dashboard');
    }, 1200);
  };
  
  return (
    <div className={`portal-page ${isTransitioning ? 'transitioning' : ''} ${selectedPortal ? `selected-${selectedPortal}` : ''}`}>
      
      {/* Escena 3D de fondo - Espacio */}
      <div className="portal-3d-background">
        <Canvas
          camera={{ position: [0, 0, 30], fov: 60 }}
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 1.5]}
        >
          <Suspense fallback={<LoadingFallback />}>
            <SpaceScene />
            <OrbitControls
              enablePan={false}
              enableZoom={false}
              enableRotate={false}
              autoRotate={false}
            />
            <AdaptiveDpr pixelated />
            <Preload all />
          </Suspense>
        </Canvas>
        <div className="scene-overlay" />
      </div>
      
      {/* Contenido UI */}
      <div className="portal-content">
        
        {/* Header */}
        <header className="portal-header">
          <div className="logo-container">
            <GiCastle size={48} color="#ffd700" />
          </div>
          <div className="header-text">
            <h1 className="main-title">Elige tu Destino</h1>
            <p className="main-subtitle">Selecciona el modo de juego que prefieras</p>
          </div>
        </header>
        
        {/* Portales */}
        <div className="portals-container">
          
          {/* Portal RPG */}
          <div 
            className={`portal-card rpg ${hoveredPortal === 'rpg' ? 'hovered' : ''} ${selectedPortal === 'rpg' ? 'selected' : ''}`}
            onMouseEnter={() => setHoveredPortal('rpg')}
            onMouseLeave={() => setHoveredPortal(null)}
            onClick={() => handleSelectPortal('rpg')}
          >
            <div className="card-glow" />
            <div className="card-border" />
            
            <div className="card-header">
              <div className="card-icon">
                <BookIcon size={32} />
              </div>
              <div className="card-titles">
                <h2 className="card-title">Modo Historia</h2>
                <span className="card-subtitle">Aventura RPG Épica</span>
              </div>
            </div>
            
            <div className="card-features">
              <div className="feature">
                <div className="feature-icon"><SwordIcon size={18} /></div>
                <span>Campaña narrativa</span>
              </div>
              <div className="feature">
                <div className="feature-icon"><CastleIcon size={18} /></div>
                <span>Mazmorras y jefes</span>
              </div>
              <div className="feature">
                <div className="feature-icon"><UsersIcon size={18} /></div>
                <span>Sistema de equipos</span>
              </div>
              <div className="feature">
                <div className="feature-icon"><MapIcon size={18} /></div>
                <span>Mundo por explorar</span>
              </div>
            </div>
            
            <div className="card-action">
              <button className="card-btn" onClick={(e) => { e.stopPropagation(); handleSelectPortal('rpg'); }}>
                <span>Seleccionar Modo Historia</span>
                <ArrowRightIcon size={18} />
              </button>
              <div className="card-click-hint">👆 Toca para seleccionar</div>
            </div>
          </div>
          
          {/* Separador */}
          <div className="portals-divider">
            <div className="divider-line" />
            <span className="divider-text">VS</span>
            <div className="divider-line" />
          </div>
          
          {/* Portal Survival */}
          <div 
            className={`portal-card survival ${hoveredPortal === 'survival' ? 'hovered' : ''} ${selectedPortal === 'survival' ? 'selected' : ''}`}
            onMouseEnter={() => setHoveredPortal('survival')}
            onMouseLeave={() => setHoveredPortal(null)}
            onClick={() => handleSelectPortal('survival')}
          >
            <div className="card-glow" />
            <div className="card-border" />
            
            <div className="card-header">
              <div className="card-icon">
                <BoltIcon size={32} />
              </div>
              <div className="card-titles">
                <h2 className="card-title">Modo Survival</h2>
                <span className="card-subtitle">Desafío Sin Límites</span>
              </div>
            </div>
            
            <div className="card-features">
              <div className="feature">
                <div className="feature-icon"><SkullIcon size={18} /></div>
                <span>Oleadas infinitas</span>
              </div>
              <div className="feature">
                <div className="feature-icon"><TrophyIcon size={18} /></div>
                <span>Rankings globales</span>
              </div>
              <div className="feature">
                <div className="feature-icon"><ChartIcon size={18} /></div>
                <span>Dificultad escalable</span>
              </div>
              <div className="feature">
                <div className="feature-icon"><GemIcon size={18} /></div>
                <span>Recompensas únicas</span>
              </div>
            </div>
            
            <div className="card-action">
              <button className="card-btn" onClick={(e) => { e.stopPropagation(); handleSelectPortal('survival'); }}>
                <span>Seleccionar Modo Survival</span>
                <ArrowRightIcon size={18} />
              </button>
              <div className="card-click-hint">👆 Toca para seleccionar</div>
            </div>
          </div>
        </div>
        
        {/* Footer hint */}
        <div className="portal-hint">
          <span>💡 Puedes cambiar de modo en cualquier momento desde el menú principal</span>
        </div>
      </div>
      
      {/* Transición */}
      {isTransitioning && (
        <div className={`transition-overlay ${selectedPortal}`}>
          <div className="transition-portal">
            <div className="portal-rings">
              <div className="ring ring-1" />
              <div className="ring ring-2" />
              <div className="ring ring-3" />
            </div>
          </div>
          <div className="transition-text">Entrando al portal...</div>
        </div>
      )}
    </div>
  );
}
