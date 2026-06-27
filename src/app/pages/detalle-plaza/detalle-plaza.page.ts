import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as L from 'leaflet';
import { PlazaService, Plaza } from '../../services/plaza.service';
import { GeolocalizacionService } from '../../services/geolocalizacion.service';
import { AuthService } from '../../services/auth.service';
import { FontScaleService } from '../../services/font-scale.service';

function crearIconoPlaza(estado: 'libre' | 'ocupada' = 'libre'): L.DivIcon {
  const colorClass = estado === 'libre' ? 'custom-marker-libre' : 'custom-marker-ocupada';
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="custom-marker-pin ${colorClass}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"><circle cx="13" cy="3.5" r="2.5" fill="white"/><path fill="white" d="M11 7.5c-1 0-1.8.8-1.8 1.8v4.2H7l.4 1.5h2l.6-3.5h4.5l1.6 3.8H19v-1.5h-1.8L15.5 10c-.5-1.3-1.7-2.5-3-2.5H11z"/><circle cx="10" cy="19.5" r="3" fill="none" stroke="white" stroke-width="1.8"/><circle cx="17.5" cy="19.5" r="2" fill="white"/></svg></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 42],
    popupAnchor: [0, -46],
  });
}

const iconoUsuario = L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div class="marcador-usuario-pulso">
      <div class="marcador-usuario-anillo"></div>
      <div class="marcador-usuario-coche">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.1c-.1.3-.1.6-.1.9v5c0 .6.4 1 1 1h2"></path>
          <circle cx="7" cy="17" r="2"></circle>
          <path d="M9 17h6"></path>
          <circle cx="17" cy="17" r="2"></circle>
        </svg>
      </div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

@Component({
  selector: 'app-detalle-plaza',
  templateUrl: './detalle-plaza.page.html',
  styleUrls: ['./detalle-plaza.page.scss'],
  standalone: false,
})
export class DetallePlazaPage implements OnInit, OnDestroy {
  @ViewChild('miniMapContainer', { read: ElementRef }) miniMapContainer?: ElementRef;

  plaza?: Plaza;
  loading    = false;
  accionando = false;
  miniMap?: L.Map;

  get fontScale(): number { return this.fontScaleService.scale; }

  private marcadorPlaza?: L.Marker;
  private marcadorUsuario?: L.Marker;
  private circuloRango?: L.Circle;

  estaAutenticado = false;

  mensaje = '';
  tipoMensaje: 'success' | 'error' | 'info' = 'info';
  mostrarMensaje = false;

  distanciaActual: number | null = null;
  puedeOcupar = false;

  usuarioActual = this.authService.getUsuario();
  puedeLiberar  = false;

  textoBusqueda     = '';
  rangos            = [20, 50, 100];
  rangoSeleccionado = 50;

  duracionesDisponibles = [
    { minutos: 30,  label: '30 minutos' },
    { minutos: 60,  label: '1 hora'     },
    { minutos: 120, label: '2 horas'    },
  ];
  duracionSeleccionada = 120;

  private posicionUsuario?: { latitud: number; longitud: number };

  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public plazaService: PlazaService,
    private geoService: GeolocalizacionService,
    private authService: AuthService,
    public fontScaleService: FontScaleService,
  ) {}

  ngOnInit() {
    this.estaAutenticado = this.authService.estaLogado();
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.cargarPlaza(id);
  }

  ngOnDestroy() {
    if (this.miniMap) {
      this.miniMap.remove();
      this.miniMap = undefined;
    }
  }

  ionViewDidEnter() {
    if (this.plaza)  this.inicializarMiniMapa();
    this.calcularDistancia();
  }

  cargarPlaza(id: number) {
    this.loading = true;
    this.plazaService.obtenerPlaza(id).subscribe({
      next: (data) => {
        this.plaza   = data;
        this.loading = false;
        this.validarPermisosLiberar();
        setTimeout(() => this.inicializarMiniMapa(), 150);
      },
      error: () => { this.loading = false; }
    });
  }

  inicializarMiniMapa() {
    if (!this.miniMapContainer || !this.plaza?.latitud || !this.plaza?.longitud) return;
    if (this.miniMap) { this.miniMap.remove(); this.miniMap = undefined; }

    const lat = parseFloat(this.plaza.latitud);
    const lng = parseFloat(this.plaza.longitud);

    this.miniMap = L.map(this.miniMapContainer.nativeElement, {
      zoomControl:        true,
      dragging:           false,
      scrollWheelZoom:    false,
      doubleClickZoom:    false,
      attributionControl: false,
      touchZoom:          true,
    }).setView([lat, lng], 17);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(this.miniMap);

    const estadoPlaza = (this.plaza.estado === 'libre' || this.plaza.estado === 'ocupada')
      ? this.plaza.estado
      : 'libre';
    this.marcadorPlaza = L.marker([lat, lng], { icon: crearIconoPlaza(estadoPlaza) })
      .addTo(this.miniMap)
      .bindPopup(`<b>${this.plaza.direccion}</b><br>Plaza ${this.plaza.estado}`);

    this.miniMap.invalidateSize(false);

    if (this.posicionUsuario) {
      this.pintarUsuarioEnMapa(this.posicionUsuario.latitud, this.posicionUsuario.longitud);
    }
  }

  private pintarUsuarioEnMapa(lat: number, lng: number) {
    if (!this.miniMap) return;

    if (this.marcadorUsuario) this.marcadorUsuario.remove();
    if (this.circuloRango)    this.circuloRango.remove();

    this.marcadorUsuario = L.marker([lat, lng], { icon: iconoUsuario })
      .addTo(this.miniMap)
      .bindPopup('Tu posición');

    this.circuloRango = L.circle([lat, lng], {
      radius:      30,
      color:       this.puedeOcupar ? '#22c55e' : '#ef4444',
      fillColor:   this.puedeOcupar ? '#22c55e' : '#ef4444',
      fillOpacity: 0.12,
      weight:      2,
    }).addTo(this.miniMap);

    if (this.marcadorPlaza) {
      const bounds = L.latLngBounds([lat, lng], this.marcadorPlaza.getLatLng());
      this.miniMap.fitBounds(bounds, { padding: [30, 30], maxZoom: 18 });
    }
  }

  seleccionarRango(r: number) {
    this.rangoSeleccionado = r;
    if (this.textoBusqueda.trim().length > 2) {
      this.buscarCalleConRango(this.textoBusqueda);
    }
  }

  buscarCalle(event: any) {
    const texto: string = event?.target?.value || this.textoBusqueda;
    if (!texto || texto.trim().length < 3) return;
    this.buscarCalleConRango(texto.trim());
  }

  private buscarCalleConRango(texto: string) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(texto)}&format=json&limit=1&countrycodes=es`;

    fetch(url, { headers: { 'Accept-Language': 'es', 'User-Agent': 'PMR-App/1.0' } })
      .then(r => r.json())
      .then((resultados: any[]) => {
        if (!resultados?.length) {
          this.mostrarMensajeTemp('No se encontró esa calle. Intenta con otra dirección.', 'error');
          return;
        }
        const { lat, lon, display_name } = resultados[0];
        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);

        if (this.miniMap) {
          this.miniMap.setView([latNum, lonNum], 16);
          if (this.circuloRango) this.circuloRango.remove();
          this.circuloRango = L.circle([latNum, lonNum], {
            radius:      this.rangoSeleccionado,
            color:       '#2563eb', fillColor: '#2563eb',
            fillOpacity: 0.10, weight: 2, dashArray: '6,4',
          }).addTo(this.miniMap);
        }

        this.buscarPlazasCercanas(latNum, lonNum, this.rangoSeleccionado);
        this.mostrarMensajeTemp(
          `Mostrando plazas en un radio de ${this.rangoSeleccionado}m cerca de ${display_name.split(',')[0]}`,
          'info'
        );
      })
      .catch(() => this.mostrarMensajeTemp('Error al buscar la calle. Comprueba tu conexión.', 'error'));
  }

  private buscarPlazasCercanas(lat: number, lng: number, radio: number) {
    this.router.navigate(['/plazas'], { queryParams: { lat, lng, radio, origen: 'busqueda' } });
  }

  validarPermisosLiberar() {
    if (!this.plaza || this.plaza.estado === 'libre') {
      this.puedeLiberar = false;
      return;
    }
    // Cualquier usuario cercano puede liberar la plaza
    this.puedeLiberar = this.puedeOcupar;
  }

  calcularDistancia() {
    if (!this.plaza?.latitud || !this.plaza?.longitud) {
      this.mostrarMensajeTemp('La plaza no tiene coordenadas válidas', 'error');
      return;
    }
    if (!this.miniMap) {
      this.inicializarMiniMapa();
      setTimeout(() => this.calcularDistancia(), 300);
      return;
    }

    this.geoService.obtenerPosicion().subscribe({
      next: (posicion) => {
        const latPlaza = parseFloat(this.plaza!.latitud!);
        const lonPlaza = parseFloat(this.plaza!.longitud!);

        this.posicionUsuario = { latitud: posicion.latitud, longitud: posicion.longitud };
        this.distanciaActual = this.geoService.calcularDistancia(
          posicion.latitud, posicion.longitud, latPlaza, lonPlaza
        );
        this.puedeOcupar = this.distanciaActual <= 30;
        this.validarPermisosLiberar();
        this.pintarUsuarioEnMapa(posicion.latitud, posicion.longitud);
      },
      error: (err) => {
        this.mostrarMensajeTemp(
          err.message || 'No se pudo obtener tu posición. Comprueba que tienes el GPS activado.',
          'error'
        );
        this.puedeOcupar = false;
      }
    });
  }

  ocuparPlaza() {
    if (!this.plaza) return;
    if (this.plaza.estado !== 'libre') {
      this.mostrarMensajeTemp('Esta plaza ya está ocupada', 'error');
      return;
    }

    this.accionando = true;

    this.geoService.obtenerPosicion().subscribe({
      next: (posicion) => {
        const latPlaza = parseFloat(this.plaza!.latitud!);
        const lonPlaza = parseFloat(this.plaza!.longitud!);
        const distancia = this.geoService.calcularDistancia(
          posicion.latitud, posicion.longitud, latPlaza, lonPlaza
        );

        this.posicionUsuario = { latitud: posicion.latitud, longitud: posicion.longitud };
        this.distanciaActual = distancia;
        this.puedeOcupar     = distancia <= 30;
        this.pintarUsuarioEnMapa(posicion.latitud, posicion.longitud);

        if (distancia > 30) {
          this.mostrarMensajeTemp(
            `Estás a ${Math.round(distancia)}m. Debes estar a menos de 30m para ocupar la plaza.`,
            'error'
          );
          this.accionando = false;
          return;
        }

        this.plazaService.ocuparPlaza(this.plaza!.id, {
          latitud:           posicion.latitud,
          longitud:          posicion.longitud,
          precision:         posicion.precision,
          duracion_minutos:  this.duracionSeleccionada,
        }).subscribe({
          next: (res) => {
            if (this.plaza) {
              this.plaza.estado = res.plaza.estado as 'libre' | 'ocupada';
              this.plaza.occupado_desde = res.plaza.occupado_desde || new Date().toISOString();
              if (res.plaza.ocupado_por_usuario_id) {
                this.plaza.ocupado_por_usuario_id = res.plaza.ocupado_por_usuario_id;
              }
            }
            this.accionando = false;
            this.validarPermisosLiberar();
            const duracionLabel = this.duracionesDisponibles.find(d => d.minutos === this.duracionSeleccionada)?.label || '2 horas';
            this.mostrarMensajeTemp(`Plaza ocupada por ${duracionLabel}. Se liberará automáticamente.`, 'success');
          },
          error: (err) => {
            this.accionando = false;
            this.mostrarMensajeTemp(err?.error?.message || 'Error al ocupar la plaza', 'error');
          }
        });
      },
      error: (err) => {
        this.accionando = false;
        this.mostrarMensajeTemp(err.message || 'Error al obtener tu posición', 'error');
      }
    });
  }

  ocuparPorOtroVehiculo() {
    if (!this.plaza) return;
    if (this.plaza.estado !== 'libre') {
      this.mostrarMensajeTemp('Esta plaza ya está ocupada', 'error');
      return;
    }

    this.accionando = true;

    this.geoService.obtenerPosicion().subscribe({
      next: (posicion) => {
        const latPlaza = parseFloat(this.plaza!.latitud!);
        const lonPlaza = parseFloat(this.plaza!.longitud!);
        const distancia = this.geoService.calcularDistancia(
          posicion.latitud, posicion.longitud, latPlaza, lonPlaza
        );

        this.posicionUsuario = { latitud: posicion.latitud, longitud: posicion.longitud };
        this.distanciaActual = distancia;
        this.puedeOcupar     = distancia <= 30;
        this.pintarUsuarioEnMapa(posicion.latitud, posicion.longitud);

        if (distancia > 30) {
          this.mostrarMensajeTemp(
            `Estás a ${Math.round(distancia)}m. Debes estar a menos de 30m para reportar la plaza.`,
            'error'
          );
          this.accionando = false;
          return;
        }

        this.plazaService.ocuparPlaza(this.plaza!.id, {
          latitud:   posicion.latitud,
          longitud:  posicion.longitud,
          precision: posicion.precision,
        }).subscribe({
          next: (res) => {
            if (this.plaza) {
              this.plaza.estado = res.plaza.estado as 'libre' | 'ocupada';
              this.plaza.occupado_desde = res.plaza.occupado_desde || new Date().toISOString();
              if (res.plaza.ocupado_por_usuario_id) {
                this.plaza.ocupado_por_usuario_id = res.plaza.ocupado_por_usuario_id;
              }
            }
            this.accionando = false;
            this.validarPermisosLiberar();
            this.mostrarMensajeTemp('Plaza marcada como ocupada por otro vehículo.', 'success');
          },
          error: (err) => {
            this.accionando = false;
            this.mostrarMensajeTemp(err?.error?.message || 'Error al marcar la plaza', 'error');
          }
        });
      },
      error: (err) => {
        this.accionando = false;
        this.mostrarMensajeTemp(err.message || 'Error al obtener tu posición', 'error');
      }
    });
  }

  liberarPlaza() {
    if (!this.plaza || this.plaza.estado !== 'ocupada') return;

    this.accionando = true;

    this.geoService.obtenerPosicion().subscribe({
      next: (posicion) => {
        const latPlaza = parseFloat(this.plaza!.latitud!);
        const lonPlaza = parseFloat(this.plaza!.longitud!);
        const distancia = this.geoService.calcularDistancia(
          posicion.latitud, posicion.longitud, latPlaza, lonPlaza
        );

        this.posicionUsuario = { latitud: posicion.latitud, longitud: posicion.longitud };
        this.distanciaActual = distancia;
        this.puedeOcupar     = distancia <= 30;
        this.validarPermisosLiberar();
        this.pintarUsuarioEnMapa(posicion.latitud, posicion.longitud);

        if (distancia > 30) {
          this.mostrarMensajeTemp(
            `Estás a ${Math.round(distancia)}m. Debes estar a menos de 30m para liberar la plaza.`,
            'error'
          );
          this.accionando = false;
          return;
        }

        this.plazaService.liberarPlaza(this.plaza!.id).subscribe({
          next: () => {
            this.accionando = false;
            this.mostrarMensajeTemp('Plaza liberada correctamente', 'success');
            this.cargarPlaza(this.plaza!.id);
          },
          error: (err) => {
            this.accionando = false;
            this.mostrarMensajeTemp(err?.error?.message || 'Error al liberar la plaza', 'error');
          }
        });
      },
      error: (err) => {
        this.accionando = false;
        this.mostrarMensajeTemp(err.message || 'Error al obtener tu posición', 'error');
      }
    });
  }

  mostrarMensajeTemp(mensaje: string, tipo: 'success' | 'error' | 'info' = 'info') {
    this.mensaje       = mensaje;
    this.tipoMensaje   = tipo;
    this.mostrarMensaje = true;
    setTimeout(() => { this.mostrarMensaje = false; }, 5000);
  }

  comoLlegar() {
    if (!this.plaza?.latitud || !this.plaza?.longitud) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${this.plaza.latitud},${this.plaza.longitud}`, '_blank');
  }

  reportarIncidencia() {
    if (!this.plaza) return;
    this.router.navigate(['/incidencias'], { queryParams: { plaza_id: this.plaza.id } });
  }

  obtenerTiempoFaltante(): string | null {
    if (!this.plaza?.expira_en || this.plaza.estado === 'libre') return null;
    const diferencia = new Date(this.plaza.expira_en).getTime() - Date.now();
    if (diferencia <= 0) return null;
    const minutos = Math.floor(diferencia / 60000);
    const horas   = Math.floor(minutos / 60);
    return horas > 0 ? `${horas}h ${minutos % 60}m` : `${minutos}m`;
  }

  obtenerLabelDuracion(): string {
    return this.duracionesDisponibles.find(d => d.minutos === this.duracionSeleccionada)?.label || '2 horas';
  }

  seleccionarDuracion(minutos: number): void {
    this.duracionSeleccionada = minutos;
  }
}
