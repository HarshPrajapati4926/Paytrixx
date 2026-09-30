"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@mui/material";
import navigation from "../../../config/navigation";

const HorizontalNavbar = () => {
  const location = useLocation();
  const isActiveLink = (path) => (location.pathname === path ? "active" : "");

  return (
    <div className="horizontal-navbar-area">
      <div className="accordion">
        {navigation.map((item) => {
          if (item.route) {
            return (
              <div key={item.key} className="accordion-item megamenu">
                <Button
                  component={Link}
                  to={item.route}
                  type="button"
                  className={`accordion-button ${isActiveLink(item.route)}`}
                >
                  <i className="material-symbols-outlined">{item.icon}</i>
                  <span className="title" style={{ lineHeight: 1 }}>{item.name}</span>
                </Button>
              </div>
            );
          }

          return (
            <div key={item.key} className="accordion-item megamenu">
              <Button type="button" className="accordion-button">
                <i className="material-symbols-outlined">{item.icon}</i>
                <span className="title" style={{ lineHeight: 1 }}>{item.name}</span>
              </Button>
              <div className="accordion-body border-radius">
                <ul className="sidebar-sub-menu">
                  {item.pages.map((page) => (
                    <li key={page.route} className="sidemenu-item">
                      <Link
                        to={page.route}
                        className={`sidemenu-link border-radius ${isActiveLink(page.route)}`}
                      >
                        {page.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HorizontalNavbar;
