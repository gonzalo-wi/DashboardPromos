/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

/** 
  All of the routes for the Material Dashboard 2 React are added here,
  You can add a new route, customize the routes and delete the routes here.

  Once you add a new route on this file it will be visible automatically on
  the Sidenav.

  For adding a new route you can follow the existing routes in the routes array.
  1. The `type` key with the `collapse` value is used for a route.
  2. The `type` key with the `title` value is used for a title inside the Sidenav. 
  3. The `type` key with the `divider` value is used for a divider between Sidenav items.
  4. The `name` key is used for the name of the route on the Sidenav.
  5. The `key` key is used for the key of the route (It will help you with the key prop inside a loop).
  6. The `icon` key is used for the icon of the route on the Sidenav, you have to add a node.
  7. The `collapse` key is used for making a collapsible item on the Sidenav that has other routes
  inside (nested routes), you need to pass the nested routes inside an array as a value for the `collapse` key.
  8. The `route` key is used to store the route location which is used for the react router.
  9. The `href` key is used to store the external links location.
  10. The `title` key is only for the item with the type of `title` and its used for the title text on the Sidenav.
  10. The `component` key is used to store the component of its route.
*/

// Vistas de la aplicación
import Promotores from "layouts/promotores";
import DashboardPromotores from "layouts/dashboard-promotores";
import MapaPromotores from "layouts/mapa-promotores";
import EfectividadPromotores from "layouts/efectividad-promotores";
import SignIn from "layouts/authentication/sign-in";

// Private Route Component
import PrivateRoute from "components/PrivateRoute";

// @mui icons
import Icon from "@mui/material/Icon";

const routes = [
  {
    type: "collapse",
    name: "Gestión de Usuarios",
    key: "promotores",
    icon: <Icon fontSize="small">people</Icon>,
    route: "/promotores",
    component: (
      <PrivateRoute requiredPermission="manage_users">
        <Promotores />
      </PrivateRoute>
    ),
  },
  {
    type: "collapse",
    name: "Dashboard",
    key: "dashboard-promotores",
    icon: <Icon fontSize="small">dashboard</Icon>,
    route: "/dashboard-promotores",
    component: (
      <PrivateRoute requiredPermission="view_altas">
        <DashboardPromotores />
      </PrivateRoute>
    ),
  },
  {
    type: "collapse",
    name: "Mapa en Tiempo Real",
    key: "mapa-promotores",
    icon: <Icon fontSize="small">map</Icon>,
    route: "/mapa-promotores",
    component: (
      <PrivateRoute requiredPermission="view_altas">
        <MapaPromotores />
      </PrivateRoute>
    ),
  },
  {
    type: "collapse",
    name: "Efectividad",
    key: "efectividad-promotores",
    icon: <Icon fontSize="small">bar_chart</Icon>,
    route: "/efectividad-promotores",
    component: (
      <PrivateRoute requiredPermission="view_altas">
        <EfectividadPromotores />
      </PrivateRoute>
    ),
  },
  {
    type: "route",
    key: "sign-in",
    route: "/authentication/sign-in",
    component: <SignIn />,
  },
];

export default routes;
