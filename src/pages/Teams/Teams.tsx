/**
 * Teams Page - Armado de equipo y gestión de personajes
 * 
 * Datos reales del backend:
 * - Personajes: stats {atk, vida, defensa}, equipamiento[{id,nombre,tipoItem,slot}], rango, nivel
 * - Inventario: equipment (IDs) + consumables ({consumableId, usos_restantes})
 * - Catálogo: /api/equipment + /api/consumables → detalles completos
 * - Equip/Unequip/UseConsumable: todos usan { itemId }
 */

import { useState, useEffect, useCallback, Suspense, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, AdaptiveDpr, ContactShadows, Environment } from '@react-three/drei';

// react-icons — Game Icons para RPG
import {
  GiSwordWound,
  GiBroadsword,
  GiShield,
  GiChestArmor,
  GiVisoredHelm,
  GiBoots,
  GiRing,
  GiPotionBall,
  GiScrollUnfurled,
  GiMeat,
  GiFruitBowl,
  GiCrossedSwords,
  GiHealthPotion,
  GiBackpack,
  GiTeamIdea,
  GiStaryu,
  GiSaveArrow,
  GiReturnArrow,
  GiChart,
  GiHearts,
  GiRuneSword,
  GiShieldBash,
  GiSpeedometer,
  GiLevelEndFlag,
  GiPowerLightning,
} from 'react-icons/gi';
import { FiPlus, FiMinus, FiX, FiCheck, FiAlertTriangle } from 'react-icons/fi';

import { useIsGuest } from '../../stores/sessionStore';
import { userService, teamService, characterService } from '../../services';
import { getDemoCharacters, getDemoInventory } from '../../services/demo.service';
import { CharacterModel3D } from '../../engine/components/CharacterModel3D';
import {
  CHARACTER_MODEL_MAP,
  getCharacterModelConfig,
} from '../../config/character-models.config';
import { calcCharacterPower, calcTeamPower } from '../../utils/mappers';
import './Teams.css';

// ============================================================
// TIPOS (basados en datos reales del backend)
// ============================================================

interface EquippedItem {
  id: string;
  nombre: string;
  tipoItem: string;
  slot: string;
}

interface BackendCharacter {
  _id: string;
  personajeId: string;
  rango: string;
  nivel: number;
  etapa: number;
  progreso: number;
  experiencia: number;
  saludActual: number;
  saludMaxima: number;
  estado: string;
  stats: {
    atk: number;
    vida: number;
    defensa: number;
    [key: string]: number;
  };
  equipamiento: EquippedItem[];
  activeBuffs: any[];
  fechaHerido: string | null;
}

interface CatalogEquipment {
  _id: string;
  tipoItem: string;
  nombre: string;
  descripcion: string;
  rango: string;
  tipo: string; // arma, armadura, escudo, anillo
  nivel_minimo_requerido: number;
  costo_val: number;
  stats: { atk: number; defensa: number; vida: number };
  habilidades: string[];
  fuentes_obtencion: string[];
}

interface CatalogConsumable {
  _id: string;
  nombre: string;
  descripcion?: string;
  tipo: string; // pocion, alimento, pergamino, fruto_mitico
  rango?: string;
  efecto?: string;
}

interface InventoryConsumable {
  _id: string;
  consumableId: string;
  usos_restantes: number;
}

// Toast notification type
interface ToastMsg {
  id: number;
  type: 'success' | 'error' | 'info';
  text: string;
}

// ============================================================
// ICON HELPERS
// ============================================================

function EquipTypeIcon({ tipo, size = 18 }: { tipo: string; size?: number }) {
  switch (tipo) {
    case 'arma': return <GiBroadsword size={size} />;
    case 'armadura': return <GiChestArmor size={size} />;
    case 'escudo': return <GiShield size={size} />;
    case 'anillo': return <GiRing size={size} />;
    case 'casco': return <GiVisoredHelm size={size} />;
    case 'botas': return <GiBoots size={size} />;
    default: return <GiSwordWound size={size} />;
  }
}

function ConsumableTypeIcon({ tipo, size = 18 }: { tipo: string; size?: number }) {
  switch (tipo) {
    case 'pocion': return <GiHealthPotion size={size} />;
    case 'alimento': return <GiMeat size={size} />;
    case 'pergamino': return <GiScrollUnfurled size={size} />;
    case 'fruto_mitico': return <GiFruitBowl size={size} />;
    default: return <GiPotionBall size={size} />;
  }
}

function rangoColor(rango: string): string {
  switch (rango?.toUpperCase()) {
    case 'SS': return '#ff3232';
    case 'S': return '#ff6b35';
    case 'A': return '#9b59b6';
    case 'B': return '#3498db';
    case 'C': return '#2ecc71';
    case 'D': return '#95a5a6';
    default: return '#95a5a6';
  }
}

// ============================================================
// TOAST COMPONENT
// ============================================================

function ToastContainer({ toasts, onDismiss }: { toasts: ToastMsg[]; onDismiss: (id: number) => void }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          <span className="toast__icon">
            {t.type === 'success' && <FiCheck size={16} />}
            {t.type === 'error' && <FiAlertTriangle size={16} />}
            {t.type === 'info' && <GiStaryu size={16} />}
          </span>
          <span className="toast__text">{t.text}</span>
          <button className="toast__close" onClick={() => onDismiss(t.id)}>
            <FiX size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export function Teams() {
  const navigate = useNavigate();
  const isGuest = useIsGuest();

  // Estado principal
  const [allCharacters, setAllCharacters] = useState<BackendCharacter[]>([]);
  const [selectedChar, setSelectedChar] = useState<BackendCharacter | null>(null);
  const [activeTeamIds, setActiveTeamIds] = useState<string[]>([]);

  // Catálogos resueltos
  const [equipCatalog, setEquipCatalog] = useState<CatalogEquipment[]>([]);
  const [consumCatalog, setConsumCatalog] = useState<CatalogConsumable[]>([]);

  // Inventario del usuario
  const [myEquipmentIds, setMyEquipmentIds] = useState<string[]>([]);
  const [myConsumables, setMyConsumables] = useState<InventoryConsumable[]>([]);

  // UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((type: ToastMsg['type'], text: string) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

// ─── Cargar todo del backend o datos demo ───
  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);
      try {
        if (isGuest) {
          // Cargar datos demo para invitados — normalizar al shape que espera Teams
          const demoChars = getDemoCharacters();
          const demoInventory = getDemoInventory();

          const normalizeDemoChar = (c: any) => ({
            _id: c.id,
            personajeId: c.id,
            nombre: c.name || c.id,
            nivel: c.level || 1,
            rango: 'C',
            saludActual: (c.stats?.health ?? c.stats?.vida ?? 100),
            saludMaxima: (c.stats?.health ?? c.stats?.vida ?? 100),
            equipamiento: [],
            stats: c.stats || {},
          });

          const mapped = demoChars.map(normalizeDemoChar);

          if (!cancelled) {
            setAllCharacters(mapped);
            if (mapped.length > 0) setSelectedChar(mapped[0]);
            setMyEquipmentIds(demoInventory.equipment.map(item => item.id));
            setMyConsumables(demoInventory.consumables.map(item => ({ ...item, usos_restantes: item.stackSize || 1 })));
            setEquipCatalog(demoInventory.equipment);
            setConsumCatalog(demoInventory.consumables);
          }
        } else {
          // Cargar datos reales del backend
          const [me, inventory, eqCat, consCat] = await Promise.all([
            userService.getMe().catch(() => null),
            fetchInventory(),
            fetchEquipmentCatalog(),
            fetchConsumablesCatalog(),
          ]);

          if (cancelled) return;

          if (me) {
            const raw = (me as any).personajes;
            if (Array.isArray(raw)) {
              console.log('[Teams] Personajes cargados:', raw.map(p => ({ _id: p._id, personajeId: p.personajeId, nombre: p.nombre })));
              setAllCharacters(raw);
              if (raw.length > 0) setSelectedChar(raw[0]);
            }
          }

          if (inventory) {
            setMyEquipmentIds(Array.isArray(inventory.equipment) ? inventory.equipment : []);
            setMyConsumables(Array.isArray(inventory.consumables) ? inventory.consumables : []);
          }

          setEquipCatalog(eqCat);
          setConsumCatalog(consCat);

            const teams = await teamService.getMyTeams();
            if (!cancelled && teams.length > 0) {
              const active = teams.find((t: any) => t.isActive || t.activo);
              if (active?.characters) {
                // Mapear _id de MongoDB a personajeId para el estado local
                const personajeIds = active.characters
                  .map((char: any) => {
                    // char puede ser un ObjectId string o un objeto con _id
                    const charId = typeof char === 'string' ? char : char._id;
                    const personaje = allCharacters.find(c => c._id === charId);
                    return personaje?.personajeId;
                  })
                  .filter(Boolean) as string[];
                setActiveTeamIds(personajeIds);
              }
            }
        }

      } catch (err) {
        console.error('[Teams] Error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [isGuest]);

  // ─── Resolver items contra catálogo ───
  const myEquipmentResolved = useMemo(() =>
    myEquipmentIds.map(id => equipCatalog.find(e => e._id === id)).filter(Boolean) as CatalogEquipment[],
    [myEquipmentIds, equipCatalog]
  );

  const myConsumablesResolved = useMemo(() =>
    myConsumables
      .map(c => {
        const detail = consumCatalog.find(cat => cat._id === c.consumableId);
        if (!detail) return null;
        return { ...detail, usos_restantes: c.usos_restantes, inventoryId: c._id };
      })
      .filter(Boolean) as (CatalogConsumable & { usos_restantes: number; inventoryId: string })[],
    [myConsumables, consumCatalog]
  );

  // Items equipados en personaje seleccionado — resolved against catalog
  const selectedCharEquipped = useMemo(() => {
    if (!selectedChar?.equipamiento?.length) return [];
    return selectedChar.equipamiento
      .map((eq: any) => {
        // equipamiento es array de {id, nombre, tipoItem, slot} u objetos string (legacy)
        const eqId = typeof eq === 'string' ? eq : eq.id;
        const catalogItem = equipCatalog.find(e => e._id === eqId);
        if (catalogItem) return catalogItem;
        // Fallback si no está en catálogo (eq.slot siempre es "Equipment", no sirve para tipo)
        if (typeof eq !== 'string' && eq.id) {
          return {
            _id: eq.id,
            nombre: eq.nombre || 'Item desconocido',
            tipo: 'arma',
            rango: 'D',
            stats: { atk: 0, defensa: 0, vida: 0 },
          } as CatalogEquipment;
        }
        return null;
      })
      .filter(Boolean) as CatalogEquipment[];
  }, [selectedChar, equipCatalog]);

  // Items en mochila (no equipados por nadie)
  const backpackItems = useMemo(() => {
    const allEquippedIds = new Set(
      allCharacters.flatMap(c =>
        (c.equipamiento || []).map((eq: any) => typeof eq === 'string' ? eq : eq.id)
      )
    );
    return myEquipmentResolved.filter(e => !allEquippedIds.has(e._id));
  }, [myEquipmentResolved, allCharacters]);

  // ─── Handlers ───
  const handleSelectCharacter = useCallback((char: BackendCharacter) => {
    setSelectedChar(char);
  }, []);

  const toggleTeamMember = useCallback((personajeId: string) => {
    setActiveTeamIds(prev => {
      if (prev.includes(personajeId)) return prev.filter(id => id !== personajeId);
      if (prev.length >= 4) return prev;
      return [...prev, personajeId];
    });
  }, []);

  const refreshAfterAction = useCallback(async () => {
    const [me, inventory] = await Promise.all([
      userService.getMe().catch(() => null),
      fetchInventory(),
    ]);
    if (me) {
      const raw = (me as any).personajes;
      if (Array.isArray(raw)) {
        setAllCharacters(raw);
        if (selectedChar) {
          const updated = raw.find((c: any) => c.personajeId === selectedChar.personajeId);
          if (updated) setSelectedChar(updated);
        }
      }
    }
    if (inventory) {
      setMyEquipmentIds(Array.isArray(inventory.equipment) ? inventory.equipment : []);
      setMyConsumables(Array.isArray(inventory.consumables) ? inventory.consumables : []);
    }
  }, [selectedChar]);

  const handleEquip = useCallback(async (itemId: string) => {
    if (!selectedChar) return;
    setActionLoading(itemId);
    try {
      const resp = await characterService.equip(selectedChar.personajeId, itemId);
      const itemName = equipCatalog.find(e => e._id === itemId)?.nombre || 'Item';
      addToast('success', (resp as any).message || `${itemName} equipado`);
      await refreshAfterAction();
    } catch (err: any) {
      const msg = err?.error || err?.message || 'Error al equipar';
      addToast('error', msg);
      console.error('[Teams] Equip error:', err);
    } finally {
      setActionLoading(null);
    }
  }, [selectedChar, equipCatalog, refreshAfterAction, addToast]);

  const handleUnequip = useCallback(async (itemId: string) => {
    if (!selectedChar) return;
    setActionLoading(itemId);
    try {
      const resp = await characterService.unequip(selectedChar.personajeId, itemId);
      const itemName = equipCatalog.find(e => e._id === itemId)?.nombre || 'Item';
      addToast('success', (resp as any).message || `${itemName} desequipado`);
      await refreshAfterAction();
    } catch (err: any) {
      const msg = err?.error || err?.message || 'Error al desequipar';
      addToast('error', msg);
      console.error('[Teams] Unequip error:', err);
    } finally {
      setActionLoading(null);
    }
  }, [selectedChar, equipCatalog, refreshAfterAction, addToast]);

  const handleUseConsumable = useCallback(async (consumableId: string) => {
    if (!selectedChar) return;
    setActionLoading(consumableId);
    try {
      const resp = await characterService.useConsumable(selectedChar.personajeId, consumableId);
      const itemName = consumCatalog.find(c => c._id === consumableId)?.nombre || 'Consumible';
      addToast('success', (resp as any).message || `${itemName} usado`);
      await refreshAfterAction();
    } catch (err: any) {
      const msg = err?.error || err?.message || 'Error al usar consumible';
      addToast('error', msg);
      console.error('[Teams] UseConsumable error:', err);
    } finally {
      setActionLoading(null);
    }
  }, [selectedChar, consumCatalog, refreshAfterAction, addToast]);

  const handleSave = useCallback(async () => {
    if (activeTeamIds.length === 0) return;
    setSaving(true);
    try {
      await userService.setActiveCharacter(activeTeamIds[0]);

      // Enviar _id de MongoDB ya que el backend espera ObjectIds válidos
      const mongoIds = activeTeamIds
        .map(pid => allCharacters.find(c => c.personajeId === pid)?._id)
        .filter(Boolean) as string[];

      console.log('[Teams] activeTeamIds (personajeId):', activeTeamIds);
      console.log('[Teams] mongoIds (_id):', mongoIds);

      // Validar que todos los IDs sean ObjectIds válidos
      const invalidIds = mongoIds.filter(id => !/^[0-9a-fA-F]{24}$/.test(id));
      if (invalidIds.length > 0) {
        console.error('[Teams] IDs inválidos encontrados:', invalidIds);
        addToast('error', `IDs de personajes inválidos: ${invalidIds.join(', ')}`);
        return;
      }

      if (mongoIds.length > 0) {
        console.log('[Teams] Enviando petición a backend con IDs válidos:', mongoIds);
        try {
          const teams = await teamService.getMyTeams();
          const active = teams.find((t: any) => t.isActive || t.activo);
          if (active) {
            await teamService.updateTeam(active._id, { characters: mongoIds });
          } else {
            const newTeam = await teamService.createTeam({ name: 'Equipo Principal', characters: mongoIds });
            await teamService.activateTeam(newTeam._id);
          }
          addToast('success', 'Equipo guardado correctamente');
        } catch (teamErr: any) {
          console.error('[Teams] Error del backend:', teamErr);
          addToast('error', teamErr?.error || teamErr?.message || 'Error al guardar el equipo');
        }
      } else {
        addToast('error', 'No se pudieron mapear los IDs de personajes');
      }
    } catch (err: any) {
      console.error('[Teams] Error general:', err);
      addToast('error', 'Error al guardar el equipo');
    } finally {
      setSaving(false);
    }
  }, [activeTeamIds, allCharacters, addToast]);

  // ─── Derived ───
  const selectedConfig = selectedChar ? getCharacterModelConfig(selectedChar.personajeId) : null;

  // Team power & team members for showcase
  const teamMembers = useMemo(() =>
    allCharacters.filter(c => activeTeamIds.includes(c.personajeId)),
    [allCharacters, activeTeamIds]
  );
  const teamPowerTotal = useMemo(() =>
    calcTeamPower(teamMembers, equipCatalog),
    [teamMembers, equipCatalog]
  );

  // ─── Loading ───
  if (loading) {
    return (
      <div className="teams-page">
        <div className="teams-loading">
          <div className="loading-spinner" />
          <p>Cargando personajes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="teams-page">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* ===== HEADER ===== */}
      <header className="teams-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <GiReturnArrow size={14} /> Volver
        </button>
        <h1><GiCrossedSwords size={22} /> Gestión de Equipo</h1>
        <div className="header-actions">
          <span className="team-power-display" title="Poder total del equipo">
            <GiPowerLightning size={16} className="power-icon" />
            <span className="power-number">{teamPowerTotal}</span>
            <span className="power-label">PODER</span>
          </span>
          <span className="team-count-badge">
            <GiTeamIdea size={14} /> {activeTeamIds.length}/4
          </span>
          <button className="save-btn" onClick={handleSave} disabled={saving || activeTeamIds.length === 0}>
            <GiSaveArrow size={16} /> {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </header>

      {/* ===== TEAM SHOWCASE BAR — Solo personajes seleccionados ===== */}
      <div className="team-showcase-bar">
        <div className="team-slots-strip">
          {[0, 1, 2, 3].map((slotIdx) => {
            const charId = activeTeamIds[slotIdx];
            const char = charId ? allCharacters.find(c => c.personajeId === charId) : null;
            const config = char ? CHARACTER_MODEL_MAP[char.personajeId] : null;
            return (
              <div
                key={slotIdx}
                className={`team-slot-card ${char ? 'filled' : 'empty'}`}
                onClick={char ? () => handleSelectCharacter(char) : undefined}
              >
                {char ? (
                  <>
                    <div className="slot-card-avatar" style={{ borderColor: rangoColor(char.rango) }}>
                      <span style={{ color: rangoColor(char.rango), fontWeight: 700, fontSize: '1.1rem' }}>
                        {(config?.displayName || char.personajeId)[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="slot-card-info">
                      <span className="slot-card-name">{config?.displayName || char.personajeId}</span>
                      <span className="slot-card-meta">Nv.{char.nivel} · <span style={{ color: rangoColor(char.rango) }}>{char.rango}</span></span>
                    </div>
                    <div className="slot-card-power">
                      <GiPowerLightning size={10} />
                      {calcCharacterPower(char, equipCatalog)}
                    </div>
                    <button
                      className="slot-card-remove"
                      onClick={(e) => { e.stopPropagation(); toggleTeamMember(char.personajeId); }}
                      title="Quitar del equipo"
                    >
                      <FiX size={12} />
                    </button>
                  </>
                ) : (
                  <div className="slot-card-empty">
                    <FiPlus size={18} />
                    <span>Slot {slotIdx + 1}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="teams-content">

        {/* === PANEL IZQUIERDO: Personajes === */}
        <aside className="characters-panel">
          <h3><GiTeamIdea size={16} /> Mis Personajes ({allCharacters.length})</h3>
          <div className="characters-list">
            {allCharacters.map((char) => {
              const isInTeam = activeTeamIds.includes(char.personajeId);
              const isSelected = selectedChar?.personajeId === char.personajeId;
              const config = CHARACTER_MODEL_MAP[char.personajeId];
              const displayName = config?.displayName || char.personajeId;
              const hpPercent = (char.saludActual / Math.max(char.saludMaxima, 1)) * 100;

              return (
                <div
                  key={char.personajeId}
                  className={`character-card-mini ${isSelected ? 'selected' : ''} ${isInTeam ? 'in-team' : ''}`}
                  onClick={() => handleSelectCharacter(char)}
                >
                  <div className="card-left">
                    <div className="card-avatar" style={{ borderColor: rangoColor(char.rango), color: rangoColor(char.rango) }}>
                      <span className="avatar-letter">{displayName[0]?.toUpperCase()}</span>
                    </div>
                    <div className="card-info">
                      <span className="card-name">{displayName}</span>
                      <div className="card-meta">
                        <span className="card-level"><GiLevelEndFlag size={10} /> Nv.{char.nivel}</span>
                        <span className="card-rango" style={{ color: rangoColor(char.rango) }}>{char.rango}</span>
                      </div>
                      <div className="card-hp-bar">
                        <div className="card-hp-fill" style={{ width: `${hpPercent}%` }} />
                      </div>
                    </div>
                  </div>
                  <button
                    className={`team-toggle ${isInTeam ? 'remove' : 'add'}`}
                    onClick={(e) => { e.stopPropagation(); toggleTeamMember(char.personajeId); }}
                    title={isInTeam ? 'Quitar del equipo' : 'Añadir al equipo'}
                    disabled={!isInTeam && activeTeamIds.length >= 4}
                  >
                    {isInTeam ? <FiMinus size={14} /> : <FiPlus size={14} />}
                  </button>
                </div>
              );
            })}

            {allCharacters.length === 0 && (
              <div className="empty-characters">
                <GiSwordWound size={40} className="empty-icon" />
                <p>No tienes personajes aún</p>
                <button onClick={() => navigate('/shop')}>Ir a la tienda</button>
              </div>
            )}
          </div>
        </aside>

        {/* === PANEL CENTRAL: Visor 3D + Stats === */}
        <main className="character-viewer">
          {selectedChar ? (
            <>
              <div className="viewer-header">
                <h2>{selectedConfig?.displayName || selectedChar.personajeId}</h2>
                <div className="viewer-badges">
                  <span className="badge-rango" style={{ color: rangoColor(selectedChar.rango), borderColor: rangoColor(selectedChar.rango) }}>
                    <GiStaryu size={12} /> Rango {selectedChar.rango}
                  </span>
                  <span className="badge-level"><GiLevelEndFlag size={12} /> Nv. {selectedChar.nivel}</span>
                  {activeTeamIds.includes(selectedChar.personajeId) && (
                    <span className="badge-active"><GiCrossedSwords size={12} /> En equipo</span>
                  )}
                </div>
              </div>

              {/* Canvas 3D */}
              <div className="viewer-3d">
                <Canvas
                  shadows
                  dpr={[0.75, 1.5]}
                  camera={{ position: [0, 1.5, 3], fov: 40 }}
                  gl={{ antialias: true, alpha: true }}
                  style={{ background: 'radial-gradient(ellipse at bottom, #1a1a2e 0%, #0a0a14 100%)' }}
                >
                  <Suspense fallback={
                    <mesh position={[0, 0.8, 0]}>
                      <capsuleGeometry args={[0.25, 0.6, 8, 16]} />
                      <meshStandardMaterial color="#ffd700" wireframe />
                    </mesh>
                  }>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[3, 5, 3]} intensity={1.4} castShadow />
                    <directionalLight position={[-2, 3, -1]} intensity={0.4} color="#9b59b6" />
                    <pointLight position={[0, 2, -3]} intensity={0.6} color="#3498db" />
                    <spotLight position={[0, 5, 0]} intensity={0.3} angle={Math.PI / 4} penumbra={1} />

                    <group position={[0, 0, 0]} rotation={[0, Math.PI, 0]}>
                      <CharacterModel3D personajeId={selectedChar.personajeId} animation="Idle" scale={1} />
                    </group>

                    <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={4} blur={2} far={3} />
                    <Environment preset="night" />
                  </Suspense>
                  <OrbitControls target={[0, 1, 0]} minDistance={2} maxDistance={6} minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI / 2.1} enablePan={false} />
                  <AdaptiveDpr pixelated />
                </Canvas>
              </div>

              {/* Stats reales */}
              <div className="viewer-stats">
                <h3><GiChart size={16} /> Estadísticas</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <GiRuneSword size={20} className="stat-icon atk" />
                    <span className="stat-value">{selectedChar.stats?.atk ?? 0}</span>
                    <span className="stat-label">ATK</span>
                  </div>
                  <div className="stat-item">
                    <GiShieldBash size={20} className="stat-icon def" />
                    <span className="stat-value">{selectedChar.stats?.defensa ?? 0}</span>
                    <span className="stat-label">DEF</span>
                  </div>
                  <div className="stat-item">
                    <GiHearts size={20} className="stat-icon hp" />
                    <span className="stat-value">{selectedChar.saludActual}/{selectedChar.saludMaxima}</span>
                    <span className="stat-label">HP</span>
                  </div>
                  <div className="stat-item">
                    <GiSpeedometer size={20} className="stat-icon spd" />
                    <span className="stat-value">{selectedChar.stats?.vida ?? 0}</span>
                    <span className="stat-label">VID</span>
                  </div>
                  {Object.entries(selectedChar.stats || {})
                    .filter(([k]) => !['atk', 'vida', 'defensa'].includes(k))
                    .map(([key, val]) => (
                      <div key={key} className="stat-item">
                        <GiStaryu size={20} className="stat-icon misc" />
                        <span className="stat-value">{val}</span>
                        <span className="stat-label">{key.toUpperCase()}</span>
                      </div>
                    ))}
                </div>

                {/* HP bar visual */}
                <div className="hp-bar-container">
                  <div className="hp-bar-bg">
                    <div className="hp-bar-fill" style={{ width: `${(selectedChar.saludActual / Math.max(selectedChar.saludMaxima, 1)) * 100}%` }} />
                  </div>
                  <span className="hp-bar-text"><GiHearts size={12} /> {selectedChar.saludActual} / {selectedChar.saludMaxima}</span>
                </div>

                <div className="char-extra-info">
                  <span>Etapa: {selectedChar.etapa}</span>
                  <span>EXP: {selectedChar.experiencia}</span>
                  <span>Estado: <span className={`estado-${selectedChar.estado}`}>{selectedChar.estado}</span></span>
                </div>

                {/* Poder total del personaje (base + equipo) */}
                <div className="char-power-summary">
                  <GiPowerLightning size={16} className="power-icon" />
                  <span className="power-number">{calcCharacterPower(selectedChar, equipCatalog)}</span>
                  <span className="power-label">PODER</span>
                </div>
              </div>

              {/* Acción */}
              <div className="viewer-actions">
                <button
                  className={`action-btn ${activeTeamIds.includes(selectedChar.personajeId) ? 'remove' : 'add'}`}
                  onClick={() => toggleTeamMember(selectedChar.personajeId)}
                  disabled={!activeTeamIds.includes(selectedChar.personajeId) && activeTeamIds.length >= 4}
                >
                  {activeTeamIds.includes(selectedChar.personajeId)
                    ? <><FiMinus size={16} /> Quitar del equipo</>
                    : <><FiPlus size={16} /> Añadir al equipo</>}
                </button>
              </div>
            </>
          ) : (
            <div className="viewer-empty">
              <GiCrossedSwords size={60} className="empty-icon" />
              <p>Selecciona un personaje para verlo en 3D</p>
            </div>
          )}
        </main>

        {/* === PANEL DERECHO: Equipamiento + Mochila + Consumibles === */}
        <aside className="equipment-panel">

          {/* Items equipados en el personaje */}
          <div className="equip-section">
            <h3><GiChestArmor size={16} /> Equipado ({selectedCharEquipped.length})</h3>
            <div className="equip-slots">
              {selectedCharEquipped.length > 0 ? (
                selectedCharEquipped.map((item) => (
                  <div key={item._id} className="equip-slot filled" style={{ borderColor: rangoColor(item.rango) }}>
                    <div className="slot-icon-wrap" style={{ color: rangoColor(item.rango) }}>
                      <EquipTypeIcon tipo={item.tipo} size={22} />
                    </div>
                    <div className="slot-info">
                      <span className="slot-item-name">{item.nombre}</span>
                      <div className="slot-item-stats">
                        {item.stats.atk > 0 && <span className="mini-stat"><GiRuneSword size={10} /> {item.stats.atk}</span>}
                        {item.stats.defensa > 0 && <span className="mini-stat"><GiShieldBash size={10} /> {item.stats.defensa}</span>}
                        {item.stats.vida > 0 && <span className="mini-stat"><GiHearts size={10} /> {item.stats.vida}</span>}
                      </div>
                      <span className="slot-rango" style={{ color: rangoColor(item.rango) }}>{item.rango}</span>
                    </div>
                    <button
                      className="unequip-btn"
                      onClick={() => handleUnequip(item._id)}
                      disabled={actionLoading === item._id}
                      title="Desequipar"
                    >
                      {actionLoading === item._id
                        ? <span className="btn-spinner" />
                        : <><FiMinus size={12} /> <span className="unequip-label">Quitar</span></>}
                    </button>
                  </div>
                ))
              ) : (
                <div className="equip-empty-state">
                  <GiSwordWound size={28} className="empty-icon" />
                  <p>Sin equipamiento</p>
                  <p className="hint">Equipa items desde la mochila</p>
                </div>
              )}
            </div>
          </div>

          {/* Mochila (items no equipados) */}
          <div className="inventory-section">
            <h3><GiBackpack size={16} /> Mochila ({backpackItems.length})</h3>
            <div className="inventory-list">
              {backpackItems.map((item) => (
                <div key={item._id} className="inv-item" style={{ borderLeftColor: rangoColor(item.rango) }}>
                  <div className="inv-icon-wrap" style={{ color: rangoColor(item.rango) }}>
                    <EquipTypeIcon tipo={item.tipo} size={18} />
                  </div>
                  <div className="inv-info">
                    <span className="inv-name">{item.nombre}</span>
                    <div className="inv-meta">
                      <span className="inv-type">{item.tipo}</span>
                      <span className="inv-rango" style={{ color: rangoColor(item.rango) }}>{item.rango}</span>
                      {item.stats.atk > 0 && <span className="inv-stat"><GiRuneSword size={10} /> {item.stats.atk}</span>}
                      {item.stats.defensa > 0 && <span className="inv-stat"><GiShieldBash size={10} /> {item.stats.defensa}</span>}
                    </div>
                  </div>
                  <button
                    className="equip-btn"
                    onClick={() => handleEquip(item._id)}
                    disabled={!selectedChar || actionLoading === item._id}
                    title={`Equipar en ${selectedConfig?.displayName || 'personaje'}`}
                  >
                    {actionLoading === item._id
                      ? <span className="btn-spinner" />
                      : <><FiPlus size={12} /> <span className="equip-label">Equipar</span></>}
                  </button>
                </div>
              ))}
              {backpackItems.length === 0 && <p className="empty-inv">Mochila vacía</p>}
              <button className="see-more-btn" onClick={() => navigate('/inventory')}>
                <GiBackpack size={14} /> Inventario completo
              </button>
            </div>
          </div>

          {/* Consumibles reales */}
          <div className="consumables-section">
            <h3><GiPotionBall size={16} /> Consumibles ({myConsumablesResolved.length})</h3>
            <div className="consumables-list">
              {myConsumablesResolved.map((item) => (
                <div key={item.inventoryId} className="cons-item">
                  <div className="cons-icon-wrap">
                    <ConsumableTypeIcon tipo={item.tipo} size={20} />
                  </div>
                  <div className="cons-info">
                    <span className="cons-name">{item.nombre}</span>
                    <span className="cons-detail">{item.tipo} · x{item.usos_restantes}</span>
                  </div>
                  <button
                    className="use-btn"
                    onClick={() => handleUseConsumable(item._id)}
                    disabled={!selectedChar || item.usos_restantes <= 0 || actionLoading === item._id}
                    title={`Usar en ${selectedConfig?.displayName || 'personaje'}`}
                  >
                    {actionLoading === item._id
                      ? <span className="btn-spinner" />
                      : 'Usar'}
                  </button>
                </div>
              ))}
              {myConsumablesResolved.length === 0 && <p className="empty-inv">Sin consumibles</p>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ============================================================
// API HELPERS (fetch directo a catálogos)
// ============================================================

async function fetchEquipmentCatalog(): Promise<CatalogEquipment[]> {
  try {
    const resp = await fetch('/api/equipment', { credentials: 'include' });
    if (!resp.ok) return [];
    const data = await resp.json();
    return Array.isArray(data) ? data : (data.equipment || []);
  } catch { return []; }
}

async function fetchConsumablesCatalog(): Promise<CatalogConsumable[]> {
  try {
    const resp = await fetch('/api/consumables', { credentials: 'include' });
    if (!resp.ok) return [];
    const data = await resp.json();
    return Array.isArray(data) ? data : (data.consumables || []);
  } catch { return []; }
}

async function fetchInventory(): Promise<{ equipment: string[]; consumables: InventoryConsumable[] } | null> {
  try {
    const resp = await fetch('/api/inventory', { credentials: 'include' });
    if (!resp.ok) return null;
    return await resp.json();
  } catch { return null; }
}

export default Teams;
