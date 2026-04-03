import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import SeekerDashboard from "./SeekerDashboard";
import RecruiterDashboard from "./RecruiterDashboard";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Dashboard.css";

const PlaceholderPage = ({ title }) => (
  <div className="content-card">
    <h2>{title}</h2>
    <p>This page is under construction.</p>
  </div>
);

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

  function handleNav(key) {
    navigate(
      key === "dashboard" ? `/dashboard/${role}` : `/dashboard/${role}/${key}`,
    );
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
        <Routes>
          <Route
            index
            element={
              role === "recruiter" ? (
                <RecruiterDashboard />
              ) : (
                <SeekerDashboard />
              )
            }
          />

          {role === "seeker" && (
            <>
              <Route
                path="profile"
                element={<PlaceholderPage title="My Profile" />}
              />
              <Route
                path="swipe"
                element={<PlaceholderPage title="Swipe Jobs" />}
              />
              <Route
                path="matches"
                element={<PlaceholderPage title="Matches" />}
              />
              <Route
                path="practice"
                element={<PlaceholderPage title="AI Practice" />}
              />
              <Route
                path="settings"
                element={<PlaceholderPage title="Settings" />}
              />
            </>
          )}

          {role === "recruiter" && (
            <>
              <Route
                path="post-job"
                element={<PlaceholderPage title="Post Job" />}
              />
              <Route
                path="swipe"
                element={<PlaceholderPage title="Swipe Candidates" />}
              />
              <Route
                path="matches"
                element={<PlaceholderPage title="Matches" />}
              />
              <Route
                path="interviews"
                element={<PlaceholderPage title="AI Interviews" />}
              />
              <Route
                path="settings"
                element={<PlaceholderPage title="Settings" />}
              />
            </>
          )}

          <Route
            path="*"
            element={<Navigate to={`/dashboard/${role}`} replace />}
          />
        </Routes>
      </main>
    </div>
  );
}
