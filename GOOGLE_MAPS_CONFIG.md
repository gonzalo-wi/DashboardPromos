# Configuración del Mapa de Promotores

Este documento explica cómo configurar el módulo de mapa de promotores con Google Maps.

## 📋 Requisitos Previos

- Node.js instalado
- Una cuenta de Google Cloud Platform
- API Key de Google Maps habilitada

## 🔑 Configuración de Google Maps API

### 1. Obtener la API Key

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita las siguientes APIs:
   - Maps JavaScript API
   - Geocoding API (opcional, para búsquedas)
   - Directions API (opcional, para rutas)
4. Ve a "Credenciales" y crea una API Key
5. Restringe la API Key (recomendado para producción):
   - Restricciones de aplicación: HTTP referrers
   - Restricciones de API: Solo las APIs que necesites

### 2. Configurar Variables de Entorno

El archivo `.env` ya está creado en la raíz del proyecto con las siguientes variables:

```env
# Google Maps API Key
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyDeG3mSeueSSmfBWDP1JHdaDgHJ263Cm5g

# API Base URL (ajusta según tu backend)
REACT_APP_API_BASE_URL=http://ho.el-jumillano.com.ar:24937/api/promos

# Usar datos mock en desarrollo
REACT_APP_USE_MOCK_DATA=false

# Firebase Configuration - Alta Promos
REACT_APP_FIREBASE_API_KEY=AIzaSyCYnQUCyM6Oqm8NSF9r9-62kVpIpFsDZTA
REACT_APP_FIREBASE_AUTH_DOMAIN=altapromos-b65e9.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://altapromos-b65e9-default-rtdb.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=altapromos-b65e9
REACT_APP_FIREBASE_STORAGE_BUCKET=altapromos-b65e9.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=73468815340
REACT_APP_FIREBASE_APP_ID=1:73468815340:android:abdbd1ac906b64c6b982c9
```

### 3. Instalación

Las dependencias ya están instaladas. Si necesitas reinstalar:

```bash
npm install @react-google-maps/api
```

### 4. Iniciar el Proyecto

```bash
npm start
```

⚠️ **IMPORTANTE**: Después de modificar el archivo `.env`, debes reiniciar el servidor de desarrollo.

## 📁 Estructura de Archivos

```
src/
├── config/
│   └── index.js                    # Configuración centralizada
├── layouts/
│   └── mapa-promotores/
│       ├── index.js                # Vista principal del mapa
│       └── components/
│           └── MapaPromotores.js   # Componente de Google Maps
└── .env                            # Variables de entorno (NO SUBIR A GIT)
```

## 🗺️ Características del Mapa

El componente de mapa incluye:

- **Marcadores de posición actual**: Muestra la ubicación actual de cada promotor
- **Rutas del día**: Visualiza los puntos visitados con líneas de conexión
- **Info Windows**: Al hacer clic en un marcador, muestra información detallada
- **Colores por promotor**: Cada promotor tiene un color único
- **Filtrado**: Posibilidad de mostrar todos los promotores o uno específico

## 🔧 Configuración Adicional

### Personalizar el Centro del Mapa

Edita el archivo `MapaPromotores.js`:

```javascript
const center = {
  lat: -34.603722,  // Tu latitud
  lng: -58.381592,  // Tu longitud
};
```

### Cambiar el Nivel de Zoom

En `MapaPromotores.js`:

```javascript
zoom={13}  // Cambia este valor (1-20)
```

## 🔐 Seguridad

- **NUNCA** subas el archivo `.env` al repositorio
- El archivo `.gitignore` ya está configurado para ignorarlo
- Usa `.env.example` como plantilla sin datos sensibles
- En producción, configura las variables de entorno en tu hosting

## 🌐 Integración con API

Para conectar con tu API de promotores, modifica el archivo donde obtienes los datos:

```javascript
import config from "config";

// Usar la URL de la API configurada
fetch(`${config.api.baseUrl}/promotores`)
  .then(response => response.json())
  .then(data => setPromotores(data));
```

## 🐛 Solución de Problemas

### El mapa no se muestra

1. Verifica que la API Key esté correctamente configurada en `.env`
2. Reinicia el servidor de desarrollo (`npm start`)
3. Verifica que las APIs estén habilitadas en Google Cloud Console
4. Revisa la consola del navegador para errores

### Error de cuota excedida

- Verifica tus límites de uso en Google Cloud Console
- Considera agregar información de facturación para aumentar las cuotas

### El mapa se muestra en gris

- Verifica que las coordenadas sean válidas
- Asegúrate de tener conexión a internet
- Revisa que las APIs necesarias estén habilitadas

## 📞 Soporte

Para más información sobre Google Maps API:
- [Documentación oficial](https://developers.google.com/maps/documentation)
- [Precios y límites](https://developers.google.com/maps/billing-and-pricing/pricing)
