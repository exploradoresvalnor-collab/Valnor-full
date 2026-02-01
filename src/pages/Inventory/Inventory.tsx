import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  EquipmentItem, 
  ConsumableItem, 
  EquippedItems, 
  ItemRarity,
  RARITY_COLORS, 
  RARITY_NAMES 
} from '../../types/item.types';
import './Inventory.css';

// Mock data para demostración
const mockEquippedItems: EquippedItems = {
  weapon: {
    id: '1',
    nombre: 'Espada del Dragón',
    descripcion: 'Una espada forjada con escamas de dragón',
    tipo: 'weapon',
    rareza: 'epic',
    nivel: 15,
    stats: { ataque: 45, critico: 12 },
    precio: 5000,
    equipado: true,
    slot: 'weapon',
    mejoras: 3,
    maxMejoras: 10,
  },
  armor: {
    id: '2',
    nombre: 'Armadura de Mithril',
    descripcion: 'Ligera pero extremadamente resistente',
    tipo: 'armor',
    rareza: 'rare',
    nivel: 12,
    stats: { defensa: 35, hp: 100 },
    precio: 3500,
    equipado: true,
    slot: 'armor',
    mejoras: 2,
    maxMejoras: 10,
  },
  helmet: {
    id: '3',
    nombre: 'Yelmo del Guardián',
    descripcion: 'Protege contra ataques críticos',
    tipo: 'helmet',
    rareza: 'uncommon',
    nivel: 10,
    stats: { defensa: 15, evasion: 5 },
    precio: 1500,
    equipado: true,
    slot: 'helmet',
    mejoras: 1,
    maxMejoras: 10,
  },
  boots: {
    id: '4',
    nombre: 'Botas de Viento',
    descripcion: 'Aumentan la velocidad de movimiento',
    tipo: 'boots',
    rareza: 'rare',
    nivel: 11,
    stats: { velocidad: 20, evasion: 8 },
    precio: 2000,
    equipado: true,
    slot: 'boots',
    mejoras: 0,
    maxMejoras: 10,
  },
  accessory1: {
    id: '5',
    nombre: 'Anillo de Poder',
    descripcion: 'Aumenta el daño de habilidades',
    tipo: 'accessory',
    rareza: 'legendary',
    nivel: 20,
    stats: { ataque: 25, critico: 15 },
    precio: 10000,
    equipado: true,
    slot: 'accessory1',
    mejoras: 5,
    maxMejoras: 10,
  },
  accessory2: null,
};

const mockBackpackItems: EquipmentItem[] = [
  {
    id: '6',
    nombre: 'Daga Sombría',
    descripcion: 'Perfecta para ataques sigilosos',
    tipo: 'weapon',
    rareza: 'uncommon',
    nivel: 8,
    stats: { ataque: 20, critico: 18 },
    precio: 800,
    equipado: false,
    slot: 'weapon',
    mejoras: 0,
    maxMejoras: 10,
  },
  {
    id: '7',
    nombre: 'Escudo de Roble',
    descripcion: 'Un escudo básico pero confiable',
    tipo: 'armor',
    rareza: 'common',
    nivel: 5,
    stats: { defensa: 12 },
    precio: 200,
    equipado: false,
    slot: 'armor',
    mejoras: 0,
    maxMejoras: 10,
  },
  {
    id: '8',
    nombre: 'Capa del Errante',
    descripcion: 'Otorga resistencia al frío',
    tipo: 'armor',
    rareza: 'rare',
    nivel: 14,
    stats: { defensa: 18, evasion: 10 },
    precio: 2500,
    equipado: false,
    slot: 'armor',
    mejoras: 1,
    maxMejoras: 10,
  },
];

const mockConsumables: ConsumableItem[] = [
  {
    id: 'c1',
    nombre: 'Poción de Vida',
    descripcion: 'Restaura 100 HP',
    tipo: 'consumable',
    rareza: 'common',
    nivel: 1,
    stats: {},
    precio: 50,
    cantidad: 15,
    efecto: 'heal',
  },
  {
    id: 'c2',
    nombre: 'Elixir de Fuerza',
    descripcion: 'Aumenta el ataque por 5 minutos',
    tipo: 'consumable',
    rareza: 'uncommon',
    nivel: 5,
    stats: {},
    precio: 150,
    cantidad: 5,
    efecto: 'buff_attack',
    duracion: 300,
  },
  {
    id: 'c3',
    nombre: 'Pergamino de Teletransporte',
    descripcion: 'Te lleva al pueblo más cercano',
    tipo: 'consumable',
    rareza: 'rare',
    nivel: 1,
    stats: {},
    precio: 500,
    cantidad: 2,
    efecto: 'teleport',
  },
];

type InventoryTab = 'equipment' | 'consumables';

const Inventory: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<InventoryTab>('equipment');
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | ConsumableItem | null>(null);
  const [equippedItems] = useState<EquippedItems>(mockEquippedItems);
  const [backpackItems] = useState<EquipmentItem[]>(mockBackpackItems);
  const [consumables] = useState<ConsumableItem[]>(mockConsumables);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="inventory-loading">
        <div className="loading-spinner" />
        <p>Cargando inventario...</p>
      </div>
    );
  }

  const getRarityStyle = (rareza: ItemRarity) => ({
    borderColor: RARITY_COLORS[rareza],
    boxShadow: `0 0 10px ${RARITY_COLORS[rareza]}40`,
  });

  const getTotalStats = () => {
    let ataque = 0, defensa = 0, hp = 0, velocidad = 0, critico = 0, evasion = 0;
    
    Object.values(equippedItems).forEach(item => {
      if (item) {
        ataque += item.stats.ataque || 0;
        defensa += item.stats.defensa || 0;
        hp += item.stats.hp || 0;
        velocidad += item.stats.velocidad || 0;
        critico += item.stats.critico || 0;
        evasion += item.stats.evasion || 0;
      }
    });

    return { ataque, defensa, hp, velocidad, critico, evasion };
  };

  const totalStats = getTotalStats();
  const equippedCount = Object.values(equippedItems).filter(Boolean).length;

  return (
    <div className="inventory-page">
      {/* Header */}
      <header className="inventory-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Volver
        </button>
        <h1>🎒 Inventario</h1>
        <div className="inventory-capacity">
          {backpackItems.length}/{user?.limiteInventarioEquipamiento || 50}
        </div>
      </header>

      <div className="inventory-container">
        {/* Panel Izquierdo - Personaje y Equipamiento */}
        <aside className="equipment-panel">
          <div className="character-display">
            <div className="character-avatar">
              <img src="/assets/icons/character-placeholder.png" alt="Personaje" />
            </div>
            <h3>{user?.username || 'Aventurero'}</h3>
            <span className="character-level">Nivel {user?.personajes?.[0]?.nivel || 1}</span>
          </div>

          {/* Slots de Equipamiento */}
          <div className="equipment-slots">
            <h4>Equipamiento ({equippedCount}/6)</h4>
            <div className="slots-grid">
              {(['weapon', 'helmet', 'armor', 'boots', 'accessory1', 'accessory2'] as const).map(slot => {
                const item = equippedItems[slot];
                const slotLabels = {
                  weapon: '⚔️ Arma',
                  helmet: '🪖 Casco',
                  armor: '🛡️ Armadura',
                  boots: '👢 Botas',
                  accessory1: '💍 Accesorio 1',
                  accessory2: '💎 Accesorio 2',
                };
                
                return (
                  <div
                    key={slot}
                    className={`equipment-slot ${item ? 'filled' : 'empty'}`}
                    style={item ? getRarityStyle(item.rareza) : {}}
                    onClick={() => item && setSelectedItem(item)}
                  >
                    {item ? (
                      <>
                        <span className="slot-icon">{item.tipo === 'weapon' ? '⚔️' : item.tipo === 'armor' ? '🛡️' : '💎'}</span>
                        <span className="slot-name">{item.nombre}</span>
                        <span className="slot-level">+{item.mejoras}</span>
                      </>
                    ) : (
                      <span className="slot-label">{slotLabels[slot]}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats Totales */}
          <div className="total-stats">
            <h4>📊 Stats Totales</h4>
            <div className="stats-grid">
              <div className="stat-item attack">
                <span className="stat-icon">⚔️</span>
                <span className="stat-value">{totalStats.ataque}</span>
                <span className="stat-name">ATK</span>
              </div>
              <div className="stat-item defense">
                <span className="stat-icon">🛡️</span>
                <span className="stat-value">{totalStats.defensa}</span>
                <span className="stat-name">DEF</span>
              </div>
              <div className="stat-item hp">
                <span className="stat-icon">❤️</span>
                <span className="stat-value">{totalStats.hp}</span>
                <span className="stat-name">HP</span>
              </div>
              <div className="stat-item speed">
                <span className="stat-icon">💨</span>
                <span className="stat-value">{totalStats.velocidad}</span>
                <span className="stat-name">SPD</span>
              </div>
              <div className="stat-item crit">
                <span className="stat-icon">💥</span>
                <span className="stat-value">{totalStats.critico}%</span>
                <span className="stat-name">CRIT</span>
              </div>
              <div className="stat-item evasion">
                <span className="stat-icon">🌀</span>
                <span className="stat-value">{totalStats.evasion}%</span>
                <span className="stat-name">EVA</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Panel Central - Mochila */}
        <main className="backpack-panel">
          {/* Tabs */}
          <div className="inventory-tabs">
            <button
              className={`tab-btn ${activeTab === 'equipment' ? 'active' : ''}`}
              onClick={() => setActiveTab('equipment')}
            >
              🗡️ Equipamiento
            </button>
            <button
              className={`tab-btn ${activeTab === 'consumables' ? 'active' : ''}`}
              onClick={() => setActiveTab('consumables')}
            >
              🧪 Consumibles
            </button>
          </div>

          {/* Items Grid */}
          <div className="items-grid">
            {activeTab === 'equipment' ? (
              backpackItems.length > 0 ? (
                backpackItems.map(item => (
                  <div
                    key={item.id}
                    className={`item-card ${selectedItem?.id === item.id ? 'selected' : ''}`}
                    style={getRarityStyle(item.rareza)}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="item-icon">⚔️</div>
                    <div className="item-info">
                      <span className="item-name">{item.nombre}</span>
                      <span className="item-level">Nv. {item.nivel}</span>
                    </div>
                    <span 
                      className="item-rarity"
                      style={{ color: RARITY_COLORS[item.rareza] }}
                    >
                      {RARITY_NAMES[item.rareza]}
                    </span>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <span className="empty-icon">📦</span>
                  <p>No tienes equipamiento en la mochila</p>
                </div>
              )
            ) : (
              consumables.length > 0 ? (
                consumables.map(item => (
                  <div
                    key={item.id}
                    className={`item-card consumable ${selectedItem?.id === item.id ? 'selected' : ''}`}
                    style={getRarityStyle(item.rareza)}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="item-icon">🧪</div>
                    <div className="item-info">
                      <span className="item-name">{item.nombre}</span>
                      <span className="item-quantity">x{item.cantidad}</span>
                    </div>
                    <span 
                      className="item-rarity"
                      style={{ color: RARITY_COLORS[item.rareza] }}
                    >
                      {RARITY_NAMES[item.rareza]}
                    </span>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <span className="empty-icon">🧪</span>
                  <p>No tienes consumibles</p>
                </div>
              )
            )}
          </div>
        </main>

        {/* Panel Derecho - Detalles del Item */}
        <aside className="details-panel">
          {selectedItem ? (
            <div className="item-details">
              <div 
                className="detail-header"
                style={{ borderColor: RARITY_COLORS[selectedItem.rareza] }}
              >
                <div className="detail-icon">
                  {selectedItem.tipo === 'consumable' ? '🧪' : '⚔️'}
                </div>
                <div className="detail-title">
                  <h3>{selectedItem.nombre}</h3>
                  <span 
                    className="detail-rarity"
                    style={{ color: RARITY_COLORS[selectedItem.rareza] }}
                  >
                    {RARITY_NAMES[selectedItem.rareza]}
                  </span>
                </div>
              </div>

              <p className="detail-description">{selectedItem.descripcion}</p>

              <div className="detail-stats">
                <h4>📊 Estadísticas</h4>
                {Object.entries(selectedItem.stats).map(([stat, value]) => (
                  value ? (
                    <div key={stat} className="detail-stat">
                      <span className="stat-label">{stat.toUpperCase()}</span>
                      <span className="stat-value">+{value}</span>
                    </div>
                  ) : null
                ))}
              </div>

              {'mejoras' in selectedItem && (
                <div className="detail-upgrades">
                  <h4>⬆️ Mejoras</h4>
                  <div className="upgrade-bar">
                    <div 
                      className="upgrade-progress"
                      style={{ width: `${((selectedItem as EquipmentItem).mejoras / (selectedItem as EquipmentItem).maxMejoras) * 100}%` }}
                    />
                  </div>
                  <span>{(selectedItem as EquipmentItem).mejoras}/{(selectedItem as EquipmentItem).maxMejoras}</span>
                </div>
              )}

              <div className="detail-price">
                <span>💰 Valor:</span>
                <span className="price-value">{selectedItem.precio.toLocaleString()} VAL</span>
              </div>

              <div className="detail-actions">
                {'equipado' in selectedItem ? (
                  <>
                    {!(selectedItem as EquipmentItem).equipado && (
                      <button className="action-btn equip">⚔️ Equipar</button>
                    )}
                    {(selectedItem as EquipmentItem).equipado && (
                      <button className="action-btn unequip">📤 Desequipar</button>
                    )}
                    <button className="action-btn upgrade">⬆️ Mejorar</button>
                    <button className="action-btn sell">💰 Vender</button>
                  </>
                ) : (
                  <>
                    <button className="action-btn use">🧪 Usar</button>
                    <button className="action-btn sell">💰 Vender</button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <span className="empty-icon">👆</span>
              <p>Selecciona un item para ver sus detalles</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Inventory;
