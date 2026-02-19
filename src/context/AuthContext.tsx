/**
 * Contexto de Autenticación
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';
import { socketService } from '../services/socket.service';
import { STORAGE_KEYS } from '../utils/constants';
import { useSessionStore } from '../stores/sessionStore';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(authService.getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.subscribe(setUser);

    const checkAuth = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      
      // Si la sesión actual es Guest ya persistida, evitar llamadas al backend
      const session = useSessionStore.getState();

      // Debido a que la rehidratación de Zustand/persist puede ser asíncrona,
      // comprobar también el almacenamiento persistido como fallback.
      const persistedSessionRaw = localStorage.getItem('valnor-session-storage');
      const persistedIsGuest = (() => {
        if (!persistedSessionRaw) return false;
        try {
          const parsed = JSON.parse(persistedSessionRaw);
          return !!(parsed && parsed.state && parsed.state.isGuest);
        } catch {
          return false;
        }
      })();

      if (session.isGuest || persistedIsGuest) {
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
          } catch { /* parse failed */ }
        }
        setLoading(false);
        return;
      }

      // Si hay token o usuario guardado, verificar sesión
      if (token || storedUser) {
        try {
          const isValid = await authService.checkSession();
          if (isValid) {
            if (session.mode !== 'auth') {
              session.startAsAuth();
            }
            // Conectar WebSocket cuando la sesión es válida
            if (!socketService.isConnected()) {
              socketService.connect();
            }
          }
        } catch {
          // checkSession ya maneja la limpieza solo para 401/403
          // Para otros errores, mantener sesión con datos locales
          if (storedUser) {
            try {
              const parsed = JSON.parse(storedUser);
              setUser(parsed);
              if (session.mode !== 'auth') {
                session.startAsAuth();
              }
              // Conectar WebSocket con datos locales también
              if (!socketService.isConnected()) {
                socketService.connect();
              }
            } catch { /* parse failed */ }
          }
        }
      }
      setLoading(false);
    };

    checkAuth();
    return () => {
      unsubscribe();
      // Desconectar socket al desmontar AuthProvider
      socketService.disconnect();
    };
  }, []);

  const refreshUser = async () => {
    try {
      await authService.getCurrentUser();
    } catch {
      // Silenciar
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext debe usarse dentro de AuthProvider');
  }
  return context;
}
