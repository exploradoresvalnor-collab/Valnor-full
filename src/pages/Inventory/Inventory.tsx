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
import { inventoryService } from '../../services';
import './Inventory.css';

/** Maps raw backend equipment item */
function mapEquipment(raw: any): EquipmentItem {
  return {
    id: raw._id || raw.id,
    nombre: raw.nombre || raw.name || 'Item',
    descripcion: raw.descripcion || raw.description || '',
    tipo: raw.tipo || raw.type || 'weapon',
    rareza: raw.rareza || raw.rarity || 'common',
    nivel: raw.nivel || raw.level || 1,
    stats: raw.stats || raw.estadisticas || {},
    precio: raw.precio || raw.price || 0,
    equipado: raw.equipado || raw.isEquipped || false,
    slot: raw.slot || raw.tipo || 'weapon',
    mejoras: raw.mejoras || raw.upgrades || 0,
    maxMejoras: raw.maxMejoras || raw.maxUpgrades || 10,
  };
}

/** Maps raw backend consumable */
function mapConsumable(raw: any): ConsumableItem {
  return {
    id: raw._id || raw.id,
    nombre: raw.nombre || raw.name || 'Consumible',
    descripcion: raw.descripcion || raw.description || '',
    tipo: 'consumable',
    rareza: raw.rareza || raw.rarity || 'common',
    nivel: raw.nivel || raw.level || 1,
    stats: raw.stats || {},
    precio: raw.precio || raw.price || 0,
    cantidad: raw.cantidad || raw.quantity || 1,
    efecto: raw.efecto || raw.effect || '',
    duracion: raw.duracion || raw.duration,
  };
}

type InventoryTab = 'equipment' | 'consumables';

const Inventory: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<InventoryTab>('equipment');
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | ConsumableItem | null>(null);
  const [equippedItems, setEquippedItems] = useState<EquippedItems>({
    weapon: null, armor: null, helmet: null, boots: null, accessory1: null, accessory2: null,
  });
  const [backpackItems, setBackpackItems] = useState<EquipmentItem[]>([]);
  const [consumables, setConsumables] = useState<ConsumableItem[]>([]);
  const [invLoading, setInvLoading] = useState(true);
  const [invError, setInvError] = useState<string | null>(null);
  const [invCapacity, setInvCapacity] = useState({ current: 0, max: 50 });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/login');
    }
  }, [user, loading, navigate]);

  // Fetch real inventory data
  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;

    const fetchInventory = async () => {
      setInvLoading(true);
      setInvError(null);
      try {
        const inventory = await inventoryService.getMyInventory();
        if (cancelled) return;

        const inv = inventory as any;

        // Equipment
        if (inv.equipment || inv.equipamiento) {
          const eqArr = (inv.equipment || inv.equipamiento || []) as any[];
          const equipped: EquippedItems = {
            weapon: null, armor: null, helmet: null, boots: null, accessory1: null, accessory2: null,
          };
          const backpack: EquipmentItem[] = [];

          eqArr.forEach((raw: any) => {
            const item = mapEquipment(raw);
            if (item.equipado) {
              const slot = item.slot as keyof EquippedItems;
              if (slot in equipped) {
                equipped[slot] = item;
              }
            } else {
              backpack.push(item);
            }
          });

          setEquippedItems(equipped);
          setBackpackItems(backpack);
        }

        // Consumables
        if (inv.consumables || inv.consumibles) {
          const conArr = (inv.consumables || inv.consumibles || []) as any[];
          setConsumables(conArr.map(mapConsumable));
        }

        // Capacity limits
        if (inv.limits || inv.limites) {
          const limits = inv.limits || inv.limites;
          setInvCapacity({
            current: (inv.equipment?.length || 0) + (inv.consumables?.length || 0),
            max: limits.maxEquipamiento || limits.maxEquipment || 50,
          });
        }

      } catch (err: any) {
        console.error('[Inventory] Error loading:', err);
        if (!cancelled) setInvError(err.message || 'Error cargando inventario');
      } finally {
        if (!cancelled) setInvLoading(false);
      }
    };

    fetchInventory();
    return () => { cancelled = true; };
  }, [loading, user]);

  if (loading || invLoading) {
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
          {invCapacity.current}/{invCapacity.max}
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
