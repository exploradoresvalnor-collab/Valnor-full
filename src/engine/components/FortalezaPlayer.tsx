import { useRef, useEffect, useState, Suspense, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayerStore } from '../../stores/playerStore';
import { CharacterModel3D, CharacterPlaceholder } from './CharacterModel3D';
import { useAnimationSystem, type AnimationState } from '../systems/AnimationSystem';
import { usePhysics } from '../contexts/PhysicsContext';
import { useTeamLeader } from '../../stores/teamStore';

// Teclas
const keys: { [key: string]: boolean } = {};

export function FortalezaPlayer({ position = [0, 5, 0] }: { position?: [number, number, number] }) {
    const { camera } = useThree();
    const playerGroup = useRef<THREE.Group>(null);
    const meshRef = useRef<THREE.Group>(null);
    const tiltContainerRef = useRef<THREE.Group>(null);

    const characterId = usePlayerStore(s => s.characterId);
    const characterClass = usePlayerStore(s => s.characterClass);
    const isInCombat = usePlayerStore(s => s.isInCombat);
    const orbsCollected = usePlayerStore(s => s.orbsCollected);

    // Actions are stable in Zustand, they don't trigger re-renders
    const setPosition = usePlayerStore(s => s.setPosition);
    const setIsGrounded = usePlayerStore(s => s.setIsGrounded);
    const setIsMoving = usePlayerStore(s => s.setIsMoving);

    const teamLeader = useTeamLeader();

    // Resolve which character model to spawn based on active team
    const resolvedCharacterId = teamLeader?.id || characterId || 'draco-igneo';

    const { collidables, checkpoints, movingPlatforms } = usePhysics();

    // Raycaster para colisiones personalizadas (como en player.ts)
    const raycaster = useRef(new THREE.Raycaster());

    // --- Animation System ---
    const [animationData, setAnimationData] = useState<{
        mixer: THREE.AnimationMixer | null;
        animations: Map<AnimationState, THREE.AnimationClip>;
    } | null>(null);

    const animationSystem = useAnimationSystem({
        mixer: animationData?.mixer ?? null,
        animations: animationData?.animations || new Map(),
    });

    const handleAnimationsReady = useCallback(
        (mixer: THREE.AnimationMixer, animations: Map<AnimationState, THREE.AnimationClip>) => {
            setAnimationData({ mixer, animations });
        },
        [],
    );

    // --- Variables Físicas de player.ts ---
    const state = useRef({
        velocityY: 0,
        velocityX: 0,
        velocityZ: 0,
        isGrounded: false,
        jumpCount: 0,
        canDoubleJump: true,
        canTripleJump: true,
        gravity: -30.0,
        jumpForce: 14.0,
        coyoteTime: 0,
        maxCoyoteTime: 0.15,
        jumpBufferTime: 0,
        maxJumpBufferTime: 0.15,
        accel: 60.0,
        friction: 10.0,
        cameraAngleX: 0,
        cameraAngleY: 0.5,
        cameraDistance: 12.0,
        isDragging: false,
        prevMousePos: { x: 0, y: 0 },
        playerPos: new THREE.Vector3(position[0], position[1], position[2]),
        respawnPoint: new THREE.Vector3(position[0], position[1], position[2]),
        cameraDip: 0,
    });

    // --- Input Events ---
    useEffect(() => {
        const s = state.current;

        // Mouse (Orbit Camera)
        const onMouseDown = () => { s.isDragging = true; };
        const onMouseUp = () => { s.isDragging = false; };
        const onMouseMove = (e: MouseEvent) => {
            if (s.isDragging) {
                const deltaX = e.movementX; // Better than manual offsets
                const deltaY = e.movementY;
                s.cameraAngleX -= deltaX * 0.005;
                s.cameraAngleY -= deltaY * 0.005;
                s.cameraAngleY = Math.max(-0.2, Math.min(1.5, s.cameraAngleY));
            }
        };

        // Keyboard
        const onKeyDown = (e: KeyboardEvent) => {
            const k = (e.key || '').toLowerCase();
            keys[k] = true;
            keys['shift'] = e.shiftKey;
            if (k === ' ') {
                s.jumpBufferTime = s.maxJumpBufferTime;
            }

            // Animations trigger
            if (k === 'f') animationSystem?.play('attack1', { force: true });
        };
        const onKeyUp = (e: KeyboardEvent) => {
            const k = (e.key || '').toLowerCase();
            keys[k] = false;
            keys['shift'] = e.shiftKey;
        };

        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        return () => {
            window.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, [animationSystem]);

    // --- Bucle principal físico (Frame) ---
    useFrame((_, delta) => {
        if (!playerGroup.current || !meshRef.current || !animationSystem) return;
        const dt = Math.min(delta, 0.1); // Clamp largo
        const s = state.current;

        // --- Metroidvania Jump Unlocks ---
        s.canDoubleJump = orbsCollected >= 1;
        s.canTripleJump = orbsCollected >= 2;

        // Decaimiento Coyote Time
        if (!s.isGrounded && s.coyoteTime > 0) s.coyoteTime -= dt;
        if (s.jumpBufferTime > 0) s.jumpBufferTime -= dt;

        // Salto
        if (s.jumpBufferTime > 0) {
            if (s.isGrounded || s.coyoteTime > 0) {
                s.velocityY = s.jumpForce;
                s.isGrounded = false;
                s.coyoteTime = 0;
                s.jumpBufferTime = 0;
                s.jumpCount = 1;
                animationSystem.play('jump', { force: true });
                animationSystem.setTimeScale(1.0);
            } else if ((s.canDoubleJump && s.jumpCount < 2) || (s.canTripleJump && s.jumpCount < 3)) {
                s.velocityY = s.jumpForce;
                s.jumpBufferTime = 0;
                s.jumpCount++;
                animationSystem.play('jump', { force: true });
                animationSystem.setTimeScale(1.3);
            }
        }

        const speed = keys.shift ? 25 : 14;

        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(camera.up, forward).normalize();

        let inputX = 0;
        let inputZ = 0;
        if (keys.w) inputZ += 1;
        if (keys.s) inputZ -= 1;
        if (keys.a) inputX += 1;
        if (keys.d) inputX -= 1;

        let isMoving = false;

        if (inputX !== 0 || inputZ !== 0) {
            isMoving = true;
            const inputVec = new THREE.Vector3(inputX * right.x + inputZ * forward.x, 0, inputX * right.z + inputZ * forward.z).normalize();

            const targetAccel = speed * s.friction * 1.5;
            const currentAccel = s.isGrounded ? targetAccel : targetAccel * 0.4;

            s.velocityX += inputVec.x * currentAccel * dt;
            s.velocityZ += inputVec.z * currentAccel * dt;

            const currentSpeedVec = new THREE.Vector2(s.velocityX, s.velocityZ);
            if (currentSpeedVec.length() > speed) {
                currentSpeedVec.normalize().multiplyScalar(speed);
                s.velocityX = currentSpeedVec.x;
                s.velocityZ = currentSpeedVec.y;
            }

            // Rotar el modelo (suave)
            const targetAngle = Math.atan2(s.velocityX, s.velocityZ);
            const currentAngle = meshRef.current.rotation.y;
            const diff = targetAngle - currentAngle;
            const modDiff = ((diff + Math.PI) % (Math.PI * 2)) - Math.PI;
            meshRef.current.rotation.y = currentAngle + modDiff * 10 * dt;
        }

        // Fricción
        const currentFriction = s.isGrounded ? s.friction : s.friction * 0.2;
        s.velocityX -= s.velocityX * currentFriction * dt;
        s.velocityZ -= s.velocityZ * currentFriction * dt;

        const originalPos = s.playerPos.clone();
        s.playerPos.x += s.velocityX * dt;
        s.playerPos.z += s.velocityZ * dt;

        // --- WALL COLLISION ---
        const checkWallCollision = () => {
            const directions = [
                new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0),
                new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1)
            ];
            // Si collidables está vacío, saltará este paso
            if (collidables.length > 0) {
                // RAYCAST ORIGIN FIX: Modificado a s.playerPos.y + 0.2 para evitar chocar 
                // con las caras internas de pisos solapados (lo que creaba paredes invisibles)
                [s.playerPos.y + 0.2, s.playerPos.y + 0.8].forEach(yPos => {
                    const origin = new THREE.Vector3(s.playerPos.x, yPos, s.playerPos.z);
                    directions.forEach(dirVec => {
                        raycaster.current.set(origin, dirVec);
                        const hits = raycaster.current.intersectObjects(collidables, false);
                        if (hits.length > 0 && hits[0].distance < 1.0) {
                            if (hits[0].face) {
                                const normalMatrix = new THREE.Matrix3().getNormalMatrix(hits[0].object.matrixWorld);
                                const normal = hits[0].face.normal.clone().applyMatrix3(normalMatrix).normalize();

                                s.playerPos.addScaledVector(normal, 1.0 - hits[0].distance);
                                const dot = new THREE.Vector3(s.velocityX, 0, s.velocityZ).dot(normal);
                                if (dot < 0) {
                                    s.velocityX -= normal.x * dot;
                                    s.velocityZ -= normal.z * dot;
                                }
                            } else {
                                s.playerPos.x = originalPos.x;
                                s.playerPos.z = originalPos.z;
                            }
                        }
                    });
                });
            }
        };
        checkWallCollision();

        // Gravedad
        s.velocityY += s.gravity * dt;
        s.playerPos.y += s.velocityY * dt;

        // --- FLOOR COLLISION ---
        const rayOrigin = s.playerPos.clone();
        rayOrigin.y += 2.0;
        raycaster.current.set(rayOrigin, new THREE.Vector3(0, -1, 0));

        let activePlatform: any = null;
        const wasGrounded = s.isGrounded;
        s.isGrounded = false;

        if (collidables.length > 0) {
            const intersects = raycaster.current.intersectObjects(collidables, false);
            if (intersects.length > 0) {
                const hit = intersects[0];
                const distanceToFeet = hit.distance - 4.0;
                const isJumpingIntoCeiling = s.velocityY > 0 && distanceToFeet < -0.5;

                if (!isJumpingIntoCeiling && ((wasGrounded && Math.abs(distanceToFeet) < 2.0) || (s.velocityY <= 0 && distanceToFeet >= 0 && distanceToFeet < 2.0) || (isMoving && s.velocityY <= 0.1 && distanceToFeet < 0 && distanceToFeet >= -1.8))) {
                    if (!wasGrounded) s.cameraDip = 0.5;
                    const targetY = hit.point.y + 2.0;

                    if (distanceToFeet < 0 && wasGrounded) {
                        s.playerPos.y = THREE.MathUtils.lerp(s.playerPos.y, targetY, 0.4);
                    } else {
                        s.playerPos.y = targetY;
                    }

                    if (s.velocityY <= 0 || distanceToFeet < 0) s.velocityY = 0;

                    s.isGrounded = true;
                    s.jumpCount = 0;
                    s.coyoteTime = s.maxCoyoteTime;

                    movingPlatforms?.forEach((p) => {
                        if (hit.object === p.collider) activePlatform = p;
                    });

                    checkpoints?.forEach((cp) => {
                        if (s.playerPos.distanceTo(cp.pos) < cp.radius) {
                            s.respawnPoint.copy(cp.pos);
                        }
                    });
                }
            }
        } else {
            // Fallback simple si no hay collidables en la escena para prevenir caida al vacío total
            if (s.playerPos.y <= 0) {
                s.playerPos.y = 0;
                if (s.velocityY <= 0) s.velocityY = 0;
                s.isGrounded = true;
                s.jumpCount = 0;
                s.coyoteTime = s.maxCoyoteTime;
            }
        }

        if (activePlatform) {
            s.playerPos.x += activePlatform.deltaX;
            s.playerPos.y += activePlatform.deltaY;
            s.playerPos.z += activePlatform.deltaZ;
        }

        if (s.playerPos.y < s.respawnPoint.y - 80) {
            s.playerPos.copy(s.respawnPoint);
            s.velocityY = 0;
        }

        playerGroup.current.position.copy(s.playerPos);

        // Update Store
        if (Math.abs(s.velocityX) > 0.01 || Math.abs(s.velocityZ) > 0.01) {
            setPosition({ x: s.playerPos.x, y: s.playerPos.y, z: s.playerPos.z });
        }
        setIsGrounded(s.isGrounded);
        setIsMoving(isMoving);

        // Animaciones Update automatizado
        animationSystem.updateFromMovement(isMoving, keys.shift, s.isGrounded, s.velocityY);

        // TPS Camera Update
        const camOffsetX = s.cameraDistance * Math.sin(s.cameraAngleX) * Math.cos(s.cameraAngleY);
        const camOffsetY = s.cameraDistance * Math.sin(s.cameraAngleY);
        const camOffsetZ = s.cameraDistance * Math.cos(s.cameraAngleX) * Math.cos(s.cameraAngleY);

        const targetCamPos = new THREE.Vector3(s.playerPos.x + camOffsetX, s.playerPos.y + camOffsetY + 2.0, s.playerPos.z + camOffsetZ);
        const camDir = new THREE.Vector3().subVectors(targetCamPos, s.playerPos).normalize();

        if (collidables.length > 0) {
            raycaster.current.set(s.playerPos, camDir);
            const camHits = raycaster.current.intersectObjects(collidables, false);
            if (camHits.length > 0 && camHits[0].distance < s.cameraDistance) {
                camera.position.copy(s.playerPos).addScaledVector(camDir, Math.max(1.0, camHits[0].distance - 0.5));
            } else {
                camera.position.copy(targetCamPos);
            }
        } else {
            camera.position.copy(targetCamPos);
        }

        const lookTarget = s.playerPos.clone();
        lookTarget.y += 4.0 - s.cameraDip;
        camera.lookAt(lookTarget);

    });

    return (
        <group ref={playerGroup} name="FortalezaPlayer">
            <group ref={meshRef}>
                <group ref={tiltContainerRef} position={[0, -2, 0]}>
                    <Suspense fallback={<CharacterPlaceholder />}>
                        <CharacterModel3D
                            personajeId={resolvedCharacterId}
                            characterClass={teamLeader?.class || characterClass}
                            withWeapon={isInCombat}
                            onAnimationsReady={handleAnimationsReady}
                        />
                    </Suspense>
                </group>
            </group>
        </group>
    );
}
