/**
 * Profile Page - Página de perfil del usuario
 * 
 * Muestra:
 * - Información del jugador
 * - Estadísticas generales
 * - Historial de logros
 * - Equipo actual
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore, usePlayerStats, usePlayerWallet } from '../../stores/playerStore';
import { useTeamMembers } from '../../stores/teamStore';
import { useIsGuest } from '../../stores/sessionStore';
import { GuestBanner } from '../../components/ui';
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
  
  // Mock achievements - en producción vendría del backend
  const achievements = [
    { id: 1, name: 'Primer Paso', desc: 'Completa tu primera mazmorra', unlocked: true, icon: '🏆' },
    { id: 2, name: 'Coleccionista', desc: 'Colecciona 10 personajes', unlocked: stats.charactersOwned >= 10, icon: '📚' },
    { id: 3, name: 'Superviviente', desc: 'Sobrevive 50 oleadas en Survival', unlocked: false, icon: '🛡️' },
    { id: 4, name: 'Comerciante', desc: 'Realiza 5 transacciones en el marketplace', unlocked: false, icon: '💰' },
    { id: 5, name: 'Veterano', desc: 'Alcanza nivel 50', unlocked: player.level >= 50, icon: '⭐' },
    { id: 6, name: 'Maestro', desc: 'Completa todas las mazmorras', unlocked: false, icon: '👑' },
  ];
  
  // Mock battle history
  const battleHistory = [
    { id: 1, type: 'dungeon', name: 'Cavernas Oscuras', result: 'victory', date: new Date(Date.now() - 3600000) },
    { id: 2, type: 'survival', name: 'Arena Survival', result: 'defeat', waves: 23, date: new Date(Date.now() - 7200000) },
    { id: 3, type: 'dungeon', name: 'Bosque Encantado', result: 'victory', date: new Date(Date.now() - 86400000) },
    { id: 4, type: 'survival', name: 'Arena Survival', result: 'defeat', waves: 45, date: new Date(Date.now() - 172800000) },
  ];
  
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
