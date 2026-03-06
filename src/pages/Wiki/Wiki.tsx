import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GiCrystalWand,
  GiShield,
  GiTreasureMap,
  GiTwoCoins,
  GiDragonSpiral,
  GiAxeInStump,
  GiPlayButton,
  GiPadlock,
  GiCrystalGrowth,
  GiKnapsack,
  GiCheckedShield,
  GiPapers,
  GiAxeSwing,
  GiSpellBook,
  GiBookCover
} from 'react-icons/gi';
import { FiUser } from 'react-icons/fi';
import './Wiki.css';

// Helper components for missing icons to avoid crashing (Declared before use)
const GiShipWheel = () => <GiCrystalWand />;
const GiRaven = () => <GiDragonSpiral />;
const GiAnvil = () => <GiAxeInStump />;
const GiCastle = () => <GiPadlock />;
const GiDrop = () => <GiCrystalGrowth />;
const GiWorld = () => <GiTreasureMap />;
const GiWaterfall = () => <GiShield />;
const GiAura = () => <GiCrystalWand />;
const GiSpookyHouse = () => <GiPadlock />;
const GiStoneWall = () => <GiShield />;

interface WikiSection {
  id: string;
  icon: React.ReactNode;
  title: string;
  tag: string;
  description: string;
  narrative?: string;
  features: Array<{ title: string; text: string; icon: React.ReactNode }>;
}

const sections: Record<string, WikiSection> = {
  lore_origins: {
    id: 'lore_origins',
    icon: <GiPapers />,
    title: 'ORÍGENES',
    tag: 'EL INFIERNO BLANCO',
    description: 'La historia de cómo nació Valnor de las cenizas de la extinción.',
    narrative: `Alrededor del año 550 a.C., la región que hoy conoceríamos como Escandinavia era un infierno blanco. El concepto de "Valnor" era impensable. Estas tierras estaban dominadas por tres clanes abismalmente diferentes, aislados por una geografía brutal. No compartían costumbres, no entendían sus dialectos y estaban divididos por fanatismos religiosos.

Valnor nació de una necesidad agónica frente a la extinción. El "Invierno Eterno" no había caído de golpe; fue una plaga generacional que llevaba décadas congelando la tierra. Forzados a trabajar juntos bajo el yugo de un tirano central que los explotaba, la tensión acumulada estalló. Comenzó a circular el veneno de la desconfianza y estalló una guerra intestina donde los clanes se masacraron entre sí. Valnor no nació como un imperio triunfante, nació de las cenizas de esta matanza, forjando el "Juramento del Norte" para sobrevivir.

Los Territorios y los Líderes:
- Clan Vargfjell (Los Lobos de los Fiordos - Oeste): Costas escarpadas y fiordos congelados. Liderados por Jarl Eirikr "Rompehielos".
- Clan Skogbjörn (Los Osos del Bosque - Este): Densos bosques. Liderados por Jarl Sigrid "Ojo de Cuervo", chamana y guerrera.
- Clan Jarnmark (La Marca de Hierro - Sur): Llanuras y minas. Liderados por Jarl Hrorek "Brazo de Hierro".`,
    features: [
      { title: 'Vargfjell', text: 'Jarl Eirikr "Rompehielos".', icon: <GiShipWheel /> },
      { title: 'Skogbjörn', text: 'Jarl Sigrid "Ojo de Cuervo".', icon: <GiRaven /> },
      { title: 'Jarnmark', text: 'Jarl Hrorek "Brazo de Hierro".', icon: <GiAnvil /> }
    ]
  },
  lore_kaeld: {
    id: 'lore_kaeld',
    icon: <GiPadlock />,
    title: 'REY KAELD',
    tag: 'EL CARNICERO',
    description: 'El factor interno que desató la tiranía en Skarnfjell.',
    narrative: `En el corazón geográfico se alza la imponente cordillera de Skarnfjell, una fortaleza natural de roca volcánica oscura y hielo perpetuo. Desde aquí, gobernaba el Rey Kaeld. En medio de las hambrunas, Kaeld no unió a los clanes con diplomacia; los sometió acaparando y centralizando los escasos recursos.

La Guardia de los Desarraigados: Su estrategia fue maquiavélica. Arrebataba a los hombres más fuertes y letales de cada clan, llevándoselos a su fortaleza. Al despojarlos de sus territorios, los aislaba del sufrimiento de su propia gente. Los convirtió en su guardia personal, creyendo que, al robarles sus "lobos alfa", los clanes jamás se levantarían.

El Veneno del Asirio: El Eco del Asirio, desde el lejano sur, encontró en Kaeld un recipiente perfecto. La paranoia consumió al rey. Aumentó el tributo a niveles imposibles e instauró El Diezmo de Sangre, exigiendo vidas humanas bajo la promesa de que los sacrificios apaciguarían el hambre de la tierra. En realidad, solo alimentaban al Asirio.`,
    features: [
      { title: 'Skarnfjell', text: 'Fortaleza de roca volcánica y hielo.', icon: <GiCastle /> },
      { title: 'Diezmo de Sangre', text: 'Sacrificios para alimentar el mal.', icon: <GiDrop /> }
    ]
  },
  lore_sigtryg: {
    id: 'lore_sigtryg',
    icon: <FiUser />,
    title: 'SIGTRYG',
    tag: 'EL LOBO ATADO',
    description: 'El protagonista que rompió las cadenas del destino.',
    narrative: `Sigtryg pertenece a la primera generación que nació bajo el gobierno de Kaeld; nunca ha conocido la primavera. Nacido de la unión prohibida de un navegante Vargfjell y una cazadora Skogbjörn, y casado con Thyra (del clan Jarnmark), su sangre mezclada lo hacía único.

El Traductor: Sigtryg era el único hombre capaz de hablar y entender fluidamente los tres dialectos del norte. Kaeld lo sacó de su territorio y lo hizo Comandante de Skarnfjell precisamente por eso: era el único que podía dar órdenes y coordinar a guerreros desarraigados de todas las facciones. Se convirtió en la mano derecha del rey, pero en secreto, la culpa carcomía su honor al ver a sus compañeros masacrar a su propia gente.

La Tragedia y la Rebelión: Cuando el Eco del Asirio esparció rumores que desataron la guerra intestina entre los clanes, ocurrió la gran tragedia: Thyra, la esposa de Sigtryg, fue asesinada en los primeros choques de esta guerra absurda. Esto destrozó a Sigtryg. Cuando Kaeld le ordenó marchar para recolectar el Diezmo de Sangre en lugar de imponer paz, Sigtryg cometió alta traición y se rebeló con sus hombres leales.

La Garganta de Hielo: Marcharon a La Garganta de Hielo. Esta jugada fue letal: Skarnfjell estaba construida sobre roca volcánica congelada, y sus antiguos pozos subterráneos se habían congelado. Su única fuente de agua dulce era el acueducto y el lago profundo que pasaban por La Garganta de Hielo. Al tomar este punto, Sigtryg literalmente le cortó la yugular al castillo de Kaeld, obligando a todos a detener la guerra civil por pura sed e inanición, forzando un campamento neutral.`,
    features: [
      { title: 'El Traductor', text: 'Hablaba los tres dialectos del norte.', icon: <GiWorld /> },
      { title: 'Garganta de Hielo', text: 'La yugular estratégica de Skarnfjell.', icon: <GiWaterfall /> }
    ]
  },
  lore_expansion: {
    id: 'lore_expansion',
    icon: <GiBookCover />,
    title: 'CRÓNICAS',
    tag: 'DANIEL Y EL OLAM',
    description: 'El camino hacia la liberación y el Dios Eterno.',
    narrative: `En este campamento llegó Daniel, el exiliado del sur. Sobrevivió al brutal viaje mezclándose con las caravanas de la antigua Ruta del Ámbar, envuelto en pesadas pieles de oso. Al ver a los clanes matándose, Daniel reconoció la manipulación psicológica de El Asirio, el mismo mal que destruyó su tierra.

Daniel les habló de El Olam, el Dios Eterno, enseñándoles que lo divino aborrece los sacrificios humanos y exige obediencia y justicia. En "La Noche de los Cuchillos Rotos", Sigtryg detuvo los sacrificios y usó su rol de traductor para unir a los clanes con la verdad. Marcharon sobre Skarnfjell, los guerreros de Kaeld bajaron las armas al ver a sus familias unidas, y Sigtryg decapitó al carnicero, fundando Valnor.

Rumbo a Nínive: La muerte de Kaeld no trajo la primavera. La tierra estaba muerta. Explorando las bóvedas secretas de Kaeld, Daniel encontró extrañas dagas y amuletos cuneiformes asirios. Comprendieron que el Asirio amplificaba el invierno. Daniel trazó un mapa hacia La Ciudad Suspendida de Nínive. Valnor marcharía al sur para cortar la cabeza de la serpiente.`,
    features: [
      { title: 'Daniel', text: 'El exiliado guía del sur.', icon: <FiUser /> },
      { title: 'El Olam', text: 'El Dios Eterno de justicia.', icon: <GiAura /> }
    ]
  },
  lore_enemies: {
    id: 'lore_enemies',
    icon: <GiDragonSpiral />,
    title: 'ASIRIO Y BELZUR',
    tag: 'EL REY Y EL MURO',
    description: 'Los antagonistas y el aliado redimido.',
    narrative: `El Asirio (El Rey que se negó a desaparecer): Nacido en Nínive, este antiguo rey amaba el conocimiento pero desarrolló un terror ineludible al olvido. Cuando su imperio colapsó (612 a.C.), acudió a oscuros rituales de Nergal. Sacrificó su ciudad, derramó sangre real y usó a un Guardian voluntario (Belzur) como "Anclaje" para existir en un plano intermedio. Hoy es una fractura en el tiempo, un parásito que susurra en momentos de crisis.

Belzur (El Guardián de Nínive): Fue "El Muro Viviente de Nínive", un hombre leal que aceptó el pacto oscuro para proteger su ciudad. Se transformó en un ser inmortal, de piel de piedra quemada. Su maldición: Mientras Nínive necesite defensa, no morirás. Mientras tu rey règne, no serás libre. La única forma de liberarlo era que alguien lo derrotara en combate y decidiera perdonarle la vida, rompiendo el pacto con voluntad y no con sangre. Cuando Sigtryg lo derrota en las ruinas y lo perdona, Belzur recupera su humanidad y se une a Valnor como su estratega principal.`,
    features: [
      { title: 'El Asirio', text: 'Eco eterno del 612 a.C.', icon: <GiSpookyHouse /> },
      { title: 'Belzur', text: 'Muro Viviente ahora estratega.', icon: <GiStoneWall /> }
    ]
  },
  glossary: {
    id: 'glossary',
    icon: <GiSpellBook />,
    title: 'GLOSARIO',
    tag: 'SIGNIFICADO SAGRADO',
    description: 'Los nombres en Valnor no son casuales; cada uno guarda la esencia de su origen.',
    narrative: `Facciones y Lugares:
- Valnor: "El Juramento del Norte" (Valor + Norte).
- Vargfjell: "Montaña del Lobo" (Expertos navegantes).
- Skogbjörn: "Oso del Bosque" (Chamanes y cazadores).
- Jarnmark: "Marca de Hierro" (Mineros y forjadores).
- Skarnfjell: "Cordillera de Piedra/Escoria" (Trono de Sangre).

Personajes:
- Sigtryg: "Victoria de la Fe" (Lobo Fiel / Comandante).
- Rey Kaeld: Evoca el frío (Cold) y la muerte (Killed). "El Carnicero".
- Daniel: "Juicio de Dios". Guía de luz del sur.
- El Asirio: "El Eco de Nínive". Miedo al olvido.
- Belzur: "Muro de Fuego". Guardián redimido.
- El Olam: "El Dios de la Eternidad". Rectitud y piedad.`,
    features: [
      { title: 'Valnor', text: 'El Juramento del Norte.', icon: <GiCheckedShield /> },
      { title: 'Sigtryg', text: 'El Lobo Fiel.', icon: <GiAxeSwing /> }
    ]
  },
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
  }
};

const Wiki: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('lore_origins');

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

        <main className="altar-display">
          <div key={activeTab} className="display-content fade-in-magic">
            <div className="section-title-wrap">
              <h1 className="section-title">{current.title}</h1>
              <span className="section-tag">{current.tag}</span>
            </div>

            <p className="description-text">{current.description}</p>

            {current.narrative && (
              <div className="narrative-block">
                {current.narrative.split('\n\n').map((para, i) => (
                  <p key={i} className="narrative-para">{para}</p>
                ))}
              </div>
            )}

            <div className={`altar-grid ${activeTab.startsWith('lore') ? 'chronicles-special-grid' : ''}`}>
              {current.features.map((feature, idx) => (
                <div key={idx} className={`altar-card ${activeTab.startsWith('lore') ? 'chronicle-card' : ''}`}>
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
