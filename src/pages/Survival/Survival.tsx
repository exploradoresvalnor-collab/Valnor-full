import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
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

const mockStats: SurvivalStats = {
  mejorOleada: 47,
  partidasJugadas: 156,
  totalEnemigosEliminados: 12847,
  tiempoTotalJugado: 89400, // segundos
  mejorRacha: 234,
};

const powerUps: PowerUp[] = [
  { id: 'p1', nombre: 'Furia Berserker', descripcion: '+50% ATK por 30s', icono: '🔥', tipo: 'ataque' },
  { id: 'p2', nombre: 'Escudo Divino', descripcion: 'Invulnerable por 5s', icono: '🛡️', tipo: 'defensa' },
  { id: 'p3', nombre: 'Velocidad Extrema', descripcion: '+100% velocidad por 20s', icono: '⚡', tipo: 'utilidad' },
  { id: 'p4', nombre: 'Regeneración', descripcion: 'Recupera 50% HP', icono: '💚', tipo: 'defensa' },
  { id: 'p5', nombre: 'Crítico Mortal', descripcion: '100% crítico por 15s', icono: '💥', tipo: 'ataque' },
  { id: 'p6', nombre: 'Magnetismo', descripcion: 'Atrae loot cercano', icono: '🧲', tipo: 'utilidad' },
];

const weeklyLeaderboard: LeaderboardEntry[] = [
  { posicion: 1, username: 'ShadowNinja', oleada: 158, tiempo: 7840 },
  { posicion: 2, username: 'CryptoKing', oleada: 145, tiempo: 7120 },
  { posicion: 3, username: 'SwiftBlade', oleada: 142, tiempo: 6980 },
  { posicion: 4, username: 'IronTank', oleada: 138, tiempo: 6750 },
  { posicion: 5, username: 'DragonSlayer99', oleada: 135, tiempo: 6520 },
];

const Survival: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [stats] = useState<SurvivalStats>(mockStats);
  const [showRulesModal, setShowRulesModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
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

  const userEnergy = user?.energia || 0;
  const energyCost = 15;
  const canPlay = userEnergy >= energyCost;

  const handleStartGame = () => {
    console.log('Iniciando partida de Survival...');
    // Aquí iría la navegación al juego real
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
          <span className="energy-max">/{user?.energiaMaxima || 100}</span>
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
            {weeklyLeaderboard.map((entry) => (
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
    </div>
  );
};

export default Survival;
