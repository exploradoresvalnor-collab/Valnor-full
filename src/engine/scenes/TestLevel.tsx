/**
 * Test Level - Nivel de pruebas básico
 * Para testing de mecánicas
 */

import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { UltraSkySystem } from '../systems/UltraSkySystem';
import { Player } from '../components/Player';
import { PhysicsWorldProvider } from '../components/PhysicsWorld';

interface TestLevelProps {
  showPlayer?: boolean;
}

/**
 * Ground - Suelo del nivel de pruebas
 */
function Ground() {
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[50, 0.5, 50]} position={[0, -0.5, 0]} />
      
      {/* Suelo principal */}
      <mesh receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[100, 1, 100]} />
        <meshStandardMaterial 
          color="#3d5c3d" 
          roughness={0.9}
        />
      </mesh>
      
      {/* Grid para referencia visual */}
      <gridHelper 
        args={[100, 50, '#666666', '#444444']} 
        position={[0, 0.51, 0]} 
      />
    </RigidBody>
  );
}

/**
 * Obstacles - Obstáculos de prueba
 */
function Obstacles() {
  return (
    <>
      {/* Caja 1 */}
      <RigidBody type="fixed">
        <mesh position={[5, 1, 0]} castShadow receiveShadow>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#8b4513" roughness={0.7} />
        </mesh>
      </RigidBody>
      
      {/* Caja 2 */}
      <RigidBody type="fixed">
        <mesh position={[-5, 1.5, 3]} castShadow receiveShadow>
          <boxGeometry args={[3, 3, 3]} />
          <meshStandardMaterial color="#654321" roughness={0.7} />
        </mesh>
      </RigidBody>
      
      {/* Rampa */}
      <RigidBody type="fixed">
        <mesh 
          position={[0, 0.75, -8]} 
          rotation={[-Math.PI / 8, 0, 0]}
          castShadow 
          receiveShadow
        >
          <boxGeometry args={[4, 0.2, 6]} />
          <meshStandardMaterial color="#666666" roughness={0.6} />
        </mesh>
      </RigidBody>
      
      {/* Plataformas elevadas */}
      <RigidBody type="fixed">
        <mesh position={[10, 3, -5]} castShadow receiveShadow>
          <boxGeometry args={[4, 0.5, 4]} />
          <meshStandardMaterial color="#555555" roughness={0.7} />
        </mesh>
      </RigidBody>
      
      <RigidBody type="fixed">
        <mesh position={[15, 5, -5]} castShadow receiveShadow>
          <boxGeometry args={[3, 0.5, 3]} />
          <meshStandardMaterial color="#555555" roughness={0.7} />
        </mesh>
      </RigidBody>
      
      {/* Cilindro */}
      <RigidBody type="fixed" colliders="hull">
        <mesh position={[-10, 2, -5]} castShadow receiveShadow>
          <cylinderGeometry args={[1.5, 1.5, 4, 16]} />
          <meshStandardMaterial color="#4a4a4a" roughness={0.6} />
        </mesh>
      </RigidBody>
      
      {/* Esfera (decorativa, no tiene collider preciso) */}
      <mesh position={[0, 1.5, 10]} castShadow>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial 
          color="#ffd700" 
          metalness={0.8}
          roughness={0.2}
          emissive="#ffd700"
          emissiveIntensity={0.1}
        />
      </mesh>
    </>
  );
}

/**
 * Lighting - Iluminación del nivel
 */
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={100}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <hemisphereLight args={[0x87ceeb, 0x3d5c3d, 0.4]} />
    </>
  );
}

/**
 * SpawnMarkers - Marcadores de spawn para referencia
 */
function SpawnMarkers() {
  return (
    <>
      {/* Spawn principal */}
      <mesh position={[0, 0.01, 0]}>
        <ringGeometry args={[1.5, 2, 32]} />
        <meshBasicMaterial color="#00ff00" side={THREE.DoubleSide} transparent opacity={0.5} />
      </mesh>
      
      {/* Marcadores cardinales */}
      {[
        { pos: [0, 0.01, -20], color: '#ff0000', label: 'N' },
        { pos: [0, 0.01, 20], color: '#0000ff', label: 'S' },
        { pos: [20, 0.01, 0], color: '#ffff00', label: 'E' },
        { pos: [-20, 0.01, 0], color: '#00ffff', label: 'W' },
      ].map((marker, i) => (
        <mesh key={i} position={marker.pos as [number, number, number]}>
          <circleGeometry args={[1, 16]} />
          <meshBasicMaterial color={marker.color} side={THREE.DoubleSide} transparent opacity={0.5} />
        </mesh>
      ))}
    </>
  );
}

/**
 * TestLevel - Componente principal
 */
export function TestLevel({ showPlayer = true }: TestLevelProps) {
  return (
    <PhysicsWorldProvider>
      {/* Cielo simple */}
      <UltraSkySystem timeOfDay={10} />
      
      {/* Iluminación */}
      <Lighting />
      
      {/* Suelo */}
      <Ground />
      
      {/* Obstáculos */}
      <Obstacles />
      
      {/* Marcadores de spawn */}
      <SpawnMarkers />
      
      {/* Jugador */}
      {showPlayer && <Player position={[0, 2, 0]} />}
    </PhysicsWorldProvider>
  );
}

export default TestLevel;
