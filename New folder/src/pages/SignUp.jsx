import React, { useState } from "react";
import "./SignUp.css";
import Logo from "../assets/logo.svg";
import { useNavigate, Link } from "react-router-dom";
import { authAPI, tokenAPI } from "../services/api";

export default function SignUp({ onLogin }) {
  const [role, setRole] = useState("seeker");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleCreate(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authAPI.signup(fullName, email, password, role);
      
      // Store tokens
      tokenAPI.setTokens(response.data.accessToken, response.data.refreshToken);
      
      // Determine role from user object
      const userRole = response.data.user.hasSeeker ? "seeker" : "recruiter";
      onLogin(userRole);
      
      navigate(`/dashboard/${userRole}`);
    } catch (err) {
      setError(err.message || "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
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
            <div className="role-ico"></div>
            <div>Hiring</div>
          </button>
          <button
            type="button"
            className={`role-btn ${role === "seeker" ? "active" : ""}`}
            onClick={() => setRole("seeker")}
          >
            <div className="role-ico"></div>
            <div>Seeking</div>
          </button>
        </div>
        <form className="signup-form" onSubmit={handleCreate}>
          {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}
          <label className="field">
            <span className="input-icon" aria-hidden="true">
            </span>
            <input
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={loading}
            />
          </label>
          <label className="field">
            <span className="input-icon" aria-hidden="true">
              
            </span>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </label>
          <label className="field">
            <span className="input-icon" aria-hidden="true">
              
            </span>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </label>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"} <span className="arrow">→</span>
          </button>
        </form>
        <p className="signup">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
