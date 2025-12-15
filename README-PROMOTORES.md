# Sistema de Gestión de Promotores

## 📋 Descripción

Sistema completo de administración de promotores que incluye:

- ✅ **Gestión de Promotores** (ABM - Alta, Baja, Modificación)
- 📊 **Dashboard con métricas** por promotor y clientes nuevos del día
- 🗺️ **Mapa en tiempo real** con Google Maps para ver promotores y sus rutas
- 📈 **Gráficos de efectividad** por fechas, promociones y tipos de dispenser

---

## 🎯 Funcionalidades Implementadas

### 1. Gestión de Promotores (`/promotores`)
- Tabla completa con todos los promotores
- Crear nuevo promotor
- Editar promotor existente
- Activar/Desactivar promotor
- Eliminar promotor
- Filtros y búsqueda

**Campos del promotor:**
- Nombre completo
- Email
- Teléfono
- Zona asignada
- Estado (Activo/Inactivo)

### 2. Dashboard de Promotores (`/dashboard-promotores`)
- Selector de promotor
- Selector de período (Hoy, Esta Semana, Este Mes)
- **Cards de estadísticas:**
  - Total de clientes nuevos
  - Cantidad de dispensers Frío/Calor
  - Cantidad de Promo 2x1
  - Cantidad de Promo Mensual
- **Tabla de clientes del día** con:
  - Hora de registro
  - Nombre del cliente
  - Dirección
  - Tipo de promoción
  - Tipo de dispenser (Frío/Calor o Solo Frío)

### 3. Mapa de Promotores (`/mapa-promotores`)
- Visualización en mapa de Google Maps
- Panel lateral con lista de promotores activos
- Marcadores de posición actual de cada promotor
- Ruta completa del día con todos los puntos visitados
- Líneas de conexión mostrando la trazada
- Info windows con detalles al hacer clic
- Filtro para ver todos o un promotor específico
- Leyenda explicativa

**Para activar el mapa:**
1. Instalar dependencia: `npm install @react-google-maps/api`
2. Obtener API Key de [Google Maps Platform](https://console.cloud.google.com/google/maps-apis)
3. Crear archivo `.env` en la raíz con: `REACT_APP_GOOGLE_MAPS_API_KEY=tu_api_key`
4. Descomentar el código indicado en `MapaPromotores.js`

### 4. Efectividad de Promotores (`/efectividad-promotores`)
- Selector de período (Semana, Mes, Trimestre, Año)
- Selector de promotor específico o todos
- **Cards de resumen:**
  - Total de clientes
  - Efectividad promedio
  - Mejor promotor del período
  - Promedio diario
- **Gráficos:**
  - Gráfico de barras: Clientes por promotor
  - Gráfico de líneas: Evolución temporal semanal
  - Gráfico de dona: Tipos de dispenser (Frío/Calor vs Solo Frío)
  - Gráfico de dona: Tipos de promociones
- **Panel de resumen del mes:**
  - Meta mensual con barra de progreso
  - Top 3 promotores
  - Tendencias y estadísticas clave

---

## 🚀 Cómo usar

### Iniciar el proyecto

```bash
npm install
npm start
```

La aplicación se abrirá en `http://localhost:3000`

### Navegación

El menú lateral está organizado en secciones:

**Gestión de Promotores:**
- 👥 Promotores
- 📊 Dashboard Promotores  
- 🗺️ Mapa en Tiempo Real
- 📈 Efectividad

**Otras Páginas:**
- Las páginas originales del template

---

## 📦 Estructura de Archivos Creados

```
src/
  layouts/
    promotores/
      index.js                          # Vista CRUD de promotores
    dashboard-promotores/
      index.js                          # Dashboard con métricas
    mapa-promotores/
      index.js                          # Vista principal del mapa
      components/
        MapaPromotores.js               # Componente de Google Maps
    efectividad-promotores/
      index.js                          # Gráficos de efectividad
  routes.js                             # Rutas actualizadas
```

---

## 🔧 Próximos Pasos Recomendados

### 1. Integración con Backend (API)
Actualmente usa datos de ejemplo. Para conectar con un backend real:

**Crear archivo de servicios:** `src/services/promotoresService.js`

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const promotoresService = {
  // Obtener todos los promotores
  getAll: async () => {
    const response = await fetch(`${API_URL}/promotores`);
    return response.json();
  },

  // Crear promotor
  create: async (promotor) => {
    const response = await fetch(`${API_URL}/promotores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promotor),
    });
    return response.json();
  },

  // Actualizar promotor
  update: async (id, promotor) => {
    const response = await fetch(`${API_URL}/promotores/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promotor),
    });
    return response.json();
  },

  // Eliminar promotor
  delete: async (id) => {
    const response = await fetch(`${API_URL}/promotores/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  // Obtener clientes del día por promotor
  getClientesDelDia: async (promotorId, fecha) => {
    const response = await fetch(
      `${API_URL}/promotores/${promotorId}/clientes?fecha=${fecha}`
    );
    return response.json();
  },

  // Obtener ubicación en tiempo real
  getUbicacion: async (promotorId) => {
    const response = await fetch(`${API_URL}/promotores/${promotorId}/ubicacion`);
    return response.json();
  },

  // Obtener estadísticas de efectividad
  getEstadisticas: async (promotorId, periodo) => {
    const response = await fetch(
      `${API_URL}/promotores/${promotorId}/estadisticas?periodo=${periodo}`
    );
    return response.json();
  },
};
```

### 2. Activar Google Maps

```bash
npm install @react-google-maps/api
```

Crear `.env`:
```
REACT_APP_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

Descomentar el código en `src/layouts/mapa-promotores/components/MapaPromotores.js`

### 3. Agregar Tracking en Tiempo Real

Para actualizar la ubicación de promotores en tiempo real, considera usar:

- **WebSockets** con Socket.io
- **Firebase Realtime Database**
- **Polling** cada X segundos

Ejemplo con polling:

```javascript
useEffect(() => {
  const interval = setInterval(async () => {
    const ubicaciones = await promotoresService.getUbicacionesTodas();
    setPromotores(ubicaciones);
  }, 30000); // Actualizar cada 30 segundos

  return () => clearInterval(interval);
}, []);
```

### 4. Agregar Autenticación

Implementar login para que solo usuarios autorizados puedan:
- Ver las páginas de gestión
- Editar promotores
- Ver datos sensibles

### 5. Agregar Persistencia de Datos

- Conectar con base de datos (MySQL, PostgreSQL, MongoDB)
- Implementar endpoints REST o GraphQL
- Agregar validaciones del lado del servidor

### 6. Mejoras Adicionales

- **Exportar reportes** a PDF/Excel
- **Notificaciones** cuando un promotor registra un cliente
- **Chat interno** para comunicación con promotores
- **Fotos** de los locales visitados
- **Firma digital** de los clientes
- **Geofencing** para validar ubicaciones
- **Gamificación** con rankings y premios

---

## 🎨 Personalización

### Cambiar Colores
Edita `src/assets/theme/base/colors.js`

### Agregar Nuevos Campos
1. Actualiza el formulario en `layouts/promotores/index.js`
2. Agrega las columnas en la tabla
3. Actualiza el estado `formData`

### Modificar Gráficos
Los gráficos están en `examples/Charts/`. Puedes:
- Cambiar colores
- Agregar más datasets
- Modificar tipos de gráfico

---

## 📱 Responsive

Todas las vistas están optimizadas para:
- 💻 Desktop
- 📱 Tablet
- 📱 Mobile

---

## 🐛 Solución de Problemas

### El mapa no se muestra
1. Verifica que instalaste `@react-google-maps/api`
2. Verifica que tienes una API Key válida en `.env`
3. Verifica que descomentaste el código en `MapaPromotores.js`

### Los datos no se guardan
Los datos están en memoria. Para persistencia, necesitas conectar con un backend.

### Error al iniciar
```bash
rm -rf node_modules package-lock.json
npm install
npm start
```

---

## 📚 Tecnologías Utilizadas

- **React** 18.2.0
- **Material UI** 5.12.3
- **Material Dashboard 2 React** (Template base)
- **Chart.js** 4.3.0 (Gráficos)
- **React Router** 6.11.0 (Navegación)
- **Google Maps API** (Mapas - opcional)

---

## 👥 Datos de Ejemplo

El sistema incluye 3 promotores de ejemplo con datos ficticios para demostración.
Para usar en producción, reemplaza con datos reales desde tu backend.

---

## 📄 Licencia

Este proyecto está basado en Material Dashboard 2 React por Creative Tim.
Ver LICENSE.md para más detalles.

---

## 🤝 Soporte

Para dudas o problemas:
1. Revisa este README
2. Consulta la documentación de Material UI
3. Revisa los comentarios en el código

---

## 🎉 ¡Listo para usar!

El sistema está completamente funcional con datos de ejemplo.
Solo necesitas conectar con tu backend y configurar Google Maps para tener el sistema completo.

¡Buena suerte con tu proyecto! 🚀
