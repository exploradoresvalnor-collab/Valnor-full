/**
 * FortressScene - Escena 3D compartida
 * Reutilizable entre Dashboard y PortalSelection
 * Versión mejorada con más atmósfera
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky, Float, Sparkles, Stars, Cloud } from '@react-three/drei';
import * as THREE from 'three';

// ============================================================
// COMPONENTES 3D
// ============================================================

// Torre medieval
export function Tower({ position, height = 8, radius = 1.2 }: { position: [number, number, number], height?: number, radius?: number }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius * 1.1, height, 8]} />
        <meshStandardMaterial color="#4a4a5a" roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh position={[0, height / 2 + 1.5, 0]} castShadow>
        <coneGeometry args={[radius * 1.5, 3, 8]} />
        <meshStandardMaterial color="#8b4513" roughness={0.8} />
      </mesh>
      <mesh position={[radius + 0.01, height / 4, 0]}>
        <boxGeometry args={[0.1, 1.2, 0.6]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

// Muralla
export function Wall({ start, end, height = 5 }: { start: [number, number, number], end: [number, number, number], height?: number }) {
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

// Efecto de energía del portal
export function PortalRing({ radius, speed, color, thickness = 0.15 }: { radius: number, speed: number, color: string, thickness?: number }) {
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
export function MagicPortal({ position }: { position: [number, number, number] }) {
  const portalRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  
  useFrame((state) => {
    if (portalRef.current) {
      portalRef.current.scale.x = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.03;
      portalRef.current.scale.y = 1 + Math.cos(state.clock.elapsedTime * 2) * 0.03;
    }
    if (glowRef.current) {
      glowRef.current.intensity = 3 + Math.sin(state.clock.elapsedTime * 3) * 1;
    }
  });
  
  return (
    <group position={position}>
      {/* Marco del portal */}
      <mesh position={[-2.5, 4, 0]} castShadow>
        <boxGeometry args={[1, 8, 1.5]} />
        <meshStandardMaterial color="#3d3d4d" roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[2.5, 4, 0]} castShadow>
        <boxGeometry args={[1, 8, 1.5]} />
        <meshStandardMaterial color="#3d3d4d" roughness={0.7} metalness={0.2} />
      </mesh>
      
      {/* Decoraciones doradas */}
      <mesh position={[-2.5, 7.5, 0.8]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.4} metalness={0.9} />
      </mesh>
      <mesh position={[2.5, 7.5, 0.8]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.4} metalness={0.9} />
      </mesh>
      
      {/* Arco superior */}
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
        
        <PortalRing radius={2} speed={1} color="#9b59b6" thickness={0.12} />
        <PortalRing radius={1.6} speed={-1.5} color="#3498db" thickness={0.1} />
        <PortalRing radius={1.2} speed={2} color="#ffd700" thickness={0.08} />
        <PortalRing radius={0.7} speed={-2.5} color="#e74c3c" thickness={0.06} />
        
        <mesh>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        
        <pointLight ref={glowRef} color="#9b59b6" intensity={3} distance={15} />
        <pointLight color="#3498db" intensity={1.5} distance={10} position={[0, 0, 1]} />
      </group>
      
      <Sparkles 
        count={40}
        scale={[4, 6, 3]}
        size={3}
        speed={0.8}
        color="#9b59b6"
        opacity={0.6}
        position={[0, 4, 1]}
      />
      
      <pointLight position={[-3, 5, 1.5]} color="#ff6b00" intensity={1.5} distance={6} />
      <pointLight position={[3, 5, 1.5]} color="#ff6b00" intensity={1.5} distance={6} />
      
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
      <meshStandardMaterial color="#5a5a6a" roughness={0.95} metalness={0.05} />
    </mesh>
  );
}

// Camino de piedra
export function StonePath() {
  const stones = [];
  
  for (let i = 0; i < 12; i++) {
    const z = 20 - i * 2.5;
    const xOffset = Math.sin(i * 0.3) * 0.3;
    
    stones.push(
      <PathStone key={`center-${i}`} position={[xOffset, 0.08, z]} scale={1.2} />
    );
    
    if (i % 2 === 0) {
      stones.push(
        <PathStone key={`left-${i}`} position={[-1.5 + xOffset, 0.08, z + 0.5]} scale={0.8} />
      );
      stones.push(
        <PathStone key={`right-${i}`} position={[1.5 + xOffset, 0.08, z - 0.3]} scale={0.8} />
      );
    }
  }
  
  const scatteredPositions: [number, number, number][] = [
    [-3, 0.05, 18], [3.5, 0.05, 16], [-2.5, 0.05, 12],
    [4, 0.05, 10], [-4, 0.05, 8], [3, 0.05, 6]
  ];
  
  scatteredPositions.forEach((pos, i) => {
    stones.push(
      <PathStone key={`scatter-${i}`} position={pos} scale={0.6} />
    );
  });
  
  return <group>{stones}</group>;
}

// Runas brillantes en el suelo
export function FloorRunes({ position }: { position: [number, number, number] }) {
  const runeRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (runeRef.current) {
      runeRef.current.rotation.y += 0.002;
    }
  });
  
  return (
    <group ref={runeRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
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

// Cristal mágico flotante
export function MagicCrystal() {
  return (
    <Float speed={1.5} rotationIntensity={2} floatIntensity={1.5}>
      <group position={[0, 6, -8]}>
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
        <mesh rotation={[Math.PI / 4, 0, 0]}>
          <torusGeometry args={[2.5, 0.08, 16, 100]} />
          <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.5} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <torusGeometry args={[2.2, 0.06, 16, 100]} />
          <meshStandardMaterial color="#3498db" emissive="#3498db" emissiveIntensity={0.4} />
        </mesh>
        <pointLight color="#9b59b6" intensity={3} distance={15} />
      </group>
    </Float>
  );
}

// Banderas
export function Banner({ position, color }: { position: [number, number, number], color: string }) {
  return (
    <Float speed={3} rotationIntensity={0.3} floatIntensity={0}>
      <group position={position}>
        <mesh>
          <cylinderGeometry args={[0.05, 0.05, 3, 8]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
        <mesh position={[0.6, 0.8, 0]}>
          <boxGeometry args={[1.2, 0.8, 0.05]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
        </mesh>
      </group>
    </Float>
  );
}

// Montaña de fondo
function Mountain({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh>
        <coneGeometry args={[8, 20, 6]} />
        <meshStandardMaterial color="#1a1a2e" roughness={1} />
      </mesh>
      {/* Pico nevado */}
      <mesh position={[0, 8, 0]}>
        <coneGeometry args={[3, 6, 6]} />
        <meshStandardMaterial color="#4a5568" roughness={0.9} />
      </mesh>
    </group>
  );
}

// Árbol muerto/seco
function DeadTree({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  return (
    <group position={position} scale={scale}>
      {/* Tronco principal */}
      <mesh>
        <cylinderGeometry args={[0.15, 0.25, 3, 6]} />
        <meshStandardMaterial color="#2d1f1f" roughness={1} />
      </mesh>
      {/* Ramas */}
      <mesh position={[0.3, 1, 0]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.05, 0.08, 1.5, 5]} />
        <meshStandardMaterial color="#2d1f1f" roughness={1} />
      </mesh>
      <mesh position={[-0.4, 0.7, 0.2]} rotation={[0.2, 0, 0.6]}>
        <cylinderGeometry args={[0.04, 0.07, 1.2, 5]} />
        <meshStandardMaterial color="#2d1f1f" roughness={1} />
      </mesh>
      <mesh position={[0.1, 1.3, -0.2]} rotation={[-0.3, 0, -0.3]}>
        <cylinderGeometry args={[0.03, 0.05, 0.8, 5]} />
        <meshStandardMaterial color="#2d1f1f" roughness={1} />
      </mesh>
    </group>
  );
}

// Roca decorativa
function Rock({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  const rotation = useMemo(() => Math.random() * Math.PI, []);
  return (
    <mesh position={position} scale={scale} rotation={[0, rotation, 0]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#3d3d4d" roughness={0.95} />
    </mesh>
  );
}

// Antorcha con fuego animado
function Torch({ position }: { position: [number, number, number] }) {
  const flameRef = useRef<THREE.PointLight>(null);
  
  useFrame((state) => {
    if (flameRef.current) {
      flameRef.current.intensity = 2 + Math.sin(state.clock.elapsedTime * 10) * 0.5 + Math.random() * 0.3;
    }
  });
  
  return (
    <group position={position}>
      {/* Soporte */}
      <mesh>
        <cylinderGeometry args={[0.08, 0.1, 1.5, 6]} />
        <meshStandardMaterial color="#4a3728" roughness={0.9} />
      </mesh>
      {/* Llama */}
      <Float speed={8} rotationIntensity={0} floatIntensity={0.2}>
        <mesh position={[0, 0.9, 0]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshBasicMaterial color="#ff6b00" />
        </mesh>
      </Float>
      <pointLight ref={flameRef} position={[0, 1, 0]} color="#ff6b00" intensity={2} distance={8} />
    </group>
  );
}

// Aurora boreal / Energía mágica en el cielo
function MagicAurora() {
  const auroraRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (auroraRef.current) {
      auroraRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
      const material = auroraRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });
  
  return (
    <mesh ref={auroraRef} position={[0, 60, -100]} rotation={[0.3, 0, 0]}>
      <planeGeometry args={[200, 40, 20, 10]} />
      <meshBasicMaterial 
        color="#9b59b6" 
        transparent 
        opacity={0.15}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Luciérnagas/espíritus flotantes
function FloatingSpirits({ count = 20, area = 30 }: { count?: number, area?: number }) {
  const spirits = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * area,
        2 + Math.random() * 8,
        (Math.random() - 0.5) * area - 10,
      ] as [number, number, number],
      speed: 0.5 + Math.random() * 1.5,
      offset: Math.random() * Math.PI * 2,
    }));
  }, [count, area]);
  
  return (
    <group>
      {spirits.map((spirit) => (
        <Float 
          key={spirit.id} 
          speed={spirit.speed} 
          rotationIntensity={0} 
          floatIntensity={2}
        >
          <mesh position={spirit.position}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial color="#ffd700" />
          </mesh>
          <pointLight 
            position={spirit.position} 
            color="#ffd700" 
            intensity={0.3} 
            distance={3} 
          />
        </Float>
      ))}
    </group>
  );
}

// ============================================================
// ESCENA COMPLETA
// ============================================================

interface FortressSceneProps {
  cameraPosition?: [number, number, number];
  showPortal?: boolean;
}

export function FortressScene({ showPortal = true }: FortressSceneProps) {
  return (
    <>
      {/* Cielo nocturno con estrellas */}
      <Sky
        distance={450000}
        sunPosition={[0, -10, 100]}
        inclination={0.1}
        azimuth={0.25}
      />
      
      {/* Estrellas */}
      <Stars 
        radius={100} 
        depth={50} 
        count={3000} 
        factor={4} 
        saturation={0.5} 
        fade 
        speed={0.5}
      />
      
      {/* Aurora mágica en el cielo */}
      <MagicAurora />
      
      {/* Nubes oscuras */}
      <Cloud 
        position={[-30, 25, -60]} 
        opacity={0.3} 
        speed={0.1} 
        color="#1a1a2e"
        segments={20}
      />
      <Cloud 
        position={[35, 30, -70]} 
        opacity={0.25} 
        speed={0.15} 
        color="#2d1f4e"
        segments={15}
      />
      <Cloud 
        position={[0, 35, -80]} 
        opacity={0.2} 
        speed={0.08} 
        color="#1a1a2e"
        segments={25}
      />
      
      {/* Iluminación mejorada */}
      <ambientLight intensity={0.12} color="#4a5568" />
      <directionalLight 
        position={[30, 40, 20]} 
        intensity={0.35} 
        color="#c4b5fd"
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      {/* Luz de relleno púrpura */}
      <pointLight position={[-20, 15, 10]} color="#9b59b6" intensity={0.3} distance={50} />
      <pointLight position={[20, 15, 10]} color="#3498db" intensity={0.25} distance={50} />
      
      {/* Luna más grande y brillante */}
      <mesh position={[60, 50, -120]}>
        <sphereGeometry args={[12, 32, 32]} />
        <meshBasicMaterial color="#fffef0" />
      </mesh>
      {/* Halo de la luna */}
      <mesh position={[60, 50, -121]}>
        <ringGeometry args={[13, 20, 64]} />
        <meshBasicMaterial color="#ffd700" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[60, 50, -120]} color="#e8e4c9" intensity={0.8} distance={300} />
      
      {/* Montañas de fondo */}
      <Mountain position={[-45, 0, -60]} scale={1.5} />
      <Mountain position={[-25, 0, -75]} scale={2} />
      <Mountain position={[0, 0, -90]} scale={2.5} />
      <Mountain position={[30, 0, -70]} scale={1.8} />
      <Mountain position={[50, 0, -55]} scale={1.3} />
      
      {/* Suelo con más detalle */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[80, 64]} />
        <meshStandardMaterial color="#1a1a28" roughness={1} />
      </mesh>
      
      {/* Plataforma central elevada */}
      <mesh receiveShadow position={[0, 0.5, -5]}>
        <cylinderGeometry args={[12, 14, 1, 32]} />
        <meshStandardMaterial color="#3d3d4d" roughness={0.9} />
      </mesh>
      {/* Borde iluminado de la plataforma */}
      <mesh position={[0, 0.1, -5]}>
        <torusGeometry args={[13, 0.15, 8, 64]} rotation-x={Math.PI / 2} />
        <meshStandardMaterial color="#9b59b6" emissive="#9b59b6" emissiveIntensity={0.3} />
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
      
      {/* Antorchas en las murallas */}
      <Torch position={[-6, 6.5, -14.2]} />
      <Torch position={[6, 6.5, -14.2]} />
      <Torch position={[-11, 5.5, -5]} />
      <Torch position={[11, 5.5, -5]} />
      
      {/* Árboles muertos */}
      <DeadTree position={[-18, 1.5, -8]} scale={1.2} />
      <DeadTree position={[20, 1.5, -5]} scale={1} />
      <DeadTree position={[-22, 1.5, 8]} scale={0.9} />
      <DeadTree position={[18, 1.5, 12]} scale={1.1} />
      <DeadTree position={[-15, 1.5, 15]} scale={0.8} />
      
      {/* Rocas decorativas */}
      <Rock position={[-16, 0.5, 3]} scale={1.2} />
      <Rock position={[15, 0.4, -3]} scale={0.8} />
      <Rock position={[-20, 0.6, -12]} scale={1.5} />
      <Rock position={[22, 0.5, 8]} scale={1} />
      <Rock position={[-8, 0.3, 18]} scale={0.7} />
      <Rock position={[10, 0.4, 16]} scale={0.9} />
      
      {/* Camino de piedra */}
      <StonePath />
      
      {/* Runas mágicas */}
      <FloorRunes position={[0, 0.1, 8]} />
      
      {/* Portal mágico */}
      {showPortal && <MagicPortal position={[0, 0, 8]} />}
      
      {/* Cristal mágico */}
      <MagicCrystal />
      
      {/* Banderas */}
      <Banner position={[-10, 12, -15]} color="#e74c3c" />
      <Banner position={[10, 12, -15]} color="#ffd700" />
      
      {/* Espíritus/luciérnagas flotantes */}
      <FloatingSpirits count={25} area={40} />
      
      {/* Partículas mágicas - más abundantes */}
      <Sparkles 
        count={200} 
        scale={50} 
        size={2.5} 
        speed={0.15} 
        color="#9b59b6" 
        opacity={0.6}
        position={[0, 12, -10]}
      />
      <Sparkles 
        count={100} 
        scale={25} 
        size={2} 
        speed={0.25} 
        color="#ffd700" 
        opacity={0.5}
        position={[0, 5, 8]}
      />
      <Sparkles 
        count={80} 
        scale={30} 
        size={1.5} 
        speed={0.3} 
        color="#3498db" 
        opacity={0.4}
        position={[0, 8, -5]}
      />
      
      {/* Niebla baja */}
      <fog attach="fog" args={['#0a0a15', 25, 100]} />
    </>
  );
}

export default FortressScene;
