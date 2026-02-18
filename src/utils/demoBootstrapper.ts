import { usePlayerStore } from '../stores/playerStore';
import { useTeamStore } from '../stores/teamStore';
import { STORAGE_KEYS } from '../utils/constants';
import { authService } from '../services/auth.service';

import { DEMO_CHARACTERS, DEMO_EQUIPMENT, DEMO_CONSUMABLES } from '../data/demoMockData';

/**
 * Carga en memoria y en localStorage los datos necesarios para el modo Demo
 * - inicializa playerStore y teamStore
 * - escribe un `valnor_user` con personajes e inventario (fallback para UIs)
 */
export function loadDemoEnvironment() {
  // 1) Reset stores por seguridad
  useTeamStore.getState().resetTeam();
  usePlayerStore.getState().resetPlayer();

  // 2) Poblar teamStore
  const teamStore = useTeamStore.getState();
  teamStore.setOwnedCharacters(
    DEMO_CHARACTERS.map((c) => ({
      id: c.id,
      name: c.name,
      level: c.level,
      class: c.class as any,
      rarity: c.rarity as any,
      stats: c.stats,
      isLeader: !!c.isLeader,
    }))
  );
  teamStore.setTeam(DEMO_CHARACTERS.slice(0, 3) as any);
  teamStore.setLeader(DEMO_CHARACTERS[0].id);

  // 3) Inicializar playerStore con recursos demo
  usePlayerStore.getState().initPlayer({
    characterId: DEMO_CHARACTERS[0].id, // modelo por defecto
    characterName: 'Jugador Demo',
    characterClass: DEMO_CHARACTERS[0].class,
    level: 25,
    gold: 50000,
    gems: 1000,
    tickets: 50,
    energy: 100,
    maxEnergy: 100,
    charactersOwned: DEMO_CHARACTERS.length,
    // health fallback para que barras no fallen
    currentHealth: 1000,
    maxHealth: 1500,
    realStats: DEMO_CHARACTERS[0].stats ? { atk: DEMO_CHARACTERS[0].stats.attack, vida: DEMO_CHARACTERS[0].stats.health, defensa: DEMO_CHARACTERS[0].stats.defense } : undefined,
  });

  // 4) Escribir un usuario "valnor_user" habitado (fallback para InventorySummary, Dashboard, etc.)
  try {
    const guest = JSON.parse(localStorage.getItem('guest_user') || '{}');
    const demoUser: any = {
      id: guest.id || 'guest_demo',
      email: guest.email || `${guest.id || 'guest_demo'}@valnor.local`,
      username: guest.username || 'Invitado Demo',
      isVerified: false,
      val: 50000,
      boletos: 50,
      evo: 1000,
      energia: 100,
      energiaMaxima: 100,
      personajeActivoId: DEMO_CHARACTERS[0].id,
      personajes: DEMO_CHARACTERS.map((c) => ({
        personajeId: c.id,
        nombre: c.name,
        nivel: c.level,
        clase: c.class,
        stats: c.stats ? { atk: c.stats.attack, vida: c.stats.health, defensa: c.stats.defense } : {},
        equipamiento: DEMO_EQUIPMENT.map((e) => e.id),
      })),
      inventarioEquipamiento: DEMO_EQUIPMENT,
      inventarioConsumibles: DEMO_CONSUMABLES,
      limiteInventarioEquipamiento: 100,
      limiteInventarioConsumibles: 100,
      fechaRegistro: new Date().toISOString(),
      ultimaActualizacion: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(demoUser));

    // Notificar a authService para que listeners reciban el usuario demo
    authService.loadFromStorage();
  } catch (err) {
    console.warn('[demo] no se pudo persistir usuario demo en localStorage', err);
  }

  console.info('✅ Entorno Demo cargado en memoria y localStorage');
}

export default loadDemoEnvironment;
