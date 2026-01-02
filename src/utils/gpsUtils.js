/**
 * =========================================================
 * Utilidades para procesamiento GPS - Filtrado y Suavizado
 * =========================================================
 *
 * Sistema robusto para eliminar GPS jitter/drift y crear
 * recorridos suaves sin "telarañas" ni saltos imposibles.
 */

// ==================== CONSTANTES CONFIGURABLES ====================

export const GPS_CONFIG = {
  // Filtrado de precisión
  MAX_ACCURACY_METERS: 30, // Descartar puntos con accuracy > 30m

  // Filtrado de distancia mínima (evitar ruido)
  MIN_DISTANCE_METERS: 8, // No agregar puntos muy cercanos (< 8m)

  // Filtrado de velocidad máxima (según modo de transporte)
  MAX_SPEED_KMH: 40, // Velocidad máxima razonable (40 km/h para moto/auto lento)

  // Detección de saltos imposibles
  MAX_JUMP_METERS: 60, // Si distancia > 60m, considerar salto

  // Suavizado (moving average)
  SMOOTH_WINDOW: 5, // Últimos N puntos para calcular promedio

  // Límites de memoria
  MAX_POINTS: 200, // Máximo de puntos en memoria
  MAX_TIME_MINUTES: 15, // Máximo de tiempo de historial (minutos)

  // Opciones de debugging
  DEBUG: true, // Habilitar logs de depuración
};

// ==================== UTILIDADES MATEMÁTICAS ====================

/**
 * Calcula la distancia entre dos puntos GPS usando la fórmula de Haversine
 * @param {Object} point1 - {lat, lng}
 * @param {Object} point2 - {lat, lng}
 * @returns {number} Distancia en metros
 */
export function haversineDistanceMeters(point1, point2) {
  const R = 6371000; // Radio de la Tierra en metros
  const toRad = (deg) => (deg * Math.PI) / 180;

  const lat1 = toRad(point1.lat);
  const lat2 = toRad(point2.lat);
  const deltaLat = toRad(point2.lat - point1.lat);
  const deltaLng = toRad(point2.lng - point1.lng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calcula la velocidad en km/h dado distancia y tiempo
 * @param {number} distanceMeters - Distancia en metros
 * @param {number} deltaTimeMs - Diferencia de tiempo en milisegundos
 * @returns {number} Velocidad en km/h
 */
export function speedKmh(distanceMeters, deltaTimeMs) {
  if (deltaTimeMs === 0) return 0;
  const hours = deltaTimeMs / (1000 * 60 * 60);
  const kilometers = distanceMeters / 1000;
  return kilometers / hours;
}

/**
 * Calcula el promedio de una lista de coordenadas (moving average)
 * @param {Array} points - Array de {lat, lng, timestamp}
 * @param {number} windowSize - Tamaño de la ventana
 * @returns {Object} Punto promedio {lat, lng}
 */
export function movingAverage(points, windowSize) {
  const window = points.slice(-windowSize);

  if (window.length === 0) return null;

  const avgLat = window.reduce((sum, p) => sum + p.lat, 0) / window.length;
  const avgLng = window.reduce((sum, p) => sum + p.lng, 0) / window.length;

  return { lat: avgLat, lng: avgLng };
}

/**
 * Suavizado exponencial (EMA - Exponential Moving Average)
 * @param {Object} newPoint - Nuevo punto {lat, lng}
 * @param {Object} oldSmoothed - Punto suavizado anterior {lat, lng}
 * @param {number} alpha - Factor de suavizado (0-1), mayor = más responsive
 * @returns {Object} Punto suavizado {lat, lng}
 */
export function exponentialSmoothing(newPoint, oldSmoothed, alpha = 0.3) {
  if (!oldSmoothed) return newPoint;

  return {
    lat: alpha * newPoint.lat + (1 - alpha) * oldSmoothed.lat,
    lng: alpha * newPoint.lng + (1 - alpha) * oldSmoothed.lng,
  };
}

// ==================== VALIDACIÓN Y FILTRADO ====================

/**
 * Valida si un punto GPS es confiable según accuracy
 * @param {Object} point - Punto con {lat, lng, accuracy}
 * @param {Object} config - Configuración GPS
 * @returns {Object} {valid: boolean, reason: string}
 */
export function validateAccuracy(point, config = GPS_CONFIG) {
  if (!point.accuracy) {
    return { valid: true, reason: "No accuracy data" };
  }

  if (point.accuracy > config.MAX_ACCURACY_METERS) {
    return {
      valid: false,
      reason: `Accuracy too low: ${point.accuracy.toFixed(1)}m > ${config.MAX_ACCURACY_METERS}m`,
    };
  }

  return { valid: true, reason: "Accuracy OK" };
}

/**
 * Valida si la distancia al último punto es suficiente
 * @param {Object} point - Nuevo punto {lat, lng}
 * @param {Object} lastPoint - Último punto válido {lat, lng}
 * @param {Object} config - Configuración GPS
 * @returns {Object} {valid: boolean, reason: string, distance: number}
 */
export function validateDistance(point, lastPoint, config = GPS_CONFIG) {
  if (!lastPoint) {
    return { valid: true, reason: "First point", distance: 0 };
  }

  const distance = haversineDistanceMeters(lastPoint, point);

  if (distance < config.MIN_DISTANCE_METERS) {
    return {
      valid: false,
      reason: `Distance too small: ${distance.toFixed(1)}m < ${config.MIN_DISTANCE_METERS}m`,
      distance,
    };
  }

  return { valid: true, reason: "Distance OK", distance };
}

/**
 * Valida si la velocidad es razonable (no es un salto imposible)
 * @param {number} distance - Distancia en metros
 * @param {number} deltaTimeMs - Tiempo transcurrido en ms
 * @param {Object} config - Configuración GPS
 * @returns {Object} {valid: boolean, reason: string, speed: number}
 */
export function validateSpeed(distance, deltaTimeMs, config = GPS_CONFIG) {
  if (deltaTimeMs === 0) {
    return { valid: false, reason: "Zero time delta", speed: 0 };
  }

  const speed = speedKmh(distance, deltaTimeMs);

  if (speed > config.MAX_SPEED_KMH) {
    return {
      valid: false,
      reason: `Speed too high: ${speed.toFixed(1)} km/h > ${config.MAX_SPEED_KMH} km/h`,
      speed,
    };
  }

  return { valid: true, reason: "Speed OK", speed };
}

/**
 * Detecta si es un salto imposible (teleporting)
 * @param {number} distance - Distancia en metros
 * @param {Object} config - Configuración GPS
 * @returns {Object} {isJump: boolean, shouldBreakSegment: boolean}
 */
export function detectJump(distance, config = GPS_CONFIG) {
  if (distance > config.MAX_JUMP_METERS) {
    return {
      isJump: true,
      shouldBreakSegment: true,
      reason: `Jump detected: ${distance.toFixed(1)}m > ${config.MAX_JUMP_METERS}m`,
    };
  }

  return { isJump: false, shouldBreakSegment: false, reason: "No jump" };
}

// ==================== PROCESAMIENTO PRINCIPAL ====================

/**
 * Procesa un punto GPS entrante aplicando todos los filtros
 * @param {Object} incomingPoint - Punto nuevo {lat, lng, accuracy, timestamp}
 * @param {Object} state - Estado actual {lastValidPoint, validPoints, config}
 * @returns {Object} {accepted: boolean, reason: string, metrics: Object}
 */
export function processIncomingPoint(incomingPoint, state) {
  const { lastValidPoint, config = GPS_CONFIG } = state;
  const metrics = { distance: 0, speed: 0, accuracy: incomingPoint.accuracy };

  // Paso 1: Validar accuracy
  const accuracyCheck = validateAccuracy(incomingPoint, config);
  if (!accuracyCheck.valid) {
    if (config.DEBUG) console.log("❌ GPS: " + accuracyCheck.reason);
    return { accepted: false, reason: accuracyCheck.reason, metrics };
  }

  // Si es el primer punto, aceptar directamente
  if (!lastValidPoint) {
    if (config.DEBUG) console.log("✅ GPS: First point accepted");
    return { accepted: true, reason: "First point", metrics };
  }

  // Paso 2: Calcular distancia y tiempo
  const distanceCheck = validateDistance(incomingPoint, lastValidPoint, config);
  metrics.distance = distanceCheck.distance;

  if (!distanceCheck.valid) {
    if (config.DEBUG) console.log("❌ GPS: " + distanceCheck.reason);
    return { accepted: false, reason: distanceCheck.reason, metrics };
  }

  // Paso 3: Validar velocidad
  const deltaTimeMs = incomingPoint.timestamp - lastValidPoint.timestamp;
  const speedCheck = validateSpeed(distanceCheck.distance, deltaTimeMs, config);
  metrics.speed = speedCheck.speed;

  if (!speedCheck.valid) {
    if (config.DEBUG) console.log("⚠️ GPS: " + speedCheck.reason);
    return { accepted: false, reason: speedCheck.reason, metrics };
  }

  // Paso 4: Detectar saltos
  const jumpCheck = detectJump(distanceCheck.distance, config);
  if (jumpCheck.isJump) {
    if (config.DEBUG) console.log("🚫 GPS: " + jumpCheck.reason);
    return { accepted: false, reason: jumpCheck.reason, metrics, shouldBreakSegment: true };
  }

  // Punto válido
  if (config.DEBUG) {
    console.log(
      `✅ GPS: Point accepted - Distance: ${metrics.distance.toFixed(
        1
      )}m, Speed: ${metrics.speed.toFixed(1)} km/h`
    );
  }

  return { accepted: true, reason: "All checks passed", metrics };
}

// ==================== LIMPIEZA DE DATOS ====================

/**
 * Limpia puntos antiguos según límites de memoria y tiempo
 * @param {Array} points - Array de puntos {lat, lng, timestamp}
 * @param {Object} config - Configuración GPS
 * @returns {Array} Puntos filtrados
 */
export function cleanOldPoints(points, config = GPS_CONFIG) {
  let filtered = points;

  // Límite por cantidad
  if (filtered.length > config.MAX_POINTS) {
    const excess = filtered.length - config.MAX_POINTS;
    filtered = filtered.slice(excess);
    if (config.DEBUG)
      console.log(`🧹 GPS: Removed ${excess} old points (limit ${config.MAX_POINTS})`);
  }

  // Límite por tiempo
  const now = Date.now();
  const maxAge = config.MAX_TIME_MINUTES * 60 * 1000;
  const beforeCount = filtered.length;
  filtered = filtered.filter((p) => now - p.timestamp < maxAge);

  const removed = beforeCount - filtered.length;
  if (removed > 0 && config.DEBUG) {
    console.log(`🧹 GPS: Removed ${removed} points older than ${config.MAX_TIME_MINUTES} minutes`);
  }

  return filtered;
}

/**
 * Divide puntos en segmentos continuos (sin saltos)
 * @param {Array} points - Array de puntos ordenados por timestamp
 * @param {Object} config - Configuración GPS
 * @returns {Array<Array>} Array de segmentos, cada uno es un array de puntos
 */
export function segmentPolyline(points, config = GPS_CONFIG) {
  if (points.length === 0) return [];

  const segments = [];
  let currentSegment = [points[0]];

  for (let i = 1; i < points.length; i++) {
    const distance = haversineDistanceMeters(points[i - 1], points[i]);

    // Si hay un salto, cerrar segmento actual y empezar uno nuevo
    if (distance > config.MAX_JUMP_METERS) {
      segments.push(currentSegment);
      currentSegment = [points[i]];
      if (config.DEBUG) {
        console.log(`✂️ GPS: Segment break at point ${i}, distance: ${distance.toFixed(1)}m`);
      }
    } else {
      currentSegment.push(points[i]);
    }
  }

  // Agregar el último segmento
  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  if (config.DEBUG) console.log(`📊 GPS: ${segments.length} segments created`);

  return segments;
}
