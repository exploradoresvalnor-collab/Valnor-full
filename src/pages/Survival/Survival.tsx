import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useIsGuest } from '../../stores/sessionStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useActiveTeam } from '../../stores/teamStore';
import { SurvivalBattle } from '../../components/survival';
import { survivalService } from '../../services';
import { socketService } from '../../services/socket.service';
import { getDemoCharacters } from '../../services/demo.service';
import './Survival.css';

interface SurvivalStats {
  mejorOleada: number;
  partidasJugadas: number;
  totalEnemigosEliminados: number;
  tiempoTotalJugado: number;
  mejorRacha: number;
}

interface PowerUp {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  tipo: 'ataque' | 'defensa' | 'utilidad';
}

interface LeaderboardEntry {
  posicion: number;
  username: string;
  oleada: number;
  tiempo: number;
}

const powerUps: PowerUp[] = [
  { id: 'p1', nombre: 'Furia Berserker', descripcion: '+50% ATK por 30s', icono: '🔥', tipo: 'ataque' },
  { id: 'p2', nombre: 'Escudo Divino', descripcion: 'Invulnerable por 5s', icono: '🛡️', tipo: 'defensa' },
  { id: 'p3', nombre: 'Velocidad Extrema', descripcion: '+100% velocidad por 20s', icono: '⚡', tipo: 'utilidad' },
  { id: 'p4', nombre: 'Regeneración', descripcion: 'Recupera 50% HP', icono: '💚', tipo: 'defensa' },
  { id: 'p5', nombre: 'Crítico Mortal', descripcion: '100% crítico por 15s', icono: '💥', tipo: 'ataque' },
  { id: 'p6', nombre: 'Magnetismo', descripcion: 'Atrae loot cercano', icono: '🧲', tipo: 'utilidad' },
];

const Survival: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isGuest = useIsGuest();
  
  const { energy, maxEnergy, useEnergy, addGold, addExperience, setCurrentHealth } = usePlayerStore();
  const team = useActiveTeam();
  
  const [stats, setStats] = useState<SurvivalStats>({
    mejorOleada: 0, partidasJugadas: 0, totalEnemigosEliminados: 0, tiempoTotalJugado: 0, mejorRacha: 0,
  });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showBattle, setShowBattle] = useState(false);
  const [survivalLoading, setSurvivalLoading] = useState(true);

  // Fetch survival data (real or demo)
  useEffect(() => {
    if (loading) return;
    let cancelled = false;

    const fetchSurvival = async () => {
      setSurvivalLoading(true);
      try {
        if (isGuest) {
          // Demo data for guests
          setStats({
            mejorOleada: 0,
            partidasJugadas: 0,
            totalEnemigosEliminados: 0,
            tiempoTotalJugado: 0,
            mejorRacha: 0,
          });
          setLeaderboard([
            { posicion: 1, username: 'Jugador1', oleada: 25, tiempo: 180 },
            { posicion: 2, username: 'Jugador2', oleada: 22, tiempo: 165 },
            { posicion: 3, username: 'Jugador3', oleada: 20, tiempo: 150 },
          ]);
        } else {
          // Load real data
          const [myStats, lb] = await Promise.all([
            survivalService.getMyStats().catch(() => null),
            survivalService.getLeaderboard({ limit: '5' }).catch(() => null),
          ]);

          if (cancelled) return;

          if (myStats) {
            const s = myStats as any;
            setStats({
              mejorOleada: s.mejorOleada || s.bestWave || s.maxWave || 0,
              partidasJugadas: s.partidasJugadas || s.gamesPlayed || s.totalGames || 0,
              totalEnemigosEliminados: s.totalEnemigosEliminados || s.totalKills || s.enemiesKilled || 0,
              tiempoTotalJugado: s.tiempoTotalJugado || s.totalTimePlayed || s.totalTime || 0,
              mejorRacha: s.mejorRacha || s.bestStreak || s.killStreak || 0,
            });
          }

          if (lb) {
            const lbData = lb as any;
            const entries = lbData.leaderboard || lbData.data || (Array.isArray(lbData) ? lbData : []);
            if (Array.isArray(entries)) {
              setLeaderboard(entries.map((e: any, i: number) => ({
                posicion: e.posicion || e.position || e.rank || i + 1,
                username: e.username || e.nombre || e.name || 'Jugador',
                oleada: e.oleada || e.wave || e.bestWave || e.mejorOleada || 0,
                tiempo: e.tiempo || e.time || e.totalTime || 0,
              })));
            }
          }
        }
      } catch (err) {
        console.error('[Survival] Error:', err);
      } finally {
        if (!cancelled) setSurvivalLoading(false);
      }
    };

    fetchSurvival();
    return () => { cancelled = true; };
  }, [loading, isGuest]);

  // Configurar listeners de WebSocket para eventos en tiempo real
  useEffect(() => {
    // Listener para fin de survival con recompensas
    const handleSurvivalEnd = (data: { sessionId: string; totalWaves: number; durationMs: number; rewards: any }) => {
      console.log('[Survival] Fin de sesión recibido:', data);
      
      // Aplicar recompensas en tiempo real
      if (data.rewards) {
        if (data.rewards.valGanado || data.rewards.gold) {
          addGold(data.rewards.valGanado || data.rewards.gold);
        }
        if (data.rewards.expGanada || data.rewards.experience) {
          addExperience(data.rewards.expGanada || data.rewards.experience);
        }
      }
      
      // Mostrar notificación de recompensas
      // TODO: Implementar notificación visual de recompensas
    };

    // Listener para daño recibido en combate
    const handleCombatDamage = (data: { damage: number; from: string; type: string; currentHealth: number }) => {
      console.log('[Survival] Daño recibido:', data);
      
      // Actualizar vida del personaje en tiempo real
      setCurrentHealth(data.currentHealth);
      
      // TODO: Mostrar efecto visual de daño
      // TODO: Reproducir sonido de daño
    };

    // Registrar listeners
    socketService.on('survival:end', handleSurvivalEnd);
    socketService.on('combat:damage', handleCombatDamage);

    // Cleanup
    return () => {
      socketService.off('survival:end', handleSurvivalEnd);
      socketService.off('combat:damage', handleCombatDamage);
    };
  }, [addGold, addExperience, setCurrentHealth]);

  if (loading || survivalLoading) {
    return (
      <div className="survival-loading">
        <div className="loading-spinner" />
        <p>Cargando Survival...</p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const userEnergy = isGuest ? 50 : energy; // Demo energy for guests
  const energyCost = 15;
  const hasTeam = isGuest ? getDemoCharacters().length > 0 : team.length > 0;
  const canPlay = userEnergy >= energyCost && hasTeam;

  const handleStartGame = () => {
    if (!canPlay) return;
    
    // Verificar equipo
    if (!hasTeam) {
      alert('¡Necesitas un equipo para jugar Survival!');
      return;
    }
    
    // Consumir energía (solo para usuarios reales)
    if (!isGuest) {
      useEnergy(energyCost);
    }
    
    // Iniciar batalla
    setShowBattle(true);
  };

  const handleBattleComplete = (result: { waveReached: number; enemiesKilled: number; timeAlive: number; rewards: { gold: number; exp: number; items: string[] } }) => {
    // Dar recompensas
    addGold(result.rewards.gold);
    addExperience(result.rewards.exp);
    setShowBattle(false);
  };

  const handleBattleExit = () => {
    setShowBattle(false);
  };

  return (
    <div className="survival-page">
      {/* Header */}
      <header className="survival-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Volver
        </button>
        <h1>⚡ Survival Valnor</h1>
        <div className="energy-display">
          <span className="energy-icon">⚡</span>
          <span className="energy-amount">{userEnergy}</span>
          <span className="energy-max">/{maxEnergy}</span>
        </div>
      </header>

      <div className="survival-container">
        {/* Hero Section */}
        <section className="survival-hero">
          <div className="hero-content">
            <div className="hero-icon">⚡</div>
            <h2>¿Hasta dónde puedes llegar?</h2>
            <p>
              Oleadas infinitas de enemigos. Sin pausas. Sin piedad.
              Sobrevive todo lo que puedas y demuestra que eres el mejor.
            </p>
            <div className="hero-actions">
              <button 
                className={`play-btn ${!canPlay ? 'disabled' : ''}`}
                onClick={handleStartGame}
                disabled={!canPlay}
              >
                {canPlay ? (
                  <>
                    <span className="btn-icon">⚔️</span>
                    <span>Iniciar Partida</span>
                    <span className="btn-cost">⚡ {energyCost}</span>
                  </>
                ) : team.length === 0 ? (
                  <>
                    <span className="btn-icon">👥</span>
                    <span>Sin Equipo</span>
                  </>
                ) : (
                  <>
                    <span className="btn-icon">❌</span>
                    <span>Energía Insuficiente</span>
                  </>
                )}
              </button>
              <button className="rules-btn" onClick={() => setShowRulesModal(true)}>
                📖 Reglas
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="wave-counter">
              <span className="wave-label">Tu récord</span>
              <span className="wave-number">{stats.mejorOleada}</span>
              <span className="wave-text">oleadas</span>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="stats-section">
          <h3>📊 Tus Estadísticas</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon">🌊</span>
              <span className="stat-value">{stats.mejorOleada}</span>
              <span className="stat-label">Mejor Oleada</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">🎮</span>
              <span className="stat-value">{stats.partidasJugadas}</span>
              <span className="stat-label">Partidas Jugadas</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">💀</span>
              <span className="stat-value">{stats.totalEnemigosEliminados.toLocaleString()}</span>
              <span className="stat-label">Enemigos Eliminados</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">⏱️</span>
              <span className="stat-value">{formatTime(stats.tiempoTotalJugado)}</span>
              <span className="stat-label">Tiempo Total</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">🔥</span>
              <span className="stat-value">{stats.mejorRacha}</span>
              <span className="stat-label">Mejor Racha</span>
            </div>
          </div>
        </section>

        {/* Power-Ups */}
        <section className="powerups-section">
          <h3>💎 Power-Ups Disponibles</h3>
          <p className="section-desc">
            Aparecen aleatoriamente durante la partida. ¡Recógelos para sobrevivir!
          </p>
          <div className="powerups-grid">
            {powerUps.map((powerup) => (
              <div 
                key={powerup.id} 
                className={`powerup-card ${powerup.tipo}`}
              >
                <span className="powerup-icon">{powerup.icono}</span>
                <div className="powerup-info">
                  <span className="powerup-name">{powerup.nombre}</span>
                  <span className="powerup-desc">{powerup.descripcion}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Leaderboard */}
        <section className="leaderboard-section">
          <div className="leaderboard-header">
            <h3>🏆 Top Semanal</h3>
            <button 
              className="view-full-btn"
              onClick={() => navigate('/ranking')}
            >
              Ver Ranking Completo →
            </button>
          </div>
          <div className="leaderboard-list">
            {leaderboard.map((entry) => (
              <div 
                key={entry.posicion} 
                className={`leaderboard-item ${entry.posicion <= 3 ? `top-${entry.posicion}` : ''}`}
              >
                <span className="lb-position">
                  {entry.posicion === 1 && '🥇'}
                  {entry.posicion === 2 && '🥈'}
                  {entry.posicion === 3 && '🥉'}
                  {entry.posicion > 3 && `#${entry.posicion}`}
                </span>
                <span className="lb-username">{entry.username}</span>
                <span className="lb-wave">🌊 {entry.oleada}</span>
                <span className="lb-time">⏱️ {formatTime(entry.tiempo)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Rewards */}
        <section className="rewards-section">
          <h3>🎁 Recompensas por Oleada</h3>
          <div className="rewards-tiers">
            <div className="reward-tier">
              <span className="tier-wave">10+</span>
              <span className="tier-reward">50 VAL + 5 EVO</span>
            </div>
            <div className="reward-tier">
              <span className="tier-wave">25+</span>
              <span className="tier-reward">150 VAL + 15 EVO</span>
            </div>
            <div className="reward-tier">
              <span className="tier-wave">50+</span>
              <span className="tier-reward">400 VAL + 40 EVO + Item Raro</span>
            </div>
            <div className="reward-tier legendary">
              <span className="tier-wave">100+</span>
              <span className="tier-reward">1000 VAL + 100 EVO + Item Épico</span>
            </div>
          </div>
        </section>
      </div>

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="modal-overlay" onClick={() => setShowRulesModal(false)}>
          <div className="rules-modal" onClick={e => e.stopPropagation()}>
            <h3>📖 Reglas de Survival</h3>
            
            <div className="rule-section">
              <h4>🎯 Objetivo</h4>
              <p>Sobrevive la mayor cantidad de oleadas posible derrotando enemigos.</p>
            </div>

            <div className="rule-section">
              <h4>🌊 Oleadas</h4>
              <ul>
                <li>Cada oleada tiene más enemigos y son más fuertes</li>
                <li>Cada 5 oleadas aparece un mini-boss</li>
                <li>Cada 10 oleadas aparece un boss</li>
                <li>No hay límite de oleadas</li>
              </ul>
            </div>

            <div className="rule-section">
              <h4>💎 Power-Ups</h4>
              <ul>
                <li>Aparecen aleatoriamente al derrotar enemigos</li>
                <li>Duración limitada (excepto curación)</li>
                <li>No se pueden acumular del mismo tipo</li>
              </ul>
            </div>

            <div className="rule-section">
              <h4>⚠️ Game Over</h4>
              <ul>
                <li>El juego termina cuando tu HP llega a 0</li>
                <li>No hay revive ni checkpoints</li>
                <li>Las recompensas se calculan al finalizar</li>
              </ul>
            </div>

            <button className="close-modal-btn" onClick={() => setShowRulesModal(false)}>
              ¡Entendido!
            </button>
          </div>
        </div>
      )}

      {/* Battle Screen */}
      {showBattle && (
        <SurvivalBattle
          onComplete={handleBattleComplete}
          onExit={handleBattleExit}
        />
      )}
    </div>
  );
};

export default Survival;
