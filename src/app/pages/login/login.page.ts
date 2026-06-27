import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {

  formulario: FormGroup;
  loading = false;
  error = '';
  mostrarPassword = false;

  // Escala de fuente
  fontScale = 1;
  private readonly FONT_SCALES = [1, 1.2, 1.4];
  private fontScaleIdx = 0;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.formulario = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });

    // Recuperar escala de fuente guardada
    const savedScale = localStorage.getItem('fontScaleIdx');
    if (savedScale !== null) {
      this.fontScaleIdx = parseInt(savedScale);
      this.fontScale = this.FONT_SCALES[this.fontScaleIdx] ?? 1;
      document.documentElement.style.setProperty('--font-scale', String(this.fontScale));
    }
  }

  // Control tamaño de letra
  aumentarLetra() {
    this.fontScaleIdx = (this.fontScaleIdx + 1) % this.FONT_SCALES.length;
    this.fontScale = this.FONT_SCALES[this.fontScaleIdx];
    localStorage.setItem('fontScaleIdx', String(this.fontScaleIdx));
    document.documentElement.style.setProperty('--font-scale', String(this.fontScale));
  }

  get email()    { return this.formulario.get('email'); }
  get password() { return this.formulario.get('password'); }

  login() {
    if (!this.formulario.valid) { this.formulario.markAllAsTouched(); return; }

    this.loading = true;
    this.error = '';

    this.authService.login(
      this.formulario.value.email,
      this.formulario.value.password
    ).subscribe({
      next: () => { this.loading = false; this.router.navigate(['/home']); },
      error: (err) => {
        this.loading = false;
        if (err.status === 422) this.error = 'Email o contraseña incorrectos.';
        else if (err.status === 403) this.error = 'Tu cuenta está desactivada.';
        else this.error = 'Error de conexión. Inténtalo de nuevo.';
      }
    });
  }

  irRegistro() { this.router.navigate(['/registro']); }
  irHome()     { this.router.navigate(['/home']); }
}
