# Documentación - Gestión de Usuarios (Promotores)

## Descripción General

La vista de **Gestión de Usuarios** (`/promotores`) permite a los administradores crear, editar, activar/desactivar usuarios del sistema. Esta funcionalidad está conectada con la API del backend y requiere el permiso `manage_users`.

## Ubicación del Código

- **Vista**: `src/layouts/promotores/index.js`
- **Servicio**: `src/services/userService.js`
- **Ruta**: `/promotores` (protegida con `create_altas`)

## Funcionalidades Implementadas

### 1. **Listar Usuarios**
- Muestra tabla con todos los usuarios del sistema
- Columnas: Nombre, Usuario, Email, Rol, Estado, Acciones
- Loading state mientras carga los datos
- Manejo de errores con Alert

**Endpoint**: `GET /api/promos/admin/users`

### 2. **Crear Usuario**
- Modal con formulario para nuevo usuario
- Campos:
  - Nombre Completo (obligatorio)
  - Usuario (obligatorio)
  - Email (opcional, con validación de formato)
  - Rol (obligatorio, selector con roles disponibles)
  - Contraseña (obligatorio, mínimo 6 caracteres)
  - Estado activo/inactivo (switch)

**Endpoint**: `POST /api/promos/admin/users`

**Payload**:
```json
{
  "name": "Juan Pérez",
  "username": "juanperez",
  "email": "juan@example.com",
  "role_id": 1,
  "password": "securepassword",
  "active": true
}
```

### 3. **Editar Usuario**
- Modal con formulario pre-cargado con datos del usuario
- Usuario (username) deshabilitado para edición
- Rol editable con selector
- Contraseña opcional (solo si se quiere cambiar)
- Resto de campos editables

**Endpoint**: `PUT /api/promos/admin/users/{id}`

**Payload**:
```json
{
  "name": "Juan Pérez Actualizado",
  "email": "nuevo.email@example.com",
  "role_id": 2,
  "password": "newpassword", // Opcional
  "active": true
}
```

### 4. **Activar/Desactivar Usuario**
- Switch en la tabla para cambiar estado rápidamente
- Toggle directo sin confirmación
- Actualización inmediata con feedback

**Endpoint**: `PATCH /api/promos/admin/users/{id}/toggle-status`

## Estados del Componente

```javascript
// Estado principal
const [users, setUsers] = useState([]);           // Lista de usuarios
const [roles, setRoles] = useState([]);           // Lista de roles disponibles
const [loading, setLoading] = useState(true);     // Loading al cargar usuarios
const [loadingRoles, setLoadingRoles] = useState(false); // Loading al cargar roles
const [error, setError] = useState("");           // Errores generales

// Modal
const [openModal, setOpenModal] = useState(false);          // Abrir/cerrar modal
const [modalMode, setModalMode] = useState("create");       // "create" o "edit"
const [selectedUser, setSelectedUser] = useState(null);     // Usuario seleccionado para editar
const [formData, setFormData] = useState({
  name: "",
  username: "",
  email: "",
  role_id: "",
  password: "",
  active: true
});                                                          // Datos del formulario
const [formErrors, setFormErrors] = useState({});           // Errores de validación
const [submitting, setSubmitting] = useState(false);        // Loading al guardar

// Notificaciones
const [snackbar, setSnackbar] = useState({
  open: false,
  message: "",
  severity: "success" // "success", "error", "warning", "info"
});
```

## Funciones Principales

### `loadUsers()`
Carga la lista de usuarios desde la API.

```javascript
const loadUsers = async () => {
  try {
    setLoading(true);
    const data = await getUsers();
    setUsers(data);
  } catch (err) {
    setError(err.message);
    showSnackbar(err.message, "error");
  } finally {
    setLoading(false);
  }
};
```

### `loadRoles()`
Carga los roles disponibles desde la API para el selector.

```javascript
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
```
  } finally {
    setLoading(false);
  }
};
```

### `handleSubmit()`
Guarda un usuario (crear o editar).

```javascript
const handleSubmit = async () => {
  if (!validateForm()) return;
  
  setSubmitting(true);
  try {
    if (modalMode === "create") {
      await createUser(formData);
      showSnackbar("Usuario creado exitosamente");
    } else {
      await updateUser(selectedUser.id, formData);
      showSnackbar("Usuario actualizado exitosamente");
    }
    handleCloseModal();
    loadUsers();
  } catch (err) {
    showSnackbar(err.message, "error");
  } finally {
    setSubmitting(false);
  }
};
```

### `handleToggleStatus(user)`
Cambia el estado activo/inactivo de un usuario.

```javascript
const handleToggleStatus = async (user) => {
  try {
    const response = await toggleUserStatus(user.id);
    showSnackbar(response.message);
    loadUsers();
  } catch (err) {
    showSnackbar(err.message, "error");
  }
};
```

## Validaciones del Formulario

```javascript
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
```

## Componentes Utilizados

### Material-UI
- `Dialog` - Modal para crear/editar
- `DialogTitle` - Título del modal
- `DialogContent` - Contenido del modal
- `DialogActions` - Botones del modal
- `Switch` - Toggle activo/inactivo
- `Select` - Selector dropdown para roles
- `MenuItem` - Opciones del selector
- `FormControl` - Contenedor del selector
- `InputLabel` - Etiqueta del selector
- `Alert` - Mensajes de error
- `Snackbar` - Notificaciones flotantes
- `CircularProgress` - Indicador de carga
- `Chip` - Etiqueta del rol
- `IconButton` - Botón de editar
- `Icon` - Iconos de Material

### Material Dashboard 2
- `MDBox` - Contenedor flexible
- `MDTypography` - Texto estilizado
- `MDButton` - Botones con estilos personalizados
- `MDInput` - Input con estilos del dashboard
- `DashboardLayout` - Layout principal
- `DashboardNavbar` - Navbar del dashboard
- `Footer` - Footer del dashboard
- `DataTable` - Tabla con paginación y ordenamiento

## Permisos Requeridos

La vista está protegida en `routes.js`:

```javascript
{
  type: "collapse",
  name: "Promotores",
  key: "promotores",
  icon: <Icon fontSize="small">person</Icon>,
  route: "/promotores",
  component: <PrivateRoute component={Promotores} requiredPermissions={["create_altas"]} />,
}
```

**Nota**: La API valida el permiso `manage_users` en el backend para las operaciones CRUD.

## Manejo de Errores

Todos los errores de la API se muestran en:
1. **Alert rojo** si falla la carga inicial
2. **Snackbar** para errores en operaciones (crear, editar, toggle)

Ejemplo de error de la API:
```json
{
  "error": "No tienes permiso para realizar esta acción"
}
```

El componente captura `err.message` y lo muestra al usuario.

## Notificaciones

Las notificaciones utilizan `Snackbar` con diferentes tipos:
- **success** (verde): Operación exitosa
- **error** (rojo): Error en operación
- **warning** (naranja): Advertencia
- **info** (azul): Información

Duración: 4 segundos
Posición: Bottom-right

## Flujo de Usuario

### Crear Usuario
1. Click en botón "Nuevo Usuario"
2. Se abre modal con formulario vacío
3. Completar campos obligatorios
4. Click en "Guardar"
5. Validación del formulario
6. POST a la API
7. Notificación de éxito
8. Recarga la tabla
9. Cierra el modal

### Editar Usuario
1. Click en ícono de editar (lápiz)
2. Se abre modal con datos del usuario
3. Campo "Usuario" deshabilitado
4. Modificar campos necesarios
5. Click en "Guardar"
6. Validación del formulario
7. PUT a la API
8. Notificación de éxito
9. Recarga la tabla
10. Cierra el modal

### Toggle Estado
1. Click en el switch activo/inactivo
2. PATCH a la API inmediatamente
3. Notificación de éxito
4. Recarga la tabla

## Testing Manual

Para probar la funcionalidad:

1. **Listar**: Acceder a `/promotores` y verificar que carga la tabla
2. **Crear**: Click en "Nuevo Usuario", completar y guardar
3. **Editar**: Click en editar, modificar y guardar
4. **Toggle**: Click en switch y verificar cambio de estado
5. **Validaciones**: Intentar guardar con campos vacíos
6. **Errores**: Desconectar API y verificar mensajes de error

## Posibles Mejoras Futuras

1. **Confirmación de eliminación**: Agregar botón para eliminar usuarios
2. **Filtros**: Filtrar por rol, estado, nombre
3. **Búsqueda**: Barra de búsqueda en tiempo real
4. **Paginación**: Para muchos usuarios (implementar en backend)
5. **Roles**: Selector de rol en el formulario (actualmente solo admins crean como "user")
6. **Permisos visuales**: Mostrar lista de permisos del usuario
7. **Historial**: Ver altas creadas por cada usuario
8. **Export**: Exportar lista de usuarios a CSV/Excel
9. **Bulk actions**: Activar/desactivar múltiples usuarios a la vez
10. **Avatar**: Upload de imagen de perfil
