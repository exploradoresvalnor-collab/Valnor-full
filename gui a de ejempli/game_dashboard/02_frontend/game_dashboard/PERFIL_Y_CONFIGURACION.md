# Perfil, Configuración y Notificaciones

**Framework**: React + TypeScript

## Resumen de Endpoints

| Área | Base Path | Descripción |
|------|-----------|-------------|
| Perfil | `/api/user` | Datos del usuario |
| Configuración | `/api/user/settings` | Preferencias del juego |
| Notificaciones | `/api/notifications` | Sistema de notificaciones |

---

## 1. Perfil de Usuario

### GET `/api/user/me` (Requiere Auth)

Obtiene el perfil completo del usuario autenticado.

**Response:**
```json
{
  "id": "userId",
  "email": "user@email.com",
  "username": "Player123",
  "isVerified": true,
  "tutorialCompleted": true,
  
  "val": 1000,
  "boletos": 5,
  "energia": 100,
  "energiaMaxima": 100,
  "tiempoParaSiguienteRegeneracionEnergia": 300,
  "evo": 50,
  "invocaciones": 3,
  "evoluciones": 2,
  "boletosDiarios": 3,
  
  "personajes": [
    {
      "personajeId": "char001",
      "nombre": "Guerrero",
      "imagen": "/assets/chars/guerrero.png",
      "rango": "B",
      "nivel": 25,
      "etapa": 1,
      "progreso": 45,
      "experiencia": 12500,
      "saludActual": 850,
      "saludMaxima": 1000,
      "estado": "saludable",
      "equipamiento": [
        {
          "id": "equip001",
          "nombre": "Espada de Hierro",
          "tipoItem": "weapon",
          "imagen": "/assets/items/sword.png",
          "slot": "weapon"
        }
      ],
      "activeBuffs": []
    }
  ],
  
  "inventarioEquipamiento": [
    { "id": "equip002", "nombre": "Escudo", "tipoItem": "shield", "slot": "shield" }
  ],
  
  "inventarioConsumibles": [
    { "id": "cons001", "consumableId": "cons001", "nombre": "Poción HP", "tipoItem": "consumable", "usos_restantes": 3 }
  ],
  
  "paquetes": [],
  
  "limiteInventarioEquipamiento": 50,
  "limiteInventarioConsumibles": 30,
  "limiteInventarioPersonajes": 20,
  "personajeActivoId": "char001",
  "receivedPioneerPackage": true,
  "walletAddress": null,
  "fechaRegistro": "2025-01-15T10:00:00Z",
  "ultimaActualizacion": "2025-11-20T15:30:00Z"
}
```

---

### GET `/api/user/profile/:userId` (Público, NO requiere Auth)

Perfil público de otro jugador (datos limitados por privacidad).

**Response:**
```json
{
  "exito": true,
  "usuarioId": "userId",
  "nombre": "Player123",
  "emailMasked": "use***@email.com",
  "fechaRegistro": "2025-01-15T10:00:00Z",
  
  "estadisticas": {
    "totalPersonajes": 8,
    "personajesPrincipales": 3,
    "nivelMaximo": 45,
    "experienciaTotal": 125000
  },
  
  "combate": {
    "victorias": 150,
    "derrotas": 30,
    "rachaActual": 5,
    "rachaMaxima": 12
  },
  
  "recursos": {
    "val": 1000,
    "boletos": 5,
    "energia": 100
  },
  
  "personajes": [
    {
      "personajeId": "char001",
      "rango": "B",
      "nivel": 25,
      "experiencia": 12500,
      "saludActual": 850,
      "saludMaxima": 1000,
      "estado": "saludable"
    }
  ],
  
  "logros": {
    "total": 50,
    "desbloqueados": 12
  }
}
```

---

### GET `/api/user/resources` (Requiere Auth)

Versión ligera, solo recursos (para actualizar UI frecuentemente).

**Response:**
```json
{
  "val": 1000,
  "boletos": 5,
  "energia": 100,
  "energiaMaxima": 100,
  "tiempoParaSiguienteRegeneracionEnergia": 300,
  "evo": 50,
  "invocaciones": 3
}
```

---

## 2. Configuración del Usuario

### GET `/api/user/settings` (Requiere Auth)

Obtiene la configuración actual.

**Response:**
```json
{
  "musicVolume": 50,
  "sfxVolume": 50,
  "language": "es",
  "notificationsEnabled": true
}
```

---

### PUT `/api/user/settings` (Requiere Auth)

Actualiza configuración (enviar solo campos a cambiar).

**Request:**
```json
{
  "musicVolume": 75,
  "sfxVolume": 60,
  "language": "en",
  "notificationsEnabled": false
}
```

**Validaciones:**
| Campo | Tipo | Rango | Default |
|-------|------|-------|---------|
| `musicVolume` | number | 0-100 | 50 |
| `sfxVolume` | number | 0-100 | 50 |
| `language` | string | `'es'` \| `'en'` | `'es'` |
| `notificationsEnabled` | boolean | - | `true` |

**Response:**
```json
{
  "message": "Configuración actualizada correctamente",
  "settings": {
    "musicVolume": 75,
    "sfxVolume": 60,
    "language": "en",
    "notificationsEnabled": false
  }
}
```

---

### POST `/api/user/settings/reset` (Requiere Auth)

Restaura valores por defecto.

**Response:**
```json
{
  "message": "Configuración restaurada a valores por defecto",
  "settings": {
    "musicVolume": 50,
    "sfxVolume": 50,
    "language": "es",
    "notificationsEnabled": true
  }
}
```

---

## 3. Notificaciones

### GET `/api/notifications` (Requiere Auth)

Lista notificaciones con paginación.

**Query Params:**
| Param | Default | Descripción |
|-------|---------|-------------|
| `limit` | 20 | Cantidad máxima |
| `skip` | 0 | Offset para paginación |
| `unreadOnly` | `'false'` | Solo no leídas |

**Response:**
```json
{
  "notifications": [
    {
      "_id": "notif001",
      "userId": "userId",
      "type": "marketplace_sale",
      "title": "¡Venta exitosa!",
      "message": "Tu Espada de Hierro se vendió por 500 VAL",
      "isRead": false,
      "createdAt": "2025-11-20T10:00:00Z"
    }
  ],
  "total": 45,
  "limit": 20,
  "skip": 0
}
```

---

### GET `/api/notifications/unread/count` (Requiere Auth)

Contador de no leídas (para badge en UI).

**Response:**
```json
{
  "count": 5
}
```

---

### GET `/api/notifications/:id` (Requiere Auth)

Detalle de una notificación específica.

---

### PUT `/api/notifications/:id/read` (Requiere Auth)

Marca una notificación como leída.

**Response:**
```json
{
  "message": "Notificación marcada como leída",
  "notification": { ... }
}
```

> ⚡ **WebSocket**: Emite evento `notification:read` al marcar como leída.

---

### PUT `/api/notifications/read-all` (Requiere Auth)

Marca TODAS las notificaciones como leídas.

**Response:**
```json
{
  "message": "Todas las notificaciones marcadas como leídas",
  "modifiedCount": 12
}
```

> ⚡ **WebSocket**: Emite evento `notification:read` con `'*'` para indicar todas.

---

### DELETE `/api/notifications/:id` (Requiere Auth)

Elimina una notificación.

**Response:**
```json
{
  "message": "Notificación eliminada correctamente"
}
```

---

## 4. Implementación React

### Hook useSettings

```tsx
// hooks/useSettings.ts
import { useState, useCallback } from 'react';
import { useApi } from './useApi';

interface UserSettings {
  musicVolume: number;
  sfxVolume: number;
  language: 'es' | 'en';
  notificationsEnabled: boolean;
}

export function useSettings() {
  const { get, put, post, loading, error } = useApi();
  const [settings, setSettings] = useState<UserSettings | null>(null);

  const getSettings = useCallback(async () => {
    const data = await get<UserSettings>('/api/user-settings');
    setSettings(data);
    return data;
  }, [get]);

  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    const data = await put('/api/user-settings', newSettings);
    setSettings(data.settings);
    return data;
  }, [put]);

  const resetSettings = useCallback(async () => {
    const data = await post('/api/user-settings/reset', {});
    setSettings(data.settings);
    return data;
  }, [post]);

  return { settings, getSettings, updateSettings, resetSettings, loading, error };
}
```

### Hook useNotifications

```tsx
// hooks/useNotifications.ts
import { useState, useCallback } from 'react';
import { useApi } from './useApi';

interface GameNotification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationParams {
  limit?: number;
  skip?: number;
  unreadOnly?: boolean;
}

export function useNotifications() {
  const { get, put, del, loading, error } = useApi();
  const [notifications, setNotifications] = useState<GameNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const getNotifications = useCallback(async (params: NotificationParams = {}) => {
    const query = new URLSearchParams(params as any).toString();
    const data = await get(`/api/notifications?${query}`);
    setNotifications(data.notifications);
    return data;
  }, [get]);

  const getUnreadCount = useCallback(async () => {
    const data = await get<{ count: number }>('/api/notifications/unread/count');
    setUnreadCount(data.count);
    return data.count;
  }, [get]);

  const markAsRead = useCallback(async (id: string) => {
    return put(`/api/notifications/${id}/read`, {});
  }, [put]);

  const markAllAsRead = useCallback(async () => {
    const data = await put('/api/notifications/read-all', {});
    setUnreadCount(0);
    return data;
  }, [put]);

  const deleteNotification = useCallback(async (id: string) => {
    return del(`/api/notifications/${id}`);
  }, [del]);

  return {
    notifications,
    unreadCount,
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loading,
    error,
  };
}
```

### Componente de Ejemplo

```tsx
// components/SettingsScreen.tsx
import { useEffect, useState } from 'react';
import { useSettings } from '../hooks/useSettings';

function SettingsScreen() {
  const { settings, getSettings, updateSettings, resetSettings, loading } = useSettings();
  const [musicVolume, setMusicVolume] = useState(50);

  useEffect(() => {
    getSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      setMusicVolume(settings.musicVolume);
    }
  }, [settings]);

  const handleSave = async () => {
    await updateSettings({ musicVolume });
  };

  return (
    <div>
      <h2>Configuración</h2>
      <label>
        Música: {musicVolume}%
        <input 
          type="range" 
          min={0} 
          max={100} 
          value={musicVolume}
          onChange={(e) => setMusicVolume(Number(e.target.value))}
        />
      </label>
      <button onClick={handleSave} disabled={loading}>Guardar</button>
      <button onClick={resetSettings}>Restaurar</button>
    </div>
  );
}
```

### Interfaces TypeScript

```typescript
interface UserSettings {
  musicVolume: number;
  sfxVolume: number;
  language: 'es' | 'en';
  notificationsEnabled: boolean;
}

interface GameNotification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationResponse {
  notifications: GameNotification[];
  total: number;
  limit: number;
  skip: number;
}
```

---

## 5. Layout Horizontal - Pantalla de Configuración

```
┌─────────────────────────────────────────────────────────────┐
│  ← Volver                    CONFIGURACIÓN           [👤]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────────────┐  │
│  │                     │  │                             │  │
│  │   🔊 AUDIO          │  │  Música        [====●===]   │  │
│  │   🌐 IDIOMA         │  │                   75%       │  │
│  │   🔔 NOTIFICACIONES │  │                             │  │
│  │   📱 CUENTA         │  │  Efectos       [======●=]   │  │
│  │                     │  │                   85%       │  │
│  │                     │  │                             │  │
│  │   [Restaurar]       │  │                             │  │
│  │                     │  │                             │  │
│  └─────────────────────┘  └─────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Lo que NO existe (futuras mejoras)

| Feature | Estado | Notas |
|---------|--------|-------|
| Tema oscuro/claro | ❌ | Manejar en frontend con localStorage |
| Cambio de username | ❌ | Requiere nuevo endpoint |
| Avatar/foto perfil | ❌ | Requiere upload de imágenes |
| Configuración controles | ❌ | Para mobile con joystick |
| Calidad gráfica | ❌ | Para Three.js (low/med/high) |

---

**Última Actualización**: 2 de febrero de 2026
