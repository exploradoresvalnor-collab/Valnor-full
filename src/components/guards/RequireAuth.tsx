/**
 * RequireAuth - Guard para rutas protegidas
 * Permite acceso si:
 * - Está autenticado (modo auth)
 * - Está en modo invitado (modo guest)
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSessionStore } from '../../stores/sessionStore';
import { LoadingScreen } from '../ui/LoadingScreen';

interface RequireAuthProps {
  children: React.ReactNode;
  requireVerified?: boolean;
  /** Si es true, NO permite acceso en modo guest */
  requireFullAuth?: boolean;
}

export function RequireAuth({ 
  children, 
  requireVerified = false,
  requireFullAuth = false 
}: RequireAuthProps) {
  const { user, loading: isLoading, isAuthenticated } = useAuth();
  const { mode, isInitialized: isGuestSession } = useSessionStore();
  const location = useLocation();

  // Mientras carga auth, mostrar loading
  if (isLoading) {
    return <LoadingScreen message="Verificando sesión..." />;
  }

  // MODO NONE: No ha elegido → ir a landing
  if (mode === 'none' && !isAuthenticated) {
    return <Navigate to="/landing" state={{ from: location }} replace />;
  }

  // MODO INVITADO: Si hay sesión guest activa y no requiere auth completo
  if (mode === 'guest' && isGuestSession && !requireFullAuth) {
    return <>{children}</>;
  }

  // MODO AUTH: Verificar autenticación normal
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Si requiere verificación y no está verificado
  if (requireVerified && !user.isVerified) {
    return <Navigate to="/auth/verify" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default RequireAuth;
