import { beforeEach, describe, expect, it, vi } from 'vitest';
import { performLogout } from './session.service';
import { startDemoSession } from './guest.service';
import { authService } from './auth.service';
import * as demoBootstrapper from '../utils/demoBootstrapper';
import { useSessionStore } from '../stores/sessionStore';

describe('session.service — performLogout', () => {
  beforeEach(() => {
    localStorage.clear();
    useSessionStore.getState().endSession();
    vi.restoreAllMocks();
  });

  it('cuando es sesión Guest limpia entorno local y NO llama al backend', async () => {
    startDemoSession();
    expect(useSessionStore.getState().isGuest).toBe(true);

    const authSpy = vi.spyOn(authService, 'logout').mockImplementation(async () => {});
    const demoSpy = vi.spyOn(demoBootstrapper, 'clearDemoEnvironment').mockImplementation(() => {});

    await performLogout();

    expect(demoSpy).toHaveBeenCalled();
    expect(authSpy).not.toHaveBeenCalled();
    expect(useSessionStore.getState().mode).toBe('none');
    expect(useSessionStore.getState().isGuest).toBe(false);
  });

  it('cuando es sesión real llama a authService.logout y NO limpia demo', async () => {
    // Simular sesión real
    useSessionStore.getState().startAsAuth();

    const authSpy = vi.spyOn(authService, 'logout').mockResolvedValue(undefined);
    const demoSpy = vi.spyOn(demoBootstrapper, 'clearDemoEnvironment').mockImplementation(() => {});

    await performLogout();

    expect(authSpy).toHaveBeenCalled();
    expect(demoSpy).not.toHaveBeenCalled();
    expect(useSessionStore.getState().mode).toBe('none');
  });
});
