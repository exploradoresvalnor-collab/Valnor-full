/**
 * Profile Page - Página de perfil del usuario
 * 
 * Muestra:
 * - Información del jugador
 * - Estadísticas generales
 * - Historial de logros
 * - Equipo actual
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore, usePlayerStats, usePlayerWallet } from '../../stores/playerStore';
import { useTeamMembers } from '../../stores/teamStore';
import { useIsGuest } from '../../stores/sessionStore';
import { GuestBanner } from '../../components/ui';
import { rankingService, userService } from '../../services';
import './Profile.css';

type ProfileTab = 'stats' | 'achievements' | 'history';

export function Profile() {
  const navigate = useNavigate();
  const player = usePlayerStore();
  const stats = usePlayerStats();
  const wallet = usePlayerWallet();
  const team = useTeamMembers();
  const isGuest = useIsGuest();
  
  const [activeTab, setActiveTab] = useState<ProfileTab>('stats');
  const [achievements, setAchievements] = useState<{id: number|string; name: string; desc: string; unlocked: boolean; icon: string}[]>([]);
  const [battleHistory, setBattleHistory] = useState<{id: number|string; type: string; name: string; result: string; waves?: number; date: Date}[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch real profile data
  useEffect(() => {
    if (isGuest) {
      setProfileLoading(false);
      return;
    }

    let cancelled = false;

    const fetchProfile = async () => {
      setProfileLoading(true);
      try {
        // Fetch achievements and profile data in parallel
        const [allAchievements, me, myProfile] = await Promise.all([
          rankingService.getAllAchievements().catch(() => []),
          userService.getMe().catch(() => null),
          rankingService.getMyPublicProfile().catch(() => null),
        ]);

        if (cancelled) return;

        // Update player store with latest server data
        if (me) {
          const m = me as any;
          const store = usePlayerStore.getState();
          if (m.username || m.nombre) {
            store.initPlayer({
              characterId: m._id || m.id || store.characterId,
              characterName: m.username || m.nombre || store.characterName,
              characterClass: m.clase || store.characterClass || 'warrior',
              level: m.nivel || m.level || store.level,
              gold: m.val ?? store.gold,
              gems: m.evo ?? store.gems,
              energy: m.energia ?? store.energy,
              maxEnergy: m.energiaMaxima ?? store.maxEnergy,
            });
          }
        }

        // Map achievements
        if (Array.isArray(allAchievements) && allAchievements.length > 0) {
          setAchievements((allAchievements as any[]).map((a: any) => ({
            id: a._id || a.id,
            name: a.nombre || a.name || 'Logro',
            desc: a.descripcion || a.description || '',
            unlocked: a.desbloqueado || a.unlocked || false,
            icon: a.icono || a.icon || '🏆',
          })));
        } else {
          // Fallback static achievements
          setAchievements([
            { id: 1, name: 'Primer Paso', desc: 'Completa tu primera mazmorra', unlocked: stats.dungeonsCompleted > 0, icon: '🏆' },
            { id: 2, name: 'Coleccionista', desc: 'Colecciona 10 personajes', unlocked: stats.charactersOwned >= 10, icon: '📚' },
            { id: 3, name: 'Superviviente', desc: 'Sobrevive 50 oleadas en Survival', unlocked: stats.maxSurvivalWave >= 50, icon: '🛡️' },
            { id: 4, name: 'Veterano', desc: 'Alcanza nivel 50', unlocked: player.level >= 50, icon: '⭐' },
          ]);
        }

        // Battle history from dashboard
        try {
          const dashboard = await userService.getDashboard();
          if (!cancelled && dashboard) {
            const d = dashboard as any;
            if (d.historialBatallas || d.battleHistory) {
              const history = d.historialBatallas || d.battleHistory || [];
              setBattleHistory((history as any[]).map((b: any, i: number) => ({
                id: b._id || b.id || i,
                type: b.tipo || b.type || 'dungeon',
                name: b.nombre || b.name || 'Batalla',
                result: b.resultado || b.result || 'victory',
                waves: b.oleadas || b.waves,
                date: new Date(b.fecha || b.date || Date.now()),
              })));
            }
          }
        } catch {
          // Dashboard might not have battle history
        }
      } catch (err) {
        console.error('[Profile] Error:', err);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    };

    fetchProfile();
    return () => { cancelled = true; };
  }, [isGuest]);
  
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (hours < 1) return 'Hace menos de 1h';
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
  };
  
  const tabs: { id: ProfileTab; label: string; icon: string }[] = [
    { id: 'stats', label: 'Estadísticas', icon: '📊' },
    { id: 'achievements', label: 'Logros', icon: '🏆' },
    { id: 'history', label: 'Historial', icon: '📜' },
  ];
  
  const unlockedAchievements = achievements.filter(a => a.unlocked).length;
  
  return (
    <div className="profile-page">
      {/* Header */}
      <header className="profile-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Volver
        </button>
        <h1>👤 Mi Perfil</h1>
        <button className="settings-btn" onClick={() => navigate('/settings')}>
          ⚙️ Configuración
        </button>
      </header>
      
      {/* Banner para invitados */}
      {isGuest && (
        <div className="profile-guest-banner">
          <GuestBanner 
            message="Estás en modo demo. Crea una cuenta para guardar tu progreso y desbloquear todas las funciones."
            variant="warning"
          />
        </div>
      )}
      
      <div className="profile-container">
        {/* Player Card */}
        <aside className="player-card">
          <div className="avatar-section">
            <div className="avatar">
              <span className="avatar-icon">🧙</span>
            </div>
            <span className="player-level">Nv. {player.level}</span>
          </div>
          
          <h2 className="player-name">{player.characterName || 'Aventurero'}</h2>
          
          <div className="xp-progress">
            <div className="xp-bar">
              <div 
                className="xp-fill" 
                style={{ width: `${(player.experience / player.experienceToNextLevel) * 100}%` }}
              />
            </div>
            <span className="xp-text">
              {player.experience} / {player.experienceToNextLevel} XP
            </span>
          </div>
          
          <div className="wallet-info">
            <div className="wallet-item">
              <span className="wallet-icon">🪙</span>
              <span className="wallet-value">{wallet.gold.toLocaleString()}</span>
              <span className="wallet-label">Oro</span>
            </div>
            <div className="wallet-item">
              <span className="wallet-icon">💎</span>
              <span className="wallet-value">{wallet.gems}</span>
              <span className="wallet-label">Gemas</span>
            </div>
          </div>
          
          <div className="quick-stats">
            <div className="quick-stat">
              <span className="stat-value">{stats.battlesWon}</span>
              <span className="stat-label">Victorias</span>
            </div>
            <div className="quick-stat">
              <span className="stat-value">{stats.dungeonsCompleted}</span>
              <span className="stat-label">Mazmorras</span>
            </div>
            <div className="quick-stat">
              <span className="stat-value">{stats.charactersOwned}</span>
              <span className="stat-label">Personajes</span>
            </div>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="profile-content">
          {/* Tabs */}
          <div className="profile-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
          
          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div className="tab-content stats-content">
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>⚔️ Combate</h3>
                  <div className="stat-list">
                    <div className="stat-row">
                      <span>Batallas Totales</span>
                      <span>{stats.battlesWon + stats.battlesLost}</span>
                    </div>
                    <div className="stat-row">
                      <span>Victorias</span>
                      <span className="positive">{stats.battlesWon}</span>
                    </div>
                    <div className="stat-row">
                      <span>Derrotas</span>
                      <span className="negative">{stats.battlesLost}</span>
                    </div>
                    <div className="stat-row">
                      <span>% Victoria</span>
                      <span>
                        {stats.battlesWon + stats.battlesLost > 0
                          ? Math.round((stats.battlesWon / (stats.battlesWon + stats.battlesLost)) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <h3>🏰 Mazmorras</h3>
                  <div className="stat-list">
                    <div className="stat-row">
                      <span>Completadas</span>
                      <span>{stats.dungeonsCompleted}</span>
                    </div>
                    <div className="stat-row">
                      <span>Jefes Derrotados</span>
                      <span>{stats.dungeonsCompleted}</span>
                    </div>
                    <div className="stat-row">
                      <span>Mejor Tiempo</span>
                      <span>--:--</span>
                    </div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <h3>🌊 Survival</h3>
                  <div className="stat-list">
                    <div className="stat-row">
                      <span>Mejor Oleada</span>
                      <span className="highlight">{stats.maxSurvivalWave}</span>
                    </div>
                    <div className="stat-row">
                      <span>Partidas Totales</span>
                      <span>--</span>
                    </div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <h3>📦 Colección</h3>
                  <div className="stat-list">
                    <div className="stat-row">
                      <span>Personajes</span>
                      <span>{stats.charactersOwned}</span>
                    </div>
                    <div className="stat-row">
                      <span>Equipamiento</span>
                      <span>--</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Current Team */}
              <div className="team-section">
                <h3>🎭 Equipo Actual</h3>
                <div className="team-grid">
                  {team.length > 0 ? (
                    team.map((member) => (
                      <div key={member.id} className="team-member">
                        <div className="member-avatar">
                          {member.imageUrl ? (
                            <img src={member.imageUrl} alt={member.name} />
                          ) : (
                            <span>👤</span>
                          )}
                        </div>
                        <span className="member-name">{member.name}</span>
                        <span className="member-level">Nv. {member.level}</span>
                      </div>
                    ))
                  ) : (
                    <p className="no-team">No hay personajes en el equipo</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div className="tab-content achievements-content">
              <div className="achievements-header">
                <span className="achievements-progress">
                  {unlockedAchievements} / {achievements.length} desbloqueados
                </span>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${(unlockedAchievements / achievements.length) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="achievements-grid">
                {achievements.map((achievement) => (
                  <div 
                    key={achievement.id}
                    className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                  >
                    <div className="achievement-icon">
                      {achievement.unlocked ? achievement.icon : '🔒'}
                    </div>
                    <div className="achievement-info">
                      <h4>{achievement.name}</h4>
                      <p>{achievement.desc}</p>
                    </div>
                    {achievement.unlocked && (
                      <span className="achievement-badge">✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="tab-content history-content">
              <h3>📜 Historial de Batallas</h3>
              
              <div className="history-list">
                {battleHistory.map((battle) => (
                  <div key={battle.id} className={`history-item ${battle.result}`}>
                    <div className="history-icon">
                      {battle.type === 'dungeon' ? '🏰' : '🌊'}
                    </div>
                    <div className="history-info">
                      <h4>{battle.name}</h4>
                      <span className="history-date">{formatDate(battle.date)}</span>
                    </div>
                    <div className="history-result">
                      <span className={`result-badge ${battle.result}`}>
                        {battle.result === 'victory' ? '✓ Victoria' : '✗ Derrota'}
                      </span>
                      {battle.waves && (
                        <span className="waves-count">Oleada {battle.waves}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {battleHistory.length === 0 && (
                <div className="empty-history">
                  <span>🎮</span>
                  <p>Aún no tienes batallas registradas</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Profile;
