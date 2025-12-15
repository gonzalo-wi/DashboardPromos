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

import { useEffect, useState } from "react";

// react-router-dom components
import { useLocation, NavLink, useNavigate } from "react-router-dom";

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @mui material components
import Fade from "@mui/material/Fade";
import Zoom from "@mui/material/Zoom";

// @mui material components
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Icon from "@mui/material/Icon";
import CircularProgress from "@mui/material/CircularProgress";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// Material Dashboard 2 React example components
import SidenavCollapse from "examples/Sidenav/SidenavCollapse";

// Custom styles for the Sidenav
import SidenavRoot from "examples/Sidenav/SidenavRoot";
import sidenavLogoLabel from "examples/Sidenav/styles/sidenav";

// Material Dashboard 2 React context
import {
  useMaterialUIController,
  setMiniSidenav,
  setTransparentSidenav,
  setWhiteSidenav,
} from "context";

// Auth context
import { useAuth } from "../../context/AuthContext";

function Sidenav({ color, brand, brandName, routes, ...rest }) {
  const [controller, dispatch] = useMaterialUIController();
  const { miniSidenav, transparentSidenav, whiteSidenav, darkMode, sidenavColor } = controller;
  const location = useLocation();
  const collapseName = location.pathname.replace("/", "");

  let textColor = "white";

  if (transparentSidenav || (whiteSidenav && !darkMode)) {
    textColor = "dark";
  } else if (whiteSidenav && darkMode) {
    textColor = "inherit";
  }

  const closeSidenav = () => setMiniSidenav(dispatch, true);

  useEffect(() => {
    // A function that sets the mini state of the sidenav.
    function handleMiniSidenav() {
      setMiniSidenav(dispatch, window.innerWidth < 1200);
      setTransparentSidenav(dispatch, window.innerWidth < 1200 ? false : transparentSidenav);
      setWhiteSidenav(dispatch, window.innerWidth < 1200 ? false : whiteSidenav);
    }

    /** 
     The event listener that's calling the handleMiniSidenav function when resizing the window.
    */
    window.addEventListener("resize", handleMiniSidenav);

    // Call the handleMiniSidenav function to set the state with the initial value.
    handleMiniSidenav();

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleMiniSidenav);
  }, [dispatch]);

  // Render all the routes from the routes.js (All the visible items on the Sidenav)
  const renderRoutes = routes.map(({ type, name, icon, title, noCollapse, key, href, route }) => {
    let returnValue;

    if (type === "collapse") {
      returnValue = href ? (
        <Link
          href={href}
          key={key}
          target="_blank"
          rel="noreferrer"
          sx={{ textDecoration: "none" }}
        >
          <SidenavCollapse
            name={name}
            icon={icon}
            active={key === collapseName}
            noCollapse={noCollapse}
          />
        </Link>
      ) : (
        <NavLink key={key} to={route}>
          <SidenavCollapse name={name} icon={icon} active={key === collapseName} />
        </NavLink>
      );
    } else if (type === "title") {
      returnValue = miniSidenav ? null : (
        <MDTypography
          key={key}
          color={textColor}
          display="block"
          variant="caption"
          fontWeight="bold"
          textTransform="uppercase"
          pl={3}
          mt={2}
          mb={1}
          ml={1}
        >
          {title}
        </MDTypography>
      );
    } else if (type === "divider") {
      returnValue = (
        <Divider
          key={key}
          light={
            (!darkMode && !whiteSidenav && !transparentSidenav) ||
            (darkMode && !transparentSidenav && whiteSidenav)
          }
        />
      );
    }

    return returnValue;
  });

  return (
    <SidenavRoot
      {...rest}
      variant="permanent"
      ownerState={{ transparentSidenav, whiteSidenav, miniSidenav, darkMode }}
    >
      <MDBox pt={3} pb={1} px={4} textAlign="center">
        <MDBox
          display={{ xs: "block", xl: "none" }}
          position="absolute"
          top={0}
          right={0}
          p={1.625}
          onClick={closeSidenav}
          sx={{
            cursor: "pointer",
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "rotate(90deg)",
              color: "error.main",
            },
          }}
        >
          <MDTypography variant="h6" color="secondary">
            <Icon sx={{ fontWeight: "bold" }}>close</Icon>
          </MDTypography>
        </MDBox>
        <Zoom in timeout={500}>
          <MDBox
            component={NavLink}
            to="/"
            display="flex"
            alignItems="center"
            sx={{
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          >
            {brand && (
              <MDBox
                component="img"
                src={brand}
                alt="Brand"
                width="2rem"
                sx={{
                  transition: "transform 0.3s ease",
                  "&:hover": { transform: "rotate(360deg)" },
                }}
              />
            )}
            <MDBox
              width={!brandName && "100%"}
              sx={(theme) => sidenavLogoLabel(theme, { miniSidenav })}
            >
              <MDTypography component="h6" variant="button" fontWeight="medium" color={textColor}>
                {brandName}
              </MDTypography>
            </MDBox>
          </MDBox>
        </Zoom>
      </MDBox>
      <Divider
        light={
          (!darkMode && !whiteSidenav && !transparentSidenav) ||
          (darkMode && !transparentSidenav && whiteSidenav)
        }
      />
      <Fade in timeout={700}>
        <List sx={{ py: 1 }}>{renderRoutes}</List>
      </Fade>
      <MDBox px={2} mt="auto" mb={2}>
        <LogoutButton />
      </MDBox>
    </SidenavRoot>
  );
}

// Componente de botón de logout
function LogoutButton() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [controller] = useMaterialUIController();
  const { miniSidenav, darkMode } = controller;
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await logout();
      navigate("/authentication/sign-in");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      navigate("/authentication/sign-in");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) return null;

  return (
    <Fade in timeout={900}>
      <MDBox>
        <Divider light={!darkMode} />
        <MDBox pt={2} pb={1}>
          <MDBox
            px={2}
            mb={1}
            sx={{
              transition: "all 0.3s ease",
              "&:hover": { transform: "translateX(4px)" },
            }}
          >
            <MDTypography variant="caption" color="text" fontWeight="medium">
              {user.name}
            </MDTypography>
            <MDTypography variant="caption" color="text" display="block">
              {user.role_display || user.role}
            </MDTypography>
          </MDBox>
          <MDButton
            variant="gradient"
            color="error"
            fullWidth
            onClick={handleLogout}
            disabled={isLoggingOut}
            sx={{
              textTransform: "none",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 8px 16px rgba(244, 67, 54, 0.3)",
              },
              "&.Mui-disabled": {
                opacity: 0.8,
                background: "linear-gradient(195deg, #EC407A, #D81B60)",
              },
            }}
          >
            {isLoggingOut ? (
              <>
                <CircularProgress size={16} sx={{ color: "white", mr: 1 }} thickness={5} />
                {!miniSidenav && "Cerrando sesión..."}
              </>
            ) : (
              <>
                <Icon sx={{ mr: 1 }}>logout</Icon>
                {!miniSidenav && "Cerrar Sesión"}
              </>
            )}
          </MDButton>
        </MDBox>
      </MDBox>
    </Fade>
  );
}

// Setting default values for the props of Sidenav
Sidenav.defaultProps = {
  color: "info",
  brand: "",
};

// Typechecking props for the Sidenav
Sidenav.propTypes = {
  color: PropTypes.oneOf(["primary", "secondary", "info", "success", "warning", "error", "dark"]),
  brand: PropTypes.string,
  brandName: PropTypes.string.isRequired,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default Sidenav;
