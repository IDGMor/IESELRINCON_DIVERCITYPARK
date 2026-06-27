# IESELRINCON-DIVERCITYPARK - Resumen Ejecutivo (Only Eyes)

## 1. Propósito
El sistema IESELRINCON-DIVERCITYPARK mejora la gestión de plazas PMR mediante digitalización, control de uso en tiempo real y trazabilidad de incidencias.

Objetivo principal:
- Facilitar a la ciudadanía la localización y uso correcto de plazas PMR.
- Dotar a administración y operación de visibilidad, control y evidencia para la toma de decisiones.

## 2. Alcance funcional

### App móvil (ciudadanía)
- Registro e inicio de sesión.
- Mapa de plazas PMR con estado libre/ocupada.
- Ocupación/liberación con validación de ubicación.
- Reporte de incidencias con foto.
- Ranking de participación ciudadana.

### App de administración (operación)
- Supervisión del estado de plazas y uso histórico.
- Gestión y priorización de incidencias.
- Control de permisos y auditoría de acciones.
- Soporte para automatizaciones de liberación y métricas operativas.

## 3. Valor para negocio y servicio público
- Mayor disponibilidad real de plazas PMR.
- Reducción de usos indebidos por validación geográfica y reglas de permisos.
- Respuesta más rápida ante incidencias en vía pública.
- Datos trazables para justificar actuaciones y planificar mejoras urbanas.

## 4. Estado actual
- La app móvil está operativa en sus módulos clave: autenticación, mapa, plazas, incidencias y ranking.
- El backend está integrado para endpoints principales y con necesidades avanzadas ya definidas.
- Se dispone de documentación de reglas críticas para consolidación operativa.

## 5. Necesidades para operación completa

### Técnicas
- API backend robusta y monitoreada en producción.
- Seguridad en HTTPS, control de acceso por token y validaciones de negocio en servidor.
- Tareas programadas para liberación automática de plazas y limpieza operativa.

### Organizativas
- Definición de responsables de gestión de incidencias y tiempos objetivo de resolución.
- Protocolo de auditoría y revisiones periódicas de uso de plazas.
- Cuadro de mando con métricas de ocupación, incidencias y cumplimiento.

## 6. Riesgos y controles
- Riesgo: datos de geolocalización inexactos en algunos dispositivos.
  Control: validaciones combinadas de precisión y distancia en backend.
- Riesgo: ocupaciones prolongadas o no liberadas.
  Control: liberación automática por regla temporal y alertas de seguimiento.
- Riesgo: variabilidad en adopción de usuarios.
  Control: comunicación pública, UX accesible y medición continua.

## 7. Recomendación de despliegue
- Fase 1: Operación controlada en entorno piloto.
- Fase 2: Activación de automatizaciones y cuadro de mando.
- Fase 3: Escalado por zonas y mejora continua basada en datos.

## 8. Indicadores clave sugeridos (KPIs)
- Tasa de ocupación válida de plazas PMR.
- Tiempo medio de resolución de incidencias.
- Porcentaje de incidencias con evidencia fotográfica.
- Número de liberaciones automáticas ejecutadas correctamente.
- Satisfacción de usuario y tasa de uso recurrente.

---
Documento orientado a dirección y coordinación operativa. Para detalle técnico, consultar README.md.