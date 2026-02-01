# Guía de Despliegue - Valnor

## 🌐 PWA (Progressive Web App)

La aplicación ya está configurada como PWA. Cuando los usuarios visiten la web desde un navegador compatible, verán un banner para instalar la app.

### Cómo funciona
1. El usuario visita tu sitio web
2. Después de 3 segundos aparece un banner "¡Instala Valnor!"
3. Si hace clic en "Instalar", la app se descarga al dispositivo
4. Si hace clic en "Ahora no", el banner no aparecerá por 7 días

### Para desplegar la PWA
```bash
npm run build
# Sube el contenido de /dist a tu servidor (Vercel, Netlify, etc.)
```

---

## 📱 Capacitor - App Nativa para Android

### Requisitos Previos
1. **Android Studio** instalado: https://developer.android.com/studio
2. **JDK 17+** instalado
3. Configurar `ANDROID_HOME` en variables de entorno

### Configuración Inicial (solo primera vez)
```bash
# 1. Instalar dependencias de Capacitor (si no lo has hecho)
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Agregar plataforma Android
npm run cap:add:android
```

### Generar APK para Pruebas
```bash
# 1. Construir la web y sincronizar con Android
npm run cap:build:android

# 2. Abrir en Android Studio
npm run cap:open:android
```

Desde Android Studio:
1. `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
2. El APK se genera en: `android/app/build/outputs/apk/debug/app-debug.apk`

### Generar APK Firmado para Play Store
1. En Android Studio: `Build` → `Generate Signed Bundle / APK`
2. Seleccionar "APK" o "Android App Bundle"
3. Crear o usar un keystore existente
4. El APK firmado se genera en `android/app/release/`

---

## 🛡️ Protección de Compras

La aplicación detecta automáticamente la plataforma y oculta las opciones de compra en:
- PWA instalada
- App nativa de Android/iOS

Esto evita la comisión del 30% de las tiendas de apps.

### Uso en componentes
```tsx
import { useCanShowPurchases, PlatformOnly } from '@/hooks';

function ShopPage() {
  const canShowPurchases = useCanShowPurchases();

  return (
    <div>
      {canShowPurchases && (
        <BuyGemsButton />
      )}
      
      {/* O usando el componente helper */}
      <PlatformOnly platforms={['web']}>
        <BuyGemsButton />
      </PlatformOnly>
    </div>
  );
}
```

---

## 📋 Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Iniciar servidor de desarrollo |
| `npm run build` | Construir para producción |
| `npm run preview` | Previsualizar build de producción |
| `npm run cap:sync` | Build + sincronizar con Capacitor |
| `npm run cap:open:android` | Abrir proyecto en Android Studio |
| `npm run cap:build:android` | Build completo para Android |
| `npm run icons:generate` | Regenerar iconos de la PWA |

---

## 🚀 Checklist de Publicación

### Para Web/PWA
- [ ] Dominio configurado con HTTPS
- [ ] Variables de entorno configuradas
- [ ] Build de producción generado
- [ ] Service Worker funcionando
- [ ] Manifest.json correcto
- [ ] Iconos en todas las resoluciones

### Para Play Store
- [ ] APK firmado generado
- [ ] Capturas de pantalla preparadas
- [ ] Descripción y metadata lista
- [ ] Política de privacidad publicada
- [ ] Icono de alta resolución (512x512)
- [ ] Feature graphic (1024x500)
