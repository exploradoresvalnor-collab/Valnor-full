/**
 * TeamBuilder - Componente para seleccionar equipo de 1-4 personajes
 */

import React, { useCallback } from 'react';
import { 
  UsersIcon, 
  SwordIcon,
  CloseIcon,
  PlusIcon,
  WarriorIcon,
  MageIcon,
  ArcherIcon,
  PaladinIcon,
  UserIcon,
  HeartIcon,
} from '../icons/GameIcons';
import type { CharacterData } from './CharacterCard';
import './TeamBuilder.css';

interface TeamBuilderProps {
  availableCharacters: CharacterData[];
  selectedTeam: CharacterData[];
  maxTeamSize?: number;
  minTeamSize?: number;
  onTeamChange: (team: CharacterData[]) => void;
  onConfirm?: (team: CharacterData[]) => void;
  onSetLeader?: (characterId: string) => void;
  leaderId?: string | null;
  mode?: 'rpg' | 'survival'; // survival solo permite 1
}

const CLASS_ICONS: Record<string, (size: number) => React.ReactNode> = {
  warrior: (size) => <WarriorIcon size={size} />,
  mage: (size) => <MageIcon size={size} />,
  archer: (size) => <ArcherIcon size={size} />,
  paladin: (size) => <PaladinIcon size={size} />,
  healer: (size) => <UserIcon size={size} />,
  rogue: (size) => <UserIcon size={size} />,
};

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

export function TeamBuilder({
  availableCharacters,
  selectedTeam,
  maxTeamSize = 4,
  minTeamSize = 1,
  onTeamChange,
  onConfirm,
  onSetLeader,
  leaderId,
  mode = 'rpg',
}: TeamBuilderProps) {
  
  // En survival solo se permite 1 personaje
  const effectiveMaxSize = mode === 'survival' ? 1 : maxTeamSize;
  
  // Calcular poder total del equipo
  const teamPower = selectedTeam.reduce((total, char) => {
    if (char.stats) {
      return total + char.stats.attack + char.stats.defense + char.stats.speed;
    }
    return total + (char.level * 20);
  }, 0);
  
  // Personajes disponibles (no seleccionados y saludables)
  const availableToSelect = availableCharacters.filter(char => 
    !selectedTeam.some(t => t.id === char.id) && char.state !== 'dead'
  );
  
  const getClassIcon = (cls: string, size: number = 24) => {
    return CLASS_ICONS[cls]?.(size) || <UserIcon size={size} />;
  };
  
  const handleAddCharacter = useCallback((char: CharacterData) => {
    if (selectedTeam.length >= effectiveMaxSize) return;
    if (char.state === 'dead') return;
    
    const newTeam = [...selectedTeam, char];
    onTeamChange(newTeam);
    
    // Si es el primero, hacerlo líder
    if (newTeam.length === 1 && onSetLeader) {
      onSetLeader(char.id);
    }
  }, [selectedTeam, effectiveMaxSize, onTeamChange, onSetLeader]);
  
  const handleRemoveCharacter = useCallback((charId: string) => {
    const newTeam = selectedTeam.filter(c => c.id !== charId);
    onTeamChange(newTeam);
    
    // Si quitamos al líder, el primero es el nuevo líder
    if (leaderId === charId && newTeam.length > 0 && onSetLeader) {
      onSetLeader(newTeam[0].id);
    }
  }, [selectedTeam, leaderId, onTeamChange, onSetLeader]);
  
  const handleSetLeader = useCallback((charId: string) => {
    if (onSetLeader) {
      onSetLeader(charId);
    }
  }, [onSetLeader]);
  
  const handleConfirm = () => {
    if (selectedTeam.length >= minTeamSize && onConfirm) {
      onConfirm(selectedTeam);
    }
  };
  
  const canConfirm = selectedTeam.length >= minTeamSize && selectedTeam.length <= effectiveMaxSize;
  
  return (
    <div className="team-builder">
      {/* Header */}
      <div className="builder-header">
        <h3>
          <UsersIcon size={20} color="#ffd700" />
          {mode === 'survival' ? 'Seleccionar Héroe' : 'Formar Equipo'}
        </h3>
        <div className="team-stats">
          <span className="team-count">
            {selectedTeam.length}/{effectiveMaxSize}
          </span>
          {mode === 'rpg' && (
            <span className="team-power">
              <SwordIcon size={14} color="#e74c3c" />
              {teamPower}
            </span>
          )}
        </div>
      </div>
      
      {/* Slots del equipo */}
      <div className="team-slots-container">
        <div className="slots-label">
          {mode === 'survival' ? 'Tu Héroe' : 'Tu Equipo'}
        </div>
        <div className={`team-slots ${mode}`}>
          {Array.from({ length: effectiveMaxSize }).map((_, index) => {
            const char = selectedTeam[index];
            const isLeader = char?.id === leaderId;
            
            return (
              <div 
                key={index}
                className={`team-slot ${char ? 'filled' : 'empty'} ${isLeader ? 'leader' : ''}`}
                style={char ? { '--rarity-color': RARITY_COLORS[char.rarity || 'common'] } as React.CSSProperties : undefined}
              >
                {char ? (
                  <>
                    {isLeader && <div className="leader-crown">★</div>}
                    <div className="slot-avatar">
                      {getClassIcon(char.class, 32)}
                    </div>
                    <div className="slot-info">
                      <span className="slot-name">{char.name}</span>
                      <span className="slot-level">Nv.{char.level}</span>
                    </div>
                    <div className="slot-hp">
                      <HeartIcon size={10} color="#e74c3c" />
                      <span>{Math.round((char.currentHealth / char.maxHealth) * 100)}%</span>
                    </div>
                    <div className="slot-actions">
                      {!isLeader && mode === 'rpg' && (
                        <button 
                          className="set-leader-btn" 
                          onClick={() => handleSetLeader(char.id)}
                          title="Hacer líder"
                        >
                          ★
                        </button>
                      )}
                      <button 
                        className="remove-btn" 
                        onClick={() => handleRemoveCharacter(char.id)}
                        title="Quitar del equipo"
                      >
                        <CloseIcon size={12} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="empty-slot-content">
                    <PlusIcon size={24} />
                    <span>Vacío</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Lista de personajes disponibles */}
      <div className="available-characters">
        <div className="available-header">
          <span>Personajes Disponibles</span>
          <span className="available-count">{availableToSelect.length}</span>
        </div>
        
        {availableToSelect.length === 0 ? (
          <div className="no-characters">
            {selectedTeam.length >= effectiveMaxSize 
              ? 'Equipo completo' 
              : 'No hay más personajes disponibles'}
          </div>
        ) : (
          <div className="characters-grid">
            {availableToSelect.map(char => (
              <div 
                key={char.id}
                className={`available-char ${char.state === 'injured' ? 'injured' : ''}`}
                style={{ '--rarity-color': RARITY_COLORS[char.rarity || 'common'] } as React.CSSProperties}
                onClick={() => handleAddCharacter(char)}
              >
                <div className="char-avatar">
                  {getClassIcon(char.class, 28)}
                </div>
                <div className="char-details">
                  <span className="char-name">{char.name}</span>
                  <div className="char-meta">
                    <span className="char-level">Nv.{char.level}</span>
                    <span className="char-hp">
                      <HeartIcon size={10} />
                      {Math.round((char.currentHealth / char.maxHealth) * 100)}%
                    </span>
                  </div>
                </div>
                {char.stats && (
                  <div className="char-power">
                    <SwordIcon size={12} />
                    {char.stats.attack}
                  </div>
                )}
                <div className="add-indicator">
                  <PlusIcon size={16} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Botón confirmar */}
      {onConfirm && (
        <div className="builder-footer">
          <div className="team-summary">
            {selectedTeam.length < minTeamSize && (
              <span className="warning">
                Selecciona al menos {minTeamSize} personaje{minTeamSize > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button 
            className="confirm-btn"
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            <SwordIcon size={18} />
            {mode === 'survival' ? 'Iniciar Survival' : 'Confirmar Equipo'}
          </button>
        </div>
      )}
    </div>
  );
}

export default TeamBuilder;
