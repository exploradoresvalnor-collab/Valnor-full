import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { rankingService } from '../../services';
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
  'warrior': '⚔️',
  'mage': '🔮',
  'archer': '🗡️',
  'paladin': '💚',
};

/** Map backend ranking entry */
function mapRankingPlayer(raw: any, index: number): RankingPlayer {
  return {
    posicion: raw.posicion || raw.position || raw.rank || index + 1,
    id: raw._id || raw.id || raw.userId || `p${index}`,
    username: raw.username || raw.nombre || raw.name || 'Jugador',
    nivel: raw.nivel || raw.level || 1,
    clase: raw.clase || raw.class || raw.characterClass || 'Guerrero',
    valor: raw.valor || raw.value || raw.score || raw.val || 0,
    cambio: raw.cambio || raw.change || 0,
  };
}

const Ranking: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [category, setCategory] = useState<RankingCategory>('val');
  const [myRank, setMyRank] = useState<number | null>(null);
  const [rankings, setRankings] = useState<RankingPlayer[]>([]);
  const [rankLoading, setRankLoading] = useState(true);

  // Fetch rankings from backend
  useEffect(() => {
    if (loading) return;
    let cancelled = false;

    const fetchRankings = async () => {
      setRankLoading(true);
      try {
        const [leaderboard, myRanking] = await Promise.all([
          rankingService.getLeaderboard(category, { limit: '20' }).catch(() => null),
          rankingService.getMyRanking().catch(() => null),
        ]);

        if (cancelled) return;

        // Process leaderboard
        if (leaderboard) {
          const lb = leaderboard as any;
          const entries = lb.rankings || lb.leaderboard || lb.data || (Array.isArray(lb) ? lb : []);
          if (Array.isArray(entries) && entries.length > 0) {
            setRankings(entries.map(mapRankingPlayer));
          } else {
            setRankings([]);
          }
        } else {
          // Try general ranking as fallback
          const general = await rankingService.getGeneralRanking({ limit: '20' }).catch(() => null);
          if (!cancelled && general) {
            const g = general as any;
            const entries = g.rankings || g.data || (Array.isArray(g) ? g : []);
            setRankings(Array.isArray(entries) ? entries.map(mapRankingPlayer) : []);
          }
        }

        // My position
        if (myRanking) {
          const mr = myRanking as any;
          setMyRank(mr.posicion || mr.position || mr.rank || null);
        }
      } catch (err) {
        console.error('[Ranking] Error:', err);
      } finally {
        if (!cancelled) setRankLoading(false);
      }
    };

    fetchRankings();
    return () => { cancelled = true; };
  }, [loading, category]);

  if (loading || rankLoading) {
    return (
      <div className="ranking-loading">
        <div className="loading-spinner" />
        <p>Cargando ranking...</p>
      </div>
    );
  }

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
        {rankings.length >= 3 ? (
        <div className="podium">
          {/* Second Place */}
          <div className="podium-place second">
            <div className="podium-avatar">🥈</div>
            <span className="podium-username">{rankings[1]?.username}</span>
            <span className="podium-value">
              {formatValue(rankings[1]?.valor || 0, category)} {info.unit}
            </span>
            <div className="podium-stand" style={{ backgroundColor: info.color + '40' }}>2</div>
          </div>

          {/* First Place */}
          <div className="podium-place first">
            <div className="crown">👑</div>
            <div className="podium-avatar">🥇</div>
            <span className="podium-username">{rankings[0]?.username}</span>
            <span className="podium-value">
              {formatValue(rankings[0]?.valor || 0, category)} {info.unit}
            </span>
            <div className="podium-stand" style={{ backgroundColor: info.color }}>1</div>
          </div>

          {/* Third Place */}
          <div className="podium-place third">
            <div className="podium-avatar">🥉</div>
            <span className="podium-username">{rankings[2]?.username}</span>
            <span className="podium-value">
              {formatValue(rankings[2]?.valor || 0, category)} {info.unit}
            </span>
            <div className="podium-stand" style={{ backgroundColor: info.color + '30' }}>3</div>
          </div>
        </div>
        ) : (
          <div className="no-selection" style={{ textAlign: 'center', padding: '2rem' }}>
            <p>No hay datos de ranking disponibles aún</p>
          </div>
        )}

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
