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
import Icon from "@mui/material/Icon";
import Fade from "@mui/material/Fade";
import Zoom from "@mui/material/Zoom";

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
      <Fade in timeout={800}>
        <Card
          sx={{
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
          }}
        >
          <MDBox
            variant="gradient"
            bgColor="info"
            borderRadius="lg"
            coloredShadow="info"
            mx={2}
            mt={-3}
            p={3}
            mb={1}
            textAlign="center"
            sx={{
              background: "linear-gradient(195deg, #49a3f1, #1A73E8)",
              transition: "all 0.3s ease-in-out",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow:
                  "0 14px 26px -12px rgba(26, 115, 232, 0.42), 0 4px 23px 0px rgba(0, 0, 0, 0.12), 0 8px 10px -5px rgba(26, 115, 232, 0.2)",
              },
            }}
          >
            <MDTypography variant="h3" fontWeight="bold" color="white" mt={1}>
              AMP
            </MDTypography>
            <Zoom in timeout={1000}>
              <MDBox
                mt={2}
                mb={1}
                sx={{
                  transition: "all 0.3s ease-in-out",
                  "&:hover": {
                    transform: "scale(1.05) rotate(2deg)",
                  },
                }}
              >
                <img
                  src={camionImage}
                  alt="Camión"
                  style={{
                    width: "150px",
                    height: "auto",
                    filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))",
                  }}
                />
              </MDBox>
            </Zoom>
            <MDTypography variant="body2" color="white" opacity={0.8}>
              Aplicación móvil de promotores
            </MDTypography>
          </MDBox>
          <MDBox pt={4} pb={3} px={3}>
            <MDBox component="form" role="form" onSubmit={handleSubmit}>
              {error && (
                <Fade in>
                  <MDBox mb={3}>
                    <Alert
                      severity="error"
                      icon={<Icon>error_outline</Icon>}
                      sx={{
                        animation: "shake 0.5s",
                        "@keyframes shake": {
                          "0%, 100%": { transform: "translateX(0)" },
                          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-5px)" },
                          "20%, 40%, 60%, 80%": { transform: "translateX(5px)" },
                        },
                      }}
                    >
                      {error}
                    </Alert>
                  </MDBox>
                </Fade>
              )}
              <MDBox mb={3}>
                <MDInput
                  type="text"
                  label="Usuario"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  fullWidth
                  disabled={loading}
                  autoComplete="username"
                  autoFocus
                  InputProps={{
                    startAdornment: <Icon sx={{ mr: 1, color: "text.secondary" }}>person</Icon>,
                  }}
                />
              </MDBox>
              <MDBox mb={3}>
                <MDInput
                  type="password"
                  label="Contraseña"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  fullWidth
                  disabled={loading}
                  autoComplete="current-password"
                  InputProps={{
                    startAdornment: <Icon sx={{ mr: 1, color: "text.secondary" }}>lock</Icon>,
                  }}
                />
              </MDBox>
              <MDBox display="flex" alignItems="center" ml={-1} mb={2}>
                <Switch
                  checked={rememberMe}
                  onChange={handleSetRememberMe}
                  disabled={loading}
                  sx={{
                    "& .MuiSwitch-thumb": {
                      transition: "all 0.3s",
                    },
                  }}
                />
                <MDTypography
                  variant="button"
                  fontWeight="regular"
                  color="text"
                  onClick={handleSetRememberMe}
                  sx={{
                    cursor: loading ? "default" : "pointer",
                    userSelect: "none",
                    ml: -1,
                    transition: "all 0.2s",
                    "&:hover": {
                      color: "info.main",
                    },
                  }}
                >
                  &nbsp;&nbsp;Recordarme
                </MDTypography>
              </MDBox>
              <MDBox mt={4} mb={1}>
                <MDButton
                  variant="gradient"
                  color="info"
                  fullWidth
                  size="large"
                  type="submit"
                  disabled={loading}
                  onClick={handleSubmit}
                  sx={{
                    transition: "all 0.3s ease-in-out",
                    "&:hover": {
                      transform: loading ? "none" : "translateY(-2px)",
                      boxShadow: loading
                        ? "none"
                        : "0 7px 14px rgba(50, 50, 93, 0.1), 0 3px 6px rgba(0, 0, 0, 0.08)",
                    },
                    "&:active": {
                      transform: "translateY(0)",
                    },
                  }}
                >
                  {loading ? (
                    <MDBox display="flex" alignItems="center" justifyContent="center" gap={1}>
                      <CircularProgress color="white" size={20} />
                      <span>Iniciando sesión...</span>
                    </MDBox>
                  ) : (
                    <MDBox display="flex" alignItems="center" justifyContent="center" gap={1}>
                      <Icon>login</Icon>
                      <span>Iniciar Sesión</span>
                    </MDBox>
                  )}
                </MDButton>
              </MDBox>
              <MDBox mt={3} textAlign="center">
                <MDTypography variant="caption" color="text" fontWeight="regular">
                  <Icon fontSize="small" sx={{ verticalAlign: "middle", mr: 0.5 }}>
                    business
                  </Icon>
                  Ivess - El Jumillano
                </MDTypography>
              </MDBox>
            </MDBox>
          </MDBox>
        </Card>
      </Fade>
    </BasicLayout>
  );
}

export default Basic;
