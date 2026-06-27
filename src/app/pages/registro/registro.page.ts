import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

// Validador personalizado: comprueba que password y confirmación coincidan
function passwordsCoinciden(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmacion = control.get('password_confirmation')?.value;
  return password === confirmacion ? null : { noCoinciden: true };
}

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: false,
})
export class RegistroPage {

  formulario: FormGroup;
  loading = false;
  error = '';
  erroresValidacion: Record<string, string[]> = {};
  mostrarPassword = false;
  mostrarConfirmacion = false;

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
      name:                  ['', [Validators.required, Validators.minLength(2)]],
      email:                 ['', [Validators.required, Validators.email]],
      password:              ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', Validators.required],
    }, { validators: passwordsCoinciden });

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

  get name()                  { return this.formulario.get('name'); }
  get email()                 { return this.formulario.get('email'); }
  get password()              { return this.formulario.get('password'); }
  get password_confirmation() { return this.formulario.get('password_confirmation'); }
  get noCoinciden()           { return this.formulario.hasError('noCoinciden') && this.password_confirmation?.touched; }

  registro() {
    if (!this.formulario.valid) { this.formulario.markAllAsTouched(); return; }

    this.loading = true;
    this.error = '';
    this.erroresValidacion = {};

    this.authService.registro(this.formulario.value).subscribe({
      next: () => { this.loading = false; this.router.navigate(['/home']); },
      error: (err) => {
        this.loading = false;
        if (err.status === 422 && err.error?.errors) {
          // Mostrar errores de validación del servidor campo a campo
          this.erroresValidacion = err.error.errors;
        } else {
          this.error = 'Error al crear la cuenta. Inténtalo de nuevo.';
        }
      }
    });
  }

  irLogin() { this.router.navigate(['/login']); }
}
