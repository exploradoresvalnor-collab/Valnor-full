import { beforeEach, describe, expect, it } from 'vitest';
import { createGuestUser, startDemoSession, clearGuestUser } from './guest.service';
import { STORAGE_KEYS } from '../utils/constants';
import { authService } from './auth.service';
import { useSessionStore, usePlayerStore, useTeamStore } from '../stores';

describe('guest.service (demo/client-only)', () => {
  beforeEach(() => {
    localStorage.clear();
    // Asegurar estado inicial de sesión
    useSessionStore.getState().endSession();
  });

  it('createGuestUser crea guest_user en localStorage', () => {
    const guest = createGuestUser();
    const stored = localStorage.getItem('guest_user');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored as string);
    expect(parsed.username).toBe('Invitado');
    expect(parsed.id).toBeTruthy();
  });

  it('startDemoSession guarda usuario en STORAGE_KEYS.USER y marca sesión guest', () => {
    startDemoSession();
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    expect(stored).not.toBeNull();

    const user = authService.getUser();
    expect(user).not.toBeNull();
    expect(user?.username).toBe('Invitado');

    expect(useSessionStore.getState().mode).toBe('auth');
    expect(useSessionStore.getState().isGuest).toBe(true);
  });

  it('clearGuestUser limpia la key guest_user', () => {
    createGuestUser();
    clearGuestUser();
    expect(localStorage.getItem('guest_user')).toBeNull();
  });

  it('clearDemoEnvironment limpia localStorage.USER y resetea stores', () => {
    // Preparar demo
    startDemoSession();
    // Asegurar que demo fue persistido
    expect(localStorage.getItem(STORAGE_KEYS.USER)).not.toBeNull();

    // Llamar clearDemoEnvironment
    return import('../utils/demoBootstrapper').then((m) => {
      m.clearDemoEnvironment();
      expect(localStorage.getItem(STORAGE_KEYS.USER)).toBeNull();
      expect(localStorage.getItem('guest_user')).toBeNull();

      // Player/team stores deben volver a su estado inicial
      const player = usePlayerStore.getState();
      const team = useTeamStore.getState();
      expect(player.gold).toBeGreaterThanOrEqual(0);
      expect(team.ownedCharacters.length).toBe(0);
    });
  });

  it('startDemoSession persiste isGuest en sessionStore (sobrevive F5)', () => {
    startDemoSession();
    const persisted = localStorage.getItem('valnor-session-storage');
    expect(persisted).toBeTruthy();
    expect(persisted).toContain('"isGuest":true');
  });
});