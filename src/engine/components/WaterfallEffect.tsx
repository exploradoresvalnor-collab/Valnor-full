/**
 * WaterfallEffect — Cascada mejorada con shader animado y spray
 * 
 * Reemplaza el cilindro estático por:
 * - Mesh plano con scroll UV animado (flujo de agua)
 * - Partículas de spray en la base
 * - Niebla/neblina en la base con Float
 * - Luz ambiental puntual en la piscina
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Float, Sparkles } from '@react-three/drei';

// ============================================================
// WATER SHADER — Scroll UV + transparencia gradiente
// ============================================================

const waterfallVertexShader = `
  varying vec2 vUv;
  varying float vWorldY;
  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldY = worldPos.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const waterfallFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uSpeed;
  
  varying vec2 vUv;
  varying float vWorldY;
  
  // Simplex-like noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  
  void main() {
    // UV con scroll vertical (agua cayendo)
    vec2 uv = vUv;
    uv.y -= uTime * uSpeed;
    
    // Capas de ruido para espuma/turbulencia
    float n1 = noise(uv * 8.0 + uTime * 0.5);
    float n2 = noise(uv * 16.0 - uTime * 0.3);
    float foam = smoothstep(0.4, 0.7, n1 * 0.6 + n2 * 0.4);
    
    // Color base + espuma blanca
    vec3 color = mix(uColor, vec3(0.9, 0.95, 1.0), foam * 0.5);
    
    // Transparencia: más opaco en el centro, transparente en los bordes
    float edgeFade = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);
    // Más transparente arriba (nacimiento), más opaco abajo
    float vertFade = smoothstep(0.0, 0.2, vUv.y) * 0.5 + 0.5;
    
    float alpha = uOpacity * edgeFade * vertFade * (0.6 + foam * 0.4);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// ============================================================
// SPRAY PARTICLES — Partículas de agua en la base
// ============================================================

function WaterfallSpray({
  position,
  count = 60,
  spread = 4,
}: {
  position: [number, number, number];
  count?: number;
  spread?: number;
}) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, velocities, lifetimes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const life = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Iniciar en la base
      pos[i3] = (Math.random() - 0.5) * spread;
      pos[i3 + 1] = Math.random() * 2;
      pos[i3 + 2] = (Math.random() - 0.5) * spread;

      // Velocidad hacia arriba y lateral
      vel[i3] = (Math.random() - 0.5) * 3;
      vel[i3 + 1] = 1 + Math.random() * 3;
      vel[i3 + 2] = (Math.random() - 0.5) * 3;

      life[i] = Math.random();
    }

    return [pos, vel, life];
  }, [count, spread]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;

    const posArr = pointsRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      lifetimes[i] -= delta * 0.5;

      if (lifetimes[i] <= 0) {
        // Respawn
        posArr[i3] = (Math.random() - 0.5) * spread;
        posArr[i3 + 1] = 0;
        posArr[i3 + 2] = (Math.random() - 0.5) * spread;
        lifetimes[i] = 0.8 + Math.random() * 0.4;
      } else {
        posArr[i3] += velocities[i3] * delta;
        posArr[i3 + 1] += velocities[i3 + 1] * delta;
        posArr[i3 + 2] += velocities[i3 + 2] * delta;

        // Gravedad
        velocities[i3 + 1] -= 5 * delta;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} position={position} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#c8e8ff"
        size={0.15}
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ============================================================
// MIST CLOUD — Neblina en la base de la cascada
// ============================================================

function MistCloud({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <Float speed={0.5} floatIntensity={0.3} rotationIntensity={0.1}>
      <mesh position={position} scale={scale}>
        <sphereGeometry args={[3, 8, 8]} />
        <meshStandardMaterial
          color="#ddeeff"
          transparent
          opacity={0.12}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </Float>
  );
}

// ============================================================
// MAIN WATERFALL COMPONENT
// ============================================================

interface WaterfallEffectProps {
  position?: [number, number, number];
  width?: number;
  height?: number;
  color?: string;
  speed?: number;
  opacity?: number;
  /** Mostrar spray de agua */
  spray?: boolean;
  /** Mostrar neblina en la base */
  mist?: boolean;
  /** Mostrar sparkles de agua */
  sparkles?: boolean;
}

export function WaterfallEffect({
  position = [0, 0, 0],
  width = 4,
  height = 20,
  color = '#6baed6',
  speed = 1.5,
  opacity = 0.7,
  spray = true,
  mist = true,
  sparkles = true,
}: WaterfallEffectProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Uniforms del shader
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uSpeed: { value: speed },
    }),
    [color, opacity, speed],
  );

  // Animar el tiempo del shader
  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <group position={position}>
      {/* Cortina de agua principal (plano con shader) */}
      <mesh position={[0, height / 2, 0]}>
        <planeGeometry args={[width, height, 1, 32]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={waterfallVertexShader}
          fragmentShader={waterfallFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Plano trasero para doble cara desde ángulos extremos */}
      <mesh position={[0, height / 2, -0.1]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[width, height, 1, 32]} />
        <shaderMaterial
          vertexShader={waterfallVertexShader}
          fragmentShader={waterfallFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Piscina en la base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 1.5]}>
        <circleGeometry args={[width * 0.8, 32]} />
        <meshStandardMaterial
          color="#4a8ab5"
          transparent
          opacity={0.6}
          roughness={0.1}
          metalness={0.3}
        />
      </mesh>

      {/* Luz ambiental en la piscina */}
      <pointLight
        position={[0, 1, 1]}
        color="#88ccff"
        intensity={0.4}
        distance={8}
      />

      {/* Spray de agua */}
      {spray && <WaterfallSpray position={[0, 0.5, 1.5]} spread={width * 0.6} />}

      {/* Neblina en la base */}
      {mist && (
        <>
          <MistCloud position={[-1.5, 1, 2]} scale={1.2} />
          <MistCloud position={[1.5, 1.5, 1.5]} scale={0.8} />
          <MistCloud position={[0, 0.5, 2.5]} scale={1} />
        </>
      )}

      {/* Sparkles de gotas */}
      {sparkles && (
        <Sparkles
          position={[0, height * 0.3, 1]}
          count={40}
          size={2}
          speed={0.5}
          scale={[width * 1.5, height * 0.6, 4]}
          color="#aaddff"
          opacity={0.4}
        />
      )}
    </group>
  );
}

export default WaterfallEffect;
