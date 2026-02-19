/**
 * Settings Store - Configuración del usuario
 * 
 * Endpoints:
 * - GET /api/user/settings
 * - PUT /api/user/settings
 * - POST /api/user/settings/reset
 */

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { devtools, persist } from 'zustand/middleware';

export interface UserSettings {
  // Audio
  musicVolume: number;      // 0-100
  sfxVolume: number;        // 0-100
  masterVolume: number;     // 0-100
  
  // Idioma
  language: 'es' | 'en';
  
  // Notificaciones
  notificationsEnabled: boolean;
  soundNotifications: boolean;
  
  // Visual (extras frontend)
  showDamageNumbers: boolean;
  screenShake: boolean;
  particleEffects: boolean;
  
  // Controles
  invertYAxis: boolean;
  mouseSensitivity: number; // 1-10
}

interface SettingsState extends UserSettings {
  // Estado de sincronización
  isSynced: boolean;
  lastSyncedAt: number | null;
}

interface SettingsActions {
  // Setters individuales
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  setMasterVolume: (volume: number) => void;
  setLanguage: (lang: 'es' | 'en') => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setSoundNotifications: (enabled: boolean) => void;
  setShowDamageNumbers: (show: boolean) => void;
  setScreenShake: (enabled: boolean) => void;
  setParticleEffects: (enabled: boolean) => void;
  setInvertYAxis: (invert: boolean) => void;
  setMouseSensitivity: (sensitivity: number) => void;
  
  // Batch update
  updateSettings: (settings: Partial<UserSettings>) => void;
  
  // Sincronización con backend
  syncFromServer: (settings: Partial<UserSettings>) => void;
  markAsSynced: () => void;
  
  // Reset
  resetToDefaults: () => void;
}

const defaultSettings: UserSettings = {
  musicVolume: 50,
  sfxVolume: 50,
  masterVolume: 100,
  language: 'es',
  notificationsEnabled: true,
  soundNotifications: true,
  showDamageNumbers: true,
  screenShake: true,
  particleEffects: true,
  invertYAxis: false,
  mouseSensitivity: 5,
};

const initialState: SettingsState = {
  ...defaultSettings,
  isSynced: false,
  lastSyncedAt: null,
};

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setMusicVolume: (volume) => 
          set({ musicVolume: Math.max(0, Math.min(100, volume)), isSynced: false }),

        setSfxVolume: (volume) => 
          set({ sfxVolume: Math.max(0, Math.min(100, volume)), isSynced: false }),

        setMasterVolume: (volume) => 
          set({ masterVolume: Math.max(0, Math.min(100, volume)), isSynced: false }),

        setLanguage: (language) => 
          set({ language, isSynced: false }),

        setNotificationsEnabled: (notificationsEnabled) => 
          set({ notificationsEnabled, isSynced: false }),

        setSoundNotifications: (soundNotifications) => 
          set({ soundNotifications, isSynced: false }),

        setShowDamageNumbers: (showDamageNumbers) => 
          set({ showDamageNumbers }),

        setScreenShake: (screenShake) => 
          set({ screenShake }),

        setParticleEffects: (particleEffects) => 
          set({ particleEffects }),

        setInvertYAxis: (invertYAxis) => 
          set({ invertYAxis }),

        setMouseSensitivity: (sensitivity) => 
          set({ mouseSensitivity: Math.max(1, Math.min(10, sensitivity)) }),

        updateSettings: (settings) => 
          set((state) => ({ ...state, ...settings, isSynced: false })),

        syncFromServer: (settings) => 
          set((state) => ({ 
            ...state, 
            ...settings, 
            isSynced: true, 
            lastSyncedAt: Date.now() 
          })),

        markAsSynced: () => 
          set({ isSynced: true, lastSyncedAt: Date.now() }),

        resetToDefaults: () => 
          set({ ...defaultSettings, isSynced: false }),
      }),
      {
        name: 'valnor-settings',
        partialize: (state) => ({
          musicVolume: state.musicVolume,
          sfxVolume: state.sfxVolume,
          masterVolume: state.masterVolume,
          language: state.language,
          notificationsEnabled: state.notificationsEnabled,
          soundNotifications: state.soundNotifications,
          showDamageNumbers: state.showDamageNumbers,
          screenShake: state.screenShake,
          particleEffects: state.particleEffects,
          invertYAxis: state.invertYAxis,
          mouseSensitivity: state.mouseSensitivity,
        }),
      }
    ),
    { name: 'SettingsStore' }
  )
);

// Selectores
export const useAudioSettings = () => useSettingsStore(
  useShallow((s) => ({
    musicVolume: s.musicVolume,
    sfxVolume: s.sfxVolume,
    masterVolume: s.masterVolume,
  }))
);

export const useLanguage = () => useSettingsStore((s) => s.language);

export const useNotificationSettings = () => useSettingsStore(
  useShallow((s) => ({
    notificationsEnabled: s.notificationsEnabled,
    soundNotifications: s.soundNotifications,
  }))
);
