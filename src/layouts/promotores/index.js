/**
=========================================================
* Gestión de Promotores - Vista CRUD
=========================================================
*/

import { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Switch from "@mui/material/Switch";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Fade from "@mui/material/Fade";
import Zoom from "@mui/material/Zoom";
import Tooltip from "@mui/material/Tooltip";
import Avatar from "@mui/material/Avatar";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";

// Services
import { getUsers, createUser, updateUser, toggleUserStatus, getRoles } from "services/userService";

function Promotores() {
  // Estados principales
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [error, setError] = useState("");

  // Estados del modal
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' o 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role_id: "",
    active: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Estados de notificaciones
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Cargar usuarios y roles al montar
  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message || "Error al cargar usuarios");
      showSnackbar(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      const data = await getRoles();
      setRoles(data);
    } catch (err) {
      console.error("Error al cargar roles:", err);
      showSnackbar("Error al cargar roles disponibles", "warning");
    } finally {
      setLoadingRoles(false);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Abrir modal para crear
  const handleOpenCreateModal = () => {
    setModalMode("create");
    setSelectedUser(null);
    setFormData({
      name: "",
      username: "",
      email: "",
      password: "",
      role_id: roles.length > 0 ? roles[0].id : "",
      active: true,
    });
    setFormErrors({});
    setOpenModal(true);
  };

  // Abrir modal para editar
  const handleOpenEditModal = (user) => {
    setModalMode("edit");
    setSelectedUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      email: user.email || "",
      password: "", // No mostrar password existente
      role_id: user.role_id || "",
      active: user.active,
    });
    setFormErrors({});
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedUser(null);
    setFormData({
      name: "",
      username: "",
      email: "",
      password: "",
      role_id: "",
      active: true,
    });
    setFormErrors({});
  };

  const handleFormChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Limpiar error del campo
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: "" });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "El nombre es obligatorio";
    }

    if (!formData.username.trim()) {
      errors.username = "El usuario es obligatorio";
    }

    if (modalMode === "create" && !formData.password) {
      errors.password = "La contraseña es obligatoria";
    }

    if (modalMode === "create" && formData.password && formData.password.length < 6) {
      errors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    if (!formData.role_id) {
      errors.role_id = "El rol es obligatorio";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Email inválido";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Preparar datos (no enviar password vacío en edición)
      const dataToSend = { ...formData };
      if (modalMode === "edit" && !dataToSend.password) {
        delete dataToSend.password;
      }
      if (!dataToSend.email) {
        delete dataToSend.email;
      }

      if (modalMode === "create") {
        const response = await createUser(dataToSend);
        showSnackbar(response.message || "Usuario creado exitosamente");
      } else {
        const response = await updateUser(selectedUser.id, dataToSend);
        showSnackbar(response.message || "Usuario actualizado exitosamente");
      }

      handleCloseModal();
      loadUsers();
    } catch (err) {
      showSnackbar(err.message || "Error al guardar usuario", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const response = await toggleUserStatus(user.id);
      showSnackbar(response.message || "Estado actualizado");
      loadUsers();
    } catch (err) {
      showSnackbar(err.message || "Error al cambiar estado", "error");
    }
  };

  // Preparar columnas de la tabla
  const columns = [
    { Header: "Nombre", accessor: "name", width: "25%" },
    { Header: "Usuario", accessor: "username", width: "20%" },
    { Header: "Email", accessor: "email", width: "20%" },
    { Header: "Rol", accessor: "role", width: "15%" },
    { Header: "Estado", accessor: "status", width: "10%" },
    { Header: "Acciones", accessor: "actions", width: "10%", align: "center" },
  ];

  // Preparar filas de la tabla
  const rows = users.map((user) => ({
    name: (
      <MDBox display="flex" alignItems="center" gap={1.5}>
        <Avatar
          sx={{
            bgcolor: user.active ? "info.main" : "grey.400",
            width: 40,
            height: 40,
            fontSize: 16,
            fontWeight: "bold",
            transition: "all 0.3s",
            "&:hover": {
              transform: "scale(1.1)",
              boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            },
          }}
        >
          {user.name.charAt(0).toUpperCase()}
        </Avatar>
        <MDBox>
          <MDTypography variant="button" fontWeight="medium">
            {user.name}
          </MDTypography>
          <MDTypography variant="caption" color="text" display="block" sx={{ fontSize: "0.7rem" }}>
            {user.username}
          </MDTypography>
        </MDBox>
      </MDBox>
    ),
    username: (
      <Chip
        icon={<Icon fontSize="small">person</Icon>}
        label={user.username}
        size="small"
        variant="outlined"
        sx={{
          borderRadius: "8px",
          fontWeight: "medium",
        }}
      />
    ),
    email: (
      <MDBox display="flex" alignItems="center" gap={0.5}>
        {user.email ? (
          <>
            <Icon fontSize="small" sx={{ color: "text.secondary" }}>
              email
            </Icon>
            <MDTypography variant="caption" color="text">
              {user.email}
            </MDTypography>
          </>
        ) : (
          <MDTypography variant="caption" color="text" fontStyle="italic">
            Sin email
          </MDTypography>
        )}
      </MDBox>
    ),
    role: (
      <Chip
        icon={
          <Icon fontSize="small">
            {user.role === "admin" ? "admin_panel_settings" : "person_outline"}
          </Icon>
        }
        label={user.role_display || user.role}
        color={user.role === "admin" ? "warning" : "info"}
        size="small"
        sx={{
          fontWeight: "bold",
          borderRadius: "8px",
          "& .MuiChip-icon": {
            marginLeft: "8px",
          },
        }}
      />
    ),
    status: (
      <Tooltip title={user.active ? "Usuario Activo" : "Usuario Inactivo"} arrow>
        <MDBox display="flex" alignItems="center" gap={1}>
          <Switch
            checked={user.active}
            onChange={() => handleToggleStatus(user)}
            color="success"
            sx={{
              "& .MuiSwitch-thumb": {
                transition: "all 0.3s",
              },
              "&:hover .MuiSwitch-thumb": {
                boxShadow: "0 0 8px rgba(76, 175, 80, 0.6)",
              },
            }}
          />
          <Chip
            label={user.active ? "Activo" : "Inactivo"}
            size="small"
            color={user.active ? "success" : "default"}
            sx={{
              fontSize: "0.65rem",
              height: "20px",
              fontWeight: "bold",
            }}
          />
        </MDBox>
      </Tooltip>
    ),
    actions: (
      <MDBox display="flex" gap={1} justifyContent="center">
        <Tooltip title="Editar usuario" arrow>
          <IconButton
            size="small"
            color="info"
            onClick={() => handleOpenEditModal(user)}
            sx={{
              transition: "all 0.3s",
              "&:hover": {
                transform: "scale(1.15) rotate(5deg)",
                boxShadow: "0 4px 8px rgba(33, 150, 243, 0.4)",
              },
            }}
          >
            <Icon>edit</Icon>
          </IconButton>
        </Tooltip>
      </MDBox>
    ),
  }));

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Fade in timeout={600}>
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
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
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
                    <Icon sx={{ fontSize: 32, color: "white" }}>people</Icon>
                    <MDBox>
                      <MDTypography variant="h5" fontWeight="bold" color="white">
                        Gestión de Usuarios
                      </MDTypography>
                      <MDTypography variant="caption" color="white" opacity={0.8}>
                        {users.length} usuario{users.length !== 1 ? "s" : ""} registrado
                        {users.length !== 1 ? "s" : ""}
                      </MDTypography>
                    </MDBox>
                  </MDBox>
                  <Zoom in timeout={800}>
                    <MDButton
                      variant="contained"
                      color="white"
                      onClick={handleOpenCreateModal}
                      sx={{
                        transition: "all 0.3s",
                        "&:hover": {
                          transform: "translateY(-2px) scale(1.05)",
                          boxShadow: "0 7px 14px rgba(0, 0, 0, 0.18)",
                        },
                      }}
                    >
                      <Icon>add</Icon>&nbsp; Nuevo Usuario
                    </MDButton>
                  </Zoom>
                </MDBox>
                <MDBox pt={3}>
                  {loading ? (
                    <Fade in>
                      <MDBox display="flex" flexDirection="column" alignItems="center" p={5}>
                        <CircularProgress color="info" size={60} thickness={4} />
                        <MDTypography variant="button" color="text" mt={2}>
                          Cargando usuarios...
                        </MDTypography>
                      </MDBox>
                    </Fade>
                  ) : error ? (
                    <Fade in>
                      <MDBox p={3}>
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
                      </MDBox>
                    </Fade>
                  ) : (
                    <DataTable
                      table={{ columns, rows }}
                      isSorted={false}
                      entriesPerPage={false}
                      showTotalEntries={false}
                      noEndBorder
                    />
                  )}
                </MDBox>
              </Card>
            </Fade>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />

      {/* Modal Crear/Editar */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          {modalMode === "create" ? "Crear Nuevo Usuario" : "Editar Usuario"}
        </DialogTitle>
        <DialogContent>
          <MDBox component="form" pt={2}>
            <MDBox mb={2}>
              <MDInput
                type="text"
                label="Nombre Completo"
                fullWidth
                value={formData.name}
                onChange={(e) => handleFormChange("name", e.target.value)}
                error={!!formErrors.name}
                helperText={formErrors.name}
              />
            </MDBox>
            <MDBox mb={2}>
              <MDInput
                type="text"
                label="Usuario"
                fullWidth
                value={formData.username}
                onChange={(e) => handleFormChange("username", e.target.value)}
                error={!!formErrors.username}
                helperText={formErrors.username}
                disabled={modalMode === "edit"}
              />
            </MDBox>
            <MDBox mb={2}>
              <MDInput
                type="email"
                label="Email (opcional)"
                fullWidth
                value={formData.email}
                onChange={(e) => handleFormChange("email", e.target.value)}
                error={!!formErrors.email}
                helperText={formErrors.email}
              />
            </MDBox>
            <MDBox mb={2}>
              <FormControl fullWidth error={!!formErrors.role_id}>
                <InputLabel id="role-select-label">Rol</InputLabel>
                <Select
                  labelId="role-select-label"
                  id="role-select"
                  value={formData.role_id}
                  label="Rol"
                  onChange={(e) => handleFormChange("role_id", e.target.value)}
                  disabled={loadingRoles}
                  sx={{
                    height: "45px",
                    "& .MuiSelect-select": {
                      paddingTop: "12px",
                      paddingBottom: "12px",
                    },
                  }}
                >
                  {loadingRoles ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} /> Cargando roles...
                    </MenuItem>
                  ) : roles.length === 0 ? (
                    <MenuItem disabled>No hay roles disponibles</MenuItem>
                  ) : (
                    roles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.display_name} ({role.name})
                      </MenuItem>
                    ))
                  )}
                </Select>
                {formErrors.role_id && (
                  <MDTypography variant="caption" color="error" ml={1} mt={0.5}>
                    {formErrors.role_id}
                  </MDTypography>
                )}
              </FormControl>
            </MDBox>
            <MDBox mb={2}>
              <MDInput
                type="password"
                label={modalMode === "create" ? "Contraseña" : "Nueva Contraseña (opcional)"}
                fullWidth
                value={formData.password}
                onChange={(e) => handleFormChange("password", e.target.value)}
                error={!!formErrors.password}
                helperText={
                  formErrors.password ||
                  (modalMode === "edit"
                    ? "Dejar en blanco para mantener la contraseña actual"
                    : "Mínimo 6 caracteres")
                }
              />
            </MDBox>
            <MDBox display="flex" alignItems="center">
              <Switch
                checked={formData.active}
                onChange={(e) => handleFormChange("active", e.target.checked)}
                color="success"
              />
              <MDTypography variant="button" fontWeight="regular" color="text" ml={1}>
                Usuario activo
              </MDTypography>
            </MDBox>
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleCloseModal} color="secondary">
            Cancelar
          </MDButton>
          <MDButton onClick={handleSubmit} color="info" disabled={submitting}>
            {submitting ? <CircularProgress size={20} color="white" /> : "Guardar"}
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}

export default Promotores;
