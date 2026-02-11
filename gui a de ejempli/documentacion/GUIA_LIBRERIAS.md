# 🎮 Guía de Librerías Instaladas - Valnor

## Índice
1. [Howler.js — Audio y Sonido](#1-howlerjs--audio-y-sonido)
2. [React Icons — Iconos para UI](#2-react-icons--iconos-para-ui)
3. [Sonner — Notificaciones Toast](#3-sonner--notificaciones-toast)
4. [R3F-Perf — Monitor de Rendimiento 3D](#4-r3f-perf--monitor-de-rendimiento-3d)
5. [@react-spring/three — Animaciones 3D](#5-react-springthree--animaciones-3d)
6. [Three-Stdlib — Utilidades Extra para Three.js](#6-three-stdlib--utilidades-extra-para-threejs)
7. [Lamina — Materiales por Capas](#7-lamina--materiales-por-capas)
8. [Stats-GL — Monitor de FPS](#8-stats-gl--monitor-de-fps)

---

## 1. Howler.js — Audio y Sonido

> Librería de audio potente y ligera. Ideal para efectos de sonido y música de fondo.

### Ejemplo: Sistema de Audio para el juego

```tsx
// src/engine/systems/AudioSystem.ts
import { Howl, Howler } from 'howler';

// ========================================
// MÚSICA DE FONDO
// ========================================
const bgMusic = new Howl({
  src: ['/assets/audio/dungeon-theme.mp3'],
  loop: true,
  volume: 0.3,
  // Se puede tener múltiples formatos para compatibilidad
  // src: ['/audio/theme.webm', '/audio/theme.mp3'],
});

// Reproducir música
bgMusic.play();

// Pausar
bgMusic.pause();

// Cambiar volumen (0.0 a 1.0)
bgMusic.volume(0.5);

// ========================================
// EFECTOS DE SONIDO
// ========================================
const sfx = {
  swordHit: new Howl({
    src: ['/assets/audio/sword-hit.mp3'],
    volume: 0.7,
  }),
  levelUp: new Howl({
    src: ['/assets/audio/level-up.mp3'],
    volume: 0.8,
  }),
  coinPickup: new Howl({
    src: ['/assets/audio/coin.mp3'],
    volume: 0.5,
  }),
  footstep: new Howl({
    src: ['/assets/audio/footstep.mp3'],
    volume: 0.3,
    // Sprite: múltiples sonidos en un solo archivo
    // sprite: { step1: [0, 500], step2: [500, 500] },
  }),
  magic: new Howl({
    src: ['/assets/audio/magic-spell.mp3'],
    volume: 0.6,
  }),
};

// Reproducir un efecto
sfx.swordHit.play();
sfx.coinPickup.play();

// ========================================
// CONTROL GLOBAL
// ========================================
// Silenciar TODO el audio
Howler.mute(true);

// Reactivar
Howler.mute(false);

// Volumen global
Howler.volume(0.5);
```

### Ejemplo: Hook personalizado para usar en componentes React

```tsx
// src/hooks/useAudio.ts
import { Howl } from 'howler';
import { useRef, useCallback } from 'react';

export function useAudio(src: string, options?: { volume?: number; loop?: boolean }) {
  const soundRef = useRef<Howl | null>(null);

  const play = useCallback(() => {
    if (!soundRef.current) {
      soundRef.current = new Howl({
        src: [src],
        volume: options?.volume ?? 0.5,
        loop: options?.loop ?? false,
      });
    }
    soundRef.current.play();
  }, [src, options]);

  const stop = useCallback(() => {
    soundRef.current?.stop();
  }, []);

  const pause = useCallback(() => {
    soundRef.current?.pause();
  }, []);

  return { play, stop, pause };
}

// USO EN UN COMPONENTE:
// const { play: playSword } = useAudio('/assets/audio/sword.mp3', { volume: 0.7 });
// <button onClick={playSword}>Atacar</button>
```

### Ejemplo: Audio posicional 3D (sonidos en el espacio)

```tsx
import { Howl } from 'howler';

const enemyGrowl = new Howl({
  src: ['/assets/audio/growl.mp3'],
  volume: 1.0,
});

// Establecer posición 3D del sonido
// pos(x, y, z) - relativo al listener
enemyGrowl.pos(10, 0, 5); // el sonido viene de la derecha-adelante
enemyGrowl.play();

// Mover la posición del oyente (jugador)
Howler.pos(0, 0, 0); // posición del jugador
```

---

## 2. React Icons — Iconos para UI

> +40,000 iconos de librerías populares (Font Awesome, Material, Game Icons, etc.)

### Ejemplo: Iconos básicos

```tsx
import { GiSword, GiShield, GiPotion, GiChest, GiSkull } from 'react-icons/gi';       // Game Icons
import { FaHeart, FaStar, FaCoins, FaCog, FaUser } from 'react-icons/fa';              // Font Awesome
import { MdInventory, MdLeaderboard, MdSettings } from 'react-icons/md';               // Material Design
import { IoMdNotifications } from 'react-icons/io';                                     // Ionicons
import { BiMap } from 'react-icons/bi';                                                 // Box Icons

function GameHUD() {
  return (
    <div className="flex gap-4 p-4">
      {/* Iconos de juego - perfectos para RPG */}
      <GiSword size={32} color="#FFD700" />      {/* Espada dorada */}
      <GiShield size={32} color="#4A90D9" />      {/* Escudo azul */}
      <GiPotion size={32} color="#FF4444" />       {/* Poción roja */}
      <GiChest size={32} color="#8B4513" />        {/* Cofre */}
      <GiSkull size={32} color="#FFFFFF" />         {/* Calavera */}

      {/* Barra de vida */}
      <div className="flex items-center gap-1">
        <FaHeart color="red" size={20} />
        <span>100/100</span>
      </div>

      {/* Monedas */}
      <div className="flex items-center gap-1">
        <FaCoins color="gold" size={20} />
        <span>1,250</span>
      </div>
    </div>
  );
}
```

### Ejemplo: Menú de navegación con iconos

```tsx
import { GiSword, GiBackpack, GiScrollUnfurled, GiRank3 } from 'react-icons/gi';
import { FaCog, FaHome } from 'react-icons/fa';

const menuItems = [
  { icon: FaHome,              label: 'Inicio',      path: '/dashboard' },
  { icon: GiSword,             label: 'Combate',     path: '/dungeon' },
  { icon: GiBackpack,          label: 'Inventario',  path: '/inventory' },
  { icon: GiScrollUnfurled,    label: 'Misiones',    path: '/quests' },
  { icon: GiRank3,             label: 'Ranking',     path: '/ranking' },
  { icon: FaCog,               label: 'Ajustes',     path: '/settings' },
];

function SideMenu() {
  return (
    <nav className="flex flex-col gap-2">
      {menuItems.map((item) => (
        <a key={item.path} href={item.path} className="flex items-center gap-3 p-3 hover:bg-white/10 rounded-lg">
          <item.icon size={24} />
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
}
```

### Iconos de juego más útiles (react-icons/gi):

```
GiSword, GiBroadsword, GiCrossedSwords  → Espadas
GiShield, GiRoundShield                  → Escudos
GiPotion, GiPotionBall                   → Pociones
GiChestArmor, GiLeatherArmor             → Armaduras
GiMagicAxe, GiBattleAxe                  → Hachas
GiBowArrow                               → Arco
GiFireball, GiIceBolt, GiLightningBolt   → Hechizos
GiSkull, GiDragonHead, GiGoblinHead      → Enemigos
GiGoldBar, GiCoins, GiGem                → Recursos
GiHealthPotion, GiManaPotion              → Pociones
GiMap, GiTreasureMap                      → Mapas
GiCastle, GiDungeonGate                  → Lugares
GiScrollUnfurled                          → Pergaminos/Misiones
GiRank1, GiRank2, GiRank3                → Rankings
```

---

## 3. Sonner — Notificaciones Toast

> Toasts modernos, animados y elegantes. Perfecto para notificaciones in-game.

### Setup inicial (en App.tsx o layout principal):

```tsx
// En tu App.tsx o layout principal
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      {/* Tu app */}
      <Toaster
        position="top-right"       // posición de los toasts
        richColors                 // colores más vivos
        theme="dark"               // tema oscuro para juegos
        toastOptions={{
          duration: 3000,          // 3 segundos por defecto
          style: {
            background: 'rgba(0, 0, 0, 0.85)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            color: '#fff',
          },
        }}
      />
    </>
  );
}
```

### Ejemplo: Notificaciones del juego

```tsx
import { toast } from 'sonner';

// ========================================
// TIPOS DE NOTIFICACIÓN
// ========================================

// Éxito - Completar misión, subir nivel, etc.
toast.success('¡Misión completada!', {
  description: 'Has ganado 500 XP y 100 monedas de oro',
  duration: 5000,
});

// Error - Muerte, fallo de conexión, etc.
toast.error('¡Has muerto!', {
  description: 'Perdiste 50 monedas de oro',
});

// Info - Información general
toast.info('Nuevo jugador se unió a la partida');

// Warning - Advertencias
toast.warning('¡Tu vida está baja!', {
  description: 'Usa una poción de vida',
});

// Promesa - Para acciones asíncronas (compras, guardado)
toast.promise(comprarItem(itemId), {
  loading: 'Comprando item...',
  success: '¡Item comprado exitosamente!',
  error: 'Error al comprar el item',
});

// Toast personalizado con JSX
toast.custom((id) => (
  <div className="flex items-center gap-3 p-4 bg-black/90 border border-yellow-500/50 rounded-lg">
    <GiSword size={32} color="#FFD700" />
    <div>
      <p className="font-bold text-yellow-400">¡Nueva arma desbloqueada!</p>
      <p className="text-sm text-gray-300">Espada de Fuego +15</p>
    </div>
    <button onClick={() => toast.dismiss(id)} className="ml-auto text-gray-500">✕</button>
  </div>
));

// ========================================
// EJEMPLOS PRÁCTICOS PARA EL JUEGO
// ========================================

// Nivel subido
function onLevelUp(level: number) {
  toast.success(`¡Subiste al nivel ${level}!`, {
    description: 'Nuevas habilidades desbloqueadas',
    duration: 5000,
  });
}

// Item recogido
function onItemPickup(itemName: string) {
  toast(`Recogiste: ${itemName}`, { duration: 2000 });
}

// Logro desbloqueado
function onAchievement(title: string) {
  toast.success(`🏆 Logro: ${title}`, { duration: 6000 });
}

// Mensaje de chat
function onChatMessage(player: string, message: string) {
  toast.info(`${player}: ${message}`, { duration: 4000 });
}
```

---

## 4. R3F-Perf — Monitor de Rendimiento 3D

> Panel de rendimiento para React Three Fiber. Muestra FPS, draw calls, triángulos, memoria GPU, etc.

### Ejemplo: Agregar al Canvas 3D

```tsx
import { Canvas } from '@react-three/fiber';
import { Perf } from 'r3f-perf';

function GameScene() {
  const isDev = import.meta.env.DEV; // solo mostrar en desarrollo

  return (
    <Canvas>
      {/* Monitor de rendimiento - SOLO EN DESARROLLO */}
      {isDev && (
        <Perf
          position="top-left"       // posición: top-left, top-right, bottom-left, bottom-right
          minimal={false}           // true = solo FPS, false = panel completo
          showGraph={true}          // gráficos de rendimiento
          colorBlind={false}        // modo daltónico
          deepAnalyze={true}        // análisis profundo (más datos, un poco más lento)
          // matrixUpdate            // monitorear actualizaciones de matrices
          // overClock               // sobrepasar el limit de 60fps en el gráfico
        />
      )}

      {/* Tu escena 3D */}
      <ambientLight />
      <mesh>
        <boxGeometry />
        <meshStandardMaterial />
      </mesh>
    </Canvas>
  );
}
```

### ¿Qué métricas muestra?

```
FPS          → Frames por segundo (ideal: 60)
GPU          → Tiempo de render en GPU (ms)
CPU          → Tiempo de render en CPU (ms)
Calls        → Draw calls (menos = mejor, ideal < 100)
Triangles    → Triángulos renderizados
Geometries   → Geometrías en memoria
Textures     → Texturas en memoria
Shaders      → Shaders compilados
Programs     → Programas de shader activos
```

### Ejemplo: Toggle con tecla F1

```tsx
import { useState, useEffect } from 'react';
import { Perf } from 'r3f-perf';

function PerfToggle() {
  const [showPerf, setShowPerf] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setShowPerf(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return showPerf ? <Perf position="top-left" /> : null;
}

// Usar dentro del Canvas:
// <Canvas>
//   <PerfToggle />
//   {/* ... escena ... */}
// </Canvas>
```

---

## 5. @react-spring/three — Animaciones 3D Fluidas

> Animaciones basadas en física (springs) para objetos 3D. Transiciones suaves y naturales.

### Ejemplo: Objeto flotante (idle animation)

```tsx
import { useSpring, animated } from '@react-spring/three';

function FloatingCrystal() {
  const { position } = useSpring({
    from: { position: [0, 0, 0] as [number, number, number] },
    to: async (next) => {
      while (true) {
        await next({ position: [0, 0.5, 0] as [number, number, number] });
        await next({ position: [0, 0, 0] as [number, number, number] });
      }
    },
    config: { mass: 1, tension: 80, friction: 20 },
  });

  return (
    <animated.mesh position={position}>
      <octahedronGeometry args={[0.5]} />
      <meshStandardMaterial color="#00FFFF" emissive="#004444" />
    </animated.mesh>
  );
}
```

### Ejemplo: Puerta que se abre al interactuar

```tsx
import { useState } from 'react';
import { useSpring, animated } from '@react-spring/three';

function Door() {
  const [isOpen, setIsOpen] = useState(false);

  const { rotation } = useSpring({
    rotation: isOpen
      ? [0, -Math.PI / 2, 0] as [number, number, number]   // abierta (90°)
      : [0, 0, 0] as [number, number, number],               // cerrada
    config: { mass: 2, tension: 120, friction: 30 },
  });

  return (
    <animated.mesh
      rotation={rotation}
      onClick={() => setIsOpen(!isOpen)}
      position={[0, 1, 0]}
    >
      <boxGeometry args={[1, 2, 0.1]} />
      <meshStandardMaterial color="#8B4513" />
    </animated.mesh>
  );
}
```

### Ejemplo: Escalar al hacer hover (items del inventario 3D)

```tsx
import { useState } from 'react';
import { useSpring, animated } from '@react-spring/three';

function ItemPickup({ position }: { position: [number, number, number] }) {
  const [hovered, setHovered] = useState(false);

  const { scale, emissiveIntensity } = useSpring({
    scale: hovered ? 1.3 : 1,
    emissiveIntensity: hovered ? 0.8 : 0.2,
    config: { tension: 300, friction: 15 },
  });

  return (
    <animated.mesh
      position={position}
      scale={scale}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <dodecahedronGeometry args={[0.3]} />
      <animated.meshStandardMaterial
        color="#FFD700"
        emissive="#FF8C00"
        emissiveIntensity={emissiveIntensity}
      />
    </animated.mesh>
  );
}
```

### Ejemplo: Transición de cámara suave

```tsx
import { useSpring } from '@react-spring/three';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

function SmoothCamera({ target }: { target: [number, number, number] }) {
  const { pos } = useSpring({
    pos: target,
    config: { mass: 1, tension: 60, friction: 20 },
  });

  useFrame(({ camera }) => {
    const [x, y, z] = pos.get();
    camera.position.lerp(new THREE.Vector3(x, y + 5, z + 8), 0.05);
    camera.lookAt(x, y, z);
  });

  return null;
}
```

---

## 6. Three-Stdlib — Utilidades Extra para Three.js

> Loaders, shaders y utilidades adicionales para Three.js.

### Ejemplo: Loaders de modelos

```tsx
import { GLTFLoader } from 'three-stdlib';
import { DRACOLoader } from 'three-stdlib';
import { FBXLoader } from 'three-stdlib';
import { useLoader } from '@react-three/fiber';

// Cargar modelo GLTF con compresión Draco
function CompressedModel() {
  const gltf = useLoader(GLTFLoader, '/models/character.glb', (loader) => {
    const draco = new DRACOLoader();
    draco.setDecoderPath('/draco/'); // decodificador Draco
    loader.setDRACOLoader(draco);
  });

  return <primitive object={gltf.scene} />;
}
```

### Ejemplo: Shader personalizado de agua

```tsx
import { MeshReflectorMaterial } from '@react-three/drei';

// three-stdlib también exporta utilidades de geometría:
import { RoundedBoxGeometry } from 'three-stdlib';
import { extend } from '@react-three/fiber';

// Crear componente desde la geometría
extend({ RoundedBoxGeometry });

function RoundedBox() {
  return (
    <mesh>
      {/* @ts-ignore */}
      <roundedBoxGeometry args={[1, 1, 1, 4, 0.1]} />
      <meshStandardMaterial color="#4444FF" />
    </mesh>
  );
}
```

---

## 7. Lamina — Materiales por Capas

> Crea materiales complejos apilando capas (ideal para auras mágicas, escudos, efectos).

### Ejemplo: Aura mágica alrededor de un personaje

```tsx
import { LayerMaterial, Depth, Fresnel, Noise } from 'lamina';

function MagicAura() {
  return (
    <mesh scale={1.2}>
      <sphereGeometry args={[1, 32, 32]} />
      <LayerMaterial
        transparent
        side={2}               // renderizar ambos lados
        depthWrite={false}     // no escribir en depth buffer
      >
        {/* Capa base transparente */}
        <Depth
          colorA="#0000FF"      // color cercano
          colorB="#FF00FF"      // color lejano
          alpha={0.3}
          near={0}
          far={2}
          mode="multiply"
        />
        {/* Efecto Fresnel = brillo en los bordes */}
        <Fresnel
          color="#00FFFF"
          intensity={0.8}
          power={2}
          bias={0.05}
          mode="screen"
        />
        {/* Ruido = efecto de energía/distorsión */}
        <Noise
          mapping="local"
          scale={3}
          colorA="#0000FF"
          colorB="#FF00FF"
          alpha={0.2}
          mode="softlight"
        />
      </LayerMaterial>
    </mesh>
  );
}
```

### Ejemplo: Escudo protector

```tsx
import { LayerMaterial, Fresnel, Depth } from 'lamina';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Shield() {
  const meshRef = useRef<THREE.Mesh>(null);

  // Rotación lenta
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} scale={1.5}>
      <icosahedronGeometry args={[1, 2]} />
      <LayerMaterial transparent depthWrite={false}>
        <Fresnel
          color="#00FF88"
          intensity={1.2}
          power={3}
          bias={0.1}
          mode="screen"
        />
        <Depth
          colorA="#00FF88"
          colorB="transparent"
          alpha={0.15}
          near={0}
          far={1.5}
          mode="add"
        />
      </LayerMaterial>
    </mesh>
  );
}
```

### Ejemplo: Material de lava/fuego

```tsx
import { LayerMaterial, Depth, Noise, Fresnel } from 'lamina';

function LavaMaterial() {
  return (
    <LayerMaterial>
      {/* Base roja */}
      <Depth colorA="#FF4400" colorB="#FF0000" near={0} far={2} alpha={1} />
      {/* Ruido para simular movimiento */}
      <Noise
        mapping="local"
        scale={5}
        colorA="#FFAA00"
        colorB="#FF2200"
        alpha={0.7}
        mode="overlay"
      />
      {/* Brillo en bordes */}
      <Fresnel color="#FFFF00" intensity={0.5} power={2} mode="screen" />
    </LayerMaterial>
  );
}
```

---

## 8. Stats-GL — Monitor de FPS

> Monitor de rendimiento ligero directamente en el canvas WebGL.

### Ejemplo: Agregar stats al Canvas

```tsx
import { Canvas, useThree } from '@react-three/fiber';
import Stats from 'stats-gl';
import { useEffect } from 'react';

function StatsPanel() {
  const { gl } = useThree();

  useEffect(() => {
    const stats = new Stats({
      trackGPU: true,           // monitorear GPU
      trackHz: true,            // monitorear Hz del monitor
      trackCPT: true,           // monitorear compute time
      logsPerSecond: 4,         // actualizaciones por segundo
      graphsPerSecond: 30,      // gráficos por segundo
      samplesLog: 40,           // muestras para logging
      samplesGraph: 10,         // muestras para gráfico
      precision: 2,             // decimales
      minimal: false,           // modo mini
      horizontal: true,         // disposición horizontal
      mode: 0,                  // 0: FPS, 1: CPU, 2: GPU
    });

    // Adjuntar al contenedor del canvas
    const container = gl.domElement.parentElement;
    if (container) {
      container.appendChild(stats.dom);
      stats.dom.style.position = 'absolute';
      stats.dom.style.top = '0';
      stats.dom.style.left = '0';
    }

    // Iniciar
    stats.init(gl);

    return () => {
      stats.dom.remove();
    };
  }, [gl]);

  return null;
}

// Usar dentro del Canvas (alternativa a r3f-perf, más ligero):
// <Canvas>
//   <StatsPanel />
//   {/* ... escena ... */}
// </Canvas>
```

---

## 🚀 Ejemplo Completo: Integrando todo junto

```tsx
// src/engine/scenes/DungeonScene.tsx
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { Perf } from 'r3f-perf';
import { Toaster, toast } from 'sonner';
import { GiSword, GiShield, GiPotion } from 'react-icons/gi';
import { FaHeart } from 'react-icons/fa';
import { useAudio } from '../../hooks/useAudio';

// Componente HUD (fuera del Canvas)
function GameHUD() {
  const { play: playPotion } = useAudio('/assets/audio/potion.mp3');

  const usePotion = () => {
    playPotion();
    toast.success('¡Poción usada!', {
      description: '+50 HP restaurados',
    });
  };

  return (
    <div className="absolute top-4 left-4 z-10 flex gap-4 items-center">
      <div className="flex items-center gap-1 text-red-400">
        <FaHeart /> <span>100/100</span>
      </div>
      <button onClick={usePotion} className="p-2 bg-red-900/80 rounded">
        <GiPotion size={24} color="#FF4444" />
      </button>
      <div className="p-2 bg-gray-900/80 rounded">
        <GiSword size={24} color="#FFD700" />
      </div>
      <div className="p-2 bg-gray-900/80 rounded">
        <GiShield size={24} color="#4A90D9" />
      </div>
    </div>
  );
}

// Escena principal
export function DungeonScene() {
  return (
    <div className="relative w-full h-screen">
      {/* Notificaciones */}
      <Toaster position="top-right" theme="dark" richColors />

      {/* HUD */}
      <GameHUD />

      {/* Canvas 3D */}
      <Canvas shadows camera={{ position: [0, 5, 10], fov: 60 }}>
        {/* Monitor de rendimiento (solo en dev) */}
        {import.meta.env.DEV && <Perf position="bottom-left" minimal />}

        {/* Iluminación */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 10, 5]} castShadow intensity={1} />

        {/* Entorno */}
        <Environment preset="night" />

        {/* Controles */}
        <OrbitControls />

        {/* Aquí va tu escena 3D */}
      </Canvas>
    </div>
  );
}
```

---

## 📦 Resumen de imports rápido

```tsx
// Audio
import { Howl, Howler } from 'howler';

// Iconos
import { GiSword, GiShield, GiPotion } from 'react-icons/gi';
import { FaHeart, FaStar } from 'react-icons/fa';

// Notificaciones
import { toast, Toaster } from 'sonner';

// Monitor de rendimiento
import { Perf } from 'r3f-perf';

// Animaciones 3D
import { useSpring, animated } from '@react-spring/three';

// Utilidades Three.js
import { GLTFLoader, DRACOLoader } from 'three-stdlib';

// Materiales por capas
import { LayerMaterial, Depth, Fresnel, Noise } from 'lamina';

// Stats
import Stats from 'stats-gl';
```

---

## 📁 Estructura de archivos de audio recomendada

```
public/
  assets/
    audio/
      music/
        main-theme.mp3
        dungeon-theme.mp3
        battle-theme.mp3
        victory.mp3
      sfx/
        sword-hit.mp3
        shield-block.mp3
        potion-drink.mp3
        level-up.mp3
        coin-pickup.mp3
        door-open.mp3
        footstep.mp3
        magic-spell.mp3
        enemy-death.mp3
        critical-hit.mp3
```

> **Tip:** Usa archivos `.mp3` para compatibilidad universal, o `.webm`/`.ogg` para mejor calidad/peso.

---
---

# 🎮 Guía de Librerías Instaladas - Parte 2

## Índice (Parte 2)
9. [@use-gesture/react — Controles Táctiles y Gestos](#9-use-gesturereact--controles-táctiles-y-gestos)
10. [react-hotkeys-hook — Atajos de Teclado](#10-react-hotkeys-hook--atajos-de-teclado)
11. [@dnd-kit — Drag & Drop para Inventario](#11-dnd-kit--drag--drop-para-inventario)
12. [nanoid — Generador de IDs Únicos](#12-nanoid--generador-de-ids-únicos)
13. [clsx — Clases CSS Condicionales](#13-clsx--clases-css-condicionales)
14. [react-virtuoso — Scroll Virtual para Listas Largas](#14-react-virtuoso--scroll-virtual-para-listas-largas)
15. [@tanstack/react-query — Caché y Estado del Servidor](#15-tanstackreact-query--caché-y-estado-del-servidor)
16. [GSAP — Animaciones Profesionales](#16-gsap--animaciones-profesionales)
17. [Embla Carousel — Carruseles](#17-embla-carousel--carruseles)
18. [React Tooltip — Tooltips para Items](#18-react-tooltip--tooltips-para-items)

---

## 9. @use-gesture/react — Controles Táctiles y Gestos

> Controles táctiles avanzados: arrastrar, pellizcar, deslizar. **Esencial para móvil (Capacitor).**

### Ejemplo: Joystick virtual para mover personaje

```tsx
import { useDrag } from '@use-gesture/react';
import { useState } from 'react';

function VirtualJoystick({ onMove }: { onMove: (x: number, y: number) => void }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const bind = useDrag(({ movement: [mx, my], down }) => {
    // Limitar el movimiento a un radio de 50px
    const maxRadius = 50;
    const distance = Math.sqrt(mx * mx + my * my);
    const clampedX = distance > maxRadius ? (mx / distance) * maxRadius : mx;
    const clampedY = distance > maxRadius ? (my / distance) * maxRadius : my;

    if (down) {
      setPos({ x: clampedX, y: clampedY });
      // Normalizar a -1..1 para el movimiento del personaje
      onMove(clampedX / maxRadius, clampedY / maxRadius);
    } else {
      setPos({ x: 0, y: 0 });
      onMove(0, 0);
    }
  });

  return (
    <div className="fixed bottom-8 left-8 z-50">
      {/* Base del joystick */}
      <div className="w-32 h-32 rounded-full bg-black/30 border border-white/20 flex items-center justify-center">
        {/* Stick */}
        <div
          {...bind()}
          className="w-16 h-16 rounded-full bg-white/40 cursor-grab active:cursor-grabbing touch-none"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px)`,
          }}
        />
      </div>
    </div>
  );
}
```

### Ejemplo: Pellizcar para hacer zoom en el mapa

```tsx
import { usePinch } from '@use-gesture/react';
import { useState, useRef } from 'react';

function ZoomableMap() {
  const [zoom, setZoom] = useState(1);
  const mapRef = useRef<HTMLDivElement>(null);

  const bind = usePinch(
    ({ offset: [scale] }) => {
      setZoom(Math.min(Math.max(scale, 0.5), 3)); // limitar zoom 0.5x - 3x
    },
    {
      target: mapRef,
      scaleBounds: { min: 0.5, max: 3 },
    }
  );

  return (
    <div ref={mapRef} {...bind()} className="touch-none overflow-hidden">
      <img
        src="/assets/map/world-map.png"
        alt="Mapa del mundo"
        style={{ transform: `scale(${zoom})` }}
        className="transition-transform"
      />
    </div>
  );
}
```

### Ejemplo: Deslizar para cambiar de habilidad (swipe)

```tsx
import { useSwipeable } from '@use-gesture/react';
import { useState } from 'react';

const skills = ['Fireball', 'Ice Bolt', 'Thunder', 'Heal', 'Shield'];

function SkillSwiper() {
  const [activeSkill, setActiveSkill] = useState(0);

  const bind = useDrag(({ swipe: [swipeX] }) => {
    if (swipeX === 1) {
      // Swipe derecha → siguiente habilidad
      setActiveSkill((prev) => Math.min(prev + 1, skills.length - 1));
    } else if (swipeX === -1) {
      // Swipe izquierda → habilidad anterior
      setActiveSkill((prev) => Math.max(prev - 1, 0));
    }
  }, { swipe: { distance: 50 } });

  return (
    <div {...bind()} className="touch-none p-4 text-center">
      <p className="text-yellow-400 text-xl">{skills[activeSkill]}</p>
      <p className="text-gray-400 text-sm">← Desliza para cambiar →</p>
    </div>
  );
}
```

### Ejemplo: Arrastrar objetos 3D con @react-three/fiber

```tsx
import { useDrag } from '@use-gesture/react';
import { useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

function DraggableObject3D() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size, viewport } = useThree();
  const aspect = size.width / viewport.width;

  const [pos, setPos] = useState<[number, number, number]>([0, 0, 0]);

  const bind = useDrag(({ offset: [x, y] }) => {
    setPos([x / aspect, -y / aspect, 0]);
  });

  return (
    <mesh ref={meshRef} position={pos} {...(bind() as any)}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}
```

---

## 10. react-hotkeys-hook — Atajos de Teclado

> Atajos de teclado declarativos. Perfecto para combate, inventario, menús.

### Ejemplo: Atajos de combate

```tsx
import { useHotkeys } from 'react-hotkeys-hook';

function CombatControls() {
  // Ataque básico (tecla 1 o Q)
  useHotkeys('1, q', () => {
    console.log('Ataque básico');
    performAttack('basic');
  });

  // Habilidad especial (tecla 2 o W)
  useHotkeys('2, w', () => {
    console.log('Habilidad especial');
    performAttack('special');
  });

  // Usar poción (tecla 3 o E)
  useHotkeys('3, e', () => {
    console.log('Usar poción');
    usePotion();
  });

  // Defenderse (tecla 4 o R)
  useHotkeys('4, r', () => {
    console.log('Defenderse');
    defend();
  });

  // Huir (Escape)
  useHotkeys('escape', () => {
    console.log('Huir del combate');
    flee();
  });

  return (
    <div className="flex gap-2">
      <button className="p-3 bg-red-900 rounded">[1/Q] Atacar</button>
      <button className="p-3 bg-blue-900 rounded">[2/W] Especial</button>
      <button className="p-3 bg-green-900 rounded">[3/E] Poción</button>
      <button className="p-3 bg-gray-700 rounded">[4/R] Defender</button>
    </div>
  );
}
```

### Ejemplo: Abrir/cerrar inventario, mapa, chat

```tsx
import { useHotkeys } from 'react-hotkeys-hook';
import { useState } from 'react';

function GameUI() {
  const [showInventory, setShowInventory] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // I = Inventario
  useHotkeys('i', () => setShowInventory(prev => !prev), { preventDefault: true });

  // M = Mapa
  useHotkeys('m', () => setShowMap(prev => !prev), { preventDefault: true });

  // Enter = Chat
  useHotkeys('enter', () => setShowChat(prev => !prev));

  // Escape = Cerrar todo / Ajustes
  useHotkeys('escape', () => {
    if (showInventory) setShowInventory(false);
    else if (showMap) setShowMap(false);
    else if (showChat) setShowChat(false);
    else setShowSettings(prev => !prev);
  });

  // F11 = Pantalla completa
  useHotkeys('f11', (e) => {
    e.preventDefault();
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  });

  // Ctrl+S = Guardar partida (prevenir guardado del navegador)
  useHotkeys('ctrl+s', (e) => {
    e.preventDefault();
    saveGame();
    toast.success('Partida guardada');
  });

  return (
    <>
      {showInventory && <InventoryPanel />}
      {showMap && <MapPanel />}
      {showChat && <ChatPanel />}
      {showSettings && <SettingsPanel />}
    </>
  );
}
```

### Ejemplo: Movimiento WASD

```tsx
import { useHotkeys } from 'react-hotkeys-hook';
import { useRef } from 'react';

function useWASDMovement() {
  const movement = useRef({ forward: false, backward: false, left: false, right: false });

  useHotkeys('w', () => { movement.current.forward = true; },  { keydown: true, keyup: false });
  useHotkeys('w', () => { movement.current.forward = false; }, { keydown: false, keyup: true });

  useHotkeys('s', () => { movement.current.backward = true; },  { keydown: true, keyup: false });
  useHotkeys('s', () => { movement.current.backward = false; }, { keydown: false, keyup: true });

  useHotkeys('a', () => { movement.current.left = true; },  { keydown: true, keyup: false });
  useHotkeys('a', () => { movement.current.left = false; }, { keydown: false, keyup: true });

  useHotkeys('d', () => { movement.current.right = true; },  { keydown: true, keyup: false });
  useHotkeys('d', () => { movement.current.right = false; }, { keydown: false, keyup: true });

  return movement;
}
```

---

## 11. @dnd-kit — Drag & Drop para Inventario

> Sistema de drag & drop modular. Ideal para reorganizar inventario, equipar items, etc.

### Ejemplo: Inventario con drag & drop

```tsx
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { GiSword, GiShield, GiPotion, GiGem } from 'react-icons/gi';

// Tipo de item
interface InventoryItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// Colores de rareza
const rarityColors = {
  common: '#9CA3AF',
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#F59E0B',
};

// Componente de item arrastrable
function SortableItem({ item }: { item: InventoryItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    borderColor: rarityColors[item.rarity],
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="w-16 h-16 bg-gray-800 border-2 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-gray-700"
      title={item.name}
    >
      <item.icon size={32} color={rarityColors[item.rarity]} />
    </div>
  );
}

// Inventario principal
function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([
    { id: '1', name: 'Espada de Fuego', icon: GiSword, rarity: 'legendary' },
    { id: '2', name: 'Escudo de Hierro', icon: GiShield, rarity: 'common' },
    { id: '3', name: 'Poción de Vida', icon: GiPotion, rarity: 'common' },
    { id: '4', name: 'Gema Arcana', icon: GiGem, rarity: 'epic' },
    // ... más items
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // mínimo 5px para activar drag
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="p-4 bg-gray-900 rounded-xl border border-gray-700">
      <h2 className="text-xl font-bold mb-4 text-yellow-400">🎒 Inventario</h2>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-6 gap-2">
            {items.map((item) => (
              <SortableItem key={item.id} item={item} />
            ))}
            {/* Slots vacíos */}
            {Array.from({ length: 24 - items.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="w-16 h-16 bg-gray-800/50 border border-gray-700 rounded-lg"
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
```

### Ejemplo: Equipar items (arrastrar de inventario a slot de equipo)

```tsx
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';

// Slot de equipo (donde se suelta el item)
function EquipSlot({ id, label, equippedItem }: { id: string; label: string; equippedItem?: InventoryItem }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`w-20 h-20 border-2 rounded-lg flex flex-col items-center justify-center
        ${isOver ? 'border-yellow-400 bg-yellow-400/10' : 'border-gray-600 bg-gray-800'}
      `}
    >
      {equippedItem ? (
        <equippedItem.icon size={36} color={rarityColors[equippedItem.rarity]} />
      ) : (
        <span className="text-xs text-gray-500">{label}</span>
      )}
    </div>
  );
}

// Item arrastrable
function DraggableItem({ item }: { item: InventoryItem }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: item.id,
    data: item, // pasar datos del item
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="w-16 h-16 bg-gray-800 border border-gray-600 rounded cursor-grab"
      style={{ transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined }}
    >
      <item.icon size={32} color={rarityColors[item.rarity]} />
    </div>
  );
}

// Panel completo
function EquipmentPanel() {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over) {
      // active.id = id del item
      // over.id = id del slot ('weapon', 'armor', 'shield', etc.)
      equipItem(active.id as string, over.id as string);
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-8">
        {/* Slots de equipo */}
        <div className="flex flex-col gap-2">
          <EquipSlot id="helmet" label="Casco" />
          <EquipSlot id="weapon" label="Arma" />
          <EquipSlot id="armor" label="Armadura" />
          <EquipSlot id="shield" label="Escudo" />
          <EquipSlot id="boots" label="Botas" />
        </div>

        {/* Inventario */}
        <div className="grid grid-cols-4 gap-2">
          {items.map((item) => (
            <DraggableItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </DndContext>
  );
}
```

---

## 12. nanoid — Generador de IDs Únicos

> IDs únicos, compactos y seguros. Más rápido y pequeño que UUID.

### Ejemplo: Generar IDs para items, sesiones, jugadores

```tsx
import { nanoid } from 'nanoid';

// ID estándar (21 caracteres) → "V1StGXR8_Z5jdHi6B-myT"
const itemId = nanoid();

// ID personalizado (más corto)
const sessionId = nanoid(10);     // → "IRFa-VaY2b"
const shortCode = nanoid(6);      // → "x7Zk9a" — para códigos de sala

// ========================================
// USOS PRÁCTICOS EN EL JUEGO
// ========================================

// Crear un nuevo item
function createItem(name: string, type: string) {
  return {
    id: nanoid(),
    name,
    type,
    createdAt: Date.now(),
  };
}

const sword = createItem('Espada de Fuego', 'weapon');
// { id: "V1StGXR8_Z5jdHi6B-myT", name: "Espada de Fuego", type: "weapon", ... }

// Crear sesión de mazmorra
function createDungeonSession(dungeonId: string) {
  return {
    sessionId: nanoid(12),
    dungeonId,
    startedAt: Date.now(),
    players: [],
  };
}

// Código para unirse a sala multijugador
function generateRoomCode(): string {
  return nanoid(6).toUpperCase(); // → "X7ZK9A"
}

// Generar loot aleatorio
function generateLoot(enemyLevel: number) {
  return {
    id: nanoid(),
    name: `Item ${nanoid(4)}`,
    level: enemyLevel,
    stats: { /* ... */ },
  };
}
```

---

## 13. clsx — Clases CSS Condicionales

> Combina clases CSS de forma limpia y condicional. Reemplaza template literals feos.

### Ejemplo: Botón con estados

```tsx
import clsx from 'clsx';

function GameButton({
  variant = 'primary',
  size = 'md',
  disabled = false,
  active = false,
  children,
  onClick,
}: {
  variant?: 'primary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        // Base
        'rounded-lg font-bold transition-all',

        // Tamaño
        size === 'sm' && 'px-2 py-1 text-sm',
        size === 'md' && 'px-4 py-2 text-base',
        size === 'lg' && 'px-6 py-3 text-lg',

        // Variante
        variant === 'primary' && 'bg-yellow-600 hover:bg-yellow-500 text-white',
        variant === 'danger' && 'bg-red-600 hover:bg-red-500 text-white',
        variant === 'success' && 'bg-green-600 hover:bg-green-500 text-white',
        variant === 'ghost' && 'bg-transparent hover:bg-white/10 text-gray-300',

        // Estados
        disabled && 'opacity-50 cursor-not-allowed',
        active && 'ring-2 ring-yellow-400 scale-105',
      )}
    >
      {children}
    </button>
  );
}
```

### Ejemplo: Barra de vida con colores dinámicos

```tsx
import clsx from 'clsx';

function HealthBar({ current, max }: { current: number; max: number }) {
  const percent = (current / max) * 100;

  return (
    <div className="w-48 h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
      <div
        className={clsx(
          'h-full transition-all duration-300 rounded-full',
          percent > 60 && 'bg-green-500',
          percent > 30 && percent <= 60 && 'bg-yellow-500',
          percent <= 30 && 'bg-red-500',
          percent <= 15 && 'animate-pulse', // parpadea cuando vida baja
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
```

### Ejemplo: Tarjeta de item con rareza

```tsx
import clsx from 'clsx';

function ItemCard({ item }: { item: { name: string; rarity: string; equipped: boolean } }) {
  return (
    <div
      className={clsx(
        'p-3 rounded-lg border-2 cursor-pointer transition-all hover:scale-105',

        // Color por rareza
        item.rarity === 'common' && 'border-gray-500 bg-gray-800',
        item.rarity === 'rare' && 'border-blue-500 bg-blue-900/30',
        item.rarity === 'epic' && 'border-purple-500 bg-purple-900/30',
        item.rarity === 'legendary' && 'border-yellow-500 bg-yellow-900/30 shadow-lg shadow-yellow-500/20',

        // Equipado
        item.equipped && 'ring-2 ring-white/50',
      )}
    >
      <span className="font-bold">{item.name}</span>
    </div>
  );
}
```

---

## 14. react-virtuoso — Scroll Virtual para Listas Largas

> Renderiza solo los elementos visibles. Esencial para rankings, chat, logs, marketplace con miles de items.

### Ejemplo: Lista de ranking con scroll virtual

```tsx
import { Virtuoso } from 'react-virtuoso';

interface PlayerRank {
  rank: number;
  name: string;
  level: number;
  score: number;
}

function RankingList({ players }: { players: PlayerRank[] }) {
  return (
    <Virtuoso
      style={{ height: '500px' }}
      totalCount={players.length}
      data={players}
      itemContent={(index, player) => (
        <div
          className={clsx(
            'flex items-center gap-4 p-3 border-b border-gray-800',
            index < 3 && 'bg-yellow-900/20', // Top 3 destacados
          )}
        >
          {/* Posición */}
          <span className={clsx(
            'w-8 text-center font-bold',
            index === 0 && 'text-yellow-400 text-xl',
            index === 1 && 'text-gray-300 text-lg',
            index === 2 && 'text-amber-600 text-lg',
          )}>
            {player.rank}
          </span>

          {/* Nombre */}
          <span className="flex-1 font-medium">{player.name}</span>

          {/* Nivel */}
          <span className="text-sm text-gray-400">Lvl {player.level}</span>

          {/* Puntuación */}
          <span className="text-yellow-400 font-bold">{player.score.toLocaleString()}</span>
        </div>
      )}
    />
  );
}

// Renderiza 10,000 jugadores sin problemas de rendimiento:
// <RankingList players={allPlayers} />
```

### Ejemplo: Chat con scroll infinito (cargar mensajes antiguos al subir)

```tsx
import { Virtuoso } from 'react-virtuoso';
import { useRef, useState } from 'react';

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

function ChatWindow({ messages }: { messages: ChatMessage[] }) {
  const virtuosoRef = useRef(null);

  return (
    <div className="h-96 bg-gray-900 rounded-lg">
      <Virtuoso
        ref={virtuosoRef}
        data={messages}
        initialTopMostItemIndex={messages.length - 1} // empezar desde el último mensaje
        followOutput="smooth" // auto-scroll cuando llegan nuevos mensajes
        itemContent={(index, message) => (
          <div className="p-2 hover:bg-gray-800">
            <span className="text-yellow-400 font-bold text-sm">{message.sender}: </span>
            <span className="text-gray-300">{message.text}</span>
          </div>
        )}
      />
    </div>
  );
}
```

### Ejemplo: Marketplace con grid virtual

```tsx
import { VirtuosoGrid } from 'react-virtuoso';

function MarketplaceGrid({ items }: { items: MarketItem[] }) {
  return (
    <VirtuosoGrid
      style={{ height: '600px' }}
      totalCount={items.length}
      listClassName="grid grid-cols-4 gap-3 p-3"
      itemContent={(index) => (
        <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-yellow-500 cursor-pointer">
          <div className="w-16 h-16 mx-auto bg-gray-700 rounded" />
          <p className="text-sm text-center mt-2">{items[index].name}</p>
          <p className="text-yellow-400 text-center">{items[index].price} 🪙</p>
        </div>
      )}
    />
  );
}
```

---

## 15. @tanstack/react-query — Caché y Estado del Servidor

> Gestión de datos del servidor con caché automático, revalidación, y estados de carga.

### Ejemplo: Setup en App.tsx

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // datos "frescos" por 5 minutos
      gcTime: 30 * 60 * 1000,       // garbage collection a los 30 min
      retry: 2,                     // reintentar 2 veces en error
      refetchOnWindowFocus: false,  // no refetch al hacer focus
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Tu app */}
    </QueryClientProvider>
  );
}
```

### Ejemplo: Obtener ranking con caché

```tsx
import { useQuery } from '@tanstack/react-query';
import { rankingService } from '../services/ranking.service';

function useRanking(page: number) {
  return useQuery({
    queryKey: ['ranking', page],     // clave de caché única
    queryFn: () => rankingService.getRanking(page),
    staleTime: 60 * 1000,           // ranking fresco por 1 minuto
  });
}

// En el componente:
function RankingPage() {
  const { data, isLoading, error, refetch } = useRanking(1);

  if (isLoading) return <p>Cargando ranking...</p>;
  if (error) return <p>Error al cargar ranking</p>;

  return (
    <div>
      <RankingList players={data} />
      <button onClick={() => refetch()}>Actualizar</button>
    </div>
  );
}
```

### Ejemplo: Inventario con mutaciones (comprar/vender)

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../services/inventory.service';
import { shopService } from '../services/shop.service';
import { toast } from 'sonner';

// Hook para obtener inventario
function useInventory() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryService.getInventory(),
  });
}

// Hook para comprar un item
function useBuyItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => shopService.buyItem(itemId),
    onSuccess: () => {
      // Invalidar caché → se refetcha automáticamente
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['player'] }); // actualizar oro
      toast.success('¡Item comprado!');
    },
    onError: (error) => {
      toast.error('Error al comprar: ' + error.message);
    },
  });
}

// Hook para vender
function useSellItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      shopService.sellItem(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['player'] });
      toast.success('¡Item vendido!');
    },
  });
}

// Uso en componente:
function ShopPage() {
  const { data: inventory, isLoading } = useInventory();
  const buyItem = useBuyItem();
  const sellItem = useSellItem();

  return (
    <button
      onClick={() => buyItem.mutate('sword-01')}
      disabled={buyItem.isPending}
    >
      {buyItem.isPending ? 'Comprando...' : 'Comprar Espada'}
    </button>
  );
}
```

### Ejemplo: Datos del jugador (siempre en caché)

```tsx
import { useQuery } from '@tanstack/react-query';

function usePlayerData() {
  return useQuery({
    queryKey: ['player'],
    queryFn: () => fetch('/api/player/me').then(r => r.json()),
    staleTime: 30 * 1000,          // fresco por 30 seg
    refetchInterval: 60 * 1000,    // refetch cada 60 seg (sincronizar oro, XP, etc.)
  });
}

// Los datos del jugador están disponibles en toda la app sin hacer fetch extra
```

---

## 16. GSAP — Animaciones Profesionales

> La librería de animaciones más potente. Ideal para UI del juego, transiciones de pantalla, efectos de combate.

### Ejemplo: Número de daño flotante (como en los RPG)

```tsx
import { useRef, useEffect } from 'react';
import gsap from 'gsap';

function DamageNumber({ damage, position }: { damage: number; position: { x: number; y: number } }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    gsap.fromTo(ref.current,
      {
        opacity: 1,
        y: 0,
        scale: 0.5,
      },
      {
        opacity: 0,
        y: -80,        // sube 80px
        scale: 1.5,     // se agranda
        duration: 1.2,
        ease: 'power2.out',
        onComplete: () => {
          // Remover del DOM después de la animación
        },
      }
    );
  }, []);

  return (
    <div
      ref={ref}
      className="absolute text-red-500 font-bold text-2xl pointer-events-none"
      style={{ left: position.x, top: position.y }}
    >
      -{damage}
    </div>
  );
}
```

### Ejemplo: Animación de subida de nivel

```tsx
import gsap from 'gsap';
import { useRef, useEffect } from 'react';

function LevelUpAnimation({ level }: { level: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline();

    tl
      // Fondo aparece
      .fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 })
      // Texto entra con rebote
      .fromTo(textRef.current,
        { scale: 0, rotation: -15 },
        { scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(1.7)' }
      )
      // Brillo pulsa
      .fromTo(glowRef.current,
        { scale: 0.5, opacity: 0 },
        { scale: 2, opacity: 0.6, duration: 0.8, ease: 'power2.out' }
      )
      // Todo desaparece
      .to(containerRef.current, { opacity: 0, duration: 0.5, delay: 1.5 });

    return () => { tl.kill(); };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      {/* Brillo de fondo */}
      <div ref={glowRef} className="absolute w-64 h-64 rounded-full bg-yellow-400/30 blur-3xl" />
      {/* Texto */}
      <h1 ref={textRef} className="text-6xl font-bold text-yellow-400 drop-shadow-lg">
        ¡NIVEL {level}!
      </h1>
    </div>
  );
}
```

### Ejemplo: Barra de XP animada

```tsx
import gsap from 'gsap';
import { useRef, useEffect } from 'react';

function XPBar({ current, max, prevValue }: { current: number; max: number; prevValue: number }) {
  const barRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!barRef.current || !textRef.current) return;

    // Animar el ancho de la barra
    gsap.fromTo(barRef.current,
      { width: `${(prevValue / max) * 100}%` },
      { width: `${(current / max) * 100}%`, duration: 1, ease: 'power2.out' }
    );

    // Animar el número contando
    gsap.fromTo(textRef.current,
      { innerText: prevValue },
      {
        innerText: current,
        duration: 1,
        snap: { innerText: 1 }, // números enteros
        ease: 'power2.out',
      }
    );
  }, [current, max, prevValue]);

  return (
    <div className="w-64">
      <div className="flex justify-between text-sm mb-1">
        <span>XP</span>
        <span><span ref={textRef}>{current}</span> / {max}</span>
      </div>
      <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
        <div ref={barRef} className="h-full bg-blue-500 rounded-full" />
      </div>
    </div>
  );
}
```

### Ejemplo: Transición de pantalla (wipe/fade)

```tsx
import gsap from 'gsap';
import { useRef } from 'react';

function ScreenTransition() {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Llamar cuando cambias de escena
  const transition = (onMidpoint: () => void) => {
    const tl = gsap.timeline();
    tl
      // Cerrar (cortina negra)
      .to(overlayRef.current, {
        scaleY: 1,
        duration: 0.5,
        ease: 'power2.in',
        transformOrigin: 'top',
      })
      // Ejecutar cambio de escena en el punto medio
      .call(onMidpoint)
      // Abrir
      .to(overlayRef.current, {
        scaleY: 0,
        duration: 0.5,
        ease: 'power2.out',
        transformOrigin: 'bottom',
        delay: 0.2,
      });
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black z-[100] pointer-events-none"
      style={{ transform: 'scaleY(0)' }}
    />
  );
}
```

### Ejemplo: Shake de cámara (al recibir daño)

```tsx
import gsap from 'gsap';

function shakeScreen(intensity = 10, duration = 0.3) {
  const container = document.getElementById('game-container');
  if (!container) return;

  gsap.to(container, {
    x: `random(-${intensity}, ${intensity})`,
    y: `random(-${intensity}, ${intensity})`,
    duration: 0.05,
    repeat: Math.floor(duration / 0.05),
    yoyo: true,
    ease: 'none',
    onComplete: () => {
      gsap.set(container, { x: 0, y: 0 }); // resetear
    },
  });
}

// Llamar al recibir daño:
// shakeScreen(15, 0.4); // sacudida fuerte
// shakeScreen(5, 0.2);  // sacudida leve
```

---

## 17. Embla Carousel — Carruseles

> Carrusel ligero y táctil. Ideal para selección de personajes, items, habilidades.

### Ejemplo: Selector de personaje

```tsx
import useEmblaCarousel from 'embla-carousel-react';

const characters = [
  { id: 1, name: 'Guerrero', class: 'Tank', image: '/assets/characters/warrior.png' },
  { id: 2, name: 'Mago', class: 'DPS', image: '/assets/characters/mage.png' },
  { id: 3, name: 'Arquera', class: 'DPS', image: '/assets/characters/archer.png' },
  { id: 4, name: 'Clérigo', class: 'Healer', image: '/assets/characters/cleric.png' },
  { id: 5, name: 'Asesino', class: 'DPS', image: '/assets/characters/rogue.png' },
];

function CharacterSelector({ onSelect }: { onSelect: (id: number) => void }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,           // loop infinito
    align: 'center',      // centrar el slide activo
    dragFree: false,       // snap a cada slide
  });

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  return (
    <div className="relative max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-center mb-4 text-yellow-400">
        Elige tu Personaje
      </h2>

      {/* Carrusel */}
      <div ref={emblaRef} className="overflow-hidden rounded-xl">
        <div className="flex">
          {characters.map((char) => (
            <div key={char.id} className="flex-none w-full px-4">
              <div className="bg-gray-800 rounded-xl p-6 text-center border border-gray-700">
                <img
                  src={char.image}
                  alt={char.name}
                  className="w-48 h-48 mx-auto object-contain"
                />
                <h3 className="text-xl font-bold mt-4">{char.name}</h3>
                <p className="text-gray-400">{char.class}</p>
                <button
                  onClick={() => onSelect(char.id)}
                  className="mt-4 px-6 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-bold"
                >
                  Seleccionar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botones de navegación */}
      <button
        onClick={scrollPrev}
        className="absolute left-0 top-1/2 -translate-y-1/2 p-3 bg-black/60 rounded-full hover:bg-black/80"
      >
        ◀
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 p-3 bg-black/60 rounded-full hover:bg-black/80"
      >
        ▶
      </button>
    </div>
  );
}
```

### Ejemplo: Carrusel de habilidades (horizontal, pequeño)

```tsx
import useEmblaCarousel from 'embla-carousel-react';
import { GiFireball, GiIceBolt, GiLightningBolt, GiHealing, GiShield } from 'react-icons/gi';

const skills = [
  { id: 1, name: 'Bola de Fuego', icon: GiFireball, color: '#FF4400', cooldown: 5 },
  { id: 2, name: 'Rayo de Hielo', icon: GiIceBolt, color: '#00CCFF', cooldown: 3 },
  { id: 3, name: 'Relámpago', icon: GiLightningBolt, color: '#FFFF00', cooldown: 8 },
  { id: 4, name: 'Curación', icon: GiHealing, color: '#00FF88', cooldown: 10 },
  { id: 5, name: 'Escudo', icon: GiShield, color: '#4A90D9', cooldown: 15 },
];

function SkillBar() {
  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    dragFree: true,
    containScroll: 'trimSnaps',
  });

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div ref={emblaRef} className="overflow-hidden max-w-sm">
        <div className="flex gap-2">
          {skills.map((skill) => (
            <button
              key={skill.id}
              className="flex-none w-16 h-16 rounded-xl bg-gray-800/90 border-2 border-gray-600 
                         hover:border-yellow-400 flex items-center justify-center transition-all
                         active:scale-90"
              title={`${skill.name} (CD: ${skill.cooldown}s)`}
            >
              <skill.icon size={32} color={skill.color} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 18. React Tooltip — Tooltips para Items

> Tooltips informativos al pasar el mouse sobre items, habilidades, etc.

### Ejemplo: Tooltip de item (estilo RPG)

```tsx
import { Tooltip } from 'react-tooltip';
import { GiSword } from 'react-icons/gi';

// Agregar el componente Tooltip UNA VEZ en tu layout
function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {/* Tooltip global - solo necesitas uno */}
      <Tooltip
        id="item-tooltip"
        className="!bg-gray-900 !border !border-gray-600 !rounded-lg !p-0 !opacity-100 !max-w-xs z-50"
        place="top"
        delayShow={200}
      />
    </>
  );
}

// Cada item usa data-tooltip-id y data-tooltip-html
function InventorySlot({ item }: { item: GameItem }) {
  const rarityColors: Record<string, string> = {
    common: '#9CA3AF',
    rare: '#3B82F6',
    epic: '#8B5CF6',
    legendary: '#F59E0B',
  };

  const tooltipContent = `
    <div style="padding: 12px; min-width: 200px;">
      <h3 style="color: ${rarityColors[item.rarity]}; font-weight: bold; font-size: 16px; margin-bottom: 4px;">
        ${item.name}
      </h3>
      <p style="color: #9CA3AF; font-size: 12px; text-transform: capitalize; margin-bottom: 8px;">
        ${item.rarity} ${item.type}
      </p>
      <hr style="border-color: #374151; margin: 8px 0;" />
      <div style="font-size: 13px;">
        ${item.attack ? `<p style="color: #EF4444;">⚔️ Ataque: +${item.attack}</p>` : ''}
        ${item.defense ? `<p style="color: #3B82F6;">🛡️ Defensa: +${item.defense}</p>` : ''}
        ${item.health ? `<p style="color: #22C55E;">❤️ Vida: +${item.health}</p>` : ''}
        ${item.magic ? `<p style="color: #A855F7;">✨ Magia: +${item.magic}</p>` : ''}
      </div>
      ${item.description ? `
        <hr style="border-color: #374151; margin: 8px 0;" />
        <p style="color: #6B7280; font-style: italic; font-size: 12px;">"${item.description}"</p>
      ` : ''}
      <hr style="border-color: #374151; margin: 8px 0;" />
      <p style="color: #F59E0B; font-size: 13px;">💰 Valor: ${item.price} oro</p>
    </div>
  `;

  return (
    <div
      data-tooltip-id="item-tooltip"
      data-tooltip-html={tooltipContent}
      className="w-16 h-16 bg-gray-800 border-2 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-700"
      style={{ borderColor: rarityColors[item.rarity] }}
    >
      <GiSword size={32} color={rarityColors[item.rarity]} />
    </div>
  );
}
```

### Ejemplo: Tooltip de habilidad con cooldown

```tsx
function SkillButton({ skill }: { skill: Skill }) {
  const tooltipContent = `
    <div style="padding: 12px; min-width: 180px;">
      <h3 style="color: #FFD700; font-weight: bold;">${skill.name}</h3>
      <p style="color: #9CA3AF; font-size: 12px; margin: 4px 0 8px;">Nivel ${skill.level}</p>
      <p style="color: #E5E7EB; font-size: 13px;">${skill.description}</p>
      <hr style="border-color: #374151; margin: 8px 0;" />
      <p style="color: #EF4444; font-size: 12px;">🔥 Daño: ${skill.damage}</p>
      <p style="color: #3B82F6; font-size: 12px;">💧 Maná: ${skill.manaCost}</p>
      <p style="color: #9CA3AF; font-size: 12px;">⏱️ Cooldown: ${skill.cooldown}s</p>
    </div>
  `;

  return (
    <button
      data-tooltip-id="item-tooltip"
      data-tooltip-html={tooltipContent}
      className="w-14 h-14 rounded-lg bg-gray-800 border border-gray-600 hover:border-yellow-400"
    >
      <skill.icon size={28} color={skill.color} />
    </button>
  );
}
```

---

## 📦 Resumen completo de imports (Parte 2)

```tsx
// Gestos táctiles (joystick, pinch, swipe)
import { useDrag, usePinch, useScroll } from '@use-gesture/react';

// Atajos de teclado
import { useHotkeys } from 'react-hotkeys-hook';

// Drag & Drop (inventario)
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// IDs únicos
import { nanoid } from 'nanoid';

// Clases CSS condicionales
import clsx from 'clsx';

// Scroll virtual (listas largas)
import { Virtuoso, VirtuosoGrid } from 'react-virtuoso';

// Caché de servidor
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Animaciones profesionales
import gsap from 'gsap';

// Carrusel
import useEmblaCarousel from 'embla-carousel-react';

// Tooltips
import { Tooltip } from 'react-tooltip';
```

---

## 🗂️ Resumen TOTAL de librerías instaladas

### Parte 1 (anteriores)
| Librería | Uso |
|---|---|
| `howler` | Audio y efectos de sonido |
| `react-icons` | +40,000 iconos (incluye RPG) |
| `sonner` | Notificaciones toast |
| `r3f-perf` | Monitor de rendimiento 3D |
| `@react-spring/three` | Animaciones 3D fluidas |
| `three-stdlib` | Loaders y utils para Three.js |
| `lamina` | Materiales por capas (auras, escudos) |
| `stats-gl` | Monitor FPS/GPU |

### Parte 2 (nuevas)
| Librería | Uso |
|---|---|
| `@use-gesture/react` | Joystick virtual, gestos táctiles |
| `react-hotkeys-hook` | Atajos WASD, inventario (I), mapa (M) |
| `@dnd-kit/core` + `sortable` | Drag & drop para inventario |
| `nanoid` | IDs únicos para items, sesiones |
| `clsx` | Clases CSS condicionales limpias |
| `react-virtuoso` | Scroll virtual (ranking, chat, marketplace) |
| `@tanstack/react-query` | Caché de API, mutaciones |
| `gsap` | Animaciones UI (daño flotante, level up, shake) |
| `embla-carousel-react` | Selector de personajes, skills |
| `react-tooltip` | Tooltips RPG para items y skills |
