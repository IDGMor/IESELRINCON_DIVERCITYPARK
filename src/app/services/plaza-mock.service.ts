import { Injectable } from '@angular/core';
import { PlazaService, RespuestaOcupar } from './plaza.service';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

/**
 * Servicio MOCK que simula el comportamiento del backend para liberar plazas
 * después de 2.5 horas (150 minutos).
 *
 * Este servicio es TEMPORAL y será reemplazado cuando el backend Laravel
 * implemente la funcionalidad de liberación automática.
 *
 * IMPORTANTE: El backend DEBE validar y gestionar:
 * - La liberación automática de plazas después de 150 minutos
 * - Eventos/webhooks para notificar to frontend cuando se libera una plaza
 * - Persistencia de timestamps de ocupación
 */
@Injectable({ providedIn: 'root' })
export class PlazaMockService {

  // Almacena cuándo se ocuparon las plazas (id -> timestamp)
  private plazasOcupadas = new Map<number, Date>();

  constructor() {}

  /**
   * Simula que el backend registró la ocupación y programó la liberación
   * en 2.5 horas = 150 minutos = 9000 segundos
   */
  registrarOcupacionConLiberacionAutomatica(plazaId: number): Observable<RespuestaOcupar> {
    const ahora = new Date();
    this.plazasOcupadas.set(plazaId, ahora);

    // Simular respuesta exitosa del backend
    const respuesta: RespuestaOcupar = {
      message: 'Plaza ocupada. Se liberará automáticamente en 2.5 horas.',
      plaza: {
        id: plazaId,
        estado: 'ocupada',
        occupado_desde: ahora.toISOString()
      }
    };

    // Programar la liberación automática después de 2 horas
    const MINUTOS_OCUPACION = 2 * 60; // 120 minutos
    setTimeout(() => {
      this.liberarPlazaAutomaticamente(plazaId);
    }, MINUTOS_OCUPACION * 60 * 1000); // convertir a milisegundos

    return of(respuesta).pipe(delay(500)); // Simular latencia de red
  }

  /**
   * Libera automáticamente una plaza (como haría el backend)
   * En producción, el backend enviará una notificación/evento
   */
  private liberarPlazaAutomaticamente(plazaId: number): void {
    this.plazasOcupadas.delete(plazaId);
    console.log(`[MOCK Backend] Plaza ${plazaId} liberada automáticamente después de 2 horas`);

    // TODO: Cuando el backend esté listo, esto será reemplazado por:
    // - Eventos WebSocket/Server-Sent-Events del backend
    // - Polling de estado a intervalos (opción menos eficiente)
  }

  /**
   * Obtiene cuándo fue ocupada una plaza (si está ocupada)
   */
  obtenerTiempoOcupacion(plazaId: number): Date | null {
    return this.plazasOcupadas.get(plazaId) ?? null;
  }

  /**
   * Calcula cuántos minutos le quedan de ocupación a una plaza
   * Retorna null si la plaza está libre
   */
  obtenerMinutosRestantes(plazaId: number): number | null {
    const tiempoOcupacion = this.obtenerTiempoOcupacion(plazaId);
    if (!tiempoOcupacion) return null;

    const MINUTOS_MAXIMOS = 120; // 2 horas
    const ahora = new Date();
    const minutosTranscurridos = Math.floor(
      (ahora.getTime() - tiempoOcupacion.getTime()) / 60000
    );
    const minutosRestantes = Math.max(0, MINUTOS_MAXIMOS - minutosTranscurridos);

    return minutosRestantes;
  }

  /**
   * Verifica si una plaza puede ser liberada manualmente
   * (debería estar cerca del tiempo máximo)
   */
  puedeSerLiberadaManualmente(plazaId: number): boolean {
    const minutosRestantes = this.obtenerMinutosRestantes(plazaId);
    return minutosRestantes !== null && minutosRestantes <= 5; // últimos 5 minutos
  }
}
