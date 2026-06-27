import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { IncidenciasService, TipoIncidencia, NuevaIncidencia } from '../../services/incidencias.service';
import { PlazaService, Plaza } from '../../services/plaza.service';
import { AuthService } from '../../services/auth.service';
import { FontScaleService } from '../../services/font-scale.service';

@Component({
  selector: 'app-incidencias',
  templateUrl: 'incidencias.page.html',
  styleUrls: ['incidencias.page.scss'],
  standalone: false,
})
export class IncidenciasPage implements OnInit {

  tiposIncidencia: TipoIncidencia[] = [];

  get fontScale(): number { return this.fontScaleService.scale; }

  form: {
    direccion_plaza: string;
    fecha: string;
    incidencia: string;
    tipo_incidencia_id: number | null;
    plaza_id: number | null;
  } = {
    direccion_plaza: '',
    fecha: new Date().toISOString().split('T')[0],
    incidencia: '',
    tipo_incidencia_id: null,
    plaza_id: null,
  };

  fotoSeleccionada: File | null = null;
  fotoPreview: string | null = null;

  plazas: Plaza[] = [];

  enviando        = false;
  enviandoIntento = false;
  enviado         = false;
  error           = '';

  constructor(
    private incidenciasService: IncidenciasService,
    private plazaService: PlazaService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    public fontScaleService: FontScaleService,
  ) {}

  ngOnInit() {
    this.cargarTipos();
    this.cargarPlazas();

    this.route.queryParams.subscribe(params => {
      if (params['plaza_id']) {
        this.form.plaza_id = Number(params['plaza_id']);
      }
    });
  }

  cargarTipos() {
    this.incidenciasService.obtenerTipos().subscribe({
      next: (tipos) => {
        this.tiposIncidencia = [
          ...tipos.filter(t => !t.nombre.toLowerCase().includes('otro') && !t.nombre.toLowerCase().includes('other')),
          ...tipos.filter(t =>  t.nombre.toLowerCase().includes('otro') ||  t.nombre.toLowerCase().includes('other')),
        ];
      },
      error: () => this.tiposIncidencia = []
    });
  }

  cargarPlazas() {
    this.plazaService.obtenerPlazas().subscribe({
      next: (data) => {
        this.plazas = data;
        this.actualizarDireccionDesdePlaza();
      },
      error: () => this.plazas = []
    });
  }

  onPlazaChange() {
    this.actualizarDireccionDesdePlaza();
  }

  actualizarDireccionDesdePlaza() {
    if (this.form.plaza_id) {
      const plaza = this.plazas.find(p => p.id === this.form.plaza_id);
      if (plaza) this.form.direccion_plaza = plaza.direccion;
    }
  }

  seleccionarTipo(id: number) {
    this.form.tipo_incidencia_id = this.form.tipo_incidencia_id === id ? null : id;
  }

  onFotoChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.fotoSeleccionada = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => this.fotoPreview = e.target?.result as string;
      reader.readAsDataURL(this.fotoSeleccionada);
    }
  }

  async tomarFoto() {
    try {
      const foto = await Camera.getPhoto({ quality: 90, allowEditing: false, resultType: CameraResultType.DataUrl, source: CameraSource.Camera });
      this.fotoPreview = foto.dataUrl ?? null;
      if (foto.dataUrl) {
        const res  = await fetch(foto.dataUrl);
        const blob = await res.blob();
        this.fotoSeleccionada = new File([blob], 'foto_incidencia.jpg', { type: 'image/jpeg' });
      }
    } catch (e) { console.warn('Cámara cancelada', e); }
  }

  async seleccionarDeGaleria() {
    try {
      const foto = await Camera.getPhoto({ quality: 90, allowEditing: false, resultType: CameraResultType.DataUrl, source: CameraSource.Photos });
      this.fotoPreview = foto.dataUrl ?? null;
      if (foto.dataUrl) {
        const res  = await fetch(foto.dataUrl);
        const blob = await res.blob();
        this.fotoSeleccionada = new File([blob], 'foto_incidencia.jpg', { type: 'image/jpeg' });
      }
    } catch (e) { console.warn('Galería cancelada', e); }
  }

  eliminarFoto() {
    this.fotoSeleccionada = null;
    this.fotoPreview      = null;
  }

  formularioValido(): boolean {
    return !!this.form.direccion_plaza.trim() &&
           !!this.form.fecha &&
           !!this.form.incidencia.trim();
  }

  get fechaHoy(): string {
    return new Date().toISOString().split('T')[0];
  }

  enviar() {
    this.enviandoIntento = true;
    if (!this.formularioValido()) return;

    if (!this.authService.estaLogado()) {
      this.error = 'Debes iniciar sesión para reportar una incidencia.';
      this.router.navigate(['/login']);
      return;
    }

    this.enviando = true;
    this.error    = '';

    const datos: NuevaIncidencia = {
      direccion_plaza:    this.form.direccion_plaza,
      fecha:              this.form.fecha,
      incidencia:         this.form.incidencia,
      tipo_incidencia_id: this.form.tipo_incidencia_id,
      plaza_id:           this.form.plaza_id,
    };

    this.incidenciasService.crearIncidencia(datos, this.fotoSeleccionada ?? undefined).subscribe({
      next: () => { this.enviando = false; this.enviado = true; },
      error: (err) => {
        this.enviando = false;
        if (err.status === 401) {
          this.error = 'Tu sesión ha expirado. Inicia sesión nuevamente.';
          this.router.navigate(['/login']);
        } else if (err.status === 422) {
          this.error = err?.error?.message ?? 'Verifica que todos los campos requeridos estén completos.';
        } else {
          this.error = err?.error?.message ?? 'Error al enviar la incidencia. Inténtalo de nuevo.';
        }
      }
    });
  }

  nueva() {
    this.enviado         = false;
    this.enviandoIntento = false;
    this.fotoSeleccionada = null;
    this.fotoPreview     = null;
    this.form = {
      direccion_plaza:    '',
      fecha:              new Date().toISOString().split('T')[0],
      incidencia:         '',
      tipo_incidencia_id: null,
      plaza_id:           null,
    };
  }

  volver() { this.router.navigate(['/home']); }
}
