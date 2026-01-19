/**
=========================================================
* Efectividad de Promotores - Análisis con gráficos
=========================================================
*/

import { useState, useEffect, useMemo } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Fade from "@mui/material/Fade";
import Grow from "@mui/material/Grow";
import Zoom from "@mui/material/Zoom";
import Icon from "@mui/material/Icon";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";

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
import { getAllAltas, calculateMetrics, getEstadisticasAltas } from "services/altaService";
import { getUsers } from "services/userService";

function EfectividadPromotores() {
  const [promotorSeleccionado, setPromotorSeleccionado] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Datos cargados de la API
  const [altas, setAltas] = useState([]);
  const [altasFiltradas, setAltasFiltradas] = useState([]);
  const [promotores, setPromotores] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);

  // Cargar datos al montar
  useEffect(() => {
    loadData();
  }, []);

  // Recalcular métricas cuando cambian los filtros o estadísticas
  useEffect(() => {
    if (estadisticas) {
      calcularMetricas();
    }
  }, [estadisticas, promotorSeleccionado]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // Cargar estadísticas del backend
      const statsData = await getEstadisticasAltas();
      setEstadisticas(statsData);
      console.log("📊 Estadísticas cargadas:", statsData);

      // Cargar usuarios (promotores)
      const usersData = await getUsers();
      console.log("👥 Promotores cargados:", usersData);
      setPromotores(usersData);

      // Cargar todas las altas (sin límite de páginas para análisis completo)
      const altasData = await getAllAltas({ page: 1 });
      console.log("📋 Altas cargadas:", altasData);
      // Si altasData es un array directamente, usarlo. Si tiene .data, usar altasData.data
      setAltas(Array.isArray(altasData) ? altasData : altasData.data || []);
    } catch (err) {
      setError(err.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const calcularMetricas = () => {
    if (!estadisticas || !estadisticas.altas_por_usuario) {
      return;
    }

    console.log("📊 Calculando métricas desde estadísticas del backend");
    console.log("👤 Promotor seleccionado:", promotorSeleccionado);

    let datosPromotores = estadisticas.altas_por_usuario;

    // Filtrar por promotor si no es "todos"
    if (promotorSeleccionado !== "todos") {
      console.log("🔍 Filtrando por promotor:", promotorSeleccionado);
      datosPromotores = datosPromotores.filter(
        (item) => item.user.iduser_promo.toString() === promotorSeleccionado
      );
      console.log("📋 Promotores después del filtro:", datosPromotores);
    }

    // Calcular métricas desde los datos del backend
    const totalAltas = datosPromotores.reduce((sum, item) => sum + item.total_altas, 0);
    const totalConsolidadas = datosPromotores.reduce(
      (sum, item) => sum + item.total_consolidadas,
      0
    );

    // Preparar datos por usuario
    const porUsuario = datosPromotores
      .map((item) => ({
        usuario: item.user.name,
        userId: item.user.iduser_promo,
        total: item.total_altas,
        consolidadas: item.total_consolidadas,
        promociones: item.promociones,
      }))
      .sort((a, b) => b.total - a.total);

    // Preparar datos por promoción (consolidado de todos los promotores filtrados)
    const promocionesMap = {};
    datosPromotores.forEach((promotor) => {
      console.log(
        "🔄 Procesando promotor:",
        promotor.user.name,
        "- Promociones:",
        promotor.promociones
      );
      if (promotor.promociones && Array.isArray(promotor.promociones)) {
        promotor.promociones.forEach((promo) => {
          console.log("  ➕ Sumando:", promo.name, "cantidad:", promo.total);
          if (!promocionesMap[promo.id_promotion]) {
            promocionesMap[promo.id_promotion] = {
              promocion: promo.name,
              total: 0,
            };
          }
          promocionesMap[promo.id_promotion].total += promo.total;
        });
      }
    });

    const porPromocion = Object.values(promocionesMap).sort((a, b) => b.total - a.total);

    console.log("🎯 Promociones calculadas:", porPromocion);

    const calculatedMetrics = {
      total: totalAltas,
      totalConsolidadas,
      porUsuario,
      porPromocion,
      porDia: [], // No tenemos datos por día en este endpoint
      promediosPorDia: totalAltas > 0 ? (totalAltas / 30).toFixed(1) : 0, // Estimado mensual
    };

    console.log("✅ Métricas calculadas:", calculatedMetrics);
    setMetrics(calculatedMetrics);
  };

  // Preparar datos para gráfico de barras - Clientes por promotor
  const getClientesPorPromotorData = () => {
    if (!metrics || !metrics.porUsuario || !Array.isArray(metrics.porUsuario)) {
      return { labels: [], datasets: { label: "Clientes", data: [] } };
    }

    const data = metrics.porUsuario.slice(0, 10); // Top 10 promotores
    const labels = data.map((item) => item.usuario);
    const valores = data.map((item) => item.total);

    return {
      labels,
      datasets: {
        label: "Total Altas",
        data: valores,
      },
    };
  };

  // Preparar datos para gráfico comparativo - Altas vs Consolidadas
  const getComparativoAltasData = () => {
    if (!metrics || !metrics.porUsuario || !Array.isArray(metrics.porUsuario)) {
      return { labels: [], datasets: [] };
    }

    const data = metrics.porUsuario.slice(0, 8); // Top 8 promotores
    const labels = data.map((item) => item.usuario);
    const altasData = data.map((item) => item.total);
    const consolidadasData = data.map((item) => item.consolidadas);

    return {
      labels,
      datasets: [
        {
          label: "Total Altas",
          color: "info",
          data: altasData,
        },
        {
          label: "Consolidadas",
          color: "success",
          data: consolidadasData,
        },
      ],
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

  const clientesPorPromotor = useMemo(() => getClientesPorPromotorData(), [metrics]);
  const comparativoAltas = useMemo(() => getComparativoAltasData(), [metrics]);
  const tiposPromo = useMemo(() => getTiposPromoData(), [metrics]);

  // Calcular promedio de altas por día (estimado mensual)
  const promedioAltasPorDia = metrics?.promediosPorDia || 0;

  // Calcular tasa de consolidación
  const tasaConsolidacion =
    metrics && metrics.total > 0
      ? ((metrics.totalConsolidadas / metrics.total) * 100).toFixed(1)
      : 0;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {loading ? (
          <Fade in>
            <MDBox
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              minHeight="60vh"
            >
              <CircularProgress color="info" size={60} thickness={4} />
              <MDTypography variant="button" color="text" mt={2}>
                Analizando datos...
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
        ) : (
          <>
            {/* Filtros */}
            <Fade in timeout={400}>
              <Card
                sx={{
                  mb: 3,
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
                  py={2}
                  px={2}
                  sx={{
                    background: "linear-gradient(195deg, #42A5F5, #1976D2)",
                    borderRadius: "lg",
                    boxShadow: "0 4px 20px 0 rgba(33, 150, 243, 0.3)",
                  }}
                >
                  <MDBox display="flex" alignItems="center" gap={1}>
                    <Icon sx={{ color: "white", fontSize: 28 }}>filter_list</Icon>
                    <MDBox>
                      <MDTypography variant="h6" color="white" fontWeight="bold">
                        Filtros de Análisis
                      </MDTypography>
                      <MDTypography variant="caption" color="white" opacity={0.8}>
                        Datos del mes actual
                      </MDTypography>
                    </MDBox>
                  </MDBox>
                </MDBox>
                <MDBox p={3}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Zoom in timeout={600}>
                        <FormControl
                          fullWidth
                          sx={{
                            transition: "all 0.3s",
                            "&:hover": { transform: "translateY(-2px)" },
                          }}
                        >
                          <Select
                            value={promotorSeleccionado}
                            onChange={(e) => setPromotorSeleccionado(e.target.value)}
                            disabled={loading || promotores.length === 0}
                            displayEmpty
                            sx={{
                              "& .MuiSelect-select": {
                                paddingTop: "16px",
                                paddingBottom: "16px",
                              },
                            }}
                          >
                            <MenuItem value="todos">
                              <MDBox display="flex" alignItems="center" gap={1}>
                                <Icon fontSize="small">groups</Icon>
                                Todos los promotores
                              </MDBox>
                            </MenuItem>
                            {promotores.map((promotor) => (
                              <MenuItem key={promotor.id} value={promotor.id.toString()}>
                                <MDBox display="flex" alignItems="center" gap={1}>
                                  <Avatar sx={{ width: 20, height: 20, fontSize: 12 }}>
                                    {promotor.name.charAt(0)}
                                  </Avatar>
                                  {promotor.name}
                                </MDBox>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Zoom>
                    </Grid>
                  </Grid>
                </MDBox>
              </Card>
            </Fade>

            {/* Cards de resumen */}
            <MDBox mb={3}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6} lg={3}>
                  <Grow in timeout={600}>
                    <MDBox
                      mb={1.5}
                      sx={{
                        transition: "all 0.3s",
                        "&:hover": { transform: "translateY(-8px)" },
                      }}
                    >
                      <ComplexStatisticsCard
                        color="dark"
                        icon="groups"
                        title="Total Clientes"
                        count={metrics?.total || 0}
                        percentage={{
                          color: "success",
                          amount: "",
                          label: "del mes actual",
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
                        transition: "all 0.3s",
                        "&:hover": { transform: "translateY(-8px)" },
                      }}
                    >
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
                  </Grow>
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                  <Grow in timeout={1000}>
                    <MDBox
                      mb={1.5}
                      sx={{
                        transition: "all 0.3s",
                        "&:hover": { transform: "translateY(-8px)" },
                      }}
                    >
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
                          label: "altas del mes",
                        }}
                      />
                    </MDBox>
                  </Grow>
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                  <Grow in timeout={1200}>
                    <MDBox
                      mb={1.5}
                      sx={{
                        transition: "all 0.3s",
                        "&:hover": { transform: "translateY(-8px)" },
                      }}
                    >
                      <ComplexStatisticsCard
                        color="warning"
                        icon="check_circle"
                        title="Tasa Consolidación"
                        count={`${tasaConsolidacion}%`}
                        percentage={{
                          color: tasaConsolidacion >= 70 ? "success" : "warning",
                          amount: `${metrics?.totalConsolidadas || 0}/${metrics?.total || 0}`,
                          label: "consolidadas del total",
                        }}
                      />
                    </MDBox>
                  </Grow>
                </Grid>
              </Grid>
            </MDBox>

            {/* Gráficos principales */}
            <Grid container spacing={3}>
              {/* Gráfico de clientes por promotor */}
              <Grid item xs={12} md={6} lg={6}>
                <Fade in timeout={1000}>
                  <MDBox
                    mb={3}
                    sx={{
                      transition: "all 0.3s",
                      "&:hover": {
                        transform: "translateY(-5px) scale(1.01)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                      },
                    }}
                  >
                    <ReportsBarChart
                      color="info"
                      title="Clientes por Promotor"
                      description="Ranking del mes actual"
                      date="actualizado ahora"
                      chart={clientesPorPromotor}
                    />
                  </MDBox>
                </Fade>
              </Grid>

              {/* Gráfico comparativo Altas vs Consolidadas */}
              <Grid item xs={12} md={6} lg={6}>
                <Fade in timeout={1200}>
                  <MDBox
                    mb={3}
                    sx={{
                      transition: "all 0.3s",
                      "&:hover": {
                        transform: "translateY(-5px) scale(1.01)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                      },
                    }}
                  >
                    <ReportsBarChart
                      color="success"
                      title="Altas vs Consolidadas"
                      description="Tasa de conversión del mes"
                      date="actualizado ahora"
                      chart={comparativoAltas}
                    />
                  </MDBox>
                </Fade>
              </Grid>

              {/* Gráfico de tipos de promociones */}
              <Grid item xs={12} md={6} lg={6}>
                <Zoom in timeout={1000}>
                  <MDBox
                    mb={3}
                    sx={{
                      transition: "all 0.3s",
                      "&:hover": {
                        transform: "scale(1.02)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                      },
                    }}
                  >
                    <Card>
                      <MDBox p={3}>
                        <MDBox display="flex" alignItems="center" gap={1} mb={2}>
                          <Icon sx={{ color: "success.main", fontSize: 24 }}>local_offer</Icon>
                          <MDTypography variant="h6" fontWeight="medium">
                            Tipos de Promociones
                          </MDTypography>
                        </MDBox>
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
                </Zoom>
              </Grid>

              {/* Tabla detallada por promotor */}
              <Grid item xs={12} md={6} lg={6}>
                <Zoom in timeout={1200}>
                  <Card
                    sx={{
                      transition: "all 0.3s",
                      "&:hover": {
                        transform: "scale(1.02)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                      },
                    }}
                  >
                    <MDBox p={3}>
                      <MDBox display="flex" alignItems="center" gap={1} mb={3}>
                        <Icon sx={{ color: "info.main", fontSize: 24 }}>leaderboard</Icon>
                        <MDTypography variant="h6" fontWeight="medium">
                          Detalle por Promotor
                        </MDTypography>
                      </MDBox>
                      {metrics?.porUsuario && metrics.porUsuario.length > 0 ? (
                        <MDBox>
                          {metrics.porUsuario.map((item, index) => {
                            const tasaConv =
                              item.total > 0
                                ? ((item.consolidadas / item.total) * 100).toFixed(1)
                                : 0;
                            return (
                              <Fade in timeout={1400 + index * 100} key={index}>
                                <MDBox
                                  display="flex"
                                  justifyContent="space-between"
                                  alignItems="center"
                                  mb={2}
                                  p={2}
                                  sx={{
                                    backgroundColor:
                                      index === 0 ? "rgba(76, 175, 80, 0.1)" : "grey.100",
                                    borderRadius: 2,
                                    border: index === 0 ? "2px solid" : "none",
                                    borderColor: index === 0 ? "success.main" : "transparent",
                                    transition: "all 0.3s",
                                    "&:hover": {
                                      transform: "translateX(8px)",
                                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                    },
                                  }}
                                >
                                  <MDBox display="flex" alignItems="center" gap={1.5}>
                                    <Tooltip title={index === 0 ? "¡Líder!" : ""} arrow>
                                      <Avatar
                                        sx={{
                                          width: 40,
                                          height: 40,
                                          bgcolor: index === 0 ? "success.main" : "info.main",
                                          fontWeight: "bold",
                                          fontSize: 16,
                                        }}
                                      >
                                        {item.usuario.charAt(0).toUpperCase()}
                                      </Avatar>
                                    </Tooltip>
                                    <MDBox>
                                      <MDBox display="flex" alignItems="center" gap={1}>
                                        <MDTypography variant="button" fontWeight="medium">
                                          {item.usuario}
                                        </MDTypography>
                                        {index === 0 && (
                                          <Icon sx={{ color: "warning.main", fontSize: 18 }}>
                                            star
                                          </Icon>
                                        )}
                                      </MDBox>
                                      <MDBox display="flex" alignItems="center" gap={1}>
                                        <Chip
                                          size="small"
                                          label={`${tasaConv}%`}
                                          color={tasaConv >= 70 ? "success" : "warning"}
                                          sx={{ fontSize: "0.7rem", height: 20 }}
                                        />
                                        <MDTypography variant="caption" color="text">
                                          {item.consolidadas} consolidadas
                                        </MDTypography>
                                      </MDBox>
                                    </MDBox>
                                  </MDBox>
                                  <MDBox textAlign="right">
                                    <Chip
                                      label={item.total}
                                      color={index === 0 ? "success" : "info"}
                                      sx={{ fontWeight: "bold", fontSize: "0.9rem", height: 28 }}
                                    />
                                    <MDTypography
                                      variant="caption"
                                      color="text"
                                      display="block"
                                      mt={0.5}
                                    >
                                      altas totales
                                    </MDTypography>
                                  </MDBox>
                                </MDBox>
                              </Fade>
                            );
                          })}
                        </MDBox>
                      ) : (
                        <Fade in>
                          <MDBox textAlign="center" py={3}>
                            <Icon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }}>inbox</Icon>
                            <MDTypography variant="caption" color="text" display="block">
                              No hay datos disponibles
                            </MDTypography>
                          </MDBox>
                        </Fade>
                      )}
                    </MDBox>
                  </Card>
                </Zoom>
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
