import { useState, useEffect } from "react";
import {
  Bell,
  Search,
  Users,
  Church,
  CheckCircle,
  Home,
  Calendar,
  Settings,
  User,
  FileText,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import Logo from "../assets/Logo.png";
import SideDrawer from "../components/SideDrawer";
import { API_URL } from "../App";

interface Member {
  id: number;
  firstName: string;
  lastName: string;
  birthdate?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; position: "top" | "bottom" } | null>(null);
  const [todayBirthdays, setTodayBirthdays] = useState<Member[]>([]);
  const [showBirthdayDropdown, setShowBirthdayDropdown] = useState(false);

  const showToast = (message: string, position: "top" | "bottom") => {
    setToast({ message, position });
    setTimeout(() => setToast(null), 2500);
  };

  // Check for today's birthdays
  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        const res = await fetch(`${API_URL}/api/members`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (!res.ok) return;
        const data: Member[] = await res.json();

        const today = new Date();
        const todayMonth = today.getMonth();
        const todayDay = today.getDate();

        const birthdays = data.filter((m) => {
          if (!m.birthdate) return false;
          const date = new Date(m.birthdate);
          return date.getMonth() === todayMonth && date.getDate() === todayDay;
        });

        setTodayBirthdays(birthdays);
      } catch {
        setTodayBirthdays([]);
      }
    };
    fetchBirthdays();
  }, []);

  const handleBellClick = () => {
    if (todayBirthdays.length > 0) {
      setShowBirthdayDropdown(!showBirthdayDropdown);
    } else {
      showToast("🔔 No notifications today", "top");
    }
  };

  return (
    <div className="dashboard-page">

      {/* SIDE DRAWER */}
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* HEADER CARD */}
      <div className="dashboard-header-card">
        <div className="dashboard-header">
          <div className="header-left">
            <div
              className="icon-bg clickable"
              onClick={() => setDrawerOpen(true)}
              role="button"
              aria-label="Open navigation menu"
            >
              <img src={Logo} alt="Logo" className="dashboard-logo" />
            </div>

            <div className="welcome-block">
              <p className="welcome-text">Welcome to</p>
              <h2>Fountain Manager</h2>
            </div>
          </div>

          {/* BELL with badge */}
          <div className="bell-wrapper" onClick={handleBellClick}>
            <div className={`icon-bg clickable ${todayBirthdays.length > 0 ? "bell-active" : ""}`}>
              <Bell size={20} color={todayBirthdays.length > 0 ? "#ffffff" : undefined} />
            </div>
            {todayBirthdays.length > 0 && (
              <span className="bell-badge">{todayBirthdays.length}</span>
            )}
          </div>
        </div>

        {/* SEARCH */}
        <div className="search-wrapper">
          <div className="search-box">
            <Search size={18} />
            <input type="text" placeholder="Search" />
          </div>
        </div>
      </div>

      {/* BIRTHDAY DROPDOWN */}
      {showBirthdayDropdown && (
        <div className="birthday-dropdown-overlay" onClick={() => setShowBirthdayDropdown(false)}>
          <div className="birthday-dropdown" onClick={(e) => e.stopPropagation()}>
            <div className="birthday-dropdown-header">
              <p className="birthday-dropdown-title">🎂 Birthdays Today</p>
              <button className="birthday-dropdown-close" onClick={() => setShowBirthdayDropdown(false)}>
                <X size={16} />
              </button>
            </div>
            {todayBirthdays.map((m) => (
              <div key={m.id} className="birthday-dropdown-item">
                <div className="birthday-dropdown-avatar">
                  {`${m.firstName[0]}${m.lastName[0]}`.toUpperCase()}
                </div>
                <div>
                  <p className="birthday-dropdown-name">{m.firstName} {m.lastName}</p>
                  <p className="birthday-dropdown-sub">🎉 Birthday today!</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTENT */}
      <div className="dashboard-content">
        <h3 className="dashboard-title">Dashboard</h3>

        <div className="dashboard-grid">
          <div className="dash-card clickable" onClick={() => navigate("/members")}>
            <div className="icon blue"><Users size={20} /></div>
            <h4>Members</h4>
            <p>Directory & Groups</p>
          </div>

          <div className="dash-card clickable" onClick={() => navigate("/reports")}>
            <div className="icon orange"><FileText size={20} /></div>
            <h4>Reports</h4>
            <p>Generate PDF</p>
          </div>

          <div className="dash-card clickable" onClick={() => navigate("/services")}>
            <div className="icon purple"><Church size={20} /></div>
            <h4>Services</h4>
            <p>Live & Action</p>
          </div>

          <div className="dash-card clickable" onClick={() => navigate("/attendance")}>
            <div className="icon green"><CheckCircle size={20} /></div>
            <h4>Attendance</h4>
            <p>Check-in</p>
          </div>
        </div>

        <div className="first-timers-card clickable" onClick={() => navigate("/first-timers")}>
          <h4>First timers</h4>
          <p>New souls</p>
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div className={`coming-soon-toast coming-soon-toast--${toast.position}`}>
          {toast.message}
        </div>
      )}

      {/* BOTTOM NAV */}
      <div className="bottom-nav">
        <div className="nav-item active">
          <Home size={22} />
          <span>Home</span>
        </div>
        <div className="nav-item clickable" onClick={() => navigate("/calendar")}>
          <Calendar size={22} />
          <span>Calendar</span>
        </div>
        <div className="nav-item clickable" onClick={() => navigate("/settings")}>
          <Settings size={22} />
          <span>Settings</span>
        </div>
        <div className="nav-item clickable" onClick={() => navigate("/settings", { state: { openProfile: true } })}>
          <User size={22} />
          <span>Profile</span>
        </div>
      </div>
    </div>
  );
}