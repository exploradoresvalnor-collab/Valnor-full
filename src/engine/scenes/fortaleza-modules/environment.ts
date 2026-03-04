import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

export const Materials = {
    obsidian: new THREE.MeshStandardMaterial({ color: '#0d0d14', roughness: 0.05, metalness: 1.0 }),
    plaza: new THREE.MeshStandardMaterial({ roughness: 0.7 }), // map will be assigned in init
    wall: new THREE.MeshStandardMaterial({ roughness: 0.9 }),  // map will be assigned in init
    orb: new THREE.MeshStandardMaterial({ color: '#00e5ff', emissive: '#0077cc', emissiveIntensity: 2.0, roughness: 0.0, metalness: 0.1 }),
    platform: new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.5, emissive: '#001122', emissiveIntensity: 0.6 }), // map will be assigned
    runeRing: new THREE.MeshBasicMaterial({ color: '#00e5ff', transparent: true, opacity: 0.7, side: THREE.DoubleSide }),
    // --- Materiales diferenciados para pisos/techos/escaleras ---
    floor: new THREE.MeshStandardMaterial({ roughness: 0.8 }),    // Suelo interior (baldosas cálidas)
    ceiling: new THREE.MeshStandardMaterial({ roughness: 0.95 }), // Techo/losa (vigas madera oscura)
    stairs: new THREE.MeshStandardMaterial({ roughness: 0.75 }),  // Escalones (piedra gris pulida)
};

export function createRealisticFire(x: number, y: number, z: number, scale: number, emittersData: any[], parentContainer: THREE.Group | THREE.Scene, type: string = 'brazier') {
    const fireGroup = new THREE.Group();
    fireGroup.position.set(x, y, z);

    const count = type === 'brazier' ? 30 : 50;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const lifespans = new Float32Array(count);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * scale;
        positions[i * 3 + 1] = Math.random() * scale * 2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * scale;
        lifespans[i] = Math.random();
        speeds[i] = 1.0 + Math.random() * 1.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('lifespan', new THREE.BufferAttribute(lifespans, 1));
    geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));

    // Textura procedural simple 
    const canvas = document.createElement('canvas'); canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 230, 200, 1)');
    grad.addColorStop(0.2, 'rgba(255, 120, 0, 0.9)');
    grad.addColorStop(0.6, 'rgba(255, 20, 0, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 32, 32);
    const t = new THREE.CanvasTexture(canvas);

    const mat = new THREE.PointsMaterial({
        map: t,
        size: scale * 2.8,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        color: type === 'boss_tower' ? '#ff3300' : '#ff7722'
    });

    const particles = new THREE.Points(geometry, mat);
    fireGroup.add(particles);

    const light = new THREE.PointLight(type === 'boss_tower' ? '#ff4400' : '#ff7700', scale > 1.5 ? 6 : 5, scale * 30);
    light.position.y = scale;
    fireGroup.add(light);
    parentContainer.add(fireGroup);

    emittersData.push({ points: particles, light: light, scale: scale, baseIntensity: light.intensity });
}

function createStonePattern(type: number) {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 1024; // Resolución doblada (4k-like procedural)
    const ctx = canvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
    const bCanvas = document.createElement('canvas'); bCanvas.width = 1024; bCanvas.height = 1024;
    const bCtx = bCanvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;

    // Paletas de color "AAA" más ricas
    if (type === 0) ctx.fillStyle = '#1c1e24';       // plaza (Darker stony blue)
    else if (type === 1) ctx.fillStyle = '#16171c';  // wall (Almost pitch stone)
    else if (type === 2) ctx.fillStyle = '#4a515f';  // platform (Metallic stone)
    else if (type === 3) ctx.fillStyle = '#261b12';  // floor (Dark warm dirt/stone)
    else if (type === 4) ctx.fillStyle = '#0a0806';  // ceiling (Rotten wood/obsidian)
    else ctx.fillStyle = '#2d333b';                   // stairs (Steely stone)

    ctx.fillRect(0, 0, 1024, 1024);

    // Base física (bump medio)
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, 1024, 1024);

    // 1. Generar base de Ruido Perlin falso iterativo (Dirt & Grime)
    for (let i = 0; i < 25000; i++) {
        const px = Math.random() * 1024; const py = Math.random() * 1024;
        const s = Math.random() * 4 + 1;
        // Suciedad / Oclusión Ambiental falsa
        ctx.fillStyle = Math.random() > 0.6 ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.08)';
        ctx.fillRect(px, py, s, s);
        // Ruido para la normal
        bCtx.fillStyle = Math.random() > 0.5 ? 'rgba(100,100,100,0.6)' : 'rgba(180,180,180,0.6)';
        bCtx.fillRect(px, py, s, s);
    }

    // Funciones Helper para dibujar grietas
    const drawCrack = (ctx: CanvasRenderingContext2D, x: number, y: number, length: number, color: string, width: number) => {
        ctx.beginPath();
        ctx.moveTo(x, y);
        let currX = x; let currY = y;
        for (let j = 0; j < length; j += 10) {
            currX += (Math.random() - 0.5) * 15;
            currY += 10;
            ctx.lineTo(currX, currY);
        }
        ctx.lineWidth = width; ctx.strokeStyle = color;
        ctx.stroke();
    };

    if (type === 3) {
        // Suelo: Losas cuadradas desgastadas e irregulares
        ctx.strokeStyle = '#0a0604'; ctx.lineWidth = 12; // Juntas oscuras y gruesas
        bCtx.strokeStyle = '#000000'; bCtx.lineWidth = 20; // Juntas profundas
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const rx = c * 256; const ry = r * 256;
                ctx.strokeRect(rx, ry, 256, 256);
                bCtx.strokeRect(rx, ry, 256, 256);

                // Decaimiento del color por losa
                ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,180,100,0.1)' : 'rgba(0,0,0,0.3)';
                ctx.fillRect(rx, ry, 256, 256);

                // Biselado iluminado (Edge wear)
                bCtx.fillStyle = `rgba(255,255,255, ${Math.random() * 0.4 + 0.4})`;
                bCtx.fillRect(rx + 6, ry + 6, 244, 244);

                // Suciedad extra en bordes
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.globalAlpha = Math.random() * 0.5;
                ctx.fillRect(rx + 5, ry + 5, 30, 240); // Sombra lateral
                ctx.globalAlpha = 1.0;

                // Grietas masivas en el piso
                if (Math.random() > 0.5) {
                    drawCrack(ctx, rx + Math.random() * 256, ry, 150, '#000', 4);
                    drawCrack(bCtx, rx + Math.random() * 256, ry, 150, '#111', 8);
                }
            }
        }
    } else if (type === 4) {
        // Techo: Madera vieja y podrida o Losas larguísimas
        ctx.strokeStyle = '#040302'; ctx.lineWidth = 8;
        bCtx.strokeStyle = '#111111'; bCtx.lineWidth = 12;
        for (let r = 0; r < 16; r++) {
            const y = r * 64;
            ctx.strokeRect(0, y, 1024, 64);
            bCtx.strokeRect(0, y, 1024, 64);

            ctx.fillStyle = Math.random() > 0.4 ? 'rgba(50,30,15,0.2)' : 'rgba(0,0,0,0.4)';
            ctx.fillRect(0, y, 1024, 64);
            bCtx.fillStyle = `rgba(255,255,255, ${Math.random() * 0.3 + 0.5})`;
            bCtx.fillRect(0, y + 4, 1024, 56);

            // Vetas de la madera
            for (let v = 0; v < 8; v++) {
                ctx.beginPath(); bCtx.beginPath();
                const vy = y + 10 + Math.random() * 44;
                ctx.moveTo(0, vy); ctx.lineTo(1024, vy + (Math.random() - 0.5) * 10);
                ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 3; ctx.stroke();
                bCtx.moveTo(0, vy); bCtx.lineTo(1024, vy + (Math.random() - 0.5) * 10);
                bCtx.strokeStyle = '#333'; bCtx.lineWidth = 6; bCtx.stroke();
            }
        }
    } else if (type === 5) {
        // Escalones: Bloques robustos
        ctx.strokeStyle = '#15171a'; ctx.lineWidth = 8;
        bCtx.strokeStyle = '#000000'; bCtx.lineWidth = 14;
        for (let r = 0; r < 8; r++) {
            const offset = r % 2 !== 0 ? 96 : 0;
            for (let c = -1; c < 6; c++) {
                ctx.strokeRect(c * 192 + offset, r * 128, 192, 128);
                bCtx.strokeRect(c * 192 + offset, r * 128, 192, 128);

                ctx.fillStyle = Math.random() > 0.6 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.3)';
                ctx.fillRect(c * 192 + offset, r * 128, 192, 128);
                bCtx.fillStyle = `rgba(255,255,255, ${Math.random() * 0.4 + 0.5})`;
                bCtx.fillRect(c * 192 + offset + 6, r * 128 + 6, 180, 116);
            }
        }
    } else {
        // Original: muros, plazas, etc. Mampostería gótica MUY desgastada
        ctx.strokeStyle = type === 2 ? '#3a3e4a' : '#040405';
        bCtx.strokeStyle = '#000000';
        ctx.lineWidth = type === 2 ? 10 : 16;
        bCtx.lineWidth = type === 2 ? 14 : 24;

        for (let r = 0; r < 8; r++) {
            const offset = type === 1 && r % 2 !== 0 ? 64 : 0;
            for (let c = -1; c < 9; c++) {
                const rx = c * 128 + offset + (Math.random() - 0.5) * 12; // irregularidad fuerte
                const ry = r * 128 + (Math.random() - 0.5) * 12;

                ctx.strokeRect(rx, ry, 128, 128);
                bCtx.strokeRect(rx, ry, 128, 128);

                // Desgaste en bloques (Musgo, Moho, Ceniza)
                if (Math.random() > 0.6) {
                    ctx.fillStyle = 'rgba(10, 20, 10, 0.4)'; // Musgo oscuro
                    ctx.beginPath(); ctx.arc(rx + 10, ry + 10, 40, 0, Math.PI * 2); ctx.fill();
                }

                ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.4)';
                ctx.fillRect(rx, ry, 128, 128);

                // Altura del bloque (Puntas salientes vs hundidas)
                bCtx.fillStyle = `rgba(255,255,255, ${(0.4 + Math.random() * 0.6).toFixed(2)})`;
                bCtx.fillRect(rx + 8, ry + 8, 112, 112);

                // Grietas extras hiper-detalladas dentro del bloque
                const numCracks = Math.floor(Math.random() * 3);
                for (let k = 0; k < numCracks; k++) {
                    drawCrack(ctx, rx + Math.random() * 128, ry, 80 + Math.random() * 40, '#000', 5);
                    drawCrack(bCtx, rx + Math.random() * 128, ry, 80 + Math.random() * 40, '#0a0a0a', 12);
                }
            }
        }
    }

    // Aplicar Blur manual a la textura Base para mezclar los poros antes de devolverla
    ctx.globalAlpha = 0.3;
    ctx.drawImage(canvas, 1, 1);
    ctx.globalAlpha = 1.0;

    const dTex = new THREE.CanvasTexture(canvas); dTex.wrapS = dTex.wrapT = THREE.RepeatWrapping;
    dTex.colorSpace = THREE.SRGBColorSpace; // Importante para PBR Realista
    dTex.anisotropy = 16;

    const bTex = new THREE.CanvasTexture(bCanvas); bTex.wrapS = bTex.wrapT = THREE.RepeatWrapping;
    bTex.anisotropy = 16;

    return { diffuse: dTex, bump: bTex };
}

function createMountainNoiseTexture() {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 1024;
    const ctx = canvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;

    // Base de roca oscura abismal
    ctx.fillStyle = '#08090a';
    ctx.fillRect(0, 0, 1024, 1024);

    // Grano de roca profundo
    for (let i = 0; i < 40000; i++) {
        const px = Math.random() * 1024; const py = Math.random() * 1024;
        const size = Math.random() * 4 + 1;
        ctx.fillStyle = Math.random() > 0.7 ? 'rgba(30,35,45,0.4)' : 'rgba(0,0,0,0.8)';
        ctx.fillRect(px, py, size, size);
    }

    // Vetas de minerales oscuros o sedimentos
    ctx.lineWidth = 3;
    for (let r = 0; r < 150; r++) {
        ctx.beginPath();
        let currX = Math.random() * 1024; let currY = Math.random() * 1024;
        ctx.moveTo(currX, currY);
        for (let j = 0; j < 15; j++) {
            currX += (Math.random() - 0.5) * 60;
            currY += (Math.random() - 0.5) * 60;
            ctx.lineTo(currX, currY);
        }
        ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(20,25,35,0.5)' : 'rgba(10,12,15,0.7)';
        ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 16;
    return tex;
}

export function createVelvetTexture() {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.createImageData(256, 256);
    for (let i = 0; i < imgData.data.length; i += 4) {
        // Ruido fino, suave contraste
        const noise = 180 + Math.random() * 75;
        imgData.data[i] = noise; imgData.data[i + 1] = noise; imgData.data[i + 2] = noise; imgData.data[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
    const tex = new THREE.CanvasTexture(canvas); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; return tex;
}

export function initMaterials() {
    const tile = createStonePattern(0); tile.diffuse.repeat.set(4, 4); tile.bump.repeat.set(4, 4);
    const wall = createStonePattern(1); wall.diffuse.repeat.set(2, 2); wall.bump.repeat.set(2, 2);
    const float = createStonePattern(2); float.diffuse.repeat.set(3, 3); float.bump.repeat.set(3, 3);
    const floor = createStonePattern(3); floor.diffuse.repeat.set(3, 3); floor.bump.repeat.set(3, 3);
    const ceil = createStonePattern(4); ceil.diffuse.repeat.set(4, 4); ceil.bump.repeat.set(4, 4);
    const stair = createStonePattern(5); stair.diffuse.repeat.set(2, 4); stair.bump.repeat.set(2, 4);

    Materials.plaza.color.set('#d1d1d1'); // Aclaramos un poco para notar la suciedad
    Materials.wall.color.set('#c0c4cc');
    Materials.floor.color.set('#ffeedd'); // Tono cálido de antorcha extra

    // Incremento de relieve sustancial
    Materials.plaza.map = tile.diffuse; Materials.plaza.bumpMap = tile.bump; Materials.plaza.bumpScale = 1.6; Materials.plaza.roughness = 0.5;
    Materials.wall.map = wall.diffuse; Materials.wall.bumpMap = wall.bump; Materials.wall.bumpScale = 2.4; Materials.wall.roughness = 0.8;
    Materials.platform.map = float.diffuse; Materials.platform.bumpMap = float.bump; Materials.platform.bumpScale = 1.0; Materials.platform.roughness = 0.6; Materials.platform.metalness = 0.3;
    Materials.floor.map = floor.diffuse; Materials.floor.bumpMap = floor.bump; Materials.floor.bumpScale = 1.2; Materials.floor.roughness = 0.9;
    Materials.ceiling.map = ceil.diffuse; Materials.ceiling.bumpMap = ceil.bump; Materials.ceiling.bumpScale = 1.5;
    Materials.stairs.map = stair.diffuse; Materials.stairs.bumpMap = stair.bump; Materials.stairs.bumpScale = 1.4; Materials.stairs.roughness = 0.6;

    Materials.plaza.normalMap = null; Materials.plaza.roughnessMap = null; Materials.plaza.displacementMap = null;
    Materials.wall.normalMap = null; Materials.wall.roughnessMap = null; Materials.wall.displacementMap = null;
    Materials.platform.normalMap = null; Materials.platform.roughnessMap = null; Materials.platform.displacementMap = null;
    Materials.floor.normalMap = null; Materials.floor.roughnessMap = null; Materials.floor.displacementMap = null;
    Materials.ceiling.normalMap = null; Materials.ceiling.roughnessMap = null; Materials.ceiling.displacementMap = null;
    Materials.stairs.normalMap = null; Materials.stairs.roughnessMap = null; Materials.stairs.displacementMap = null;

    Materials.plaza.needsUpdate = true; Materials.wall.needsUpdate = true; Materials.platform.needsUpdate = true;
    Materials.floor.needsUpdate = true; Materials.ceiling.needsUpdate = true; Materials.stairs.needsUpdate = true;
}

export function setupEnvironment(scene: THREE.Scene) {
    scene.fog = new THREE.FogExp2('#b8cddb', 0.0015);

    scene.add(new THREE.AmbientLight('#191028', 0.05));
    scene.add(new THREE.HemisphereLight('#334466', '#111111', 0.08));

    const rgbeLoader = new RGBELoader();
    rgbeLoader.load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kloofendal_48d_partly_cloudy_puresky_1k.hdr', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
        scene.environment = texture;
        scene.environmentIntensity = 0.3; // Reducido para que no ilumine interiores
    });

    const sunLight = new THREE.DirectionalLight('#ffeedd', 3.5);
    sunLight.position.set(200, 300, -200); sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(4096, 4096);
    sunLight.shadow.camera.near = 0.5; sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -60; sunLight.shadow.camera.right = 60;
    sunLight.shadow.camera.top = 60; sunLight.shadow.camera.bottom = -60;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight); scene.add(sunLight.target);

    const bounceLight = new THREE.DirectionalLight('#4488ff', 0.5);
    bounceLight.position.set(0, -200, 0); scene.add(bounceLight);

    const mountainNoiseTex = createMountainNoiseTexture(); mountainNoiseTex.repeat.set(60, 60);
    const terrainGeo = new THREE.PlaneGeometry(6000, 6000, 250, 250); terrainGeo.rotateX(-Math.PI / 2);
    const positions = terrainGeo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i); const z = positions.getZ(i);

        // Generación de terreno tipo "Ridge noise" para montañas muy escarpadas y afiladas
        let nx = x / 500; let nz = z / 500;
        let y = (1.0 - Math.abs(Math.sin(nx))) * (1.0 - Math.abs(Math.sin(nz))) * 400;
        nx = x / 150; nz = z / 150;
        y += (1.0 - Math.abs(Math.sin(nx))) * (1.0 - Math.abs(Math.sin(nz))) * 150;
        y += (Math.random() - 0.5) * 25; // Ruido rocoso en la superficie

        // Hundir el centro masivamente para crear un abismo debajo del castillo
        const distToCenter = Math.sqrt(x * x + z * z);
        if (distToCenter < 500) {
            y -= (500 - distToCenter) * 1.5;
        }
        positions.setY(i, y);
    }
    terrainGeo.computeVertexNormals();
    const terrainMat = new THREE.MeshStandardMaterial({
        map: mountainNoiseTex,
        bumpMap: mountainNoiseTex,
        bumpScale: 5.0,
        roughness: 0.9,
        metalness: 0.2,
        flatShading: true // Le da el aspecto multifacetado a los picos escarpados
    });
    const mountains = new THREE.Mesh(terrainGeo, terrainMat);
    mountains.position.y = -350; // Bajamos el valle de las montañas
    mountains.receiveShadow = true;
    scene.add(mountains);

    // Cielo profundo (estrellas/partículas calidas)
    const particleCount = 4000; const particleGeo = new THREE.BufferGeometry(); const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        posArray[i * 3] = (Math.random() - 0.5) * 900;
        posArray[i * 3 + 1] = -60 + Math.random() * 400;
        posArray[i * 3 + 2] = (Math.random() - 0.5) * 900;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({ size: 1.2, color: '#ffd8b0', transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
    const skyParticles = new THREE.Points(particleGeo, particleMat); scene.add(skyParticles);

    // Cenizas azules
    const ashGeo = new THREE.BufferGeometry(); const ashArr = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) {
        ashArr[i * 3] = (Math.random() - 0.5) * 400;
        ashArr[i * 3 + 1] = -10 + Math.random() * 120;
        ashArr[i * 3 + 2] = (Math.random() - 0.5) * 400;
    }
    ashGeo.setAttribute('position', new THREE.BufferAttribute(ashArr, 3));
    const ashMat = new THREE.PointsMaterial({ size: 0.8, color: '#88aaff', transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });
    const ashParticles = new THREE.Points(ashGeo, ashMat); scene.add(ashParticles);

    // Monolitos de fondo
    const monolithGeo = new THREE.CylinderGeometry(15, 10, 400, 6);
    for (let m = 0; m < 15; m++) {
        const angle = (m / 15) * Math.PI * 2; const dist = 350 + Math.random() * 150;
        const monolith = new THREE.Mesh(monolithGeo, Materials.wall);
        monolith.position.set(Math.cos(angle) * dist, -100 + Math.random() * 250, -130 + Math.sin(angle) * dist);
        monolith.rotation.y = Math.random() * Math.PI; monolith.castShadow = true; monolith.receiveShadow = true; scene.add(monolith);
    }

    // Atmosféricas
    const ptsGeo = new THREE.BufferGeometry(); const pts = new Float32Array(120 * 3);
    for (let i = 0; i < 120; i++) { pts[i * 3] = (Math.random() - 0.5) * 4; pts[i * 3 + 1] = Math.random() * 1.2 - 0.2; pts[i * 3 + 2] = (Math.random() - 0.5) * 4; }
    ptsGeo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    const ptsMat = new THREE.PointsMaterial({ color: '#ffdccc', size: 0.06, transparent: true, opacity: 0.6, depthWrite: false });
    const atmosphericParticles = new THREE.Points(ptsGeo, ptsMat); atmosphericParticles.position.y = 0.2; scene.add(atmosphericParticles);

    return { atmosphericParticles, sunLight };
}

export function createChain(scene: THREE.Scene, x: number, y: number, z: number) {
    const chainGroup = new THREE.Group(); const linkGeo = new THREE.TorusGeometry(3, 1, 12, 24);
    for (let i = 0; i < 18; i++) {
        const link = new THREE.Mesh(linkGeo, Materials.obsidian); link.position.set(0, -i * 5.5, 0);
        if (i % 2 === 0) link.rotation.y = Math.PI / 2; link.castShadow = true; link.receiveShadow = true; chainGroup.add(link);
    }
    chainGroup.position.set(x, y, z); scene.add(chainGroup);
}

export function createWideBridge(scene: THREE.Scene, collidables: THREE.Object3D[], zStart: number, zEnd: number) {
    const length = Math.abs(zStart - zEnd); const zMin = Math.min(zStart, zEnd); const zCenter = zMin + length / 2;
    const bGroup = new THREE.Group();
    // Suelo ensanchado a 24 unidades para empalmar con el puente medieval (que mide 24 de ancho)
    const floor = new THREE.Mesh(new THREE.BoxGeometry(24, 2, length), Materials.plaza);
    floor.position.set(0, -1.08, 0); floor.receiveShadow = true; bGroup.add(floor);
    // Muros laterales alineados con las barandas del puente medieval (±11.7)
    const wallL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4, length), Materials.wall);
    wallL.position.set(-11.4, 1, 0); wallL.castShadow = true; wallL.receiveShadow = true; bGroup.add(wallL);
    const wallR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4, length), Materials.wall);
    wallR.position.set(11.4, 1, 0); wallR.castShadow = true; wallR.receiveShadow = true; bGroup.add(wallR);
    // Almenas en los muros
    const merlonCount = Math.floor(length / 8);
    for (let m = 0; m < merlonCount; m++) {
        if (m % 2 === 0) continue;
        const mz = -length / 2 + m * (length / merlonCount) + (length / merlonCount) * 0.5;
        const merL = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 2.5), Materials.wall);
        merL.position.set(-11.4, 3.2, mz); bGroup.add(merL);
        const merR = merL.clone(); merR.position.set(11.4, 3.2, mz); bGroup.add(merR);
    }
    // Pilones con faros cada ~18 unidades
    const pilonCount = Math.max(2, Math.floor(length / 18));
    for (let p = 0; p < pilonCount; p++) {
        const pz = -length / 2 + (p + 0.5) * (length / pilonCount);
        [-11.4, 11.4].forEach((px) => {
            const pilon = new THREE.Mesh(new THREE.BoxGeometry(2, 7, 2), Materials.wall);
            pilon.position.set(px, 2.5, pz); pilon.castShadow = true; bGroup.add(pilon);
            const lanternBody = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7),
                new THREE.MeshStandardMaterial({ color: '#ffaa33', emissive: '#cc5500', emissiveIntensity: 1.5, roughness: 0.3 }));
            lanternBody.position.set(px < 0 ? px + 1.2 : px - 1.2, 6.4, pz); bGroup.add(lanternBody);
        });
    }
    bGroup.position.set(0, 0, zCenter); scene.add(bGroup);
    // Colisionadores globales del grupo ajustados a ancho 24 (match puente medieval)
    const floorCol = new THREE.Mesh(new THREE.BoxGeometry(24, 2, length), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
    floorCol.position.set(0, -1.08, zCenter); collidables.push(floorCol); scene.add(floorCol);

    // Colisionadores de muros a ±11.7 (mismo X que barandas del puente medieval)
    const wallLCol = new THREE.Mesh(new THREE.BoxGeometry(0.6, 8, length), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
    wallLCol.position.set(-11.7, 1, zCenter); collidables.push(wallLCol); scene.add(wallLCol);
    const wallRCol = wallLCol.clone(); wallRCol.position.set(11.7, 1, zCenter); collidables.push(wallRCol); scene.add(wallRCol);
}

export function createGiantRotunda(scene: THREE.Scene, collidables: THREE.Object3D[], checkpoints: any[], animatedCrystals: any[], zCenter: number) {
    const group = new THREE.Group();
    // Plataforma base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(26, 30, 4, 64), Materials.plaza);
    base.position.set(0, -2, 0); base.receiveShadow = true; group.add(base);
    // Anillo interior elevado
    const innerRing = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 1.5, 48), Materials.platform);
    innerRing.position.set(0, 0.75, 0); innerRing.receiveShadow = true; innerRing.castShadow = true; group.add(innerRing);
    // Rueda de runas en el suelo
    const runeFloor = new THREE.Mesh(new THREE.RingGeometry(2, 9.5, 48), Materials.runeRing);
    runeFloor.rotation.x = -Math.PI / 2; runeFloor.position.y = 1.6; group.add(runeFloor);
    // Pilares del perimetro con capiteles
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const px = Math.cos(angle) * 22; const pz = Math.sin(angle) * 22;
        const height = 12 + (i % 3) * 3;
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(2.4, height, 2.4), Materials.wall);
        pillar.position.set(px, height / 2 - 2, pz); pillar.castShadow = true; pillar.receiveShadow = true;
        // Capitel
        const capital = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.2, 3.5), Materials.wall);
        capital.position.y = height / 2 + 0.6 - 2; pillar.add(capital);
        group.add(pillar);
        // Cristal en la base de cada pilar alternado
        if (i % 2 === 0) {
            const crystalMini = new THREE.Mesh(new THREE.OctahedronGeometry(0.7, 0),
                new THREE.MeshStandardMaterial({ color: '#00e5ff', emissive: '#005588', emissiveIntensity: 1.2, roughness: 0.2 }));
            crystalMini.position.set(px * 0.85, 1.5, pz * 0.85); group.add(crystalMini);
            animatedCrystals.push({ mesh: crystalMini, baseY: 1.5, speedOffset: i });
        }
    }
    // Luz interior suave
    const innerLight = new THREE.PointLight('#0055cc', 5, 40);
    innerLight.position.set(0, 4, 0); group.add(innerLight);
    // Cristal invertido bajo la plataforma (pequeno)
    const bottomCrystal = new THREE.Mesh(new THREE.ConeGeometry(3, 10, 6),
        new THREE.MeshStandardMaterial({ color: '#0066aa', emissive: '#003366', emissiveIntensity: 0.8, roughness: 0.2, transparent: true, opacity: 0.6 }));
    bottomCrystal.position.set(0, -7, 0); bottomCrystal.rotation.x = Math.PI; group.add(bottomCrystal);
    group.position.set(0, 0, zCenter); scene.add(group);
    const collider = new THREE.Mesh(new THREE.CylinderGeometry(26, 26, 4, 64), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
    collider.position.copy(group.position); collider.position.y -= 2; collidables.push(collider); scene.add(collider);
    checkpoints.push({ pos: new THREE.Vector3(0, 4, zCenter), radius: 30 });
}

export function createSecretChamber(scene: THREE.Scene, collidables: THREE.Object3D[], animatedCrystals: any[], orbs: any[], zCenter: number) {
    const secretGroup = new THREE.Group();

    // Balcón oculto (plataforma para aterrizar al dejarse caer)
    const ledge = new THREE.Mesh(new THREE.BoxGeometry(12, 2, 8), Materials.obsidian);
    ledge.position.set(24, -12, 0); ledge.receiveShadow = true; ledge.castShadow = true;
    secretGroup.add(ledge);
    const ledgeCol = new THREE.Mesh(new THREE.BoxGeometry(12, 2, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
    ledgeCol.position.copy(ledge.position); collidables.push(ledgeCol); secretGroup.add(ledgeCol);

    // Pasillo de acceso curvo
    const hallway = new THREE.Mesh(new THREE.BoxGeometry(6, 8, 18), Materials.wall);
    hallway.position.set(16, -12, 0); hallway.castShadow = true; secretGroup.add(hallway);

    // Cámara principal (cueva de obsidiana)
    const chamberFloor = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 2, 32), Materials.obsidian);
    chamberFloor.position.set(0, -16, 0); chamberFloor.receiveShadow = true; secretGroup.add(chamberFloor);
    const chamberFloorCol = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 2, 32), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
    chamberFloorCol.position.copy(chamberFloor.position); collidables.push(chamberFloorCol); secretGroup.add(chamberFloorCol);

    // Techo abovedado
    const chamberCeiling = new THREE.Mesh(new THREE.SphereGeometry(14, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), Materials.wall);
    chamberCeiling.position.set(0, -15, 0); chamberCeiling.rotation.x = Math.PI; secretGroup.add(chamberCeiling);

    // Muros cilíndricos
    const chamberWall = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 12, 32, 1, true), Materials.wall);
    chamberWall.position.set(0, -21, 0); secretGroup.add(chamberWall);

    // Cristales luminosos internos
    const crystalPositions = [
        [-6, -14, -5], [6, -14, -5], [-6, -14, 5], [6, -14, 5], [0, -14, -8], [0, -14, 8]
    ];
    crystalPositions.forEach((pos, i) => {
        const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.8, 0),
            new THREE.MeshStandardMaterial({ color: '#00e5ff', emissive: '#0088cc', emissiveIntensity: 3.0, roughness: 0.0 }));
        crystal.position.set(pos[0], pos[1], pos[2]); secretGroup.add(crystal);
        animatedCrystals.push({ mesh: crystal, baseY: pos[1], speedOffset: i * 3 + 50 });
    });

    // Luz ambiental de la cueva (azul frío)
    const caveLight = new THREE.PointLight('#0088ff', 6, 30);
    caveLight.position.set(0, -14, 0); secretGroup.add(caveLight);
    const caveLight2 = new THREE.PointLight('#004466', 3, 20);
    caveLight2.position.set(0, -20, 0); secretGroup.add(caveLight2);

    // Orbe secreto de Lore en el centro de la cámara
    createOrb(scene, orbs, 0, -10, zCenter, 'lore');

    secretGroup.position.set(0, 0, zCenter);
    scene.add(secretGroup);
}

export function createPlatform(scene: THREE.Scene, collidables: THREE.Object3D[], movingPlatforms: any[], checkpoints: any[], animatedCrystals: any[], x: number, y: number, z: number, size: number, moveType = -1, isCheckpoint = false) {
    const group = new THREE.Group();
    const slab = new THREE.Mesh(new THREE.BoxGeometry(size, 2, size), isCheckpoint ? Materials.plaza : Materials.platform);
    slab.receiveShadow = true; slab.castShadow = true; group.add(slab);
    // Anillo de runas en la superficie
    const runeRing = new THREE.Mesh(new THREE.RingGeometry(size / 4, size / 4 + 0.6, 24), Materials.runeRing);
    runeRing.rotation.x = -Math.PI / 2; runeRing.position.y = 1.02; group.add(runeRing);
    if (!isCheckpoint) {
        // Plataforma normal: borde coloreado segun tipo
        const edgeColor = moveType === 0 ? '#00ff88' : moveType === 1 ? '#ff8800' : '#aa44ff';
        const edgeMat = new THREE.MeshStandardMaterial({ color: edgeColor, emissive: edgeColor, emissiveIntensity: 1.8, roughness: 0.2 });
        const edgeMesh = new THREE.Mesh(new THREE.BoxGeometry(size + 0.3, 0.3, size + 0.3), edgeMat);
        edgeMesh.position.y = 1.15; group.add(edgeMesh);
    } else {
        // Plataforma checkpoint: 4 pilares con gemas en las esquinas
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx2, sz2]) => {
            const pilar = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 2), Materials.wall);
            pilar.position.set((size / 2 - 1.5) * sx2, 3, (size / 2 - 1.5) * sz2); pilar.castShadow = true; group.add(pilar);
            const capstone = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.2, 2.8), Materials.obsidian);
            capstone.position.set((size / 2 - 1.5) * sx2, 8, (size / 2 - 1.5) * sz2); group.add(capstone);
            const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.9, 0),
                new THREE.MeshStandardMaterial({ color: '#00e5ff', emissive: '#0077cc', emissiveIntensity: 3.5, roughness: 0.0 }));
            gem.position.set((size / 2 - 1.5) * sx2, 9.5, (size / 2 - 1.5) * sz2); group.add(gem);
            animatedCrystals.push({ mesh: gem, baseY: 9.5, speedOffset: Math.abs(sx2 + sz2 * 7) + x });
        });
        checkpoints.push({ pos: new THREE.Vector3(x, y + 4, z), radius: 20 });
    }
    // Cristal flotante bajo la plataforma
    const bottomCrystal = new THREE.Mesh(new THREE.ConeGeometry(size / 4, size * 0.6, 5),
        new THREE.MeshStandardMaterial({ color: '#00e5ff', emissive: '#0077aa', emissiveIntensity: 2.0, roughness: 0.1, transparent: true, opacity: 0.8 }));
    bottomCrystal.position.set(0, -(size / 4) - 1, 0); bottomCrystal.rotation.x = Math.PI; group.add(bottomCrystal);
    // Luz puntual bajo la plataforma
    const underLight = new THREE.PointLight('#00aaff', 3, size * 2.5);
    underLight.position.set(0, -3, 0); group.add(underLight);
    group.position.set(x, y, z); scene.add(group);
    const collider = new THREE.Mesh(new THREE.BoxGeometry(size, 2, size), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
    collider.position.copy(group.position); collidables.push(collider); scene.add(collider);
    if (moveType >= 0) movingPlatforms.push({ group, collider, type: moveType, baseX: x, baseY: y, baseZ: z, deltaX: 0, deltaY: 0, deltaZ: 0 });
}

export function createOrb(scene: THREE.Scene, orbs: any[], x: number, y: number, z: number, type: 'jump' | 'triple_jump' | 'lore' | 'normal' = 'normal') {
    const orbGroup = new THREE.Group(); orbGroup.position.set(x, y + 5, z); scene.add(orbGroup);

    let color = '#00e5ff'; let emissive = '#0077cc';
    if (type === 'jump') { color = '#80ff80'; emissive = '#22cc22'; }
    else if (type === 'triple_jump') { color = '#ff80ff'; emissive = '#cc22cc'; }
    else if (type === 'lore') { color = '#ffaa00'; emissive = '#cc7700'; }

    const customOrbMat = new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: 2.0, roughness: 0.0, metalness: 0.1 });
    const orb = new THREE.Mesh(new THREE.OctahedronGeometry(1.8, 2), customOrbMat);
    orb.castShadow = true; orbGroup.add(orb);

    // Anillo de brillo alrededor del orbe
    const haloMat = new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: 2.0, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
    const halo = new THREE.Mesh(new THREE.RingGeometry(2.2, 3.0, 32), haloMat);
    halo.rotation.x = -Math.PI / 2; orbGroup.add(halo);
    const halo2 = halo.clone(); halo2.rotation.x = Math.PI / 4; orbGroup.add(halo2);
    const light = new THREE.PointLight(color, 8, 28); orbGroup.add(light);
    orbs.push({ mesh: orbGroup as any, light: light, type, collected: false });
}

export function createBlackKnightFortress(scene: THREE.Scene, collidables: THREE.Object3D[], _animatedCrystals: any[], fireEmitters: any[], mistEmitters: any[], mixers: THREE.AnimationMixer[], finalPx: number, finalPy: number, finalPz: number, bossZOffset: number) {
    const bossGroup = new THREE.Group();
    bossGroup.position.set(finalPx, finalPy, finalPz + bossZOffset); scene.add(bossGroup);

    const width = 140;
    const depth = 220;
    const height = 90;

    // 1. Suelo Gigante
    const floor = new THREE.Mesh(new THREE.BoxGeometry(width, 2, depth), Materials.obsidian);
    floor.position.set(0, -1, 0); floor.receiveShadow = true; bossGroup.add(floor);
    const floorCol = new THREE.Mesh(new THREE.BoxGeometry(width, 2, depth), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
    floorCol.position.copy(floor.position); collidables.push(floorCol); bossGroup.add(floorCol);

    // 2. Muros Perimetrales modulares (para permitir luz natural), Muro Frontal y Techo
    const wallThick = 6;

    // Base y tope de los muros laterales
    const baseHeight = 30;
    const topHeight = 25; // Hueco = 90 - 30 - 25 = 35

    const wLeftBase = new THREE.Mesh(new THREE.BoxGeometry(wallThick, baseHeight, depth), Materials.wall);
    wLeftBase.position.set(-width / 2, baseHeight / 2, 0); wLeftBase.castShadow = true; bossGroup.add(wLeftBase);
    const wRightBase = new THREE.Mesh(new THREE.BoxGeometry(wallThick, baseHeight, depth), Materials.wall);
    wRightBase.position.set(width / 2, baseHeight / 2, 0); wRightBase.castShadow = true; bossGroup.add(wRightBase);

    const wLeftTop = new THREE.Mesh(new THREE.BoxGeometry(wallThick, topHeight, depth), Materials.wall);
    wLeftTop.position.set(-width / 2, height - topHeight / 2, 0); wLeftTop.castShadow = true; bossGroup.add(wLeftTop);
    const wRightTop = new THREE.Mesh(new THREE.BoxGeometry(wallThick, topHeight, depth), Materials.wall);
    wRightTop.position.set(width / 2, height - topHeight / 2, 0); wRightTop.castShadow = true; bossGroup.add(wRightTop);

    const wBack = new THREE.Mesh(new THREE.BoxGeometry(width + wallThick * 2, height, wallThick), Materials.wall);
    wBack.position.set(0, height / 2, -depth / 2); wBack.castShadow = true; bossGroup.add(wBack);

    // Muro Frontal (Con arco gigante de entrada en el medio)
    const wFrontL = new THREE.Mesh(new THREE.BoxGeometry(width / 2 - 20, height, wallThick), Materials.wall);
    wFrontL.position.set(-width / 4 - 10, height / 2, depth / 2); wFrontL.castShadow = true; bossGroup.add(wFrontL);
    const wFrontR = new THREE.Mesh(new THREE.BoxGeometry(width / 2 - 20, height, wallThick), Materials.wall);
    wFrontR.position.set(width / 4 + 10, height / 2, depth / 2); wFrontR.castShadow = true; bossGroup.add(wFrontR);
    const wFrontTop = new THREE.Mesh(new THREE.BoxGeometry(40, height - 40, wallThick), Materials.wall);
    wFrontTop.position.set(0, height - (height - 40) / 2, depth / 2); wFrontTop.castShadow = true; bossGroup.add(wFrontTop);

    // Techo colosal para tapar la luz del sol
    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(width + wallThick * 2, wallThick, depth + wallThick * 2), Materials.wall);
    ceiling.position.set(0, height, 0); bossGroup.add(ceiling);

    // 2.2 Aberturas Góticas para Luz Natural (Muros Laterales)
    const winWidth = 14;
    const segmentWidth = 30 - winWidth;
    const wallSegmentHeight = height - baseHeight - topHeight;
    for (let z = -depth / 2 + 15; z < depth / 2; z += 30) {
        [-width / 2, width / 2].forEach(wx => {
            const seg = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallSegmentHeight, segmentWidth), Materials.wall);
            seg.position.set(wx, baseHeight + wallSegmentHeight / 2, z);
            seg.castShadow = true; bossGroup.add(seg);
        });

        const windowZ = z + 15;
        if (windowZ < depth / 2) {
            // Barrotes para la ventana abierta
            [-width / 2, width / 2].forEach(wx => {
                const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, wallSegmentHeight, 8), Materials.obsidian);
                bar.position.set(wx, baseHeight + wallSegmentHeight / 2, windowZ);
                bar.castShadow = true; bossGroup.add(bar);
            });
        }
    }

    // Colisionadores de Muros (Cajas enteras invisibles en los laterales para evitar que el jugador salte por la ventana)
    const colLeft = new THREE.Mesh(new THREE.BoxGeometry(wallThick, height, depth), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
    colLeft.position.set(-width / 2, height / 2, 0); collidables.push(colLeft); bossGroup.add(colLeft);
    const colRight = new THREE.Mesh(new THREE.BoxGeometry(wallThick, height, depth), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
    colRight.position.set(width / 2, height / 2, 0); collidables.push(colRight); bossGroup.add(colRight);

    [wBack, wFrontL, wFrontR].forEach(w => {
        const col = new THREE.Mesh(w.geometry, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
        col.position.copy(w.position); collidables.push(col); bossGroup.add(col);
    });

    // 2.5 Alfombra Real y Detalles de Suelo
    const carpetWidth = 30;
    const carpetDepth = depth - 30; // Casi todo el largo

    const velvetTex = createVelvetTexture();
    velvetTex.repeat.set(10, 50);

    const carpet = new THREE.Mesh(
        new THREE.PlaneGeometry(carpetWidth, carpetDepth),
        new THREE.MeshStandardMaterial({
            color: '#440011',
            map: velvetTex,
            roughnessMap: velvetTex,
            roughness: 0.9,
            metalness: 0.1
        })
    );
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(0, 0.1, 10); // Desfasado un poco hacia la entrada
    carpet.receiveShadow = true;
    bossGroup.add(carpet);

    // Borde dorado de la alfombra
    const trimMat = new THREE.MeshStandardMaterial({ color: '#aa8800', roughness: 0.4, metalness: 0.8 });
    const trimL = new THREE.Mesh(new THREE.PlaneGeometry(0.8, carpetDepth), trimMat);
    trimL.rotation.x = -Math.PI / 2; trimL.position.set(-carpetWidth / 2 - 0.4, 0.15, 10); trimL.receiveShadow = true; bossGroup.add(trimL);
    const trimR = new THREE.Mesh(new THREE.PlaneGeometry(0.8, carpetDepth), trimMat);
    trimR.rotation.x = -Math.PI / 2; trimR.position.set(carpetWidth / 2 + 0.4, 0.15, 10); trimR.receiveShadow = true; bossGroup.add(trimR);

    // 2.6 Niebla Carmesí a ras de suelo (Distribución circular/elíptica para que no sea cuadrada)
    const mistCount = 1800;
    const mistGeo = new THREE.BufferGeometry();
    const mistPos = new Float32Array(mistCount * 3);
    for (let i = 0; i < mistCount; i++) {
        // Distribuimos en un radio ovalado para evitar el contorno cuadrado de la sala
        const angle = Math.random() * Math.PI * 2;
        const radiusX = Math.sqrt(Math.random()) * (width / 2 - 8);
        const radiusZ = Math.sqrt(Math.random()) * (depth / 2 - 20);
        mistPos[i * 3] = Math.cos(angle) * radiusX;
        mistPos[i * 3 + 1] = 0.5 + Math.random() * 3.0; // Altura baja irregular
        mistPos[i * 3 + 2] = Math.sin(angle) * radiusZ;
    }
    mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPos, 3));

    // Textura de partícula circular suave
    const mistCanvas = document.createElement('canvas'); mistCanvas.width = 64; mistCanvas.height = 64;
    const mistCtx = mistCanvas.getContext('2d')!;
    const mistGrad = mistCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    mistGrad.addColorStop(0, 'rgba(255, 30, 40, 0.6)');
    mistGrad.addColorStop(0.4, 'rgba(150, 10, 20, 0.2)');
    mistGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    mistCtx.fillStyle = mistGrad; mistCtx.fillRect(0, 0, 64, 64);
    const mistTex = new THREE.CanvasTexture(mistCanvas);

    const mistMat = new THREE.PointsMaterial({
        map: mistTex,
        size: 18,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const mistPoints = new THREE.Points(mistGeo, mistMat);
    bossGroup.add(mistPoints);
    mistEmitters.push({ points: mistPoints, timeOffset: 0 });

    // Armas y Escombros esparcidos en la nave
    for (let r = 0; r < 15; r++) {
        // Espadas clavadas gigantes
        const swordZ = (Math.random() - 0.5) * (depth - 60);
        const swordX = (Math.random() > 0.5 ? 1 : -1) * (16 + Math.random() * 8);
        const sword = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 1.5), Materials.obsidian);
        sword.position.set(swordX, 2, swordZ);
        sword.rotation.set((Math.random() - 0.5) * 0.5, Math.random() * Math.PI, (Math.random() - 0.5) * 0.5);
        sword.castShadow = true; bossGroup.add(sword);

        // Escombros
        const debris = new THREE.Mesh(new THREE.DodecahedronGeometry(1 + Math.random() * 2), Materials.wall);
        debris.position.set(swordX * 1.5, 0, swordZ + (Math.random() - 0.5) * 10);
        debris.rotation.set(Math.random(), Math.random(), Math.random());
        debris.castShadow = true; bossGroup.add(debris);
    }

    // 3. Columnata Tenebrosa Catedralicia, Braseros y Colgantes
    const colCount = 8;
    for (let i = 0; i < colCount; i++) {
        const cz = (depth / 2) - 20 - (i * (depth / colCount));

        // Candelabro central colgando del techo en cada segmento
        const chBase = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 1, 8), Materials.obsidian);
        chBase.position.set(0, height - 35, cz); bossGroup.add(chBase);
        const chChain = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 35, 6), Materials.obsidian);
        chChain.position.set(0, height - 17.5, cz); bossGroup.add(chChain);

        [-25, 25].forEach(cx => {
            // Pilar
            const pillar = new THREE.Mesh(new THREE.BoxGeometry(8, height, 8), Materials.obsidian);
            pillar.position.set(cx, height / 2, cz); pillar.castShadow = true; bossGroup.add(pillar);
            // Colisionador Pilar
            const pCol = new THREE.Mesh(new THREE.BoxGeometry(8, height, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
            pCol.position.copy(pillar.position); collidables.push(pCol); bossGroup.add(pCol);

            // Estandartes de Guerra rasgados
            const banner = new THREE.Mesh(new THREE.PlaneGeometry(4, 25), new THREE.MeshStandardMaterial({ color: '#220000', roughness: 1.0, side: THREE.DoubleSide }));
            const dir = Math.sign(cx);
            banner.position.set(cx - dir * 4.1, height - 25, cz);
            banner.rotation.y = dir === 1 ? -Math.PI / 2 : Math.PI / 2;
            bossGroup.add(banner);

            // Arco Gótico Transversal Superior (conectando izquierda con derecha)
            if (cx === -25) {
                const arch = new THREE.Mesh(new THREE.BoxGeometry(50, 4, 8), Materials.wall);
                arch.position.set(0, height - 20, cz); arch.castShadow = true; bossGroup.add(arch);
            }

            // Brasero a los pies del pilar
            const brazierDir = Math.sign(cx);
            const brazierX = cx - (brazierDir * 6);
            const brazier = new THREE.Mesh(new THREE.CylinderGeometry(2, 1, 3, 6), Materials.wall);
            brazier.position.set(brazierX, 1.5, cz); bossGroup.add(brazier);

            // Fuego realista
            createRealisticFire(brazierX, 3.5, cz, 1.8, fireEmitters, bossGroup, 'fortress_brazier');
            // Luz de ambiente oscura y rojiza
            const pLight = new THREE.PointLight('#ff3311', 1.5, 70);
            pLight.position.set(brazierX, 5, cz); bossGroup.add(pLight);
        });
    }

    // 4. Trono del Caballero Negro y Escaleras
    const throneBaseZ = -depth / 2 + 35;
    const throneGroup = new THREE.Group();
    throneGroup.position.set(0, 0, throneBaseZ);

    for (let s = 0; s < 8; s++) {
        const sw = 40 - (s * 3);
        const sd = 25 - (s * 1.5);
        const sh = 1.5;
        const sy = (s * sh) + sh / 2;
        const sz = s * 2;
        const step = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, sd), Materials.plaza);
        step.position.set(0, sy, sz); step.castShadow = true; step.receiveShadow = true; throneGroup.add(step);

        const sCol = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, sd), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
        sCol.position.copy(step.position); collidables.push(sCol); throneGroup.add(sCol);
    }

    const throneZ = 6;
    const tY = 8 * 1.5;

    // Base extra para el trono
    const thronePedestal = new THREE.Mesh(new THREE.BoxGeometry(20, 2, 16), Materials.obsidian);
    thronePedestal.position.set(0, tY + 1, throneZ); thronePedestal.castShadow = true; throneGroup.add(thronePedestal);
    const pedCol = new THREE.Mesh(new THREE.BoxGeometry(20, 2, 16), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
    pedCol.position.copy(thronePedestal.position); collidables.push(pedCol); throneGroup.add(pedCol);

    const throneSeat = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 6), Materials.obsidian);
    throneSeat.position.set(0, tY + 3, throneZ); throneSeat.castShadow = true; throneGroup.add(throneSeat);
    const seatCol = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
    seatCol.position.copy(throneSeat.position); collidables.push(seatCol); throneGroup.add(seatCol);

    // Baldaquino Colosal Trasero
    const baldaquino = new THREE.Mesh(new THREE.BoxGeometry(24, 40, 4), Materials.obsidian);
    baldaquino.position.set(0, tY + 22, throneZ - 6); baldaquino.castShadow = true; throneGroup.add(baldaquino);
    const baldCol = new THREE.Mesh(new THREE.BoxGeometry(24, 40, 4), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
    baldCol.position.copy(baldaquino.position); collidables.push(baldCol); throneGroup.add(baldCol);

    const throneBack = new THREE.Mesh(new THREE.BoxGeometry(8, 20, 2), new THREE.MeshStandardMaterial({ color: '#110000', roughness: 0.1, metalness: 0.8 }));
    throneBack.position.set(0, tY + 13, throneZ - 3.5); throneBack.castShadow = true; throneGroup.add(throneBack);
    // El respaldo del trono se cobija dentro del baldaquino, no necesita colisionador propio

    // 2 Estatuas Colosales Flanqueando
    [-18, 18].forEach(ex => {
        const statueBase = new THREE.Mesh(new THREE.BoxGeometry(6, 25, 6), Materials.wall);
        statueBase.position.set(ex, tY + 12.5, throneZ); statueBase.castShadow = true; throneGroup.add(statueBase);
        const statueHead = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 16), Materials.obsidian);
        statueHead.position.set(ex, tY + 28, throneZ); throneGroup.add(statueHead);

        // Ojo Cíclope Brillante
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), new THREE.MeshStandardMaterial({ color: '#ff2200', emissive: '#ff0000', emissiveIntensity: 10 }));
        eye.position.set(ex, tY + 28, throneZ + 2.5); throneGroup.add(eye);
    });

    // Jefe: Golem Animado Colosal
    const loader = new GLTFLoader();
    loader.load('/assets/models/enemies/low_poly_animated_simple_golem.glb', (gltf) => {
        const bossModel = gltf.scene;
        // Escalar enormemente para que sirva de jefe final
        bossModel.scale.set(6, 6, 6);
        bossModel.position.set(0, tY + 2, throneZ);
        // Mirar hacia adelante
        bossModel.rotation.y = Math.PI;

        // Sombras y Materiales oscuros
        bossModel.traverse((node: any) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                if (node.material) {
                    const originalColor = node.material.color ? node.material.color.clone() : new THREE.Color('#333333');
                    node.material = new THREE.MeshStandardMaterial({
                        color: originalColor,
                        roughness: 0.6,
                        metalness: 0.8,
                        envMapIntensity: 0.5,
                        emissive: '#ff0011',
                        emissiveIntensity: 0.1
                    });
                }
            }
        });

        // Colisionador Cilíndrico gigante para el Golem
        const golemCol = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 20, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
        golemCol.position.copy(bossModel.position);
        golemCol.position.y += 10;
        collidables.push(golemCol);
        throneGroup.add(golemCol);

        throneGroup.add(bossModel);

        // Animación Idle del Boss
        if (gltf.animations && gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(bossModel);
            // Intentar buscar una animación "Idle" o reproducir la primera disponible
            const idleClip = gltf.animations.find(a => a.name.toLowerCase().includes('idle')) || gltf.animations[0];
            const action = mixer.clipAction(idleClip);
            action.play();
            mixers.push(mixer);
        }
    });

    // Aura inmensa carmesí bajo sus pies
    const throneAura = new THREE.PointLight('#ff0033', 15, 80);
    throneAura.position.set(0, tY + 10, throneZ + 5);
    throneGroup.add(throneAura);

    // Antorchas y cálices masivos delante de estatuas
    [-10, 10].forEach(bx => {
        const fPillar = new THREE.Mesh(new THREE.BoxGeometry(3, 16, 3), Materials.wall);
        fPillar.position.set(bx, tY + 8, throneZ + 8); fPillar.castShadow = true; throneGroup.add(fPillar);

        // Cáliz o copa del fuego
        const chalice = new THREE.Mesh(new THREE.CylinderGeometry(4, 2, 2, 8), Materials.obsidian);
        chalice.position.set(bx, tY + 17, throneZ + 8); bossGroup.add(chalice);

        createRealisticFire(bx, tY + 18, throneZ + 8, 3.5, fireEmitters, throneGroup, 'throne_fire');
        const bLight = new THREE.PointLight('#ff5522', 2, 90);
        bLight.position.set(bx, tY + 20, throneZ + 8); throneGroup.add(bLight);
    });

    bossGroup.add(throneGroup);
}

export function createStartingFortress(scene: THREE.Scene, collidables: THREE.Object3D[], _checkpoints: any[], _animatedCrystals: any[], fireEmitters: any[], gateObjects: any, zCenter: number) {
    const group = new THREE.Group(); const size = 50;

    // 1. SUELO LIMPIO
    const floor = new THREE.Mesh(new THREE.BoxGeometry(size, 2, size), Materials.plaza);
    floor.position.set(0, -1, 0); floor.receiveShadow = true; group.add(floor);

    // 2. MUROS BASE MASIVOS (40 metros para 3 pisos)
    const wallH = 40; const wallT = 4;

    // Función helper para muros externos y sus colisiones de cámara
    const createOuterWall = (w: number, d: number, px: number, py: number, pz: number) => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, d), Materials.wall);
        wall.position.set(px, py, pz); wall.castShadow = true; wall.receiveShadow = true; group.add(wall);

        const wallCol = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, d), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
        wallCol.position.copy(wall.position); collidables.push(wallCol); group.add(wallCol);
    };

    // Ajustamos la brecha central de la muralla a 22 metros (-11 a 11) para que el puente de 18m encaje 
    // holgadamente y el jugador no choque con las aristas invisibles al bordear la baranda.
    createOuterWall(14, wallT, -18, wallH / 2 - 1, -size / 2); // wallN1
    createOuterWall(14, wallT, 18, wallH / 2 - 1, -size / 2);  // wallN2
    createOuterWall(size, wallT, 0, wallH / 2 - 1, size / 2);  // wallS
    createOuterWall(wallT, size, size / 2, wallH / 2 - 1, 0);  // wallE
    createOuterWall(wallT, size, -size / 2, wallH / 2 - 1, 0); // wallW

    // 3. CONTRAFUERTES
    for (let i = -15; i <= 15; i += 15) {
        let buttressS = new THREE.Mesh(new THREE.BoxGeometry(3, wallH - 2, 4), Materials.wall); buttressS.position.set(i, wallH / 2 - 2, size / 2 - 2); buttressS.castShadow = true; buttressS.receiveShadow = true; group.add(buttressS);
        let buttressE = new THREE.Mesh(new THREE.BoxGeometry(4, wallH - 2, 3), Materials.wall); buttressE.position.set(size / 2 - 2, wallH / 2 - 2, i); buttressE.castShadow = true; buttressE.receiveShadow = true; group.add(buttressE);
        let buttressW = new THREE.Mesh(new THREE.BoxGeometry(4, wallH - 2, 3), Materials.wall); buttressW.position.set(-size / 2 + 2, wallH / 2 - 2, i); buttressW.castShadow = true; buttressW.receiveShadow = true; group.add(buttressW);
    }

    // 4. ALMENAS DERUIDAS
    const createBattlements = (xStart: number, xEnd: number, zPos: number, isZ: boolean) => {
        for (let i = xStart; i <= xEnd; i += 4) {
            if (!isZ && Math.abs(i) < 10 && zPos === -size / 2) continue;
            if (Math.random() > 0.75) continue;
            const b = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3, 2.5), Materials.wall);
            if (isZ) b.position.set(zPos, wallH, i); else b.position.set(i, wallH, zPos);
            b.castShadow = true; b.receiveShadow = true; group.add(b);
        }
    };
    createBattlements(-22, 22, -size / 2, false); createBattlements(-22, 22, size / 2, false);
    createBattlements(-22, 22, size / 2, true); createBattlements(-22, 22, -size / 2, true);

    // 5. MUROS INTERIORES DE ESQUINA (reemplazan las torres que penetraban el interior)
    // Las torres exteriores se eliminan para que nada asome dentro de los pisos
    // En su lugar, reforzamos las esquinas con contrafuertes más gruesos
    const cornerPositions = [[-size / 2, -size / 2], [size / 2, -size / 2], [-size / 2, size / 2], [size / 2, size / 2]];
    cornerPositions.forEach(pos => {
        // Contrafuerte de esquina (no sobresale hacia adentro)
        const corner = new THREE.Mesh(new THREE.BoxGeometry(6, wallH, 6), Materials.wall);
        corner.position.set(pos[0], wallH / 2 - 1, pos[1]); corner.castShadow = true; corner.receiveShadow = true; group.add(corner);
    });

    // 6. GRAN ENTRADA A LA FORTALEZA (Totalmente Reconstruida a Mano)
    const entranceGroup = new THREE.Group();
    // Ampliamos significativamente el arco para que la cámara y el jugador pasen sin engancharse con el puente (que mide 18 de ancho)
    const pillarRadius = 2.0; const pillarH = 12; const pillarOffsetX = 11.0;
    const pillarBaseY = pillarH / 2;

    // Pilares cilíndricos gigantes de la Gran Puerta
    const pillarL = new THREE.Mesh(new THREE.CylinderGeometry(pillarRadius, pillarRadius + 0.5, pillarH, 12), Materials.wall);
    pillarL.position.set(-pillarOffsetX, pillarBaseY, -size / 2 + 1.5); pillarL.castShadow = true; pillarL.receiveShadow = true; entranceGroup.add(pillarL);
    const pillarR = pillarL.clone(); pillarR.position.x = pillarOffsetX; entranceGroup.add(pillarR);

    // Capiteles (remates superiores)
    const capL = new THREE.Mesh(new THREE.CylinderGeometry(pillarRadius + 1.0, pillarRadius, 1.5, 12), Materials.obsidian);
    capL.position.set(-pillarOffsetX, pillarH + 0.75, -size / 2 + 1.5); capL.castShadow = true; entranceGroup.add(capL);
    const capR = capL.clone(); capR.position.x = pillarOffsetX; entranceGroup.add(capR);

    // Bases sólidas de los pilares
    const baseL = new THREE.Mesh(new THREE.CylinderGeometry(pillarRadius + 0.8, pillarRadius + 1.2, 1.5, 8), Materials.wall);
    baseL.position.set(-pillarOffsetX, 0.75, -size / 2 + 1.5); baseL.receiveShadow = true; entranceGroup.add(baseL);
    const baseR = baseL.clone(); baseR.position.x = pillarOffsetX; entranceGroup.add(baseR);

    // Dintel (Viga majestuosa cruzando la puerta)
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(pillarOffsetX * 2 + pillarRadius * 2, 2.5, 4.0), Materials.wall);
    lintel.position.set(0, pillarH + 2.0, -size / 2 + 1.5); lintel.castShadow = true; lintel.receiveShadow = true; entranceGroup.add(lintel);


    // === SISTEMA DE PISOS CON ESCALERAS CRUZADAS ===
    // Hueco izquierdo: X de -23 a -9. Hueco derecho: X de 9 a 23.
    const holeW = 14;  // Dimensiones del hueco
    const holeZMin = -7; const holeZMax = 7;
    const floorThick = 1.5;

    // Material invisible para colisionadores
    const invisMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });

    // Función helper: crea un colisionador Box
    const addColBox = (w: number, h: number, d: number, x: number, y: number, z: number) => {
        const col = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), invisMat);
        col.position.set(x, y, z); collidables.push(col); entranceGroup.add(col);
    };

    // === PUENTE MEDIEVAL (conecta fortaleza → WideBridge, 30m) ===
    const bridgeLen = 30; const bridgeW = pillarOffsetX * 2 + 2; // 18m ancho
    const bridgeZStart = -size / 2; // Z local del muro frontal
    const bridgeZMid = bridgeZStart - bridgeLen / 2;

    // Tablero principal del puente (calzada de piedra)
    // Bajamos 0.15 unidades respecto al suelo de la fortaleza para evitar Z-fighting
    const floorLen = bridgeLen + 1; // 31m (0.5m extra por ambos lados, reducido para evitar solapamiento)
    const deck = new THREE.Mesh(new THREE.BoxGeometry(bridgeW, 1.5, floorLen), Materials.plaza);
    deck.position.set(0, -0.90, bridgeZMid); deck.receiveShadow = true; deck.castShadow = true; entranceGroup.add(deck);
    addColBox(bridgeW, 1.5, floorLen, 0, -0.90, bridgeZMid);

    // Pilastras de soporte del puente (sin arcos)
    for (let a = 0; a < 3; a++) {
        const archZ = bridgeZStart - 5 - a * 10;
        for (const side of [-1, 1]) {
            const pilX = side * (bridgeW / 2 - 1.5);
            const pil = new THREE.Mesh(new THREE.BoxGeometry(2, 12, 2), Materials.wall);
            pil.position.set(pilX, -7, archZ); pil.castShadow = true; pil.receiveShadow = true; entranceGroup.add(pil);

            const cap = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.8, 2.8), Materials.obsidian);
            cap.position.set(pilX, -0.6, archZ); cap.castShadow = true; entranceGroup.add(cap);
        }
    }

    // Barandas con almenas (estilo medieval)
    for (const side of [-1, 1]) {
        const railX = side * (bridgeW / 2 - 0.3);
        // Pared baja continua
        const railWall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2, bridgeLen), Materials.wall);
        railWall.position.set(railX, 1, bridgeZMid); railWall.castShadow = true; entranceGroup.add(railWall);
        addColBox(0.6, 2, bridgeLen, railX, 1, bridgeZMid);

        // Almenas sobre la baranda (merlones y vanos)
        for (let m = 0; m < 7; m++) {
            const mZ = bridgeZStart - 2 - m * 4;
            const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.5, 1.5), Materials.wall);
            merlon.position.set(railX, 2.75, mZ); merlon.castShadow = true; entranceGroup.add(merlon);
        }
    }

    // Antorchas en el puente (2 pares a cada lado)
    for (let t = 0; t < 2; t++) {
        const tZ = bridgeZStart - 8 - t * 14;
        for (const side of [-1, 1]) {
            const tX = side * (bridgeW / 2 - 0.5);
            const torch = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 3, 6), Materials.wall);
            torch.position.set(tX, 2.5, tZ); torch.castShadow = true; entranceGroup.add(torch);
            createRealisticFire(tX, 4.2, tZ, 0.8, fireEmitters, entranceGroup, 'brazier');
        }
    }

    // Función reutilizable: construye un piso con hueco en el lado indicado
    const buildFloorWithHole = (yPos: number, holeSide: 'left' | 'right') => {
        // Calcular posición X del hueco según el lado
        const hXMin = holeSide === 'left' ? -23 : 9;
        const hXMax = holeSide === 'left' ? -9 : 23;
        const hX = (hXMin + hXMax) / 2;

        // Pieza principal (lado opuesto al hueco, cubre todo el ancho)
        const mainW = size - holeW - 4;
        const mainX = holeSide === 'left' ? hXMax + mainW / 2 : hXMin - mainW / 2;
        const pMain = new THREE.Mesh(new THREE.BoxGeometry(mainW, floorThick, size - 4), Materials.floor);
        pMain.position.set(mainX, yPos, 0); pMain.receiveShadow = true; pMain.castShadow = true; entranceGroup.add(pMain);
        addColBox(mainW, floorThick, size - 4, mainX, yPos, 0);

        // Pieza trasera (cierra el hueco por detrás)
        const backD = size / 2 - holeZMax - 2;
        if (backD > 0) {
            const bZ = holeZMax + backD / 2;
            const pB = new THREE.Mesh(new THREE.BoxGeometry(holeW, floorThick, backD), Materials.floor);
            pB.position.set(hX, yPos, bZ); pB.receiveShadow = true; pB.castShadow = true; entranceGroup.add(pB);
            addColBox(holeW, floorThick, backD, hX, yPos, bZ);
        }

        // Pieza frontal (cierra el hueco por delante)
        const frontD = size / 2 + holeZMin - 2;
        if (frontD > 0) {
            const fZ = -size / 2 + frontD / 2 + 2;
            const pF = new THREE.Mesh(new THREE.BoxGeometry(holeW, floorThick, frontD), Materials.floor);
            pF.position.set(hX, yPos, fZ); pF.receiveShadow = true; pF.castShadow = true; entranceGroup.add(pF);
            addColBox(holeW, floorThick, frontD, hX, yPos, fZ);
        }

        // Baranda interior (separa el hueco del salón)
        const railH = 2; const railT = 0.5;
        const railY = yPos + railH / 2 + floorThick / 2;
        const railX = holeSide === 'left' ? hXMax : hXMin;
        const rL = new THREE.Mesh(new THREE.BoxGeometry(railT, railH, holeZMax - holeZMin), Materials.wall);
        rL.position.set(railX, railY, 0); entranceGroup.add(rL);
        addColBox(railT, railH, holeZMax - holeZMin, railX, railY, 0);
    };

    // Piso 2 (Y=12): hueco a la IZQUIERDA (escalera 1→2 llega por aquí)
    buildFloorWithHole(12, 'left');
    // Piso 3 (Y=24): hueco a la DERECHA (escalera 2→3 llega) + hueco IZQUIERDO (escalera 3→azotea sale)
    // Construimos manualmente: solo franja central
    {
        const y3 = 24;
        // Franja central (de X=-9 a X=9, toda la profundidad Z)
        const centerW = 18; // espacio entre los dos huecos
        const pCenter = new THREE.Mesh(new THREE.BoxGeometry(centerW, floorThick, size - 4), Materials.floor);
        pCenter.position.set(0, y3, 0); pCenter.receiveShadow = true; pCenter.castShadow = true; entranceGroup.add(pCenter);
        addColBox(centerW, floorThick, size - 4, 0, y3, 0);

        // Piezas que cierran los huecos por delante y detrás (lado izquierdo)
        const backD = size / 2 - holeZMax - 2;
        const frontD = size / 2 + holeZMin - 2;
        if (backD > 0) {
            const bZ = holeZMax + backD / 2;
            const pBL = new THREE.Mesh(new THREE.BoxGeometry(holeW, floorThick, backD), Materials.floor);
            pBL.position.set(-16, y3, bZ); pBL.receiveShadow = true; pBL.castShadow = true; entranceGroup.add(pBL);
            addColBox(holeW, floorThick, backD, -16, y3, bZ);
            const pBR = new THREE.Mesh(new THREE.BoxGeometry(holeW, floorThick, backD), Materials.floor);
            pBR.position.set(16, y3, bZ); pBR.receiveShadow = true; pBR.castShadow = true; entranceGroup.add(pBR);
            addColBox(holeW, floorThick, backD, 16, y3, bZ);
        }
        if (frontD > 0) {
            const fZ = -size / 2 + frontD / 2 + 2;
            const pFL = new THREE.Mesh(new THREE.BoxGeometry(holeW, floorThick, frontD), Materials.floor);
            pFL.position.set(-16, y3, fZ); pFL.receiveShadow = true; pFL.castShadow = true; entranceGroup.add(pFL);
            addColBox(holeW, floorThick, frontD, -16, y3, fZ);
            const pFR = new THREE.Mesh(new THREE.BoxGeometry(holeW, floorThick, frontD), Materials.floor);
            pFR.position.set(16, y3, fZ); pFR.receiveShadow = true; pFR.castShadow = true; entranceGroup.add(pFR);
            addColBox(holeW, floorThick, frontD, 16, y3, fZ);
        }

        // Barandas interiores (separan huecos del salón)
        const railH = 2; const railT = 0.5;
        const railY = y3 + railH / 2 + floorThick / 2;
        const rL = new THREE.Mesh(new THREE.BoxGeometry(railT, railH, holeZMax - holeZMin), Materials.wall);
        rL.position.set(-9, railY, 0); entranceGroup.add(rL); addColBox(railT, railH, holeZMax - holeZMin, -9, railY, 0);
        const rR = new THREE.Mesh(new THREE.BoxGeometry(railT, railH, holeZMax - holeZMin), Materials.wall);
        rR.position.set(9, railY, 0); entranceGroup.add(rR); addColBox(railT, railH, holeZMax - holeZMin, 9, railY, 0);
    }
    // Azotea (Y=36): hueco a la IZQUIERDA para la escalera 3→azotea
    buildFloorWithHole(36, 'left');

    // Almenas perimetrales en la azotea
    const azoteaY = 36 + floorThick / 2;
    const createAzoteaBattlements = (xStart: number, xEnd: number, zPos: number, isZ: boolean) => {
        for (let i = xStart; i <= xEnd; i += 3) {
            if (!isZ && Math.abs(i) < 10 && zPos === -size / 2) continue; // dejar entrada libre
            const b = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 1.5), Materials.wall);
            if (isZ) b.position.set(zPos, azoteaY + 1.25, i); else b.position.set(i, azoteaY + 1.25, zPos);
            b.castShadow = true; entranceGroup.add(b);
        }
    };
    createAzoteaBattlements(-22, 22, -size / 2 + 2, false);
    createAzoteaBattlements(-22, 22, size / 2 - 2, false);
    createAzoteaBattlements(-22, 22, size / 2 - 2, true);
    createAzoteaBattlements(-22, 22, -size / 2 + 2, true);

    // === PORTAL en la Azotea (último piso) ===
    const objLoader = new OBJLoader();
    objLoader.load('/assets/models/environment/Portal.obj', (obj) => {
        // Escala
        obj.scale.set(4.5, 4.5, 4.5);
        // Posición: subimos a +7.8 para que asiente completamente arriba
        obj.position.set(5, azoteaY + 7.8, -8);

        // Rotar sobre Y para que mire hacia el frente
        obj.rotation.y = Math.PI / 2;

        // Material PIEDRA
        const stoneMat = new THREE.MeshStandardMaterial({
            color: '#8b6b50',
            roughness: 0.9,
            metalness: 0.05,
        });

        obj.traverse((child: any) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material = stoneMat; // Todo el modelo OBJ es de piedra maciza
            }
        });

        entranceGroup.add(obj);

        // --- CREAMOS EL CENTRO LUMINOSO ---
        // Radio ajustado para que encaje DENTRO del arco de piedra (aprox 5.2)
        const portalCenter = new THREE.Mesh(
            new THREE.CylinderGeometry(5.2, 5.2, 0.1, 32),
            new THREE.MeshStandardMaterial({
                color: '#6611cc', // Púrpura base
                emissive: '#00ffff', // Cian brillante
                emissiveIntensity: 3.0,
                transparent: true,
                opacity: 0.85,
            })
        );
        // Rotamos el cilindro para que quede de pie
        portalCenter.rotation.x = Math.PI / 2;
        // Posición centrada en el agujero del arco (+4.5 desde su nueva base)
        portalCenter.position.set(5, azoteaY + 7.8 + 4.5, -8);
        entranceGroup.add(portalCenter);

        // Luz del portal
        const portalLight = new THREE.PointLight('#33ccff', 4.0, 35);
        portalLight.position.set(5, azoteaY + 12.3, -5);
        entranceGroup.add(portalLight);

        console.log('[Environment] Portal.obj cargado correctamente en azotea');
    }, undefined, (err) => {
        console.warn('[Environment] Error cargando Portal.obj:', err);
    });

    // === ANTORCHAS DE PARED EN CADA PISO (única iluminación interior) ===
    // Función: crea una antorcha de pared con su soporte y fuego
    const placeWallTorch = (x: number, y: number, z: number) => {
        // Soporte de piedra en la pared
        const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 1.2), Materials.wall);
        bracket.position.set(x, y, z); bracket.castShadow = true; entranceGroup.add(bracket);
        // Palo de la antorcha
        const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 2.5, 6), Materials.wall);
        stick.position.set(x, y + 1.5, z); stick.castShadow = true; entranceGroup.add(stick);
        // Fuego con PointLight (más intenso para iluminar interiores oscuros)
        createRealisticFire(x, y + 3, z, 1.0, fireEmitters, entranceGroup, 'brazier');
    };

    // Piso 1 (Y=0): 4 antorchas en los muros
    placeWallTorch(-20, 3, -20); placeWallTorch(20, 3, -20);
    placeWallTorch(-20, 3, 20); placeWallTorch(20, 3, 20);

    // Piso 2 (Y=12): 4 antorchas en los muros
    placeWallTorch(-20, 15, -20); placeWallTorch(20, 15, -20);
    placeWallTorch(-20, 15, 20); placeWallTorch(20, 15, 20);

    // Piso 3 (Y=24): 4 antorchas en los muros
    placeWallTorch(-20, 27, -20); placeWallTorch(20, 27, -20);
    placeWallTorch(-20, 27, 20); placeWallTorch(20, 27, 20);

    // === ESCALERAS MACIZAS CRUZADAS (sólidas por debajo) ===
    const stairsGroup = new THREE.Group();
    const stepsPerFloor = 20;

    // Función: crea un tramo de escalera maciza + plataforma de llegada
    const buildSolidStairBlock = (xPos: number, yStart: number, yEnd: number, zDir: number) => {
        const rise = yEnd - yStart;
        const stepH = rise / stepsPerFloor;
        const totalZSpan = holeZMax - holeZMin - 2; // Espacio Z disponible (dejar 1m para plataforma)
        const stepD = totalZSpan / stepsPerFloor;
        for (let i = 0; i < stepsPerFloor; i++) {
            const topY = yStart + (i + 1) * stepH;
            const blockH = topY - yStart + stepH;
            const sZ = (zDir > 0)
                ? holeZMin + 1 + i * stepD
                : holeZMax - 1 - i * stepD;

            // Bloque macizo (relleno desde yStart hasta el peldaño)
            const block = new THREE.Mesh(new THREE.BoxGeometry(holeW, blockH, stepD + 0.1), Materials.stairs);
            block.position.set(xPos, yStart + blockH / 2, sZ);
            block.castShadow = true; block.receiveShadow = true; stairsGroup.add(block);

            // Colisionador en la superficie superior del peldaño
            const col = new THREE.Mesh(new THREE.BoxGeometry(holeW, stepH, stepD + 0.2), invisMat);
            col.position.set(xPos, topY - stepH / 2, sZ);
            collidables.push(col); stairsGroup.add(col);
        }

        // Plataforma de llegada al nivel del piso superior (misma textura que escalera)
        const platZ = (zDir > 0) ? holeZMax - 0.5 : holeZMin + 0.5;
        const platH = yEnd - yStart;
        const plat = new THREE.Mesh(new THREE.BoxGeometry(holeW, platH, 2), Materials.stairs);
        plat.position.set(xPos, yStart + platH / 2, platZ);
        plat.castShadow = true; plat.receiveShadow = true; stairsGroup.add(plat);
        // Colisionador ligeramente sobre el piso (evita Z-fighting con la losa)
        const platCol = new THREE.Mesh(new THREE.BoxGeometry(holeW, floorThick, 2), invisMat);
        platCol.position.set(xPos, yEnd - floorThick / 2, platZ);
        collidables.push(platCol); stairsGroup.add(platCol);
    };

    // Escalera Piso 1 -> 2: lado IZQUIERDO (X=-16), sube de Z- a Z+
    buildSolidStairBlock(-16, 0, 12, 1);
    // Escalera Piso 2 -> 3: lado DERECHO (X=+16), sube de Z+ a Z-
    buildSolidStairBlock(16, 12, 24, -1);
    // Escalera Piso 3 -> Azotea: lado IZQUIERDO (X=-16), sube de Z- a Z+
    buildSolidStairBlock(-16, 24, 36, 1);

    entranceGroup.add(stairsGroup);


    entranceGroup.add(stairsGroup);

    // Colisionadores simplificados para los pilares
    // Son más pequeños que el objeto visual para que la cámara no rebote al pasar cerca
    const pillarColL = new THREE.Mesh(new THREE.BoxGeometry(pillarRadius * 1.5, pillarH, pillarRadius * 1.5), invisMat);
    pillarColL.position.copy(pillarL.position); collidables.push(pillarColL); entranceGroup.add(pillarColL);
    const pillarColR = pillarColL.clone(); pillarColR.position.copy(pillarR.position); collidables.push(pillarColR); entranceGroup.add(pillarColR);

    group.add(entranceGroup);

    // 7. BRASEROS DE FUEGO (Particulas animadas en vez de octaedros)
    const placeBrazier = (bx: number, bz: number) => {
        const base = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.5, 3, 6), Materials.wall);
        base.position.set(bx, 1.5, bz); base.castShadow = true; base.receiveShadow = true; group.add(base);
        createRealisticFire(bx, 3.2, bz, 1.2, fireEmitters, group, 'brazier');
    };
    placeBrazier(-10, -12); placeBrazier(10, -12);
    placeBrazier(-10, 12); placeBrazier(10, 12);

    // 8. ALTAR PRINCIPAL LIGERAMENTE REDUCIDO (ELIMINADOS LOS CRISTALES FLOTANTES SUPERIORES)
    const altarStep1 = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 0.5, 8), Materials.plaza); altarStep1.position.set(0, 0.25, 0); altarStep1.receiveShadow = true; group.add(altarStep1);
    const altarStep2 = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 1, 8), Materials.obsidian); altarStep2.position.set(0, 1, 0); altarStep2.receiveShadow = true; group.add(altarStep2);
    // Colisionadores para los peldaños del altar (Soluciona hudimiento en obsidiana central)
    const a1Col = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 0.5, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
    a1Col.position.copy(altarStep1.position); collidables.push(a1Col); group.add(a1Col);
    const a2Col = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 1, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
    a2Col.position.copy(altarStep2.position); collidables.push(a2Col); group.add(a2Col);

    // Conservamos el anillo en el suelo
    const spawnRing = new THREE.Mesh(new THREE.RingGeometry(4.5, 5.5, 8), Materials.runeRing); spawnRing.rotation.x = -Math.PI / 2; spawnRing.position.set(0, 1.51, 0); group.add(spawnRing);

    // (Se eliminó el bucle de los 4 pedestales de pared invisible con cristales flotando, ya que ensuciaba la visual)

    // --- ENSAMBLAJE DE PUERTA EXTERNA PROVISTA POR MODULE door.ts ---
    // Guardamos las coordenadas base para encajar la puerta importada
    gateObjects.gatePos = new THREE.Vector3(0, 0, zCenter - size / 2 + 0.5); // Y=0: el piso de la fortaleza termina aquí
    gateObjects.hingeZBase = -size / 2 + 0.6;
    gateObjects.entranceZ = zCenter - size / 2;

    group.position.set(0, 0, zCenter); scene.add(group);
    const collider = new THREE.Mesh(new THREE.BoxGeometry(size, 2, size), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
    collider.position.set(0, -1, zCenter); scene.add(collider); collidables.push(collider);

    // === SPOTLIGHTS INTERIORES PARA SOMBRAS (controlados por nivel de calidad) ===
    const interiorSpots: THREE.SpotLight[] = [];
    [
        { y: 10, tY: 0 },   // Piso 1
        { y: 22, tY: 13 },  // Piso 2
        { y: 34, tY: 25 },  // Piso 3
    ].forEach(fl => {
        const spot = new THREE.SpotLight('#ff8844', 4.0, 30, Math.PI / 2.5, 0.6, 1.8);
        spot.position.set(0, fl.y, 0);
        spot.target.position.set(0, fl.tY, 0);
        spot.castShadow = false; // Activado por graphicsSettings en Alto/Ultra
        spot.shadow.mapSize.set(1024, 1024);
        spot.shadow.bias = -0.002;
        spot.shadow.camera.near = 1;
        spot.shadow.camera.far = 25;
        group.add(spot); group.add(spot.target);
        interiorSpots.push(spot);
    });

    return { fortressGroup: group, interiorSpots };
}

export function createPenumbraRuins(scene: THREE.Scene, collidables: THREE.Object3D[], checkpoints: any[], animatedCrystals: any[], movingPlatforms: any[], fireEmitters: any[], zStart: number) {
    const rGroup = new THREE.Group();
    // Camino roto hacia la izquierda
    const pillar1 = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 30, 8), Materials.wall);
    pillar1.position.set(-30, -5, zStart - 10); pillar1.receiveShadow = true; rGroup.add(pillar1);
    const plat1 = new THREE.Mesh(new THREE.BoxGeometry(10, 2, 10), Materials.plaza);
    plat1.position.set(-30, 10, zStart - 10); plat1.receiveShadow = true; rGroup.add(plat1);
    const col1 = new THREE.Mesh(new THREE.BoxGeometry(10, 2, 10), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
    col1.position.copy(plat1.position); collidables.push(col1); rGroup.add(col1);

    scene.add(rGroup);

    // Plataformas de parkour extendidas
    createPlatform(scene, collidables, movingPlatforms, checkpoints, animatedCrystals, -45, 12, zStart - 10, 8);
    createPlatform(scene, collidables, movingPlatforms, checkpoints, animatedCrystals, -65, 18, zStart - 20, 8, 1); // Movil X
    createPlatform(scene, collidables, movingPlatforms, checkpoints, animatedCrystals, -85, 24, zStart - 10, 6, 0); // Movil Y
    createPlatform(scene, collidables, movingPlatforms, checkpoints, animatedCrystals, -110, 30, zStart - 15, 8, 2); // Movil Circular

    // Templo final de Penumbra
    const endGroup = new THREE.Group();
    const baseEnd = new THREE.Mesh(new THREE.CylinderGeometry(15, 20, 10, 8), Materials.obsidian);
    baseEnd.position.set(-145, 25, zStart - 15); baseEnd.receiveShadow = true; endGroup.add(baseEnd);

    // Antorchas del templo de penumbra
    const tL = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 6, 6), Materials.wall);
    tL.position.set(-145, 33, zStart - 5); endGroup.add(tL);
    createRealisticFire(-145, 36, zStart - 5, 1.5, fireEmitters, endGroup, 'brazier');

    const tR = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 6, 6), Materials.wall);
    tR.position.set(-145, 33, zStart - 25); endGroup.add(tR);
    createRealisticFire(-145, 36, zStart - 25, 1.5, fireEmitters, endGroup, 'brazier');

    const colEnd = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 10, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
    colEnd.position.set(-145, 25, zStart - 15); collidables.push(colEnd); endGroup.add(colEnd);

    // Escaleras frontales para subir al templo del Golem
    const stairX = -131; // Enfrente del cilindro (-145 + 14)
    const stairZ = zStart - 15;
    const stairGroup = new THREE.Group();

    // 5 Peldaños
    for (let i = 0; i < 5; i++) {
        const stepW = 8;
        const stepH = 2.0; // Total height to reach = 10. 5 steps of 2
        const stepD = 3;

        // Z local = 0
        // X = stairX + (i * stepD) (escalera baja hacia el +X)
        const stepX = stairX + (i * stepD);
        const stepY = 20 + ((4 - i) * stepH) + (stepH / 2); // From 21 to 29

        const step = new THREE.Mesh(new THREE.BoxGeometry(stepD, stepH, stepW), Materials.plaza);
        step.position.set(stepX, stepY, stairZ);
        step.receiveShadow = true; step.castShadow = true;
        stairGroup.add(step);

        const stepCol = new THREE.Mesh(new THREE.BoxGeometry(stepD, stepH, stepW), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
        stepCol.position.copy(step.position);
        collidables.push(stepCol);
        stairGroup.add(stepCol);
    }
    endGroup.add(stairGroup);

    scene.add(endGroup);

    checkpoints.push({ pos: new THREE.Vector3(-145, 32, zStart - 15), radius: 15 });
}
