import { useEffect, useState, Suspense } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { GameCanvas } from '../../engine/components/GameCanvas';
import { CharacterModel3D, CharacterPlaceholder } from '../../engine/components/CharacterModel3D';
import { usePlayerStore } from '../../stores/playerStore';
import { DungeonBattle } from '../../components/dungeons/DungeonBattle';
import { PhysicsBody, CollisionGroups } from '../../engine/components/PhysicsWorld';
import { useActiveTeam } from '../../stores/teamStore';
import { dungeonService } from '../../services';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Html } from '@react-three/drei';
import FortalezaLevel from '../../engine/scenes/FortalezaLevel';
import { ProSettingsPanel } from '../../components/ui/ProSettingsPanel';
import { SceneAudioManager } from '../../engine/systems/SceneAudioManager';
import { MobileControls } from '../../components/ui/MobileControls';
import { useSettingsStore } from '../../stores/settingsStore';

// Background music path
const SCENE_MUSIC_URL = '/assets/audio/music/Valnor sountrac.mp3';

// Legacy scenes removed

export default function PlayDungeon() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const preview = new URLSearchParams(search).get('preview') === 'true';
  const [sceneMeta, setSceneMeta] = useState<any>(null);
  const [enemyPos] = useState(() => ({ x: 0, y: 0, z: -2 }));
  const [nearEnemy, setNearEnemy] = useState(false);
  const [showBattle, setShowBattle] = useState(false);
  const [dungeonForBattle, setDungeonForBattle] = useState<any | null>(null);
  const activeTeam = useActiveTeam();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startingRemoteSession, setStartingRemoteSession] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInGameMenu, setShowInGameMenu] = useState(false);
  const mobileControlsEnabled = useSettingsStore(s => s.mobileControlsEnabled);

  // ─── Background Music & Pointer Lock ──────────────────────────────
  useEffect(() => {
    // Volúmenes se sincronizan automáticamente via settingsStore.subscribe
    SceneAudioManager.playMusic(SCENE_MUSIC_URL);

    // Escuchar ESC para mostrar el menú de pausa in-game (ya que FortalezaPlayer no usa pointerLock)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowInGameMenu(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // distancia umbral para iniciar combate
  const TRIGGER_DISTANCE = 2.2;

  useEffect(() => {
    // comprobar proximidad continuamente (suscripción ligera)
    // leer posición directamente desde el store dentro del intervalo para evitar
    // recrear el efecto en cada cambio de posición (evita render-loop)
    const idt = setInterval(() => {
      if (useFortalezaEngine) return;
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
        name: d.nombre || d.name || 'Fortaleza Olvidada',
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
      setDungeonForBattle({ id, name: 'Fortaleza Olvidada', description: '', waves: 3, bossName: 'Jefe', rewards: { gold: { min: 50, max: 100 }, exp: { min: 10, max: 25 }, items: [] } });
      setShowBattle(true);
    }
  };

  // Detect if this is a Fortaleza-type dungeon (engine scene or backend)
  const isFortalezaDungeon = id === 'engine-fortaleza' || id?.toLowerCase().includes('fortaleza');
  // Also check location state for dungeon name (passed by Dungeon.tsx on navigate)
  const locationState = (useLocation() as any).state;
  const isFortalezaByName = locationState?.dungeonName?.toLowerCase().includes('fortaleza');
  const useFortalezaEngine = isFortalezaDungeon || isFortalezaByName;

  useEffect(() => {
    if (!id) return;

    // Engine Scenes Config (includes backend Fortaleza dungeons)
    if (id.startsWith('engine-') || useFortalezaEngine) {
      // Mock metadata for engine scenes so game logic (spawns, rewards) doesn't break
      setSceneMeta({
        spawn: { x: 0, y: 2, z: 0 },
        enemyModel: 'leviatan',
        name: 'Engine Scene Test'
      });
      return;
    }

    if (id.startsWith('demo-')) {
      setSceneMeta({ spawn: { x: 0, y: 0, z: -2 } });
      return;
    }

    // try to load metadata from API; if it fails and we're in DEV (or id hints 'fortaleza'),
    // fallback to the local demo GLB so we can test walking/scene quickly.
    // Load metadata from API; if it fails, set defaults
    fetch(`/api/scenes/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: any) => {
        setSceneMeta(data || null);
      })
      .catch(() => {
        setSceneMeta(null);
      });
  }, [id]);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', backgroundColor: '#000' }}>
      <GameCanvas enablePhysics={true} backgroundColor={useFortalezaEngine ? null : '#202020'}>
        {/* Basic Lighting - Fallback for GLB/Demo scenes. Engine scenes use UltraSkySystem. */}
        {!useFortalezaEngine && (
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

        {/* Engine Scenes */}
        {useFortalezaEngine && <FortalezaLevel />}

        {/* 
            Default ground — cuando no hay GLB ni engine-scene.
            A desactivar si cargamos la fortaleza
        */}
        {/*
        {!glbUrl && !id?.startsWith('engine-') && (
          <RigidBody type="fixed" colliders={false}>
            <CuboidCollider args={[50, 0.5, 50]} position={[0, 0, 0]} />
            <mesh receiveShadow position={[0, 0, 0]}>
              <boxGeometry args={[100, 1, 100]} />
              <meshStandardMaterial color="#3d5c3d" roughness={0.9} />
            </mesh>
            <gridHelper args={[100, 50, '#666666', '#444444']} position={[0, 0.51, 0]} />
          </RigidBody>
        )}
        */}

        {/* Safety floor — atrapa al jugador si cae por huecos */}
        <RigidBody type="fixed" position={[0, -3, 0]} colliders={false}>
          <CuboidCollider args={[200, 0.5, 200]} />
        </RigidBody>

        {/* Enemy trigger - Moved further away for testing to avoid "double character" confusion */}
        {!useFortalezaEngine && (
          <PhysicsBody
            type="fixed"
            collisionGroups={CollisionGroups.TRIGGER}
            onCollisionEnter={() => { if (!preview) startCombat(); }}
          >
            <group position={[(sceneMeta?.spawnPoints?.enemy?.x ?? sceneMeta?.spawn?.x ?? enemyPos.x), 0, (sceneMeta?.spawnPoints?.enemy?.z ?? sceneMeta?.spawn?.z ?? enemyPos.z) - 5]}>
              <Html position={[0, 2.5, 0]} center distanceFactor={10}>
                <div style={{ background: 'rgba(255,0,0,0.5)', padding: '2px 6px', borderRadius: '4px', color: 'white', fontSize: '10px' }}>Enemigo</div>
              </Html>
              <Suspense fallback={<CharacterPlaceholder />}>
                <CharacterModel3D
                  personajeId={sceneMeta?.enemyModel || sceneMeta?.enemy?.id || 'leviatan'}
                  characterClass={sceneMeta?.enemy?.class}
                  withWeapon={false}
                />
              </Suspense>
            </group>
          </PhysicsBody>
        )}

        {preview && (
          <group />
        )}
      </GameCanvas>

      {showSettings && <ProSettingsPanel onClose={() => setShowSettings(false)} />}

      {/* IN-GAME PAUSE MENU (Activado al presionar ESC y perder PointerLock) */}
      {showInGameMenu && !showSettings && !showBattle && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ fontFamily: '"Cinzel", "Trajan Pro", serif', color: '#cfa144', fontSize: '36px', marginBottom: '30px', textShadow: '0 0 15px rgba(207,161,68,0.5)', letterSpacing: '2px' }}>El Juego está Pausado</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '320px' }}>
            <button
              onClick={() => { setShowInGameMenu(false); document.body.requestPointerLock?.(); }}
              style={{ padding: '16px 20px', background: 'rgba(30, 25, 40, 0.95)', color: '#fff', border: '1px solid rgba(207,161,68,0.3)', borderRadius: '8px', cursor: 'pointer', fontFamily: '"Cinzel", serif', fontSize: '18px', display: 'flex', justifySelf: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(207, 161, 68, 0.15)'; e.currentTarget.style.borderColor = '#cfa144'; e.currentTarget.style.boxShadow = '0 0 15px rgba(207,161,68,0.4)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(30, 25, 40, 0.95)'; e.currentTarget.style.borderColor = 'rgba(207,161,68,0.3)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.5)'; }}
            >
              Reanudar Partida
            </button>
            <button
              onClick={() => setShowSettings(true)}
              style={{ padding: '16px 20px', background: 'rgba(30, 25, 40, 0.95)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer', fontFamily: '"Cinzel", serif', fontSize: '18px', display: 'flex', justifySelf: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(30, 25, 40, 0.95)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            >
              ⚙️ Ajustes de Sistema
            </button>
            <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', margin: '15px 0' }} />
            <button
              onClick={() => navigate('/dungeon')}
              style={{ padding: '16px 20px', background: 'rgba(50, 15, 15, 0.95)', color: '#ffaaaa', border: '1px solid rgba(255,100,100,0.3)', borderRadius: '8px', cursor: 'pointer', fontFamily: '"Cinzel", serif', fontSize: '18px', display: 'flex', justifySelf: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(100, 20, 20, 0.95)'; e.currentTarget.style.borderColor = '#ff4444'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.boxShadow = '0 0 15px rgba(255,68,68,0.4)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(50, 15, 15, 0.95)'; e.currentTarget.style.borderColor = 'rgba(255,100,100,0.3)'; e.currentTarget.style.color = '#ffaaaa'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.5)'; }}
            >
              Abandonar al Dashboard
            </button>
          </div>
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

      {/* Mobile Controls Overlay */}
      {mobileControlsEnabled && !showBattle && <MobileControls />}
    </div>
  );
}
