/**
=========================================================
* Efectividad de Promotores - Análisis con gráficos
=========================================================
*/

import { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";

// Gráficos
import ReportsBarChart from "examples/Charts/BarCharts/ReportsBarChart";
import ReportsLineChart from "examples/Charts/LineCharts/ReportsLineChart";
import DefaultDoughnutChart from "examples/Charts/DoughnutCharts/DefaultDoughnutChart";

// Servicios
import { getAllAltas, calculateMetrics } from "services/altaService";
import { getUsers } from "services/userService";

function EfectividadPromotores() {
  const [periodo, setPeriodo] = useState("mes");
  const [promotorSeleccionado, setPromotorSeleccionado] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Datos cargados de la API
  const [altas, setAltas] = useState([]);
  const [altasFiltradas, setAltasFiltradas] = useState([]);
  const [promotores, setPromotores] = useState([]);
  const [metrics, setMetrics] = useState(null);

  // Cargar datos al montar
  useEffect(() => {
    loadData();
  }, []);

  // Recalcular métricas cuando cambian los filtros
  useEffect(() => {
    if (altas.length > 0) {
      calcularMetricas();
    }
  }, [altas, periodo, promotorSeleccionado]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // Cargar usuarios (promotores)
      const usersData = await getUsers();
      console.log("👥 Promotores cargados:", usersData);
      setPromotores(usersData);

      // Cargar todas las altas (sin límite de páginas para análisis completo)
      const altasData = await getAllAltas({ page: 1 });
      console.log("📋 Altas cargadas:", altasData);
      setAltas(altasData.data || []);
    } catch (err) {
      setError(err.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const calcularMetricas = () => {
    let altasFiltradas = altas;

    // Filtrar por promotor si no es "todos"
    if (promotorSeleccionado !== "todos") {
      console.log("🔍 Filtro seleccionado:", promotorSeleccionado);
      console.log("📊 Total altas antes del filtro:", altas.length);

      altasFiltradas = altas.filter((alta) => {
        // Intentar con iduser_promo primero, luego con id (compatibilidad)
        const userId = alta.user_promo?.iduser_promo || alta.user_promo?.id;
        const userName = alta.user_promo?.name;

        console.log(`   Alta #${alta.id_alta_cliente_promo}: userId=${userId}, name=${userName}`);

        return userId?.toString() === promotorSeleccionado;
      });

      console.log("✅ Total altas después del filtro:", altasFiltradas.length);
    }

    // Filtrar por período
    const ahora = new Date();
    if (periodo === "semana") {
      const hace7Dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
      altasFiltradas = altasFiltradas.filter((alta) => new Date(alta.created_at) >= hace7Dias);
    } else if (periodo === "mes") {
      const hace30Dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
      altasFiltradas = altasFiltradas.filter((alta) => new Date(alta.created_at) >= hace30Dias);
    }

    // Guardar altas filtradas en el estado
    setAltasFiltradas(altasFiltradas);

    // Calcular métricas con la función del servicio
    const calculatedMetrics = calculateMetrics(altasFiltradas);
    setMetrics(calculatedMetrics);
  };

  // Preparar datos para gráfico de barras - Clientes por promotor
  const getClientesPorPromotorData = () => {
    if (!metrics || !metrics.porUsuario || !Array.isArray(metrics.porUsuario)) {
      return { labels: [], datasets: { label: "Clientes", data: [] } };
    }

    const data = metrics.porUsuario;
    const labels = data.map((item) => item.usuario);
    const valores = data.map((item) => item.total);

    return {
      labels,
      datasets: {
        label: "Clientes",
        data: valores,
      },
    };
  };

  // Preparar datos para gráfico de líneas - Evolución temporal
  const getEvolucionTemporalData = () => {
    if (
      !metrics ||
      !metrics.porDia ||
      !Array.isArray(altasFiltradas) ||
      altasFiltradas.length === 0
    ) {
      return { labels: [], datasets: [] };
    }

    // Agrupar datos por usuario y día
    const usuariosDatos = {};

    altasFiltradas.forEach((alta) => {
      const userId = alta.user_promo?.iduser_promo;
      const userName = alta.user_promo?.name || "Sin nombre";
      const fecha = new Date(alta.created_at).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
      });

      if (!usuariosDatos[userId]) {
        usuariosDatos[userId] = {
          name: userName,
          datos: {},
        };
      }

      usuariosDatos[userId].datos[fecha] = (usuariosDatos[userId].datos[fecha] || 0) + 1;
    });

    // Obtener últimos 7 días
    const dias = [];
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      dias.push(
        fecha.toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "2-digit",
        })
      );
    }

    // Crear datasets
    const colors = ["info", "success", "warning", "error", "primary"];
    const datasets = Object.entries(usuariosDatos)
      .slice(0, 5) // Máximo 5 promotores en el gráfico
      .map(([userId, { name, datos }], index) => ({
        label: name,
        color: colors[index % colors.length],
        data: dias.map((dia) => datos[dia] || 0),
      }));

    return {
      labels: dias,
      datasets,
    };
  };

  // Preparar datos para gráfico de dona - Tipos de promoción
  const getTiposPromoData = () => {
    if (!metrics || !metrics.porPromocion || !Array.isArray(metrics.porPromocion)) {
      return { labels: [], datasets: { label: "Promociones", data: [], backgroundColors: [] } };
    }

    const data = metrics.porPromocion;
    const labels = data.map((item) => item.promocion);
    const valores = data.map((item) => item.total);

    const colors = ["success", "info", "warning", "error", "primary"];
    const backgroundColors = colors.slice(0, labels.length);

    return {
      labels,
      datasets: {
        label: "Promociones",
        backgroundColors,
        data: valores,
      },
    };
  };

  const clientesPorPromotor = getClientesPorPromotorData();
  const evolucionTemporal = getEvolucionTemporalData();
  const tiposPromo = getTiposPromoData();

  // Calcular promedio de altas por día
  const promedioAltasPorDia =
    metrics && Array.isArray(metrics.porDia) && metrics.porDia.length > 0
      ? (metrics.porDia.reduce((sum, item) => sum + item.total, 0) / metrics.porDia.length).toFixed(
          1
        )
      : 0;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {loading ? (
          <MDBox display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress color="info" size={60} />
          </MDBox>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            {/* Filtros */}
            <MDBox mb={3}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Período</InputLabel>
                    <Select
                      value={periodo}
                      onChange={(e) => setPeriodo(e.target.value)}
                      label="Período"
                    >
                      <MenuItem value="semana">Esta Semana</MenuItem>
                      <MenuItem value="mes">Este Mes</MenuItem>
                      <MenuItem value="trimestre">Este Trimestre</MenuItem>
                      <MenuItem value="anio">Este Año</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Promotor</InputLabel>
                    <Select
                      value={promotorSeleccionado}
                      onChange={(e) => setPromotorSeleccionado(e.target.value)}
                      label="Promotor"
                      disabled={loading || promotores.length === 0}
                    >
                      <MenuItem value="todos">Todos los promotores</MenuItem>
                      {promotores.map((promotor) => (
                        <MenuItem key={promotor.id} value={promotor.id.toString()}>
                          {promotor.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </MDBox>

            {/* Cards de resumen */}
            <MDBox mb={3}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6} lg={3}>
                  <MDBox mb={1.5}>
                    <ComplexStatisticsCard
                      color="dark"
                      icon="groups"
                      title="Total Clientes"
                      count={metrics?.total || 0}
                      percentage={{
                        color: "success",
                        amount: "",
                        label: "en el período seleccionado",
                      }}
                    />
                  </MDBox>
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                  <MDBox mb={1.5}>
                    <ComplexStatisticsCard
                      icon="trending_up"
                      title="Promotores Activos"
                      count={metrics?.porUsuario?.length || 0}
                      percentage={{
                        color: "success",
                        amount: "",
                        label: "con altas registradas",
                      }}
                    />
                  </MDBox>
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                  <MDBox mb={1.5}>
                    <ComplexStatisticsCard
                      color="success"
                      icon="star"
                      title="Mejor Promotor"
                      count={
                        metrics?.porUsuario && metrics.porUsuario.length > 0
                          ? metrics.porUsuario[0].usuario
                          : "N/A"
                      }
                      percentage={{
                        color: "info",
                        amount:
                          metrics?.porUsuario && metrics.porUsuario.length > 0
                            ? metrics.porUsuario[0].total
                            : 0,
                        label: "clientes en el período",
                      }}
                    />
                  </MDBox>
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                  <MDBox mb={1.5}>
                    <ComplexStatisticsCard
                      color="primary"
                      icon="timeline"
                      title="Promedio Diario"
                      count={promedioAltasPorDia}
                      percentage={{
                        color: "success",
                        amount: "",
                        label: "clientes por día",
                      }}
                    />
                  </MDBox>
                </Grid>
              </Grid>
            </MDBox>

            {/* Gráficos principales */}
            <Grid container spacing={3}>
              {/* Gráfico de clientes por promotor */}
              <Grid item xs={12} md={6} lg={6}>
                <MDBox mb={3}>
                  <ReportsBarChart
                    color="info"
                    title="Clientes por Promotor"
                    description="Comparativa del período seleccionado"
                    date="actualizado ahora"
                    chart={clientesPorPromotor}
                  />
                </MDBox>
              </Grid>

              {/* Gráfico de evolución temporal */}
              <Grid item xs={12} md={6} lg={6}>
                <MDBox mb={3}>
                  <ReportsLineChart
                    color="success"
                    title="Evolución Semanal"
                    description="Clientes nuevos por día"
                    date="últimos 7 días"
                    chart={evolucionTemporal}
                  />
                </MDBox>
              </Grid>

              {/* Gráfico de tipos de promociones */}
              <Grid item xs={12} md={6} lg={6}>
                <MDBox mb={3}>
                  <Card>
                    <MDBox p={3}>
                      <MDTypography variant="h6" fontWeight="medium" mb={2}>
                        Tipos de Promociones
                      </MDTypography>
                      <MDBox mt={3}>
                        <DefaultDoughnutChart
                          icon={{ color: "success", component: "local_offer" }}
                          title="Distribución"
                          description="Promociones más usadas"
                          chart={tiposPromo}
                        />
                      </MDBox>
                    </MDBox>
                  </Card>
                </MDBox>
              </Grid>

              {/* Tabla detallada por promotor */}
              <Grid item xs={12} md={6} lg={6}>
                <Card>
                  <MDBox p={3}>
                    <MDTypography variant="h6" fontWeight="medium" mb={3}>
                      Detalle por Promotor
                    </MDTypography>
                    {metrics?.porUsuario && metrics.porUsuario.length > 0 ? (
                      <MDBox>
                        {metrics.porUsuario.map((item, index) => (
                          <MDBox
                            key={index}
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={2}
                            p={2}
                            sx={{
                              backgroundColor: index === 0 ? "success.light" : "grey.100",
                              borderRadius: 1,
                            }}
                          >
                            <MDBox>
                              <MDTypography variant="button" fontWeight="medium">
                                {item.usuario}
                              </MDTypography>
                              <MDTypography variant="caption" color="text" display="block">
                                Promedio: {item.promedio} / día
                              </MDTypography>
                            </MDBox>
                            <MDBox textAlign="right">
                              <MDTypography variant="h6" fontWeight="bold" color="dark">
                                {item.total}
                              </MDTypography>
                              <MDTypography variant="caption" color="text">
                                clientes
                              </MDTypography>
                            </MDBox>
                          </MDBox>
                        ))}
                      </MDBox>
                    ) : (
                      <MDBox textAlign="center" py={3}>
                        <MDTypography variant="caption" color="text">
                          No hay datos disponibles
                        </MDTypography>
                      </MDBox>
                    )}
                  </MDBox>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default EfectividadPromotores;
