import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePlayerStore } from '../../stores/playerStore';
import { useActiveTeam } from '../../stores/teamStore';
import { useDungeonStore, type Dungeon as DungeonType } from '../../stores/dungeonStore';
import { DungeonBattle } from '../../components/dungeons';
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

const dungeons: DungeonInfo[] = [
  {
    id: 'd1',
    nombre: 'Caverna del Inicio',
    descripcion: 'Una cueva oscura habitada por slimes y murciélagos. Perfecta para principiantes.',
    nivelMinimo: 1,
    nivelMaximo: 5,
    dificultad: 'facil',
    costoEnergia: 5,
    recompensas: {
      valMin: 50,
      valMax: 150,
      evoMin: 10,
      evoMax: 30,
      items: ['Poción de Vida (S)', 'Hierro', 'Cuero'],
    },
    enemigos: ['Slime', 'Murciélago', 'Rata Gigante'],
    boss: 'Rey Slime',
    pisos: 3,
    completado: true,
    mejorTiempo: 245,
  },
  {
    id: 'd2',
    nombre: 'Bosque Maldito',
    descripcion: 'Un bosque corrompido por magia oscura. Los árboles cobran vida.',
    nivelMinimo: 5,
    nivelMaximo: 10,
    dificultad: 'facil',
    costoEnergia: 8,
    recompensas: {
      valMin: 100,
      valMax: 300,
      evoMin: 25,
      evoMax: 60,
      items: ['Poción de Vida (M)', 'Madera Encantada', 'Esencia Oscura'],
    },
    enemigos: ['Treant', 'Lobo Sombrío', 'Duende Corrupto'],
    boss: 'Árbol Ancestral Corrupto',
    pisos: 5,
    completado: true,
    mejorTiempo: 380,
  },
  {
    id: 'd3',
    nombre: 'Minas Abandonadas',
    descripcion: 'Antiguas minas de enanos infestadas de golems y goblins mineros.',
    nivelMinimo: 10,
    nivelMaximo: 15,
    dificultad: 'normal',
    costoEnergia: 12,
    recompensas: {
      valMin: 200,
      valMax: 500,
      evoMin: 50,
      evoMax: 100,
      items: ['Piedra de Mejora', 'Mineral Raro', 'Gema de Poder'],
    },
    enemigos: ['Golem de Piedra', 'Goblin Minero', 'Espíritu de las Minas'],
    boss: 'Golem de Mithril',
    pisos: 7,
  },
  {
    id: 'd4',
    nombre: 'Torre del Hechicero',
    descripcion: 'La torre de un mago loco llena de experimentos mágicos fallidos.',
    nivelMinimo: 15,
    nivelMaximo: 20,
    dificultad: 'normal',
    costoEnergia: 15,
    recompensas: {
      valMin: 350,
      valMax: 800,
      evoMin: 80,
      evoMax: 150,
      items: ['Libro de Hechizos', 'Cristal Arcano', 'Túnica Encantada'],
    },
    enemigos: ['Quimera', 'Elemental', 'Homúnculo'],
    boss: 'El Hechicero Loco',
    pisos: 10,
  },
  {
    id: 'd5',
    nombre: 'Cripta del Rey Caído',
    descripcion: 'La tumba de un rey antiguo, protegida por sus leales sirvientes no-muertos.',
    nivelMinimo: 20,
    nivelMaximo: 25,
    dificultad: 'dificil',
    costoEnergia: 20,
    recompensas: {
      valMin: 500,
      valMax: 1200,
      evoMin: 120,
      evoMax: 250,
      items: ['Corona Maldita', 'Hueso Ancestral', 'Armadura Real'],
    },
    enemigos: ['Esqueleto Guerrero', 'Espectro', 'Liche Menor'],
    boss: 'Rey No-Muerto',
    pisos: 12,
  },
  {
    id: 'd6',
    nombre: 'Volcán Infernal',
    descripcion: 'Un volcán activo habitado por demonios de fuego y dragones menores.',
    nivelMinimo: 25,
    nivelMaximo: 30,
    dificultad: 'dificil',
    costoEnergia: 25,
    recompensas: {
      valMin: 800,
      valMax: 2000,
      evoMin: 200,
      evoMax: 400,
      items: ['Escama de Dragón', 'Corazón de Fuego', 'Arma Volcánica'],
    },
    enemigos: ['Diablo de Fuego', 'Dragón Menor', 'Salamandra'],
    boss: 'Dragón de Magma',
    pisos: 15,
  },
  {
    id: 'd7',
    nombre: 'Abismo Eterno',
    descripcion: 'El lugar más peligroso conocido. Solo los más fuertes sobreviven.',
    nivelMinimo: 30,
    nivelMaximo: 99,
    dificultad: 'extremo',
    costoEnergia: 35,
    recompensas: {
      valMin: 1500,
      valMax: 5000,
      evoMin: 400,
      evoMax: 1000,
      items: ['Item Legendario', 'Esencia Divina', 'Fragmento del Abismo'],
    },
    enemigos: ['Demonio Mayor', 'Ángel Caído', 'Horror Cósmico'],
    boss: 'Señor del Abismo',
    pisos: 20,
  },
];

const difficultyColors = {
  facil: '#22c55e',
  normal: '#f59e0b',
  dificil: '#ef4444',
  extremo: '#a855f7',
};

const difficultyNames = {
  facil: 'Fácil',
  normal: 'Normal',
  dificil: 'Difícil',
  extremo: 'Extremo',
};

const Dungeon: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  // Conectamos con los stores
  const { level: playerLevel, tickets, energy, maxEnergy, addGold, addExperience, useTickets, useEnergy } = usePlayerStore();
  const team = useActiveTeam();
  const { dungeons: storeDungeons, selectDungeon, selectedDungeon: storeDungeon } = useDungeonStore();
  
  const [selectedDungeon, setSelectedDungeon] = useState<DungeonInfo | null>(null);
  const [showEnterModal, setShowEnterModal] = useState(false);
  const [showBattle, setShowBattle] = useState(false);
  const [battleDungeon, setBattleDungeon] = useState<DungeonType | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
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
          <span className="energy-max">/{user?.energiaMaxima || 100}</span>
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
