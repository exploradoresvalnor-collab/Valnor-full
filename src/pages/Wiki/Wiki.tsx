import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Wiki.css';

interface WikiSection {
  id: string;
  icon: string;
  title: string;
}

const Wiki: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>('intro');

  const wikiSections: WikiSection[] = [
    { id: 'intro', icon: '📚', title: 'Introducción' },
    { id: 'valnor-explorer', icon: '🗺️', title: 'Valnor Explorer' },
    { id: 'survival-valnor', icon: '⚡', title: 'Survival Valnor' },
    { id: 'pvp-arena', icon: '⚔️', title: 'PvP Arena' },
    { id: 'economy', icon: '💰', title: 'Economía' },
    { id: 'classes', icon: '🎭', title: 'Clases' },
    { id: 'items', icon: '🎒', title: 'Items' },
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
          <button onClick={() => navigate(-1)} className="back-button">
            <span className="desktop-text">← Volver al Inicio</span>
            <span className="mobile-text">← Volver</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="wiki-container">
        {/* Sidebar */}
        <aside className="wiki-sidebar">
          <div className="sidebar-content">
            <h3 className="sidebar-title">📚 Contenido</h3>
            <nav className="sidebar-nav">
              {wikiSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`sidebar-link ${activeSection === section.id ? 'active' : ''}`}
                >
                  {section.icon} {section.title}
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
              <h1 className="hero-title">📚 Wiki Oficial</h1>
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
