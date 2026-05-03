import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import { tokenAPI } from "./services/api";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState("seeker");
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in (has token)
  useEffect(() => {
    const token = tokenAPI.getAccessToken();
    if (token) {
      // User has a token, consider them logged in
      const savedRole = localStorage.getItem("userRole") || "seeker";
      setIsLoggedIn(true);
      setRole(savedRole);
    }
    setLoading(false);
  }, []);

  function handleLogin(userRole = "seeker") {
    setIsLoggedIn(true);
    setRole(userRole);
    localStorage.setItem("userRole", userRole);
  }

  function handleLogout() {
    tokenAPI.clearTokens();
    localStorage.removeItem("userRole");
    setIsLoggedIn(false);
    setRole("seeker");
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/signup" element={<SignUp onLogin={handleLogin} />} />
        <Route
          path={`/dashboard/${role}/*`}
          element={
            isLoggedIn ? (
              <Dashboard role={role} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="*"
          element={
            <Navigate
              to={isLoggedIn ? `/dashboard/${role}` : "/login"}
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
