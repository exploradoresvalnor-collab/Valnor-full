import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useIsGuest } from '../../stores/sessionStore';
import { GuestBanner } from '../../components/ui';
import { Item, ItemRarity, RARITY_COLORS, RARITY_NAMES } from '../../types/item.types';
import './Shop.css';

interface ShopItem extends Item {
  stock: number;
  descuento?: number;
  destacado?: boolean;
}

// Mock shop items
const shopItems: ShopItem[] = [
  {
    id: 's1',
    nombre: 'Espada de Hierro',
    descripcion: 'Una espada básica pero confiable para principiantes',
    tipo: 'weapon',
    rareza: 'common',
    nivel: 1,
    stats: { ataque: 10 },
    precio: 100,
    stock: 99,
  },
  {
    id: 's2',
    nombre: 'Espada de Acero',
    descripcion: 'Mejor filo y durabilidad que el hierro',
    tipo: 'weapon',
    rareza: 'uncommon',
    nivel: 5,
    stats: { ataque: 25, critico: 5 },
    precio: 500,
    stock: 50,
  },
  {
    id: 's3',
    nombre: 'Katana del Viento',
    descripcion: 'Ligera y mortal, perfecta para ataques rápidos',
    tipo: 'weapon',
    rareza: 'rare',
    nivel: 10,
    stats: { ataque: 40, velocidad: 15, critico: 10 },
    precio: 2500,
    stock: 10,
    destacado: true,
  },
  {
    id: 's4',
    nombre: 'Armadura de Cuero',
    descripcion: 'Protección básica sin sacrificar movilidad',
    tipo: 'armor',
    rareza: 'common',
    nivel: 1,
    stats: { defensa: 8, evasion: 2 },
    precio: 80,
    stock: 99,
  },
  {
    id: 's5',
    nombre: 'Armadura de Malla',
    descripcion: 'Balance perfecto entre defensa y peso',
    tipo: 'armor',
    rareza: 'uncommon',
    nivel: 5,
    stats: { defensa: 20, hp: 50 },
    precio: 450,
    stock: 30,
  },
  {
    id: 's6',
    nombre: 'Peto del Guardián',
    descripcion: 'Forjado por los mejores herreros del reino',
    tipo: 'armor',
    rareza: 'rare',
    nivel: 12,
    stats: { defensa: 45, hp: 150 },
    precio: 3000,
    stock: 5,
  },
  {
    id: 's7',
    nombre: 'Casco de Bronce',
    descripcion: 'Protege tu cabeza de golpes críticos',
    tipo: 'helmet',
    rareza: 'common',
    nivel: 1,
    stats: { defensa: 5 },
    precio: 60,
    stock: 99,
  },
  {
    id: 's8',
    nombre: 'Botas de Viajero',
    descripcion: 'Cómodas para largas travesías',
    tipo: 'boots',
    rareza: 'common',
    nivel: 1,
    stats: { velocidad: 5 },
    precio: 50,
    stock: 99,
  },
  {
    id: 's9',
    nombre: 'Botas de Viento',
    descripcion: 'Encantadas para aumentar tu velocidad',
    tipo: 'boots',
    rareza: 'rare',
    nivel: 8,
    stats: { velocidad: 25, evasion: 10 },
    precio: 1800,
    stock: 8,
    descuento: 20,
  },
  {
    id: 's10',
    nombre: 'Anillo de Poder',
    descripcion: 'Aumenta el daño de todas tus habilidades',
    tipo: 'accessory',
    rareza: 'epic',
    nivel: 15,
    stats: { ataque: 30, critico: 15 },
    precio: 8000,
    stock: 2,
    destacado: true,
  },
  {
    id: 's11',
    nombre: 'Amuleto de Vida',
    descripcion: 'Incrementa tu vitalidad máxima',
    tipo: 'accessory',
    rareza: 'rare',
    nivel: 10,
    stats: { hp: 200, defensa: 10 },
    precio: 2200,
    stock: 6,
  },
  {
    id: 's12',
    nombre: 'Collar del Dragón',
    descripcion: 'Contiene la esencia de un dragón ancestral',
    tipo: 'accessory',
    rareza: 'legendary',
    nivel: 25,
    stats: { ataque: 50, hp: 300, critico: 20 },
    precio: 25000,
    stock: 1,
    destacado: true,
  },
];

// Consumables
const consumableItems: ShopItem[] = [
  {
    id: 'c1',
    nombre: 'Poción de Vida (S)',
    descripcion: 'Restaura 50 HP',
    tipo: 'consumable',
    rareza: 'common',
    nivel: 1,
    stats: {},
    precio: 25,
    stock: 999,
  },
  {
    id: 'c2',
    nombre: 'Poción de Vida (M)',
    descripcion: 'Restaura 150 HP',
    tipo: 'consumable',
    rareza: 'uncommon',
    nivel: 5,
    stats: {},
    precio: 75,
    stock: 500,
  },
  {
    id: 'c3',
    nombre: 'Poción de Vida (L)',
    descripcion: 'Restaura 400 HP',
    tipo: 'consumable',
    rareza: 'rare',
    nivel: 10,
    stats: {},
    precio: 200,
    stock: 100,
  },
  {
    id: 'c4',
    nombre: 'Elixir de Fuerza',
    descripcion: '+20% ATK por 5 min',
    tipo: 'consumable',
    rareza: 'uncommon',
    nivel: 5,
    stats: {},
    precio: 150,
    stock: 200,
  },
  {
    id: 'c5',
    nombre: 'Elixir de Defensa',
    descripcion: '+20% DEF por 5 min',
    tipo: 'consumable',
    rareza: 'uncommon',
    nivel: 5,
    stats: {},
    precio: 150,
    stock: 200,
  },
  {
    id: 'c6',
    nombre: 'Piedra de Mejora',
    descripcion: 'Mejora equipamiento (+1)',
    tipo: 'consumable',
    rareza: 'rare',
    nivel: 1,
    stats: {},
    precio: 500,
    stock: 50,
    destacado: true,
  },
];

type ShopCategory = 'all' | 'weapons' | 'armor' | 'accessories' | 'consumables';
type SortOption = 'price-asc' | 'price-desc' | 'level' | 'rarity';

const Shop: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isGuest = useIsGuest();
  const [category, setCategory] = useState<ShopCategory>('all');
  const [sortBy, setSortBy] = useState<SortOption>('price-asc');
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="shop-loading">
        <div className="loading-spinner" />
        <p>Cargando tienda...</p>
      </div>
    );
  }

  const allItems = [...shopItems, ...consumableItems];

  const getFilteredItems = () => {
    let items = allItems;

    // Filter by category
    switch (category) {
      case 'weapons':
        items = shopItems.filter(i => i.tipo === 'weapon');
        break;
      case 'armor':
        items = shopItems.filter(i => ['armor', 'helmet', 'boots'].includes(i.tipo));
        break;
      case 'accessories':
        items = shopItems.filter(i => i.tipo === 'accessory');
        break;
      case 'consumables':
        items = consumableItems;
        break;
    }

    // Filter by search
    if (searchTerm) {
      items = items.filter(i => 
        i.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
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
    return (user?.val || 0) >= getFinalPrice(item) * qty;
  };

  const handlePurchase = () => {
    if (!selectedItem) return;
    // Aquí iría la lógica real de compra
    console.log(`Comprando ${purchaseQuantity}x ${selectedItem.nombre}`);
    setShowPurchaseModal(false);
    setPurchaseQuantity(1);
    setSelectedItem(null);
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
          <span className="wallet-amount">{user?.val?.toLocaleString() || 0}</span>
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
          <div className="shop-grid">
            {filteredItems.map(item => (
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
                {((user?.val || 0) - getFinalPrice(selectedItem) * (selectedItem.tipo === 'consumable' ? purchaseQuantity : 1)).toLocaleString()} VAL
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
