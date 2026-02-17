import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useIsGuest } from '../../stores/sessionStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useActiveTeam } from '../../stores/teamStore';
import type { Dungeon as DungeonType } from '../../stores/dungeonStore';
import { getDemoCharacters } from '../../services/demo.service';
import { useTeamStore } from '../../stores/teamStore';

// Map CharacterData (demo) -> TeamMember
function mapDemoToTeam(char: any) {
  // map classes not present in TeamMember to closest match
  const classMap: Record<string, string> = {
    necromancer: 'mage',
    berserker: 'warrior',
    monk: 'rogue',
    paladin: 'paladin',
    archer: 'archer',
    warrior: 'warrior',
    mage: 'mage',
    rogue: 'rogue',
    healer: 'healer',
  };

  const mappedClass = (classMap[String(char.class).toLowerCase()] || 'warrior') as any;

  return {
    id: char.id,
    name: char.name,
    level: char.level || 1,
    class: mappedClass,
    rarity: char.rarity || 'common',
    stats: char.stats ? {
      attack: char.stats.attack ?? 10,
      defense: char.stats.defense ?? 5,
      health: char.stats.health ?? (char.stats.vida ?? 100),
      speed: char.stats.speed ?? 10,
    } : undefined,
  };
}
import { dungeonService } from '../../services';
import { DungeonBattle } from '../../components/dungeons/DungeonBattle';
import DungeonModelPreview from '../../engine/components/DungeonModelPreview';
import './Dungeon.css';

interface DungeonInfo {
  id: string;
  nombre: string;
  descripcion: string;
  nivelMinimo: number;
  nivelMaximo: number;
  dificultad: DungeonDifficulty;
  costoEnergia: number;
  recompensas: {
    valMin: number;
    valMax: number;
    evoMin: number;
    evoMax: number;
    items: string[];
  };
  enemigos: string[];
  boss: string;
  pisos: number;
  completado?: boolean;
  mejorTiempo?: number;
}

type DungeonDifficulty = 'easy' | 'normal' | 'hard' | 'expert' | 'nightmare';

const difficultyColors: Record<DungeonDifficulty, string> = {
  easy: '#22c55e',
  normal: '#f59e0b',
  hard: '#ef4444',
  expert: '#a855f7',
  nightmare: '#6b21a8',
};

const difficultyNames: Record<DungeonDifficulty, string> = {
  easy: 'Fácil',
  normal: 'Normal',
  hard: 'Difícil',
  expert: 'Extremo',
  nightmare: 'Pesadilla',
};

/** Map backend dungeon to DungeonInfo */
function normalizeDifficulty(rawDiff: any): DungeonDifficulty {
  if (!rawDiff) return 'normal';
  const d = String(rawDiff).toLowerCase();
  if (d === 'facil' || d === 'easy') return 'easy';
  if (d === 'normal' || d === 'medium') return 'normal';
  if (d === 'dificil' || d === 'hard') return 'hard';
  if (d === 'extremo' || d === 'expert' || d === 'legendary') return 'expert';
  if (d === 'nightmare' || d === 'pesadilla') return 'nightmare';
  // fallback to normal
  return 'normal';
}

function mapDungeon(raw: any): DungeonInfo {
  const rawDiff = raw.dificultad ?? raw.difficulty ?? raw.levelDifficulty ?? 'normal';
  return {
    id: raw._id || raw.id,
    nombre: raw.nombre || raw.name || 'Dungeon',
    descripcion: raw.descripcion || raw.description || '',
    nivelMinimo: raw.nivelMinimo || raw.levelRequired || raw.nivel || 1,
    nivelMaximo: raw.nivelMaximo || raw.maxLevel || (raw.nivelMinimo || 1) + 10,
    dificultad: normalizeDifficulty(rawDiff),
    costoEnergia: raw.costoEnergia || raw.energyCost || 10,
    recompensas: {
      valMin: raw.recompensas?.valMin || raw.rewards?.gold?.min || 50,
      valMax: raw.recompensas?.valMax || raw.rewards?.gold?.max || 200,
      evoMin: raw.recompensas?.evoMin || raw.rewards?.exp?.min || 20,
      evoMax: raw.recompensas?.evoMax || raw.rewards?.exp?.max || 100,
      items: raw.recompensas?.items || raw.rewards?.items || [],
    },
    enemigos: raw.enemigos || raw.enemies || [],
    boss: raw.boss || raw.bossName || 'Boss',
    pisos: raw.pisos || raw.waves || raw.floors || 5,
    completado: raw.completado || raw.completed || false,
    mejorTiempo: raw.mejorTiempo || raw.bestTime,
  };
}



const Dungeon: React.FC = () => {
  const navigate = useNavigate();
  const { loading } = useAuth();
  const isGuest = useIsGuest();

  const { level: playerLevel, energy, maxEnergy, addGold, addExperience, useEnergy } = usePlayerStore();
  const team = useActiveTeam();
  // using local dungeonsList fetched from backend/demo; store dungeons not used here

  const [selectedDungeon, setSelectedDungeon] = useState<DungeonInfo | null>(null);
  const [showEnterModal, setShowEnterModal] = useState(false);
  const [showBattle, setShowBattle] = useState(false);
  const [battleDungeon, setBattleDungeon] = useState<DungeonType | null>(null);
  const [dungeonsList, setDungeonsList] = useState<DungeonInfo[]>([]);
  const [dungeonLoading, setDungeonLoading] = useState(true);
  const gridRef = useRef<HTMLDivElement | null>(null);

  // Inject demo team when modal opens for guests (so cinematic preview/team display works)
  useEffect(() => {
    if (showEnterModal && isGuest && team.length === 0 && selectedDungeon) {
      const demo = getDemoCharacters();
      const mapped = demo.map(mapDemoToTeam);
      useTeamStore.getState().setTeam(mapped);
    }
  }, [showEnterModal, isGuest, team.length, selectedDungeon]);

  // Fetch dungeons (real or demo)
  useEffect(() => {
    let cancelled = false;

    const fetchDungeons = async () => {
      setDungeonLoading(true);
      try {
        if (isGuest) {
          // Demo dungeons for guests
          const demoDungeons: DungeonInfo[] = [
            {
              id: 'demo-dungeon-1',
              nombre: 'Mazmorra de Entrenamiento',
              descripcion: 'Una mazmorra básica para principiantes.',
              nivelMinimo: 1,
              nivelMaximo: 5,
              dificultad: 'easy',
              costoEnergia: 10,
              recompensas: {
                valMin: 50,
                valMax: 100,
                evoMin: 10,
                evoMax: 25,
                items: ['pocion-salud'],
              },
              enemigos: ['Goblin', 'Orco'],
              boss: 'Orco Jefe',
              pisos: 3,
              completado: false,
            },
            {
              id: 'demo-dungeon-2',
              nombre: 'Cueva Oscura',
              descripcion: 'Explora las profundidades de esta cueva misteriosa.',
              nivelMinimo: 3,
              nivelMaximo: 8,
              dificultad: 'normal',
              costoEnergia: 15,
              recompensas: {
                valMin: 100,
                valMax: 200,
                evoMin: 20,
                evoMax: 40,
                items: ['pocion-mana', 'espada-hierro'],
              },
              enemigos: ['Murciélago', 'Araña Gigante', 'Esqueleto'],
              boss: 'Lich',
              pisos: 5,
              completado: false,
            },
          ];
          if (!cancelled) {
            setDungeonsList(demoDungeons);
          }
        } else {
          console.log('[Dungeon] Loading real dungeons from backend');
          try {
            const result = await dungeonService.getDungeons();
            console.log('[Dungeon] Raw result from backend:', result);
            if (cancelled) return;

            if (Array.isArray(result) && result.length > 0) {
              const mappedDungeons = (result as any[]).map(mapDungeon);
              console.log('[Dungeon] Mapped dungeons:', mappedDungeons);
              setDungeonsList(mappedDungeons);
            } else {
              console.warn('[Dungeon] No dungeons received from backend or empty array');
              setDungeonsList([]);
            }
          } catch (serviceError) {
            console.error('[Dungeon] Error calling dungeonService.getDungeons():', serviceError);
            // Fallback to empty array
            setDungeonsList([]);
          }
        }
      } catch (err) {
        console.error('[Dungeon] Error fetching dungeons:', err);
      } finally {
        if (!cancelled) setDungeonLoading(false);
      }
    };

    fetchDungeons();
    return () => { cancelled = true; };
  }, [isGuest]);

  // Close modal with Escape key and trap focus hint
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowEnterModal(false);
    };
    if (showEnterModal) window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); };
  }, [showEnterModal]);

  if (loading || dungeonLoading) {
    return (
      <div className="dungeon-loading">
        <div className="loading-spinner" />
        <p>Cargando dungeons...</p>
      </div>
    );
  }

  const userLevel = isGuest ? 5 : playerLevel; // Demo level for guests
  const userEnergy = isGuest ? 50 : energy; // Demo energy for guests

  const canEnter = (dungeon: DungeonInfo) => {
    return userLevel >= dungeon.nivelMinimo && userEnergy >= dungeon.costoEnergia;
  };

  const handleEnterDungeon = () => {
    if (!selectedDungeon) return;
    
    // Verificar si hay equipo activo (demo o real)
    const hasTeam = team.length > 0;
    if (!hasTeam) {
      if (isGuest) {
        // Inject demo characters into team store so DungeonBattle has participants
        const demo = getDemoCharacters();
        const mapped = demo.map(mapDemoToTeam);
        useTeamStore.getState().setTeam(mapped);
      } else {
        alert('¡Necesitas un equipo para entrar a la dungeon!');
        return;
      }
    }
    
    // Usar energía (solo para usuarios reales)
    if (!isGuest) {
      useEnergy(selectedDungeon.costoEnergia);
    }
    
    // Navegar a la pantalla de juego (carga la escena 3D). El combate NO se ejecuta automáticamente; el motor
    // de juego debe gestionar el inicio del combate cuando el jugador alcance al enemigo.
    navigate(`/dungeon/play/${selectedDungeon.id}`);
  };

  const handleBattleComplete = (result: { victory: boolean; rewards: { gold: number; exp: number; items: string[] } }) => {
    if (result.victory) {
      // Dar recompensas
      addGold(result.rewards.gold);
      addExperience(result.rewards.exp);
    }
    setShowBattle(false);
    setBattleDungeon(null);
  };

  const handleBattleExit = () => {
    setShowBattle(false);
    setBattleDungeon(null);
  };

  return (
    <div className="dungeon-page">
      {/* Header */}
      <header className="dungeon-header">
        <div className="header-left">
          <button onClick={() => navigate('/dashboard')} className="back-btn" aria-label="Volver">
            <span className="back-icon">←</span>
            <span className="back-text">Volver</span>
          </button>
        </div>

        <div className="header-center">
          <div className="header-title">
            <span className="sword">⚔️</span>
            <span className="title-text">DUNGEONS</span>
          </div>
          <div className="header-subtitle">🗺️ Selecciona una Mazmorra</div>
        </div>

        <div className="header-right">
          <div className="energy-pill" title="Energía">
            <span className="energy-icon">⚡</span>
            <span className="energy-amount">{userEnergy}</span>
            <span className="energy-max">/{maxEnergy || 100}</span>
          </div>
        </div>
      </header>

      <div className="dungeon-container">
        <div className="dungeon-list">
          <div className="list-header">
            <h2>🗺️ Selecciona una Mazmorra</h2>
            <span className="player-level">Tu nivel: {userLevel}</span>
          </div>

          <div className="dungeons-grid" ref={gridRef}>
            {dungeonsList.map((dungeon) => (
              <div
                key={dungeon.id}
                className="dungeon-card"
                onClick={() => { setSelectedDungeon(dungeon); setShowEnterModal(true); }}
              >
                <div className="card-media">
                  <img
                    src={`/assets/dungeons/${dungeon.id}.jpg`}
                    alt={dungeon.nombre}
                    className="dungeon-image"
                  />
                  <div className="card-overlay">
                    <div className="overlay-title">{dungeon.nombre}</div>
                    <div className="overlay-sub">{dungeon.descripcion}</div>
                  </div>
                  <div className="card-badges">
                    <span className={`badge difficulty ${dungeon.dificultad}`}>{difficultyNames[dungeon.dificultad]}</span>
                    <span className="badge level">Nv.{dungeon.nivelMinimo}</span>
                  </div>
                </div>

                <div className="dungeon-info compact">
                  <p className="short-desc">{dungeon.descripcion}</p>
                  <div className="meta-row">
                    <span className="meta-item">{dungeon.pisos} pisos</span>
                    <span className="meta-item">Nv.{dungeon.nivelMinimo}-{dungeon.nivelMaximo}</span>
                  </div>
                  <div className="enemies-row">
                    {dungeon.enemigos.slice(0,4).map((enemy, i) => (
                      <span key={i} className="enemy-chip">{enemy}</span>
                    ))}
                  </div>
                  <div className="card-actions">
                    <button
                      className="dungeon-select-button"
                      onClick={(e) => { e.stopPropagation(); setSelectedDungeon(dungeon); setShowEnterModal(true); }}
                    >
                      Seleccionar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            className="carousel-btn left"
            aria-label="Scroll left"
            onClick={() => { if (!gridRef.current) return; gridRef.current.scrollBy({ left: -300, behavior: 'smooth' }); }}
          >
            ‹
          </button>
          <button
            className="carousel-btn right"
            aria-label="Scroll right"
            onClick={() => { if (!gridRef.current) return; gridRef.current.scrollBy({ left: 300, behavior: 'smooth' }); }}
          >
            ›
          </button>
        </div>
      </div>

      {/* Enter Modal */}
      {showEnterModal && selectedDungeon && (
        <div className="modal-overlay" onClick={() => setShowEnterModal(false)}>
          <div className="enter-modal" onClick={e => e.stopPropagation()}>
            <div style={{ position: 'relative', width: '100%', height: isGuest ? 420 : 'auto' }}>
              {/* No renderizar la escena 3D dentro del modal. Usar thumbnail o placeholder. */}
              {isGuest && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', borderRadius: 8 }}>
                  <img src={`/assets/dungeons/${selectedDungeon.id}.jpg`} alt={selectedDungeon.nombre} style={{ maxWidth: '60%', maxHeight: '90%', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }} />
                </div>
              )}

              <div style={{ position: 'relative', zIndex: 2, padding: 16, background: isGuest ? 'rgba(6,10,18,0.6)' : 'var(--modal-bg)', borderRadius: 8 }}>
                <h3>⚔️ Entrar a la Dungeon</h3>
                
                <div className="modal-dungeon">
                  <span className="modal-icon">
                    {selectedDungeon.dificultad === 'easy' && '🏕️'}
                    {selectedDungeon.dificultad === 'normal' && '🏰'}
                    {selectedDungeon.dificultad === 'hard' && '🗼'}
                    {selectedDungeon.dificultad === 'expert' && '🌋'}
                  </span>
                  <div className="modal-info">
                    <span className="modal-name">{selectedDungeon.nombre}</span>
                    <span 
                      className="modal-difficulty"
                      style={{ color: difficultyColors[selectedDungeon.dificultad] }}
                    >
                      {difficultyNames[selectedDungeon.dificultad]} • {selectedDungeon.pisos} pisos
                    </span>
                  </div>
                </div>

                <div className="modal-cost">
                  <span>Costo de energía:</span>
                  <span className="cost-value">
                    ⚡ {selectedDungeon.costoEnergia}
                    <span className="after-energy">
                      (Quedará: {userEnergy - selectedDungeon.costoEnergia})
                    </span>
                  </span>
                </div>

                {/* Requirements visual */}
                <div className="requirements-bar" aria-hidden>
                  <div
                    className="requirements-fill"
                    style={{ width: `${Math.min(100, Math.round((userLevel / selectedDungeon.nivelMinimo) * 100))}%` }}
                  />
                </div>

                <div className="modal-section">
                  <h4>🎁 Recompensas</h4>
                  <div className="rewards-grid-modal">
                    <div className="loot-item-modal">
                      <div className="loot-icon">💰</div>
                      <div>
                        <div>{selectedDungeon.recompensas.valMin}-{selectedDungeon.recompensas.valMax} VAL</div>
                        <div className="muted">Oro estimado</div>
                      </div>
                    </div>
                    <div className="loot-item-modal">
                      <div className="loot-icon">⚡</div>
                      <div>
                        <div>{selectedDungeon.recompensas.evoMin}-{selectedDungeon.recompensas.evoMax} EVO</div>
                        <div className="muted">Exp estimada</div>
                      </div>
                    </div>
                    <div className="loot-item-modal">
                      <div className="loot-icon">🎲</div>
                      <div>
                        <div>{selectedDungeon.recompensas.items.length} items</div>
                        <div className="muted">Posibles drops</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <h4>👹 Enemigos</h4>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedDungeon.enemigos.map((enemy, i) => (
                      <div key={i} className="enemy-chip">{enemy}</div>
                    ))}
                  </div>
                </div>

                {!canEnter(selectedDungeon) && (
                  <div className="modal-warning not-playable">
                    ❌ No cumples los requisitos para entrar: {userLevel < selectedDungeon.nivelMinimo ? `Nivel mínimo ${selectedDungeon.nivelMinimo}` : 'Energía insuficiente'}
                  </div>
                )}

                {(!isGuest && team.length === 0) && (
                  <div className="modal-warning team-warning">
                    ⚠️ ¡No tienes equipo activo! Ve al Dashboard para configurar tu equipo.
                  </div>
                )}

                <div className="modal-warning">
                  ⚠️ Si abandonas la dungeon, perderás todo el progreso y la energía consumida.
                </div>

                <div className="modal-actions">
                  <div className="btn-hint">
                    {(!canEnter(selectedDungeon) && userLevel < selectedDungeon.nivelMinimo) ? `Necesitas nivel ${selectedDungeon.nivelMinimo}` : ''}
                  </div>
                  <button className="cancel-btn" onClick={() => setShowEnterModal(false)}>
                    Cancelar
                  </button>
                  <button
                    className="preview-btn"
                    onClick={() => { setShowEnterModal(false); navigate(`/dungeon/play/${selectedDungeon.id}?preview=true`); }}
                    style={{ marginRight: 8 }}
                  >
                    Ver Previa
                  </button>
                  <button 
                    className="confirm-btn" 
                    onClick={handleEnterDungeon}
                    disabled={(!isGuest && team.length === 0) || !canEnter(selectedDungeon)}
                    title={(!isGuest && team.length === 0) ? 'No tienes equipo activo' : (!canEnter(selectedDungeon) ? 'Requisitos no cumplidos' : '')}
                  >
                    ⚔️ ¡Adelante!
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Battle Screen */}
      {showBattle && battleDungeon && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 900, display: 'flex', alignItems: 'stretch', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <DungeonModelPreview
              sceneId={battleDungeon.id}
              apiBase={'http://localhost:8080/api/scenes'}
              height={'100vh'}
              teamCount={team.length}
              directGlbUrl={battleDungeon.id.startsWith('demo-') ? '/assets/dungeons/Fortaleza/castle_low_poly.glb' : undefined}
              interactive={true}
            />
          </div>
          <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 1200, margin: 'auto', padding: 24 }}>
            <DungeonBattle
              dungeon={battleDungeon}
              onComplete={handleBattleComplete}
              onExit={handleBattleExit}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dungeon;
