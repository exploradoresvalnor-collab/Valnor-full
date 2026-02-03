/**
 * DungeonBattle - Pantalla de combate automático en mazmorra
 * 
 * El combate es AUTOMÁTICO - se simula progreso mientras el backend resuelve
 * Muestra: equipo del jugador, enemigos, barra de progreso, log de combate
 * 
 * Conectado con:
 * - dungeonStore: mazmorra seleccionada
 * - teamStore: equipo activo
 * - playerStore: recursos del jugador
 */

import { useState, useEffect, useCallback } from 'react';
import { useActiveTeam, type TeamMember } from '../../stores/teamStore';
import { type Dungeon } from '../../stores/dungeonStore';
import {
  SwordIcon,
  HeartIcon,
  SkullIcon,
  TrophyIcon,
  GoldIcon,
  ExpIcon,
  ShieldIcon,
  CloseIcon,
} from '../icons/GameIcons';
import './DungeonBattle.css';

interface BattleLog {
  id: number;
  type: 'attack' | 'damage' | 'heal' | 'wave' | 'boss' | 'victory' | 'defeat';
  message: string;
  timestamp: number;
}

interface BattleResult {
  victory: boolean;
  rewards: {
    gold: number;
    exp: number;
    items: string[];
  };
  teamDamage: { characterId: string; damage: number }[];
  wavesCompleted: number;
}

type BattlePhase = 'preparing' | 'fighting' | 'boss' | 'results';

interface DungeonBattleProps {
  dungeon: Dungeon;
  onComplete: (result: BattleResult) => void;
  onExit: () => void;
}

export function DungeonBattle({ dungeon, onComplete, onExit }: DungeonBattleProps) {
  const team = useActiveTeam();
  
  const [phase, setPhase] = useState<BattlePhase>('preparing');
  const [currentWave, setCurrentWave] = useState(0);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<BattleLog[]>([]);
  const [teamHealth, setTeamHealth] = useState<Record<string, number>>({});
  const [result, setResult] = useState<BattleResult | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  // Obtener la salud máxima de un personaje
  const getMaxHealth = (char: TeamMember) => char.stats?.health || 100;
  
  // Inicializar salud del equipo
  useEffect(() => {
    const initialHealth: Record<string, number> = {};
    team.forEach(char => {
      initialHealth[char.id] = getMaxHealth(char);
    });
    setTeamHealth(initialHealth);
  }, [team]);
  
  // Agregar log de batalla
  const addLog = useCallback((type: BattleLog['type'], message: string) => {
    setLogs(prev => [...prev, {
      id: Date.now(),
      type,
      message,
      timestamp: Date.now(),
    }].slice(-50)); // Mantener últimos 50 logs
  }, []);
  
  // Simular combate
  useEffect(() => {
    if (phase === 'preparing') {
      addLog('wave', '¡Preparándose para la batalla!');
      const timer = setTimeout(() => {
        setPhase('fighting');
        setCurrentWave(1);
        addLog('wave', `¡Oleada 1 de ${dungeon.waves} comienza!`);
      }, 1500);
      return () => clearTimeout(timer);
    }
    
    if (phase === 'fighting' || phase === 'boss') {
      const interval = setInterval(() => {
        // Simular progreso de combate
        setProgress(prev => {
          const increment = 100 / (dungeon.waves * 5); // 5 "turnos" por oleada
          const newProgress = Math.min(prev + increment, 100);
          
          // Generar eventos de combate aleatorios
          const rand = Math.random();
          if (rand < 0.3) {
            const attacker = team[Math.floor(Math.random() * team.length)];
            const damage = Math.floor(Math.random() * 50) + 20;
            addLog('attack', `${attacker.name} ataca por ${damage} de daño!`);
          } else if (rand < 0.5) {
            const defender = team[Math.floor(Math.random() * team.length)];
            const damage = Math.floor(Math.random() * 30) + 10;
            addLog('damage', `${defender.name} recibe ${damage} de daño`);
            
            // Actualizar salud
            setTeamHealth(prev => ({
              ...prev,
              [defender.id]: Math.max(0, (prev[defender.id] || 100) - damage / 3),
            }));
          }
          
          // Cambiar de oleada
          const waveProgress = (newProgress / 100) * dungeon.waves;
          const newWave = Math.min(Math.ceil(waveProgress), dungeon.waves);
          
          if (newWave > currentWave && newWave <= dungeon.waves) {
            if (newWave === dungeon.waves) {
              setPhase('boss');
              addLog('boss', `¡${dungeon.bossName} aparece!`);
            } else {
              addLog('wave', `¡Oleada ${newWave} de ${dungeon.waves}!`);
            }
            setCurrentWave(newWave);
          }
          
          // Victoria
          if (newProgress >= 100) {
            clearInterval(interval);
            
            // Calcular resultado
            const victory = Math.random() > 0.1; // 90% de victoria simulada
            const battleResult: BattleResult = {
              victory,
              rewards: victory ? {
                gold: Math.floor(Math.random() * (dungeon.rewards.gold.max - dungeon.rewards.gold.min)) + dungeon.rewards.gold.min,
                exp: Math.floor(Math.random() * (dungeon.rewards.exp.max - dungeon.rewards.exp.min)) + dungeon.rewards.exp.min,
                items: dungeon.rewards.items?.filter(() => Math.random() > 0.7) || [],
              } : { gold: 0, exp: 0, items: [] },
              teamDamage: team.map(char => ({
                characterId: char.id,
                damage: Math.floor(Math.random() * 30),
              })),
              wavesCompleted: victory ? dungeon.waves : currentWave,
            };
            
            setResult(battleResult);
            
            setTimeout(() => {
              setPhase('results');
              addLog(victory ? 'victory' : 'defeat', 
                victory ? '¡Victoria! Has conquistado la mazmorra.' : 'Derrota... Tu equipo ha caído.');
            }, 500);
          }
          
          return newProgress;
        });
      }, 600);
      
      return () => clearInterval(interval);
    }
  }, [phase, currentWave, dungeon, team, addLog]);
  
  const handleExit = () => {
    if (phase === 'results' && result) {
      onComplete(result);
    } else {
      setShowExitConfirm(true);
    }
  };
  
  const confirmExit = () => {
    onExit();
  };
  
  const getHealthPercent = (charId: string) => {
    const char = team.find(c => c.id === charId);
    if (!char) return 0;
    const maxHp = getMaxHealth(char);
    const currentHp = teamHealth[charId] ?? maxHp;
    return Math.round((currentHp / maxHp) * 100);
  };
  
  const getHealthColor = (percent: number) => {
    if (percent > 60) return '#2ecc71';
    if (percent > 30) return '#f39c12';
    return '#e74c3c';
  };
  
  return (
    <div className="dungeon-battle">
      {/* Header */}
      <div className="battle-header">
        <div className="dungeon-info">
          <h2>{dungeon.name}</h2>
          <span className="wave-indicator">
            {phase === 'boss' ? (
              <><SkullIcon size={16} /> BOSS: {dungeon.bossName}</>
            ) : (
              <>Oleada {currentWave}/{dungeon.waves}</>
            )}
          </span>
        </div>
        <button className="exit-btn" onClick={handleExit}>
          <CloseIcon size={20} />
        </button>
      </div>
      
      {/* Progress Bar */}
      <div className="battle-progress">
        <div className="progress-bar">
          <div 
            className={`progress-fill ${phase === 'boss' ? 'boss' : ''}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="progress-markers">
          {Array.from({ length: dungeon.waves }).map((_, i) => (
            <div 
              key={i} 
              className={`marker ${i < currentWave ? 'completed' : ''} ${i === dungeon.waves - 1 ? 'boss' : ''}`}
            >
              {i === dungeon.waves - 1 ? <SkullIcon size={12} /> : i + 1}
            </div>
          ))}
        </div>
      </div>
      
      {/* Battle Area */}
      <div className="battle-area">
        {/* Team Panel */}
        <div className="team-panel">
          <h3><ShieldIcon size={16} /> Tu Equipo</h3>
          <div className="team-list">
            {team.map(char => {
              const healthPercent = getHealthPercent(char.id);
              return (
                <div key={char.id} className="team-member">
                  <div className="member-info">
                    <span className="member-name">{char.name}</span>
                    <span className="member-class">Nv.{char.level}</span>
                  </div>
                  <div className="member-health">
                    <div className="health-bar">
                      <div 
                        className="health-fill"
                        style={{ 
                          width: `${healthPercent}%`,
                          backgroundColor: getHealthColor(healthPercent)
                        }}
                      />
                    </div>
                    <span className="health-text">{healthPercent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Battle Log */}
        <div className="battle-log">
          <h3><SwordIcon size={16} /> Registro de Combate</h3>
          <div className="log-container">
            {logs.map(log => (
              <div key={log.id} className={`log-entry ${log.type}`}>
                {log.type === 'attack' && <SwordIcon size={12} />}
                {log.type === 'damage' && <HeartIcon size={12} />}
                {log.type === 'wave' && '⚔️'}
                {log.type === 'boss' && <SkullIcon size={12} />}
                {log.type === 'victory' && <TrophyIcon size={12} />}
                {log.type === 'defeat' && '💀'}
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Results Modal */}
      {phase === 'results' && result && (
        <div className="results-overlay">
          <div className={`results-modal ${result.victory ? 'victory' : 'defeat'}`}>
            <div className="results-icon">
              {result.victory ? <TrophyIcon size={64} color="#ffd700" /> : <SkullIcon size={64} color="#e74c3c" />}
            </div>
            
            <h2>{result.victory ? '¡Victoria!' : 'Derrota'}</h2>
            <p className="results-subtitle">
              {result.victory 
                ? `Has completado ${dungeon.name}` 
                : `Caíste en la oleada ${result.wavesCompleted}`}
            </p>
            
            {result.victory && (
              <div className="rewards-section">
                <h3>Recompensas</h3>
                <div className="rewards-grid">
                  <div className="reward-item">
                    <GoldIcon size={24} color="#ffd700" />
                    <span className="reward-value">+{result.rewards.gold}</span>
                    <span className="reward-label">Oro</span>
                  </div>
                  <div className="reward-item">
                    <ExpIcon size={24} color="#3498db" />
                    <span className="reward-value">+{result.rewards.exp}</span>
                    <span className="reward-label">EXP</span>
                  </div>
                </div>
                
                {result.rewards.items.length > 0 && (
                  <div className="loot-section">
                    <h4>Items Obtenidos</h4>
                    <div className="loot-list">
                      {result.rewards.items.map((item, i) => (
                        <span key={i} className="loot-item">✨ {item}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <button className="continue-btn" onClick={() => onComplete(result)}>
              {result.victory ? 'Reclamar Recompensas' : 'Volver'}
            </button>
          </div>
        </div>
      )}
      
      {/* Exit Confirmation */}
      {showExitConfirm && (
        <div className="confirm-overlay" onClick={() => setShowExitConfirm(false)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>⚠️ ¿Abandonar Mazmorra?</h3>
            <p>Perderás todo el progreso y el boleto usado.</p>
            <div className="confirm-actions">
              <button className="cancel-btn" onClick={() => setShowExitConfirm(false)}>
                Continuar
              </button>
              <button className="confirm-btn danger" onClick={confirmExit}>
                Abandonar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DungeonBattle;
