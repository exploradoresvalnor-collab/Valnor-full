# Alias de Compatibilidad y Endpoints Canónicos

Este documento centraliza todos los alias temporales para facilitar la transición del frontend.

## Dungeons (RPG)

| Endpoint Canónico | Alias Temporal | Estado | Deprecación |
|-------------------|----------------|--------|-------------|
| `POST /api/dungeons/:id/start` | `POST /api/dungeons/enter/:id` | Activo | TBD (sesiones reales) |
| `GET /api/dungeons/:id/progress` | `GET /api/dungeons/:id/session/:sessionId` | Activo | TBD (sesiones reales) |

**Usar siempre los endpoints canónicos**. Los alias existen solo para compatibilidad temporal mientras se implementan sesiones reales.

## Rankings

| Endpoint Canónico | Alias Temporal | Estado | Deprecación |
|-------------------|----------------|--------|-------------|
| `GET /api/rankings/period/:periodo` | `GET /api/rankings/period/:period` | Activo | N/A (conveniencia) |

## WebSocket - Eventos

### Dungeons vs Battle
- **`dungeon:*`**: eventos específicos del modo Dungeons (RPG). **Usar estos para el modo RPG**.
- **`battle:*`**: eventos genéricos de combate. Pueden solaparse con `dungeon:*` pero son para combates generales.

### Rankings
**Evento canónico:** `rankings:update`

**Payload unificado:**
```json
{
  "reason": "dungeon_victory" | "survival_victory" | "periodic_recalc",
  "affectedCategories": ["general", "dungeon_wins"],
  "timestamp": "ISO-8601"
}
```

Acción recomendada: tras recibir este evento, refrescar `GET /api/rankings/me`.

### Survival
**Evento:** `survival:end`

**Payload unificado:**
```json
{
  "sessionId": "string",
  "totalWaves": 5,
  "durationMs": 123456,
  "rewards": {
    "totalPoints": 999,
    "items": []
  }
}
```

## Notas
- Este documento se actualiza cuando se añaden o deprecan alias.
- Los alias marcados como "TBD" permanecerán hasta que se complete la migración.
