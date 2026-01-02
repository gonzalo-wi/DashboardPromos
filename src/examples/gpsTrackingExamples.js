/**
 * =========================================================
 * Ejemplo de Uso del Sistema de Tracking GPS
 * =========================================================
 *
 * Este archivo muestra cómo usar el sistema de filtrado GPS
 * en diferentes escenarios de tu aplicación.
 */

import { useEffect } from "react";
import PropTypes from "prop-types";
import { useGPSTracking } from "hooks/useGPSTracking";
import { GPS_CONFIG } from "utils/gpsUtils";

/**
 * EJEMPLO 1: Tracking simple de un solo usuario
 */
export function SimpleTrackingExample() {
  const tracking = useGPSTracking({
    MAX_ACCURACY_METERS: 25, // Personalizar configuración
    MAX_SPEED_KMH: 15, // Solo caminando
    DEBUG: true,
  });

  useEffect(() => {
    // Simular recepción de puntos GPS del navegador
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          tracking.addPoint({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        },
        (error) => console.error("GPS Error:", error),
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000,
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [tracking]);

  return (
    <div>
      <h2>Tracking GPS</h2>
      <p>Posición actual: {tracking.currentPosition ? "Disponible" : "Esperando..."}</p>
      <p>Puntos válidos: {tracking.pointCount}</p>
      <p>Estadísticas: {JSON.stringify(tracking.getRejectionStats())}</p>
      
      {/* Renderizar mapa con tracking.segments */}
      {tracking.currentPosition && (
        <div>
          Lat: {tracking.currentPosition.lat.toFixed(6)}, Lng:{" "}
          {tracking.currentPosition.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
}

/**
 * EJEMPLO 2: Integración con Firebase Realtime Database
 */
export function FirebaseTrackingExample({ userId }) {
  const tracking = useGPSTracking();

  useEffect(() => {
    // Suscribirse a Firebase para recibir actualizaciones de ubicación
    const subscribeToUserLocation = (userId) => {
      // Importar Firebase
      const { ref, onValue } = require("firebase/database");
      const database = require("config/firebase").default;

      const locationRef = ref(database, `locations/${userId}`);
      
      const unsubscribe = onValue(locationRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          
          // Procesar cada ubicación
          Object.keys(data).forEach((date) => {
            const dayData = data[date];
            Object.values(dayData).forEach((location) => {
              if (location.latitude && location.longitude) {
                tracking.addPoint({
                  lat: parseFloat(location.latitude),
                  lng: parseFloat(location.longitude),
                  accuracy: location.accuracy,
                  timestamp: new Date(location.timestamp).getTime(),
                });
              }
            });
          });
        }
      });

      return unsubscribe;
    };

    const unsubscribe = subscribeToUserLocation(userId);
    return () => unsubscribe();
  }, [userId, tracking]);

  return <div>{/* Renderizar con tracking.segments para polyline segmentada */}</div>;
}

FirebaseTrackingExample.propTypes = {
  userId: PropTypes.string.isRequired,
};

/**
 * EJEMPLO 3: Integración con Google Maps
 * Nota: Este ejemplo requiere importar GoogleMap, Marker, Polyline
 */
export function GoogleMapsTrackingExample() {
  const tracking = useGPSTracking({
    SMOOTH_WINDOW: 7, // Suavizado más agresivo
    MAX_POINTS: 150,
  });

  // Este es un ejemplo conceptual - requiere imports de @react-google-maps/api
  return (
    <div>
      {/* Posición actual */}
      {tracking.currentPosition && (
        <div>
          Marker grande en: {tracking.currentPosition.lat.toFixed(6)},{" "}
          {tracking.currentPosition.lng.toFixed(6)}
        </div>
      )}

      {/* Polylines segmentadas */}
      {tracking.segments.map((segment, index) => (
        <div key={`segment-${index}`}>
          Segment {index + 1} con {segment.length} puntos
        </div>
      ))}

      {/* Marcadores espaciados */}
      {tracking.validPoints
        .filter((p, i) => i % 5 === 0)
        .map((point, index) => (
          <div key={index}>
            Punto en: {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
          </div>
        ))}
    </div>
  );
}

/**
 * EJEMPLO 4: Configuración personalizada avanzada
 */
export function AdvancedConfigExample() {
  const tracking = useGPSTracking({
    // Filtrado estricto para entorno urbano denso
    MAX_ACCURACY_METERS: 20,
    MIN_DISTANCE_METERS: 10,
    MAX_SPEED_KMH: 60, // Para vehículos
    MAX_JUMP_METERS: 100,
    
    // Suavizado moderado
    SMOOTH_WINDOW: 5,
    
    // Memoria extendida
    MAX_POINTS: 300,
    MAX_TIME_MINUTES: 30,
    
    // Debug deshabilitado en producción
    DEBUG: false,
  });

  // Cambiar configuración dinámicamente
  const handleTransportModeChange = (mode) => {
    if (mode === "walking") {
      tracking.updateConfig({ MAX_SPEED_KMH: 15, MAX_JUMP_METERS: 50 });
    } else if (mode === "cycling") {
      tracking.updateConfig({ MAX_SPEED_KMH: 30, MAX_JUMP_METERS: 80 });
    } else if (mode === "driving") {
      tracking.updateConfig({ MAX_SPEED_KMH: 80, MAX_JUMP_METERS: 150 });
    }
  };

  return (
    <div>
      <button onClick={() => handleTransportModeChange("walking")}>Caminando</button>
      <button onClick={() => handleTransportModeChange("cycling")}>Bicicleta</button>
      <button onClick={() => handleTransportModeChange("driving")}>Auto</button>
      <button onClick={() => tracking.reset()}>Reset Tracking</button>
    </div>
  );
}

/**
 * EJEMPLO 5: Testing manual de puntos
 */
export function TestingExample() {
  const tracking = useGPSTracking({ DEBUG: true });

  const testPoints = [
    { lat: -34.603722, lng: -58.381592, accuracy: 15 }, // Punto válido
    { lat: -34.6038, lng: -58.3816, accuracy: 10 }, // Muy cerca, rechazado
    { lat: -34.6039, lng: -58.3817, accuracy: 45 }, // Accuracy baja, rechazado
    { lat: -34.604, lng: -58.3818, accuracy: 20 }, // Válido
    { lat: -34.65, lng: -58.4, accuracy: 10 }, // Salto imposible, rechazado
  ];

  const runTest = () => {
    console.log("🧪 Iniciando test de filtrado GPS...");
    testPoints.forEach((point, index) => {
      setTimeout(() => {
        tracking.addPoint({
          ...point,
          timestamp: Date.now(),
        });
      }, index * 1000);
    });
  };

  return (
    <div>
      <button onClick={runTest}>Ejecutar Test</button>
      <pre>{JSON.stringify(tracking.getRejectionStats(), null, 2)}</pre>
    </div>
  );
}

/**
 * CONFIGURACIÓN RECOMENDADA POR ESCENARIO
 */
export const RECOMMENDED_CONFIGS = {
  // Promotor caminando
  WALKING: {
    MAX_ACCURACY_METERS: 25,
    MIN_DISTANCE_METERS: 8,
    MAX_SPEED_KMH: 15,
    MAX_JUMP_METERS: 50,
    SMOOTH_WINDOW: 5,
  },
  
  // Repartidor en moto/bici
  DELIVERY: {
    MAX_ACCURACY_METERS: 30,
    MIN_DISTANCE_METERS: 10,
    MAX_SPEED_KMH: 40,
    MAX_JUMP_METERS: 80,
    SMOOTH_WINDOW: 4,
  },
  
  // Vehículo en ciudad
  DRIVING_URBAN: {
    MAX_ACCURACY_METERS: 35,
    MIN_DISTANCE_METERS: 15,
    MAX_SPEED_KMH: 60,
    MAX_JUMP_METERS: 100,
    SMOOTH_WINDOW: 3,
  },
  
  // Vehículo en ruta
  DRIVING_HIGHWAY: {
    MAX_ACCURACY_METERS: 50,
    MIN_DISTANCE_METERS: 30,
    MAX_SPEED_KMH: 130,
    MAX_JUMP_METERS: 200,
    SMOOTH_WINDOW: 2,
  },
  
  // Indoor (gimnasio, shopping)
  INDOOR: {
    MAX_ACCURACY_METERS: 15,
    MIN_DISTANCE_METERS: 5,
    MAX_SPEED_KMH: 8,
    MAX_JUMP_METERS: 30,
    SMOOTH_WINDOW: 7, // Más suavizado para compensar indoor drift
  },
};
