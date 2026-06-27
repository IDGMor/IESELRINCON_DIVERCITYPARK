import {
  Component, OnInit, ViewChild, ElementRef,
  OnDestroy, NgZone
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as L from 'leaflet';
import { Geolocation } from '@capacitor/geolocation';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { PlazaService, Plaza } from '../../services/plaza.service';
import { GeolocalizacionService } from '../../services/geolocalizacion.service';
import { AuthService } from '../../services/auth.service';
import { FontScaleService } from '../../services/font-scale.service';
import { routeService } from '../../services/routeService';
import { environment } from '../../../environments/environment';


const LAS_PALMAS_LAT = 28.1235;
const LAS_PALMAS_LNG = -15.4366;

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILE_OPTIONS: L.TileLayerOptions = {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom: 19, keepBuffer: 4,
  updateWhenIdle: false, updateWhenZooming: false,
};

function crearIconoEstado(estado: 'libre' | 'ocupada'): L.DivIcon {
  const colorClass = estado === 'libre' ? 'custom-marker-libre' : 'custom-marker-ocupada';
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="custom-marker-pin ${colorClass}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"><circle cx="13" cy="3.5" r="2.5" fill="white"/><path fill="white" d="M11 7.5c-1 0-1.8.8-1.8 1.8v4.2H7l.4 1.5h2l.6-3.5h4.5l1.6 3.8H19v-1.5h-1.8L15.5 10c-.5-1.3-1.7-2.5-3-2.5H11z"/><circle cx="10" cy="19.5" r="3" fill="none" stroke="white" stroke-width="1.8"/><circle cx="17.5" cy="19.5" r="2" fill="white"/></svg></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 42],
    popupAnchor: [0, -46],
  });
}

function crearIconoUsuario(): L.DivIcon {
  return L.divIcon({
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
}

type FiltroEstado = 'todos' | 'libre' | 'ocupada';

export interface PlazaConDistancia extends Plaza {
  _distancia?: number;
}

function distanciaMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { read: ElementRef }) mapContainer?: ElementRef;

  map?: L.Map;
  plazas: Plaza[] = [];
  plazasFiltered: PlazaConDistancia[] = [];

  searchTerm = '';
  filterOptions: { estado: FiltroEstado; furgoneta: boolean; iluminacion: boolean } = {
    estado: 'todos', furgoneta: false, iluminacion: false
  };

  loading        = false;
  error          = '';
  localizando    = false;
  vozEscuchando  = false;

  nombreUsuario: string | null = null;
  estaAutenticado = false;

  buscandoPorCoordenadas = false;
  resultadoBusqueda = '';
  rangos = [50, 100, 200];
  rangoSeleccionado = 50;
  coordsBusqueda?: { lat: number; lng: number };

  posicionUsuario?: { lat: number; lng: number };

  private marcadorUsuario?: L.Marker;
  private circuloRango?: L.Circle;
  private watchId?: string;

  private rutaPolyline?: L.Polyline;
  private rutaUserMarker?: L.Marker;

  // Propiedad enlazada al servicio para el binding [style.--font-scale]
  get fontScale(): number { return this.fontScaleService.scale; }

  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private plazaService: PlazaService,
    private geoService: GeolocalizacionService,
    private ngZone: NgZone,
    private authService: AuthService,
    public fontScaleService: FontScaleService,
  ) {}

  ngOnInit() {
    this.estaAutenticado = this.authService.estaLogado();
    this.nombreUsuario   = this.authService.getUsuario()?.name ?? null;

    this.cargarPlazas();

    this.route.queryParams.subscribe(params => {
      if (params['lat'] && params['lng']) {
        const lat  = parseFloat(params['lat']);
        const lng  = parseFloat(params['lng']);
        const radio = params['radio'] ? parseInt(params['radio']) : 50;
        this.rangoSeleccionado      = radio;
        this.coordsBusqueda         = { lat, lng };
        this.buscandoPorCoordenadas = true;
        this.resultadoBusqueda      = params['nombre'] || 'la ubicación seleccionada';
        if (this.plazas.length > 0) {
          this.filtrarPorCoordenadas(lat, lng, radio);
          this.centrarMapaEnCoordenadas(lat, lng, radio);
        }
      }
    });
  }

  ionViewWillEnter() {
    this.cargarPlazas();
  }

  ionViewDidEnter() {
    this.estaAutenticado = this.authService.estaLogado();
    this.nombreUsuario   = this.authService.getUsuario()?.name ?? null;
    requestAnimationFrame(() => requestAnimationFrame(async () => {
      this.inicializarMapa();
      await this.localizarUsuario();
    }));
  }

  ngOnDestroy() {
    if (this.watchId !== undefined) {
      Geolocation.clearWatch({ id: this.watchId });
      this.watchId = undefined;
    }
    if (this.map) { this.map.remove(); this.map = undefined; }
  }

  // ── Carga plazas ─────────────────────────────────────────
  cargarPlazas() {
    this.loading = true;
    this.plazaService.obtenerPlazas().subscribe({
      next: (data) => {
        this.plazas  = data;
        this.loading = false;
        if (this.buscandoPorCoordenadas && this.coordsBusqueda) {
          this.filtrarPorCoordenadas(this.coordsBusqueda.lat, this.coordsBusqueda.lng, this.rangoSeleccionado);
        } else {
          this.aplicarFiltros();
        }
        if (this.map) this.cargarMarcadores();
      },
      error: () => {
        this.error   = 'Error al cargar las plazas.';
        this.loading = false;
        setTimeout(() => this.error = '', 5000);
      },
    });
  }

  // ── Inicializar mapa ──────────────────────────────────────
  inicializarMapa() {
    if (!this.mapContainer) return;
    if (this.map) { this.map.remove(); this.map = undefined; }

    this.ngZone.runOutsideAngular(() => {
      this.map = L.map(this.mapContainer!.nativeElement, {
        zoomControl:      false,
        scrollWheelZoom:  false,
        doubleClickZoom:  true,
        touchZoom:        true,
        dragging:         true,
        preferCanvas:     true,
      }).setView([LAS_PALMAS_LAT, LAS_PALMAS_LNG], 14);

      L.tileLayer(TILE_URL, TILE_OPTIONS).addTo(this.map!);
      this.map!.invalidateSize(false);

      this.ngZone.run(() => {
        if (this.plazasFiltered.length > 0) this.cargarMarcadores();
        if (this.buscandoPorCoordenadas && this.coordsBusqueda) {
          this.centrarMapaEnCoordenadas(this.coordsBusqueda.lat, this.coordsBusqueda.lng, this.rangoSeleccionado);
        }
      });
    });
  }

  cargarMarcadores() {
    if (!this.map) return;
    this.map.eachLayer(l => {
      if (l instanceof L.Marker && l !== this.marcadorUsuario) this.map?.removeLayer(l);
    });

    this.plazasFiltered.forEach(p => {
      if (!p.latitud || !p.longitud) return;
      const estado = (p.estado === 'libre' || p.estado === 'ocupada') ? p.estado : 'libre';
      const marker = L.marker(
        [parseFloat(p.latitud), parseFloat(p.longitud)],
        { icon: crearIconoEstado(estado) }
      ).addTo(this.map!);

      marker.on('click', () => this.ngZone.run(() => this.abrirModalPlaza(p)));
    });
  }

  // ── Geolocalización ───────────────────────────────────────
  async localizarUsuario() {
    // Cancelar watch previo si existe
    if (this.watchId !== undefined) {
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = undefined;
    }

    // Solicitar permiso nativo (Android / iOS); en web se ignora el catch
    try {
      const permiso = await Geolocation.requestPermissions();
      const concedido = permiso.location === 'granted' || permiso.coarseLocation === 'granted';
      if (!concedido) {
        this.mostrarError('Permiso de localización denegado');
        return;
      }
    } catch { /* en navegador web el permiso se pide al iniciar el watch */ }

    this.localizando = true;
    const esPrimerFix = { valor: true };

    this.watchId = await Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
      (pos, err) => {
        this.ngZone.run(() => {
          if (err || !pos) { this.localizando = false; return; }

          this.localizando = false;
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          this.posicionUsuario = { lat, lng };

          if (!this.map) return;

          if (this.marcadorUsuario) {
            this.marcadorUsuario.setLatLng([lat, lng]);
          } else {
            this.marcadorUsuario = L.marker([lat, lng], { icon: crearIconoUsuario(), zIndexOffset: 1000 })
              .addTo(this.map)
              .bindPopup('<strong>Mi posición</strong>');
          }

          if (esPrimerFix.valor) {
            esPrimerFix.valor = false;
            this.map.setView([lat, lng], 16, { animate: true });
          }
          this.dibujarCirculoUsuario(lat, lng, this.rangoSeleccionado);
        });
      }
    );
  }

  private limpiarRuta() {
    this.rutaPolyline?.remove();
    this.rutaUserMarker?.remove();
    this.rutaPolyline   = undefined;
    this.rutaUserMarker = undefined;
  }

  private async dibujarRuta(lat: number, lng: number) {
    if (!this.map) return;
    this.limpiarRuta();
    try {
      const { polyline, userMarker } = await routeService.drawRoute(this.map, lat, lng);
      this.rutaPolyline   = polyline;
      this.rutaUserMarker = userMarker;
    } catch (e) {
      console.warn('[Home] No se pudo dibujar la ruta:', e);
    }
  }

  private dibujarCirculoUsuario(lat: number, lng: number, radio: number) {
    if (!this.map) return;
    if (this.circuloRango) this.circuloRango.remove();
    this.circuloRango = L.circle([lat, lng], {
      radius: radio,
      color: '#1d4ed8',
      fillColor: '#1d4ed8',
      fillOpacity: 0.07,
      weight: 2,
      dashArray: '6,4',
    }).addTo(this.map);
  }

  // ── Búsqueda voz ──────────────────────────────────────────
  async iniciarVoz() {
    if (this.vozEscuchando) return;
    try {
      const { available } = await SpeechRecognition.available();
      if (!available) {
        this.ngZone.run(() => this.mostrarError('Tu dispositivo no soporta búsqueda por voz'));
        return;
      }

      const permiso = await SpeechRecognition.requestPermissions();
      if (permiso.speechRecognition !== 'granted') {
        this.ngZone.run(() => this.mostrarError('Permiso de micrófono denegado'));
        return;
      }

      this.ngZone.run(() => { this.vozEscuchando = true; });

      // popup: true → diálogo nativo de Android (más fiable que background)
      const { matches } = await SpeechRecognition.start({
        language:       'es-ES',
        maxResults:     1,
        popup:          true,
        partialResults: false,
      });

      const texto = matches?.[0] ?? '';
      if (texto.trim().length >= 3) {
        this.ngZone.run(() => {
          this.searchTerm = texto;
          this.geocodificarCalle(texto.trim());
        });
      }
    } catch {
      // "No match" / "Client side error" → el usuario no dijo nada, no mostramos error
    } finally {
      SpeechRecognition.removeAllListeners();
      this.ngZone.run(() => { this.vozEscuchando = false; });
    }
  }

  // ── Búsqueda por calle ────────────────────────────────────
  buscarConDebounce(event: any) {
    const texto: string = event?.target?.value ?? this.searchTerm;
    if (!texto || texto.trim().length < 3) {
      if (this.buscandoPorCoordenadas) this.limpiarBusqueda();
      else this.aplicarFiltros();
      return;
    }
    this.geocodificarCalle(texto.trim());
  }

  private geocodificarCalle(texto: string) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(texto + ', Las Palmas')}&format=json&limit=1&countrycodes=es`;
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 5000);

    fetch(url, { headers: { 'Accept-Language': 'es', 'User-Agent': 'IESELRINCON/1.0' }, signal: ctrl.signal })
      .then(r => r.json())
      .then((res: any[]) => {
        clearTimeout(tid);
        if (!res?.length) { this.ngZone.run(() => this.aplicarFiltros()); return; }
        const { lat, lon, display_name } = res[0];
        const latN = parseFloat(lat), lonN = parseFloat(lon);
        this.ngZone.run(() => {
          this.coordsBusqueda         = { lat: latN, lng: lonN };
          this.buscandoPorCoordenadas = true;
          this.resultadoBusqueda      = display_name.split(',')[0];
          this.filtrarPorCoordenadas(latN, lonN, this.rangoSeleccionado);
          this.centrarMapaEnCoordenadas(latN, lonN, this.rangoSeleccionado);
          this.dibujarRuta(latN, lonN);
        });
      })
      .catch(() => { clearTimeout(tid); this.ngZone.run(() => this.aplicarFiltros()); });
  }

  seleccionarRango(r: number) {
    this.rangoSeleccionado = r;
    if (this.buscandoPorCoordenadas && this.coordsBusqueda) {
      this.filtrarPorCoordenadas(this.coordsBusqueda.lat, this.coordsBusqueda.lng, r);
      this.centrarMapaEnCoordenadas(this.coordsBusqueda.lat, this.coordsBusqueda.lng, r);
    } else if (this.posicionUsuario) {
      this.dibujarCirculoUsuario(this.posicionUsuario.lat, this.posicionUsuario.lng, r);
    }
  }

  private filtrarPorCoordenadas(lat: number, lng: number, radio: number) {
    let resultado: PlazaConDistancia[] = [];
    this.plazas.forEach(p => {
      if (!p.latitud || !p.longitud) return;
      const dist = distanciaMetros(lat, lng, parseFloat(p.latitud), parseFloat(p.longitud));
      if (dist <= radio) resultado.push({ ...p, _distancia: dist });
    });
    resultado = resultado.sort((a, b) => (a._distancia ?? 0) - (b._distancia ?? 0));
    this.plazasFiltered = this.aplicarFiltrosAdicionales(resultado);
    if (this.map) this.cargarMarcadores();
  }

  private centrarMapaEnCoordenadas(lat: number, lng: number, radio: number) {
    if (!this.map) return;
    if (this.circuloRango) this.circuloRango.remove();
    this.circuloRango = L.circle([lat, lng], {
      radius: radio, color: '#1d4ed8', fillColor: '#1d4ed8',
      fillOpacity: 0.08, weight: 2, dashArray: '6,4',
    }).addTo(this.map);
    this.map.fitBounds(this.circuloRango.getBounds(), { padding: [20, 20] });
  }

  // ── Filtros ───────────────────────────────────────────────
  setFiltroEstado(estado: FiltroEstado) {
    this.filterOptions.estado = estado;
    this.aplicarFiltros();
  }

  toggleFiltroFurgoneta() {
    this.filterOptions.furgoneta = !this.filterOptions.furgoneta;
    this.aplicarFiltros();
  }

  toggleFiltroIluminacion() {
    this.filterOptions.iluminacion = !this.filterOptions.iluminacion;
    this.aplicarFiltros();
  }

  private normalizar(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  private aplicarFiltros() {
    const term = this.normalizar(this.searchTerm);
    let resultado: PlazaConDistancia[] = this.plazas.filter(p => {
      const texto = !term ||
        this.normalizar(p.direccion ?? '').includes(term) ||
        this.normalizar(p.zona ?? '').includes(term);
      return texto;
    });
    this.plazasFiltered = this.aplicarFiltrosAdicionales(resultado);
    if (this.map) this.cargarMarcadores();
  }

  private aplicarFiltrosAdicionales(plazas: PlazaConDistancia[]): PlazaConDistancia[] {
    return plazas.filter(p => {
      if (this.filterOptions.estado !== 'todos' && p.estado !== this.filterOptions.estado) return false;
      if (this.filterOptions.furgoneta && !p.acceso_furgonetas) return false;
      if (this.filterOptions.iluminacion && !p.iluminacion) return false;
      return true;
    });
  }

  limpiarBusqueda() {
    this.searchTerm             = '';
    this.buscandoPorCoordenadas = false;
    this.resultadoBusqueda      = '';
    this.coordsBusqueda         = undefined;
    if (this.circuloRango) { this.circuloRango.remove(); this.circuloRango = undefined; }
    this.limpiarRuta();
    this.map?.setView([LAS_PALMAS_LAT, LAS_PALMAS_LNG], 14, { animate: true });
    this.aplicarFiltros();
  }

  private mostrarError(msg: string) {
    this.error = msg;
    setTimeout(() => this.error = '', 5000);
  }

  // ── Estado modal detalle ─────────────────────────────────
  plazaSeleccionada: PlazaConDistancia | null = null;
  plazaFotoError    = false;
  modalAccionando   = false;
  modalDistancia:   number | null = null;
  modalPuedeOcupar  = false;
  modalPuedeLiberar = false;
  modalDuracion     = 120;
  modalMensaje      = '';
  modalTipoMensaje: 'success' | 'error' | 'info' = 'info';
  modalMostrarMensaje = false;

  readonly duracionesModal = [
    { minutos: 30,  label: '30 minutos' },
    { minutos: 60,  label: '1 hora'     },
    { minutos: 120, label: '2 horas'    },
  ];

  abrirModalPlaza(p: PlazaConDistancia) {
    // Normaliza fotos: puede venir como JSON string '["url"]', array PHP o array PostgreSQL '{url}'
    if (typeof p.fotos === 'string') {
      const s = (p.fotos as string).trim();
      if (s.startsWith('[')) {
        try { p.fotos = JSON.parse(s); } catch { p.fotos = null; }
      } else if (s.startsWith('{') && s.endsWith('}')) {
        // Formato PostgreSQL: {url1,url2}
        p.fotos = s.slice(1, -1).split(',').map(u => u.trim().replace(/^"|"$/g, ''));
      } else if (s.length > 0) {
        p.fotos = [s];
      } else {
        p.fotos = null;
      }
    }
    this.plazaFotoError     = false;
    this.modalAccionando    = false;
    this.modalDistancia     = null;
    this.modalPuedeOcupar   = false;
    this.modalPuedeLiberar  = false;
    this.modalMostrarMensaje = false;
    this.plazaSeleccionada  = p;
    if (p.latitud && p.longitud) {
      this.dibujarRuta(parseFloat(p.latitud), parseFloat(p.longitud));
    }
  }

  cerrarModal() {
    this.plazaSeleccionada   = null;
    this.plazaFotoError      = false;
    this.modalMostrarMensaje = false;
    this.limpiarRuta();
  }

  calcularDistanciaModal() {
    if (!this.plazaSeleccionada?.latitud || !this.plazaSeleccionada?.longitud) return;
    this.geoService.obtenerPosicion().subscribe({
      next: (pos) => {
        const dist = this.geoService.calcularDistancia(
          pos.latitud, pos.longitud,
          parseFloat(this.plazaSeleccionada!.latitud!),
          parseFloat(this.plazaSeleccionada!.longitud!)
        );
        this.modalDistancia    = dist;
        this.modalPuedeOcupar  = dist <= 30;
        this.modalPuedeLiberar = this.modalPuedeOcupar;
      },
      error: (err) => this.mostrarMensajeModal(err.message || 'Error al obtener posición', 'error'),
    });
  }

  ocuparPlazaModal() {
    if (!this.plazaSeleccionada || this.plazaSeleccionada.estado !== 'libre') return;
    this.modalAccionando = true;
    this.geoService.obtenerPosicion().subscribe({
      next: (pos) => {
        const dist = this.geoService.calcularDistancia(
          pos.latitud, pos.longitud,
          parseFloat(this.plazaSeleccionada!.latitud!),
          parseFloat(this.plazaSeleccionada!.longitud!)
        );
        this.modalDistancia   = dist;
        this.modalPuedeOcupar = dist <= 30;
        if (dist > 30) {
          this.mostrarMensajeModal(`Estás a ${Math.round(dist)}m. Debes estar a menos de 30m para ocupar.`, 'error');
          this.modalAccionando = false;
          return;
        }
        this.plazaService.ocuparPlaza(this.plazaSeleccionada!.id, {
          latitud: pos.latitud, longitud: pos.longitud, precision: pos.precision,
          duracion_minutos: this.modalDuracion,
        }).subscribe({
          next: (res) => {
            this.plazaSeleccionada!.estado = res.plaza.estado as 'libre' | 'ocupada';
            // Actualizar también en el array principal para refrescar marcadores
            const idx = this.plazas.findIndex(p => p.id === this.plazaSeleccionada!.id);
            if (idx >= 0) this.plazas[idx].estado = res.plaza.estado as 'libre' | 'ocupada';
            this.aplicarFiltros();
            this.cargarMarcadores();
            this.modalAccionando = false;
            const label = this.duracionesModal.find(d => d.minutos === this.modalDuracion)?.label || '2 horas';
            this.mostrarMensajeModal(`Plaza ocupada por ${label}. Se liberará automáticamente.`, 'success');
          },
          error: (err) => {
            this.modalAccionando = false;
            this.mostrarMensajeModal(err?.error?.message || 'Error al ocupar la plaza', 'error');
          },
        });
      },
      error: (err) => {
        this.modalAccionando = false;
        this.mostrarMensajeModal(err.message || 'Error al obtener posición', 'error');
      },
    });
  }

  ocuparPorOtroVehiculoModal() {
    if (!this.plazaSeleccionada || this.plazaSeleccionada.estado !== 'libre') return;
    this.modalAccionando = true;
    this.geoService.obtenerPosicion().subscribe({
      next: (pos) => {
        const dist = this.geoService.calcularDistancia(
          pos.latitud, pos.longitud,
          parseFloat(this.plazaSeleccionada!.latitud!),
          parseFloat(this.plazaSeleccionada!.longitud!)
        );
        this.modalDistancia   = dist;
        this.modalPuedeOcupar = dist <= 30;
        if (dist > 30) {
          this.mostrarMensajeModal(`Estás a ${Math.round(dist)}m. Debes estar a menos de 30m.`, 'error');
          this.modalAccionando = false;
          return;
        }
        this.plazaService.ocuparPlaza(this.plazaSeleccionada!.id, {
          latitud: pos.latitud, longitud: pos.longitud, precision: pos.precision,
        }).subscribe({
          next: (res) => {
            this.plazaSeleccionada!.estado = res.plaza.estado as 'libre' | 'ocupada';
            const idx = this.plazas.findIndex(p => p.id === this.plazaSeleccionada!.id);
            if (idx >= 0) this.plazas[idx].estado = res.plaza.estado as 'libre' | 'ocupada';
            this.aplicarFiltros();
            this.cargarMarcadores();
            this.modalAccionando = false;
            this.mostrarMensajeModal('Plaza marcada como ocupada por otro vehículo.', 'success');
          },
          error: (err) => {
            this.modalAccionando = false;
            this.mostrarMensajeModal(err?.error?.message || 'Error al marcar la plaza', 'error');
          },
        });
      },
      error: (err) => {
        this.modalAccionando = false;
        this.mostrarMensajeModal(err.message || 'Error al obtener posición', 'error');
      },
    });
  }

  liberarPlazaModal() {
    if (!this.plazaSeleccionada || this.plazaSeleccionada.estado !== 'ocupada') return;
    this.modalAccionando = true;
    this.geoService.obtenerPosicion().subscribe({
      next: (pos) => {
        const dist = this.geoService.calcularDistancia(
          pos.latitud, pos.longitud,
          parseFloat(this.plazaSeleccionada!.latitud!),
          parseFloat(this.plazaSeleccionada!.longitud!)
        );
        this.modalDistancia    = dist;
        this.modalPuedeOcupar  = dist <= 30;
        this.modalPuedeLiberar = this.modalPuedeOcupar;
        if (dist > 30) {
          this.mostrarMensajeModal(`Estás a ${Math.round(dist)}m. Debes estar a menos de 30m para liberar.`, 'error');
          this.modalAccionando = false;
          return;
        }
        this.plazaService.liberarPlaza(this.plazaSeleccionada!.id).subscribe({
          next: () => {
            this.plazaSeleccionada!.estado = 'libre';
            const idx = this.plazas.findIndex(p => p.id === this.plazaSeleccionada!.id);
            if (idx >= 0) this.plazas[idx].estado = 'libre';
            this.aplicarFiltros();
            this.cargarMarcadores();
            this.modalAccionando = false;
            this.mostrarMensajeModal('Plaza liberada correctamente.', 'success');
          },
          error: (err) => {
            this.modalAccionando = false;
            this.mostrarMensajeModal(err?.error?.message || 'Error al liberar la plaza', 'error');
          },
        });
      },
      error: (err) => {
        this.modalAccionando = false;
        this.mostrarMensajeModal(err.message || 'Error al obtener posición', 'error');
      },
    });
  }

  mostrarMensajeModal(mensaje: string, tipo: 'success' | 'error' | 'info' = 'info') {
    this.modalMensaje       = mensaje;
    this.modalTipoMensaje   = tipo;
    this.modalMostrarMensaje = true;
    setTimeout(() => { this.modalMostrarMensaje = false; }, 5000);
  }

  obtenerTiempoFaltante(): string | null {
    if (!this.plazaSeleccionada?.expira_en || this.plazaSeleccionada.estado === 'libre') return null;
    const diff = new Date(this.plazaSeleccionada.expira_en).getTime() - Date.now();
    if (diff <= 0) return null;
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
  }

  getDirectLink(url: string): string {
    if (!url) return '';
    // Si ya es una URL absoluta, devolverla tal cual
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    // Ruta relativa del backend: añadir storageUrl
    const base = environment.storageUrl.replace(/\/$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${base}${path}`;
  }

  comoLlegar(lat: string | null | undefined, lng: string | null | undefined) {
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_system');
    }
  }

  irDetallePagina(id: number) {
    this.plazaSeleccionada = null;
    this.router.navigate(['/detalle-plaza', id]);
  }

  reportarIncidencia(plazaId: number) {
    this.cerrarModal();
    setTimeout(() => {
      this.router.navigate(['/incidencias'], { queryParams: { plaza_id: plazaId } });
    }, 300);
  }

  zoomIn()  { this.map?.zoomIn(); }
  zoomOut() { this.map?.zoomOut(); }

  // ── Navegación ────────────────────────────────────────────
  irDetalle(id: number) { this.router.navigate(['/detalle-plaza', id]); }
  irIncidencias()        { this.router.navigate(['/incidencias']); }
  irRanking()            { this.router.navigate(['/ranking']); }
  irAnadir()             { this.router.navigate(['/anadir-plaza']); }
  irLogin()              { this.router.navigate(['/login']); }
  irPerfil()             { this.router.navigate(['/perfil']); }
}
