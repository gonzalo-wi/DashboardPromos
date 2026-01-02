/**
=========================================================
* Dashboard de Promotores - Vista de métricas y altas
=========================================================
*/

import { useState, useEffect, useCallback } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import TextField from "@mui/material/TextField";
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
  const [selectedFechaEntrega, setSelectedFechaEntrega] = useState("");
  const [selectedPromocion, setSelectedPromocion] = useState("");
  const [selectedReparto, setSelectedReparto] = useState("");
  const [repartoInput, setRepartoInput] = useState(""); // Valor temporal del input
  const [currentPage, setCurrentPage] = useState(1);

  // Datos de paginación
  const [pagination, setPagination] = useState({
    total: 0,
    per_page: 50,
    current_page: 1,
    last_page: 1,
  });

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    }
  };

  const loadAltas = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const filters = {
        page: currentPage,
      };

      if (selectedUser) filters.user_id = selectedUser;
      if (selectedDate) filters.fecha = selectedDate;

      // Para fecha de entrega, si es "En 7 días", usar rango desde hoy hasta 7 días
      if (selectedFechaEntrega) {
        const today = new Date().toISOString().split("T")[0];
        const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

        if (selectedFechaEntrega === "rango_7_dias") {
          // Filtrar desde hoy hasta dentro de 7 días
          filters.fecha_pedido_desde = today;
          filters.fecha_pedido_hasta = in7Days;
        } else {
          // Fecha específica (Hoy)
          filters.fecha_pedido = selectedFechaEntrega;
        }
      }

      if (selectedPromocion) filters.tipo_promocion_id = selectedPromocion;
      if (selectedReparto) filters.nro_rto = selectedReparto;

      const response = await getAllAltas(filters);

      // Si la respuesta es un array directamente, usarlo. Si es un objeto con data, usar data
      let altasData = Array.isArray(response) ? response : response.data || [];

      // Filtrar en el frontend si el backend no soporta los filtros de rango
      if (selectedFechaEntrega === "rango_7_dias") {
        const today = new Date().toISOString().split("T")[0];
        const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

        altasData = altasData.filter((alta) => {
          if (!alta.fecha_pedido) return false;
          const fechaPedido = new Date(alta.fecha_pedido).toISOString().split("T")[0];
          return fechaPedido >= today && fechaPedido <= in7Days;
        });
      }

      setAltas(altasData);
      setPagination({
        total: Array.isArray(response) ? response.length : response.total || 0,
        per_page: response.per_page || 50,
        current_page: response.current_page || 1,
        last_page: response.last_page || 1,
      });
    } catch (err) {
      console.error("❌ Error al cargar altas:", err);
      setError(err.message || "Error al cargar altas");
    } finally {
      setLoading(false);
    }
  }, [
    selectedUser,
    selectedDate,
    selectedFechaEntrega,
    selectedPromocion,
    selectedReparto,
    currentPage,
  ]);

  // Cargar usuarios al montar
  useEffect(() => {
    loadUsers();
  }, []);

  // Recargar altas cuando cambian los filtros
  useEffect(() => {
    loadAltas();
  }, [loadAltas]);

  const handleUserChange = (event) => {
    setSelectedUser(event.target.value);
    setCurrentPage(1);
  };

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
    setCurrentPage(1);
  };

  const handleFechaEntregaChange = (event) => {
    setSelectedFechaEntrega(event.target.value);
    setCurrentPage(1);
  };

  const handlePromocionChange = (event) => {
    setSelectedPromocion(event.target.value);
    setCurrentPage(1);
  };

  const handleRepartoInputChange = (event) => {
    setRepartoInput(event.target.value);
  };

  const handleRepartoKeyPress = (event) => {
    if (event.key === "Enter") {
      setSelectedReparto(repartoInput);
      setCurrentPage(1);
    }
  };

  const handleRepartoBlur = () => {
    if (repartoInput !== selectedReparto) {
      setSelectedReparto(repartoInput);
      setCurrentPage(1);
    }
  };

  const handleClearFilters = () => {
    setSelectedUser("");
    setSelectedDate("");
    setSelectedFechaEntrega("");
    setSelectedPromocion("");
    setSelectedReparto("");
    setRepartoInput("");
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

  // Obtener la fecha de hoy en formato YYYY-MM-DD
  const hoy = new Date().toISOString().split("T")[0];

  const altasHoy = altas.filter((alta) => {
    // Intentar obtener la fecha del alta de varios campos posibles
    let altaDate = null;

    if (alta.fecha_pedido) {
      // Si existe fecha_pedido, usarla
      altaDate = new Date(alta.fecha_pedido).toISOString().split("T")[0];
    } else if (alta.created_at) {
      // Si existe created_at, usarla
      altaDate = new Date(alta.created_at).toISOString().split("T")[0];
    }

    return altaDate === hoy;
  }).length;

  const usuariosActivos = new Set(altas.map((alta) => alta.user_promo?.iduser_promo)).size;

  // Preparar columnas de la tabla
  const columns = [
    { Header: "Fecha/Hora", accessor: "fecha", width: "11%" },
    { Header: "Fecha Entrega", accessor: "fechaEntrega", width: "11%" },
    { Header: "Cliente", accessor: "cliente", width: "18%" },
    { Header: "Dirección", accessor: "direccion", width: "16%" },
    { Header: "Teléfono", accessor: "telefono", width: "10%" },
    { Header: "Promotor", accessor: "promotor", width: "13%" },
    { Header: "Promoción", accessor: "promocion", width: "13%" },
    { Header: "Reparto", accessor: "reparto", width: "8%" },
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

    // Fecha de entrega
    const fechaEntrega = alta.fecha_pedido
      ? new Date(alta.fecha_pedido).toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "-";

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
      fechaEntrega: (
        <MDBox display="flex" alignItems="center" gap={1}>
          <Icon fontSize="small" sx={{ color: "success.main" }}>
            local_shipping
          </Icon>
          <MDTypography variant="caption" fontWeight="medium">
            {fechaEntrega}
          </MDTypography>
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
      reparto: (
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
  const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

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
                        <MenuItem value={in7Days}>En 7 días</MenuItem>
                      </Select>
                    </FormControl>
                  </Zoom>

                  <Zoom in timeout={1000}>
                    <FormControl
                      sx={{
                        minWidth: 200,
                        transition: "all 0.3s",
                        "&:hover": { transform: "translateY(-2px)" },
                      }}
                    >
                      <InputLabel id="fecha-entrega-filter-label">Fecha de Entrega</InputLabel>
                      <Select
                        labelId="fecha-entrega-filter-label"
                        value={selectedFechaEntrega}
                        label="Fecha de Entrega"
                        onChange={handleFechaEntregaChange}
                        sx={{ height: "45px" }}
                      >
                        <MenuItem value="">
                          <em>Todas las fechas</em>
                        </MenuItem>
                        <MenuItem value={today}>Hoy</MenuItem>
                        <MenuItem value="rango_7_dias">Próximos 7 días</MenuItem>
                      </Select>
                    </FormControl>
                  </Zoom>

                  <Zoom in timeout={1200}>
                    <FormControl
                      sx={{
                        minWidth: 180,
                        transition: "all 0.3s",
                        "&:hover": { transform: "translateY(-2px)" },
                      }}
                    >
                      <InputLabel id="promocion-filter-label">Promoción</InputLabel>
                      <Select
                        labelId="promocion-filter-label"
                        value={selectedPromocion}
                        label="Promoción"
                        onChange={handlePromocionChange}
                        sx={{ height: "45px" }}
                      >
                        <MenuItem value="">
                          <em>Todas</em>
                        </MenuItem>
                        {Array.from(
                          new Set(
                            altas
                              .map((a) => a.promotion?.idtipo_promocion)
                              .filter((id) => id !== null && id !== undefined)
                          )
                        ).map((id) => {
                          const promo = altas.find(
                            (a) => a.promotion?.idtipo_promocion === id
                          )?.promotion;
                          return (
                            <MenuItem key={id} value={id}>
                              {promo?.name || `Promoción ${id}`}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </Zoom>

                  <Zoom in timeout={1400}>
                    <TextField
                      label="Reparto"
                      value={repartoInput}
                      onChange={handleRepartoInputChange}
                      onKeyPress={handleRepartoKeyPress}
                      onBlur={handleRepartoBlur}
                      placeholder="Ej: 1, 2, 3... (Enter para filtrar)"
                      sx={{
                        minWidth: 150,
                        transition: "all 0.3s",
                        "&:hover": { transform: "translateY(-2px)" },
                      }}
                      InputProps={{
                        sx: { height: "45px" },
                      }}
                    />
                  </Zoom>

                  {(selectedUser ||
                    selectedDate ||
                    selectedFechaEntrega ||
                    selectedPromocion ||
                    selectedReparto) && (
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
