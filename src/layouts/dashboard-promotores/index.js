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
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import * as XLSX from "xlsx";

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
import { getAllAltas, getEstadisticasAltas } from "services/altaService";
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
  const [promocionInput, setPromocionInput] = useState(""); // Valor temporal del input
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

  // Estadísticas globales desde el backend
  const [estadisticas, setEstadisticas] = useState(null);
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(true);
  const [altasHoyCount, setAltasHoyCount] = useState(0);

  // Estados para el modal de exportación
  const [openExportModal, setOpenExportModal] = useState(false);
  const [exportFechaDesde, setExportFechaDesde] = useState("");
  const [exportFechaHasta, setExportFechaHasta] = useState("");
  const [exportando, setExportando] = useState(false);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    }
  };

  const loadEstadisticas = useCallback(async () => {
    try {
      setLoadingEstadisticas(true);
      const data = await getEstadisticasAltas();
      setEstadisticas(data);
      console.log("📊 Estadísticas cargadas:", data);
    } catch (err) {
      console.error("Error al cargar estadísticas:", err);
    } finally {
      setLoadingEstadisticas(false);
    }
  }, []);

  const loadAltasHoy = useCallback(async () => {
    try {
      const hoy = new Date().toISOString().split("T")[0];

      // Cargar todas las páginas de altas de hoy
      let todasLasAltas = [];
      let currentPageNum = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        const response = await getAllAltas({ fecha: hoy, page: currentPageNum });
        const altasData = Array.isArray(response) ? response : response.data || [];

        todasLasAltas = [...todasLasAltas, ...altasData];

        // Verificar si hay más páginas
        if (response.last_page && currentPageNum < response.last_page) {
          currentPageNum++;
        } else {
          hasMorePages = false;
        }
      }

      setAltasHoyCount(todasLasAltas.length);
      console.log(`📅 Altas de hoy (${hoy}): ${todasLasAltas.length} (${currentPageNum} páginas)`);
    } catch (err) {
      console.error("Error al cargar altas de hoy:", err);
    }
  }, []);

  const loadAltas = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const filters = {
        page: currentPage,
      };

      if (selectedUser) filters.user_id = selectedUser;

      // Filtro por fecha de creación (created_at)
      if (selectedDate) {
        filters.fecha = selectedDate;
      }

      // Filtro por fecha de entrega (fecha_pedido)
      if (selectedFechaEntrega) {
        const today = new Date().toISOString().split("T")[0];
        const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

        if (selectedFechaEntrega === "hoy") {
          filters.fecha_pedido = today;
        } else if (selectedFechaEntrega === "proximos_7_dias") {
          filters.fecha_pedido_desde = today;
          filters.fecha_pedido_hasta = in7Days;
        }
      }

      if (selectedPromocion) filters.tipo_promocion_id = selectedPromocion;

      // No enviamos nro_rto a la API porque causa CORS, filtraremos en el frontend
      console.log("📤 Filtros enviados a la API:", filters);

      const response = await getAllAltas(filters);

      // Si la respuesta es un array directamente, usarlo. Si es un objeto con data, usar data
      let altasData = Array.isArray(response) ? response : response.data || [];

      // Filtrar por reparto en el frontend
      if (selectedReparto && selectedReparto.trim()) {
        const repartoTrim = selectedReparto.trim();
        console.log("🔍 Filtrando por reparto en frontend:", repartoTrim);
        altasData = altasData.filter((alta) => alta.nro_rto === repartoTrim);
        console.log(`✅ Resultados: ${altasData.length} altas con reparto ${repartoTrim}`);
      }

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

  // Cargar usuarios y estadísticas al montar
  useEffect(() => {
    loadUsers();
    loadEstadisticas();
    loadAltasHoy();
  }, [loadEstadisticas, loadAltasHoy]);

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
    setPromocionInput(event.target.value);
  };

  const handlePromocionKeyPress = (event) => {
    if (event.key === "Enter") {
      const trimmedValue = promocionInput.trim();
      setSelectedPromocion(trimmedValue);
      setCurrentPage(1);
    }
  };

  const handlePromocionBlur = () => {
    const trimmedValue = promocionInput.trim();
    if (trimmedValue !== selectedPromocion) {
      setSelectedPromocion(trimmedValue);
      setCurrentPage(1);
    }
  };

  const handleRepartoInputChange = (event) => {
    setRepartoInput(event.target.value);
  };

  const handleRepartoKeyPress = (event) => {
    if (event.key === "Enter") {
      const trimmedValue = repartoInput.trim();
      setSelectedReparto(trimmedValue);
      setCurrentPage(1);
    }
  };

  const handleRepartoBlur = () => {
    const trimmedValue = repartoInput.trim();
    if (trimmedValue !== selectedReparto) {
      setSelectedReparto(trimmedValue);
      setCurrentPage(1);
    }
  };

  const handleClearFilters = () => {
    setSelectedUser("");
    setSelectedDate("");
    setSelectedFechaEntrega("");
    setSelectedPromocion("");
    setPromocionInput("");
    setSelectedReparto("");
    setRepartoInput("");
    setCurrentPage(1);
  };

  const handleOpenExportModal = () => {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split("T")[0];
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    setExportFechaDesde(primerDiaMes);
    setExportFechaHasta(ultimoDiaMes);
    setOpenExportModal(true);
  };

  const handleCloseExportModal = () => {
    setOpenExportModal(false);
  };

  const handleConfirmExport = async () => {
    try {
      setExportando(true);

      // Validar que fecha desde sea menor o igual a fecha hasta
      if (exportFechaDesde > exportFechaHasta) {
        alert("La fecha DESDE debe ser anterior o igual a la fecha HASTA");
        setExportando(false);
        return;
      }

      console.log(`📊 Exportando desde ${exportFechaDesde} hasta ${exportFechaHasta}`);

      // Construir filtros para obtener todos los datos
      const filters = {};
      if (selectedUser) filters.user_id = selectedUser;
      if (selectedPromocion) filters.tipo_promocion_id = selectedPromocion;

      console.log("📊 Cargando todos los datos para exportar...", filters);

      // Cargar todas las páginas
      let todasLasAltas = [];
      let pageNum = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        const response = await getAllAltas({ ...filters, page: pageNum });
        const altasData = Array.isArray(response) ? response : response.data || [];

        todasLasAltas = [...todasLasAltas, ...altasData];

        // Verificar si hay más páginas
        if (response.last_page && pageNum < response.last_page) {
          pageNum++;
        } else {
          hasMorePages = false;
        }
      }

      // Filtrar por rango de fechas en el frontend
      todasLasAltas = todasLasAltas.filter((alta) => {
        if (!alta.created_at) return false;
        const fechaAlta = new Date(alta.created_at).toISOString().split("T")[0];
        return fechaAlta >= exportFechaDesde && fechaAlta <= exportFechaHasta;
      });

      // Filtrar por reparto en el frontend si está seleccionado
      if (selectedReparto && selectedReparto.trim()) {
        const repartoTrim = selectedReparto.trim();
        todasLasAltas = todasLasAltas.filter((alta) => alta.nro_rto === repartoTrim);
      }

      // Filtrar por fecha de entrega si está seleccionado
      if (selectedFechaEntrega) {
        const today = new Date().toISOString().split("T")[0];
        const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

        if (selectedFechaEntrega === "hoy") {
          todasLasAltas = todasLasAltas.filter((alta) => {
            if (!alta.fecha_pedido) return false;
            const fechaPedido = new Date(alta.fecha_pedido).toISOString().split("T")[0];
            return fechaPedido === today;
          });
        } else if (selectedFechaEntrega === "proximos_7_dias") {
          todasLasAltas = todasLasAltas.filter((alta) => {
            if (!alta.fecha_pedido) return false;
            const fechaPedido = new Date(alta.fecha_pedido).toISOString().split("T")[0];
            return fechaPedido >= today && fechaPedido <= in7Days;
          });
        }
      }

      if (todasLasAltas.length === 0) {
        alert("No hay datos para exportar con los filtros seleccionados");
        return;
      }

      console.log(`✅ Se exportarán ${todasLasAltas.length} registros`);

      // Preparar los datos para Excel
      const excelData = todasLasAltas.map((alta) => {
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

        let fechaPedido = "-";
        if (alta.fecha_pedido) {
          const [year, month, day] = alta.fecha_pedido.split("-");
          const fechaPedidoDate = new Date(year, month - 1, day);
          fechaPedido = fechaPedidoDate.toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
        }

        return {
          Fecha: fechaStr,
          Hora: horaStr,
          "Fecha Pedido": fechaPedido,
          Dirección: alta.direccion,
          Localidad: alta.localidad,
          "Nombre Completo": alta.nombre_completo,
          Teléfono: alta.telefono,
          "N° Cuenta": alta.id_nroCta_aguas || "-",
          Promotor: alta.user_promo?.name || "-",
          Usuario: alta.user_promo?.username || "-",
          Promoción: alta.promotion?.name || "Sin promoción",
          Reparto: alta.nro_rto,
          Entrega: alta.visitado === 1 ? "Entregado" : "Pendiente",
        };
      });

      // Crear libro de trabajo y hoja
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Altas");

      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 12 }, // Fecha
        { wch: 8 }, // Hora
        { wch: 12 }, // Fecha Pedido
        { wch: 30 }, // Dirección
        { wch: 20 }, // Localidad
        { wch: 25 }, // Nombre Completo
        { wch: 15 }, // Teléfono
        { wch: 12 }, // N° Cuenta
        { wch: 20 }, // Promotor
        { wch: 15 }, // Usuario
        { wch: 20 }, // Promoción
        { wch: 8 }, // Reparto
        { wch: 12 }, // Entrega
      ];
      ws["!cols"] = colWidths;

      // Generar nombre del archivo
      const promotorNombre = selectedUser
        ? users.find((u) => u.id === selectedUser)?.name || "Filtrado"
        : "Todos";
      const fechaActual = new Date().toISOString().split("T")[0];
      const fileName = `Altas_${promotorNombre}_${fechaActual}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(wb, fileName);

      // Cerrar modal y mostrar éxito
      setOpenExportModal(false);
      alert(`✅ Se exportaron ${todasLasAltas.length} registros correctamente`);
    } catch (error) {
      console.error("❌ Error al exportar:", error);
      alert("Error al exportar los datos. Intenta de nuevo.");
    } finally {
      setExportando(false);
    }
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

  // Calcular métricas desde las estadísticas del backend
  const totalAltas = estadisticas?.totales?.altas?.total_altas || 0;

  // Usar el contador de altas de hoy
  const altasHoy = altasHoyCount;

  const usuariosActivos = estadisticas?.altas_por_usuario?.length || 0;

  // Métricas de consolidación desde el backend
  const ventasConsolidadas = estadisticas?.totales?.altas?.total_consolidadas || 0;
  const tasaConsolidacion =
    totalAltas > 0 ? ((ventasConsolidadas / totalAltas) * 100).toFixed(1) : 0;

  // Preparar columnas de la tabla
  const columns = [
    { Header: "Fecha/Hora", accessor: "fecha", width: "12%" },
    { Header: "Fecha Pedido", accessor: "fechaPedido", width: "12%" },
    { Header: "Dirección", accessor: "direccion", width: "18%" },
    { Header: "Teléfono", accessor: "telefono", width: "10%" },
    { Header: "N Cuenta", accessor: "nCuenta", width: "9%" },
    { Header: "Promotor", accessor: "promotor", width: "15%" },
    { Header: "Promoción", accessor: "promocion", width: "12%" },
    { Header: "Reparto", accessor: "reparto", width: "6%" },
    { Header: "Entrega", accessor: "entrega", width: "6%" },
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

    // Fecha de pedido (parsear como fecha local para evitar problemas de timezone)
    let fechaPedido = "-";
    if (alta.fecha_pedido) {
      const [year, month, day] = alta.fecha_pedido.split("-");
      const fechaPedidoDate = new Date(year, month - 1, day);
      fechaPedido = fechaPedidoDate.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }

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
      fechaPedido: (
        <MDBox display="flex" alignItems="center" gap={1}>
          <Icon fontSize="small" sx={{ color: "success.main" }}>
            {alta.fecha_pedido && new Date(alta.fecha_pedido) < new Date(alta.created_at)
              ? "history"
              : "local_shipping"}
          </Icon>
          <MDTypography variant="caption" fontWeight="medium">
            {fechaPedido}
          </MDTypography>
        </MDBox>
      ),
      direccion: (
        <MDBox display="flex" alignItems="center" gap={0.5} maxWidth="200px" width="200px">
          <Icon fontSize="small" sx={{ color: "text.secondary", fontSize: 16, flexShrink: 0 }}>
            location_on
          </Icon>
          <MDBox sx={{ minWidth: 0, flex: 1 }}>
            <MDTypography
              variant="caption"
              color="text"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "block",
              }}
            >
              {alta.direccion}, {alta.localidad}
            </MDTypography>
            <MDTypography
              variant="caption"
              sx={{
                fontSize: "0.65rem",
                color: "text.secondary",
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {alta.nombre_completo}
            </MDTypography>
          </MDBox>
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
      nCuenta: (
        <MDTypography variant="caption" fontWeight="medium">
          {alta.id_nroCta_aguas || "-"}
        </MDTypography>
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
      entrega: (
        <Tooltip title={alta.visitado === 1 ? "Entregado" : "Pendiente de entrega"}>
          <Chip
            icon={<Icon fontSize="small">{alta.visitado === 1 ? "check_circle" : "pending"}</Icon>}
            label={alta.visitado === 1 ? "OK" : "P"}
            size="small"
            color={alta.visitado === 1 ? "success" : "error"}
            sx={{
              fontWeight: "bold",
              fontSize: "0.65rem",
              minWidth: "40px",
            }}
          />
        </Tooltip>
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
                {loadingEstadisticas ? (
                  <MDBox
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    height={130}
                    borderRadius="xl"
                    sx={{
                      background: "linear-gradient(195deg, #42424a, #191919)",
                      boxShadow: "0 4px 20px 0 rgba(0,0,0,0.14)",
                    }}
                  >
                    <CircularProgress size={30} sx={{ color: "white" }} />
                  </MDBox>
                ) : (
                  <ComplexStatisticsCard
                    color="dark"
                    icon="people"
                    title="Total Altas"
                    count={totalAltas}
                    percentage={{
                      color: "success",
                      amount: "",
                      label: "Del mes actual",
                    }}
                  />
                )}
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
                {loadingEstadisticas ? (
                  <MDBox
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    height={130}
                    borderRadius="xl"
                    sx={{
                      background: "linear-gradient(195deg, #66BB6A, #43A047)",
                      boxShadow: "0 4px 20px 0 rgba(0,0,0,0.14)",
                    }}
                  >
                    <CircularProgress size={30} sx={{ color: "white" }} />
                  </MDBox>
                ) : (
                  <ComplexStatisticsCard
                    icon="today"
                    title="Altas Hoy"
                    count={altasHoy}
                    percentage={{
                      color: "success",
                      amount: "",
                      label: "Última alta registrada",
                    }}
                  />
                )}
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
                {loadingEstadisticas ? (
                  <MDBox
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    height={130}
                    borderRadius="xl"
                    sx={{
                      background: "linear-gradient(195deg, #66BB6A, #43A047)",
                      boxShadow: "0 4px 20px 0 rgba(0,0,0,0.14)",
                    }}
                  >
                    <CircularProgress size={30} sx={{ color: "white" }} />
                  </MDBox>
                ) : (
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
                )}
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
                {loadingEstadisticas ? (
                  <MDBox
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    height={130}
                    borderRadius="xl"
                    sx={{
                      background: "linear-gradient(195deg, #FFA726, #FB8C00)",
                      boxShadow: "0 4px 20px 0 rgba(0,0,0,0.14)",
                    }}
                  >
                    <CircularProgress size={30} sx={{ color: "white" }} />
                  </MDBox>
                ) : (
                  <ComplexStatisticsCard
                    color="warning"
                    icon="monetization_on"
                    title="Ventas Consolidadas"
                    count={`${ventasConsolidadas} (${tasaConsolidacion}%)`}
                    percentage={{
                      color: tasaConsolidacion >= 50 ? "success" : "error",
                      amount: "",
                      label: `Tasa de conversión del mes`,
                    }}
                  />
                )}
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
                    <TextField
                      label="Fecha de Creación"
                      type="date"
                      value={selectedDate}
                      onChange={handleDateChange}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      sx={{
                        minWidth: 200,
                        transition: "all 0.3s",
                        "&:hover": { transform: "translateY(-2px)" },
                      }}
                      InputProps={{
                        sx: { height: "45px" },
                      }}
                    />
                  </Zoom>

                  <Zoom in timeout={1000}>
                    <FormControl
                      sx={{
                        minWidth: 200,
                        transition: "all 0.3s",
                        "&:hover": { transform: "translateY(-2px)" },
                      }}
                    >
                      <InputLabel id="fecha-entrega-filter-label">Fecha de Pedido</InputLabel>
                      <Select
                        labelId="fecha-entrega-filter-label"
                        value={selectedFechaEntrega}
                        label="Fecha de Pedido"
                        onChange={handleFechaEntregaChange}
                        sx={{ height: "45px" }}
                      >
                        <MenuItem value="">
                          <em>Todas las fechas</em>
                        </MenuItem>
                        <MenuItem value="hoy">Hoy</MenuItem>
                        <MenuItem value="proximos_7_dias">Próximos 7 días</MenuItem>
                      </Select>
                    </FormControl>
                  </Zoom>

                  <Zoom in timeout={1200}>
                    <TextField
                      label="Promoción (ID)"
                      value={promocionInput}
                      onChange={handlePromocionChange}
                      onKeyPress={handlePromocionKeyPress}
                      onBlur={handlePromocionBlur}
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

                  <Zoom in timeout={1600}>
                    <Tooltip title="Exportar datos filtrados a Excel" arrow>
                      <MDButton
                        variant="gradient"
                        color="success"
                        onClick={handleOpenExportModal}
                        disabled={loading}
                        sx={{
                          transition: "all 0.3s",
                          "&:hover": {
                            transform: "scale(1.05)",
                          },
                        }}
                      >
                        <Icon>file_download</Icon>&nbsp; Exportar Excel
                      </MDButton>
                    </Tooltip>
                  </Zoom>

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
                        entriesPerPage={{ defaultValue: 50, entries: [10, 25, 50, 100] }}
                        showTotalEntries={false}
                        pagination={false}
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

      {/* Modal de Exportación */}
      <Dialog
        open={openExportModal}
        onClose={handleCloseExportModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(195deg, #66BB6A, #43A047)",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 1,
            py: 2.5,
          }}
        >
          <Icon sx={{ fontSize: 28 }}>file_download</Icon>
          <MDBox>
            <MDTypography variant="h5" fontWeight="bold" color="white">
              Exportar a Excel
            </MDTypography>
            <MDTypography variant="caption" color="white" opacity={0.9}>
              Selecciona el rango de fechas para exportar
            </MDTypography>
          </MDBox>
        </DialogTitle>

        <DialogContent sx={{ mt: 3, px: 3 }}>
          <MDBox display="flex" flexDirection="column" gap={3}>
            <MDBox>
              <MDTypography variant="caption" fontWeight="medium" color="text" mb={0.5}>
                Fecha Desde
              </MDTypography>
              <TextField
                type="date"
                value={exportFechaDesde}
                onChange={(e) => setExportFechaDesde(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: <Icon sx={{ mr: 1, color: "text.secondary" }}>event</Icon>,
                }}
              />
            </MDBox>

            <MDBox>
              <MDTypography variant="caption" fontWeight="medium" color="text" mb={0.5}>
                Fecha Hasta
              </MDTypography>
              <TextField
                type="date"
                value={exportFechaHasta}
                onChange={(e) => setExportFechaHasta(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: <Icon sx={{ mr: 1, color: "text.secondary" }}>event</Icon>,
                }}
              />
            </MDBox>

            <Alert severity="info" icon={<Icon>info</Icon>}>
              <MDTypography variant="caption" color="dark">
                Se exportarán todos los registros que coincidan con los filtros seleccionados y el
                rango de fechas especificado.
              </MDTypography>
            </Alert>
          </MDBox>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <MDButton
            variant="outlined"
            color="secondary"
            onClick={handleCloseExportModal}
            disabled={exportando}
          >
            Cancelar
          </MDButton>
          <MDButton
            variant="gradient"
            color="success"
            onClick={handleConfirmExport}
            disabled={exportando || !exportFechaDesde || !exportFechaHasta}
            sx={{
              minWidth: 120,
            }}
          >
            {exportando ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Exportando...
              </>
            ) : (
              <>
                <Icon>download</Icon>&nbsp;Exportar
              </>
            )}
          </MDButton>
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
}

export default DashboardPromotores;
