import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { GameCanvas } from '../../engine/components/GameCanvas';
import { Player } from '../../engine/components/Player';
import { CharacterModel3D, CharacterPlaceholder } from '../../engine/components/CharacterModel3D';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { usePlayerStore } from '../../stores/playerStore';
import { DungeonBattle } from '../../components/dungeons/DungeonBattle';
import { PhysicsBody, CollisionGroups } from '../../engine/components/PhysicsWorld';
import { useActiveTeam } from '../../stores/teamStore';
import { dungeonService } from '../../services';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Html } from '@react-three/drei';
import { useEngineStore, QualityLevel } from '../../engine/stores/engineStore';

// Settings Modal Component
function SettingsModal({ onClose }: { onClose: () => void }) {
  const { quality, setQuality, viewDistance, fps } = useEngineStore();
  
  return (
    <div style={{
      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      background: 'rgba(20, 20, 30, 0.95)', padding: '24px', borderRadius: '12px',
      border: '1px solid #444', color: 'white', minWidth: '300px', zIndex: 1000
    }}>
      <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.5rem' }}>Configuración</h2>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Calidad Gráfica</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['low', 'medium', 'high', 'ultra'] as QualityLevel[]).map(q => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              style={{
                flex: 1, padding: '8px', borderRadius: '6px',
                background: quality === q ? '#3b82f6' : '#333',
                border: 'none', color: 'white', cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#aaa' }}>
          Distancia de Visión: {viewDistance}m
        </p>
        <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#aaa' }}>
          FPS Actuales: {fps}
        </p>
      </div>

      <button
        onClick={onClose}
        style={{
          width: '100%', padding: '10px', borderRadius: '6px',
          background: '#ef4444', border: 'none', color: 'white',
          fontWeight: 'bold', cursor: 'pointer'
        }}
      >
        Cerrar
      </button>
    </div>
  );
}

// Import engine scenes
import {
  CastleLevel,
  ValleyLevel,
  CanyonLevel,
  MiningMountainLevel,
  PlainLevel,
  TerrainTestLevel,
  TestLevel,
  PreviewLevel
} from '../../engine/scenes';

function SceneFromGLB({ url }: { url: string }) {
  const gltf = useGLTF(url) as any;
  useEffect(() => {
    if (gltf && gltf.scene) {
      // Center scene horizontally (X, Z) and align bottom to Y=0
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);
      
      // Center X and Z
      gltf.scene.position.x = -center.x;
      gltf.scene.position.z = -center.z;
      // Align bottom to 0
      gltf.scene.position.y = -box.min.y;

      // Diagnostic: log bbox so we can detect scale/position issues
      // eslint-disable-next-line no-console
      console.debug('[SceneFromGLB] loaded and centered:', url, { 
        bboxSize: size.toArray(), 
        originalCenter: center.toArray(),
        newPosition: gltf.scene.position.toArray()
      });
    }
  }, [gltf, url]);

  return gltf ? (
    <RigidBody type="fixed" colliders="trimesh">
      <primitive object={gltf.scene} dispose={null} />
    </RigidBody>
  ) : null;
}

export default function PlayDungeon() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const preview = new URLSearchParams(search).get('preview') === 'true';
  const [glbUrl, setGlbUrl] = useState<string | null>(null);
  const [sceneMeta, setSceneMeta] = useState<any>(null);
  const playerPos = usePlayerStore((s) => s.position);
  const [enemyPos] = useState(() => ({ x: 0, y: 0, z: -2 }));
  const [nearEnemy, setNearEnemy] = useState(false);
  const [showBattle, setShowBattle] = useState(false);
  const [dungeonForBattle, setDungeonForBattle] = useState<any | null>(null);
  const activeTeam = useActiveTeam();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startingRemoteSession, setStartingRemoteSession] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // distancia umbral para iniciar combate
  const TRIGGER_DISTANCE = 2.2;

  useEffect(() => {
    // comprobar proximidad continuamente (suscripción ligera)
    // leer posición directamente desde el store dentro del intervalo para evitar
    // recrear el efecto en cada cambio de posición (evita render-loop)
    const idt = setInterval(() => {
      const p = usePlayerStore.getState().position || { x: 0, y: 0, z: 0 };
      const dx = p.x - enemyPos.x;
      const dz = p.z - enemyPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      setNearEnemy(dist <= TRIGGER_DISTANCE);
    }, 120);
    return () => clearInterval(idt);
  }, [enemyPos]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'e' && nearEnemy && !preview) {
        startCombat();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nearEnemy, preview]);

  const startCombat = async () => {
    // Intentar iniciar sesión remota (backend) antes de abrir el overlay local
    try {
      const teamIds = (activeTeam || []).map(t => t.id);
      if (teamIds.length > 0) {
        setStartingRemoteSession(true);
        const resp = await dungeonService.startDungeon(id!, teamIds);
        const sid = (resp && (resp as any).sessionId) || (resp && (resp as any).session?.id) || null;
        if (sid) setSessionId(sid as string);
        setStartingRemoteSession(false);
      }
    } catch (err) {
      console.warn('startDungeon remoto falló (continuando local):', err);
      setStartingRemoteSession(false);
    }

    // cargar datos de dungeon y abrir el overlay de combate local
    try {
      const d = await (await fetch(`/api/dungeons/${id}`)).json();
      const mapped: any = {
        id: d._id || d.id || id,
        name: d.nombre || d.name || 'Dungeon',
        description: d.descripcion || d.description || '',
        difficulty: d.dificultad || d.difficulty || 'normal',
        requiredLevel: d.nivelMinimo || d.levelRequired || 1,
        ticketCost: 1,
        estimatedTime: d.mejorTiempo ? String(d.mejorTiempo) : '5-10 min',
        energyCost: d.costoEnergia || 10,
        waves: d.pisos || d.waves || 3,
        bossName: d.boss || d.bossName || 'Boss',
        rewards: d.recompensas || { valMin: 50, valMax: 100, evoMin: 10, evoMax: 25, items: [] },
      };
      setDungeonForBattle(mapped);
      setShowBattle(true);
    } catch (err) {
      console.warn('No se pudo obtener dungeon metadata para iniciar combate', err);
      // fallback mínimo
      setDungeonForBattle({ id, name: 'Dungeon', description: '', waves: 3, bossName: 'Boss', rewards: { gold: { min: 50, max: 100 }, exp: { min: 10, max: 25 }, items: [] } });
      setShowBattle(true);
    }
  };

  useEffect(() => {
    if (!id) return;
    
    // Engine Scenes Config
    if (id.startsWith('engine-')) {
      // Mock metadata for engine scenes so game logic (spawns, rewards) doesn't break
      setSceneMeta({ 
        spawn: { x: 0, y: 2, z: 0 },
        enemyModel: 'leviatan',
        name: 'Engine Scene Test'
      });
      setGlbUrl(null); // Ensure no GLB loads
      return;
    }

    if (id.startsWith('demo-')) {
      setGlbUrl('/assets/dungeons/Fortaleza/castle_low_poly.glb');
      setSceneMeta({ spawn: { x: 0, y: 0, z: -2 } });
      return;
    }

    // try to load metadata from API; if it fails and we're in DEV (or id hints 'fortaleza'),
    // fallback to the local demo GLB so we can test walking/scene quickly.
    fetch(`/api/scenes/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: any) => {
        setGlbUrl(data.glbPath || null);
        setSceneMeta(data || null);
      })
      .catch(() => {
        // DEV / convenience fallback so QA can test the scene locally
        if (import.meta.env.DEV || String(id).toLowerCase().includes('fortaleza')) {
          setGlbUrl('/assets/dungeons/Fortaleza/castle_low_poly.glb');
          setSceneMeta({ spawn: { x: 0, y: 0, z: -2 } });
          console.warn('[PlayDungeon] metadata fetch failed — using local demo GLB fallback');
        } else {
          setGlbUrl(null);
          setSceneMeta(null);
        }
      });
  }, [id]);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <GameCanvas>
        {/* Basic Lighting - Fallback for GLB/Demo scenes. Engine scenes use UltraSkySystem. */}
        {!id?.startsWith('engine-') && (
          <>
            <hemisphereLight intensity={0.6} groundColor="#444444" />
            <directionalLight 
              position={[10, 20, 10]} 
              intensity={1.2} 
              castShadow 
              shadow-mapSize={[2048, 2048]} 
            />
            <ambientLight intensity={0.3} />
          </>
        )}

        {/* Engine Scenes — TestLevel y PreviewLevel tienen Player propio, desactivarlo */}
        {id === 'engine-castle' && <CastleLevel />}
        {id === 'engine-valley' && <ValleyLevel />}
        {id === 'engine-canyon' && <CanyonLevel />}
        {id === 'engine-mining' && <MiningMountainLevel />}
        {id === 'engine-plain' && <PlainLevel />}
        {id === 'engine-terrain' && <TerrainTestLevel />}
        {id === 'engine-test' && <TestLevel showPlayer={false} />}
        {id === 'engine-preview' && <PreviewLevel showPlayer={false} />}

        {/* GLB Scene fallback */}
        {glbUrl && !id?.startsWith('engine-') ? <SceneFromGLB url={glbUrl} /> : null}

        {/* Default scene: si NO hay GLB y NO es engine-scene, cargar TestLevel como fallback */}
        {!glbUrl && !id?.startsWith('engine-') && <TestLevel showPlayer={false} />}

        {/* Safety floor — atrapa al jugador si cae por huecos */}
        <RigidBody type="fixed" position={[0, -3, 0]} colliders={false}>
          <CuboidCollider args={[200, 0.5, 200]} />
        </RigidBody>

        {/* Player always mounts (unless preview) so engine/physics can be tested even without the GLB */}
        {!preview && <Player position={[0, 2, 6]} />}

        {/* Enemy trigger - Moved further away for testing to avoid "double character" confusion */}
        <PhysicsBody
          type="fixed"
          collisionGroups={CollisionGroups.TRIGGER}
          onCollisionEnter={() => { if (!preview) startCombat(); }}
        >
          <group position={[ (sceneMeta?.spawnPoints?.enemy?.x ?? sceneMeta?.spawn?.x ?? enemyPos.x), 0, (sceneMeta?.spawnPoints?.enemy?.z ?? sceneMeta?.spawn?.z ?? enemyPos.z) - 5 ]}>
            <Html position={[0, 2.5, 0]} center distanceFactor={10}>
              <div style={{ background: 'rgba(255,0,0,0.5)', padding: '2px 6px', borderRadius: '4px', color: 'white', fontSize: '10px' }}>Enemigo</div>
            </Html>
            <Suspense fallback={<CharacterPlaceholder />}>
              <CharacterModel3D
                personajeId={sceneMeta?.enemyModel || sceneMeta?.enemy?.id || 'leviatan'}
                characterClass={sceneMeta?.enemy?.class}
                animation="Idle"
                withWeapon={false}
              />
            </Suspense>
          </group>
        </PhysicsBody>

        {preview && (
          <group />
        )}
      </GameCanvas>

      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 50, display: 'flex', gap: '10px' }}>
        <button onClick={() => navigate('/dungeon')} style={{ padding: '8px 12px', background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer' }}>
          Salir
        </button>
        <button onClick={() => setShowSettings(true)} style={{ padding: '8px 12px', background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer' }}>
          ⚙️ Ajustes
        </button>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

  {!glbUrl && (
    <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 50 }}>
      <button onClick={() => { setGlbUrl('/assets/dungeons/Fortaleza/castle_low_poly.glb'); setSceneMeta({ spawn: { x: 0, y: 0, z: -2 } }); }} style={{ padding: '8px 12px' }}>Cargar demo GLB</button>
    </div>
  )}

  {nearEnemy && !preview && (
    <div style={{ position: 'absolute', bottom: 120, left: '50%', transform: 'translateX(-50%)', zIndex: 60 }}>
      <div style={{ padding: '10px 16px', background: 'rgba(0,0,0,0.6)', borderRadius: 8 }}>Presiona <strong>E</strong> para iniciar combate {startingRemoteSession && '· iniciando sesión...'}</div>
    </div>
  )}

      {showBattle && dungeonForBattle && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 120 }}>
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 1200, margin: 'auto' }}>
              <div style={{ backdropFilter: 'blur(6px)' }}>
                <DungeonBattle
                  dungeon={dungeonForBattle}
                  onComplete={async (result) => {
                    if (sessionId) {
                      try {
                        const remote = await dungeonService.getSession(dungeonForBattle.id, sessionId);
                        const rewards = (remote as any)?.rewards || (result.rewards || {});
                        const teamDamage = (remote as any)?.teamDamage || (result.teamDamage || []);

                        if (rewards.gold) usePlayerStore.getState().addGold(rewards.gold);
                        if (rewards.exp) usePlayerStore.getState().addExperience(rewards.exp);

                        teamDamage.forEach((dmg: any) => {
                          if (dmg.characterId === usePlayerStore.getState().characterId) {
                            const current = usePlayerStore.getState().currentHealth - (dmg.damage || 0);
                            usePlayerStore.getState().setCurrentHealth(Math.max(0, current));
                          }
                        });
                      } catch (err) {
                        console.warn('No se pudo leer resultado remoto, aplicando local', err);
                        if (result.victory) {
                          usePlayerStore.getState().addGold(result.rewards.gold || 0);
                          usePlayerStore.getState().addExperience(result.rewards.exp || 0);
                        }
                      }
                    } else {
                      if (result.victory) {
                        usePlayerStore.getState().addGold(result.rewards.gold || 0);
                        usePlayerStore.getState().addExperience(result.rewards.exp || 0);
                      }

                      (result.teamDamage || []).forEach(d => {
                        if (d.characterId === usePlayerStore.getState().characterId) {
                          const newHp = Math.max(0, usePlayerStore.getState().currentHealth - (d.damage || 0));
                          usePlayerStore.getState().setCurrentHealth(newHp);
                        }
                      });
                    }

                    setShowBattle(false);
                    setTimeout(() => navigate('/dungeon'), 600);
                  }}
                  onExit={() => { setShowBattle(false); setTimeout(() => navigate('/dungeon'), 300); }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
