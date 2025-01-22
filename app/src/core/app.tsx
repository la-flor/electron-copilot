import "../styles/bootstrap-overrides.scss";

import { BrowserRouter, Routes, Route } from "react-router";
import { createRoot } from "react-dom/client";
import Home from "../pages/home";
import "./app.scss";
import Navbar from "../components/navbar";
import useTheme from "../hooks/useTheme";

const root = createRoot(document.body);

const App = () => {
  useTheme();

  return (
    <BrowserRouter>
      <main>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
        <footer>
          <a href="#">Github</a>
        </footer>
      </main>
    </BrowserRouter>
  );
};

root.render(<App />);
