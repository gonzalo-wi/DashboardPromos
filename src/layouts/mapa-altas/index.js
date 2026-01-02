/**
=========================================================
* Mapa de Altas - Vista de ubicación de clientes dados de alta
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
import Avatar from "@mui/material/Avatar";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Componente de Mapa
import MapaAltas from "./components/MapaAltas";

// Servicios
import { getAltas } from "services/altasService";
import { getUsers } from "services/userService";

function MapaAltasView() {
  const [showAll, setShowAll] = useState(true);
  const [selectedAlta, setSelectedAlta] = useState(null);
  const [altas, setAltas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(""); // Iniciar vacío para mostrar todas
  const [selectedUser, setSelectedUser] = useState("todos");
  const [estadoFilter, setEstadoFilter] = useState("todos");

  // Cargar usuarios al montar
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const data = await getUsers();
        setUsuarios(data);
      } catch (err) {
        console.error("Error al cargar usuarios:", err);
      }
    };
    fetchUsuarios();
  }, []);

  // Cargar altas cuando cambian los filtros
  useEffect(() => {
    const fetchAltas = async () => {
      try {
        setLoading(true);
        const filters = {};

        // Solo agregar filtro de fecha si hay una fecha seleccionada
        if (selectedDate) {
          filters.fecha = selectedDate;
        }

        if (selectedUser !== "todos") {
          filters.user_id = selectedUser;
        }

        console.log("🔍 Buscando altas con filtros:", filters);
        const data = await getAltas(filters);
        console.log("📦 Datos recibidos de la API:", data);
        console.log("📦 Tipo de datos:", typeof data, Array.isArray(data));

        // Manejar tanto respuesta paginada como array directo
        let altasData = [];
        if (Array.isArray(data)) {
          // Respuesta directa como array
          altasData = data;
        } else if (data && data.data) {
          // Respuesta paginada
          altasData = data.data;
        }

        console.log("📦 Altas procesadas:", altasData.length);
        setAltas(altasData);
        setError(null);
      } catch (err) {
        console.error("Error al cargar altas:", err);
        setError("Error al cargar las altas.");
        setAltas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAltas();
  }, [selectedDate, selectedUser]);

  // Filtrar altas
  const altasFiltradas = altas.filter((alta) => {
    // Filtro por visitado (estado)
    if (estadoFilter === "pendientes" && alta.visitado !== 0) return false;
    if (estadoFilter === "entregados" && alta.visitado !== 1) return false;

    // Filtro por alta seleccionada
    if (!showAll && selectedAlta && alta.id_alta_cliente_promo !== selectedAlta) return false;

    // Solo mostrar si tiene coordenadas
    const lat = parseFloat(alta.latitud);
    const lng = parseFloat(alta.longitud);
    return !isNaN(lat) && !isNaN(lng);
  });

  console.log("🔎 Altas filtradas para el mapa:", altasFiltradas);
  console.log("🔎 Total de altas filtradas:", altasFiltradas.length);

  // Contar por estado (visitado)
  const pendientes = altas.filter(
    (a) => a.visitado === 0 || a.visitado === null || a.visitado === undefined
  ).length;
  const entregados = altas.filter((a) => a.visitado === 1).length;
  const conCoordenadas = altas.filter((a) => {
    const lat = parseFloat(a.latitud);
    const lng = parseFloat(a.longitud);
    return !isNaN(lat) && !isNaN(lng);
  }).length;

  console.log("📊 Estadísticas:", { total: altas.length, pendientes, entregados, conCoordenadas });

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {error && (
          <Fade in>
            <MDBox mb={2}>
              <Card>
                <MDBox p={2} display="flex" alignItems="center" gap={1} bgcolor="error.main">
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
          {/* Panel lateral con filtros y lista */}
          <Grid item xs={12} lg={3}>
            <Grow in timeout={400}>
              <Card>
                <MDBox
                  p={2}
                  sx={{
                    background: "linear-gradient(195deg, #42A5F5, #1976D2)",
                    borderRadius: "lg 0 0 0",
                  }}
                >
                  <MDBox display="flex" alignItems="center" gap={1}>
                    <Icon sx={{ color: "white", fontSize: 28 }}>place</Icon>
                    <MDBox>
                      <MDTypography variant="h6" fontWeight="bold" color="white">
                        Altas en el Mapa
                      </MDTypography>
                      <MDTypography variant="caption" color="white" opacity={0.9}>
                        {conCoordenadas} con ubicación
                      </MDTypography>
                    </MDBox>
                  </MDBox>
                </MDBox>
                <MDBox p={2}>
                  {loading ? (
                    <MDBox display="flex" flexDirection="column" alignItems="center" p={3}>
                      <CircularProgress size={50} thickness={4} />
                      <MDTypography variant="caption" color="text" mt={2}>
                        Cargando altas...
                      </MDTypography>
                    </MDBox>
                  ) : (
                    <>
                      {/* Filtros */}
                      <Zoom in timeout={600}>
                        <MDBox mb={2}>
                          <TextField
                            fullWidth
                            type="date"
                            label="Fecha"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{
                              startAdornment: (
                                <Icon sx={{ mr: 1, color: "text.secondary" }}>event</Icon>
                              ),
                            }}
                            size="small"
                          />
                        </MDBox>
                      </Zoom>

                      <Zoom in timeout={700}>
                        <MDBox mb={2}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Usuario</InputLabel>
                            <Select
                              value={selectedUser}
                              label="Usuario"
                              onChange={(e) => setSelectedUser(e.target.value)}
                            >
                              <MenuItem value="todos">
                                <MDBox display="flex" alignItems="center" gap={1}>
                                  <Icon fontSize="small">groups</Icon>
                                  Todos los usuarios
                                </MDBox>
                              </MenuItem>
                              {usuarios.map((user) => (
                                <MenuItem key={user.id} value={user.id}>
                                  <MDBox display="flex" alignItems="center" gap={1}>
                                    <Avatar sx={{ width: 20, height: 20, fontSize: 12 }}>
                                      {user.name.charAt(0)}
                                    </Avatar>
                                    {user.name}
                                  </MDBox>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </MDBox>
                      </Zoom>

                      <Zoom in timeout={800}>
                        <MDBox mb={2}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Estado</InputLabel>
                            <Select
                              value={estadoFilter}
                              label="Estado"
                              onChange={(e) => setEstadoFilter(e.target.value)}
                            >
                              <MenuItem value="todos">Todos</MenuItem>
                              <MenuItem value="pendientes">
                                <Chip
                                  label="Pendientes"
                                  color="error"
                                  size="small"
                                  sx={{ fontSize: "0.75rem" }}
                                />
                              </MenuItem>
                              <MenuItem value="entregados">
                                <Chip
                                  label="Entregados"
                                  color="success"
                                  size="small"
                                  sx={{ fontSize: "0.75rem" }}
                                />
                              </MenuItem>
                            </Select>
                          </FormControl>
                        </MDBox>
                      </Zoom>

                      <Zoom in timeout={900}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={showAll}
                              onChange={(e) => {
                                setShowAll(e.target.checked);
                                if (e.target.checked) setSelectedAlta(null);
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

                      {/* Resumen */}
                      <MDBox mt={2} p={2} bgcolor="grey.100" borderRadius="lg">
                        <MDTypography variant="caption" fontWeight="bold" mb={1}>
                          Resumen
                        </MDTypography>
                        <MDBox display="flex" justifyContent="space-between" mt={1}>
                          <Chip
                            label={`${pendientes} Pendientes`}
                            color="error"
                            size="small"
                            icon={<Icon fontSize="small">pending</Icon>}
                          />
                          <Chip
                            label={`${entregados} Entregados`}
                            color="success"
                            size="small"
                            icon={<Icon fontSize="small">check_circle</Icon>}
                          />
                        </MDBox>
                      </MDBox>

                      {/* Lista de altas */}
                      <MDBox mt={2} maxHeight="400px" overflow="auto">
                        {altasFiltradas.length === 0 ? (
                          <MDBox p={2} textAlign="center">
                            <Icon fontSize="large" color="disabled">
                              location_off
                            </Icon>
                            <MDTypography variant="caption" color="text" display="block">
                              No hay altas para mostrar
                            </MDTypography>
                          </MDBox>
                        ) : (
                          altasFiltradas.map((alta, index) => (
                            <Zoom in timeout={1000 + index * 50} key={alta.id_alta_cliente_promo}>
                              <MDBox
                                p={1.5}
                                mb={1}
                                borderRadius="lg"
                                sx={{
                                  backgroundColor:
                                    selectedAlta === alta.id_alta_cliente_promo
                                      ? "rgba(0, 0, 0, 0.08)"
                                      : "transparent",
                                  cursor: "pointer",
                                  transition: "all 0.3s",
                                  border: `2px solid ${
                                    alta.visitado === 1 ? "#4CAF50" : "#F44336"
                                  }`,
                                  "&:hover": {
                                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                                    transform: "translateX(5px)",
                                  },
                                }}
                                onClick={() => {
                                  setSelectedAlta(alta.id_alta_cliente_promo);
                                  setShowAll(false);
                                }}
                              >
                                <MDBox
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="space-between"
                                >
                                  <MDBox flex={1}>
                                    <MDTypography
                                      variant="button"
                                      fontWeight="bold"
                                      fontSize="0.75rem"
                                    >
                                      {alta.nombre_completo}
                                    </MDTypography>
                                    <MDTypography variant="caption" color="text" display="block">
                                      {alta.direccion}
                                    </MDTypography>
                                  </MDBox>
                                  <Chip
                                    label={alta.visitado === 1 ? "OK" : "P"}
                                    color={alta.visitado === 1 ? "success" : "error"}
                                    size="small"
                                    sx={{ fontSize: "0.65rem", height: "20px", minWidth: "30px" }}
                                  />
                                </MDBox>
                              </MDBox>
                            </Zoom>
                          ))
                        )}
                      </MDBox>
                    </>
                  )}
                </MDBox>
              </Card>
            </Grow>

            {/* Leyenda */}
            <Grow in timeout={600}>
              <Card sx={{ mt: 2 }}>
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
                  <MDBox display="flex" alignItems="center" mb={1.5}>
                    <MDBox
                      width={20}
                      height={20}
                      borderRadius="50%"
                      bgcolor="#4CAF50"
                      mr={1.5}
                      border="2px solid white"
                    />
                    <MDTypography variant="caption">Entregado</MDTypography>
                  </MDBox>
                  <MDBox display="flex" alignItems="center">
                    <MDBox
                      width={20}
                      height={20}
                      borderRadius="50%"
                      bgcolor="#F44336"
                      mr={1.5}
                      border="2px solid white"
                    />
                    <MDTypography variant="caption">Pendiente</MDTypography>
                  </MDBox>
                </MDBox>
              </Card>
            </Grow>
          </Grid>

          {/* Mapa */}
          <Grid item xs={12} lg={9}>
            <Fade in timeout={800}>
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
                  sx={{
                    background: "linear-gradient(195deg, #49a3f1, #1A73E8)",
                  }}
                >
                  <MDBox display="flex" alignItems="center" gap={2}>
                    <Icon sx={{ fontSize: 32, color: "white" }}>map</Icon>
                    <MDBox>
                      <MDTypography variant="h5" fontWeight="bold" color="white">
                        Mapa de Altas de Clientes
                      </MDTypography>
                      <MDTypography variant="caption" color="white" opacity={0.9}>
                        Ubicación de clientes dados de alta
                      </MDTypography>
                    </MDBox>
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
                    <MapaAltas altas={altasFiltradas} selectedAltaId={selectedAlta} />
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

export default MapaAltasView;
