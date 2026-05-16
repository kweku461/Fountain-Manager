import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import Logo from "../assets/logo.png";
import "../styles/Login.css";
import { Link, useNavigate } from "react-router-dom";
import { apiCall } from "../utils/api";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    setError("");

    // Frontend validation
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const response = await apiCall<{ token: string; email: string; role: string }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
          skipAuth: true, // Login doesn't need authentication
        }
      );

      if (!response.ok) {
        setError(response.error || "Invalid email or password");
        return;
      }

      if (response.data) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("email", response.data.email);
        localStorage.setItem("role", response.data.role);
        navigate("/dashboard");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="logo-wrapper">
          <img src={Logo} alt="Church Logo" />
        </div>

        {/* Subtitle */}
        <p className="subtitle">
          Welcome back. Please enter your details to access the dashboard
        </p>

        {/* Email */}
        <div className="field">
          <label className="bold-label">Email</label>
          <div className="input-wrapper">
            <Mail size={20} />
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password */}
        <div className="field">
          <label className="bold-label">Password</label>
          <div className="input-wrapper">
            <Lock size={20} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              role="button"
              tabIndex={0}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>
        </div>

        {/* Error message */}
        {error && <div className="error-message">{error}</div>}

        {/* Forgot password */}
        <div className="forgot">
          <a href="/forgot-password">Forgot Password?</a>
        </div>

        {/* Button */}
        <button 
          className="login-btn" 
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Footer */}
        <p className="footer">
          New user? <Link to="/register">Register account</Link>
        </p>
      </div>
    </div>
  );
}
