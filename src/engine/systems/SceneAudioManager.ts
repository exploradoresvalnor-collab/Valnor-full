/**
 * SceneAudioManager — Sistema de audio HTML5 para música de fondo
 * 
 * Usa HTMLAudioElement directamente (no Three.js) para funcionar
 * dentro y fuera del Canvas 3D. La música se reproduce en bucle
 * continuo (seamless loop) sin cortes.
 */

class SceneAudioManagerClass {
    private musicElement: HTMLAudioElement | null = null;
    private musicUrl: string | null = null;
    private musicVolume = 0.5;    // 0–1 (canal música)
    private sfxVolume = 0.5;      // 0–1 (canal sfx)
    private masterVolume = 1;     // 0–1 (general)
    private blobCache: Map<string, string> = new Map(); // Cache para URLs de blobs

    // ─── Music ───────────────────────────────────────────────

    async playMusic(url: string) {
        // Ya está sonando esta pista
        if (this.musicUrl === url && this.musicElement && !this.musicElement.paused) {
            return;
        }

        // Marcar la nueva URL intentada inmediatamente para evitar double-fetches concurrentes
        this.musicUrl = url;

        // Intentar obtener el Blob URL (evita que extensiones como IDM secuestren el stream de <audio src="...mp3">)
        let blobUrl = url;
        try {
            if (this.blobCache.has(url)) {
                blobUrl = this.blobCache.get(url)!;
            } else {
                const response = await fetch(url);
                const blob = await response.blob();
                blobUrl = URL.createObjectURL(blob);
                this.blobCache.set(url, blobUrl);
            }
        } catch (e) {
            console.warn('[SceneAudio] Falló la conversión a Blob, usando URL directa:', e);
        }

        // Si mientras descargaba el Blob se pidió otra canción, cancelar.
        if (this.musicUrl !== url) return;

        // Detener la pista anterior
        this.stopMusicImmediate();

        // Crear nuevo elemento de audio usando el Blob URL protegido
        const audio = new Audio(blobUrl);
        audio.loop = true;          // ← bucle continuo sin cortes
        audio.preload = 'auto';

        // Establecer volumen correcto desde el inicio
        audio.volume = this.getEffectiveMusicVolume();

        this.musicElement = audio;
        this.musicUrl = url;

        // Intentar reproducir
        const tryPlay = () => {
            if (!this.musicElement || this.musicElement !== audio) return;

            audio.play().then(() => {
                console.log('[SceneAudio] ✅ Música reproduciéndose:', url); // Mantener el log de la URL original para debug
            }).catch(err => {
                console.warn('[SceneAudio] ⚠️ Autoplay bloqueado, se reproducirá al interactuar:', err.message);
                // Registrar listeners globales para reproducir al primer click/tecla
                this.registerAutoplayRetry(audio);
            });
        };

        // Si ya está cargado, reproducir inmediatamente
        if (audio.readyState >= 3) {
            tryPlay();
        } else {
            audio.addEventListener('canplaythrough', tryPlay, { once: true });
            // Timeout de seguridad: intentar de todos modos después de 1s
            setTimeout(tryPlay, 1000);
        }
    }

    private registerAutoplayRetry(audio: HTMLAudioElement) {
        const resume = () => {
            if (this.musicElement === audio && audio.paused) {
                audio.volume = this.getEffectiveMusicVolume();
                audio.play().then(() => {
                    console.log('[SceneAudio] ✅ Música iniciada tras interacción del usuario');
                }).catch(() => { });
            }
            document.removeEventListener('click', resume);
            document.removeEventListener('keydown', resume);
            document.removeEventListener('touchstart', resume);
            document.removeEventListener('pointerdown', resume);
        };
        document.addEventListener('click', resume);
        document.addEventListener('keydown', resume);
        document.addEventListener('touchstart', resume);
        document.addEventListener('pointerdown', resume);
    }

    /**
     * Detener la música con fade out suave
     */
    stopMusic(fadeOutMs = 800) {
        if (!this.musicElement) return;
        const audio = this.musicElement;
        const startVol = audio.volume;

        if (fadeOutMs <= 0 || startVol === 0) {
            this.stopMusicImmediate();
            return;
        }

        const steps = 15;
        const stepMs = fadeOutMs / steps;
        const volStep = startVol / steps;
        let current = startVol;

        const interval = setInterval(() => {
            current -= volStep;
            if (current <= 0.01) {
                clearInterval(interval);
                this.stopMusicImmediate();
            } else {
                audio.volume = Math.max(0, current);
            }
        }, stepMs);
    }

    /**
     * Detener inmediatamente (sin fade)
     */
    private stopMusicImmediate() {
        if (this.musicElement) {
            this.musicElement.pause();
            this.musicElement.currentTime = 0;
            try { this.musicElement.src = ''; } catch { }
            this.musicElement = null;
        }
        this.musicUrl = null;
    }

    /**
     * ¿Está sonando?
     */
    isMusicPlaying(): boolean {
        return !!(this.musicElement && !this.musicElement.paused);
    }

    // ─── Volume ──────────────────────────────────────────────

    /**
     * Calcula el volumen efectivo de la música (canal × master)
     */
    private getEffectiveMusicVolume(): number {
        return Math.max(0, Math.min(1, this.musicVolume * this.masterVolume));
    }

    /**
     * Aplica el volumen efectivo al elemento de audio
     */
    private applyMusicVolume() {
        if (this.musicElement) {
            this.musicElement.volume = this.getEffectiveMusicVolume();
        }
    }

    /**
     * Establece volumen de música (0–100) — cambio INMEDIATO
     */
    setMusicVolume(vol: number) {
        this.musicVolume = Math.max(0, Math.min(1, vol / 100));
        this.applyMusicVolume();
    }

    /**
     * Establece volumen de SFX (0–100)
     */
    setSfxVolume(vol: number) {
        this.sfxVolume = Math.max(0, Math.min(1, vol / 100));
    }

    /**
     * Establece volumen general (0–100) — afecta música y SFX
     */
    setMasterVolume(vol: number) {
        this.masterVolume = Math.max(0, Math.min(1, vol / 100));
        this.applyMusicVolume();
    }

    /**
     * Obtener volúmenes actuales
     */
    getVolumes() {
        return {
            music: Math.round(this.musicVolume * 100),
            sfx: Math.round(this.sfxVolume * 100),
            master: Math.round(this.masterVolume * 100),
        };
    }

    // ─── SFX ─────────────────────────────────────────────────

    /**
     * Reproducir un efecto de sonido (one-shot, no loop)
     */
    playSfx(url: string, volume?: number) {
        const audio = new Audio(url);
        audio.volume = (volume ?? this.sfxVolume) * this.masterVolume;
        audio.play().catch(() => { });
        audio.addEventListener('ended', () => { audio.src = ''; });
    }

    // ─── Cleanup ─────────────────────────────────────────────

    dispose() {
        this.stopMusicImmediate();
    }
}

// Singleton
export const SceneAudioManager = new SceneAudioManagerClass();

// ─── Auto-sync con settingsStore ──────────────────────────
// Cualquier cambio de volumen en CUALQUIER página (Settings, ProSettingsPanel, etc.)
// se aplica automáticamente al audio en tiempo real.
import { useSettingsStore } from '../../stores/settingsStore';

// Sincronizar volúmenes iniciales
const initSettings = useSettingsStore.getState();
SceneAudioManager.setMasterVolume(initSettings.masterVolume);
SceneAudioManager.setMusicVolume(initSettings.musicVolume);
SceneAudioManager.setSfxVolume(initSettings.sfxVolume);

// Escuchar cambios futuros
useSettingsStore.subscribe((state, prevState) => {
    if (state.masterVolume !== prevState.masterVolume) {
        SceneAudioManager.setMasterVolume(state.masterVolume);
    }
    if (state.musicVolume !== prevState.musicVolume) {
        SceneAudioManager.setMusicVolume(state.musicVolume);
    }
    if (state.sfxVolume !== prevState.sfxVolume) {
        SceneAudioManager.setSfxVolume(state.sfxVolume);
    }
});

export default SceneAudioManager;
