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
        <MDBox>
          <MDTypography variant="caption" fontWeight="medium" display="block">
            {fechaStr}
          </MDTypography>
          <MDTypography variant="caption" color="text">
            {horaStr}
          </MDTypography>
        </MDBox>
      ),
      cliente: (
        <MDTypography variant="caption" fontWeight="medium">
          {alta.nombre_completo}
        </MDTypography>
      ),
      direccion: (
        <MDTypography variant="caption" color="text">
          {alta.direccion}, {alta.localidad}
        </MDTypography>
      ),
      telefono: (
        <MDTypography variant="caption" color="text">
          {alta.telefono}
        </MDTypography>
      ),
      promotor: (
        <MDBox>
          <MDTypography variant="caption" fontWeight="medium" display="block">
            {alta.user_promo?.name || "-"}
          </MDTypography>
          <MDTypography variant="caption" color="text">
            @{alta.user_promo?.username || "-"}
          </MDTypography>
        </MDBox>
      ),
      promocion: (
        <Chip
          label={alta.promotion?.name || "Sin promoción"}
          color="info"
          size="small"
          variant="outlined"
        />
      ),
      ruta: (
        <MDTypography variant="caption" fontWeight="bold" color="text">
          {alta.nro_rto}
        </MDTypography>
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
            <MDBox mb={1.5}>
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
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
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
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
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
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
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
          </Grid>
        </Grid>

        {/* Tabla de altas */}
        <Grid container spacing={6}>
          <Grid item xs={12}>
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
                  Registro de Altas de Clientes
                </MDTypography>
              </MDBox>

              {/* Filtros */}
              <MDBox p={3} display="flex" gap={2} flexWrap="wrap" alignItems="center">
                <FormControl sx={{ minWidth: 200 }}>
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

                <FormControl sx={{ minWidth: 200 }}>
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

                {(selectedUser || selectedDate) && (
                  <MDButton variant="outlined" color="secondary" onClick={handleClearFilters}>
                    <Icon>clear</Icon>&nbsp; Limpiar Filtros
                  </MDButton>
                )}

                <MDBox flexGrow={1} />

                <MDTypography variant="caption" color="text">
                  Mostrando {altas.length} de {pagination.total} altas
                </MDTypography>
              </MDBox>

              {/* Contenido de la tabla */}
              <MDBox pt={0} pb={3} px={3}>
                {loading ? (
                  <MDBox display="flex" justifyContent="center" p={3}>
                    <CircularProgress color="info" />
                  </MDBox>
                ) : error ? (
                  <Alert severity="error">{error}</Alert>
                ) : altas.length === 0 ? (
                  <MDBox textAlign="center" p={3}>
                    <MDTypography variant="h6" color="text">
                      No hay altas registradas
                    </MDTypography>
                    <MDTypography variant="caption" color="text">
                      {selectedUser || selectedDate
                        ? "Prueba cambiando los filtros"
                        : "Aún no se han registrado altas"}
                    </MDTypography>
                  </MDBox>
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
                      <MDBox display="flex" justifyContent="center" alignItems="center" mt={3}>
                        <IconButton
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                          color="info"
                        >
                          <Icon>chevron_left</Icon>
                        </IconButton>

                        <MDTypography variant="caption" color="text" mx={2}>
                          Página {pagination.current_page} de {pagination.last_page}
                        </MDTypography>

                        <IconButton
                          onClick={handleNextPage}
                          disabled={currentPage === pagination.last_page}
                          color="info"
                        >
                          <Icon>chevron_right</Icon>
                        </IconButton>
                      </MDBox>
                    )}
                  </>
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

export default DashboardPromotores;
