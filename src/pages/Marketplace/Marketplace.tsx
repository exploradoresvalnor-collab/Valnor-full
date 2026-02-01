import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ItemRarity, RARITY_COLORS, RARITY_NAMES } from '../../types/item.types';
import './Marketplace.css';

interface MarketListing {
  id: string;
  itemId: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  rareza: ItemRarity;
  nivel: number;
  stats: Record<string, number>;
  precio: number;
  vendedor: {
    id: string;
    username: string;
  };
  fechaPublicacion: Date;
  expira: Date;
}

// Mock marketplace listings
const mockListings: MarketListing[] = [
  {
    id: 'ml1',
    itemId: 'i1',
    nombre: 'Hacha del Berserker',
    descripcion: 'Un hacha masiva que otorga fuerza descomunal',
    tipo: 'weapon',
    rareza: 'epic',
    nivel: 18,
    stats: { ataque: 65, critico: 18 },
    precio: 12000,
    vendedor: { id: 'u1', username: 'DragonSlayer99' },
    fechaPublicacion: new Date(Date.now() - 86400000),
    expira: new Date(Date.now() + 518400000),
  },
  {
    id: 'ml2',
    itemId: 'i2',
    nombre: 'Cetro del Archimagus',
    descripcion: 'Canaliza poder arcano ancestral',
    tipo: 'weapon',
    rareza: 'legendary',
    nivel: 25,
    stats: { ataque: 80, critico: 25 },
    precio: 35000,
    vendedor: { id: 'u2', username: 'MysticWizard' },
    fechaPublicacion: new Date(Date.now() - 3600000),
    expira: new Date(Date.now() + 604800000),
  },
  {
    id: 'ml3',
    itemId: 'i3',
    nombre: 'Armadura del Fénix',
    descripcion: 'Renace de las cenizas con HP completo una vez por batalla',
    tipo: 'armor',
    rareza: 'legendary',
    nivel: 22,
    stats: { defensa: 70, hp: 400 },
    precio: 45000,
    vendedor: { id: 'u3', username: 'PhoenixKnight' },
    fechaPublicacion: new Date(Date.now() - 172800000),
    expira: new Date(Date.now() + 432000000),
  },
  {
    id: 'ml4',
    itemId: 'i4',
    nombre: 'Capa de Sombras',
    descripcion: 'Te vuelve invisible por 3 segundos al recibir daño crítico',
    tipo: 'armor',
    rareza: 'epic',
    nivel: 15,
    stats: { defensa: 35, evasion: 25 },
    precio: 8500,
    vendedor: { id: 'u4', username: 'ShadowNinja' },
    fechaPublicacion: new Date(Date.now() - 43200000),
    expira: new Date(Date.now() + 561600000),
  },
  {
    id: 'ml5',
    itemId: 'i5',
    nombre: 'Botas de Mercurio',
    descripcion: 'Velocidad del mensajero de los dioses',
    tipo: 'boots',
    rareza: 'rare',
    nivel: 12,
    stats: { velocidad: 40, evasion: 15 },
    precio: 4200,
    vendedor: { id: 'u5', username: 'SpeedRunner' },
    fechaPublicacion: new Date(Date.now() - 7200000),
    expira: new Date(Date.now() + 597600000),
  },
  {
    id: 'ml6',
    itemId: 'i6',
    nombre: 'Anillo del Vampiro',
    descripcion: 'Roba vida con cada ataque',
    tipo: 'accessory',
    rareza: 'epic',
    nivel: 16,
    stats: { ataque: 20, hp: 100 },
    precio: 9800,
    vendedor: { id: 'u6', username: 'BloodHunter' },
    fechaPublicacion: new Date(Date.now() - 259200000),
    expira: new Date(Date.now() + 345600000),
  },
  {
    id: 'ml7',
    itemId: 'i7',
    nombre: 'Escudo de Thorns',
    descripcion: 'Refleja 20% del daño recibido',
    tipo: 'armor',
    rareza: 'rare',
    nivel: 10,
    stats: { defensa: 45, hp: 80 },
    precio: 3500,
    vendedor: { id: 'u7', username: 'TankMaster' },
    fechaPublicacion: new Date(Date.now() - 14400000),
    expira: new Date(Date.now() + 590400000),
  },
  {
    id: 'ml8',
    itemId: 'i8',
    nombre: 'Daga del Asesino',
    descripcion: 'Daño crítico aumentado en 50%',
    tipo: 'weapon',
    rareza: 'rare',
    nivel: 11,
    stats: { ataque: 30, critico: 35 },
    precio: 5500,
    vendedor: { id: 'u8', username: 'SilentKiller' },
    fechaPublicacion: new Date(Date.now() - 28800000),
    expira: new Date(Date.now() + 576000000),
  },
];

type MarketTab = 'buy' | 'sell' | 'history';
type SortOption = 'recent' | 'price-asc' | 'price-desc' | 'level' | 'rarity';

const Marketplace: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<MarketTab>('buy');
  const [listings] = useState<MarketListing[]>(mockListings);
  const [selectedListing, setSelectedListing] = useState<MarketListing | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterRarity, setFilterRarity] = useState<ItemRarity | 'all'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showBuyModal, setShowBuyModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="marketplace-loading">
        <div className="loading-spinner" />
        <p>Cargando marketplace...</p>
      </div>
    );
  }

  const getFilteredListings = () => {
    let filtered = [...listings];

    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(l => 
        l.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.vendedor.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by rarity
    if (filterRarity !== 'all') {
      filtered = filtered.filter(l => l.rareza === filterRarity);
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(l => l.tipo === filterType);
    }

    // Sort
    const rarityOrder: ItemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => b.fechaPublicacion.getTime() - a.fechaPublicacion.getTime());
        break;
      case 'price-asc':
        filtered.sort((a, b) => a.precio - b.precio);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.precio - a.precio);
        break;
      case 'level':
        filtered.sort((a, b) => b.nivel - a.nivel);
        break;
      case 'rarity':
        filtered.sort((a, b) => rarityOrder.indexOf(b.rareza) - rarityOrder.indexOf(a.rareza));
        break;
    }

    return filtered;
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`;
    return `hace ${Math.floor(seconds / 86400)} días`;
  };

  const formatTimeLeft = (date: Date) => {
    const seconds = Math.floor((date.getTime() - Date.now()) / 1000);
    if (seconds <= 0) return 'Expirado';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} h`;
    return `${Math.floor(seconds / 86400)} días`;
  };

  const canAfford = (precio: number) => (user?.val || 0) >= precio;

  const handlePurchase = () => {
    if (!selectedListing) return;
    console.log(`Comprando ${selectedListing.nombre} de ${selectedListing.vendedor.username}`);
    setShowBuyModal(false);
    setSelectedListing(null);
  };

  const filteredListings = getFilteredListings();

  return (
    <div className="marketplace-page">
      {/* Header */}
      <header className="marketplace-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Volver
        </button>
        <h1>🏛️ Marketplace</h1>
        <div className="wallet-display">
          <span className="wallet-icon">💰</span>
          <span className="wallet-amount">{user?.val?.toLocaleString() || 0}</span>
          <span className="wallet-label">VAL</span>
        </div>
      </header>

      {/* Tabs */}
      <div className="marketplace-tabs">
        <button
          className={`tab-btn ${activeTab === 'buy' ? 'active' : ''}`}
          onClick={() => setActiveTab('buy')}
        >
          🛒 Comprar
        </button>
        <button
          className={`tab-btn ${activeTab === 'sell' ? 'active' : ''}`}
          onClick={() => setActiveTab('sell')}
        >
          💰 Vender
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📜 Historial
        </button>
      </div>

      <div className="marketplace-container">
        {activeTab === 'buy' && (
          <>
            {/* Filters */}
            <div className="marketplace-filters">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar items o vendedores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="filter-group">
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">Todos los tipos</option>
                  <option value="weapon">⚔️ Armas</option>
                  <option value="armor">🛡️ Armaduras</option>
                  <option value="boots">👢 Botas</option>
                  <option value="accessory">💍 Accesorios</option>
                </select>

                <select 
                  value={filterRarity} 
                  onChange={(e) => setFilterRarity(e.target.value as ItemRarity | 'all')}
                >
                  <option value="all">Todas las rarezas</option>
                  <option value="common">Común</option>
                  <option value="uncommon">Poco Común</option>
                  <option value="rare">Raro</option>
                  <option value="epic">Épico</option>
                  <option value="legendary">Legendario</option>
                </select>

                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                >
                  <option value="recent">Más recientes</option>
                  <option value="price-asc">Precio: Menor</option>
                  <option value="price-desc">Precio: Mayor</option>
                  <option value="level">Nivel</option>
                  <option value="rarity">Rareza</option>
                </select>
              </div>
            </div>

            {/* Listings Grid */}
            <div className="listings-container">
              <div className="listings-grid">
                {filteredListings.map(listing => (
                  <div
                    key={listing.id}
                    className={`listing-card ${selectedListing?.id === listing.id ? 'selected' : ''}`}
                    style={{ borderColor: RARITY_COLORS[listing.rareza] }}
                    onClick={() => setSelectedListing(listing)}
                  >
                    <div className="listing-header">
                      <span className="listing-time">{formatTimeAgo(listing.fechaPublicacion)}</span>
                      <span className="listing-expiry">⏳ {formatTimeLeft(listing.expira)}</span>
                    </div>

                    <div className="listing-icon">
                      {listing.tipo === 'weapon' && '⚔️'}
                      {listing.tipo === 'armor' && '🛡️'}
                      {listing.tipo === 'boots' && '👢'}
                      {listing.tipo === 'accessory' && '💍'}
                    </div>

                    <h4 className="listing-name">{listing.nombre}</h4>
                    
                    <span 
                      className="listing-rarity"
                      style={{ color: RARITY_COLORS[listing.rareza] }}
                    >
                      {RARITY_NAMES[listing.rareza]} • Nv.{listing.nivel}
                    </span>

                    <div className="listing-seller">
                      <span className="seller-icon">👤</span>
                      <span className="seller-name">{listing.vendedor.username}</span>
                    </div>

                    <div className="listing-price">
                      <span className="price-value">{listing.precio.toLocaleString()}</span>
                      <span className="price-label">VAL</span>
                    </div>

                    <button 
                      className={`quick-buy-btn ${!canAfford(listing.precio) ? 'disabled' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedListing(listing);
                        setShowBuyModal(true);
                      }}
                      disabled={!canAfford(listing.precio)}
                    >
                      {canAfford(listing.precio) ? 'Comprar' : 'Sin fondos'}
                    </button>
                  </div>
                ))}
              </div>

              {/* Details Panel */}
              {selectedListing && (
                <aside className="listing-details">
                  <div 
                    className="details-header"
                    style={{ borderColor: RARITY_COLORS[selectedListing.rareza] }}
                  >
                    <div className="details-icon">
                      {selectedListing.tipo === 'weapon' && '⚔️'}
                      {selectedListing.tipo === 'armor' && '🛡️'}
                      {selectedListing.tipo === 'boots' && '👢'}
                      {selectedListing.tipo === 'accessory' && '💍'}
                    </div>
                    <div className="details-title">
                      <h3>{selectedListing.nombre}</h3>
                      <span 
                        className="details-rarity"
                        style={{ color: RARITY_COLORS[selectedListing.rareza] }}
                      >
                        {RARITY_NAMES[selectedListing.rareza]} • Nv.{selectedListing.nivel}
                      </span>
                    </div>
                  </div>

                  <p className="details-description">{selectedListing.descripcion}</p>

                  <div className="details-stats">
                    <h4>📊 Estadísticas</h4>
                    {Object.entries(selectedListing.stats).map(([stat, value]) => (
                      <div key={stat} className="stat-row">
                        <span className="stat-label">{stat.toUpperCase()}</span>
                        <span className="stat-value">+{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="details-seller">
                    <h4>👤 Vendedor</h4>
                    <div className="seller-info">
                      <span className="seller-avatar">🎮</span>
                      <div className="seller-data">
                        <span className="seller-username">{selectedListing.vendedor.username}</span>
                        <span className="seller-listing-date">
                          Publicado {formatTimeAgo(selectedListing.fechaPublicacion)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="details-price">
                    <span className="price-big">{selectedListing.precio.toLocaleString()}</span>
                    <span className="price-currency">VAL</span>
                  </div>

                  <button
                    className={`buy-btn ${!canAfford(selectedListing.precio) ? 'disabled' : ''}`}
                    onClick={() => setShowBuyModal(true)}
                    disabled={!canAfford(selectedListing.precio)}
                  >
                    {canAfford(selectedListing.precio) ? '🛒 Comprar Ahora' : '❌ VAL Insuficiente'}
                  </button>
                </aside>
              )}
            </div>
          </>
        )}

        {activeTab === 'sell' && (
          <div className="sell-section">
            <div className="sell-empty">
              <span className="empty-icon">📦</span>
              <h3>Vende tus items</h3>
              <p>Selecciona items de tu inventario para ponerlos a la venta en el marketplace.</p>
              <button onClick={() => navigate('/inventory')} className="go-inventory-btn">
                Ir al Inventario
              </button>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-section">
            <div className="history-empty">
              <span className="empty-icon">📜</span>
              <h3>Sin historial</h3>
              <p>Aquí aparecerán tus compras y ventas recientes.</p>
            </div>
          </div>
        )}
      </div>

      {/* Buy Modal */}
      {showBuyModal && selectedListing && (
        <div className="modal-overlay" onClick={() => setShowBuyModal(false)}>
          <div className="buy-modal" onClick={e => e.stopPropagation()}>
            <h3>Confirmar Compra</h3>
            
            <div className="modal-item" style={{ borderColor: RARITY_COLORS[selectedListing.rareza] }}>
              <span className="modal-icon">
                {selectedListing.tipo === 'weapon' && '⚔️'}
                {selectedListing.tipo === 'armor' && '🛡️'}
                {selectedListing.tipo === 'boots' && '👢'}
                {selectedListing.tipo === 'accessory' && '💍'}
              </span>
              <div className="modal-item-info">
                <span className="modal-item-name">{selectedListing.nombre}</span>
                <span className="modal-item-rarity" style={{ color: RARITY_COLORS[selectedListing.rareza] }}>
                  {RARITY_NAMES[selectedListing.rareza]}
                </span>
              </div>
            </div>

            <div className="modal-seller">
              <span>Vendedor:</span>
              <span className="modal-seller-name">{selectedListing.vendedor.username}</span>
            </div>

            <div className="modal-price-row">
              <span>Precio:</span>
              <span className="modal-price">{selectedListing.precio.toLocaleString()} VAL</span>
            </div>

            <div className="modal-fee-row">
              <span>Comisión (5%):</span>
              <span className="modal-fee">{Math.floor(selectedListing.precio * 0.05).toLocaleString()} VAL</span>
            </div>

            <div className="modal-total-row">
              <span>Total:</span>
              <span className="modal-total">{Math.floor(selectedListing.precio * 1.05).toLocaleString()} VAL</span>
            </div>

            <div className="modal-balance">
              <span>Tu balance después:</span>
              <span className="balance-after">
                {((user?.val || 0) - Math.floor(selectedListing.precio * 1.05)).toLocaleString()} VAL
              </span>
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowBuyModal(false)}>
                Cancelar
              </button>
              <button className="confirm-btn" onClick={handlePurchase}>
                ✓ Confirmar Compra
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
