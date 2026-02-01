import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Ranking.css';

interface RankingPlayer {
  posicion: number;
  id: string;
  username: string;
  nivel: number;
  clase: string;
  valor: number;
  cambio: number;
}

type RankingCategory = 'val' | 'survival' | 'pvp' | 'dungeons';

const mockRankings: Record<RankingCategory, RankingPlayer[]> = {
  val: [
    { posicion: 1, id: 'u1', username: 'CryptoKing', nivel: 45, clase: 'Mago', valor: 1250000, cambio: 0 },
    { posicion: 2, id: 'u2', username: 'DragonSlayer99', nivel: 42, clase: 'Guerrero', valor: 980500, cambio: 2 },
    { posicion: 3, id: 'u3', username: 'ShadowNinja', nivel: 40, clase: 'Pícaro', valor: 875200, cambio: -1 },
    { posicion: 4, id: 'u4', username: 'HealerQueen', nivel: 38, clase: 'Sanador', valor: 720000, cambio: 1 },
    { posicion: 5, id: 'u5', username: 'MysticWizard', nivel: 37, clase: 'Mago', valor: 650000, cambio: -2 },
    { posicion: 6, id: 'u6', username: 'IronTank', nivel: 36, clase: 'Guerrero', valor: 580000, cambio: 3 },
    { posicion: 7, id: 'u7', username: 'SwiftBlade', nivel: 35, clase: 'Pícaro', valor: 520000, cambio: 0 },
    { posicion: 8, id: 'u8', username: 'LightBringer', nivel: 34, clase: 'Sanador', valor: 485000, cambio: -1 },
    { posicion: 9, id: 'u9', username: 'PhoenixKnight', nivel: 33, clase: 'Guerrero', valor: 450000, cambio: 5 },
    { posicion: 10, id: 'u10', username: 'DarkMage', nivel: 32, clase: 'Mago', valor: 420000, cambio: -2 },
  ],
  survival: [
    { posicion: 1, id: 'u3', username: 'ShadowNinja', nivel: 40, clase: 'Pícaro', valor: 158, cambio: 0 },
    { posicion: 2, id: 'u1', username: 'CryptoKing', nivel: 45, clase: 'Mago', valor: 145, cambio: 1 },
    { posicion: 3, id: 'u7', username: 'SwiftBlade', nivel: 35, clase: 'Pícaro', valor: 142, cambio: -1 },
    { posicion: 4, id: 'u6', username: 'IronTank', nivel: 36, clase: 'Guerrero', valor: 138, cambio: 0 },
    { posicion: 5, id: 'u2', username: 'DragonSlayer99', nivel: 42, clase: 'Guerrero', valor: 135, cambio: 2 },
    { posicion: 6, id: 'u5', username: 'MysticWizard', nivel: 37, clase: 'Mago', valor: 130, cambio: -1 },
    { posicion: 7, id: 'u4', username: 'HealerQueen', nivel: 38, clase: 'Sanador', valor: 125, cambio: 0 },
    { posicion: 8, id: 'u9', username: 'PhoenixKnight', nivel: 33, clase: 'Guerrero', valor: 120, cambio: 3 },
    { posicion: 9, id: 'u10', username: 'DarkMage', nivel: 32, clase: 'Mago', valor: 118, cambio: -2 },
    { posicion: 10, id: 'u8', username: 'LightBringer', nivel: 34, clase: 'Sanador', valor: 115, cambio: -1 },
  ],
  pvp: [
    { posicion: 1, id: 'u2', username: 'DragonSlayer99', nivel: 42, clase: 'Guerrero', valor: 2450, cambio: 0 },
    { posicion: 2, id: 'u3', username: 'ShadowNinja', nivel: 40, clase: 'Pícaro', valor: 2380, cambio: 1 },
    { posicion: 3, id: 'u1', username: 'CryptoKing', nivel: 45, clase: 'Mago', valor: 2320, cambio: -1 },
    { posicion: 4, id: 'u7', username: 'SwiftBlade', nivel: 35, clase: 'Pícaro', valor: 2180, cambio: 2 },
    { posicion: 5, id: 'u6', username: 'IronTank', nivel: 36, clase: 'Guerrero', valor: 2100, cambio: -1 },
    { posicion: 6, id: 'u5', username: 'MysticWizard', nivel: 37, clase: 'Mago', valor: 2050, cambio: 0 },
    { posicion: 7, id: 'u9', username: 'PhoenixKnight', nivel: 33, clase: 'Guerrero', valor: 1980, cambio: 4 },
    { posicion: 8, id: 'u10', username: 'DarkMage', nivel: 32, clase: 'Mago', valor: 1920, cambio: -2 },
    { posicion: 9, id: 'u4', username: 'HealerQueen', nivel: 38, clase: 'Sanador', valor: 1850, cambio: -1 },
    { posicion: 10, id: 'u8', username: 'LightBringer', nivel: 34, clase: 'Sanador', valor: 1800, cambio: 0 },
  ],
  dungeons: [
    { posicion: 1, id: 'u1', username: 'CryptoKing', nivel: 45, clase: 'Mago', valor: 487, cambio: 0 },
    { posicion: 2, id: 'u2', username: 'DragonSlayer99', nivel: 42, clase: 'Guerrero', valor: 456, cambio: 0 },
    { posicion: 3, id: 'u6', username: 'IronTank', nivel: 36, clase: 'Guerrero', valor: 423, cambio: 2 },
    { posicion: 4, id: 'u4', username: 'HealerQueen', nivel: 38, clase: 'Sanador', valor: 412, cambio: -1 },
    { posicion: 5, id: 'u5', username: 'MysticWizard', nivel: 37, clase: 'Mago', valor: 398, cambio: 1 },
    { posicion: 6, id: 'u3', username: 'ShadowNinja', nivel: 40, clase: 'Pícaro', valor: 385, cambio: -2 },
    { posicion: 7, id: 'u7', username: 'SwiftBlade', nivel: 35, clase: 'Pícaro', valor: 367, cambio: 0 },
    { posicion: 8, id: 'u8', username: 'LightBringer', nivel: 34, clase: 'Sanador', valor: 352, cambio: 1 },
    { posicion: 9, id: 'u9', username: 'PhoenixKnight', nivel: 33, clase: 'Guerrero', valor: 340, cambio: -1 },
    { posicion: 10, id: 'u10', username: 'DarkMage', nivel: 32, clase: 'Mago', valor: 328, cambio: 0 },
  ],
};

const categoryInfo: Record<RankingCategory, { icon: string; title: string; unit: string; color: string }> = {
  val: { icon: '💰', title: 'Riqueza (VAL)', unit: 'VAL', color: '#f59e0b' },
  survival: { icon: '⚡', title: 'Survival', unit: 'oleadas', color: '#ef4444' },
  pvp: { icon: '⚔️', title: 'PvP Arena', unit: 'ELO', color: '#8b5cf6' },
  dungeons: { icon: '🏰', title: 'Dungeons', unit: 'completadas', color: '#06b6d4' },
};

const classIcons: Record<string, string> = {
  'Guerrero': '⚔️',
  'Mago': '🔮',
  'Pícaro': '🗡️',
  'Sanador': '💚',
};

const Ranking: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [category, setCategory] = useState<RankingCategory>('val');
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Simular posición del usuario
    setMyRank(Math.floor(Math.random() * 500) + 50);
  }, [category]);

  if (loading) {
    return (
      <div className="ranking-loading">
        <div className="loading-spinner" />
        <p>Cargando ranking...</p>
      </div>
    );
  }

  const rankings = mockRankings[category];
  const info = categoryInfo[category];

  const formatValue = (value: number, cat: RankingCategory) => {
    if (cat === 'val') {
      return value >= 1000000 
        ? `${(value / 1000000).toFixed(1)}M` 
        : value >= 1000 
          ? `${(value / 1000).toFixed(0)}K`
          : value.toString();
    }
    return value.toLocaleString();
  };

  return (
    <div className="ranking-page">
      {/* Header */}
      <header className="ranking-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Volver
        </button>
        <h1>🏆 Rankings</h1>
        <div className="season-badge">
          <span className="season-icon">🎮</span>
          <span>Temporada 1</span>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="category-tabs">
        {(Object.keys(categoryInfo) as RankingCategory[]).map((cat) => (
          <button
            key={cat}
            className={`category-tab ${category === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
            style={{ 
              '--tab-color': categoryInfo[cat].color 
            } as React.CSSProperties}
          >
            <span className="tab-icon">{categoryInfo[cat].icon}</span>
            <span className="tab-title">{categoryInfo[cat].title}</span>
          </button>
        ))}
      </div>

      <div className="ranking-container">
        {/* My Position Card */}
        <div className="my-position-card" style={{ borderColor: info.color }}>
          <div className="my-position-header">
            <span className="my-icon">👤</span>
            <span className="my-label">Tu Posición</span>
          </div>
          <div className="my-position-content">
            <div className="my-rank">
              <span className="rank-number">#{myRank}</span>
              <span className="rank-category">en {info.title}</span>
            </div>
            <div className="my-info">
              <span className="my-username">{user?.username || 'Jugador'}</span>
              <span className="my-level">Nv. {user?.personajes?.[0]?.nivel || 1}</span>
            </div>
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="podium">
          {/* Second Place */}
          <div className="podium-place second">
            <div className="podium-avatar">🥈</div>
            <span className="podium-username">{rankings[1].username}</span>
            <span className="podium-value">
              {formatValue(rankings[1].valor, category)} {info.unit}
            </span>
            <div className="podium-stand" style={{ backgroundColor: info.color + '40' }}>2</div>
          </div>

          {/* First Place */}
          <div className="podium-place first">
            <div className="crown">👑</div>
            <div className="podium-avatar">🥇</div>
            <span className="podium-username">{rankings[0].username}</span>
            <span className="podium-value">
              {formatValue(rankings[0].valor, category)} {info.unit}
            </span>
            <div className="podium-stand" style={{ backgroundColor: info.color }}>1</div>
          </div>

          {/* Third Place */}
          <div className="podium-place third">
            <div className="podium-avatar">🥉</div>
            <span className="podium-username">{rankings[2].username}</span>
            <span className="podium-value">
              {formatValue(rankings[2].valor, category)} {info.unit}
            </span>
            <div className="podium-stand" style={{ backgroundColor: info.color + '30' }}>3</div>
          </div>
        </div>

        {/* Rankings Table */}
        <div className="rankings-table">
          <div className="table-header">
            <span className="col-rank">#</span>
            <span className="col-player">Jugador</span>
            <span className="col-class">Clase</span>
            <span className="col-level">Nivel</span>
            <span className="col-value">{info.unit.toUpperCase()}</span>
            <span className="col-change">Cambio</span>
          </div>

          <div className="table-body">
            {rankings.slice(3).map((player) => (
              <div 
                key={player.id} 
                className={`table-row ${player.username === user?.username ? 'is-me' : ''}`}
              >
                <span className="col-rank">{player.posicion}</span>
                <span className="col-player">
                  <span className="player-avatar">🎮</span>
                  {player.username}
                </span>
                <span className="col-class">
                  {classIcons[player.clase]} {player.clase}
                </span>
                <span className="col-level">Nv.{player.nivel}</span>
                <span className="col-value" style={{ color: info.color }}>
                  {formatValue(player.valor, category)}
                </span>
                <span className={`col-change ${player.cambio > 0 ? 'up' : player.cambio < 0 ? 'down' : ''}`}>
                  {player.cambio > 0 && '↑'}
                  {player.cambio < 0 && '↓'}
                  {player.cambio === 0 && '–'}
                  {player.cambio !== 0 && Math.abs(player.cambio)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rewards Info */}
        <div className="rewards-info">
          <h3>🎁 Recompensas de Temporada</h3>
          <div className="rewards-grid">
            <div className="reward-tier gold">
              <span className="tier-icon">🥇</span>
              <span className="tier-range">Top 1-10</span>
              <span className="tier-reward">10,000 VAL + Título Exclusivo</span>
            </div>
            <div className="reward-tier silver">
              <span className="tier-icon">🥈</span>
              <span className="tier-range">Top 11-50</span>
              <span className="tier-reward">5,000 VAL + Skin Raro</span>
            </div>
            <div className="reward-tier bronze">
              <span className="tier-icon">🥉</span>
              <span className="tier-range">Top 51-100</span>
              <span className="tier-reward">2,000 VAL + 50 Boletos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ranking;
