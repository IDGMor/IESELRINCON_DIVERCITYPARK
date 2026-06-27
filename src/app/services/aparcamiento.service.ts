import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

export type ZonaType = 'azul' | 'verde';
export type EstadoType = 'buen_estado' | 'deteriorado';
export type OcupacionType = 'libre' | 'ocupado' | 'desconocido';
export type PavimentoType = 'bueno' | 'malo';
export type IluminacionType = 'suficiente' | 'insuficiente';
export type PendienteType = 'plana' | 'con_pendiente';

export interface Aparcamiento {
  id: number;
  nombre: string;
  descripcion: string;
  direccion: string;
  sector: string;
  latitude: number;
  longitude: number;
  disponibles: number;
  total: number;
  zona: ZonaType;
  // Señalización
  senal_vertical: boolean;
  marcas_suelo: boolean;
  num_plazas: number;
  estado: EstadoType;
  // Ocupación
  ocupacion: OcupacionType;
  incidencias_fisicas: string;
  // Accesibilidad
  acceso_furgonetas: boolean;
  pavimento: PavimentoType;
  iluminacion: IluminacionType;
  pendiente: PendienteType;
  observaciones: string;
  // Foto
  foto_url?: string;
}

export interface NuevoAparcamiento {
  nombre: string;
  descripcion: string;
  direccion: string;
  sector: string;
  latitude: number;
  longitude: number;
  total: number;
  disponibles: number;
  zona: ZonaType;
  senal_vertical: boolean;
  marcas_suelo: boolean;
  num_plazas: number;
  estado: EstadoType;
  ocupacion: OcupacionType;
  incidencias_fisicas: string;
  acceso_furgonetas: boolean;
  pavimento: PavimentoType;
  iluminacion: IluminacionType;
  pendiente: PendienteType;
  observaciones: string;
  foto_url?: string;
}

// Mock con datos de ejemplo para Las Palmas
const MOCK_APARCAMIENTOS: Aparcamiento[] = [
  {
    id: 1,
    nombre: 'C. Secretario Padilla, 77',
    descripcion: 'Plaza PMR junto a Mapfre',
    direccion: 'C. Secretario Padilla, 77',
    sector: 'Guanarteme',
    latitude: 28.126126126126128,
    longitude: -15.445556513741147,
    disponibles: 1,
    total: 1,
    zona: 'azul',
    senal_vertical: true,
    marcas_suelo: true,
    num_plazas: 1,
    estado: 'buen_estado',
    ocupacion: 'desconocido',
    incidencias_fisicas: 'bordillo bajo, adecuado para personas con movilidad reducida',
    acceso_furgonetas: true,
    pavimento: 'bueno',
    iluminacion: 'insuficiente',
    pendiente: 'plana',
    observaciones: 'Está bien adaptada para personas con movilidad reducida',
    foto_url: '',
  },
  {
    id: 2,
    nombre: 'Av. Mesa y López, 45',
    descripcion: 'Plaza PMR frente al centro comercial',
    direccion: 'Av. Mesa y López, 45',
    sector: 'Ciudad Alta',
    latitude: 28.1320,
    longitude: -15.4410,
    disponibles: 2,
    total: 2,
    zona: 'verde',
    senal_vertical: true,
    marcas_suelo: true,
    num_plazas: 2,
    estado: 'deteriorado',
    ocupacion: 'libre',
    incidencias_fisicas: 'Pintura desgastada',
    acceso_furgonetas: false,
    pavimento: 'malo',
    iluminacion: 'suficiente',
    pendiente: 'con_pendiente',
    observaciones: 'Necesita repintado urgente',
    foto_url: '',
  },
];

@Injectable({ providedIn: 'root' })
export class AparcamientoService {

  private apiUrl = `${environment.apiUrl}/aparcamientos`;
  private usarMock = true; // cambiar a false cuando el backend esté listo

  constructor(private http: HttpClient) {}

  obtenerAparcamientos(): Observable<Aparcamiento[]> {
    if (this.usarMock) return of(MOCK_APARCAMIENTOS);
    return this.http.get<Aparcamiento[]>(this.apiUrl);
  }

  obtenerAparcamiento(id: number): Observable<Aparcamiento> {
    if (this.usarMock) {
      return of(MOCK_APARCAMIENTOS.find(a => a.id === id) || MOCK_APARCAMIENTOS[0]);
    }
    return this.http.get<Aparcamiento>(`${this.apiUrl}/${id}`);
  }

  crearAparcamiento(datos: NuevoAparcamiento): Observable<Aparcamiento> {
    if (this.usarMock) {
      const nuevo = { ...datos, id: Date.now() } as Aparcamiento;
      MOCK_APARCAMIENTOS.push(nuevo);
      return of(nuevo);
    }
    return this.http.post<Aparcamiento>(this.apiUrl, datos);
  }
}