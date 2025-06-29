import "../styles/bootstrap-overrides.scss";

import { useContext } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { createRoot } from "react-dom/client";
import Home from "../pages/Home";
import "./app.scss";
import Navbar from "../components/Navbar";
import useTheme from "../hooks/useTheme";
import Dashboard from "../pages/Dashboard";
import { Automations } from "../pages/Automations";
import { Settings } from "../pages/Settings";
import LoginPage from "../pages/LoginPage";
import { AuthProvider, AuthContext } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";

const root = createRoot(document.body);

// AppWrapper to ensure AuthProvider is within BrowserRouter
const AppWrapper = () => {
  const { user } = useContext(AuthContext);
  useTheme(user);
  return (
    <main>
      <Navbar />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/automations" element={<Automations />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
      <footer>
        <a href="#">Github</a>
      </footer>
    </main>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppWrapper />
      </AuthProvider>
    </BrowserRouter>
  );
};

root.render(<App />);
