/**
 * useSettings Hook - Gestión de configuración del usuario
 * 
 * Endpoints:
 * - GET /api/user/settings
 * - PUT /api/user/settings
 * - POST /api/user/settings/reset
 */

import { useCallback, useState } from 'react';
import { useSettingsStore, type UserSettings } from '../stores/settingsStore';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface UseSettingsReturn {
  // Estado del store
  settings: UserSettings;
  isSynced: boolean;
  
  // Estado de operaciones
  loading: boolean;
  error: string | null;
  
  // Acciones
  fetchSettings: () => Promise<void>;
  saveSettings: (newSettings?: Partial<UserSettings>) => Promise<boolean>;
  resetSettings: () => Promise<boolean>;
  
  // Setters locales (sin guardar en server)
  updateLocal: (settings: Partial<UserSettings>) => void;
}

export function useSettings(): UseSettingsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const store = useSettingsStore();
  
  const settings: UserSettings = {
    musicVolume: store.musicVolume,
    sfxVolume: store.sfxVolume,
    masterVolume: store.masterVolume,
    language: store.language,
    notificationsEnabled: store.notificationsEnabled,
    soundNotifications: store.soundNotifications,
    showDamageNumbers: store.showDamageNumbers,
    screenShake: store.screenShake,
    particleEffects: store.particleEffects,
    invertYAxis: store.invertYAxis,
    mouseSensitivity: store.mouseSensitivity,
  };
  
  /**
   * GET /api/user/settings
   * Obtiene la configuración del servidor y sincroniza el store
   */
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/user/settings`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener configuración');
      }
      
      const data = await response.json();
      store.syncFromServer(data);
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  }, [store]);
  
  /**
   * PUT /api/user/settings
   * Guarda la configuración actual (o la proporcionada) en el servidor
   */
  const saveSettings = useCallback(async (newSettings?: Partial<UserSettings>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    // Si se proporcionan nuevos settings, actualizarlos primero localmente
    if (newSettings) {
      store.updateSettings(newSettings);
    }
    
    const settingsToSave = newSettings || {
      musicVolume: store.musicVolume,
      sfxVolume: store.sfxVolume,
      language: store.language,
      notificationsEnabled: store.notificationsEnabled,
    };
    
    try {
      const response = await fetch(`${API_BASE}/api/user/settings`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsToSave),
      });
      
      if (!response.ok) {
        throw new Error('Error al guardar configuración');
      }
      
      const data = await response.json();
      if (data.settings) {
        store.syncFromServer(data.settings);
      } else {
        store.markAsSynced();
      }
      
      return true;
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('Error saving settings:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [store]);
  
  /**
   * POST /api/user/settings/reset
   * Restaura la configuración a valores por defecto
   */
  const resetSettings = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/user/settings/reset`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Error al restaurar configuración');
      }
      
      const data = await response.json();
      if (data.settings) {
        store.syncFromServer(data.settings);
      } else {
        store.resetToDefaults();
        store.markAsSynced();
      }
      
      return true;
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('Error resetting settings:', err);
      // Restaurar localmente de todas formas
      store.resetToDefaults();
      return false;
    } finally {
      setLoading(false);
    }
  }, [store]);
  
  /**
   * Actualiza settings localmente sin guardar en servidor
   */
  const updateLocal = useCallback((newSettings: Partial<UserSettings>) => {
    store.updateSettings(newSettings);
  }, [store]);
  
  return {
    settings,
    isSynced: store.isSynced,
    loading,
    error,
    fetchSettings,
    saveSettings,
    resetSettings,
    updateLocal,
  };
}

export default useSettings;
