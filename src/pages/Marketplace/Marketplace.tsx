import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ItemRarity, RARITY_COLORS, RARITY_NAMES } from '../../types/item.types';
import { marketplaceService } from '../../services';
import type { MarketplaceListing as BackendListing, MarketplaceTransaction } from '../../services/marketplace.service';
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

/** Mapea un listing del backend al formato del frontend */
function mapListing(l: any): MarketListing {
  return {
    id: l._id || l.id || '',
    itemId: l.itemId || '',
    nombre: l.itemName || l.nombre || 'Item desconocido',
    descripcion: l.itemDescription || l.descripcion || '',
    tipo: l.itemType || l.tipo || 'weapon',
    rareza: (l.itemRareza || l.rareza || 'common') as ItemRarity,
    nivel: l.itemLevel || l.nivel || 1,
    stats: l.itemStats || l.stats || {},
    precio: l.priceVal || l.precio || 0,
    vendedor: {
      id: l.sellerId || l.vendedor?.id || '',
      username: l.sellerUsername || l.vendedor?.username || 'Vendedor',
    },
    fechaPublicacion: new Date(l.createdAt || l.fechaPublicacion || Date.now()),
    expira: new Date(l.expiresAt || l.expira || Date.now() + 604800000),
  };
}

interface TransactionEntry {
  id: string;
  itemName: string;
  priceVal: number;
  type: 'sale' | 'purchase';
  date: Date;
  otherUser: string;
}

function mapTransaction(t: any): TransactionEntry {
  return {
    id: t._id || t.id || '',
    itemName: t.itemName || t.nombre || 'Item',
    priceVal: t.priceVal || t.precio || 0,
    type: t.type || 'purchase',
    date: new Date(t.createdAt || Date.now()),
    otherUser: t.type === 'sale' ? (t.buyerUsername || 'Comprador') : (t.sellerUsername || 'Vendedor'),
  };
}

type MarketTab = 'buy' | 'sell' | 'history';
type SortOption = 'recent' | 'price-asc' | 'price-desc' | 'level' | 'rarity';

const Marketplace: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<MarketTab>('buy');
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [transactions, setTransactions] = useState<TransactionEntry[]>([]);
  const [selectedListing, setSelectedListing] = useState<MarketListing | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterRarity, setFilterRarity] = useState<ItemRarity | 'all'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [marketLoading, setMarketLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [userVal, setUserVal] = useState(user?.val || 0);

  // Fetch marketplace listings
  useEffect(() => {
    if (loading) return;
    let cancelled = false;

    const fetchListings = async () => {
      setMarketLoading(true);
      try {
        const res = await marketplaceService.getHistory({ limit: 50 }).catch(() => null);
        if (cancelled) return;
        if (res) {
          const items = res.listings || (res as any).data || (Array.isArray(res) ? res : []);
          if (Array.isArray(items)) {
            const active = items
              .filter((l: any) => !l.status || l.status === 'active')
              .map(mapListing);
            setListings(active);
          }
        }
      } catch (err) {
        console.error('[Marketplace] Error fetching listings:', err);
      } finally {
        if (!cancelled) setMarketLoading(false);
      }
    };

    fetchListings();
    return () => { cancelled = true; };
  }, [loading]);

  // Fetch transaction history when history tab is selected
  useEffect(() => {
    if (activeTab !== 'history' || loading) return;
    let cancelled = false;

    const fetchHistory = async () => {
      try {
        const res = await marketplaceService.getMyTransactionHistory().catch(() => null);
        if (cancelled) return;
        if (res) {
          const txs = res.transactions || (res as any).data || (Array.isArray(res) ? res : []);
          if (Array.isArray(txs)) {
            setTransactions(txs.map(mapTransaction));
          }
        }
      } catch (err) {
        console.error('[Marketplace] Error fetching history:', err);
      }
    };

    fetchHistory();
    return () => { cancelled = true; };
  }, [activeTab, loading]);

  if (loading || marketLoading) {
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

  const canAfford = (precio: number) => userVal >= precio;

  const handlePurchase = async () => {
    if (!selectedListing || purchasing) return;
    setPurchasing(true);
    try {
      const res = await marketplaceService.buyItem(selectedListing.id);
      if (res?.success) {
        // Remove purchased listing from local state
        setListings(prev => prev.filter(l => l.id !== selectedListing.id));
        setUserVal(prev => prev - selectedListing.precio);
      }
    } catch (err) {
      console.error('[Marketplace] Purchase error:', err);
    } finally {
      setPurchasing(false);
      setShowBuyModal(false);
      setSelectedListing(null);
    }
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
          <span className="wallet-amount">{userVal.toLocaleString()}</span>
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
              {filteredListings.length === 0 ? (
                <div className="history-empty">
                  <span className="empty-icon">🏛️</span>
                  <h3>Sin listings activos</h3>
                  <p>No hay items a la venta en el marketplace en este momento.</p>
                </div>
              ) : (
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
              )}

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
            {transactions.length === 0 ? (
              <div className="history-empty">
                <span className="empty-icon">📜</span>
                <h3>Sin historial</h3>
                <p>Aquí aparecerán tus compras y ventas recientes.</p>
              </div>
            ) : (
              <div className="history-list">
                {transactions.map(tx => (
                  <div key={tx.id} className={`history-item ${tx.type}`}>
                    <span className="tx-icon">{tx.type === 'sale' ? '💰' : '🛒'}</span>
                    <div className="tx-info">
                      <span className="tx-item">{tx.itemName}</span>
                      <span className="tx-user">{tx.type === 'sale' ? 'Vendido a' : 'Comprado de'} {tx.otherUser}</span>
                    </div>
                    <div className="tx-details">
                      <span className="tx-price">{tx.type === 'sale' ? '+' : '-'}{tx.priceVal.toLocaleString()} VAL</span>
                      <span className="tx-date">{formatTimeAgo(tx.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                {(userVal - Math.floor(selectedListing.precio * 1.05)).toLocaleString()} VAL
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
