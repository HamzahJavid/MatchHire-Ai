import React from "react";
import "./Sidebar.css";

const seekerLinks = [
  { key: "dashboard", label: "Dashboard", icon: "▦" },
  { key: "profile", label: "My Profile", icon: "👤" },
  { key: "swipe", label: "Swipe Jobs", icon: "🔁" },
  { key: "matches", label: "Matches", icon: "💬" },
  { key: "practice", label: "AI Practice", icon: "🧠" },
];

const recruiterLinks = [
  { key: "dashboard", label: "Dashboard", icon: "▦" },
  { key: "post-job", label: "Post Job", icon: "📋" },
  { key: "swipe", label: "Swipe Candidates", icon: "🔁" },
  { key: "matches", label: "Matches", icon: "💬" },
  { key: "interviews", label: "AI Interviews", icon: "🧠" },
];

export default function Sidebar({
  onNavigate,
  onSignOut,
  open,
  isMobile,
  onClose,
  role = "seeker",
}) {
  const links = role === "recruiter" ? recruiterLinks : seekerLinks;

  function handleLink(k) {
    onNavigate && onNavigate(k);
    if (isMobile) onClose && onClose();
  }

  return (
    <>
      <div
        className={`sidebar ${open ? "open" : "closed"} ${isMobile ? "mobile" : "desktop"}`}
        aria-hidden={isMobile && !open}
      >
        <div className="sb-top">
          <div className="sb-brand">MatchHire AI</div>
          {open && (
            <button
              className="sb-close-btn"
              onClick={onClose}
              aria-label="Close menu"
            >
              ✕
            </button>
          )}
        </div>
        <nav className="sb-nav">
          <div className="sb-role">
            {role === "recruiter" ? "RECRUITER" : "JOB SEEKER"}
          </div>
          {links.map((l) => (
            <button
              key={l.key}
              className="sb-link"
              onClick={() => handleLink(l.key)}
            >
              <span className="sb-ico">{l.icon}</span>
              <span className="sb-label">{l.label}</span>
            </button>
          ))}
        </nav>
        <div className="sb-bottom">
          <button
            className="sb-bottom-link"
            onClick={() => onNavigate && onNavigate("settings")}
          >
            <span className="sb-ico">⚙️</span>
            <span className="sb-label">Settings</span>
          </button>
          <button className="sb-bottom-link" onClick={onSignOut}>
            <span className="sb-ico">↩️</span>
            <span className="sb-label">Sign Out</span>
          </button>
        </div>
      </div>
      {isMobile && open && <div className="sb-backdrop" onClick={onClose} />}
    </>
  );
}
