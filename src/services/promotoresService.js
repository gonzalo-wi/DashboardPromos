/**
 * Servicio para obtener datos de promotores desde Firebase o API
 */

import { ref, get, onValue } from "firebase/database";
import database from "config/firebase";
import config from "config";

/**
 * Obtiene la lista de promotores con sus ubicaciones desde Firebase
 * @param {string} fecha - Fecha en formato YYYY-MM-DD (opcional, por defecto hoy)
 * @returns {Promise<Array>} Lista de promotores
 */
export const getPromotores = async (fecha = null) => {
  // Si no se proporciona fecha, usar hoy
  const fechaSeleccionada = fecha || new Date().toISOString().split("T")[0];

  // Si useMockData está habilitado, usar datos mock directamente
  console.log("🔍 Verificando flag useMockData:", config.api.useMockData);
  console.log("🔍 Config completo:", config);
  console.log("📅 Fecha seleccionada:", fechaSeleccionada);

  if (config.api.useMockData) {
    console.log("⚠️ Usando datos mock (configurado en .env)");
    return getMockPromotores();
  }

  console.log("🔥 Intentando conectar a Firebase...");

  try {
    // Obtener datos desde Firebase en la ruta "locations"
    const locationsRef = ref(database, "locations");
    const snapshot = await get(locationsRef);

    console.log("📊 Firebase snapshot.exists():", snapshot.exists());

    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log("📦 Datos raw de Firebase:", data);
      console.log("👥 Usuarios encontrados:", Object.keys(data));

      const promotoresArray = [];
      const colores = ["#1976d2", "#d32f2f", "#388e3c", "#f57c00", "#7b1fa2", "#0288d1"];
      let colorIndex = 0;

      // Procesar cada usuario
      Object.keys(data).forEach((userId) => {
        const userData = data[userId];

        // Buscar datos para la fecha seleccionada
        let datosDia = userData[fechaSeleccionada];

        // Si no hay datos para la fecha seleccionada, intentar con la fecha más reciente
        if (!datosDia) {
          const fechas = Object.keys(userData);
          const fechaReciente = fechas.sort().reverse()[0];
          datosDia = userData[fechaReciente];
          console.log(
            `⚠️ Usuario ${userId}: No hay datos para ${fechaSeleccionada}, usando ${fechaReciente}`
          );
        }

        // Si hay datos para ese día
        if (datosDia) {
          const ubicaciones = Object.values(datosDia);
          const ruta = [];

          // Construir la ruta del día
          ubicaciones.forEach((ubicacion) => {
            if (ubicacion.latitude && ubicacion.longitude) {
              ruta.push({
                lat: parseFloat(ubicacion.latitude),
                lng: parseFloat(ubicacion.longitude),
                hora: ubicacion.timestamp
                  ? new Date(ubicacion.timestamp).toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "N/A",
                cliente: ubicacion.address || "Sin dirección",
              });
            }
          });

          // Si tiene al menos una ubicación válida
          if (ruta.length > 0) {
            const ultimaUbicacion = ruta[ruta.length - 1];

            promotoresArray.push({
              id: userId,
              nombre: userId.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
              zona: "Zona de actividad",
              posicion: { lat: ultimaUbicacion.lat, lng: ultimaUbicacion.lng },
              color: colores[colorIndex % colores.length],
              activo: true,
              ruta: ruta,
              clientesHoy: ruta.length,
            });

            colorIndex++;
          }
        }
      });

      console.log("Datos obtenidos desde Firebase:", promotoresArray.length, "promotores");
      return promotoresArray.length > 0 ? promotoresArray : getMockPromotores();
    } else {
      console.log("No hay datos en Firebase, usando mock");
      return getMockPromotores();
    }
  } catch (error) {
    console.warn("Error al obtener promotores desde Firebase, usando datos mock:", error.message);
    return getMockPromotores();
  }
};

/**
 * Suscribirse a cambios en tiempo real de promotores
 * @param {Function} callback - Función que se ejecutará cuando cambien los datos
 * @returns {Function} Función para cancelar la suscripción
 */
export const subscribeToPromotores = (callback) => {
  const locationsRef = ref(database, "locations");

  const unsubscribe = onValue(locationsRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const promotoresArray = [];
      const colores = ["#1976d2", "#d32f2f", "#388e3c", "#f57c00", "#7b1fa2", "#0288d1"];
      let colorIndex = 0;

      // Procesar cada usuario
      Object.keys(data).forEach((userId) => {
        const userData = data[userId];
        const fechas = Object.keys(userData);
        const fechaReciente = fechas.sort().reverse()[0];
        const datosDia = userData[fechaReciente];

        if (datosDia) {
          const ubicaciones = Object.values(datosDia);
          const ruta = [];

          ubicaciones.forEach((ubicacion) => {
            if (ubicacion.latitude && ubicacion.longitude) {
              ruta.push({
                lat: parseFloat(ubicacion.latitude),
                lng: parseFloat(ubicacion.longitude),
                hora: ubicacion.timestamp
                  ? new Date(ubicacion.timestamp).toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "N/A",
                cliente: ubicacion.address || "Sin dirección",
              });
            }
          });

          if (ruta.length > 0) {
            const ultimaUbicacion = ruta[ruta.length - 1];
            promotoresArray.push({
              id: userId,
              nombre: userId.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
              zona: "Zona de actividad",
              posicion: { lat: ultimaUbicacion.lat, lng: ultimaUbicacion.lng },
              color: colores[colorIndex % colores.length],
              activo: true,
              ruta: ruta,
              clientesHoy: ruta.length,
            });
            colorIndex++;
          }
        }
      });

      callback(promotoresArray.length > 0 ? promotoresArray : getMockPromotores());
    } else {
      callback(getMockPromotores());
    }
  });

  return unsubscribe;
};

/**
 * Obtiene la ubicación en tiempo real de un promotor específico desde Firebase
 * @param {string} promotorId - ID del promotor
 * @returns {Promise<Object>} Ubicación del promotor
 */
export const getPromotorLocation = async (promotorId) => {
  try {
    const locationRef = ref(database, `promotores/${promotorId}/posicion`);
    const snapshot = await get(locationRef);

    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      throw new Error("Ubicación no encontrada");
    }
  } catch (error) {
    console.error(`Error al obtener ubicación del promotor ${promotorId}:`, error);
    throw error;
  }
};

/**
 * Obtiene la ruta completa del día de un promotor desde Firebase
 * @param {string} promotorId - ID del promotor
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @returns {Promise<Array>} Ruta del promotor
 */
export const getPromotorRoute = async (promotorId, fecha = null) => {
  try {
    const fechaParam = fecha || new Date().toISOString().split("T")[0];
    const routeRef = ref(database, `promotores/${promotorId}/ruta`);
    const snapshot = await get(routeRef);

    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      throw new Error("Ruta no encontrada");
    }
  } catch (error) {
    console.error(`Error al obtener ruta del promotor ${promotorId}:`, error);
    throw error;
  }
};

/**
 * Datos mock para desarrollo y testing
 * @returns {Array} Lista de promotores con datos de ejemplo
 */
const getMockPromotores = () => {
  return [
    {
      id: 1,
      nombre: "Juan Pérez",
      zona: "Norte",
      posicion: { lat: -34.603722, lng: -58.381592 },
      color: "#1976d2",
      activo: true,
      ruta: [
        { lat: -34.603722, lng: -58.381592, hora: "09:00", cliente: "Restaurant El Buen Sabor" },
        { lat: -34.605722, lng: -58.383592, hora: "11:15", cliente: "Cafetería Central" },
        { lat: -34.607722, lng: -58.385592, hora: "14:20", cliente: "Oficinas Tech Corp" },
      ],
      clientesHoy: 3,
    },
    {
      id: 2,
      nombre: "María García",
      zona: "Sur",
      posicion: { lat: -34.613722, lng: -58.391592 },
      color: "#d32f2f",
      activo: true,
      ruta: [
        { lat: -34.613722, lng: -58.391592, hora: "10:00", cliente: "Escuela Primaria Norte" },
        { lat: -34.615722, lng: -58.393592, hora: "12:30", cliente: "Gimnasio FitLife" },
      ],
      clientesHoy: 2,
    },
    {
      id: 3,
      nombre: "Carlos López",
      zona: "Centro",
      posicion: { lat: -34.593722, lng: -58.371592 },
      color: "#388e3c",
      activo: true,
      ruta: [
        { lat: -34.593722, lng: -58.371592, hora: "08:45", cliente: "Hotel Plaza" },
        { lat: -34.595722, lng: -58.373592, hora: "10:30", cliente: "Consultorio Médico" },
        { lat: -34.597722, lng: -58.375592, hora: "13:00", cliente: "Peluquería Estilo" },
        { lat: -34.599722, lng: -58.377592, hora: "15:45", cliente: "Taller Mecánico" },
      ],
      clientesHoy: 4,
    },
  ];
};

export default {
  getPromotores,
  getPromotorLocation,
  getPromotorRoute,
};
