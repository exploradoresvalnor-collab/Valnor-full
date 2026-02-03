/**
 * DungeonList - Lista de mazmorras disponibles
 * 
 * Muestra todas las mazmorras con:
 * - Requisitos (nivel, boletos)
 * - Recompensas esperadas
 * - Dificultad visual
 * - Estado de bloqueo según nivel del jugador
 * 
 * Conectado con:
 * - dungeonStore: lista de mazmorras
 * - playerStore: nivel y boletos del jugador
 * - teamStore: equipo seleccionado
 */

import { useEffect, useState } from 'react';
import { useDungeonStore, type Dungeon } from '../../stores/dungeonStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useActiveTeam } from '../../stores/teamStore';
import {
  SwordIcon,
  LockIcon,
  GoldIcon,
  ExpIcon,
  SkullIcon,
  TrophyIcon,
  UsersIcon,
  EnergyIcon,
} from '../icons/GameIcons';
import './DungeonList.css';

// Colores por dificultad
const DIFFICULTY_CONFIG = {
  easy: { color: '#2ecc71', label: 'Fácil', stars: 1 },
  normal: { color: '#3498db', label: 'Normal', stars: 2 },
  hard: { color: '#f39c12', label: 'Difícil', stars: 3 },
  expert: { color: '#e74c3c', label: 'Experto', stars: 4 },
  legendary: { color: '#9b59b6', label: 'Legendario', stars: 5 },
};

interface DungeonCardProps {
  dungeon: Dungeon;
  playerLevel: number;
  tickets: number;
  teamSize: number;
  onSelect: (dungeon: Dungeon) => void;
}

function DungeonCard({ dungeon, playerLevel, tickets, teamSize, onSelect }: DungeonCardProps) {
  const canEnter = useDungeonStore((s) => s.canEnterDungeon);
  const { canEnter: isAccessible, reason } = canEnter(dungeon.id, playerLevel, tickets);
  
  const diffConfig = DIFFICULTY_CONFIG[dungeon.difficulty];
  const isLocked = playerLevel < dungeon.requiredLevel;
  const noTeam = teamSize === 0;
  
  const handleClick = () => {
    if (isAccessible && !noTeam) {
      onSelect(dungeon);
    }
  };
  
  return (
    <div 
      className={`dungeon-card ${isLocked ? 'locked' : ''} ${!isAccessible ? 'disabled' : ''}`}
      style={{ '--difficulty-color': diffConfig.color } as React.CSSProperties}
      onClick={handleClick}
    >
      {/* Indicador de bloqueo */}
      {isLocked && (
        <div className="dungeon-locked-overlay">
          <LockIcon size={32} />
          <span>Nivel {dungeon.requiredLevel}</span>
        </div>
      )}
      
      {/* Header con dificultad */}
      <div className="dungeon-header">
        <div className="dungeon-difficulty">
          <span className="difficulty-label">{diffConfig.label}</span>
          <div className="difficulty-stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <span 
                key={i} 
                className={`star ${i < diffConfig.stars ? 'filled' : ''}`}
              >
                ★
              </span>
            ))}
          </div>
        </div>
        <div className="dungeon-waves">
          <SkullIcon size={14} />
          <span>{dungeon.waves} oleadas</span>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="dungeon-content">
        <h3 className="dungeon-name">{dungeon.name}</h3>
        <p className="dungeon-description">{dungeon.description}</p>
        
        {dungeon.bossName && (
          <div className="dungeon-boss">
            <TrophyIcon size={14} color="#ffd700" />
            <span>Jefe: {dungeon.bossName}</span>
          </div>
        )}
      </div>
      
      {/* Requisitos */}
      <div className="dungeon-requirements">
        <div className={`requirement ${playerLevel >= dungeon.requiredLevel ? 'met' : 'unmet'}`}>
          <ExpIcon size={14} />
          <span>Nv. {dungeon.requiredLevel}</span>
        </div>
        <div className={`requirement ${tickets >= dungeon.ticketCost ? 'met' : 'unmet'}`}>
          <span className="ticket-icon">🎫</span>
          <span>{dungeon.ticketCost} Boleto{dungeon.ticketCost > 1 ? 's' : ''}</span>
        </div>
        <div className="requirement time">
          <EnergyIcon size={14} />
          <span>{dungeon.estimatedTime}</span>
        </div>
      </div>
      
      {/* Recompensas */}
      <div className="dungeon-rewards">
        <span className="rewards-label">Recompensas:</span>
        <div className="rewards-list">
          <div className="reward">
            <GoldIcon size={14} />
            <span>{dungeon.rewards.gold.min}-{dungeon.rewards.gold.max}</span>
          </div>
          <div className="reward">
            <ExpIcon size={14} />
            <span>{dungeon.rewards.exp.min}-{dungeon.rewards.exp.max} EXP</span>
          </div>
          {dungeon.rewards.rareDropChance && (
            <div className="reward rare">
              <span>✨ {Math.round(dungeon.rewards.rareDropChance * 100)}%</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Botón de acción */}
      <div className="dungeon-action">
        {noTeam ? (
          <button className="enter-btn disabled" disabled>
            <UsersIcon size={16} />
            Selecciona Equipo
          </button>
        ) : !isAccessible ? (
          <button className="enter-btn disabled" disabled>
            <LockIcon size={16} />
            {reason}
          </button>
        ) : (
          <button className="enter-btn">
            <SwordIcon size={16} />
            Entrar a la Mazmorra
          </button>
        )}
      </div>
    </div>
  );
}

interface DungeonListProps {
  onSelectDungeon?: (dungeon: Dungeon) => void;
}

export function DungeonList({ onSelectDungeon }: DungeonListProps) {
  const dungeons = useDungeonStore((s) => s.dungeons);
  const loadDungeons = useDungeonStore((s) => s.loadDungeons);
  const selectDungeon = useDungeonStore((s) => s.selectDungeon);
  const isLoading = useDungeonStore((s) => s.isLoading);
  
  const playerLevel = usePlayerStore((s) => s.level);
  const tickets = usePlayerStore((s) => s.tickets);
  
  const team = useActiveTeam();
  const teamSize = team.length;
  
  const [filter, setFilter] = useState<'all' | 'available' | 'locked'>('all');
  
  useEffect(() => {
    loadDungeons();
  }, [loadDungeons]);
  
  const handleSelectDungeon = (dungeon: Dungeon) => {
    selectDungeon(dungeon.id);
    onSelectDungeon?.(dungeon);
  };
  
  // Filtrar mazmorras
  const filteredDungeons = dungeons.filter(d => {
    if (filter === 'available') return playerLevel >= d.requiredLevel;
    if (filter === 'locked') return playerLevel < d.requiredLevel;
    return true;
  });
  
  if (isLoading) {
    return (
      <div className="dungeon-list-loading">
        <div className="loading-spinner"></div>
        <span>Cargando mazmorras...</span>
      </div>
    );
  }
  
  return (
    <div className="dungeon-list">
      {/* Header con filtros */}
      <div className="dungeon-list-header">
        <h2>
          <SwordIcon size={24} color="#ffd700" />
          Mazmorras Disponibles
        </h2>
        
        <div className="dungeon-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todas ({dungeons.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'available' ? 'active' : ''}`}
            onClick={() => setFilter('available')}
          >
            Disponibles ({dungeons.filter(d => playerLevel >= d.requiredLevel).length})
          </button>
          <button 
            className={`filter-btn ${filter === 'locked' ? 'active' : ''}`}
            onClick={() => setFilter('locked')}
          >
            Bloqueadas ({dungeons.filter(d => playerLevel < d.requiredLevel).length})
          </button>
        </div>
      </div>
      
      {/* Estado del equipo */}
      {teamSize === 0 && (
        <div className="team-warning">
          <UsersIcon size={18} />
          <span>Debes seleccionar al menos 1 personaje para tu equipo antes de entrar a una mazmorra</span>
        </div>
      )}
      
      {/* Grid de mazmorras */}
      <div className="dungeon-grid">
        {filteredDungeons.map(dungeon => (
          <DungeonCard
            key={dungeon.id}
            dungeon={dungeon}
            playerLevel={playerLevel}
            tickets={tickets}
            teamSize={teamSize}
            onSelect={handleSelectDungeon}
          />
        ))}
      </div>
      
      {filteredDungeons.length === 0 && (
        <div className="no-dungeons">
          <p>No hay mazmorras que mostrar con este filtro</p>
        </div>
      )}
    </div>
  );
}

export default DungeonList;
