import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Plaza {
  id: number;
  direccion: string;
  zona: string | null;
  sector: string | null;
  latitud: string | null;
  longitud: string | null;
  fotos: string[] | null;
  estado: 'libre' | 'ocupada';
  activa: boolean;
  observaciones: string | null;
  incidencias_fisicas: string | null;
  senal_vertical: boolean;
  marcas_en_suelo: boolean;
  acceso_furgonetas: boolean;
  iluminacion: boolean;
  pendiente: string | null;
  pavimento: string | null;
  occupado_desde?: string | null; // Timestamp de cuándo fue marcada como ocupada
  ocupado_por_usuario_id?: number | null; // ID del usuario que ocupó la plaza
  expira_en?: string | null; // Timestamp ISO 8601 de cuándo se liberará automáticamente
}

export interface NuevaPlaza {
  direccion: string;
  zona?: string;
  sector?: string;
  latitud?: number;
  longitud?: number;
  observaciones?: string;
  incidencias_fisicas?: string;
  senal_vertical?: boolean;
  marcas_en_suelo?: boolean;
  acceso_furgonetas?: boolean;
  iluminacion?: boolean;
  pendiente?: string;
  pavimento?: string;
}

export interface RespuestaOcupar {
  message: string;
  plaza: {
    id: number;
    estado: string;
    occupado_desde?: string;
    ocupado_por_usuario_id?: number;
  };
}

export interface DatosOcupacion {
  latitud: number;
  longitud: number;
  precision: number;
  duracion_minutos?: number; // Minutos que se ocupará la plaza (30, 60, 120)
}

@Injectable({ providedIn: 'root' })
export class PlazaService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  obtenerPlazas(filtros?: { estado?: string; zona?: string }): Observable<Plaza[]> {
    let params: any = {};
    if (filtros?.estado) params['estado'] = filtros.estado;
    if (filtros?.zona)   params['zona']   = filtros.zona;
    return this.http.get<Plaza[]>(`${this.apiUrl}/plazas`, { params });
  }

  obtenerPlaza(id: number): Observable<Plaza> {
    // La API no tiene endpoint individual, obtenemos todas y filtramos
    return new Observable(observer => {
      this.http.get<Plaza[]>(`${this.apiUrl}/plazas`).subscribe({
        next: (plazas) => {
          const plaza = plazas.find(p => p.id === id);
          if (plaza) { observer.next(plaza); observer.complete(); }
          else { observer.error({ message: 'Plaza no encontrada' }); }
        },
        error: (err) => observer.error(err)
      });
    });
  }

  proponerPlaza(datos: NuevaPlaza): Observable<{ message: string; plaza: Partial<Plaza> }> {
    return this.http.post<{ message: string; plaza: Partial<Plaza> }>(
      `${this.apiUrl}/plazas`, datos
    );
  }

  proponerPlazaConFotos(datos: NuevaPlaza, fotos: File[]): Observable<{ message: string; plaza: Partial<Plaza> }> {
    const formData = new FormData();
    Object.entries(datos).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Los booleanos deben enviarse como 1/0
        if (typeof value === 'boolean') {
          formData.append(key, value ? '1' : '0');
        } else {
          formData.append(key, String(value));
        }
      }
    });
    fotos.forEach(foto => formData.append('fotos[]', foto));
    return this.http.post<{ message: string; plaza: Partial<Plaza> }>(
      `${this.apiUrl}/plazas`, formData
    );
  }

  /**
   * Marca una plaza como ocupada, enviando datos de geolocalización y duración
   */
  ocuparPlaza(id: number, datosPosicion?: DatosOcupacion): Observable<RespuestaOcupar> {
    const payload: any = {};
    if (datosPosicion) {
      payload.latitud = datosPosicion.latitud;
      payload.longitud = datosPosicion.longitud;
      payload.precision = datosPosicion.precision;
      if (datosPosicion.duracion_minutos) {
        payload.duracion_minutos = datosPosicion.duracion_minutos;
      }
    }
    return this.http.post<RespuestaOcupar>(`${this.apiUrl}/plazas/${id}/ocupar`, payload);
  }

  liberarPlaza(id: number): Observable<RespuestaOcupar> {
    return this.http.post<RespuestaOcupar>(`${this.apiUrl}/plazas/${id}/liberar`, {});
  }

  fotoUrl(ruta: string): string {
    return `${environment.storageUrl}/${ruta}`;
  }
}

