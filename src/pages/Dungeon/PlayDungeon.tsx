import { useEffect, useRef, useState, Suspense } from 'react';
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
import { TurnBasedCombatUI } from '../../engine/components/TurnBasedCombatUI';
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
  const [showTitleCard, setShowTitleCard] = useState(false);

  // Listen for intro title card events from FortalezaLevel
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setShowTitleCard(detail?.show ?? false);
    };
    window.addEventListener('fortaleza-title', handler);
    return () => window.removeEventListener('fortaleza-title', handler);
  }, []);

  // ─── Background Music & ESC Menu ──────────────────────────────
  // Use refs to prevent React Strict Mode from registering duplicate listeners
  const escListenerRegistered = useRef(false);
  const menuOpenRef = useRef(false);

  useEffect(() => {
    SceneAudioManager.playMusic(SCENE_MUSIC_URL);

    // Guard: prevent Strict Mode double-mount from creating two listeners
    if (escListenerRegistered.current) {
      console.log('[PlayDungeon] ESC listener already registered, skipping');
      return;
    }
    escListenerRegistered.current = true;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        // Toggle using ref (not functional updater) to avoid Strict Mode double-invoke
        menuOpenRef.current = !menuOpenRef.current;
        console.log('[PlayDungeon] ESC pressed → menu:', menuOpenRef.current ? 'SHOWING' : 'HIDING');
        setShowInGameMenu(menuOpenRef.current);
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      escListenerRegistered.current = false;
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
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

      {showSettings && (
        <>
          {console.log('[PlayDungeon] ⚙️ Rendering ProSettingsPanel')}
          <ProSettingsPanel onClose={() => { console.log('[PlayDungeon] Settings closed'); setShowSettings(false); }} />
        </>
      )}

      {/* IN-GAME PAUSE MENU (Activado al presionar ESC y perder PointerLock) */}
      {showInGameMenu && !showSettings && !showBattle && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(5, 5, 8, 0.7)', backdropFilter: 'blur(25px)', WebkitBackdropFilter: 'blur(25px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'menuFadeIn 0.3s ease-out forwards' }}>

          <div style={{ background: 'linear-gradient(165deg, rgba(22, 22, 36, 0.75), rgba(12, 12, 24, 0.85))', padding: '40px 60px', borderRadius: '20px', border: '1px solid rgba(220, 190, 100, 0.3)', boxShadow: '0 0 50px rgba(200, 170, 80, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

            <h2 style={{ fontFamily: '"Cinzel", "Trajan Pro", serif', color: '#ffd700', fontSize: '2.5rem', marginBottom: '40px', letterSpacing: '4px', textShadow: '0 0 20px rgba(207,161,68,0.4)', textTransform: 'uppercase' }}>Pausa</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '300px' }}>
              <button
                onClick={() => { setShowInGameMenu(false); document.body.requestPointerLock?.(); }}
                style={{ padding: '16px 20px', background: 'linear-gradient(135deg, rgba(210, 180, 90, 0.15), rgba(210, 180, 90, 0.05))', color: '#ffd700', border: '1px solid rgba(207,161,68,0.5)', borderRadius: '12px', cursor: 'pointer', fontFamily: '"Cinzel", serif', fontSize: '1.1rem', letterSpacing: '1px', transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(210, 180, 90, 0.3), rgba(210, 180, 90, 0.15))'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(207,161,68,0.2)'; e.currentTarget.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.5)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(210, 180, 90, 0.15), rgba(210, 180, 90, 0.05))'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.5)'; e.currentTarget.style.textShadow = 'none'; }}
              >
                Reanudar
              </button>

              <button
                onClick={() => { console.log('[PlayDungeon] ⚙️ Ajustes button clicked, showing settings'); setShowSettings(true); }}
                style={{ padding: '16px 20px', background: 'rgba(255, 255, 255, 0.03)', color: '#ccc', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', fontFamily: '"Cinzel", serif', fontSize: '1.0rem', letterSpacing: '1px', transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#ccc'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Ajustes
              </button>

              <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(200,170,80,0.2), transparent)', margin: '15px 0' }} />

              <button
                onClick={() => navigate('/dashboard')}
                style={{ padding: '16px 20px', background: 'rgba(80, 20, 20, 0.3)', color: '#ffaaaa', border: '1px solid rgba(255,100,100,0.2)', borderRadius: '12px', cursor: 'pointer', fontFamily: '"Cinzel", serif', fontSize: '1.0rem', letterSpacing: '1px', transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(120, 30, 30, 0.6)'; e.currentTarget.style.borderColor = '#ff4444'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(255,68,68,0.2)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(80, 20, 20, 0.3)'; e.currentTarget.style.borderColor = 'rgba(255,100,100,0.2)'; e.currentTarget.style.color = '#ffaaaa'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)'; }}
              >
                Abandonar
              </button>
            </div>
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

      {/* Turn-Based 3D Combat UI */}
      {!showBattle && <TurnBasedCombatUI />}

      {/* Mobile Controls Overlay */}
      {mobileControlsEnabled && !showBattle && <MobileControls />}

      {/* Cinematic Level Title Card */}
      {showTitleCard && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          background: 'transparent'
        }}>
          <div style={{
            color: '#ffd700',
            fontFamily: '"Cinzel", "Trajan Pro", serif',
            fontSize: 'clamp(2rem, 5vw, 4rem)',
            fontWeight: 700,
            letterSpacing: '6px',
            textTransform: 'uppercase',
            textShadow: '0 0 30px rgba(0, 0, 0, 0.95), 0 0 15px #cfa144, 0 4px 20px rgba(0,0,0,0.8)',
            textAlign: 'center',
            animation: 'titleFadeIn 1.5s ease-out forwards'
          }}>
            FORTALEZA OLVIDADA
            <div style={{
              fontSize: 'clamp(0.8rem, 2vw, 1.4rem)',
              marginTop: '12px',
              color: '#bbb',
              letterSpacing: '3px',
              fontWeight: 400
            }}>
              Dominio del Guardián Golem
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
