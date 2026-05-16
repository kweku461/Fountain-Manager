import { useState } from "react";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import Logo from "../assets/logo.png";
import SideDrawer from "../components/SideDrawer";

export default function Dashboard() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; position: "top" | "bottom" } | null>(null);

  const showToast = (message: string, position: "top" | "bottom") => {
    setToast({ message, position });
    setTimeout(() => setToast(null), 2500);
  };

  const handleCalendarClick = () => showToast("🗓️ Calendar — Coming Soon!", "bottom");
  const handleBellClick = () => showToast("🔔 Notifications — Coming Soon!", "top");

  return (
    <div className="dashboard-page">

      {/* SIDE DRAWER */}
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* HEADER CARD */}
      <div className="dashboard-header-card">
        <div className="dashboard-header">
          <div className="header-left">

            {/* Logo — tap to open drawer */}
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

          {/* Bell — Coming Soon toast at TOP */}
          <div className="icon-bg clickable" onClick={handleBellClick}>
            <Bell size={20} />
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

      {/* CONTENT */}
      <div className="dashboard-content">
        <h3 className="dashboard-title">Dashboard</h3>

        <div className="dashboard-grid">
          {/* MEMBERS */}
          <div className="dash-card clickable" onClick={() => navigate("/members")}>
            <div className="icon blue"><Users size={20} /></div>
            <h4>Members</h4>
            <p>Directory & Groups</p>
          </div>

          {/* REPORTS */}
          <div className="dash-card clickable" onClick={() => navigate("/reports")}>
            <div className="icon orange"><FileText size={20} /></div>
            <h4>Reports</h4>
            <p>Generate PDF</p>
          </div>

          {/* SERVICES */}
          <div className="dash-card clickable" onClick={() => navigate("/services")}>
            <div className="icon purple"><Church size={20} /></div>
            <h4>Services</h4>
            <p>Live & Action</p>
          </div>

          {/* ATTENDANCE */}
          <div className="dash-card clickable" onClick={() => navigate("/attendance")}>
            <div className="icon green"><CheckCircle size={20} /></div>
            <h4>Attendance</h4>
            <p>Check-in</p>
          </div>
        </div>

        {/* FIRST TIMERS */}
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

        {/* Calendar — Coming Soon toast at BOTTOM */}
        <div className="nav-item clickable" onClick={handleCalendarClick}>
          <Calendar size={22} />
          <span>Calendar</span>
        </div>

        <div className="nav-item clickable" onClick={() => navigate("/settings")}>
          <Settings size={22} />
          <span>Settings</span>
        </div>

        {/* Profile — opens Settings with profile section expanded */}
        <div className="nav-item clickable" onClick={() => navigate("/settings", { state: { openProfile: true } })}>
          <User size={22} />
          <span>Profile</span>
        </div>
      </div>
    </div>
  );
}