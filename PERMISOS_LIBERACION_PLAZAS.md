# Restricción de Permisos: Liberación de Plazas

## 📋 Cambios Implementados en Frontend

### Validación de Permisos
- ✅ Solo el usuario que marcó la plaza como ocupada puede desmarcaria
- ✅ Si intenta otro usuario, ve mensaje: "Solo quien la ocupó puede liberarla"
- ✅ El botón "Marcar Libre" está deshabilitado si no es el propietario

### Cambios en Interfaces

**Plaza.ts:**
```typescript
interface Plaza {
  // ... campos existentes ...
  ocupado_por_usuario_id?: number | null; // NEW: ID del usuario que ocupó la plaza
}
```

**RespuestaOcupar.ts:**
```typescript
interface RespuestaOcupar {
  message: string;
  plaza: { 
    id: number; 
    estado: string; 
    occupado_desde?: string;
    ocupado_por_usuario_id?: number;  // NEW
  };
}
```

---

## 🔧 Cambios Necesarios en Backend (Laravel)

### 1. Migración de Base de Datos

```php
// database/migrations/xxxx_xx_xx_add_usuario_fields_to_plazas.php

public function up()
{
    Schema::table('plazas', function (Blueprint $table) {
        // Si no existen ya
        $table->unsignedBigInteger('ocupado_por_usuario_id')
            ->nullable()
            ->after('estado')
            ->comment('ID del usuario que marcó la plaza como ocupada');
        
        $table->foreign('ocupado_por_usuario_id')
            ->references('id')
            ->on('users')
            ->onDelete('set null');
    });
}

public function down()
{
    Schema::table('plazas', function (Blueprint $table) {
        $table->dropForeign(['ocupado_por_usuario_id']);
        $table->dropColumn('ocupado_por_usuario_id');
    });
}
```

### 2. Modelo Plaza

```php
// app/Models/Plaza.php

class Plaza extends Model
{
    protected $fillable = [
        // ... campos existentes ...
        'ocupado_por_usuario_id',
    ];

    protected $casts = [
        // ... casts existentes ...
        'ocupado_por_usuario_id' => 'integer',
    ];

    // Relación con usuario que ocupó la plaza
    public function ocupadoPor()
    {
        return $this->belongsTo(User::class, 'ocupado_por_usuario_id');
    }
}
```

### 3. Endpoint POST /api/plazas/{id}/ocupar

```php
// app/Http/Controllers/PlazaController.php

public function ocupar(Request $request, $id)
{
    $plaza = Plaza::findOrFail($id);
    
    // Validaciones
    if ($plaza->estado === 'ocupada') {
        return response()->json(
            ['message' => 'Esta plaza ya está ocupada'],
            422
        );
    }

    // Validar que está a menos de 30m (parte del backend)
    $userLat = $request->input('latitud');
    $userLon = $request->input('longitud');
    
    if (!$this->estaCerca($plaza, $userLat, $userLon)) {
        return response()->json(
            ['message' => 'No está lo suficientemente cerca de la plaza (máx. 30m)'],
            422
        );
    }

    // Actualizar plaza
    $plaza->update([
        'estado' => 'ocupada',
        'occupado_desde' => now(),
        'ocupado_por_usuario_id' => $request->user()->id,
        'geoloc_latitude' => $userLat,
        'geoloc_longitude' => $userLon,
        'geoloc_precision' => $request->input('precision')
    ]);

    return response()->json([
        'message' => 'Plaza ocupada correctamente',
        'plaza' => [
            'id' => $plaza->id,
            'estado' => $plaza->estado,
            'occupado_desde' => $plaza->occupado_desde,
            'ocupado_por_usuario_id' => $plaza->ocupado_por_usuario_id
        ]
    ]);
}

private function estaCerca($plaza, $userLat, $userLon)
{
    // Usar Haversine formula
    $lat1rad = deg2rad($plaza->latitud);
    $lat2rad = deg2rad($userLat);
    $deltaLat = deg2rad($userLat - $plaza->latitud);
    $deltaLon = deg2rad($userLon - $plaza->longitud);

    $a = sin($deltaLat/2) * sin($deltaLat/2) +
         cos($lat1rad) * cos($lat2rad) *
         sin($deltaLon/2) * sin($deltaLon/2);

    $c = 2 * atan2(sqrt($a), sqrt(1-$a));
    $distance = 6371000 * $c; // metros

    return $distance <= 30;
}
```

### 4. Endpoint POST /api/plazas/{id}/liberar

```php
public function liberar(Request $request, $id)
{
    $plaza = Plaza::findOrFail($id);
    
    // Validar que estaba ocupada
    if ($plaza->estado !== 'ocupada') {
        return response()->json(
            ['message' => 'La plaza no está ocupada'],
            422
        );
    }

    // Validar que es el usuario que la ocupó
    if ($plaza->ocupado_por_usuario_id !== $request->user()->id) {
        return response()->json(
            ['message' => 'Solo el usuario que ocupó la plaza puede liberarla'],
            403
        );
    }

    // Actualizar plaza
    $plaza->update([
        'estado' => 'libre',
        'occupado_desde' => null,
        'ocupado_por_usuario_id' => null
    ]);

    return response()->json([
        'message' => 'Plaza liberada correctamente',
        'plaza' => [
            'id' => $plaza->id,
            'estado' => $plaza->estado
        ]
    ]);
}
```

### 5. Endpoint GET /api/plazas (incluir usuario_id)

```php
public function index(Request $request)
{
    $plazas = Plaza::query();
    
    // Filtros existentes
    if ($request->has('estado')) {
        $plazas->where('estado', $request->input('estado'));
    }
    
    if ($request->has('zona')) {
        $plazas->where('zona', $request->input('zona'));
    }

    return response()->json(
        $plazas->get()->map(fn($plaza) => [
            'id' => $plaza->id,
            'direccion' => $plaza->direccion,
            'zona' => $plaza->zona,
            'sector' => $plaza->sector,
            'latitud' => $plaza->latitud,
            'longitud' => $plaza->longitud,
            'fotos' => $plaza->fotos,
            'estado' => $plaza->estado,
            'activa' => $plaza->activa,
            'observaciones' => $plaza->observaciones,
            'incidencias_fisicas' => $plaza->incidencias_fisicas,
            'senal_vertical' => $plaza->senal_vertical,
            'marcas_en_suelo' => $plaza->marcas_en_suelo,
            'acceso_furgonetas' => $plaza->acceso_furgonetas,
            'iluminacion' => $plaza->iluminacion,
            'pendiente' => $plaza->pendiente,
            'pavimento' => $plaza->pavimento,
            'occupado_desde' => $plaza->occupado_desde,
            'ocupado_por_usuario_id' => $plaza->ocupado_por_usuario_id  // NEW
        ])
    );
}
```

### 6. Cron Job para Liberación Automática (2.5 horas)

```php
// app/Console/Commands/LiberarPlazasVencidas.php

class LiberarPlazasVencidas extends Command
{
    protected $signature = 'plazas:liberar-vencidas';
    protected $description = 'Libera automáticamente plazas ocupadas hace más de 2.5 horas';

    public function handle()
    {
        $hace_2_5_horas = now()->subMinutes(150);
        
        $plazas = Plaza::where('estado', 'ocupada')
            ->where('occupado_desde', '<=', $hace_2_5_horas)
            ->update([
                'estado' => 'libre',
                'occupado_desde' => null,
                'ocupado_por_usuario_id' => null
            ]);

        $this->info("Se liberaron {$plazas} plazas automáticamente");
    }
}
```

**Registrar en** `app/Console/Kernel.php`:
```php
protected function schedule(Schedule $schedule)
{
    $schedule->command('plazas:liberar-vencidas')->everyMinute();
}
```

---

## ✅ Checklist para Backend

- [ ] Crear migración con `ocupado_por_usuario_id`
- [ ] Actualizar modelo Plaza con relación `ocupadoPor()`
- [ ] Implementar validación de distancia en endpoint `/ocupar`
- [ ] Guardar `ocupado_por_usuario_id` al ocupar
- [ ] Validar permisos en endpoint `/liberar`
- [ ] Retornar `ocupado_por_usuario_id` en respuestas de ocupación
- [ ] Incluir `ocupado_por_usuario_id` en GET /api/plazas
- [ ] Implementar Cron Job para liberación automática
- [ ] Crear tests para las validaciones

---

## 🔒 Seguridad

- ✅ Frontend valida pero Backend DEBE validar también
- ✅ El usuario solo ve su propio ID para comparar
- ✅ El endpoint `/liberar` valida que sea el usuario que la ocupó
- ✅ Si intenta hackear, backend rechazará con HTTP 403

---

## 📱 Flujo Completo

### Usuario A marca plaza como ocupada:
1. Frontend valida distancia (< 30m) ✓
2. Envía POST `/api/plazas/1/ocupar` con su ubicación
3. Backend valida distancia nuevamente ✓
4. Backend guarda `ocupado_por_usuario_id = 1`
5. Frontend recibe respuesta con `ocupado_por_usuario_id: 1`

### Usuario B ve la plaza:
1. Ve que está ocupada
2. Intenta clickear "Marcar Libre"
3. El botón está deshabilitado (frontend)
4. Incluso si hackea y lo intenta, backend responde HTTP 403

### Usuario A después de 2.5 horas:
- Cron job libera automáticamente
- Siguiente recarga del frontend, ve plaza libre
- O se implementa WebSocket para notificación en tiempo real

