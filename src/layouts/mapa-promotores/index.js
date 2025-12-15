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
          <MDBox mb={2}>
            <Card>
              <MDBox p={2} bgColor="warning" borderRadius="lg">
                <MDTypography variant="body2" color="white">
                  {error}
                </MDTypography>
              </MDBox>
            </Card>
          </MDBox>
        )}
        <Grid container spacing={3}>
          {/* Panel lateral con lista de promotores */}
          <Grid item xs={12} lg={3}>
            <Card>
              <MDBox p={2}>
                <MDTypography variant="h6" fontWeight="medium" mb={2}>
                  Promotores Activos
                </MDTypography>
                {loading ? (
                  <MDBox display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                  </MDBox>
                ) : (
                  <>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showAll}
                          onChange={(e) => {
                            setShowAll(e.target.checked);
                            if (e.target.checked) setSelectedPromotor(null);
                          }}
                        />
                      }
                      label="Mostrar todos"
                    />
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
                        size="small"
                      />
                    </MDBox>
                    <MDBox mt={2}>
                      {promotores.map((promotor) => (
                        <MDBox
                          key={promotor.id}
                          p={2}
                          mb={1}
                          borderRadius="lg"
                          sx={{
                            backgroundColor:
                              selectedPromotor === promotor.id
                                ? "rgba(0, 0, 0, 0.08)"
                                : "transparent",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            border: `2px solid ${promotor.color}`,
                            "&:hover": {
                              backgroundColor: "rgba(0, 0, 0, 0.04)",
                            },
                          }}
                          onClick={() => {
                            setSelectedPromotor(promotor.id);
                            setShowAll(false);
                          }}
                        >
                          <MDBox display="flex" alignItems="center" mb={0.5}>
                            <MDBox
                              width="12px"
                              height="12px"
                              borderRadius="50%"
                              sx={{ backgroundColor: promotor.color }}
                              mr={1}
                            />
                            <MDTypography variant="button" fontWeight="bold">
                              {promotor.nombre}
                            </MDTypography>
                          </MDBox>
                          <MDTypography variant="caption" color="text">
                            {promotor.ruta.length} puntos de ruta
                          </MDTypography>
                        </MDBox>
                      ))}
                    </MDBox>
                  </>
                )}
              </MDBox>
            </Card>

            {/* Leyenda */}
            <Card sx={{ mt: 2 }}>
              <MDBox p={2}>
                <MDTypography variant="h6" fontWeight="medium" mb={2}>
                  Leyenda
                </MDTypography>
                <MDBox mb={1} display="flex" alignItems="center">
                  <MDBox
                    width="20px"
                    height="20px"
                    borderRadius="50%"
                    sx={{ backgroundColor: "#4CAF50" }}
                    mr={1}
                  />
                  <MDTypography variant="caption">Posición actual</MDTypography>
                </MDBox>
                <MDBox mb={1} display="flex" alignItems="center">
                  <MDBox
                    width="20px"
                    height="20px"
                    borderRadius="50%"
                    sx={{ backgroundColor: "#2196F3" }}
                    mr={1}
                  />
                  <MDTypography variant="caption">Cliente visitado</MDTypography>
                </MDBox>
                <MDBox display="flex" alignItems="center">
                  <MDBox width="30px" height="3px" sx={{ backgroundColor: "#FF9800" }} mr={1} />
                  <MDTypography variant="caption">Ruta del día</MDTypography>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>

          {/* Mapa */}
          <Grid item xs={12} lg={9}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={3}
                px={2}
                variant="gradient"
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
              >
                <MDTypography variant="h6" color="white">
                  Mapa de Promotores en Tiempo Real
                </MDTypography>
              </MDBox>
              <MDBox p={2}>
                {loading ? (
                  <MDBox display="flex" justifyContent="center" alignItems="center" height="600px">
                    <CircularProgress size={60} />
                  </MDBox>
                ) : (
                  <MapaPromotores promotores={promotoresFiltrados} />
                )}
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default MapaPromotoresView;
