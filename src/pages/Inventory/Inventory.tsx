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
import { inventoryService, shopService } from '../../services';
import { PackageOpener } from '../../components/ui';
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

type InventoryTab = 'equipment' | 'consumables' | 'packages';

const Inventory: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<InventoryTab>('equipment');
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | ConsumableItem | any | null>(null);
  const [equippedItems, setEquippedItems] = useState<EquippedItems>({
    weapon: null, armor: null, helmet: null, boots: null, accessory1: null, accessory2: null,
  });
  const [backpackItems, setBackpackItems] = useState<EquipmentItem[]>([]);
  const [consumables, setConsumables] = useState<ConsumableItem[]>([]);
  const [userPackages, setUserPackages] = useState<any[]>([]);
  const [openingPackage, setOpeningPackage] = useState<any | null>(null);
  const [confirmOpenModal, setConfirmOpenModal] = useState<boolean>(false);
  const [openSuccessMsg, setOpenSuccessMsg] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [invLoading, setInvLoading] = useState(true);
  const [invError, setInvError] = useState<string | null>(null);
  const [invCapacity, setInvCapacity] = useState({ current: 0, max: 50 });

  // Fetch inventory data (real or demo)
  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;

    const fetchInventory = async () => {
      setInvLoading(true);
      setInvError(null);
      try {
        // Load real inventory and packages
        const [inventory, packagesResp] = await Promise.all([
          inventoryService.getMyInventory(),
          shopService.getUserPackages(user.id).catch(() => [])
        ]);
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

        // Packages 
        const pkgs = Array.isArray(packagesResp) ? packagesResp : [];
        setUserPackages(pkgs.filter((p: any) => !p.abierto));

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
  }, [loading, user, refreshKey]);

  if (loading || invLoading) {
    return (
      <div className="inventory-loading">
        <div className="loading-spinner" />
        <p>Cargando inventario...</p>
      </div>
    );
  }

  if (invError) {
    return (
      <div className="inventory-loading">
        <p style={{ color: '#ef4444' }}>⚠️ {invError}</p>
        <button onClick={() => navigate('/dashboard')} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: 'rgba(255,215,0,0.2)', border: '1px solid #f59e0b', color: '#f59e0b', borderRadius: '8px', cursor: 'pointer' }}>
          Volver al Dashboard
        </button>
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
      {/* Post-Open Success Toast */}
      {openSuccessMsg && (
        <div className="open-success-toast">
          <span>✨ {openSuccessMsg}</span>
          <button onClick={() => navigate('/dashboard')} className="toast-dashboard-btn">
            Ir al Dashboard →
          </button>
        </div>
      )}
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
            <button
              className={`tab-btn ${activeTab === 'packages' ? 'active' : ''}`}
              onClick={() => setActiveTab('packages')}
            >
              📦 Paquetes {userPackages.length > 0 && <span className="notification-badge">{userPackages.length}</span>}
            </button>
          </div>

          {/* Items Grid */}
          <div className="items-grid">
            {activeTab === 'packages' ? (
              userPackages.length > 0 ? (
                userPackages.map(pkg => (
                  <div
                    key={pkg._id || pkg.id}
                    className={`item-card package ${selectedItem?._id === pkg._id ? 'selected' : ''}`}
                    style={getRarityStyle('rare')}
                    onClick={() => setSelectedItem({ ...pkg, isPackage: true })}
                  >
                    <div className="item-icon">📦</div>
                    <div className="item-info">
                      <span className="item-name">{pkg.nombre || 'Paquete Misterioso'}</span>
                    </div>
                    <span
                      className="item-rarity"
                      style={{ color: RARITY_COLORS['rare'] }}
                    >
                      EPIC
                    </span>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <span className="empty-icon">📦</span>
                  <p>No tienes paquetes cerrados</p>
                </div>
              )
            ) : activeTab === 'equipment' ? (
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
                style={{ borderColor: RARITY_COLORS[selectedItem.rareza as ItemRarity] || '#ffd700' }}
              >
                <div className="detail-icon">
                  {selectedItem.isPackage ? '📦' : selectedItem.tipo === 'consumable' ? '🧪' : '⚔️'}
                </div>
                <div className="detail-title">
                  <h3>{selectedItem.nombre || 'Objeto Valnoriano'}</h3>
                  <span
                    className="detail-rarity"
                    style={{ color: RARITY_COLORS[selectedItem.rareza as ItemRarity] || '#ffd700' }}
                  >
                    {selectedItem.isPackage ? 'EPIC' : RARITY_NAMES[selectedItem.rareza as ItemRarity]}
                  </span>
                </div>
              </div>

              <p className="detail-description">{selectedItem.descripcion || 'Una extraña reliquia.'}</p>

              {selectedItem.stats && Object.keys(selectedItem.stats).length > 0 && (
                <div className="detail-stats">
                  <h4>📊 Estadísticas</h4>
                  {Object.entries(selectedItem.stats).map(([stat, value]) => (
                    value ? (
                      <div key={stat} className="detail-stat">
                        <span className="stat-label">{stat.toUpperCase()}</span>
                        <span className="stat-value">+{value as number}</span>
                      </div>
                    ) : null
                  ))}
                </div>
              )}

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

              {selectedItem.precio != null && (
                <div className="detail-price">
                  <span>💰 Valor:</span>
                  <span className="price-value">{(selectedItem.precio || 0).toLocaleString()} VAL</span>
                </div>
              )}

              <div className="detail-actions">
                {selectedItem.isPackage ? (
                  <button
                    className="action-btn buy-btn package-magic-btn"
                    onClick={() => setConfirmOpenModal(true)}
                  >
                    ✨ INVOCAR ✨
                  </button>
                ) : 'equipado' in selectedItem ? (
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

      {/* Confirmation Modal for Packages */}
      {confirmOpenModal && selectedItem && selectedItem.isPackage && (
        <div className="modal-overlay" onClick={() => setConfirmOpenModal(false)}>
          <div className="purchase-modal cinematic-modal" onClick={e => e.stopPropagation()}>
            <h3>Confirmar Invocación</h3>
            <div className="modal-item" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: 'transparent' }}>
              <span style={{ fontSize: '3rem', filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.5))' }}>📦</span>
              <span className="modal-name" style={{ fontSize: '1.2rem', margin: '1rem 0', color: '#f59e0b' }}>
                {selectedItem.nombre}
              </span>
              <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '1rem' }}>
                ¿Estás listo para romper el sello y revelar su contenido?
              </p>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setConfirmOpenModal(false)}>
                Mejor no
              </button>
              <button
                className="confirm-btn confirm-magic"
                onClick={() => {
                  setConfirmOpenModal(false);
                  setOpeningPackage(selectedItem);
                }}
              >
                🔥 Romper Sello 🔥
              </button>
            </div>
          </div>
        </div>
      )}

      {openingPackage && (
        <PackageOpener
          packageName={openingPackage.nombre || 'Paquete Misterioso'}
          onOpen={async () => {
            const result = await shopService.openPackageById(openingPackage._id || openingPackage.paqueteId);
            return result;
          }}
          onClose={() => {
            setOpeningPackage(null);
            setSelectedItem(null);
            setOpenSuccessMsg('¡Tus nuevos héroes e items ya están disponibles! Revisa tu equipo en el Dashboard.');
            setRefreshKey(k => k + 1);
            setTimeout(() => setOpenSuccessMsg(null), 6000);
          }}
        />
      )}
    </div>
  );
};

export default Inventory;
