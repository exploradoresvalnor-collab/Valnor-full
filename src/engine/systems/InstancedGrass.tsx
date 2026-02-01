/**
 * InstancedGrass - Sistema de Hierba Instanciada
 * Hierba procedural con animación de viento, LOD y culling
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useEngineStore } from '../stores/engineStore';

// ============================================================
// TIPOS
// ============================================================

export interface GrassConfig {
  count?: number;
  area?: number;
  bladeWidth?: number;
  bladeHeight?: number;
  bladeHeightVariation?: number;
  color1?: string;
  color2?: string;
  windStrength?: number;
  windFrequency?: number;
}

// ============================================================
// SHADER DE HIERBA
// ============================================================

const grassVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uWindStrength;
  uniform float uWindFrequency;
  
  attribute float aOffset;
  attribute float aScale;
  attribute float aPhase;
  
  varying vec2 vUv;
  varying float vHeight;
  
  void main() {
    vUv = uv;
    vHeight = position.y * aScale;
    
    vec3 pos = position;
    pos *= aScale;
    
    // Animación de viento - más fuerte en la punta
    float windFactor = pow(uv.y, 2.0);
    float wind = sin(uTime * uWindFrequency + aPhase + pos.x * 0.5) * uWindStrength;
    pos.x += wind * windFactor;
    pos.z += wind * windFactor * 0.5;
    
    // Aplicar posición de instancia
    pos += instanceMatrix[3].xyz;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const grassFragmentShader = /* glsl */ `
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uTime;
  
  varying vec2 vUv;
  varying float vHeight;
  
  void main() {
    // Gradiente de color basado en altura
    vec3 color = mix(uColor1, uColor2, vUv.y);
    
    // Oscurecer base
    color *= 0.5 + vUv.y * 0.5;
    
    // Sombra suave en la base
    float shadow = smoothstep(0.0, 0.3, vUv.y);
    color *= 0.7 + shadow * 0.3;
    
    // Alpha para puntas suaves
    float alpha = smoothstep(1.0, 0.8, vUv.y);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// ============================================================
// GEOMETRÍA DE BRIZNA DE HIERBA
// ============================================================

function createBladeGeometry(width: number, height: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  // Forma de brizna: ancho en la base, puntiaguda arriba
  const vertices = new Float32Array([
    // Triángulo izquierdo
    -width / 2, 0, 0,
    width / 2, 0, 0,
    0, height, 0,
  ]);

  const uvs = new Float32Array([
    0, 0,
    1, 0,
    0.5, 1,
  ]);

  const normals = new Float32Array([
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
  ]);

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));

  return geometry;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

interface InstancedGrassProps extends GrassConfig {
  position?: [number, number, number];
  heightMap?: (x: number, z: number) => number;
}

export function InstancedGrass({
  count = 10000,
  area = 50,
  bladeWidth = 0.1,
  bladeHeight = 0.5,
  bladeHeightVariation = 0.3,
  color1 = '#2d5a1e',
  color2 = '#4a8c2a',
  windStrength = 0.3,
  windFrequency = 2.0,
  position = [0, 0, 0],
  heightMap,
}: InstancedGrassProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const quality = useEngineStore((state) => state.quality);
  const { camera } = useThree();

  // Ajustar cantidad según calidad
  const adjustedCount = useMemo(() => {
    const multipliers: Record<string, number> = {
      ultra: 1.0,
      high: 0.7,
      medium: 0.4,
      low: 0.2,
      potato: 0.05,
    };
    return Math.floor(count * (multipliers[quality] ?? 0.5));
  }, [count, quality]);

  // Crear geometría de brizna
  const bladeGeometry = useMemo(
    () => createBladeGeometry(bladeWidth, bladeHeight),
    [bladeWidth, bladeHeight]
  );

  // Generar posiciones de instancias
  const { matrices } = useMemo(() => {
    const matrices: THREE.Matrix4[] = [];
    const scales: number[] = [];
    const phases: number[] = [];
    const dummy = new THREE.Object3D();

    for (let i = 0; i < adjustedCount; i++) {
      // Posición aleatoria en el área
      const x = (Math.random() - 0.5) * area;
      const z = (Math.random() - 0.5) * area;
      const y = heightMap ? heightMap(x, z) : 0;

      dummy.position.set(x, y, z);
      dummy.rotation.y = Math.random() * Math.PI * 2;

      // Escala con variación
      const scale = 0.5 + Math.random() * bladeHeightVariation;
      scales.push(scale);
      dummy.scale.setScalar(scale);

      // Fase para animación
      phases.push(Math.random() * Math.PI * 2);

      dummy.updateMatrix();
      matrices.push(dummy.matrix.clone());
    }

    return { matrices, scales, phases };
  }, [adjustedCount, area, bladeHeightVariation, heightMap]);

  // Material con shader personalizado
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: grassVertexShader,
      fragmentShader: grassFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uWindStrength: { value: windStrength },
        uWindFrequency: { value: windFrequency },
        uColor1: { value: new THREE.Color(color1) },
        uColor2: { value: new THREE.Color(color2) },
      },
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
    });
  }, [color1, color2, windStrength, windFrequency]);

  // Aplicar matrices a las instancias
  useEffect(() => {
    if (!meshRef.current) return;

    matrices.forEach((matrix, i) => {
      meshRef.current!.setMatrixAt(i, matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [matrices]);

  // Animación
  useFrame((state) => {
    if (!meshRef.current) return;

    // Actualizar tiempo
    material.uniforms.uTime.value = state.clock.elapsedTime;

    // LOD: Ocultar hierba lejana (en calidades bajas)
    if (quality === 'low') {
      const cameraPos = camera.position;
      const meshPos = new THREE.Vector3(...position);
      const distance = cameraPos.distanceTo(meshPos);
      meshRef.current.visible = distance < 30;
    }
  });

  // No renderizar en calidad low
  if (quality === 'low') return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[bladeGeometry, material, adjustedCount]}
      position={position}
      frustumCulled
    />
  );
}

// ============================================================
// PATCH DE HIERBA (para áreas específicas)
// ============================================================

interface GrassPatchProps {
  center: [number, number, number];
  radius?: number;
  density?: number;
  config?: GrassConfig;
}

export function GrassPatch({
  center,
  radius = 5,
  density = 500,
  config = {},
}: GrassPatchProps) {
  const count = Math.floor(Math.PI * radius * radius * density / 100);

  // HeightMap circular
  const heightMap = (x: number, z: number): number => {
    const dx = x;
    const dz = z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    return dist <= radius ? 0 : -1000; // Fuera del radio, ocultar
  };

  return (
    <InstancedGrass
      {...config}
      count={count}
      area={radius * 2}
      position={center}
      heightMap={heightMap}
    />
  );
}

// ============================================================
// HIERBA EN TERRENO (sigue altura del terreno)
// ============================================================

interface TerrainGrassProps {
  terrainSize: number;
  terrainHeightData?: Float32Array;
  terrainResolution?: number;
  config?: GrassConfig;
}

export function TerrainGrass({
  terrainSize,
  terrainHeightData,
  terrainResolution = 128,
  config = {},
}: TerrainGrassProps) {
  // Función para obtener altura del terreno
  const getTerrainHeight = (x: number, z: number): number => {
    if (!terrainHeightData) return 0;

    // Convertir coordenadas mundo a índices del heightmap
    const halfSize = terrainSize / 2;
    const nx = ((x + halfSize) / terrainSize) * (terrainResolution - 1);
    const nz = ((z + halfSize) / terrainSize) * (terrainResolution - 1);

    const ix = Math.floor(nx);
    const iz = Math.floor(nz);

    if (ix < 0 || ix >= terrainResolution - 1 || iz < 0 || iz >= terrainResolution - 1) {
      return 0;
    }

    // Interpolación bilineal
    const fx = nx - ix;
    const fz = nz - iz;

    const h00 = terrainHeightData[iz * terrainResolution + ix];
    const h10 = terrainHeightData[iz * terrainResolution + ix + 1];
    const h01 = terrainHeightData[(iz + 1) * terrainResolution + ix];
    const h11 = terrainHeightData[(iz + 1) * terrainResolution + ix + 1];

    const h0 = h00 * (1 - fx) + h10 * fx;
    const h1 = h01 * (1 - fx) + h11 * fx;

    return h0 * (1 - fz) + h1 * fz;
  };

  return (
    <InstancedGrass
      {...config}
      area={terrainSize}
      heightMap={getTerrainHeight}
    />
  );
}

export default InstancedGrass;
