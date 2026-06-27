import { Component, OnInit, ViewChild, ElementRef, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { PlazaService } from '../../services/plaza.service';
import { AuthService } from '../../services/auth.service';
import { GeolocalizacionService } from '../../services/geolocalizacion.service';
import { FontScaleService } from '../../services/font-scale.service';
import * as L from 'leaflet';

const LAS_PALMAS_LAT = 28.1235;
const LAS_PALMAS_LNG = -15.4366;
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILE_OPTIONS: L.TileLayerOptions = {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom: 19,
  keepBuffer: 4,
  updateWhenIdle: false,
  updateWhenZooming: false,
};
const iconoDefecto = L.icon({
  iconUrl: 'leaflet/marker-icon.png',
  iconRetinaUrl: 'leaflet/marker-icon-2x.png',
  shadowUrl: 'leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = iconoDefecto;

const iconoUsuario = L.divIcon({
  className: '',
  html: `<div style="
    width:18px;height:18px;
    background:#1d4ed8;
    border:3px solid #fff;
    border-radius:50%;
    box-shadow:0 0 0 4px rgba(29,78,216,0.3)">
  </div>`,
  iconSize: [18, 18], iconAnchor: [9, 9],
});

@Component({
  selector: 'app-anadir-plaza',
  templateUrl: './anadir-plaza.page.html',
  styleUrls: ['./anadir-plaza.page.scss'],
  standalone: false,
})
export class AnadirPlazaPage implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { read: ElementRef }) mapContainer?: ElementRef;

  map?: L.Map;
  formulario!: FormGroup;
  loading = false;
  error = '';
  fotosSeleccionadas: File[] = [];
  fotosPreviews: string[] = [];

  get fontScale(): number { return this.fontScaleService.scale; }

  localizando = false;
  posicionUsuario?: { lat: number; lng: number };
  private marcadorUsuario?: L.Marker;

  constructor(
    private fb: FormBuilder,
    private plazaService: PlazaService,
    private authService: AuthService,
    private geoService: GeolocalizacionService,
    private router: Router,
    private ngZone: NgZone,
    public fontScaleService: FontScaleService,
  ) { this.inicializarFormulario(); }

  ngOnInit() {}

  ionViewDidEnter() {
    this.inicializarMapa();
    this.localizarUsuario();
  }

  ngOnDestroy() {
    if (this.map) { this.map.remove(); this.map = undefined; }
  }

  inicializarFormulario() {
    this.formulario = this.fb.group({
      direccion:           ['', Validators.required],
      zona:                [''],
      sector:              [''],
      latitud:             [''],
      longitud:            [''],
      observaciones:       [''],
      incidencias_fisicas: [''],
      senal_vertical:      [false],
      marcas_en_suelo:     [false],
      acceso_furgonetas:   [false],
      iluminacion:         [false],
      pendiente:           [''],
      pavimento:           [''],
    });
  }

  inicializarMapa() {
    if (!this.mapContainer) return;
    if (this.map) { this.map.remove(); this.map = undefined; }

    this.ngZone.runOutsideAngular(() => {
      this.map = L.map(this.mapContainer!.nativeElement, {
        scrollWheelZoom: false, preferCanvas: true,
      }).setView([LAS_PALMAS_LAT, LAS_PALMAS_LNG], 13);

      L.tileLayer(TILE_URL, TILE_OPTIONS).addTo(this.map!);
      this.map!.invalidateSize(false);

      this.map!.on('click', (e: L.LeafletMouseEvent) => {
        this.ngZone.run(() => {
          const { lat, lng } = e.latlng;
          this.formulario.patchValue({ latitud: lat.toFixed(7), longitud: lng.toFixed(7) });
          this.map?.eachLayer(layer => {
            if (layer instanceof L.Marker && layer !== this.marcadorUsuario) this.map?.removeLayer(layer);
          });
          L.marker([lat, lng]).addTo(this.map!).bindPopup('Cargando dirección...').openPopup();
          this.geocodificarInverso(lat, lng);
        });
      });
    });
  }

  private localizarUsuario() {
    if (!navigator.geolocation) { return; }
    this.localizando = true;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.ngZone.run(() => {
          this.localizando = false;
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          this.posicionUsuario = { lat, lng };

          if (!this.map) return;
          if (this.marcadorUsuario) this.marcadorUsuario.remove();

          this.marcadorUsuario = L.marker([lat, lng], { icon: iconoUsuario })
            .addTo(this.map)
            .bindPopup('<strong>Mi posición</strong>');

          this.map.setView([lat, lng], 16, { animate: true });
        });
      },
      () => { this.ngZone.run(() => { this.localizando = false; }); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  geocodificarInverso(lat: number, lng: number) {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    fetch(url, { headers: { 'Accept-Language': 'es' } })
      .then(res => res.json())
      .then(data => {
        this.ngZone.run(() => {
          const addr = data.address ?? {};
          const calle = addr.road ?? addr.pedestrian ?? addr.footway ?? '';
          const numero = addr.house_number ?? '';
          const direccion = numero ? `${calle}, ${numero}` : calle;
          const zona = addr.neighbourhood ?? addr.suburb ?? addr.city_district ?? addr.quarter ?? '';
          const sector = addr.city_district ?? addr.district ?? addr.borough ?? '';

          this.formulario.patchValue({
            direccion: direccion || data.display_name?.split(',')[0] || '',
            zona,
            sector,
          });

          this.map?.eachLayer(layer => {
            if (layer instanceof L.Marker) {
              layer.setPopupContent(direccion || 'Ubicación seleccionada');
            }
          });
        });
      })
      .catch(() => console.warn('Geocodificación inversa fallida'));
  }

  onFotosSeleccionadas(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.fotosSeleccionadas = [...this.fotosSeleccionadas, ...Array.from(input.files)];
      this.actualizarPreviews();
    }
  }

  async tomarFoto() {
    try {
      const foto = await Camera.getPhoto({ quality: 90, allowEditing: false, resultType: CameraResultType.DataUrl, source: CameraSource.Camera });
      if (foto.dataUrl) {
        const res  = await fetch(foto.dataUrl);
        const blob = await res.blob();
        const file = new File([blob], `foto_plaza_${Date.now()}.jpg`, { type: 'image/jpeg' });
        this.fotosSeleccionadas = [...this.fotosSeleccionadas, file];
        this.fotosPreviews = [...this.fotosPreviews, foto.dataUrl];
      }
    } catch (e) { console.warn('Cámara cancelada', e); }
  }

  async seleccionarDeGaleria() {
    try {
      const foto = await Camera.getPhoto({ quality: 90, allowEditing: false, resultType: CameraResultType.DataUrl, source: CameraSource.Photos });
      if (foto.dataUrl) {
        const res  = await fetch(foto.dataUrl);
        const blob = await res.blob();
        const file = new File([blob], `foto_plaza_${Date.now()}.jpg`, { type: 'image/jpeg' });
        this.fotosSeleccionadas = [...this.fotosSeleccionadas, file];
        this.fotosPreviews = [...this.fotosPreviews, foto.dataUrl];
      }
    } catch (e) { console.warn('Galería cancelada', e); }
  }

  actualizarPreviews() {
    this.fotosPreviews = [];
    this.fotosSeleccionadas.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => this.fotosPreviews.push(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  }

  eliminarFoto(index: number) {
    this.fotosSeleccionadas = this.fotosSeleccionadas.filter((_, i) => i !== index);
    this.fotosPreviews      = this.fotosPreviews.filter((_, i) => i !== index);
  }

  get direccion() { return this.formulario.get('direccion'); }

  guardarPlaza() {
    if (!this.formulario.valid) { this.error = 'La dirección es obligatoria'; return; }

    if (!this.authService.estaLogado()) {
      this.error = 'Debes iniciar sesión para proponer una plaza.';
      this.router.navigate(['/login']);
      return;
    }

    const latitud = this.formulario.get('latitud')?.value;
    const longitud = this.formulario.get('longitud')?.value;
    if (!latitud || !longitud) {
      this.error = 'Debes seleccionar una ubicación en el mapa.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.geoService.obtenerPosicion().subscribe({
      next: (posicion) => {
        const distancia = this.geoService.calcularDistancia(
          posicion.latitud, posicion.longitud,
          parseFloat(latitud), parseFloat(longitud)
        );
        if (distancia > 100) {
          this.error = `Estás a ${Math.round(distancia)}m de distancia. Solo puedes añadir plazas dentro de 100m de tu ubicación actual.`;
          this.loading = false;
          return;
        }
        this.enviarPlaza();
      },
      error: () => {
        this.error = 'No pudimos verificar tu ubicación. Asegúrate de tener GPS activado.';
        this.loading = false;
      }
    });
  }

  private enviarPlaza() {
    const f = this.formulario.value;
    const datos = {
      direccion:           f.direccion,
      zona:                f.zona                || undefined,
      sector:              f.sector              || undefined,
      latitud:             f.latitud             ? parseFloat(f.latitud)  : undefined,
      longitud:            f.longitud            ? parseFloat(f.longitud) : undefined,
      observaciones:       f.observaciones       || undefined,
      incidencias_fisicas: f.incidencias_fisicas || undefined,
      senal_vertical:      f.senal_vertical,
      marcas_en_suelo:     f.marcas_en_suelo,
      acceso_furgonetas:   f.acceso_furgonetas,
      iluminacion:         f.iluminacion,
      pendiente:           f.pendiente           || undefined,
      pavimento:           f.pavimento           || undefined,
    };
    const peticion = this.fotosSeleccionadas.length > 0
      ? this.plazaService.proponerPlazaConFotos(datos, this.fotosSeleccionadas)
      : this.plazaService.proponerPlaza(datos);

    peticion.subscribe({
      next: () => { this.loading = false; this.router.navigate(['/home']); },
      error: (err) => {
        if (err.status === 401) {
          this.error = 'Tu sesión ha expirado. Inicia sesión nuevamente.';
          this.router.navigate(['/login']);
        } else if (err.status === 422) {
          this.error = err?.error?.message || 'Verifica que los datos sean válidos.';
        } else {
          this.error = err?.error?.message || 'Error al enviar la plaza. Intenta de nuevo.';
        }
        this.loading = false;
      },
    });
  }

  cancelar() { this.router.navigate(['/home']); }
}
