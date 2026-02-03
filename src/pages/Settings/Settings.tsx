/**
 * Settings Page - Página de configuración del usuario
 * 
 * Secciones:
 * - Audio (música, efectos, volumen master)
 * - Idioma
 * - Notificaciones
 * - Visual (efectos, partículas)
 * - Controles
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettings';
import { useSettingsStore } from '../../stores/settingsStore';
import './Settings.css';

type SettingsSection = 'audio' | 'language' | 'notifications' | 'visual' | 'controls';

export function Settings() {
  const navigate = useNavigate();
  const { loading, error, saveSettings, resetSettings } = useSettings();
  const store = useSettingsStore();
  
  const [activeSection, setActiveSection] = useState<SettingsSection>('audio');
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  
  // Detectar cambios
  useEffect(() => {
    setHasChanges(!store.isSynced);
  }, [store.isSynced]);
  
  const handleSave = async () => {
    const success = await saveSettings();
    if (success) {
      setSaveMessage('✓ Configuración guardada');
      setTimeout(() => setSaveMessage(null), 2000);
    } else {
      setSaveMessage('✗ Error al guardar');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };
  
  const handleReset = async () => {
    if (confirm('¿Restaurar toda la configuración a valores por defecto?')) {
      await resetSettings();
      setSaveMessage('✓ Configuración restaurada');
      setTimeout(() => setSaveMessage(null), 2000);
    }
  };
  
  const sections: { id: SettingsSection; label: string; icon: string }[] = [
    { id: 'audio', label: 'Audio', icon: '🔊' },
    { id: 'language', label: 'Idioma', icon: '🌐' },
    { id: 'notifications', label: 'Notificaciones', icon: '🔔' },
    { id: 'visual', label: 'Visual', icon: '✨' },
    { id: 'controls', label: 'Controles', icon: '🎮' },
  ];
  
  return (
    <div className="settings-page">
      {/* Header */}
      <header className="settings-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Volver
        </button>
        <h1>⚙️ Configuración</h1>
        <div className="header-actions">
          {hasChanges && (
            <span className="unsaved-indicator">● Sin guardar</span>
          )}
          {saveMessage && (
            <span className={`save-message ${saveMessage.includes('Error') ? 'error' : 'success'}`}>
              {saveMessage}
            </span>
          )}
        </div>
      </header>
      
      <div className="settings-container">
        {/* Sidebar */}
        <aside className="settings-sidebar">
          {sections.map((section) => (
            <button
              key={section.id}
              className={`sidebar-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="item-icon">{section.icon}</span>
              <span className="item-label">{section.label}</span>
            </button>
          ))}
          
          <div className="sidebar-footer">
            <button className="reset-btn" onClick={handleReset}>
              🔄 Restaurar
            </button>
          </div>
        </aside>
        
        {/* Content */}
        <main className="settings-content">
          {/* Audio Section */}
          {activeSection === 'audio' && (
            <section className="settings-section">
              <h2>🔊 Audio</h2>
              
              <div className="setting-group">
                <label>Volumen Master</label>
                <div className="slider-control">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={store.masterVolume}
                    onChange={(e) => store.setMasterVolume(Number(e.target.value))}
                  />
                  <span className="slider-value">{store.masterVolume}%</span>
                </div>
              </div>
              
              <div className="setting-group">
                <label>Música</label>
                <div className="slider-control">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={store.musicVolume}
                    onChange={(e) => store.setMusicVolume(Number(e.target.value))}
                  />
                  <span className="slider-value">{store.musicVolume}%</span>
                </div>
              </div>
              
              <div className="setting-group">
                <label>Efectos de Sonido</label>
                <div className="slider-control">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={store.sfxVolume}
                    onChange={(e) => store.setSfxVolume(Number(e.target.value))}
                  />
                  <span className="slider-value">{store.sfxVolume}%</span>
                </div>
              </div>
            </section>
          )}
          
          {/* Language Section */}
          {activeSection === 'language' && (
            <section className="settings-section">
              <h2>🌐 Idioma</h2>
              
              <div className="setting-group">
                <label>Idioma del juego</label>
                <div className="language-options">
                  <button
                    className={`lang-btn ${store.language === 'es' ? 'active' : ''}`}
                    onClick={() => store.setLanguage('es')}
                  >
                    🇪🇸 Español
                  </button>
                  <button
                    className={`lang-btn ${store.language === 'en' ? 'active' : ''}`}
                    onClick={() => store.setLanguage('en')}
                  >
                    🇺🇸 English
                  </button>
                </div>
              </div>
            </section>
          )}
          
          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <section className="settings-section">
              <h2>🔔 Notificaciones</h2>
              
              <div className="setting-group">
                <label>Notificaciones activadas</label>
                <div className="toggle-control">
                  <button
                    className={`toggle-btn ${store.notificationsEnabled ? 'active' : ''}`}
                    onClick={() => store.setNotificationsEnabled(!store.notificationsEnabled)}
                  >
                    <span className="toggle-slider" />
                  </button>
                  <span className="toggle-label">
                    {store.notificationsEnabled ? 'Activado' : 'Desactivado'}
                  </span>
                </div>
              </div>
              
              <div className="setting-group">
                <label>Sonido de notificaciones</label>
                <div className="toggle-control">
                  <button
                    className={`toggle-btn ${store.soundNotifications ? 'active' : ''}`}
                    onClick={() => store.setSoundNotifications(!store.soundNotifications)}
                    disabled={!store.notificationsEnabled}
                  >
                    <span className="toggle-slider" />
                  </button>
                  <span className="toggle-label">
                    {store.soundNotifications ? 'Con sonido' : 'Sin sonido'}
                  </span>
                </div>
              </div>
            </section>
          )}
          
          {/* Visual Section */}
          {activeSection === 'visual' && (
            <section className="settings-section">
              <h2>✨ Visual</h2>
              
              <div className="setting-group">
                <label>Números de daño</label>
                <div className="toggle-control">
                  <button
                    className={`toggle-btn ${store.showDamageNumbers ? 'active' : ''}`}
                    onClick={() => store.setShowDamageNumbers(!store.showDamageNumbers)}
                  >
                    <span className="toggle-slider" />
                  </button>
                  <span className="toggle-label">
                    {store.showDamageNumbers ? 'Mostrar' : 'Ocultar'}
                  </span>
                </div>
              </div>
              
              <div className="setting-group">
                <label>Sacudida de pantalla</label>
                <div className="toggle-control">
                  <button
                    className={`toggle-btn ${store.screenShake ? 'active' : ''}`}
                    onClick={() => store.setScreenShake(!store.screenShake)}
                  >
                    <span className="toggle-slider" />
                  </button>
                  <span className="toggle-label">
                    {store.screenShake ? 'Activado' : 'Desactivado'}
                  </span>
                </div>
              </div>
              
              <div className="setting-group">
                <label>Efectos de partículas</label>
                <div className="toggle-control">
                  <button
                    className={`toggle-btn ${store.particleEffects ? 'active' : ''}`}
                    onClick={() => store.setParticleEffects(!store.particleEffects)}
                  >
                    <span className="toggle-slider" />
                  </button>
                  <span className="toggle-label">
                    {store.particleEffects ? 'Activado' : 'Desactivado'}
                  </span>
                </div>
              </div>
            </section>
          )}
          
          {/* Controls Section */}
          {activeSection === 'controls' && (
            <section className="settings-section">
              <h2>🎮 Controles</h2>
              
              <div className="setting-group">
                <label>Invertir eje Y</label>
                <div className="toggle-control">
                  <button
                    className={`toggle-btn ${store.invertYAxis ? 'active' : ''}`}
                    onClick={() => store.setInvertYAxis(!store.invertYAxis)}
                  >
                    <span className="toggle-slider" />
                  </button>
                  <span className="toggle-label">
                    {store.invertYAxis ? 'Invertido' : 'Normal'}
                  </span>
                </div>
              </div>
              
              <div className="setting-group">
                <label>Sensibilidad del ratón</label>
                <div className="slider-control">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={store.mouseSensitivity}
                    onChange={(e) => store.setMouseSensitivity(Number(e.target.value))}
                  />
                  <span className="slider-value">{store.mouseSensitivity}</span>
                </div>
              </div>
              
              <div className="controls-info">
                <h4>Controles de Teclado</h4>
                <div className="key-bindings">
                  <div className="key-row">
                    <span className="key">W A S D</span>
                    <span>Movimiento</span>
                  </div>
                  <div className="key-row">
                    <span className="key">Espacio</span>
                    <span>Saltar</span>
                  </div>
                  <div className="key-row">
                    <span className="key">Shift</span>
                    <span>Correr</span>
                  </div>
                  <div className="key-row">
                    <span className="key">E</span>
                    <span>Interactuar</span>
                  </div>
                  <div className="key-row">
                    <span className="key">I</span>
                    <span>Inventario</span>
                  </div>
                  <div className="key-row">
                    <span className="key">ESC</span>
                    <span>Menú / Pausar</span>
                  </div>
                </div>
              </div>
            </section>
          )}
          
          {/* Save Button */}
          <div className="settings-actions">
            <button 
              className="save-btn"
              onClick={handleSave}
              disabled={loading || !hasChanges}
            >
              {loading ? 'Guardando...' : '💾 Guardar Cambios'}
            </button>
          </div>
          
          {error && (
            <div className="settings-error">
              ⚠️ {error}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Settings;
