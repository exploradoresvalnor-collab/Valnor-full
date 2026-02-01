/**
 * RequireNoAuth - Guard para rutas de auth
 * Redirige a dashboard si ya está autenticado
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingScreen } from '../ui/LoadingScreen';

interface RequireNoAuthProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function RequireNoAuth({ children, redirectTo = '/dashboard' }: RequireNoAuthProps) {
  const { loading: isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Mientras carga, mostrar loading
  if (isLoading) {
    return <LoadingScreen message="Cargando..." />;
  }

  // Si ya está autenticado, redirigir
  if (isAuthenticated) {
    // Intentar ir a la página de donde venía, o al dashboard
    const from = (location.state as { from?: Location })?.from?.pathname || redirectTo;
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}

export default RequireNoAuth;
