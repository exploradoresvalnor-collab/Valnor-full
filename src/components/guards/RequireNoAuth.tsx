/**
 * RequireNoAuth - Guard para rutas de auth
 * Redirige a dashboard si ya está autenticado
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSessionStore } from '../../stores/sessionStore';
import { LoadingScreen } from '../ui/LoadingScreen';

interface RequireNoAuthProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function RequireNoAuth({ children, redirectTo = '/dashboard' }: RequireNoAuthProps) {
  const { loading: isLoading, isAuthenticated } = useAuth();
  const isGuest = useSessionStore((s) => s.isGuest);
  const location = useLocation();

  // Mientras carga, mostrar loading
  if (isLoading) {
    return <LoadingScreen message="Cargando..." />;
  }

  // Si ya está autenticado (y NO es sesión Guest/Demo), redirigir
  // Los usuarios invitados deben poder ver Login/Registro para "subir de nivel" su cuenta
  if (isAuthenticated && !isGuest) {
    // Intentar ir a la página de donde venía, o al dashboard
    const from = (location.state as { from?: Location })?.from?.pathname || redirectTo;
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}

export default RequireNoAuth;
