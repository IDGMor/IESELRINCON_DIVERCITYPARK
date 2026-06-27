# Configuración de Geolocation - Resumen de Cambios

## ✅ Cambios Realizados

### 1. **Instalación de @capacitor/geolocation**
- ✅ Agregada dependencia en `package.json`: `"@capacitor/geolocation": "^8.0.0"`
- ⏳ Ejecutar `npm install` para instalar el paquete

### 2. **Permisos en AndroidManifest.xml**
- ✅ `android.permission.ACCESS_FINE_LOCATION` - GPS preciso
- ✅ `android.permission.ACCESS_COARSE_LOCATION` - Ubicación aproximada

## 📝 Próximos Pasos

### 1. Instalar npm packages:
```bash
cd /Users/taziriherreraarocha/Desktop/IESELRINCON/IESELRINCON
npm install
```

### 2. Sincronizar con Android:
```bash
ionic capacitor sync android
```

### 3. Reconstruir la app:
```bash
ionic capacitor build android
```

## 🔐 Permisos en iOS (si aplica)

Si compilas para iOS, también necesitas agregar en `ios/App/App/Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Esta app necesita acceso a tu ubicación para ocupar plazas de aparcamiento</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Esta app necesita acceso a tu ubicación para ocupar plazas de aparcamiento</string>
```

## 📱 Solicitud de Permisos en Runtime

El código en `geolocalizacion.service.ts` ya detecta automáticamente cuando el usuario niega los permisos y muestra un mensaje de error apropiado.

Capacitor solicitará automáticamente los permisos cuando `navigator.geolocation.getCurrentPosition()` se ejecute por primera vez.

## 🧪 Testing

Para probar la geolocalización:

1. En Android Studio, abre Android Emulator
2. Abre la app en el emulator
3. Entra en una plaza y haz clic en "Marcar Ocupada"
4. Grant permission cuando se solicite
5. Debería mostrar la distancia y calcular si está a menos de 30m

## ⚠️ Notas Importantes

- **HTTPS en Producción**: Los navegadores modernos requieren HTTPS para usar geolocation (excepto localhost)
- **Denso GPS**: La precisión dependerá del dispositivo físico. En emuladores puede ser menos preciso
- **Timeout**: Si no hay GPS después de 10 segundos, se mostrará error
- **Battery**: La geolocalización consume batería. Considera usar `enableHighAccuracy: false` para ubicación aproximada

## 📚 Documentación Oficial

- [Capacitor Geolocation](https://capacitorjs.com/docs/apis/geolocation)
- [Android Permissions](https://developer.android.com/guide/topics/permissions/overview)
