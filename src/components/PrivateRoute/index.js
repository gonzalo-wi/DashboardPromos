/**
 * Componente de Ruta Protegida
 * Verifica autenticación y permisos antes de permitir acceso
 */

import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "../../context/AuthContext";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import CircularProgress from "@mui/material/CircularProgress";

const PrivateRoute = ({ children, requiredPermission, requiredRole }) => {
  const { isAuthenticated, loading, hasPermission, hasRole } = useAuth();

  // Mostrar loading mientras se verifica autenticación
  if (loading) {
    return (
      <MDBox
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        flexDirection="column"
      >
        <CircularProgress color="info" size={60} />
        <MDTypography variant="h6" mt={2}>
          Verificando sesión...
        </MDTypography>
      </MDBox>
    );
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/authentication/sign-in" replace />;
  }

  // Verificar permiso específico si se requiere
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <MDBox p={3} textAlign="center">
        <MDTypography variant="h4" color="error" mb={2}>
          Acceso Denegado
        </MDTypography>
        <MDTypography variant="body2">No tienes permisos para acceder a esta sección.</MDTypography>
        <MDTypography variant="caption" color="text">
          Permiso requerido: {requiredPermission}
        </MDTypography>
      </MDBox>
    );
  }

  // Verificar rol específico si se requiere
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <MDBox p={3} textAlign="center">
        <MDTypography variant="h4" color="error" mb={2}>
          Acceso Denegado
        </MDTypography>
        <MDTypography variant="body2">
          No tienes el rol necesario para acceder a esta sección.
        </MDTypography>
        <MDTypography variant="caption" color="text">
          Rol requerido: {requiredRole}
        </MDTypography>
      </MDBox>
    );
  }

  // Si pasa todas las validaciones, mostrar el contenido
  return children;
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredPermission: PropTypes.string,
  requiredRole: PropTypes.string,
};

PrivateRoute.defaultProps = {
  requiredPermission: null,
  requiredRole: null,
};

export default PrivateRoute;
