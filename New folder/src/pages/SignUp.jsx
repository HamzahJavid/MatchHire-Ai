import React, { useState } from "react";
import "./SignUp.css";
import Logo from "../assets/logo.svg";
import { useNavigate, Link } from "react-router-dom";

export default function SignUp({ onLogin }) {
  const [role, setRole] = useState("seeker");
  const navigate = useNavigate();

  function handleCreate(e) {
    e.preventDefault();
    onLogin(role);
    navigate(`/dashboard/${role}`);
  }

  return (
    <div className="signup-page">
      <div className="login-card">
        <img src={Logo} alt="logo" className="logo" />
        <h2 className="brand">MatchHire AI</h2>
        <h1>Create Account</h1>
        <p className="subtitle">Start matching in minutes</p>
        <div className="role-row">
          <button
            type="button"
            className={`role-btn ${role === "recruiter" ? "active" : ""}`}
            onClick={() => setRole("recruiter")}
          >
            <div className="role-ico">🎁</div>
            <div>Hiring</div>
          </button>
          <button
            type="button"
            className={`role-btn ${role === "seeker" ? "active" : ""}`}
            onClick={() => setRole("seeker")}
          >
            <div className="role-ico">🧭</div>
            <div>Seeking</div>
          </button>
        </div>
        <form className="signup-form" onSubmit={handleCreate}>
          <label className="field">
            <span className="input-icon" aria-hidden="true">
              👤
            </span>
            <input type="text" placeholder="Full name" required />
          </label>
          <label className="field">
            <span className="input-icon" aria-hidden="true">
              ✉️
            </span>
            <input type="email" placeholder="Email address" required />
          </label>
          <label className="field">
            <span className="input-icon" aria-hidden="true">
              🔒
            </span>
            <input type="password" placeholder="Password" required />
          </label>
          <button className="btn-primary" type="submit">
            Create Account <span className="arrow">→</span>
          </button>
        </form>
        <p className="signup">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
