# 🧪 Testing del Sistema GPS

## Verificación Rápida

### 1. Verificar que los archivos se crearon correctamente

```bash
ls src/utils/gpsUtils.js
ls src/hooks/useGPSTracking.js
ls src/examples/gpsTrackingExamples.js
```

### 2. Verificar que no hay errores de compilación

El sistema debería compilar sin errores. Si ves algún error, revisa:
- Las importaciones en `MapaPromotores.js`
- Que existan las carpetas `utils/` y `hooks/`

## Testing Manual en Mapa de Promotores

### Paso 1: Activar Debugging

En [MapaPromotores.js](src/layouts/mapa-promotores/components/MapaPromotores.js), línea 46:

```javascript
const processedPromotores = useMemo(() => {
  // Activar temporalmente para ver logs
  const tempConfig = { ...GPS_CONFIG, DEBUG: true };
  
  return promotores.map((promotor) => {
    // ... resto del código
```

### Paso 2: Abrir el Mapa de Promotores

1. Ejecuta la aplicación: `npm start`
2. Navega a "Mapa de Promotores"
3. Abre la consola del navegador (F12)

### Paso 3: Ver Logs de Filtrado

Deberías ver logs como:

```
📊 Promotor Lucia Barrios: 45 puntos válidos, 3 segmentos
✅ GPS: Point accepted - Distance: 12.3m, Speed: 8.5 km/h
❌ GPS: Speed too high: 85.3 km/h > 40 km/h
✂️ GPS: Segment break at point 25, distance: 120.5m
```

## Testing con Puntos Simulados

### Opción 1: Usar el Ejemplo de Testing

En la consola del navegador:

```javascript
// Importar utilidades
import { processIncomingPoint, GPS_CONFIG } from './utils/gpsUtils';

// Punto de prueba
const testPoint = {
  lat: -34.603722,
  lng: -58.381592,
  accuracy: 15,
  timestamp: Date.now()
};

// Procesar
const result = processIncomingPoint(testPoint, {
  lastValidPoint: null,
  config: GPS_CONFIG
});

console.log('Resultado:', result);
// { accepted: true, reason: "First point", metrics: {...} }
```

### Opción 2: Test Automatizado

Crea un archivo `src/utils/gpsUtils.test.js`:

```javascript
import {
  haversineDistanceMeters,
  speedKmh,
  processIncomingPoint,
  GPS_CONFIG
} from './gpsUtils';

describe('GPS Utils', () => {
  test('calcular distancia correctamente', () => {
    const p1 = { lat: -34.603722, lng: -58.381592 };
    const p2 = { lat: -34.604722, lng: -58.382592 };
    const dist = haversineDistanceMeters(p1, p2);
    expect(dist).toBeGreaterThan(100);
  });

  test('rechazar punto con accuracy baja', () => {
    const point = {
      lat: -34.603722,
      lng: -58.381592,
      accuracy: 100, // Muy alta
      timestamp: Date.now()
    };
    
    const result = processIncomingPoint(point, {
      lastValidPoint: null,
      config: GPS_CONFIG
    });
    
    expect(result.accepted).toBe(false);
    expect(result.reason).toContain('Accuracy');
  });
});
```

## Verificar Visualmente en el Mapa

### Checklist Visual

- [ ] ✅ El marcador de posición actual es MÁS GRANDE que los demás
- [ ] ✅ Las polylines NO tienen líneas cruzadas
- [ ] ✅ Los marcadores de ruta están ESPACIADOS (no todos juntos)
- [ ] ✅ La ruta se ve SUAVE (no zigzag errático)
- [ ] ✅ El InfoWindow muestra "Puntos válidos" y "Segmentos"

### Qué Buscar

#### ❌ ANTES (Problemas)
- Líneas que cruzan el mapa de un lado a otro
- Marcador que "salta" constantemente
- Muchos puntos muy cercanos (cluster)
- Polyline con ángulos muy agudos

#### ✅ DESPUÉS (Correcto)
- Polylines continuas y lógicas
- Marcador estable con movimiento suave
- Puntos espaciados uniformemente
- Segmentos separados cuando hay saltos

## Test de Performance

### Medir Tiempo de Procesamiento

```javascript
console.time('GPS Processing');

// Procesar 100 puntos
for (let i = 0; i < 100; i++) {
  tracking.addPoint({
    lat: -34.603722 + (i * 0.0001),
    lng: -58.381592 + (i * 0.0001),
    accuracy: 15,
    timestamp: Date.now() + (i * 1000),
  });
}

console.timeEnd('GPS Processing');
// Debería ser < 50ms para 100 puntos
```

### Verificar Uso de Memoria

```javascript
// Ver cantidad de puntos en memoria
console.log('Puntos válidos:', tracking.validPoints.length);
console.log('Segmentos:', tracking.segments.length);

// Debería respetar MAX_POINTS (200 por defecto)
```

## Test de Configuración

### Probar Diferentes Escenarios

```javascript
// Caminando
const walkingTracking = useGPSTracking({
  MAX_SPEED_KMH: 15,
  MAX_JUMP_METERS: 50,
  DEBUG: true,
});

// Moto
const motoTracking = useGPSTracking({
  MAX_SPEED_KMH: 40,
  MAX_JUMP_METERS: 80,
  DEBUG: true,
});

// Auto
const carTracking = useGPSTracking({
  MAX_SPEED_KMH: 80,
  MAX_JUMP_METERS: 150,
  DEBUG: true,
});
```

## Verificar Estadísticas

```javascript
// Después de agregar varios puntos
const stats = tracking.getRejectionStats();

console.log('📊 Estadísticas GPS:');
console.log('Accept Rate:', stats.acceptRate);
console.log('Reject Rate:', stats.rejectRate);
console.log('Razones de rechazo:', stats.reasons);

// Valores esperados:
// - Accept Rate: 60-80% (normal)
// - Reject Rate: 20-40% (normal)
// - Si Accept Rate < 50%: Configuración muy estricta
// - Si Reject Rate > 50%: GPS de mala calidad o config inadecuada
```

## Troubleshooting

### Problema: No veo logs en consola

**Solución**: Verificar que DEBUG esté en `true`

```javascript
const tracking = useGPSTracking({ DEBUG: true });
```

### Problema: Todos los puntos son rechazados

**Solución**: Configuración muy estricta

```javascript
const tracking = useGPSTracking({
  MAX_ACCURACY_METERS: 50, // Más permisivo
  MAX_SPEED_KMH: 80,        // Más permisivo
  MIN_DISTANCE_METERS: 3,   // Menos restrictivo
});
```

### Problema: La polyline sigue cruzada

**Solución**: Reducir MAX_JUMP_METERS

```javascript
const tracking = useGPSTracking({
  MAX_JUMP_METERS: 40, // Más estricto
});
```

### Problema: No aparecen suficientes puntos

**Solución**: Reducir MIN_DISTANCE_METERS

```javascript
const tracking = useGPSTracking({
  MIN_DISTANCE_METERS: 5, // Menos restrictivo
});
```

## Checklist de Testing Completo

- [ ] ✅ Archivos creados sin errores
- [ ] ✅ Compilación exitosa (npm start)
- [ ] ✅ Logs visibles en consola (DEBUG: true)
- [ ] ✅ Marcador actual más grande
- [ ] ✅ Polylines segmentadas
- [ ] ✅ Sin líneas cruzadas
- [ ] ✅ Movimiento suave
- [ ] ✅ Estadísticas muestran accept rate razonable
- [ ] ✅ Limpieza automática funciona
- [ ] ✅ Performance < 50ms para 100 puntos
- [ ] ✅ Uso de memoria controlado (< 200 puntos)

## Siguiente Paso

Una vez verificado todo:

1. **Deshabilitar DEBUG en producción**:
```javascript
const tracking = useGPSTracking({ DEBUG: false });
```

2. **Ajustar configuración según feedback real**:
   - Observar la tasa de rechazo
   - Ajustar límites según necesidad
   - Probar con usuarios reales

3. **Monitorear en producción**:
   - Ver estadísticas periódicamente
   - Ajustar según patrones de uso
   - Optimizar configuración por tipo de usuario

---

**¡Listo para probar! 🧪**
