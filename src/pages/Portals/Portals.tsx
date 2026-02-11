/**
 * Portals - Pantalla de selección de modo (RPG vs Survival)
 * 
 * Dos portales grandes con efectos 3D para elegir el modo de juego
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  Float, 
  Sparkles,
  Stars,
} from '@react-three/drei';
import { useGameModeStore } from '../../stores/gameModeStore';
import {
  GiCrossedSwords,
  GiSkullCrossedBones,
  GiThreeFriends,
  GiTrophy,
  GiPowerLightning,
  GiChart,
  GiTicket,
  GiLightningFrequency,
} from 'react-icons/gi';
import { FiUser } from 'react-icons/fi';
import './Portals.css';

// Portal 3D Component
function Portal3D({ 
  position, 
  color, 
  isHovered 
}: { 
  position: [number, number, number], 
  color: string,
  isHovered: boolean 
}) {
  return (
    <group position={position}>
      {/* Marco del portal */}
      <mesh castShadow>
        <torusGeometry args={[2, 0.3, 16, 32]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.8} 
          roughness={0.2}
          emissive={color}
          emissiveIntensity={isHovered ? 0.5 : 0.2}
        />
      </mesh>
      
      {/* Centro del portal */}
      <mesh>
        <circleGeometry args={[1.7, 64]} />
        <meshStandardMaterial 
          color="#0a0a1a"
          emissive={color}
          emissiveIntensity={isHovered ? 0.8 : 0.3}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* Anillo interior giratorio */}
      <Float speed={3} rotationIntensity={2} floatIntensity={0}>
        <mesh>
          <torusGeometry args={[1.4, 0.08, 8, 32]} />
          <meshStandardMaterial 
            color={color} 
            emissive={color}
            emissiveIntensity={1}
            transparent
            opacity={0.8}
          />
        </mesh>
      </Float>
      
      {/* Partículas */}
      <Sparkles 
        count={isHovered ? 60 : 30}
        scale={[3, 3, 1]}
        size={isHovered ? 4 : 2}
        speed={0.6}
        color={color}
        opacity={0.7}
      />
      
      {/* Luz del portal */}
      <pointLight 
        color={color} 
        intensity={isHovered ? 3 : 1.5} 
        distance={10} 
      />
    </group>
  );
}

// Escena 3D completa
function PortalsScene({ 
  hoveredPortal 
}: { 
  hoveredPortal: 'rpg' | 'survival' | null 
}) {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 10, 10]} intensity={0.5} />
      
      {/* Estrellas de fondo */}
      <Stars 
        radius={100} 
        depth={50} 
        count={3000} 
        factor={4} 
        saturation={0} 
      />
      
      {/* Portal RPG (izquierda) */}
      <Portal3D 
        position={[-3, 0, 0]} 
        color="#ffd700" 
        isHovered={hoveredPortal === 'rpg'}
      />
      
      {/* Portal Survival (derecha) */}
      <Portal3D 
        position={[3, 0, 0]} 
        color="#e74c3c" 
        isHovered={hoveredPortal === 'survival'}
      />
      
      <OrbitControls 
        enableZoom={false} 
        enablePan={false}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 3}
      />
    </>
  );
}

export function Portals() {
  const navigate = useNavigate();
  const setMode = useGameModeStore((s) => s.setMode);
  const [hoveredPortal, setHoveredPortal] = useState<'rpg' | 'survival' | null>(null);
  const [selectedPortal, setSelectedPortal] = useState<'rpg' | 'survival' | null>(null);

  const handleSelectMode = (mode: 'rpg' | 'survival') => {
    setSelectedPortal(mode);
    
    // Pequeña animación antes de navegar
    setTimeout(() => {
      setMode(mode);
      navigate('/dashboard');
    }, 600);
  };

  return (
    <div className="portals-page">
      {/* Canvas 3D de fondo */}
      <div className="portals-canvas-container">
        <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
          <PortalsScene hoveredPortal={hoveredPortal} />
        </Canvas>
      </div>

      {/* Rune particles CSS overlay */}
      <div className="portals-rune-particles">
        {[...'✦◆★✶⬡✧◇⬢✦◆'].map((ch, i) => (
          <span key={i}>{ch}</span>
        ))}
      </div>

      {/* Overlay UI */}
      <div className="portals-overlay">
        {/* Header */}
        <header className="portals-header">
          <h1>Elige tu Destino</h1>
          <p>Selecciona un portal para comenzar tu aventura</p>
        </header>

        {/* Portal Cards */}
        <div className="portal-cards-container">
          {/* RPG Portal */}
          <div 
            className={`portal-card rpg ${selectedPortal === 'rpg' ? 'selected' : ''}`}
            onMouseEnter={() => setHoveredPortal('rpg')}
            onMouseLeave={() => setHoveredPortal(null)}
            onClick={() => handleSelectMode('rpg')}
          >
            <div className="portal-glow rpg"></div>
            <div className="portal-content">
              <div className="portal-icon">
                <GiCrossedSwords size={48} color="#ffd700" />
              </div>
              <h2>DUNGEONS</h2>
              <p className="portal-subtitle">Aventura por Equipos</p>
              
              <div className="portal-features">
                <div className="feature">
                  <GiThreeFriends size={18} color="#ffd700" />
                  <span>Equipo de 1-4 héroes</span>
                </div>
                <div className="feature">
                  <GiTrophy size={18} color="#ffd700" />
                  <span>Mazmorras y jefes</span>
                </div>
                <div className="feature">
                  <GiChart size={18} color="#ffd700" />
                  <span>Combate automático</span>
                </div>
              </div>
              
              <div className="portal-cost">
                <span className="cost-label">Costo por partida:</span>
                <span className="cost-value"><GiTicket className="cost-icon rpg" /> 1 Boleto</span>
              </div>
              
              <button className="enter-portal-btn rpg">
                Entrar al Portal
              </button>
            </div>
          </div>

          {/* Survival Portal */}
          <div 
            className={`portal-card survival ${selectedPortal === 'survival' ? 'selected' : ''}`}
            onMouseEnter={() => setHoveredPortal('survival')}
            onMouseLeave={() => setHoveredPortal(null)}
            onClick={() => handleSelectMode('survival')}
          >
            <div className="portal-glow survival"></div>
            <div className="portal-content">
              <div className="portal-icon">
                <GiSkullCrossedBones size={48} color="#e74c3c" />
              </div>
              <h2>SURVIVAL</h2>
              <p className="portal-subtitle">Supervivencia en Tiempo Real</p>
              
              <div className="portal-features">
                <div className="feature">
                  <FiUser size={18} color="#e74c3c" />
                  <span>Un solo héroe</span>
                </div>
                <div className="feature">
                  <GiSkullCrossedBones size={18} color="#e74c3c" />
                  <span>Oleadas de enemigos</span>
                </div>
                <div className="feature">
                  <GiPowerLightning size={18} color="#e74c3c" />
                  <span>Acción en tiempo real</span>
                </div>
              </div>
              
              <div className="portal-cost">
                <span className="cost-label">Costo por partida:</span>
                <span className="cost-value"><GiLightningFrequency className="cost-icon survival" /> 10 Energía</span>
              </div>
              
              <button className="enter-portal-btn survival">
                Entrar al Portal
              </button>
            </div>
          </div>
        </div>

        {/* Footer hint */}
        <div className="portals-footer">
          <p>Puedes cambiar de modo en cualquier momento desde el Dashboard</p>
        </div>
      </div>

      {/* Transition overlay */}
      {selectedPortal && (
        <div className={`portal-transition ${selectedPortal}`}>
          <div className="transition-content">
            <div className="transition-spinner"></div>
            <span>Entrando al portal...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Portals;
