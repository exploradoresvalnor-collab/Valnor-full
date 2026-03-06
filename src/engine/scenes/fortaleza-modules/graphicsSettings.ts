import * as THREE from 'three';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { setSnowAmount } from './environment';

export type QualityLevel = 'low' | 'medium' | 'high' | 'ultra';

interface QualityPreset {
    label: string;
    pixelRatio: number;
    sunShadowMapSize: number;
    sunShadowEnabled: boolean;
    interiorShadows: boolean;
    interiorShadowMapSize: number;
    bloomEnabled: boolean;
    bloomStrength: number;
    snowEnabled: boolean;
}

const PRESETS: Record<QualityLevel, QualityPreset> = {
    low: {
        label: 'Bajo',
        pixelRatio: 1,
        sunShadowMapSize: 1024,
        sunShadowEnabled: true,
        interiorShadows: false,
        interiorShadowMapSize: 512,
        bloomEnabled: false,
        bloomStrength: 0,
        snowEnabled: false,
    },
    medium: {
        label: 'Medio',
        pixelRatio: 1,
        sunShadowMapSize: 2048,
        sunShadowEnabled: true,
        interiorShadows: false,
        interiorShadowMapSize: 512,
        bloomEnabled: true,
        bloomStrength: 0.3,
        snowEnabled: true,
    },
    high: {
        label: 'Alto',
        pixelRatio: Math.min(window.devicePixelRatio, 2),
        sunShadowMapSize: 4096,
        sunShadowEnabled: true,
        interiorShadows: true,
        interiorShadowMapSize: 1024,
        bloomEnabled: true,
        bloomStrength: 0.4,
        snowEnabled: true,
    },
    ultra: {
        label: 'Ultra',
        pixelRatio: Math.min(window.devicePixelRatio, 2),
        sunShadowMapSize: 4096,
        sunShadowEnabled: true,
        interiorShadows: true,
        interiorShadowMapSize: 2048,
        bloomEnabled: true,
        bloomStrength: 0.5,
        snowEnabled: true,
    },
};

export function createGraphicsSettings(
    container: HTMLElement,
    renderer: THREE.WebGLRenderer,
    sunLight: THREE.DirectionalLight,
    interiorSpots: THREE.SpotLight[],
    bloomPass: UnrealBloomPass,
    environmentRefs: { ashParticles?: THREE.Points }
) {
    let currentLevel: QualityLevel = 'medium';
    let snowManualOverride: boolean | null = null;

    // === UI: Botón de engranaje ===
    const gearBtn = document.createElement('div');
    gearBtn.innerHTML = '⚙';
    gearBtn.style.cssText = `
        position: fixed; bottom: 16px; right: 16px; width: 44px; height: 44px;
        background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.2);
        border-radius: 50%; display: flex; align-items: center; justify-content: center;
        font-size: 22px; cursor: pointer; z-index: 1000; color: #ddd;
        transition: all 0.2s; backdrop-filter: blur(4px);
    `;
    gearBtn.addEventListener('mouseenter', () => { gearBtn.style.background = 'rgba(0,200,255,0.3)'; gearBtn.style.color = '#fff'; });
    gearBtn.addEventListener('mouseleave', () => { gearBtn.style.background = 'rgba(0,0,0,0.6)'; gearBtn.style.color = '#ddd'; });
    container.appendChild(gearBtn);

    // === UI: Panel de configuración ===
    const panel = document.createElement('div');
    panel.style.cssText = `
        position: fixed; bottom: 70px; right: 16px; width: 200px;
        background: rgba(10,10,20,0.9); border: 1px solid rgba(0,200,255,0.3);
        border-radius: 10px; padding: 14px; display: none; z-index: 1000;
        backdrop-filter: blur(8px); font-family: 'Segoe UI', sans-serif;
    `;

    const title = document.createElement('div');
    title.textContent = 'CALIDAD GRÁFICA';
    title.style.cssText = 'color: #00e5ff; font-size: 12px; font-weight: bold; letter-spacing: 2px; margin-bottom: 10px; text-align: center;';
    panel.appendChild(title);

    const levels: QualityLevel[] = ['low', 'medium', 'high', 'ultra'];
    const buttons: HTMLDivElement[] = [];

    levels.forEach(level => {
        const btn = document.createElement('div');
        btn.textContent = PRESETS[level].label;
        btn.dataset.level = level;
        btn.style.cssText = `
            padding: 8px 12px; margin: 4px 0; border-radius: 6px; cursor: pointer;
            text-align: center; font-size: 13px; font-weight: 600;
            transition: all 0.2s; color: #ccc;
            border: 1px solid rgba(255,255,255,0.1);
            background: rgba(255,255,255,0.05);
        `;
        btn.addEventListener('mouseenter', () => {
            if (level !== currentLevel) btn.style.background = 'rgba(0,200,255,0.15)';
        });
        btn.addEventListener('mouseleave', () => {
            if (level !== currentLevel) btn.style.background = 'rgba(255,255,255,0.05)';
        });
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            applyQuality(level);
        });
        buttons.push(btn);
        panel.appendChild(btn);
    });

    const snowBtn = document.createElement('div');
    snowBtn.style.cssText = `
        padding: 8px 12px; margin: 12px 0 4px 0; border-radius: 6px; cursor: pointer;
        text-align: center; font-size: 13px; font-weight: 600;
        transition: all 0.2s; color: #fff;
        border: 1px solid rgba(0,255,150,0.3);
        background: rgba(0,255,150,0.1);
    `;
    snowBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isCurrentlyOn = snowManualOverride !== null ? snowManualOverride : PRESETS[currentLevel].snowEnabled;
        snowManualOverride = !isCurrentlyOn;
        applySnow(snowManualOverride);
        updateButtons();
    });
    panel.appendChild(snowBtn);

    const fpsInfo = document.createElement('div');
    fpsInfo.style.cssText = 'color: #888; font-size: 10px; text-align: center; margin-top: 8px;';
    panel.appendChild(fpsInfo);

    container.appendChild(panel);

    let panelOpen = false;
    gearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        panelOpen = !panelOpen;
        panel.style.display = panelOpen ? 'block' : 'none';
        updateButtons();
    });

    function applySnow(enabled: boolean) {
        if (environmentRefs.ashParticles) environmentRefs.ashParticles.visible = enabled;
        setSnowAmount(enabled ? 1.0 : 0.0);
    }

    function updateButtons() {
        buttons.forEach(btn => {
            const isActive = btn.dataset.level === currentLevel;
            btn.style.background = isActive ? 'rgba(0,200,255,0.3)' : 'rgba(255,255,255,0.05)';
            btn.style.color = isActive ? '#00e5ff' : '#ccc';
            btn.style.borderColor = isActive ? 'rgba(0,200,255,0.5)' : 'rgba(255,255,255,0.1)';
        });

        const isSnowOn = snowManualOverride !== null ? snowManualOverride : PRESETS[currentLevel].snowEnabled;
        snowBtn.textContent = `Nieve: ${isSnowOn ? 'ON' : 'OFF'}`;
        snowBtn.style.background = isSnowOn ? 'rgba(0,255,150,0.2)' : 'rgba(255,50,50,0.1)';
        snowBtn.style.borderColor = isSnowOn ? 'rgba(0,255,150,0.4)' : 'rgba(255,50,50,0.3)';

        fpsInfo.textContent = `Calidad: ${PRESETS[currentLevel].label}`;
    }

    function applyQuality(level: QualityLevel) {
        currentLevel = level;
        const preset = PRESETS[level];

        // Pixel ratio
        renderer.setPixelRatio(preset.pixelRatio);

        // Sun shadows
        sunLight.castShadow = preset.sunShadowEnabled;

        // Interior SpotLight shadows
        interiorSpots.forEach(spot => {
            spot.castShadow = preset.interiorShadows;
            if (preset.interiorShadows) {
                spot.shadow.mapSize.set(preset.interiorShadowMapSize, preset.interiorShadowMapSize);
                spot.shadow.map?.dispose();
                (spot.shadow as any).map = null;
            }
        });

        // Bloom
        bloomPass.enabled = preset.bloomEnabled;
        bloomPass.strength = preset.bloomStrength;

        // Snow (only if no manual override)
        if (snowManualOverride === null) {
            applySnow(preset.snowEnabled);
        }

        renderer.shadowMap.needsUpdate = true;
        updateButtons();
    }

    applyQuality('medium');

    return { applyQuality, getCurrentLevel: () => currentLevel };
}
