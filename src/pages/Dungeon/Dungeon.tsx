import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePlayerStore } from '../../stores/playerStore';
import { useActiveTeam } from '../../stores/teamStore';
import { useDungeonStore, type Dungeon as DungeonType } from '../../stores/dungeonStore';
import { DungeonBattle } from '../../components/dungeons';
import { dungeonService } from '../../services';
import './Dungeon.css';

interface DungeonInfo {
  id: string;
  nombre: string;
  descripcion: string;
  nivelMinimo: number;
  nivelMaximo: number;
  dificultad: 'facil' | 'normal' | 'dificil' | 'extremo';
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


const difficultyColors: Record<string, string> = {
  facil: '#22c55e',
  normal: '#f59e0b',
  dificil: '#ef4444',
  extremo: '#a855f7',
  easy: '#22c55e',
  medium: '#f59e0b',
  hard: '#ef4444',
  legendary: '#a855f7',
};

const difficultyNames: Record<string, string> = {
  facil: 'Fácil',
  normal: 'Normal',
  dificil: 'Difícil',
  extremo: 'Extremo',
  easy: 'Fácil',
  medium: 'Normal',
  hard: 'Difícil',
  legendary: 'Extremo',
};

/** Map backend dungeon to DungeonInfo */
function mapDungeon(raw: any): DungeonInfo {
  return {
    id: raw._id || raw.id,
    nombre: raw.nombre || raw.name || 'Dungeon',
    descripcion: raw.descripcion || raw.description || '',
    nivelMinimo: raw.nivelMinimo || raw.levelRequired || raw.nivel || 1,
    nivelMaximo: raw.nivelMaximo || raw.maxLevel || (raw.nivelMinimo || 1) + 10,
    dificultad: raw.dificultad || raw.difficulty || 'normal',
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
  const { user, loading } = useAuth();
  
  const { level: playerLevel, tickets, energy, maxEnergy, addGold, addExperience, useTickets, useEnergy } = usePlayerStore();
  const team = useActiveTeam();
  const { dungeons: storeDungeons, selectDungeon, selectedDungeon: storeDungeon } = useDungeonStore();
  
  const [selectedDungeon, setSelectedDungeon] = useState<DungeonInfo | null>(null);
  const [showEnterModal, setShowEnterModal] = useState(false);
  const [showBattle, setShowBattle] = useState(false);
  const [battleDungeon, setBattleDungeon] = useState<DungeonType | null>(null);
  const [dungeons, setDungeons] = useState<DungeonInfo[]>([]);
  const [dungeonLoading, setDungeonLoading] = useState(true);

  // Fetch real dungeons from backend
  useEffect(() => {
    if (loading) return;
    let cancelled = false;

    const fetchDungeons = async () => {
      setDungeonLoading(true);
      try {
        const result = await dungeonService.getDungeons();
        if (cancelled) return;

        if (Array.isArray(result) && result.length > 0) {
          setDungeons((result as any[]).map(mapDungeon));
        }
      } catch (err) {
        console.error('[Dungeon] Error fetching dungeons:', err);
      } finally {
        if (!cancelled) setDungeonLoading(false);
      }
    };

    fetchDungeons();
    return () => { cancelled = true; };
  }, [loading]);

  if (loading || dungeonLoading) {
    return (
      <div className="dungeon-loading">
        <div className="loading-spinner" />
        <p>Cargando dungeons...</p>
      </div>
    );
  }

  const userLevel = playerLevel; // Ahora viene del store
  const userEnergy = energy; // Ahora viene del store

  const canEnter = (dungeon: DungeonInfo) => {
    return userLevel >= dungeon.nivelMinimo && userEnergy >= dungeon.costoEnergia;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEnterDungeon = () => {
    if (!selectedDungeon) return;
    
    // Verificar si hay equipo activo
    if (team.length === 0) {
      alert('¡Necesitas un equipo para entrar a la dungeon!');
      return;
    }
    
    // Usar energía
    useEnergy(selectedDungeon.costoEnergia);
    
    // Convertir dungeon local a formato del store para el combate
    const dungeonForBattle: DungeonType = {
      id: selectedDungeon.id,
      name: selectedDungeon.nombre,
      description: selectedDungeon.descripcion,
      difficulty: selectedDungeon.dificultad === 'extremo' ? 'legendary' : 
                  selectedDungeon.dificultad === 'dificil' ? 'hard' :
                  selectedDungeon.dificultad === 'normal' ? 'medium' : 'easy',
      levelRequired: selectedDungeon.nivelMinimo,
      ticketCost: 1,
      energyCost: selectedDungeon.costoEnergia,
      waves: selectedDungeon.pisos,
      bossName: selectedDungeon.boss,
      rewards: {
        gold: { min: selectedDungeon.recompensas.valMin, max: selectedDungeon.recompensas.valMax },
        exp: { min: selectedDungeon.recompensas.evoMin, max: selectedDungeon.recompensas.evoMax },
        items: selectedDungeon.recompensas.items,
      },
      enemies: selectedDungeon.enemigos,
    };
    
    setBattleDungeon(dungeonForBattle);
    setShowEnterModal(false);
    setShowBattle(true);
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
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Volver
        </button>
        <h1>⚔️ Dungeons</h1>
        <div className="energy-display">
          <span className="energy-icon">⚡</span>
          <span className="energy-amount">{userEnergy}</span>
          <span className="energy-max">/{maxEnergy || 100}</span>
        </div>
      </header>

      <div className="dungeon-container">
        {/* Dungeon List */}
        <div className="dungeon-list">
          <div className="list-header">
            <h2>🗺️ Selecciona una Dungeon</h2>
            <span className="player-level">Tu nivel: {userLevel}</span>
          </div>

          <div className="dungeons-grid">
            {dungeons.map((dungeon) => {
              const isLocked = userLevel < dungeon.nivelMinimo;
              const isSelected = selectedDungeon?.id === dungeon.id;

              return (
                <div
                  key={dungeon.id}
                  className={`dungeon-card ${isLocked ? 'locked' : ''} ${isSelected ? 'selected' : ''} ${dungeon.completado ? 'completed' : ''}`}
                  style={{ 
                    '--difficulty-color': difficultyColors[dungeon.dificultad] 
                  } as React.CSSProperties}
                  onClick={() => !isLocked && setSelectedDungeon(dungeon)}
                >
                  {isLocked && <div className="lock-overlay">🔒 Nv.{dungeon.nivelMinimo}</div>}
                  {dungeon.completado && <span className="completed-badge">✓</span>}

                  <div className="dungeon-icon">
                    {dungeon.dificultad === 'facil' && '🏕️'}
                    {dungeon.dificultad === 'normal' && '🏰'}
                    {dungeon.dificultad === 'dificil' && '🗼'}
                    {dungeon.dificultad === 'extremo' && '🌋'}
                  </div>

                  <h3 className="dungeon-name">{dungeon.nombre}</h3>
                  
                  <span 
                    className="dungeon-difficulty"
                    style={{ color: difficultyColors[dungeon.dificultad] }}
                  >
                    {difficultyNames[dungeon.dificultad]}
                  </span>

                  <div className="dungeon-meta">
                    <span className="meta-item">📊 Nv.{dungeon.nivelMinimo}-{dungeon.nivelMaximo}</span>
                    <span className="meta-item">⚡ {dungeon.costoEnergia}</span>
                    <span className="meta-item">🏛️ {dungeon.pisos} pisos</span>
                  </div>

                  {dungeon.mejorTiempo && (
                    <div className="best-time">
                      ⏱️ Mejor: {formatTime(dungeon.mejorTiempo)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Details Panel */}
        <aside className="dungeon-details">
          {selectedDungeon ? (
            <>
              <div 
                className="details-header"
                style={{ borderColor: difficultyColors[selectedDungeon.dificultad] }}
              >
                <div className="details-icon">
                  {selectedDungeon.dificultad === 'facil' && '🏕️'}
                  {selectedDungeon.dificultad === 'normal' && '🏰'}
                  {selectedDungeon.dificultad === 'dificil' && '🗼'}
                  {selectedDungeon.dificultad === 'extremo' && '🌋'}
                </div>
                <div className="details-title">
                  <h3>{selectedDungeon.nombre}</h3>
                  <span 
                    className="details-difficulty"
                    style={{ color: difficultyColors[selectedDungeon.dificultad] }}
                  >
                    {difficultyNames[selectedDungeon.dificultad]}
                  </span>
                </div>
              </div>

              <p className="details-description">{selectedDungeon.descripcion}</p>

              <div className="details-section">
                <h4>📊 Requisitos</h4>
                <div className="requirements">
                  <div className={`req-item ${userLevel >= selectedDungeon.nivelMinimo ? 'met' : 'unmet'}`}>
                    <span>Nivel mínimo</span>
                    <span>{selectedDungeon.nivelMinimo}</span>
                  </div>
                  <div className={`req-item ${userEnergy >= selectedDungeon.costoEnergia ? 'met' : 'unmet'}`}>
                    <span>Energía</span>
                    <span>{selectedDungeon.costoEnergia}</span>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h4>👹 Enemigos</h4>
                <div className="enemies-list">
                  {selectedDungeon.enemigos.map((enemy, i) => (
                    <span key={i} className="enemy-tag">{enemy}</span>
                  ))}
                </div>
                <div className="boss-info">
                  <span className="boss-label">👑 BOSS:</span>
                  <span className="boss-name">{selectedDungeon.boss}</span>
                </div>
              </div>

              <div className="details-section">
                <h4>🎁 Recompensas</h4>
                <div className="rewards-grid">
                  <div className="reward-item">
                    <span className="reward-icon">💰</span>
                    <span className="reward-value">
                      {selectedDungeon.recompensas.valMin}-{selectedDungeon.recompensas.valMax}
                    </span>
                    <span className="reward-label">VAL</span>
                  </div>
                  <div className="reward-item">
                    <span className="reward-icon">⚡</span>
                    <span className="reward-value">
                      {selectedDungeon.recompensas.evoMin}-{selectedDungeon.recompensas.evoMax}
                    </span>
                    <span className="reward-label">EVO</span>
                  </div>
                </div>
                <div className="loot-items">
                  {selectedDungeon.recompensas.items.map((item, i) => (
                    <span key={i} className="loot-tag">{item}</span>
                  ))}
                </div>
              </div>

              <button
                className={`enter-btn ${!canEnter(selectedDungeon) ? 'disabled' : ''}`}
                onClick={() => setShowEnterModal(true)}
                disabled={!canEnter(selectedDungeon)}
              >
                {canEnter(selectedDungeon) 
                  ? '⚔️ Entrar a la Dungeon' 
                  : userLevel < selectedDungeon.nivelMinimo 
                    ? `❌ Requiere Nv.${selectedDungeon.nivelMinimo}`
                    : '❌ Energía Insuficiente'}
              </button>
            </>
          ) : (
            <div className="no-selection">
              <span className="empty-icon">🗺️</span>
              <p>Selecciona una dungeon para ver detalles</p>
            </div>
          )}
        </aside>
      </div>

      {/* Enter Modal */}
      {showEnterModal && selectedDungeon && (
        <div className="modal-overlay" onClick={() => setShowEnterModal(false)}>
          <div className="enter-modal" onClick={e => e.stopPropagation()}>
            <h3>⚔️ Entrar a la Dungeon</h3>
            
            <div className="modal-dungeon">
              <span className="modal-icon">
                {selectedDungeon.dificultad === 'facil' && '🏕️'}
                {selectedDungeon.dificultad === 'normal' && '🏰'}
                {selectedDungeon.dificultad === 'dificil' && '🗼'}
                {selectedDungeon.dificultad === 'extremo' && '🌋'}
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

            {team.length === 0 && (
              <div className="modal-warning team-warning">
                ⚠️ ¡No tienes equipo activo! Ve al Dashboard para configurar tu equipo.
              </div>
            )}

            <div className="modal-warning">
              ⚠️ Si abandonas la dungeon, perderás todo el progreso y la energía consumida.
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowEnterModal(false)}>
                Cancelar
              </button>
              <button 
                className="confirm-btn" 
                onClick={handleEnterDungeon}
                disabled={team.length === 0}
              >
                ⚔️ ¡Adelante!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Battle Screen */}
      {showBattle && battleDungeon && (
        <DungeonBattle
          dungeon={battleDungeon}
          onComplete={handleBattleComplete}
          onExit={handleBattleExit}
        />
      )}
    </div>
  );
};

export default Dungeon;
