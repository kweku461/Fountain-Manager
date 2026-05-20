import {
  ArrowLeft,
  MoreHorizontal,
  Search,
  Plus,
  Home,
  Calendar,
  Settings,
  User,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/Services.css";
import { apiCall } from "../utils/api";
import { API_URL } from "../App";

interface Service {
  id: number;
  title: string;
  description: string;
  preacher: string;
  startTime: string;
  endTime: string;
  location: string;
  livestreamAvailable: boolean;
}

export default function Services() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await apiCall<Service[]>("/services");
        if (!response.ok) {
          setError("Failed to load services");
          return;
        }
        setServices(response.data || []);
      } catch {
        setError("An error occurred while loading services");
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const filteredServices = services.filter(
    (service) =>
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedServices = filteredServices.reduce(
    (groups: { [key: string]: Service[] }, service) => {
      const date = new Date(service.startTime).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(service);
      return groups;
    },
    {}
  );

  const confirmDelete = (id: number, name: string) => {
    setDeleteConfirmId(id);
    setDeleteConfirmName(name);
    setOpenMenuId(null);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await fetch(`${API_URL}/services/delete/${deleteConfirmId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setServices((prev) => prev.filter((s) => s.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      showToast("Service deleted successfully", "success");
    } catch {
      showToast("An error occurred while deleting the service", "error");
    }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="services-page" onClick={() => setOpenMenuId(null)}>

      {/* HEADER CARD */}
      <div className="services-header-card">
        <div className="services-header">
          <div className="header-left">
            <div className="icon-circle" onClick={() => navigate("/dashboard")}>
              <ArrowLeft size={20} />
            </div>
            <h2>Services</h2>
          </div>
          <div className="icon-circle">
            <MoreHorizontal size={20} />
          </div>
        </div>

        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search services...."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* SERVICES LIST */}
      <div className="services-content">
        {loading && <p>Loading services...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && !error && services.length === 0 && (
          <p>No services yet. Create your first service!</p>
        )}

        {!loading && !error &&
          Object.entries(groupedServices).map(([date, dateServices]) => (
            <div key={date}>
              <p className="date-label">{date}</p>

              {dateServices.map((service) => (
                <div key={service.id} className="service-card">
                  <div className="service-card-inner">
                    {/* SERVICE INFO */}
                    <div className="service-info">
                      <h4>{service.title}</h4>
                      <p>{service.description}</p>
                      <p>Preacher: {service.preacher}</p>
                      {service.startTime && (
                        <p>Time: {formatTime(service.startTime)}</p>
                      )}
                    </div>

                    {/* THREE DOTS MENU */}
                    <div
                      className="service-menu-wrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="service-menu-btn"
                        onClick={() =>
                          setOpenMenuId(openMenuId === service.id ? null : service.id)
                        }
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {openMenuId === service.id && (
                        <div className="service-dropdown">
                          <button
                            onClick={() => {
                              setSelectedService(service);
                              setOpenMenuId(null);
                            }}
                          >
                            View details
                          </button>
                          <button
                            onClick={() => {
                              navigate("/services/create", { state: { service } });
                              setOpenMenuId(null);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="danger"
                            onClick={() => confirmDelete(service.id, service.title)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => navigate("/services/create")}>
        <Plus size={24} />
      </button>

      {/* BOTTOM NAV */}
      <div className="bottom-nav">
        <div className="nav-item" onClick={() => navigate("/dashboard")}>
          <Home size={22} /><span>Home</span>
        </div>
        <div className="nav-item">
          <Calendar size={22} /><span>Calendar</span>
        </div>
        <div className="nav-item active">
          <Settings size={22} /><span>Services</span>
        </div>
        {/* Profile — opens Settings with profile section expanded */}
        <div className="nav-item clickable" onClick={() => navigate("/settings", { state: { openProfile: true } })}>
          <User size={22} />
          <span>Profile</span>
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      {selectedService && (
        <div className="modal-overlay bottom" onClick={() => setSelectedService(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedService.title}</h3>
              <button className="modal-close" onClick={() => setSelectedService(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="detail-rows">
              {[
                { label: "Service name", value: selectedService.title },
                { label: "Sermon title", value: selectedService.description },
                { label: "Preacher", value: selectedService.preacher },
                { label: "Date", value: formatDate(selectedService.startTime) },
                { label: "Time", value: formatTime(selectedService.startTime) },
                { label: "Location", value: selectedService.location },
              ]
                .filter((row) => row.value)
                .map((row) => (
                  <div className="detail-row" key={row.label}>
                    <span className="detail-label">{row.label}</span>
                    <span className="detail-value">{row.value}</span>
                  </div>
                ))}
            </div>

            <button
              className="modal-edit-btn"
              onClick={() => {
                navigate("/services/create", { state: { service: selectedService } });
                setSelectedService(null);
              }}
            >
              Edit Service
            </button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="confirm-popup" onClick={(e) => e.stopPropagation()}>
            <p className="confirm-message">
              Are you sure you want to delete{" "}
              <strong>{deleteConfirmName}</strong>? This action cannot be undone.
            </p>
            <div className="confirm-actions">
              <button className="confirm-cancel-btn" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </button>
              <button className="confirm-delete-btn" onClick={handleDelete}>
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