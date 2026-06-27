import { Geolocation } from '@capacitor/geolocation';
import * as L from 'leaflet';

export interface RouteResult {
  points: [number, number][];
  userPos: [number, number];
}

/**
 * Servicio centralizado para el cálculo de rutas utilizando OSRM
 */
export const routeService = {
  /**
   * Obtiene la ruta entre la ubicación actual (o fallback) y un destino
   */
  getRoute: async (destLat: number, destLng: number): Promise<RouteResult> => {
    try {
      console.log(`[RouteService] Calculando ruta a: ${destLat}, ${destLng}`);
      let userPos: [number, number];
      
      try {
        // Intentar obtener GPS real con timeout de 5s
        const position = await Geolocation.getCurrentPosition({ 
          enableHighAccuracy: true, 
          timeout: 5000 
        });
        userPos = [position.coords.latitude, position.coords.longitude];
      } catch (e) {
        console.warn("[RouteService] GPS no disponible, usando fallback IES El Rincón");
        userPos = [28.1287, -15.4468];
      }

      // Consulta a OSRM (Open Source Routing Machine)
      // Nota: OSRM usa formato [lng, lat] para la URL
      const url = `https://router.project-osrm.org/route/v1/driving/${userPos[1]},${userPos[0]};${destLng},${destLat}?overview=full&geometries=geojson`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        // OSRM devuelve [lng, lat], Leaflet necesita [lat, lng]
        const points = data.routes[0].geometry.coordinates.map((p: any) => [p[1], p[0]] as [number, number]);
        console.log(`[RouteService] Ruta obtenida con éxito: ${points.length} puntos`);
        return { points, userPos };
      } else {
        throw new Error("No se encontraron rutas disponibles");
      }
    } catch (error) {
      console.error("[RouteService] Error fatal:", error);
      throw error;
    }
  },

  /**
   * Calcula la ruta y dibuja una polilínea en el mapa Leaflet proporcionado.
   * Devuelve la capa añadida para que puedas eliminarla cuando quieras.
   *
   * @param map       Instancia de L.Map donde se dibujará la ruta
   * @param destLat   Latitud del destino
   * @param destLng   Longitud del destino
   * @param options   Opciones opcionales de estilo para la polilínea
   */
  drawRoute: async (
    map: L.Map,
    destLat: number,
    destLng: number,
    options?: L.PolylineOptions,
  ): Promise<{ polyline: L.Polyline; userMarker: L.Marker; result: RouteResult }> => {
    const result = await routeService.getRoute(destLat, destLng);

    const lineStyle: L.PolylineOptions = {
      color:     '#2563eb',
      weight:    5,
      opacity:   0.85,
      lineJoin:  'round',
      lineCap:   'round',
      ...options,
    };

    const polyline = L.polyline(result.points, lineStyle).addTo(map);

    // Marcador de posición del usuario (coche)
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

    const userMarker = L.marker(result.userPos, { icon: iconoUsuario })
      .addTo(map)
      .bindPopup('Tu posición');

    // Ajustar la vista del mapa para mostrar toda la ruta
    map.fitBounds(polyline.getBounds(), { padding: [40, 40], maxZoom: 17 });

    console.log(`[RouteService] Ruta dibujada en el mapa: ${result.points.length} puntos`);
    return { polyline, userMarker, result };
  },
};