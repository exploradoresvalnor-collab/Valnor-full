import { useEffect, useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export interface DamageNumber {
    id: string;
    amount: number;
    position: THREE.Vector3;
    isCritical: boolean;
    type: 'damage' | 'heal' | 'status';
}

interface FloatingDamageTextProps {
    damageNumbers: DamageNumber[];
}

export function FloatingDamageText({ damageNumbers }: FloatingDamageTextProps) {
    const [activeNumbers, setActiveNumbers] = useState<(DamageNumber & { startTime: number })[]>([]);

    useEffect(() => {
        if (damageNumbers.length > 0) {
            const added = damageNumbers.map(n => ({ ...n, startTime: Date.now() }));
            setActiveNumbers(prev => [...prev, ...added]);
        }
    }, [damageNumbers]);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveNumbers(prev => prev.filter(n => Date.now() - n.startTime < 1500));
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            {activeNumbers.map((dmg) => {
                const progress = Math.min((Date.now() - dmg.startTime) / 1500, 1.0);
                const floatY = dmg.position.y + progress * 2.0;

                const getStyles = () => {
                    if (dmg.type === 'heal') return { color: '#00ff00', fontSize: '24px', fontWeight: 'bold' };
                    if (dmg.isCritical) return { color: '#ffcc00', fontSize: '32px', fontWeight: 'bold', textShadow: '0px 0px 10px red' };
                    return { color: '#ffffff', fontSize: '20px', fontWeight: 'bold' }; // Default damage
                };

                return (
                    <group key={`${dmg.id}-${dmg.startTime}`} position={[dmg.position.x, floatY, dmg.position.z]}>
                        <Html center style={{
                            ...getStyles(),
                            opacity: 1 - progress,
                            pointerEvents: 'none',
                            userSelect: 'none',
                            whiteSpace: 'nowrap',
                            WebkitTextStroke: '1px black',
                            transform: `scale(${dmg.isCritical ? 1 + (1 - progress) * 0.5 : 1})`
                        }}>
                            {dmg.type === 'heal' ? '+' : '-'}{dmg.amount} {dmg.isCritical ? '💥' : '⚔️'}
                        </Html>
                    </group>
                );
            })}
        </>
    );
}
