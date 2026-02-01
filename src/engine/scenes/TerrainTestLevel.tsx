/**
 * TerrainTestLevel - Nivel de Prueba de Terreno
 * Nivel para probar terrenos procedurales, heightmaps y LOD
 */

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { RigidBody, HeightfieldCollider } from '@react-three/rapier';
import { Sky, Grid, GizmoHelper, GizmoViewport, Stats } from '@react-three/drei';
import { useControls, folder } from 'leva';
import { TerrainGrass } from '../systems/InstancedGrass';
import { useEngineStore } from '../stores/engineStore';

// ============================================================
// GENERACIÓN DE TERRENO PROCEDURAL
// ============================================================

interface NoiseConfig {
  octaves: number;
  persistence: number;
  lacunarity: number;
  scale: number;
  heightMultiplier: number;
  seed: number;
}

function generateHeightmap(
  resolution: number,
  config: NoiseConfig
): Float32Array {
  const data = new Float32Array(resolution * resolution);
  const { octaves, persistence, lacunarity, scale, heightMultiplier, seed } = config;

  // Simple noise function (pseudo-random basado en coordenadas)
  const noise2D = (x: number, y: number, seed: number): number => {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    return n - Math.floor(n);
  };

  // Interpolación suave
  const smoothNoise = (x: number, y: number, seed: number): number => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;

    // Smoothstep
    const u = fx * fx * (3 - 2 * fx);
    const v = fy * fy * (3 - 2 * fy);

    const n00 = noise2D(ix, iy, seed);
    const n10 = noise2D(ix + 1, iy, seed);
    const n01 = noise2D(ix, iy + 1, seed);
    const n11 = noise2D(ix + 1, iy + 1, seed);

    const nx0 = n00 * (1 - u) + n10 * u;
    const nx1 = n01 * (1 - u) + n11 * u;

    return nx0 * (1 - v) + nx1 * v;
  };

  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      let amplitude = 1;
      let frequency = 1;
      let height = 0;

      for (let o = 0; o < octaves; o++) {
        const sampleX = (x / scale) * frequency;
        const sampleY = (y / scale) * frequency;
        
        const noiseValue = smoothNoise(sampleX, sampleY, seed + o * 100) * 2 - 1;
        height += noiseValue * amplitude;

        amplitude *= persistence;
        frequency *= lacunarity;
      }

      data[y * resolution + x] = height * heightMultiplier;
    }
  }

  return data;
}

// ============================================================
// MESH DE TERRENO
// ============================================================

interface TerrainMeshProps {
  resolution: number;
  size: number;
  heightData: Float32Array;
  wireframe?: boolean;
}

function TerrainMesh({ resolution, size, heightData, wireframe = false }: TerrainMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, resolution - 1, resolution - 1);
    geo.rotateX(-Math.PI / 2);

    const positions = geo.attributes.position.array as Float32Array;
    
    for (let i = 0; i < heightData.length; i++) {
      positions[i * 3 + 1] = heightData[i]; // Y es altura
    }

    geo.computeVertexNormals();
    return geo;
  }, [resolution, size, heightData]);

  // Material con colores por altura
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          vPosition = position;
          vNormal = normal;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          float height = vPosition.y;
          
          // Colores por altura
          vec3 deepWater = vec3(0.1, 0.2, 0.4);
          vec3 water = vec3(0.2, 0.4, 0.6);
          vec3 sand = vec3(0.76, 0.7, 0.5);
          vec3 grass = vec3(0.2, 0.5, 0.2);
          vec3 forest = vec3(0.1, 0.35, 0.1);
          vec3 rock = vec3(0.4, 0.4, 0.4);
          vec3 snow = vec3(0.95, 0.95, 1.0);
          
          vec3 color;
          if (height < -2.0) {
            color = deepWater;
          } else if (height < 0.0) {
            color = mix(deepWater, water, (height + 2.0) / 2.0);
          } else if (height < 0.5) {
            color = mix(sand, grass, height / 0.5);
          } else if (height < 3.0) {
            color = mix(grass, forest, (height - 0.5) / 2.5);
          } else if (height < 6.0) {
            color = mix(forest, rock, (height - 3.0) / 3.0);
          } else {
            color = mix(rock, snow, clamp((height - 6.0) / 4.0, 0.0, 1.0));
          }
          
          // Iluminación simple
          vec3 lightDir = normalize(vec3(1.0, 1.0, 0.5));
          float diffuse = max(dot(vNormal, lightDir), 0.0) * 0.7 + 0.3;
          
          gl_FragColor = vec4(color * diffuse, 1.0);
        }
      `,
      wireframe,
    });
  }, [wireframe]);

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} castShadow receiveShadow />
  );
}

// ============================================================
// NIVEL DE PRUEBA DE TERRENO
// ============================================================

interface TerrainTestLevelProps {
  showDebug?: boolean;
  showGrass?: boolean;
}

export function TerrainTestLevel({
  showDebug = true,
  showGrass = false,
}: TerrainTestLevelProps) {
  const debugMode = useEngineStore((state) => state.debugMode);

  // Controles de Leva para ajustar el terreno en tiempo real
  const terrainConfig = useControls('Terrain', {
    noise: folder({
      octaves: { value: 4, min: 1, max: 8, step: 1 },
      persistence: { value: 0.5, min: 0, max: 1, step: 0.05 },
      lacunarity: { value: 2, min: 1, max: 4, step: 0.1 },
      scale: { value: 50, min: 10, max: 200, step: 5 },
      heightMultiplier: { value: 10, min: 1, max: 30, step: 1 },
      seed: { value: 42, min: 0, max: 1000, step: 1 },
    }),
    display: folder({
      resolution: { value: 128, min: 32, max: 256, step: 32 },
      size: { value: 200, min: 50, max: 500, step: 50 },
      wireframe: false,
    }),
  });

  // Generar heightmap
  const heightData = useMemo(() => {
    return generateHeightmap(terrainConfig.resolution, {
      octaves: terrainConfig.octaves,
      persistence: terrainConfig.persistence,
      lacunarity: terrainConfig.lacunarity,
      scale: terrainConfig.scale,
      heightMultiplier: terrainConfig.heightMultiplier,
      seed: terrainConfig.seed,
    });
  }, [
    terrainConfig.resolution,
    terrainConfig.octaves,
    terrainConfig.persistence,
    terrainConfig.lacunarity,
    terrainConfig.scale,
    terrainConfig.heightMultiplier,
    terrainConfig.seed,
  ]);

  // Heightfield para física
  const heightfieldData = useMemo(() => {
    // Convertir a formato Rapier (matriz 2D de alturas)
    const rows = terrainConfig.resolution;
    const cols = terrainConfig.resolution;
    const heights: number[][] = [];

    for (let i = 0; i < rows; i++) {
      const row: number[] = [];
      for (let j = 0; j < cols; j++) {
        row.push(heightData[i * cols + j]);
      }
      heights.push(row);
    }

    return heights;
  }, [heightData, terrainConfig.resolution]);

  return (
    <group name="terrain-test-level">
      {/* Cielo simple */}
      <Sky sunPosition={[100, 50, 100]} />

      {/* Iluminación */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[50, 100, 30]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />

      {/* Terreno visual */}
      <TerrainMesh
        resolution={terrainConfig.resolution}
        size={terrainConfig.size}
        heightData={heightData}
        wireframe={terrainConfig.wireframe}
      />

      {/* Colisión del terreno */}
      <RigidBody type="fixed" colliders={false}>
        <HeightfieldCollider
          args={[
            terrainConfig.resolution - 1,
            terrainConfig.resolution - 1,
            heightfieldData.flat(),
            { x: terrainConfig.size, y: 1, z: terrainConfig.size },
          ]}
        />
      </RigidBody>

      {/* Hierba en el terreno */}
      {showGrass && (
        <TerrainGrass
          terrainSize={terrainConfig.size}
          terrainHeightData={heightData}
          terrainResolution={terrainConfig.resolution}
          config={{
            count: 20000,
            bladeHeight: 0.3,
            color1: '#2d5a1e',
            color2: '#4a8c2a',
          }}
        />
      )}

      {/* Grid de referencia */}
      {(showDebug || debugMode) && (
        <Grid
          position={[0, 0.02, 0]}
          args={[terrainConfig.size, terrainConfig.size]}
          cellSize={10}
          cellColor="#666666"
          sectionSize={50}
          sectionColor="#888888"
          fadeDistance={200}
          infiniteGrid
        />
      )}

      {/* Markers de spawn */}
      {[
        [0, 'center'],
        [terrainConfig.size / 4, 'quarter'],
        [-terrainConfig.size / 4, 'quarter-neg'],
      ].map(([offset, _label], i) => {
        const x = offset as number;
        const z = offset as number;
        // Aproximar altura en esa posición
        const resolution = terrainConfig.resolution;
        const halfSize = terrainConfig.size / 2;
        const nx = Math.floor(((x + halfSize) / terrainConfig.size) * (resolution - 1));
        const nz = Math.floor(((z + halfSize) / terrainConfig.size) * (resolution - 1));
        const idx = Math.min(nz * resolution + nx, heightData.length - 1);
        const height = heightData[Math.max(0, idx)] + 2;

        return (
          <mesh key={i} position={[x, height, z]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial color="#ff4444" emissive="#ff0000" emissiveIntensity={0.5} />
          </mesh>
        );
      })}

      {/* Herramientas de debug */}
      {(showDebug || debugMode) && (
        <>
          <Stats />
          <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
            <GizmoViewport />
          </GizmoHelper>
        </>
      )}
    </group>
  );
}

// ============================================================
// SPAWN POINTS
// ============================================================

export const TERRAIN_TEST_SPAWN_POINTS = {
  center: new THREE.Vector3(0, 15, 0),
  north: new THREE.Vector3(0, 15, 50),
  south: new THREE.Vector3(0, 15, -50),
  east: new THREE.Vector3(50, 15, 0),
  west: new THREE.Vector3(-50, 15, 0),
};

export default TerrainTestLevel;
