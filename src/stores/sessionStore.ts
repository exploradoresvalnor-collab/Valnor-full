/**
 * Session Store - Manejo de sesión (None / Auth)
 * 
 * Modo NONE: Estado inicial, no ha elegido (redirige a landing)
 * Modo AUTH: Login con backend, sincronización completa
 * 
 * Al cambiar de sesión (endSession) se limpian los stores dependientes.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type SessionMode = 'none' | 'auth';

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

export interface SessionState {
  // Modo de sesión
  mode: SessionMode;
  
  // ¿Primera vez?
  isFirstTime: boolean;
  
  // ¿Está inicializado?
  isInitialized: boolean;
}

export interface SessionActions {
  // Iniciar con cuenta (llamar después de login exitoso)
  startAsAuth: () => void;
  
  // Cerrar sesión (vuelve a pantalla inicial)
  endSession: () => void;
  
  // Marcar como inicializado
  setInitialized: () => void;
}

const initialState: SessionState = {
  mode: 'none',
  isFirstTime: true,
  isInitialized: false,
};

export const useSessionStore = create<SessionState & SessionActions>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        
        startAsAuth: () => {
          set({
            mode: 'auth',
            isFirstTime: false,
            isInitialized: true,
          });
          console.log('🔐 Sesión iniciada con CUENTA');
        },
        
        endSession: () => {
          resetGameStores();
          set({
            mode: 'none',
            isInitialized: false,
          });
          console.log('👋 Sesión terminada');
        },
        
        setInitialized: () => set({ isInitialized: true }),
      }),
      {
        name: 'valnor-session-storage',
      }
    ),
    { name: 'SessionStore' }
  )
);

// Selectores helper
export const useSessionMode = () => useSessionStore((state) => state.mode);
