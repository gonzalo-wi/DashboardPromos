/**
 * Servicio de Altas
 * Maneja operaciones relacionadas con las altas de clientes
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
 * Obtener todas las altas con filtros opcionales
 * @param {Object} filters - Filtros opcionales (user_id, fecha, fecha_desde, fecha_hasta, tipo_promocion_id)
 * @returns {Promise<Object>} - Datos paginados de altas
 */
export const getAltas = async (filters = {}) => {
  try {
    // Construir query string
    const queryParams = new URLSearchParams();
    if (filters.user_id) queryParams.append("user_id", filters.user_id);
    if (filters.fecha) queryParams.append("fecha", filters.fecha);
    if (filters.fecha_desde) queryParams.append("fecha_desde", filters.fecha_desde);
    if (filters.fecha_hasta) queryParams.append("fecha_hasta", filters.fecha_hasta);
    if (filters.tipo_promocion_id)
      queryParams.append("tipo_promocion_id", filters.tipo_promocion_id);
    if (filters.page) queryParams.append("page", filters.page);

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/admin/altas${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al obtener altas");
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error al obtener altas:", error);
    throw error;
  }
};

/**
 * Obtener altas de un usuario específico
 * @param {number} userId - ID del usuario
 * @param {Object} filters - Filtros opcionales (fecha, fecha_desde, fecha_hasta)
 * @returns {Promise<Object>} - Altas del usuario
 */
export const getAltasByUser = async (userId, filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (filters.fecha) queryParams.append("fecha", filters.fecha);
    if (filters.fecha_desde) queryParams.append("fecha_desde", filters.fecha_desde);
    if (filters.fecha_hasta) queryParams.append("fecha_hasta", filters.fecha_hasta);

    const queryString = queryParams.toString();
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
 * Obtener mis altas del día (para usuarios regulares)
 * @returns {Promise<Object>} - Mis altas del día
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
