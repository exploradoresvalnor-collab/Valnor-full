import React, { useEffect, useState, Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

type SceneMetadata = {
  id: string;
  name: string;
  glbPath: string;
  spawnPoints?: Record<string, { x: number; y: number; z: number }>;
  visual?: {
    ambientLight?: number;
    directionalLight?: { intensity?: number; position?: [number, number, number] };
  };
};

function Model({ url, onLoaded }: { url: string; onLoaded?: (scene: THREE.Object3D) => void }) {
  const gltf = useGLTF(url) as any;
  const ref = useRef<THREE.Group | null>(null);
  useEffect(() => {
    if (gltf && gltf.scene && onLoaded) onLoaded(gltf.scene);
  }, [gltf, onLoaded]);
  return <primitive ref={ref as any} object={gltf.scene} dispose={null} />;
}

function TeamAgents({ count = 3, start = new THREE.Vector3(-3, 0, 3), end = new THREE.Vector3(0, 0, -3), progress = 0 }: { count?: number; start?: THREE.Vector3; end?: THREE.Vector3; progress?: number }) {
  // Render small spheres representing team members moving from start to end using progress 0..1
  const agents = new Array(count).fill(0).map((_, i) => {
    const offset = (i - (count - 1) / 2) * 0.6;
    return { id: i, offset };
  });

  return (
    <group>
      {agents.map(a => (
        <mesh key={a.id} position={[
          THREE.MathUtils.lerp(start.x + a.offset, end.x + a.offset, progress),
          0.25 + Math.abs(Math.sin(progress * Math.PI * 2 + a.id)) * 0.05,
          THREE.MathUtils.lerp(start.z, end.z, progress),
        ]}>
          <sphereGeometry args={[0.25, 8, 8]} />
          <meshStandardMaterial color={a.id === 0 ? '#ffd166' : '#90be6d'} metalness={0.2} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function CinematicScene({ url, teamCount = 3 }: { url: string; teamCount?: number }) {
  const gltf = useGLTF(url) as any;
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const sceneRef = useRef<THREE.Object3D | null>(null);

  useEffect(() => {
    if (gltf && gltf.scene) {
      sceneRef.current = gltf.scene;
      // ensure scene is slightly centered and scaled
      gltf.scene.position.set(0, 0, 0);
      setLoaded(true);
    }
  }, [gltf]);

  useFrame((state, delta) => {
    if (!loaded) return;
    // progress increases over ~6 seconds
    setProgress(p => Math.min(1, p + delta / 6));
    // rotate camera slowly during cinematic
    const t = progress;
    const cam = state.camera;
    const radius = THREE.MathUtils.lerp(6, 4, t);
    const angle = THREE.MathUtils.lerp(Math.PI / 4, 0, t) - state.clock.elapsedTime * 0.05;
    cam.position.set(Math.cos(angle) * radius, THREE.MathUtils.lerp(3.5, 2.5, t), Math.sin(angle) * radius);
    cam.lookAt(0, 1.0, 0);
    cam.updateProjectionMatrix();
  });

  // define start/end for agents relative to scene
  const start = new THREE.Vector3(-3, 0, 4);
  const end = new THREE.Vector3(0, 0, -2);

  return (
    <>
      <primitive object={gltf.scene} dispose={null} />
      <TeamAgents count={teamCount} start={start} end={end} progress={progress} />
    </>
  );
}

function InteractiveAgents({ count = 3 }: { count?: number }) {
  const { gl } = useThree();
  // We'll use a simpler approach: manage positions and pointer events on meshes
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const [positions, setPositions] = useState(() => {
    const arr: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) arr.push(new THREE.Vector3(-2 + i * 1.8, 0.25, 2));
    return arr;
  });
  const draggingRef = useRef<{ index: number | null; offset?: THREE.Vector3 }>({ index: null });
  const meshesRef = useRef<Array<THREE.Mesh | null>>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const sel = draggingRef.current.index;
      if (sel === null) return;
      const delta = 0.25;
      setPositions(prev => {
        const copy = prev.map(p => p.clone());
        const p = copy[sel];
        if (!p) return prev;
        if (e.key === 'ArrowLeft') p.x -= delta;
        if (e.key === 'ArrowRight') p.x += delta;
        if (e.key === 'ArrowUp') p.z -= delta;
        if (e.key === 'ArrowDown') p.z += delta;
        return copy;
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // pointer helpers attached to document to compute world position on plane
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (draggingRef.current.index === null) return;
      const rect = (gl.domElement as HTMLCanvasElement).getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      // use the camera from the renderer's scene
      const cam = (gl as any).camera || undefined;
      if (cam) raycaster.setFromCamera(mouse, cam);
      const intersect = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(plane, intersect)) {
        setPositions(prev => {
          const copy = prev.map(p => p.clone());
          const i = draggingRef.current.index!;
          copy[i].x = intersect.x;
          copy[i].z = intersect.z;
          return copy;
        });
      }
    };
    const onPointerUp = () => { draggingRef.current.index = null; };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => { window.removeEventListener('pointermove', onPointerMove); window.removeEventListener('pointerup', onPointerUp); };
  }, [gl, mouse, plane, raycaster]);

  return (
    <group>
      {positions.map((pos, i) => (
        <mesh
          key={i}
          ref={el => meshesRef.current[i] = el}
          position={[pos.x, pos.y, pos.z]}
          onPointerDown={(e) => { e.stopPropagation(); draggingRef.current.index = i; }}
          onPointerUp={(e) => { e.stopPropagation(); draggingRef.current.index = null; }}
        >
          <boxGeometry args={[0.6, 0.8, 0.6]} />
          <meshStandardMaterial color={i === 0 ? '#ffb703' : i === 1 ? '#8ecae6' : '#90be6d'} />
        </mesh>
      ))}
    </group>
  );
}

export default function DungeonModelPreview({
  sceneId,
  apiBase = '/api/scenes',
  height = 320,
  teamCount = 3,
  directGlbUrl,
  interactive = false,
}: {
  sceneId: string;
  apiBase?: string;
  height?: number | string;
  teamCount?: number;
  directGlbUrl?: string;
  interactive?: boolean;
}) {
  const [meta, setMeta] = useState<SceneMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [glbAvailable, setGlbAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    setMeta(null);
    setError(null);
    setGlbAvailable(null);

    // If a direct GLB URL is provided (e.g. for demo dungeons), use it and skip metadata fetch
    if (directGlbUrl) {
      if (!mounted) return;
      setMeta({ id: sceneId, name: sceneId, glbPath: directGlbUrl });
      setGlbAvailable(true);
      return () => { mounted = false; };
    }

    fetch(`${apiBase}/${sceneId}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText || 'Error fetching scene');
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        setMeta(data as SceneMetadata);
        // check glb availability
        const path = (data as any).glbPath;
        if (path) {
          const url = path.startsWith('http') ? path : path.replace(/^\//, '') ? `/${path.replace(/^\//, '')}` : path;
          fetch(url, { method: 'HEAD' })
            .then(r => { if (!mounted) return; setGlbAvailable(r.ok); })
            .catch(() => { if (!mounted) return; setGlbAvailable(false); });
        } else {
          setGlbAvailable(false);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'Error');
      });

    return () => {
      mounted = false;
    };
  }, [sceneId, apiBase, directGlbUrl]);

  if (error) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Error: {error}</div>;
  if (!meta) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando escena...</div>;

  const glbUrl = meta.glbPath && meta.glbPath.startsWith('http') ? meta.glbPath : meta.glbPath && meta.glbPath.replace(/^\//, '') ? `/${meta.glbPath.replace(/^\//, '')}` : meta.glbPath;

  // Fallback thumbnail
  const thumb = (meta as any).thumbnail || `/assets/dungeons/${sceneId}.jpg`;

  if (glbAvailable === false) {
    return (
      <div style={{ width: '100%', height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0006', borderRadius: 8 }}>
        <img src={thumb} alt={meta.name} style={{ maxHeight: '100%', maxWidth: '100%', borderRadius: 8 }} />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <Canvas shadows camera={{ position: [0, 4, 10], fov: 45 }}>
        <ambientLight intensity={meta.visual?.ambientLight ?? 0.5} />
        <directionalLight
          intensity={meta.visual?.directionalLight?.intensity ?? 1}
          position={meta.visual?.directionalLight?.position ?? [5, 10, 5]}
          castShadow
        />
        <Suspense fallback={null}>
          {/* Cinematic presentation: team walks and camera dollies */}
          <CinematicScene url={glbUrl} teamCount={teamCount} />
          {interactive && <InteractiveAgents count={teamCount} />}
        </Suspense>
        <OrbitControls enablePan={false} enableZoom={true} />
      </Canvas>
    </div>
  );
}

export { Model };

useGLTF.preload && (useGLTF as any).preload();
