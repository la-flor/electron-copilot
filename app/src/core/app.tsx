import "../styles/bootstrap-overrides.scss";

import { BrowserRouter, Routes, Route } from "react-router";
import { createRoot } from "react-dom/client";
import Home from "../pages/home";
import "./app.scss";
import Navbar from "../components/Navbar";
import useTheme from "../hooks/useTheme";
import Dashboard from "../pages/dashboard";
import { Automations } from "../pages/automations";
import { Settings } from "../pages/settings";

const root = createRoot(document.body);

const App = () => {
  useTheme();

  return (
    <BrowserRouter>
      <main>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/automations" element={<Automations />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <footer>
          <a href="#">Github</a>
        </footer>
      </main>
    </BrowserRouter>
  );
};

root.render(<App />);
