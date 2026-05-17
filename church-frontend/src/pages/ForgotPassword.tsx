import { Mail } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../assets/Logo.png";
import "../styles/ForgotPassword.css";
import { apiCall } from "../utils/api";

type Step = "email" | "otp";

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>("email");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Step 1: Send OTP to email
  const handleConfirmEmail = async () => {
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const response = await apiCall<string>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        skipAuth: true,
      });

      if (!response.ok) {
        setError(response.error || "Email not found. Please try again.");
        return;
      }

      setStep("otp");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    setError("");

    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit OTP sent to your email");
      return;
    }

    setLoading(true);

    try {
      const response = await apiCall<string>("/auth/verify-reset-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
        skipAuth: true,
      });

      if (!response.ok) {
        setError(response.error || "Invalid or expired OTP. Please try again.");
        return;
      }

      // Pass email to reset password page
      navigate("/reset-password", { state: { email } });
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setOtp("");
    setLoading(true);

    try {
      const response = await apiCall<string>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        skipAuth: true,
      });

      if (!response.ok) {
        setError(response.error || "Failed to resend OTP. Please try again.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-card">
        {/* Back button — absolutely positioned top-left */}
        <button className="back-btn" onClick={() => step === "otp" ? setStep("email") : navigate("/login")}>
          &#8592;
        </button>

        {/* Spacer so content clears the back button */}
        <div style={{ height: "40px" }} />

        {/* Logo */}
        <div className="logo-wrapper">
          <img src={Logo} alt="Church Logo" />
        </div>

        {step === "email" ? (
          <>
            <h1 className="forgot-title">Forgot Password?</h1>
            <p className="forgot-subtitle">
              Please write your email to receive a confirmation code to set a new password
            </p>

            <div className="field">
              <label className="bold-label">Email</label>
              <div className="input-wrapper">
                <Mail size={20} />
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  onKeyDown={(e) => e.key === "Enter" && handleConfirmEmail()}
                />
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              className="primary-btn"
              onClick={handleConfirmEmail}
              disabled={loading}
            >
              {loading ? "Sending..." : "Confirm Email"}
            </button>

            <p className="footer">
              Remembered Password? <Link to="/login">Login</Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="forgot-title">Enter OTP</h1>
            <p className="forgot-subtitle">
              A 6-digit code has been sent to <strong>{email}</strong>
            </p>

            <div className="field">
              <label className="bold-label">OTP Code</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  inputMode="numeric"
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                />
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              className="primary-btn"
              onClick={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <p className="footer">
              Didn't receive a code?{" "}
              <button
                className="link-btn"
                onClick={handleResendOtp}
                disabled={loading}
              >
                Resend OTP
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}