import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import { tokenAPI, profileAPI } from "./services/api";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState("seeker");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in (has token)
  useEffect(() => {
    const token = tokenAPI.getAccessToken();
    if (token) {
      // User has a token, consider them logged in
      const savedRole = localStorage.getItem("userRole") || "seeker";
      const savedUser = localStorage.getItem("currentUser");
      setIsLoggedIn(true);
      setRole(savedRole);
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch {
          setCurrentUser(null);
        }
      }
    }
    setLoading(false);
  }, []);

  function handleLogin(userRole = "seeker", user = null) {
    setIsLoggedIn(true);
    setRole(userRole);
    setCurrentUser(user);
    localStorage.setItem("userRole", userRole);
    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user));
    }
  }

  function handleLogout() {
    tokenAPI.clearTokens();
    localStorage.removeItem("userRole");
    localStorage.removeItem("currentUser");
    // Clear cached profile data when logging out
    try { profileAPI.clearCache(); } catch (e) {}
    setIsLoggedIn(false);
    setRole("seeker");
    setCurrentUser(null);
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
              <Dashboard role={role} currentUser={currentUser} onLogout={handleLogout} />
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
