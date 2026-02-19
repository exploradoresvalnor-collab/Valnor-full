// src/services/guest.service.ts

const generateId = () => `guest_${Math.random().toString(36).slice(2,9)}_${Date.now().toString(36)}`;
import { User } from '../types/user.types';
import { STORAGE_KEYS } from '../utils/constants';
import { authService } from './auth.service';
import { useSessionStore } from '../stores/sessionStore';

const GUEST_USER_KEY = 'guest_user';

export const createGuestUser = (): User => {
  const guestId = generateId();
  const guestUser: User = {
    id: guestId,
    username: 'Invitado',
    email: `${guestId}@valnor.com`,
    roles: ['guest'],
    character: null,
    // Add any other necessary user properties with default values
  };

  localStorage.setItem(GUEST_USER_KEY, JSON.stringify(guestUser));
  return guestUser;
};

export const getGuestUser = (): User | null => {
  const guestUserJson = localStorage.getItem(GUEST_USER_KEY);
  if (guestUserJson) {
    return JSON.parse(guestUserJson) as User;
  }
  return null;
};

export const clearGuestUser = () => {
  localStorage.removeItem(GUEST_USER_KEY);
};

/**
 * Inicia una sesión demo (cliente-only)
 * - crea un usuario invitado local
 * - lo guarda en STORAGE_KEYS.USER para que authService lo cargue
 * - marca sessionStore como 'auth' para permitir acceso a rutas protegidas
 */
export const startDemoSession = (): void => {
  const guest = createGuestUser();

  // Mantener comportamiento síncrono mínimo (compatibilidad con tests):
  // persistir usuario base para que useAuth detecte sesión inmediatamente.
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(guest));
  authService.loadFromStorage();

  // Inyectar entorno demo completo (stores + localStorage) — import dinámico
  // (enriquecerá el user y poblará stores; es OK que sea async)
  import('../utils/demoBootstrapper')
    .then((m) => m.loadDemoEnvironment())
    .catch((e) => console.warn('[demo] loadDemoEnvironment falló:', e));

  // Marcar sesión como AUTH de tipo Guest (persistido en sessionStore)
  useSessionStore.getState().startGuestSession();

  console.info('[demo] sesión demo iniciada (cliente-only)');
};
