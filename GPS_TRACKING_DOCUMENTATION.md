# 📍 Sistema de Tracking GPS Robusto

## Descripción General

Sistema avanzado de procesamiento GPS que elimina el "jitter" (temblor), "drift" (deriva) y saltos imposibles en el tracking de ubicación en tiempo real. Diseñado para evitar las molestas "telarañas" en mapas causadas por datos GPS imprecisos.

## 🎯 Objetivos

- **Filtrado Inteligente**: Rechazar puntos GPS inválidos por accuracy, distancia o velocidad imposible
- **Suavizado de Posición**: Aplicar moving average o filtro exponencial para posiciones fluidas
- **Segmentación de Rutas**: Dividir polylines cuando hay saltos grandes (evitar líneas cruzadas)
- **Gestión de Memoria**: Mantener solo los últimos N puntos o X minutos de historial
- **Performance**: Optimización para no saturar el render del mapa

## 📦 Archivos Incluidos

```
src/
├── utils/
│   └── gpsUtils.js              # Utilidades de cálculo y filtrado GPS
├── hooks/
│   └── useGPSTracking.js        # Hook para gestión de tracking
└── examples/
    └── gpsTrackingExamples.js   # Ejemplos de uso
```

## 🚀 Uso Rápido

### 1. Importar el hook

```javascript
import { useGPSTracking } from "hooks/useGPSTracking";
```

### 2. Inicializar tracking

```javascript
const tracking = useGPSTracking({
  MAX_ACCURACY_METERS: 30,  // Rechazar si accuracy > 30m
  MAX_SPEED_KMH: 40,         // Velocidad máxima razonable
  MAX_JUMP_METERS: 60,       // Detectar saltos imposibles
  SMOOTH_WINDOW: 5,          // Suavizado con últimos 5 puntos
  DEBUG: true,               // Ver logs en consola
});
```

### 3. Agregar puntos GPS

```javascript
// Desde navigator.geolocation
navigator.geolocation.watchPosition((position) => {
  tracking.addPoint({
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestamp: position.timestamp,
  });
});

// O desde tu API/Firebase
tracking.addPoint({
  lat: -34.603722,
  lng: -58.381592,
  accuracy: 15,
  timestamp: Date.now(),
});
```

### 4. Renderizar en Google Maps

```javascript
<GoogleMap>
  {/* Marcador de posición actual (grande) */}
  {tracking.currentPosition && (
    <Marker
      position={tracking.currentPosition}
      icon={{
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 15,
        fillColor: "#4CAF50",
        fillOpacity: 1,
        strokeColor: "#fff",
        strokeWeight: 3,
      }}
    />
  )}

  {/* Polylines segmentadas (sin telarañas) */}
  {tracking.segments.map((segment, index) => (
    <Polyline
      key={index}
      path={segment}
      options={{
        strokeColor: "#2196F3",
        strokeOpacity: 0.8,
        strokeWeight: 4,
      }}
    />
  ))}
</GoogleMap>
```

## ⚙️ Configuración Detallada

### Parámetros Disponibles

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `MAX_ACCURACY_METERS` | number | 30 | Accuracy máxima aceptable. Rechaza puntos con mayor error |
| `MIN_DISTANCE_METERS` | number | 8 | Distancia mínima entre puntos. Evita ruido de GPS estático |
| `MAX_SPEED_KMH` | number | 40 | Velocidad máxima razonable. Detecta saltos imposibles |
| `MAX_JUMP_METERS` | number | 60 | Distancia máxima sin romper segmento de polyline |
| `SMOOTH_WINDOW` | number | 5 | Ventana de suavizado (moving average) |
| `MAX_POINTS` | number | 200 | Máximo de puntos en memoria |
| `MAX_TIME_MINUTES` | number | 15 | Máximo tiempo de historial |
| `DEBUG` | boolean | true | Habilitar logs de depuración |

### Configuraciones Recomendadas por Escenario

#### 🚶 Promotor Caminando
```javascript
{
  MAX_ACCURACY_METERS: 25,
  MIN_DISTANCE_METERS: 8,
  MAX_SPEED_KMH: 15,
  MAX_JUMP_METERS: 50,
  SMOOTH_WINDOW: 5,
}
```

#### 🏍️ Repartidor en Moto/Bici
```javascript
{
  MAX_ACCURACY_METERS: 30,
  MIN_DISTANCE_METERS: 10,
  MAX_SPEED_KMH: 40,
  MAX_JUMP_METERS: 80,
  SMOOTH_WINDOW: 4,
}
```

#### 🚗 Vehículo en Ciudad
```javascript
{
  MAX_ACCURACY_METERS: 35,
  MIN_DISTANCE_METERS: 15,
  MAX_SPEED_KMH: 60,
  MAX_JUMP_METERS: 100,
  SMOOTH_WINDOW: 3,
}
```

#### 🏢 Indoor (Shopping, Gimnasio)
```javascript
{
  MAX_ACCURACY_METERS: 15,
  MIN_DISTANCE_METERS: 5,
  MAX_SPEED_KMH: 8,
  MAX_JUMP_METERS: 30,
  SMOOTH_WINDOW: 7, // Más suavizado para compensar drift indoor
}
```

## 🔍 API del Hook

### Retorna

```typescript
{
  // Estado
  validPoints: Point[],          // Puntos filtrados y validados
  smoothedPoints: Point[],       // Puntos suavizados
  currentPosition: {lat, lng},   // Posición actual suavizada
  segments: Point[][],           // Segmentos para polyline
  stats: Statistics,             // Estadísticas de filtrado
  
  // Métodos
  addPoint: (point) => void,     // Agregar nuevo punto GPS
  reset: () => void,             // Resetear todo el tracking
  updateConfig: (config) => void,// Actualizar configuración en vivo
  getRejectionStats: () => Stats,// Obtener estadísticas formateadas
  
  // Info
  hasData: boolean,              // Si hay datos disponibles
  pointCount: number,            // Cantidad de puntos válidos
}
```

### Estructura de Point

```typescript
{
  lat: number,           // Latitud
  lng: number,           // Longitud
  accuracy?: number,     // Accuracy en metros (opcional)
  timestamp: number,     // Timestamp en milisegundos
}
```

## 🎨 Estilos Visuales Recomendados

### Marcador de Posición Actual
```javascript
{
  scale: 14-16,           // Grande para destacar
  fillColor: "#4CAF50",   // Verde brillante
  fillOpacity: 1,
  strokeColor: "#fff",
  strokeWeight: 3,
  zIndex: 1000,           // Arriba de todo
}
```

### Polyline de Ruta
```javascript
{
  strokeColor: "#2196F3", // Azul
  strokeOpacity: 0.8,
  strokeWeight: 4,
}
```

### Marcadores de Ruta (opcionales)
```javascript
{
  scale: 5,
  fillColor: "#FF9800",   // Naranja
  fillOpacity: 0.6,
  strokeColor: "#fff",
  strokeWeight: 1,
}
```

## 🧪 Testing y Debugging

### Ver Logs de Filtrado

Activar modo DEBUG:
```javascript
const tracking = useGPSTracking({ DEBUG: true });
```

Tipos de logs que verás:
- ✅ `GPS: Point accepted` - Punto válido agregado
- ❌ `GPS: Accuracy too low: 45.2m > 30m` - Rechazado por accuracy
- ❌ `GPS: Distance too small: 3.5m < 8m` - Muy cerca del anterior
- ⚠️ `GPS: Speed too high: 85.3 km/h > 40 km/h` - Velocidad imposible
- 🚫 `GPS: Jump detected: 120.5m > 60m` - Salto detectado
- 🧹 `GPS: Removed 15 old points` - Limpieza de memoria
- ✂️ `GPS: Segment break at point 25` - Segmento cortado

### Ver Estadísticas

```javascript
const stats = tracking.getRejectionStats();
console.log(stats);
// {
//   acceptRate: "73.5%",
//   rejectRate: "26.5%",
//   totalReceived: 150,
//   totalAccepted: 110,
//   totalRejected: 40,
//   reasons: {
//     "Accuracy too low": 15,
//     "Speed too high": 10,
//     "Distance too small": 15
//   }
// }
```

## 🔧 Utilidades Disponibles

### Cálculos Matemáticos

```javascript
import { haversineDistanceMeters, speedKmh } from "utils/gpsUtils";

// Calcular distancia entre dos puntos
const dist = haversineDistanceMeters(
  { lat: -34.603722, lng: -58.381592 },
  { lat: -34.604000, lng: -58.382000 }
);
console.log(`Distancia: ${dist.toFixed(1)}m`);

// Calcular velocidad
const speed = speedKmh(100, 5000); // 100m en 5000ms
console.log(`Velocidad: ${speed.toFixed(1)} km/h`);
```

### Suavizado Manual

```javascript
import { movingAverage, exponentialSmoothing } from "utils/gpsUtils";

// Moving average
const smoothed = movingAverage(points, 5);

// Filtro exponencial (EMA)
const smoothed = exponentialSmoothing(newPoint, lastSmoothed, 0.3);
```

### Segmentación Manual

```javascript
import { segmentPolyline } from "utils/gpsUtils";

const segments = segmentPolyline(points, config);
// [[point1, point2, ...], [point10, point11, ...]]
```

## 🐛 Troubleshooting

### Problema: Muchos puntos rechazados

**Solución**: Ajustar límites más permisivos
```javascript
{
  MAX_ACCURACY_METERS: 40,  // Aumentar
  MAX_SPEED_KMH: 60,         // Aumentar
  MIN_DISTANCE_METERS: 5,    // Reducir
}
```

### Problema: La línea todavía se ve "saltona"

**Solución**: Aumentar suavizado
```javascript
{
  SMOOTH_WINDOW: 8,  // Más puntos para promediar
}
```

### Problema: La polyline tiene líneas cruzadas

**Solución**: Reducir MAX_JUMP_METERS
```javascript
{
  MAX_JUMP_METERS: 40,  // Más estricto
}
```

### Problema: No aparecen suficientes puntos

**Solución**: Reducir MIN_DISTANCE_METERS
```javascript
{
  MIN_DISTANCE_METERS: 5,  // Menos restrictivo
}
```

### Problema: La posición actual está desactualizada

**Solución**: Verificar timestamps
```javascript
tracking.addPoint({
  ...point,
  timestamp: Date.now(),  // Asegurar timestamp actual
});
```

## 🔄 Integración con Firebase

```javascript
import { ref, onValue } from "firebase/database";
import database from "config/firebase";

const tracking = useGPSTracking();

useEffect(() => {
  const locationRef = ref(database, `locations/${userId}`);
  
  const unsubscribe = onValue(locationRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      // Procesar y agregar puntos
      Object.values(data).forEach(location => {
        tracking.addPoint({
          lat: parseFloat(location.latitude),
          lng: parseFloat(location.longitude),
          accuracy: location.accuracy,
          timestamp: new Date(location.timestamp).getTime(),
        });
      });
    }
  });

  return () => unsubscribe();
}, [userId]);
```

## 📊 Performance

- **Complejidad**: O(1) para agregar punto, O(n) para limpieza periódica
- **Memoria**: Limitada por MAX_POINTS (default 200 puntos)
- **Re-renders**: Optimizado con useMemo y useCallback
- **Limpieza**: Automática cada 60 segundos

## 🎓 Buenas Prácticas

1. **Siempre incluir accuracy** si está disponible del GPS
2. **Usar timestamps reales** para cálculos de velocidad precisos
3. **Ajustar configuración según modo de transporte**
4. **Deshabilitar DEBUG en producción** para mejor performance
5. **Mostrar solo cada N marcadores** en la ruta para no saturar el mapa
6. **Usar segmentos separados** para polylines limpias
7. **Hacer el marcador actual más grande** que los históricos
8. **Limpiar tracking al cambiar de usuario** con `reset()`

## 📝 Changelog

### v1.0.0 (2025-12-23)
- ✅ Sistema completo de filtrado GPS
- ✅ Hook useGPSTracking con estado reactivo
- ✅ Suavizado con moving average
- ✅ Segmentación de polyline
- ✅ Limpieza automática de memoria
- ✅ Estadísticas de filtrado
- ✅ Configuración personalizable
- ✅ Integración con Google Maps
- ✅ Documentación completa

## 🤝 Contribuir

Para mejorar el sistema:
1. Ajustar constantes en `GPS_CONFIG` según feedback
2. Agregar nuevos filtros en `processIncomingPoint`
3. Implementar algoritmos de suavizado alternativos
4. Optimizar performance para grandes volúmenes

## 📞 Soporte

Para preguntas o issues:
- Ver ejemplos en `src/examples/gpsTrackingExamples.js`
- Activar DEBUG para ver logs detallados
- Revisar estadísticas con `getRejectionStats()`

---

**Desarrollado con ❤️ para eliminar las telarañas GPS del mapa** 🕸️❌
