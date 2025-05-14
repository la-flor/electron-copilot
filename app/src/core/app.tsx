import "../styles/bootstrap-overrides.scss";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { createRoot } from "react-dom/client";
import Home from "../pages/home";
import "./app.scss";
import Navbar from "../components/Navbar";
import useTheme from "../hooks/useTheme";
import Dashboard from "../pages/dashboard";
import { Automations } from "../pages/automations";
import { Settings } from "../pages/settings";
import LoginPage from "../pages/LoginPage";
import { AuthProvider } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";

const root = createRoot(document.body);

// AppWrapper to ensure AuthProvider is within BrowserRouter
const AppWrapper = () => {
  useTheme();
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
}

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
