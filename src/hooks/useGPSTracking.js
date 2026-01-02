/**
 * =========================================================
 * Hook useGPSTracking - Gestión robusta de tracking GPS
 * =========================================================
 *
 * Hook personalizado que maneja el estado de tracking GPS
 * con filtrado inteligente y suavizado de puntos.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  GPS_CONFIG,
  processIncomingPoint,
  movingAverage,
  exponentialSmoothing,
  cleanOldPoints,
  segmentPolyline,
} from "../utils/gpsUtils";

/**
 * Hook para gestionar tracking GPS con filtrado y suavizado
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Estado y métodos del tracking
 */
export function useGPSTracking(options = {}) {
  // Configuración personalizable
  const config = { ...GPS_CONFIG, ...options };
  
  // Estado del tracking
  const [validPoints, setValidPoints] = useState([]); // Puntos válidos (filtrados)
  const [smoothedPoints, setSmoothedPoints] = useState([]); // Puntos suavizados
  const [currentPosition, setCurrentPosition] = useState(null); // Posición actual suavizada
  const [segments, setSegments] = useState([]); // Segmentos de polyline
  const [stats, setStats] = useState({
    totalReceived: 0,
    totalAccepted: 0,
    totalRejected: 0,
    rejectionReasons: {},
  });
  
  // Referencias para mantener estado entre renders
  const lastValidPoint = useRef(null);
  const lastSmoothedPoint = useRef(null);
  
  /**
   * Procesa un nuevo punto GPS entrante
   * @param {Object} point - {lat, lng, accuracy?, timestamp?}
   */
  const addPoint = useCallback(
    (point) => {
      // Asegurar que tenga timestamp
      const pointWithTimestamp = {
        ...point,
        timestamp: point.timestamp || Date.now(),
      };
      
      // Actualizar estadísticas
      setStats((prev) => ({
        ...prev,
        totalReceived: prev.totalReceived + 1,
      }));
      
      // Procesar el punto con todos los filtros
      const result = processIncomingPoint(pointWithTimestamp, {
        lastValidPoint: lastValidPoint.current,
        config,
      });
      
      if (result.accepted) {
        // Punto aceptado, agregarlo
        setValidPoints((prevPoints) => {
          const newPoints = [...prevPoints, pointWithTimestamp];
          
          // Limpiar puntos antiguos
          const cleanedPoints = cleanOldPoints(newPoints, config);
          
          // Actualizar último punto válido
          lastValidPoint.current = pointWithTimestamp;
          
          // Calcular punto suavizado
          let smoothed;
          if (config.SMOOTH_WINDOW > 1) {
            // Usar moving average
            smoothed = movingAverage(cleanedPoints, config.SMOOTH_WINDOW);
          } else {
            // Sin suavizado, usar punto original
            smoothed = { lat: pointWithTimestamp.lat, lng: pointWithTimestamp.lng };
          }
          
          // Alternativamente, podemos usar EMA
          // smoothed = exponentialSmoothing(
          //   { lat: pointWithTimestamp.lat, lng: pointWithTimestamp.lng },
          //   lastSmoothedPoint.current,
          //   0.3
          // );
          
          if (smoothed) {
            lastSmoothedPoint.current = smoothed;
            setCurrentPosition(smoothed);
            setSmoothedPoints((prev) => {
              const newSmoothed = [
                ...prev,
                { ...smoothed, timestamp: pointWithTimestamp.timestamp },
              ];
              return cleanOldPoints(newSmoothed, config);
            });
          }
          
          // Actualizar segmentos para polyline
          const newSegments = segmentPolyline(cleanedPoints, config);
          setSegments(newSegments);
          
          return cleanedPoints;
        });
        
        // Actualizar estadísticas
        setStats((prev) => ({
          ...prev,
          totalAccepted: prev.totalAccepted + 1,
        }));
      } else {
        // Punto rechazado
        if (config.DEBUG) {
          console.log(`📍 GPS Point rejected: ${result.reason}`);
        }
        
        setStats((prev) => ({
          ...prev,
          totalRejected: prev.totalRejected + 1,
          rejectionReasons: {
            ...prev.rejectionReasons,
            [result.reason]: (prev.rejectionReasons[result.reason] || 0) + 1,
          },
        }));
      }
    },
    [config]
  );
  
  /**
   * Resetea todo el tracking
   */
  const reset = useCallback(() => {
    setValidPoints([]);
    setSmoothedPoints([]);
    setCurrentPosition(null);
    setSegments([]);
    lastValidPoint.current = null;
    lastSmoothedPoint.current = null;
    setStats({
      totalReceived: 0,
      totalAccepted: 0,
      totalRejected: 0,
      rejectionReasons: {},
    });
  }, []);
  
  /**
   * Actualiza la configuración en tiempo real
   */
  const updateConfig = useCallback(
    (newConfig) => {
      Object.assign(config, newConfig);
    },
    [config]
  );
  
  /**
   * Obtiene estadísticas de rechazo formateadas
   */
  const getRejectionStats = useCallback(() => {
    const total = stats.totalReceived;
    if (total === 0) return "No data";
    
    const acceptRate = ((stats.totalAccepted / total) * 100).toFixed(1);
    const rejectRate = ((stats.totalRejected / total) * 100).toFixed(1);
    
    return {
      acceptRate: `${acceptRate}%`,
      rejectRate: `${rejectRate}%`,
      totalReceived: total,
      totalAccepted: stats.totalAccepted,
      totalRejected: stats.totalRejected,
      reasons: stats.rejectionReasons,
    };
  }, [stats]);
  
  // Limpieza periódica de puntos antiguos
  useEffect(() => {
    const interval = setInterval(() => {
      setValidPoints((prev) => cleanOldPoints(prev, config));
      setSmoothedPoints((prev) => cleanOldPoints(prev, config));
    }, 60000); // Cada minuto
    
    return () => clearInterval(interval);
  }, [config]);
  
  return {
    // Estado
    validPoints,
    smoothedPoints,
    currentPosition,
    segments,
    stats,
    
    // Métodos
    addPoint,
    reset,
    updateConfig,
    getRejectionStats,
    
    // Info
    hasData: validPoints.length > 0,
    pointCount: validPoints.length,
  };
}

/**
 * Hook para procesar múltiples usuarios con tracking GPS
 * Útil para mapa de promotores con múltiples personas
 */
export function useMultiUserGPSTracking(options = {}) {
  const [userTrackers, setUserTrackers] = useState({});
  
  /**
   * Agrega un punto para un usuario específico
   * @param {string} userId - ID del usuario
   * @param {Object} point - Punto GPS
   */
  const addPointForUser = useCallback(
    (userId, point) => {
      setUserTrackers((prev) => {
        const tracker = prev[userId] || createUserTracker(options);
        tracker.addPoint(point);
        return { ...prev, [userId]: tracker };
      });
    },
    [options]
  );
  
  /**
   * Obtiene el tracker de un usuario
   */
  const getTrackerForUser = useCallback(
    (userId) => {
      return userTrackers[userId];
    },
    [userTrackers]
  );
  
  /**
   * Resetea el tracking de un usuario
   */
  const resetUser = useCallback((userId) => {
    setUserTrackers((prev) => {
      const newTrackers = { ...prev };
      if (newTrackers[userId]) {
        newTrackers[userId].reset();
      }
      return newTrackers;
    });
  }, []);
  
  /**
   * Resetea todos los usuarios
   */
  const resetAll = useCallback(() => {
    setUserTrackers({});
  }, []);
  
  return {
    userTrackers,
    addPointForUser,
    getTrackerForUser,
    resetUser,
    resetAll,
  };
}

/**
 * Crea un tracker individual para un usuario
 * (Helper interno)
 */
function createUserTracker(options) {
  const config = { ...GPS_CONFIG, ...options };
  let validPoints = [];
  let lastValidPoint = null;
  let lastSmoothedPoint = null;
  
  return {
    validPoints: [],
    smoothedPoints: [],
    currentPosition: null,
    segments: [],
    
    addPoint(point) {
      const pointWithTimestamp = {
        ...point,
        timestamp: point.timestamp || Date.now(),
      };
      
      const result = processIncomingPoint(pointWithTimestamp, {
        lastValidPoint,
        config,
      });
      
      if (result.accepted) {
        validPoints.push(pointWithTimestamp);
        validPoints = cleanOldPoints(validPoints, config);
        lastValidPoint = pointWithTimestamp;
        
        const smoothed = movingAverage(validPoints, config.SMOOTH_WINDOW);
        if (smoothed) {
          lastSmoothedPoint = smoothed;
          this.currentPosition = smoothed;
          this.smoothedPoints.push({ ...smoothed, timestamp: pointWithTimestamp.timestamp });
          this.smoothedPoints = cleanOldPoints(this.smoothedPoints, config);
        }
        
        this.validPoints = validPoints;
        this.segments = segmentPolyline(validPoints, config);
      }
    },
    
    reset() {
      validPoints = [];
      lastValidPoint = null;
      lastSmoothedPoint = null;
      this.validPoints = [];
      this.smoothedPoints = [];
      this.currentPosition = null;
      this.segments = [];
    },
  };
}

export default useGPSTracking;
