import { createContext, useContext, useRef, ReactNode } from 'react';
import * as THREE from 'three';

interface PhysicsContextValue {
  collidables: THREE.Object3D[];
  checkpoints: { pos: THREE.Vector3; radius: number }[];
  movingPlatforms: any[];
  addCollidable: (obj: THREE.Object3D) => void;
  removeCollidable: (obj: THREE.Object3D) => void;
}

const PhysicsContext = createContext<PhysicsContextValue | null>(null);

export const PhysicsProvider = ({ children }: { children: ReactNode }) => {
  const collidablesRef = useRef<THREE.Object3D[]>([]);
  const checkpointsRef = useRef<{ pos: THREE.Vector3; radius: number }[]>([]);
  const movingPlatformsRef = useRef<any[]>([]);

  const addCollidable = (obj: THREE.Object3D) => {
    if (!collidablesRef.current.includes(obj)) {
      collidablesRef.current.push(obj);
    }
  };

  const removeCollidable = (obj: THREE.Object3D) => {
    collidablesRef.current = collidablesRef.current.filter((c) => c !== obj);
  };

  return (
    <PhysicsContext.Provider
      value={{
        collidables: collidablesRef.current,
        checkpoints: checkpointsRef.current,
        movingPlatforms: movingPlatformsRef.current,
        addCollidable,
        removeCollidable,
      }}
    >
      {children}
    </PhysicsContext.Provider>
  );
};

export const usePhysics = () => {
  const context = useContext(PhysicsContext);
  if (!context) {
    throw new Error('usePhysics must be used within a PhysicsProvider');
  }
  return context;
};
