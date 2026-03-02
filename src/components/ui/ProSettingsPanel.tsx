import { useCallback, useEffect } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useEngineStore, type QualityLevel } from '../../engine/stores/engineStore';
import './ProSettingsPanel.css';

interface ProSettingsPanelProps {
    onClose: () => void;
}

const QUALITY_OPTIONS: { key: QualityLevel; icon: string; label: string; desc: string }[] = [
    { key: 'low', icon: '🔋', label: 'Baja', desc: 'Máximo FPS' },
    { key: 'medium', icon: '⚖️', label: 'Media', desc: 'Equilibrado' },
    { key: 'high', icon: '✨', label: 'Alta', desc: 'Mejor visual' },
    { key: 'ultra', icon: '💎', label: 'Ultra', desc: 'Máx calidad' },
];

export function ProSettingsPanel({ onClose }: ProSettingsPanelProps) {
    // Engine (graphics)
    const quality = useEngineStore(s => s.quality);
    const setQuality = useEngineStore(s => s.setQuality);
    const fps = useEngineStore(s => s.fps);
    const shadowQuality = useEngineStore(s => s.shadowQuality);
    const viewDistance = useEngineStore(s => s.viewDistance);

    // Settings (audio)
    const musicVolume = useSettingsStore(s => s.musicVolume);
    const sfxVolume = useSettingsStore(s => s.sfxVolume);
    const masterVolume = useSettingsStore(s => s.masterVolume);
    const setMusicVolume = useSettingsStore(s => s.setMusicVolume);
    const setSfxVolume = useSettingsStore(s => s.setSfxVolume);
    const setMasterVolume = useSettingsStore(s => s.setMasterVolume);
    const mobileControlsEnabled = useSettingsStore(s => s.mobileControlsEnabled);
    const setMobileControlsEnabled = useSettingsStore(s => s.setMobileControlsEnabled);
    const resetToDefaults = useSettingsStore(s => s.resetToDefaults);

    // Cerrar con ESC
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const handleReset = useCallback(() => {
        resetToDefaults();
        setQuality('medium');
    }, [resetToDefaults, setQuality]);

    return (
        <div className="pro-settings-overlay" onClick={onClose}>
            <div className="pro-settings-panel" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="pro-settings-header">
                    <h2>⚙️ Configuración</h2>
                    <button className="pro-settings-close" onClick={onClose}>✕</button>
                </div>

                {/* ─── Calidad Gráfica ─── */}
                <div className="pro-settings-section">
                    <div className="pro-settings-section-title">
                        <span className="section-icon">🎮</span>
                        Calidad Gráfica
                    </div>
                    <div className="quality-grid">
                        {QUALITY_OPTIONS.map(opt => (
                            <button
                                key={opt.key}
                                className={`quality-btn ${quality === opt.key ? 'active' : ''}`}
                                onClick={() => setQuality(opt.key)}
                            >
                                <span className="quality-icon">{opt.icon}</span>
                                <span className="quality-label">{opt.label}</span>
                                <span className="quality-desc">{opt.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ─── Audio ─── */}
                <div className="pro-settings-section">
                    <div className="pro-settings-section-title">
                        <span className="section-icon">🔊</span>
                        Audio
                    </div>

                    {/* Volumen General */}
                    <div className="volume-control">
                        <span className="volume-icon">🔈</span>
                        <div className="volume-info">
                            <div className="volume-label">
                                <span>Volumen General</span>
                                <span className="volume-value">{masterVolume}%</span>
                            </div>
                            <input
                                type="range"
                                className="volume-slider"
                                min={0}
                                max={100}
                                value={masterVolume}
                                onChange={e => setMasterVolume(Number(e.target.value))}
                                style={{
                                    background: `linear-gradient(to right, #c8aa50 ${masterVolume}%, rgba(255,255,255,0.08) ${masterVolume}%)`
                                }}
                            />
                        </div>
                        <button
                            className={`volume-mute-btn ${masterVolume === 0 ? 'muted' : ''}`}
                            onClick={() => setMasterVolume(masterVolume === 0 ? 80 : 0)}
                            title={masterVolume === 0 ? 'Activar sonido' : 'Silenciar'}
                        >
                            {masterVolume === 0 ? '🔇' : '🔊'}
                        </button>
                    </div>

                    {/* Música de Fondo */}
                    <div className="volume-control">
                        <span className="volume-icon">🎵</span>
                        <div className="volume-info">
                            <div className="volume-label">
                                <span>Música de Fondo</span>
                                <span className="volume-value">{musicVolume}%</span>
                            </div>
                            <input
                                type="range"
                                className="volume-slider"
                                min={0}
                                max={100}
                                value={musicVolume}
                                onChange={e => setMusicVolume(Number(e.target.value))}
                                style={{
                                    background: `linear-gradient(to right, #3b82f6 ${musicVolume}%, rgba(255,255,255,0.08) ${musicVolume}%)`
                                }}
                            />
                        </div>
                    </div>

                    {/* Efectos de Sonido */}
                    <div className="volume-control">
                        <span className="volume-icon">💥</span>
                        <div className="volume-info">
                            <div className="volume-label">
                                <span>Efectos de Sonido</span>
                                <span className="volume-value">{sfxVolume}%</span>
                            </div>
                            <input
                                type="range"
                                className="volume-slider"
                                min={0}
                                max={100}
                                value={sfxVolume}
                                onChange={e => setSfxVolume(Number(e.target.value))}
                                style={{
                                    background: `linear-gradient(to right, #ef4444 ${sfxVolume}%, rgba(255,255,255,0.08) ${sfxVolume}%)`
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* ─── Controles ─── */}
                <div className="pro-settings-section">
                    <div className="pro-settings-section-title">
                        <span className="section-icon">🕹️</span>
                        Controles
                    </div>

                    <div className="setting-toggle-row">
                        <div className="setting-info">
                            <span className="setting-label">Controles Táctiles (Joystick)</span>
                            <span className="setting-desc">Habilita controles en pantalla para móviles</span>
                        </div>
                        <button
                            className={`toggle-switch ${mobileControlsEnabled ? 'on' : 'off'}`}
                            onClick={() => setMobileControlsEnabled(!mobileControlsEnabled)}
                            style={{
                                background: mobileControlsEnabled ? '#c8aa50' : 'rgba(255,255,255,0.08)'
                            }}
                        >
                            <div className="toggle-knob" />
                        </button>
                    </div>
                </div>

                {/* ─── Rendimiento ─── */}
                <div className="pro-settings-section">
                    <div className="pro-settings-section-title">
                        <span className="section-icon">📊</span>
                        Rendimiento
                    </div>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <span className="stat-value">{fps}</span>
                            <span className="stat-label">FPS</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">{shadowQuality}</span>
                            <span className="stat-label">Sombras</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">{viewDistance}m</span>
                            <span className="stat-label">Visión</span>
                        </div>
                    </div>
                </div>

                {/* ─── Footer ─── */}
                <div className="pro-settings-footer">
                    <button className="btn-reset" onClick={handleReset}>
                        ↻ Restaurar
                    </button>
                    <button className="btn-close-settings" onClick={onClose}>
                        ✓ Aceptar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProSettingsPanel;
