import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Home, Calendar, Settings, User,
  Search, ChevronLeft, MoreHorizontal, CheckCircle,
} from "lucide-react";
import { API_URL } from "../App";
import "../styles/Attendance.css";

interface Member {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
  profileImage?: string;
}

interface ServiceRecord {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  preacher: string;
}

interface AttendanceMap {
  [memberId: number]: "Present" | "Absent" | "";
}

export default function AttendanceMark() {
  const navigate = useNavigate();
  const { serviceId } = useParams();

  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(serviceId || "");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<AttendanceMap>({});
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const token = localStorage.getItem("token");
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  useEffect(() => {
    fetchServices();
    fetchMembers();
  }, []);

  useEffect(() => {
    if (selectedServiceId) {
      fetchExistingAttendance(Number(selectedServiceId));
    } else {
      // Reset when no service selected
      setIsEditing(false);
      setSelectedDate("");
      setSelectedTime("");
    }
  }, [selectedServiceId]);

  const fetchServices = async () => {
    try {
      const res = await fetch(`${API_URL}/services`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      const serviceList: ServiceRecord[] = Array.isArray(data) ? data : [];
      setServices(serviceList);
    } catch (err) {
      console.error("Failed to fetch services:", err);
    }
  };

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await fetch(`${API_URL}/api/members`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setMembers(list);
      const initial: AttendanceMap = {};
      list.forEach((m: Member) => { initial[m.id] = ""; });
      setAttendance(initial);
    } catch (err) {
      console.error("Failed to fetch members:", err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchExistingAttendance = async (svcId: number) => {
    try {
      const res = await fetch(`${API_URL}/attendance/service/${svcId}`, { headers });
      if (!res.ok) return;
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        // No existing records — fresh attendance
        setIsEditing(false);
        setSelectedDate("");
        setSelectedTime("");
        // Reset all members to unselected
        setAttendance((prev) => {
          const reset: AttendanceMap = {};
          Object.keys(prev).forEach((id) => { reset[Number(id)] = ""; });
          return reset;
        });
        return;
      }

      // Existing records found — this is an edit
      setIsEditing(true);

      const existing: AttendanceMap = {};
      data.forEach((record: any) => {
        if (record.member?.id) {
          existing[record.member.id] = record.status as "Present" | "Absent";
        }
      });
      setAttendance((prev) => ({ ...prev, ...existing }));

      // Pre-fill date and time from existing checkInTime
      if (data[0]?.checkInTime) {
        const dt = new Date(data[0].checkInTime);
        setSelectedDate(dt.toISOString().split("T")[0]);
        setSelectedTime(dt.toTimeString().slice(0, 5));
      }
    } catch (err) {
      console.error("Failed to fetch existing attendance:", err);
    }
  };

  const toggleStatus = (memberId: number, status: "Present" | "Absent") => {
    setAttendance((prev) => ({ ...prev, [memberId]: status }));
  };

  const markAllPresent = () => {
    const updated: AttendanceMap = {};
    members.forEach((m) => { updated[m.id] = "Present"; });
    setAttendance(updated);
  };

  const handleSave = async () => {
    if (!selectedServiceId) {
      alert("Please select a service.");
      return;
    }
    if (!selectedDate) {
      alert("Please select a date.");
      return;
    }
    if (!selectedTime) {
      alert("Please select a time.");
      return;
    }

    const checkInTime = `${selectedDate}T${selectedTime}:00`;

    setSaving(true);
    try {
      if (isEditing) {
        // PUT — update existing records
        const res = await fetch(`${API_URL}/attendance/service/${selectedServiceId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(
            members.map((m) => ({
              memberId: m.id,
              serviceId: Number(selectedServiceId),
              status: attendance[m.id] || "Absent",
              checkInTime,
            }))
          ),
        });
        if (!res.ok) throw new Error("Failed to update attendance");
      } else {
        // POST — create new records
        await Promise.all(
          members.map((m) =>
            fetch(`${API_URL}/attendance/mark`, {
              method: "POST",
              headers,
              body: JSON.stringify({
                memberId: m.id,
                serviceId: Number(selectedServiceId),
                status: attendance[m.id] || "Absent",
                checkInTime,
              }),
            })
          )
        );
      }
      alert("Attendance saved successfully!");
      navigate("/attendance");
    } catch (err) {
      alert("Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendance).filter((s) => s === "Present").length;

  const filteredMembers = members.filter((m) =>
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (m: Member) =>
    `${m.firstName?.[0] || ""}${m.lastName?.[0] || ""}`.toUpperCase();

  return (
    <div className="att-page">
      {/* HEADER */}
      <div className="att-header-card">
        <div className="att-header-top">
          <button className="att-back-btn" onClick={() => navigate("/attendance")}>
            <ChevronLeft size={20} />
          </button>
          <h2 className="att-title">Attendance</h2>
          <div className="att-dots-btn">
            <MoreHorizontal size={20} />
          </div>
        </div>

        {/* SERVICE + DATE + TIME SELECTORS */}
        <div className="att-selectors">
          <div className="att-select-box" style={{ gridColumn: "1 / -1" }}>
            <p className="att-select-label">Select Service</p>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
            >
              <option value="">Choose...</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <div className="att-select-box">
            <p className="att-select-label">Select Date</p>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="att-select-box">
            <p className="att-select-label">Select Time</p>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="att-content">
        {/* INFO BANNER */}
        {selectedServiceId && (
          <div className="att-info-banner">
            <CheckCircle size={16} color="#4f46e5" />
            <span>
              {selectedDate && selectedTime
                ? `${isEditing ? "Editing" : "Marking"} attendance for ${selectedDate} at ${selectedTime}`
                : "Select a date and time to mark attendance"}
            </span>
          </div>
        )}

        {/* SEARCH + MARK ALL */}
        <div className="att-actions-row">
          <div className="att-member-search">
            <Search size={14} color="#9aa0a6" />
            <input
              type="text"
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="att-mark-all-btn" onClick={markAllPresent}>
            Mark all present
          </button>
        </div>

        {/* COUNT */}
        <p className="att-count">
          Present: {presentCount} / Total: {members.length}
        </p>

        {/* MEMBERS LIST */}
        {loadingMembers ? (
          <p className="att-empty">Loading members...</p>
        ) : (
          filteredMembers.map((m) => (
            <div key={m.id} className="att-member-row">
              <div className="att-member-avatar">
                {m.profileImage ? (
                  <img src={m.profileImage} alt={m.firstName} />
                ) : (
                  <span>{getInitials(m)}</span>
                )}
              </div>
              <div className="att-member-info">
                <p className="att-member-name">{m.firstName} {m.lastName}</p>
                <p className="att-member-role">{m.role || "Member"}</p>
              </div>
              <div className="att-toggle-row">
                <button
                  className={`att-toggle-btn ${attendance[m.id] === "Absent" ? "absent-active" : ""}`}
                  onClick={() => toggleStatus(m.id, "Absent")}
                >
                  Absent
                </button>
                <button
                  className={`att-toggle-btn ${attendance[m.id] === "Present" ? "present-active" : ""}`}
                  onClick={() => toggleStatus(m.id, "Present")}
                >
                  {attendance[m.id] === "Present" ? "✓ Present" : "Present"}
                </button>
              </div>
            </div>
          ))
        )}

        {/* FOOTER BUTTONS */}
        <div className="att-footer">
          <button className="att-cancel-btn" onClick={() => navigate("/attendance")}>
            Cancel
          </button>
          <button
            className="att-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : isEditing ? "Update Attendance" : "Save Attendance"}
          </button>
        </div>
      </div>

      {/* BOTTOM NAV */}
      <div className="bottom-nav">
        <div className="nav-item active">
          <Home size={22} /><span>Home</span>
        </div>
        <div className="nav-item">
          <Calendar size={22} /><span>Calendar</span>
        </div>
        <div className="nav-item">
          <Settings size={22} /><span>Settings</span>
        </div>
        <div className="nav-item">
          <User size={22} /><span>Profile</span>
        </div>
      </div>
    </div>
  );
}