# 🎮 Valnor - Juego RPG

## 📋 Descripción
Juego RPG 3D con motor propio construido con React Three Fiber. Migrado desde Angular 17 a React 19. Incluye sistema de mazmorras, modo survival, marketplace, ranking y chat en tiempo real. Desplegable como PWA y app nativa Android (Capacitor).

## 🚀 Estado Actual — ~98%

### ✅ Completado
- **13 páginas** completas: SplashScreen, Landing, Auth, Dashboard, Inventory, Shop, Marketplace, Dungeon, Survival, Ranking, Wiki, Profile, Settings
- **Motor 3D** con React Three Fiber + Rapier: 14 sistemas, 9 niveles, 5 módulos RPG, entidades, personajes
- **Física auditada** — Rapier: raycast real, CCD, gravedad unificada (-20), sphereCast/overlapSphere reales, kill zone, frame-independent lerps, colliders corregidos
- **Motor Sketchbook** adaptado: SpringSimulator, AIBehaviours, Arcade Velocity, Character Tilt, SceneEnhancer, WaterfallEffect
- **Guest Mode** completo: sessionStore (none/guest/auth) + GuestAccessGuard + matriz de acceso
- **16 servicios** conectados al backend: 135 endpoints, cobertura 100%
- **10 stores** Zustand: game, ui, player, session, team, gameMode, dungeon, settings, notifications, engine
- **9 tipos** completos con interfaces alineadas al backend
- **Guards**: RequireAuth, RequireNoAuth, GuestAccessGuard
- **PWA** configurada con VitePWA + Service Worker
- **Capacitor** Android configurado
- **Tailwind CSS v4** integrado
- **Responsive** landscape + portrait en todas las páginas
- **Notificaciones**: Bell + List + Item con paginación

### 🔄 Pendiente
- [ ] **Fase 6 — Shaders/VFX**: skyShader, waterShader, grassShader, fireShader, stoneShader, groundShader, materiales custom
- [ ] **Página Demo**: Integrar motor 3D con lobby + HUD (actualmente `/demo` usa Landing como placeholder)
- [ ] **Componentes UI**: RPGToast, ProgressBar, OfflineIndicator
- [ ] **PWA offline API**: Sin estrategia de caching para peticiones al backend

---

### Últimas novedades (18–19 de febrero de 2026)
- Modo **Demo / Invitado**: sesión guest persistente (F5), `startDemoSession()` → `startGuestSession()` y `performLogout()`; logout demo limpia localStorage + stores **sin** llamar al backend.
- Corrección crítica en `RequireAuth`: hook movido al nivel superior para evitar violaciones de las reglas de hooks de React (evita crashes inesperados).
- Fix: crash `Maximum update depth exceeded` en `Dashboard` resuelto — estabilizados selectores (uso de `useShallow` en `uiStore` y `settingsStore`).
- UX: modal de confirmación "Salir del Modo Demo" (Navbar + Dashboard) y corrección de CSS móvil del Navbar.
- Tests añadidos: unit tests (`guest.service`, `session.service`) y E2E (`demo-logout`, `debug-dev-dashboard`); script `npm run test:e2e` disponible.
- Limpieza: eliminados logs de instrumentación DEV introducidos durante la depuración.

**Cómo probar el modo Demo rápidamente:**
1. Abrir la app → pulsar **Entrar al Demo** en Landing (o ejecutar `startDemoSession()` en consola).
2. Verificar `localStorage.valnor-session-storage` contiene `isGuest:true` y `localStorage.valnor_user`.
3. Ir a `/dashboard` → pulsar Logout (debe mostrar modal y **no** realizar llamada al backend).
4. Ejecutar E2E: `npm run test:e2e` (verifica flujo demo + logout).

---

## 🔌 Servicios del Backend

**Base URL:** `https://valgame-backend.onrender.com`

| Servicio | Endpoints | Protocolo |
|----------|-----------|-----------|
| **Auth** | `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/verify/:token`, `/auth/forgot-password`, `/auth/reset-password/:token` | HTTP |
| **Users** | `/api/users/me` | HTTP |
| **Dungeons** | `/api/dungeons`, `/api/dungeons/:id/start` | HTTP |
| **Rankings** | `/api/rankings`, `/api/rankings/leaderboard/:category`, `/api/rankings/me` | HTTP |
| **Survival** | `/api/survival/start`, `/api/survival/:id/complete-wave`, `/api/survival/:id/end`, `/api/survival/leaderboard` | HTTP |
| **Notifications** | `/api/notifications`, `/api/notifications/unread/count`, `/api/notifications/:id/read` | HTTP |
| **Settings** | `/api/user/settings` (GET/PUT), `/api/user/settings/reset` (POST) | HTTP |
| **Realtime** | Socket.IO — eventos: `auth`, `character:*`, `inventory:*`, `marketplace:*`, `survival:*`, `chat:*`, `notification:*`, `rankings:update`, `battle:update` | WebSocket |

---

## 📁 Estructura del Proyecto

```
src/
├── App.tsx                    # Router principal con guards
├── main.tsx                   # Entry point
├── index.css                  # Tailwind v4 + CSS custom
├── config/                    # api.config.ts, game.config.ts
├── context/                   # AuthContext.tsx
├── hooks/                     # useAuth, useNotifications, useSettings, usePlatform
├── stores/                    # 9 stores Zustand
├── services/                  # api, auth, dungeon, ranking, socket (Socket.IO)
├── types/                     # 9 archivos de tipos alineados con backend
├── utils/                     # constants.ts, helpers.ts
├── components/
│   ├── guards/                # RequireAuth, RequireNoAuth
│   ├── ui/                    # LoadingScreen, GlobalNavbar, EnergyBar, GuestBanner, CookieConsent
│   ├── icons/                 # GameIcons
│   ├── characters/            # CharacterCard
│   ├── dungeons/              # DungeonList, DungeonBattle
│   ├── survival/              # SurvivalBattle
│   ├── notifications/         # NotificationBell, NotificationList, NotificationItem
│   └── pwa/                   # PWA install prompt
├── pages/                     # 13 páginas
└── engine/                    # Motor 3D completo
    ├── components/            # GameCanvas, Player, PhysicsWorld, GameCamera
    ├── hooks/                 # useCamera, useInput, useMovement
    ├── systems/               # 14 sistemas
    ├── scenes/                # 9 niveles
    ├── rpg/                   # rpg-calculator, enemy-factory, leveling, loot, save
    ├── entities/              # GameEntity, BossEntity, EnemyEntity
    ├── character/             # Character, states, registry
    ├── stores/                # engineStore
    └── utils/                 # physics, math, logger
```

## 🛠️ Tecnologías

| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | 19.2.4 | UI Framework |
| Vite | 7.3.1 | Build Tool |
| TypeScript | 5.x | Tipado estático |
| react-router-dom | ^7.13.0 | Navegación SPA |
| three | ^0.182.0 | Gráficos 3D |
| @react-three/fiber | ^9.5.0 | React + Three.js |
| @react-three/drei | ^10.7.7 | Helpers 3D |
| @react-three/rapier | ^2.2.0 | Física 3D |
| zustand | ^5.0.10 | Estado global |
| socket.io-client | ^4.8.1 | Tiempo real |
| framer-motion | ^12.12.2 | Animaciones UI |
| Tailwind CSS | v4.1 | Estilos utilitarios |
| @capacitor/core | ^8.0.2 | App nativa Android |
| vite-plugin-pwa | ^1.1.0 | PWA + Service Worker |

## 🏃 Ejecutar Proyecto

```bash
npm install
npm run dev          # → http://localhost:5173
npm run build        # Producción
npm run cap:sync     # Sincronizar con Android
npm run test:e2e     # Ejecutar pruebas E2E (Puppeteer + vitest)
```

---
*Última actualización: 19 de febrero de 2026*
