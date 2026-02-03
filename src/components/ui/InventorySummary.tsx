/**
 * InventorySummary - Resumen del inventario para Dashboard
 * Muestra items destacados y totales
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BackpackIcon, 
  SwordIcon, 
  ShieldIcon, 
  PotionIcon,
  GemIcon,
  ChevronRightIcon 
} from '../icons/GameIcons';
import './InventorySummary.css';

// Tipos
interface InventoryItem {
  id: string;
  nombre: string;
  tipo: 'weapon' | 'armor' | 'consumable' | 'material';
  rareza: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  cantidad?: number;
}

// Mock data - En producción vendría del store/API
const mockInventory: InventoryItem[] = [
  { id: '1', nombre: 'Espada del Dragón', tipo: 'weapon', rareza: 'epic' },
  { id: '2', nombre: 'Armadura de Mithril', tipo: 'armor', rareza: 'rare' },
  { id: '3', nombre: 'Poción de Vida', tipo: 'consumable', rareza: 'common', cantidad: 15 },
  { id: '4', nombre: 'Elixir de Maná', tipo: 'consumable', rareza: 'uncommon', cantidad: 8 },
  { id: '5', nombre: 'Hierro', tipo: 'material', rareza: 'common', cantidad: 45 },
  { id: '6', nombre: 'Cristal Arcano', tipo: 'material', rareza: 'rare', cantidad: 3 },
];

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

export function InventorySummary() {
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  
  // Calcular totales
  const totals = {
    weapons: mockInventory.filter(i => i.tipo === 'weapon').length,
    armor: mockInventory.filter(i => i.tipo === 'armor').length,
    consumables: mockInventory.filter(i => i.tipo === 'consumable').reduce((acc, i) => acc + (i.cantidad || 1), 0),
    materials: mockInventory.filter(i => i.tipo === 'material').reduce((acc, i) => acc + (i.cantidad || 1), 0),
    total: mockInventory.length,
  };
  
  // Items destacados (épicos y legendarios)
  const featuredItems = mockInventory
    .filter(i => i.rareza === 'epic' || i.rareza === 'legendary')
    .slice(0, 3);
  
  const getItemIcon = (tipo: string) => {
    switch (tipo) {
      case 'weapon': return <SwordIcon size={14} />;
      case 'armor': return <ShieldIcon size={14} />;
      case 'consumable': return <PotionIcon size={14} />;
      default: return <GemIcon size={14} />;
    }
  };
  
  return (
    <div className="inventory-summary">
      <div className="summary-header">
        <h4>
          <BackpackIcon size={16} color="#ffd700" />
          Inventario
        </h4>
        <button className="view-all-btn" onClick={() => navigate('/inventory')}>
          Ver todo <ChevronRightIcon size={14} />
        </button>
      </div>
      
      {/* Totales por categoría */}
      <div className="inventory-totals">
        <div className="total-item">
          <SwordIcon size={16} color="#e74c3c" />
          <span className="total-count">{totals.weapons}</span>
          <span className="total-label">Armas</span>
        </div>
        <div className="total-item">
          <ShieldIcon size={16} color="#3498db" />
          <span className="total-count">{totals.armor}</span>
          <span className="total-label">Armadura</span>
        </div>
        <div className="total-item">
          <PotionIcon size={16} color="#2ecc71" />
          <span className="total-count">{totals.consumables}</span>
          <span className="total-label">Consumibles</span>
        </div>
        <div className="total-item">
          <GemIcon size={16} color="#9b59b6" />
          <span className="total-count">{totals.materials}</span>
          <span className="total-label">Materiales</span>
        </div>
      </div>
      
      {/* Items destacados */}
      {featuredItems.length > 0 && (
        <div className="featured-items">
          <span className="featured-label">Items Destacados</span>
          <div className="featured-list">
            {featuredItems.map(item => (
              <div 
                key={item.id} 
                className={`featured-item ${hoveredItem === item.id ? 'hovered' : ''}`}
                style={{ borderColor: RARITY_COLORS[item.rareza] }}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => navigate('/inventory')}
              >
                <span className="item-icon" style={{ color: RARITY_COLORS[item.rareza] }}>
                  {getItemIcon(item.tipo)}
                </span>
                <span className="item-name">{item.nombre}</span>
                <span 
                  className="item-rarity" 
                  style={{ color: RARITY_COLORS[item.rareza] }}
                >
                  {item.rareza}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default InventorySummary;
