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
      // Si altasData es un array directamente, usarlo. Si tiene .data, usar altasData.data
      setAltas(Array.isArray(altasData) ? altasData : altasData.data || []);
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
                    <MDTypography variant="h6" color="white" fontWeight="bold">
                      Filtros de Análisis
                    </MDTypography>
                  </MDBox>
                </MDBox>
                <MDBox p={3}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Zoom in timeout={600}>
                        <FormControl
                          fullWidth
                          sx={{
                            transition: "all 0.3s",
                            "&:hover": { transform: "translateY(-2px)" },
                          }}
                        >
                          <Select
                            value={periodo}
                            onChange={(e) => setPeriodo(e.target.value)}
                            displayEmpty
                            sx={{
                              "& .MuiSelect-select": {
                                paddingTop: "16px",
                                paddingBottom: "16px",
                              },
                            }}
                          >
                            <MenuItem value="semana">
                              <MDBox display="flex" alignItems="center" gap={1}>
                                <Icon fontSize="small">date_range</Icon>
                                Esta Semana
                              </MDBox>
                            </MenuItem>
                            <MenuItem value="mes">
                              <MDBox display="flex" alignItems="center" gap={1}>
                                <Icon fontSize="small">calendar_month</Icon>
                                Este Mes
                              </MDBox>
                            </MenuItem>
                            <MenuItem value="trimestre">
                              <MDBox display="flex" alignItems="center" gap={1}>
                                <Icon fontSize="small">event_note</Icon>
                                Este Trimestre
                              </MDBox>
                            </MenuItem>
                            <MenuItem value="anio">
                              <MDBox display="flex" alignItems="center" gap={1}>
                                <Icon fontSize="small">today</Icon>
                                Este Año
                              </MDBox>
                            </MenuItem>
                          </Select>
                        </FormControl>
                      </Zoom>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Zoom in timeout={800}>
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
                          label: "en el período seleccionado",
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
                          label: "clientes en el período",
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
                      description="Comparativa del período seleccionado"
                      date="actualizado ahora"
                      chart={clientesPorPromotor}
                    />
                  </MDBox>
                </Fade>
              </Grid>

              {/* Gráfico de evolución temporal */}
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
                    <ReportsLineChart
                      color="success"
                      title="Evolución Semanal"
                      description="Clientes nuevos por día"
                      date="últimos 7 días"
                      chart={evolucionTemporal}
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
                          {metrics.porUsuario.map((item, index) => (
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
                                    <MDBox display="flex" alignItems="center" gap={0.5}>
                                      <Icon sx={{ fontSize: 12, color: "text.secondary" }}>
                                        trending_up
                                      </Icon>
                                      <MDTypography variant="caption" color="text">
                                        Promedio: {item.promedio} / día
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
                                    clientes
                                  </MDTypography>
                                </MDBox>
                              </MDBox>
                            </Fade>
                          ))}
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
