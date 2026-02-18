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
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float, MeshReflectorMaterial, Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { ProStatsPanel } from '../../components/ui/ProStatsPanel';

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

import { userService, teamService, characterService } from '../../services';
import { CharacterModel3D } from '../../engine/components/CharacterModel3D';
import { usePlayerStore } from '../../stores/playerStore';
import { useTeamStore } from '../../stores/teamStore';
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

// Runa mágica giratoria (helper para el visor épico)
function AnilloMagico() {
  const ringRef = useRef<THREE.Mesh | null>(null);
  useFrame((state) => {
    if (ringRef.current) ringRef.current.rotation.z = state.clock.elapsedTime * 0.3;
  });
  return (
    <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <ringGeometry args={[1.8, 2.0, 64]} />
      <meshBasicMaterial color="#00e5ff" transparent opacity={0.6} toneMapped={false} />
    </mesh>
  );
}

// Partículas volumétricas: luciérnagas arcanas (reemplaza Sparkles)
function ArcaneEmbers({ count = 30 }: { count?: number }) {
  const groupRef = useRef<THREE.Group | null>(null);
  // Evitar que partículas aparezcan justo delante del panel (ángulo ~ PI)
  const particles = useMemo(() => {
    const PANEL_ANGLE = Math.PI; // panel situado en X negativo
    const PANEL_SPREAD = 0.9; // radianes a evitar alrededor del panel
    return Array.from({ length: count }).map(() => {
      // sample angle evitando la franja del panel
      let angle = Math.random() * Math.PI * 2;
      let attempts = 0;
      while (attempts < 12) {
        const delta = Math.abs(((angle - PANEL_ANGLE + Math.PI) % (Math.PI * 2)) - Math.PI);
        if (delta > PANEL_SPREAD) break;
        angle = Math.random() * Math.PI * 2;
        attempts++;
      }

      // radio ligeramente mayor si quedó cerca del panel para desplazarla
      let radius = 1.2 + Math.random() * 1.5;
      const nearPanel = Math.abs(Math.cos(angle - PANEL_ANGLE)) > 0.7;
      if (nearPanel) radius += 0.6;

      return {
        angle,
        radius,
        y: -1 + Math.random() * 3,
        speed: 0.1 + Math.random() * 0.3,
        size: 0.02 + Math.random() * 0.04,
        offset: Math.random() * 100,
      };
    });
  }, [count]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.1;
      groupRef.current.children.forEach((mesh, i) => {
        const p = particles[i];
        mesh.position.y = p.y + Math.sin(time * p.speed + p.offset) * 0.5;
        const currentRadius = p.radius + Math.cos(time * 0.5 + p.offset) * 0.2;
        mesh.position.x = Math.cos(p.angle) * currentRadius;
        mesh.position.z = Math.sin(p.angle) * currentRadius;

        // Evitar que las partículas crucen la zona del panel (empujarlas hacia afuera)
        const PANEL_POS = new THREE.Vector2(-1.6, 0);
        const dx = mesh.position.x - PANEL_POS.x;
        const dz = mesh.position.z - PANEL_POS.y;
        const dist2 = dx * dx + dz * dz;
        const minDist = 0.6;
        if (dist2 < minDist * minDist) {
          const dist = Math.sqrt(dist2) || 0.001;
          const push = (minDist - dist) + 0.12;
          mesh.position.x += (dx / dist) * push;
          mesh.position.z += (dz / dist) * push;
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <mesh key={i}>
          <sphereGeometry args={[p.size, 8, 8]} />
          <meshBasicMaterial
            color="#00e5ff"
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export function Teams() {
  const navigate = useNavigate();

  // Estado principal
  const [allCharacters, setAllCharacters] = useState<BackendCharacter[]>([]);
  const [selectedChar, setSelectedChar] = useState<BackendCharacter | null>(null);
  const [activeTeamIds, setActiveTeamIds] = useState<string[]>([]);
  // Demo helpers: mostrar todos los personajes y modo single-select
  const [demoShowAll, setDemoShowAll] = useState<boolean>(usePlayerStore.getState().characterName === 'Jugador Demo');
  const [singleSelectMode, setSingleSelectMode] = useState<boolean>(false);
  const isDemoUser = usePlayerStore(state => state.characterName) === 'Jugador Demo';

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

      // Detectar Demo: playerStore.characterName se establece por loadDemoEnvironment()
      const isDemo = usePlayerStore.getState().characterName === 'Jugador Demo';

      if (isDemo) {
        // --- INYECCIÓN DE MODO DEMO ---
        const localTeamStore = useTeamStore.getState();

        // 1) Personajes demo — Si demoShowAll=true cargamos *todos* los modelos disponibles,
        //    sino usamos solo los personajes 'owned' del teamStore (comportamiento previo).
        const owned = localTeamStore.ownedCharacters || [];
        let demoChars: BackendCharacter[] = [];

        if (demoShowAll) {
          const ownedMap = new Map(owned.map(o => [o.id, o]));
          demoChars = Object.entries(CHARACTER_MODEL_MAP).map(([pid, cfg]) => {
            const ownedDef = ownedMap.get(pid);
            if (ownedDef) {
              return {
                _id: ownedDef.id,
                personajeId: ownedDef.id,
                nombre: ownedDef.name,
                rango: ownedDef.rarity === 'legendary' ? 'SS' : ownedDef.rarity === 'epic' ? 'S' : 'A',
                nivel: ownedDef.level,
                etapa: 1,
                progreso: 0,
                experiencia: 0,
                saludActual: ownedDef.stats?.health || 100,
                saludMaxima: ownedDef.stats?.health || 100,
                estado: 'activo',
                stats: { atk: ownedDef.stats?.attack || 10, vida: ownedDef.stats?.health || 100, defensa: ownedDef.stats?.defense || 10 },
                equipamiento: [],
                activeBuffs: [],
                fechaHerido: null,
              } as BackendCharacter;
            }

            // Personaje no-owned: crear entrada demo básica para poder probarlo
            return {
              _id: pid,
              personajeId: pid,
              nombre: cfg.displayName || pid,
              rango: 'A',
              nivel: 20,
              etapa: 1,
              progreso: 0,
              experiencia: 0,
              saludActual: 1200,
              saludMaxima: 1200,
              estado: 'activo',
              stats: { atk: 140, vida: 1200, defensa: 110 },
              equipamiento: [],
              activeBuffs: [],
              fechaHerido: null,
            } as BackendCharacter;
          });
        } else {
          demoChars = owned.map(c => ({
            _id: c.id,
            personajeId: c.id,
            nombre: c.name,
            rango: c.rarity === 'legendary' ? 'SS' : c.rarity === 'epic' ? 'S' : 'A',
            nivel: c.level,
            etapa: 1,
            progreso: 0,
            experiencia: 0,
            saludActual: c.stats?.health || 100,
            saludMaxima: c.stats?.health || 100,
            estado: 'activo',
            stats: { atk: c.stats?.attack || 10, vida: c.stats?.health || 100, defensa: c.stats?.defense || 10 },
            equipamiento: [],
            activeBuffs: [],
            fechaHerido: null,
          }));
        }

        // 2) Catálogo demo (más items y consumibles "potentes" para probar)
        const demoEquipCatalog: CatalogEquipment[] = [
          { _id: 'eq-espada-1', nombre: 'Espada del Alba', tipoItem: 'arma', tipo: 'arma', rango: 'SS', stats: { atk: 350, defensa: 0, vida: 0 }, nivel_minimo_requerido: 1, costo_val: 0, descripcion: 'Espada demo de alto daño', habilidades: [], fuentes_obtencion: [] },
          { _id: 'eq-armadura-1', nombre: 'Peto de Mithril', tipoItem: 'armadura', tipo: 'armadura', rango: 'S', stats: { atk: 0, defensa: 420, vida: 800 }, nivel_minimo_requerido: 1, costo_val: 0, descripcion: 'Armadura demo con alta defensa', habilidades: [], fuentes_obtencion: [] },
          { _id: 'eq-anillo-1', nombre: 'Anillo de Vida', tipoItem: 'anillo', tipo: 'anillo', rango: 'A', stats: { atk: 40, defensa: 30, vida: 1500 }, nivel_minimo_requerido: 1, costo_val: 0, descripcion: 'Anillo que aumenta vida y ataque', habilidades: [], fuentes_obtencion: [] },
          { _id: 'eq-escudo-1', nombre: 'Escudo del Vínculo', tipoItem: 'escudo', tipo: 'escudo', rango: 'S', stats: { atk: 0, defensa: 300, vida: 600 }, nivel_minimo_requerido: 1, costo_val: 0, descripcion: 'Escudo que reduce daño recibido', habilidades: [], fuentes_obtencion: [] },
          { _id: 'eq-botas-1', nombre: 'Botas de Carrera', tipoItem: 'botas', tipo: 'botas', rango: 'A', stats: { atk: 0, defensa: 50, vida: 0 }, nivel_minimo_requerido: 1, costo_val: 0, descripcion: 'Aumenta la velocidad (ideal para pruebas)', habilidades: [], fuentes_obtencion: [] },
        ];

        const demoConsumCatalog: CatalogConsumable[] = [
          { _id: 'cons-pot-1', nombre: 'Poción Suprema', tipo: 'pocion', rango: 'SS', efecto: 'heal_1500', descripcion: 'Restaura 1500 HP al instante' },
          { _id: 'cons-fruto-1', nombre: 'Fruto Mitico', tipo: 'fruto_mitico', rango: 'S', efecto: 'buff_atk_50', descripcion: 'Aumenta ATK en +50 (demo)' },
          { _id: 'cons-breb-1', nombre: 'Brebaje de Defensa', tipo: 'pocion', rango: 'A', efecto: 'buff_def_200', descripcion: 'Otorga +200 DEF temporalmente' },
          { _id: 'cons-pot2', nombre: 'Poción Menor', tipo: 'pocion', rango: 'B', efecto: 'heal_300', descripcion: 'Restaura 300 HP' },
        ];

        // 3) Aplicar al estado UI
        setAllCharacters(demoChars as any);
        if (demoChars.length > 0) setSelectedChar(demoChars[0] as any);
        setActiveTeamIds(localTeamStore.activeTeam.map(t => t.id));

        setEquipCatalog(demoEquipCatalog);
        setConsumCatalog(demoConsumCatalog);

        // Inventario demo: 1 copia de cada equipo, varios consumibles
        setMyEquipmentIds(demoEquipCatalog.map(e => e._id));
        setMyConsumables([
          { _id: 'inv-pot-sup', consumableId: 'cons-pot-1', usos_restantes: 3 },
          { _id: 'inv-fruto-1', consumableId: 'cons-fruto-1', usos_restantes: 2 },
          { _id: 'inv-breb-1', consumableId: 'cons-breb-1', usos_restantes: 2 },
          { _id: 'inv-pot-2', consumableId: 'cons-pot2', usos_restantes: 8 },
        ]);

        setLoading(false);
        return;
      }

      // --- LÓGICA NORMAL (BACKEND REAL) ---
      try {
        const [me, inventory, eqCat, consCat] = await Promise.all([
          userService.getMe().catch(() => null),
          fetchInventory(), fetchEquipmentCatalog(), fetchConsumablesCatalog(),
        ]);

        if (cancelled) return;

        if (me) {
          const raw = (me as any).personajes;
          if (Array.isArray(raw)) {
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
            const personajeIds = active.characters.map((char: any) => {
              const charId = typeof char === 'string' ? char : char._id;
              const personaje = allCharacters.find(c => c._id === charId);
              return personaje?.personajeId;
            }).filter(Boolean) as string[];
            setActiveTeamIds(personajeIds);
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
  }, [demoShowAll]);

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
      if (singleSelectMode) return [personajeId];
      if (prev.length >= 4) return prev;
      return [...prev, personajeId];
    });
  }, [singleSelectMode]);

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
    const isDemo = usePlayerStore.getState().characterName === 'Jugador Demo';

    if (isDemo) {
      // Simulación Local
      const item = equipCatalog.find(e => e._id === itemId);
      const updatedChar = {
        ...selectedChar,
        equipamiento: [...(selectedChar.equipamiento || []), { id: itemId, nombre: item?.nombre, tipoItem: item?.tipo, slot: item?.tipo }]
      } as any;
      setSelectedChar(updatedChar);
      setAllCharacters(prev => prev.map(c => c.personajeId === updatedChar.personajeId ? updatedChar : c) as any);
      addToast('success', `${item?.nombre} equipado`);
      return;
    }

    // Backend Real
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
    const isDemo = usePlayerStore.getState().characterName === 'Jugador Demo';

    if (isDemo) {
      // Simulación Local
      const updatedChar = {
        ...selectedChar,
        equipamiento: (selectedChar.equipamiento || []).filter((eq: any) => (eq.id || eq) !== itemId)
      } as any;
      setSelectedChar(updatedChar);
      setAllCharacters(prev => prev.map(c => c.personajeId === updatedChar.personajeId ? updatedChar : c) as any);
      addToast('success', `Item desequipado`);
      return;
    }

    // Backend Real
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
  }, [selectedChar, refreshAfterAction, addToast]);

  const handleUseConsumable = useCallback(async (consumableId: string) => {
    if (!selectedChar) return;
    const isDemo = usePlayerStore.getState().characterName === 'Jugador Demo';

    if (isDemo) {
      const consDetail = consumCatalog.find(c => c._id === consumableId);
      // restar 1 uso
      setMyConsumables(prev => prev.map(it => it.consumableId === consumableId ? { ...it, usos_restantes: Math.max(0, it.usos_restantes - 1) } : it));

      if (consDetail) {
        // efectos demo simples: heal_X, heal_full, buff_atk_X, buff_def_X
        if (consDetail.efecto?.startsWith('heal_')) {
          const amount = parseInt(consDetail.efecto.split('_')[1] || '0', 10);
          setSelectedChar(prev => {
            if (!prev) return prev;
            const nhp = Math.min(prev.saludMaxima, prev.saludActual + amount);
            const updated = { ...prev, saludActual: nhp } as BackendCharacter;
            setAllCharacters(prevAll => prevAll.map(c => c.personajeId === updated.personajeId ? updated : c));
            return updated;
          });
          addToast('success', `HP restaurado +${consDetail.efecto.split('_')[1] || ''}`);
        } else if (consDetail.efecto === 'heal_full') {
          setSelectedChar(prev => {
            if (!prev) return prev;
            const updated = { ...prev, saludActual: prev.saludMaxima } as BackendCharacter;
            setAllCharacters(prevAll => prevAll.map(c => c.personajeId === updated.personajeId ? updated : c));
            return updated;
          });
          addToast('success', 'HP restaurado al máximo');
        } else if (consDetail.efecto?.startsWith('buff_atk_')) {
          const val = parseInt(consDetail.efecto.split('_')[2] || '0', 10);
          setSelectedChar(prev => {
            if (!prev) return prev;
            const updated = { ...prev, stats: { ...prev.stats, atk: (prev.stats.atk || 0) + val }, activeBuffs: [...(prev.activeBuffs || []), { type: 'atk', value: val, source: consDetail.nombre }] } as BackendCharacter;
            setAllCharacters(prevAll => prevAll.map(c => c.personajeId === updated.personajeId ? updated : c));
            return updated;
          });
          addToast('success', `+${val} ATK (buff)`);
        } else if (consDetail.efecto?.startsWith('buff_def_')) {
          const val = parseInt(consDetail.efecto.split('_')[2] || '0', 10);
          setSelectedChar(prev => {
            if (!prev) return prev;
            const updated = { ...prev, stats: { ...prev.stats, defensa: (prev.stats.defensa || 0) + val }, activeBuffs: [...(prev.activeBuffs || []), { type: 'def', value: val, source: consDetail.nombre }] } as BackendCharacter;
            setAllCharacters(prevAll => prevAll.map(c => c.personajeId === updated.personajeId ? updated : c));
            return updated;
          });
          addToast('success', `+${val} DEF (buff)`);
        } else {
          addToast('success', `${consDetail.nombre} usado`);
        }
      } else {
        addToast('success', 'Consumible usado');
      }
      return;
    }

    // Backend Real
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
  }, [selectedChar, refreshAfterAction, addToast]);

  const handleSave = useCallback(async () => {
    if (activeTeamIds.length === 0) return;
    const isDemo = usePlayerStore.getState().characterName === 'Jugador Demo';

    if (isDemo) {
      // Guardar el equipo en Zustand para poder usarlo en modo demo
      const localTeamStore = useTeamStore.getState();
      const newActiveTeam = activeTeamIds.map(id => localTeamStore.ownedCharacters.find(c => c.id === id)).filter(Boolean as any);
      localTeamStore.setTeam(newActiveTeam as any);
      addToast('success', 'Equipo Guardado (Modo Demo)');
      return;
    }

    // Backend Real
    setSaving(true);
    try {
      await userService.setActiveCharacter(activeTeamIds[0]);

      const mongoIds = activeTeamIds
        .map(pid => allCharacters.find(c => c.personajeId === pid)?._id)
        .filter(Boolean) as string[];

      if (mongoIds.length > 0) {
        const teams = await teamService.getMyTeams();
        const active = teams.find((t: any) => t.isActive || t.activo);
        if (active) {
          await teamService.updateTeam(active._id, { characters: mongoIds });
        } else {
          const newTeam = await teamService.createTeam({ name: 'Equipo Principal', characters: mongoIds });
          await teamService.activateTeam(newTeam._id);
        }
        addToast('success', 'Equipo guardado correctamente');
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
          <span className="team-count-badge" title={singleSelectMode ? 'Modo 1 personaje' : 'Máx. 4 personajes'}>
            <GiTeamIdea size={14} /> {activeTeamIds.length}/{singleSelectMode ? 1 : 4}
          </span>
          {isDemoUser && (
            <button className={`demo-mode-badge ${singleSelectMode ? 'active' : ''}`} onClick={() => { setSingleSelectMode(s => { const next = !s; if (next && activeTeamIds.length > 1) setActiveTeamIds([activeTeamIds[0]]); return next; }); }} title="Alternar modo 1 personaje">
              {singleSelectMode ? '1' : 'M'} Demo
            </button>
          )}
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
          <h3>
            <GiTeamIdea size={16} /> Mis Personajes ({allCharacters.length})
            {isDemoUser && (
              <small className="demo-controls">
                <button className={`demo-btn ${demoShowAll ? 'active' : ''}`} onClick={() => setDemoShowAll(s => !s)}>{demoShowAll ? 'Todos' : 'Solo owned'}</button>
                <button className={`demo-btn ${singleSelectMode ? 'active' : ''}`} onClick={() => { setSingleSelectMode(s => { const next = !s; if (next && activeTeamIds.length > 1) setActiveTeamIds([activeTeamIds[0]]); return next; }); }}>{singleSelectMode ? '1 personaje' : 'multi'}</button>
              </small>
            )}
          </h3>
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
                    disabled={!isInTeam && (singleSelectMode ? activeTeamIds.length >= 1 : activeTeamIds.length >= 4)}
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

              <div className="viewer-3d">
                <Canvas
                  shadows
                  dpr={[1, 2]}
                  camera={{ position: [0, 1.2, 4], fov: 40 }}
                  gl={{ antialias: true, alpha: true, stencil: false }}
                >
                  {/* Canvas transparente — el fondo diurno viene del CSS .viewer-3d */}

                  <Suspense fallback={null}>
                    {/* Luz principal tipo SOL, más suave para día */}
                    <spotLight position={[2, 8, 2]} angle={0.45} penumbra={0.4} intensity={2.2} distance={30} color="#fff7d9" castShadow />

                    {/* Volumetric ligero (muy sutil en día) */}
                    <mesh position={[0, 3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                      <coneGeometry args={[2.5, 6, 32, 1, true]} />
                      <meshBasicMaterial color="#fff7d9" transparent opacity={0.03} blending={THREE.AdditiveBlending} depthWrite={false} />
                    </mesh>

                    {/* Luz solar y relleno suave */}
                    <directionalLight position={[4, 6, 2]} intensity={1.1} color="#fff6d1" />
                    <directionalLight position={[-2, 2, -3]} intensity={0.45} color="#dfeeff" />

                    {/* Personaje con leve float para presencia */}
                    <Float speed={1.5} rotationIntensity={0.05} floatIntensity={selectedChar?.stats?.atk > 20 ? 0 : 0.2}>
                      <group position={[0, 0, 0]}>
                        <CharacterModel3D personajeId={selectedChar.personajeId} animation="Idle" scale={1} />

                        {/* PANEL ANCLADO AL PERSONAJE: backdrop + ProStats */}
                        <group position={[-1.1, 1.05, 0]}>
                          <Html transform distanceFactor={1.05} style={{ width: 360, pointerEvents: 'auto', zIndex: 1000 }}>
                            <ProStatsPanel character={selectedChar} totalPower={calcCharacterPower(selectedChar, equipCatalog)} />
                          </Html>
                        </group>
                      </group>
                    </Float>

                    {/* Runa mágica + partículas volumétricas */}
                    <AnilloMagico />
                    <ArcaneEmbers count={22} />

                    {/* Suelo reflectante (obsidiana) */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                      <planeGeometry args={[50, 50]} />
                      <MeshReflectorMaterial
                        blur={[220, 80]}
                        resolution={1024}
                        mixBlur={0.8}
                        mixStrength={24}
                        roughness={0.28}
                        depthScale={0.9}
                        minDepthThreshold={0.4}
                        maxDepthThreshold={1.2}
                        color="#0b1220"
                        metalness={0.45}
                        mirror={0.6}
                      />
                    </mesh>

                    <Environment preset="studio" environmentIntensity={0.1} />



                    {/* Bloom selectivo para runa y particles */}
                    <EffectComposer disableNormalPass>
                      <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.8} />
                    </EffectComposer>
                  </Suspense>

                  <OrbitControls
                    target={[0, 1, 0]}
                    minDistance={2}
                    maxDistance={5}
                    maxPolarAngle={Math.PI / 2.05}
                    minPolarAngle={Math.PI / 4}
                    enablePan={false}
                  />
                </Canvas>
              </div>



              {/* Acción */}
              <div className="viewer-actions">
                <button
                  className={`action-btn ${activeTeamIds.includes(selectedChar.personajeId) ? 'remove' : 'add'}`}
                  onClick={() => toggleTeamMember(selectedChar.personajeId)}
                  disabled={!activeTeamIds.includes(selectedChar.personajeId) && (singleSelectMode ? activeTeamIds.length >= 1 : activeTeamIds.length >= 4)}
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
