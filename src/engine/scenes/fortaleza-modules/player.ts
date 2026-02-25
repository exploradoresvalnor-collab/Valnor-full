import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export function createPlayer(scene: THREE.Scene, camera: THREE.PerspectiveCamera, collidables: THREE.Object3D[], checkpoints: any[]) {
    const raycaster = new THREE.Raycaster();
    const keys: { [key: string]: boolean } = {};

    // --- MODELO Y ANIMACION ---
    const playerGroup = new THREE.Group();
    scene.add(playerGroup);

    let mixer: THREE.AnimationMixer | null = null;
    const actions: { [name: string]: THREE.AnimationAction } = {};
    let activeAction: THREE.AnimationAction | null = null;
    let modelReady = false;

    const fadeDuration = 0.2;

    const playAction = (name: string, timeScale = 1.0) => {
        if (!actions[name] || activeAction === actions[name]) return;

        const nextAction = actions[name];
        nextAction.reset();
        nextAction.setEffectiveTimeScale(timeScale);
        nextAction.setEffectiveWeight(1.0);
        nextAction.play();

        if (activeAction) {
            activeAction.crossFadeTo(nextAction, fadeDuration, true);
        }
        activeAction = nextAction;
    };

    const loader = new GLTFLoader();
    loader.load('models/Character Soldier.glb', (gltf) => {
        const model = gltf.scene;
        model.scale.set(1.6, 1.6, 1.6);

        // Ajustamos su Y para que sus pies rocen el suelo. 
        model.position.y = -2.0;

        // Añadir sombras al modelo
        model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        playerGroup.add(model);

        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);

            gltf.animations.forEach((clip) => {
                const parts = clip.name.split('|');
                const clipName = parts.length > 1 ? parts[1] : clip.name;
                const action = mixer!.clipAction(clip);

                // Configurar animaciones específicas como el salto para no loopear
                if (clipName === 'Jump' || clipName === 'HitReact' || clipName === 'Death') {
                    action.setLoop(THREE.LoopOnce, 1);
                    action.clampWhenFinished = true;
                }

                actions[clipName] = action;
            });

            // Acción por defecto
            if (actions['Idle']) {
                playAction('Idle');
            } else {
                activeAction = mixer.clipAction(gltf.animations[0]);
                activeAction.play();
            }
        }

        modelReady = true;
    });

    // --- FÍSICAS Y ESTADO ---
    let velocityY = 0;
    let isGrounded = false;
    let jumpCount = 0;
    let canDoubleJump = true; // ACTIVADO por defecto para testeo
    let canTripleJump = false;
    const gravity = -30.0;
    const jumpForce = 14.0;

    // Posición principal del jugador (reemplaza a camera.position como centro lógico)
    const playerPos = new THREE.Vector3(0, 5, 45);
    playerGroup.position.copy(playerPos);
    let cameraDip = 0;

    const respawnPoint = new THREE.Vector3(0, 5, 45);

    // Variables de cámara TPU (Third Person Update)
    let cameraAngleX = 0; // Rotación orbital horizontal
    let cameraAngleY = 0.5; // Rotación orbital vertical (inclinación)
    const cameraDistance = 12.0;

    // Mouse input para orbitar
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = () => { isDragging = true; };
    const onMouseUp = () => { isDragging = false; };
    const onMouseMove = (e: MouseEvent) => {
        if (isDragging) {
            const deltaX = e.offsetX - previousMousePosition.x;
            const deltaY = e.offsetY - previousMousePosition.y;
            cameraAngleX -= deltaX * 0.005;
            cameraAngleY -= deltaY * 0.005;
            // Limitar ángulo vertical para no traspasar el suelo ni dar la vuelta
            cameraAngleY = Math.max(-0.2, Math.min(1.5, cameraAngleY));
        }
        previousMousePosition = { x: e.offsetX, y: e.offsetY };
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);

    let velocityX = 0;
    let velocityZ = 0;
    const accel = 60.0;
    const friction = 10.0;

    let coyoteTime = 0;
    const maxCoyoteTime = 0.15;

    let jumpBufferTime = 0;
    const maxJumpBufferTime = 0.15;

    // Sistema de Input
    const onKeyDown = (e: KeyboardEvent) => {
        const k = (e.key || '').toLowerCase();
        keys[k] = true;
        keys['shift'] = e.shiftKey;
        if (k === ' ') {
            jumpBufferTime = maxJumpBufferTime;
        }
    };
    const onKeyUp = (e: KeyboardEvent) => {
        const k = (e.key || '').toLowerCase();
        keys[k] = false;
        keys['shift'] = e.shiftKey;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return {
        keys,
        dispose: () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            window.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('mousemove', onMouseMove);
            if (mixer) mixer.stopAllAction();
        },
        getPlayerGroup: () => playerGroup, // Retornamos el grupo para referencias globales
        getRespawnPoint: () => respawnPoint,
        setRespawnPoint: (pos: THREE.Vector3) => respawnPoint.copy(pos),
        unlockDoubleJump: () => { canDoubleJump = true; },
        unlockTripleJump: () => { canDoubleJump = true; canTripleJump = true; },
        getJumpCount: () => jumpCount,
        updatePhysics: (delta: number, isLocked: boolean, movingPlatforms: any[]) => {
            if (!isLocked) return null;

            // Decaimiento natural de variables temporales
            if (!isGrounded && coyoteTime > 0) coyoteTime -= delta;
            if (jumpBufferTime > 0) jumpBufferTime -= delta;

            // Procesar el salto (usa jump buffer y coyote time)
            // Permitimos el salto si:
            // 1. Está en el suelo (coyote time incluye estar en el aire por muy poco)
            // 2. O, si no está en el suelo pero tiene desbloqueado doble salto (jumpCount < 2)
            // 3. O, si tiene desbloqueado triple salto (jumpCount < 3)
            if (jumpBufferTime > 0) {
                if (isGrounded || coyoteTime > 0) {
                    // Salto normal
                    velocityY = jumpForce;
                    isGrounded = false;
                    coyoteTime = 0;
                    jumpBufferTime = 0;
                    jumpCount = 1;

                    // Reiniciar y forzar la animación de salto
                    if (actions['Jump']) {
                        actions['Jump'].reset();
                        playAction('Jump', 1.0);
                    }
                } else if ((canDoubleJump && jumpCount < 2) || (canTripleJump && jumpCount < 3)) {
                    // Doble/Triple Salto en el aire
                    velocityY = jumpForce;
                    jumpBufferTime = 0;
                    jumpCount++;

                    // Reiniciar y forzar la animación de salto para que se repita en el aire
                    if (actions['Jump']) {
                        actions['Jump'].reset();
                        playAction('Jump', 1.3); // Un poco más rápido para dar sensación de impulso extra
                    }
                }
            }

            const speed = keys.shift ? 25 : 14;

            const forward = new THREE.Vector3();
            // AHORA el movimiento es relativo a DÓNDE MIRA LA CÁMARA
            camera.getWorldDirection(forward);
            forward.y = 0;
            forward.normalize();

            const right = new THREE.Vector3();
            right.crossVectors(camera.up, forward).normalize();

            // Aceleración local basada en inputs
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

                const targetAccel = speed * friction * 1.5;
                const currentAccel = isGrounded ? targetAccel : targetAccel * 0.4;

                velocityX += inputVec.x * currentAccel * delta;
                velocityZ += inputVec.z * currentAccel * delta;

                const currentSpeedVec = new THREE.Vector2(velocityX, velocityZ);
                if (currentSpeedVec.length() > speed) {
                    currentSpeedVec.normalize().multiplyScalar(speed);
                    velocityX = currentSpeedVec.x;
                    velocityZ = currentSpeedVec.y;
                }

                // Rotar el modelo 3D hacia la dirección de movimiento
                if (modelReady) {
                    const targetAngle = Math.atan2(velocityX, velocityZ);
                    // Suavizar la rotación (lerp)
                    let currentAngle = playerGroup.rotation.y;
                    // Ajuste para evitar giros largos de 360 grados
                    const diff = targetAngle - currentAngle;
                    const modDiff = ((diff + Math.PI) % (Math.PI * 2)) - Math.PI;
                    playerGroup.rotation.y = currentAngle + modDiff * 10 * delta;
                }
            }

            // Actualizar animación
            if (mixer && modelReady) {
                mixer.update(delta);

                let specialAnim = false;
                if (keys['f'] && actions['Punch']) { playAction('Punch', 1.5); specialAnim = true; }
                else if (keys['t'] && actions['Wave']) { playAction('Wave', 1.0); specialAnim = true; }
                else if (keys['y'] && actions['Yes']) { playAction('Yes', 1.0); specialAnim = true; }
                else if (keys['n'] && actions['No']) { playAction('No', 1.0); specialAnim = true; }
                else if (keys['x'] && actions['Duck']) { playAction('Duck', 1.0); specialAnim = true; }
                else if (keys['g'] && actions['HitReact']) { playAction('HitReact', 1.0); specialAnim = true; }
                else if (keys['h'] && actions['Death']) { playAction('Death', 1.0); specialAnim = true; }
                else if (keys['c'] && actions['Run_Gun']) { playAction('Run_Gun', 1.0); specialAnim = true; }

                if (!specialAnim) {
                    // Si la animación de salto está corriendo y no ha terminado de aterrizar
                    if (!isGrounded && velocityY > 0) {
                        playAction('Jump', 1.0);
                    } else if (!isGrounded && velocityY <= 0) {
                        // Podríamos reproducir animación de caída aquí si existiera en el gltf. 
                        // Por ahora lo ignoramos y se queda en jump (o idle si aterriza).
                    } else if (isMoving && isGrounded) {
                        playAction('Run', keys.shift ? 1.5 : 1.0);
                        if (activeAction) activeAction.setEffectiveTimeScale(keys.shift ? 1.5 : 1.0);
                    } else if (isGrounded) {
                        playAction('Idle', 1.0);
                    }
                }
            }

            // Fricción
            const currentFriction = isGrounded ? friction : friction * 0.2;
            velocityX -= velocityX * currentFriction * delta;
            velocityZ -= velocityZ * currentFriction * delta;

            // Guardamos la posición previa
            const originalPos = playerPos.clone();

            // Aplicar velocidad XZ al Jugador
            playerPos.x += velocityX * delta;
            playerPos.z += velocityZ * delta;

            // --- WALL COLLISION (Raycasts horizontales) ---
            const checkWallCollision = () => {
                const directions = [
                    new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0),
                    new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1)
                ];
                // Revisamos a dos alturas: cintura y cabeza (ignorando obstáculos a nivel de suelo/escalones)
                // playerPos.y es el centro de gravedad (cintura). Pies = playerPos.y - 2.0
                // Escalón máximo = 1.5. Entonces testeamos desde playerPos.y - 0.2 hacia arriba.
                [playerPos.y - 0.2, playerPos.y + 0.8].forEach(yPos => {
                    const origin = new THREE.Vector3(playerPos.x, yPos, playerPos.z);
                    directions.forEach(dirVec => {
                        raycaster.set(origin, dirVec);
                        const hits = raycaster.intersectObjects(collidables, false);
                        if (hits.length > 0 && hits[0].distance < 1.0) {
                            if (hits[0].face) {
                                const normalMatrix = new THREE.Matrix3().getNormalMatrix(hits[0].object.matrixWorld);
                                const normal = hits[0].face.normal.clone().applyMatrix3(normalMatrix).normalize();

                                playerPos.addScaledVector(normal, 1.0 - hits[0].distance);
                                const dot = new THREE.Vector3(velocityX, 0, velocityZ).dot(normal);
                                if (dot < 0) {
                                    velocityX -= normal.x * dot;
                                    velocityZ -= normal.z * dot;
                                }
                            } else {
                                playerPos.x = originalPos.x;
                                playerPos.z = originalPos.z;
                            }
                        }
                    });
                });
            };

            checkWallCollision();

            // Gravedad
            velocityY += gravity * delta;
            playerPos.y += velocityY * delta;

            // --- FLOOR COLLISION (Raycast hacia abajo) ---
            const rayOrigin = playerPos.clone();
            rayOrigin.y += 2.0; // Lanzamos el rayo desde más arriba para detectar los peldaños que los muros ignoraron
            raycaster.set(rayOrigin, new THREE.Vector3(0, -1, 0));

            const intersects = raycaster.intersectObjects(collidables, false);
            const wasGrounded = isGrounded;
            isGrounded = false;
            let activePlatform: any = null;

            // Configuramos la distancia máxima de rayo: 4.0 hacia abajo desde un punto superior
            // Esto permite "encajar" (snap) al suelo si estamos bajando una pendiente, o "subir" (step up) si chocamos frontalmente con un escalón (que ignoró el wall collider)
            if (intersects.length > 0) {
                const hit = intersects[0];
                const distanceToFeet = hit.distance - 4.0; // Negativo si el suelo está por encima de los pies lógicos, Positivo si está por debajo

                // Permitir Snap si:
                // 1. Estábamos en el suelo y el nuevo suelo no está demasiado lejos hacia abajo (bajar escalón/pendiente)
                // 2. O si estamos cayendo verticalmente (velocityY <= 0)
                // 3. El nuevo suelo está por encima de nosotros (step up), hasta una altura máxima de 1.8 unidades relativas (subir escalón)

                // CRÍTICO: Bloquear 'Clip-Up' (Atravesar Techos)
                // Si la distancia al hit object detectado es muy negativa (el objeto está golpeando por encima del jugador, ej. un techo)
                // NUNCA lo consideraremos "Piso" si estamos ganando altura (Saltando = velocityY > 0).
                const isJumpingIntoCeiling = velocityY > 0 && distanceToFeet < -0.5;

                if (!isJumpingIntoCeiling && ((wasGrounded && Math.abs(distanceToFeet) < 2.0) || (velocityY <= 0 && distanceToFeet >= 0 && distanceToFeet < 2.0) || (isMoving && velocityY <= 0.1 && distanceToFeet < 0 && distanceToFeet >= -1.8))) {
                    if (!wasGrounded) cameraDip = 0.5;
                    let targetY = hit.point.y + 2.0; // 2.0 de la altura al centro de masa

                    // Suavizado del Step Up para evitar tirones de cámara violentos al subir escalones
                    if (distanceToFeet < 0 && wasGrounded) {
                        playerPos.y = THREE.MathUtils.lerp(playerPos.y, targetY, 0.4);
                    } else {
                        playerPos.y = targetY;
                    }

                    // Solo detenemos la velocidad vertical si realmente encajamos
                    if (velocityY <= 0 || distanceToFeet < 0) {
                        velocityY = 0;
                    }

                    isGrounded = true;
                    jumpCount = 0;
                    coyoteTime = maxCoyoteTime;

                    movingPlatforms.forEach((p) => {
                        if (hit.object === p.collider) activePlatform = p;
                    });

                    checkpoints.forEach((cp) => {
                        if (playerPos.distanceTo(cp.pos) < cp.radius) {
                            respawnPoint.copy(cp.pos);
                        }
                    });
                }
            }

            // Añadimos la inercia de la plataforma móvil si estamos sobre una
            if (activePlatform) {
                playerPos.x += activePlatform.deltaX;
                playerPos.y += activePlatform.deltaY;
                playerPos.z += activePlatform.deltaZ;
            }

            // Respawn automático en caída
            let didRespawn = false;
            if (playerPos.y < respawnPoint.y - 80) {
                playerPos.copy(respawnPoint);
                velocityY = 0;
                didRespawn = true;
            }

            // --- ACTUALIZAR MUNDO ---
            playerGroup.position.copy(playerPos);

            // Orbit Camera Logic
            const camOffsetX = cameraDistance * Math.sin(cameraAngleX) * Math.cos(cameraAngleY);
            const camOffsetY = cameraDistance * Math.sin(cameraAngleY);
            const camOffsetZ = cameraDistance * Math.cos(cameraAngleX) * Math.cos(cameraAngleY);

            // Evitar que la cámara atraviese paredes (raycast inverso desde el jugador hacia la cámara deseada)
            const targetCamPos = new THREE.Vector3(playerPos.x + camOffsetX, playerPos.y + camOffsetY + 2.0, playerPos.z + camOffsetZ);
            const camDir = new THREE.Vector3().subVectors(targetCamPos, playerPos).normalize();
            raycaster.set(playerPos, camDir);
            const camHits = raycaster.intersectObjects(collidables, false);

            if (camHits.length > 0 && camHits[0].distance < cameraDistance) {
                // Acercar la cámara si hay pared
                camera.position.copy(playerPos).addScaledVector(camDir, Math.max(1.0, camHits[0].distance - 0.5));
            } else {
                camera.position.copy(targetCamPos);
            }

            // La cámara mira hacia el jugador, levemente hacia arriba
            const lookTarget = playerPos.clone();
            lookTarget.y += 4.0 - cameraDip;
            camera.lookAt(lookTarget);

            return {
                didRespawn,
                isGrounded,
                activePlatform
            };
        }
    };
}
