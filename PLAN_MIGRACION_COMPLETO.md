# 📋 PLAN COMPLETO DE MIGRACIÓN: Angular → React Three Fiber

> **Fecha:** 31 de enero de 2026  
> **Objetivo:** Migrar el proyecto Valnor de Angular 17 + Three.js + Cannon-es → React 19 + React Three Fiber + Rapier

---

## 📊 ANÁLISIS COMPARATIVO

### Estado de la GUÍA (Angular - Completo)

| Categoría | Cantidad | Estado |
|-----------|----------|--------|
| **Features/Módulos** | 12 | ✅ Todos completos |
| **Sistemas del Engine** | 24+ | ✅ Todos completos |
| **Niveles de Juego** | 9 | ✅ Todos completos |
| **Shaders** | 6+ | ✅ Todos completos |
| **Core Services** | 17 | ✅ Todos completos |
| **Guards/Interceptors** | 7 | ✅ Todos completos |
| **Shared Components** | 23+ | ✅ Todos completos |
| **Modelos de Datos** | 8 | ✅ Todos completos |

### Estado ACTUAL del Proyecto (React - En Progreso)

| Categoría | Cantidad | Estado |
|-----------|----------|--------|
| **Pages creadas** | 13 | ✅ UI básica |
| **Services** | 2 | 🔶 Básicos |
| **Hooks** | 1 | 🔶 useAuth |
| **Types** | 3 | 🔶 Básicos |
| **Motor 3D** | 0 | ❌ No iniciado |
| **Niveles** | 0 | ❌ No iniciado |
| **Sistemas** | 0 | ❌ No iniciado |

---

## 🎯 RESUMEN DE LO QUE FALTA MIGRAR

### ❌ CRÍTICO - Motor de Juego 3D (Prioridad ALTA)

```
features/demo/engine/
├── core/                    ❌ NO MIGRADO
│   ├── valnor-engine.ts     → ValnorEngine.tsx (R3F)
│   ├── game-entity.ts       → hooks/useGameEntity.ts
│   ├── game-level.ts        → types/level.types.ts
│   ├── combat-engine.ts     → hooks/useCombat.ts
│   ├── render-pipeline.ts   → PostProcessing de @react-three/postprocessing
│   └── debug-logger.ts      → utils/logger.ts
│
├── systems/ (24 sistemas)   ❌ NO MIGRADO
│   ├── camera-system.ts     → hooks/useCamera.ts + OrbitControls R3F
│   ├── movement-system.ts   → hooks/useMovement.ts + Rapier
│   ├── grounding-system.ts  → hooks/useGrounding.ts + Rapier rays
│   ├── weather-system.ts    → components/Weather.tsx
│   ├── combat-system.ts     → hooks/useCombat.ts
│   ├── animation-system.ts  → hooks/useAnimation.ts + Drei
│   ├── vfx-system.ts        → components/VFX.tsx
│   ├── ultra-sky-system.ts  → components/Sky.tsx + shaders
│   └── ... (16 más)
│
├── levels/ (9 niveles)      ❌ NO MIGRADO
│   ├── preview-level.ts     → scenes/PreviewLevel.tsx
│   ├── castle-level.ts      → scenes/CastleLevel.tsx
│   ├── valley-level.ts      → scenes/ValleyLevel.tsx
│   └── ... (6 más)
│
├── shaders/ (6 shaders)     ❌ NO MIGRADO
│   ├── sky-shader.ts        → shaders/skyShader.ts
│   ├── grass-shader.ts      → shaders/grassShader.ts
│   ├── fire-shader.ts       → shaders/fireShader.ts
│   └── ... (3 más)
│
├── rpg/ (6 módulos)         ❌ NO MIGRADO
│   ├── rpg-types.ts         → types/rpg.types.ts
│   ├── rpg-calculator.ts    → utils/rpg-calculator.ts
│   ├── enemy-factory.ts     → factories/enemy-factory.ts
│   └── ... (3 más)
│
├── character/               ❌ NO MIGRADO
│   ├── Character.ts         → components/Character.tsx
│   ├── states/              → state machine con Zustand
│   └── registry/            → stores/characterStore.ts
│
├── physics/                 ❌ NO MIGRADO
│   ├── CapsuleCollider.ts   → Ya en @react-three/rapier
│   ├── SpringSimulator.ts   → hooks/useSpring.ts
│   └── PhysicsUtils.ts      → utils/physics.ts
│
├── ai/                      ❌ NO MIGRADO
│   └── enemy-ai.ts          → hooks/useEnemyAI.ts
│
└── valnor-world.ts          ❌ NO MIGRADO (97KB!)
    → GameWorld.tsx (orquestador principal R3F)
```

### 🔶 PARCIAL - Services que necesitan expansión

```
GUÍA (Angular)              →  ACTUAL (React)           ESTADO
─────────────────────────────────────────────────────────────
auth.service.ts             →  auth.service.ts          🔶 Parcial
api.service.ts              →  api.service.ts           ✅ OK
socket.service.ts           →  ❌ No existe             ❌ FALTA
dungeon.service.ts          →  ❌ No existe             ❌ FALTA
ranking.service.ts          →  ❌ No existe             ❌ FALTA
pwa.service.ts              →  ❌ No existe             ❌ FALTA
loading.service.ts          →  ❌ (usar Zustand)        ❌ FALTA
network.service.ts          →  ❌ No existe             ❌ FALTA
notification.service.ts     →  ❌ No existe             ❌ FALTA
```

### 🔶 PARCIAL - Types/Models que necesitan expansión

```
GUÍA (Angular)              →  ACTUAL (React)           ESTADO
─────────────────────────────────────────────────────────────
auth.model.ts               →  auth.types.ts            🔶 Parcial
user.model.ts               →  user.types.ts            🔶 Parcial
item.model.ts               →  item.types.ts            🔶 Parcial
character.model.ts          →  ❌ No existe             ❌ FALTA
dungeon.model.ts            →  ❌ No existe             ❌ FALTA
survival.model.ts           →  ❌ No existe             ❌ FALTA
ranking.model.ts            →  ❌ No existe             ❌ FALTA
shop.model.ts               →  ❌ No existe             ❌ FALTA
```

### ❌ FALTA - Shared Components

```
GUÍA                        ACTUAL     PRIORIDAD
─────────────────────────────────────────────────
global-navbar/              ❌         ALTA
loading-screen/             ❌         ALTA
rpg-toast/                  ❌         MEDIA
settings-modal/             ❌         MEDIA
character-card/             ❌         MEDIA
progress-bar/               ❌         BAJA
offline-indicator/          ❌         BAJA
install-prompt/             ❌         BAJA
```

### ❌ FALTA - Guards equivalentes (React Router)

```
GUÍA                    →  REACT EQUIVALENTE
─────────────────────────────────────────────────
auth.guard.ts           →  RequireAuth.tsx (wrapper)
no-auth.guard.ts        →  RequireNoAuth.tsx (wrapper)
verified.guard.ts       →  RequireVerified.tsx (wrapper)
```

---

## 📅 FASES DE MIGRACIÓN

### 🔴 FASE 1: Infraestructura Base (1-2 días)
**Objetivo:** Completar la base del proyecto

| Tarea | Archivo(s) | Prioridad |
|-------|-----------|-----------|
| 1.1 Crear stores Zustand | `stores/gameStore.ts`, `stores/uiStore.ts` | ALTA |
| 1.2 Completar types | `types/character.types.ts`, `types/dungeon.types.ts`, etc. | ALTA |
| 1.3 Guards de rutas | `components/guards/RequireAuth.tsx` | ALTA |
| 1.4 Servicios adicionales | `services/dungeon.service.ts`, `services/socket.service.ts` | MEDIA |

### 🟠 FASE 2: Motor 3D Core (3-5 días)
**Objetivo:** Crear la base del motor en R3F

| Tarea | Descripción | Complejidad |
|-------|-------------|-------------|
| 2.1 GameCanvas | Componente base con Canvas de R3F | MEDIA |
| 2.2 Física Rapier | Setup de RigidBody, Colliders | MEDIA |
| 2.3 Cámara 3ra persona | OrbitControls + sistema custom | ALTA |
| 2.4 Player Controller | Cápsula flotante + movimiento | ALTA |
| 2.5 Input Manager | Hook para teclado/ratón/touch | MEDIA |

**Estructura objetivo:**
```
src/
├── engine/
│   ├── components/
│   │   ├── GameCanvas.tsx      # Canvas principal R3F
│   │   ├── Player.tsx          # Controlador de jugador
│   │   ├── Camera.tsx          # Sistema de cámara
│   │   └── PhysicsWorld.tsx    # Wrapper de Rapier
│   ├── hooks/
│   │   ├── useMovement.ts      # Lógica de movimiento
│   │   ├── useCamera.ts        # Control de cámara
│   │   ├── useInput.ts         # Gestión de inputs
│   │   └── useGrounding.ts     # Detección de suelo
│   └── stores/
│       └── gameStore.ts        # Estado global del juego
```

### 🟡 FASE 3: Sistemas del Engine (5-7 días)
**Objetivo:** Portar los 24 sistemas de Angular

| Sistema | Prioridad | Complejidad | Notas |
|---------|-----------|-------------|-------|
| CameraSystem | ALTA | ALTA | 3ra persona estilo GTA |
| MovementSystem | ALTA | ALTA | Aceleración, coyote time |
| GroundingSystem | ALTA | MEDIA | Raycasts con Rapier |
| AnimationSystem | ALTA | MEDIA | Usar useAnimations de Drei |
| CombatSystem | ALTA | ALTA | Hit detection, daño |
| WeatherSystem | MEDIA | ALTA | Partículas, lluvia/nieve |
| UltraSkySystem | MEDIA | ALTA | Shader de cielo procedural |
| VFXSystem | MEDIA | ALTA | Trails, sparks |
| AudioSystem | MEDIA | MEDIA | Web Audio API |
| PostProcessSystem | BAJA | MEDIA | @react-three/postprocessing |

### 🟢 FASE 4: Niveles (3-5 días)
**Objetivo:** Portar los 9 niveles

| Nivel | Líneas orig. | Prioridad | Contenido |
|-------|-------------|-----------|-----------|
| PreviewLevel | 1663 | ALTA | Lobby con agua y cielo |
| TestLevel | 557 | ALTA | Pruebas básicas |
| CastleLevel | 63136 | MEDIA | Fortaleza medieval |
| ValleyLevel | 8687 | MEDIA | Valle natural |
| CanyonLevel | 14761 | BAJA | Cañón |
| MiningMountainLevel | 36143 | BAJA | Cueva de goblins |

### 🔵 FASE 5: RPG y Combate (2-3 días)
**Objetivo:** Sistema de combate y stats

| Módulo | Descripción |
|--------|-------------|
| rpg-types.ts | Interfaces de stats, items, skills |
| rpg-calculator.ts | Fórmulas de daño, defensa |
| enemy-factory.ts | Generación de enemigos |
| leveling-system.ts | XP, niveles |
| loot-system.ts | Drops, botín |
| save-system.ts | Guardado local/nube |

### 🟣 FASE 6: Shaders y VFX (2-3 días)
**Objetivo:** Efectos visuales avanzados

| Shader | Uso | Migración |
|--------|-----|-----------|
| sky-shader | Cielo procedural | shaderMaterial en R3F |
| grass-shader | Hierba animada | InstancedMesh + shader |
| fire-shader | Fuego | Partículas o shader |
| water-shader | Agua con Fresnel | shaderMaterial |
| stone-shader | Piedra procedural | shaderMaterial |

### ⚫ FASE 7: Integración Final (2-3 días)
**Objetivo:** Conectar todo

| Tarea | Descripción |
|-------|-------------|
| Demo page | Integrar motor con página Demo |
| Lobby | Panel de selección de personaje |
| HUD in-game | Barras de vida, minimapa |
| Settings | Modal de configuración gráfica |
| Transiciones | Fade in/out entre escenas |

---

## 🏗️ ESTRUCTURA FINAL DEL PROYECTO

```
src/
├── App.tsx
├── main.tsx
├── index.css
│
├── config/
│   ├── api.config.ts
│   └── game.config.ts           # ❌ FALTA
│
├── context/
│   └── AuthContext.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useGame.ts               # ❌ FALTA
│   └── index.ts
│
├── services/
│   ├── api.service.ts
│   ├── auth.service.ts
│   ├── dungeon.service.ts       # ❌ FALTA
│   ├── ranking.service.ts       # ❌ FALTA
│   ├── socket.service.ts        # ❌ FALTA
│   └── index.ts
│
├── stores/                      # ❌ FALTA (carpeta completa)
│   ├── gameStore.ts
│   ├── uiStore.ts
│   └── playerStore.ts
│
├── types/
│   ├── auth.types.ts
│   ├── user.types.ts
│   ├── item.types.ts
│   ├── character.types.ts       # ❌ FALTA
│   ├── dungeon.types.ts         # ❌ FALTA
│   ├── survival.types.ts        # ❌ FALTA
│   ├── rpg.types.ts             # ❌ FALTA
│   └── index.ts
│
├── pages/
│   ├── Auth/                    ✅ COMPLETO
│   ├── Dashboard/               ✅ COMPLETO
│   ├── Inventory/               ✅ COMPLETO
│   ├── Shop/                    ✅ COMPLETO
│   ├── Marketplace/             ✅ COMPLETO
│   ├── Dungeon/                 ✅ COMPLETO
│   ├── Ranking/                 ✅ COMPLETO
│   ├── Survival/                ✅ COMPLETO
│   ├── Wiki/                    ✅ COMPLETO
│   ├── Landing/                 ✅ COMPLETO
│   ├── SplashScreen/            ✅ COMPLETO
│   └── Demo/                    # ❌ FALTA (motor 3D)
│       ├── Demo.tsx
│       ├── Demo.css
│       └── components/
│           ├── Lobby.tsx
│           └── GameHUD.tsx
│
├── engine/                      # ❌ FALTA (carpeta completa)
│   ├── components/
│   │   ├── GameCanvas.tsx
│   │   ├── Player.tsx
│   │   ├── Camera.tsx
│   │   ├── Weather.tsx
│   │   ├── Sky.tsx
│   │   └── VFX.tsx
│   │
│   ├── hooks/
│   │   ├── useMovement.ts
│   │   ├── useCamera.ts
│   │   ├── useInput.ts
│   │   ├── useGrounding.ts
│   │   ├── useCombat.ts
│   │   ├── useAnimation.ts
│   │   └── useEnemyAI.ts
│   │
│   ├── scenes/
│   │   ├── PreviewLevel.tsx
│   │   ├── TestLevel.tsx
│   │   ├── CastleLevel.tsx
│   │   └── ...
│   │
│   ├── shaders/
│   │   ├── skyShader.ts
│   │   ├── grassShader.ts
│   │   ├── waterShader.ts
│   │   └── ...
│   │
│   ├── rpg/
│   │   ├── rpg-calculator.ts
│   │   ├── enemy-factory.ts
│   │   ├── leveling-system.ts
│   │   └── ...
│   │
│   └── utils/
│       ├── physics.ts
│       └── logger.ts
│
├── components/                  # ❌ FALTA (shared)
│   ├── guards/
│   │   ├── RequireAuth.tsx
│   │   └── RequireNoAuth.tsx
│   │
│   ├── ui/
│   │   ├── GlobalNavbar.tsx
│   │   ├── LoadingScreen.tsx
│   │   ├── RPGToast.tsx
│   │   ├── SettingsModal.tsx
│   │   └── CharacterCard.tsx
│   │
│   └── common/
│       ├── ProgressBar.tsx
│       └── OfflineIndicator.tsx
│
└── utils/
    ├── helpers.ts
    └── constants.ts
```

---

## 📈 ESTIMACIÓN DE TIEMPO

| Fase | Duración | Dependencias |
|------|----------|--------------|
| Fase 1: Infraestructura | 1-2 días | Ninguna |
| Fase 2: Motor Core | 3-5 días | Fase 1 |
| Fase 3: Sistemas | 5-7 días | Fase 2 |
| Fase 4: Niveles | 3-5 días | Fase 3 |
| Fase 5: RPG | 2-3 días | Fase 2 |
| Fase 6: Shaders | 2-3 días | Fase 3 |
| Fase 7: Integración | 2-3 días | Todas |
| **TOTAL** | **18-28 días** | |

---

## 🚀 PRÓXIMO PASO RECOMENDADO

Comenzar por **Fase 1: Infraestructura Base**:

1. **Crear `stores/gameStore.ts`** con Zustand para estado global del juego
2. **Crear `types/character.types.ts`** y otros tipos faltantes
3. **Crear `components/guards/RequireAuth.tsx`** para proteger rutas

¿Quieres que comience con la **Fase 1** creando los stores y tipos faltantes?

---

## 📚 REFERENCIAS DE LA GUÍA

Los archivos de referencia están en:
- **Documentación general:** `gui a de ejempli/Lee completo/archivos importantes/`
- **Motor 3D completo:** `gui a de ejempli/Lee completo/app/features/demo/engine/`
- **Servicios:** `gui a de ejempli/Lee completo/app/core/services/`
- **Modelos:** `gui a de ejempli/Lee completo/app/models/`
- **Componentes:** `gui a de ejempli/Lee completo/app/shared/`

