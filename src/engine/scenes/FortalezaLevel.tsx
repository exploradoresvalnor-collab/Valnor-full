import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { usePlayerStore } from '../../stores/playerStore';
import { FortalezaPlayer } from '../components/FortalezaPlayer';
import { PhysicsProvider, usePhysics } from '../contexts/PhysicsContext';
import { FloatingDamageText, DamageNumber } from '../components/FloatingDamageText';
import { calculateExperienceGain } from '../rpg/leveling-system';

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
    const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
    const [combatActive, setCombatActive] = useState(false);
    const [combatResult, setCombatResult] = useState<null | { won: boolean; exp: number; gold: number }>(null);

    const stateRef = useRef({
        orbsCollected: 0,
        doorState: 0, // 0=closed, 1=opening, 2=closing
        doorOpenAmount: 0,
        time: 0,
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
    });

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

        // Interactive Key Binding for Door (E)
        const handleKeyDown = (e: KeyboardEvent) => {
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
        };
        window.addEventListener('keydown', handleKeyDown);

        setIsLoaded(true);

        // Cleanup when leaving level
        return () => {
            window.removeEventListener('keydown', handleKeyDown);

            // Safely remove tracked objects WITHOUT having corrupted the native `scene` prototype!
            addedObjects.forEach(obj => {
                scene.remove(obj);
                // Also trigger basic memory cleanup if possible
                if ((obj as any).geometry) (obj as any).geometry.dispose();
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

        // Process procedural animations logic from the legacy system
        ob.animatedCrystals.forEach((c: any) => {
            if (c.mesh) {
                c.mesh.position.y = c.baseY + Math.sin(time * (1.5 + c.speedOffset * 0.25)) * 0.5;
                c.mesh.rotation.y = time * (0.6 + c.speedOffset * 0.25);
            }
        });

        ob.fireEmitters.forEach((emitter: any) => {
            emitter.light.intensity = emitter.baseIntensity + Math.sin(time * 8.0) * (emitter.scale * 1.5) + Math.cos(time * 12.0) * (emitter.scale * 0.5);
            const positions = emitter.points.geometry.attributes.position.array;
            const lifespans = emitter.points.geometry.attributes.lifespan.array;
            const speeds = emitter.points.geometry.attributes.speed.array;

            for (let i = 0; i < lifespans.length; i++) {
                lifespans[i] -= delta * speeds[i] * 0.5;
                positions[i * 3 + 1] += delta * speeds[i] * emitter.scale * 3.0; // move Y

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
                        usePlayerStore.getState().setOrbsCollected(st.orbsCollected);
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

        // === GOLEM BOSS COMBAT ===
        if (!st.combatEnded && playerObj) {
            // Golem throne position (roughly at the end of the fortress)
            const golemPos = new THREE.Vector3(0, 0, -420);
            const distToGolem = playerObj.position.distanceTo(golemPos);

            // Trigger combat when player approaches within 15 units
            if (!st.combatStarted && distToGolem < 15) {
                st.combatStarted = true;
                setCombatActive(true);
                console.log('[FortalezaLevel] ⚔️ Golem Boss combat triggered!');
            }

            // Combat tick loop (attack every 1.2 seconds)
            if (st.combatStarted && !st.combatEnded) {
                st.combatTimer += delta;

                if (st.combatTimer - st.lastAttackTime >= 1.2) {
                    st.lastAttackTime = st.combatTimer;
                    const pState = usePlayerStore.getState();
                    const playerAtk = pState.stats?.attack ?? 15;
                    const playerDef = pState.stats?.defense ?? 10;
                    const playerCrit = pState.stats?.critRate ?? 5;
                    const playerCritDmg = pState.stats?.critDamage ?? 150;

                    // --- Player attacks Golem ---
                    let playerDmg = playerAtk * (100 / (100 + st.golemDefense));
                    const isPlayerCrit = Math.random() * 100 < playerCrit;
                    if (isPlayerCrit) playerDmg = playerDmg * (playerCritDmg / 100);
                    // ±10% variance
                    playerDmg = Math.round(playerDmg * (1 + (Math.random() * 0.2 - 0.1)));
                    playerDmg = Math.max(1, playerDmg);

                    st.golemHealth = Math.max(0, st.golemHealth - playerDmg);
                    st.dmgIdCounter++;

                    const newPlayerDmg: DamageNumber = {
                        id: `p-${st.dmgIdCounter}`,
                        amount: playerDmg,
                        position: golemPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 3, 5 + Math.random() * 2, 0)),
                        isCritical: isPlayerCrit,
                        type: 'damage',
                    };

                    // --- Golem attacks Player ---
                    let golemDmg = st.golemAttack * (100 / (100 + playerDef));
                    const isGolemCrit = Math.random() * 100 < st.golemCritRate;
                    if (isGolemCrit) golemDmg = golemDmg * (st.golemCritDamage / 100);
                    golemDmg = Math.round(golemDmg * (1 + (Math.random() * 0.2 - 0.1)));
                    golemDmg = Math.max(1, golemDmg);

                    // Apply damage to player store
                    pState.takeDamage(golemDmg);
                    st.dmgIdCounter++;

                    const newGolemDmg: DamageNumber = {
                        id: `g-${st.dmgIdCounter}`,
                        amount: golemDmg,
                        position: playerObj.position.clone().add(new THREE.Vector3(0, 3, 0)),
                        isCritical: isGolemCrit,
                        type: 'damage',
                    };

                    setDamageNumbers([newPlayerDmg, newGolemDmg]);

                    // --- Check victory/defeat ---
                    if (st.golemHealth <= 0) {
                        st.combatEnded = true;
                        setCombatActive(false);
                        // Calculate EXP using native leveling-system formula
                        const expResult = calculateExperienceGain(
                            st.golemLevel,
                            st.golemBaseXP,
                            pState.level,
                            { isFirstKill: true }
                        );
                        pState.addExperience(expResult.totalXP);
                        pState.addGold(st.golemGold);
                        setCombatResult({ won: true, exp: expResult.totalXP, gold: st.golemGold });
                        console.log(`[FortalezaLevel] 🏆 Golem defeated! +${expResult.totalXP} EXP, +${st.golemGold} Gold`);
                    }

                    if (pState.currentHealth <= 0) {
                        st.combatEnded = true;
                        setCombatActive(false);
                        setCombatResult({ won: false, exp: 0, gold: 0 });
                        console.log('[FortalezaLevel] 💀 Player defeated by Golem!');
                    }
                }
            }
        }
    });

    return (
        <>
            <FortalezaPlayer position={[0, 5, 45]} />
            <FloatingDamageText damageNumbers={damageNumbers} />

            {/* Boss Health Bar HUD */}
            {combatActive && (
                <group position={[0, 10, -420]}>
                    <mesh>
                        <planeGeometry args={[8, 0.8]} />
                        <meshBasicMaterial color="#1a1a2e" transparent opacity={0.85} />
                    </mesh>
                    <mesh position={[-4 + (stateRef.current.golemHealth / stateRef.current.golemMaxHealth) * 4, 0, 0.01]}>
                        <planeGeometry args={[(stateRef.current.golemHealth / stateRef.current.golemMaxHealth) * 8, 0.6]} />
                        <meshBasicMaterial color={stateRef.current.golemHealth / stateRef.current.golemMaxHealth > 0.3 ? '#e74c3c' : '#ff0000'} />
                    </mesh>
                </group>
            )}

            {/* Victory / Defeat overlay */}
            {combatResult && (
                <group position={[0, 4, -418]}>
                </group>
            )}
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
