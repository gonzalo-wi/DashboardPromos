/**
 * Context de Autenticación
 * Maneja el estado global del usuario autenticado
 */

import { createContext, useContext, useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import {
  login as loginService,
  logout as logoutService,
  getCurrentUser,
  isAuthenticated as checkAuth,
  hasPermission as checkPermission,
  hasRole as checkRole,
} from "../services/authService";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Cargar usuario al iniciar
  useEffect(() => {
    const loadUser = () => {
      try {
        if (checkAuth()) {
          const currentUser = getCurrentUser();
          setUser(currentUser);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error al cargar usuario:", error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (username, password, deviceType = "web") => {
    try {
      const data = await loginService(username, password, deviceType);
      setUser(data.user);
      setIsAuthenticated(true);
      return data;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutService();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const hasPermission = (permission) => {
    return checkPermission(permission);
  };

  const hasRole = (role) => {
    return checkRole(role);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      loading,
      login,
      logout,
      hasPermission,
      hasRole,
    }),
    [user, isAuthenticated, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
