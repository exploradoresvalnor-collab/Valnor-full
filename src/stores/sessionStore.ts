/**
 * Session Store - Manejo de sesión (None / Guest / Auth)
 * 
 * Modo NONE: Estado inicial, no ha elegido (redirige a landing)
 * Modo GUEST: Sin registro, guardado local, sin llamadas API
 * Modo AUTH: Login con backend, sincronización completa
 * 
 * Al cambiar de sesión (endSession) se limpian los stores dependientes.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type SessionMode = 'none' | 'guest' | 'auth';

/**
 * Limpia todos los stores de juego al cambiar de sesión.
 * Se importa dinámicamente para evitar circular dependencies.
 */
async function resetGameStores(): Promise<void> {
  try {
    // Importar dinámicamente para evitar ciclos (ESM-compatible)
    const [{ usePlayerStore }, { useTeamStore }, { useGameModeStore }] = await Promise.all([
      import('./playerStore'),
      import('./teamStore'),
      import('./gameModeStore'),
    ]);
    
    usePlayerStore.getState().resetPlayer();
    useTeamStore.getState().resetTeam();
    useGameModeStore.getState().clearMode();
    
    console.log('🧹 Stores de juego limpiados');
  } catch (e) {
    console.warn('⚠️ Error al limpiar stores:', e);
  }
}

export interface GuestProfile {
  name: string;
  avatarIndex: number;
  createdAt: string;
}

export interface SessionState {
  // Modo de sesión
  mode: SessionMode;
  
  // Perfil de invitado (solo para modo guest)
  guestProfile: GuestProfile | null;
  
  // ¿Primera vez?
  isFirstTime: boolean;
  
  // ¿Está inicializado?
  isInitialized: boolean;
}

export interface SessionActions {
  // Iniciar como invitado
  startAsGuest: (name?: string) => void;
  
  // Iniciar con cuenta (llamar después de login exitoso)
  startAsAuth: () => void;
  
  // Cerrar sesión (vuelve a pantalla inicial)
  endSession: () => void;
  
  // Actualizar perfil de invitado
  updateGuestProfile: (data: Partial<GuestProfile>) => void;
  
  // Marcar como inicializado
  setInitialized: () => void;
  
  // Verificar si está en modo invitado
  isGuest: () => boolean;
}

const generateGuestName = (): string => {
  const adjectives = ['Valiente', 'Astuto', 'Fuerte', 'Sabio', 'Veloz', 'Noble', 'Fiero'];
  const nouns = ['Guerrero', 'Mago', 'Arquero', 'Explorador', 'Cazador', 'Paladín'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 999);
  return `${adj}${noun}${num}`;
};

const initialState: SessionState = {
  mode: 'none',
  guestProfile: null,
  isFirstTime: true,
  isInitialized: false,
};

export const useSessionStore = create<SessionState & SessionActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        startAsGuest: (name) => {
          const guestName = name || generateGuestName();
          set({
            mode: 'guest',
            guestProfile: {
              name: guestName,
              avatarIndex: Math.floor(Math.random() * 8),
              createdAt: new Date().toISOString(),
            },
            isFirstTime: false,
            isInitialized: true,
          });
          console.log('🎮 Sesión iniciada como INVITADO:', guestName);
        },
        
        startAsAuth: () => {
          set({
            mode: 'auth',
            guestProfile: null,
            isFirstTime: false,
            isInitialized: true,
          });
          console.log('🔐 Sesión iniciada con CUENTA');
        },
        
        endSession: () => {
          resetGameStores();
          set({
            mode: 'none',
            guestProfile: null,
            isInitialized: false,
          });
          console.log('👋 Sesión terminada');
        },
        
        updateGuestProfile: (data) => {
          const current = get().guestProfile;
          if (current) {
            set({
              guestProfile: { ...current, ...data },
            });
          }
        },
        
        setInitialized: () => set({ isInitialized: true }),
        
        isGuest: () => get().mode === 'guest',
      }),
      {
        name: 'valnor-session-storage',
      }
    ),
    { name: 'SessionStore' }
  )
);

// Selectores helper
export const useIsGuest = () => useSessionStore((state) => state.mode === 'guest');
export const useGuestProfile = () => useSessionStore((state) => state.guestProfile);
export const useSessionMode = () => useSessionStore((state) => state.mode);
