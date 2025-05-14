import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const location = useLocation();
  const { isAuthenticated, logout, user, isLoading } = useAuth();

  const handleLogout = () => {
    logout();
    // Navigation to "/" is handled by AuthContext's logout method
  };

  if (isLoading) {
    return ( // Render a minimal navbar or nothing during auth loading
      <nav className="navbar navbar-expand-sm bg-body-tertiary">
        <div className="container-fluid">
          <span className="navbar-brand">E-Copilot</span>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar navbar-expand-sm bg-body-tertiary">
      <div className="container-fluid">
        <Link className="navbar-brand" to={isAuthenticated ? "/home" : "/"}>
          E-Copilot
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          {isAuthenticated ? (
            <>
              <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                <li className="nav-item">
                  <Link
                    className={`nav-link ${
                      location.pathname === "/home" ? "active" : ""
                    }`}
                    aria-current={location.pathname === "/home" ? "page" : undefined}
                    to="/home"
                  >
                    Chat
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className={`nav-link ${
                      location.pathname === "/dashboard" ? "active" : ""
                    }`}
                    aria-current={
                      location.pathname === "/dashboard" ? "page" : undefined
                    }
                    to="/dashboard"
                  >
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className={`nav-link ${
                      location.pathname === "/automations" ? "active" : ""
                    }`}
                    aria-current={
                      location.pathname === "/automations" ? "page" : undefined
                    }
                    to="/automations"
                  >
                    Automations
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className={`nav-link ${
                      location.pathname === "/settings" ? "active" : ""
                    }`}
                    aria-current={
                      location.pathname === "/settings" ? "page" : undefined
                    }
                    to="/settings"
                  >
                    Settings
                  </Link>
                </li>
              </ul>
              <ul className="navbar-nav">
                {user && (
                   <li className="nav-item">
                      <span className="navbar-text me-3">
                        Hi, {user.first_name}
                      </span>
                    </li>
                )}
                <li className="nav-item">
                  <button
                    className="btn btn-outline-primary"
                    type="button"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </>
          ) : (
            // Optionally, show something if user is not authenticated,
            // or an empty div to keep structure if navbar is always visible.
            // For now, an empty <div /> effectively hides nav items.
            <div />
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
