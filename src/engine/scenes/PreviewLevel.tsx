/**
 * Preview Level - Nivel de lobby/preview con agua y cielo
 * Basado en el PreviewLevel de la guía Angular
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { 
  MeshReflectorMaterial, 
  Float,
  Sparkles,
} from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { UltraSkySystem } from '../systems/UltraSkySystem';
import { Player } from '../components/Player';

interface PreviewLevelProps {
  timeOfDay?: number;
  enableWeather?: boolean;
  showPlayer?: boolean;
}

/**
 * WaterSurface - Agua reflectante
 */
function WaterSurface() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Animación sutil de ondas
      const time = state.clock.elapsedTime;
      meshRef.current.position.y = Math.sin(time * 0.5) * 0.05 - 0.1;
    }
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.1, 0]}
      receiveShadow
    >
      <planeGeometry args={[500, 500, 64, 64]} />
      <MeshReflectorMaterial
        blur={[300, 100]}
        resolution={1024}
        mixBlur={1}
        mixStrength={50}
        roughness={1}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#1a5276"
        metalness={0.5}
        mirror={0.5}
      />
    </mesh>
  );
}

/**
 * FloatingIsland - Isla flotante decorativa
 */
function FloatingIsland({ position }: { position: [number, number, number] }) {
  return (
    <Float speed={1} rotationIntensity={0.1} floatIntensity={0.5}>
      <group position={position}>
        {/* Base de la isla */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[3, 2, 1.5, 16]} />
          <meshStandardMaterial color="#8b6914" roughness={0.8} />
        </mesh>
        
        {/* Pasto encima */}
        <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[3, 3, 0.2, 16]} />
          <meshStandardMaterial color="#228b22" roughness={0.9} />
        </mesh>
        
        {/* Árbol */}
        <group position={[0, 1.5, 0]}>
          {/* Tronco */}
          <mesh castShadow>
            <cylinderGeometry args={[0.2, 0.3, 2, 8]} />
            <meshStandardMaterial color="#8b4513" roughness={0.9} />
          </mesh>
          
          {/* Copa */}
          <mesh position={[0, 1.5, 0]} castShadow>
            <coneGeometry args={[1.2, 2, 8]} />
            <meshStandardMaterial color="#228b22" roughness={0.8} />
          </mesh>
        </group>
      </group>
    </Float>
  );
}

/**
 * MainPlatform - Plataforma principal donde está el jugador
 */
function MainPlatform() {
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[15, 0.5, 15]} position={[0, -0.5, 0]} />
      
      {/* Superficie principal */}
      <mesh receiveShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[15, 16, 1, 32]} />
        <meshStandardMaterial 
          color="#3a7d44" 
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Borde decorativo */}
      <mesh receiveShadow position={[0, 0.1, 0]}>
        <torusGeometry args={[15, 0.3, 8, 64]} />
        <meshStandardMaterial 
          color="#8b6914" 
          roughness={0.7}
          metalness={0.3}
        />
      </mesh>
      
      {/* Centro decorativo (piedra rúnica) */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[1, 1.2, 1.2, 6]} />
        <meshStandardMaterial 
          color="#555555" 
          roughness={0.5}
          metalness={0.2}
        />
      </mesh>
      
      {/* Cristal en el centro */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <octahedronGeometry args={[0.5]} />
        <meshStandardMaterial 
          color="#ffd700"
          emissive="#ffd700"
          emissiveIntensity={0.5}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>
    </RigidBody>
  );
}

/**
 * FloatingCrystals - Cristales flotantes decorativos
 */
function FloatingCrystals() {
  const crystals = useMemo(() => {
    const items = [];
    const count = 8;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 20 + Math.random() * 10;
      const height = 3 + Math.random() * 5;
      
      items.push({
        position: [
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius,
        ] as [number, number, number],
        scale: 0.3 + Math.random() * 0.5,
        color: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#ffd93d', '#95e1d3'][
          Math.floor(Math.random() * 5)
        ],
      });
    }
    
    return items;
  }, []);

  return (
    <>
      {crystals.map((crystal, i) => (
        <Float key={i} speed={2} rotationIntensity={1} floatIntensity={1}>
          <mesh position={crystal.position} scale={crystal.scale} castShadow>
            <octahedronGeometry args={[1]} />
            <meshStandardMaterial
              color={crystal.color}
              emissive={crystal.color}
              emissiveIntensity={0.3}
              roughness={0.2}
              metalness={0.8}
              transparent
              opacity={0.9}
            />
          </mesh>
        </Float>
      ))}
    </>
  );
}

/**
 * AmbientParticles - Partículas ambientales (polvo mágico)
 */
function AmbientParticles() {
  return (
    <Sparkles
      count={200}
      scale={50}
      size={3}
      speed={0.3}
      color="#ffd700"
      opacity={0.5}
    />
  );
}

/**
 * PreviewLevel - Componente principal del nivel
 */
export function PreviewLevel({
  timeOfDay = 10,
  showPlayer = true,
}: PreviewLevelProps) {
  return (
    <>
      {/* Cielo */}
      <UltraSkySystem 
        timeOfDay={timeOfDay}
        autoProgress={false}
      />
      
      {/* Niebla */}
      <fog attach="fog" args={['#1a5276', 50, 200]} />
      
      {/* Agua */}
      <WaterSurface />
      
      {/* Plataforma principal */}
      <MainPlatform />
      
      {/* Islas flotantes */}
      <FloatingIsland position={[-25, 5, -20]} />
      <FloatingIsland position={[30, 8, -15]} />
      <FloatingIsland position={[20, 3, 25]} />
      <FloatingIsland position={[-30, 6, 15]} />
      
      {/* Cristales flotantes */}
      <FloatingCrystals />
      
      {/* Partículas ambientales */}
      <AmbientParticles />
      
      {/* Jugador */}
      {showPlayer && <Player position={[0, 2, 5]} />}
    </>
  );
}

export default PreviewLevel;
