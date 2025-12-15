/**
 * Servicio de Gestión de Usuarios
 * Maneja operaciones CRUD de usuarios/promotores
 */

import config from "../config";
import { getToken, getCurrentUser } from "./authService";

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
 * Detecta si el usuario actual es superadmin
 */
const isSuperAdmin = () => {
  const user = getCurrentUser();
  return user && user.role === "superadmin";
};

/**
 * Obtiene el prefijo del endpoint según el rol del usuario
 * superadmin: /superadmin/admins
 * admin: /admin/users
 */
const getEndpointPrefix = () => {
  return isSuperAdmin() ? "superadmin/admins" : "admin/users";
};

/**
 * Listar todos los usuarios
 * Admin: Ve solo usuarios regulares
 * Superadmin: Ve usuarios regulares y administradores
 */
export const getUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al obtener usuarios");
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error al obtener usuarios:", error);
    throw error;
  }
};

/**
 * Crear nuevo usuario
 * Usa /admin/users o /superadmin/admins según el rol del usuario logueado
 * Convierte role_id a role_name antes de enviar
 */
export const createUser = async (userData) => {
  try {
    // Convertir role_id a role_name si existe
    const dataToSend = { ...userData };
    if (dataToSend.role_id) {
      const roles = await getRoles();
      const selectedRole = roles.find((r) => r.id === dataToSend.role_id);
      if (selectedRole) {
        dataToSend.role_name = selectedRole.name;
      }
      delete dataToSend.role_id;
    }

    const endpoint = getEndpointPrefix();
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(dataToSend),
    });

    const data = await response.json();

    if (!response.ok) {
      // Si hay errores de validación
      if (data.errors) {
        const errorMessages = Object.values(data.errors).flat().join(", ");
        throw new Error(errorMessages);
      }
      throw new Error(data.message || "Error al crear usuario");
    }

    return data;
  } catch (error) {
    console.error("❌ Error al crear usuario:", error);
    throw error;
  }
};

/**
 * Actualizar usuario existente
 * Usa /admin/users/{id} o /superadmin/admins/{id} según el rol del usuario logueado
 * Convierte role_id a role_name antes de enviar
 */
export const updateUser = async (userId, userData) => {
  try {
    // Convertir role_id a role_name si existe
    const dataToSend = { ...userData };
    if (dataToSend.role_id) {
      // Obtener el nombre del rol desde getRoles()
      const roles = await getRoles();
      const selectedRole = roles.find((r) => r.id === dataToSend.role_id);
      if (selectedRole) {
        dataToSend.role_name = selectedRole.name;
      }
      delete dataToSend.role_id;
    }

    const endpoint = getEndpointPrefix();
    const response = await fetch(`${API_BASE_URL}/${endpoint}/${userId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(dataToSend),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.errors) {
        const errorMessages = Object.values(data.errors).flat().join(", ");
        throw new Error(errorMessages);
      }
      throw new Error(data.message || "Error al actualizar usuario");
    }

    return data;
  } catch (error) {
    console.error("❌ Error al actualizar usuario:", error);
    throw error;
  }
};

/**
 * Activar/Desactivar usuario
 */
export const toggleUserStatus = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/toggle-status`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error al cambiar estado del usuario");
    }

    return data;
  } catch (error) {
    console.error("❌ Error al cambiar estado del usuario:", error);
    throw error;
  }
};

/**
 * Obtener roles disponibles
 */
export const getRoles = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/roles`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al obtener roles");
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error al obtener roles:", error);
    throw error;
  }
};

/**
 * Obtener altas de un usuario específico
 */
export const getUserAltas = async (userId, filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `${API_BASE_URL}/admin/users/${userId}/altas${
      queryParams ? `?${queryParams}` : ""
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
