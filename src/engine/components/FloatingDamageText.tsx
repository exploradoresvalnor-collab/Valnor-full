import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface DamageNumber {
    id: string;
    amount: number;
    position: THREE.Vector3;
    isCritical: boolean;
    type: 'damage' | 'heal' | 'status';
}

interface ActiveDamage {
    id: string;
    sprite: THREE.Sprite;
    startY: number;
    startTime: number;
    isCritical: boolean;
}

/**
 * Genera un Sprite de texto en un canvas offscreen.
 * Cero DOM, cero re-render — ideal para móviles.
 */
function createDamageSprite(dmg: DamageNumber): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 128;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const fontSize = dmg.isCritical ? 52 : 38;
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const prefix = dmg.type === 'heal' ? '+' : '-';
    const suffix = dmg.isCritical ? ' CRIT!' : '';
    const label = `${prefix}${dmg.amount}${suffix}`;

    // Outline negro
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 5;
    ctx.strokeText(label, 128, 64);

    // Color de relleno según tipo
    ctx.fillStyle = dmg.type === 'heal'
        ? '#00ff88'
        : dmg.isCritical
            ? '#ffcc00'
            : '#ffffff';
    ctx.fillText(label, 128, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        sizeAttenuation: true,
    });

    const sprite = new THREE.Sprite(material);
    const baseScale = dmg.isCritical ? 5 : 3.5;
    sprite.scale.set(baseScale, baseScale * 0.5, 1);
    sprite.position.copy(dmg.position);
    return sprite;
}

interface FloatingDamageTextProps {
    damageQueueRef: React.RefObject<DamageNumber[]>;
}

/**
 * Componente 100% imperativo — opera dentro de useFrame sin setState.
 * Consume una cola de DamageNumber[] desde un ref externo (sin props reactivas).
 * Cada número se dibuja como un Sprite (textura Canvas), NO como Html/DOM.
 * Esto elimina completamente los re-renders de React durante el combate.
 */
export function FloatingDamageText({ damageQueueRef }: FloatingDamageTextProps) {
    const containerRef = useRef<THREE.Group>(null);
    const activeRef = useRef<ActiveDamage[]>([]);
    const seenIdsRef = useRef<Set<string>>(new Set());

    useFrame(() => {
        if (!containerRef.current) return;
        const now = Date.now();
        const queue = damageQueueRef.current;

        // Ingestar nuevos números sin provocar re-renders de React
        if (queue && queue.length > 0) {
            for (const dmg of queue) {
                if (!seenIdsRef.current.has(dmg.id)) {
                    seenIdsRef.current.add(dmg.id);
                    const sprite = createDamageSprite(dmg);
                    containerRef.current.add(sprite);
                    activeRef.current.push({
                        id: dmg.id,
                        sprite,
                        startY: dmg.position.y,
                        startTime: now,
                        isCritical: dmg.isCritical,
                    });
                }
            }
        }

        // Animar y limpiar sprites expirados
        const stillActive: ActiveDamage[] = [];
        for (const entry of activeRef.current) {
            const progress = Math.min((now - entry.startTime) / 1500, 1.0);

            if (progress >= 1.0) {
                // Limpiar sprite y liberar memoria GPU
                containerRef.current.remove(entry.sprite);
                entry.sprite.material.map?.dispose();
                (entry.sprite.material as THREE.SpriteMaterial).dispose();
                seenIdsRef.current.delete(entry.id);
                continue;
            }

            // Flotar hacia arriba
            entry.sprite.position.y = entry.startY + progress * 2.5;
            // Desvanecimiento gradual
            (entry.sprite.material as THREE.SpriteMaterial).opacity = 1.0 - progress;
            // Pulso de escala en críticos
            if (entry.isCritical) {
                const pulse = 1 + (1 - progress) * 0.4;
                entry.sprite.scale.set(5 * pulse, 2.5 * pulse, 1);
            }

            stillActive.push(entry);
        }
        activeRef.current = stillActive;
    });

    return <group ref={containerRef} />;
}
