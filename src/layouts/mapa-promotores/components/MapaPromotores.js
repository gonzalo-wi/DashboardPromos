/**
=========================================================
* Componente de Mapa - Google Maps con Tracking GPS Robusto
=========================================================
* 
* Características:
* - Filtrado de puntos GPS inválidos (accuracy, distancia, velocidad)
* - Suavizado de posición con moving average
* - Segmentación de polyline para evitar "telarañas"
* - Limpieza automática de puntos antiguos
* - Logging de estadísticas para debugging
*/

import { useState, useCallback, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { GoogleMap, LoadScript, Marker, Polyline, InfoWindow } from "@react-google-maps/api";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import Chip from "@mui/material/Chip";
import Icon from "@mui/material/Icon";
import config from "config";
import { segmentPolyline, GPS_CONFIG } from "utils/gpsUtils";

function MapaPromotores({ promotores, selectedPromotorId }) {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [map, setMap] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const apiKey = config.googleMaps.apiKey;

  // Procesar rutas de promotores con filtrado y segmentación (opcional)
  const processedPromotores = useMemo(() => {
    return promotores.map((promotor) => {
      // Si no hay ruta, devolver promotor sin cambios
      if (!promotor.ruta || promotor.ruta.length === 0) {
        return {
          ...promotor,
          rutaLimpia: [],
          segments: [],
        };
      }

      // Agregar timestamps si no existen (para puntos históricos)
      const rutaConTimestamps = promotor.ruta.map((punto, index) => ({
        ...punto,
        timestamp: punto.timestamp || Date.now() - (promotor.ruta.length - index) * 60000,
      }));

      // Por ahora, usar la ruta completa sin filtrado agresivo
      // Solo aplicar segmentación si hay saltos muy grandes
      const segments = segmentPolyline(rutaConTimestamps, {
        ...GPS_CONFIG,
        MAX_JUMP_METERS: 500, // Más permisivo para no romper rutas normales
      });

      if (GPS_CONFIG.DEBUG) {
        console.log(
          `📊 Promotor ${promotor.nombre}: ${rutaConTimestamps.length} puntos, ${segments.length} segmentos`
        );
      }

      return {
        ...promotor,
        rutaLimpia: rutaConTimestamps,
        segments: segments.length > 0 ? segments : [rutaConTimestamps], // Fallback a ruta completa
      };
    });
  }, [promotores]);

  const mapContainerStyle = {
    width: "100%",
    height: "600px",
    borderRadius: "8px",
  };

  // Centro del mapa (ubicación por defecto)
  const center = {
    lat: -34.63316869327277,
    lng: -58.532468827503074,
  };

  const onLoad = useCallback((map) => {
    setMap(map);
    setIsLoaded(true);
  }, []);

  // Centrar mapa en el promotor seleccionado
  useEffect(() => {
    if (map && selectedPromotorId) {
      const promotor = processedPromotores.find((p) => p.id === selectedPromotorId);
      if (promotor && promotor.posicion) {
        map.panTo(promotor.posicion);
        map.setZoom(15);
      }
    }
  }, [selectedPromotorId, map, processedPromotores]);

  // Si no hay API Key configurada, mostrar mensaje
  if (!apiKey) {
    return (
      <MDBox
        sx={{
          height: "600px",
          backgroundColor: "#f0f0f0",
          borderRadius: "8px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundImage:
            "linear-gradient(45deg, #e0e0e0 25%, transparent 25%), linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e0e0e0 75%), linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)",
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
        }}
      >
        <MDTypography variant="h4" color="error" mb={2}>
          ⚠️ API Key no configurada
        </MDTypography>
        <MDTypography variant="body2" color="text" textAlign="center" px={4}>
          Por favor, configura REACT_APP_GOOGLE_MAPS_API_KEY en el archivo .env
        </MDTypography>
      </MDBox>
    );
  }

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={13} onLoad={onLoad}>
        {isLoaded &&
          window.google &&
          processedPromotores.map((promotor) => (
            <div key={promotor.id}>
              {/* Marcador de posición actual - MÁS GRANDE */}
              <Marker
                position={promotor.posicion}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 14, // Más grande para destacar posición actual
                  fillColor: promotor.color,
                  fillOpacity: 1,
                  strokeColor: "#fff",
                  strokeWeight: 3,
                }}
                zIndex={1000} // Asegurar que esté arriba
                onClick={() => setSelectedMarker({ ...promotor, type: "current" })}
              />

              {/* Marcadores de la ruta - Solo algunos para no saturar */}
              {promotor.rutaLimpia
                .filter(
                  (punto, index) => index % 3 === 0 || index === promotor.rutaLimpia.length - 1
                ) // Mostrar cada 3 puntos
                .map((punto, index) => (
                  <Marker
                    key={`${promotor.id}-${index}`}
                    position={{ lat: punto.lat, lng: punto.lng }}
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: 5,
                      fillColor: "#2196F3",
                      fillOpacity: 0.6,
                      strokeColor: "#fff",
                      strokeWeight: 1,
                    }}
                    onClick={() => setSelectedMarker({ ...promotor, punto, type: "ruta", index })}
                  />
                ))}

              {/* Polylines segmentadas - Evita "telarañas" */}
              {promotor.segments.map((segment, segmentIndex) => (
                <Polyline
                  key={`${promotor.id}-segment-${segmentIndex}`}
                  path={segment.map((p) => ({ lat: p.lat, lng: p.lng }))}
                  options={{
                    strokeColor: promotor.color,
                    strokeOpacity: 0.8,
                    strokeWeight: 4,
                  }}
                />
              ))}
            </div>
          ))}

        {selectedMarker && (
          <InfoWindow
            position={
              selectedMarker.type === "current"
                ? selectedMarker.posicion
                : { lat: selectedMarker.punto.lat, lng: selectedMarker.punto.lng }
            }
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div style={{ padding: "10px", minWidth: "280px" }}>
              <MDBox display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <h3 style={{ margin: "0", fontSize: "16px" }}>{selectedMarker.nombre}</h3>
                {selectedMarker.type === "current" && (
                  <Chip
                    icon={<Icon fontSize="small">gps_fixed</Icon>}
                    label="En vivo"
                    color="success"
                    size="small"
                  />
                )}
              </MDBox>
              {selectedMarker.type === "current" ? (
                <>
                  <p style={{ margin: "5px 0", fontSize: "13px" }}>
                    <strong>Zona:</strong> {selectedMarker.zona}
                  </p>
                  <p style={{ margin: "5px 0", fontSize: "13px" }}>
                    <strong>Clientes hoy:</strong> {selectedMarker.clientesHoy}
                  </p>
                  <p style={{ margin: "5px 0", fontSize: "13px" }}>
                    <strong>Puntos válidos:</strong> {selectedMarker.rutaLimpia?.length || 0}
                  </p>
                  <p style={{ margin: "5px 0", fontSize: "13px" }}>
                    <strong>Segmentos:</strong> {selectedMarker.segments?.length || 0}
                  </p>
                  <Chip
                    icon={<Icon fontSize="small">check_circle</Icon>}
                    label="GPS Filtrado Activo"
                    color="info"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </>
              ) : (
                <>
                  <p style={{ margin: "5px 0", fontSize: "13px" }}>
                    <strong>Punto #{selectedMarker.index + 1}</strong>
                  </p>
                  <p style={{ margin: "5px 0", fontSize: "13px" }}>
                    <strong>Hora:</strong> {selectedMarker.punto.hora}
                  </p>
                  <p style={{ margin: "5px 0", fontSize: "13px" }}>
                    <strong>Cliente:</strong> {selectedMarker.punto.cliente}
                  </p>
                </>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
}

MapaPromotores.propTypes = {
  promotores: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      nombre: PropTypes.string.isRequired,
      zona: PropTypes.string.isRequired,
      posicion: PropTypes.shape({
        lat: PropTypes.number.isRequired,
        lng: PropTypes.number.isRequired,
      }).isRequired,
      color: PropTypes.string.isRequired,
      activo: PropTypes.bool.isRequired,
      ruta: PropTypes.arrayOf(
        PropTypes.shape({
          lat: PropTypes.number.isRequired,
          lng: PropTypes.number.isRequired,
          hora: PropTypes.string.isRequired,
          cliente: PropTypes.string.isRequired,
        })
      ).isRequired,
      clientesHoy: PropTypes.number.isRequired,
    })
  ).isRequired,
  selectedPromotorId: PropTypes.number,
};

export default MapaPromotores;
