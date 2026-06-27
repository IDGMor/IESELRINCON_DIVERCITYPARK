import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Usuario {
  id: number;
  name: string;
  email: string;
  puntuacion: string;
}

export interface AuthResponse {
  token: string;
  user: Usuario;
  message?: string;
}

const TOKEN_KEY = 'ieselrincon_token';
const USER_KEY  = 'ieselrincon_user';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = environment.apiUrl;

  // BehaviorSubject permite que cualquier parte de la app
  // reaccione cuando el usuario cambia (login/logout)
  private usuarioActual = new BehaviorSubject<Usuario | null>(this.cargarUsuarioLocal());
  usuario$ = this.usuarioActual.asObservable();

  constructor(private http: HttpClient) {}

  registro(datos: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, datos).pipe(
      tap(res => this.guardarSesion(res))
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => this.guardarSesion(res))
    );
  }

  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => this.limpiarSesion())
    );
  }

  obtenerPerfil(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/me`).pipe(
      tap(user => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.usuarioActual.next(user);
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  estaLogado(): boolean {
    return !!this.getToken();
  }

  getUsuario(): Usuario | null {
    return this.usuarioActual.value;
  }

  private guardarSesion(res: AuthResponse) {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.usuarioActual.next(res.user);
  }

  private limpiarSesion() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.usuarioActual.next(null);
  }

  private cargarUsuarioLocal(): Usuario | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}