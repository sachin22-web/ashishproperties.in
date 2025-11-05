import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import LoginPage from "./pages/Login";
import PrivateRoute from "./routes/PrivateRoute";

function Dashboard() {
  return <div className="p-6">Dashboard (protected)</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <nav className="p-4 border-b">
        <Link to="/">Home</Link> | <Link to="/login">Login</Link> |{" "}
        <Link to="/dashboard">Dashboard</Link>
      </nav>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div className="p-6">Home</div>} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
