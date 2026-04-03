import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState("seeker");

  function handleLogin(userRole = "seeker") {
    setIsLoggedIn(true);
    setRole(userRole);
  }

  function handleLogout() {
    setIsLoggedIn(false);
    setRole("seeker");
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
