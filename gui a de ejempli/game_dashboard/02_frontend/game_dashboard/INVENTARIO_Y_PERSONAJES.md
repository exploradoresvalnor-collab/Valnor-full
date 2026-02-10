# Inventario, Personajes y Acciones - Documentación Frontend

**Framework**: React + TypeScript

## Resumen

Este documento cubre:
1. **Inventario** - Ver y gestionar items (equipamiento y consumibles)
2. **Personajes** - Acciones sobre mis personajes (equipar, curar, evolucionar)
3. **Logros** - Sistema de achievements

---

## Flujo de Pantallas

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PANTALLAS DE INVENTARIO Y PERSONAJES                 │
└─────────────────────────────────────────────────────────────────────────┘

   ┌──────────────────┐
   │  INVENTARIO      │ ← Ver todos mis items
   │  COMPLETO        │   GET /api/inventory
   └──────────────────┘

   ┌──────────────────┐
   │  MIS             │ ← Lista de mis personajes
   │  PERSONAJES      │   GET /api/user-characters
   └──────────────────┘

   ┌──────────────────┐
   │  DETALLE         │ ← Ver/Gestionar un personaje
   │  PERSONAJE       │   GET /api/user-characters/:id
   │                  │   + acciones: equipar, curar, evolucionar
   └──────────────────┘

   ┌──────────────────┐
   │  LOGROS          │ ← Ver logros del juego y míos
   │                  │   GET /api/achievements
   └──────────────────┘
```

---

## 1. INVENTARIO

### GET `/api/inventory` (Requiere Auth)

**¿Para qué pantalla?** Pantalla principal de inventario.  
**¿Por qué?** Ver TODO lo que tengo: equipamiento + consumibles.

```typescript
// Response:
{
  "equipment": [
    "itemId1",  // Solo IDs, necesitas cruzar con /api/items para detalles
    "itemId2",
    "itemId3"
  ],
  "consumables": [
    {
      "consumableId": "pocion_hp_001",
      "usos_restantes": 3
    },
    {
      "consumableId": "elixir_001",
      "usos_restantes": 1
    }
  ]
}
```

**React Hook:**
```tsx
// hooks/useInventory.ts
export function useInventory() {
  const { get, loading } = useApi();

  const getFullInventory = useCallback(() => 
    get<Inventory>('/api/inventory'), [get]);

  const getEquipment = useCallback(() => 
    get<string[]>('/api/inventory/equipment'), [get]);

  const getConsumables = useCallback(() => 
    get('/api/inventory/consumables'), [get]);

  return { getFullInventory, getEquipment, getConsumables, loading };
}
```

---

### GET `/api/inventory/equipment` (Requiere Auth)

**¿Para qué pantalla?** Tab "Equipamiento" del inventario.  
**¿Por qué?** Ver solo equipamiento (más rápido si no necesitas consumibles).

```typescript
// Response: Array de IDs
["itemId1", "itemId2", "itemId3"]
```

---

### GET `/api/inventory/consumables` (Requiere Auth)

**¿Para qué pantalla?** Tab "Consumibles" del inventario.  
**¿Por qué?** Ver solo consumibles con sus usos restantes.

```typescript
// Response:
[
  { "consumableId": "pocion_hp_001", "usos_restantes": 3 },
  { "consumableId": "elixir_001", "usos_restantes": 1 }
]
```

---

### GET `/api/equipment` (Público)

**¿Para qué pantalla?** Catálogo de equipamiento.  
**¿Por qué?** Ver todos los tipos de equipamiento que existen en el juego.

```typescript
// Response: Todos los items de tipo equipamiento
[
  {
    "_id": "itemId1",
    "nombre": "Espada de Hierro",
    "tipoItem": "weapon",
    "rareza": "comun",
    "stats": { "ataque": 10 },
    "imagen": "/assets/items/sword.png"
  }
  // ...
]
```

---

### GET `/api/consumables` (Público)

**¿Para qué pantalla?** Catálogo de consumibles.  
**¿Por qué?** Ver todos los tipos de consumibles que existen.

```typescript
// Response: Todos los items de tipo consumible
[
  {
    "_id": "pocion_hp_001",
    "nombre": "Poción de Vida",
    "tipoItem": "consumable",
    "efecto": "heal",
    "valor": 50,
    "usos_maximos": 3,
    "imagen": "/assets/items/potion_hp.png"
  }
  // ...
]
```

---

### GET `/api/items` (Público)

**¿Para qué pantalla?** Cualquier lugar donde necesites detalles de un item.  
**¿Por qué?** El inventario solo trae IDs, necesitas este endpoint para los detalles.

```typescript
// Response: TODOS los items del juego
[
  { "_id": "item1", "nombre": "...", "tipoItem": "weapon", ... },
  { "_id": "item2", "nombre": "...", "tipoItem": "consumable", ... }
]
```

---

## 2. PERSONAJES

### GET `/api/user-characters` (Requiere Auth)

**¿Para qué pantalla?** Lista de mis personajes, selector de personaje.  
**¿Por qué?** Ver todos los personajes que tengo desbloqueados.

```typescript
// Response:
{
  "characters": [
    {
      "_id": "char001",
      "personajeId": "guerrero_base",
      "nombre": "Guerrero",
      "rango": "B",
      "nivel": 25,
      "etapa": 1,
      "experiencia": 12500,
      "saludActual": 850,
      "saludMaxima": 1000,
      "estado": "saludable",  // "saludable" | "herido" | "muerto"
      "stats": {
        "ataque": 120,
        "defensa": 80,
        "velocidad": 60
      },
      "equipamiento": ["equip001", "equip002", "equip003", "equip004"],
      "activeBuffs": []
    }
    // ... más personajes
  ]
}
```

---

### GET `/api/user-characters/:id` (Requiere Auth)

**¿Para qué pantalla?** Vista detallada de un personaje.  
**¿Por qué?** Ver toda la información de UN personaje específico.

```typescript
// GET /api/user-characters/char001

// Response: Objeto de personaje completo (igual que arriba pero uno solo)
```

---

## 3. ACCIONES SOBRE PERSONAJES

### POST `/api/characters/:characterId/equip` (Requiere Auth)

**¿Para qué pantalla?** Pantalla de equipar items, preparación para combate.  
**¿Por qué?** Poner un item del inventario en un personaje.

```typescript
// POST /api/characters/char001/equip
// Body:
{
  "itemId": "sword_001",
  "slot": "weapon"  // "weapon" | "helmet" | "armor" | "gloves" | "boots"
}

// Response:
{
  "message": "Item equipado correctamente",
  "character": { /* personaje actualizado */ }
}
```

---

### POST `/api/characters/:characterId/unequip` (Requiere Auth)

**¿Para qué pantalla?** Pantalla de equipar items.  
**¿Por qué?** Quitar un item equipado y devolverlo al inventario.

```typescript
// POST /api/characters/char001/unequip
// Body:
{
  "slot": "weapon"
}

// Response:
{
  "message": "Item desequipado",
  "character": { /* personaje actualizado */ },
  "itemReturned": "sword_001"
}
```

---

### POST `/api/characters/:characterId/use-consumable` (Requiere Auth)

**¿Para qué pantalla?** Cualquier lugar donde el personaje pueda usar pociones.  
**¿Por qué?** Usar un consumible del inventario en el personaje (fuera de combate).

```typescript
// POST /api/characters/char001/use-consumable
// Body:
{
  "consumableId": "pocion_hp_001"
}

// Response:
{
  "message": "Consumible usado",
  "efectoAplicado": "heal",
  "valorEfecto": 50,
  "character": { 
    "saludActual": 900,  // Antes era 850
    "saludMaxima": 1000
  },
  "usosRestantes": 2  // Antes tenía 3
}
```

---

### POST `/api/characters/:characterId/heal` (Requiere Auth)

**¿Para qué pantalla?** Cuando el personaje está herido.  
**¿Por qué?** Curar al personaje (cuesta recursos).

```typescript
// POST /api/characters/char001/heal
// Body: (vacío o con parámetros específicos)

// Response:
{
  "message": "Personaje curado",
  "character": {
    "saludActual": 1000,
    "saludMaxima": 1000,
    "estado": "saludable"
  }
}
```

---

### POST `/api/characters/:characterId/revive` (Requiere Auth)

**¿Para qué pantalla?** Cuando el personaje está muerto.  
**¿Por qué?** Revivir a un personaje muerto (cuesta recursos).

```typescript
// POST /api/characters/char001/revive

// Response:
{
  "message": "Personaje revivido",
  "character": {
    "saludActual": 500,  // Revive con 50% HP
    "saludMaxima": 1000,
    "estado": "saludable"
  }
}
```

---

### POST `/api/characters/:characterId/evolve` (Requiere Auth)

**¿Para qué pantalla?** Pantalla de evolución de personaje.  
**¿Por qué?** Evolucionar el personaje a la siguiente etapa (requiere nivel + recursos).

```typescript
// POST /api/characters/char001/evolve

// Requisitos:
// - Etapa 1 → 2: Nivel 40 + VAL + EVO tokens
// - Etapa 2 → 3: Nivel 100 + VAL + EVO tokens

// Response:
{
  "message": "Personaje evolucionado",
  "character": {
    "etapa": 2,  // Era 1
    "stats": {   // Stats aumentados
      "ataque": 180,
      "defensa": 120,
      "velocidad": 90
    }
  },
  "recursosConsumidos": {
    "val": 5000,
    "evo": 100
  }
}

// Error (si no cumple requisitos):
{
  "error": "No cumples los requisitos para evolucionar",
  "requisitos": {
    "nivelRequerido": 40,
    "tuNivel": 35,
    "valRequerido": 5000,
    "tuVal": 3000,
    "evoRequerido": 100,
    "tuEvo": 50
  }
}
```

---

### POST `/api/characters/:characterId/add-experience` (Requiere Auth)

**¿Para qué pantalla?** Normalmente el backend lo hace automáticamente.  
**¿Por qué?** Añadir experiencia manualmente (admin o canje de puntos).

```typescript
// POST /api/characters/char001/add-experience
// Body:
{
  "amount": 500
}

// Response:
{
  "message": "Experiencia añadida",
  "character": {
    "experiencia": 13000,
    "nivel": 26,  // Si subió de nivel
    "experienciaParaSiguienteNivel": 1500
  },
  "leveledUp": true
}
```

---

### PUT `/api/characters/:characterId/level-up` (Requiere Auth)

**¿Para qué pantalla?** Si el sistema requiere confirmar level up manual.  
**¿Por qué?** Subir de nivel cuando se tiene suficiente experiencia.

```typescript
// PUT /api/characters/char001/level-up

// Response:
{
  "message": "Nivel aumentado",
  "character": {
    "nivel": 26,
    "stats": { /* stats mejoradas */ }
  }
}
```

---

### GET `/api/characters/:characterId/stats` (Requiere Auth)

**¿Para qué pantalla?** Vista detallada de stats, comparación.  
**¿Por qué?** Ver stats calculadas (base + equipamiento + buffs).

```typescript
// GET /api/characters/char001/stats

// Response:
{
  "base": {
    "ataque": 100,
    "defensa": 60,
    "velocidad": 50
  },
  "fromEquipment": {
    "ataque": 20,
    "defensa": 20,
    "velocidad": 10
  },
  "fromBuffs": {
    "ataque": 0,
    "defensa": 0,
    "velocidad": 0
  },
  "total": {
    "ataque": 120,
    "defensa": 80,
    "velocidad": 60
  }
}
```

---

## 4. LOGROS (Achievements)

### GET `/api/achievements` (Público)

**¿Para qué pantalla?** Lista de todos los logros del juego.  
**¿Por qué?** Mostrar logros disponibles para desbloquear.

```typescript
// Query params:
// - categoria: "combate" | "coleccion" | "social" | etc
// - limit: número (default 50)
// - page: número (default 0)

// GET /api/achievements?categoria=combate&limit=20

// Response:
{
  "achievements": [
    {
      "_id": "ach001",
      "nombre": "Primera Sangre",
      "descripcion": "Gana tu primer combate",
      "categoria": "combate",
      "recompensa": { "val": 100, "exp": 500 },
      "icono": "/assets/achievements/first_blood.png"
    }
    // ...
  ],
  "total": 50,
  "page": 0
}
```

---

### GET `/api/achievements/:userId` (Público)

**¿Para qué pantalla?** Perfil de usuario (propio o ajeno).  
**¿Por qué?** Ver qué logros ha desbloqueado un usuario.

```typescript
// GET /api/achievements/user001

// Response:
{
  "userId": "user001",
  "unlocked": [
    {
      "achievementId": "ach001",
      "nombre": "Primera Sangre",
      "unlockedAt": "2025-11-15T10:00:00Z"
    },
    {
      "achievementId": "ach005",
      "nombre": "Veterano",
      "unlockedAt": "2025-11-20T15:30:00Z"
    }
  ],
  "totalUnlocked": 12,
  "totalAvailable": 50
}
```

---

## Layout Horizontal - Inventario

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Volver                     INVENTARIO                        [👤]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  [EQUIPAMIENTO]  [CONSUMIBLES]  │  Espacios: 45/50              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ │ │
│  │ │ 🗡️  │ │ 🛡️  │ │ ⚔️  │ │ 🎩  │ │ 👕  │ │ 🧤  │ │ 👢  │ │ 💎  │ │ │
│  │ │Espada│ │Escudo│ │Hacha │ │Casco │ │Armor │ │Guant.│ │Botas │ │Anillo│ │
│  │ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ │ │
│  │ ← scroll horizontal para más items →                              │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌─────────────────────────┐                                           │
│  │  ITEM SELECCIONADO      │  [Equipar en Guerrero]                    │
│  │  Espada de Hierro       │  [Vender en Marketplace]                  │
│  │  Ataque: +10            │                                           │
│  │  Rareza: Común          │                                           │
│  └─────────────────────────┘                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## React Hooks Completos

```tsx
// hooks/useInventory.ts
import { useState, useCallback } from 'react';
import { useApi } from './useApi';

export function useInventory() {
  const { get, loading, error } = useApi();
  
  // === INVENTARIO ===
  const getFullInventory = useCallback(() => 
    get('/api/inventory'), [get]);
  
  const getEquipment = useCallback(() => 
    get<string[]>('/api/inventory/equipment'), [get]);
  
  const getConsumables = useCallback(() => 
    get('/api/inventory/consumables'), [get]);
  
  // === CATÁLOGO ===
  const getAllItems = useCallback(() => 
    get('/api/items'), [get]);
  
  const getAllEquipment = useCallback(() => 
    get('/api/equipment'), [get]);
  
  const getAllConsumables = useCallback(() => 
    get('/api/consumables'), [get]);

  return {
    getFullInventory,
    getEquipment,
    getConsumables,
    getAllItems,
    getAllEquipment,
    getAllConsumables,
    loading,
    error,
  };
}

// hooks/useCharacters.ts
export function useCharacters() {
  const { get, post, put, loading, error } = useApi();
  const [characters, setCharacters] = useState([]);
  
  // === PERSONAJES ===
  const getMyCharacters = useCallback(async () => {
    const data = await get('/api/user-characters');
    setCharacters(data.characters);
    return data;
  }, [get]);
  
  const getCharacterById = useCallback((id: string) => 
    get(`/api/user-characters/${id}`), [get]);
  
  const getCharacterStats = useCallback((characterId: string) => 
    get(`/api/characters/${characterId}/stats`), [get]);
  
  // === ACCIONES ===
  const equipItem = useCallback((characterId: string, itemId: string, slot: string) => 
    post(`/api/characters/${characterId}/equip`, { itemId, slot }), [post]);
  
  const unequipItem = useCallback((characterId: string, slot: string) => 
    post(`/api/characters/${characterId}/unequip`, { slot }), [post]);
  
  const useConsumable = useCallback((characterId: string, consumableId: string) => 
    post(`/api/characters/${characterId}/use-consumable`, { consumableId }), [post]);
  
  const healCharacter = useCallback((characterId: string) => 
    post(`/api/characters/${characterId}/heal`, {}), [post]);
  
  const reviveCharacter = useCallback((characterId: string) => 
    post(`/api/characters/${characterId}/revive`, {}), [post]);
  
  const evolveCharacter = useCallback((characterId: string) => 
    post(`/api/characters/${characterId}/evolve`, {}), [post]);

  return {
    characters,
    getMyCharacters,
    getCharacterById,
    getCharacterStats,
    equipItem,
    unequipItem,
    useConsumable,
    healCharacter,
    reviveCharacter,
    evolveCharacter,
    loading,
    error,
  };
}

// hooks/useAchievements.ts
export function useAchievements() {
  const { get, loading, error } = useApi();
  
  const getAllAchievements = useCallback((categoria?: string, page = 0, limit = 50) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (categoria) params.set('categoria', categoria);
    return get(`/api/achievements?${params}`);
  }, [get]);
  
  const getUserAchievements = useCallback((userId: string) => 
    get(`/api/achievements/${userId}`), [get]);

  return { getAllAchievements, getUserAchievements, loading, error };
}
```

---

## 5. CHAT (Bonus)

### Endpoints de Chat

```typescript
// GET /api/chat/messages?type=global&limit=50
// Obtener mensajes del chat

// POST /api/chat/global
// Body: { "content": "Hola a todos!" }

// POST /api/chat/private
// Body: { "toUserId": "user002", "content": "Hola!" }

// POST /api/chat/party
// Body: { "partyId": "party001", "content": "Listo para la dungeon?" }
```

---

## Resumen de Endpoints

### Inventario
| Endpoint | Método | Auth | Pantalla | Propósito |
|----------|--------|------|----------|-----------|
| `/inventory` | GET | ✅ | Inventario | Todo mi inventario |
| `/inventory/equipment` | GET | ✅ | Tab Equipo | Solo equipamiento |
| `/inventory/consumables` | GET | ✅ | Tab Consumibles | Solo consumibles |
| `/items` | GET | ❌ | Catálogo | Todos los items del juego |
| `/equipment` | GET | ❌ | Catálogo | Todo el equipamiento |
| `/consumables` | GET | ❌ | Catálogo | Todos los consumibles |

### Personajes
| Endpoint | Método | Auth | Pantalla | Propósito |
|----------|--------|------|----------|-----------|
| `/user-characters` | GET | ✅ | Lista personajes | Mis personajes |
| `/user-characters/:id` | GET | ✅ | Detalle | Un personaje |
| `/characters/:id/stats` | GET | ✅ | Detalle | Stats calculadas |
| `/characters/:id/equip` | POST | ✅ | Equipar | Poner item |
| `/characters/:id/unequip` | POST | ✅ | Equipar | Quitar item |
| `/characters/:id/use-consumable` | POST | ✅ | Varios | Usar poción |
| `/characters/:id/heal` | POST | ✅ | Curación | Curar personaje |
| `/characters/:id/revive` | POST | ✅ | Revivir | Revivir muerto |
| `/characters/:id/evolve` | POST | ✅ | Evolución | Subir etapa |
| `/characters/:id/add-experience` | POST | ✅ | Admin | Dar EXP |
| `/characters/:id/level-up` | PUT | ✅ | Level up | Subir nivel |

### Logros
| Endpoint | Método | Auth | Pantalla | Propósito |
|----------|--------|------|----------|-----------|
| `/achievements` | GET | ❌ | Logros | Todos los logros |
| `/achievements/:userId` | GET | ❌ | Perfil | Logros de un usuario |

### Chat
| Endpoint | Método | Auth | Pantalla | Propósito |
|----------|--------|------|----------|-----------|
| `/chat/messages` | GET | ✅ | Chat | Obtener mensajes |
| `/chat/global` | POST | ✅ | Chat | Mensaje global |
| `/chat/private` | POST | ✅ | Chat | Mensaje privado |
| `/chat/party` | POST | ✅ | Chat | Mensaje de party |

---

**Última Actualización**: 2 de febrero de 2026
