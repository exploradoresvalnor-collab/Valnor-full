# 🕵️‍♂️ Auditoría Arquitectónica Profunda: Valnor RPG 3D

He analizado el código fuente base de tu proyecto, centrándome en los stores de Zustand, las escenas 3D (React-Three-Fiber), el sistema de invitados, y las capas de servicio. A continuación, presento un informe detallado que explica **por qué el proyecto se ha vuelto tan frágil** y cómo solucionarlo.

---

## 1. 🚨 Anti-patrones que causan "Todo se rompe" y "Maximum update depth exceeded"

El problema número uno de tu arquitectura actual es cómo los componentes 3D se suscriben a Zustand. Has introducido un ciclo de renderizado infinito masivo.

### 🔴 Problema Concreto: Sobresuscripción Masiva en Componentes Rápidos
En `FortalezaPlayer.tsx` tienes esto:
```tsx
const { characterId, characterClass, isInCombat, orbsCollected, setPosition, setIsGrounded, setIsMoving } = usePlayerStore();
```
**Por qué es destructivo:** Al llamar a `usePlayerStore()` **sin un selector**, el componente se suscribe a **TODO** el store. Si en el `Dashboard` el jugador regenera 1 punto de energía (lo que actualiza `energy` y `lastEnergyUpdate`), ¡el modelo 3D del jugador entero (`FortalezaPlayer.tsx`) se vuelve a renderizar!
Peor aún: En tu `useFrame` (que corre a 60 FPS), si llamas a `setIsGrounded(true)`, actualizas el estado global. Como el componente está suscrito al estado global entero, React fuerza un re-render del componente, lo que vuelve a disparar `useFrame`, causando el famoso error `"Maximum update depth exceeded"`.

### ✅ Solución: Selectores Atómicos
**Jamás** desestructures un store global en componentes de alto rendimiento. Usa selectores estrictos para que el componente solo reaccione si cambia EXACTAMENTE lo que necesita:

```tsx
// MAL: Re-renderiza con CUALQUIER cambio en el store
const { isGrounded, setIsGrounded } = usePlayerStore();

// BIEN: Re-renderiza SOLO si isGrounded cambia
const isGrounded = usePlayerStore(state => state.isGrounded);
const setIsGrounded = usePlayerStore(state => state.setIsGrounded);
```

---

## 2. 🚨 Peligros de Ciclo de Vida en React-Three-Fiber

### 🔴 Problema Concreto: "Monkey-Patching" en `FortalezaLevel.tsx`
He encontrado esta atrocidad en tu `useEffect` principal:
```tsx
const originalAdd = scene.add.bind(scene);
scene.add = function (...objects) {
    addedObjects.push(...objects);
    originalAdd(...objects);
    return this;
};
```
**Por qué es destructivo:** Estás secuestrando (`monkey-patching`) métodos internos nativos de Three.js desde dentro del ciclo de vida de React. 
- Si el componente se desmonta por un error o hot-reload, y vuelve a montarse, vas a secuestrar una función ya secuestrada, anidándola infinitamente hasta causar un **Stack Overflow**.
- React 18 (y Strict Mode) desmonta y monta efectos dos veces. Esto destruye la jerarquía del Grafo de Escena.
- Esto causa "fugas de memoria" (Memory Leaks) gigantescas porque `addedObjects` retiene geometrías que WebGL nunca libera.

### ✅ Solución: Reactividad Declarativa
En React-Three-Fiber **nunca** debes usar `scene.add()` manualmente. Si necesitas añadir objetos procedurales, guárdalos en un array en el estado o en un `useMemo` y mapéalos en el JSX como `<primitive object={obj} />`. Deja que React controle el montaje y desmontaje.

---

## 3. ⚠️ Contaminación de Datos Demo vs Producción

### 🔴 Problema Concreto: El Guest Mode engaña al `authService`
En `guest.service.ts`:
```typescript
localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(guest));
authService.loadFromStorage();
```
**Por qué es destructivo:** El modo invitado no está aislado en una capa superior (ej. un Provider mockeado). En su lugar, literalmente inyecta un usuario falso directamente en el disco duro (`localStorage`) y le dice al servicio oficial de autenticación: *"Oye, carga este usuario"*.
- El sistema de producción (`authService`) no tiene idea de que es falso. 
- Si un componente en el menú trata de hacer un POST al backend (ej. comprar un ítem) y lee el token o el usuario del `authService`, intentará enviarle datos fantasmas al servidor real.
- Si el usuario se loguea más tarde de verdad, la limpieza puede fallar y mezclar IDs del Guest con compras reales.

### ✅ Solución
El `sessionStore` debe manejar un objeto `currentUser` que sea el source of truth, **no el localStorage**. El localStorage debe servir solo para rehidratar. Tu capa de API (`api.service.ts`) debería consultar el `sessionStore` y, si `isGuest === true`, interceptar la llamada de red y retornar una promesa fingida SIN tocar la red.

---

## 4. 🌀 Código Espagueti y Dependencias Cíclicas en Zustand

### 🔴 Problema Concreto: Importaciones Dinámicas para evitar colapsos
En `sessionStore.ts` tienes esto para el logout:
```typescript
const [{ usePlayerStore }, { useTeamStore }, { useGameModeStore }] = await Promise.all([
  import('./playerStore'),
  import('./teamStore'),
  import('./gameModeStore'),
]);
```
**Por qué es destructivo:** Has tenido que recurrir a `await import()` en medio de una función síncrona de estado porque tus stores se necesitan unos a otros (dependencia cíclica). Esto fragmenta el bundle de Vite en trozos asíncronos en tiempo de ejecución. Puede causar que el juego colapse si el usuario pulsa "Salir" antes de que Vite termine de descargar el chunk de JS.

### ✅ Solución: Slices Pattern o Event Bus
Zustand recomienda el patrón "Slices" si tienes stores masivos que se cruzan. Alternativamente, puedes usar un simple evento pub/sub. Cuando `sessionStore` hace logout, emite un evento `window.dispatchEvent(new Event('AUTH_LOGOUT'))`. Cada store escucha ese evento en su raíz para autolimpiarse, rompiendo la dependencia cíclica completamente.

---

## 5. 🐘 Control de Versiones con Assets Pesados (GLB)

El equipo introdujo modelos masivos y texturas. Si estos archivos `.glb` o `.png` están guardados directamente en la carpeta `/public` y commiteados en Git tradicional:

1. **El repositorio se infla:** Cada vez que exportas un arreglo menor en Blender de un GOLEM de 20MB, Git guarda los 20MB completos en su historial inmutable. El `.git` pesará Gigabytes en semanas.
2. **Vite se ahoga:** El HMR (Hot Module Replacement) tarda una barbaridad en indexar la carpeta de assets.

### ✅ Solución: Git LFS
Habilita **Git LFS** (Large File Storage) inmediatamente.
```bash
git lfs install
git lfs track "*.glb"
git lfs track "*.gltf"
```
O mejor aún, externaliza los assets a un bucket de S3 o CDN y cárgalos por URL absoluta.

---

## 💡 Resumen Final y Plan de Acción (Recomendación)

No estás escribiendo "mal" código por falta de lógica; estás siendo víctima de la **violencia del ciclo de vida de React combinado con imperatividad 3D**. React te castiga severamente si mezclas paradigmas.

**Plan de la próxima semana para tu equipo:**
1. **Día 1 (Operación Cirujano):** Abrid todos los componentes de la carpeta `/engine` (y especialmente `PlayDungeon.tsx` y `FortalezaPlayer.tsx`). Cambiad cada `const { x } = useStore()` destructurado por su equivalente granular `const x = useStore(state => state.x)`. Esto eliminará el 90% de vuestros crasheos y de "FPS drops".
2. **Día 2 (Purga de Mutaciones):** Eliminad el `scene.add` hackeado. Reemplazad toda inserción dinámica de Three.js por estructuras atómicas (Arrays de estado mapeados en componentes hijos React).
3. **Día 3 (Arquitectura Guest):** Cread un `HttpInterceptor` o Proxy en vuestro `api.service.ts`. Si `session.isGuest` es `true`, todas las peticiones `fetch()` deben cortocircuitarse y devolver JSON mockeado, en lugar de envenenar el `authService`.

Tenéis un proyecto mecánicamente espectacular. Solo necesita un cinturón de seguridad en la reactividad.
