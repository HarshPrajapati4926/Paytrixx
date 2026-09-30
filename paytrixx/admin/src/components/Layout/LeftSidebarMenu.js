import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import ArrowForwardIosSharpIcon from "@mui/icons-material/ArrowForwardIosSharp";
import MuiAccordion from "@mui/material/Accordion";
import MuiAccordionSummary, { accordionSummaryClasses } from "@mui/material/AccordionSummary";
import MuiAccordionDetails from "@mui/material/AccordionDetails";
import { useAppDispatch } from "../../hooks/reduxHooks";
import { logout } from "../../features/auth/authSlice";
import navigation from "../../config/navigation";
import Logo from "../common/Logo";

const Accordion = styled((props) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  "&:not(:last-child)": { borderBottom: 0 },
  "&::before": { display: "none" },
}));

const AccordionSummary = styled((props) => (
  <MuiAccordionSummary
    expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: "0.9rem" }} />}
    {...props}
  />
))(({ theme }) => ({
  backgroundColor: "rgba(0, 0, 0, .03)",
  flexDirection: "row-reverse",
  [`& .${accordionSummaryClasses.expandIconWrapper}.${accordionSummaryClasses.expanded}`]: {
    transform: "rotate(90deg)",
  },
  [`& .${accordionSummaryClasses.content}`]: { marginLeft: theme.spacing(1) },
  ...theme.applyStyles("dark", { backgroundColor: "rgba(255, 255, 255, .05)" }),
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: "1px solid rgba(0, 0, 0, .125)",
}));

const LeftSidebarMenu = ({ toggleActive }) => {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const isActiveLink = (path) => (location.pathname === path ? "active" : "");

  // Auto-expand the group that contains the current route
  useEffect(() => {
    const group = navigation.find((n) =>
      n.pages?.some((p) => p.route === location.pathname)
    );
    if (group) setExpanded(group.key);
  }, [location.pathname]);

  return (
    <Box className="leftSidebarDark hide-for-horizontal-nav">
      <Box className="left-sidebar-menu">
        <Box className="logo">
          <Logo size={24} />
        </Box>

        <Box
          className="burger-menu"
          onClick={toggleActive}
          sx={{ display: { xs: "none", md: "flex" } }}
        >
          <Typography component="span" className="top-bar"></Typography>
          <Typography component="span" className="middle-bar"></Typography>
          <Typography component="span" className="bottom-bar"></Typography>
        </Box>

        <Box className="sidebar-inner">
          <Box className="sidebar-menu">
            {navigation.map((item) => {
              if (item.route) {
                return (
                  <Link
                    key={item.key}
                    to={item.route}
                    className={`sidebar-menu-link ${isActiveLink(item.route)}`}
                  >
                    <i className="material-symbols-outlined">{item.icon}</i>
                    <Typography component="span" className="title">{item.name}</Typography>
                  </Link>
                );
              }

              return (
                <Accordion
                  key={item.key}
                  expanded={expanded === item.key}
                  onChange={(_, open) => setExpanded(open ? item.key : false)}
                  className="mat-accordion"
                >
                  <AccordionSummary
                    className="mat-summary"
                    aria-controls={`${item.key}-content`}
                    id={`${item.key}-header`}
                  >
                    <i className="material-symbols-outlined">{item.icon}</i>
                    <Typography component="span" className="title">{item.name}</Typography>
                  </AccordionSummary>

                  <AccordionDetails className="mat-details">
                    <ul className="sidebar-sub-menu">
                      {item.pages.map((page) => (
                        <li key={page.route} className="sidemenu-item">
                          <Link
                            to={page.route}
                            className={`sidemenu-link ${isActiveLink(page.route)}`}
                          >
                            {page.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </AccordionDetails>
                </Accordion>
              );
            })}

            <Box
              className="sidebar-menu-link"
              onClick={() => {
                dispatch(logout());
                navigate("/sign-in");
              }}
              sx={{ cursor: "pointer" }}
            >
              <i className="material-symbols-outlined">logout</i>
              <Typography component="span" className="title">Logout</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LeftSidebarMenu;
