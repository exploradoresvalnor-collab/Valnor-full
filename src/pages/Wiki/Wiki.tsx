import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GiCrystalWand,
  GiBroadsword,
  GiShield,
  GiTreasureMap,
  GiTwoCoins,
  GiStarShuriken,
  GiDragonSpiral,
  GiAxeInStump,
  GiPlayButton,
  GiPadlock,
  GiTrophy,
  GiCrystalGrowth,
  GiKnapsack,
  GiWizardStaff,
  GiCheckedShield
} from 'react-icons/gi';
import { FiUser } from 'react-icons/fi';
import './Wiki.css';

interface WikiSection {
  id: string;
  icon: React.ReactNode;
  title: string;
  tag: string;
  description: string;
  features: Array<{ title: string; text: string; icon: React.ReactNode }>;
}

const sections: Record<string, WikiSection> = {
  intro: {
    id: 'intro',
    icon: <GiPlayButton />,
    title: 'INICIO',
    tag: 'BIENVENIDO AL REINO',
    description: 'Valnor es el RPG multiplataforma definitivo. Aquí, tu habilidad se traduce en valor real dentro de un ecosistema equilibrado y competitivo.',
    features: [
      { title: 'Multiplataforma', text: 'Juega en PC o móvil con sincronización total de progreso.', icon: <GiPlayButton /> },
      { title: 'Valor Real', text: 'Gana cristales de VAL intercambiables por recompensas tangibles.', icon: <GiTwoCoins /> }
    ]
  },
  howToPlay: {
    id: 'howToPlay',
    icon: <GiPadlock />,
    title: 'ACCESO',
    tag: 'COMIENZA TU SENDA',
    description: 'Elige cómo quieres entrar al mundo. Recomendamos registrar tu alma para no perder tu progreso en el Abismo.',
    features: [
      { title: 'Cuenta Valnor', text: 'Acceso total, Marketplace, Rankings y Sincronización Cloud.', icon: <FiUser /> },
      { title: 'Modo Invitado', text: 'Prueba la experiencia, pero recuerda registrarte para salvar tu equipo.', icon: <GiPadlock /> }
    ]
  },
  explorer: {
    id: 'explorer',
    icon: <GiTreasureMap />,
    title: 'EXPLORADOR',
    tag: 'MAZMORRAS VIVAS',
    description: 'Entra en el Castillo del Caballero Negro o las Ruinas de Val; mapas que se reconfiguran para que nunca repitas la misma historia.',
    features: [
      { title: 'IA Adaptativa', text: 'Enemigos que aprenden tus patrones y te obligan a innovar.', icon: <GiDragonSpiral /> },
      { title: 'Loot Legendario', text: 'Más de 50 horas de contenido con miles de objetos por encontrar.', icon: <GiKnapsack /> }
    ]
  },
  survival: {
    id: 'survival',
    icon: <GiShield />,
    title: 'SURVIVAL',
    tag: 'AGUANTA EL ABISMO',
    description: 'Oleadas infinitas de criaturas sombrías. ¿Cuánto tiempo podrás mantener la llama encendida antes de ser consumido?',
    features: [
      { title: 'Power-ups', text: 'Suministros aéreos y runas que cambian el curso del combate.', icon: <GiStarShuriken /> },
      { title: 'Streaming Ready', text: 'Diseñado para ser un espectáculo competitivo en vivo.', icon: <GiTrophy /> }
    ]
  },
  pvp: {
    id: 'pvp',
    icon: <GiBroadsword />,
    title: 'ARENAS',
    tag: 'DUELOS DE HONOR',
    description: 'Enfréntate a otros campeones en combates 1v1 o torneos grupales donde el lag es tu menor preocupación.',
    features: [
      { title: 'Matchmaking ELO', text: 'Sistema de emparejamiento justo basado en tu nivel real.', icon: <GiBroadsword /> },
      { title: 'Ranked Seasons', text: 'Temporadas con recompensas exclusivas para el top 100.', icon: <GiCheckedShield /> }
    ]
  },
  economy: {
    id: 'economy',
    icon: <GiTwoCoins />,
    title: 'ECONOMÍA',
    tag: 'SISTEMA VAL',
    description: 'Un mercado libre y justo. Cada objeto puede ser comerciado, forjado o vendido por cristales de VAL.',
    features: [
      { title: 'Cristales VAL', text: 'La moneda del reino, el motor de nuestra economía real.', icon: <GiTwoCoins /> },
      { title: 'Tokens EVO', text: 'Puntos de evolución para mejorar tus estadísticas permanentes.', icon: <GiCrystalGrowth /> }
    ]
  },
  classes: {
    id: 'classes',
    icon: <GiCrystalWand />,
    title: 'CLASES',
    tag: 'LA SANTÍSIMA TRINIDAD',
    description: 'Domina el combate con el Guerrero de Hierro, el Mago Arcano, el Pícaro Sombrío o el Sanador Sagrado.',
    features: [
      { title: 'Guerrero', text: 'HP: Máximo | DEF: Élite | ATK: Constante.', icon: <GiShield /> },
      { title: 'Mago', text: 'HP: Bajo | DEF: Frágil | ATK: Devastador.', icon: <GiWizardStaff /> }
    ]
  },
  items: {
    id: 'items',
    icon: <GiKnapsack />,
    title: 'OBJETOS',
    tag: 'RAREZAS Y FORJA',
    description: 'Desde harapos comunes hasta reliquias legendarias bañadas en sangre de dragón.',
    features: [
      { title: 'Rarezas', text: 'Common, Uncommon, Rare, Epic y el mítico LEGENDARY.', icon: <GiStarShuriken /> },
      { title: 'Sistema de Forja', text: 'Desmantela y construye el equipo que el Marketplace necesita.', icon: <GiAxeInStump /> }
    ]
  }
};

const Wiki: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('intro');

  const navItems = Object.values(sections);
  const current = sections[activeTab];

  return (
    <div className="wiki-page">
      <div className="bg-image-overlay">
        <img src="/assets/icons/portada_pc.webp" alt="Valnor Background" />
        <div className="bg-gradient-overlay" />
      </div>

      {/* Heroic Ambient Glow */}
      <div className="altar-ambient-glow" />

      <button onClick={() => navigate('/landing')} className="altar-back-btn">
        ← VOLVER AL REINO
      </button>

      <div className="altar-container">
        {/* Sidebar Nav */}
        <aside className="altar-sidebar">
          <div className="sidebar-header">CONOCIMIENTO</div>
          <div className="nav-scroll-area">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`altar-nav-btn ${activeTab === item.id ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.title}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Display Altar */}
        <main className="altar-display">
          <div key={activeTab} className="display-content fade-in-magic">
            <div className="section-title-wrap">
              <h1 className="section-title">{current.title}</h1>
              <span className="section-tag">{current.tag}</span>
            </div>

            <p className="description-text">{current.description}</p>

            <div className="altar-grid">
              {current.features.map((feature, idx) => (
                <div key={idx} className="altar-card">
                  <div className="card-icon">{feature.icon}</div>
                  <h3 className="card-title">{feature.title}</h3>
                  <p className="card-text">{feature.text}</p>
                </div>
              ))}
            </div>

            <div className="altar-footer-info">
              <p>Valnor © 2026 - Conocimiento Sagrado del Reino</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Wiki;
