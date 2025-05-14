import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Optional: Show a loading spinner or a blank page while checking auth
    return <div>Loading authentication status...</div>;
  }

  if (!isAuthenticated) {
    // Redirect them to the /login page (which is path="/")
    // Save the current location they were trying to go to when they were redirected.
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Outlet />; // Render the child route component (e.g., Dashboard, Home, etc.)
};

export default ProtectedRoute;
