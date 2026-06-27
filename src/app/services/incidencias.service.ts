import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TipoIncidencia {
  id: number;
  nombre: string;
}

export interface NuevaIncidencia {
  direccion_plaza: string;
  fecha: string;
  incidencia: string;
  tipo_incidencia_id?: number | null;
  plaza_id: number | null;
}

export interface Incidencia{
  id: number;
  plaza_id: number | null;
  tipo_incidencia_id: number | null;
  direccion_plaza: string;
  user_id: number | null;
  fecha: string;
  foto: string | null;
  incidencia: string;
  estado: 'vista' | 'en_tramite' | 'resuelta';
  created_at: string;
  updated_at: string;
  plaza?: { id: number; direccion: string };
  tipo?: { id: number; nombre: string };
  usuario?: { id: number; name: string };
}

export interface RespuestaIncidencia {
  mensaje: string;
  incidencia: Incidencia;
}

@Injectable({ providedIn: 'root' })
export class IncidenciasService {

  private apiUrl = `${environment.apiUrl}/incidencias`;
  private tiposApiUrl = `${environment.apiUrl}/tipos-incidencia`;

  constructor(private http: HttpClient) {}

  obtenerTipos(): Observable<TipoIncidencia[]> {
    return this.http.get<TipoIncidencia[]>(this.tiposApiUrl);
  }

  crearIncidencia(datos: NuevaIncidencia, foto?: File): Observable<RespuestaIncidencia> {
    if (foto) {
      const fd = new FormData();
      fd.append('direccion_plaza', datos.direccion_plaza);
      fd.append('fecha', datos.fecha);
      fd.append('incidencia', datos.incidencia);
      if (datos.tipo_incidencia_id != null) fd.append('tipo_incidencia_id', datos.tipo_incidencia_id.toString());
      if (datos.plaza_id != null) fd.append('plaza_id', datos.plaza_id.toString());
      fd.append('plaza_id', datos.plaza_id?.toString() ?? '');
      fd.append('foto', foto);
      return this.http.post<RespuestaIncidencia>(this.apiUrl, fd);
    }
    return this.http.post<RespuestaIncidencia>(this.apiUrl, datos);
  }

  obtenerIncidencias(params?: { estado?: string; plaza_id?: number }): Observable<Incidencia[]> {
    return this.http.get<Incidencia[]>(this.apiUrl, { params: params as any });
  }
}
