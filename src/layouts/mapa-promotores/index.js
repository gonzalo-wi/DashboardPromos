/**
=========================================================
* Mapa de Promotores - Vista de ubicación en tiempo real
=========================================================
*/

import { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Fade from "@mui/material/Fade";
import Grow from "@mui/material/Grow";
import Zoom from "@mui/material/Zoom";
import Icon from "@mui/material/Icon";
import Chip from "@mui/material/Chip";
import Badge from "@mui/material/Badge";
import Avatar from "@mui/material/Avatar";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Componente de Mapa
import MapaPromotores from "./components/MapaPromotores";

// Servicio de promotores
import { getPromotores } from "services/promotoresService";

function MapaPromotoresView() {
  const [showAll, setShowAll] = useState(true);
  const [selectedPromotor, setSelectedPromotor] = useState(null);
  const [promotores, setPromotores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]); // Fecha de hoy por defecto

  // Cargar promotores al montar el componente y cuando cambie la fecha
  useEffect(() => {
    const fetchPromotores = async () => {
      try {
        setLoading(true);
        const data = await getPromotores(selectedDate);
        setPromotores(data);
        setError(null);
      } catch (err) {
        console.error("Error al cargar promotores:", err);
        // El servicio ya maneja el fallback a mock, pero por si acaso
        setError("Mostrando datos de ejemplo.");
      } finally {
        setLoading(false);
      }
    };

    fetchPromotores();

    // Actualización automática deshabilitada
    // const interval = setInterval(fetchPromotores, 30000);
    // return () => clearInterval(interval);
  }, [selectedDate]);

  const promotoresFiltrados = showAll
    ? promotores
    : selectedPromotor
    ? promotores.filter((p) => p.id === selectedPromotor)
    : promotores;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {error && (
          <Fade in>
            <MDBox mb={2}>
              <Card
                sx={{
                  animation: "shake 0.5s",
                  "@keyframes shake": {
                    "0%, 100%": { transform: "translateX(0)" },
                    "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-5px)" },
                    "20%, 40%, 60%, 80%": { transform: "translateX(5px)" },
                  },
                }}
              >
                <MDBox
                  p={2}
                  display="flex"
                  alignItems="center"
                  gap={1}
                  sx={{
                    background: "linear-gradient(195deg, #FFA726, #FB8C00)",
                    borderRadius: "lg",
                  }}
                >
                  <Icon sx={{ color: "white" }}>warning</Icon>
                  <MDTypography variant="body2" color="white" fontWeight="medium">
                    {error}
                  </MDTypography>
                </MDBox>
              </Card>
            </MDBox>
          </Fade>
        )}
        <Grid container spacing={3}>
          {/* Panel lateral con lista de promotores */}
          <Grid item xs={12} lg={3}>
            <Grow in timeout={400}>
              <Card
                sx={{
                  transition: "all 0.3s",
                  "&:hover": {
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                  },
                }}
              >
                <MDBox
                  p={2}
                  sx={{
                    background: "linear-gradient(195deg, #42A5F5, #1976D2)",
                    borderRadius: "lg 0 0 0",
                  }}
                >
                  <MDBox display="flex" alignItems="center" gap={1}>
                    <Icon sx={{ color: "white", fontSize: 28 }}>people</Icon>
                    <MDBox>
                      <MDTypography variant="h6" fontWeight="bold" color="white">
                        Promotores Activos
                      </MDTypography>
                      <MDTypography variant="caption" color="white" opacity={0.9}>
                        {promotores.length} en línea
                      </MDTypography>
                    </MDBox>
                  </MDBox>
                </MDBox>
                <MDBox p={2}>
                  {loading ? (
                    <MDBox display="flex" flexDirection="column" alignItems="center" p={3}>
                      <CircularProgress size={50} thickness={4} />
                      <MDTypography variant="caption" color="text" mt={2}>
                        Cargando promotores...
                      </MDTypography>
                    </MDBox>
                  ) : (
                    <>
                      <Zoom in timeout={600}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={showAll}
                              onChange={(e) => {
                                setShowAll(e.target.checked);
                                if (e.target.checked) setSelectedPromotor(null);
                              }}
                              color="success"
                            />
                          }
                          label={
                            <MDBox display="flex" alignItems="center" gap={0.5}>
                              <Icon fontSize="small">visibility</Icon>
                              <MDTypography variant="button">Mostrar todos</MDTypography>
                            </MDBox>
                          }
                        />
                      </Zoom>
                      <Zoom in timeout={800}>
                        <MDBox mt={2} mb={2}>
                          <TextField
                            fullWidth
                            type="date"
                            label="Fecha"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            InputLabelProps={{
                              shrink: true,
                            }}
                            InputProps={{
                              startAdornment: (
                                <Icon sx={{ mr: 1, color: "text.secondary" }}>event</Icon>
                              ),
                            }}
                            size="small"
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                transition: "all 0.3s",
                                "&:hover": {
                                  transform: "translateY(-2px)",
                                },
                              },
                            }}
                          />
                        </MDBox>
                      </Zoom>
                      <MDBox mt={2}>
                        {promotores.map((promotor, index) => (
                          <Zoom in timeout={1000 + index * 100} key={promotor.id}>
                            <MDBox
                              p={2}
                              mb={1}
                              borderRadius="lg"
                              sx={{
                                backgroundColor:
                                  selectedPromotor === promotor.id
                                    ? "rgba(0, 0, 0, 0.08)"
                                    : "transparent",
                                cursor: "pointer",
                                transition: "all 0.3s",
                                border: `2px solid ${promotor.color}`,
                                "&:hover": {
                                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                                  transform: "translateX(5px)",
                                  boxShadow: `0 4px 12px ${promotor.color}40`,
                                },
                              }}
                              onClick={() => {
                                setSelectedPromotor(promotor.id);
                                setShowAll(false);
                              }}
                            >
                              <MDBox display="flex" alignItems="center" mb={0.5}>
                                <Badge
                                  badgeContent={
                                    <Icon sx={{ fontSize: 10, color: "white" }}>location_on</Icon>
                                  }
                                  color="success"
                                  overlap="circular"
                                  sx={{ mr: 1.5 }}
                                >
                                  <Avatar
                                    sx={{
                                      width: 36,
                                      height: 36,
                                      bgcolor: promotor.color,
                                      fontWeight: "bold",
                                      fontSize: 14,
                                    }}
                                  >
                                    {promotor.nombre.charAt(0).toUpperCase()}
                                  </Avatar>
                                </Badge>
                                <MDBox flex={1}>
                                  <MDTypography variant="button" fontWeight="bold">
                                    {promotor.nombre}
                                  </MDTypography>
                                  <MDBox display="flex" alignItems="center" gap={0.5} mt={0.3}>
                                    <Icon sx={{ fontSize: 14, color: "text.secondary" }}>
                                      route
                                    </Icon>
                                    <MDTypography variant="caption" color="text">
                                      {promotor.ruta.length} puntos
                                    </MDTypography>
                                  </MDBox>
                                </MDBox>
                              </MDBox>
                            </MDBox>
                          </Zoom>
                        ))}
                      </MDBox>
                    </>
                  )}
                </MDBox>
              </Card>
            </Grow>

            {/* Leyenda */}
            <Grow in timeout={600}>
              <Card
                sx={{
                  mt: 2,
                  transition: "all 0.3s",
                  "&:hover": {
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                  },
                }}
              >
                <MDBox
                  p={2}
                  sx={{
                    background: "linear-gradient(195deg, #66BB6A, #43A047)",
                    borderRadius: "lg 0 0 0",
                  }}
                >
                  <MDBox display="flex" alignItems="center" gap={1}>
                    <Icon sx={{ color: "white", fontSize: 24 }}>info</Icon>
                    <MDTypography variant="h6" fontWeight="bold" color="white">
                      Leyenda
                    </MDTypography>
                  </MDBox>
                </MDBox>
                <MDBox p={2}>
                  <Zoom in timeout={800}>
                    <MDBox mb={1.5} display="flex" alignItems="center">
                      <Badge
                        badgeContent={<Icon sx={{ fontSize: 8 }}>person</Icon>}
                        color="success"
                        overlap="circular"
                      >
                        <MDBox
                          width="24px"
                          height="24px"
                          borderRadius="50%"
                          sx={{ backgroundColor: "#4CAF50" }}
                          mr={1}
                        />
                      </Badge>
                      <MDTypography variant="caption" fontWeight="medium" ml={1}>
                        Posición actual
                      </MDTypography>
                    </MDBox>
                  </Zoom>
                  <Zoom in timeout={1000}>
                    <MDBox mb={1.5} display="flex" alignItems="center">
                      <MDBox
                        width="24px"
                        height="24px"
                        borderRadius="50%"
                        sx={{ backgroundColor: "#2196F3" }}
                        mr={1}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Icon sx={{ fontSize: 12, color: "white" }}>check</Icon>
                      </MDBox>
                      <MDTypography variant="caption" fontWeight="medium" ml={1}>
                        Cliente visitado
                      </MDTypography>
                    </MDBox>
                  </Zoom>
                  <Zoom in timeout={1200}>
                    <MDBox display="flex" alignItems="center">
                      <MDBox
                        width="30px"
                        height="4px"
                        sx={{
                          backgroundColor: "#FF9800",
                          borderRadius: "2px",
                        }}
                        mr={1}
                      />
                      <MDTypography variant="caption" fontWeight="medium" ml={1}>
                        Ruta del día
                      </MDTypography>
                    </MDBox>
                  </Zoom>
                </MDBox>
              </Card>
            </Grow>
          </Grid>

          {/* Mapa */}
          <Grid item xs={12} lg={9}>
            <Fade in timeout={800}>
              <Card
                sx={{
                  overflow: "visible",
                  boxShadow: "0 4px 20px 0 rgba(0,0,0,0.12)",
                  transition: "all 0.3s",
                  "&:hover": {
                    boxShadow: "0 8px 30px 0 rgba(0,0,0,0.15)",
                  },
                }}
              >
                <MDBox
                  mx={2}
                  mt={-3}
                  py={3}
                  px={2}
                  variant="gradient"
                  bgColor="info"
                  borderRadius="lg"
                  coloredShadow="info"
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
                  <MDBox display="flex" alignItems="center" gap={2}>
                    <Icon sx={{ fontSize: 32, color: "white" }}>map</Icon>
                    <MDBox>
                      <MDTypography variant="h5" fontWeight="bold" color="white">
                        Mapa de Promotores en Tiempo Real
                      </MDTypography>
                      <MDTypography variant="caption" color="white" opacity={0.9}>
                        Seguimiento GPS de ubicación y rutas
                      </MDTypography>
                    </MDBox>
                    <MDBox flexGrow={1} />
                    <Chip
                      icon={<Icon fontSize="small">refresh</Icon>}
                      label="En vivo"
                      size="small"
                      sx={{
                        bgcolor: "rgba(255,255,255,0.2)",
                        color: "white",
                        fontWeight: "bold",
                        animation: "pulse 2s infinite",
                        "@keyframes pulse": {
                          "0%, 100%": { opacity: 1 },
                          "50%": { opacity: 0.7 },
                        },
                      }}
                    />
                  </MDBox>
                </MDBox>
                <MDBox p={2}>
                  {loading ? (
                    <Fade in>
                      <MDBox
                        display="flex"
                        flexDirection="column"
                        justifyContent="center"
                        alignItems="center"
                        height="600px"
                      >
                        <CircularProgress size={60} thickness={4} />
                        <MDTypography variant="button" color="text" mt={2}>
                          Cargando mapa...
                        </MDTypography>
                      </MDBox>
                    </Fade>
                  ) : (
                    <MapaPromotores
                      promotores={promotoresFiltrados}
                      selectedPromotorId={selectedPromotor}
                    />
                  )}
                </MDBox>
              </Card>
            </Fade>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default MapaPromotoresView;
