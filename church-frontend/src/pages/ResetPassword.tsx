import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "../assets/Logo.png";
import "../styles/ResetPassword.css";
import { apiCall } from "../utils/api";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Email was passed via navigate state from ForgotPassword
  const email = location.state?.email as string | undefined;

  // Redirect back if no email in state (e.g. direct URL access)
  if (!email) {
    navigate("/forgot-password");
    return null;
  }

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return "Password must be at least 8 characters";
    return null;
  };

  const handleSubmit = async () => {
    setError("");

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await apiCall<string>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, newPassword }),
        skipAuth: true,
      });

      if (!response.ok) {
        setError(response.error || "Failed to reset password. Please try again.");
        return;
      }

      // Success — go back to login
      navigate("/login", {
        state: { message: "Password reset successful! Please log in." },
      });
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-page">
      <div className="reset-card">

        {/* Back button — pinned to top-left corner */}
        <button className="back-btn" onClick={() => navigate("/forgot-password")}>
          &#8592;
        </button>

        {/* Logo — margin-top in CSS clears the back button */}
        <div className="logo-wrapper">
          <img src={Logo} alt="Church Logo" />
        </div>

        <h1 className="reset-title">Reset Password</h1>
        <p className="reset-subtitle">Please set a new unique password</p>

        {/* New Password */}
        <div className="field">
          <label className="bold-label">New Password</label>
          <div className="input-wrapper">
            <input
              type={showNewPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
            <span
              className="toggle-password"
              onClick={() => setShowNewPassword(!showNewPassword)}
              role="button"
              tabIndex={0}
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="field">
          <label className="bold-label">Confirm password</label>
          <div className="input-wrapper">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <span
              className="toggle-password"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              role="button"
              tabIndex={0}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          className="primary-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit New Password"}
        </button>

      </div>
    </div>
  );
}