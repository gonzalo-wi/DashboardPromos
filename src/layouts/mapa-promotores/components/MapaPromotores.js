/**
=========================================================
* Componente de Mapa - Google Maps
=========================================================
*/

import { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { GoogleMap, LoadScript, Marker, Polyline, InfoWindow } from "@react-google-maps/api";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import config from "config";

function MapaPromotores({ promotores }) {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [map, setMap] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const apiKey = config.googleMaps.apiKey;

  const mapContainerStyle = {
    width: "100%",
    height: "600px",
    borderRadius: "8px",
  };

  // Centro del mapa (Buenos Aires)
  const center = {
    lat: -34.603722,
    lng: -58.381592,
  };

  const onLoad = useCallback((map) => {
    setMap(map);
    setIsLoaded(true);
  }, []);

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
          promotores.map((promotor) => (
            <div key={promotor.id}>
              {/* Marcador de posición actual */}
              <Marker
                position={promotor.posicion}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: promotor.color,
                  fillOpacity: 1,
                  strokeColor: "#fff",
                  strokeWeight: 2,
                }}
                onClick={() => setSelectedMarker({ ...promotor, type: "current" })}
              />

              {/* Marcadores de la ruta */}
              {promotor.ruta.map((punto, index) => (
                <Marker
                  key={`${promotor.id}-${index}`}
                  position={{ lat: punto.lat, lng: punto.lng }}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 7,
                    fillColor: "#2196F3",
                    fillOpacity: 0.7,
                    strokeColor: "#fff",
                    strokeWeight: 1,
                  }}
                  label={{
                    text: (index + 1).toString(),
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  onClick={() => setSelectedMarker({ ...promotor, punto, type: "ruta", index })}
                />
              ))}

              {/* Línea de la ruta */}
              <Polyline
                path={promotor.ruta.map((p) => ({ lat: p.lat, lng: p.lng }))}
                options={{
                  strokeColor: promotor.color,
                  strokeOpacity: 0.7,
                  strokeWeight: 3,
                }}
              />
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
            <div style={{ padding: "10px" }}>
              <h3 style={{ margin: "0 0 10px 0" }}>{selectedMarker.nombre}</h3>
              {selectedMarker.type === "current" ? (
                <>
                  <p>
                    <strong>Zona:</strong> {selectedMarker.zona}
                  </p>
                  <p>
                    <strong>Clientes hoy:</strong> {selectedMarker.clientesHoy}
                  </p>
                  <p>
                    <strong>Estado:</strong> Activo
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>Parada #{selectedMarker.index + 1}</strong>
                  </p>
                  <p>
                    <strong>Hora:</strong> {selectedMarker.punto.hora}
                  </p>
                  <p>
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
};

export default MapaPromotores;
