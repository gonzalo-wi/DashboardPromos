# 🚀 Quick Start - Sistema GPS Robusto

## Instalación Rápida

Los archivos ya están creados. Solo necesitas usarlos:

```javascript
import { useGPSTracking } from "hooks/useGPSTracking";
```

## Uso Inmediato en tu Mapa

### 1. En tu componente de mapa:

```javascript
import { useGPSTracking } from "hooks/useGPSTracking";

function MiMapa() {
  const tracking = useGPSTracking({
    MAX_SPEED_KMH: 40,  // Ajustar según tu caso
    DEBUG: true,         // Ver logs
  });

  // Agregar puntos desde tu fuente de datos
  useEffect(() => {
    // Desde Firebase, API, o navigator.geolocation
    tracking.addPoint({
      lat: -34.603722,
      lng: -58.381592,
      accuracy: 15,
      timestamp: Date.now(),
    });
  }, []);

  return (
    <GoogleMap>
      {/* Posición actual */}
      {tracking.currentPosition && (
        <Marker position={tracking.currentPosition} />
      )}
      
      {/* Rutas sin telarañas */}
      {tracking.segments.map((segment, i) => (
        <Polyline key={i} path={segment} />
      ))}
    </GoogleMap>
  );
}
```

## ✅ Archivos Creados

- ✅ `src/utils/gpsUtils.js` - Utilidades de cálculo
- ✅ `src/hooks/useGPSTracking.js` - Hook principal
- ✅ `src/examples/gpsTrackingExamples.js` - Ejemplos de uso
- ✅ `GPS_TRACKING_DOCUMENTATION.md` - Documentación completa

## 🎯 Ya Integrado en MapaPromotores

El componente `src/layouts/mapa-promotores/components/MapaPromotores.js` ya tiene:
- ✅ Filtrado automático de puntos GPS
- ✅ Segmentación de polyline (sin telarañas)
- ✅ Marcador grande para posición actual
- ✅ Limpieza de puntos antiguos
- ✅ Logs de debugging

## 🔧 Configuración Rápida por Escenario

### Caminando (Promotor):
```javascript
{ MAX_SPEED_KMH: 15, MAX_JUMP_METERS: 50 }
```

### Moto/Bici (Delivery):
```javascript
{ MAX_SPEED_KMH: 40, MAX_JUMP_METERS: 80 }
```

### Auto Ciudad:
```javascript
{ MAX_SPEED_KMH: 60, MAX_JUMP_METERS: 100 }
```

## 📊 Ver Estadísticas

```javascript
const stats = tracking.getRejectionStats();
console.log(stats);
// {
//   acceptRate: "73.5%",
//   rejectRate: "26.5%",
//   reasons: { "Speed too high": 10, ... }
// }
```

## 🎨 Mejores Prácticas Visuales

```javascript
// Marcador actual - GRANDE
{ scale: 15, fillColor: "#4CAF50", strokeWeight: 3, zIndex: 1000 }

// Polyline - Segmentada
tracking.segments.map(segment => 
  <Polyline path={segment} strokeWeight={4} strokeOpacity={0.8} />
)

// Marcadores ruta - PEQUEÑOS y espaciados
points.filter((p, i) => i % 5 === 0).map(...)
```

## 📖 Documentación Completa

Lee `GPS_TRACKING_DOCUMENTATION.md` para:
- API completa del hook
- Todos los parámetros configurables
- Ejemplos avanzados
- Troubleshooting
- Integración con Firebase

## 🐛 Debug

Activar logs detallados:
```javascript
const tracking = useGPSTracking({ DEBUG: true });
```

Verás en consola:
- ✅ Puntos aceptados
- ❌ Puntos rechazados con razón
- 📊 Estadísticas de filtrado

---

**¡Listo para usar! 🎉**
