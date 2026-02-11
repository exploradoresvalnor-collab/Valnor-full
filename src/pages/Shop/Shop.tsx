import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useIsGuest } from '../../stores/sessionStore';
import { usePlayerStore } from '../../stores/playerStore';
import { GuestBanner } from '../../components/ui';
import { Item, ItemRarity, RARITY_COLORS, RARITY_NAMES } from '../../types/item.types';
import { inventoryService, shopService, userService } from '../../services';
import './Shop.css';

interface ShopItem extends Item {
  stock: number;
  descuento?: number;
  destacado?: boolean;
}

/** Maps a backend item to ShopItem */
function mapToShopItem(raw: any): ShopItem {
  return {
    id: raw._id || raw.id || `item_${Math.random()}`,
    nombre: raw.nombre || raw.name || 'Item desconocido',
    descripcion: raw.descripcion || raw.description || '',
    tipo: raw.tipo || raw.type || 'weapon',
    rareza: raw.rareza || raw.rarity || 'common',
    nivel: raw.nivel || raw.level || 1,
    stats: raw.stats || raw.estadisticas || {},
    precio: raw.precio || raw.price || raw.costoVal || 0,
    stock: raw.stock ?? raw.cantidad ?? 99,
    descuento: raw.descuento || raw.discount,
    destacado: raw.destacado || raw.featured || false,
  };
}

type ShopCategory = 'all' | 'weapons' | 'armor' | 'accessories' | 'consumables' | 'packages';
type SortOption = 'price-asc' | 'price-desc' | 'level' | 'rarity';

const Shop: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isGuest = useIsGuest();
  const gold = usePlayerStore((s) => s.gold);
  const [category, setCategory] = useState<ShopCategory>('all');
  const [sortBy, setSortBy] = useState<SortOption>('price-asc');
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Real data state
  const [equipmentItems, setEquipmentItems] = useState<ShopItem[]>([]);
  const [consumableItemsList, setConsumableItemsList] = useState<ShopItem[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [shopLoading, setShopLoading] = useState(true);
  const [shopError, setShopError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);
  const [walletVal, setWalletVal] = useState(0);

  // Fetch real shop data
  useEffect(() => {
    if (isGuest || loading) return;
    let cancelled = false;

    const fetchShop = async () => {
      setShopLoading(true);
      setShopError(null);
      try {
        const [equipment, consumables, shopPkgs, resources] = await Promise.all([
          inventoryService.getEquipmentCatalog().catch(() => []),
          inventoryService.getConsumablesCatalog().catch(() => []),
          shopService.getShopPackages().catch(() => []),
          userService.getResources().catch(() => null),
        ]);

        if (cancelled) return;

        // Map equipment
        const eqItems = Array.isArray(equipment)
          ? (equipment as any[]).map(mapToShopItem)
          : [];
        setEquipmentItems(eqItems);

        // Map consumables
        const conItems = Array.isArray(consumables)
          ? (consumables as any[]).map((c: any) => mapToShopItem({ ...c, tipo: 'consumable' }))
          : [];
        setConsumableItemsList(conItems);

        // Packages
        setPackages(Array.isArray(shopPkgs) ? shopPkgs : []);

        // Wallet
        if (resources) {
          const r = resources as any;
          setWalletVal(r.val ?? r.gold ?? 0);
          const store = usePlayerStore.getState();
          if (r.val !== undefined) store.addGold(r.val - store.gold);
        }
      } catch (err: any) {
        console.error('[Shop] Error loading:', err);
        if (!cancelled) setShopError(err.message || 'Error cargando la tienda');
      } finally {
        if (!cancelled) setShopLoading(false);
      }
    };

    fetchShop();
    return () => { cancelled = true; };
  }, [isGuest, loading]);

  if (loading || shopLoading) {
    return (
      <div className="shop-loading">
        <div className="loading-spinner" />
        <p>Cargando tienda...</p>
      </div>
    );
  }

  const allItems = [...equipmentItems, ...consumableItemsList];

  const getFilteredItems = () => {
    let items = [...allItems];

    switch (category) {
      case 'weapons':
        items = equipmentItems.filter(i => i.tipo === 'weapon' || i.tipo === 'arma');
        break;
      case 'armor':
        items = equipmentItems.filter(i => ['armor', 'armadura', 'helmet', 'casco', 'boots', 'botas'].includes(i.tipo));
        break;
      case 'accessories':
        items = equipmentItems.filter(i => i.tipo === 'accessory' || i.tipo === 'accesorio');
        break;
      case 'consumables':
        items = [...consumableItemsList];
        break;
      case 'packages':
        return []; // Packages rendered separately
    }

    if (searchTerm) {
      items = items.filter(i => 
        i.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const rarityOrder: ItemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    switch (sortBy) {
      case 'price-asc':
        items.sort((a, b) => a.precio - b.precio);
        break;
      case 'price-desc':
        items.sort((a, b) => b.precio - a.precio);
        break;
      case 'level':
        items.sort((a, b) => b.nivel - a.nivel);
        break;
      case 'rarity':
        items.sort((a, b) => rarityOrder.indexOf(b.rareza) - rarityOrder.indexOf(a.rareza));
        break;
    }

    return items;
  };

  const getFinalPrice = (item: ShopItem) => {
    if (item.descuento) {
      return Math.floor(item.precio * (1 - item.descuento / 100));
    }
    return item.precio;
  };

  const canAfford = (item: ShopItem, qty: number = 1) => {
    const balance = walletVal || gold || (user?.val || 0);
    return balance >= getFinalPrice(item) * qty;
  };

  const handlePurchase = async () => {
    if (!selectedItem || purchasing) return;
    setPurchasing(true);
    setPurchaseMessage(null);
    try {
      await shopService.purchase(selectedItem.id, selectedItem.tipo === 'consumable' ? purchaseQuantity : 1);
      setPurchaseMessage(`¡Compraste ${selectedItem.nombre}!`);
      // Refresh resources
      const resources = await userService.getResources().catch(() => null);
      if (resources) {
        const r = resources as any;
        setWalletVal(r.val ?? r.gold ?? walletVal);
        const store = usePlayerStore.getState();
        if (r.val !== undefined) store.addGold(r.val - store.gold);
      }
    } catch (err: any) {
      setPurchaseMessage(err.message || 'Error al comprar');
    } finally {
      setPurchasing(false);
      setShowPurchaseModal(false);
      setPurchaseQuantity(1);
      setTimeout(() => setPurchaseMessage(null), 3000);
    }
  };

  const filteredItems = getFilteredItems();
  const featuredItems = allItems.filter(i => i.destacado);

  return (
    <div className="shop-page">
      {/* Header */}
      <header className="shop-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Volver
        </button>
        <h1>🏪 Tienda</h1>
        <div className="wallet-display">
          <span className="wallet-icon">💰</span>
          <span className="wallet-amount">{(walletVal || gold || 0).toLocaleString()}</span>
          <span className="wallet-label">VAL</span>
        </div>
      </header>

      {/* Banner para invitados */}
      {isGuest && (
        <div className="shop-guest-banner">
          <GuestBanner 
            message="Puedes ver los items pero no comprar. Regístrate para desbloquear la tienda completa."
            variant="locked"
          />
        </div>
      )}

      <div className="shop-container">
        {/* Sidebar */}
        <aside className="shop-sidebar">
          <div className="sidebar-section">
            <h3>📂 Categorías</h3>
            <nav className="category-nav">
              {[
                { id: 'all', icon: '🛒', label: 'Todos' },
                { id: 'weapons', icon: '⚔️', label: 'Armas' },
                { id: 'armor', icon: '🛡️', label: 'Armaduras' },
                { id: 'accessories', icon: '💍', label: 'Accesorios' },
                { id: 'consumables', icon: '🧪', label: 'Consumibles' },
                { id: 'packages', icon: '📦', label: `Paquetes (${packages.length})` },
              ].map(cat => (
                <button
                  key={cat.id}
                  className={`category-btn ${category === cat.id ? 'active' : ''}`}
                  onClick={() => setCategory(cat.id as ShopCategory)}
                >
                  <span className="cat-icon">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="sidebar-section">
            <h3>⭐ Destacados</h3>
            <div className="featured-list">
              {featuredItems.slice(0, 3).map(item => (
                <div
                  key={item.id}
                  className="featured-item"
                  style={{ borderColor: RARITY_COLORS[item.rareza] }}
                  onClick={() => setSelectedItem(item)}
                >
                  <span className="featured-name">{item.nombre}</span>
                  <span className="featured-price">{getFinalPrice(item).toLocaleString()} VAL</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="shop-main">
          {/* Filters */}
          <div className="shop-filters">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Buscar items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="sort-select">
              <label>Ordenar:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
                <option value="price-asc">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
                <option value="level">Nivel</option>
                <option value="rarity">Rareza</option>
              </select>
            </div>
          </div>

          {/* Items Grid */}
          {shopError && (
            <div className="shop-error">
              <p>⚠️ {shopError}</p>
            </div>
          )}
          {purchaseMessage && (
            <div className="shop-message">
              <p>{purchaseMessage}</p>
            </div>
          )}
          {category === 'packages' ? (
            <div className="shop-grid">
              {packages.length === 0 ? (
                <div className="no-items"><p>No hay paquetes disponibles</p></div>
              ) : packages.map((pkg: any) => (
                <div
                  key={pkg._id || pkg.id}
                  className={`shop-card featured`}
                  style={{ borderColor: '#ffd700' }}
                  onClick={() => setSelectedItem({
                    id: pkg._id || pkg.id,
                    nombre: pkg.nombre || pkg.name,
                    descripcion: pkg.descripcion || pkg.description || '',
                    tipo: 'package' as any,
                    rareza: pkg.rareza || 'rare',
                    nivel: 1,
                    stats: {},
                    precio: pkg.precio || pkg.costoVal || 0,
                    stock: 99,
                    destacado: true,
                  })}
                >
                  <span className="featured-badge">📦</span>
                  <div className="card-icon">📦</div>
                  <h4 className="card-name">{pkg.nombre || pkg.name}</h4>
                  <span className="card-rarity" style={{ color: '#ffd700' }}>PAQUETE</span>
                  <div className="card-price">
                    <span className="final-price">{(pkg.precio || pkg.costoVal || 0).toLocaleString()}</span>
                    <span className="price-label">VAL</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
          <div className="shop-grid">
            {filteredItems.length === 0 ? (
              <div className="no-items"><p>No hay items en esta categoría</p></div>
            ) : filteredItems.map(item => (
              <div
                key={item.id}
                className={`shop-card ${selectedItem?.id === item.id ? 'selected' : ''} ${item.destacado ? 'featured' : ''}`}
                style={{ borderColor: RARITY_COLORS[item.rareza] }}
                onClick={() => setSelectedItem(item)}
              >
                {item.destacado && <span className="featured-badge">⭐</span>}
                {item.descuento && <span className="discount-badge">-{item.descuento}%</span>}
                
                <div className="card-icon">
                  {item.tipo === 'weapon' && '⚔️'}
                  {item.tipo === 'armor' && '🛡️'}
                  {item.tipo === 'helmet' && '🪖'}
                  {item.tipo === 'boots' && '👢'}
                  {item.tipo === 'accessory' && '💍'}
                  {item.tipo === 'consumable' && '🧪'}
                </div>

                <h4 className="card-name">{item.nombre}</h4>
                
                <span 
                  className="card-rarity"
                  style={{ color: RARITY_COLORS[item.rareza] }}
                >
                  {RARITY_NAMES[item.rareza]}
                </span>

                <div className="card-price">
                  {item.descuento ? (
                    <>
                      <span className="original-price">{item.precio.toLocaleString()}</span>
                      <span className="final-price">{getFinalPrice(item).toLocaleString()}</span>
                    </>
                  ) : (
                    <span className="final-price">{item.precio.toLocaleString()}</span>
                  )}
                  <span className="price-label">VAL</span>
                </div>

                <span className="card-stock">Stock: {item.stock}</span>
              </div>
            ))}
          </div>
          )}
        </main>

        {/* Item Details Panel */}
        <aside className="details-panel">
          {selectedItem ? (
            <div className="item-details">
              <div 
                className="detail-header"
                style={{ borderColor: RARITY_COLORS[selectedItem.rareza] }}
              >
                <div className="detail-icon">
                  {selectedItem.tipo === 'weapon' && '⚔️'}
                  {selectedItem.tipo === 'armor' && '🛡️'}
                  {selectedItem.tipo === 'helmet' && '🪖'}
                  {selectedItem.tipo === 'boots' && '👢'}
                  {selectedItem.tipo === 'accessory' && '💍'}
                  {selectedItem.tipo === 'consumable' && '🧪'}
                </div>
                <div className="detail-title">
                  <h3>{selectedItem.nombre}</h3>
                  <span 
                    className="detail-rarity"
                    style={{ color: RARITY_COLORS[selectedItem.rareza] }}
                  >
                    {RARITY_NAMES[selectedItem.rareza]} • Nv. {selectedItem.nivel}
                  </span>
                </div>
              </div>

              <p className="detail-description">{selectedItem.descripcion}</p>

              {Object.keys(selectedItem.stats).length > 0 && (
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
              )}

              <div className="detail-purchase">
                <div className="price-display">
                  {selectedItem.descuento ? (
                    <>
                      <span className="original">{selectedItem.precio.toLocaleString()}</span>
                      <span className="discounted">{getFinalPrice(selectedItem).toLocaleString()}</span>
                    </>
                  ) : (
                    <span className="current">{selectedItem.precio.toLocaleString()}</span>
                  )}
                  <span className="val-label">VAL</span>
                </div>

                {selectedItem.tipo === 'consumable' && (
                  <div className="quantity-selector">
                    <button 
                      onClick={() => setPurchaseQuantity(Math.max(1, purchaseQuantity - 1))}
                      disabled={purchaseQuantity <= 1}
                    >
                      -
                    </button>
                    <span>{purchaseQuantity}</span>
                    <button 
                      onClick={() => setPurchaseQuantity(Math.min(selectedItem.stock, purchaseQuantity + 1))}
                      disabled={purchaseQuantity >= selectedItem.stock}
                    >
                      +
                    </button>
                  </div>
                )}

                <div className="total-price">
                  <span>Total:</span>
                  <span className="total-value">
                    {(getFinalPrice(selectedItem) * (selectedItem.tipo === 'consumable' ? purchaseQuantity : 1)).toLocaleString()} VAL
                  </span>
                </div>

                <button
                  className={`buy-btn ${!canAfford(selectedItem, selectedItem.tipo === 'consumable' ? purchaseQuantity : 1) ? 'disabled' : ''}`}
                  onClick={() => setShowPurchaseModal(true)}
                  disabled={!canAfford(selectedItem, selectedItem.tipo === 'consumable' ? purchaseQuantity : 1)}
                >
                  {canAfford(selectedItem, selectedItem.tipo === 'consumable' ? purchaseQuantity : 1) 
                    ? '🛒 Comprar' 
                    : '❌ VAL Insuficiente'}
                </button>
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <span className="empty-icon">🛍️</span>
              <p>Selecciona un item para ver detalles</p>
            </div>
          )}
        </aside>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowPurchaseModal(false)}>
          <div className="purchase-modal" onClick={e => e.stopPropagation()}>
            <h3>Confirmar Compra</h3>
            <div className="modal-item">
              <span className="modal-name">{selectedItem.nombre}</span>
              {selectedItem.tipo === 'consumable' && (
                <span className="modal-qty">x{purchaseQuantity}</span>
              )}
            </div>
            <div className="modal-total">
              <span>Total a pagar:</span>
              <span className="modal-price">
                {(getFinalPrice(selectedItem) * (selectedItem.tipo === 'consumable' ? purchaseQuantity : 1)).toLocaleString()} VAL
              </span>
            </div>
            <div className="modal-balance">
              <span>Tu balance después:</span>
              <span className="balance-after">
                {((walletVal || gold || 0) - getFinalPrice(selectedItem) * (selectedItem.tipo === 'consumable' ? purchaseQuantity : 1)).toLocaleString()} VAL
              </span>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowPurchaseModal(false)}>
                Cancelar
              </button>
              <button className="confirm-btn" onClick={handlePurchase}>
                ✓ Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;
