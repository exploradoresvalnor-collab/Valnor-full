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

function SceneFromGLB({ url }: { url: string }) {
  const gltf = useGLTF(url) as any;
  useEffect(() => {
    if (gltf && gltf.scene) {
      // center scene
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);
      gltf.scene.position.sub(center);
      // Diagnostic: log bbox so we can detect scale/position issues
      // eslint-disable-next-line no-console
      console.debug('[SceneFromGLB] loaded:', url, { bboxSize: size.toArray(), bboxCenter: center.toArray() });
    }
  }, [gltf, url]);

  return gltf ? <primitive object={gltf.scene} dispose={null} /> : null;
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
        {glbUrl ? <SceneFromGLB url={glbUrl} /> : null}

        {/* Player always mounts (unless preview) so engine/physics can be tested even without the GLB */}
        {!preview && <Player position={[0, 2, 6]} />}

        {/* Enemy trigger - present even if GLB missing */}
        <PhysicsBody
          type="fixed"
          collisionGroups={CollisionGroups.TRIGGER}
          onCollisionEnter={() => { if (!preview) startCombat(); }}
        >
          <group position={[ (sceneMeta?.spawnPoints?.enemy?.x ?? sceneMeta?.spawn?.x ?? enemyPos.x), 0, (sceneMeta?.spawnPoints?.enemy?.z ?? sceneMeta?.spawn?.z ?? enemyPos.z) ]}>
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

      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 50 }}>
        <button onClick={() => navigate('/dungeon')} style={{ padding: '8px 12px' }}>Salir</button>
      </div>

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
