import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GiPlayButton,
  GiPadlock,
  GiShield,
  GiBroadsword,
  GiCrossedSwords,
  GiSkullCrossedBones,
  GiTrophy,
  GiTwoCoins,
  GiCrystalGrowth,
  GiHealthNormal,
  GiSpellBook,
  GiKnapsack,
  GiWizardStaff,
  GiHighShot,
  GiStiletto,
  GiHealthPotion,
} from 'react-icons/gi';
import { FiUser } from 'react-icons/fi';
import './Wiki.css';

interface WikiSection {
  id: string;
  icon: React.ReactNode;
  title: string;
}

const Wiki: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>('intro');

  const wikiSections: WikiSection[] = [
    { id: 'intro', icon: <GiSpellBook size={18} />, title: 'Introducción' },
    { id: 'how-to-play', icon: <GiPlayButton size={18} />, title: 'Cómo Jugar' },
    { id: 'valnor-explorer', icon: <GiCrossedSwords size={18} />, title: 'Valnor Explorer' },
    { id: 'survival-valnor', icon: <GiSkullCrossedBones size={18} />, title: 'Survival Valnor' },
    { id: 'pvp-arena', icon: <GiBroadsword size={18} />, title: 'PvP Arena' },
    { id: 'economy', icon: <GiTwoCoins size={18} />, title: 'Economía' },
    { id: 'classes', icon: <FiUser size={18} />, title: 'Clases' },
    { id: 'items', icon: <GiKnapsack size={18} />, title: 'Items' },
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  return (
    <div className="wiki-page">
      {/* Navbar */}
      <nav className="wiki-navbar">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            <img src="/assets/icons/Logo_2.webp" alt="Valnor" className="navbar-logo" />
            <span className="navbar-title">WIKI VALNOR</span>
          </Link>
          <button onClick={() => navigate('/landing')} className="back-button">
            <span className="desktop-text">← Volver</span>
            <span className="mobile-text">← Volver</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="wiki-container">
        {/* Sidebar */}
        <aside className="wiki-sidebar">
          <div className="sidebar-content">
            <h3 className="sidebar-title"><GiSpellBook size={18} /> Contenido</h3>
            <nav className="sidebar-nav">
              {wikiSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`sidebar-link ${activeSection === section.id ? 'active' : ''}`}
                >
                  <span className="sidebar-icon">{section.icon}</span>
                  <span>{section.title}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="wiki-content">
          {/* Hero Section */}
          <section id="intro" className="wiki-section hero-section">
            <div className="hero-card">
              <h1 className="hero-title"><GiSpellBook size={32} /> Wiki Oficial</h1>
              <p className="hero-description">
                Bienvenido a la wiki oficial de <strong className="text-cyan">Valnor</strong>,
                el RPG multiplataforma donde tu <strong className="text-purple">skill</strong> tiene
                <strong className="text-yellow"> valor real</strong>.
              </p>
              <p className="hero-subtitle">
                Aquí encontrarás toda la información sobre los modos de juego, sistema de evolución,
                monetización, ventajas competitivas y mucho más.
              </p>
            </div>
          </section>

          {/* ============================================ */}
          {/* NUEVA SECCIÓN: CÓMO JUGAR                   */}
          {/* ============================================ */}
          <section id="how-to-play" className="wiki-section">
            <div className="section-header gold">
              <div className="section-icon"><GiPlayButton size={28} color="#ffd700" /></div>
              <h2 className="section-title gold">Cómo Jugar</h2>
            </div>
            <div className="section-description">
              <p>
                Valnor ofrece diferentes formas de comenzar tu aventura. Elige la que mejor
                se adapte a tus necesidades y empieza a explorar el mundo.
              </p>
            </div>

            {/* Modos de acceso */}
            <div className="access-modes-grid">
              {/* Registro */}
              <div className="access-card register">
                <div className="access-header">
                  <div className="access-icon"><FiUser size={32} color="#9b59b6" /></div>
                  <h3>Crear Cuenta</h3>
                  <span className="access-badge premium">Recomendado</span>
                </div>
                <div className="access-content">
                  <p className="access-description">
                    Crea tu cuenta gratuita y desbloquea todas las funcionalidades de Valnor.
                    ¡Tu progreso se sincroniza en todos tus dispositivos!
                  </p>
                  <ul className="access-features">
                    <li><GiShield size={14} /> Acceso completo a todo el contenido</li>
                    <li><GiTwoCoins size={14} /> Acceso al Marketplace</li>
                    <li><GiTrophy size={14} /> Rankings y competiciones</li>
                    <li><GiCrystalGrowth size={14} /> Sincronización cloud</li>
                    <li><GiBroadsword size={14} /> PvP Arena competitivo</li>
                  </ul>
                  <div className="access-benefits">
                    <h4>Beneficios exclusivos:</h4>
                    <ul>
                      <li>Guarda múltiples personajes</li>
                      <li>Comercia items con otros jugadores</li>
                      <li>Participa en eventos especiales</li>
                      <li>Gana VAL (moneda con valor real)</li>
                    </ul>
                  </div>
                </div>
                <button className="access-action-btn register" onClick={() => navigate('/auth/register')}>
                  <FiUser size={18} /> Crear Cuenta Gratis
                </button>
              </div>

              {/* Iniciar Sesión */}
              <div className="access-card login">
                <div className="access-header">
                  <div className="access-icon"><GiPadlock size={32} color="#3498db" /></div>
                  <h3>Iniciar Sesión</h3>
                  <span className="access-badge returning">Usuarios existentes</span>
                </div>
                <div className="access-content">
                  <p className="access-description">
                    ¿Ya tienes cuenta? Inicia sesión para continuar tu aventura donde
                    la dejaste. Todo tu progreso te está esperando.
                  </p>
                  <ul className="access-features">
                    <li><GiHealthNormal size={14} /> Recupera todos tus personajes</li>
                    <li><GiKnapsack size={14} /> Accede a tu inventario</li>
                    <li><GiTwoCoins size={14} /> Revisa tu balance de VAL</li>
                    <li><GiTrophy size={14} /> Consulta tu ranking</li>
                  </ul>
                  <div className="access-info">
                    <p>
                      <strong>¿Olvidaste tu contraseña?</strong><br />
                      No te preocupes, puedes recuperarla fácilmente desde la pantalla de login.
                    </p>
                  </div>
                </div>
                <button className="access-action-btn login" onClick={() => navigate('/auth/login')}>
                  <GiPadlock size={18} /> Iniciar Sesión
                </button>
              </div>
            </div>

            {/* Características principales */}
            <div className="comparison-table-wrapper">
              <h3 className="comparison-title">Características de Valnor</h3>
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Característica</th>
                    <th>Disponible</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Modo Historia</td>
                    <td className="yes">✓</td>
                  </tr>
                  <tr>
                    <td>Survival Mode</td>
                    <td className="yes">✓</td>
                  </tr>
                  <tr>
                    <td>Dungeons</td>
                    <td className="yes">✓</td>
                  </tr>
                  <tr>
                    <td>PvP Arena</td>
                    <td className="yes">✓ Online</td>
                  </tr>
                  <tr>
                    <td>Marketplace</td>
                    <td className="yes">✓</td>
                  </tr>
                  <tr>
                    <td>Rankings Globales</td>
                    <td className="yes">✓</td>
                  </tr>
                  <tr>
                    <td>Sincronización Cloud</td>
                    <td className="yes">✓</td>
                  </tr>
                  <tr>
                    <td>Ganar VAL</td>
                    <td className="yes">✓</td>
                  </tr>
                  <tr>
                    <td>Eventos Especiales</td>
                    <td className="yes">✓ Todos</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Valnor Explorer */}
          <section id="valnor-explorer" className="wiki-section">
            <div className="section-header cyan">
              <div className="section-icon">🗺️</div>
              <h2 className="section-title">Valnor Explorer</h2>
            </div>
            <div className="section-description">
              <p>
                El corazón del universo Valnor. Sumérgete en un mundo RPG expansivo donde cada decisión,
                cada batalla y cada alianza define tu leyenda.
              </p>
            </div>
            <div className="feature-grid">
              <div className="feature-card cyan">
                <div className="feature-icon">🏰</div>
                <h3>Dungeons Dinámicas</h3>
                <p>Mapas procedurales infinitos que se adaptan a tu nivel y estilo de juego.</p>
              </div>
              <div className="feature-card cyan">
                <div className="feature-icon">🤖</div>
                <h3>IA Adaptativa</h3>
                <p>Enemigos que aprenden de tus estrategias y se adaptan a tu playstyle.</p>
              </div>
              <div className="feature-card cyan">
                <div className="feature-icon">💎</div>
                <h3>Sistema de Loot</h3>
                <p>Obtén items desde Common hasta Legendary con stats únicos y synergias.</p>
              </div>
              <div className="feature-card cyan">
                <div className="feature-icon">📖</div>
                <h3>50+ Horas de Contenido</h3>
                <p>Historia épica story-driven con decisiones que afectan el mundo.</p>
              </div>
            </div>
          </section>

          {/* Survival Valnor */}
          <section id="survival-valnor" className="wiki-section">
            <div className="section-header red">
              <div className="section-icon">⚡</div>
              <h2 className="section-title red">Survival Valnor</h2>
            </div>
            <div className="section-description">
              <p>
                Adrenalina pura en estado concentrado. El modo que mantiene a los streamers pegados
                y a los espectadores al borde del asiento.
              </p>
            </div>
            <div className="feature-grid">
              <div className="feature-card red">
                <div className="feature-icon">🌊</div>
                <h3>Oleadas Infinitas</h3>
                <p>Dificultad escalable sin techo. ¿Hasta dónde puedes llegar?</p>
              </div>
              <div className="feature-card red">
                <div className="feature-icon">⚡</div>
                <h3>Power-Ups Aleatorios</h3>
                <p>Spawns estratégicos que cambian el rumbo de la partida.</p>
              </div>
              <div className="feature-card red">
                <div className="feature-icon">🏆</div>
                <h3>Global Rankings</h3>
                <p>Top 100 mundial + Regional leaderboards con rewards exclusivos.</p>
              </div>
              <div className="feature-card red">
                <div className="feature-icon">📺</div>
                <h3>Streaming Ready</h3>
                <p>Diseñado para contenido viral y entretenimiento.</p>
              </div>
            </div>
          </section>

          {/* PvP Arena */}
          <section id="pvp-arena" className="wiki-section">
            <div className="section-header purple">
              <div className="section-icon">⚔️</div>
              <h2 className="section-title purple">PvP Arena</h2>
            </div>
            <div className="section-description">
              <p>
                Combate jugador contra jugador en arenas competitivas. Demuestra tu habilidad
                y gana recompensas reales.
              </p>
            </div>
            <div className="feature-grid">
              <div className="feature-card purple">
                <div className="feature-icon">🎮</div>
                <h3>Matchmaking Justo</h3>
                <p>Sistema ELO que te empareja con oponentes de tu nivel.</p>
              </div>
              <div className="feature-card purple">
                <div className="feature-icon">🏅</div>
                <h3>Ranked Seasons</h3>
                <p>Temporadas competitivas con rewards exclusivos.</p>
              </div>
              <div className="feature-card purple">
                <div className="feature-icon">💰</div>
                <h3>Apuestas VAL</h3>
                <p>Apuesta tus VAL en duelos con otros jugadores.</p>
              </div>
              <div className="feature-card purple">
                <div className="feature-icon">🎯</div>
                <h3>Torneos</h3>
                <p>Participa en torneos con prize pools reales.</p>
              </div>
            </div>
          </section>

          {/* Economy */}
          <section id="economy" className="wiki-section">
            <div className="section-header yellow">
              <div className="section-icon">💰</div>
              <h2 className="section-title yellow">Economía VAL</h2>
            </div>
            <div className="section-description">
              <p>
                El sistema económico de Valnor está diseñado para que tu tiempo y habilidad
                tengan valor real.
              </p>
            </div>
            <div className="economy-stats">
              <div className="stat-card">
                <div className="stat-icon">💎</div>
                <div className="stat-info">
                  <span className="stat-label">VAL</span>
                  <span className="stat-description">Moneda principal, intercambiable por dinero real</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎫</div>
                <div className="stat-info">
                  <span className="stat-label">Boletos</span>
                  <span className="stat-description">Para participar en eventos especiales y rifas</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⚡</div>
                <div className="stat-info">
                  <span className="stat-label">EVO</span>
                  <span className="stat-description">Puntos de evolución para mejorar tu personaje</span>
                </div>
              </div>
            </div>
          </section>

          {/* Classes */}
          <section id="classes" className="wiki-section">
            <div className="section-header green">
              <div className="section-icon">🎭</div>
              <h2 className="section-title green">Clases</h2>
            </div>
            <div className="section-description">
              <p>
                Elige tu camino entre las múltiples clases disponibles. Cada una con habilidades
                únicas y estilos de juego diferentes.
              </p>
            </div>
            <div className="classes-grid">
              <div className="class-card warrior">
                <div className="class-icon">⚔️</div>
                <h3>Guerrero</h3>
                <p>Tanque de primera línea con alta resistencia y daño cuerpo a cuerpo.</p>
                <div className="class-stats">
                  <span>HP: Alto</span>
                  <span>ATK: Alto</span>
                  <span>DEF: Muy Alto</span>
                </div>
              </div>
              <div className="class-card mage">
                <div className="class-icon">🔮</div>
                <h3>Mago</h3>
                <p>Maestro de las artes arcanas con devastadores hechizos de área.</p>
                <div className="class-stats">
                  <span>HP: Bajo</span>
                  <span>ATK: Muy Alto</span>
                  <span>DEF: Bajo</span>
                </div>
              </div>
              <div className="class-card rogue">
                <div className="class-icon">🗡️</div>
                <h3>Pícaro</h3>
                <p>Asesino ágil especializado en daño crítico y evasión.</p>
                <div className="class-stats">
                  <span>HP: Medio</span>
                  <span>ATK: Alto</span>
                  <span>DEF: Medio</span>
                </div>
              </div>
              <div className="class-card healer">
                <div className="class-icon">💚</div>
                <h3>Sanador</h3>
                <p>Soporte esencial con habilidades de curación y buffs.</p>
                <div className="class-stats">
                  <span>HP: Medio</span>
                  <span>ATK: Bajo</span>
                  <span>DEF: Medio</span>
                </div>
              </div>
            </div>
          </section>

          {/* Items */}
          <section id="items" className="wiki-section">
            <div className="section-header orange">
              <div className="section-icon">🎒</div>
              <h2 className="section-title orange">Sistema de Items</h2>
            </div>
            <div className="section-description">
              <p>
                Los items en Valnor tienen diferentes rarezas y pueden ser mejorados,
                comerciados o desmantelados para materiales.
              </p>
            </div>
            <div className="rarity-list">
              <div className="rarity-item common">
                <span className="rarity-badge">Common</span>
                <span className="rarity-desc">Items básicos, fáciles de obtener</span>
              </div>
              <div className="rarity-item uncommon">
                <span className="rarity-badge">Uncommon</span>
                <span className="rarity-desc">Mejores stats, drop rate moderado</span>
              </div>
              <div className="rarity-item rare">
                <span className="rarity-badge">Rare</span>
                <span className="rarity-desc">Stats elevados, habilidades pasivas</span>
              </div>
              <div className="rarity-item epic">
                <span className="rarity-badge">Epic</span>
                <span className="rarity-desc">Muy poderosos, difíciles de conseguir</span>
              </div>
              <div className="rarity-item legendary">
                <span className="rarity-badge">Legendary</span>
                <span className="rarity-desc">Los mejores del juego, extremadamente raros</span>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Wiki;
