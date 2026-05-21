import { useState } from "react";
import "../styles/FirstTimerRegister.css";
import { API_URL } from "../App";

const initialState = {
  fullName: "",
  course: "",
  year: "",
  occupation: "",
  phoneNumber: "",
  whatsappNumber: "",
  area: "",
  hostel: "",
  roomNumber: "",
  joinChurch: "",
  joinBasonta: "",
  basontaChoice: "",
  knownPerson: "",
};

const BASONTA_OPTIONS = [
  { label: "Choir", emoji: "🎵" },
  { label: "Film Stars", emoji: "🎬" },
  { label: "Dancing Stars", emoji: "💃" },
  { label: "Light Bearers", emoji: "🎤" },
  { label: "Christian Pop Stars", emoji: "🎶" },
  { label: "Ushers / Flowers", emoji: "🌸" },
  { label: "Media", emoji: "📸" },
  { label: "Other", emoji: "✨" },
];

export default function FirstTimerRegister() {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

 const handleSubmit = async () => {
    if (!form.fullName || !form.phoneNumber) {
      alert("Please fill in your name and phone number.");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    const token = localStorage.getItem("token");

    // If logged in user is creating → use authenticated endpoint
    // If QR code scan → use public endpoint with ref param
    const isAuthenticated = !!token && !ref;

    setLoading(true);
    try {
      const res = await fetch(
        isAuthenticated
          ? `${API_URL}/api/first-timers`
          : `${API_URL}/api/first-timers/public`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(isAuthenticated && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(
            isAuthenticated
              ? form  // backend reads createdBy from token
              : { ...form, createdBy: ref }  // public path uses ref
          ),
        }
      );
      if (res.ok) {
        setSubmitted(true);
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch (err) {
      alert("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="register-page">
        <div className="success-screen">
          <div className="success-icon">✓</div>
          <h2>Thank you!</h2>
          <p>We're so glad you joined us today. See you next Sunday!</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header card */}
      <div className="register-header-card">
        <h2 className="register-header-title">FIRST - TIMERS FORM</h2>
        <h3 className="register-header-church">Welcome to RSC - Fountain of Life Cathedral Bomso Town Church🤍 </h3>
        
        <p className="register-subtitle">
          We are delighted to have you worship with us! This form helps us collect
    relevant details so our pastors and leadership can check up on you,
    support your spiritual growth, and stay connected with you from time to time.
  </p>
  <p className="register-subtitle register-note">
    Kindly fill in all the sections that apply to you.{" "}
    <em>Your information will be treated with care and used solely for follow-up and pastoral support.</em>
  </p>
</div>

      <div className="register-content">
        <p className="section-label">Personal info</p>
        <div className="form-card">
          <div className="field-group">
            <label>Full name *</label>
            <input
              type="text"
              placeholder="e.g. Kofi Mensah"
              value={form.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
            />
          </div>
          <div className="two-col">
            <div className="field-group">
              <label>Course</label>
              <input
                type="text"
                placeholder="e.g. BSc CS"
                value={form.course}
                onChange={(e) => handleChange("course", e.target.value)}
              />
            </div>
            <div className="field-group">
              <label>Year</label>
              <input
                type="text"
                placeholder="e.g. 2"
                value={form.year}
                onChange={(e) => handleChange("year", e.target.value)}
              />
            </div>
          </div>
          <div className="field-group">
            <label>Occupation / work</label>
            <input
              type="text"
              placeholder="e.g. Student / Teacher"
              value={form.occupation}
              onChange={(e) => handleChange("occupation", e.target.value)}
            />
          </div>
        </div>

        <p className="section-label">Contact</p>
        <div className="form-card">
          <div className="field-group">
            <label>Phone number *</label>
            <input
              type="tel"
              placeholder="0XX XXX XXXX"
              value={form.phoneNumber}
              onChange={(e) => handleChange("phoneNumber", e.target.value)}
            />
          </div>
          <div className="field-group">
            <label>WhatsApp number</label>
            <input
              type="tel"
              placeholder="0XX XXX XXXX"
              value={form.whatsappNumber}
              onChange={(e) => handleChange("whatsappNumber", e.target.value)}
            />
          </div>
        </div>

        <p className="section-label">Location</p>
        <div className="form-card">
          <div className="field-group">
            <label>Area</label>
            <input
              type="text"
              placeholder="e.g. Ayeduase"
              value={form.area}
              onChange={(e) => handleChange("area", e.target.value)}
            />
          </div>
          <div className="field-group">
            <label>Hostel</label>
            <input
              type="text"
              placeholder="e.g. Unity Hall"
              value={form.hostel}
              onChange={(e) => handleChange("hostel", e.target.value)}
            />
          </div>
          <div className="field-group">
            <label>Room number</label>
            <input
              type="text"
              placeholder="e.g. A204"
              value={form.roomNumber}
              onChange={(e) => handleChange("roomNumber", e.target.value)}
            />
          </div>
        </div>

        <p className="section-label">Church interest</p>
        <div className="form-card">
          <div className="field-group">
            <label>Would you like to join the church?</label>
            <div className="choice-row">
              {["Yes", "No", "Maybe"].map((opt) => (
                <button
                  key={opt}
                  className={`choice-btn ${form.joinChurch === opt ? "selected" : ""}`}
                  onClick={() => handleChange("joinChurch", opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          
          <div className="field-group">
  <label>Would you like to join a basonta?</label>
  <div className="choice-row">
    {["Yes", "No", "Maybe"].map((opt) => (
      <button
        key={opt}
        className={`choice-btn ${form.joinBasonta === opt ? "selected" : ""}`}
        onClick={() => {
          handleChange("joinBasonta", opt);
          if (opt !== "Yes") handleChange("basontaChoice", "");
        }}
      >
        {opt}
      </button>
    ))}
  </div>
</div>

{/* Basonta picker — only shows when Yes is selected */}
{form.joinBasonta === "Yes" && (
  <div className="field-group">
    <label>Which basonta would you like to join?</label>
    <div className="basonta-grid">
      {BASONTA_OPTIONS.map((opt) => (
        <button
          key={opt.label}
          className={`basonta-tile ${form.basontaChoice === opt.label ? "selected" : ""}`}
          onClick={() => handleChange("basontaChoice", opt.label)}
        >
          <span className="basonta-emoji">{opt.emoji}</span>
          <span className="basonta-label">{opt.label}</span>
        </button>
      ))}
    </div>
  </div>
)}

          <div className="field-group">
            <label>Who do you know in the church?</label>
            <input
              type="text"
              placeholder="Name of person(s)"
              value={form.knownPerson}
              onChange={(e) => handleChange("knownPerson", e.target.value)}
            />
          </div>
        </div>

        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </div>
    </>
  );
}