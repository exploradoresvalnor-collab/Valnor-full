/**
 * GameCanvas - Componente principal del canvas 3D
 * Equivalente al componente principal de Three.js en Angular
 */

import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  Stats, 
  AdaptiveDpr, 
  AdaptiveEvents,
  Preload,
  PerformanceMonitor,
} from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';
import { useEngineStore, useEngineQuality } from '../stores/engineStore';
import { useGameStore } from '../../stores/gameStore';

interface GameCanvasProps {
  children: React.ReactNode;
  showStats?: boolean;
  enablePhysics?: boolean;
  onReady?: () => void;
}

/**
 * EngineController - Controlador interno para actualizar el engine store
 */
function EngineController() {
  const { gl, camera } = useThree();
  // Select only the functions we need to avoid subscribing to full store and causing re-renders
  const updateStats = useEngineStore((s) => s.updateStats);
  const updateTime = useEngineStore((s) => s.updateTime);
  const setFps = useEngineStore((s) => s.setFps);
  const setCameraPosition = useEngineStore((s) => s.setCameraPosition);
  
  useFrame((state, delta) => {
    // Actualizar tiempo
    updateTime(delta, state.clock.elapsedTime);
    
    // Actualizar FPS (suavizado)
    const fps = Math.round(1 / delta);
    setFps(fps);
    
    // Actualizar stats de render
    const info = gl.info;
    updateStats(info.render.calls, info.render.triangles);
    
    // Actualizar posición de cámara
    setCameraPosition(camera.position.clone());
  });

  return null;
}

/**
 * LoadingFallback - Componente de carga mientras se cargan los assets
 */
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#ffd700" wireframe />
    </mesh>
  );
}

/**
 * GameCanvas - Canvas principal del juego
 */
export function GameCanvas({ 
  children, 
  showStats = false,
  enablePhysics = true,
  onReady,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { quality } = useGameStore();
  const viewDistance = useEngineStore((s) => s.viewDistance);
  const { initialize, shutdown } = useEngineStore();

  // Configuración de calidad
  const dpr = quality === 'low' ? [0.5, 1] as [number, number] : 
              quality === 'medium' ? [0.75, 1.5] as [number, number] : 
              [1, 2] as [number, number];

  // Inicializar engine al montar
  useEffect(() => {
    initialize();
    onReady?.();
    
    return () => {
      shutdown();
    };
  }, [initialize, shutdown, onReady]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        ref={canvasRef}
        dpr={dpr}
        shadows
        gl={{
          antialias: quality !== 'low',
          powerPreference: 'high-performance',
          alpha: false,
          stencil: false,
          depth: true,
        }}
        camera={{
          fov: 60,
          near: 0.1,
          far: viewDistance,
          position: [0, 5, 10],
        }}
        onCreated={({ gl, events }) => {
          // existing renderer config
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1;
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;

          // Diagnostic logs to help track WebGL context issues
          try {
            // Basic GL info
            // eslint-disable-next-line no-console
            const context = gl.getContext();
            console.debug('[GameCanvas] WebGL renderer info:', {
              isContextLost: context ? context.isContextLost() : 'unknown', 
              capabilities: gl.capabilities,
              info: gl.info
            });

            // Listen for context events on the canvas DOM element
            const canvasEl = canvasRef.current as HTMLCanvasElement | null;
            if (canvasEl && !canvasEl.hasAttribute('data-webgl-listeners')) {
              canvasEl.addEventListener('webglcontextlost', (ev) => {
                // eslint-disable-next-line no-console
                console.error('[GameCanvas] webglcontextlost event', ev);
              });
              canvasEl.addEventListener('webglcontextrestored', (ev) => {
                // eslint-disable-next-line no-console
                console.info('[GameCanvas] webglcontextrestored event', ev);
              });
              canvasEl.setAttribute('data-webgl-listeners', '1');
            }
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[GameCanvas] diagnostics failed', err);
          }
        }}
      >
        {/* Performance adapters */}
        <color attach="background" args={['#202020']} />
        
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        
        {/* Performance monitor */}
        <PerformanceMonitor
          onIncline={() => console.log('Performance: incrementando calidad')}
          onDecline={() => console.log('Performance: reduciendo calidad')}
        />
        
        {/* Engine controller */}
        <EngineController />

        {/* Suspense para carga de assets */}
        <Suspense fallback={<LoadingFallback />}>
          {enablePhysics ? (
            <Physics 
              debug={useEngineStore.getState().showColliders}
              gravity={[0, -20, 0]}
              timeStep={1 / 60}
              numSolverIterations={8}
              numAdditionalFrictionIterations={4}
            >
              {children}
            </Physics>
          ) : (
            children
          )}
          
          {/* Preload de assets */}
          <Preload all />
        </Suspense>
        
        {/* Stats de desarrollo */}
        {showStats && <Stats />}
      </Canvas>
    </div>
  );
}

export default GameCanvas;
