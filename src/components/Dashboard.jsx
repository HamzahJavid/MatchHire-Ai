import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./Dashboard.css";

export default function Dashboard({ role = "seeker", onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function onResize() {
      const mobile = window.innerWidth < 900;
      setIsMobile(mobile);
      if (mobile) setMenuOpen(false);
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Derive current page label from URL
  const segments = location.pathname.split("/");
  const currentPage = segments[segments.length - 1] || "dashboard";
  const pageTitle =
    currentPage === role
      ? "Dashboard"
      : currentPage
          .replace(/-/g, " ")
          .replace(/^[a-z]/, (s) => s.toUpperCase());

  function handleNav(key) {
    if (key === "dashboard") {
      navigate(`/dashboard/${role}`);
    } else {
      navigate(`/dashboard/${role}/${key}`);
    }
    if (isMobile) setMenuOpen(false);
  }

  function handleSignOut() {
    onLogout();
    navigate("/login");
  }

  return (
    <div
      className={`app-shell ${menuOpen ? "menu-open" : "menu-closed"} ${isMobile ? "mobile" : "desktop"}`}
    >
      <button
        className="shell-hamburger"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        <span className="hb-line" />
        <span className="hb-line" />
        <span className="hb-line" />
      </button>

      <Sidebar
        onNavigate={handleNav}
        onSignOut={handleSignOut}
        open={menuOpen}
        isMobile={isMobile}
        onClose={() => setMenuOpen(false)}
        role={role}
      />

      <main className="app-main">
        <div className="content-card">
          <h2>{pageTitle}</h2>
          <p>This page is under creation.</p>
        </div>
      </main>
    </div>
  );
}
