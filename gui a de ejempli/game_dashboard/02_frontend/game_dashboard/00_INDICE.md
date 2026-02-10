# 📚 Índice de Documentación - Game Dashboard

**Framework**: React + TypeScript + Three.js  
**Última Actualización**: 2 de febrero de 2026

---

## Archivos en esta Carpeta

| Archivo | Contenido | Pantallas |
|---------|-----------|-----------|
| [COMBATE_Y_DUNGEONS.md](COMBATE_Y_DUNGEONS.md) | **PRINCIPAL** RPG + Survival completo, combate, resultados | Dungeons, Survival, Victoria/Derrota |
| [DASHBOARD_Y_TEAMS.md](DASHBOARD_Y_TEAMS.md) | Dashboard principal, sistema de equipos | Home, Team Builder |
| [INVENTARIO_Y_PERSONAJES.md](INVENTARIO_Y_PERSONAJES.md) | Items, acciones sobre personajes | Inventario, Detalle personaje |
| [MARKETPLACE_P2P.md](MARKETPLACE_P2P.md) | Comprar/vender items entre jugadores | Marketplace |
| [TIENDA_Y_PAQUETES.md](TIENDA_Y_PAQUETES.md) | Tienda oficial, paquetes, compras | Shop, Mis Paquetes |
| [PERFIL_Y_CONFIGURACION.md](PERFIL_Y_CONFIGURACION.md) | Settings, notificaciones, perfil | Configuración, Perfil |
| [SELECCION_MODO.md](SELECCION_MODO.md) | Selección RPG vs Survival | Portales |
| [MODO_INVITADO.md](MODO_INVITADO.md) | Flujo de usuario no registrado | Demo, Onboarding |
| [WEBSOCKET_EVENTS.md](WEBSOCKET_EVENTS.md) | Especificación de todos los eventos WS | Real-time |
| [WEBSOCKET_LISTENERS.md](WEBSOCKET_LISTENERS.md) | Guía de implementación listeners | Real-time |

---

## 🎯 Mapa de Pantallas → Endpoints

### 🏠 Dashboard Principal
```
GET /api/users/me          → Datos del usuario (recursos, personajes)
GET /api/teams             → Mis equipos
GET /api/notifications     → Notificaciones recientes
GET /api/rankings/me       → Mi posición en ranking
```
📄 Ver: [DASHBOARD_Y_TEAMS.md](DASHBOARD_Y_TEAMS.md)

---

### 🏰 RPG (Dungeons) - Combate Automático
```
GET  /api/dungeons                    → Lista de mazmorras
GET  /api/dungeons/:id                → Detalle de mazmorra
POST /api/dungeons/:dungeonId/start   → INICIAR COMBATE (envía team[])
GET  /api/dungeons/:dungeonId/progress → Progreso en mazmorra
```
**Respuesta de `/start`**: Combate completo (victoria/derrota, exp, loot, racha)

📄 Ver: [COMBATE_Y_DUNGEONS.md](COMBATE_Y_DUNGEONS.md)

---

### ☠️ Survival - Combate Manual
```
POST /api/survival/start                     → Iniciar sesión (1 personaje)
POST /api/survival/:sessionId/complete-wave  → Completar oleada
POST /api/survival/:sessionId/use-consumable → Usar poción
POST /api/survival/:sessionId/pickup-drop    → Recoger drop
POST /api/survival/:sessionId/end            → Victoria (retirarse)
POST /api/survival/:sessionId/death          → Muerte
POST /api/survival/:sessionId/abandon        → Abandonar
GET  /api/survival/leaderboard               → Ranking Survival
GET  /api/survival/my-stats                  → Mis stats Survival
```
📄 Ver: [COMBATE_Y_DUNGEONS.md](COMBATE_Y_DUNGEONS.md)

---

### 🛒 Marketplace P2P
```
GET  /api/marketplace/listings       → Listar items en venta
POST /api/marketplace/list           → Publicar item
POST /api/marketplace/buy/:listingId → Comprar item
POST /api/marketplace/cancel/:id     → Cancelar publicación
GET  /api/marketplace/my-listings    → Mis publicaciones
GET  /api/marketplace/history        → Historial de transacciones
```
📄 Ver: [MARKETPLACE_P2P.md](MARKETPLACE_P2P.md)

---

### 🛍️ Tienda y Paquetes
```
GET  /api/shop/packages        → Catálogo de paquetes
POST /api/shop/purchase        → Comprar paquete
GET  /api/user-packages/:userId → Mis paquetes sin abrir
POST /api/user-packages/open   → Abrir paquete
POST /api/user-packages/:id/open → Abrir paquete específico
```
📄 Ver: [TIENDA_Y_PAQUETES.md](TIENDA_Y_PAQUETES.md)

---

### 📦 Inventario
```
GET /api/inventory              → Todo mi inventario
GET /api/inventory/equipment    → Solo equipamiento
GET /api/inventory/consumables  → Solo consumibles
```
📄 Ver: [INVENTARIO_Y_PERSONAJES.md](INVENTARIO_Y_PERSONAJES.md)

---

### ⚔️ Acciones sobre Personajes
```
POST /api/characters/:id/equip         → Equipar item
POST /api/characters/:id/unequip       → Desequipar
POST /api/characters/:id/use-consumable → Usar poción
POST /api/characters/:id/heal          → Curar
POST /api/characters/:id/revive        → Revivir
POST /api/characters/:id/evolve        → Evolucionar
PUT  /api/characters/:id/level-up      → Subir nivel
GET  /api/characters/:id/stats         → Ver stats
```
📄 Ver: [INVENTARIO_Y_PERSONAJES.md](INVENTARIO_Y_PERSONAJES.md)

---

### 👤 Perfil y Config
```
GET /api/users/me              → Mi perfil completo
GET /api/users/profile/:userId → Perfil público de otro
GET /api/user-settings         → Mis configuraciones
PUT /api/user-settings         → Actualizar config
```
📄 Ver: [PERFIL_Y_CONFIGURACION.md](PERFIL_Y_CONFIGURACION.md)

---

### 🏆 Rankings
```
GET /api/rankings                     → Top global
GET /api/rankings/leaderboard/:cat    → Por categoría
GET /api/rankings/me                  → Mi posición
GET /api/player-stats/usuario/:userId → Stats de jugador
```
📄 Ver: [COMBATE_Y_DUNGEONS.md](COMBATE_Y_DUNGEONS.md) (sección Rankings)

---

### 🔔 Notificaciones
```
GET /api/notifications           → Listar
GET /api/notifications/unread/count → Contador
PUT /api/notifications/:id/read  → Marcar leída
PUT /api/notifications/read-all  → Marcar todas
```
📄 Ver: [PERFIL_Y_CONFIGURACION.md](PERFIL_Y_CONFIGURACION.md)

---

## 📡 WebSocket Events (Principales)

| Evento | Cuándo | Acción en UI |
|--------|--------|--------------|
| `character:level-up` | Personaje sube nivel | Toast + actualizar stats |
| `character:evolved` | Personaje evoluciona | Modal celebración |
| `rankings:update` | Cambio en rankings | Refrescar si está visible |
| `inventory:update` | Cambio en inventario | Actualizar lista |
| `marketplace:update` | Nuevo listing/compra | Refrescar marketplace |
| `notification:new` | Nueva notificación | Badge + push |
| `survival:wave:new` | Nueva oleada survival | UI de oleada |
| `survival:end` | Fin de sesión survival | Pantalla resultados |

📄 Ver: [WEBSOCKET_EVENTS.md](WEBSOCKET_EVENTS.md) y [WEBSOCKET_LISTENERS.md](WEBSOCKET_LISTENERS.md)

---

## 🔄 Flujos Principales

### Flujo RPG (Automático)
```
Seleccionar Mazmorra → Armar Equipo → POST /dungeons/:id/start
                                            ↓
                              Resultado inmediato (victoria/derrota)
                                            ↓
                              Mostrar recompensas + actualizar stats
```

### Flujo Survival (Manual)
```
Seleccionar Personaje → Equipar Items → POST /survival/start
                                              ↓
                                        sessionId
                                              ↓
                            ┌─────────────────┴─────────────────┐
                            │     LOOP DE JUEGO (Three.js)       │
                            │  - complete-wave (terminar oleada) │
                            │  - use-consumable (usar poción)    │
                            │  - pickup-drop (recoger loot)      │
                            └─────────────────┬─────────────────┘
                                              ↓
                            /end (victoria) O /death (derrota)
                                              ↓
                                    Pantalla de resultados
```

### Flujo Marketplace
```
Ver Listings → Comprar (POST /buy) O Vender (POST /list)
                    ↓
            WebSocket: marketplace:update
                    ↓
            Refrescar UI + Notificación
```

---

## ✅ Checklist de Implementación

### Pantallas Core
- [ ] Dashboard (home con stats y equipos)
- [ ] Selector de Modo (RPG vs Survival)
- [ ] Lista de Dungeons (RPG)
- [ ] Armado de Equipo (team builder)
- [ ] Pantalla de Combate RPG (animación mientras espera resultado)
- [ ] Victoria/Derrota Modal (con recompensas)
- [ ] Survival Setup (selección personaje + items)
- [ ] Survival Gameplay (Three.js)
- [ ] Survival Results

### Pantallas Secundarias
- [ ] Inventario
- [ ] Detalle de Personaje
- [ ] Marketplace (listings)
- [ ] Tienda (paquetes)
- [ ] Rankings
- [ ] Perfil
- [ ] Configuración
- [ ] Notificaciones

### Integraciones
- [ ] WebSocket conectado
- [ ] JWT en todas las requests
- [ ] Manejo de errores (401, 403, 404, 429)
- [ ] Rate limiting respetado
