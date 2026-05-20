import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Calendar,
  Settings,
  User,
  Search,
  Phone,
  Building2,
  Mail,
  MoreHorizontal,
  Plus,
  X,
  ChevronLeft,
} from "lucide-react";
import QRCode from "react-qr-code";
import "../styles/FirstTimer.css";
import { API_URL } from "../App";

interface FirstTimer {
  id: number;
  fullName: string;
  phoneNumber: string;
  whatsappNumber: string;
  hostel: string;
  area: string;
  course: string;
  year: string;
  occupation: string;
  roomNumber: string;
  joinChurch: string;
  joinBasonta: string;
  knownPerson: string;
  visitDate: string;
}

export default function FirstTimers() {
  const navigate = useNavigate();
  const [firstTimers, setFirstTimers] = useState<FirstTimer[]>([]);
  const [search, setSearch] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<FirstTimer | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

const showToast = (message: string, type: "success" | "error") => {
  setToast({ message, type });
  setTimeout(() => setToast(null), 3000);
};
  const userEmail = localStorage.getItem("email") || "";
const REGISTER_URL = `${window.location.origin}/first-timers/register?ref=${encodeURIComponent(userEmail)}`;

  useEffect(() => {
    fetchFirstTimers();
  }, []);

  const fetchFirstTimers = async () => {
  try {
    const res = await fetch(`${API_URL}/api/first-timers`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!res.ok) {
      console.error("Server error:", res.status);
      setFirstTimers([]);
      return;
    }

    const data = await res.json();
    setFirstTimers(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("Failed to fetch first timers:", err);
    setFirstTimers([]);
  } finally {
    setLoading(false);
  }
};

  const handleDelete = async () => {
  if (!deleteConfirmId) return;
  try {
    await fetch(`${API_URL}/api/first-timers/${deleteConfirmId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setFirstTimers((prev) => prev.filter((ft) => ft.id !== deleteConfirmId));
    setDeleteConfirmId(null);
    showToast("First timer removed successfully", "success");
  } catch {
    showToast("Failed to delete.", "error");
  }
};

  const filtered = firstTimers.filter((ft) =>
    ft.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="ft-page">

      {/* HEADER CARD */}
      <div className="ft-header-card">
        <div className="ft-header-top">
          <button className="ft-back-btn" onClick={() => navigate(-1)}>
            <ChevronLeft size={20} />
          </button>
          <h2 className="ft-title">First Timers</h2>
          <div className="ft-dots-btn">
            <MoreHorizontal size={20} />
          </div>
        </div>

        <div className="ft-search-box">
          <Search size={16} color="#9aa0a6" />
          <input
            type="text"
            placeholder="Search first timers...."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* DELETE CONFIRMATION */}
{deleteConfirmId && (
  <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
    <div className="confirm-popup" onClick={(e) => e.stopPropagation()}>
      <p className="confirm-message">
        Are you sure you want to remove{" "}
        <strong>{deleteConfirmName}</strong>? This action cannot be undone.
      </p>
      <div className="confirm-actions">
        <button
          className="confirm-cancel-btn"
          onClick={() => setDeleteConfirmId(null)}
        >
          Cancel
        </button>
        <button
          className="confirm-delete-btn"
          onClick={handleDelete}
        >
          Remove
        </button>
      </div>
    </div>
  </div>
)}

{/* TOAST */}
{toast && (
  <div className={`toast ${toast.type}`}>
    {toast.message}
  </div>
)}
      </div>

      {/* CONTENT */}
      <div className="ft-content">

        {/* QR BUTTON */}
        <button className="qr-btn" onClick={() => setShowQR(true)}>
          Generate QR Code
        </button>

        {/* LIST */}
        {loading ? (
          <p className="ft-empty">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="ft-empty">No first timers found.</p>
        ) : (
          filtered.map((ft) => (
            <div
              key={ft.id}
              className="ft-card"
              onClick={() => {
                setSelectedPerson(ft);
                setOpenMenuId(null);
              }}
            >
              <div className="ft-card-top">
                <div className="ft-avatar">
                  {getInitials(ft.fullName)}
                </div>
                <div className="ft-card-info">
                  <p className="ft-name">{ft.fullName}</p>
                  <div className="ft-detail">
                    <Phone size={13} />
                    <span>{ft.phoneNumber}</span>
                  </div>
                  {ft.hostel && (
                    <div className="ft-detail">
                      <Building2 size={13} />
                      <span>{ft.hostel}</span>
                    </div>
                  )}
                  {ft.area && (
                    <div className="ft-detail">
                      <Mail size={13} />
                      <span>{ft.area}</span>
                    </div>
                  )}
                </div>

                {/* THREE DOTS MENU */}
                <div
                  className="ft-menu-wrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="ft-menu-btn"
                    onClick={() =>
                      setOpenMenuId(openMenuId === ft.id ? null : ft.id)
                    }
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {openMenuId === ft.id && (
                    <div className="ft-dropdown">
                      <button
                        onClick={() => {
                          setSelectedPerson(ft);
                          setOpenMenuId(null);
                        }}
                      >
                        View details
                      </button>
                      <button
                      className="danger"
                        onClick={() => {
    setDeleteConfirmId(ft.id);
    setDeleteConfirmName(ft.fullName);
    setOpenMenuId(null);
  }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* BOTTOM NAV */}
      <div className="bottom-nav">
        <div className="nav-item" onClick={() => navigate("/dashboard")}>
          <Home size={22} />
          <span>Home</span>
        </div>
        <div className="nav-item active">
          <User size={22} />
          <span>Profile</span>
        </div>
        <div className="nav-item">
          <Calendar size={22} />
          <span>Calendar</span>
        </div>
        <div className="nav-item" onClick={() => navigate("/settings")}>
          <Settings size={22} />
          <span>Settings</span>
        </div>
      </div>

      {/* FAB */}
      <button
        className="fab"
        onClick={() => navigate("/first-timers/register")}
      >
        <Plus size={24} color="#fff" />
      </button>

      {/* QR MODAL */}
      {showQR && (
        <div className="modal-overlay" onClick={() => setShowQR(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Scan to Register</h3>
              <button className="modal-close" onClick={() => setShowQR(false)}>
                <X size={20} />
              </button>
            </div>
            <p className="modal-subtitle">
              First timers scan this to fill their details
            </p>
            <div className="qr-wrapper">
              <QRCode value={REGISTER_URL} size={200} />
            </div>
            <p className="qr-url">{REGISTER_URL}</p>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedPerson && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedPerson(null)}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedPerson.fullName}</h3>
              <button
                className="modal-close"
                onClick={() => setSelectedPerson(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="detail-avatar">
              {getInitials(selectedPerson.fullName)}
            </div>

            <div className="detail-rows">
              {[
                { label: "Phone", value: selectedPerson.phoneNumber },
                { label: "WhatsApp", value: selectedPerson.whatsappNumber },
                { label: "Course", value: selectedPerson.course },
                { label: "Year", value: selectedPerson.year },
                { label: "Occupation", value: selectedPerson.occupation },
                { label: "Area", value: selectedPerson.area },
                { label: "Hostel", value: selectedPerson.hostel },
                { label: "Room", value: selectedPerson.roomNumber },
                { label: "Join church?", value: selectedPerson.joinChurch },
                { label: "Join basonta?", value: selectedPerson.joinBasonta },
                { label: "Knows in church", value: selectedPerson.knownPerson },
                { label: "Visit date", value: selectedPerson.visitDate },
              ]
                .filter((row) => row.value)
                .map((row) => (
                  <div className="detail-row" key={row.label}>
                    <span className="detail-label">{row.label}</span>
                    <span className="detail-value">{row.value}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}