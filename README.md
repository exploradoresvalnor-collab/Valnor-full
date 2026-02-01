# 🎮 Valnor - Juego RPG

## 📋 Descripción
Proyecto de juego RPG migrado desde Angular a React. El proyecto está en fase inicial de desarrollo.

## 🚀 Estado Actual

### ✅ Completado
- **Proyecto base** configurado con Vite + React 19 + TypeScript
- **Splash Screen** migrado desde Angular con animaciones cinematográficas
- **Landing Page** migrada desde Angular con:
  - Navegación responsive (desktop/mobile)
  - Hero con fondo parallax animado
  - Logo con efectos de glow y float
  - Botón CTA con animaciones
  - Footer transparente
  - Soporte para preload de imágenes
  - Animaciones de entrada/salida
- **Assets** copiados (logo.png, caballero_dorado.png, portada_pc.webp, portada_movil.webp, Logo_2.webp)
- **Routing** configurado con react-router-dom

### 🔄 Pendiente de Migrar (desde guía Angular)

#### 🔐 **Auth Module** - Autenticación
- [ ] **Login** - Formulario con validación, conexión a API `/api/auth/login`
- [ ] **Register** - Registro con política de contraseña, API `/api/auth/register`
- [ ] **Verify** - Verificación de email con token
- [ ] **Forgot Password** - Recuperación de contraseña
- [ ] **Reset Password** - Restablecer contraseña con token

#### 🎮 **Demo** - Motor de Juego 3D (Three.js)
- [ ] **ValnorWorld** - Motor del mundo 3D
- [ ] **Engine** - Sistema de físicas, personajes, IA, shaders
- [ ] **Lobby Panel** - Selector de nivel/personaje
- [ ] **Game HUD** - Interfaz durante el juego

#### 📊 **Dashboard** - Panel Principal (requiere auth)
- [ ] Dashboard principal del usuario

#### 🎒 **Inventory** - Inventario (requiere auth)
- [ ] Sistema de inventario

#### 🛒 **Shop** - Tienda (requiere auth)
- [ ] Tienda del juego

#### 🏪 **Marketplace** - Mercado (requiere auth)
- [ ] Mercado de items

#### 🏰 **Dungeon** - Mazmorras (requiere auth)
- [ ] Sistema de mazmorras

#### 🏆 **Ranking** - Rankings (requiere auth)
- [ ] Tablas de clasificación

#### ⚔️ **Survival** - Modo Supervivencia (requiere auth)
- [ ] Modo supervivencia

#### 📚 **Wiki** - Documentación (público)
- [ ] Wiki del juego

---

## 🔌 Servicios del Backend (Endpoints)

| Servicio | Endpoints | Descripción |
|----------|-----------|-------------|
| **AuthService** | `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/verify/:token` | Autenticación |
| **ApiService** | Base para todas las llamadas HTTP con cookies httpOnly | HTTP Client |
| **LoadingService** | - | Spinner global |
| **NotificationService** | - | Toasts/Alertas |
| **DungeonService** | `/api/dungeon/*` | Mazmorras |
| **ItemService** | `/api/items/*` | Items |
| **RankingService** | `/api/ranking/*` | Rankings |
| **SocketService** | WebSocket | Tiempo real |

---

## 📁 Estructura del Proyecto

```
Valnor-juego/
├── public/
│   └── assets/
│       ├── logo.png
│       ├── caballero_dorado.png
│       └── icons/
│           ├── Logo_2.webp
│           ├── portada_pc.webp
│           └── portada_movil.webp
├── src/
│   ├── pages/
│   │   ├── SplashScreen/
│   │   │   ├── index.ts
│   │   │   ├── SplashScreen.tsx
│   │   │   └── SplashScreen.css
│   │   └── Landing/
│   │       ├── index.ts
│   │       ├── Landing.tsx
│   │       └── Landing.css
│   ├── App.tsx          # Router principal
│   ├── main.tsx         # Entry point
│   └── index.css        # Estilos globales
├── index.html
├── package.json
└── vite.config.js
```

## 🛠️ Tecnologías

| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | 19.2.4 | UI Framework |
| Vite | 7.3.1 | Build Tool |
| TypeScript | - | Tipado |
| react-router-dom | 7.6.1 | Navegación |
| three | 0.177.0 | Gráficos 3D (futuro) |
| @react-three/fiber | 9.1.2 | React + Three.js (futuro) |
| @react-three/drei | 10.3.0 | Helpers 3D (futuro) |
| @react-three/rapier | 2.1.0 | Física (futuro) |

## 🏃 Ejecutar Proyecto

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# El proyecto se abrirá en http://localhost:3000
```

## 📝 Commits

### v0.2.0 - Landing Page
- ✅ Landing Page migrada desde Angular
- ✅ Navegación responsive con menú hamburguesa móvil
- ✅ Hero con fondo parallax y animaciones cinematográficas
- ✅ Logo con efectos glow, float y ambient glow
- ✅ CTA button con animaciones y hover effects
- ✅ Footer transparente dentro del hero
- ✅ Soporte para viewport mobile (--vh variable)
- ✅ Preload de imágenes hero
- ✅ Animaciones de entrada/salida suaves

### v0.1.0 - Proyecto Base
- ✅ Setup inicial con Vite + React
- ✅ Splash Screen migrado desde Angular
- ✅ Animaciones cinematográficas (fadeOut, cinematicZoom)
- ✅ Navegación a /landing configurada

---

## 🎯 Próximos Pasos
- Implementar páginas de autenticación (Login, Register)
- Crear la sección Demo
- Implementar Wiki

## 📚 Proyecto Original
Migrado desde: `Angular-game2` (Angular)

---
*Última actualización: 31 de Enero 2026*
