# 🚀 Fases de Desarrollo Frontend - Valgame

Este documento define el orden de desarrollo del frontend, con **referencias exactas** a los documentos que debes leer en cada fase.

---

## 📚 ÍNDICE DE DOCUMENTOS

Antes de empezar, aquí está el mapa completo de documentación:

```
docs/02_frontend/
│
├── 📖 DOCUMENTOS GENERALES (leer primero)
│   ├── 00_COMIENZA_AQUI.md          ← EMPIEZA AQUÍ
│   ├── README.md                     ← Visión general
│   ├── CONFIGURACION_CONEXION_BACKEND.md  ← Setup React + Backend
│   ├── MANEJO_COOKIES_HTTPONLY.md   ← Autenticación con cookies
│   ├── ENDPOINTS_CATALOG.md         ← Lista TODOS los endpoints
│   ├── ERRORS_AND_LIMITS.md         ← Manejo de errores y rate limits
│   └── FASES_DESARROLLO_FRONTEND.md ← ESTE DOCUMENTO
│
├── 📖 AUTH
│   ├── AUTH_AND_FLOWS.md            ← Flujos de autenticación
│   └── FLUJO_REGISTRO_VERIFICACION.md ← Registro paso a paso
│
├── 📖 GAME DASHBOARD (carpeta)
│   ├── 00_INDICE.md                 ← Índice de la carpeta
│   ├── DASHBOARD_Y_TEAMS.md         ← Dashboard principal
│   ├── INVENTARIO_Y_PERSONAJES.md   ← Gestión de items/chars
│   ├── PERSONAJES_Y_MODELOS_3D.md   ← Conexión con Three.js
│   ├── SELECCION_MODO.md            ← Elegir modo de juego
│   ├── COMBATE_Y_DUNGEONS.md        ← Dungeons + Survival
│   ├── MARKETPLACE_P2P.md           ← Compra/venta entre jugadores
│   ├── TIENDA_Y_PAQUETES.md         ← Comprar con dinero real
│   ├── PERFIL_Y_CONFIGURACION.md    ← Settings del usuario
│   ├── WEBSOCKET_EVENTS.md          ← Eventos real-time
│   └── WEBSOCKET_LISTENERS.md       ← Cómo escuchar eventos
│
└── 📖 OTROS
    ├── CHECKLIST_INTEGRACION.md     ← Verificar integración
    └── COMPATIBILITY_ALIASES.md     ← Alias de endpoints
```

---

## 📋 RESUMEN VISUAL DE FASES

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│  FASE 1: FUNDAMENTOS ──────────────────────────────────────────── 📄 4 documentos      │
│       │                                                                                 │
│       ▼                                                                                 │
│  FASE 2: DASHBOARD BÁSICO ─────────────────────────────────────── 📄 2 documentos      │
│       │                                                                                 │
│       ▼                                                                                 │
│  FASE 3: GESTIÓN DE PERSONAJES ────────────────────────────────── 📄 2 documentos      │
│       │                                                                                 │
│       ▼                                                                                 │
│  FASE 4: SELECCIÓN DE MODO ────────────────────────────────────── 📄 1 documento       │
│       │                                                                                 │
│       ├───────────────────────┐                                                         │
│       ▼                       ▼                                                         │
│  FASE 5: DUNGEONS        FASE 6: SURVIVAL ─────────────────────── 📄 2 documentos      │
│       │                       │                                                         │
│       └───────────┬───────────┘                                                         │
│                   ▼                                                                     │
│  FASE 7: MARKETPLACE ──────────────────────────────────────────── 📄 1 documento       │
│                   │                                                                     │
│                   ▼                                                                     │
│  FASE 8: EXTRAS ───────────────────────────────────────────────── 📄 3 documentos      │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 🔴 FASE 1: FUNDAMENTOS
**Prioridad**: CRÍTICA - Sin esto no funciona nada  
**Duración estimada**: 1-2 semanas

## 📚 DOCUMENTOS A LEER (en este orden):

| # | Documento | Qué aprenderás |
|---|-----------|----------------|
| 1 | [00_COMIENZA_AQUI.md](./00_COMIENZA_AQUI.md) | Visión general, por dónde empezar |
| 2 | [CONFIGURACION_CONEXION_BACKEND.md](./CONFIGURACION_CONEXION_BACKEND.md) | Setup de React, variables de entorno, proxy |
| 3 | [MANEJO_COOKIES_HTTPONLY.md](./MANEJO_COOKIES_HTTPONLY.md) | Hook useAuth, useApi, cookies httpOnly |
| 4 | [AUTH_AND_FLOWS.md](./AUTH_AND_FLOWS.md) | Flujos completos de login/registro/logout |

## ✅ Qué debes implementar:

- [ ] Proyecto React + Vite creado
- [ ] Variables de entorno configuradas (`.env`)
- [ ] Hook `useApi` para llamadas con `credentials: 'include'`
- [ ] Hook `useAuth` con login, logout, registro
- [ ] Componente `RequireAuth` para rutas protegidas
- [ ] Páginas: Login, Register, ForgotPassword, ResetPassword
- [ ] Contexto de autenticación global

## 🔗 Endpoints que usarás:

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/user/me
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/verify/:token
```

---

# 🟠 FASE 2: DASHBOARD BÁSICO
**Prioridad**: ALTA  
**Depende de**: FASE 1 completada  
**Duración estimada**: 1 semana

## 📚 DOCUMENTOS A LEER:

| # | Documento | Qué aprenderás |
|---|-----------|----------------|
| 1 | [game_dashboard/DASHBOARD_Y_TEAMS.md](./game_dashboard/DASHBOARD_Y_TEAMS.md) | Estructura del dashboard, recursos |
| 2 | [ENDPOINTS_CATALOG.md](./ENDPOINTS_CATALOG.md) | Referencia de todos los endpoints |

## ✅ Qué debes implementar:

- [ ] Layout principal (Header + Sidebar + Content)
- [ ] Header mostrando: VAL, Boletos, Energía, EVO
- [ ] Barra de regeneración de energía
- [ ] Lista de personajes (solo lectura)
- [ ] Lista de inventario (solo lectura)
- [ ] Navegación entre secciones

## 🔗 Endpoints que usarás:

```
GET /api/user/me   ← Devuelve TODO: recursos, personajes, inventario
```

---

# 🟡 FASE 3: GESTIÓN DE PERSONAJES
**Prioridad**: ALTA - Necesario antes de jugar  
**Depende de**: FASE 2 completada  
**Duración estimada**: 1-2 semanas

## 📚 DOCUMENTOS A LEER:

| # | Documento | Qué aprenderás |
|---|-----------|----------------|
| 1 | [game_dashboard/INVENTARIO_Y_PERSONAJES.md](./game_dashboard/INVENTARIO_Y_PERSONAJES.md) | Equipar items, usar consumibles |
| 2 | [game_dashboard/COMBATE_Y_DUNGEONS.md](./game_dashboard/COMBATE_Y_DUNGEONS.md) | Sección "Sistema de Salud y Heridos" - curar/revivir |

## ✅ Qué debes implementar:

- [ ] CharacterCard con estados visuales (saludable/dañado/herido)
- [ ] Barra de vida con colores según HP
- [ ] Botón "Equipar" → Modal para seleccionar item
- [ ] Botón "Desequipar"
- [ ] Botón "Curar" (cuando HP < máximo)
- [ ] Botón "Revivir" (cuando estado = herido)
- [ ] TeamBuilder: seleccionar 1-4 personajes para jugar

## 🔗 Endpoints que usarás:

```
POST /api/equipment/equip      { characterId, itemId, slot }
POST /api/equipment/unequip    { characterId, slot }
POST /api/characters/:id/heal
POST /api/characters/:id/revive
```

## ⚠️ Reglas de negocio importantes:

```
- Curar cuesta: 2 VAL por cada 10 HP
- Revivir cuesta: 50 VAL (fijo)
- Personaje herido NO puede ser seleccionado para jugar
- Máximo 4 personajes por equipo
```

---

# 🟢 FASE 4: SELECCIÓN DE MODO
**Prioridad**: MEDIA-ALTA  
**Depende de**: FASE 3 completada  
**Duración estimada**: 3-5 días

## 📚 DOCUMENTOS A LEER:

| # | Documento | Qué aprenderás |
|---|-----------|----------------|
| 1 | [game_dashboard/SELECCION_MODO.md](./game_dashboard/SELECCION_MODO.md) | Pantalla de selección, lista de dungeons |

## ✅ Qué debes implementar:

- [ ] Pantalla con 2 opciones grandes: DUNGEONS | SURVIVAL
- [ ] Lista de dungeons disponibles (cards)
- [ ] Detalle de dungeon (requisitos, recompensas)
- [ ] Validación: ¿tiene nivel suficiente? ¿tiene energía?
- [ ] Botón para confirmar equipo y entrar

## 🔗 Endpoints que usarás:

```
GET /api/dungeons              ← Lista todos los dungeons
GET /api/dungeons/:id          ← Detalle de un dungeon
```

---

# 🔵 FASE 5: MODO DUNGEONS
**Prioridad**: MEDIA  
**Depende de**: FASE 4 completada  
**Duración estimada**: 1 semana

## 📚 DOCUMENTOS A LEER:

| # | Documento | Qué aprenderás |
|---|-----------|----------------|
| 1 | [game_dashboard/COMBATE_Y_DUNGEONS.md](./game_dashboard/COMBATE_Y_DUNGEONS.md) | Sección "MODO DUNGEONS" - combate automático |

## ✅ Qué debes implementar:

- [ ] Pantalla de confirmación de equipo
- [ ] Pantalla de "combate" (loading o animación simple)
- [ ] Pantalla de resultados (victoria/derrota)
- [ ] Mostrar recompensas obtenidas
- [ ] Actualizar estado de personajes (pueden quedar dañados)

## 🔗 Endpoints que usarás:

```
POST /api/dungeons/:id/start   { team: ["charId1", "charId2"] }
```

## ⚠️ Importante:

```
El combate es AUTOMÁTICO - un solo request resuelve todo.
La respuesta incluye: victoria, recompensas, daño recibido por cada personaje.
```

---

# 🟣 FASE 6: MODO SURVIVAL (Three.js)
**Prioridad**: MEDIA - El más complejo  
**Depende de**: FASE 4 completada  
**Duración estimada**: 3-4 semanas

## 📚 DOCUMENTOS A LEER:

| # | Documento | Qué aprenderás |
|---|-----------|----------------|
| 1 | [game_dashboard/COMBATE_Y_DUNGEONS.md](./game_dashboard/COMBATE_Y_DUNGEONS.md) | Sección "MODO SURVIVAL", división Frontend/Backend |
| 2 | [game_dashboard/PERSONAJES_Y_MODELOS_3D.md](./game_dashboard/PERSONAJES_Y_MODELOS_3D.md) | Cargar modelos .glb según personajeId |

## ✅ Qué debes implementar (sub-fases):

### 6.1 Escena básica (3-4 días)
- [ ] Canvas Three.js funcionando
- [ ] Cámara y luces configuradas
- [ ] Terreno/plano básico

### 6.2 Personaje jugable (1 semana)
- [ ] Cargar modelo .glb según `personajeId`
- [ ] Controles WASD
- [ ] Animaciones básicas

### 6.3 Enemigos (1 semana)
- [ ] Spawn de enemigos
- [ ] IA básica (perseguir jugador)
- [ ] Sistema de colisiones

### 6.4 Sistema de oleadas (3-4 días)
- [ ] Contador de oleada
- [ ] HUD (vida, puntos, oleada)
- [ ] Reportar oleada al backend

### 6.5 Integración (3-4 días)
- [ ] Usar consumibles
- [ ] Terminar partida
- [ ] Pantalla de resultados

## 🔗 Endpoints que usarás:

```
POST /api/survival/start                    { characterId, equipmentIds }
POST /api/survival/:sessionId/complete-wave { waveNumber, enemiesDefeated }
POST /api/survival/:sessionId/use-consumable { consumableId }
POST /api/survival/:sessionId/pickup-drop   { dropId }
POST /api/survival/:sessionId/end           { finalWave, totalPoints }
POST /api/survival/:sessionId/death         { waveAtDeath, pointsAtDeath }
```

## ⚠️ Importante - División Frontend/Backend:

```
FRONTEND hace:                    BACKEND hace:
─────────────────────────────     ─────────────────────────────
✅ Renderizar escena 3D           ✅ Validar resultados
✅ Mover personaje (WASD)         ✅ Calcular puntos
✅ Spawns de enemigos             ✅ Dar recompensas
✅ Colisiones y animaciones       ✅ Guardar en leaderboard
✅ HUD y botones                  ✅ Anti-cheat básico
```

---

# 🟤 FASE 7: MARKETPLACE
**Prioridad**: BAJA-MEDIA  
**Depende de**: FASE 2 completada (puede hacerse paralelo a Fase 5-6)  
**Duración estimada**: 1-2 semanas

## 📚 DOCUMENTOS A LEER:

| # | Documento | Qué aprenderás |
|---|-----------|----------------|
| 1 | [game_dashboard/MARKETPLACE_P2P.md](./game_dashboard/MARKETPLACE_P2P.md) | Comprar, vender, filtros, listados |

## ✅ Qué debes implementar:

- [ ] Lista de items en venta (con paginación)
- [ ] Filtros por tipo, rareza, precio
- [ ] Detalle de item
- [ ] Botón "Comprar"
- [ ] "Mis listados" (items que tengo en venta)
- [ ] Crear nuevo listado (poner item en venta)
- [ ] Cancelar listado

## 🔗 Endpoints que usarás:

```
GET    /api/marketplace              ← Lista con filtros
GET    /api/marketplace/:id          ← Detalle
POST   /api/marketplace/:id/buy      ← Comprar
POST   /api/marketplace              ← Crear listado
DELETE /api/marketplace/:id          ← Cancelar
```

## ⚠️ Importante:

```
- 5% de comisión en cada venta
- Items listados se bloquean del inventario
- Al cancelar, el item vuelve al inventario
```

---

# ⚪ FASE 8: EXTRAS Y PULIDO
**Prioridad**: BAJA  
**Depende de**: Fases 1-7  
**Duración estimada**: 2-4 semanas

## 📚 DOCUMENTOS A LEER:

| # | Documento | Qué aprenderás |
|---|-----------|----------------|
| 1 | [game_dashboard/TIENDA_Y_PAQUETES.md](./game_dashboard/TIENDA_Y_PAQUETES.md) | Comprar con Stripe/crypto |
| 2 | [game_dashboard/WEBSOCKET_EVENTS.md](./game_dashboard/WEBSOCKET_EVENTS.md) | Eventos en tiempo real |
| 3 | [game_dashboard/PERFIL_Y_CONFIGURACION.md](./game_dashboard/PERFIL_Y_CONFIGURACION.md) | Settings del usuario |

## ✅ Qué debes implementar:

- [ ] Tienda de paquetes (Stripe)
- [ ] Rankings/Leaderboards
- [ ] Notificaciones in-app
- [ ] Chat global (WebSocket)
- [ ] Perfil y configuración
- [ ] Sistema de invocación (abrir paquetes)
- [ ] Evolución de personajes
- [ ] Tutorial/Onboarding

## 🔗 Endpoints que usarás:

```
POST /api/purchases/initiate-stripe
GET  /api/rankings/survival
GET  /api/notifications
POST /api/user/open-package
POST /api/characters/:id/evolve
WebSocket: /socket.io
```

---

# 📅 CRONOGRAMA SUGERIDO

```
┌──────────────┬─────────────────────────────────────────────────────────┐
│ Semana       │ Qué hacer                                               │
├──────────────┼─────────────────────────────────────────────────────────┤
│ Semana 1-2   │ FASE 1: Auth completo                                   │
│ Semana 3     │ FASE 2: Dashboard básico                                │
│ Semana 4-5   │ FASE 3: Gestión de personajes                           │
│ Semana 5-6   │ FASE 4: Selección de modo                               │
│ Semana 6-7   │ FASE 5: Modo Dungeons                                   │
│ Semana 7-11  │ FASE 6: Modo Survival (Three.js)                        │
│ Semana 8-9   │ FASE 7: Marketplace (paralelo con Survival)             │
│ Semana 12+   │ FASE 8: Extras                                          │
├──────────────┼─────────────────────────────────────────────────────────┤
│ TOTAL        │ 12-14 semanas para MVP completo                         │
└──────────────┴─────────────────────────────────────────────────────────┘
```

---

# ⚠️ REGLAS PARA NO PERDERTE

## 1. Siempre empieza por el documento indicado
```
❌ MAL: "Voy a empezar a codear sin leer nada"
✅ BIEN: "Leo los 4 documentos de FASE 1, luego codifico"
```

## 2. No saltes fases
```
❌ MAL: "Quiero hacer Survival primero porque es lo cool"
✅ BIEN: "Primero Auth, luego Dashboard, luego Personajes..."
```

## 3. Una fase debe estar COMPLETA antes de pasar
```
❌ MAL: "Hice login pero no logout, paso a Dashboard"
✅ BIEN: "Auth completo (login, logout, registro, verificación)"
```

## 4. Usa el ENDPOINTS_CATALOG como referencia
```
Si no sabes qué endpoint usar → ENDPOINTS_CATALOG.md
Si no sabes qué respuesta esperar → ENDPOINTS_CATALOG.md
```

## 5. Si algo no funciona, revisa ERRORS_AND_LIMITS
```
¿Error 401? → Revisa cookies y auth
¿Error 429? → Rate limit, espera
¿Error 400? → Revisa el body que envías
```

---

# 🗂️ ESTRUCTURA DE CARPETAS SUGERIDA

```
src/
├── main.tsx
├── App.tsx
├── vite-env.d.ts
│
├── contexts/                    ← FASE 1
│   └── AuthContext.tsx
│
├── hooks/                       ← FASE 1-7
│   ├── useAuth.ts              ← FASE 1
│   ├── useApi.ts               ← FASE 1
│   ├── useCharacters.ts        ← FASE 3
│   ├── useEquipment.ts         ← FASE 3
│   ├── useSurvival.ts          ← FASE 6
│   └── useMarketplace.ts       ← FASE 7
│
├── pages/                       ← Organizadas por fase
│   ├── auth/                   ← FASE 1
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── ForgotPassword.tsx
│   │   └── ResetPassword.tsx
│   │
│   ├── dashboard/              ← FASE 2
│   │   └── Dashboard.tsx
│   │
│   ├── characters/             ← FASE 3
│   │   ├── CharacterList.tsx
│   │   ├── CharacterDetail.tsx
│   │   └── TeamBuilder.tsx
│   │
│   ├── mode-selection/         ← FASE 4
│   │   └── ModeSelection.tsx
│   │
│   ├── dungeons/               ← FASE 5
│   │   ├── DungeonList.tsx
│   │   ├── DungeonBattle.tsx
│   │   └── DungeonResults.tsx
│   │
│   ├── survival/               ← FASE 6
│   │   ├── SurvivalGame.tsx
│   │   └── SurvivalResults.tsx
│   │
│   ├── marketplace/            ← FASE 7
│   │   ├── MarketplaceList.tsx
│   │   ├── MyListings.tsx
│   │   └── CreateListing.tsx
│   │
│   └── extras/                 ← FASE 8
│       ├── Shop.tsx
│       ├── Rankings.tsx
│       └── Profile.tsx
│
├── components/                  ← Compartidos
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Layout.tsx
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── LoadingSpinner.tsx
│   └── game/
│       ├── CharacterCard.tsx
│       ├── HealthBar.tsx
│       ├── ItemCard.tsx
│       └── ResourceBar.tsx
│
├── game/                        ← FASE 6 (Three.js)
│   ├── Scene.ts
│   ├── Player.ts
│   ├── Enemy.ts
│   ├── Controls.ts
│   └── ModelLoader.ts
│
├── types/                       ← Tipos TypeScript
│   ├── user.ts
│   ├── character.ts
│   ├── item.ts
│   └── game.ts
│
└── styles/
    ├── globals.css
    └── variables.css
```

---

# ✅ CHECKLIST RÁPIDO POR FASE

## FASE 1 - ¿Listo para pasar a FASE 2?
- [ ] ¿Puedo registrarme?
- [ ] ¿Puedo hacer login?
- [ ] ¿Puedo hacer logout?
- [ ] ¿Las rutas protegidas redirigen a login?
- [ ] ¿La sesión se mantiene después de refresh?

## FASE 2 - ¿Listo para pasar a FASE 3?
- [ ] ¿Veo mis recursos (VAL, energía, boletos)?
- [ ] ¿Veo mi lista de personajes?
- [ ] ¿Veo mi inventario?
- [ ] ¿La navegación funciona?

## FASE 3 - ¿Listo para pasar a FASE 4?
- [ ] ¿Puedo equipar items a personajes?
- [ ] ¿Puedo curar personajes dañados?
- [ ] ¿Puedo revivir personajes heridos?
- [ ] ¿Puedo armar un equipo de 1-4 personajes?

## FASE 4 - ¿Listo para pasar a FASE 5/6?
- [ ] ¿Veo las opciones Dungeons y Survival?
- [ ] ¿Puedo ver la lista de dungeons?
- [ ] ¿Puedo ver los requisitos de cada dungeon?

## FASE 5 - ¿Dungeons funciona?
- [ ] ¿Puedo enviar equipo a dungeon?
- [ ] ¿Veo resultado (victoria/derrota)?
- [ ] ¿Veo recompensas?
- [ ] ¿Los personajes se actualizan (daño)?

## FASE 6 - ¿Survival funciona?
- [ ] ¿La escena 3D carga?
- [ ] ¿El modelo del personaje carga?
- [ ] ¿Puedo moverme con WASD?
- [ ] ¿Aparecen enemigos?
- [ ] ¿El sistema de oleadas funciona?
- [ ] ¿Puedo terminar la partida?

## FASE 7 - ¿Marketplace funciona?
- [ ] ¿Veo items en venta?
- [ ] ¿Puedo comprar?
- [ ] ¿Puedo vender?
- [ ] ¿Puedo cancelar mis listados?

---

**Última actualización**: Febrero 2026  
**Framework**: React + TypeScript + Vite + Three.js
