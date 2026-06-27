import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface PosicionGeo {
  latitud: number;
  longitud: number;
  precision: number; // en metros
}

@Injectable({ providedIn: 'root' })
export class GeolocalizacionService {

  constructor() {}

  /**
   * Obtiene la posición actual del usuario
   * @returns Observable que emite la posición o error
   */
  obtenerPosicion(): Observable<PosicionGeo> {
    return new Observable(observer => {
      if (!navigator.geolocation) {
        observer.error({ message: 'Geolocalización no soportada en este dispositivo' });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          observer.next({
            latitud: position.coords.latitude,
            longitud: position.coords.longitude,
            precision: position.coords.accuracy,
          });
          observer.complete();
        },
        (error) => {
          let mensaje = 'Error al obtener geolocalización';
          if (error.code === error.PERMISSION_DENIED) {
            mensaje = 'Permiso de geolocalización denegado';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            mensaje = 'Posición no disponible';
          } else if (error.code === error.TIMEOUT) {
            mensaje = 'Tiempo de espera agotado';
          }
          observer.error({ message: mensaje, code: error.code });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  /**
   * Calcula la distancia en metros entre dos coordenadas
   * Usa la fórmula de Haversine
   */
  calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Radio de la Tierra en metros
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Verifica si el usuario está a menos de 30 metros de una plaza
   */
  estaSuficientementeCerca(
    posicionUsuario: PosicionGeo,
    latitudPlaza: number,
    longitudPlaza: number,
    distanciaMaxima: number = 30
  ): boolean {
    const distancia = this.calcularDistancia(
      posicionUsuario.latitud,
      posicionUsuario.longitud,
      latitudPlaza,
      longitudPlaza
    );
    return distancia <= distanciaMaxima;
  }

  /**
   * Calcula cuántos minutos quedan de ocupación (máximo 150 minutos = 2.5 horas)
   */
  calcularMinutosOcupacion(horaInicio: string | Date): number {
    const inicio = typeof horaInicio === 'string' ? new Date(horaInicio) : horaInicio;
    const ahora = new Date();
    const diferenciaMilisegundos = ahora.getTime() - inicio.getTime();
    const minutosTranscurridos = Math.floor(diferenciaMilisegundos / 60000);

    const MINUTOS_MAXIMOS = 120; // 2 horas
    return Math.max(0, MINUTOS_MAXIMOS - minutosTranscurridos);
  }

  /**
   * Verifica si una plaza puede ser liberada (si está ocupada por más de 2 horas)
   */
  puedeSerLiberada(horaInicio: string | Date): boolean {
    const minutosRestantes = this.calcularMinutosOcupacion(horaInicio);
    return minutosRestantes <= 0;
  }
}
