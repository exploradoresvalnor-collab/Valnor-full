# 🎮 Valnor - Juego RPG

## 📋 Descripción
Proyecto de juego RPG migrado desde Angular a React. El proyecto está en fase inicial de desarrollo.

## 🚀 Estado Actual

### ✅ Completado
- **Proyecto base** configurado con Vite + React 19 + TypeScript
- **Splash Screen** migrado desde Angular con animaciones cinematográficas
- **Assets** copiados (logo.png, caballero_dorado.png)
- **Routing** configurado con react-router-dom

### 🔄 Pendiente
- [ ] Landing Page (próximo paso)
- [ ] Demás páginas según guía del usuario

## 📁 Estructura del Proyecto

```
Valnor-juego/
├── public/
│   └── assets/
│       ├── logo.png
│       └── caballero_dorado.png
├── src/
│   ├── pages/
│   │   └── SplashScreen/
│   │       ├── index.ts
│   │       ├── SplashScreen.tsx
│   │       └── SplashScreen.css
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

### v0.1.0 - Proyecto Base
- ✅ Setup inicial con Vite + React
- ✅ Splash Screen migrado desde Angular
- ✅ Animaciones cinematográficas (fadeOut, cinematicZoom)
- ✅ Navegación a /landing configurada

---

## 🎯 Próximos Pasos
Esperando guía del usuario para implementar la **Landing Page** y demás funcionalidades.

## 📚 Proyecto Original
Migrado desde: `Angular-game2` (Angular)

---
*Última actualización: 30 de Enero 2026*
