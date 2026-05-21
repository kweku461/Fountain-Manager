import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import "../styles/CreateMember.css";
import { apiCall } from "../utils/api";

const BASONTA_OPTIONS = [
  "Choir",
  "Ushers/Flowers",
  "Media(High Speed, Photography, Sound, Live Streaming, Content Creation)",
  "Film Stars",
  "Dancing Stars",
  "Light Bearers",
  "Christian Pop Stars",
];

export default function CreateMember() {
  const navigate = useNavigate();
  const location = useLocation();

  const editMember = location.state?.member || null;
  const isEditing = !!editMember;

  const [firstName, setFirstName] = useState(editMember?.firstName || "");
  const [lastName, setLastName] = useState(editMember?.lastName || "");
  const [email, setEmail] = useState(editMember?.email || "");
  const [address, setAddress] = useState(editMember?.address || "");
  const [phone, setPhone] = useState(editMember?.phone || "");
  const [birthdate, setBirthdate] = useState(editMember?.birthdate || "");
  const [basonta, setBasonta] = useState(editMember?.basonta || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    if (!firstName || !lastName || !email || !address || !phone) {
      setError("All fields are required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);

      const response = await apiCall(
        isEditing ? `/api/members/${editMember.id}` : "/api/members",
        {
          method: isEditing ? "PUT" : "POST",
          body: JSON.stringify({
            firstName,
            lastName,
            email,
            address,
            phone,
            birthdate: birthdate || null,
            basonta: basonta || null,
          }),
        }
      );

      if (!response.ok) {
        setError(response.error || `Failed to ${isEditing ? "update" : "create"} member`);
        return;
      }

      navigate("/members");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-member-page">
      {/* HEADER */}
      <div className="create-member-header">
        <button className="back-btn" onClick={() => navigate("/members")}>
          <ArrowLeft size={20} />
        </button>
        <h2>{isEditing ? "Edit Member" : "Create Member"}</h2>
      </div>

      {/* FORM */}
      <div className="create-member-form">
        {error && (
          <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>
        )}

        <input
          type="text"
          placeholder="First name...."
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          disabled={loading}
        />
        <input
          type="text"
          placeholder="Last name...."
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          disabled={loading}
        />
        <input
          type="email"
          placeholder="Email...."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <input
          type="text"
          placeholder="Address...."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={loading}
        />
        <input
          type="tel"
          placeholder="Phone...."
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={loading}
        />

        {/* BIRTHDATE */}
        <input
  type="text"
  placeholder="Birth date...."
  value={birthdate}
  onChange={(e) => setBirthdate(e.target.value)}
  onFocus={(e) => (e.target.type = "date")}
  onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
  disabled={loading}
  className="date-input"
/>

        {/* BASONTA */}
        <select
  value={basonta}
  onChange={(e) => setBasonta(e.target.value)}
  disabled={loading}
  className="basonta-select"
>
  <option value="">Select Basonta....</option>
  {BASONTA_OPTIONS.map((opt) => (
    <option key={opt} value={opt}>{opt}</option>
  ))}
</select>
      </div>

      {/* ACTION BUTTONS */}
      <div className="create-member-actions">
        <button
          className="cancel-btn"
          onClick={() => navigate("/members")}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          className="done-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading
            ? isEditing ? "Updating..." : "Creating..."
            : isEditing ? "Update Member" : "Done"}
        </button>
      </div>
    </div>
  );
}