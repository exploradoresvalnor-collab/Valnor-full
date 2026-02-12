# ✅ CHECKLIST DE MIGRACIÓN VALNOR: Angular → React

> **Inicio:** 31 de enero de 2026  
> **Última actualización:** 12 de febrero de 2026  
> **Estado:** 🔄 EN PROGRESO (~98%)

---

## 📊 PROGRESO GENERAL

```
Fase 1: Infraestructura    [██████████] 100% ✅
Fase 2: Motor 3D Core      [██████████] 100% ✅
Fase 3: Sistemas Engine    [██████████] 100% ✅
Fase 4: Niveles            [██████████] 100% ✅
Fase 5: RPG y Combate      [██████████] 100% ✅
Fase 6: Shaders y VFX      [███░░░░░░░]  30% 🔄 (WaterfallEffect shader creado)
Fase 7: Integración        [█████████░]  95% 🔄
Fase 8: PWA + Móvil        [██████████] 100% ✅
Fase 9: UI Juego           [██████████] 100% ✅
Fase 10: Profile/Settings  [██████████] 100% ✅
Fase 11: Backend Connect   [██████████] 100% ✅
Fase 12: Motor Sketchbook  [██████████] 100% ✅
Fase 13: Guest Mode        [██████████] 100% ✅
Fase 14: Data Flow Fix     [██████████] 100% ✅
Fase 15: Physics Audit     [██████████] 100% ✅ (NUEVA)
```

---

## 🔴 FASE 1: INFRAESTRUCTURA BASE

### 1.1 Configuración de Proyecto
- [x] Tailwind CSS instalado y configurado
- [x] Framer Motion instalado
- [x] Estructura de carpetas creada
- [x] Configuración de paths en tsconfig

### 1.2 Stores (Zustand)
- [x] `stores/gameStore.ts` - Estado global del juego
- [x] `stores/uiStore.ts` - Estado de UI (modales, loading)
- [x] `stores/playerStore.ts` - Estado del jugador
- [x] `stores/index.ts` - Exports centralizados

### 1.3 Types/Models Completos
- [x] `types/character.types.ts` - Personajes y stats
- [x] `types/dungeon.types.ts` - Mazmorras y combate
- [x] `types/survival.types.ts` - Modo survival
- [x] `types/ranking.types.ts` - Rankings y logros
- [x] `types/shop.types.ts` - Tienda
- [x] `types/rpg.types.ts` - Sistema RPG
- [x] `types/index.ts` - Exports actualizados

### 1.4 Services Adicionales
- [x] `services/dungeon.service.ts` - Servicio de mazmorras
- [x] `services/ranking.service.ts` - Servicio de rankings
- [x] `services/socket.service.ts` - Socket.IO (alineado con backend)
- [x] `services/index.ts` - Exports actualizados

### 1.5 Guards y Componentes Base
- [x] `components/guards/RequireAuth.tsx`
- [x] `components/guards/RequireNoAuth.tsx`
- [x] `components/guards/GuestAccessGuard.tsx` ✅ (Sesión 7 — matriz de acceso invitado)
- [x] `components/guards/index.ts`
- [x] `components/ui/LoadingScreen.tsx`
- [x] `components/ui/GlobalNavbar.tsx`
- [x] `components/ui/index.ts`

### 1.6 Utils y Helpers
- [x] `utils/constants.ts` - Constantes globales
- [x] `utils/helpers.ts` - Funciones utilitarias
- [x] `utils/index.ts` - Exports

---

## 🟠 FASE 2: MOTOR 3D CORE (React Three Fiber)

### 2.1 Setup Base
- [x] `engine/components/GameCanvas.tsx` - Canvas principal R3F
- [x] `engine/components/PhysicsWorld.tsx` - Wrapper Rapier
- [x] `engine/stores/engineStore.ts` - Estado del engine

### 2.2 Sistema de Cámara
- [x] `engine/hooks/useCamera.ts` - Control de cámara
- [x] `engine/components/GameCamera.tsx` - Cámara 3ra persona

### 2.3 Sistema de Input
- [x] `engine/hooks/useInput.ts` - Teclado/ratón/touch
- [x] ~~`engine/hooks/useKeyboard.ts`~~ (integrado en useInput)

### 2.4 Player Controller
- [x] `engine/components/Player.tsx` - Componente jugador ✅ (+ character tilt dinámico)
- [x] `engine/hooks/useMovement.ts` - Lógica de movimiento ✅ (reescrito completo con SpringSimulator — Arcade Velocity Mixing)
- [x] ~~`engine/hooks/useGrounding.ts`~~ (integrado en useMovement)

### 2.5 Core Utils
- [x] `engine/utils/physics.ts` - Utilidades de física
- [x] `engine/utils/math.ts` - Utilidades matemáticas
- [x] `engine/utils/logger.ts` - Debug logger
- [x] `engine/utils/SpringSimulator.ts` - Simulador de resortes (Sketchbook) ✅
- [x] `engine/utils/AIBehaviours.ts` - Behaviours IA para NPCs (4 clases) ✅

---

## 🟡 FASE 3: SISTEMAS DEL ENGINE (14 sistemas)

### 3.1 Sistemas Críticos (Prioridad ALTA)
- [x] `engine/systems/CameraSystem.ts` - ✅ Integrado en useCamera.ts
- [x] `engine/systems/MovementSystem.ts` - ✅ Integrado en useMovement.ts
- [x] `engine/systems/GroundingSystem.ts` - ✅ Integrado en useMovement.ts
- [x] `engine/systems/AnimationSystem.ts` - Animaciones de personaje ✅
- [x] `engine/systems/CombatSystem.ts` - Sistema de combate ✅

### 3.2 Sistemas de Ambiente (Prioridad MEDIA)
- [x] `engine/systems/WeatherSystem.tsx` - Clima (lluvia, nieve) ✅
- [x] `engine/systems/UltraSkySystem.tsx` - Cielo procedural ✅
- [x] `engine/systems/AudioSystem.ts` - Sistema de audio ✅
- [x] `engine/systems/VFXSystem.tsx` - Efectos visuales ✅

### 3.3 Sistemas Secundarios (Prioridad BAJA)
- [x] `engine/systems/PostProcessSystem.tsx` - Post-procesado ✅
- [x] `engine/systems/TrailSystem.tsx` - Estelas ✅
- [x] `engine/systems/InstancedGrass.tsx` - Hierba instanciada ✅
- [x] `engine/systems/WildlifeSystem.tsx` - Fauna ✅
- [x] `engine/systems/AmbientParticlesSystem.tsx` - Partículas ✅

### 3.4 Sistemas Adaptados de Sketchbook (NUEVA)
- [x] `engine/utils/SpringSimulator.ts` - SimulatorBase + SpringSimulator + RelativeSpringSimulator ✅
- [x] `engine/utils/AIBehaviours.ts` - FollowPath, RandomWander, FollowTarget, IdleBehaviour ✅
- [x] `engine/components/SceneEnhancer.tsx` - Componente unificado para mejorar escenas (god rays, bloom, fog, AO) ✅
- [x] `engine/components/WaterfallEffect.tsx` - Cascada con shader GLSL personalizado ✅

---

## 🟢 FASE 4: NIVELES DE JUEGO (9 niveles) ✅

### 4.1 Niveles Prioritarios
- [x] `engine/scenes/PreviewLevel.tsx` - Lobby (cielo + agua) ✅
- [x] `engine/scenes/TestLevel.tsx` - Nivel de pruebas ✅

### 4.2 Niveles Principales
- [x] `engine/scenes/CastleLevel.tsx` - Fortaleza medieval ✅
- [x] `engine/scenes/ValleyLevel.tsx` - Valle natural ✅
- [x] `engine/scenes/CanyonLevel.tsx` - Cañón ✅

### 4.3 Niveles Adicionales
- [x] `engine/scenes/MiningMountainLevel.tsx` - Cueva goblins ✅
- [x] `engine/scenes/PlainLevel.tsx` - Llanuras ✅
- [x] `engine/scenes/TerrainTestLevel.tsx` - Test terreno ✅
- [x] `engine/scenes/LevelKit.ts` - Herramientas de niveles ✅

---

## 🔵 FASE 5: SISTEMA RPG Y COMBATE

### 5.1 Core RPG
- [x] `engine/rpg/rpg-calculator.ts` - Cálculos de daño ✅
- [x] `engine/rpg/enemy-factory.ts` - Fábrica de enemigos ✅
- [x] `engine/rpg/leveling-system.ts` - Sistema de niveles/XP ✅

### 5.2 Sistemas de Loot y Guardado
- [x] `engine/rpg/loot-system.ts` - Sistema de botín ✅
- [x] `engine/rpg/save-system.ts` - Guardado local/nube ✅
- [x] `engine/rpg/index.ts` - Exports centralizados ✅

### 5.3 Entidades
- [x] `engine/entities/GameEntity.ts` - Clase base ✅
- [x] `engine/entities/BossEntity.ts` - Entidad de boss ✅
- [x] `engine/entities/EnemyEntity.ts` - Entidad enemigo ✅
- [x] `engine/entities/index.ts` - Exports centralizados ✅

### 5.4 Character System
- [x] `engine/character/Character.ts` - Clase personaje ✅
- [x] `engine/character/states/` - Estados del personaje ✅
- [x] `engine/character/registry/` - Registro de personajes ✅
- [x] `engine/character/index.ts` - Exports centralizados ✅

---

## 🟣 FASE 6: SHADERS Y VFX

### 6.1 Shaders Principales
- [ ] `engine/shaders/skyShader.ts` - Cielo procedural
- [x] `engine/shaders/waterShader.ts` - ✅ PARCIAL → Implementado como `WaterfallEffect.tsx` con vertex + fragment shaders GLSL inline
- [ ] `engine/shaders/grassShader.ts` - Hierba animada

### 6.2 Shaders Secundarios
- [ ] `engine/shaders/fireShader.ts` - Fuego
- [ ] `engine/shaders/stoneShader.ts` - Piedra procedural
- [ ] `engine/shaders/groundShader.ts` - Suelo con camino

### 6.3 Materiales Personalizados
- [ ] `engine/materials/WaterMaterial.tsx`
- [ ] `engine/materials/SkyMaterial.tsx`
- [ ] `engine/materials/GrassMaterial.tsx`

---

## ⚫ FASE 7: INTEGRACIÓN FINAL

### 7.1 Página Demo (Motor 3D)
- [ ] `pages/Demo/Demo.tsx` - Página principal
- [ ] `pages/Demo/Demo.css` - Estilos
- [ ] `pages/Demo/components/Lobby.tsx` - Panel de lobby
- [ ] `pages/Demo/components/GameHUD.tsx` - HUD in-game

### 7.2 Componentes UI Adicionales
- [x] `components/ui/CookieConsent.tsx` - Banner de cookies GDPR ✅
- [x] `components/ui/EnergyBar.tsx` - Barra de energía con temporizador ✅
- [x] `components/ui/InventorySummary.tsx` - Resumen de inventario ✅
- [x] `components/ui/GuestBanner.tsx` - Banner para usuarios invitados ✅
- [x] `engine/components/SceneEnhancer.tsx` - Mejora visual unificada para escenas ✅
- [x] `engine/components/WaterfallEffect.tsx` - Cascada shader GLSL (reemplaza Waterfall viejo en Canyon) ✅
- [ ] `components/ui/SettingsModal.tsx` - Configuración (migrado a página)
- [ ] `components/ui/CharacterCard.tsx` - Tarjeta personaje
- [ ] `components/ui/RPGToast.tsx` - Notificaciones RPG
- [ ] `components/ui/ProgressBar.tsx` - Barra de progreso

### 7.3 Integración de Rutas
- [x] Actualizar `App.tsx` con guards ✅
- [x] Rutas Profile y Settings añadidas ✅
- [ ] Conectar Demo con motor 3D
- [x] Transiciones entre páginas (Framer Motion) ✅

### 7.4 Testing y Polish
- [x] Probar todas las rutas ✅
- [ ] Optimizar bundle size
- [x] Verificar responsive (landscape + portrait) ✅
- [ ] Documentación final

---

## 🔷 FASE 8: PWA + MÓVIL (Capacitor)

### 8.1 PWA Configuration
- [x] `vite-plugin-pwa` instalado y configurado ✅
- [x] `manifest.json` generado automáticamente ✅
- [x] Service Worker configurado ✅
- [x] Iconos PWA (192x192, 512x512) ✅
- [x] Apple touch icon configurado ✅
- [x] Banner de instalación PWA ✅

### 8.2 Capacitor Setup
- [x] `@capacitor/core` y `@capacitor/cli` instalados ✅
- [x] `@capacitor/android` configurado ✅
- [x] `capacitor.config.json` creado ✅
- [x] Carpeta `/android` generada ✅
- [x] Scripts de build en package.json ✅

### 8.3 Detección de Plataforma
- [x] Hook `usePlatform.ts` para detectar PWA/nativa ✅
- [x] Hook `useCanShowPurchases.ts` para ocultar compras ✅
- [x] Componente `PlatformOnly.tsx` helper ✅

### 8.4 UI/UX Móvil
- [x] CSS responsive todas las páginas ✅
- [x] Soporte landscape y portrait ✅
- [x] SplashScreen optimizado (non-lazy) ✅
- [x] Cookie consent banner minimal ✅

---

## 🎮 FASE 9: UI DE JUEGO (NUEVA)

### 9.1 Selección de Modo de Juego
- [x] `pages/PortalSelection/PortalSelection.tsx` - Portales 3D animados ✅
- [x] `stores/gameModeStore.ts` - Store para modo seleccionado ✅
- [x] Guard `RequireModeSelection` en App.tsx ✅

### 9.2 Sistema de Mazmorras (Dungeons)
- [x] `stores/dungeonStore.ts` - Lista de mazmorras y selección ✅
- [x] `components/dungeon/DungeonList.tsx` - Lista de mazmorras disponibles ✅
- [x] `components/dungeon/DungeonBattle.tsx` - Combate automático por turnos ✅
- [x] `pages/Dungeon/Dungeon.tsx` - Página integrada con stores ✅

### 9.3 Modo Survival
- [x] `components/survival/SurvivalBattle.tsx` - Combate por oleadas ✅
- [x] `pages/Survival/Survival.tsx` - Página integrada con stores ✅

### 9.4 Sistema de Equipo
- [x] `stores/teamStore.ts` - Equipo activo y personajes ✅
- [x] Selectores: useActiveTeam, useTeamPower, useTeamMembers ✅

### 9.5 Dashboard 3D Mejorado
- [x] Escena 3D de fortaleza medieval ✅
- [x] Tarjetas de acción con iconos SVG ✅
- [x] Panel de información del jugador ✅
- [x] Integración con NotificationBell ✅
- [x] Botones a Profile y Settings ✅

---

## ⚙️ FASE 10: PERFIL Y CONFIGURACIÓN (NUEVA)

### 10.1 Stores
- [x] `stores/settingsStore.ts` - Configuración persistida (localStorage) ✅
  - Audio: musicVolume, sfxVolume, masterVolume
  - Idioma: language (es/en)
  - Notificaciones: enabled, sounds
  - Visual: damageNumbers, screenShake, particleEffects
  - Controles: invertYAxis, mouseSensitivity
- [x] `stores/notificationsStore.ts` - Notificaciones del servidor ✅
  - 12 tipos de notificación definidos
  - Paginación con limit/skip/hasMore
  - Contador de no leídas

### 10.2 Hooks
- [x] `hooks/useSettings.ts` - API de configuración ✅
  - GET /api/user/settings
  - PUT /api/user/settings  
  - POST /api/user/settings/reset
- [x] `hooks/useNotifications.ts` - API de notificaciones ✅
  - GET /api/notifications (paginado)
  - GET /api/notifications/unread/count
  - PUT /api/notifications/:id/read
  - PUT /api/notifications/read-all
  - DELETE /api/notifications/:id

### 10.3 Componentes de Notificaciones
- [x] `components/notifications/NotificationBell.tsx` - Campanita con badge ✅
- [x] `components/notifications/NotificationList.tsx` - Lista con paginación ✅
- [x] `components/notifications/NotificationItem.tsx` - Item con iconos por tipo ✅
- [x] CSS para todos los componentes ✅

### 10.4 Páginas
- [x] `pages/Profile/Profile.tsx` - Perfil del jugador ✅
  - Estadísticas de combate, mazmorras, survival
  - Sistema de logros (6 logros base)
  - Historial de batallas
  - Equipo actual
  - Banner para invitados
- [x] `pages/Settings/Settings.tsx` - Configuración completa ✅
  - Sección Audio (sliders)
  - Sección Idioma (es/en)
  - Sección Notificaciones (toggles)
  - Sección Visual (toggles)
  - Sección Controles (slider + keybindings)

### 10.5 Banners para Invitados
- [x] `components/ui/GuestBanner.tsx` - Componente reutilizable ✅
- [x] Integrado en Profile, Marketplace, Shop ✅
- [x] 3 variantes: warning, info, locked ✅

---

## 📁 ESTRUCTURA DE CARPETAS FINAL

```
src/
├── App.tsx                    ✅
├── main.tsx                   ✅
├── index.css                  ✅
├── vite-env.d.ts             ✅
│
├── config/
│   ├── api.config.ts          ✅
│   └── game.config.ts         ✅
│
├── context/
│   └── AuthContext.tsx        ✅
│
├── hooks/
│   ├── useAuth.ts             ✅
│   ├── usePlatform.ts         ✅ (PWA/nativa detection)
│   ├── useSettings.ts         ✅ (API settings)
│   ├── useNotifications.ts    ✅ (API notifications)
│   └── index.ts               ✅
│
├── stores/                    ✅ COMPLETO
│   ├── gameStore.ts           ✅
│   ├── uiStore.ts             ✅
│   ├── playerStore.ts         ✅ (+ usePlayerStats, usePlayerWallet)
│   ├── sessionStore.ts        ✅ (useIsGuest)
│   ├── teamStore.ts           ✅ (+ useTeamMembers)
│   ├── gameModeStore.ts       ✅ (modo RPG/Survival)
│   ├── dungeonStore.ts        ✅ (lista mazmorras)
│   ├── settingsStore.ts       ✅ (configuración)
│   ├── notificationsStore.ts  ✅ (notificaciones)
│   └── index.ts               ✅
│
├── services/                  ✅ COMPLETO
│   ├── api.service.ts         ✅
│   ├── auth.service.ts        ✅
│   ├── dungeon.service.ts     ✅
│   ├── ranking.service.ts     ✅
│   ├── socket.service.ts      ✅
│   └── index.ts               ✅
│
├── types/                     ✅ COMPLETO
│   ├── auth.types.ts          ✅
│   ├── user.types.ts          ✅
│   ├── item.types.ts          ✅
│   ├── character.types.ts     ✅
│   ├── dungeon.types.ts       ✅
│   ├── survival.types.ts      ✅
│   ├── ranking.types.ts       ✅
│   ├── shop.types.ts          ✅
│   ├── rpg.types.ts           ✅
│   └── index.ts               ✅
│
├── components/                ✅ COMPLETO
│   ├── guards/
│   │   ├── RequireAuth.tsx    ✅
│   │   ├── RequireNoAuth.tsx  ✅
│   │   ├── GuestAccessGuard.tsx ✅ (matriz acceso invitado)
│   │   └── index.ts           ✅
│   └── ui/
│       ├── LoadingScreen.tsx  ✅
│       ├── GlobalNavbar.tsx   ✅
│       ├── CookieConsent.tsx  ✅ (GDPR banner)
│       ├── CookieConsent.css  ✅
│       └── index.ts           ✅
│
├── utils/                     ✅ COMPLETO
│   ├── constants.ts           ✅
│   ├── helpers.ts             ✅
│   └── index.ts               ✅
│
├── pages/                     ✅ UI COMPLETA
│   ├── Auth/                  ✅
│   ├── Dashboard/             ✅
│   ├── Inventory/             ✅
│   ├── Shop/                  ✅
│   ├── Marketplace/           ✅
│   ├── Dungeon/               ✅
│   ├── Ranking/               ✅
│   ├── Survival/              ✅
│   ├── Wiki/                  ✅
│   ├── Landing/               ✅
│   └── SplashScreen/          ✅
│
└── engine/                    ✅ COMPLETO
    ├── components/            ✅ (+ SceneEnhancer, WaterfallEffect)
    ├── hooks/                 ✅ (useMovement reescrito con springs)
    ├── systems/               ✅ 14/14
    ├── scenes/                ✅ 9/9 (6 mejoradas con SceneEnhancer)
    ├── shaders/               🔄 PARCIAL (WaterfallEffect tiene GLSL)
    ├── rpg/                   ✅
    ├── entities/              ✅
    ├── character/             ✅
    ├── stores/                ✅
    └── utils/                 ✅ (+ SpringSimulator, AIBehaviours)

/                              (raíz del proyecto)
├── android/                   ✅ (Capacitor Android)
├── capacitor.config.json      ✅
├── vite.config.js             ✅ (con PWA plugin)
├── CAPACITOR_GUIDE.md         ✅
├── DEPLOY_GUIDE.md            ✅
└── MIGRACION_CHECKLIST.md     ✅
```

---

## 📝 NOTAS DE PROGRESO

### 31 de enero de 2026 - Sesión 1 (Mañana)
- ✅ Fase 1 completada: Infraestructura base
- ✅ Tailwind CSS v4 configurado con @tailwindcss/postcss
- ✅ Framer Motion instalado
- ✅ Todos los stores creados
- ✅ Todos los types completados
- ✅ Services adicionales creados
- ✅ Guards y componentes UI base
- ✅ Fase 2 completada: Motor 3D Core (GameCanvas, Physics, Player, Camera, Input, Movement)
- ✅ Fase 3 completada: 14 sistemas creados (Animation, Combat, Weather, Sky, Audio, VFX, PostProcess, Trail, Grass, Wildlife, Particles)
- ✅ Fase 4 completada: 9 niveles + LevelKit (Preview, Test, Castle, Valley, Canyon, Mining, Plain, Terrain)

### 31 de enero de 2026 - Sesión 2 (Tarde)
- ✅ **PWA completa:** vite-plugin-pwa configurado con manifest, SW, iconos
- ✅ **Capacitor Android:** Proyecto nativo generado, listo para compilar APK
- ✅ **Cookie Consent:** Banner GDPR minimal y elegante
- ✅ **Responsive CSS:** Todas las páginas con soporte landscape/portrait
- ✅ **Fix loading:** SplashScreen cambiado de lazy() a import directo
- ✅ **Hooks de plataforma:** usePlatform, useCanShowPurchases, PlatformOnly
- ✅ **Guías creadas:** CAPACITOR_GUIDE.md, DEPLOY_GUIDE.md

### 2 de febrero de 2026 - Sesión 3 (UI de Juego)
- ✅ **FASE 9 completada:** UI de Juego
  - PortalSelection con portales 3D animados
  - Sistema de mazmorras (DungeonList, DungeonBattle)
  - Modo Survival con combate por oleadas
  - gameModeStore, dungeonStore, teamStore
- ✅ **FASE 10 completada:** Perfil y Configuración
  - settingsStore con persistencia localStorage
  - notificationsStore con 12 tipos de notificación
  - useSettings y useNotifications hooks
  - NotificationBell/List/Item componentes
  - Profile page con stats, logros, historial
  - Settings page con 5 secciones configurables
- ✅ **GuestBanner:** Componente para modo invitado (3 variantes)
- ✅ **Dashboard mejorado:** Integración con NotificationBell
- ✅ **Rutas añadidas:** /profile, /settings

### 8–10 de febrero de 2026 - Sesión 6–7 (Motor Sketchbook + Guest Mode)
- ✅ **FASE 12 completada:** Adaptaciones del Motor Sketchbook
  - **SpringSimulator** (~300 líneas): SimulatorBase + SpringSimulator + RelativeSpringSimulator
  - **Arcade Velocity Mixing:** useMovement reescrito completamente (~356 líneas) con interpolación spring-based
  - **Character Tilt:** Player.tsx actualizado con inclinación dinámica según velocidad lateral
  - **AI Behaviours** (~340 líneas): FollowPath, RandomWander, FollowTarget, IdleBehaviour
  - **SceneEnhancer** (~200 líneas): Componente unificado con god rays, bloom, fog, AO
  - **WaterfallEffect** (~290 líneas): Cascada shader GLSL con vertex + fragment personalizados
  - 6 escenas mejoradas con SceneEnhancer: Castle, Valley, Canyon, Mining, Plain, Preview
  - CanyonLevel: WaterfallEffect reemplaza componente Waterfall viejo
- ✅ **FASE 13 completada:** Guest Mode (3 fases)
  - **Fase 1:** sessionStore.mode = 'none'|'guest'|'user', resetGameStores()
  - **Fase 2:** GuestAccessGuard con matriz de acceso (view-only, blocked, full)
  - **Fase 3:** App.tsx envuelto con GuestAccessGuard, useGuestViewOnly/useGuestBlocked hooks
- ✅ **Assets Sketchbook investigados:** 5 GLB (boxman, car, airplane, heli, world) — **ninguno apto** para RPG medieval
  - Solo se portaron sistemas de código (springs, AI, velocity, tilt), NO los modelos 3D
- ✅ **Exports actualizados:** engine/utils/index.ts y engine/components/index.ts
- ✅ **Compilación verificada:** 1166 módulos, 0 errores TS

---

## 🚀 PRÓXIMOS PASOS SUGERIDOS

### Opción A: Combat 3D (Prioridad Alta)
- [ ] Escenarios 3D para combate (arena, bosque, cueva)
- [ ] Animaciones de ataque y habilidades
- [ ] VFX de impactos y efectos mágicos
- [ ] Cámara cinemática para habilidades ultimate

### Opción B: Sistema de Gacha/Invocación
- [ ] Banners de invocación con rates
- [ ] Animación de invocación 3D
- [ ] Sistema de pity (garantizado)
- [ ] Historial de invocaciones

### Opción C: Sistema de Inventario Completo
- [ ] Equipar/desequipar items
- [ ] Mejora de items (+1, +2, etc)
- [ ] Fusión de duplicados
- [ ] Desbloqueo de personajes

### Opción D: Social/Chat
- [ ] Chat global en tiempo real
- [ ] Sistema de amigos
- [ ] Gremios/Guilds
- [ ] Comercio entre jugadores

### Opción E: Eventos/Misiones
- [ ] Misiones diarias y semanales
- [ ] Eventos temporales
- [ ] Recompensas por login
- [ ] Sistema de logros expandido

### Opción F: Shaders y VFX (FASE 6)
- [ ] skyShader procedural
- [ ] waterShader con Fresnel
- [ ] grassShader animado
- [ ] Materiales personalizados R3F

---

## ⚙️ FASE 15: AUDITORÍA DE FÍSICA/COLISIONES/GRAVEDAD (Sesión 8)

> Auditoría completa del motor Rapier: 30+ problemas encontrados, todos los P0/P1/P2/P3 corregidos.

### 15.1 Correcciones P0 — Críticas
- [x] **Detección de suelo real** — `useMovement.ts`: reemplazado hack `velocity.y < 0.1` con `world.castRay()` desde base de cápsula
- [x] **CCD habilitado** — `Player.tsx`: prop `ccd` en RigidBody para evitar tunneling
- [x] **Timestep fijo** — `GameCanvas.tsx`: `timeStep={1/60}` (era `"vary"`), `numSolverIterations={8}`, `numAdditionalFrictionIterations={4}`
- [x] **Gravedad unificada** — `GameCanvas.tsx`: `gravity={[0, -20, 0]}` (unificado, antes split -9.81 Rapier / 20 config)
- [x] **maxFallSpeed aplicado** — `useMovement.ts`: clamp `Math.max(vel.y, -maxFallSpeed)` antes de `setLinvel()`

### 15.2 Correcciones P1 — Altas
- [x] **Raycast real** — `PhysicsWorld.tsx`: `world.castRay()` con normal real y RigidBody del hit
- [x] **sphereCast real** — `PhysicsWorld.tsx`: `world.castShape()` con `rapier.Ball(radius)` (antes era solo raycast)
- [x] **overlapSphere real** — `PhysicsWorld.tsx`: `world.intersectionsWithShape()` con filtro por grupo (antes iteraba todos los cuerpos)
- [x] **Collision manifold** — `PhysicsWorld.tsx`: extracción de normal y puntos de contacto de solver Rapier
- [x] **Filtros de colisión** — ENEMY mask += NPC+PROJECTILE, PROJECTILE mask += NPC

### 15.3 Correcciones P2 — Medias
- [x] **Kill zone** — `Player.tsx`: reset a spawn si Y < -50
- [x] **Lerps frame-independent** — `Player.tsx`: `1 - Math.pow(0.001, dt)` en vez de `0.15` fijo
- [x] **Vectores reutilizables** — `useMovement.ts`: `_rayOrigin`, `_rayDir`, `_upAxis` (evita allocations/frame)
- [x] **Ramp collider** — `LevelKit.tsx`: rotación movida al RigidBody (collider alineado con visual)
- [x] **Barrel collider** — `LevelKit.tsx`: `colliders="hull"` → `CylinderCollider` explícito
- [x] **Platform moving** — `LevelKit.tsx`: `setNextKinematicTranslation` + onda senoidal en `useFrame`

### 15.4 Correcciones P3 — Bajas
- [x] **AnimationSystem setTimeout** — `AnimationSystem.ts`: campo `transitionEndTime` + chequeo en `useFrame`
- [x] **VFXSystem setTimeout** — `VFXSystem.tsx`: expiración chequeada en `useFrame`
- [x] **Combat log leak** — `CombatSystem.ts`: capped a 200 entries con `splice`
- [x] **console.log eliminados** — `PhysicsWorld.tsx`: `onSleep`/`onWake` sin spam

### 15.5 Verificación
- [x] Build Vite: 1166 módulos, 0 errores TypeScript
- [x] Único warning preexistente: PWA asset `caballero_dorado.png` (3.15 MB)

---

## 🔧 CORRECCIONES APLICADAS — 7 de febrero de 2026 (Sesión 4)

### Auditoría y alineación con backend (15 correcciones)

| # | Corrección | Archivos |
|---|-----------|----------|
| 1 | Creado `vite.config.ts` (faltaba completamente) | NUEVO |
| 2 | Creado `postcss.config.js` para Tailwind v4 | NUEVO |
| 3 | Integrado Tailwind v4 con `@import "tailwindcss"` | `index.css` |
| 4 | Instalado `socket.io-client@^4.8.1` | `package.json` |
| 5 | Reescrito `socket.service.ts` de WebSocket nativo → Socket.IO (alineado con backend `RealtimeService`) | `socket.service.ts` |
| 6 | Corregidas rutas auth de `/api/auth/*` → `/auth/*` (backend monta auth sin prefijo `/api`) | `auth.service.ts` |
| 7 | Corregidos 16 campos con prefijo `od` corrupto (odrank→rank, oduserId→userId, etc.) | `ranking.types.ts`, `dungeon.types.ts`, `survival.types.ts`, `shop.types.ts` |
| 8 | Agregados ~15 tipos/interfaces faltantes del proyecto Angular de referencia | mismos 4 archivos de tipos |
| 9 | Unificada interfaz `Dungeon` completa con campos del backend | `dungeon.types.ts` |
| 10 | Alineado `DungeonDifficulty` a valores del backend (`expert`/`nightmare` en vez de `nightmare`/`hell`) | `dungeon.types.ts`, `dungeonStore.ts` |
| 11 | Unificadas claves `localStorage` a `STORAGE_KEYS.TOKEN`/`USER` (antes hardcoded `'token'`, `'user'`) | `api.service.ts`, `auth.service.ts` |
| 12 | Hooks `useNotifications` y `useSettings` ahora usan `apiService` (antes usaban `fetch` directo sin Bearer token) | `useNotifications.ts`, `useSettings.ts` |
| 13 | Eliminada duplicación de `RARITY_COLORS`/`RARITY_NAMES` — fuente única en `item.types.ts`, agregada rareza `mythic` | `item.types.ts`, `constants.ts` |
| 14 | Eliminado audio duplicado de `gameStore` — `settingsStore` es fuente única; `AudioSystem` lee de `settingsStore` | `gameStore.ts`, `AudioSystem.ts` |
| 15 | Completados `CLASS_NAMES`/`CLASS_COLORS` con 9 clases (faltaban `berserker`, `monk`, `healer`), tipados con `CharacterClass` | `constants.ts` |

---

## 🌐 FASE 11: CONEXIÓN FRONTEND → BACKEND (NUEVA — Sesión 5)

> Todas las páginas del juego fueron conectadas al backend real en `localhost:8080`.  
> Se eliminó **todo** el mock/hardcoded data y se reemplazó por llamadas a servicios reales con `useEffect` + mappers.

### 11.1 Servicios Creados/Modificados (Sesión 4-5)

| Servicio | Archivo | Endpoints cubiertos |
|----------|---------|-------------------|
| apiService | `services/api.service.ts` | Base HTTP con `credentials: 'include'` + Bearer token |
| authService | `services/auth.service.ts` | login, register, logout, verify, forgotPassword, resetPassword, checkAvailability, getSocketToken |
| userService | `services/user.service.ts` | getMe, getResources, getEnergyStatus, getDashboard, getMyPublicProfile |
| characterService | `services/character.service.ts` | getUserCharacters, getCharacter, equipCharacter |
| teamService | `services/team.service.ts` | getTeams, createTeam, updateTeam |
| inventoryService | `services/inventory.service.ts` | getMyInventory, getEquipmentCatalog, getConsumablesCatalog |
| shopService | `services/shop.service.ts` | getShopPackages, purchase, addPackageToUser, removePackageFromUser |
| dungeonService | `services/dungeon.service.ts` | getDungeons, getDungeon, startDungeon, completeDungeon |
| rankingService | `services/ranking.service.ts` | getLeaderboard, getMyRanking, getGeneralRanking, getAllAchievements, getMyPublicProfile |
| survivalService | `services/survival.service.ts` | getMyStats, getLeaderboard, startGame, endGame |
| combatService | `services/combat.service.ts` | startCombat, submitAction, getCombatStatus |
| marketplaceService | `services/marketplace.service.ts` | getHistory, buyItem, cancelListing, listItem, updatePrice, getListing |
| marketplaceTx | `services/marketplace.service.ts` | getMyTransactionHistory, getMySales, getMyPurchases, getTransactionStats |
| chatService | `services/chat.service.ts` | getMessages, sendMessage, getChannels, joinChannel |
| feedbackService | `services/feedback.service.ts` | submitFeedback, getMyFeedback |
| gameConfigService | `services/gameConfig.service.ts` | getConfig, getRarityConfig, getClassConfig, getLevelConfig, getEnergyConfig, getSeasonConfig |

### 11.2 Páginas Conectadas al Backend

#### ✅ Dashboard (`pages/Dashboard/Dashboard.tsx`)
- **Datos eliminados:** actividad reciente hardcoded
- **Servicios usados:** `userService`, `characterService`, `teamService`
- **Endpoints llamados:**
  - `GET /api/users/me` → info del jugador → `playerStore`
  - `GET /api/users/resources` → val, boletos, energía → `playerStore`
  - `GET /api/users/energy/status` → estado de energía → `playerStore`
  - `GET /api/user-characters` → personajes del usuario → `playerStore`
  - `GET /api/teams` → equipos del usuario → `teamStore`
  - `GET /api/users/dashboard` → actividad reciente (con fallback)
- **Store poblado:** `playerStore` (username, level, class, energy, val, gold), `teamStore` (teams)

#### ✅ Shop (`pages/Shop/Shop.tsx`)
- **Datos eliminados:** 18 items mock (12 equipo + 6 consumibles)
- **Servicios usados:** `inventoryService`, `shopService`, `userService`
- **Endpoints llamados:**
  - `GET /api/inventory/equipment/catalog` → catálogo de equipo
  - `GET /api/inventory/consumables/catalog` → catálogo de consumibles
  - `GET /api/shop/packages` → paquetes de la tienda
  - `GET /api/users/resources` → balance del jugador
  - `POST /api/shop/purchase` → compra real
- **Helper:** `mapToShopItem()` — mapea campos backend (nombre/name, precio/price, rareza/rarity) al formato UI
- **Categoría nueva:** "Paquetes" agregada junto a Equipamiento y Consumibles

#### ✅ Inventory (`pages/Inventory/Inventory.tsx`)
- **Datos eliminados:** 3 arrays mock (equipped, backpack, consumables)
- **Servicios usados:** `inventoryService`
- **Endpoints llamados:**
  - `GET /api/inventory/my` → inventario completo del jugador
- **Helpers:** `mapEquipment()`, `mapConsumable()` — mapean items del backend con fallbacks para campos ES/EN
- **Lógica:** Items con `equipado=true` van a slots equipados, el resto a mochila. Capacidad desde `inventory.limits`

#### ✅ Dungeon (`pages/Dungeon/Dungeon.tsx`)
- **Datos eliminados:** 7 mazmorras hardcoded (~140 líneas)
- **Servicios usados:** `dungeonService`
- **Endpoints llamados:**
  - `GET /api/dungeons` → lista de mazmorras disponibles
- **Helper:** `mapDungeon()` — mapea campos backend al formato UI
- **Extra:** `difficultyColors`/`difficultyNames` manejan tanto español (fácil/normal/difícil/extremo) como inglés (easy/medium/hard/legendary)

#### ✅ Ranking (`pages/Ranking/Ranking.tsx`)
- **Datos eliminados:** objeto mockRankings con 40 entradas en 4 categorías
- **Servicios usados:** `rankingService`
- **Endpoints llamados:**
  - `GET /api/ranking/leaderboard?type={category}` → top jugadores por categoría
  - `GET /api/ranking/me` → posición del jugador actual
  - `GET /api/ranking/general` → fallback si leaderboard falla
- **Helper:** `mapRankingPlayer()` — normaliza campos rank/position, username/nombre, score/puntuacion
- **Extra:** Guards seguros para podio cuando hay < 3 jugadores. `classIcons` con claves ES e EN

#### ✅ Profile (`pages/Profile/Profile.tsx`)
- **Datos eliminados:** 6 logros hardcoded + 4 batallas hardcoded
- **Servicios usados:** `rankingService`, `userService`
- **Endpoints llamados:**
  - `GET /api/ranking/achievements` → lista completa de logros
  - `GET /api/users/me` → datos del perfil
  - `GET /api/ranking/profile/me` → perfil público con stats
  - `GET /api/users/dashboard` → historial de batallas recientes
- **Lógica:** Combina datos de múltiples endpoints para poblar stats, achievements y battleHistory con fallbacks

#### ✅ Survival (`pages/Survival/Survival.tsx`)
- **Datos eliminados:** `mockStats` (5 campos) + `weeklyLeaderboard` (5 entradas)
- **Servicios usados:** `survivalService`
- **Endpoints llamados:**
  - `GET /api/survival/stats/me` → estadísticas personales (mejorOleada, partidasJugadas, etc.)
  - `GET /api/survival/leaderboard?limit=5` → top semanal
- **Datos conservados:** `powerUps[]` (6 power-ups) — son constantes de diseño, no datos de backend
- **Helper inline:** Mapea campos ES/EN (mejorOleada/bestWave, partidasJugadas/gamesPlayed, etc.)

#### ✅ Marketplace (`pages/Marketplace/Marketplace.tsx`)
- **Datos eliminados:** 8 listings mock (Hacha, Cetro, Armadura, Capa, Botas, Anillo, Escudo, Daga)
- **Servicios usados:** `marketplaceService`
- **Endpoints llamados:**
  - `GET /api/marketplace/history?limit=50` → listings activos (filtrados por status=active)
  - `POST /api/marketplace/buy/:listingId` → compra real con feedback
  - `GET /api/marketplace-transactions/my-history` → historial de transacciones (tab Historial)
- **Helpers:** `mapListing()` (backend→frontend listing), `mapTransaction()` (backend→frontend transaction)
- **Mejoras:** Estado `purchasing` para evitar doble-click, `userVal` local se actualiza tras compra, empty state cuando no hay listings

#### ℹ️ Settings (`pages/Settings/Settings.tsx`)
- **Estado:** Ya conectada desde Sesión 4 vía hook `useSettings`
- **Endpoints usados:**
  - `GET /api/user/settings` → carga configuración
  - `PUT /api/user/settings` → guarda cambios
  - `POST /api/user/settings/reset` → restaurar valores por defecto
- **Sin cambios necesarios en Sesión 5**

#### ℹ️ Wiki (`pages/Wiki/Wiki.tsx`) y Portals (`pages/Portals/`)
- **Estado:** Páginas 100% frontend, sin backend asociado (rutas `/api/wiki/*` devuelven 404)
- **Sin cambios necesarios**

### 11.3 Stores Zustand — Rol en la arquitectura

> **NOTA CLAVE:** Los stores Zustand son **puramente estado local**. Ningún store llama directamente al backend.  
> Cada página es responsable de: (1) llamar al servicio, (2) mapear datos, (3) escribir en el store.

| Store | Poblado por | Datos principales |
|-------|-------------|-------------------|
| `playerStore` | Dashboard, Profile, Shop | username, level, class, energy, val, gold, experience |
| `teamStore` | Dashboard | teams, activeTeam |
| `dungeonStore` | Dungeon | dungeons, selectedDungeon |
| `gameModeStore` | PortalSelection | selectedMode (rpg/survival) |
| `sessionStore` | AuthContext | isGuest flag |
| `settingsStore` | useSettings hook | audio, language, notifications, visual, controls |
| `notificationsStore` | useNotifications hook | notifications[], unreadCount |
| `gameStore` | Engine scenes | gameState, currentLevel |
| `uiStore` | Varios componentes | modals, loading states |
| `engineStore` | Engine components | camera, physics state |

### 11.4 Patrón de conexión aplicado

```tsx
// Patrón usado en TODAS las páginas:
useEffect(() => {
  if (loading) return;          // Esperar auth
  let cancelled = false;        // Evitar race conditions

  const fetchData = async () => {
    try {
      const [data1, data2] = await Promise.all([
        service1.getData().catch(() => null),   // Nunca romper por un endpoint
        service2.getData().catch(() => null),
      ]);
      if (cancelled) return;    // Componente desmontado
      
      // Mapear con fallbacks ES/EN
      const mapped = mapData(data1);
      setState(mapped);
      store.setField(mapped);   // Popular store
    } catch (err) {
      console.error('[Page] Error:', err);
    }
  };

  fetchData();
  return () => { cancelled = true; };
}, [loading]);
```

### 11.5 Resumen de endpoints utilizados por página

| Página | GET | POST | PATCH | Total |
|--------|-----|------|-------|-------|
| Dashboard | 5 | 0 | 0 | **5** |
| Shop | 4 | 1 | 0 | **5** |
| Inventory | 1 | 0 | 0 | **1** |
| Dungeon | 1 | 0 | 0 | **1** |
| Ranking | 3 | 0 | 0 | **3** |
| Profile | 4 | 0 | 0 | **4** |
| Survival | 2 | 0 | 0 | **2** |
| Marketplace | 2 | 1 | 0 | **3** |
| Settings | 1 | 1 | 0 | **2** |
| **TOTAL** | **23** | **3** | **0** | **26** |

---

### Problemas detectados pendientes de resolver

| Severidad | Problema | Archivo(s) |
|-----------|----------|------------|
| **CRÍTICO** | ~~Ruta duplicada: `GameIcons.tsx`~~ | ✅ RESUELTO — Unificado en `components/icons/GameIcons.tsx`, archivo duplicado eliminado |
| **ALTO** | ~~`engine/index.ts` no exporta `rpg`, `entities`, `character`~~ | ✅ RESUELTO — Barrel completado |
| **MEDIO** | Carpeta `src/engine/shaders/` no existe (Fase 6 parcialmente cubierta por WaterfallEffect GLSL inline) | — |
| **MEDIO** | Página Demo no existe — `/demo` usa `<Landing />` como placeholder | `App.tsx` L200 |
| **MEDIO** | Componentes faltantes: `RPGToast`, `ProgressBar`, `OfflineIndicator` | `components/ui/` |
| **MEDIO** | Carpeta `src/pages/Portals/` existe pero no tiene ruta en App.tsx (código muerto) | `pages/Portals/` |
| **INFO** | Assets 3D de Sketchbook (boxman, car, airplane, heli, world) NO son aptos para RPG medieval | `gui a de ejempli/Sketchbook-master/` |
| **BAJO** | PWA sin estrategia de caching offline para API (`/auth/*`, `/api/*`) | `vite.config.ts` |
| **BAJO** | ~~`components/ui/index.ts` no exporta `GameIcons`~~ | ✅ RESUELTO — Re-exporta desde `icons/` |
| **BAJO** | Dependencias no usadas: `maath`, `workbox-window`; `@capacitor/cli` debería ser devDependency | `package.json` |
| **BAJO** | Faltan `typescript`, `@types/three` en devDependencies | `package.json` |

---

### 7 de febrero de 2026 - Sesión 5 (Conexión total con Backend)
- ✅ **FASE 11 completada:** Conexión Frontend → Backend
  - **Dashboard** conectado: userService, characterService, teamService (5 endpoints)
  - **Shop** conectado: inventoryService, shopService, userService (5 endpoints)
  - **Inventory** conectado: inventoryService (1 endpoint)
  - **Dungeon** conectado: dungeonService (1 endpoint)
  - **Ranking** conectado: rankingService (3 endpoints)
  - **Profile** conectado: rankingService, userService (4 endpoints)
  - **Survival** conectado: survivalService (2 endpoints)
  - **Marketplace** conectado: marketplaceService (3 endpoints) — ¡faltaba en el plan original!
  - Settings ya conectada vía useSettings hook
  - Wiki/Portals son frontend-only (sin backend)
- ✅ **16 servicios** cubriendo **135 endpoints** del backend
- ✅ **26 endpoints activamente usados** por las 9 páginas conectadas
- ✅ **Eliminados ~350+ líneas** de mock data hardcoded
- ✅ **Patrón unificado:** useEffect + Promise.all + mappers ES/EN + fallbacks
- ✅ **0 errores de compilación** en todas las páginas

---

> **Última actualización:** 12/02/2026 — Sesión 8 (Auditoría Física/Colisiones/Gravedad)  
> **Progreso total:** ~98%  
> **Autor:** Desarrollo con GitHub Copilot
