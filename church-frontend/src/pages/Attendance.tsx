import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home, Calendar, Settings,
  Search, MoreHorizontal, Plus, 
  Clock, Users, X,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { API_URL } from "../App";
import "../styles/Attendance.css";

interface ServiceRecord {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  preacher: string;
}

interface AttendanceSummary {
  service: ServiceRecord;
  presentCount: number;
  attendanceRecords: any[];
  checkInTime: string;
}

export default function Attendance() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [summaries, setSummaries] = useState<AttendanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<AttendanceSummary | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const token = localStorage.getItem("token");
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch(`${API_URL}/services`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      const serviceList: ServiceRecord[] = Array.isArray(data) ? data : [];

      const summaryList = await Promise.all(
        serviceList.map(async (s: ServiceRecord) => {
          try {
            const aRes = await fetch(`${API_URL}/attendance/service/${s.id}`, { headers });
            const aData = aRes.ok ? await aRes.json() : [];
            const records = Array.isArray(aData) ? aData : [];
            const presentCount = records.filter((a: any) => a.status === "Present").length;
            const checkInTime = records[0]?.checkInTime ?? s.startTime;
            return { service: s, presentCount, attendanceRecords: records, checkInTime };
          } catch {
            return { service: s, presentCount: 0, attendanceRecords: [], checkInTime: s.startTime };
          }
        })
      );

      setSummaries(summaryList.filter((s) => s.attendanceRecords.length > 0));
    } catch (err) {
      console.error("Failed to fetch services:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await fetch(`${API_URL}/attendance/service/${deleteConfirmId}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        setSummaries((prev) => prev.filter((s) => s.service.id !== deleteConfirmId));
        setDeleteConfirmId(null);
        showToast("Attendance deleted successfully", "success");
      } else {
        showToast("Failed to delete attendance records.", "error");
      }
    } catch {
      showToast("Failed to delete attendance records.", "error");
    }
  };

  const filtered = summaries.filter((s) =>
    (s.service?.title ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "short",
    });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit", minute: "2-digit",
    });
  };

  const getInitials = (name: string) =>
    name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  return (
    <div
      className="att-page"
      onClick={() => {
        if (openMenuId !== null) setOpenMenuId(null);
      }}
    >
      {/* HEADER */}
      <div className="att-header-card">
        <div className="att-header-top">
          <button className="att-back-btn" onClick={() => navigate("/dashboard")}>
              <ArrowLeft size={20} />
          </button>
          <h2 className="att-title">Attendance</h2>
          <div className="att-dots-btn">
            <MoreHorizontal size={20} />
          </div>
        </div>
        <div className="att-search-box">
          <Search size={16} color="#9aa0a6" />
          <input
            type="text"
            placeholder="Search attendance....."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* CONTENT */}
      <div className="att-content">
        {loading ? (
          <p className="att-empty">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="att-empty">No attendance records found.</p>
        ) : (
          filtered.map(({ service, presentCount, attendanceRecords, checkInTime }) => (
            <div
              key={service.id}
              className="att-card"
              onClick={() => {
                if (openMenuId === null) {
                  navigate(`/attendance/mark/${service.id}`);
                }
              }}
            >
              <div className="att-card-header">
                <h4 className="att-card-title">
                  {service?.title ?? "Unnamed Service"}
                </h4>

                {/* THREE DOTS MENU */}
                <div
                  className="att-menu-wrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="att-menu-btn"
                    onClick={() =>
                      setOpenMenuId(openMenuId === service.id ? null : service.id)
                    }
                  >
                    <MoreHorizontal size={18} color="#9aa0a6" />
                  </button>
                  {openMenuId === service.id && (
                    <div className="att-dropdown">
                      <button
                        onClick={() => {
                          setSelectedSummary({ service, presentCount, attendanceRecords, checkInTime });
                          setOpenMenuId(null);
                        }}
                      >
                        View details
                      </button>
                      <button
                        onClick={() => {
                          navigate(`/attendance/mark/${service.id}`);
                          setOpenMenuId(null);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="danger"
                        onClick={() => {
                          setDeleteConfirmId(service.id);
                          setOpenMenuId(null);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="att-card-detail">
                <Calendar size={13} />
                <span>{formatDate(checkInTime)}</span>
              </div>
              <div className="att-card-detail">
                <Clock size={13} />
                <span>{formatTime(checkInTime)}</span>
              </div>
              <div className="att-card-detail">
                <Users size={13} />
                <span>{presentCount} members present</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* BOTTOM NAV */}
      <div className="bottom-nav">
        <div className="nav-item" onClick={() => navigate("/dashboard")}>
          <Home size={22} /><span>Home</span>
        </div>
        <div className="nav-item active">
          <CheckCircle size={22} /><span>Attendance</span>
        </div>
        <div className="nav-item" onClick={() => navigate("/calendar")}>
          <Calendar size={22} /><span>Calendar</span>
        </div>
        <div className="nav-item" onClick={() => navigate("/settings")}>
          <Settings size={22} /><span>Settings</span>
        </div>
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => navigate("/attendance/mark")}>
        <Plus size={24} color="#fff" />
      </button>

      {/* DETAIL MODAL */}
      {selectedSummary && (
        <div className="modal-overlay bottom" onClick={() => setSelectedSummary(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedSummary.service.title}</h3>
              <button className="modal-close" onClick={() => setSelectedSummary(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="detail-rows">
              <div className="detail-row">
                <span className="detail-label">Date</span>
                <span className="detail-value">{formatDate(selectedSummary.checkInTime)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Time</span>
                <span className="detail-value">{formatTime(selectedSummary.checkInTime)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Location</span>
                <span className="detail-value">{selectedSummary.service.location || "—"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Preacher</span>
                <span className="detail-value">{selectedSummary.service.preacher || "—"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Present</span>
                <span className="detail-value">{selectedSummary.presentCount}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Total</span>
                <span className="detail-value">{selectedSummary.attendanceRecords.length}</span>
              </div>
            </div>

            {/* MEMBER LIST */}
            <div className="modal-member-list">
              {selectedSummary.attendanceRecords.map((record: any) => (
                <div key={record.id} className="modal-member-row">
                  <div className="modal-member-avatar">
                    {getInitials(
                      `${record.member?.firstName ?? ""} ${record.member?.lastName ?? ""}`
                    )}
                  </div>
                  <span className="modal-member-name">
                    {record.member?.firstName} {record.member?.lastName}
                  </span>
                  <span className={`modal-member-status ${record.status === "Present" ? "present" : "absent"}`}>
                    {record.status}
                  </span>
                </div>
              ))}
            </div>

            {/* EDIT BUTTON */}
            <button
              className="modal-edit-btn"
              onClick={() => {
                navigate(`/attendance/mark/${selectedSummary.service.id}`);
                setSelectedSummary(null);
              }}
            >
              Edit Attendance
            </button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="confirm-popup" onClick={(e) => e.stopPropagation()}>
            <p className="confirm-message">
              Are you sure you want to delete all attendance records for this service? This action cannot be undone.
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
                Delete
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
  );
}