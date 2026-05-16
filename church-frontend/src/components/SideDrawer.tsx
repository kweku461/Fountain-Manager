import {
  Home,
  Users,
  CheckCircle,
  Church,
  Heart,
  FileText,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/SideDrawer.css";

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const mainNavItems = [
  { label: "Home", icon: Home, path: "/dashboard" },
  { label: "Members", icon: Users, path: "/members" },
  { label: "Attendance", icon: CheckCircle, path: "/attendance" },
  { label: "Services", icon: Church, path: "/services" },
  { label: "First Timers", icon: Heart, path: "/first-timers" },
];

const toolNavItems = [
  { label: "Reports", icon: FileText, path: "/reports" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export default function SideDrawer({ isOpen, onClose }: SideDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`drawer-overlay ${isOpen ? "drawer-overlay--open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside className={`side-drawer ${isOpen ? "side-drawer--open" : ""}`} aria-label="Navigation menu">

        {/* Header */}
        <div className="side-drawer__header">
          <div className="side-drawer__brand">
            <div className="side-drawer__logo-circle">
              <span className="side-drawer__logo-letter">F</span>
            </div>
            <div>
              <p className="side-drawer__app-name">Fountain Manager</p>
              <p className="side-drawer__app-sub">Church dashboard</p>
            </div>
          </div>
          <button className="side-drawer__close-btn" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="side-drawer__nav">
          <p className="side-drawer__section-label">Main</p>
          {mainNavItems.map(({ label, icon: Icon, path }) => (
            <button
              key={path}
              className={`side-drawer__nav-item ${location.pathname === path ? "side-drawer__nav-item--active" : ""}`}
              onClick={() => handleNav(path)}
            >
              <span className={`side-drawer__nav-icon side-drawer__nav-icon--${label.toLowerCase().replace(" ", "-")}`}>
                <Icon size={17} />
              </span>
              <span className="side-drawer__nav-label">{label}</span>
            </button>
          ))}

          <p className="side-drawer__section-label" style={{ marginTop: "20px" }}>Tools</p>
          {toolNavItems.map(({ label, icon: Icon, path }) => (
            <button
              key={path}
              className={`side-drawer__nav-item ${location.pathname === path ? "side-drawer__nav-item--active" : ""}`}
              onClick={() => handleNav(path)}
            >
              <span className={`side-drawer__nav-icon side-drawer__nav-icon--${label.toLowerCase()}`}>
                <Icon size={17} />
              </span>
              <span className="side-drawer__nav-label">{label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="side-drawer__footer">
          <div className="side-drawer__avatar">AD</div>
          <div className="side-drawer__footer-info">
            <p className="side-drawer__footer-name">Admin</p>
            <p className="side-drawer__footer-role">Church administrator</p>
          </div>
          <button className="side-drawer__logout-btn" onClick={handleLogout} aria-label="Log out">
            <LogOut size={16} />
          </button>
        </div>

      </aside>
    </>
  );
}