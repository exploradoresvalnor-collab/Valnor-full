/**
 * Session Store - Manejo de sesión (Guest vs Auth)
 * 
 * Modo GUEST: Sin registro, guardado local, sin llamadas API
 * Modo AUTH: Login con backend, sincronización completa
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type SessionMode = 'guest' | 'auth';

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
  mode: 'guest',
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
          set({
            mode: 'guest',
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
