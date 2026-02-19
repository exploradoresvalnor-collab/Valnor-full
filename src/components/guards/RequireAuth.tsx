/**
 * RequireAuth - Guard para rutas protegidas
 * Permite acceso solo si está autenticado (modo auth)
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSessionStore } from '../../stores/sessionStore';
import { LoadingScreen } from '../ui/LoadingScreen';

interface RequireAuthProps {
  children: React.ReactNode;
  requireVerified?: boolean;
}

export function RequireAuth({ 
  children, 
  requireVerified = false,
}: RequireAuthProps) {
  const { user, loading: isLoading, isAuthenticated } = useAuth();
  const { mode } = useSessionStore();
  // useIsGuestSession siempre en el nivel superior (reglas de hooks)
  const isGuest = useSessionStore((s) => s.isGuest);
  const location = useLocation();

  // Mientras carga auth, mostrar loading
  if (isLoading) {
    return <LoadingScreen message="Verificando sesión..." />;
  }

  // MODO NONE: No ha elegido → ir a landing
  if (mode === 'none' && !isAuthenticated) {
    return <Navigate to="/landing" state={{ from: location }} replace />;
  }

  // Sesión Guest (demo) cliente-only — permitir acceso sin backend
  if (mode === 'auth' && isGuest) {
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
