import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, Usuario } from '../../services/auth.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: false,
})
export class PerfilPage implements OnInit {

  usuario: Usuario | null = null;
  loading = false;
  error = '';
  cargandoLogout = false;

  // Escala de fuente
  fontScale = 1;
  private readonly FONT_SCALES = [1, 1.2, 1.4];
  private fontScaleIdx = 0;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Recuperar escala de fuente guardada
    const savedScale = localStorage.getItem('fontScaleIdx');
    if (savedScale !== null) {
      this.fontScaleIdx = parseInt(savedScale);
      this.fontScale = this.FONT_SCALES[this.fontScaleIdx] ?? 1;
      document.documentElement.style.setProperty('--font-scale', String(this.fontScale));
    }
    this.cargarPerfil();
  }

  // Control tamaño de letra
  aumentarLetra() {
    this.fontScaleIdx = (this.fontScaleIdx + 1) % this.FONT_SCALES.length;
    this.fontScale = this.FONT_SCALES[this.fontScaleIdx];
    localStorage.setItem('fontScaleIdx', String(this.fontScaleIdx));
    document.documentElement.style.setProperty('--font-scale', String(this.fontScale));
  }

  cargarPerfil() {
    this.loading = true;
    this.authService.obtenerPerfil().subscribe({
      next: (data) => {
        this.usuario = data;
        this.loading = false;
      },
      error: () => {
        // Si falla (token caducado) redirigir al login
        this.loading = false;
        this.router.navigate(['/login']);
      }
    });
  }

  // Convierte "3.50" en estrellas visuales (0-5)
  get estrellas(): number {
    return Math.round(parseFloat(this.usuario?.puntuacion ?? '0'));
  }

  get estrellasArray(): number[] {
    return Array(5).fill(0).map((_, i) => i);
  }

  logout() {
    this.cargandoLogout = true;
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }

  volver() {
    this.router.navigate(['/home']);
  }
}
