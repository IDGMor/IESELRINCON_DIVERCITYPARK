# IESELRINCON-DIVERCITYPARK - Sistema de Gestión de Plazas PMR

## 1. Descripción general
IESELRINCON-DIVERCITYPARK es una solución para gestionar plazas PMR con dos frentes funcionales:

- App móvil (Ionic/Angular): orientada a usuarios finales para localizar, ocupar/liberar plazas y reportar incidencias.
- App de administración (backend/panel de operación): orientada a personal gestor para supervisión, validación y mantenimiento del sistema.

La solución se apoya en una API backend (Laravel) y en servicios de geolocalización para validar cercanía a las plazas.

---

## 2. Arquitectura del sistema

### 2.1 Componentes
- Frontend móvil: Ionic 8 + Angular 20 + Capacitor 8.
- Backend API: Laravel (endpoints de autenticación, plazas, incidencias y ranking).
- Base de datos: persistencia de plazas, ocupaciones, incidencias y usuarios.
- Mapa y geocodificación: Leaflet + servicios de OpenStreetMap/Nominatim.

### 2.2 Integraciones y capacidades nativas
- Geolocalización: @capacitor/geolocation.
- Cámara y galería: @capacitor/camera.
- Reconocimiento de voz: @capacitor-community/speech-recognition.
- Plataforma Android: @capacitor/android.

---

## 3. Funcionalidades de la app móvil

### 3.1 Autenticación y perfil
- Registro e inicio de sesión.
- Gestión de sesión con token en almacenamiento local.
- Cierre de sesión y recuperación de perfil de usuario.

### 3.2 Mapa de plazas
- Visualización de plazas PMR en mapa interactivo.
- Estado de plazas (libre/ocupada) con marcadores diferenciados.
- Búsqueda por texto, filtros y navegación por zona.
- Localización del usuario en tiempo real.
- Búsqueda por voz para mejorar accesibilidad.

### 3.3 Ocupación y liberación de plazas
- Ocupación de plaza con envío de coordenadas y precisión.
- Validación de proximidad del usuario (regla de distancia).
- Liberación de plaza con validación de permisos.
- Preparada para liberación automática por tiempo en backend.

### 3.4 Propuesta de nuevas plazas
- Formulario de alta de plaza con dirección y características.
- Captura o selección de fotos para adjuntar evidencia.
- Selección de ubicación en mapa y geocodificación inversa.
- Validación de distancia máxima para alta (control antifraude).

### 3.5 Incidencias
- Registro de incidencias con tipo, fecha, descripción y plaza asociada.
- Adjuntar foto desde cámara o galería.
- Consulta de incidencias por filtros.

### 3.6 Ranking y gamificación
- Consulta de ranking de usuarios por puntuación.
- Métricas de incidencias reportadas/resueltas.

---

## 4. Funcionalidades de la app de administración

## 4.1 Operación de plazas
- Supervisión del estado global de plazas (libre/ocupada/inactiva).
- Validación de ocupaciones y liberaciones (incluyendo trazabilidad).
- Aplicación de reglas de negocio de ocupación temporal.

## 4.2 Gestión de incidencias
- Recepción y clasificación de incidencias reportadas.
- Cambio de estado de incidencias (vista, en trámite, resuelta).
- Priorización por tipo, zona y criticidad.

## 4.3 Control de usuarios y auditoría
- Control de permisos para acciones sensibles.
- Trazabilidad de quién ocupa/libera plazas y cuándo.
- Evidencias de ubicación asociadas a operaciones críticas.

## 4.4 Automatizaciones necesarias en backend
- Liberación automática de plazas transcurrido el tiempo límite.
- Registro de eventos de auditoría y métricas operativas.
- Validaciones de seguridad (token, ownership, antifraude, rate limit).

Nota: en este repositorio se encuentra el cliente Ionic y la especificación de necesidades backend. El panel administrativo puede implementarse como frontend web adicional o como módulo interno del backend.

---

## 5. Necesidades del sistema

## 5.1 Requisitos de desarrollo
- Node.js: 20.19+ (recomendado 22.12+ o superior).
- npm: versión compatible con Angular CLI 20.
- Ionic CLI (opcional para flujos móviles): última estable.
- Android Studio + SDK Android (para build nativa Android).
- Java/JDK compatible con Android Gradle Plugin.

## 5.2 Requisitos de backend
- API REST activa y accesible desde la app.
- Endpoints de autenticación, plazas, incidencias, tipos de incidencia y ranking.
- Almacenamiento de archivos para fotos (URL de storage).
- Tareas programadas (cron) para liberación automática y mantenimiento.

## 5.3 Requisitos de seguridad
- HTTPS obligatorio en producción.
- Autenticación por token y protección de rutas.
- Validación de proximidad en backend para ocupar/liberar plazas.
- Restricción de liberación: solo el usuario que ocupó la plaza.

## 5.4 Requisitos de dispositivo móvil
- Android con permisos de ubicación (fina/aproximada).
- Permiso de cámara para subir evidencia fotográfica.
- Conectividad de red para sincronizar estado y reportes.

---

## 6. Configuración de entornos

El proyecto usa archivos de entorno para la API y storage:

- Desarrollo: src/environments/environment.ts
- Producción: src/environments/environment.prod.ts

Variables clave:
- apiUrl
- storageUrl

---

## 7. Puesta en marcha rápida

1. Instalar dependencias:
   npm install

2. Levantar en desarrollo:
   npm start

3. Compilar:
   npm run build

4. Ejecutar tests:
   npm run test

5. Sincronizar con Android (si aplica):
   ionic capacitor sync android

---

## 8. Flujo funcional resumido

1. Usuario inicia sesión en la app móvil.
2. Consulta mapa y estado de plazas.
3. Ocupa una plaza validando ubicación.
4. Reporta incidencias con foto si detecta problemas.
5. Administración supervisa incidencias y estado de plazas.
6. Backend aplica reglas automáticas de liberación y auditoría.

---

## 9. Estado actual del proyecto

- Aplicación móvil funcional con mapa, autenticación, incidencias y ranking.
- Integración backend definida y parcialmente apoyada por servicios mock en escenarios concretos.
- Reglas de negocio críticas documentadas para consolidación en backend (ocupación temporal, permisos de liberación, auditoría).