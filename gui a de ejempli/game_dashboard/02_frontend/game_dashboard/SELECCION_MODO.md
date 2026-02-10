# Selección de Modo - Gestión Frontend

## Resumen

El modo de juego (RPG/Survival) se maneja **100% en frontend** con `localStorage`. El backend NO necesita saber en qué modo está el jugador.

---

## Implementación

### Almacenamiento Local

```typescript
// Guardar modo seleccionado
localStorage.setItem('valgame_preferredMode', 'rpg'); // o 'survival'

// Leer modo
const mode = localStorage.getItem('valgame_preferredMode') || 'rpg';

// Constantes
const STORAGE_KEY = 'valgame_preferredMode';
type GameMode = 'rpg' | 'survival';
```

### Flujo de Selección

```
Login exitoso
    ↓
¿Existe preferredMode en localStorage?
    ├── SÍ → Ir directo a Dashboard del modo guardado
    └── NO → Mostrar Pantalla de Portales
                ↓
           Usuario selecciona portal
                ↓
           Guardar en localStorage
                ↓
           Navegar a Dashboard correspondiente
```

### React Hook (useGameMode)

```tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'valgame_preferredMode';
type GameMode = 'rpg' | 'survival';

export function useGameMode() {
  const [mode, setModeState] = useState<GameMode | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as GameMode | null;
    setModeState(stored);
  }, []);
  
  const setMode = (newMode: GameMode) => {
    localStorage.setItem(STORAGE_KEY, newMode);
    setModeState(newMode);
  };
  
  const clearMode = () => {
    localStorage.removeItem(STORAGE_KEY);
    setModeState(null);
  };
  
  const requireMode = () => {
    if (!mode) {
      navigate('/portals');
      return false;
    }
    return true;
  };
  
  return { mode, setMode, clearMode, requireMode };
}
```

---

## Rutas Sugeridas (React Router)

| Ruta | Descripción |
|------|-------------|
| `/portals` | Pantalla de selección de portales |
| `/rpg/dashboard` | Dashboard RPG (equipos, mazmorras) |
| `/survival/dashboard` | Dashboard Survival (personaje, ranking) |

### Protected Route Component

```tsx
import { Navigate } from 'react-router-dom';

function RequireModeRoute({ children }: { children: React.ReactNode }) {
  const mode = localStorage.getItem('valgame_preferredMode');
  
  if (!mode) {
    return <Navigate to="/portals" replace />;
  }
  return <>{children}</>;
}
```

---

## Cambio de Modo

El jugador puede cambiar de modo desde:
1. **Menú/Header**: Botón "Cambiar Modo" → vuelve a `/portals`
2. **Configuración**: Toggle para "Recordar mi elección"

```tsx
// Hook para cambiar modo
const { clearMode } = useGameMode();
const navigate = useNavigate();

const switchMode = () => {
  clearMode();
  navigate('/portals');
};
```

---

## Por Qué NO Backend

| Razón | Explicación |
|-------|-------------|
| **No afecta lógica** | RPG usa boletos, Survival usa energía - son independientes |
| **Sin validación cruzada** | El jugador puede tener sesión Survival activa y entrar a Dungeon sin problema |
| **Preferencia visual** | Es solo para determinar qué dashboard mostrar primero |
| **Menos latencia** | localStorage es instantáneo vs llamada API |

---

## Consideración Futura

Si en el futuro se necesita sincronizar el modo entre dispositivos:

```typescript
// El modelo UserSettings ya existe con estos campos:
// musicVolume, sfxVolume, language, notificationsEnabled

// Se podría agregar preferredMode, pero NO es necesario ahora
```

**Endpoint existente**: `PUT /api/user-settings` - ya maneja las preferencias del usuario.

---

**Última Actualización**: 2 de febrero de 2026
