/**
 * HealReviveModal - Modal para curar o revivir personajes
 * Costos: Curar = 2 VAL por cada 10 HP, Revivir = 50 VAL fijo
 */

import { useState, useMemo } from 'react';
import { 
  CloseIcon, 
  HeartIcon, 
  GoldIcon,
  PotionIcon,
} from '../icons/GameIcons';
import type { CharacterData } from './CharacterCard';
import './HealReviveModal.css';

interface HealReviveModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData | null;
  playerGold: number;
  onHeal: (characterId: string, amount: number, cost: number) => void;
  onRevive: (characterId: string, cost: number) => void;
}

// Constantes de costos
const HEAL_COST_PER_10HP = 2; // 2 VAL por cada 10 HP
const REVIVE_COST = 50; // 50 VAL fijo para revivir
const REVIVE_HP_PERCENT = 0.5; // Revive con 50% HP

export function HealReviveModal({
  isOpen,
  onClose,
  character,
  playerGold,
  onHeal,
  onRevive,
}: HealReviveModalProps) {
  const [healAmount, setHealAmount] = useState<number>(0);
  
  // Calcular valores
  const calculations = useMemo(() => {
    if (!character) return null;
    
    const missingHp = character.maxHealth - character.currentHealth;
    const maxHealCost = Math.ceil(missingHp / 10) * HEAL_COST_PER_10HP;
    const canAffordFullHeal = playerGold >= maxHealCost;
    const maxAffordableHeal = Math.floor(playerGold / HEAL_COST_PER_10HP) * 10;
    const reviveHp = Math.floor(character.maxHealth * REVIVE_HP_PERCENT);
    
    return {
      missingHp,
      maxHealCost,
      canAffordFullHeal,
      maxAffordableHeal,
      reviveHp,
      canAffordRevive: playerGold >= REVIVE_COST,
    };
  }, [character, playerGold]);
  
  if (!isOpen || !character || !calculations) return null;
  
  const isDead = character.state === 'dead';
  const isFullHealth = character.currentHealth >= character.maxHealth;
  
  // Calcular costo actual de curación
  const currentHealCost = Math.ceil(healAmount / 10) * HEAL_COST_PER_10HP;
  const canAffordCurrentHeal = playerGold >= currentHealCost;
  
  const handleHealSliderChange = (value: number) => {
    // Redondear a múltiplos de 10
    const rounded = Math.round(value / 10) * 10;
    setHealAmount(Math.min(rounded, calculations.missingHp));
  };
  
  const handleHealAll = () => {
    setHealAmount(calculations.missingHp);
  };
  
  const handleHeal = () => {
    if (healAmount > 0 && canAffordCurrentHeal) {
      onHeal(character.id, healAmount, currentHealCost);
      setHealAmount(0);
      onClose();
    }
  };
  
  const handleRevive = () => {
    if (calculations.canAffordRevive) {
      onRevive(character.id, REVIVE_COST);
      onClose();
    }
  };
  
  const hpPercent = (character.currentHealth / character.maxHealth) * 100;
  const hpAfterHeal = Math.min(character.currentHealth + healAmount, character.maxHealth);
  const hpPercentAfterHeal = (hpAfterHeal / character.maxHealth) * 100;
  
  return (
    <div className="heal-modal-overlay" onClick={onClose}>
      <div className="heal-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>
            {isDead ? (
              <><HeartIcon size={24} color="#e74c3c" /> Revivir Personaje</>
            ) : (
              <><PotionIcon size={24} color="#2ecc71" /> Curar Personaje</>
            )}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </div>
        
        {/* Contenido */}
        <div className="modal-content">
          {/* Info del personaje */}
          <div className="character-preview">
            <div className="char-name">{character.name}</div>
            <div className="char-class">Nv.{character.level} {character.class}</div>
          </div>
          
          {isDead ? (
            /* REVIVIR */
            <div className="revive-section">
              <div className="death-notice">
                <span className="death-icon">💀</span>
                <p>Este personaje está <strong>muerto</strong> y no puede participar en combate.</p>
              </div>
              
              <div className="revive-info">
                <div className="revive-stat">
                  <span>HP al revivir:</span>
                  <strong className="hp-value">
                    <HeartIcon size={14} color="#2ecc71" />
                    {calculations.reviveHp} / {character.maxHealth}
                  </strong>
                  <span className="percent">(50%)</span>
                </div>
                
                <div className="revive-cost">
                  <span>Costo:</span>
                  <strong className={!calculations.canAffordRevive ? 'insufficient' : ''}>
                    <GoldIcon size={16} />
                    {REVIVE_COST} VAL
                  </strong>
                </div>
                
                <div className="player-gold">
                  <span>Tu oro:</span>
                  <strong>
                    <GoldIcon size={14} />
                    {playerGold.toLocaleString()} VAL
                  </strong>
                </div>
              </div>
              
              {!calculations.canAffordRevive && (
                <div className="insufficient-notice">
                  ⚠️ No tienes suficiente oro para revivir
                </div>
              )}
            </div>
          ) : isFullHealth ? (
            /* YA TIENE VIDA COMPLETA */
            <div className="full-health-section">
              <div className="full-health-icon">✓</div>
              <p>Este personaje ya tiene la <strong>vida completa</strong>.</p>
              <div className="hp-bar-preview">
                <div className="hp-text">
                  <HeartIcon size={14} color="#2ecc71" />
                  {character.currentHealth} / {character.maxHealth}
                </div>
                <div className="hp-bar-track full">
                  <div className="hp-bar-fill" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          ) : (
            /* CURAR */
            <div className="heal-section">
              {/* Barra de HP actual */}
              <div className="hp-preview">
                <div className="hp-header">
                  <span>Vida Actual</span>
                  <span className="hp-values">
                    {character.currentHealth} → <strong>{hpAfterHeal}</strong> / {character.maxHealth}
                  </span>
                </div>
                <div className="hp-bar-track">
                  <div 
                    className="hp-bar-fill current" 
                    style={{ width: `${hpPercent}%` }}
                  />
                  {healAmount > 0 && (
                    <div 
                      className="hp-bar-fill preview" 
                      style={{ 
                        width: `${hpPercentAfterHeal - hpPercent}%`,
                        left: `${hpPercent}%`,
                      }}
                    />
                  )}
                </div>
              </div>
              
              {/* Slider de curación */}
              <div className="heal-slider-section">
                <div className="slider-header">
                  <span>Cantidad a curar:</span>
                  <strong className="heal-amount">+{healAmount} HP</strong>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max={calculations.missingHp}
                  step="10"
                  value={healAmount}
                  onChange={(e) => handleHealSliderChange(parseInt(e.target.value))}
                  className="heal-slider"
                />
                <div className="slider-labels">
                  <span>0</span>
                  <button className="heal-all-btn" onClick={handleHealAll}>
                    Curar todo ({calculations.missingHp} HP)
                  </button>
                  <span>{calculations.missingHp}</span>
                </div>
              </div>
              
              {/* Costo */}
              <div className="cost-section">
                <div className="cost-breakdown">
                  <div className="cost-item">
                    <span>Costo por 10 HP:</span>
                    <span><GoldIcon size={14} /> {HEAL_COST_PER_10HP} VAL</span>
                  </div>
                  <div className="cost-item total">
                    <span>Costo total:</span>
                    <strong className={!canAffordCurrentHeal ? 'insufficient' : ''}>
                      <GoldIcon size={16} /> {currentHealCost} VAL
                    </strong>
                  </div>
                </div>
                
                <div className="player-gold">
                  <span>Tu oro:</span>
                  <strong>
                    <GoldIcon size={14} />
                    {playerGold.toLocaleString()} VAL
                  </strong>
                </div>
              </div>
              
              {!canAffordCurrentHeal && healAmount > 0 && (
                <div className="insufficient-notice">
                  ⚠️ No tienes suficiente oro. Máximo puedes curar: {calculations.maxAffordableHeal} HP
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          
          {isDead ? (
            <button 
              className="btn-revive"
              onClick={handleRevive}
              disabled={!calculations.canAffordRevive}
            >
              <HeartIcon size={16} />
              Revivir ({REVIVE_COST} VAL)
            </button>
          ) : !isFullHealth ? (
            <button 
              className="btn-heal"
              onClick={handleHeal}
              disabled={healAmount === 0 || !canAffordCurrentHeal}
            >
              <PotionIcon size={16} />
              Curar ({currentHealCost} VAL)
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default HealReviveModal;
