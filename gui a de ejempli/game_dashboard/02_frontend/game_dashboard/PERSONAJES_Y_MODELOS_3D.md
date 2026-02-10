# Sistema de Personajes: Backend → Frontend → 3D

Esta guía explica cómo se identifica un personaje en el backend y cómo conectarlo con el modelo 3D en Three.js.

---

## 🔑 ¿Cómo se identifica un personaje?

### Estructura en MongoDB

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND (MongoDB)                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  Colección: base_characters (plantilla de cada personaje)                               │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │ {                                                                               │    │
│  │   "id": "vision-espectral",          ← ID ÚNICO (slug, minúsculas, guiones)    │    │
│  │   "nombre": "Visión Espectral",       ← Nombre visible para el jugador         │    │
│  │   "imagen": "/characters/vision-espectral.png",                                 │    │
│  │   "stats": { "atk": 80, "vida": 1200, "defensa": 40 },                          │    │
│  │   "evoluciones": [...]                                                          │    │
│  │ }                                                                               │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                         │
│  Colección: users.personajes[] (personajes que tiene cada usuario)                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │ {                                                                               │    │
│  │   "personajeId": "vision-espectral",  ← REFERENCIA al base_character            │    │
│  │   "nivel": 25,                                                                   │    │
│  │   "etapa": 2,                                                                    │    │
│  │   "rango": "B",                                                                  │    │
│  │   "stats": { "atk": 120, "vida": 1800, "defensa": 60 }, ← Calculados por nivel  │    │
│  │   "saludActual": 1500,                                                           │    │
│  │   "saludMaxima": 1800,                                                           │    │
│  │   "estado": "saludable"                                                          │    │
│  │ }                                                                               │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Personajes Base Disponibles

| ID (personajeId) | Nombre visible | Para modelo 3D usar |
|------------------|----------------|---------------------|
| `vision-espectral` | Visión Espectral | `vision-espectral.glb` |
| `sir-nocturno` | Sir Nocturno, Guardián de Sombras | `sir-nocturno.glb` |
| `arcanis` | Arcanis el Místico | `arcanis.glb` |
| `draco-igneo` | Draco Ígneo, Señor de las Llamas | `draco-igneo.glb` |
| `tenebris` | Tenebris, la Bestia Umbría | `tenebris.glb` |
| `fenix-solar` | Fénix Solar | `fenix-solar.glb` |
| `leviatan` | Leviatán | `leviatan.glb` |
| `arbol-caos` | Árbol del Caos | `arbol-caos.glb` |

> **IMPORTANTE**: El nombre del archivo `.glb` DEBE coincidir exactamente con el `personajeId` del backend.

---

## 📥 Respuesta de GET /api/user/me

```json
{
  "personajes": [
    {
      "personajeId": "vision-espectral",   // ← USAR PARA: cargar modelo 3D, llamar APIs
      "nombre": "Visión Espectral",        // ← USAR PARA: mostrar al jugador en UI
      "imagen": "/characters/vision-espectral.png",  // ← USAR PARA: avatar 2D
      "nivel": 25,
      "etapa": 2,
      "rango": "B",
      "saludActual": 1500,
      "saludMaxima": 1800,
      "estado": "saludable",
      "equipamiento": [...]
    }
  ]
}
```

---

## 🎮 Conexión con Three.js

### Cargar el modelo 3D correcto

```tsx
// utils/modelLoader.ts
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const MODEL_BASE_PATH = '/assets/models/characters/';

/**
 * Carga el modelo 3D de un personaje usando su personajeId
 * El nombre del archivo .glb debe coincidir EXACTAMENTE con personajeId
 */
export async function loadCharacterModel(personajeId: string): Promise<THREE.Group> {
  const loader = new GLTFLoader();
  
  // El modelo 3D debe llamarse igual que el personajeId
  // Ejemplo: "vision-espectral" → "/assets/models/characters/vision-espectral.glb"
  const modelPath = `${MODEL_BASE_PATH}${personajeId}.glb`;
  
  const gltf = await loader.loadAsync(modelPath);
  return gltf.scene;
}
```

### Ejemplo de uso en componente

```tsx
// components/GameScene.tsx
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { loadCharacterModel } from '../utils/modelLoader';

interface GameSceneProps {
  selectedCharacter: {
    personajeId: string;
    nombre: string;
  };
}

function GameScene({ selectedCharacter }: GameSceneProps) {
  const sceneRef = useRef<THREE.Scene>();

  useEffect(() => {
    if (!selectedCharacter || !sceneRef.current) return;

    // selectedCharacter.personajeId = "vision-espectral"
    loadCharacterModel(selectedCharacter.personajeId)
      .then(model => {
        sceneRef.current?.add(model);
        console.log(`Modelo ${selectedCharacter.nombre} cargado correctamente`);
      })
      .catch(err => {
        console.error(`Error cargando modelo ${selectedCharacter.personajeId}:`, err);
      });
  }, [selectedCharacter]);

  // ... resto del componente Three.js
}
```

---

## 📁 Estructura de Archivos 3D Requerida

```
frontend/
└── public/
    └── assets/
        └── models/
            └── characters/
                ├── vision-espectral.glb     ← Debe coincidir con personajeId
                ├── sir-nocturno.glb
                ├── arcanis.glb
                ├── draco-igneo.glb
                ├── tenebris.glb
                ├── fenix-solar.glb
                ├── leviatan.glb
                └── arbol-caos.glb
```

---

## 🪝 Hook Completo para Selección de Personaje

```tsx
// hooks/useCharacterSelection.ts
import { useState, useCallback, useEffect } from 'react';

interface Character {
  personajeId: string;  // ID único - usar para cargar modelo 3D
  nombre: string;       // Nombre visible
  imagen: string;       // Avatar 2D
  nivel: number;
  etapa: number;
  rango: string;
  saludActual: number;
  saludMaxima: number;
  estado: 'saludable' | 'herido';
}

export function useCharacterSelection() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar personajes del usuario
  useEffect(() => {
    fetch('/api/user/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setCharacters(data.personajes || []);
        setLoading(false);
      });
  }, []);

  // Personaje seleccionado (objeto completo)
  const selectedCharacter = characters.find(c => c.personajeId === selectedCharacterId);

  // Seleccionar personaje (validando que no esté herido)
  const selectCharacter = useCallback((personajeId: string) => {
    const char = characters.find(c => c.personajeId === personajeId);
    if (char?.estado === 'herido') {
      throw new Error('No puedes seleccionar un personaje herido. Revívelo primero.');
    }
    setSelectedCharacterId(personajeId);
  }, [characters]);

  return {
    characters,
    selectedCharacter,
    selectedCharacterId,
    selectCharacter,
    loading,
    
    // Helper para obtener ruta del modelo 3D
    getModelPath: (char: Character) => `/assets/models/characters/${char.personajeId}.glb`,
  };
}
```

---

## 🖼️ Componente de Selección Visual

```tsx
// components/CharacterSelector.tsx
import { useCharacterSelection } from '../hooks/useCharacterSelection';

interface CharacterSelectorProps {
  onSelect?: (character: Character) => void;
}

function CharacterSelector({ onSelect }: CharacterSelectorProps) {
  const { characters, selectedCharacterId, selectCharacter, loading } = useCharacterSelection();

  if (loading) return <div>Cargando personajes...</div>;

  return (
    <div className="character-grid">
      {characters.map(char => (
        <div 
          key={char.personajeId}
          className={`
            character-slot 
            ${char.estado === 'herido' ? 'disabled' : ''} 
            ${selectedCharacterId === char.personajeId ? 'selected' : ''}
          `}
          onClick={() => {
            if (char.estado !== 'herido') {
              selectCharacter(char.personajeId);
              onSelect?.(char);
            }
          }}
        >
          {/* Avatar 2D */}
          <img src={char.imagen} alt={char.nombre} />
          
          {/* Mostrar NOMBRE visible al jugador */}
          <h4>{char.nombre}</h4>
          
          {/* Info */}
          <span>Nv. {char.nivel}</span>
          <span>Rango {char.rango}</span>
          
          {/* Estado herido */}
          {char.estado === 'herido' && (
            <div className="overlay-herido">💀 HERIDO</div>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 📊 Resumen: ¿Qué Campo Usar para Qué?

| Campo | Ejemplo | Usar para |
|-------|---------|-----------|
| `personajeId` | `"vision-espectral"` | Cargar modelo 3D, identificar en APIs, nombre de archivo |
| `nombre` | `"Visión Espectral"` | Mostrar al jugador en pantalla (UI) |
| `imagen` | `"/characters/vision-espectral.png"` | Avatar 2D en selectores, cards, inventario |

---

## 🔄 Flujo Completo: Backend → Frontend → Three.js

```
┌─────────────────────────────────────────────────────────────────────────┐
│  FLUJO: Backend → Frontend → Three.js                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. GET /api/user/me                                                    │
│         ↓                                                               │
│  2. Respuesta:                                                          │
│     { personajes: [{ personajeId: "vision-espectral", ... }] }          │
│         ↓                                                               │
│  3. Frontend muestra selector con char.nombre ("Visión Espectral")      │
│         ↓                                                               │
│  4. Usuario clickea → guardamos char.personajeId                        │
│         ↓                                                               │
│  5. Iniciar partida:                                                    │
│     POST /api/survival/start { characterId: "vision-espectral" }        │
│         ↓                                                               │
│  6. Cargar escena Three.js:                                             │
│     loadCharacterModel("vision-espectral")                              │
│     → busca /assets/models/characters/vision-espectral.glb              │
│         ↓                                                               │
│  7. ¡Modelo 3D aparece en la escena!                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Errores Comunes

### 1. Modelo no encontrado
```
Error: Failed to load /assets/models/characters/sombra.glb
```
**Causa**: El personaje en backend se llama `"vision-espectral"` pero el archivo se llama `sombra.glb`
**Solución**: Renombrar el archivo a `vision-espectral.glb`

### 2. Mayúsculas/minúsculas
```
Error: Failed to load /assets/models/characters/Vision-Espectral.glb
```
**Causa**: El `personajeId` usa minúsculas (`vision-espectral`) pero el archivo tiene mayúsculas
**Solución**: Siempre usar minúsculas y guiones en nombres de archivo

### 3. Personaje herido no puede jugar
```
Error: No puedes seleccionar un personaje herido. Revívelo primero.
```
**Solución**: Llamar a `POST /api/characters/:personajeId/revive` (cuesta 50 VAL)

---

**Ver también:**
- [COMBATE_Y_DUNGEONS.md](./COMBATE_Y_DUNGEONS.md) - División Frontend vs Backend
- [DASHBOARD_Y_TEAMS.md](./DASHBOARD_Y_TEAMS.md) - Armado de equipos
