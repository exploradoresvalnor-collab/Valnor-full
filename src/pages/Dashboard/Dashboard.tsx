/**
 * Dashboard Principal - Valnor
 * Layout profesional con react-icons/gi + fondo animado CSS
 * Sin escena 3D de fondo para evitar WebGL context-loss
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../stores/sessionStore';
import { usePlayerStore, usePlayerLevel, usePlayerHealth } from '../../stores/playerStore';
import { useGameStore } from '../../stores/gameStore';
import { useGameModeStore, useGameMode } from '../../stores/gameModeStore';
import { useActiveTeam, useTeamPower, useTeamStore } from '../../stores/teamStore';
import { userService, characterService, teamService } from '../../services';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../hooks/useAuth';
import { mapToShowcase, mapToTeamMember, mapActivity, findActiveCharacter, mapStatsES } from '../../utils/mappers';
import { EnergyBar, InventorySummary } from '../../components/ui';
import { NotificationBell } from '../../components/notifications';
import { TeamShowcase3D, type ShowcaseCharacter } from '../../engine/components/TeamShowcase3D';

// ── react-icons ────────────────────────────────────────────
import {
  GiCrossedSwords,
  GiSkullCrossedBones,
  GiShop,
  GiSwapBag,
  GiThreeFriends,
  GiTrophy,
  GiTwoCoins,
  GiCrystalGrowth,
  GiPowerLightning,
  GiWizardStaff,
  GiHighShot,
  GiKnightBanner,
  GiChart,
  GiKnapsack,
  GiSpellBook,
  GiPadlock,
  GiHealthNormal,
  GiUpgrade,
  GiOpenTreasureChest,
  GiSwordman,
  GiStarFormation,
  GiScrollUnfurled,
  GiSwordsEmblem,
} from 'react-icons/gi';
import {
  FiSettings,
  FiLogOut,
  FiUser,
  FiRefreshCw,
  FiPlus,
} from 'react-icons/fi';

import './Dashboard.css';

// ============================================================
// HELPERS
// ============================================================

function getClassIcon(cls: string, size = 22) {
  switch (cls) {
    case 'warrior': return <GiSwordman size={size} />;
    case 'mage':    return <GiWizardStaff size={size} />;
    case 'archer':  return <GiHighShot size={size} />;
    case 'paladin': return <GiKnightBanner size={size} />;
    default:        return <FiUser size={size} />;
  }
}

// ============================================================
// SUB-COMPONENTES UI
// ============================================================

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  color: string;
  onClick: () => void;
  locked?: boolean;
  lockMessage?: string;
  badge?: React.ReactNode;
  big?: boolean;
}

function ActionCard({ icon, title, subtitle, color, onClick, locked, lockMessage, badge, big }: ActionCardProps) {
  return (
    <button
      className={`action-card action-card--${color} ${locked ? 'locked' : ''} ${big ? 'action-card--big' : ''}`}
      onClick={locked ? undefined : onClick}
      disabled={locked}
      title={locked ? lockMessage : undefined}
    >
      {/* glow bg */}
      <span className="action-card__glow" />

      <span className="action-card__icon">{icon}</span>
      <span className="action-card__body">
        <span className="action-card__title">{title}</span>
        {subtitle && <span className="action-card__sub">{subtitle}</span>}
      </span>

      {locked && <span className="action-card__lock"><GiPadlock size={16} /></span>}
      {badge && <span className="action-card__badge">{badge}</span>}
    </button>
  );
}

interface StatBarProps {
  label: string;
  current: number;
  max: number;
  color: string;
  icon: React.ReactNode;
}

function StatBar({ label, current, max, color, icon }: StatBarProps) {
  const pct = Math.min(100, (current / max) * 100);
  return (
    <div className="stat-bar">
      <div className="stat-bar__head">
        <span className="stat-bar__icon" style={{ color }}>{icon}</span>
        <span className="stat-bar__label">{label}</span>
        <span className="stat-bar__val" style={{ color }}>{current}/{max}</span>
      </div>
      <div className="stat-bar__track">
        <div className="stat-bar__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ============================================================
// DASHBOARD
// ============================================================

const Dashboard = () => {
  const navigate = useNavigate();
  const { endSession } = useSessionStore();
  const { logout } = useAuth();
  const gameMode = useGameMode();
  const clearGameMode = useGameModeStore((s) => s.clearMode);
  const setGameMode = useGameModeStore((s) => s.setMode);

  const characterId = usePlayerStore((s) => s.characterId);
  const characterName = usePlayerStore((s) => s.characterName);
  const characterClass = usePlayerStore((s) => s.characterClass);
  const gold = usePlayerStore((s) => s.gold);
  const gems = usePlayerStore((s) => s.gems);
  const stats = usePlayerStore((s) => s.stats);
  const initPlayer = usePlayerStore((s) => s.initPlayer);

  const { level, exp, expRequired } = usePlayerLevel();
  const { current: hp, max: maxHp } = usePlayerHealth();
  const { quality } = useGameStore();

  const [showProfile, setShowProfile] = useState(false);
  const [, setDashboardLoading] = useState(false);

  const playerName = characterName || 'Aventurero';
  const playerClass = characterClass || 'warrior';

  // ── Backend data ──────────────────────────────────────────
  const [recentActivity, setRecentActivity] = useState<{ id: number; text: string; time: string; type: string }[]>([]);
  const [teamPersonajes, setTeamPersonajes] = useState<ShowcaseCharacter[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);

  const activeTeam = useActiveTeam();
  const teamPower = useTeamPower();

  // ★ Personajes del equipo activo para el showcase 3D
  // Prioridad: teamPersonajes (API teams) > personajes del usuario logeado > activeTeam store
  const teamShowcasePersonajes = useMemo(() => {
    // 1. Datos directos del API de teams (más confiable)
    if (teamPersonajes.length > 0) return teamPersonajes;
    // 2. Fallback: construir desde activeTeam del Zustand store
    if (activeTeam.length > 0) {
      return activeTeam.map(mapToShowcase);
    }
    return [];
  }, [teamPersonajes, activeTeam]);

  // Poder total del showcase — suma REAL de stats (atk + vida + defensa) de cada personaje
  const teamShowcasePower = useMemo(() => {
    return teamShowcasePersonajes.reduce((sum, p) => {
      if (p.stats) {
        return sum + p.stats.atk + Math.floor(p.stats.vida / 10) + p.stats.defensa;
      }
      return sum + (p.nivel || 1) * 10;
    }, 0);
  }, [teamShowcasePersonajes]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setDashboardLoading(true);
      try {
        // ── 1) Datos inmediatos del usuario ya logeado (localStorage) ──
        const storedUser = authService.getUser();
        if (storedUser?.personajes && Array.isArray(storedUser.personajes) && storedUser.personajes.length > 0) {
          // NO usar todos los personajes como equipo — esperar datos del teams API

          // Actualizar playerStore con stats del personaje activo (datos inmediatos)
          const activePersonaje = findActiveCharacter(storedUser.personajes, storedUser.personajeActivoId);
          if (activePersonaje) {
            const pStats = mapStatsES(activePersonaje.stats || {});
            const storeImm = usePlayerStore.getState();
            storeImm.initPlayer({
              currentHealth: (activePersonaje as any).saludActual ?? storeImm.currentHealth,
              maxHealth: (activePersonaje as any).saludMaxima ?? storeImm.maxHealth,
              realStats: pStats,
              stats: { ...storeImm.stats, attack: pStats.atk || 0, defense: pStats.defensa || 0, vitality: pStats.vida || 0 },
              charactersOwned: storedUser.personajes.length,
            });
          }

          // Actualizar teamStore con stats reales
          const teamStoreImmediate = useTeamStore.getState();
          teamStoreImmediate.setOwnedCharacters(
            storedUser.personajes.map(mapToTeamMember),
          );
        }

        // ── 2) Cargar datos frescos del API ──
        const [me, resources, energyStatus] = await Promise.all([
          userService.getMe().catch(() => null),
          userService.getResources().catch(() => null),
          userService.getEnergyStatus().catch(() => null),
        ]);
        if (cancelled) return;

        const store = usePlayerStore.getState();

        if (me) {
          // Buscar personaje activo para stats reales
          const m = me as any;
          const personajes = m.personajes || [];
          const activeChar = findActiveCharacter(personajes, m.personajeActivoId);
          const realStats = mapStatsES(activeChar?.stats || {});

          store.initPlayer({
            characterId: m._id || m.id || store.characterId,
            characterName: m.username || m.nombre || store.characterName,
            characterClass: m.clase || m.characterClass || store.characterClass || 'warrior',
            level: m.nivel || m.level || store.level,
            gold: m.val ?? m.gold ?? store.gold,
            gems: m.evo ?? m.gems ?? store.gems,
            energy: m.energia ?? store.energy,
            maxEnergy: m.energiaMaxima ?? store.maxEnergy,
            tickets: m.boletos ?? store.tickets,
            // Stats reales del personaje activo
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
            battlesWon: m.estadisticas?.batallasGanadas ?? m.battlesWon ?? 0,
            battlesLost: m.estadisticas?.batallasPerdidas ?? m.battlesLost ?? 0,
            dungeonsCompleted: m.estadisticas?.mazmorrasCompletadas ?? m.dungeonsCompleted ?? 0,
            maxSurvivalWave: m.estadisticas?.oleadaMaxima ?? m.maxSurvivalWave ?? 0,
          });
        }

        if (resources) {
          const r = resources as any;
          if (r.val !== undefined) store.addGold(r.val - store.gold);
          if (r.evo !== undefined) store.addGems(r.evo - store.gems);
          if (r.energia !== undefined) {
            const diff = r.energia - store.energy;
            if (diff > 0) store.addEnergy(diff);
          }
        }

        if (energyStatus) {
          const e = energyStatus as any;
          if (e.energia !== undefined) {
            const diff2 = e.energia - usePlayerStore.getState().energy;
            if (diff2 > 0) usePlayerStore.getState().addEnergy(diff2);
          }
        }

        // Characters + teams
        const [characters, teams] = await Promise.all([
          characterService.getMyCharacters().catch(() => []),
          teamService.getMyTeams().catch(() => []),
        ]);
        if (cancelled) return;

        const teamStore = useTeamStore.getState();

        if (Array.isArray(characters) && characters.length > 0) {
          teamStore.setOwnedCharacters((characters as any[]).map(mapToTeamMember));
        }

        if (Array.isArray(teams) && teams.length > 0) {
          const active = (teams as any[]).find((t: any) => t.activo || t.isActive);
          if (active?.personajes) {
            // Guardar personajes del equipo directamente como ShowcaseCharacter
            setTeamPersonajes(active.personajes.map(mapToShowcase));
            teamStore.setTeam(active.personajes.map(mapToTeamMember));
          }
        }

        // Activity
        try {
          const dashboard = await userService.getDashboard();
          if (!cancelled && dashboard) {
            const d = dashboard as any;
            if (Array.isArray(d.actividadReciente)) {
              setRecentActivity(d.actividadReciente.map(mapActivity));
            }
          }
        } catch { /* sin actividad */ }
      } catch (err) {
        console.error('[Dashboard] Error fetching data:', err);
      } finally {
        if (!cancelled) setDashboardLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const displayActivity = useMemo(() => {
    if (recentActivity.length > 0) return recentActivity;
    return [
      { id: 1, text: 'Bienvenido a Valnor', time: 'Ahora', type: 'combat' },
      { id: 2, text: 'Explora mazmorras y combate', time: '', type: 'levelup' },
      { id: 3, text: 'Visita la tienda para equiparte', time: '', type: 'loot' },
    ];
  }, [recentActivity]);

  const activityIcon = (type: string) => {
    switch (type) {
      case 'loot':    return <GiOpenTreasureChest size={14} />;
      case 'levelup': return <GiUpgrade size={14} />;
      default:        return <GiCrossedSwords size={14} />;
    }
  };

  // ── Handlers ──────────────────────────────────────────────
  const handleChangeMode = () => { clearGameMode(); navigate('/portals'); };
  const handleSelectMode = (mode: 'rpg' | 'survival') => {
    setGameMode(mode);
    navigate(mode === 'rpg' ? '/dungeon' : '/survival');
  };
  const handleLogout = useCallback(async () => { await logout(); }, [logout]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.header-right')) setShowProfile(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div className="dashboard">
      {/* ===== FONDO ANIMADO — Aurora + Partículas + Grid ===== */}
      <div className="dash-bg">
        <div className="dash-bg__aurora" />
        <div className="dash-bg__orb dash-bg__orb--1" />
        <div className="dash-bg__orb dash-bg__orb--2" />
        <div className="dash-bg__orb dash-bg__orb--3" />
        <div className="dash-bg__grid" />
        <div className="dash-bg__particles">
          <span className="dash-bg__particle">&#x2726;</span>
          <span className="dash-bg__particle">&#x2605;</span>
          <span className="dash-bg__particle">&#x2666;</span>
          <span className="dash-bg__particle">&#x2736;</span>
          <span className="dash-bg__particle">&#x2726;</span>
          <span className="dash-bg__particle">&#x2605;</span>
          <span className="dash-bg__particle">&#x2666;</span>
          <span className="dash-bg__particle">&#x2736;</span>
        </div>
      </div>

      {/* ===== HEADER PRO ===== */}
      <header className="dash-header">
        {/* Left: Logo + Player info */}
        <div className="dash-header__left">
          <div className="brand">
            <img src="/assets/icons/Logo_2.webp" alt="Valnor" className="brand__logo" />
            <span className="brand__text">VALNOR</span>
          </div>
          <div className="hdr-divider" />
          <button className="hdr-player" onClick={() => navigate('/profile')}>
            <span className="hdr-player__avatar">{getClassIcon(playerClass, 18)}</span>
            <span className="hdr-player__info">
              <span className="hdr-player__name">{playerName}</span>
              <span className="hdr-player__lvl">Nv.{level}</span>
            </span>
          </button>
        </div>

        {/* Center: Resources */}
        <div className="dash-header__center">
          <div className="res-bar">
            <div className="res res--gold">
              <GiTwoCoins size={18} />
              <span>{gold.toLocaleString()}</span>
            </div>
            <div className="res res--gems">
              <GiCrystalGrowth size={18} />
              <span>{gems.toLocaleString()}</span>
            </div>
            <EnergyBar />
          </div>
        </div>

        {/* Right: Mode tag + Actions */}
        <div className="dash-header__right header-right">
          {gameMode && (
            <button className="hdr-mode-tag" onClick={handleChangeMode} title="Cambiar modo">
              {gameMode === 'rpg' ? <GiCrossedSwords size={14} /> : <GiSkullCrossedBones size={14} />}
              <span>{gameMode === 'rpg' ? 'RPG' : 'PvE'}</span>
            </button>
          )}

          <NotificationBell />

          <button className="hdr-btn" onClick={() => setShowProfile(!showProfile)} title="Mi Perfil">
            <FiUser size={18} />
          </button>

          {showProfile && (
            <div className="dropdown profile-dd">
              <div className="dropdown__head">
                <span className="profile-dd__avatar">{getClassIcon(playerClass, 28)}</span>
                <div className="profile-dd__info">
                  <span className="profile-dd__name">{playerName}</span>
                  <span className="profile-dd__meta">Nivel {level} · {playerClass}</span>
                </div>
              </div>
              <hr className="dropdown__hr" />
              <button className="dropdown__item" onClick={() => { setShowProfile(false); navigate('/profile'); }}>
                <FiUser size={16} /> Mi Perfil
              </button>
              <button className="dropdown__item" onClick={() => { setShowProfile(false); navigate('/inventory'); }}>
                <GiKnapsack size={16} /> Mi Inventario
              </button>
              <button className="dropdown__item" onClick={() => { setShowProfile(false); navigate('/teams'); }}>
                <GiThreeFriends size={16} /> Mis Equipos
              </button>
              <button className="dropdown__item" onClick={() => { setShowProfile(false); navigate('/ranking'); }}>
                <GiTrophy size={16} /> Mi Ranking
              </button>
              <hr className="dropdown__hr" />
              <button className="dropdown__item" onClick={() => { setShowProfile(false); navigate('/settings'); }}>
                <FiSettings size={16} /> Editar Perfil
              </button>
            </div>
          )}

          <button className="hdr-btn" onClick={() => navigate('/settings')} title="Configuración">
            <FiSettings size={18} />
          </button>
          <button className="hdr-btn hdr-btn--danger" onClick={handleLogout} title="Salir">
            <FiLogOut size={18} />
          </button>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="dash-main">

        {/* ──── PANEL IZQUIERDO: Equipo 3D + Actividad ──── */}
        <section className="panel-left">
          {/* Equipo Activo — Showcase 3D */}
          <div className="team-showcase-panel">
            <div className="team-showcase-panel__head">
              <h2 className="team-showcase-panel__title">
                <GiThreeFriends size={18} />
                Equipo Activo
              </h2>
              <div className="team-showcase-panel__actions">
                <span className="team-pwr">
                  <GiPowerLightning size={14} />
                  <span>{(teamShowcasePower || teamPower).toLocaleString()}</span>
                </span>
                <button className="team-showcase-panel__edit" onClick={() => navigate('/teams')}>
                  <FiRefreshCw size={14} /> Editar
                </button>
              </div>
            </div>

            <div className="team-showcase-panel__scene">
              {teamShowcasePersonajes.length > 0 ? (
                <TeamShowcase3D
                  personajes={teamShowcasePersonajes}
                  height="100%"
                  showNames
                  showInfo
                  quality={quality === 'low' ? 'low' : 'medium'}
                  selectedId={selectedCharId}
                  onSelectCharacter={(id) => setSelectedCharId(id === selectedCharId ? null : id)}
                  enableOrbit
                />
              ) : activeTeam.length > 0 ? (
                <div className="team-slots">
                  {activeTeam.map((char, i) => (
                    <div key={char.id || i} className="char-slot" onClick={() => navigate('/teams')}>
                      <span className="char-slot__icon">{getClassIcon(char.class)}</span>
                      <span className="char-slot__name">{char.name}</span>
                      <span className="char-slot__lvl">Nv.{char.level}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="team-showcase-panel__empty" onClick={() => navigate('/teams')}>
                  <FiPlus size={28} />
                  <span>Configura tu equipo</span>
                </div>
              )}
            </div>

            {/* Tira de miembros del equipo */}
            {teamShowcasePersonajes.length > 0 && (
              <div className="team-strip">
                {teamShowcasePersonajes.map((p) => (
                  <div
                    key={p.personajeId}
                    className={`team-strip__member ${selectedCharId === p.personajeId ? 'active' : ''}`}
                    onClick={() => setSelectedCharId(p.personajeId === selectedCharId ? null : p.personajeId)}
                  >
                    <span className="team-strip__avatar">{getClassIcon(p.clase || 'warrior', 16)}</span>
                    <span className="team-strip__name">{p.nombre}</span>
                    <span className="team-strip__rank" data-rank={p.rango}>{p.rango || 'D'}</span>
                    {p.stats && (
                      <span className="team-strip__stats">
                        <span className="ts-atk">⚔{p.stats.atk}</span>
                        <span className="ts-def">🛡{p.stats.defensa}</span>
                      </span>
                    )}
                    {(p.equipamientoCount ?? 0) > 0 && (
                      <span className="team-strip__equip">🛡️{p.equipamientoCount}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actividad reciente */}
          <div className="section-box section-box--main">
            <h4 className="section-box__title">
              <GiScrollUnfurled size={16} />
              Actividad Reciente
            </h4>
            <div className="activity-feed">
              {displayActivity.map((a) => (
                <div key={a.id} className="activity-row">
                  <span className="activity-row__icon">{activityIcon(a.type)}</span>
                  <span className="activity-row__text">{a.text}</span>
                  <span className="activity-row__time">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ──── PANEL DERECHO: Acciones + Stats ──── */}
        <aside className="panel-right">
          {/* Modos de juego */}
          <h4 className="section-box__title section-title--top">
            <GiSwordsEmblem size={16} />
            Modos de Juego
          </h4>
          <div className="cards-row cards-row--2">
            <ActionCard
              big
              icon={<GiCrossedSwords size={34} />}
              title="DUNGEONS"
              subtitle="Equipo de héroes"
              color="red"
              onClick={() => handleSelectMode('rpg')}
              badge={<><GiThreeFriends size={12} /> Equipo</>}
            />
            <ActionCard
              big
              icon={<GiSkullCrossedBones size={34} />}
              title="SURVIVAL"
              subtitle="1 héroe, oleadas"
              color="purple"
              onClick={() => handleSelectMode('survival')}
              badge={<><FiUser size={12} /> Solo</>}
            />
          </div>

          {/* Navegación */}
          <div className="cards-row cards-row--4">
            <ActionCard
              icon={<GiShop size={24} />}
              title="Tienda"
              color="orange"
              onClick={() => navigate('/shop')}
            />
            <ActionCard
              icon={<GiSwapBag size={24} />}
              title="Mercado"
              color="blue"
              onClick={() => navigate('/marketplace')}
            />
            <ActionCard
              icon={<GiThreeFriends size={24} />}
              title="Equipos"
              color="green"
              onClick={() => navigate('/teams')}
            />
            <ActionCard
              icon={<GiTrophy size={24} />}
              title="Ranking"
              color="yellow"
              onClick={() => navigate('/ranking')}
            />
          </div>

          {/* Player card compacto */}
          <div className="player-card">
            <div className="player-card__avatar">
              {getClassIcon(playerClass, 28)}
              <span className="player-card__lvl">Lv.{level}</span>
            </div>
            <div className="player-card__info">
              <h3 className="player-card__name">
                {playerName.toUpperCase()}
              </h3>
              <span className="player-card__class">{playerClass}</span>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="section-box">
            <h4 className="section-box__title">
              <GiChart size={16} />
              Estadísticas
            </h4>
            <StatBar label="Vida" current={hp} max={maxHp} color="#e74c3c" icon={<GiHealthNormal size={14} />} />
            <StatBar label="EXP"  current={exp} max={expRequired} color="#2ecc71" icon={<GiStarFormation size={14} />} />
            <div className="mini-stats">
              <div className="mini-stat"><span>ATK</span><strong>{stats.attack}</strong></div>
              <div className="mini-stat"><span>DEF</span><strong>{stats.defense}</strong></div>
              <div className="mini-stat"><span>VIDA</span><strong>{stats.vitality}</strong></div>
            </div>
          </div>

          {/* Inventario resumen */}
          <InventorySummary />

        </aside>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="dash-footer">
        <span className="dash-footer__quality">
          <GiPowerLightning size={14} /> {quality.toUpperCase()}
        </span>
        <div className="dash-footer__nav">
          <button className="ftr-btn" onClick={() => navigate('/ranking')}><GiTrophy size={16} /> Rankings</button>
          <button className="ftr-btn" onClick={() => navigate('/inventory')}><GiKnapsack size={16} /> Inventario</button>
          <button className="ftr-btn" onClick={() => navigate('/wiki')}><GiSpellBook size={16} /> Wiki</button>
        </div>
        <span className="dash-footer__ver">v1.0.0</span>
      </footer>

    </div>
  );
};

export default Dashboard;
