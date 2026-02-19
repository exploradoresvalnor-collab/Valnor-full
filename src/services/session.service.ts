import { useSessionStore } from '../stores/sessionStore';
import { authService } from './auth.service';
import { clearDemoEnvironment } from '../utils/demoBootstrapper';

/**
 * performLogout - flujo de cierre de sesión centralizado y testeable.
 * - Si la sesión es `guest` limpia todo localmente (no toca backend)
 * - Si la sesión es real, delega en `authService.logout()`
 */
export async function performLogout(): Promise<void> {
  const session = useSessionStore.getState();

  if (session.isGuest) {
    // Demo: solo limpiar entorno cliente-only
    await Promise.resolve(clearDemoEnvironment());
    useSessionStore.getState().endSession();
    return;
  }

  // Cuenta real → llamar al backend
  await authService.logout();
  useSessionStore.getState().endSession();
}
