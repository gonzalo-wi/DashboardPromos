/**
=========================================================
* Dashboard de Promotores - Vista de métricas y altas
=========================================================
*/

import { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Fade from "@mui/material/Fade";
import Grow from "@mui/material/Grow";
import Zoom from "@mui/material/Zoom";
import Tooltip from "@mui/material/Tooltip";
import Avatar from "@mui/material/Avatar";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";
import DataTable from "examples/Tables/DataTable";

// Services
import { getAllAltas } from "services/altaService";
import { getUsers } from "services/userService";

function DashboardPromotores() {
  // Estados
  const [altas, setAltas] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtros
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Datos de paginación
  const [pagination, setPagination] = useState({
    total: 0,
    per_page: 50,
    current_page: 1,
    last_page: 1,
  });

  // Cargar usuarios y altas al montar
  useEffect(() => {
    loadUsers();
    loadAltas();
  }, []);

  // Recargar altas cuando cambian los filtros
  useEffect(() => {
    loadAltas();
  }, [selectedUser, selectedDate, currentPage]);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    }
  };

  const loadAltas = async () => {
    try {
      setLoading(true);
      setError("");

      const filters = {
        page: currentPage,
      };

      if (selectedUser) filters.user_id = selectedUser;
      if (selectedDate) filters.fecha = selectedDate;

      const response = await getAllAltas(filters);

      setAltas(response.data || []);
      setPagination({
        total: response.total || 0,
        per_page: response.per_page || 50,
        current_page: response.current_page || 1,
        last_page: response.last_page || 1,
      });
    } catch (err) {
      setError(err.message || "Error al cargar altas");
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (event) => {
    setSelectedUser(event.target.value);
    setCurrentPage(1);
  };

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSelectedUser("");
    setSelectedDate("");
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < pagination.last_page) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Calcular métricas
  const totalAltas = pagination.total;
  const altasHoy = altas.filter((alta) => {
    const today = new Date().toISOString().split("T")[0];
    const altaDate = alta.fecha_pedido || alta.created_at?.split("T")[0];
    return altaDate === today;
  }).length;

  const usuariosActivos = new Set(altas.map((alta) => alta.user_promo?.iduser_promo)).size;

  // Preparar columnas de la tabla
  const columns = [
    { Header: "Fecha/Hora", accessor: "fecha", width: "12%" },
    { Header: "Cliente", accessor: "cliente", width: "20%" },
    { Header: "Dirección", accessor: "direccion", width: "18%" },
    { Header: "Teléfono", accessor: "telefono", width: "12%" },
    { Header: "Promotor", accessor: "promotor", width: "15%" },
    { Header: "Promoción", accessor: "promocion", width: "15%" },
    { Header: "Ruta", accessor: "ruta", width: "8%" },
  ];

  // Preparar filas de la tabla
  const rows = altas.map((alta) => {
    const fecha = new Date(alta.created_at);
    const fechaStr = fecha.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const horaStr = fecha.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      fecha: (
        <MDBox display="flex" alignItems="center" gap={1}>
          <Icon fontSize="small" sx={{ color: "info.main" }}>
            event
          </Icon>
          <MDBox>
            <MDTypography variant="caption" fontWeight="medium" display="block">
              {fechaStr}
            </MDTypography>
            <MDTypography
              variant="caption"
              color="text"
              sx={{ fontSize: "0.7rem", display: "flex", alignItems: "center", gap: 0.5 }}
            >
              <Icon sx={{ fontSize: 12 }}>schedule</Icon>
              {horaStr}
            </MDTypography>
          </MDBox>
        </MDBox>
      ),
      cliente: (
        <MDBox display="flex" alignItems="center" gap={1}>
          <Avatar
            sx={{
              bgcolor: "primary.main",
              width: 32,
              height: 32,
              fontSize: 14,
              fontWeight: "bold",
            }}
          >
            {alta.nombre_completo.charAt(0).toUpperCase()}
          </Avatar>
          <MDTypography variant="caption" fontWeight="medium">
            {alta.nombre_completo}
          </MDTypography>
        </MDBox>
      ),
      direccion: (
        <MDBox display="flex" alignItems="center" gap={0.5}>
          <Icon fontSize="small" sx={{ color: "text.secondary", fontSize: 16 }}>
            location_on
          </Icon>
          <MDTypography variant="caption" color="text">
            {alta.direccion}, {alta.localidad}
          </MDTypography>
        </MDBox>
      ),
      telefono: (
        <Chip
          icon={<Icon fontSize="small">phone</Icon>}
          label={alta.telefono}
          size="small"
          variant="outlined"
          color="info"
          sx={{ borderRadius: "8px", fontWeight: "medium" }}
        />
      ),
      promotor: (
        <MDBox display="flex" alignItems="center" gap={1}>
          <Avatar
            sx={{
              bgcolor: "success.main",
              width: 32,
              height: 32,
              fontSize: 14,
              fontWeight: "bold",
            }}
          >
            {alta.user_promo?.name?.charAt(0).toUpperCase() || "?"}
          </Avatar>
          <MDBox>
            <MDTypography variant="caption" fontWeight="medium" display="block">
              {alta.user_promo?.name || "-"}
            </MDTypography>
            <MDTypography variant="caption" color="text" sx={{ fontSize: "0.7rem" }}>
              @{alta.user_promo?.username || "-"}
            </MDTypography>
          </MDBox>
        </MDBox>
      ),
      promocion: (
        <Chip
          icon={<Icon fontSize="small">local_offer</Icon>}
          label={alta.promotion?.name || "Sin promoción"}
          color="info"
          size="small"
          sx={{
            fontWeight: "bold",
            borderRadius: "8px",
          }}
        />
      ),
      ruta: (
        <Chip
          label={alta.nro_rto}
          size="small"
          color="warning"
          sx={{
            fontWeight: "bold",
            fontSize: "0.7rem",
          }}
        />
      ),
    };
  });

  // Opciones de fecha
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        {/* Tarjetas de métricas */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={6} lg={3}>
            <Grow in timeout={400}>
              <MDBox
                mb={1.5}
                sx={{
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-8px)",
                  },
                }}
              >
                <ComplexStatisticsCard
                  color="dark"
                  icon="people"
                  title="Total Altas"
                  count={totalAltas}
                  percentage={{
                    color: "success",
                    amount: "",
                    label: "En el período seleccionado",
                  }}
                />
              </MDBox>
            </Grow>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <Grow in timeout={600}>
              <MDBox
                mb={1.5}
                sx={{
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-8px)",
                  },
                }}
              >
                <ComplexStatisticsCard
                  icon="today"
                  title="Altas Hoy"
                  count={altasHoy}
                  percentage={{
                    color: "success",
                    amount: "",
                    label: "Registradas hoy",
                  }}
                />
              </MDBox>
            </Grow>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <Grow in timeout={800}>
              <MDBox
                mb={1.5}
                sx={{
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-8px)",
                  },
                }}
              >
                <ComplexStatisticsCard
                  color="success"
                  icon="person"
                  title="Usuarios Activos"
                  count={usuariosActivos}
                  percentage={{
                    color: "success",
                    amount: "",
                    label: "Con altas registradas",
                  }}
                />
              </MDBox>
            </Grow>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <Grow in timeout={1000}>
              <MDBox
                mb={1.5}
                sx={{
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-8px)",
                  },
                }}
              >
                <ComplexStatisticsCard
                  color="primary"
                  icon="auto_graph"
                  title="Promedio/Página"
                  count={altas.length}
                  percentage={{
                    color: "success",
                    amount: "",
                    label: `de ${pagination.per_page} máximo`,
                  }}
                />
              </MDBox>
            </Grow>
          </Grid>
        </Grid>

        {/* Tabla de altas */}
        <Grid container spacing={6}>
          <Grid item xs={12}>
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
                    <Icon sx={{ fontSize: 32, color: "white" }}>assignment</Icon>
                    <MDBox>
                      <MDTypography variant="h5" fontWeight="bold" color="white">
                        Registro de Altas de Clientes
                      </MDTypography>
                      <MDTypography variant="caption" color="white" opacity={0.8}>
                        Gestión completa de clientes y promotores
                      </MDTypography>
                    </MDBox>
                  </MDBox>
                </MDBox>

                {/* Filtros */}
                <MDBox p={3} display="flex" gap={2} flexWrap="wrap" alignItems="center">
                  <Zoom in timeout={600}>
                    <FormControl
                      sx={{
                        minWidth: 200,
                        transition: "all 0.3s",
                        "&:hover": { transform: "translateY(-2px)" },
                      }}
                    >
                      <InputLabel id="user-filter-label">Filtrar por Usuario</InputLabel>
                      <Select
                        labelId="user-filter-label"
                        value={selectedUser}
                        label="Filtrar por Usuario"
                        onChange={handleUserChange}
                        sx={{ height: "45px" }}
                      >
                        <MenuItem value="">
                          <em>Todos los usuarios</em>
                        </MenuItem>
                        {users.map((user) => (
                          <MenuItem key={user.id} value={user.id}>
                            {user.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Zoom>

                  <Zoom in timeout={800}>
                    <FormControl
                      sx={{
                        minWidth: 200,
                        transition: "all 0.3s",
                        "&:hover": { transform: "translateY(-2px)" },
                      }}
                    >
                      <InputLabel id="date-filter-label">Filtrar por Fecha</InputLabel>
                      <Select
                        labelId="date-filter-label"
                        value={selectedDate}
                        label="Filtrar por Fecha"
                        onChange={handleDateChange}
                        sx={{ height: "45px" }}
                      >
                        <MenuItem value="">
                          <em>Todas las fechas</em>
                        </MenuItem>
                        <MenuItem value={today}>Hoy</MenuItem>
                        <MenuItem value={yesterday}>Ayer</MenuItem>
                        <MenuItem value={weekAgo}>Hace 7 días</MenuItem>
                      </Select>
                    </FormControl>
                  </Zoom>

                  {(selectedUser || selectedDate) && (
                    <Zoom in>
                      <MDButton
                        variant="outlined"
                        color="secondary"
                        onClick={handleClearFilters}
                        sx={{
                          transition: "all 0.3s",
                          "&:hover": {
                            transform: "scale(1.05)",
                          },
                        }}
                      >
                        <Icon>clear</Icon>&nbsp; Limpiar Filtros
                      </MDButton>
                    </Zoom>
                  )}

                  <MDBox flexGrow={1} />

                  <Chip
                    icon={<Icon fontSize="small">info</Icon>}
                    label={`Mostrando ${altas.length} de ${pagination.total} altas`}
                    color="info"
                    variant="outlined"
                    sx={{ fontWeight: "medium" }}
                  />
                </MDBox>

                {/* Contenido de la tabla */}
                <MDBox pt={0} pb={3} px={3}>
                  {loading ? (
                    <Fade in>
                      <MDBox display="flex" flexDirection="column" alignItems="center" p={5}>
                        <CircularProgress color="info" size={60} thickness={4} />
                        <MDTypography variant="button" color="text" mt={2}>
                          Cargando altas...
                        </MDTypography>
                      </MDBox>
                    </Fade>
                  ) : error ? (
                    <Fade in>
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
                    </Fade>
                  ) : altas.length === 0 ? (
                    <Fade in>
                      <MDBox textAlign="center" p={5}>
                        <Icon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}>inbox</Icon>
                        <MDTypography variant="h6" color="text" mb={1}>
                          No hay altas registradas
                        </MDTypography>
                        <MDTypography variant="caption" color="text">
                          {selectedUser || selectedDate
                            ? "Prueba cambiando los filtros"
                            : "Aún no se han registrado altas"}
                        </MDTypography>
                      </MDBox>
                    </Fade>
                  ) : (
                    <>
                      <DataTable
                        table={{ columns, rows }}
                        isSorted={false}
                        entriesPerPage={false}
                        showTotalEntries={false}
                        noEndBorder
                      />

                      {/* Paginación */}
                      {pagination.last_page > 1 && (
                        <Fade in>
                          <MDBox display="flex" justifyContent="center" alignItems="center" mt={3}>
                            <Tooltip title="Página anterior" arrow>
                              <span>
                                <IconButton
                                  onClick={handlePreviousPage}
                                  disabled={currentPage === 1}
                                  color="info"
                                  sx={{
                                    transition: "all 0.3s",
                                    "&:hover:not(:disabled)": {
                                      transform: "scale(1.1)",
                                    },
                                  }}
                                >
                                  <Icon>chevron_left</Icon>
                                </IconButton>
                              </span>
                            </Tooltip>

                            <Chip
                              label={`Página ${pagination.current_page} de ${pagination.last_page}`}
                              color="info"
                              sx={{ mx: 2, fontWeight: "bold" }}
                            />

                            <Tooltip title="Página siguiente" arrow>
                              <span>
                                <IconButton
                                  onClick={handleNextPage}
                                  disabled={currentPage === pagination.last_page}
                                  color="info"
                                  sx={{
                                    transition: "all 0.3s",
                                    "&:hover:not(:disabled)": {
                                      transform: "scale(1.1)",
                                    },
                                  }}
                                >
                                  <Icon>chevron_right</Icon>
                                </IconButton>
                              </span>
                            </Tooltip>
                          </MDBox>
                        </Fade>
                      )}
                    </>
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

export default DashboardPromotores;
