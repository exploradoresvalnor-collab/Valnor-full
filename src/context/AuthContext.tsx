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
      
      // Si hay token o usuario guardado, verificar sesión
      if (token || storedUser) {
        try {
          const isValid = await authService.checkSession();
          if (isValid) {
            const session = useSessionStore.getState();
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
              const session = useSessionStore.getState();
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
