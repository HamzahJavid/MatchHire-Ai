import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import SeekerDashboard from "./SeekerDashboard";
import RecruiterDashboard from "./RecruiterDashboard";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Dashboard.css";
import SeekerProfile from "./SeekerProfile";
import SwipePage from "./SwipePage";
import MatchesPage from "./MatchesPage";
import AIPractice from "./AIPractice";
import PostJob from "./PostJob";
import AIInterview from "./AIInterview";

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
              <Route path="profile" element={<SeekerProfile />} />
              <Route path="swipe" element={<SwipePage />} />
              <Route path="matches" element={<MatchesPage />} />
              <Route path="practice" element={<AIPractice />} />
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
                element={<PostJob />}
              />
              <Route
                path="swipe"
                element={<SwipePage role="recruiter" />}
              />
              <Route
                path="matches"
                element={<MatchesPage role="recruiter" />}
              />
              <Route
                path="interviews"
                element={<AIInterview />}
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
