# Backend - Gestión de Ocupación de Plazas (2 horas)

## Descripción
El sistema requiere que el backend Laravel sea responsable de liberar automáticamente las plazas después de **2 horas (120 minutos)** de ocupación.

## Endpoint Actual (Ejemplo)
Hasta que el backend implemente la gestión automática, se utiliza `PlazaMockService` que simula el comportamiento.

## Endpoints Necesarios

### 1. **POST /api/plazas/{id}/ocupar** (Ya existe)
Marca una plaza como ocupada.

**Request:**
```json
{
  "latitud": 28.1235,
  "longitud": -15.4366,
  "precision": 15.5
}
```

**Response:**
```json
{
  "message": "Plaza ocupada correctamente",
  "plaza": {
    "id": 1,
    "estado": "ocupada",
    "occupado_desde": "2026-04-15T10:30:00Z"
  }
}
```

**Backend debe:**
- Guardar el timestamp `occupado_desde` (momento actual en UTC)
- Guardar la ubicación del usuario (para auditoría)
- Registrar el usuario que ocupó la plaza

---

### 2. **POST /api/plazas/{id}/liberar** (Ya existe)
Marca una plaza como libre.

**Response:**
```json
{
  "message": "Plaza liberada correctamente",
  "plaza": {
    "id": 1,
    "estado": "libre"
  }
}
```

**Backend debe:**
- Validar que la plaza estaba ocupada
- Actualizar `occupado_desde` a NULL
- Registrar el timestamp de liberación

---

## Sistema de Liberación Automática (A Implementar)

### Opción 1: Cron Job (Recomendado)
```php
// app/Console/Commands/LiberarPlazasAutomaticamente.php

class LiberarPlazasAutomaticamente extends Command
{
    protected $signature = 'plazas:liberar-automaticamente';
    protected $description = 'Libera automáticamente plazas ocupadas hace más de 2 horas';

    public function handle()
    {
        $hace_2_horas = Carbon::now()->subMinutes(120);
        
        \App\Models\Plaza::where('estado', 'ocupada')
            ->where('occupado_desde', '<=', $hace_2_5_horas)
            ->update([
                'estado' => 'libre',
                'occupado_desde' => null,
                'liberado_automaticamente_en' => Carbon::now()
            ]);
    }
}
```

**Configurar en** `app/Console/Kernel.php`:
```php
protected $commands = [
    \App\Console\Commands\LiberarPlazasAutomaticamente::class,
];

protected function schedule(Schedule $schedule)
{
    $schedule->command('plazas:liberar-automaticamente')
        ->everyMinute(); // Ejecutar cada minuto
}
```

### Opción 2: Middleware/Listener (Tiempo real)
Crear un listener que se ejecute cada vez que se obtienen las plazas o se ocupa una:

```php
// app/Listeners/LiberarPlazasVencidasListener.php

class LiberarPlazasVencidasListener
{
    public function handle(PlazaObtained $event)
    {
        $hace_2_horas = Carbon::now()->subMinutes(120);
        
        \App\Models\Plaza::where('estado', 'ocupada')
            ->where('occupado_desde', '<=', $hace_2_horas)
            ->update([
                'estado' => 'libre',
                'occupado_desde' => null
            ]);
    }
}
```

### Opción 3: WebSocket/Server-Sent Events (En Tiempo Real)
Para notificar al frontend cuando se libera una plaza:

```php
// Backend podría enviar eventos como:
// {
//   "tipo": "plaza_liberada",
//   "plaza_id": 1,
//   "timestamp": "2026-04-15T13:00:00Z"
// }
```

El frontend se suscribiría a estos eventos y actualizaría el estado localmente.

---

## Base de Datos Schema

La tabla `plazas` debe incluir:

```sql
ALTER TABLE plazas ADD COLUMN occupado_desde TIMESTAMP NULL;
ALTER TABLE plazas ADD COLUMN liberado_por_usuario_id INT NULL;
ALTER TABLE plazas ADD COLUMN liberado_automaticamente_en TIMESTAMP NULL;
ALTER TABLE plazas ADD COLUMN geoloc_latitude DOUBLE NULL AFTER longitud;
ALTER TABLE plazas ADD COLUMN geoloc_longitude DOUBLE NULL AFTER geoloc_latitude;
ALTER TABLE plazas ADD COLUMN geoloc_precision FLOAT NULL AFTER geoloc_longitude;
```

---

## Validaciones Importantes

1. **Solo usuarios autenticados** pueden ocupar/liberar plazas
2. **Solo si está a menos de 30m** pueden ocupar (validado en frontend y DEBE validarse en backend)
3. **Máximo 2 horas** de ocupación continua
4. **Logging de auditoría**: Quién ocupó, cuándo, desde dónde (coordenadas)
5. **Prevención de spam**: Un usuario no puede ocupar/liberar más de N veces en X minutos

---

## Respuesta del Backend - Plaza Getdata

Cuando se obtienen plazas, incluir:

```json
{
  "id": 1,
  "direccion": "Calle Principal, 123",
  "estado": "ocupada",
  "occupado_desde": "2026-04-15T10:30:00Z",
  "activa": true
}
```

---

## Testing

Crear tests para:

```php
public function test_plaza_se_libera_automaticamente_despues_de_2_5_horas()
{
    $plaza = Plaza::create([
        'direccion' => 'Test',
        'estado' => 'ocupada',
        'occupado_desde' => Carbon::now()->subMinutes(151) // 2h 31min ago
    ]);

    $this->artisan('plazas:liberar-automaticamente');

    $this->assertEquals('libre', $plaza->fresh()->estado);
}
```

---

## Notas para el Frontend

Mientras el backend no implemente la gestión automática:

- Se usa `PlazaMockService` que simula la liberación
- El frontend NO mostrará contador de tiempo
- Se muestra un mensaje: "Se liberará automáticamente en 2.5 horas"
- Cuando el backend esté listo, cambiar las llamadas de `plazaService.ocuparPlaza()` a `plazaMockService.registrarOcupacionConLiberacionAutomatica()`

---

## Migración de Mock a Producción

Una vez el backend esté listo:

1. Remover `PlazaMockService`
2. Actualizar `DetallePlazaPage.ocuparPlaza()` para confiar en que el backend maneja todo
3. Implementar polling o WebSocket para actualizaciones de estado
4. El usuario verá la plaza liberada cuando recargue o se sincronice el estado

