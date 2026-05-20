import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import "../styles/VerifyEmail.css";
import { API_URL } from "../App";

const OTP_EXPIRY_SECONDS = 600; // 10 minutes

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [timeLeft, setTimeLeft] = useState(OTP_EXPIRY_SECONDS);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // Redirect if accessed directly
  useEffect(() => {
    if (!email) navigate("/register");
  }, [email, navigate]);

  // ⏱ Timer logic
  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  if (!email) return null;

  // Format MM:SS
  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // OTP input handler
  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  // Verify OTP
  const handleVerify = async () => {
    const code = otp.join("");

    if (code.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_URL}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    try {
      setResending(true);
      setError("");

      const res = await fetch(`${API_URL}/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      // Reset timer + clear inputs
      setTimeLeft(OTP_EXPIRY_SECONDS);
      setOtp(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
    } catch {
      setError("Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="verify-page">
      {/* Back button */}
      <button className="back-btn" onClick={() => navigate(-1)}>
        ←
      </button>

      <h1 className="verify-title">Verify Code</h1>

      <p className="verify-text">
        Please enter the code we just sent to <br />
        <span className="verify-email">{email}</span>
      </p>

      {/* Spam notice */}
      <div className="spam-notice">
        <span>📧</span>
        <p>Can't find the email? Check your <strong>spam</strong> or <strong>junk</strong> folder.</p>
      </div>

      {/* OTP Boxes */}
      <div className="otp-boxes">
        {otp.map((digit, i) => (
          <input
            key={i}
              ref={(el) => { inputsRef.current[i] = el; }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e.target.value, i)}
            autoFocus={i === 0}
            />
        ))}
      </div>

      {/* Timer */}
      {timeLeft > 0 ? (
        <p className="timer-text">Code expires in {formatTime()}</p>
      ) : (
        <p className="timer-text expired-text">Code expired</p>
      )}

      {error && <p className="error-text">{error}</p>}

      {/* Resend — always show, disable only while resending */}
      <p className="resend-text">
        Didn't receive OTP?{" "}
        <button
          className="resend-link"
          onClick={handleResend}
          disabled={resending}
        >
          {resending ? "Resending..." : "Resend code"}
        </button>
      </p>

      {/* Verify Button */}
      <button
        className="verify-btn"
        onClick={handleVerify}
        disabled={loading}
      >
        {loading ? "Verifying..." : "Verify"}
      </button>
    </div>
  );
}