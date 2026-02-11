# 📱 Guía de Capacitor - Valnor Juego

## ¿Qué es Capacitor?

**Capacitor** es un runtime nativo de código abierto creado por el equipo de Ionic que permite convertir aplicaciones web en aplicaciones nativas para **Android**, **iOS** y **PWA** (Progressive Web App).

### Ventajas:
- ✅ Una sola base de código (React/Vue/Angular) para web, Android e iOS
- ✅ Acceso a APIs nativas del dispositivo (cámara, GPS, notificaciones, etc.)
- ✅ Hot reload durante desarrollo
- ✅ Compatible con cualquier framework web
- ✅ Plugins nativos y de comunidad

---

## 🛠️ Cómo se Instaló en Valnor

### 1. Instalación de dependencias

```bash
# Instalar Capacitor core y CLI
npm install @capacitor/core @capacitor/cli

# Instalar plataformas (Android/iOS)
npm install @capacitor/android
# npm install @capacitor/ios  # Para Mac solamente
```

### 2. Inicialización de Capacitor

```bash
npx cap init
```

Esto creó el archivo `capacitor.config.ts` (o `.json`):

```typescript
// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.valnor.game',      // ID único de la app
  appName: 'Valnor',             // Nombre que aparece en el dispositivo
  webDir: 'dist',                // Carpeta donde está el build de producción
  server: {
    androidScheme: 'https'       // Usar HTTPS para mejor compatibilidad
  }
};

export default config;
```

### 3. Agregar plataforma Android

```bash
# Primero compilar la app web
npm run build

# Agregar la plataforma Android
npx cap add android
```

Esto creó la carpeta `/android` con el proyecto nativo de Android Studio.

### 4. Sincronizar cambios

```bash
# Después de cada build, sincronizar con las plataformas nativas
npx cap sync android
```

---

## 📋 Comandos Principales

| Comando | Descripción |
|---------|-------------|
| `npm run build` | Compilar la app web a `/dist` |
| `npx cap sync android` | Copiar build + actualizar plugins en Android |
| `npx cap copy android` | Solo copiar archivos web (más rápido) |
| `npx cap open android` | Abrir proyecto en Android Studio |
| `npx cap run android` | Ejecutar en dispositivo/emulador conectado |
| `npx cap doctor` | Verificar configuración y problemas |

### Scripts configurados en package.json:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "cap:sync": "npx cap sync",
    "cap:android": "npx cap open android",
    "cap:build": "npm run build && npx cap sync android"
  }
}
```

---

## 🔄 Flujo de Trabajo Diario

### Durante desarrollo (cambios frecuentes):

```bash
# 1. Desarrollar con hot reload en navegador
npm run dev

# 2. Probar en navegador con DevTools (F12 → Vista móvil)
```

### Para probar en Android:

```bash
# 1. Compilar producción
npm run build

# 2. Sincronizar con Android
npx cap sync android

# 3. Abrir Android Studio
npx cap open android

# 4. En Android Studio: Run → Run 'app' (o Shift+F10)
```

### Live Reload en dispositivo (opcional):

```bash
# En vite.config.ts, agregar:
server: {
  host: '0.0.0.0',  # Exponer en red local
  port: 3000
}

# Luego en capacitor.config.ts:
server: {
  url: 'http://TU_IP_LOCAL:3000',
  cleartext: true
}

# Ejecutar dev y conectar dispositivo a la misma red WiFi
npm run dev
npx cap run android
```

---

## 📁 Estructura de Carpetas

```
Valnor-juego/
├── android/                    # Proyecto nativo Android
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── assets/public/  # ← Aquí se copia el build web
│   │   │   ├── java/           # Código Java/Kotlin nativo
│   │   │   ├── res/            # Recursos Android (iconos, splash)
│   │   │   └── AndroidManifest.xml
│   │   └── build.gradle
│   └── build.gradle
├── dist/                       # Build de producción (web)
├── src/                        # Código fuente React
├── capacitor.config.ts         # Configuración de Capacitor
├── package.json
└── vite.config.ts
```

---

## 📱 Generar APK para Instalar

### Opción 1: Desde Android Studio

1. Abrir Android Studio: `npx cap open android`
2. Menú: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. APK generado en: `android/app/build/outputs/apk/debug/app-debug.apk`

### Opción 2: Desde línea de comandos

```bash
cd android

# APK de debug (para pruebas)
./gradlew assembleDebug

# APK de release (para producción)
./gradlew assembleRelease
```

### Ubicación de APKs:
- **Debug:** `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release:** `android/app/build/outputs/apk/release/app-release.apk`

---

## 🌐 PWA vs App Nativa

### PWA (Progressive Web App):
- Se instala desde el navegador
- No requiere tiendas de apps
- Funciona offline con Service Worker
- Actualizaciones automáticas
- **Ya configurado** con `vite-plugin-pwa`

### App Nativa (Capacitor):
- Se instala como APK/AAB
- Acceso completo a APIs nativas
- Se puede publicar en Google Play / App Store
- Mejor rendimiento en algunas funciones
- Notificaciones push nativas

### En Valnor tenemos AMBAS:
```
┌─────────────────────────────────────────┐
│           Código React (src/)           │
└─────────────────────────────────────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │   npm run build     │
         │      (dist/)        │
         └─────────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   ┌────────┐  ┌────────┐  ┌────────┐
   │  PWA   │  │ Android│  │  iOS   │
   │ (Web)  │  │  (APK) │  │ (Mac)  │
   └────────┘  └────────┘  └────────┘
```

---

## 🔌 Plugins Nativos Útiles

### Instalación de plugins:

```bash
# Notificaciones push
npm install @capacitor/push-notifications

# Almacenamiento local
npm install @capacitor/preferences

# Cámara
npm install @capacitor/camera

# Geolocalización
npm install @capacitor/geolocation

# Compartir
npm install @capacitor/share

# Splash Screen
npm install @capacitor/splash-screen

# Status Bar
npm install @capacitor/status-bar
```

### Uso en código:

```typescript
import { Camera, CameraResultType } from '@capacitor/camera';
import { Preferences } from '@capacitor/preferences';
import { Share } from '@capacitor/share';

// Tomar foto
const takePicture = async () => {
  const image = await Camera.getPhoto({
    quality: 90,
    resultType: CameraResultType.Uri
  });
  return image.webPath;
};

// Guardar datos localmente
await Preferences.set({ key: 'user', value: JSON.stringify(userData) });

// Compartir
await Share.share({
  title: 'Valnor',
  text: '¡Únete a mi aventura en Valnor!',
  url: 'https://valnor.game'
});
```

---

## 🎨 Personalizar Iconos y Splash Screen

### Iconos de la app:

Los iconos están en:
- `android/app/src/main/res/mipmap-*/ic_launcher.png`

Tamaños necesarios:
- mdpi: 48x48
- hdpi: 72x72
- xhdpi: 96x96
- xxhdpi: 144x144
- xxxhdpi: 192x192

### Herramienta recomendada:

```bash
npm install -g @capacitor/assets

# Generar todos los iconos desde una imagen
npx capacitor-assets generate --iconBackgroundColor '#1e1b4b' --splashBackgroundColor '#030712'
```

Coloca tu icono base en:
- `assets/icon.png` (1024x1024)
- `assets/splash.png` (2732x2732)

---

## ❓ Solución de Problemas

### Error: "Android Studio not found"
```bash
# Instalar Android Studio desde:
# https://developer.android.com/studio

# O configurar la variable de entorno:
set CAPACITOR_ANDROID_STUDIO_PATH="C:\Program Files\Android\Android Studio\bin\studio64.exe"
```

### Error: "SDK not found"
1. Abrir Android Studio
2. Tools → SDK Manager
3. Instalar Android SDK (API 33 o superior)

### La app no se actualiza en el dispositivo:
```bash
# Limpiar y reconstruir
npm run build
npx cap sync android --force

# En Android Studio: Build → Clean Project
```

### Pantalla blanca en la app:
- Verificar que `webDir` en `capacitor.config.ts` sea `"dist"`
- Verificar que exista `dist/index.html` después del build

---

## 📚 Recursos

- [Documentación oficial de Capacitor](https://capacitorjs.com/docs)
- [Plugins oficiales](https://capacitorjs.com/docs/plugins)
- [Comunidad de plugins](https://github.com/capacitor-community)
- [Guía de migración Cordova → Capacitor](https://capacitorjs.com/docs/cordova/migration-strategy)

---

## 🚀 Resumen Rápido

```bash
# Desarrollo web
npm run dev

# Compilar + preparar Android
npm run build && npx cap sync android

# Abrir en Android Studio para generar APK
npx cap open android
```

**¡Tu app Valnor está lista para web, PWA y Android!** 🎮
