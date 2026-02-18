import { beforeEach, describe, expect, it } from 'vitest';
import { createGuestUser, startDemoSession, clearGuestUser } from './guest.service';
import { STORAGE_KEYS } from '../utils/constants';
import { authService } from './auth.service';
import { useSessionStore } from '../stores/sessionStore';

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

  it('startDemoSession guarda usuario en STORAGE_KEYS.USER y marca sesión auth', () => {
    startDemoSession();
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    expect(stored).not.toBeNull();

    const user = authService.getUser();
    expect(user).not.toBeNull();
    expect(user?.username).toBe('Invitado');

    expect(useSessionStore.getState().mode).toBe('auth');
  });

  it('clearGuestUser limpia la key guest_user', () => {
    createGuestUser();
    clearGuestUser();
    expect(localStorage.getItem('guest_user')).toBeNull();
  });
});