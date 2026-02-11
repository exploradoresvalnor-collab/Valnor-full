/**
 * GuestAccessGuard — Controla acceso a rutas según modo de sesión
 * 
 * Matriz de acceso para modo Guest:
 * ✅ PERMITIDO:  Dashboard, Wiki, Settings, Ranking (solo ver), Shop (solo ver), Profile
 * 🚫 BLOQUEADO:  Dungeon, Survival, Marketplace, Inventory, Teams
 * 
 * En modo 'none' → redirige a /landing
 * En modo 'auth' → acceso completo
 * En modo 'guest' → según la matriz
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useSessionStore } from '../../stores/sessionStore';

/** Nivel de acceso por ruta para invitados */
type GuestAccess = 'full' | 'view-only' | 'blocked';

/** Matriz de acceso: ruta base → nivel */
const GUEST_ACCESS_MATRIX: Record<string, GuestAccess> = {
  '/dashboard':   'full',
  '/wiki':        'full',
  '/settings':    'full',
  '/profile':     'full',
  '/portals':     'full',
  
  '/ranking':     'view-only',
  '/shop':        'view-only',
  
  '/dungeon':     'blocked',
  '/survival':    'blocked',
  '/marketplace': 'blocked',
  '/inventory':   'blocked',
  '/teams':       'blocked',
};

/** Obtener nivel de acceso para una ruta */
function getGuestAccess(pathname: string): GuestAccess {
  // Buscar la ruta base más larga que coincida
  const match = Object.keys(GUEST_ACCESS_MATRIX)
    .filter((route) => pathname.startsWith(route))
    .sort((a, b) => b.length - a.length)[0];
  
  return match ? GUEST_ACCESS_MATRIX[match] : 'blocked';
}

interface GuestAccessGuardProps {
  children: React.ReactNode;
  /** Mensaje personalizado al bloquear (se pasa como state a la página de bloqueo) */
  blockedMessage?: string;
}

export function GuestAccessGuard({ children, blockedMessage }: GuestAccessGuardProps) {
  const mode = useSessionStore((s) => s.mode);
  const location = useLocation();

  // Modo 'none' → no ha elegido nada, ir a landing
  if (mode === 'none') {
    return <Navigate to="/landing" replace />;
  }

  // Modo 'auth' → acceso completo
  if (mode === 'auth') {
    return <>{children}</>;
  }

  // Modo 'guest' → verificar matriz de acceso
  const access = getGuestAccess(location.pathname);

  if (access === 'blocked') {
    return (
      <Navigate 
        to="/dashboard" 
        replace 
        state={{ 
          guestBlocked: true,
          blockedRoute: location.pathname,
          message: blockedMessage || 'Necesitas una cuenta para acceder a esta sección.',
        }} 
      />
    );
  }

  // 'full' o 'view-only' → renderizar hijos
  // Para 'view-only', la página individual puede usar useGuestViewOnly() para desactivar acciones
  return <>{children}</>;
}

/**
 * Hook para saber si el usuario está en view-only (invitado en página view-only)
 */
export function useGuestViewOnly(): boolean {
  const mode = useSessionStore((s) => s.mode);
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  
  if (mode !== 'guest') return false;
  return getGuestAccess(pathname) === 'view-only';
}

/**
 * Hook para verificar si una acción específica está bloqueada para invitados
 */
export function useGuestBlocked(): {
  isGuest: boolean;
  isBlocked: (action?: string) => boolean;
  message: string;
} {
  const mode = useSessionStore((s) => s.mode);
  const isGuest = mode === 'guest';

  return {
    isGuest,
    isBlocked: (_action?: string) => isGuest,
    message: '🔒 Crea una cuenta para desbloquear esta función',
  };
}

export default GuestAccessGuard;
