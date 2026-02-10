# Dashboard Principal y Modos de Juego (React)

**Guía UI/UX para desarrolladores frontend**  
**Fecha**: Febrero 2026  
**Framework**: React + TypeScript + Vite + Three.js  
**Última actualización**: 7 de Febrero 2026

---

## Diferencias entre Modos de Juego

| Característica | RPG (Dungeons) | Survival |
|----------------|----------------|----------|
| **Personajes** | **EQUIPO** (múltiples) | **1 SOLO** personaje |
| **Combate** | Automático (simulado en servidor) | Oleadas con acciones del jugador |
| **Sesión** | Una batalla por request | Sesión persistente multi-oleada |
| **Progresión** | Niveles de mazmorra | Oleadas infinitas + score |
| **Equipamiento** | Stats sumadas del equipo | 4 items exactos requeridos |
| **Costo** | 1 boleto por intento | Energía |

---

## Visión General del Dashboard

El dashboard es el **hub central** del jugador. Acceso rápido a todas las acciones principales en **3 clics o menos**.

### Filosofía de Diseño
- **Rápido**: Iniciar partida en < 10 segundos
- **Claro**: Información crítica visible sin scroll
- **Fluido**: Transiciones suaves entre módulos
- **Horizontal**: SOLO modo landscape

---

## DISEÑO: SOLO MODO HORIZONTAL (Landscape)

> Resolución objetivo: **1920x1080** (desktop) / **1280x720** (tablet landscape)  
> Usar **scroll horizontal** en listas de personajes/items  
> **NO scroll vertical** en pantalla principal

### CSS Base (Tailwind + CSS custom)

```css
/* src/index.css o componente Dashboard */

/* Forzar landscape */
@media (orientation: portrait) {
  .app-container {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
  }
  .app-container::after {
    content: "Gira tu dispositivo";
    font-size: 24px;
    text-align: center;
  }
}

/* Dashboard sin scroll vertical */
.dashboard {
  height: 100vh;
  overflow: hidden;
  display: grid;
  grid-template-rows: 60px 1fr 50px;
}

/* Scroll horizontal para listas */
.horizontal-scroll {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.horizontal-scroll::-webkit-scrollbar { display: none; }
.horizontal-scroll > * {
  flex-shrink: 0;
  scroll-snap-align: start;
}
```

### Dónde usar Scroll Horizontal

| Componente | Scroll | Dirección |
|-----------|--------|-----------|
| Dashboard principal | NO | - |
| Lista de personajes (roster) | SÍ | Horizontal |
| Lista de equipos guardados | SÍ | Horizontal |
| Selector de mazmorras | SÍ | Horizontal |
| Selector de consumibles | SÍ | Horizontal |
| Actividad reciente | SÍ | Vertical (único) |
| Modal de selección de item | SÍ | Horizontal |

---

## Layout del Dashboard Principal (Horizontal)

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER: [Logo]          💰 1,500 VAL    ⚡ 3 EVO    🔋 45/50 Energía     🔔(3)    👤 User │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                            │
│  ┌─────────────────────────────────────────────┐  ┌─────────────────────────────────────┐ │
│  │              ÁREA DE JUEGO                  │  │         PANEL DERECHO               │ │
│  │                                             │  │                                     │ │
│  │   ┌─────────┐  ┌─────────┐                 │  │  ┌─────────────────────────────┐    │ │
│  │   │  ⚔️    │  │  ☠️    │                  │  │  │  EQUIPO ACTIVO: "Héroes"    │    │ │
│  │   │ MODO   │  │ MODO   │                   │  │  │  ◄ [👤][👤][👤][👤][+] ►  │    │ │
│  │   │  RPG   │  │SURVIVAL│                   │  │  │     ← scroll horizontal →   │    │ │
│  │   │Dungeons│  │Oleadas │                   │  │  └─────────────────────────────┘    │ │
│  │   └────────┘  └────────┘                   │  │                                     │ │
│  │                                             │  │  ┌─────────────────────────────┐    │ │
│  │   ┌─────────┐  ┌─────────┐                 │  │  │  📊 STATS                    │    │ │
│  │   │  🛒    │  │  💰    │                  │  │  │  Victorias: 42 | Racha: 5   │    │ │
│  │   │TIENDA  │  │MARKET  │                   │  │  │  Ranking: #127 | Nivel: 8   │    │ │
│  │   │ Shop   │  │  P2P   │                   │  │  └─────────────────────────────┘    │ │
│  │   └────────┘  └────────┘                   │  │                                     │ │
│  │                                             │  │  ┌─────────────────────────────┐    │ │
│  │   ┌─────────┐                               │  │  │  📜 ACTIVIDAD RECIENTE      │    │ │
│  │   │  👥    │                                │  │  │  • Vendiste Espada +150 VAL│    │ │
│  │   │EQUIPOS │                                │  │  │  • Subiste a nivel 9        │    │ │
│  │   │ Teams  │                                │  │  │         ↕ scroll vertical   │    │ │
│  │   └────────┘                                │  │  └─────────────────────────────┘    │ │
│  └─────────────────────────────────────────────┘  └─────────────────────────────────────┘ │
│                                                                                            │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ FOOTER: [🏆 Rankings]  [📦 Inventario]  [🏅 Logros]  [⚙️ Config]                          │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Distribución (1920px):**
- Panel izquierdo (acciones): **60%** (~1150px)
- Panel derecho (info): **40%** (~770px)
- Header: **60px** fijo
- Footer: **50px** fijo

---

## Módulos del Dashboard

### 1. HEADER (Siempre visible)

**Datos necesarios:**
```tsx
// src/pages/Dashboard/Dashboard.tsx
import { userService } from '../../services';
import { useNotifications } from '../../hooks/useNotifications';

// GET /api/users/me
const user = await userService.getMe();
// user = { username, valBalance, evoTokens, energia, energiaMaxima, tiempoRegeneracion }

// GET /api/notifications/unread/count
const { unreadCount } = useNotifications();
```

**Componente React:**
```tsx
// src/components/ui/HeaderBar.tsx
const HeaderBar: React.FC = () => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <nav className="header-bar h-[60px] flex items-center justify-between px-4">
      <Link to="/dashboard">
        <img src="/assets/icons/logo.svg" className="logo h-10" alt="Valnor" />
      </Link>

      <div className="resources flex gap-4">
        <span className="val">💰 {user?.valBalance?.toLocaleString()}</span>
        <span className="evo">⚡ {user?.evoTokens}</span>
        <span className="energy">🔋 {user?.energia}/{user?.energiaMaxima}</span>
      </div>

      <div className="user-area flex items-center gap-3">
        <button onClick={() => navigate('/notifications')} className="relative">
          🔔
          {unreadCount > 0 && (
            <span className="badge absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-5 h-5">
              {unreadCount}
            </span>
          )}
        </button>
        <img src={user?.avatar} className="avatar w-8 h-8 rounded-full" alt={user?.username} />
      </div>
    </nav>
  );
};
```

---

### 2. ACCIONES PRINCIPALES (Cards grandes)

| Card | Acción | Endpoint inicial | Ruta React |
|------|--------|------------------|------------|
| **JUGAR** | Iniciar partida | `GET /api/teams` (equipo activo) | `/dungeon` o `/survival` |
| **TIENDA** | Comprar paquetes | `GET /api/shop/packages` | `/shop` |
| **MARKETPLACE** | Comprar/Vender P2P | `GET /api/marketplace/history` | `/marketplace` |
| **EQUIPOS** | Gestionar teams | `GET /api/teams` | Team builder modal |

> **⚠️ NOTA:** NO existe `GET /api/marketplace/listings`. Usar `GET /api/marketplace/history`.

---

### 3. EQUIPO ACTIVO (Quick View)

**Endpoint:** `GET /api/teams` → filtrar `isActive: true`

```tsx
// En Dashboard.tsx
import { teamService } from '../../services';

const [activeTeam, setActiveTeam] = useState<Team | null>(null);

useEffect(() => {
  const loadTeam = async () => {
    const teams = await teamService.getMyTeams();
    const active = teams.find((t: any) => t.isActive);
    setActiveTeam(active || null);
  };
  loadTeam();
}, []);
```

---

### 4. STATS RÁPIDOS

```tsx
// Endpoints
const ranking = await rankingService.getMyRanking();       // GET /api/rankings/me
const stats = await rankingService.getPlayerStats(userId);  // GET /api/player-stats/usuario/:userId
```

---

### 5. ACTIVIDAD RECIENTE

**Fuentes:**
- `GET /api/notifications` → últimas notificaciones
- WebSocket `notification:new` → real-time updates

---

## RPG Dungeons - Flujo

### Paso 1: Selector de Mazmorra

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [← Volver]                  🏰 SELECCIONA MAZMORRA                     │
│                                                                          │
│  ◄ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ►       │
│    │ 🌲 BOSQUE  │ │ ⛏️ MINAS  │ │ 🏰 CASTILL│ │ 🌋 VOLCÁN │         │
│    │ ⭐ Fácil   │ │ ⭐⭐ Media │ │ ⭐⭐⭐ Dura│ │ ⭐⭐⭐⭐  │         │
│    │ Req: Nv.1  │ │ Req: Nv.10 │ │ Req: Nv.20 │ │ Req: Nv.35 │         │
│    │ [ENTRAR]   │ │ [BLOQUEADO]│ │ [BLOQUEADO]│ │ [BLOQUEADO]│         │
│    └────────────┘ └────────────┘ └────────────┘ └────────────┘         │
│                    ← scroll horizontal para más mazmorras →             │
│                                                                          │
│  💎 Boletos: 5     📊 Mejor racha: 12     🏆 Ranking: #127             │
└──────────────────────────────────────────────────────────────────────────┘
```

```tsx
// src/pages/Dungeon/Dungeon.tsx
import { dungeonService } from '../../services';

const [dungeons, setDungeons] = useState([]);

useEffect(() => {
  dungeonService.getDungeons().then(setDungeons); // GET /api/dungeons
}, []);
```

### Paso 2: Iniciar combate RPG
```tsx
// POST /api/dungeons/:dungeonId/start
// Body: { team: ["charId1", "charId2", "charId3"] }
const result = await dungeonService.startDungeon(dungeonId, { team: characterIds });
```

**Respuesta:**
```typescript
{
  resultado: 'victoria' | 'derrota',
  log: [
    "Tu equipo ataca por 45 de daño",
    "El Bosque Oscuro contraataca por 30...",
  ],
  recompensas: {
    expGanada: 150,
    valGanado: 25,
    botinObtenido: [{ itemId: "...", nombre: "Espada Rústica" }]
  },
  estadoEquipo: [
    { personajeId: "...", saludFinal: 80, estado: 'saludable' },
    { personajeId: "...", saludFinal: 0, estado: 'herido' }
  ]
}
```

---

## Survival - Flujo

### Paso 1: Selector de Personaje

```tsx
// src/pages/Survival/Survival.tsx
import { characterService } from '../../services';

const [characters, setCharacters] = useState([]);

useEffect(() => {
  characterService.getUserCharacters().then(setCharacters); // GET /api/user-characters
}, []);
```

### Paso 2: Iniciar sesión Survival

```tsx
// POST /api/survival/start
// Body: { characterId, equippedItems: [...] }
const session = await survivalService.startSession({ characterId, equippedItems });
// session = { sessionId, currentWave, character, ... }
```

### Paso 3: Pantalla de Juego (Three.js)

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│  ☠️ OLEADA: 15                                                      [⏸️ PAUSA] [🚪 SALIR] │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                            │
│ ┌──────────────────────────────────────────────────────────────────────────────────────┐  │
│ │                                                                                      │  │
│ │                              ÁREA DE JUEGO THREE.JS                                  │  │
│ │                           (Canvas 3D renderizado por el engine)                      │  │
│ │                                                                                      │  │
│ └──────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                            │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│  👤 ❤️ ████████████░░░░ 145/200   │  🏆 PUNTOS: 2,450  │  💀 Enemigos: 3  │  ⏱️ 04:32   │
│  ITEMS: [🧪 2/3] [🧪 1/1] [💊 2/2] │  x1.8 multiplicador │  Goblin x2, Orco │             │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Endpoints durante la sesión:**
```
POST /api/survival/:sessionId/complete-wave    → Completar oleada
POST /api/survival/:sessionId/use-consumable   → Usar poción
POST /api/survival/:sessionId/pickup-drop      → Recoger item
POST /api/survival/:sessionId/end              → Terminar (victoria)
POST /api/survival/:sessionId/death            → Game over
POST /api/survival/:sessionId/abandon          → Abandonar
```

### Intercambio de puntos (post-sesión)
```
POST /api/survival/exchange-points/exp             → Puntos → EXP
POST /api/survival/exchange-points/val             → Puntos → VAL
POST /api/survival/exchange-points/guaranteed-item → Puntos → Item
```

---

## Sistema de Equipos (Teams)

### Endpoints

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/teams` | Listar mis equipos | auth |
| GET | `/api/teams/:id` | Detalle de un equipo | auth |
| POST | `/api/teams` | Crear equipo | auth |
| PUT | `/api/teams/:id` | Actualizar equipo | auth |
| DELETE | `/api/teams/:id` | Eliminar equipo | auth |
| PUT | `/api/teams/:id/activate` | Activar equipo | auth |

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

| Regla | Valor | Error |
|-------|-------|-------|
| Max equipos por usuario | 5 | "Has alcanzado el límite de 5 equipos" |
| Max personajes por equipo | 9 | "No puede tener más de 9 personajes" |
| Equipos activos simultáneos | 1 | Auto-desactiva el anterior |
| Personajes deben ser del usuario | Sí | "Personajes no pertenecen al usuario" |

### Payloads

**Crear equipo:**
```json
// POST /api/teams
{
  "name": "Mi Equipo Principal",
  "characters": ["charId1", "charId2", "charId3"]
}
// Respuesta 201: { success: true, team: {...populated} }
```

**Actualizar equipo:**
```json
// PUT /api/teams/:id
{
  "name": "Equipo Renombrado",
  "characters": ["id1", "id2"]
}
// Respuesta 200: { success: true, team: {...} }
```

**Activar equipo:**
```json
// PUT /api/teams/:id/activate
// Body: vacío
// Respuesta 200: { success: true, team: { isActive: true, ... } }
```

### Servicio React

```tsx
// src/services/team.service.ts
import { apiService } from './api.service';

const basePath = '/api/teams';

export const teamService = {
  getMyTeams: () => apiService.get(basePath),
  getTeam: (id: string) => apiService.get(`${basePath}/${id}`),
  createTeam: (data: { name: string; characters: string[] }) =>
    apiService.post(basePath, data),
  updateTeam: (id: string, data: Partial<{ name: string; characters: string[] }>) =>
    apiService.put(`${basePath}/${id}`, data),
  deleteTeam: (id: string) => apiService.delete(`${basePath}/${id}`),
  activateTeam: (id: string) => apiService.put(`${basePath}/${id}/activate`, {}),
};
```

---

## Team Builder (Layout Horizontal)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ [← Volver]                    ⚔️ ARMADO DE EQUIPO                        [💾 Guardar]    │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  MIS EQUIPOS: ◄ [Equipo Alpha ✓] [Equipo Beta] [Equipo Gamma] [+ Nuevo] ►               │
│                                                                                          │
│  ┌──────────────────────────────────────┐ ┌──────────────────────────────────────────┐   │
│  │ 📦 MIS PERSONAJES (Roster)          │ │ 🎯 EQUIPO ACTUAL                        │   │
│  │                                      │ │                                          │   │
│  │ ◄ [🧙 Mago Nv15] [⚔️ Guer Nv12] ►  │ │ Nombre: [Equipo Alpha_______]           │   │
│  │                                      │ │                                          │   │
│  │ ← scroll horizontal para más →      │ │ ┌───┐┌───┐┌───┐┌───┐┌───┐              │   │
│  │                                      │ │ │ 1 ││ 2 ││ 3 ││ 4 ││ + │              │   │
│  │ Filtrar: [Todos ▼] [Buscar..]       │ │ │🧙 ││⚔️ ││   ││   ││   │              │   │
│  │                                      │ │ └───┘└───┘└───┘└───┘└───┘              │   │
│  │                                      │ │                                          │   │
│  │                                      │ │ 📊 STATS TOTALES                        │   │
│  │                                      │ │ ❤️ HP: 450  ⚔️ ATK: 185                │   │
│  │                                      │ │ 🛡️ DEF: 120  ⚡ SPD: 95               │   │
│  │                                      │ │                                          │   │
│  │                                      │ │ [⚡ ACTIVAR EQUIPO]                     │   │
│  └──────────────────────────────────────┘ └──────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Componente React Team Builder

```tsx
// src/pages/Dashboard/TeamBuilder.tsx
import { useState, useEffect, useMemo } from 'react';
import { teamService, characterService } from '../../services';

interface Character {
  _id: string;
  nombre: string;
  rango: string;
  nivel: number;
  stats?: { salud: number; ataque: number; defensa: number };
}

export const TeamBuilder: React.FC = () => {
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [myTeams, setMyTeams] = useState<any[]>([]);
  const [selectedChars, setSelectedChars] = useState<Character[]>([]);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');

  // Cargar dados iniciales
  useEffect(() => {
    const load = async () => {
      const [chars, teams] = await Promise.all([
        characterService.getUserCharacters(),   // GET /api/user-characters
        teamService.getMyTeams(),               // GET /api/teams
      ]);
      setAllCharacters(chars);
      setMyTeams(teams);

      // Cargar equipo activo
      const active = teams.find((t: any) => t.isActive);
      if (active) loadTeam(active);
    };
    load();
  }, []);

  // Stats totales (computed)
  const totalStats = useMemo(() => ({
    hp: selectedChars.reduce((sum, c) => sum + (c.stats?.salud || 0), 0),
    atk: selectedChars.reduce((sum, c) => sum + (c.stats?.ataque || 0), 0),
    def: selectedChars.reduce((sum, c) => sum + (c.stats?.defensa || 0), 0),
  }), [selectedChars]);

  const canSave = teamName.length > 0 && selectedChars.length > 0;

  const toggleCharacter = (char: Character) => {
    if (selectedChars.some(c => c._id === char._id)) {
      setSelectedChars(prev => prev.filter(c => c._id !== char._id));
    } else if (selectedChars.length < 9) {
      setSelectedChars(prev => [...prev, char]);
    }
  };

  const loadTeam = (team: any) => {
    setCurrentTeamId(team._id);
    setTeamName(team.name);
    setSelectedChars(team.characters);
  };

  const saveTeam = async () => {
    const data = {
      name: teamName,
      characters: selectedChars.map(c => c._id),
    };

    if (currentTeamId) {
      await teamService.updateTeam(currentTeamId, data);  // PUT /api/teams/:id
    } else {
      const res = await teamService.createTeam(data);      // POST /api/teams
      setCurrentTeamId(res.team._id);
    }

    // Refrescar lista
    const teams = await teamService.getMyTeams();
    setMyTeams(teams);
  };

  const activateTeam = async () => {
    if (!currentTeamId) return;
    await teamService.activateTeam(currentTeamId);  // PUT /api/teams/:id/activate
    const teams = await teamService.getMyTeams();
    setMyTeams(teams);
  };

  return (
    <div className="team-builder grid grid-cols-[55%_45%] h-full gap-4 p-4">
      {/* Panel izquierdo: Roster */}
      <section className="roster">
        <h3>Mis Personajes</h3>
        <div className="horizontal-scroll">
          {allCharacters.map(char => (
            <div
              key={char._id}
              className={`character-card ${selectedChars.some(c => c._id === char._id) ? 'selected' : ''}`}
              onClick={() => toggleCharacter(char)}
            >
              <img src={`/assets/characters/${char._id}.png`} alt={char.nombre} />
              <span>{char.nombre}</span>
              <span>Nv. {char.nivel}</span>
              <span>{char.rango}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Panel derecho: Equipo actual */}
      <section className="current-team">
        <input
          value={teamName}
          onChange={e => setTeamName(e.target.value)}
          placeholder="Nombre del equipo"
          maxLength={50}
        />
        <div className="team-slots grid grid-cols-5 gap-2">
          {Array(9).fill(null).map((_, i) => (
            <div key={i} className="slot" onClick={() => {
              if (selectedChars[i]) {
                setSelectedChars(prev => prev.filter((_, idx) => idx !== i));
              }
            }}>
              {selectedChars[i] ? (
                <>
                  <img src={`/assets/characters/${selectedChars[i]._id}.png`} alt="" />
                  <span>{selectedChars[i].nombre}</span>
                </>
              ) : (
                <span className="empty">+</span>
              )}
            </div>
          ))}
        </div>

        <div className="team-stats">
          <span>❤️ HP: {totalStats.hp}</span>
          <span>⚔️ ATK: {totalStats.atk}</span>
          <span>🛡️ DEF: {totalStats.def}</span>
        </div>

        <div className="actions flex gap-2">
          <button onClick={saveTeam} disabled={!canSave}>💾 Guardar</button>
          <button onClick={activateTeam} disabled={!currentTeamId}>⚡ Activar</button>
        </div>
      </section>

      {/* Lista de equipos guardados */}
      <section className="saved-teams horizontal-scroll col-span-2">
        {myTeams.map(team => (
          <button
            key={team._id}
            className={team.isActive ? 'active' : ''}
            onClick={() => loadTeam(team)}
          >
            {team.name} {team.isActive && '✓'}
          </button>
        ))}
        <button onClick={() => { setCurrentTeamId(null); setTeamName(''); setSelectedChars([]); }}>
          + Nuevo
        </button>
      </section>
    </div>
  );
};
```

---

## Flujo Completo: Dashboard → Jugar

```
[Dashboard]
    │
    ├── [JUGAR] ──────────────────────────────────────────────┐
    │       │                                                  │
    │       ▼                                                  │
    │  ¿Tiene equipo activo?                                   │
    │       │                                                  │
    │  Sí ──┼──→ Selector de Modo ──┬── RPG → /dungeon        │
    │       │                       └── Survival → /survival   │
    │  No ──┼──→ TeamBuilder modal                             │
    │                                                          │
    ├── [TIENDA] ─────────────────────────────────────────────┤
    │       ▼                                                  │
    │  GET /api/shop/packages → /shop                          │
    │       ▼                                                  │
    │  [Comprar] → [Abrir paquete] → Refrescar inventario      │
    │                                                          │
    ├── [MARKETPLACE] ────────────────────────────────────────┤
    │       ▼                                                  │
    │  GET /api/marketplace/history → /marketplace             │
    │       │                                                  │
    │  ┌────┴────┐                                             │
    │  ▼         ▼                                             │
    │ COMPRAR   VENDER                                         │
    │  POST     POST                                           │
    │  buy/:id  list                                           │
    │                                                          │
    └── [EQUIPOS] → TeamBuilder modal → Actualizar dashboard   │
```

---

## Pantallas y Rutas React

| Pantalla | Ruta React | Componente | Endpoints principales |
|----------|-----------|------------|----------------------|
| Dashboard | `/dashboard` | `Dashboard.tsx` | `users/me`, `teams`, `notifications` |
| Tienda | `/shop` | `Shop.tsx` | `shop/packages`, `shop/purchase` |
| Marketplace | `/marketplace` | `Marketplace.tsx` | `marketplace/history`, `marketplace/buy` |
| Inventario | `/inventory` | `Inventory.tsx` | `inventory` |
| Dungeon | `/dungeon` | `Dungeon.tsx` | `dungeons`, `dungeons/:id/start` |
| Survival | `/survival` | `Survival.tsx` | `survival/start`, `survival/*` |
| Rankings | `/ranking` | `Ranking.tsx` | `rankings/*` |
| Perfil | `/profile` | `Profile.tsx` | `users/me`, `player-stats/*` |
| Settings | `/settings` | `Settings.tsx` | `user/settings` |
| Landing | `/` | `Landing.tsx` | — |
| Auth | `/login`, `/register` | `Auth.tsx` | `auth/login`, `auth/register` |

---

## WebSocket Events para Real-time

> **Servicio:** `src/services/socket.service.ts`

| Evento | Cuándo | Acción en UI |
|--------|--------|--------------|
| `notification:new` | Cualquier notificación | Badge +1, toast |
| `marketplace:sold` | Tu ítem se vendió | Toast + actualizar VAL |
| `character:level-up` | Sube de nivel | Toast + actualizar stats |
| `rankings:update` | Cambio en ranking | Actualizar posición |
| `payments:status` | Compra procesada | Actualizar paquetes |

---

## Tips para UX Rápida

### 1. Caché con Zustand stores
```tsx
// Los stores de Zustand mantienen el estado entre navegaciones
// src/stores/ — useAuthStore, useGameStore, etc.
// No necesitas localStorage manual para datos frecuentes
```

### 2. Carga paralela en Dashboard
```tsx
// src/pages/Dashboard/Dashboard.tsx
useEffect(() => {
  Promise.all([
    userService.getMe(),            // GET /api/users/me
    teamService.getMyTeams(),       // GET /api/teams
    userService.getDashboard(),     // GET /api/users/dashboard
  ]).then(([user, teams, dashboard]) => {
    setUser(user);
    setTeams(teams);
    setActivity(dashboard);
  });
}, []);
```

### 3. Skeleton loaders
```tsx
{loading ? (
  <div className="skeleton-card animate-pulse bg-gray-800 rounded-xl h-32" />
) : (
  <ActionCard data={data} />
)}
```

---

**Referencia:** Ver `02_frontend/ENDPOINTS_CATALOG.md` para la lista completa de ~135 endpoints.
