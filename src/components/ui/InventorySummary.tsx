/**
 * InventorySummary - Resumen del inventario para Dashboard
 * Conectado al API real — con fallback a datos vacíos
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BackpackIcon, 
  SwordIcon, 
  ShieldIcon, 
  PotionIcon,
  GemIcon,
  ChevronRightIcon 
} from '../icons/GameIcons';
import { inventoryService } from '../../services';
import './InventorySummary.css';

// Tipos
interface InventoryItem {
  id: string;
  nombre: string;
  tipo: 'weapon' | 'armor' | 'consumable' | 'material';
  rareza: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  cantidad?: number;
}

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
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      // En modo guest no llamar al backend
      const sessionRaw = localStorage.getItem('valnor-session-storage');
      if (sessionRaw) {
        try {
          const parsed = JSON.parse(sessionRaw);
          if (parsed?.state?.mode === 'guest') {
            setItems([]);
            setLoading(false);
            return;
          }
        } catch { /* ignore */ }
      }
      try {
        const inv = await inventoryService.getMyInventory();
        if (cancelled) return;
        const mapped: InventoryItem[] = [];

        // Map equipment — handle both full objects and ObjectId strings
        if (Array.isArray(inv.equipment)) {
          inv.equipment.forEach((eq: any) => {
            // Si es un string (ObjectId), crear item básico con datos mínimos
            if (typeof eq === 'string') {
              mapped.push({
                id: eq,
                nombre: 'Equipo',
                tipo: 'armor',
                rareza: 'common',
                cantidad: 1,
              });
            } else {
              mapped.push({
                id: eq._id || eq.id || eq.itemId || String(mapped.length),
                nombre: eq.nombre || eq.name || 'Equipo',
                tipo: eq.tipo === 'arma' || eq.tipo === 'weapon' ? 'weapon' : 'armor',
                rareza: eq.rareza || eq.rarity || 'common',
                cantidad: eq.cantidad || 1,
              });
            }
          });
        }

        // Map consumables — handle both full objects and ObjectId strings
        if (Array.isArray(inv.consumables)) {
          inv.consumables.forEach((con: any) => {
            if (typeof con === 'string') {
              mapped.push({
                id: con,
                nombre: 'Consumible',
                tipo: 'consumable',
                rareza: 'common',
                cantidad: 1,
              });
            } else {
              mapped.push({
                id: con._id || con.id || con.itemId || String(mapped.length),
                nombre: con.nombre || con.name || 'Consumible',
                tipo: 'consumable',
                rareza: con.rareza || con.rarity || 'common',
                cantidad: con.cantidad || con.quantity || con.usos_restantes || 1,
              });
            }
          });
        }

        setItems(mapped);
      } catch {
        // API no disponible — intentar leer datos del usuario almacenado como fallback
        try {
          const storedUser = JSON.parse(localStorage.getItem('valnor_user') || '{}');
          const fallbackItems: InventoryItem[] = [];
          if (Array.isArray(storedUser.inventarioEquipamiento)) {
            storedUser.inventarioEquipamiento.forEach((eq: any) => {
              const id = typeof eq === 'string' ? eq : eq._id || eq.id;
              fallbackItems.push({
                id,
                nombre: typeof eq === 'string' ? 'Equipo' : eq.nombre || 'Equipo',
                tipo: 'armor',
                rareza: typeof eq === 'string' ? 'common' : eq.rareza || 'common',
                cantidad: 1,
              });
            });
          }
          if (Array.isArray(storedUser.inventarioConsumibles)) {
            storedUser.inventarioConsumibles.forEach((con: any) => {
              fallbackItems.push({
                id: con._id || con.consumableId || String(fallbackItems.length),
                nombre: con.nombre || 'Consumible',
                tipo: 'consumable',
                rareza: 'common',
                cantidad: con.usos_restantes || 1,
              });
            });
          }
          setItems(fallbackItems);
        } catch {
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);
  
  const totals = {
    weapons: items.filter(i => i.tipo === 'weapon').length,
    armor: items.filter(i => i.tipo === 'armor').length,
    consumables: items.filter(i => i.tipo === 'consumable').reduce((acc, i) => acc + (i.cantidad || 1), 0),
    materials: items.filter(i => i.tipo === 'material').reduce((acc, i) => acc + (i.cantidad || 1), 0),
    total: items.length,
  };
  
  const featuredItems = items
    .filter(i => i.rareza === 'epic' || i.rareza === 'legendary' || i.rareza === 'rare')
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
          Inventario {loading && <span style={{ fontSize: '.6rem', opacity: .5 }}>...</span>}
        </h4>
        <button className="view-all-btn" onClick={() => navigate('/inventory')}>
          Ver todo <ChevronRightIcon size={14} />
        </button>
      </div>
      
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

      {items.length === 0 && !loading && (
        <div className="inventory-empty" onClick={() => navigate('/shop')}>
          <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.4)' }}>
            Sin items — visita la Tienda
          </span>
        </div>
      )}
      
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
