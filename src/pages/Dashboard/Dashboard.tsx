/**
 * Dashboard Principal - Valnor Juego
 * 
 * Layout horizontal con 2 paneles según guía:
 * - Panel Izquierdo (60%): Acciones principales
 * - Panel Derecho (40%): Info del jugador
 * 
 * Iconos SVG vectoriales - Sin emojis
 */

import { useState, useEffect, Suspense, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  AdaptiveDpr, 
  Preload,
  Sky,
  Float,
  Sparkles,
} from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useSessionStore, useIsGuest } from '../../stores/sessionStore';
import { usePlayerStore, usePlayerLevel, usePlayerHealth, usePlayerMana } from '../../stores/playerStore';
import { useGameStore } from '../../stores/gameStore';
import { useGameModeStore, useGameMode } from '../../stores/gameModeStore';
import { useActiveTeam, useTeamPower } from '../../stores/teamStore';
import { EnergyBar, InventorySummary } from '../../components/ui';
import { NotificationBell } from '../../components/notifications';
import {
  GoldIcon,
  GemIcon,
  EnergyIcon,
  SwordIcon,
  SkullIcon,
  ShopIcon,
  MarketIcon,
  TeamIcon,
  TrophyIcon,
  SettingsIcon,
  LogoutIcon,
  LockIcon,
  UserIcon,
  UsersIcon,
  HeartIcon,
  ManaIcon,
  ExpIcon,
  ChartIcon,
  BackpackIcon,
  BookIcon,
  RefreshIcon,
  PlusIcon,
  CloseIcon,
  WarriorIcon,
  MageIcon,
  ArcherIcon,
  PaladinIcon,
  CombatIcon,
  LootIcon,
  LevelUpIcon,
  ValnorLogo,
} from '../../components/icons/GameIcons';
import './Dashboard.css';

// ============================================================
// ESCENA 3D - FORTALEZA RPG
// ============================================================

// Torre medieval
function Tower({ position, height = 8, radius = 1.2 }: { position: [number, number, number], height?: number, radius?: number }) {
  return (
    <group position={position}>
      {/* Cuerpo de la torre */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius * 1.1, height, 8]} />
        <meshStandardMaterial color="#4a4a5a" roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Techo cónico */}
      <mesh position={[0, height / 2 + 1.5, 0]} castShadow>
        <coneGeometry args={[radius * 1.5, 3, 8]} />
        <meshStandardMaterial color="#8b4513" roughness={0.8} />
      </mesh>
      {/* Ventana iluminada */}
      <mesh position={[radius + 0.01, height / 4, 0]}>
        <boxGeometry args={[0.1, 1.2, 0.6]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

// Muralla
function Wall({ start, end, height = 5 }: { start: [number, number, number], end: [number, number, number], height?: number }) {
  const length = Math.sqrt(
    Math.pow(end[0] - start[0], 2) + Math.pow(end[2] - start[2], 2)
  );
  const angle = Math.atan2(end[2] - start[2], end[0] - start[0]);
  const midX = (start[0] + end[0]) / 2;
  const midZ = (start[2] + end[2]) / 2;

  return (
    <mesh position={[midX, height / 2, midZ]} rotation={[0, -angle, 0]} castShadow receiveShadow>
      <boxGeometry args={[length, height, 1.5]} />
      <meshStandardMaterial color="#5a5a6a" roughness={0.85} metalness={0.1} />
    </mesh>
  );
}

// Efecto de energía del portal (anillo giratorio)
function PortalRing({ radius, speed, color, thickness = 0.15 }: { radius: number, speed: number, color: string, thickness?: number }) {
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += speed * 0.01;
      ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });
  
  return (
    <mesh ref={ringRef}>
      <torusGeometry args={[radius, thickness, 16, 64]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color} 
        emissiveIntensity={0.8}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
}

// Portal mágico con energía
function MagicPortal({ position }: { position: [number, number, number] }) {
  const portalRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  
  useFrame((state) => {
    if (portalRef.current) {
      // Ondulación sutil del portal
      portalRef.current.scale.x = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.03;
      portalRef.current.scale.y = 1 + Math.cos(state.clock.elapsedTime * 2) * 0.03;
    }
    if (glowRef.current) {
      // Pulsación de luz
      glowRef.current.intensity = 3 + Math.sin(state.clock.elapsedTime * 3) * 1;
    }
  });
  
  return (
    <group position={position}>
      {/* Marco del portal - Columnas ornamentadas */}
      <mesh position={[-2.5, 4, 0]} castShadow>
        <boxGeometry args={[1, 8, 1.5]} />
        <meshStandardMaterial color="#3d3d4d" roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[2.5, 4, 0]} castShadow>
        <boxGeometry args={[1, 8, 1.5]} />
        <meshStandardMaterial color="#3d3d4d" roughness={0.7} metalness={0.2} />
      </mesh>
      
      {/* Decoraciones doradas en columnas */}
      <mesh position={[-2.5, 7.5, 0.8]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.4} metalness={0.9} />
      </mesh>
      <mesh position={[2.5, 7.5, 0.8]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.4} metalness={0.9} />
      </mesh>
      
      {/* Arco superior con runas */}
      <mesh position={[0, 7.5, 0]} castShadow>
        <boxGeometry args={[6, 1.5, 1.5]} />
        <meshStandardMaterial color="#3d3d4d" roughness={0.7} metalness={0.2} />
      </mesh>
      
      {/* Símbolo central superior */}
      <mesh position={[0, 8.5, 0.8]}>
        <octahedronGeometry args={[0.6]} />
        <meshStandardMaterial color="#9b59b6" emissive="#9b59b6" emissiveIntensity={0.8} />
      </mesh>
      
      {/* PORTAL DE ENERGÍA */}
      <group position={[0, 4, 0.2]}>
        {/* Fondo del portal - vórtice */}
        <mesh ref={portalRef}>
          <circleGeometry args={[2.2, 64]} />
          <meshStandardMaterial 
            color="#1a0a2e"
            emissive="#4a1a6e"
            emissiveIntensity={0.5}
            transparent
            opacity={0.95}
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* Anillos de energía giratorios */}
        <PortalRing radius={2} speed={1} color="#9b59b6" thickness={0.12} />
        <PortalRing radius={1.6} speed={-1.5} color="#3498db" thickness={0.1} />
        <PortalRing radius={1.2} speed={2} color="#ffd700" thickness={0.08} />
        <PortalRing radius={0.7} speed={-2.5} color="#e74c3c" thickness={0.06} />
        
        {/* Centro brillante */}
        <mesh>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        
        {/* Luz del portal */}
        <pointLight ref={glowRef} color="#9b59b6" intensity={3} distance={15} />
        <pointLight color="#3498db" intensity={1.5} distance={10} position={[0, 0, 1]} />
      </group>
      
      {/* Partículas saliendo del portal */}
      <Sparkles 
        count={40}
        scale={[4, 6, 3]}
        size={3}
        speed={0.8}
        color="#9b59b6"
        opacity={0.6}
        position={[0, 4, 1]}
      />
      
      {/* Antorchas en las columnas */}
      <pointLight position={[-3, 5, 1.5]} color="#ff6b00" intensity={1.5} distance={6} />
      <pointLight position={[3, 5, 1.5]} color="#ff6b00" intensity={1.5} distance={6} />
      
      {/* Llamas de antorcha (esferas emisivas) */}
      <Float speed={5} rotationIntensity={0} floatIntensity={0.3}>
        <mesh position={[-3, 5.5, 1]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshBasicMaterial color="#ff6b00" />
        </mesh>
      </Float>
      <Float speed={5} rotationIntensity={0} floatIntensity={0.3}>
        <mesh position={[3, 5.5, 1]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshBasicMaterial color="#ff6b00" />
        </mesh>
      </Float>
    </group>
  );
}

// Piedra individual del camino
function PathStone({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  const randomRotation = Math.random() * Math.PI * 2;
  const randomScale = 0.8 + Math.random() * 0.4;
  
  return (
    <mesh 
      position={position} 
      rotation={[-Math.PI / 2, randomRotation, 0]}
      scale={scale * randomScale}
      receiveShadow
    >
      <cylinderGeometry args={[0.8, 0.9, 0.15, 6]} />
      <meshStandardMaterial 
        color="#5a5a6a" 
        roughness={0.95} 
        metalness={0.05}
      />
    </mesh>
  );
}

// Camino de piedra
function StonePath() {
  const stones = [];
  
  // Camino principal hacia el portal
  for (let i = 0; i < 12; i++) {
    const z = 20 - i * 2.5;
    const xOffset = Math.sin(i * 0.3) * 0.3;
    
    // Piedras centrales (más grandes)
    stones.push(
      <PathStone key={`center-${i}`} position={[xOffset, 0.08, z]} scale={1.2} />
    );
    
    // Piedras laterales
    if (i % 2 === 0) {
      stones.push(
        <PathStone key={`left-${i}`} position={[-1.5 + xOffset, 0.08, z + 0.5]} scale={0.8} />
      );
      stones.push(
        <PathStone key={`right-${i}`} position={[1.5 + xOffset, 0.08, z - 0.3]} scale={0.8} />
      );
    }
  }
  
  // Piedras dispersas alrededor
  const scatteredPositions = [
    [-3, 0.05, 18], [3.5, 0.05, 16], [-2.5, 0.05, 12],
    [4, 0.05, 10], [-4, 0.05, 8], [3, 0.05, 6]
  ];
  
  scatteredPositions.forEach((pos, i) => {
    stones.push(
      <PathStone key={`scatter-${i}`} position={pos as [number, number, number]} scale={0.6} />
    );
  });
  
  return <group>{stones}</group>;
}

// Runas brillantes en el suelo cerca del portal
function FloorRunes({ position }: { position: [number, number, number] }) {
  const runeRef = useRef<THREE.Group>(null);
  
  useFrame((_state) => {
    if (runeRef.current) {
      // Rotación lenta
      runeRef.current.rotation.y += 0.002;
    }
  });
  
  return (
    <group ref={runeRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Círculo exterior de runas */}
      <mesh>
        <ringGeometry args={[5, 5.3, 64]} />
        <meshStandardMaterial 
          color="#9b59b6" 
          emissive="#9b59b6" 
          emissiveIntensity={0.4}
          transparent
          opacity={0.6}
        />
      </mesh>
      {/* Círculo interior */}
      <mesh>
        <ringGeometry args={[3, 3.2, 64]} />
        <meshStandardMaterial 
          color="#ffd700" 
          emissive="#ffd700" 
          emissiveIntensity={0.3}
          transparent
          opacity={0.5}
        />
      </mesh>
      {/* Símbolos (líneas radiales) */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <mesh key={i} rotation={[0, 0, (i * Math.PI) / 4]}>
          <boxGeometry args={[0.1, 5, 0.02]} />
          <meshStandardMaterial 
            color="#9b59b6" 
            emissive="#9b59b6" 
            emissiveIntensity={0.3}
            transparent
            opacity={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}

// Cristal mágico flotante central
function MagicCrystal() {
  return (
    <Float speed={1.5} rotationIntensity={2} floatIntensity={1.5}>
      <group position={[0, 6, -8]}>
        {/* Cristal principal */}
        <mesh castShadow>
          <octahedronGeometry args={[1.5]} />
          <meshStandardMaterial
            color="#9b59b6"
            emissive="#9b59b6"
            emissiveIntensity={0.6}
            transparent
            opacity={0.9}
            roughness={0.1}
            metalness={0.3}
          />
        </mesh>
        {/* Anillo orbital */}
        <mesh rotation={[Math.PI / 4, 0, 0]}>
          <torusGeometry args={[2.5, 0.08, 16, 100]} />
          <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.5} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <torusGeometry args={[2.2, 0.06, 16, 100]} />
          <meshStandardMaterial color="#3498db" emissive="#3498db" emissiveIntensity={0.4} />
        </mesh>
        {/* Luz del cristal */}
        <pointLight color="#9b59b6" intensity={3} distance={15} />
      </group>
    </Float>
  );
}

// Banderas animadas (simuladas con rotación)
function Banner({ position, color }: { position: [number, number, number], color: string }) {
  return (
    <Float speed={3} rotationIntensity={0.3} floatIntensity={0}>
      <group position={position}>
        {/* Asta */}
        <mesh>
          <cylinderGeometry args={[0.05, 0.05, 3, 8]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
        {/* Bandera */}
        <mesh position={[0.6, 0.8, 0]}>
          <boxGeometry args={[1.2, 0.8, 0.05]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
        </mesh>
      </group>
    </Float>
  );
}

function FortressScene() {
  return (
    <>
      {/* Cielo nocturno con estrellas */}
      <Sky
        distance={450000}
        sunPosition={[0, -10, 100]}
        inclination={0.1}
        azimuth={0.25}
      />
      
      {/* Iluminación ambiental */}
      <ambientLight intensity={0.15} color="#4a5568" />
      <directionalLight 
        position={[30, 40, 20]} 
        intensity={0.4} 
        color="#c4b5fd"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      
      {/* Luna */}
      <mesh position={[50, 40, -80]}>
        <sphereGeometry args={[8, 32, 32]} />
        <meshBasicMaterial color="#f5f5dc" />
      </mesh>
      <pointLight position={[50, 40, -80]} color="#e8e4c9" intensity={0.5} distance={200} />
      
      {/* Suelo - Terreno rocoso */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[50, 64]} />
        <meshStandardMaterial color="#2d3748" roughness={1} />
      </mesh>
      
      {/* Plataforma central elevada */}
      <mesh receiveShadow position={[0, 0.5, -5]}>
        <cylinderGeometry args={[12, 14, 1, 32]} />
        <meshStandardMaterial color="#4a5568" roughness={0.9} />
      </mesh>
      
      {/* Torres */}
      <Tower position={[-10, 4, -15]} height={10} radius={1.5} />
      <Tower position={[10, 4, -15]} height={10} radius={1.5} />
      <Tower position={[-12, 3.5, 5]} height={8} radius={1.2} />
      <Tower position={[12, 3.5, 5]} height={8} radius={1.2} />
      
      {/* Murallas */}
      <Wall start={[-10, 0, -15]} end={[10, 0, -15]} height={6} />
      <Wall start={[-12, 0, 5]} end={[-10, 0, -15]} height={5} />
      <Wall start={[12, 0, 5]} end={[10, 0, -15]} height={5} />
      
      {/* Camino de piedra hacia el portal */}
      <StonePath />
      
      {/* Runas mágicas en el suelo */}
      <FloorRunes position={[0, 0.1, 8]} />
      
      {/* Portal mágico con energía */}
      <MagicPortal position={[0, 0, 8]} />
      
      {/* Cristal mágico */}
      <MagicCrystal />
      
      {/* Banderas */}
      <Banner position={[-10, 12, -15]} color="#e74c3c" />
      <Banner position={[10, 12, -15]} color="#ffd700" />
      
      {/* Partículas mágicas */}
      <Sparkles 
        count={150} 
        scale={40} 
        size={2} 
        speed={0.2} 
        color="#9b59b6" 
        opacity={0.5}
        position={[0, 10, -5]}
      />
      <Sparkles 
        count={80} 
        scale={20} 
        size={1.5} 
        speed={0.3} 
        color="#ffd700" 
        opacity={0.4}
        position={[0, 3, 8]}
      />
      
      {/* Niebla atmosférica */}
      <fog attach="fog" args={['#1a1a2e', 20, 80]} />
    </>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#ffd700" wireframe />
    </mesh>
  );
}

// ============================================================
// COMPONENTES UI
// ============================================================

interface ActionCardProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  color: string;
  onClick: () => void;
  locked?: boolean;
  lockMessage?: string;
  badge?: ReactNode;
}

function ActionCard({ icon, title, subtitle, color, onClick, locked, lockMessage, badge }: ActionCardProps) {
  return (
    <button 
      className={`action-card action-card-${color} ${locked ? 'locked' : ''}`}
      onClick={locked ? undefined : onClick}
      disabled={locked}
      title={locked ? lockMessage : undefined}
    >
      <div className="action-card-icon">{icon}</div>
      <div className="action-card-content">
        <span className="action-card-title">{title}</span>
        {subtitle && <span className="action-card-subtitle">{subtitle}</span>}
      </div>
      {locked && <span className="action-card-lock"><LockIcon size={16} /></span>}
      {badge && <span className="action-card-badge">{badge}</span>}
    </button>
  );
}

interface StatBarProps {
  label: string;
  current: number;
  max: number;
  color: string;
  icon: ReactNode;
}

function StatBar({ label, current, max, color, icon }: StatBarProps) {
  const percentage = Math.min(100, (current / max) * 100);
  
  return (
    <div className="stat-bar">
      <div className="stat-bar-header">
        <span className="stat-icon">{icon}</span>
        <span className="stat-label">{label}</span>
        <span className="stat-value" style={{ color }}>{current}/{max}</span>
      </div>
      <div className="stat-bar-track">
        <div 
          className="stat-bar-fill" 
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

interface CharacterSlotProps {
  character?: {
    name: string;
    level: number;
    class: string;
  };
  onClick?: () => void;
  empty?: boolean;
}

function CharacterSlot({ character, onClick, empty }: CharacterSlotProps) {
  const getClassIcon = (cls: string) => {
    switch (cls) {
      case 'warrior': return <WarriorIcon size={22} />;
      case 'mage': return <MageIcon size={22} />;
      case 'archer': return <ArcherIcon size={22} />;
      case 'paladin': return <PaladinIcon size={22} />;
      default: return <UserIcon size={22} />;
    }
  };

  if (empty || !character) {
    return (
      <div className="character-slot empty" onClick={onClick}>
        <PlusIcon size={24} />
      </div>
    );
  }

  return (
    <div className="character-slot" onClick={onClick}>
      <div className="slot-avatar">{getClassIcon(character.class)}</div>
      <span className="slot-name">{character.name}</span>
      <span className="slot-level">Nv.{character.level}</span>
    </div>
  );
}

// ============================================================
// DASHBOARD PRINCIPAL
// ============================================================

const Dashboard = () => {
  const navigate = useNavigate();
  const isGuest = useIsGuest();
  const { guestProfile, endSession } = useSessionStore();
  const gameMode = useGameMode();
  const clearGameMode = useGameModeStore((s) => s.clearMode);
  
  const characterId = usePlayerStore((s) => s.characterId);
  const characterName = usePlayerStore((s) => s.characterName);
  const characterClass = usePlayerStore((s) => s.characterClass);
  const gold = usePlayerStore((s) => s.gold);
  const gems = usePlayerStore((s) => s.gems);
  const stats = usePlayerStore((s) => s.stats);
  const initPlayer = usePlayerStore((s) => s.initPlayer);
  
  const { level, exp, expRequired } = usePlayerLevel();
  const { current: hp, max: maxHp } = usePlayerHealth();
  const { current: mp, max: maxMp } = usePlayerMana();
  const { quality } = useGameStore();
  
  const [is3DReady, setIs3DReady] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showGuestBanner, setShowGuestBanner] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

  const playerName = isGuest 
    ? (guestProfile?.name || 'Invitado')
    : (characterName || 'Aventurero');

  const playerClass = characterClass || 'warrior';
  
  // Cambiar modo de juego
  const handleChangeMode = () => {
    clearGameMode();
    navigate('/portals');
  };

  // Cerrar dropdown de perfil al hacer clic fuera
  const closeDropdowns = useCallback(() => {
    setShowProfile(false);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.header-right')) {
        closeDropdowns();
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [closeDropdowns]);

  // Equipo activo desde store
  const activeTeam = useActiveTeam();
  const teamPower = useTeamPower();

  // Actividad reciente
  const recentActivity = [
    { id: 1, text: 'Completaste el tutorial', time: 'Hace 5 min', icon: <CombatIcon size={16} /> },
    { id: 2, text: 'Subiste a nivel 5', time: 'Hace 10 min', icon: <LevelUpIcon size={16} /> },
    { id: 3, text: 'Obtuviste 50 VAL', time: 'Hace 15 min', icon: <LootIcon size={16} /> },
  ];

  useEffect(() => {
    if (isGuest && !characterId) {
      initPlayer({
        characterId: `guest_${Date.now()}`,
        characterName: guestProfile?.name || 'Invitado',
        characterClass: 'warrior',
        level: 1,
        gold: 100,
        gems: 10,
        energy: 50,
        maxEnergy: 50,
      });
    }
  }, [isGuest, characterId, guestProfile?.name, initPlayer]);

  const handleLogout = useCallback(() => {
    endSession();
    navigate('/splash');
  }, [endSession, navigate]);

  const handleSelectMode = (mode: 'rpg' | 'survival') => {
    setShowModeSelector(false);
    if (mode === 'rpg') {
      navigate('/dungeon');
    } else {
      navigate('/survival');
    }
  };

  const getMainClassIcon = (cls: string) => {
    switch (cls) {
      case 'warrior': return <WarriorIcon size={28} />;
      case 'mage': return <MageIcon size={28} />;
      case 'archer': return <ArcherIcon size={28} />;
      case 'paladin': return <PaladinIcon size={28} />;
      default: return <UserIcon size={28} />;
    }
  };

  return (
    <div className="dashboard smooth-transition">
      {/* ===== FONDO 3D ===== */}
      <div className="dashboard-bg">
        <Canvas
          shadows
          dpr={[0.5, 1]}
          camera={{ position: [0, 12, 30], fov: 45 }}
          gl={{ antialias: quality !== 'low', powerPreference: 'high-performance' }}
          onCreated={() => setIs3DReady(true)}
        >
          <Suspense fallback={<LoadingFallback />}>
            <FortressScene />
          </Suspense>
          <OrbitControls
            target={[0, 5, -5]}
            minDistance={20}
            maxDistance={50}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.15}
            enableZoom={false}
            maxPolarAngle={Math.PI / 2.2}
          />
          <AdaptiveDpr pixelated />
          <Preload all />
        </Canvas>
        
        {!is3DReady && (
          <div className="dashboard-loading">
            <div className="loading-spinner" />
            <p>Cargando...</p>
          </div>
        )}
      </div>

      {/* ===== BANNER INVITADO - Solo si está visible ===== */}
      {isGuest && showGuestBanner && (
        <div className="guest-banner">
          <div className="guest-banner-content">
            <GemIcon size={16} color="#ffd700" />
            <span>Modo Demo</span>
            <span className="guest-banner-divider">•</span>
            <span className="guest-banner-cta" onClick={() => navigate('/auth/register')}>
              Guardar progreso
            </span>
          </div>
          <button className="guest-banner-close" onClick={() => setShowGuestBanner(false)}>
            <CloseIcon size={14} />
          </button>
        </div>
      )}

      {/* ===== HEADER ===== */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="brand">
            <ValnorLogo size={36} />
            <span className="brand-text">VALNOR</span>
          </div>
          
          {/* Indicador de modo actual */}
          {gameMode && (
            <button className="mode-indicator" onClick={handleChangeMode} title="Cambiar modo de juego">
              <span className={`mode-badge ${gameMode}`}>
                {gameMode === 'rpg' ? 'Historia' : 'Survival'}
              </span>
              <RefreshIcon size={12} />
            </button>
          )}
        </div>

        <div className="header-center">
          <div className="resource-bar">
            <div className="resource gold">
              <GoldIcon size={22} />
              <span>{gold.toLocaleString()}</span>
            </div>
            <div className="resource gems">
              <GemIcon size={22} />
              <span>{gems.toLocaleString()}</span>
            </div>
            <EnergyBar />
          </div>
        </div>

        <div className="header-right">
          {/* Botón de Perfil */}
          <button className="header-btn profile-btn" onClick={() => setShowProfile(!showProfile)} title="Mi Perfil">
            {getMainClassIcon(playerClass)}
          </button>
          
          {/* Dropdown de Perfil */}
          {showProfile && (
            <div className="dropdown-menu profile-dropdown">
              <div className="dropdown-header">
                <div className="profile-avatar">{getMainClassIcon(playerClass)}</div>
                <div className="profile-info">
                  <span className="profile-name">{playerName}</span>
                  <span className="profile-level">Nivel {level} • {playerClass}</span>
                </div>
              </div>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={() => { setShowProfile(false); navigate('/inventory'); }}>
                <BackpackIcon size={16} /> Mi Inventario
              </button>
              <button className="dropdown-item" onClick={() => { setShowProfile(false); navigate('/teams'); }}>
                <UsersIcon size={16} /> Mis Equipos
              </button>
              <button className="dropdown-item" onClick={() => { setShowProfile(false); navigate('/ranking'); }}>
                <TrophyIcon size={16} /> Mi Ranking
              </button>
              <div className="dropdown-divider" />
              {isGuest ? (
                <button className="dropdown-item highlight" onClick={() => { setShowProfile(false); navigate('/auth/register'); }}>
                  <UserIcon size={16} /> Crear Cuenta
                </button>
              ) : (
                <button className="dropdown-item" onClick={() => { setShowProfile(false); /* editar perfil */ }}>
                  <SettingsIcon size={16} /> Editar Perfil
                </button>
              )}
            </div>
          )}
          
          {/* Botón de Notificaciones - Componente integrado */}
          <NotificationBell />
          
          {/* Botón de Configuración - Navega a página Settings */}
          <button className="header-btn" onClick={() => navigate('/settings')} title="Configuración">
            <SettingsIcon size={18} />
          </button>
          
          {/* Botón de Perfil - Navega a página Profile */}
          <button className="header-btn" onClick={() => navigate('/profile')} title="Mi Perfil">
            <UserIcon size={18} />
          </button>
          
          <button className="header-btn logout" onClick={handleLogout} title="Salir">
            <LogoutIcon size={18} />
          </button>
        </div>
      </header>

      {/* ===== CONTENIDO PRINCIPAL (2 PANELES) ===== */}
      <main className="dashboard-content">
        
        {/* PANEL IZQUIERDO - ACCIONES (60%) */}
        <section className="panel-left">
          <h2 className="panel-title">
            <SwordIcon size={20} color="#ffd700" />
            Área de Juego
          </h2>
          
          {/* Modos de juego principales */}
          <div className="action-cards-main">
            <ActionCard
              icon={<SwordIcon size={40} />}
              title="MODO RPG"
              subtitle="Dungeons con tu equipo"
              color="red"
              onClick={() => handleSelectMode('rpg')}
              badge={<><UsersIcon size={14} /> Equipo</>}
            />
            <ActionCard
              icon={<SkullIcon size={40} />}
              title="SURVIVAL"
              subtitle="1 héroe, oleadas infinitas"
              color="purple"
              onClick={() => handleSelectMode('survival')}
              badge={<><UserIcon size={14} /> Solo</>}
            />
          </div>

          {/* Acciones secundarias */}
          <div className="action-cards-secondary">
            <ActionCard
              icon={<ShopIcon size={28} />}
              title="Tienda"
              subtitle={isGuest ? "Solo ver" : undefined}
              color="orange"
              onClick={() => navigate('/shop')}
              locked={isGuest}
              lockMessage="Regístrate para comprar"
            />
            <ActionCard
              icon={<MarketIcon size={28} />}
              title="Mercado P2P"
              subtitle={isGuest ? "Solo ver" : undefined}
              color="blue"
              onClick={() => navigate('/marketplace')}
              locked={isGuest}
              lockMessage="Regístrate para comerciar"
            />
            <ActionCard
              icon={<TeamIcon size={28} />}
              title="Equipos"
              subtitle="Gestionar formaciones"
              color="green"
              onClick={() => navigate('/teams')}
            />
            <ActionCard
              icon={<TrophyIcon size={28} />}
              title="Ranking"
              subtitle="Ver clasificación"
              color="yellow"
              onClick={() => navigate('/ranking')}
            />
          </div>

          {/* Footer del panel izquierdo */}
          <div className="panel-footer-left">
            <button className="footer-btn" onClick={() => navigate('/inventory')}>
              <BackpackIcon size={16} /> Inventario
            </button>
            <button className="footer-btn" onClick={() => navigate('/wiki')}>
              <BookIcon size={16} /> Wiki
            </button>
          </div>
        </section>

        {/* PANEL DERECHO - INFO (40%) */}
        <aside className="panel-right">
          
          {/* Info del jugador */}
          <div className="player-card">
            <div className="player-avatar">
              {getMainClassIcon(playerClass)}
              <span className="level-badge">Lv.{level}</span>
            </div>
            <div className="player-info">
              <h3 className="player-name">
                {playerName.toUpperCase()}
                {isGuest && <span className="guest-tag">DEMO</span>}
              </h3>
              <span className="player-class">{playerClass}</span>
            </div>
          </div>

          {/* Equipo activo */}
          <div className="team-section">
            <h4 className="section-title">
              <UsersIcon size={16} color="#ffd700" />
              Equipo Activo
              <span className="team-power" title="Poder total del equipo">⚔️ {teamPower}</span>
              <button className="edit-btn" onClick={() => navigate('/teams')}>
                <RefreshIcon size={14} />
              </button>
            </h4>
            <div className="team-slots">
              {activeTeam.map((char, i) => (
                <CharacterSlot key={char.id || i} character={char} />
              ))}
              {activeTeam.length < 4 && <CharacterSlot empty onClick={() => navigate('/teams')} />}
            </div>
          </div>

          {/* Stats rápidos */}
          <div className="stats-section">
            <h4 className="section-title">
              <ChartIcon size={16} />
              Estadísticas
            </h4>
            <StatBar label="Vida" current={hp} max={maxHp} color="#e74c3c" icon={<HeartIcon size={14} />} />
            <StatBar label="Maná" current={mp} max={maxMp} color="#3498db" icon={<ManaIcon size={14} />} />
            <StatBar label="EXP" current={exp} max={expRequired} color="#2ecc71" icon={<ExpIcon size={14} />} />
            
            <div className="stats-grid">
              <div className="stat-item"><span>ATK</span><strong>{stats.attack}</strong></div>
              <div className="stat-item"><span>DEF</span><strong>{stats.defense}</strong></div>
              <div className="stat-item"><span>M.ATK</span><strong>{stats.magicAttack}</strong></div>
              <div className="stat-item"><span>SPD</span><strong>{stats.speed}</strong></div>
            </div>
          </div>

          {/* Resumen del inventario */}
          <InventorySummary />

          {/* Actividad reciente */}
          <div className="activity-section">
            <h4 className="section-title">
              <BookIcon size={16} color="#ffd700" />
              Actividad Reciente
            </h4>
            <div className="activity-feed">
              {recentActivity.map((item) => (
                <div key={item.id} className="activity-item">
                  <span className="activity-icon">{item.icon}</span>
                  <span className="activity-text">{item.text}</span>
                  <span className="activity-time">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA para invitados */}
          {isGuest && (
            <div className="cta-register">
              <h4><GemIcon size={18} color="#2ecc71" /> Regístrate y obtén:</h4>
              <ul>
                <li><GoldIcon size={14} /> 500 VAL de bienvenida</li>
                <li><BackpackIcon size={14} /> Paquete Pionero GRATIS</li>
                <li><LevelUpIcon size={14} /> Guarda tu progreso</li>
              </ul>
              <button className="cta-btn" onClick={() => navigate('/auth/register')}>
                Crear Cuenta Gratis
              </button>
            </div>
          )}
        </aside>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="dashboard-footer">
        <div className="footer-left">
          <span className="quality-badge">
            <EnergyIcon size={14} /> {quality.toUpperCase()}
          </span>
        </div>
        <div className="footer-center">
          <button className="footer-nav-btn" onClick={() => navigate('/ranking')}>
            <TrophyIcon size={16} /> Rankings
          </button>
          <button className="footer-nav-btn" onClick={() => navigate('/inventory')}>
            <BackpackIcon size={16} /> Inventario
          </button>
          <button className="footer-nav-btn" onClick={() => navigate('/wiki')}>
            <BookIcon size={16} /> Wiki
          </button>
        </div>
        <div className="footer-right">
          <span className="version">v1.0.0</span>
        </div>
      </footer>

      {/* ===== MODAL SELECTOR DE MODO ===== */}
      {showModeSelector && (
        <div className="modal-overlay" onClick={() => setShowModeSelector(false)}>
          <div className="mode-selector-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModeSelector(false)}>
              <CloseIcon size={18} />
            </button>
            <h2><SwordIcon size={24} color="#ffd700" /> Elige tu Modo de Juego</h2>
            
            <div className="mode-cards">
              <div className="mode-card rpg" onClick={() => handleSelectMode('rpg')}>
                <div className="mode-icon"><SwordIcon size={48} /></div>
                <h3>MODO RPG</h3>
                <p>Dungeons con Equipo</p>
                <ul>
                  <li><UsersIcon size={14} /> USA TU EQUIPO (múltiples)</li>
                  <li><SettingsIcon size={14} /> Combate automático</li>
                  <li><TrophyIcon size={14} /> Progresión por mazmorra</li>
                </ul>
                <span className="mode-cost"><GemIcon size={14} /> 1 Boleto</span>
                <button className="mode-btn"><SwordIcon size={16} /> SELECCIONAR</button>
              </div>
              
              <div className="mode-card survival" onClick={() => handleSelectMode('survival')}>
                <div className="mode-icon"><SkullIcon size={48} /></div>
                <h3>SURVIVAL</h3>
                <p>1 Héroe vs Oleadas</p>
                <ul>
                  <li><UserIcon size={14} /> 1 SOLO PERSONAJE</li>
                  <li><CombatIcon size={14} /> Combate manual</li>
                  <li><ChartIcon size={14} /> Oleadas infinitas</li>
                </ul>
                <span className="mode-cost"><EnergyIcon size={14} /> 5 Energía</span>
                <button className="mode-btn"><SkullIcon size={16} /> SELECCIONAR</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
