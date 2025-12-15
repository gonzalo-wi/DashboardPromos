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

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @mui material components
import ListItem from "@mui/material/ListItem";
import Grow from "@mui/material/Grow";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";

// Custom styles for the SidenavCollapse
import {
  collapseItem,
  collapseIconBox,
  collapseIcon,
  collapseText,
} from "examples/Sidenav/styles/sidenavCollapse";

// Material Dashboard 2 React context
import { useMaterialUIController } from "context";

function SidenavCollapse({ icon, name, active, ...rest }) {
  const [controller] = useMaterialUIController();
  const { miniSidenav, transparentSidenav, whiteSidenav, darkMode, sidenavColor } = controller;

  return (
    <Grow in timeout={400}>
      <ListItem component="li">
        <MDBox
          {...rest}
          sx={(theme) => ({
            ...collapseItem(theme, {
              active,
              transparentSidenav,
              whiteSidenav,
              darkMode,
              sidenavColor,
            }),
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              transform: "translateX(8px)",
              boxShadow: active ? "0 4px 20px 0 rgba(0,0,0,0.14)" : "0 2px 10px 0 rgba(0,0,0,0.1)",
            },
          })}
        >
          <ListItemIcon
            sx={(theme) => ({
              ...collapseIconBox(theme, { transparentSidenav, whiteSidenav, darkMode, active }),
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "scale(1.15) rotate(5deg)",
              },
            })}
          >
            {typeof icon === "string" ? (
              <Icon
                sx={(theme) => ({
                  ...collapseIcon(theme, { active }),
                  transition: "all 0.3s ease",
                })}
              >
                {icon}
              </Icon>
            ) : (
              icon
            )}
          </ListItemIcon>

          <ListItemText
            primary={name}
            sx={(theme) => ({
              ...collapseText(theme, {
                miniSidenav,
                transparentSidenav,
                whiteSidenav,
                active,
              }),
              transition: "all 0.3s ease",
            })}
          />
        </MDBox>
      </ListItem>
    </Grow>
  );
}

// Setting default values for the props of SidenavCollapse
SidenavCollapse.defaultProps = {
  active: false,
};

// Typechecking props for the SidenavCollapse
SidenavCollapse.propTypes = {
  icon: PropTypes.node.isRequired,
  name: PropTypes.string.isRequired,
  active: PropTypes.bool,
};

export default SidenavCollapse;
