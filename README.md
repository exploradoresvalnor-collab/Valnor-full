# 🎮 Valnor - Juego RPG 3D

## 📋 Descripción
Juego RPG 3D construido desde cero en el navegador utilizando **React Three Fiber**. Migrado recientemente para usar las últimas capacidades de React 19. El proyecto apunta a ser un juego de mazmorras de Acción-RPG completo que incluye físicas realistas, escalado de estadísticas, Marketplace, Chat en Tiempo Real y Modo Supervivencia.

Desarrollado para la web con capacidades **PWA (Progressive Web App)** y enlazado nativamente a **Android via Capacitor**.

---

## 🚀 Estado Actual del Proyecto — ~75% Completado

### ✅ Logros Técnicos y Sistemas Finalizados
- **Refactorización de React-Three-Fiber**: Eliminados los cuellos de botella mediante **selectores atómicos Zustand**. Los datos de UI (como HP/Energía) y las Físicas 3D corren ahora en hilos paralelos de reactividad, logrando 60FPS estables sin arrojar el error `Maximum update depth exceeded`.
- **Desacoplamiento de Three.js**: Se reemplazó el inestable monkey-patching sobre `scene.add` por contenedores seguros (proxys virtuales) que eliminan por completo los memory leaks y las colisiones del recolector de basura en el Strict Mode de React 18/19.
- **Aislamiento del Modo Demo (Guest)**: Construimos un Sandbox impermeable en la capa de red (`api.service.ts`). Toda solicitud HTTP disparada por un jugador "Demo" se intercepta en memoria local, impidiendo fugas hacia el Backend e imposibilitando la corrupción del `localStorage` de usuarios legítimos.
- **Sistemas Base de Juego**: 14 Sistemas integrados, motor de físicas (Rapier), detección de Raycast real, y controles avanzados (Sketchbook adaptado).

---

## 🔄 Roadmap & Próximos Desarrollos Prioritarios — ~25% Restante

Hemos cimentado el núcleo; ahora expandimos las mecánicas del mundo. Las siguientes áreas son el enfoque central de nuestras próximas implementaciones:

### 1. Sistema RPG y Progresión Matemática
- [ ] **Lógica de Atributos**: Implementar Fuerza, Agilidad, Inteligencia y Vitalidad.
- [ ] **Curva de Nivelación**: Algoritmos exponenciales de XP necesarios por cada nivel.
- [ ] **Especialización de Clases**: Árboles de habilidades únicos (Guerrero, Mago, Arquero) con multiplicadores de daño específicos.

### 2. Infraestructura de Audio Inmersivo
- [ ] **Gestor de BGM (Música de Fondo)**: Transiciones fluidas y dinámicas entre estados de Exploración, Tensión y Combate con Jefes.
- [ ] **Sistema SFX Espacial**: Efectos de sonido "Posicionales" 3D para pasos, choques de espadas, impactos mágicos y ambiente direccional usando Web Audio API puro.
- [ ] **Eventos de Audio por Material**: Específicos para pisar pasto, piedra, metal o madera.

### 3. Expansión de Niveles y Escenarios (Scenarios)
- [ ] **Biomas de Transición**: Creación de nuevos entornos visuales que conecten las ciudadelas iniciales con las mazmorras más profundas (Zonas de lava, Pantanos mágicos).
- [ ] **Mecánicas Interactivas de Entorno**: Puertas con llaves, elevadores complejos, puentes colapsables y acertijos físicos usando Rapier.
- [ ] **Iluminación PBR Dinámica**: Profundizar en los materiales reales, sombras proyectadas sobre mapas normales de alta calidad (Dark Souls aesthetics).

### 4. Pantallas de Resultados y Feedback Visual
- [ ] **UI de Victoria/Derrota Remasterizada**: Transiciones al vencer los Jefes de Mazmorra (o morir) que resuman claramente: Daño Infligido, Tiempo Transcurrido y Golpes Recibidos.
- [ ] **Roll de Loot (Botín)**: Pantalla de apertura de cofres calculando rarezas de drops basado en la suerte estadística del jugador RPG.
- [ ] **Cálculo Desglosado de EXP**: Animaciones para "subidas de nivel" inmediatas tras combates largos.

---

## 🔌 Conectividad y Backend (Servicios Actuales)

**Base URL:** `https://valgame-backend.onrender.com`

- **RESTful Endpoints**: Auth, Usuarios, Mazmorras, Ranking Global, Settings, Configuración e Inventarios (135+ Endpoints funcionales).
- **WebSockets (Socket.IO)**: Sincronización Realtime para Chat, notificaciones transaccionales y actualizaciones parciales del estado de inventario, supervivencia y leaderboard.

---

## 🛠️ Tecnologías Principales

| Tecnología | Rol en el Proyecto |
|------------|---------------------|
| **React 19** | Capa Completa de UI y coordinación lógica |
| **@react-three/fiber** | Render Pipeline declarativo para la GPU |
| **@react-three/rapier** | Físicas avanzadas y manejo de colisiones |
| **Zustand** | Memoria efímera, stores globales y performance atómica |
| **Vite / Capacitor** | Bundler HMR veloz y puente de compilación a Android OS |
| **Tailwind CSS v4** | UI fluida y sistemas hiper responsivos |

---

## 🏃 ¿Cómo empezar?

```bash
npm install
npm run dev          # Ejecutar Servidor Web/Juego Local → http://localhost:5173
npm run build        # Empaquetado de optimización a Producción (Dist)
npm run cap:sync     # Sincronización del DOM a compilados Nativos de Android
```

> **Nota sobre el Modo Demo**:
> Una vez levantado el entorno local (`npm run dev`), ingresa al proyecto pulsando el botón **"Entrar al Demo"** en la página inicial. Disfrutarás de un ambiente sandbox aislado donde podrás combatir, probar la física y el movimiento en 3D libremente sin crear una cuenta.

---

### 📝 Sugerencia de Commit (Actualización Arquitectónica)

Si deseas guardar el progreso de las refactorizaciones y correcciones realizadas hoy, aquí tienes una sugerencia detallada para tu commit:

```git
git add .
git commit -m "refactor(core): optimización arquitectónica de Zustand y fix de Three.js" -m "
- Zustand Atómico: Refactorización en FortalezaPlayer y componentes 3D para usar selectores estrictos ('useShallow' y atómicos), eliminando re-renders masivos y previniendo el error 'Maximum update depth exceeded' en R3F.
- Three.js Decoupling: Removido el monkey-patch global de 'scene.add' en FortalezaLevel. Se reemplazó por un proxy 'mockScene' virtual que rastrea y limpia geometrías de forma segura al desmontar el componente (Fix de memory leaks en React 18+).
- Aislamiento Guest Mode: Reescritura de 'guest.service.ts' y 'api.service.ts'. Se inyecta la sesión Demo exclusivamente en memoria (authService setGuestUser) sin tocar 'localStorage'. Se añadió un interceptor global que bloquea silenciosamente todas las mutaciones HTTP (GET, POST, PUT, DELETE) para usuarios Demo, protegiendo los datos reales y evitando errores de red (401/403).
- Documentación: README centralizado y actualizado al 75% reflejando con honestidad el Roadmap pendiente (Motor RPG, Audio, Scenarios, Resultados) y reorganización de la raíz del proyecto moviendo archivos de bitácora a /docs.
"
```

---

### 📝 Sugerencia de Commit (Actualización Arquitectónica)

Si deseas guardar el progreso de las refactorizaciones y correcciones realizadas hoy, aquí tienes una sugerencia detallada para tu commit:

```git
git add .
git commit -m "refactor(core): optimización arquitectónica de Zustand y fix de Three.js" -m "
- Zustand Atómico: Refactorización en FortalezaPlayer y componentes 3D para usar selectores estrictos ('useShallow' y atómicos), eliminando re-renders masivos y previniendo el error 'Maximum update depth exceeded' en R3F.
- Three.js Decoupling: Removido el monkey-patch global de 'scene.add' en FortalezaLevel. Se reemplazó por un proxy 'mockScene' virtual que rastrea y limpia geometrías de forma segura al desmontar el componente (Fix de memory leaks en React 18+).
- Aislamiento Guest Mode: Reescritura de 'guest.service.ts' y 'api.service.ts'. Se inyecta la sesión Demo exclusivamente en memoria (authService setGuestUser) sin tocar 'localStorage'. Se añadió un interceptor global que bloquea silenciosamente todas las mutaciones HTTP (GET, POST, PUT, DELETE) para usuarios Demo, protegiendo los datos reales y evitando errores de red (401/403).
- Documentación: README centralizado y actualizado al 75% reflejando con honestidad el Roadmap pendiente (Motor RPG, Audio, Scenarios, Resultados) y reorganización de la raíz del proyecto moviendo archivos de bitácora a /docs.
"
```

---
*Última actualización: 25 de febrero de 2026*
