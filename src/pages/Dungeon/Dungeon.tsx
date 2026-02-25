import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePlayerStore } from '../../stores/playerStore';
import { useActiveTeam } from '../../stores/teamStore';
import type { Dungeon as DungeonType } from '../../stores/dungeonStore';
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



const ENGINE_DUNGEONS: DungeonInfo[] = [
  { id: 'engine-fortaleza', nombre: '🏰 Fortaleza Olvidada', descripcion: 'Explora las ruinas de la fortaleza dominada por el Caballero Oscuro.', nivelMinimo: 1, nivelMaximo: 99, dificultad: 'hard', costoEnergia: 0, recompensas: { valMin: 100, valMax: 500, evoMin: 50, evoMax: 200, items: [] }, enemigos: ['Caballero Oscuro'], boss: 'None', pisos: 1, completado: false },
];

const Dungeon: React.FC = () => {
  const navigate = useNavigate();
  const { loading } = useAuth();

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

  // Fetch dungeons (real or demo)
  useEffect(() => {
    let cancelled = false;

    const fetchDungeons = async () => {
      setDungeonLoading(true);
      try {
        console.log('[Dungeon] Loading real dungeons from backend');
        try {
          const result = await dungeonService.getDungeons();
          console.log('[Dungeon] Raw result from backend:', result);
          if (cancelled) return;

          if (Array.isArray(result) && result.length > 0) {
            const mappedDungeons = (result as any[]).map(mapDungeon);
            console.log('[Dungeon] Mapped dungeons:', mappedDungeons);
            setDungeonsList([...mappedDungeons, ...ENGINE_DUNGEONS]);
          } else {
            console.warn('[Dungeon] No dungeons received from backend or empty array');
            setDungeonsList([...ENGINE_DUNGEONS]);
          }
        } catch (serviceError) {
          console.error('[Dungeon] Error calling dungeonService.getDungeons():', serviceError);
          // Fallback to empty array but keep engine scenes
          setDungeonsList([...ENGINE_DUNGEONS]);
        }
      } catch (err) {
        console.error('[Dungeon] Error fetching dungeons:', err);
      } finally {
        if (!cancelled) setDungeonLoading(false);
      }
    };

    fetchDungeons();
    return () => { cancelled = true; };
  }, []);

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

  const userLevel = playerLevel;
  const userEnergy = energy;

  const canEnter = (dungeon: DungeonInfo) => {
    return userLevel >= dungeon.nivelMinimo && userEnergy >= dungeon.costoEnergia;
  };

  const handleEnterDungeon = () => {
    if (!selectedDungeon) return;

    // Verificar si hay equipo activo (demo o real)
    const hasTeam = team.length > 0;
    if (!hasTeam) {
      alert('¡Necesitas un equipo para entrar a la dungeon!');
      return;
    }

    // Usar energía
    useEnergy(selectedDungeon.costoEnergia);

    // Navegar a la pantalla de juego (carga la escena 3D). El combate NO se ejecuta automáticamente; el motor
    // de juego debe gestionar el inicio del combate cuando el jugador alcance al enemigo.
    navigate(`/dungeon/play/${selectedDungeon.id}`, { state: { dungeonName: selectedDungeon.nombre } });
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
            <h2>Dominios Disponibles</h2>
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
                    src={dungeon.id === 'engine-fortaleza' ? '/assets/dungeons/engine-fortaleza.png' : `/assets/dungeons/${dungeon.id}.jpg`}
                    alt={dungeon.nombre}
                    className="dungeon-image"
                  />
                  <div className="card-overlay">
                    <div className="overlay-title">{dungeon.nombre}</div>
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
                    {dungeon.enemigos.slice(0, 4).map((enemy, i) => (
                      <span key={i} className="enemy-chip">{enemy}</span>
                    ))}
                  </div>
                  <div className="card-actions">
                    <button
                      className="dungeon-select-button"
                      onClick={(e) => { e.stopPropagation(); setSelectedDungeon(dungeon); setShowEnterModal(true); }}
                    >
                      Explorar
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
      {
        showEnterModal && selectedDungeon && (
          <div className="modal-overlay" onClick={() => setShowEnterModal(false)}>
            <div className="enter-modal" onClick={e => e.stopPropagation()}>
              <div style={{ position: 'relative', width: '100%', height: 'auto' }}>
                {/* Visual Preview Banner */}
                <div style={{
                  width: '100%',
                  height: '220px',
                  backgroundImage: `url(${selectedDungeon.id === 'engine-fortaleza' ? '/assets/dungeons/engine-fortaleza.png' : `/assets/dungeons/${selectedDungeon.id}.jpg`})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                  boxShadow: 'inset 0 -80px 60px -10px var(--modal-bg)'
                }} />

                <div style={{ position: 'relative', zIndex: 2, padding: '0 16px 16px 16px', background: 'var(--modal-bg)', borderRadius: '0 0 8px 8px', borderTop: 'none', marginTop: '-30px' }}>
                  <h3 style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>⚔️ Entrar a la Dungeon</h3>

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

                  {(team.length === 0) && (
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
                      disabled={team.length === 0 || !canEnter(selectedDungeon)}
                      title={team.length === 0 ? 'No tienes equipo activo' : (!canEnter(selectedDungeon) ? 'Requisitos no cumplidos' : '')}
                    >
                      ⚔️ ¡Adelante!
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Battle Screen */}
      {
        showBattle && battleDungeon && (
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
        )
      }
    </div >
  );
};

export default Dungeon;
