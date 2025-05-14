import React from "react";

const LoginPage = () => {
  return <div>LoginPage</div>;
};

export default LoginPage;
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.scss"; // We'll create this for styling

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
        // Store user session/token if needed, e.g., in context or localStorage
        // For now, just navigate to dashboard
        navigate("/dashboard");
      } else {
        setError(result.message || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred during login.");
    }
  };

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
