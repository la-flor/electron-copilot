import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./login-page.scss";
import { useAuth } from "../context/AuthContext";
    
const LoginPage: React.FC = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState("john.doe@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/home";

  useEffect(() => {
    // If already authenticated and not loading, redirect from login page
    if (isAuthenticated && !isLoading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, from]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      const result = await window.db.user.loginUser({ email, password });
      if (result.success && result.user) {
        console.log("Login successful", result.user);
        login(result.user); // Update auth context
        // Navigation is handled by the useEffect or will happen if 'from' is set
        // navigate(from, { replace: true }); // This line is now handled by useEffect
      } else {
        setError(
          result.message || "Login failed. Please check your credentials."
        );
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred during login.");
    }
  };

  // Don't render the form if we are still checking auth or already authenticated and about to redirect
  if (isLoading || isAuthenticated) {
    return <div>Loading...</div>; // Or some other placeholder
  }

  return (
    <div className="login-page-container">
      <div className="login-form-card">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group mb-3">
            <label htmlFor="email">Email address</label>
            <input
              type="email"
              className="form-control"
              id="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group mb-3">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              className="form-control"
              id="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          <button type="submit" className="btn btn-primary w-100">
            Login
          </button>
        </form>
        {/* Optional: Add link to registration page or password recovery */}
        {/* <div className="mt-3 text-center">
          <p>Don't have an account? <a href="/register">Sign Up</a></p>
        </div> */}
      </div>
    </div>
  );
};

export default LoginPage;
