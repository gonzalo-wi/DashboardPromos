/**
 * Servicio de Autenticación - Sistema de Promociones
 * Maneja login, logout, y gestión de tokens
 */

import config from "../config";

const API_BASE_URL = config.api.baseUrl;

/**
 * Realiza login en el sistema
 * @param {string} username - Nombre de usuario
 * @param {string} password - Contraseña
 * @param {string} deviceType - Tipo de dispositivo (web, mobile, ios, android)
 * @returns {Promise<Object>} Respuesta del servidor con token y datos del usuario
 */
export const login = async (username, password, deviceType = "web") => {
  try {
    console.log("🔐 Intentando login...", { username, deviceType });

    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
        device_type: deviceType,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Manejar errores específicos de la API
      if (response.status === 401) {
        throw new Error(data.message || "Credenciales incorrectas");
      }
      if (response.status === 403) {
        throw new Error(data.message || "Usuario inactivo o sin permisos");
      }
      if (response.status === 429) {
        throw new Error("Demasiados intentos. Por favor espere un momento.");
      }
      throw new Error(data.message || "Error al iniciar sesión");
    }

    console.log("✅ Login exitoso:", {
      user: data.user.name,
      role: data.user.role,
      expiresAt: data.expires_at,
    });

    // Guardar datos en localStorage
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("expiresAt", data.expires_at);

    return data;
  } catch (error) {
    console.error("❌ Error en login:", error.message);
    throw error;
  }
};

/**
 * Realiza logout del sistema
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    const token = localStorage.getItem("token");

    if (token) {
      console.log("🚪 Cerrando sesión...");

      await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    }

    // Limpiar localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("expiresAt");

    console.log("✅ Sesión cerrada correctamente");
  } catch (error) {
    console.error("❌ Error en logout:", error.message);
    // Igualmente limpiar localStorage aunque falle la API
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("expiresAt");
  }
};

/**
 * Obtiene el perfil del usuario actual
 * @returns {Promise<Object>} Datos del usuario
 */
export const getProfile = async () => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No hay sesión activa");
    }

    const response = await fetch(`${API_BASE_URL}/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token inválido o expirado
        logout();
        throw new Error("Sesión expirada. Por favor inicie sesión nuevamente.");
      }
      throw new Error("Error al obtener perfil");
    }

    const data = await response.json();
    // Actualizar datos en localStorage
    localStorage.setItem("user", JSON.stringify(data));

    return data;
  } catch (error) {
    console.error("❌ Error al obtener perfil:", error.message);
    throw error;
  }
};

/**
 * Verifica si el token está expirado
 * @returns {boolean} true si el token está expirado
 */
export const isTokenExpired = () => {
  const expiresAt = localStorage.getItem("expiresAt");

  if (!expiresAt) {
    return true;
  }

  const expirationDate = new Date(expiresAt);
  const now = new Date();

  return now >= expirationDate;
};

/**
 * Obtiene el token almacenado
 * @returns {string|null} Token o null si no existe
 */
export const getToken = () => {
  if (isTokenExpired()) {
    logout();
    return null;
  }
  return localStorage.getItem("token");
};

/**
 * Obtiene el usuario almacenado
 * @returns {Object|null} Usuario o null si no existe
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr || isTokenExpired()) {
    return null;
  }
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error("Error al parsear usuario:", error);
    return null;
  }
};

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean} true si está autenticado
 */
export const isAuthenticated = () => {
  return !!getToken() && !isTokenExpired();
};

/**
 * Verifica si el usuario tiene un permiso específico
 * @param {string} permission - Nombre del permiso
 * @returns {boolean} true si tiene el permiso
 */
export const hasPermission = (permission) => {
  const user = getCurrentUser();
  if (!user || !user.permissions) {
    return false;
  }
  return user.permissions.includes(permission);
};

/**
 * Verifica si el usuario tiene un rol específico
 * @param {string} role - Nombre del rol (user, admin, superadmin)
 * @returns {boolean} true si tiene el rol
 */
export const hasRole = (role) => {
  const user = getCurrentUser();
  if (!user) {
    return false;
  }
  return user.role === role;
};

/**
 * Obtiene el tiempo restante hasta la expiración del token en horas
 * @returns {number} Horas restantes (puede ser decimal)
 */
export const getTimeUntilExpiration = () => {
  const expiresAt = localStorage.getItem("expiresAt");

  if (!expiresAt) {
    return 0;
  }

  const expirationDate = new Date(expiresAt);
  const now = new Date();
  const diffMs = expirationDate - now;

  return diffMs / (1000 * 60 * 60); // Convertir a horas
};
