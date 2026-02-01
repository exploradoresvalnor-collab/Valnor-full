/**
 * RequireAuth - Guard para rutas protegidas
 * Redirige a login si no está autenticado
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingScreen } from '../ui/LoadingScreen';

interface RequireAuthProps {
  children: React.ReactNode;
  requireVerified?: boolean;
}

export function RequireAuth({ children, requireVerified = false }: RequireAuthProps) {
  const { user, loading: isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Mientras carga, mostrar loading
  if (isLoading) {
    return <LoadingScreen message="Verificando sesión..." />;
  }

  // Si no está autenticado, redirigir a login
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
