import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayerStore } from '../../stores/playerStore';
import { footprintManager } from './fortaleza-modules/environment';

export function SnowFootprints() {
    const { gl } = useThree();

    useFrame(() => {
        const state = usePlayerStore.getState();
        const { isMoving, isGrounded, position } = state;

        // We only want to draw footprints when the player is moving on the ground, 
        // but we ALWAYS need to call update() so old footprints fade out properly over time!
        let playerPos: THREE.Vector3 | null = null;
        if (isMoving && isGrounded && position) {
            playerPos = new THREE.Vector3(position.x, position.y, position.z);
        }

        footprintManager.update(gl, playerPos);
    });

    return null;
}
