# Sistema de Autenticación - Material Dashboard Promotores

## Descripción General

Sistema completo de autenticación integrado con la API de Altas de Promotores. Incluye login, logout, gestión de sesiones, protección de rutas y control de permisos.

## Estructura de Archivos

### Servicios
- **`src/services/authService.js`**: Servicios de autenticación (login, logout, tokens, permisos)

### Contexto
- **`src/context/AuthContext.js`**: Context de React para estado global de autenticación

### Componentes
- **`src/components/PrivateRoute/index.js`**: Componente para proteger rutas
- **`src/layouts/authentication/sign-in/index.js`**: Página de login

### Configuración
- **`src/App.js`**: AuthProvider envuelve toda la aplicación
- **`src/routes.js`**: Rutas protegidas con PrivateRoute
- **`src/examples/Sidenav/index.js`**: Botón de logout en sidebar

## Funcionalidades

### 1. Login
**Endpoint:** `POST /api/promos/login`

```javascript
// Uso
const { login } = useAuth();

await login(username, password, "web");
// Redirige automáticamente según el rol del usuario
```

**Respuesta de la API:**
```json
{
  "message": "Login exitoso",
  "token": "1|abc123...",
  "expires_at": "2025-12-16T10:30:00.000000Z",
  "expires_in_hours": 24,
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "username": "jperez",
    "role": "user",
    "role_display": "Usuario",
    "permissions": ["create_altas", "view_promotions", "view_own_altas"],
    "active": true
  }
}
```

### 2. Logout
**Endpoint:** `POST /api/promos/logout`

```javascript
// Uso
const { logout } = useAuth();

await logout();
// Limpia localStorage y redirige a login
```

### 3. Verificación de Autenticación

```javascript
const { isAuthenticated, user, loading } = useAuth();

if (loading) {
  return <LoadingScreen />;
}

if (!isAuthenticated) {
  return <Navigate to="/authentication/sign-in" />;
}
```

### 4. Control de Permisos

```javascript
const { hasPermission, hasRole } = useAuth();

// Verificar permiso específico
if (hasPermission("create_altas")) {
  // Usuario puede crear altas
}

// Verificar rol
if (hasRole("admin")) {
  // Usuario es administrador
}
```

### 5. Protección de Rutas

```javascript
// En routes.js
{
  route: "/promotores",
  component: (
    <PrivateRoute requiredPermission="create_altas">
      <Promotores />
    </PrivateRoute>
  ),
}
```

## Permisos por Rol

### Usuario Regular (user)
- `create_altas` - Crear altas de clientes
- `view_promotions` - Ver promociones activas
- `view_own_altas` - Ver sus propias altas

### Administrador (admin)
- `manage_users` - Gestionar usuarios
- `view_all_users` - Ver todos los usuarios
- `manage_promotions` - Gestionar promociones
- `view_altas` - Ver altas de otros
- `assign_permissions` - Asignar permisos básicos
- `edit_promotions` - Editar promociones

### Super Administrador (superadmin)
- Todos los permisos de admin
- `manage_admins` - Gestionar administradores
- `assign_admin_permissions` - Asignar permisos a administradores

## Almacenamiento Local

El sistema guarda en `localStorage`:
- `token` - Token de autenticación Bearer
- `user` - Datos del usuario (JSON)
- `expiresAt` - Fecha/hora de expiración del token

## Expiración de Tokens

- **Duración:** 24 horas desde la creación
- **Verificación automática:** Se verifica en cada llamada a `getToken()`
- **Renovación:** Si el token está expirado, se hace logout automático
- **Mensajes de error:**
  - `token_missing` - Token no proporcionado
  - `token_invalid` - Token inválido
  - `token_expired` - Token expirado

## Flujo de Autenticación

1. Usuario ingresa credenciales en `/authentication/sign-in`
2. Se llama a `login(username, password)`
3. API valida credenciales y devuelve token + datos del usuario
4. Token y datos se guardan en localStorage
5. Usuario es redirigido según su rol:
   - **admin/superadmin** → `/dashboard-promotores`
   - **user** → `/promotores`
6. En cada navegación, `PrivateRoute` verifica autenticación y permisos
7. Sidenav muestra botón de logout con nombre del usuario

## Manejo de Errores

### Login
- **401** - Credenciales incorrectas
- **403** - Usuario inactivo o sin permisos
- **429** - Demasiados intentos (rate limit: 5 por minuto)

### Rutas Protegidas
- Sin autenticación → Redirige a `/authentication/sign-in`
- Sin permiso → Muestra mensaje "Acceso Denegado"
- Token expirado → Logout automático y redirige a login

## Hooks Disponibles

### useAuth()
```javascript
const {
  user,              // Datos del usuario actual
  isAuthenticated,   // Boolean de autenticación
  loading,           // Boolean de carga inicial
  login,             // Función de login
  logout,            // Función de logout
  hasPermission,     // Función para verificar permisos
  hasRole,           // Función para verificar roles
} = useAuth();
```

## Seguridad

1. **Bearer Token:** Todos los endpoints protegidos requieren `Authorization: Bearer {token}`
2. **HTTPS:** Se recomienda en producción
3. **Rate Limiting:** 5 intentos de login por minuto
4. **Expiración:** Tokens expiran en 24 horas
5. **Validación:** Middleware verifica token en cada petición

## Ejemplo de Uso Completo

```javascript
import { useAuth } from "context/AuthContext";
import { Navigate } from "react-router-dom";

function MiComponente() {
  const { isAuthenticated, user, hasPermission, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/authentication/sign-in" />;
  }

  if (!hasPermission("create_altas")) {
    return <div>No tienes permiso para esta acción</div>;
  }

  return (
    <div>
      <h1>Bienvenido, {user.name}</h1>
      <p>Rol: {user.role_display}</p>
      {/* Contenido protegido */}
    </div>
  );
}
```

## Testing

### Credenciales de Prueba
Consultar con el administrador del sistema para obtener credenciales de prueba.

### Verificar Estado de Autenticación
```javascript
// En consola del navegador
console.log("Token:", localStorage.getItem("token"));
console.log("Usuario:", JSON.parse(localStorage.getItem("user")));
console.log("Expira:", localStorage.getItem("expiresAt"));
```

## Troubleshooting

### "Token expirado"
- **Causa:** Han pasado más de 24 horas desde el login
- **Solución:** Hacer login nuevamente

### "Credenciales incorrectas"
- **Causa:** Username o password inválidos
- **Solución:** Verificar credenciales con el administrador

### "Usuario inactivo"
- **Causa:** Cuenta desactivada por administrador
- **Solución:** Contactar al administrador

### "Acceso denegado"
- **Causa:** Usuario no tiene el permiso requerido
- **Solución:** Solicitar permisos al administrador o usar cuenta con permisos adecuados

### CORS Error
- **Causa:** Configuración de CORS en el backend
- **Solución:** Verificar que el backend permita peticiones desde el dominio del frontend

## API Base URL

```env
REACT_APP_API_BASE_URL=http://ho.el-jumillano.com.ar:24937/api/promos
```

## Próximas Mejoras

- [ ] Renovación automática de token antes de expirar
- [ ] Recordar usuario (guardar username en localStorage)
- [ ] Recuperación de contraseña
- [ ] Autenticación de dos factores (2FA)
- [ ] Historial de sesiones activas
- [ ] Notificación antes de expiración de sesión

---

**Versión:** 1.0  
**Fecha:** Diciembre 2025
