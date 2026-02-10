# Combate y Dungeons (Frontend React + TypeScript)

Guía práctica para implementar pantallas y hooks de combate/dungeons usando los endpoints publicados y los eventos de WebSocket disponibles.

**Framework**: React + TypeScript + Three.js

---

## � DIVISIÓN DE RESPONSABILIDADES: FRONTEND vs BACKEND

### ¿Qué hace cada lado?

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              🎮 FRONTEND (React + Three.js)                             │
│                                                                                         │
│  ✅ TODO lo visual:                                                                     │
│     • Escena 3D (Three.js) - renderizar mundo, personajes, enemigos                    │
│     • Botones en pantalla (Atacar, Usar Poción, Pausar, Salir)                         │
│     • HUD (barra de vida, puntos, oleada actual, items)                                │
│     • Animaciones (caminar, atacar, recibir daño, morir)                               │
│     • Efectos visuales (partículas, números de daño flotantes)                         │
│     • Controles del jugador (WASD, clicks, touch)                                      │
│     • Sonidos y música                                                                  │
│     • Spawning visual de enemigos (dónde aparecen en pantalla)                         │
│     • Colisiones visuales (hitboxes para golpes)                                       │
│                                                                                         │
│  ❌ NO hace:                                                                            │
│     • Guardar progreso (lo hace el backend)                                            │
│     • Calcular daño real (solo muestra lo que el backend dice)                         │
│     • Validar si el jugador puede hacer algo (backend valida)                          │
│     • Generar loot/recompensas (backend decide)                                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                                    ↕️ API REST + WebSocket

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              🔧 BACKEND (Node.js + MongoDB)                             │
│                                                                                         │
│  ✅ Matemáticas y lógica:                                                               │
│     • Calcular daño (ataque vs defensa, críticos, fallos)                              │
│     • Calcular experiencia ganada                                                       │
│     • Calcular VAL ganado                                                               │
│     • Decidir si hay drop (probabilidades)                                              │
│     • Validar que el personaje puede jugar (no está herido)                            │
│     • Validar que tienes energía/boletos suficientes                                   │
│     • Anti-cheat (validar oleadas, tiempos, puntos)                                    │
│                                                                                         │
│  ✅ Persistencia (guardar en BD):                                                       │
│     • Actualizar salud del personaje después del combate                               │
│     • Marcar personaje como "herido" si muere                                          │
│     • Dar experiencia y subir de nivel                                                 │
│     • Agregar items al inventario                                                      │
│     • Cobrar VAL por curar/revivir                                                     │
│     • Actualizar ranking/leaderboard                                                   │
│                                                                                         │
│  ❌ NO hace:                                                                            │
│     • Decidir dónde aparecen enemigos en pantalla (frontend)                           │
│     • Manejar animaciones o efectos visuales (frontend)                                │
│     • Procesar controles del jugador directamente (frontend)                           │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 FLUJO COMPLETO DE UNA PARTIDA SURVIVAL

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ PASO 1: INICIAR PARTIDA                                                                  │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  [FRONTEND]                              [BACKEND]                                       │
│  ─────────                               ─────────                                       │
│  Usuario presiona "JUGAR"                                                                │
│       │                                                                                  │
│       ├──► POST /api/survival/start ───────────────────►  Valida:                       │
│       │    { characterId, equipmentIds }                   • ¿Personaje existe? ✅      │
│       │                                                    • ¿Tiene 4 equipos? ✅       │
│       │                                                    • ¿No está herido? ✅        │
│       │                                                    • ¿Tiene energía? ✅         │
│       │                                                                                  │
│       │                                  ◄─────────────  Respuesta:                      │
│       │                                                  { sessionId, stats iniciales }  │
│       │                                                                                  │
│  Inicia escena Three.js                                                                  │
│  Spawns enemigos (frontend decide dónde)                                                 │
│  Muestra HUD con vida, puntos                                                            │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ PASO 2: DURANTE EL JUEGO (Oleadas)                                                       │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  [FRONTEND - TODO ESTO ES VISUAL]        [BACKEND - SOLO VALIDA RESULTADOS]             │
│  ────────────────────────────────        ──────────────────────────────────             │
│                                                                                          │
│  • Jugador se mueve (WASD)               (no sabe nada de esto)                         │
│  • Jugador ataca (click)                 (no sabe nada de esto)                         │
│  • Enemigos persiguen al jugador         (no sabe nada de esto)                         │
│  • Colisiones y daño visual              (no sabe nada de esto)                         │
│  • Animaciones de muerte enemigo         (no sabe nada de esto)                         │
│  • Contador de enemigos derrotados       (frontend cuenta localmente)                   │
│       │                                                                                  │
│       │  Cuando termina la oleada:                                                       │
│       │                                                                                  │
│       ├──► POST /api/survival/:id/complete-wave ────►  Valida:                          │
│       │    { waveNumber: 5,                            • ¿Es la oleada correcta? ✅     │
│       │      enemiesDefeated: 8,                       • ¿Tiempo razonable? ✅          │
│       │      damageDealt: 1500 }                       • Anti-cheat checks ✅           │
│       │                                                                                  │
│       │                                  ◄────────────  Respuesta:                       │
│       │                                                 { points: 450,                   │
│       │                                                   nextWave: 6,                   │
│       │                                                   multiplier: 1.5 }              │
│       │                                                                                  │
│  Frontend actualiza HUD                                                                  │
│  Spawns nueva oleada de enemigos                                                         │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ PASO 3: USAR ITEM (Botón en pantalla)                                                    │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  [FRONTEND]                              [BACKEND]                                       │
│                                                                                          │
│  Usuario presiona botón [🧪 Poción]                                                      │
│       │                                                                                  │
│       ├──► POST /api/survival/:id/use-consumable ──►  Valida:                           │
│       │    { consumableId, target: "player" }         • ¿Tiene ese consumible? ✅       │
│       │                                               • ¿Le quedan usos? ✅             │
│       │                                                                                  │
│       │                                  ◄──────────  Respuesta:                         │
│       │                                               { newHealth: 80,                   │
│       │                                                 usesRemaining: 2 }               │
│       │                                                                                  │
│  Frontend actualiza barra de vida                                                        │
│  Muestra efecto de curación                                                              │
│  Actualiza contador de pociones                                                          │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ PASO 4: JUGADOR MUERE o SE RETIRA                                                        │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  [FRONTEND]                              [BACKEND]                                       │
│                                                                                          │
│  Vida llega a 0 en pantalla                                                              │
│  (o usuario presiona "Salir")                                                            │
│       │                                                                                  │
│       ├──► POST /api/survival/:id/death ───────────►  Guarda en BD:                     │
│       │    { waveAtDeath: 12,                         • Run histórico                    │
│       │      pointsAtDeath: 2450 }                    • NO da recompensas (murió)       │
│       │                                               • Actualiza leaderboard           │
│       │                                                                                  │
│       │  ─── O SI SE RETIRA VIVO ───                                                    │
│       │                                                                                  │
│       ├──► POST /api/survival/:id/end ─────────────►  Guarda en BD:                     │
│       │    { finalWave: 15,                           • Run histórico                    │
│       │      totalPoints: 3200 }                      • SÍ da recompensas               │
│       │                                               • EXP + VAL + items               │
│       │                                               • Actualiza leaderboard           │
│       │                                                                                  │
│       │                                  ◄──────────  Respuesta:                         │
│       │                                               { rewards: {...},                  │
│       │                                                 newRank: 127 }                   │
│       │                                                                                  │
│  Muestra pantalla de resultados                                                          │
│  Botón "Volver al menú"                                                                  │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ❤️ SISTEMA DE SALUD Y HERIDOS

### Estados del Personaje

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   SALUDABLE (100% HP)                                                       │
│   ✅ Puede jugar Dungeons                                                   │
│   ✅ Puede jugar Survival                                                   │
│        │                                                                    │
│        ▼ (recibe daño en combate)                                           │
│                                                                             │
│   DAÑADO (1-99% HP)                                                         │
│   ✅ Puede jugar (pero empieza con menos vida)                              │
│   💰 Puede curarse con VAL                                                  │
│        │                                                                    │
│        ▼ (HP llega a 0 en Dungeon)                                          │
│                                                                             │
│   HERIDO (0 HP)                                                             │
│   ❌ NO puede jugar nada                                                    │
│   💰 DEBE ser revivido con VAL                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Endpoints de Curación/Resurrección

| Acción | Endpoint | Cuándo usar | Costo |
|--------|----------|-------------|-------|
| **Curar** | `POST /api/characters/:id/heal` | Personaje dañado (HP < máximo) | **2 VAL por cada 10 HP** |
| **Revivir** | `POST /api/characters/:id/revive` | Personaje herido (HP = 0) | **50 VAL** (fijo) |

### Hook React para Curar/Revivir

```tsx
// hooks/useCharacterHealth.ts
import { useCallback, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

export function useCharacterHealth() {
  const [loading, setLoading] = useState(false);

  // Curar personaje dañado (cuesta 2 VAL por cada 10 HP)
  const healCharacter = useCallback(async (characterId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/characters/${characterId}/heal`, {
        method: 'POST',
        credentials: 'include',
      });
      return response.json();
    } finally {
      setLoading(false);
    }
  }, []);

  // Revivir personaje herido (cuesta 50 VAL fijo)
  const reviveCharacter = useCallback(async (characterId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/characters/${characterId}/revive`, {
        method: 'POST',
        credentials: 'include',
      });
      return response.json();
    } finally {
      setLoading(false);
    }
  }, []);

  return { healCharacter, reviveCharacter, loading };
}
```

### UI: Card de Personaje con Estado

```tsx
// components/CharacterCard.tsx
interface CharacterCardProps {
  character: {
    personajeId: string;
    nombre: string;
    nivel: number;
    estado: 'saludable' | 'herido';
    saludActual: number;
    saludMaxima: number;
  };
  onHeal: (id: string) => void;
  onRevive: (id: string) => void;
  onSelect: (id: string) => void;
}

function CharacterCard({ character, onHeal, onRevive, onSelect }: CharacterCardProps) {
  const healthPercent = (character.saludActual / character.saludMaxima) * 100;
  const isHerido = character.estado === 'herido';
  const isDañado = character.saludActual < character.saludMaxima && !isHerido;
  const healCost = Math.ceil((character.saludMaxima - character.saludActual) / 10) * 2;

  return (
    <div className={`character-card ${isHerido ? 'herido' : ''}`}>
      {/* Avatar con overlay si está herido */}
      <div className="avatar-container">
        <img src={`/assets/characters/${character.personajeId}.png`} alt={character.nombre} />
        {isHerido && <div className="herido-overlay">💀</div>}
      </div>

      {/* Info básica */}
      <h3>{character.nombre}</h3>
      <p>Nivel {character.nivel}</p>

      {/* Barra de vida */}
      <div className="health-bar">
        <div 
          className="health-fill" 
          style={{ 
            width: `${healthPercent}%`,
            backgroundColor: healthPercent > 50 ? '#4ade80' : healthPercent > 25 ? '#fbbf24' : '#ef4444'
          }} 
        />
        <span>{character.saludActual}/{character.saludMaxima}</span>
      </div>

      {/* Botones según estado */}
      <div className="actions">
        {isHerido ? (
          // Personaje HERIDO - Solo puede revivir
          <button className="btn-revive" onClick={() => onRevive(character.personajeId)}>
            💀 Revivir (50 VAL)
          </button>
        ) : isDañado ? (
          // Personaje DAÑADO - Puede curar o jugar
          <>
            <button className="btn-heal" onClick={() => onHeal(character.personajeId)}>
              ❤️ Curar ({healCost} VAL)
            </button>
            <button className="btn-select" onClick={() => onSelect(character.personajeId)}>
              ⚔️ Jugar
            </button>
          </>
        ) : (
          // Personaje SALUDABLE - Solo jugar
          <button className="btn-select" onClick={() => onSelect(character.personajeId)}>
            ⚔️ Seleccionar
          </button>
        )}
      </div>
    </div>
  );
}
```

### CSS para Estados

```scss
.character-card {
  position: relative;
  border: 2px solid #3b82f6;
  border-radius: 12px;
  padding: 16px;
  
  &.herido {
    border-color: #ef4444;
    opacity: 0.7;
    
    .avatar-container {
      filter: grayscale(100%);
    }
  }
  
  .herido-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 48px;
  }
  
  .health-bar {
    height: 8px;
    background: #374151;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
    
    .health-fill {
      height: 100%;
      transition: width 0.3s ease;
    }
    
    span {
      position: absolute;
      right: 4px;
      top: -2px;
      font-size: 10px;
      color: white;
    }
  }
  
  .btn-revive {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    width: 100%;
  }
  
  .btn-heal {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;
  }
}
```

---

## �🎮 DOS MODOS DE JUEGO COMPLETAMENTE DIFERENTES

El backend soporta **dos modos de juego** con mecánicas y escenarios distintos:

### 🏰 MODO DUNGEONS (RPG) - Combate AUTOMÁTICO

| Característica | Descripción |
|---------------|-------------|
| **Tipo de juego** | RPG por turnos, estilo clásico |
| **Control** | ⚙️ **AUTOMÁTICO** - El servidor simula TODO el combate |
| **Personajes** | **EQUIPO** (múltiples personajes) |
| **Flujo** | 1 request = combate completo (victoria/derrota) |
| **Frontend** | Mostrar animación/resultado, NO requiere inputs durante pelea |

**Escenario de uso:**
```
Jugador → Selecciona equipo → Entra a dungeon → 
  → Backend simula combate automáticamente →
  → Frontend muestra resultado y recompensas
```

**Código:**
```typescript
// UNA sola llamada = todo el combate resuelto
const response = await this.http.post(`/api/dungeons/${dungeonId}/start`, {
  team: ["charId1", "charId2", "charId3"]  // Array de IDs
});
// response ya contiene: victoria/derrota, exp ganada, loot, etc.
```

---

### ☠️ MODO SURVIVAL - Combate MANUAL (Tipo Acción)

| Característica | Descripción |
|---------------|-------------|
| **Tipo de juego** | Acción en tiempo real / oleadas |
| **Control** | 🎮 **MANUAL** - El jugador controla CADA acción |
| **Personajes** | **1 SOLO** personaje |
| **Flujo** | Múltiples requests = el jugador decide qué hacer |
| **Frontend** | Three.js/Canvas - el jugador mueve, ataca, usa items |

**Escenario de uso:**
```
Jugador → Entra con 1 personaje → 
  → Frontend renderiza mundo 3D →
  → Jugador controla movimiento/ataques (WASD, clicks) →
  → Cada acción llama al backend para validar →
  → Jugador decide cuándo retirarse o seguir
```

**Código - Inicio:**
```typescript
// Inicia sesión de Survival
const session = await this.http.post('/api/survival/start', {
  characterId: "charId1",                           // UN solo ID
  equipmentIds: ["head", "body", "hands", "feet"],  // 4 slots máx
  consumableIds: ["potion1", "elixir1"]             // 5 consumibles máx
});
// Guarda sessionId para las siguientes acciones
```

**Código - Durante el juego (el jugador controla):**
```typescript
// El jugador completó una oleada
await this.http.post(`/api/survival/${sessionId}/complete-wave`, {
  waveNumber: 3,
  enemiesDefeated: 5,
  damageDealt: 1200
});

// El jugador decide usar una poción
await this.http.post(`/api/survival/${sessionId}/use-consumable`, {
  consumableId: "potionId",
  targetSlot: "player"  // o "enemy" para daño
});

// El jugador recoge un drop del suelo
await this.http.post(`/api/survival/${sessionId}/pickup-drop`, {
  dropId: "drop123"
});

// El jugador decide retirarse (guarda puntos)
await this.http.post(`/api/survival/${sessionId}/end`);

// O si el jugador muere
await this.http.post(`/api/survival/${sessionId}/death`);
```

---

## ⚠️ TABLA RESUMEN - ¿Cuál usar?

| Pregunta | Dungeons (RPG) | Survival |
|----------|---------------|----------|
| **¿Quién controla el combate?** | El servidor (automático) | El jugador (manual) |
| **¿Cuántos personajes?** | Equipo (array) | 1 solo |
| **¿El jugador toma decisiones durante la pelea?** | NO | SÍ |
| **¿Qué tipo de frontend necesito?** | UI simple, mostrar resultados | Juego interactivo (Three.js, Canvas) |
| **¿Cuántas requests por combate?** | 1 (todo automático) | Muchas (cada acción del jugador) |
| **Ideal para...** | Progresión RPG, farming automático | Gameplay de acción, skill del jugador |

---

## Endpoints por Modo de Juego

### 🏰 DUNGEONS (RPG) - Combate Automático

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/dungeons` | GET | Lista todas las mazmorras disponibles |
| `/api/dungeons/:id` | GET | Detalle de una mazmorra |
| `/api/dungeons/:dungeonId/start` | POST | **Inicia combate automático** (envía `team[]`) |
| `/api/dungeons/:dungeonId/progress` | GET | Consulta progreso/resultado |

**Respuesta de `/start`:** Devuelve resultado completo (victoria/derrota, exp, loot).

---

### ☠️ SURVIVAL - Combate Manual (Acciones del Jugador)

| Endpoint | Método | Cuándo usarlo |
|----------|--------|---------------|
| `/api/survival/start` | POST | Jugador entra al modo Survival |
| `/api/survival/:sessionId/complete-wave` | POST | Jugador terminó una oleada |
| `/api/survival/:sessionId/use-consumable` | POST | Jugador usa poción/item |
| `/api/survival/:sessionId/pickup-drop` | POST | Jugador recoge loot del suelo |
| `/api/survival/:sessionId/end` | POST | Jugador decide retirarse (guarda puntos) |
| `/api/survival/:sessionId/death` | POST | Jugador murió |
| `/api/survival/:sessionId/abandon` | POST | Jugador abandona (pierde puntos) |
| `/api/survival/leaderboard` | GET | Tabla de clasificación |
| `/api/survival/my-stats` | GET | Estadísticas personales |

---

### WebSocket - Eventos en Tiempo Real

**Survival (manual):**
- `survival:wave:new` → Nueva oleada comenzó
- `survival:wave:end` → Oleada terminada
- `survival:end` → Sesión finalizada

**Dungeons/General:**
- `dungeon:entered` → Entró a dungeon
- `dungeon:progress` → Actualización de progreso
- `character:level-up` → Personaje subió de nivel
- `character:evolved` → Personaje evolucionó
- `rankings:update` → Rankings actualizados

## React Hooks

### 🏰 useDungeons (RPG - Combate Automático)

```tsx
// hooks/useDungeons.ts
import { useState, useCallback } from 'react';
import { useApi } from './useApi';

interface Dungeon {
  _id: string;
  nombre: string;
  nivel_minimo: number;
  costo_boletos: number;
}

interface CombatResult {
  victoria: boolean;
  combatLog: any[];
  recompensas: {
    exp: number;
    val: number;
    loot: any[];
  };
  personajes: any[];
}

export function useDungeons() {
  const { get, post, loading, error } = useApi();
  const [dungeons, setDungeons] = useState<Dungeon[]>([]);
  const [combatResult, setCombatResult] = useState<CombatResult | null>(null);

  // Lista mazmorras disponibles
  const fetchDungeons = useCallback(async () => {
    const data = await get<Dungeon[]>('/api/dungeons');
    setDungeons(data);
    return data;
  }, [get]);

  // Detalle de una mazmorra
  const getDungeon = useCallback(async (dungeonId: string) => {
    return await get<Dungeon>(`/api/dungeons/${dungeonId}`);
  }, [get]);

  // INICIA COMBATE AUTOMÁTICO - envía equipo, recibe resultado completo
  const startCombat = useCallback(async (dungeonId: string, team: string[]) => {
    const result = await post<CombatResult>(`/api/dungeons/${dungeonId}/start`, { team });
    setCombatResult(result);
    return result;
  }, [post]);

  // Consultar progreso/historial
  const getProgress = useCallback(async (dungeonId: string) => {
    return await get(`/api/dungeons/${dungeonId}/progress`);
  }, [get]);

  return {
    dungeons,
    combatResult,
    fetchDungeons,
    getDungeon,
    startCombat,
    getProgress,
    loading,
    error,
  };
}
```

**Uso en componente:**
```tsx
function DungeonScreen() {
  const { dungeons, fetchDungeons, startCombat, combatResult, loading } = useDungeons();
  const [selectedTeam, setSelectedTeam] = useState<string[]>([]);

  useEffect(() => {
    fetchDungeons();
  }, []);

  const handleStartCombat = async (dungeonId: string) => {
    // El combate es AUTOMÁTICO - una llamada = resultado completo
    const result = await startCombat(dungeonId, selectedTeam);
    // result ya tiene: victoria/derrota, exp ganada, loot obtenido
    if (result.victoria) {
      showVictoryModal(result.recompensas);
    } else {
      showDefeatModal();
    }
  };

  return (
    <div>
      {dungeons.map(d => (
        <DungeonCard key={d._id} dungeon={d} onStart={() => handleStartCombat(d._id)} />
      ))}
      {loading && <LoadingOverlay />}
    </div>
  );
}
```

---

### ☠️ useSurvival (Combate Manual - El Jugador Controla)

```tsx
// hooks/useSurvival.ts
import { useState, useCallback } from 'react';
import { useApi } from './useApi';

interface SurvivalSession {
  _id: string;
  currentWave: number;
  currentPoints: number;
  healthCurrent: number;
  healthMax: number;
  consumables: { itemId: string; usos_restantes: number }[];
  state: 'active' | 'completed' | 'dead' | 'abandoned';
}

export function useSurvival() {
  const { post, get, loading, error } = useApi();
  const [session, setSession] = useState<SurvivalSession | null>(null);

  // INICIA SESIÓN - el jugador entra al modo Survival
  const startSession = useCallback(async (
    characterId: string,
    equipmentIds: string[] = [],
    consumableIds: string[] = []
  ) => {
    const data = await post<SurvivalSession>('/api/survival/start', {
      characterId,
      equipmentIds,
      consumableIds,
    });
    setSession(data);
    return data;
  }, [post]);

  // ACCIÓN: Jugador completó una oleada
  const completeWave = useCallback(async (
    sessionId: string,
    waveNumber: number,
    enemiesDefeated: number,
    damageDealt: number
  ) => {
    const data = await post<SurvivalSession>(
      `/api/survival/${sessionId}/complete-wave`,
      { waveNumber, enemiesDefeated, damageDealt }
    );
    setSession(data);
    return data;
  }, [post]);

  // ACCIÓN: Jugador usa un consumible
  const useConsumable = useCallback(async (
    sessionId: string,
    consumableId: string,
    target: 'player' | 'enemy'
  ) => {
    const data = await post<SurvivalSession>(
      `/api/survival/${sessionId}/use-consumable`,
      { consumableId, targetSlot: target }
    );
    setSession(data);
    return data;
  }, [post]);

  // ACCIÓN: Jugador recoge un drop
  const pickupDrop = useCallback(async (sessionId: string, dropId: string) => {
    const data = await post<SurvivalSession>(
      `/api/survival/${sessionId}/pickup-drop`,
      { dropId }
    );
    setSession(data);
    return data;
  }, [post]);

  // ACCIÓN: Jugador decide retirarse (guarda puntos)
  const endSession = useCallback(async (sessionId: string) => {
    const data = await post<SurvivalSession>(`/api/survival/${sessionId}/end`, {});
    setSession(data);
    return data;
  }, [post]);

  // ACCIÓN: Jugador murió
  const reportDeath = useCallback(async (sessionId: string) => {
    const data = await post<SurvivalSession>(`/api/survival/${sessionId}/death`, {});
    setSession(data);
    return data;
  }, [post]);

  // ACCIÓN: Jugador abandona (pierde puntos)
  const abandon = useCallback(async (sessionId: string) => {
    const data = await post<SurvivalSession>(`/api/survival/${sessionId}/abandon`, {});
    setSession(data);
    return data;
  }, [post]);

  // Estadísticas y leaderboard
  const getLeaderboard = useCallback(() => get('/api/survival/leaderboard'), [get]);
  const getMyStats = useCallback(() => get('/api/survival/my-stats'), [get]);

  return {
    session,
    startSession,
    completeWave,
    useConsumable,
    pickupDrop,
    endSession,
    reportDeath,
    abandon,
    getLeaderboard,
    getMyStats,
    loading,
    error,
  };
}
```

**Uso en componente - Flujo típico de Survival:**
```tsx
function SurvivalGame() {
  const { 
    session, 
    startSession, 
    completeWave, 
    useConsumable, 
    reportDeath, 
    endSession 
  } = useSurvival();
  
  // 1. Jugador entra al modo
  const handleStart = async () => {
    const newSession = await startSession('char1', ['armor', 'weapon'], ['potion1']);
    initGame3D(newSession); // Renderiza mundo Three.js
  };

  // 2. Durante el juego - el jugador controla
  // (estos se llaman desde eventos del juego: teclado, clicks, etc.)
  
  const onWaveCompleted = async (stats: { wave: number; kills: number; damage: number }) => {
    const updated = await completeWave(session!._id, stats.wave, stats.kills, stats.damage);
    updateHUD(updated);
  };

  const onPlayerUsesPotion = async (potionId: string) => {
    const updated = await useConsumable(session!._id, potionId, 'player');
    updateHealth(updated.healthCurrent);
  };

  const onPlayerDies = async () => {
    await reportDeath(session!._id);
    showGameOver();
  };

  const onPlayerExits = async () => {
    const final = await endSession(session!._id);
    showResults(final.currentPoints);
  };

  return (
    <div>
      {/* Three.js canvas aquí */}
      <SurvivalHUD session={session} />
    </div>
  );
}
```

---

## Flujo UI - Por Modo de Juego

### 🏰 Flujo Dungeons (RPG - Automático)

```
┌─────────────────────────────────────────────────────────────┐
│  1. SELECCIÓN                                               │
│     GET /dungeons → mostrar lista de mazmorras              │
│     GET /dungeons/:id → mostrar detalle y requisitos        │
├─────────────────────────────────────────────────────────────┤
│  2. PREPARACIÓN                                             │
│     Jugador selecciona equipo (hasta N personajes)          │
│     Validar: nivel mínimo, personajes no heridos            │
├─────────────────────────────────────────────────────────────┤
│  3. COMBATE (AUTOMÁTICO)                                    │
│     POST /dungeons/:id/start { team: [...] }                │
│     → Backend simula TODO el combate                        │
│     → Frontend puede mostrar animación mientras espera      │
├─────────────────────────────────────────────────────────────┤
│  4. RESULTADO                                               │
│     Respuesta incluye: victoria/derrota, exp, loot          │
│     Mostrar recompensas y actualizar inventario             │
└─────────────────────────────────────────────────────────────┘
```

---

### ☠️ Flujo Survival (Manual - El Jugador Controla)

```
┌─────────────────────────────────────────────────────────────┐
│  1. PREPARACIÓN                                             │
│     Jugador selecciona 1 personaje                          │
│     Jugador equipa 4 items + 5 consumibles                  │
├─────────────────────────────────────────────────────────────┤
│  2. INICIO SESIÓN                                           │
│     POST /survival/start { characterId, equipmentIds, ... } │
│     → Recibe sessionId                                      │
│     → Frontend inicializa mundo 3D (Three.js/Canvas)        │
├─────────────────────────────────────────────────────────────┤
│  3. GAMEPLAY (MANUAL - Loop del juego)                      │
│                                                             │
│     ┌─────────────────────────────────────────────────┐     │
│     │  JUGADOR CONTROLA:                              │     │
│     │  - Movimiento (WASD, joystick)                  │     │
│     │  - Ataques (click, botones)                     │     │
│     │  - Usar items (teclas 1-5)                      │     │
│     │  - Recoger drops (E, click)                     │     │
│     │                                                 │     │
│     │  CADA ACCIÓN → llamada al backend:              │     │
│     │  - complete-wave (al terminar oleada)           │     │
│     │  - use-consumable (al usar poción)              │     │
│     │  - pickup-drop (al recoger loot)                │     │
│     └─────────────────────────────────────────────────┘     │
│                                                             │
│  4. FIN DE SESIÓN (Decisión del jugador)                    │
│     - /end → Jugador se retira, guarda puntos               │
│     - /death → Jugador murió                                │
│     - /abandon → Jugador abandona, pierde puntos            │
├─────────────────────────────────────────────────────────────┤
│  5. RESULTADO                                               │
│     Mostrar puntos totales, oleadas completadas             │
│     Actualizar leaderboard y estadísticas                   │
└─────────────────────────────────────────────────────────────┘
```

## Modelo de estado (sencillo)
```ts
interface CombatState {
  dungeonId: string;
  sessionId?: string;
  turn: number;
  player: { hp: number; mana: number; buffs: any[] };
  enemy: { hp: number; debuffs: any[] };
  log: Array<{ t: number; action: string; value?: any }>;
}
```

## Componente de Combate (React)
```tsx
import { useState } from 'react';
import { useDungeons } from '../hooks/useDungeons';

function CombatScreen({ dungeonId }: { dungeonId: string }) {
  const { startCombat, combatResult, loading } = useDungeons();
  const [team, setTeam] = useState<string[]>([]);

  const handleStart = async () => {
    const result = await startCombat(dungeonId, team);
    // result ya contiene victoria/derrota y recompensas
  };

  return (
    <section>
      <button onClick={handleStart} disabled={loading}>
        Iniciar Combate
      </button>
      {combatResult && (
        <div>
          <h2>{combatResult.victoria ? '¡Victoria!' : 'Derrota'}</h2>
          <pre>{JSON.stringify(combatResult, null, 2)}</pre>
        </div>
      )}
    </section>
  );
}
```

## Errores frecuentes
- 401: token inválido/expirado → forzar relogin.
- 403: sin permisos (p.e., dungeon bloqueada) → deshabilitar botón.
- 404: dungeon inexistente o sesión no encontrada.
- 409: conflicto de estado (acción fuera de turno) → refrescar `progress` antes de reintentar.
- 429/5xx: aplicar backoff (ver `ERRORS_AND_LIMITS.md`).

## Checklist
- [ ] Hooks implementados (`useDungeons`, `useSurvival`)
- [ ] Estados/HUD actualizados tras cada acción
- [ ] Manejo de 401/403/404/409/429
- [ ] Logs de combate para depuración
- [ ] Listeners WS básicos (survival/level-up)

## Sesiones y alias de endpoints

**Endpoints canónicos** (usar estos):
- `POST /api/dungeons/:dungeonId/start` — iniciar/entrar a dungeon (auth)
- `GET /api/dungeons/:dungeonId/progress` — consultar progreso actual (auth)

**Alias de compatibilidad** (redirección temporal para front legacy):
- `POST /api/dungeons/enter/:dungeonId` → alias de `start`
- `GET /api/dungeons/:dungeonId/session/:sessionId` → alias de `progress` (el `sessionId` se ignora hoy)

**Próximo paso:** sesiones reales con `enter`/`leave`/`session/:id/finish`, estado persistente y eventos RT. Los alias permitirán migración sin romper el front.

## Cómo impacta en Rankings

- RPG Dungeons: al completar una mazmorra y ganar, el backend registra el resultado (victoria/derrota, racha, nivel alcanzado, tiempo/mejor tiempo). Estos datos alimentan el ranking agregado. Tras una victoria, puedes refrescar:
  - `GET /api/rankings/me` para tu posición
  - `GET /api/rankings` o `GET /api/rankings/leaderboard/:category` según vista
- Survival: al terminar una partida, el servicio de Survival consolida tu puntuación (p.ej., oleadas, tiempo, puntuación total) y actualiza los leaderboards. El Front aplica el mismo patrón: `GET /api/rankings/me` y `GET /api/rankings/leaderboard/:category`.
- Períodos: además de `GET /api/rankings/period/:periodo`, existe alias `GET /api/rankings/period/:period`.
- Recomendación UI: tras una victoria, hacer un refresco ligero de `rankings/me` y, si estás en una vista de tabla, reenfocar `leaderboard` con el mismo `category` y `page` actual.

## Implementación Front (hoy)

1) Entrar e iniciar progreso (alias compatible):
```
POST /api/dungeons/enter/:dungeonId   (auth)
```

2) Consultar progreso (alias con `sessionId`, ignorado hoy):
```
GET  /api/dungeons/:dungeonId/session/:sessionId   (auth)
```

3) Tras detectar victoria (según respuesta del backend): refrescar posiciones:
```
GET /api/rankings/me
GET /api/rankings/leaderboard/:category?page=0&limit=20
```

Snippet React (hooks):
```tsx
// hooks/useRankings.ts
import { useCallback } from 'react';
import { useApi } from './useApi';

export function useRankings() {
  const { get } = useApi();
  
  const getMyRanking = useCallback(() => get('/api/rankings/me'), [get]);
  
  const getLeaderboard = useCallback((category: string, page = 0, limit = 20) => 
    get(`/api/rankings/leaderboard/${category}?page=${page}&limit=${limit}`), 
  [get]);

  return { getMyRanking, getLeaderboard };
}

// Uso en componente
function DungeonResult({ result }) {
  const { getMyRanking, getLeaderboard } = useRankings();
  
  useEffect(() => {
    if (result?.victoria) {
      // Refrescar ranking tras victoria
      getMyRanking();
      getLeaderboard('dungeon_wins');
    }
  }, [result]);
}
```
```

Patrón de flujo en componente:
- Llamar `enter(dungeonId)` → mostrar estado inicial.
- Polling con `progress(dungeonId)` cada X segundos hasta estado terminal (victoria/derrota).
- En victoria: `rankings.me()` y `rankings.leaderboard(category)` para refrescar.

## WebSocket (eventos mínimos)

**Eventos de Dungeons (RPG):**
- `dungeon:entered` → payload: `{ dungeonId, sessionId: 'current' }`
- `dungeon:progress` → payload: `{ dungeonId, progreso: { victorias, derrotas, nivel_actual, ... } }`

**Eventos de Rankings** (emitido tras victorias en RPG o Survival):
- `rankings:update` → payload:
  ```json
  {
    "reason": "dungeon_victory" | "survival_victory" | "periodic_recalc",
    "affectedCategories": ["general", "dungeon_wins"],
    "timestamp": "2025-12-02T14:30:00Z"
  }
  ```
  Acción recomendada: refrescar `GET /api/rankings/me` y, si estás en vista de tabla, `GET /api/rankings/leaderboard/:category`.

**Nota sobre Survival:**
- Al consolidar victoria en Survival, se emitirá `rankings:update { reason: 'survival_victory' }`. Patrón idéntico al de Dungeons.

### Cliente (React) – suscripción básica

```tsx
// hooks/useWebSocket.ts (ver WEBSOCKET_LISTENERS.md para versión completa)
import { useEffect } from 'react';
import { useWebSocket } from './useWebSocket';

// En tu componente de juego
function GameScreen() {
  const { on, connected } = useWebSocket(token);

  useEffect(() => {
    if (!connected) return;

    const unsubEntered = on('dungeon:entered', ({ dungeonId }) => {
      // actualizar UI a "en dungeon"
    });

    const unsubProgress = on('dungeon:progress', ({ dungeonId, progreso }) => {
      // refrescar barra de progreso / estado
    });

    const unsubRankings = on('rankings:update', () => {
      // refrescar tu posición o la tabla visible si corresponde
    });

    return () => {
      unsubEntered();
      unsubProgress();
      unsubRankings();
    };
  }, [connected, on]);

  return <div>...</div>;
}
```
```

## Entrega de resultados (hoy)

- Fuente de la verdad: el backend computa y persiste el resultado del combate. El front no “postea” puntajes arbitrarios.
- Dungeons: el resultado se refleja al consultar `progress`; cuando pasa a victoria/derrota, ya quedó grabado en estadísticas y en los agregados que alimentan Rankings.
- Survival: al terminar una partida, el servicio de Survival persiste la puntuación; la UI solo necesita leer `rankings/me` y `leaderboard` para reflejarlo.
- Errores: manejar 401 (token), 404 (dungeon inexistente), 429 (rate limit), y 5xx.

## Sesiones reales (futuro)

Objetivo: Sesión con estado explícito y eventos RT.
- Endpoints propuestos:
  - `POST /api/dungeons/enter/:dungeonId` → devuelve `{ sessionId, seed, expiresAt }`
  - `GET  /api/dungeons/session/:sessionId` → estado de la sesión
  - `POST /api/dungeons/session/:sessionId/finish` → cierra sesión con resultado
  - `POST /api/dungeons/session/:sessionId/leave` → abandono
- WebSocket:
  - Eventos `dungeon:entered`, `dungeon:progress`, `dungeon:finished` con `sessionId`.
  - Heartbeat opcional para detectar desconexiones.
- Seguridad/anti‑cheat:
  - Semilla/seed firmada por servidor, validaciones de consistencia; el cliente no declara “gané”, el servidor valida.
- Migración desde hoy:
  - Los alias ya usados (`enter`, `session/:id`) continuarán; se añadirá `sessionId` real y el endpoint `finish`.
