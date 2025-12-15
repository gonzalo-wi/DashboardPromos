/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useState } from "react";

// react-router-dom components
import { useNavigate } from "react-router-dom";

// @mui material components
import Card from "@mui/material/Card";
import Switch from "@mui/material/Switch";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";

// Authentication layout components
import BasicLayout from "layouts/authentication/components/BasicLayout";

// Auth context
import { useAuth } from "../../../context/AuthContext";

// Images
import bgImage from "assets/images/lluvia.jpg";
import camionImage from "assets/images/camion.png";

function Basic() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSetRememberMe = () => setRememberMe(!rememberMe);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Limpiar error al escribir
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validación básica
      if (!formData.username || !formData.password) {
        setError("Por favor complete todos los campos");
        setLoading(false);
        return;
      }

      // Intentar login
      const response = await login(formData.username, formData.password, "web");

      console.log("✅ Login exitoso:", response.user);

      // Redirigir según el rol
      if (response.user.role === "superadmin" || response.user.role === "admin") {
        navigate("/dashboard-promotores");
      } else {
        navigate("/promotores");
      }
    } catch (err) {
      console.error("❌ Error en login:", err);
      setError(err.message || "Error al iniciar sesión. Por favor intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BasicLayout image={bgImage}>
      <Card>
        <MDBox
          variant="gradient"
          bgColor="info"
          borderRadius="lg"
          coloredShadow="info"
          mx={2}
          mt={-3}
          p={2}
          mb={1}
          textAlign="center"
        >
          <MDTypography variant="h4" fontWeight="medium" color="white" mt={1}>
            Altas de Promotores
          </MDTypography>
          <MDBox mt={2} mb={1}>
            <img src={camionImage} alt="Camión" style={{ width: "150px", height: "auto" }} />
          </MDBox>
        </MDBox>
        <MDBox pt={4} pb={3} px={3}>
          <MDBox component="form" role="form" onSubmit={handleSubmit}>
            {error && (
              <MDBox mb={2}>
                <Alert severity="error">{error}</Alert>
              </MDBox>
            )}
            <MDBox mb={2}>
              <MDInput
                type="text"
                label="Usuario"
                name="username"
                value={formData.username}
                onChange={handleChange}
                fullWidth
                disabled={loading}
                autoComplete="username"
              />
            </MDBox>
            <MDBox mb={2}>
              <MDInput
                type="password"
                label="Contraseña"
                name="password"
                value={formData.password}
                onChange={handleChange}
                fullWidth
                disabled={loading}
                autoComplete="current-password"
              />
            </MDBox>
            <MDBox display="flex" alignItems="center" ml={-1}>
              <Switch checked={rememberMe} onChange={handleSetRememberMe} disabled={loading} />
              <MDTypography
                variant="button"
                fontWeight="regular"
                color="text"
                onClick={handleSetRememberMe}
                sx={{ cursor: loading ? "default" : "pointer", userSelect: "none", ml: -1 }}
              >
                &nbsp;&nbsp;Recordarme
              </MDTypography>
            </MDBox>
            <MDBox mt={4} mb={1}>
              <MDButton
                variant="gradient"
                color="info"
                fullWidth
                type="submit"
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading ? (
                  <MDBox display="flex" alignItems="center" gap={1}>
                    <CircularProgress color="white" size={20} />
                    <span>Iniciando sesión...</span>
                  </MDBox>
                ) : (
                  "Iniciar Sesión"
                )}
              </MDButton>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>
    </BasicLayout>
  );
}

export default Basic;
