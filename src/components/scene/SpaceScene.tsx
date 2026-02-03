/**
 * SpaceScene - Escena espacial REALISTA
 * Fondo inmersivo con planetas y estrellas realistas
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

// ============================================================
// PLANETA REALISTA CON ATMÓSFERA
// ============================================================

interface RealisticPlanetProps {
  position: [number, number, number];
  size: number;
  colors: {
    base: string;
    secondary?: string;
    atmosphere?: string;
  };
  hasAtmosphere?: boolean;
  atmosphereScale?: number;
  hasRing?: boolean;
  ringColors?: { inner: string; outer: string };
  rotationSpeed?: number;
  tilt?: number;
}

function RealisticPlanet({ 
  position, 
  size, 
  colors,
  hasAtmosphere = true,
  atmosphereScale = 1.15,
  hasRing = false, 
  ringColors,
  rotationSpeed = 0.001,
  tilt = 0
}: RealisticPlanetProps) {
  const planetRef = useRef<THREE.Group>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += rotationSpeed;
    }
    if (atmosphereRef.current) {
      // Pulso sutil de la atmósfera
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
      atmosphereRef.current.scale.setScalar(pulse);
    }
  });
  
  return (
    <group position={position} rotation={[0, 0, tilt]}>
      <group ref={planetRef}>
        {/* Superficie del planeta */}
        <mesh>
          <sphereGeometry args={[size, 64, 64]} />
          <meshStandardMaterial 
            color={colors.base}
            roughness={0.85}
            metalness={0.1}
          />
        </mesh>
        
        {/* Capa de nubes/patrones (si hay color secundario) */}
        {colors.secondary && (
          <mesh>
            <sphereGeometry args={[size * 1.01, 64, 64]} />
            <meshStandardMaterial 
              color={colors.secondary}
              transparent
              opacity={0.3}
              roughness={1}
            />
          </mesh>
        )}
      </group>
      
      {/* Atmósfera con efecto de fresnel simulado */}
      {hasAtmosphere && colors.atmosphere && (
        <mesh ref={atmosphereRef}>
          <sphereGeometry args={[size * atmosphereScale, 64, 64]} />
          <meshBasicMaterial 
            color={colors.atmosphere}
            transparent
            opacity={0.12}
            side={THREE.BackSide}
          />
        </mesh>
      )}
      
      {/* Anillos realistas */}
      {hasRing && ringColors && (
        <group rotation={[Math.PI / 2.2, 0.1, 0]}>
          {/* Anillo interior denso */}
          <mesh>
            <ringGeometry args={[size * 1.3, size * 1.6, 128]} />
            <meshBasicMaterial 
              color={ringColors.inner}
              transparent 
              opacity={0.7} 
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Anillo medio */}
          <mesh>
            <ringGeometry args={[size * 1.6, size * 1.9, 128]} />
            <meshBasicMaterial 
              color={ringColors.outer}
              transparent 
              opacity={0.4} 
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Anillo exterior tenue */}
          <mesh>
            <ringGeometry args={[size * 1.9, size * 2.2, 128]} />
            <meshBasicMaterial 
              color={ringColors.outer}
              transparent 
              opacity={0.15} 
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Sombra en los anillos */}
          <mesh rotation={[0, 0, 0.3]}>
            <ringGeometry args={[size * 1.3, size * 2.2, 128, 1, 0, Math.PI * 0.3]} />
            <meshBasicMaterial 
              color="#000000"
              transparent 
              opacity={0.5} 
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ============================================================
// SOL REALISTA
// ============================================================

function RealisticSun({ position, size = 8 }: { position: [number, number, number], size?: number }) {
  const coronaRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  
  useFrame((state) => {
    if (coronaRef.current) {
      coronaRef.current.rotation.z += 0.001;
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.03;
      coronaRef.current.scale.setScalar(scale);
    }
    if (glowRef.current) {
      glowRef.current.intensity = 2 + Math.sin(state.clock.elapsedTime) * 0.3;
    }
  });
  
  return (
    <group position={position}>
      {/* Núcleo brillante */}
      <mesh>
        <sphereGeometry args={[size, 64, 64]} />
        <meshBasicMaterial color="#FFF5E0" />
      </mesh>
      
      {/* Corona interna */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[size * 1.1, 64, 64]} />
        <meshBasicMaterial 
          color="#FFE4B5" 
          transparent 
          opacity={0.6}
        />
      </mesh>
      
      {/* Corona externa */}
      <mesh>
        <sphereGeometry args={[size * 1.3, 64, 64]} />
        <meshBasicMaterial 
          color="#FFD700" 
          transparent 
          opacity={0.2}
        />
      </mesh>
      
      {/* Resplandor */}
      <mesh>
        <sphereGeometry args={[size * 2, 32, 32]} />
        <meshBasicMaterial 
          color="#FF8C00" 
          transparent 
          opacity={0.08}
        />
      </mesh>
      
      {/* Luz principal */}
      <pointLight ref={glowRef} color="#FFF5E0" intensity={2} distance={500} decay={2} />
    </group>
  );
}

// ============================================================
// LUNA CON CRÁTERES
// ============================================================

function Moon({ 
  position, 
  size, 
  orbitCenter,
  orbitRadius,
  orbitSpeed 
}: { 
  position: [number, number, number];
  size: number;
  orbitCenter?: [number, number, number];
  orbitRadius?: number;
  orbitSpeed?: number;
}) {
  const moonRef = useRef<THREE.Group>(null);
  const initialAngle = useMemo(() => Math.random() * Math.PI * 2, []);
  
  useFrame((state) => {
    if (moonRef.current) {
      moonRef.current.rotation.y += 0.0005;
      
      if (orbitCenter && orbitRadius && orbitSpeed) {
        const angle = initialAngle + state.clock.elapsedTime * orbitSpeed;
        moonRef.current.position.x = orbitCenter[0] + Math.cos(angle) * orbitRadius;
        moonRef.current.position.z = orbitCenter[2] + Math.sin(angle) * orbitRadius;
        moonRef.current.position.y = orbitCenter[1] + Math.sin(angle * 0.5) * (orbitRadius * 0.2);
      }
    }
  });
  
  return (
    <group ref={moonRef} position={position}>
      <mesh>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial 
          color="#9E9E9E"
          roughness={1}
          metalness={0}
        />
      </mesh>
      {/* Sombra de cráteres simulada */}
      <mesh>
        <sphereGeometry args={[size * 1.001, 32, 32]} />
        <meshStandardMaterial 
          color="#757575"
          transparent
          opacity={0.3}
          roughness={1}
        />
      </mesh>
    </group>
  );
}

// ============================================================
// NEBULOSA REALISTA
// ============================================================

function RealisticNebula({ 
  position, 
  color1,
  color2,
  size = 40,
}: { 
  position: [number, number, number]; 
  color1: string;
  color2: string;
  size?: number;
}) {
  const nebulaRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (nebulaRef.current) {
      nebulaRef.current.rotation.z += 0.0001;
      const scale = 1 + Math.sin(state.clock.elapsedTime * 0.1) * 0.02;
      nebulaRef.current.scale.setScalar(scale);
    }
  });
  
  return (
    <group ref={nebulaRef} position={position}>
      {/* Capas de nebulosa */}
      <mesh>
        <planeGeometry args={[size, size * 0.6]} />
        <meshBasicMaterial 
          color={color1} 
          transparent 
          opacity={0.06}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh position={[size * 0.2, size * 0.1, 2]} rotation={[0, 0, 0.3]}>
        <planeGeometry args={[size * 0.7, size * 0.4]} />
        <meshBasicMaterial 
          color={color2} 
          transparent 
          opacity={0.05}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh position={[-size * 0.15, -size * 0.1, -2]} rotation={[0, 0, -0.2]}>
        <planeGeometry args={[size * 0.5, size * 0.3]} />
        <meshBasicMaterial 
          color={color1} 
          transparent 
          opacity={0.04}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// ============================================================
// POLVO ESTELAR
// ============================================================

function StarDust({ count = 200 }: { count?: number }) {
  const dustRef = useRef<THREE.Points>(null);
  
  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 200;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 2] = -20 - Math.random() * 100;
      siz[i] = Math.random() * 2;
    }
    
    return [pos, siz];
  }, [count]);
  
  useFrame((state) => {
    if (dustRef.current) {
      dustRef.current.rotation.y += 0.0001;
      dustRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.02;
    }
  });
  
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, [positions, sizes]);
  
  return (
    <points ref={dustRef} geometry={geometry}>
      <pointsMaterial
        size={0.5}
        color="#ffffff"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

// ============================================================
// ESCENA ESPACIAL COMPLETA
// ============================================================

export function SpaceScene() {
  const sceneRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (sceneRef.current) {
      // Rotación muy lenta y sutil
      sceneRef.current.rotation.y = state.clock.elapsedTime * 0.015;
      sceneRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.02;
    }
  });
  
  return (
    <>
      {/* Fondo negro del espacio */}
      <color attach="background" args={['#000008']} />
      
      <group ref={sceneRef}>
        {/* Estrellas - más realistas, menos saturadas */}
        <Stars 
          radius={200} 
          depth={100} 
          count={15000} 
          factor={5} 
          saturation={0} 
          fade 
          speed={0.2}
        />
        
        {/* Segunda capa de estrellas más brillantes */}
        <Stars 
          radius={150} 
          depth={80} 
          count={2000} 
          factor={7} 
          saturation={0.1} 
          fade 
          speed={0.1}
        />
        
        {/* Polvo estelar */}
        <StarDust count={300} />
        
        {/* Iluminación ambiental muy tenue */}
        <ambientLight intensity={0.03} color="#4466aa" />
        
        {/* Sol distante */}
        <RealisticSun position={[100, 40, -150]} size={6} />
        
        {/* Nebulosas sutiles */}
        <RealisticNebula position={[-60, 15, -120]} color1="#4a2882" color2="#1a4a6e" size={60} />
        <RealisticNebula position={[70, -20, -140]} color1="#1a3a5e" color2="#2a1a4e" size={50} />
        
        {/* SATURNO - Planeta con anillos */}
        <RealisticPlanet 
          position={[-40, 8, -70]}
          size={7}
          colors={{
            base: '#C4A35A',
            secondary: '#D4B896',
            atmosphere: '#E8D5A3'
          }}
          hasRing
          ringColors={{ inner: '#A89060', outer: '#D4C4A0' }}
          rotationSpeed={0.0008}
          tilt={0.4}
        />
        
        {/* JUPITER - Gigante gaseoso */}
        <RealisticPlanet 
          position={[50, -10, -90]}
          size={9}
          colors={{
            base: '#C9B896',
            secondary: '#A67C52',
            atmosphere: '#DDD5C0'
          }}
          atmosphereScale={1.08}
          rotationSpeed={0.002}
          tilt={0.05}
        />
        
        {/* TIERRA */}
        <RealisticPlanet 
          position={[20, 15, -55]}
          size={3}
          colors={{
            base: '#2B5A8A',
            secondary: '#3D8B40',
            atmosphere: '#87CEEB'
          }}
          atmosphereScale={1.12}
          rotationSpeed={0.001}
          tilt={0.4}
        />
        
        {/* Luna de la Tierra */}
        <Moon 
          position={[20, 15, -55]}
          size={0.8}
          orbitCenter={[20, 15, -55]}
          orbitRadius={6}
          orbitSpeed={0.2}
        />
        
        {/* MARTE */}
        <RealisticPlanet 
          position={[-15, -8, -50]}
          size={2}
          colors={{
            base: '#A04030',
            secondary: '#C06050',
            atmosphere: '#E0A090'
          }}
          atmosphereScale={1.05}
          rotationSpeed={0.0012}
          tilt={0.44}
        />
        
        {/* NEPTUNO - Azul hielo */}
        <RealisticPlanet 
          position={[70, 25, -110]}
          size={4}
          colors={{
            base: '#3A5F8A',
            secondary: '#5080B0',
            atmosphere: '#6090C0'
          }}
          rotationSpeed={0.0015}
          tilt={0.5}
        />
        
        {/* URANO - Con anillos tenues */}
        <RealisticPlanet 
          position={[-70, -15, -100]}
          size={4.5}
          colors={{
            base: '#72A0B0',
            secondary: '#90C0D0',
            atmosphere: '#A0D0E0'
          }}
          hasRing
          ringColors={{ inner: '#607080', outer: '#8090A0' }}
          rotationSpeed={0.001}
          tilt={1.7} // Urano tiene inclinación extrema
        />
        
        {/* Lunas adicionales */}
        <Moon 
          position={[-40, 8, -70]}
          size={1.2}
          orbitCenter={[-40, 8, -70]}
          orbitRadius={14}
          orbitSpeed={0.15}
        />
        <Moon 
          position={[50, -10, -90]}
          size={1.5}
          orbitCenter={[50, -10, -90]}
          orbitRadius={16}
          orbitSpeed={0.12}
        />
      </group>
    </>
  );
}

export default SpaceScene;
