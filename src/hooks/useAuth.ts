/**
 * Hook de Autenticación - useAuth
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { User, LoginRequest, RegisterRequest } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(authService.getUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Suscribirse a cambios de autenticación
  useEffect(() => {
    const unsubscribe = authService.subscribe(setUser);
    return unsubscribe;
  }, []);

  // Login
  const login = useCallback(async (data: LoginRequest, returnUrl: string = '/dashboard') => {
    setLoading(true);
    setError(null);
    try {
      await authService.login(data);
      navigate(returnUrl);
      return true;
    } catch (err: any) {
      let message = 'Error desconocido';
      if (err.status === 0 || err.status === 404) {
        message = '🔌 Backend no conectado';
      } else if (err.status === 401) {
        message = '❌ Email o contraseña incorrectos';
      } else if (err.status === 403) {
        message = '⚠️ Tu cuenta aún no ha sido verificada';
      } else if (err.status >= 500) {
        message = '💥 Error del servidor';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Register
  const register = useCallback(async (data: RegisterRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.register(data);
      return response;
    } catch (err: any) {
      let message = 'Error en el registro';
      if (err.status === 409) {
        message = 'El email o username ya existe';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.logout();
      navigate('/landing');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Check session
  const checkSession = useCallback(async () => {
    setLoading(true);
    try {
      return await authService.checkSession();
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    checkSession,
    clearError: () => setError(null),
  };
}

export default useAuth;
