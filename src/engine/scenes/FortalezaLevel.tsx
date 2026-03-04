import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { usePlayerStore } from '../../stores/playerStore';
import { FortalezaPlayer } from '../components/FortalezaPlayer';
import { PhysicsProvider, usePhysics } from '../contexts/PhysicsContext';
import { useCombatModeStore } from '../stores/combatModeStore';

// Import local Fortaleza modules
import {
    initMaterials, setupEnvironment, createWideBridge, createGiantRotunda,
    createSecretChamber, createPlatform, createOrb, createBlackKnightFortress,
    createStartingFortress, createPenumbraRuins
} from './fortaleza-modules/environment';
import { createDoor } from './fortaleza-modules/door';

function FortalezaScene() {
    const { scene, camera } = useThree();
    const { collidables, checkpoints, movingPlatforms } = usePhysics();

    const [isLoaded, setIsLoaded] = useState(false);
    const objectsRef = useRef<any>({
        mixers: [],
        animatedCrystals: [],
        fireEmitters: [],
        orbs: [],
        mistEmitters: [],
        gateObjects: {},
        doorSystem: null,
        env: null,
    });

    // --- Combat state ---
    // Managed globally by combatModeStore

    const stateRef = useRef({
        orbsCollected: 0,
        doorState: 0, // 0=closed, 1=opening, 2=closing
        doorOpenAmount: 0,
        time: 0,
        // Intro Animation
        introState: 0, // 0=init, 1=flying to boss, 2=holding on boss, 3=flying back, 4=done
        introTimer: 0,
        // Combat
        combatStarted: false,
        combatEnded: false,
        combatTimer: 0,
        lastAttackTime: 0,
        golemHealth: 800,
        golemMaxHealth: 800,
        golemLevel: 10,
        golemAttack: 35,
        golemDefense: 25,
        golemCritRate: 8,
        golemCritDamage: 160,
        golemBaseXP: 250,
        golemGold: 150,
        dmgIdCounter: 0,
        pendingOrbsToSync: 0,
    });

    // Ref to track if intro title has been shown
    const introShownRef = useRef(false);

    // --- Sync Orbs outside of useFrame to prevent freezing ---
    useEffect(() => {
        const interval = setInterval(() => {
            const st = stateRef.current;
            if (st.pendingOrbsToSync > 0) {
                const currentOrbs = usePlayerStore.getState().orbsCollected || 0;
                usePlayerStore.getState().setOrbsCollected(currentOrbs + st.pendingOrbsToSync);
                st.pendingOrbsToSync = 0;
            }
        }, 500);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // === INITIALIZE ENVIRONMENT ===
        // To avoid React Strict Mode crashes and WebGL stack overflows,
        // we DO NOT monkey-patch the native scene.add.
        // Instead, we create a proxy/mock scene object that tracks procedural additions safely.
        const addedObjects: THREE.Object3D[] = [];
        const mockScene = {
            ...scene,
            add: (...objects: THREE.Object3D[]) => {
                addedObjects.push(...objects);
                scene.add(...objects);
                return mockScene;
            },
            remove: (...objects: THREE.Object3D[]) => {
                scene.remove(...objects);
                return mockScene;
            }
        } as unknown as THREE.Scene;

        // Config camera defaults
        camera.near = 0.1;
        camera.far = 2000;
        camera.updateProjectionMatrix();

        initMaterials();

        // Pass the native scene to setupEnvironment because it touches scene properties like fog/background.
        const env = setupEnvironment(scene);

        const ob = objectsRef.current;
        ob.env = env;

        // Reset object arrays to avoid accumulation on hot reloads
        ob.mixers = [];
        ob.animatedCrystals = [];
        ob.fireEmitters = [];
        ob.orbs = [];
        ob.mistEmitters = [];

        const zStart = 45;
        const bridgeZEnd = zStart - 180;
        const rotundaZ = bridgeZEnd - 40;
        const finalArenaZ = rotundaZ - 200;

        // Pass the `mockScene` to procedural generators so we can safely track and unmount them!
        createWideBridge(mockScene, collidables, zStart - 52, bridgeZEnd + 26);
        createGiantRotunda(mockScene, collidables, checkpoints, ob.animatedCrystals, rotundaZ);
        createSecretChamber(mockScene, collidables, ob.animatedCrystals, ob.orbs, rotundaZ);

        createStartingFortress(mockScene, collidables, checkpoints, ob.animatedCrystals, ob.fireEmitters, ob.gateObjects, zStart);
        createPenumbraRuins(mockScene, collidables, checkpoints, ob.animatedCrystals, movingPlatforms, ob.fireEmitters, zStart);
        createBlackKnightFortress(mockScene, collidables, ob.animatedCrystals, ob.fireEmitters, ob.mistEmitters, ob.mixers, 0, -2, finalArenaZ, -20);

        // Fortress door
        const doorSyst = createDoor(mockScene, collidables);
        if (doorSyst.group && ob.gateObjects.gatePos) {
            doorSyst.group.position.copy(ob.gateObjects.gatePos);
        }
        ob.doorSystem = doorSyst;

        // Floating Platforms
        createPlatform(mockScene, collidables, movingPlatforms, checkpoints, ob.animatedCrystals, 0, 5, rotundaZ - 45, 12, 0);
        createPlatform(mockScene, collidables, movingPlatforms, checkpoints, ob.animatedCrystals, -20, 15, rotundaZ - 80, 14, 1);
        createPlatform(mockScene, collidables, movingPlatforms, checkpoints, ob.animatedCrystals, 20, 25, rotundaZ - 120, 14, 1);
        createPlatform(mockScene, collidables, movingPlatforms, checkpoints, ob.animatedCrystals, 0, 35, rotundaZ - 160, 16, 2, true);

        createPlatform(mockScene, collidables, movingPlatforms, checkpoints, ob.animatedCrystals, -18, 5, zStart - 90, 8, 0);
        createPlatform(mockScene, collidables, movingPlatforms, checkpoints, ob.animatedCrystals, 18, 10, zStart - 130, 10, 1);
        createPlatform(mockScene, collidables, movingPlatforms, checkpoints, ob.animatedCrystals, -25, 2, zStart - 50, 12);

        // TRIPLE JUMP SEQUENCE
        createPlatform(mockScene, collidables, movingPlatforms, checkpoints, ob.animatedCrystals, -40, 8, zStart - 50, 10, 0);
        createPlatform(mockScene, collidables, movingPlatforms, checkpoints, ob.animatedCrystals, -55, 12, zStart - 50, 12);
        createPlatform(mockScene, collidables, movingPlatforms, checkpoints, ob.animatedCrystals, -85, 18, zStart - 50, 14, 1);

        createOrb(mockScene, ob.orbs, 0, 20, zStart - 27, 'jump');
        createOrb(mockScene, ob.orbs, -145, 35, zStart - 15, 'jump');
        createOrb(mockScene, ob.orbs, -55, 14, zStart - 50, 'triple_jump');
        createOrb(mockScene, ob.orbs, -85, 21, zStart - 50, 'lore');

        createOrb(mockScene, ob.orbs, -18, 12, zStart - 90, 'lore');
        createOrb(mockScene, ob.orbs, 0, 42, rotundaZ - 160);

        // --- Debug: material para visualizar colisionadores ---
        const debugMatGreen = new THREE.MeshBasicMaterial({
            color: '#00ff44', wireframe: true, transparent: true, opacity: 0.5,
            depthTest: false, side: THREE.DoubleSide,
        });
        const debugMatRed = new THREE.MeshBasicMaterial({
            color: '#ff2244', wireframe: true, transparent: true, opacity: 0.4,
            depthTest: false, side: THREE.DoubleSide,
        });
        let debugMode = false;
        const originalMaterials = new Map<THREE.Object3D, THREE.Material | THREE.Material[]>();

        // Interactive Key Bindings
        const handleKeyDown = (e: KeyboardEvent) => {
            // Door interaction (E)
            if (e.key.toLowerCase() === 'e' && ob.doorSystem && ob.gateObjects.gatePos) {
                const playerObj = scene.getObjectByName("FortalezaPlayer");
                if (playerObj) {
                    const dist = playerObj.position.distanceTo(ob.gateObjects.gatePos);
                    if (dist < 18) {
                        const st = stateRef.current;
                        if (st.doorState === 0 || st.doorState === 2) st.doorState = 1;
                        else if (st.doorState === 1) st.doorState = 2;
                    }
                }
            }

            // Golem Boss Interaction (E)
            if (e.key.toLowerCase() === 'e') {
                const playerObj = scene.getObjectByName("FortalezaPlayer");
                if (playerObj) {
                    const golemPos = new THREE.Vector3(0, 0, -420);
                    const distToGolem = playerObj.position.distanceTo(golemPos);
                    const combatStore = useCombatModeStore.getState();

                    if (distToGolem < 18 && !combatStore.isActive) {
                        const pState = usePlayerStore.getState();

                        // Set up entities
                        const playerEntity = {
                            id: pState.characterName || 'jugador',
                            name: pState.characterName || 'Héroe',
                            isPlayer: true,
                            maxHealth: pState.maxHealth,
                            currentHealth: pState.currentHealth,
                            level: pState.level,
                            stats: {
                                attack: pState.stats?.attack ?? 15,
                                defense: pState.stats?.defense ?? 10,
                                critRate: pState.stats?.critRate ?? 5,
                                critDamage: pState.stats?.critDamage ?? 150,
                            }
                        };

                        const golemEntity = {
                            id: 'golem_boss_1',
                            name: 'Guardián Golem',
                            isPlayer: false,
                            maxHealth: 800,
                            currentHealth: 800,
                            level: 10,
                            stats: {
                                attack: 35,
                                defense: 25,
                                critRate: 8,
                                critDamage: 160,
                            }
                        };

                        // Center pos between player and golem
                        const centerPos: [number, number, number] = [
                            (playerObj.position.x + golemPos.x) / 2,
                            (playerObj.position.y + golemPos.y) / 2,
                            (playerObj.position.z + golemPos.z) / 2
                        ];

                        combatStore.actions.initCombat(golemEntity, playerEntity, centerPos);
                        console.log('[FortalezaLevel] ⚔️ Golem Boss manual combat triggered!');
                    }
                }
            }

            // Debug collider visualization (F3)
            if (e.key === 'F3') {
                e.preventDefault();
                debugMode = !debugMode;
                console.log(`[Debug] Collider visualization: ${debugMode ? 'ON' : 'OFF'} (${collidables.length} colliders)`);

                collidables.forEach((col: any) => {
                    if (!col.isMesh) return;
                    if (debugMode) {
                        // Save original material and switch to debug wireframe
                        originalMaterials.set(col, col.material);
                        // Use red for tall walls (height > 6), green for floors/small
                        const geo = col.geometry;
                        if (geo && geo.parameters) {
                            const h = geo.parameters.height || 0;
                            col.material = h > 6 ? debugMatRed : debugMatGreen;
                        } else {
                            col.material = debugMatGreen;
                        }
                        col.visible = true;
                    } else {
                        // Restore original invisible material
                        const orig = originalMaterials.get(col);
                        if (orig) col.material = orig;
                    }
                });
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        setIsLoaded(true);

        // Cleanup when leaving level
        return () => {
            window.removeEventListener('keydown', handleKeyDown);

            // Safely remove tracked objects and free GPU memory
            addedObjects.forEach(obj => {
                scene.remove(obj);
                if ((obj as any).geometry) (obj as any).geometry.dispose();
                if ((obj as any).material) {
                    const mat = (obj as any).material;
                    if (Array.isArray(mat)) {
                        mat.forEach((m: any) => {
                            if (m.map) m.map.dispose();
                            if (m.bumpMap) m.bumpMap.dispose();
                            if (m.normalMap) m.normalMap.dispose();
                            m.dispose();
                        });
                    } else {
                        if (mat.map) mat.map.dispose();
                        if (mat.bumpMap) mat.bumpMap.dispose();
                        if (mat.normalMap) mat.normalMap.dispose();
                        mat.dispose();
                    }
                }
            });

            // Reset fog & background mappings
            scene.fog = null;
            scene.background = null;
            scene.environment = null;

            // Clear physical arrays
            collidables.length = 0;
            checkpoints.length = 0;
            movingPlatforms.length = 0;
        };
    }, [scene, collidables, checkpoints, movingPlatforms]);

    useFrame((_, delta) => {
        if (!isLoaded) return;
        const ob = objectsRef.current;
        const st = stateRef.current;

        st.time += delta;
        const time = st.time;

        // Atmospheric elements
        if (ob.env && ob.env.atmosphericParticles) {
            ob.env.atmosphericParticles.position.y = 0.2 + Math.sin(time * 0.9) * 0.02;
        }

        // Object Animations (GLTF Mixers like Bosses)
        if (ob.mixers) {
            ob.mixers.forEach((m: any) => m.update(delta));
        }

        // Dynamic Shadows Logic
        if (ob.env && ob.env.sunLight) {
            const sunOffset = new THREE.Vector3(80, 120, -80);
            ob.env.sunLight.position.copy(camera.position).add(sunOffset);
            ob.env.sunLight.target.position.copy(camera.position);
            ob.env.sunLight.target.updateMatrixWorld();
        }

        // Process procedural animations — LOD por distancia para móviles
        const camPos = camera.position;
        const LOD_DISTANCE = 60; // Solo animar si está dentro de este radio
        const LOD_SQ = LOD_DISTANCE * LOD_DISTANCE;

        ob.animatedCrystals.forEach((c: any) => {
            if (c.mesh) {
                // Culling: solo animar cristales cercanos
                const dx = c.mesh.position.x - camPos.x;
                const dz = c.mesh.position.z - camPos.z;
                if (dx * dx + dz * dz > LOD_SQ) return;
                c.mesh.position.y = c.baseY + Math.sin(time * (1.5 + c.speedOffset * 0.25)) * 0.5;
                c.mesh.rotation.y = time * (0.6 + c.speedOffset * 0.25);
            }
        });

        ob.fireEmitters.forEach((emitter: any) => {
            // LOD: solo procesar partículas de fuego si el emisor está cerca
            const ep = emitter.points.position || emitter.light.position;
            const fdx = ep.x - camPos.x;
            const fdz = ep.z - camPos.z;
            if (fdx * fdx + fdz * fdz > LOD_SQ) {
                emitter.points.geometry.attributes.position.needsUpdate = false;
                return;
            }

            emitter.light.intensity = emitter.baseIntensity + Math.sin(time * 8.0) * (emitter.scale * 1.5) + Math.cos(time * 12.0) * (emitter.scale * 0.5);
            const positions = emitter.points.geometry.attributes.position.array;
            const lifespans = emitter.points.geometry.attributes.lifespan.array;
            const speeds = emitter.points.geometry.attributes.speed.array;

            for (let i = 0; i < lifespans.length; i++) {
                lifespans[i] -= delta * speeds[i] * 0.5;
                positions[i * 3 + 1] += delta * speeds[i] * emitter.scale * 3.0;

                if (lifespans[i] <= 0) {
                    lifespans[i] = 1.0;
                    positions[i * 3] = (Math.random() - 0.5) * emitter.scale;
                    positions[i * 3 + 1] = 0;
                    positions[i * 3 + 2] = (Math.random() - 0.5) * emitter.scale;
                }
            }
            emitter.points.geometry.attributes.position.needsUpdate = true;
        });

        ob.mistEmitters.forEach((mist: any) => {
            // LOD: solo procesar niebla cercana
            const mp = mist.points.position;
            const mdx = mp.x - camPos.x;
            const mdz = mp.z - camPos.z;
            if (mdx * mdx + mdz * mdz > LOD_SQ) {
                mist.points.geometry.attributes.position.needsUpdate = false;
                return;
            }

            const positions = mist.points.geometry.attributes.position.array;
            mist.timeOffset += delta * 0.8;
            for (let i = 0; i < positions.length / 3; i++) {
                positions[i * 3] += Math.sin(mist.timeOffset * 0.5 + i) * 0.04;
                positions[i * 3 + 2] += Math.cos(mist.timeOffset * 0.4 + i) * 0.04;
                positions[i * 3 + 1] += Math.sin(mist.timeOffset * 0.3 + i * 2) * 0.01;
            }
            mist.points.geometry.attributes.position.needsUpdate = true;
        });

        movingPlatforms.forEach((p: any) => {
            const oldX = p.group.position.x; const oldY = p.group.position.y; const oldZ = p.group.position.z;
            if (p.type === 0) p.group.position.y = p.baseY + Math.sin(time * 1.5) * 8;
            else if (p.type === 1) p.group.position.x = p.baseX + Math.sin(time * 1.2) * 12;
            else if (p.type === 2) { p.group.position.x = p.baseX + Math.cos(time * 1.0) * 10; p.group.position.z = p.baseZ + Math.sin(time * 1.0) * 10; }
            p.collider.position.copy(p.group.position);
            p.deltaX = p.group.position.x - oldX; p.deltaY = p.group.position.y - oldY; p.deltaZ = p.group.position.z - oldZ;
        });

        // Orbs animations
        const playerObj = scene.getObjectByName("FortalezaPlayer");
        if (playerObj) {
            ob.orbs.forEach((orb: any) => {
                if (!orb.collected) {
                    orb.mesh.rotation.y = time * (orb.isAbsorbing ? 10.0 : 1.0);
                    orb.mesh.position.y += Math.sin(time * 5) * 0.02;

                    if (!orb.isAbsorbing && playerObj.position.distanceTo(orb.mesh.position) < 5.0) {
                        orb.isAbsorbing = true;
                        st.orbsCollected++;
                        st.pendingOrbsToSync++; // Queue for batch sync
                    }

                    if (orb.isAbsorbing) {
                        const currentScale = orb.mesh.scale.x;
                        const newScale = THREE.MathUtils.lerp(currentScale, 0.01, delta * 8.0);
                        orb.mesh.scale.set(newScale, newScale, newScale);
                        orb.light.intensity = THREE.MathUtils.lerp(orb.light.intensity, 0, delta * 10.0);

                        if (newScale < 0.05) {
                            orb.collected = true;
                            orb.mesh.visible = false;
                            orb.light.visible = false;
                        }
                    }
                }
            });
        }

        if (ob.doorSystem) {
            st.doorOpenAmount = ob.doorSystem.animateDoor(delta, st.doorState, st.doorOpenAmount);
        }

        // === INTRO TITLE CARD (no camera movement) ===
        if (!introShownRef.current) {
            introShownRef.current = true;
            console.log('[FortalezaLevel] 🎬 Showing intro title card...');
            window.dispatchEvent(new CustomEvent('fortaleza-title', { detail: { show: true } }));
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('fortaleza-title', { detail: { show: false } }));
                console.log('[FortalezaLevel] 🎬 Title card hidden.');
            }, 4000);
        }

        // === GOLEM BOSS COMBAT CAMERA ===
        const combatStore = useCombatModeStore.getState();
        if (combatStore.isActive && combatStore.combatCenterPosition && playerObj) {
            const center = new THREE.Vector3(...combatStore.combatCenterPosition);
            const cameraOffset = new THREE.Vector3(25, 8, 0);
            const targetCamPos = center.clone().add(cameraOffset);
            camera.position.lerp(targetCamPos, delta * 3.0);
            camera.lookAt(center);
        }
    });

    return (
        <>
            <FortalezaPlayer position={[0, 5, 45]} />
        </>
    );
}

export default function FortalezaLevel() {
    return (
        <PhysicsProvider>
            <FortalezaScene />
        </PhysicsProvider>
    );
}
