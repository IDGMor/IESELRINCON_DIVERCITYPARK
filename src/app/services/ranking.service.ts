import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RankingUsuario {
  posicion: number;
  id: number;
  name: string;
  puntuacion: number;
  estrellas: boolean[];           // array de 5 booleanos
  incidencias_totales: number;
  incidencias_resueltas: number;
}

export interface RespuestaRanking {
  total: number;
  ranking: RankingUsuario[];
}

@Injectable({ providedIn: 'root' })
export class RankingService {

  private apiUrl = `${environment.apiUrl}/ranking`;

  constructor(private http: HttpClient) {}

  obtenerRanking(limit = 20): Observable<RespuestaRanking> {
    return this.http.get<RespuestaRanking>(`${this.apiUrl}?limit=${limit}`);
  }

  obtenerPosicionUsuario(userId: number): Observable<RankingUsuario> {
    return this.http.get<RankingUsuario>(`${this.apiUrl}/${userId}`);
  }
}
