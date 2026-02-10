# 🎮 Dashboard Principal y Modos de Juego

**Framework**: React + TypeScript + Three.js  
**Guía UI/UX para desarrolladores frontend**  
**Fecha**: Febrero 2026  
**Última actualización**: 2 de Febrero 2026

---

## ⚠️ IMPORTANTE: Diferencias entre Modos de Juego

| Característica | 🏰 RPG (Dungeons) | ☠️ Survival |
|----------------|-------------------|-------------|
| **Personajes** | **EQUIPO** (múltiples) | **1 SOLO** personaje |
| **Combate** | Automático (simulado en servidor) | Oleadas con acciones del jugador |
| **Sesión** | Una batalla por request | Sesión persistente multi-oleada |
| **Progresión** | Niveles de mazmorra | Oleadas infinitas + score |
| **Equipamiento** | Stats sumadas del equipo | 4 items exactos requeridos |
| **Costo** | 1 boleto por intento | Energía |

---

## 📊 Visión General del Dashboard

El dashboard es el **hub central** del jugador. Debe permitir acceso rápido a todas las acciones principales en **3 clics o menos**.

### Filosofía de Diseño
- **Rápido**: El jugador debe poder iniciar una partida en < 10 segundos
- **Claro**: Información crítica visible sin scroll
- **Fluido**: Transiciones suaves entre módulos
- **Horizontal**: SOLO modo landscape, aprovechar ancho

---

## 📐 DISEÑO: SOLO MODO HORIZONTAL (Landscape)

> ⚠️ **IMPORTANTE**: La app está diseñada SOLO para modo horizontal.
> - Resolución objetivo: **1920x1080** (desktop) / **1280x720** (tablet landscape)
> - Aprovechar el ancho completo
> - Usar **scroll horizontal** en listas de personajes/items
> - **NO scroll vertical** en pantalla principal (todo visible)

### CSS Base para Horizontal

```scss
// styles.scss - Configuración global horizontal

// Forzar landscape
@media (orientation: portrait) {
  .app-container {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    
    &::after {
      content: "🔄 Gira tu dispositivo";
      font-size: 24px;
      text-align: center;
    }
  }
}

// Variables de layout horizontal
:root {
  --header-height: 60px;
  --footer-height: 50px;
  --content-height: calc(100vh - var(--header-height) - var(--footer-height));
  --panel-left-width: 60%;
  --panel-right-width: 40%;
}

// Contenedor principal - SIN scroll vertical
.dashboard {
  height: 100vh;
  overflow: hidden; // Sin scroll en dashboard
  display: grid;
  grid-template-rows: var(--header-height) 1fr var(--footer-height);
}

// Scroll horizontal para listas
.horizontal-scroll {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  padding: 8px 0;
  
  // Ocultar scrollbar pero mantener funcionalidad
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
  
  // Cada item se ajusta al scroll
  > * {
    flex-shrink: 0;
    scroll-snap-align: start;
  }
}

// Cards de personajes (tamaño fijo horizontal)
.character-card {
  width: 120px;
  height: 160px;
  flex-shrink: 0;
}

// Panel dividido (2 columnas)
.split-panel {
  display: grid;
  grid-template-columns: var(--panel-left-width) var(--panel-right-width);
  height: var(--content-height);
  gap: 16px;
  padding: 16px;
}

// Solo el panel de actividad tiene scroll vertical
.activity-feed {
  max-height: 200px;
  overflow-y: auto;
}
```

### Dónde usar Scroll Horizontal

| Componente | Scroll | Dirección |
|-----------|--------|-----------|
| Dashboard principal | ❌ NO | - |
| Lista de personajes (roster) | ✅ SÍ | Horizontal |
| Lista de equipos guardados | ✅ SÍ | Horizontal |
| Selector de mazmorras | ✅ SÍ | Horizontal |
| Selector de consumibles | ✅ SÍ | Horizontal |
| Actividad reciente | ✅ SÍ | Vertical (único) |
| Modal de selección de item | ✅ SÍ | Horizontal |

---

## 🏠 Layout del Dashboard Principal (Horizontal)

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER: [Logo]          💰 1,500 VAL    ⚡ 3 EVO    🔋 45/50 Energía     🔔(3)    👤 User │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                            │
│  ┌────────────────────────────────────────────┐  ┌──────────────────────────────────────┐ │
│  │                                            │  │                                      │ │
│  │              ÁREA DE JUEGO                 │  │         PANEL DERECHO                │ │
│  │                                            │  │                                      │ │
│  │   ┌─────────┐  ┌─────────┐                │  │  ┌──────────────────────────────┐   │ │
│  │   │  ⚔️    │  │  ☠️    │                 │  │  │  EQUIPO ACTIVO: "Héroes"     │   │ │
│  │   │ MODO   │  │ MODO   │                  │  │  │  ◄ [👤][👤][👤][👤][+] ►   │   │ │
│  │   │  RPG   │  │SURVIVAL│                  │  │  │     ← scroll horizontal →    │   │ │
│  │   │        │  │        │                  │  │  └──────────────────────────────┘   │ │
│  │   │Dungeons│  │Oleadas │                  │  │                                      │ │
│  │   └────────┘  └────────┘                  │  │  ┌──────────────────────────────┐   │ │
│  │                                            │  │  │  📊 STATS                     │   │ │
│  │   ┌─────────┐  ┌─────────┐                │  │  │  Victorias: 42 | Racha: 5    │   │ │
│  │   │  🛒    │  │  💰    │                 │  │  │  Ranking: #127 | Nivel: 8    │   │ │
│  │   │TIENDA  │  │MARKET  │                  │  │  └──────────────────────────────┘   │ │
│  │   │        │  │  P2P   │                  │  │                                      │ │
│  │   │ Shop   │  │        │                  │  │  ┌──────────────────────────────┐   │ │
│  │   └────────┘  └────────┘                  │  │  │  📜 ACTIVIDAD RECIENTE       │   │ │
│  │                                            │  │  │  • Vendiste Espada +150 VAL │   │ │
│  │   ┌─────────┐                             │  │  │  • Subiste a nivel 9         │   │ │
│  │   │  👥    │                              │  │  │  • Nueva oferta disponible   │   │ │
│  │   │EQUIPOS │                              │  │  │         ↕ scroll vertical    │   │ │
│  │   │ Teams  │                              │  │  └──────────────────────────────┘   │ │
│  │   └────────┘                              │  │                                      │ │
│  └────────────────────────────────────────────┘  └──────────────────────────────────────┘ │
│                                                                                            │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ FOOTER: [🏆 Rankings]  [📦 Inventario]  [🏅 Logros]  [⚙️ Config]                          │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Distribución del espacio (1920px):**
- Panel izquierdo (acciones): **60%** (~1150px)
- Panel derecho (info): **40%** (~770px)
- Header: **60px** fijo
- Footer: **50px** fijo

---

## 🎯 Selector de Modo de Juego (Modal Horizontal)

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                    [X]     │
│                                 🎮 ELIGE TU MODO DE JUEGO                                  │
│                                                                                            │
│   ┌────────────────────────────────────────┐    ┌────────────────────────────────────────┐│
│   │                                        │    │                                        ││
│   │            🏰 MODO RPG                 │    │          ☠️ MODO SURVIVAL              ││
│   │                                        │    │                                        ││
│   │    ┌────────────────────────────┐     │    │    ┌────────────────────────────┐     ││
│   │    │                            │     │    │    │                            │     ││
│   │    │    [IMAGEN/PREVIEW RPG]    │     │    │    │  [IMAGEN/PREVIEW SURVIVAL] │     ││
│   │    │                            │     │    │    │                            │     ││
│   │    └────────────────────────────┘     │    │    └────────────────────────────┘     ││
│   │                                        │    │                                        ││
│   │    👥 USA TU EQUIPO (múltiples)       │    │    👤 1 SOLO PERSONAJE                 ││
│   │    ⚙️ Combate automático               │    │    🎮 Combate manual (tú controlas)    ││
│   │    🏆 Progresión por mazmorra          │    │    ∞ Oleadas infinitas                 ││
│   │                                        │    │                                        ││
│   │    💎 Costo: 1 Boleto                  │    │    ⚡ Costo: 5 Energía                  ││
│   │                                        │    │                                        ││
│   │         [ ⚔️ SELECCIONAR ]             │    │         [ ☠️ SELECCIONAR ]             ││
│   └────────────────────────────────────────┘    └────────────────────────────────────────┘│
│                                                                                            │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🏰 Flujo RPG (Dungeons) - Horizontal

### Paso 1: Selector de Mazmorra (Horizontal con scroll)

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ [← Volver]                          🏰 SELECCIONA MAZMORRA                                 │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                     │  │
│  │  ◄ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────┐►│  │
│  │    │  🌲          │ │  ⛏️          │ │  🏰          │ │  🌋          │ │  🔒    │ │  │
│  │    │  BOSQUE      │ │  MINAS       │ │  CASTILLO    │ │  VOLCÁN      │ │ PRÓXIMO│ │  │
│  │    │  OSCURO      │ │  PERDIDAS    │ │  MALDITO     │ │  INFERNAL    │ │        │ │  │
│  │    │              │ │              │ │              │ │              │ │        │ │  │
│  │    │  ⭐ Fácil    │ │  ⭐⭐ Media  │ │  ⭐⭐⭐ Dura │ │  ⭐⭐⭐⭐    │ │ Nv.50  │ │  │
│  │    │  Req: Nv.1   │ │  Req: Nv.10  │ │  Req: Nv.20  │ │  Req: Nv.35  │ │        │ │  │
│  │    │  Tu: Nv.5 ✅ │ │  Tu: Nv.5 ❌ │ │  Tu: Nv.5 ❌ │ │  Tu: Nv.5 ❌ │ │        │ │  │
│  │    │              │ │              │ │              │ │              │ │        │ │  │
│  │    │ [ENTRAR]     │ │ [BLOQUEADO]  │ │ [BLOQUEADO]  │ │ [BLOQUEADO]  │ │        │ │  │
│  │    └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └─────────┘ │  │
│  │                                                                                     │  │
│  │                          ← scroll horizontal para más mazmorras →                   │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                            │
│  💎 Boletos: 5          📊 Tu mejor racha: 12 victorias          🏆 Ranking: #127         │
│                                                                                            │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Paso 2: Confirmación pre-batalla (Modal Horizontal)

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                    [X]     │
│                            ⚔️ PREPARAR BATALLA - BOSQUE OSCURO                             │
│                                                                                            │
│  ┌────────────────────────────────────────┐    ┌────────────────────────────────────────┐ │
│  │                                        │    │                                        │ │
│  │   👹 ENEMIGO                           │    │   👥 TU EQUIPO: "Los Héroes"          │ │
│  │   ────────────                         │    │   ───────────────────────             │ │
│  │                                        │    │                                        │ │
│  │   [IMAGEN BOSS]                        │    │   ◄ [👤Guer] [👤Mago] [👤Arqu] ►     │ │
│  │                                        │    │       ← scroll si >3 personajes       │ │
│  │   Goblin Rey                           │    │                                        │ │
│  │   ⚔️ ATK: 150                          │    │   Stats combinadas:                   │ │
│  │   🛡️ DEF: 80                           │    │   ⚔️ ATK: 320  🛡️ DEF: 180           │ │
│  │   ❤️ HP: 500                           │    │   ❤️ HP: 650   ⚡ SPD: 95            │ │
│  │                                        │    │                                        │ │
│  │   Dificultad: ⭐                       │    │   ✅ Todos cumplen requisitos         │ │
│  │                                        │    │   ✅ Ninguno herido                   │ │
│  └────────────────────────────────────────┘    └────────────────────────────────────────┘ │
│                                                                                            │
│                     💎 Costo: 1 Boleto (tienes 5)                                         │
│                                                                                            │
│              [← Cambiar equipo]                        [⚔️ INICIAR COMBATE]               │
│                                                                                            │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Paso 3: Combate Automático (RPG)
```
POST /api/dungeons/:dungeonId/start
Body: { "team": ["charId1", "charId2", "charId3"] }
```

**Respuesta:**
```typescript
{
  resultado: 'victoria' | 'derrota',
  log: [
    "Tu equipo ataca por 45 de daño",
    "El Bosque Oscuro contraataca por 30 de daño",
    "Guerrero recibe 10 de daño",
    // ... log completo del combate
  ],
  recompensas: {
    expGanada: 150,
    valGanado: 25,
    botinObtenido: [{ itemId: "...", nombre: "Espada Rústica" }]
  },
  progresionMazmorra: {
    puntosGanados: 45,
    nivelActual: 3,
    subiDeNivel: false
  },
  estadoEquipo: [
    { personajeId: "...", saludFinal: 80, estado: 'saludable' },
    { personajeId: "...", saludFinal: 0, estado: 'herido' }  // ⚠️ No puede pelear
  ]
}
```

---

## ☠️ Flujo Survival - Horizontal (Pantalla Completa de Juego)

### Paso 1: Selector de Personaje (Horizontal)

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ [← Volver]                        ☠️ SURVIVAL - ELIGE TU HÉROE                            │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                                      │ │
│  │  ◄ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ►       │ │
│  │    │  👤     │ │  👤     │ │  👤     │ │  👤     │ │  👤     │ │  👤     │         │ │
│  │    │         │ │         │ │         │ │         │ │         │ │         │         │ │
│  │    │ Guerrero│ │  Mago   │ │ Arquero │ │ Paladín │ │ Asesino │ │  Necro  │         │ │
│  │    │  Nv.15  │ │  Nv.12  │ │  Nv.10  │ │  Nv.8   │ │  Nv.5   │ │  Nv.3   │         │ │
│  │    │ ⭐⭐⭐  │ │  ⭐⭐   │ │  ⭐⭐   │ │   ⭐    │ │   ⭐    │ │   ⭐    │         │ │
│  │    │         │ │         │ │         │ │         │ │         │ │         │         │ │
│  │    │[ELEGIR] │ │[ELEGIR] │ │[ELEGIR] │ │[ELEGIR] │ │[ELEGIR] │ │[ELEGIR] │         │ │
│  │    └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘         │ │
│  │                                                                                      │ │
│  │                      ← scroll horizontal para ver todos tus personajes →            │ │
│  └──────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                            │
│  🏆 Tu récord: Oleada 47    |    ⚡ Energía: 45/50    |    📊 Ranking: #234              │
│                                                                                            │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Paso 2: Equipar Personaje (Horizontal - Todo visible)

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ [← Volver]                     ⚔️ EQUIPA A TU HÉROE                    [☠️ INICIAR]       │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                            │
│  ┌────────────────────────┐  ┌─────────────────────────────────────────────────────────┐  │
│  │                        │  │                                                         │  │
│  │      👤 GUERRERO       │  │  EQUIPAMIENTO (4 slots):                               │  │
│  │        Nivel 15        │  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │  │
│  │                        │  │  │🎩CABEZA│ │👕CUERPO│ │🧤 MANOS│ │👢 PIES │          │  │
│  │    [PREVIEW 3D]        │  │  │Yelmo+5 │ │Arm.+10 │ │Guant+3 │ │Botas+2 │          │  │
│  │                        │  │  │[CAMBIAR│ │[CAMBIAR│ │[CAMBIAR│ │[CAMBIAR│          │  │
│  │                        │  │  └────────┘ └────────┘ └────────┘ └────────┘          │  │
│  │   ─────────────────    │  │                                                         │  │
│  │   ❤️ HP: 200           │  │  CONSUMIBLES (máx 5):                                  │  │
│  │   ⚔️ ATK: 145          │  │  ◄ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ►         │  │
│  │   🛡️ DEF: 100          │  │    │ 🧪  │ │ 🧪  │ │ 💊  │ │  +  │ │  +  │           │  │
│  │   ⚡ SPD: 85           │  │    │Poción│ │Elixir│ │Antid│ │     │ │     │           │  │
│  │                        │  │    │ x3   │ │ x1   │ │ x2  │ │     │ │     │           │  │
│  │                        │  │    └─────┘ └─────┘ └─────┘ └─────┘ └─────┘           │  │
│  │                        │  │    ← scroll horizontal inventario consumibles →        │  │
│  └────────────────────────┘  └─────────────────────────────────────────────────────────┘  │
│                                                                                            │
│                              ⚡ Costo: 5 Energía (tienes 45)                              │
│                                                                                            │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Paso 3: Pantalla de Juego Survival (Three.js - Horizontal Completo)

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│  ☠️ OLEADA: 15                                                      [⏸️ PAUSA] [🚪 SALIR] │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                            │
│ ┌──────────────────────────────────────────────────────────────────────────────────────┐  │
│ │                                                                                      │  │
│ │                                                                                      │  │
│ │                                                                                      │  │
│ │                              ÁREA DE JUEGO THREE.JS                                  │  │
│ │                                                                                      │  │
│ │                           (80% del ancho de pantalla)                                │  │
│ │                                                                                      │  │
│ │                                                                                      │  │
│ │                                                                                      │  │
│ │                                                                                      │  │
│ └──────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                            │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│  👤 ❤️ ████████████░░░░ 145/200   │  🏆 PUNTOS: 2,450  │  💀 Enemigos: 3  │  ⏱️ 04:32   │
│                                    │  x1.8 multiplicador │                   │             │
│  ITEMS: [🧪 2/3] [🧪 1/1] [💊 2/2] │                     │  Goblin x2        │             │
│          [1]     [2]     [3]       │                     │  Orco x1          │             │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Controles en pantalla (optimizado horizontal):**
- HUD inferior: 100px de alto
- Área de juego: resto del espacio
- Items accesibles con teclas 1-5 o tap

**Endpoints durante la sesión:**
```
POST /api/survival/:sessionId/complete-wave    → Completar oleada
POST /api/survival/:sessionId/use-consumable   → Usar poción
POST /api/survival/:sessionId/pickup-drop      → Recoger item
POST /api/survival/:sessionId/end              → Terminar (victoria)
POST /api/survival/:sessionId/death            → Game over
POST /api/survival/:sessionId/abandon          → Abandonar
```

---

## 🎯 Módulos del Dashboard

### 1. HEADER (Siempre visible)

**Datos a mostrar:**
```typescript
// GET /api/users/me
{
  username: string,
  valBalance: number,      // Moneda principal
  evoTokens: number,       // Tokens de evolución
  energia: number,         // Energía actual
  energiaMaxima: number,   // Energía máxima
  tiempoRegeneracion: Date // Para countdown
}

// GET /api/notifications (badge con count)
{ unreadCount: number }
```

**Componente sugerido (React):**
```tsx
function HeaderBar({ val, evo, energy, maxEnergy, avatar, unread }: HeaderProps) {
  return (
    <nav className="header-bar">
      <Link to="/dashboard"><img src="logo.svg" className="logo" /></Link>
      
      <div className="resources">
        <span className="val">💰 {val.toLocaleString()}</span>
        <span className="evo">⚡ {evo.toLocaleString()}</span>
        <span className="energy">🔋 {energy}/{maxEnergy}</span>
      </div>
      
      <div className="user-area">
        <button className="notifications" onClick={openNotifications}>
          🔔 {unread > 0 && <span className="badge">{unread}</span>}
        </button>
        <img src={avatar} className="avatar" />
      </div>
    </nav>
  );
}
```

---

### 2. ACCIONES PRINCIPALES (Cards grandes)

| Card | Acción | Endpoint inicial | Destino |
|------|--------|------------------|---------|
| **JUGAR** | Iniciar partida rápida | `GET /api/teams` (equipo activo) | Selector de modo |
| **TIENDA** | Comprar paquetes | `GET /api/shop/packages` | Shop view |
| **MARKETPLACE** | Comprar/Vender P2P | `GET /api/marketplace/listings` | Marketplace view |
| **EQUIPOS** | Gestionar teams | `GET /api/teams` | Team builder |

**Diseño de Card:**
```scss
.action-card {
  width: 200px;
  height: 120px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  border: 2px solid rgba(255,255,255,0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    border-color: #ffd700;
    box-shadow: 0 8px 32px rgba(255, 215, 0, 0.3);
  }
  
  .icon {
    font-size: 48px;
    margin-bottom: 8px;
  }
  
  .label {
    font-size: 18px;
    font-weight: 600;
    color: #fff;
  }
}
```

---

### 3. EQUIPO ACTIVO (Quick View)

Muestra el equipo seleccionado con acceso rápido a gestión.

**Endpoint:** `GET /api/teams` → filtrar `isActive: true`

```typescript
interface ActiveTeamView {
  teamId: string;
  name: string;
  characters: {
    _id: string;
    nombre: string;
    rango: string;
    nivel: number;
    avatar: string; // URL o base del asset
  }[];
}
```

**Interacciones:**
- Tap en personaje → Modal de stats rápidos
- Tap en [+] → Ir a Team Builder
- Tap en "Gestionar" → Ir a Team Builder

---

### 4. STATS RÁPIDOS

**Endpoints:**
```
GET /api/rankings/me        → posición personal
GET /api/player-stats/usuario/:userId → stats detalladas
```

**Datos a mostrar:**
- Victorias totales
- Racha actual
- Posición en ranking
- Nivel más alto alcanzado

---

### 5. ACTIVIDAD RECIENTE

**Fuentes de datos:**
- `GET /api/notifications` → últimas notificaciones
- WebSocket events → real-time updates

**Eventos a mostrar:**
- Ventas/Compras marketplace
- Level ups
- Logros desbloqueados
- Paquetes por abrir

---

## 👥 Sistema de Equipos (Teams) - Documentación Completa

### Endpoints

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/teams` | Listar mis equipos | ✅ |
| GET | `/api/teams/:id` | Detalle de un equipo | ✅ |
| POST | `/api/teams` | Crear equipo | ✅ |
| PUT | `/api/teams/:id` | Actualizar equipo | ✅ |
| DELETE | `/api/teams/:id` | Eliminar equipo | ✅ |
| PUT | `/api/teams/:id/activate` | Activar equipo | ✅ |

### Modelo de Datos

```typescript
interface Team {
  _id: string;
  userId: string;
  name: string;              // Max 50 caracteres
  characters: string[];      // Array de IDs (max 9)
  isActive: boolean;         // Solo 1 activo a la vez
  createdAt: Date;
  updatedAt: Date;
}

// Poblado con personajes
interface TeamPopulated {
  _id: string;
  name: string;
  isActive: boolean;
  characters: {
    _id: string;
    personajeId: string;
    nombre: string;
    rango: string;           // "Bronce", "Plata", "Oro", etc.
    nivel: number;
    etapa: number;
    stats?: CharacterStats;
  }[];
}
```

### Reglas de Negocio

| Regla | Valor | Error si se viola |
|-------|-------|-------------------|
| Max equipos por usuario | 5 | "Has alcanzado el límite máximo de 5 equipos" |
| Max personajes por equipo | 9 | "Un equipo no puede tener más de 9 personajes" |
| Equipos activos simultáneos | 1 | Auto-desactiva el anterior |
| Personajes deben ser del usuario | ✅ | "Algunos personajes no pertenecen al usuario" |

### Payloads

**Crear equipo:**
```json
POST /api/teams
{
  "name": "Mi Equipo Principal",
  "characters": [
    "65a1b2c3d4e5f6g7h8i9j0k1",
    "65a1b2c3d4e5f6g7h8i9j0k2",
    "65a1b2c3d4e5f6g7h8i9j0k3"
  ]
}

// Respuesta 201
{
  "success": true,
  "message": "Equipo creado exitosamente",
  "team": {
    "_id": "team123",
    "name": "Mi Equipo Principal",
    "characters": [...populated...],
    "isActive": true // Si es el primer equipo
  }
}
```

**Actualizar equipo:**
```json
PUT /api/teams/:id
{
  "name": "Equipo Renombrado",      // Opcional
  "characters": ["id1", "id2", ...]  // Opcional
}

// Respuesta 200
{
  "success": true,
  "message": "Equipo actualizado",
  "team": {...}
}
```

**Activar equipo:**
```json
PUT /api/teams/:id/activate

// Respuesta 200
{
  "success": true,
  "message": "Equipo activado",
  "team": { "isActive": true, ... }
}
```

### Hook React useTeams

```tsx
// hooks/useTeams.ts
import { useState, useCallback } from 'react';
import { useApi } from './useApi';

interface Team {
  _id: string;
  name: string;
  characters: Character[];
  isActive: boolean;
}

interface CreateTeamDto {
  name: string;
  characters: string[]; // IDs de personajes
}

export function useTeams() {
  const { get, post, put, del, loading, error } = useApi();
  const [teams, setTeams] = useState<Team[]>([]);

  // Obtener todos mis equipos
  const getMyTeams = useCallback(async () => {
    const data = await get<{ teams: Team[] }>('/api/teams');
    setTeams(data.teams);
    return data;
  }, [get]);

  // Obtener equipo por ID
  const getTeam = useCallback((id: string) => 
    get<{ team: Team }>(`/api/teams/${id}`), [get]);

  // Crear nuevo equipo
  const createTeam = useCallback((data: CreateTeamDto) =>
    post<{ team: Team }>('/api/teams', data), [post]);

  // Actualizar equipo
  const updateTeam = useCallback((id: string, data: Partial<CreateTeamDto>) =>
    put<{ team: Team }>(`/api/teams/${id}`, data), [put]);

  // Eliminar equipo
  const deleteTeam = useCallback((id: string) =>
    del(`/api/teams/${id}`), [del]);

  // Activar equipo (para jugar)
  const activateTeam = useCallback((id: string) =>
    put<{ team: Team }>(`/api/teams/${id}/activate`, {}), [put]);

  // Helper: obtener equipo activo
  const getActiveTeam = useCallback(() => 
    teams.find(t => t.isActive) || null, [teams]);

  return {
    teams,
    getMyTeams,
    getTeam,
    createTeam,
    updateTeam,
    deleteTeam,
    activateTeam,
    getActiveTeam,
    loading,
    error,
  };
}
```

---

## 🛠️ Team Builder (Horizontal con Scroll)

### Layout del Team Builder (Pantalla Completa Horizontal)

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ [← Volver]                         ⚔️ ARMADO DE EQUIPO                           [💾 Guardar]│
├────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  MIS EQUIPOS:  ◄ [Equipo Alpha ✓] [Equipo Beta] [Equipo Gamma] [+ Nuevo] ►         │  │
│  │                              ← scroll horizontal si hay muchos equipos →            │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                            │
│  ┌────────────────────────────────────────────────┐ ┌────────────────────────────────────┐│
│  │                                                │ │                                    ││
│  │   📦 MIS PERSONAJES (Roster)                  │ │   🎯 EQUIPO ACTUAL                 ││
│  │   ─────────────────────────                   │ │   ────────────────                 ││
│  │                                                │ │                                    ││
│  │   ◄ ┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐ ►    │ │   Nombre: [Equipo Alpha______]    ││
│  │     │ 🧙 ││ ⚔️ ││ 🏹 ││ 🛡️ ││ 🗡️ │       │ │                                    ││
│  │     │Mago ││Guer ││Arqu ││Tank ││Asas │       │ │   ┌───┐┌───┐┌───┐┌───┐┌───┐      ││
│  │     │Nv15 ││Nv12 ││Nv10 ││Nv 8 ││Nv 5 │       │ │   │ 1 ││ 2 ││ 3 ││ 4 ││ 5 │      ││
│  │     │ ⭐⭐ ││ ⭐⭐ ││ ⭐  ││ ⭐  ││ ⭐  │       │ │   │🧙 ││⚔️ ││🏹 ││   ││   │      ││
│  │     └─────┘└─────┘└─────┘└─────┘└─────┘       │ │   └───┘└───┘└───┘└───┘└───┘      ││
│  │     ┌─────┐┌─────┐┌─────┐┌─────┐              │ │   ┌───┐┌───┐┌───┐┌───┐           ││
│  │     │ 💀 ││ 🔮 ││ 🏃 ││ 🎭 │              │ │   │ 6 ││ 7 ││ 8 ││ 9 │           ││
│  │     │Necr ││Hech ││Ladr ││Bard │              │ │   │   ││   ││   ││   │           ││
│  │     │Nv 3 ││Nv 2 ││Nv 1 ││Nv 1 │              │ │   └───┘└───┘└───┘└───┘           ││
│  │     └─────┘└─────┘└─────┘└─────┘              │ │                                    ││
│  │                                                │ │   ──────────────────────────────  ││
│  │   ← scroll horizontal para más personajes →   │ │   📊 STATS TOTALES DEL EQUIPO    ││
│  │                                                │ │   ❤️ HP: 450   ⚔️ ATK: 185       ││
│  │   Filtrar: [Todos ▼] [Por rango ▼] [Buscar..] │ │   🛡️ DEF: 120  ⚡ SPD: 95        ││
│  │                                                │ │                                    ││
│  └────────────────────────────────────────────────┘ │   [⚡ ACTIVAR EQUIPO]             ││
│                                                      └────────────────────────────────────┘│
│                                                                                            │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Distribución (1920px):**
- Panel izquierdo (roster): **55%** (~1050px) - scroll horizontal
- Panel derecho (equipo): **45%** (~870px) - sin scroll
- Barra de equipos: 100% ancho, scroll horizontal si >5 equipos

### Flujo de Interacción

```
1. CARGAR DATOS
   ├── GET /api/user-characters → Roster (todos mis personajes)
   └── GET /api/teams → Mis equipos guardados

2. SELECCIONAR PERSONAJE (del roster)
   ├── Click en personaje → Agregar al array local `selectedCharacters`
   ├── Validar: máximo 9 personajes
   ├── Actualizar stats totales (suma en vivo)
   └── Visual: marcar como "seleccionado" en roster

3. QUITAR PERSONAJE (del equipo)
   ├── Click en slot ocupado → Quitar del array `selectedCharacters`
   └── Visual: volver a disponible en roster

4. GUARDAR EQUIPO
   ├── Si es nuevo: POST /api/teams
   ├── Si existe: PUT /api/teams/:id
   └── Feedback: Toast "Equipo guardado"

5. ACTIVAR EQUIPO
   ├── PUT /api/teams/:id/activate
   └── Feedback: Toast "Equipo activado - ¡Listo para jugar!"
```

### Componente React TeamBuilder (Esqueleto)

```tsx
// components/TeamBuilder.tsx
import { useState, useEffect, useMemo } from 'react';
import { useTeams } from '../hooks/useTeams';
import { useCharacters } from '../hooks/useCharacters';

interface Character {
  _id: string;
  nombre: string;
  nivel: number;
  rango: string;
  stats: { salud: number; ataque: number; defensa: number };
}

function TeamBuilder() {
  const { teams, getMyTeams, createTeam, activateTeam } = useTeams();
  const { characters, getMyCharacters } = useCharacters();
  
  const [selectedCharacters, setSelectedCharacters] = useState<Character[]>([]);
  const [teamName, setTeamName] = useState('');
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  
  const MAX_SLOTS = 9;

  useEffect(() => {
    getMyCharacters();
    getMyTeams();
  }, []);

  // Stats totales del equipo
  const totalStats = useMemo(() => ({
    hp: selectedCharacters.reduce((sum, c) => sum + (c.stats?.salud || 0), 0),
    atk: selectedCharacters.reduce((sum, c) => sum + (c.stats?.ataque || 0), 0),
    def: selectedCharacters.reduce((sum, c) => sum + (c.stats?.defensa || 0), 0),
  }), [selectedCharacters]);

  const isSelected = (charId: string) => 
    selectedCharacters.some(c => c._id === charId);

  const toggleCharacter = (char: Character) => {
    if (isSelected(char._id)) {
      setSelectedCharacters(prev => prev.filter(c => c._id !== char._id));
    } else if (selectedCharacters.length < MAX_SLOTS) {
      setSelectedCharacters(prev => [...prev, char]);
    }
  };

  const handleSave = async () => {
    if (teamName && selectedCharacters.length > 0) {
      await createTeam({
        name: teamName,
        characters: selectedCharacters.map(c => c._id),
      });
      getMyTeams();
    }
  };

  return (
    <div className="team-builder">
      {/* Roster de personajes */}
      <section className="roster">
        <h3>Mis Personajes</h3>
        <div className="character-grid">
          {characters.map(char => (
            <div 
              key={char._id}
              className={`character-card ${isSelected(char._id) ? 'selected' : ''}`}
              onClick={() => toggleCharacter(char)}
            >
              <img src={`/avatars/${char._id}.png`} alt={char.nombre} />
              <span className="name">{char.nombre}</span>
              <span className="level">Nv. {char.nivel}</span>
              <span className="rank">{char.rango}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Equipo actual */}
      <section className="current-team">
        <input 
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Nombre del equipo"
          maxLength={50}
        />
        
        <div className="team-slots">
          {Array(MAX_SLOTS).fill(null).map((_, index) => (
            <div key={index} className="slot">
              {selectedCharacters[index] ? (
                <>
                  <img src={`/avatars/${selectedCharacters[index]._id}.png`} />
                  <span>{selectedCharacters[index].nombre}</span>
                </>
              ) : (
                <span className="empty">+</span>
              )}
            </div>
          ))}
        </div>

        {/* Stats totales */}
        <div className="team-stats">
          <span>❤️ HP: {totalStats.hp}</span>
          <span>⚔️ ATK: {totalStats.atk}</span>
          <span>🛡️ DEF: {totalStats.def}</span>
        </div>

        <div className="actions">
          <button onClick={handleSave} disabled={!teamName || selectedCharacters.length === 0}>
            💾 Guardar
          </button>
          <button onClick={() => currentTeamId && activateTeam(currentTeamId)} disabled={!currentTeamId}>
            ⚡ Activar
          </button>
        </div>
      </section>

      {/* Lista de equipos guardados */}
      <section className="saved-teams">
        {teams.map(team => (
          <button 
            key={team._id}
            className={team.isActive ? 'active' : ''}
            onClick={() => {
              setCurrentTeamId(team._id);
              setTeamName(team.name);
              setSelectedCharacters(team.characters);
            }}
          >
            {team.name} {team.isActive && '✓'}
          </button>
        ))}
        <button onClick={() => { setTeamName(''); setSelectedCharacters([]); setCurrentTeamId(null); }}>
          + Nuevo
        </button>
      </section>
    </div>
  );
}
```

  removeFromSlot(index: number) {
    const current = this.selectedCharacters();
    if (current[index]) {
      this.selectedCharacters.set(current.filter((_, i) => i !== index));
    }
  }

  loadTeam(team: Team) {
    this.currentTeamId.set(team._id);
    this.teamName = team.name;
    this.selectedCharacters.set(team.characters);
  }

  newTeam() {
    this.currentTeamId.set(null);
    this.teamName = '';
    this.selectedCharacters.set([]);
  }

  async saveTeam() {
    const data = {
      name: this.teamName,
      characters: this.selectedCharacters().map(c => c._id)
    };

    if (this.currentTeamId()) {
      // Actualizar
      await firstValueFrom(
        this.teamsService.updateTeam(this.currentTeamId()!, data)
      );
    } else {
      // Crear
      const res = await firstValueFrom(this.teamsService.createTeam(data));
      this.currentTeamId.set(res.team._id);
    }

    // Refrescar lista
    const teamsRes = await firstValueFrom(this.teamsService.getMyTeams());
    this.myTeams.set(teamsRes.teams);
  }

  async activateTeam() {
    if (!this.currentTeamId()) return;
    
    await firstValueFrom(
      this.teamsService.activateTeam(this.currentTeamId()!)
    );
    
    // Refrescar
    const teamsRes = await firstValueFrom(this.teamsService.getMyTeams());
    this.myTeams.set(teamsRes.teams);
  }

  getAvatar(char: Character): string {
    return `/assets/characters/${char.personajeId}.png`;
  }
}
```

---

## 🎮 Flujo Completo: Dashboard → Jugar

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLUJO DE JUGABILIDAD                        │
└─────────────────────────────────────────────────────────────────┘

[Dashboard] 
    │
    ├──→ [JUGAR] ─────────────────────────────────────────────────┐
    │         │                                                    │
    │         ▼                                                    │
    │    ¿Tiene equipo activo?                                     │
    │         │                                                    │
    │    Sí ──┼──→ Selector de Modo ────┬─→ RPG Dungeons          │
    │         │                         ├─→ Survival              │
    │    No ──┼──→ [Team Builder] ──────┘   (próximamente)        │
    │         │    "Crea tu primer equipo"                        │
    │                                                              │
    ├──→ [TIENDA] ────────────────────────────────────────────────┤
    │         │                                                    │
    │         ▼                                                    │
    │    GET /api/shop/packages                                    │
    │         │                                                    │
    │         ▼                                                    │
    │    [Listado de Paquetes] → [Comprar] → [Abrir] → Dashboard  │
    │                                                              │
    ├──→ [MARKETPLACE] ───────────────────────────────────────────┤
    │         │                                                    │
    │         ▼                                                    │
    │    GET /api/marketplace/listings                             │
    │         │                                                    │
    │    ┌────┴────┐                                               │
    │    ▼         ▼                                               │
    │  [COMPRAR] [VENDER]                                          │
    │    │         │                                               │
    │    ▼         ▼                                               │
    │  POST buy  POST list                                         │
    │    │         │                                               │
    │    └────┬────┘                                               │
    │         ▼                                                    │
    │    [Inventario actualizado] → Dashboard                      │
    │                                                              │
    └──→ [EQUIPOS] → [Team Builder] → Dashboard                   │
```

---

## 📱 Resumen de Pantallas Necesarias

| Pantalla | Ruta sugerida | Endpoints principales |
|----------|---------------|----------------------|
| Dashboard | `/dashboard` | `/users/me`, `/teams`, `/notifications` |
| Team Builder | `/teams` o `/teams/:id` | `/teams`, `/user-characters` |
| Tienda | `/shop` | `/shop/packages`, `/shop/purchase` |
| Marketplace | `/marketplace` | `/marketplace/listings`, `/marketplace/*` |
| Inventario | `/inventory` | `/inventory`, `/inventory/equipment` |
| Selector de Modo | `/play` | `/teams` (verificar activo) |
| RPG Dungeon | `/dungeon/:id` | `/dungeons/:id/start`, `/combat/*` |
| Survival | `/survival` | `/survival/start`, `/survival/*` |
| Rankings | `/rankings` | `/rankings/*` |
| Perfil | `/profile` | `/users/me`, `/player-stats/*` |

---

## ⚡ Tips para UX Rápida

### 1. Caché de datos frecuentes
```typescript
// Guardar en localStorage/sessionStorage
- Equipo activo
- Recursos del usuario (con TTL de 30s)
- Lista de personajes (con TTL de 5min)
```

### 2. Optimistic UI
```typescript
// Al seleccionar personaje para equipo
// 1. Actualizar UI inmediatamente
// 2. Enviar request en background
// 3. Si falla, revertir UI + mostrar error
```

### 3. Precarga de datos
```typescript
// En dashboard, precargar:
- GET /api/teams
- GET /api/user-characters
- GET /api/shop/packages (si va a tienda seguido)
```

### 4. Skeleton loaders
```html
<!-- Mientras carga -->
<div class="skeleton-card"></div>

<!-- Cuando llega -->
<div class="real-card">{{ data }}</div>
```

### 5. Acciones rápidas
```typescript
// Atajos de teclado
- 'J' → Jugar (si tiene equipo)
- 'T' → Ir a Teams
- 'M' → Ir a Marketplace
- 'I' → Abrir inventario
```

---

## 🔌 WebSocket Events para Real-time

| Evento | Cuándo | Acción en UI |
|--------|--------|--------------|
| `notification:new` | Cualquier notificación | Badge +1, toast opcional |
| `marketplace:sold` | Tu ítem se vendió | Toast + actualizar VAL |
| `character:level-up` | Sube de nivel | Toast + actualizar stats |
| `rankings:update` | Cambio en ranking | Actualizar posición |
| `payments:status` | Compra procesada | Actualizar paquetes |

---

## ✅ Checklist de Implementación

### Fase 1: Dashboard Básico (1 día)
- [ ] Header con recursos
- [ ] Cards de acción principales
- [ ] Vista de equipo activo (solo lectura)

### Fase 2: Team Builder (2 días)
- [ ] Listar personajes del usuario
- [ ] Seleccionar/deseleccionar para equipo
- [ ] Guardar equipo (crear/actualizar)
- [ ] Activar equipo
- [ ] Validaciones (máx 9, máx 5 equipos)

### Fase 3: Integración Completa (1 día)
- [ ] Conectar "Jugar" con equipo activo
- [ ] Stats totales en team builder
- [ ] Feedback visual (toasts, animaciones)
- [ ] Precarga y optimistic UI

---

**¿Dudas?** Revisa `ENDPOINTS_CATALOG.md` para la lista completa de endpoints.
