import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, MoreHorizontal, FileText,
  Download, Home, Calendar, Settings, User,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { API_URL } from "../App";
import "../styles/Reports.css";

interface ServiceRecord {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  preacher: string;
}

interface AttendanceRecord {
  id: number;
  status: string;
  checkInTime: string;
  member: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
}

interface FirstTimer {
  id: number;
  fullName: string;
  phoneNumber: string;
  area: string;
  hostel: string;
  course: string;
  joinChurch: string;
  joinBasonta: string;
  visitDate: string;
}

export default function Reports() {
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);

  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [firstTimers, setFirstTimers] = useState<FirstTimer[]>([]);
  const [totalMembers, setTotalMembers] = useState<number>(0);
  const [selectedService, setSelectedService] = useState<ServiceRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);

  const token = localStorage.getItem("token");
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  useEffect(() => {
    fetchServices();
    fetchTotalMembers();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch(`${API_URL}/services`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch services:", err);
    }
  };

  const fetchTotalMembers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/members`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      setTotalMembers(Array.isArray(data) ? data.length : 0);
    } catch (err) {
      console.error("Failed to fetch members:", err);
    }
  };

  const handleGenerate = async () => {
    if (!selectedServiceId) {
      alert("Please select a service.");
      return;
    }
    if (!startDate || !endDate) {
      alert("Please select a date range for first timers.");
      return;
    }

    setLoading(true);
    setGenerated(false);

    try {
      // Fetch attendance for selected service
      const attRes = await fetch(
        `${API_URL}/attendance/service/${selectedServiceId}`,
        { headers }
      );
      const attData = attRes.ok ? await attRes.json() : [];
      setAttendanceRecords(Array.isArray(attData) ? attData : []);

      // Find selected service details
      const service = services.find((s) => s.id === Number(selectedServiceId));
      setSelectedService(service || null);

      // Fetch all first timers and filter by date range
      const ftRes = await fetch(`${API_URL}/api/first-timers`, { headers });
      const ftData = ftRes.ok ? await ftRes.json() : [];
      const filtered = (Array.isArray(ftData) ? ftData : []).filter(
        (ft: FirstTimer) => {
          if (!ft.visitDate) return false;
          const visit = new Date(ft.visitDate);
          const start = new Date(startDate);
          const end = new Date(endDate);
          end.setHours(23, 59, 59);
          return visit >= start && visit <= end;
        }
      );
      setFirstTimers(filtered);
      setGenerated(true);
    } catch (err) {
      console.error("Failed to generate report:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // If content is taller than one page, add multiple pages
      const pageHeight = pdf.internal.pageSize.getHeight();
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `${selectedService?.title || "report"}-${new Date().toLocaleDateString("en-GB")}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      setGenerating(false);
    }
  };

  const presentCount = attendanceRecords.filter((r) => r.status === "Present").length;
  const absentCount = attendanceRecords.filter((r) => r.status === "Absent").length;
  const attendancePercentage = totalMembers > 0
    ? Math.round((presentCount / totalMembers) * 100)
    : 0;

  const wantToJoin = firstTimers.filter(
    (ft) => ft.joinChurch?.toLowerCase() === "yes"
  ).length;

  const wantToJoinBasonta = firstTimers.filter(
    (ft) => ft.joinBasonta?.toLowerCase() === "yes"
  ).length;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleTimeString("en-GB", {
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div className="reports-page">

      {/* HEADER */}
      <div className="reports-header-card">
        <div className="reports-header-top">
          <button className="reports-back-btn" onClick={() => navigate("/dashboard")}>
            <ChevronLeft size={20} />
          </button>
          <h2 className="reports-title">Reports</h2>
          <div className="reports-dots-btn">
            <MoreHorizontal size={20} />
          </div>
        </div>
      </div>

      {/* FILTER SECTION */}
      <div className="reports-content">
        <div className="reports-filter-card">
          <h4 className="filter-title">Generate Report</h4>

          <div className="filter-field">
            <label>Select Service</label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
            >
              <option value="">Choose a service...</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} — {new Date(s.startTime).toLocaleDateString("en-GB")}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label>First Timers Date Range</label>
            <div className="date-range-row">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start date"
              />
              <span className="date-range-sep">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End date"
              />
            </div>
          </div>

          <button
            className="generate-btn"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>
        </div>

        {/* DOWNLOAD BUTTON */}
        {generated && (
          <button
            className="download-btn"
            onClick={handleDownloadPDF}
            disabled={generating}
          >
            <Download size={18} />
            {generating ? "Preparing PDF..." : "Download PDF"}
          </button>
        )}

        {/* REPORT PREVIEW */}
        {generated && (
          <div className="report-preview-wrapper">
            <div ref={reportRef} className="report-document">

              {/* REPORT HEADER */}
              <div className="report-church-header">
                <div className="report-church-icon">
                  <FileText size={28} color="#4f46e5" />
                </div>
                <h1 className="report-church-name">Bomso Town Church</h1>
                <p className="report-generated-date">
                  Report generated on {new Date().toLocaleDateString("en-GB", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
              </div>

              <div className="report-divider" />

              {/* ATTENDANCE SECTION */}
              <div className="report-section">
                <h2 className="report-section-title">Attendance Report</h2>

                <div className="report-service-info">
                  <div className="report-info-row">
                    <span className="report-info-label">Service</span>
                    <span className="report-info-value">{selectedService?.title}</span>
                  </div>
                  <div className="report-info-row">
                    <span className="report-info-label">Date</span>
                    <span className="report-info-value">
                      {formatDate(attendanceRecords[0]?.checkInTime || selectedService?.startTime || "")}
                    </span>
                  </div>
                  <div className="report-info-row">
                    <span className="report-info-label">Time</span>
                    <span className="report-info-value">
                      {formatTime(attendanceRecords[0]?.checkInTime || selectedService?.startTime || "")}
                    </span>
                  </div>
                  <div className="report-info-row">
                    <span className="report-info-label">Location</span>
                    <span className="report-info-value">{selectedService?.location || "—"}</span>
                  </div>
                  <div className="report-info-row">
                    <span className="report-info-label">Preacher</span>
                    <span className="report-info-value">{selectedService?.preacher || "—"}</span>
                  </div>
                </div>

                {/* STATS ROW */}
                <div className="report-stats-row">
                  <div className="report-stat-box green">
                    <p className="stat-number">{presentCount}</p>
                    <p className="stat-label">Present</p>
                  </div>
                  <div className="report-stat-box red">
                    <p className="stat-number">{absentCount}</p>
                    <p className="stat-label">Absent</p>
                  </div>
                  <div className="report-stat-box blue">
                    <p className="stat-number">{totalMembers}</p>
                    <p className="stat-label">Total</p>
                  </div>
                  <div className="report-stat-box purple">
                    <p className="stat-number">{attendancePercentage}%</p>
                    <p className="stat-label">Rate</p>
                  </div>
                </div>

                {/* ATTENDANCE TABLE */}
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRecords.map((record, index) => (
                      <tr key={record.id}>
                        <td>{index + 1}</td>
                        <td>
                          {record.member?.firstName} {record.member?.lastName}
                        </td>
                        <td>
                          <span className={`report-status ${record.status === "Present" ? "present" : "absent"}`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="report-divider" />

              {/* FIRST TIMERS SECTION */}
              <div className="report-section">
                <h2 className="report-section-title">First Timers Report</h2>
                <p className="report-date-range">
                  Period: {new Date(startDate).toLocaleDateString("en-GB")} —{" "}
                  {new Date(endDate).toLocaleDateString("en-GB")}
                </p>

                {/* FIRST TIMER STATS */}
                <div className="report-stats-row">
                  <div className="report-stat-box blue">
                    <p className="stat-number">{firstTimers.length}</p>
                    <p className="stat-label">Total</p>
                  </div>
                  <div className="report-stat-box green">
                    <p className="stat-number">{wantToJoin}</p>
                    <p className="stat-label">Join Church</p>
                  </div>
                  <div className="report-stat-box purple">
                    <p className="stat-number">{wantToJoinBasonta}</p>
                    <p className="stat-label">Join Basonta</p>
                  </div>
                </div>

                {firstTimers.length === 0 ? (
                  <p className="report-empty">No first timers in this date range.</p>
                ) : (
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Area/Hostel</th>
                        <th>Join?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {firstTimers.map((ft, index) => (
                        <tr key={ft.id}>
                          <td>{index + 1}</td>
                          <td>{ft.fullName}</td>
                          <td>{ft.phoneNumber || "—"}</td>
                          <td>{ft.hostel || ft.area || "—"}</td>
                          <td>{ft.joinChurch || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* REPORT FOOTER */}
              <div className="report-divider" />
              <div className="report-footer">
                <p>Bomso Town Church — Confidential Report</p>
                <p>{new Date().toLocaleDateString("en-GB")}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div className="bottom-nav">
        <div className="nav-item" onClick={() => navigate("/dashboard")}>
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