import { Injectable } from '@angular/core';
import {
  HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();

    // Si hay token, lo añadimos a la cabecera de la petición
    const reqConToken = token
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          }
        })
      : req.clone({
          setHeaders: { Accept: 'application/json' }
        });

    return next.handle(reqConToken).pipe(
      catchError((error: HttpErrorResponse) => {
        // 401: Token ausente o inválido → al login
        // Excepción: endpoints públicos como /liberar no requieren autenticación
        const esEndpointPublico = req.url.includes('/liberar');
        if (error.status === 401 && !esEndpointPublico) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
        // 403: Operación no permitida (ej: liberar plaza de otro usuario)
        // → pasar el error al componente sin redirigir
        if (error.status === 403) {
          console.warn('Operación no permitida (403):', error.error?.message);
        }
        return throwError(() => error);
      })
    );
  }
}
