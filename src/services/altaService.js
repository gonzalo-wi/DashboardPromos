/**
 * Servicio de Gestión de Altas
 * Maneja operaciones de consulta de altas de clientes
 */

import config from "../config";
import { getToken } from "./authService";

const API_BASE_URL = config.api.baseUrl;

/**
 * Obtiene el header de autorización
 */
const getAuthHeaders = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

/**
 * Obtener todas las altas con filtros (para admins)
 * Endpoint: GET /api/promos/admin/altas
 *
 * @param {Object} filters - Filtros opcionales
 * @param {number} filters.user_id - ID del usuario
 * @param {string} filters.fecha - Fecha específica (YYYY-MM-DD)
 * @param {string} filters.fecha_desde - Inicio del rango
 * @param {string} filters.fecha_hasta - Fin del rango
 * @param {number} filters.tipo_promocion_id - ID de la promoción
 * @param {number} filters.page - Número de página
 * @returns {Promise<Object>} Datos paginados de altas
 */
export const getAllAltas = async (filters = {}) => {
  try {
    const params = new URLSearchParams();

    if (filters.user_id) params.append("user_id", filters.user_id);
    if (filters.fecha) params.append("fecha", filters.fecha);
    if (filters.fecha_pedido) params.append("fecha_pedido", filters.fecha_pedido);
    if (filters.fecha_pedido_desde) params.append("fecha_pedido_desde", filters.fecha_pedido_desde);
    if (filters.fecha_pedido_hasta) params.append("fecha_pedido_hasta", filters.fecha_pedido_hasta);
    if (filters.fecha_desde) params.append("fecha_desde", filters.fecha_desde);
    if (filters.fecha_hasta) params.append("fecha_hasta", filters.fecha_hasta);
    if (filters.tipo_promocion_id) params.append("tipo_promocion_id", filters.tipo_promocion_id);
    if (filters.nro_rto) params.append("nro_rto", filters.nro_rto);
    if (filters.page) params.append("page", filters.page);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/admin/altas${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al obtener altas");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error al obtener altas:", error);
    throw error;
  }
};

/**
 * Obtener altas de un usuario específico
 * Endpoint: GET /api/promos/admin/users/{userId}/altas
 *
 * @param {number} userId - ID del usuario
 * @param {Object} filters - Filtros opcionales
 * @param {string} filters.fecha - Fecha específica (YYYY-MM-DD)
 * @param {string} filters.fecha_desde - Inicio del rango
 * @param {string} filters.fecha_hasta - Fin del rango
 * @returns {Promise<Object>} Datos de altas del usuario
 */
export const getUserAltas = async (userId, filters = {}) => {
  try {
    const params = new URLSearchParams();

    if (filters.fecha) params.append("fecha", filters.fecha);
    if (filters.fecha_desde) params.append("fecha_desde", filters.fecha_desde);
    if (filters.fecha_hasta) params.append("fecha_hasta", filters.fecha_hasta);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/admin/users/${userId}/altas${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al obtener altas del usuario");
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error al obtener altas del usuario:", error);
    throw error;
  }
};

/**
 * Obtener mis propias altas del día (para usuarios regulares)
 * Endpoint: GET /api/promos/altas
 *
 * @returns {Promise<Object>} Mis altas del día
 */
export const getMyAltas = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/altas`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al obtener mis altas");
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error al obtener mis altas:", error);
    throw error;
  }
};

/**
 * Calcular métricas de efectividad a partir de altas
 *
 * @param {Array} altas - Array de altas
 * @returns {Object} Métricas calculadas
 */
export const calculateMetrics = (altas) => {
  if (!Array.isArray(altas) || altas.length === 0) {
    return {
      total: 0,
      porPromocion: [],
      porDia: [],
      porUsuario: [],
      promediosPorDia: 0,
    };
  }

  const metrics = {
    total: altas.length,
    porPromocion: {},
    porDia: {},
    porUsuario: {},
  };

  altas.forEach((alta) => {
    // Por promoción
    const promoName = alta.promotion?.name || "Sin promoción";
    metrics.porPromocion[promoName] = (metrics.porPromocion[promoName] || 0) + 1;

    // Por día
    const fecha = alta.fecha_pedido || alta.created_at?.split("T")[0];
    if (fecha) {
      metrics.porDia[fecha] = (metrics.porDia[fecha] || 0) + 1;
    }

    // Por usuario
    const userName = alta.user_promo?.name || "Desconocido";
    const userId = alta.user_promo?.iduser_promo || alta.user_promo?.id;
    if (!metrics.porUsuario[userName]) {
      metrics.porUsuario[userName] = { total: 0, userId };
    }
    metrics.porUsuario[userName].total += 1;
  });

  // Convertir objetos a arrays para facilitar el uso en gráficos
  const porPromocionArray = Object.entries(metrics.porPromocion)
    .map(([promocion, total]) => ({ promocion, total }))
    .sort((a, b) => b.total - a.total);

  const porDiaArray = Object.entries(metrics.porDia)
    .map(([dia, total]) => ({ dia, total }))
    .sort((a, b) => new Date(a.dia) - new Date(b.dia));

  const porUsuarioArray = Object.entries(metrics.porUsuario)
    .map(([usuario, data]) => ({
      usuario,
      userId: data.userId,
      total: data.total,
      promedio: (data.total / Object.keys(metrics.porDia).length).toFixed(1),
    }))
    .sort((a, b) => b.total - a.total);

  // Calcular promedio por día
  const diasConAltas = Object.keys(metrics.porDia).length;
  const promediosPorDia = diasConAltas > 0 ? (metrics.total / diasConAltas).toFixed(1) : 0;

  return {
    total: metrics.total,
    porPromocion: porPromocionArray,
    porDia: porDiaArray,
    porUsuario: porUsuarioArray,
    promediosPorDia,
  };
};
