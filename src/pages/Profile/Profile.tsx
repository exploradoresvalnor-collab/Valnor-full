/**
 * Profile Page - Página de perfil del usuario (rediseñado)
 *
 * Muestra:
 * - Información del jugador con glassmorphism
 * - Estadísticas generales con iconos react-icons
 * - Historial de logros
 * - Equipo actual
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore, usePlayerStats, usePlayerWallet } from '../../stores/playerStore';
import { useTeamMembers } from '../../stores/teamStore';
import { useIsGuest } from '../../stores/sessionStore';
import { GuestBanner } from '../../components/ui';
import { CHARACTER_MODEL_MAP } from '../../config/character-models.config';
import { rankingService, userService } from '../../services';
import {
  GiCrossedSwords,
  GiCastle,
  GiWaveStrike,
  GiOpenTreasureChest,
  GiTrophy,
  GiScrollUnfurled,
  GiPadlock,
  GiTwoCoins,
  GiCrystalGrowth,
  GiWizardFace,
  GiThreeFriends,
  GiGamepad,
  GiChart,
  GiCheckMark,
  GiSwordsPower,
  GiSkullCrossedBones,
  GiLaurelsTrophy,
  GiBookmark,
  GiShield,
  GiStarMedal,
} from 'react-icons/gi';
import { FiArrowLeft, FiSettings, FiUser } from 'react-icons/fi';
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
  const [achievements, setAchievements] = useState<
    { id: number | string; name: string; desc: string; unlocked: boolean; icon: string }[]
  >([]);
  const [battleHistory, setBattleHistory] = useState<
    { id: number | string; type: string; name: string; result: string; waves?: number; date: Date }[]
  >([]);
  const [profileLoading, setProfileLoading] = useState(true);

  /* ── fetch ───────────────────────────────────────── */
  useEffect(() => {
    if (isGuest) {
      setProfileLoading(false);
      return;
    }

    let cancelled = false;

    const fetchProfile = async () => {
      setProfileLoading(true);
      try {
        const [allAchievements, me] = await Promise.all([
          rankingService.getAllAchievements().catch(() => []), // Fallback a array vacío si falla
          userService.getMe().catch(() => null),
        ]);

        if (cancelled) return;

        if (me) {
          const m = me as any;
          const store = usePlayerStore.getState();
          const personajes = m.personajes || [];
          const activeChar = personajes.find((p: any) => p.personajeId === m.personajeActivoId) || personajes[0];
          const realStats = activeChar?.stats || { atk: 0, vida: 0, defensa: 0 };
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
              tickets: m.boletos ?? store.tickets,
              // Stats reales
              currentHealth: activeChar?.saludActual ?? store.currentHealth,
              maxHealth: activeChar?.saludMaxima ?? store.maxHealth,
              realStats: {
                atk: realStats.atk || 0,
                vida: realStats.vida || 0,
                defensa: realStats.defensa || 0,
              },
              stats: {
                ...store.stats,
                attack: realStats.atk || 0,
                defense: realStats.defensa || 0,
                vitality: realStats.vida || 0,
              },
              // Stats de progreso
              charactersOwned: personajes.length || 0,
              battlesWon: m.estadisticas?.batallasGanadas ?? m.battlesWon ?? store.battlesWon,
              battlesLost: m.estadisticas?.batallasPerdidas ?? m.battlesLost ?? store.battlesLost,
              dungeonsCompleted: m.estadisticas?.mazmorrasCompletadas ?? m.dungeonsCompleted ?? store.dungeonsCompleted,
              maxSurvivalWave: m.estadisticas?.oleadaMaxima ?? m.maxSurvivalWave ?? store.maxSurvivalWave,
            });
          }
        }

        if (Array.isArray(allAchievements) && allAchievements.length > 0) {
          setAchievements(
            (allAchievements as any[]).map((a: any) => ({
              id: a._id || a.id,
              name: a.nombre || a.name || 'Logro',
              desc: a.descripcion || a.description || '',
              unlocked: a.desbloqueado || a.unlocked || false,
              icon: a.icono || a.icon || 'trophy',
            })),
          );
        } else {
          setAchievements([
            { id: 1, name: 'Primer Paso', desc: 'Completa tu primera mazmorra', unlocked: stats.dungeonsCompleted > 0, icon: 'trophy' },
            { id: 2, name: 'Coleccionista', desc: 'Colecciona 10 personajes', unlocked: stats.charactersOwned >= 10, icon: 'bookmark' },
            { id: 3, name: 'Superviviente', desc: 'Sobrevive 50 oleadas en Survival', unlocked: stats.maxSurvivalWave >= 50, icon: 'shield' },
            { id: 4, name: 'Veterano', desc: 'Alcanza nivel 50', unlocked: player.level >= 50, icon: 'star' },
          ]);
        }

        try {
          const dashboard = await userService.getDashboard();
          if (!cancelled && dashboard) {
            const d = dashboard as any;
            if (d.historialBatallas || d.battleHistory) {
              const history = d.historialBatallas || d.battleHistory || [];
              setBattleHistory(
                (history as any[]).map((b: any, i: number) => ({
                  id: b._id || b.id || i,
                  type: b.tipo || b.type || 'dungeon',
                  name: b.nombre || b.name || 'Batalla',
                  result: b.resultado || b.result || 'victory',
                  waves: b.oleadas || b.waves,
                  date: new Date(b.fecha || b.date || Date.now()),
                })),
              );
            }
          }
        } catch {
          /* dashboard might not have battle history */
        }
      } catch (err) {
        console.error('[Profile] Error:', err);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    };

    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [isGuest]);

  /* ── helpers ─────────────────────────────────────── */
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (hours < 1) return 'Hace menos de 1h';
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
  };

  const achievementIconMap: Record<string, React.ReactNode> = {
    trophy: <GiTrophy />,
    bookmark: <GiBookmark />,
    shield: <GiShield />,
    star: <GiStarMedal />,
  };

  const tabs: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
    { id: 'stats', label: 'Estadísticas', icon: <GiChart /> },
    { id: 'achievements', label: 'Logros', icon: <GiTrophy /> },
    { id: 'history', label: 'Historial', icon: <GiScrollUnfurled /> },
  ];

  const unlockedAchievements = achievements.filter((a) => a.unlocked).length;
  const xpPct = player.experienceToNextLevel > 0
    ? Math.min(100, (player.experience / player.experienceToNextLevel) * 100)
    : 0;
  const winRate =
    stats.battlesWon + stats.battlesLost > 0
      ? Math.round((stats.battlesWon / (stats.battlesWon + stats.battlesLost)) * 100)
      : 0;

  /* ── render ──────────────────────────────────────── */
  return (
    <div className="profile-page">
      {/* ── BG layer ── */}
      <div className="prof-bg">
        <div className="prof-bg__nebula" />
        <div className="prof-bg__particles">
          {[...'✦★◆✶✦★◆✶'].map((ch, i) => (
            <span key={i}>{ch}</span>
          ))}
        </div>
      </div>

      {/* ── Header ── */}
      <header className="profile-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft /> Volver
        </button>
        <h1>
          <FiUser className="hdr-icon" /> Mi Perfil
        </h1>
        <button className="settings-btn" onClick={() => navigate('/settings')}>
          <FiSettings /> Ajustes
        </button>
      </header>

      {/* ── Guest Banner ── */}
      {isGuest && (
        <div className="profile-guest-banner">
          <GuestBanner
            message="Estás en modo demo. Crea una cuenta para guardar tu progreso y desbloquear todas las funciones."
            variant="warning"
          />
        </div>
      )}

      {profileLoading && (
        <div className="profile-loading">
          <GiWizardFace className="loading-icon" />
          <span>Cargando perfil…</span>
        </div>
      )}

      <div className="profile-container">
        {/* ═══════════ PLAYER CARD ═══════════ */}
        <aside className="player-card">
          <div className="avatar-section">
            <div className="avatar">
              <GiWizardFace className="avatar-icon" />
            </div>
            <span className="player-level">Nv. {player.level}</span>
          </div>

          <h2 className="player-name">{player.characterName || 'Aventurero'}</h2>

          {/* Quick character selector (permite cambiar personaje activo inmediatamente) */}
          <div className="char-selector">
            <label htmlFor="char-select">Personaje activo</label>
            <select
              id="char-select"
              className="char-select"
              value={player.characterId || ''}
              onChange={(e) => {
                const id = e.target.value || null;
                const cfg = id ? CHARACTER_MODEL_MAP[id] : null;
                usePlayerStore.getState().initPlayer({
                  characterId: id,
                  characterName: cfg?.displayName ?? (id || 'Aventurero'),
                });
              }}
            >
              {Object.keys(CHARACTER_MODEL_MAP).map((key) => (
                <option key={key} value={key}>{CHARACTER_MODEL_MAP[key].displayName}</option>
              ))}
            </select>
          </div>

          {/* XP */}
          <div className="xp-progress">
            <div className="xp-bar">
              <div className="xp-fill" style={{ width: `${xpPct}%` }} />
            </div>
            <span className="xp-text">
              {player.experience} / {player.experienceToNextLevel} XP
            </span>
          </div>

          {/* Wallet */}
          <div className="wallet-info">
            <div className="wallet-item">
              <GiTwoCoins className="wallet-icon gold" />
              <span className="wallet-value">{wallet.gold.toLocaleString()}</span>
              <span className="wallet-label">Oro</span>
            </div>
            <div className="wallet-item">
              <GiCrystalGrowth className="wallet-icon gem" />
              <span className="wallet-value">{wallet.gems}</span>
              <span className="wallet-label">Gemas</span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="quick-stats">
            <div className="quick-stat">
              <GiSwordsPower className="qs-icon" />
              <span className="stat-value">{stats.battlesWon}</span>
              <span className="stat-label">Victorias</span>
            </div>
            <div className="quick-stat">
              <GiCastle className="qs-icon" />
              <span className="stat-value">{stats.dungeonsCompleted}</span>
              <span className="stat-label">Mazmorras</span>
            </div>
            <div className="quick-stat">
              <GiThreeFriends className="qs-icon" />
              <span className="stat-value">{stats.charactersOwned}</span>
              <span className="stat-label">Personajes</span>
            </div>
          </div>
        </aside>

        {/* ═══════════ MAIN CONTENT ═══════════ */}
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

          {/* ─── STATS TAB ─── */}
          {activeTab === 'stats' && (
            <div className="tab-content stats-content">
              <div className="stats-grid">
                {/* Combat */}
                <div className="stat-card">
                  <h3>
                    <GiCrossedSwords className="sc-icon combat" /> Combate
                  </h3>
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
                      <span className="highlight">{winRate}%</span>
                    </div>
                  </div>
                </div>

                {/* Dungeons */}
                <div className="stat-card">
                  <h3>
                    <GiCastle className="sc-icon dungeon" /> Mazmorras
                  </h3>
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

                {/* Survival */}
                <div className="stat-card">
                  <h3>
                    <GiWaveStrike className="sc-icon survival" /> Survival
                  </h3>
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

                {/* Collection */}
                <div className="stat-card">
                  <h3>
                    <GiOpenTreasureChest className="sc-icon collection" /> Colección
                  </h3>
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

              {/* Current team */}
              <div className="team-section">
                <h3>
                  <GiThreeFriends className="sc-icon team" /> Equipo Actual
                </h3>
                <div className="team-grid">
                  {team.length > 0 ? (
                    team.map((member) => (
                      <div key={member.id} className="team-member">
                        <div className="member-avatar">
                          {(member as any).imageUrl ? (
                            <img src={(member as any).imageUrl} alt={member.name} />
                          ) : (
                            <FiUser />
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

          {/* ─── ACHIEVEMENTS TAB ─── */}
          {activeTab === 'achievements' && (
            <div className="tab-content achievements-content">
              <div className="achievements-header">
                <span className="achievements-progress">
                  <GiLaurelsTrophy className="ach-prog-icon" />
                  {unlockedAchievements} / {achievements.length} desbloqueados
                </span>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${achievements.length > 0 ? (unlockedAchievements / achievements.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="achievements-grid">
                {achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className={`achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}`}
                  >
                    <div className="achievement-icon">
                      {ach.unlocked ? (
                        achievementIconMap[ach.icon] || <GiTrophy />
                      ) : (
                        <GiPadlock />
                      )}
                    </div>
                    <div className="achievement-info">
                      <h4>{ach.name}</h4>
                      <p>{ach.desc}</p>
                    </div>
                    {ach.unlocked && (
                      <span className="achievement-badge">
                        <GiCheckMark />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── HISTORY TAB ─── */}
          {activeTab === 'history' && (
            <div className="tab-content history-content">
              <h3>
                <GiScrollUnfurled className="sc-icon" /> Historial de Batallas
              </h3>

              <div className="history-list">
                {battleHistory.map((battle) => (
                  <div key={battle.id} className={`history-item ${battle.result}`}>
                    <div className="history-icon">
                      {battle.type === 'dungeon' ? <GiCastle /> : <GiWaveStrike />}
                    </div>
                    <div className="history-info">
                      <h4>{battle.name}</h4>
                      <span className="history-date">{formatDate(battle.date)}</span>
                    </div>
                    <div className="history-result">
                      <span className={`result-badge ${battle.result}`}>
                        {battle.result === 'victory' ? (
                          <>
                            <GiCheckMark /> Victoria
                          </>
                        ) : (
                          <>
                            <GiSkullCrossedBones /> Derrota
                          </>
                        )}
                      </span>
                      {battle.waves && <span className="waves-count">Oleada {battle.waves}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {battleHistory.length === 0 && (
                <div className="empty-history">
                  <GiGamepad className="empty-icon" />
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
