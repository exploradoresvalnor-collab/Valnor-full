/**
 * EquipmentModal - Modal para equipar/desequipar items
 */

import { useState, useEffect } from 'react';
import { 
  CloseIcon, 
  SwordIcon, 
  ShieldIcon,
  BackpackIcon,
  GemIcon,
} from '../icons/GameIcons';
import type { CharacterData } from './CharacterCard';
import './EquipmentModal.css';

// Tipos
interface InventoryItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'helmet' | 'gloves' | 'boots' | 'accessory';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  stats: {
    attack?: number;
    defense?: number;
    health?: number;
    speed?: number;
  };
  requiredLevel?: number;
  image?: string;
}

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData | null;
  inventoryItems: InventoryItem[];
  equippedItems: Record<string, InventoryItem | null>;
  onEquip: (characterId: string, itemId: string, slot: string) => void;
  onUnequip: (characterId: string, slot: string) => void;
}

const SLOT_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  weapon: { icon: <SwordIcon size={20} color="#e74c3c" />, label: 'Arma' },
  helmet: { icon: <ShieldIcon size={20} color="#3498db" />, label: 'Casco' },
  armor: { icon: <ShieldIcon size={20} color="#9b59b6" />, label: 'Armadura' },
  gloves: { icon: <ShieldIcon size={20} color="#2ecc71" />, label: 'Guantes' },
  boots: { icon: <ShieldIcon size={20} color="#f39c12" />, label: 'Botas' },
};

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

export function EquipmentModal({
  isOpen,
  onClose,
  character,
  inventoryItems,
  equippedItems,
  onEquip,
  onUnequip,
}: EquipmentModalProps) {
  const [selectedSlot, setSelectedSlot] = useState<string>('weapon');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  // Reset cuando cambia el personaje
  useEffect(() => {
    setSelectedSlot('weapon');
    setSelectedItem(null);
  }, [character?.id]);
  
  if (!isOpen || !character) return null;
  
  // Filtrar items disponibles para el slot seleccionado
  const availableItems = inventoryItems.filter(item => {
    // El item debe ser del tipo del slot
    if (item.type !== selectedSlot) return false;
    // El item no debe estar equipado en otro personaje (simplificado por ahora)
    return true;
  });
  
  const currentEquipped = equippedItems[selectedSlot];
  
  const handleEquip = () => {
    if (selectedItem && character) {
      onEquip(character.id, selectedItem.id, selectedSlot);
      setSelectedItem(null);
    }
  };
  
  const handleUnequip = () => {
    if (currentEquipped && character) {
      onUnequip(character.id, selectedSlot);
    }
  };
  
  return (
    <div className="equipment-modal-overlay" onClick={onClose}>
      <div className="equipment-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>
            <BackpackIcon size={24} color="#ffd700" />
            Equipar - {character.name}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </div>
        
        {/* Contenido principal */}
        <div className="modal-content">
          {/* Panel izquierdo - Slots de equipo */}
          <div className="equipment-slots-panel">
            <h3>Ranuras de Equipo</h3>
            <div className="equipment-slots">
              {Object.entries(SLOT_CONFIG).map(([slot, config]) => {
                const equipped = equippedItems[slot];
                const isSelected = selectedSlot === slot;
                
                return (
                  <div 
                    key={slot}
                    className={`equipment-slot ${isSelected ? 'selected' : ''} ${equipped ? 'equipped' : ''}`}
                    style={equipped ? { '--rarity-color': RARITY_COLORS[equipped.rarity] } as React.CSSProperties : undefined}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    <div className="slot-icon">{config.icon}</div>
                    <div className="slot-info">
                      <span className="slot-label">{config.label}</span>
                      {equipped ? (
                        <span className="slot-item-name" style={{ color: RARITY_COLORS[equipped.rarity] }}>
                          {equipped.name}
                        </span>
                      ) : (
                        <span className="slot-empty">Vacío</span>
                      )}
                    </div>
                    {equipped && (
                      <button 
                        className="unequip-btn" 
                        onClick={(e) => { e.stopPropagation(); handleUnequip(); }}
                        title="Desequipar"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Panel derecho - Inventario */}
          <div className="inventory-panel">
            <h3>
              Inventario - {SLOT_CONFIG[selectedSlot]?.label || 'Items'}
              <span className="item-count">{availableItems.length} items</span>
            </h3>
            
            {availableItems.length === 0 ? (
              <div className="empty-inventory">
                <GemIcon size={40} color="#4a5568" />
                <p>No tienes items de este tipo</p>
              </div>
            ) : (
              <div className="inventory-grid">
                {availableItems.map(item => (
                  <div 
                    key={item.id}
                    className={`inventory-item ${selectedItem?.id === item.id ? 'selected' : ''}`}
                    style={{ '--rarity-color': RARITY_COLORS[item.rarity] } as React.CSSProperties}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="item-icon">
                      {item.type === 'weapon' ? <SwordIcon size={24} /> : <ShieldIcon size={24} />}
                    </div>
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      <span className="item-rarity">{item.rarity}</span>
                    </div>
                    <div className="item-stats">
                      {item.stats.attack && <span>ATK +{item.stats.attack}</span>}
                      {item.stats.defense && <span>DEF +{item.stats.defense}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Footer con acciones */}
        <div className="modal-footer">
          {selectedItem && (
            <div className="selected-item-preview">
              <span>Seleccionado:</span>
              <strong style={{ color: RARITY_COLORS[selectedItem.rarity] }}>
                {selectedItem.name}
              </strong>
            </div>
          )}
          <div className="modal-actions">
            <button className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button 
              className="btn-equip" 
              onClick={handleEquip}
              disabled={!selectedItem}
            >
              <SwordIcon size={16} />
              Equipar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EquipmentModal;
