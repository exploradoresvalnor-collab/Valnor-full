/**
 * SurvivalBattle - Pantalla de combate del modo Survival
 * 
 * Oleadas infinitas hasta que el jugador muere
 * Combate semi-automático con power-ups
 * 
 * Conectado con:
 * - teamStore: equipo activo
 * - playerStore: recursos y estadísticas
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useActiveTeam } from '../../stores/teamStore';
import {
  SwordIcon,
  HeartIcon,
  SkullIcon,
  GoldIcon,
  ExpIcon,
  ShieldIcon,
  CloseIcon,
} from '../icons/GameIcons';
import './SurvivalBattle.css';

interface BattleLog {
  id: number;
  type: 'attack' | 'damage' | 'kill' | 'wave' | 'boss' | 'powerup' | 'gameover';
  message: string;
}

interface PowerUp {
  id: string;
  name: string;
  icon: string;
  type: 'attack' | 'defense' | 'utility';
  duration: number;
}

interface SurvivalResult {
  waveReached: number;
  enemiesKilled: number;
  timeAlive: number; // seconds
  rewards: {
    gold: number;
    exp: number;
    items: string[];
  };
}

interface SurvivalBattleProps {
  onComplete: (result: SurvivalResult) => void;
  onExit: () => void;
}

const POWER_UPS: PowerUp[] = [
  { id: 'fury', name: 'Furia', icon: '🔥', type: 'attack', duration: 10 },
  { id: 'shield', name: 'Escudo', icon: '🛡️', type: 'defense', duration: 5 },
  { id: 'speed', name: 'Velocidad', icon: '⚡', type: 'utility', duration: 8 },
  { id: 'heal', name: 'Curación', icon: '💚', type: 'defense', duration: 0 },
  { id: 'critical', name: 'Crítico', icon: '💥', type: 'attack', duration: 6 },
];

export function SurvivalBattle({ onComplete, onExit }: SurvivalBattleProps) {
  const team = useActiveTeam();
  
  const [wave, setWave] = useState(1);
  const [enemiesInWave, setEnemiesInWave] = useState(3);
  const [enemiesKilled, setEnemiesKilled] = useState(0);
  const [totalKills, setTotalKills] = useState(0);
  const [teamHp, setTeamHp] = useState(100);
  const [logs, setLogs] = useState<BattleLog[]>([]);
  const [activePowerUps, setActivePowerUps] = useState<string[]>([]);
  const [droppedPowerUp, setDroppedPowerUp] = useState<PowerUp | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [result, setResult] = useState<SurvivalResult | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [timeAlive, setTimeAlive] = useState(0);
  const [isBossWave, setIsBossWave] = useState(false);
  
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Agregar log
  const addLog = useCallback((type: BattleLog['type'], message: string) => {
    setLogs(prev => [...prev, { id: Date.now(), type, message }].slice(-30));
  }, []);
  
  // Timer
  useEffect(() => {
    if (!isGameOver) {
      timeRef.current = setInterval(() => {
        setTimeAlive(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timeRef.current) clearInterval(timeRef.current);
    };
  }, [isGameOver]);
  
  // Game loop principal
  useEffect(() => {
    if (isGameOver) return;
    
    gameLoopRef.current = setInterval(() => {
      // Simular ataque del jugador
      const playerDamage = Math.floor(Math.random() * 30) + 20;
      const hasAttackBuff = activePowerUps.includes('fury') || activePowerUps.includes('critical');
      const finalDamage = hasAttackBuff ? playerDamage * 1.5 : playerDamage;
      
      // Probabilidad de matar enemigo
      if (Math.random() < 0.4) {
        setEnemiesKilled(prev => {
          const newKills = prev + 1;
          if (newKills >= enemiesInWave) {
            // Wave completada
            const nextWave = wave + 1;
            const isBoss = nextWave % 10 === 0;
            const isMiniBoss = nextWave % 5 === 0 && !isBoss;
            
            setWave(nextWave);
            setIsBossWave(isBoss || isMiniBoss);
            setEnemiesInWave(3 + Math.floor(nextWave / 2) + (isBoss ? 1 : 0));
            
            if (isBoss) {
              addLog('boss', `¡BOSS de Oleada ${nextWave} aparece!`);
            } else if (isMiniBoss) {
              addLog('wave', `¡Mini-boss en Oleada ${nextWave}!`);
            } else {
              addLog('wave', `Oleada ${nextWave} iniciada`);
            }
            
            return 0;
          }
          return newKills;
        });
        
        setTotalKills(prev => prev + 1);
        const enemyType = isBossWave ? 'Boss' : 'Enemigo';
        addLog('kill', `${enemyType} eliminado! (+${Math.floor(finalDamage)} daño)`);
        
        // Probabilidad de drop power-up
        if (Math.random() < 0.15 && !droppedPowerUp) {
          const randomPowerUp = POWER_UPS[Math.floor(Math.random() * POWER_UPS.length)];
          setDroppedPowerUp(randomPowerUp);
          addLog('powerup', `¡${randomPowerUp.icon} ${randomPowerUp.name} ha aparecido!`);
        }
      } else {
        addLog('attack', `Atacas por ${Math.floor(finalDamage)} de daño`);
      }
      
      // Simular daño recibido
      const hasShield = activePowerUps.includes('shield');
      if (!hasShield && Math.random() < 0.35) {
        const baseDamage = Math.floor(Math.random() * 15) + 5;
        const waveDamage = baseDamage + Math.floor(wave / 5) * 2;
        const bossDamage = isBossWave ? waveDamage * 1.5 : waveDamage;
        
        setTeamHp(prev => {
          const newHp = Math.max(0, prev - bossDamage);
          if (newHp <= 0) {
            // Game Over
            handleGameOver();
          }
          return newHp;
        });
        
        addLog('damage', `Recibes ${Math.floor(bossDamage)} de daño`);
      }
      
    }, 800);
    
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [wave, enemiesInWave, activePowerUps, isGameOver, isBossWave, droppedPowerUp, addLog]);
  
  // Manejar Game Over
  const handleGameOver = useCallback(() => {
    setIsGameOver(true);
    addLog('gameover', '¡Has caído en combate!');
    
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (timeRef.current) clearInterval(timeRef.current);
    
    // Calcular recompensas basadas en oleada alcanzada
    let gold = wave * 10;
    let exp = wave * 5;
    const items: string[] = [];
    
    if (wave >= 10) {
      gold += 50;
      exp += 25;
    }
    if (wave >= 25) {
      gold += 150;
      exp += 50;
    }
    if (wave >= 50) {
      gold += 400;
      exp += 100;
      items.push('Gema de Poder');
    }
    if (wave >= 100) {
      gold += 1000;
      exp += 250;
      items.push('Fragmento Épico');
    }
    
    const survivalResult: SurvivalResult = {
      waveReached: wave,
      enemiesKilled: totalKills,
      timeAlive,
      rewards: { gold, exp, items },
    };
    
    setResult(survivalResult);
  }, [wave, totalKills, timeAlive, addLog]);
  
  // Recoger power-up
  const collectPowerUp = () => {
    if (!droppedPowerUp) return;
    
    if (droppedPowerUp.id === 'heal') {
      setTeamHp(prev => Math.min(100, prev + 30));
      addLog('powerup', '💚 +30% HP restaurado');
    } else {
      setActivePowerUps(prev => [...prev, droppedPowerUp.id]);
      
      // Remover después de duración
      setTimeout(() => {
        setActivePowerUps(prev => prev.filter(id => id !== droppedPowerUp.id));
      }, droppedPowerUp.duration * 1000);
    }
    
    setDroppedPowerUp(null);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getHpColor = (hp: number) => {
    if (hp > 60) return '#2ecc71';
    if (hp > 30) return '#f39c12';
    return '#e74c3c';
  };
  
  return (
    <div className="survival-battle">
      {/* Header */}
      <div className="battle-header">
        <div className="wave-info">
          <span className={`wave-number ${isBossWave ? 'boss' : ''}`}>
            {isBossWave && <SkullIcon size={20} />}
            Oleada {wave}
          </span>
          <span className="enemies-count">
            Enemigos: {enemiesKilled}/{enemiesInWave}
          </span>
        </div>
        
        <div className="battle-stats">
          <span className="stat">💀 {totalKills}</span>
          <span className="stat">⏱️ {formatTime(timeAlive)}</span>
        </div>
        
        <button className="exit-btn" onClick={() => setShowExitConfirm(true)}>
          <CloseIcon size={20} />
        </button>
      </div>
      
      {/* Health Bar */}
      <div className="team-health-bar">
        <div className="health-info">
          <HeartIcon size={16} color={getHpColor(teamHp)} />
          <span>Equipo</span>
          <span className="hp-value">{Math.round(teamHp)}%</span>
        </div>
        <div className="health-track">
          <div 
            className="health-fill"
            style={{ 
              width: `${teamHp}%`,
              backgroundColor: getHpColor(teamHp)
            }}
          />
        </div>
      </div>
      
      {/* Active Power-Ups */}
      {activePowerUps.length > 0 && (
        <div className="active-powerups">
          {activePowerUps.map(id => {
            const pu = POWER_UPS.find(p => p.id === id);
            return pu && (
              <span key={id} className="active-buff">
                {pu.icon} {pu.name}
              </span>
            );
          })}
        </div>
      )}
      
      {/* Dropped Power-Up */}
      {droppedPowerUp && !isGameOver && (
        <div className="powerup-drop" onClick={collectPowerUp}>
          <span className="drop-icon">{droppedPowerUp.icon}</span>
          <span className="drop-name">{droppedPowerUp.name}</span>
          <span className="drop-hint">¡Clic para recoger!</span>
        </div>
      )}
      
      {/* Battle Area */}
      <div className="battle-area">
        {/* Team */}
        <div className="team-panel">
          <h3><ShieldIcon size={14} /> Tu Equipo</h3>
          {team.map(char => (
            <div key={char.id} className="team-member">
              <span className="member-name">{char.name}</span>
              <span className="member-level">Nv.{char.level}</span>
            </div>
          ))}
        </div>
        
        {/* Battle Log */}
        <div className="battle-log">
          <h3><SwordIcon size={14} /> Combate</h3>
          <div className="log-container">
            {logs.map(log => (
              <div key={log.id} className={`log-entry ${log.type}`}>
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Game Over Modal */}
      {isGameOver && result && (
        <div className="gameover-overlay">
          <div className="gameover-modal">
            <div className="gameover-icon">
              <SkullIcon size={48} color="#e74c3c" />
            </div>
            
            <h2>¡Partida Terminada!</h2>
            
            <div className="final-stats">
              <div className="final-stat">
                <span className="stat-icon">🌊</span>
                <span className="stat-value">{result.waveReached}</span>
                <span className="stat-label">Oleada Alcanzada</span>
              </div>
              <div className="final-stat">
                <span className="stat-icon">💀</span>
                <span className="stat-value">{result.enemiesKilled}</span>
                <span className="stat-label">Enemigos</span>
              </div>
              <div className="final-stat">
                <span className="stat-icon">⏱️</span>
                <span className="stat-value">{formatTime(result.timeAlive)}</span>
                <span className="stat-label">Tiempo</span>
              </div>
            </div>
            
            <div className="rewards-section">
              <h3>🎁 Recompensas</h3>
              <div className="rewards-grid">
                <div className="reward-item">
                  <GoldIcon size={24} color="#ffd700" />
                  <span>+{result.rewards.gold}</span>
                </div>
                <div className="reward-item">
                  <ExpIcon size={24} color="#3498db" />
                  <span>+{result.rewards.exp}</span>
                </div>
              </div>
              {result.rewards.items.length > 0 && (
                <div className="bonus-items">
                  {result.rewards.items.map((item, i) => (
                    <span key={i} className="bonus-item">✨ {item}</span>
                  ))}
                </div>
              )}
            </div>
            
            <button className="continue-btn" onClick={() => onComplete(result)}>
              Reclamar Recompensas
            </button>
          </div>
        </div>
      )}
      
      {/* Exit Confirm */}
      {showExitConfirm && !isGameOver && (
        <div className="confirm-overlay" onClick={() => setShowExitConfirm(false)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>⚠️ ¿Abandonar partida?</h3>
            <p>Perderás todo el progreso y recompensas.</p>
            <div className="confirm-actions">
              <button className="cancel-btn" onClick={() => setShowExitConfirm(false)}>
                Continuar
              </button>
              <button className="confirm-btn danger" onClick={onExit}>
                Abandonar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SurvivalBattle;
