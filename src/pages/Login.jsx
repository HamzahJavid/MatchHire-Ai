import React, { useState } from "react";
import "./Login.css";
import Logo from "../assets/logo.svg";
import { useNavigate, Link } from "react-router-dom";

export default function Login({ onLogin }) {
  const [role, setRole] = useState("seeker");
  const navigate = useNavigate();

  function handleSignIn(e) {
    e.preventDefault();
    onLogin(role);
    navigate(`/dashboard/${role}`);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <img src={Logo} alt="logo" className="logo" />
        <h2 className="brand">MatchHire AI</h2>
        <h1>Welcome Back</h1>
        <p className="subtitle">Sign in to continue matching</p>

        {/* Role selector — same pattern as SignUp */}
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

        <form className="login-form" onSubmit={handleSignIn}>
          <label className="field">
            <span className="input-icon" aria-hidden="true">
              <svg width="18" height="12" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 6.5L12 13l9-6.5"
                  stroke="#B9B9C3"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <input type="email" placeholder="Email address" required />
          </label>
          <label className="field">
            <span className="input-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M17 11V8a5 5 0 10-10 0v3"
                  stroke="#B9B9C3"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect
                  x="3"
                  y="11"
                  width="18"
                  height="10"
                  rx="2"
                  stroke="#B9B9C3"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <input type="password" placeholder="Password" required />
          </label>
          <button className="btn-primary" type="submit">
            Sign In <span className="arrow">→</span>
          </button>
        </form>
        <p className="signup">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
