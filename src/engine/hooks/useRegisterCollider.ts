import { useEffect } from 'react';
import * as THREE from 'three';
import { usePhysics } from '../contexts/PhysicsContext';

/**
 * Registers a mesh/group to the global raycast collidables array.
 */
export function useRegisterCollider(ref: React.RefObject<THREE.Object3D | null>) {
    const { addCollidable, removeCollidable } = usePhysics();

    useEffect(() => {
        const obj = ref.current;
        if (obj) {
            addCollidable(obj);
        }
        return () => {
            if (obj) {
                removeCollidable(obj);
            }
        };
    }, [ref, addCollidable, removeCollidable]);
}
