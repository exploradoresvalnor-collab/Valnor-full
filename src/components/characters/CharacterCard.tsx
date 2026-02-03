/**
 * CharacterCard - Tarjeta de personaje con estados visuales
 * Muestra HP, estado (saludable/dañado/herido/muerto) y acciones
 */

import { useState } from 'react';
import { 
  HeartIcon, 
  SwordIcon, 
  ShieldIcon,
  WarriorIcon,
  MageIcon,
  ArcherIcon,
  PaladinIcon,
  UserIcon,
  PotionIcon,
} from '../icons/GameIcons';
import './CharacterCard.css';

// Tipos
export interface CharacterData {
  id: string;
  name: string;
  level: number;
  class: 'warrior' | 'mage' | 'archer' | 'paladin' | 'healer' | 'rogue';
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  rank?: string;
  currentHealth: number;
  maxHealth: number;
  state: 'healthy' | 'damaged' | 'injured' | 'dead';
  stats?: {
    attack: number;
    defense: number;
    speed: number;
  };
  equipment?: {
    weapon?: string;
    armor?: string;
    helmet?: string;
    gloves?: string;
    boots?: string;
  };
  isSelected?: boolean;
  isLeader?: boolean;
}

interface CharacterCardProps {
  character: CharacterData;
  onSelect?: (character: CharacterData) => void;
  onEquip?: (character: CharacterData) => void;
  onHeal?: (character: CharacterData) => void;
  onRevive?: (character: CharacterData) => void;
  onDetails?: (character: CharacterData) => void;
  compact?: boolean;
  showActions?: boolean;
}

// Colores por rareza
const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

// Estados con colores e iconos
const STATE_CONFIG = {
  healthy: { color: '#22c55e', label: 'Saludable', icon: '✓' },
  damaged: { color: '#eab308', label: 'Dañado', icon: '!' },
  injured: { color: '#f97316', label: 'Herido', icon: '⚠' },
  dead: { color: '#ef4444', label: 'Muerto', icon: '✗' },
};

export function CharacterCard({
  character,
  onSelect,
  onEquip,
  onHeal,
  onRevive,
  onDetails,
  compact = false,
  showActions = true,
}: CharacterCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Calcular estado basado en HP
  const getHealthState = (): 'healthy' | 'damaged' | 'injured' | 'dead' => {
    if (character.state === 'dead') return 'dead';
    const hpPercent = (character.currentHealth / character.maxHealth) * 100;
    if (hpPercent >= 75) return 'healthy';
    if (hpPercent >= 40) return 'damaged';
    return 'injured';
  };
  
  const healthState = getHealthState();
  const stateConfig = STATE_CONFIG[healthState];
  const hpPercent = Math.round((character.currentHealth / character.maxHealth) * 100);
  const rarityColor = RARITY_COLORS[character.rarity || 'common'];
  
  // Icono de clase
  const getClassIcon = () => {
    const size = compact ? 28 : 40;
    switch (character.class) {
      case 'warrior': return <WarriorIcon size={size} />;
      case 'mage': return <MageIcon size={size} />;
      case 'archer': return <ArcherIcon size={size} />;
      case 'paladin': return <PaladinIcon size={size} />;
      default: return <UserIcon size={size} />;
    }
  };
  
  // Color de la barra de HP según porcentaje
  const getHPBarColor = () => {
    if (hpPercent >= 75) return '#22c55e';
    if (hpPercent >= 50) return '#84cc16';
    if (hpPercent >= 25) return '#eab308';
    return '#ef4444';
  };
  
  const handleClick = () => {
    if (onSelect) onSelect(character);
  };
  
  const handleEquip = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEquip) onEquip(character);
  };
  
  const handleHeal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onHeal) onHeal(character);
  };
  
  const handleRevive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRevive) onRevive(character);
  };
  
  const handleDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDetails) onDetails(character);
  };
  
  return (
    <div 
      className={`character-card ${compact ? 'compact' : ''} ${character.isSelected ? 'selected' : ''} ${healthState}`}
      style={{ '--rarity-color': rarityColor } as React.CSSProperties}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Badge de líder */}
      {character.isLeader && (
        <div className="leader-badge">★ LÍDER</div>
      )}
      
      {/* Avatar */}
      <div className="card-avatar">
        <div className="avatar-frame">
          {getClassIcon()}
        </div>
        <span className="level-badge">Nv.{character.level}</span>
        {character.rank && (
          <span className="rank-badge">{character.rank}</span>
        )}
      </div>
      
      {/* Info */}
      <div className="card-info">
        <h4 className="char-name">{character.name}</h4>
        <span className="char-class">{character.class}</span>
        
        {/* Barra de HP */}
        <div className="hp-section">
          <div className="hp-header">
            <HeartIcon size={12} color={getHPBarColor()} />
            <span className="hp-text">{character.currentHealth}/{character.maxHealth}</span>
            <span className="hp-percent" style={{ color: stateConfig.color }}>
              {hpPercent}%
            </span>
          </div>
          <div className="hp-bar-track">
            <div 
              className="hp-bar-fill" 
              style={{ 
                width: `${hpPercent}%`,
                backgroundColor: getHPBarColor(),
              }}
            />
          </div>
        </div>
        
        {/* Estado */}
        <div className="state-badge" style={{ color: stateConfig.color, borderColor: stateConfig.color }}>
          <span>{stateConfig.icon}</span>
          <span>{stateConfig.label}</span>
        </div>
        
        {/* Stats (si no es compacto) */}
        {!compact && character.stats && (
          <div className="mini-stats">
            <div className="mini-stat">
              <SwordIcon size={12} color="#e74c3c" />
              <span>{character.stats.attack}</span>
            </div>
            <div className="mini-stat">
              <ShieldIcon size={12} color="#3498db" />
              <span>{character.stats.defense}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Acciones */}
      {showActions && (
        <div className={`card-actions ${isHovered ? 'visible' : ''}`}>
          {healthState === 'dead' ? (
            <button className="action-btn revive" onClick={handleRevive} title="Revivir (50 VAL)">
              <HeartIcon size={14} /> Revivir
            </button>
          ) : healthState !== 'healthy' ? (
            <button className="action-btn heal" onClick={handleHeal} title="Curar (2 VAL / 10 HP)">
              <PotionIcon size={14} /> Curar
            </button>
          ) : null}
          
          <button className="action-btn equip" onClick={handleEquip} title="Equipar items">
            <SwordIcon size={14} /> Equipar
          </button>
          
          <button className="action-btn details" onClick={handleDetails} title="Ver detalles">
            ⋯
          </button>
        </div>
      )}
    </div>
  );
}

export default CharacterCard;
