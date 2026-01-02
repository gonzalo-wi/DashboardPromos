/**
=========================================================
* Componente de Mapa de Altas - Google Maps
=========================================================
*/

import { useState, useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import Chip from "@mui/material/Chip";
import Icon from "@mui/material/Icon";
import config from "config";

function MapaAltas({ altas, selectedAltaId }) {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [map, setMap] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const apiKey = config.googleMaps.apiKey;

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

  // Debug: Log de altas recibidas
  useEffect(() => {
    console.log("📍 Altas recibidas en MapaAltas:", altas);
    console.log("📍 Total de altas:", altas.length);
    const altasConCoordenadas = altas.filter((a) => {
      const lat = parseFloat(a.latitud);
      const lng = parseFloat(a.longitud);
      return !isNaN(lat) && !isNaN(lng);
    });
    console.log("📍 Altas con coordenadas válidas:", altasConCoordenadas.length);
    console.log(
      "📍 Muestra de coordenadas:",
      altasConCoordenadas.slice(0, 3).map((a) => ({
        nombre: a.nombre_completo,
        lat: a.latitud,
        lng: a.longitud,
      }))
    );
  }, [altas]);

  // Centrar mapa en el alta seleccionada
  useEffect(() => {
    if (map && selectedAltaId) {
      const alta = altas.find((a) => a.id_alta_cliente_promo === selectedAltaId);
      if (alta && alta.latitud && alta.longitud) {
        const lat = parseFloat(alta.latitud);
        const lng = parseFloat(alta.longitud);
        if (!isNaN(lat) && !isNaN(lng)) {
          map.panTo({ lat, lng });
          map.setZoom(16);
        }
      }
    }
  }, [selectedAltaId, map, altas]);

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

  // Determinar color según visita_consolidada
  const getMarkerColor = (visitaConsolidada) => {
    // visita_consolidada: 0 = rojo, 1 = verde
    return visitaConsolidada === 1 ? "#4CAF50" : "#F44336";
  };

  const getEstadoLabel = (visitaConsolidada) => {
    return visitaConsolidada === 1 ? "Consolidado" : "Pendiente";
  };

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={13} onLoad={onLoad}>
        {altas.map((alta) => {
          const lat = parseFloat(alta.latitud);
          const lng = parseFloat(alta.longitud);

          // Solo mostrar si tiene coordenadas válidas
          if (isNaN(lat) || isNaN(lng)) {
            console.log(
              `⚠️ Alta sin coordenadas válidas: ${alta.nombre_completo} - lat: ${alta.latitud}, lng: ${alta.longitud}`
            );
            return null;
          }

          console.log(
            `✅ Renderizando marcador: ${alta.nombre_completo} - lat: ${lat}, lng: ${lng}`
          );

          return (
            <Marker
              key={alta.id_alta_cliente_promo}
              position={{ lat, lng }}
              icon={{
                path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                scale: 10,
                fillColor: getMarkerColor(alta.visita_consolidada),
                fillOpacity: 1,
                strokeColor: "#fff",
                strokeWeight: 2,
              }}
              onClick={() => setSelectedMarker(alta)}
            />
          );
        })}

        {selectedMarker && (
          <InfoWindow
            position={{
              lat: parseFloat(selectedMarker.latitud),
              lng: parseFloat(selectedMarker.longitud),
            }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div style={{ padding: "10px", minWidth: "250px" }}>
              <h3 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
                {selectedMarker.nombre_completo}
              </h3>
              <MDBox mb={1}>
                <Chip
                  label={getEstadoLabel(selectedMarker.visita_consolidada)}
                  color={selectedMarker.visita_consolidada === 1 ? "success" : "error"}
                  size="small"
                  icon={
                    <Icon fontSize="small">
                      {selectedMarker.visita_consolidada === 1 ? "verified" : "pending"}
                    </Icon>
                  }
                  sx={{ fontWeight: "bold" }}
                />
              </MDBox>
              <p style={{ margin: "5px 0", fontSize: "13px" }}>
                <strong>Dirección:</strong> {selectedMarker.direccion}
              </p>
              <p style={{ margin: "5px 0", fontSize: "13px" }}>
                <strong>Localidad:</strong> {selectedMarker.localidad}
              </p>
              <p style={{ margin: "5px 0", fontSize: "13px" }}>
                <strong>Teléfono:</strong> {selectedMarker.telefono}
              </p>
              <p style={{ margin: "5px 0", fontSize: "13px" }}>
                <strong>Ruta:</strong> {selectedMarker.nro_rto}
              </p>
              <p style={{ margin: "5px 0", fontSize: "13px" }}>
                <strong>Tipo:</strong> {selectedMarker.tipo_cliente}
              </p>
              {selectedMarker.user_promo && (
                <p style={{ margin: "5px 0", fontSize: "13px" }}>
                  <strong>Promotor:</strong> {selectedMarker.user_promo.name}
                </p>
              )}
              <p style={{ margin: "5px 0", fontSize: "13px", color: "#666" }}>
                <strong>Fecha:</strong>{" "}
                {new Date(selectedMarker.created_at).toLocaleDateString("es-AR")}
              </p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
}

MapaAltas.propTypes = {
  altas: PropTypes.arrayOf(
    PropTypes.shape({
      id_alta_cliente_promo: PropTypes.number.isRequired,
      nombre_completo: PropTypes.string.isRequired,
      direccion: PropTypes.string.isRequired,
      localidad: PropTypes.string.isRequired,
      telefono: PropTypes.string.isRequired,
      nro_rto: PropTypes.string.isRequired,
      tipo_cliente: PropTypes.string.isRequired,
      latitud: PropTypes.string,
      longitud: PropTypes.string,
      visitado: PropTypes.number,
      visita_consolidada: PropTypes.number,
      created_at: PropTypes.string.isRequired,
      user_promo: PropTypes.shape({
        name: PropTypes.string,
        username: PropTypes.string,
      }),
    })
  ).isRequired,
  selectedAltaId: PropTypes.number,
};

export default MapaAltas;
