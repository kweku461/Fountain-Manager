import { ArrowLeft, Calendar } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import "../styles/CreateService.css";
import { apiCall } from "../utils/api";

export default function CreateService() {
  const navigate = useNavigate();
  const location = useLocation();

  const editService = location.state?.service || null;
  const isEditing = !!editService;

  // Pre-fill date from startTime if editing
  const getDateFromISO = (iso: string) => {
    if (!iso) return "";
    return new Date(iso).toISOString().split("T")[0];
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState(editService?.title || "");
  const [sermonTitle, setSermonTitle] = useState(editService?.description || "");
  const [preacher, setPreacher] = useState(editService?.preacher || "");
  const [date, setDate] = useState(getDateFromISO(editService?.startTime || ""));
  const [description, setDescription] = useState(editService?.location || "");

  const handleSubmit = async () => {
    setError("");

    if (!title || !sermonTitle || !preacher || !date) {
      setError("All fields are required");
      return;
    }

    try {
      setLoading(true);

      const serviceDate = new Date(date);
      if (isNaN(serviceDate.getTime())) {
        setError("Please enter a valid date");
        return;
      }

      const startTime = serviceDate.toISOString();
      const endTime = new Date(
        serviceDate.getTime() + 2 * 60 * 60 * 1000
      ).toISOString();

      const response = await apiCall(
        isEditing ? `/services/update/${editService.id}` : "/services/create",
        {
          method: isEditing ? "PUT" : "POST",
          body: JSON.stringify({
            title,
            description: sermonTitle,
            location: description,
            startTime,
            endTime,
            preacher,
          }),
        }
      );

      if (!response.ok) {
        setError(response.error || `Failed to ${isEditing ? "update" : "create"} service`);
        return;
      }

      navigate("/services");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-service-page">
      {/* HEADER */}
      <div className="create-service-header">
        <div className="icon-circle" onClick={() => navigate("/services")}>
          <ArrowLeft size={20} />
        </div>
        <h2>{isEditing ? "Edit Service" : "Create Service"}</h2>
      </div>

      {/* FORM */}
      <div className="create-service-form">
        {error && (
          <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>
        )}

        <input
          type="text"
          placeholder="Name of Service...."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
        />
        <input
          type="text"
          placeholder="Title of Sermon...."
          value={sermonTitle}
          onChange={(e) => setSermonTitle(e.target.value)}
          disabled={loading}
        />
        <input
          type="text"
          placeholder="Preacher"
          value={preacher}
          onChange={(e) => setPreacher(e.target.value)}
          disabled={loading}
        />

        <div className="date-input">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={loading}
          />
          <Calendar size={18} />
        </div>

        <input
          type="text"
          placeholder="Location (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />

        <div className="form-actions">
          <button
            className="btn cancel"
            onClick={() => navigate("/services")}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn done"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? isEditing ? "Updating..." : "Creating..."
              : isEditing ? "Update Service" : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}