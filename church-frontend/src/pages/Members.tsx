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
  Phone,
  MapPin,
  Mail,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/Members.css";
import { apiCall, logout } from "../utils/api";
import { API_URL } from "../App";

interface Member {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  email: string;
}

export default function Members() {
  const navigate = useNavigate();

  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>("");

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      setError("");

      const response = await apiCall<Member[]>("/api/members", {
        method: "GET",
      });

      if (!response.ok) {
        if (
          response.error?.includes("Unauthorized") ||
          response.error?.includes("401")
        ) {
          logout();
          return;
        }
        setError(response.error || "Failed to load members");
        setMembers([]);
      } else {
        setMembers(response.data || []);
      }

      setLoading(false);
    };

    fetchMembers();
  }, []);

  const filteredMembers = members.filter((member) =>
    `${member.firstName} ${member.lastName}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const confirmDelete = (id: number, name: string) => {
    setDeleteConfirmId(id);
    setDeleteConfirmName(name);
    setOpenMenuId(null);
  };

  const handleDeleteMember = async () => {
    if (!deleteConfirmId) return;
    try {
      await fetch(`${API_URL}/api/members/${deleteConfirmId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setMembers((prev) => prev.filter((m) => m.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      showToast("Member deleted successfully", "success");
    } catch {
      showToast("An error occurred while deleting the member", "error");
    }
  };

  const handleEditSave = async () => {
    if (!editMember) return;
    if (!editMember.firstName || !editMember.lastName) {
      alert("First and last name are required.");
      return;
    }
    setEditLoading(true);
    try {
      const response = await apiCall<Member>(`/api/members/${editMember.id}`, {
        method: "PUT",
        body: JSON.stringify(editMember),
      });
      if (!response.ok) {
        alert("Failed to update member.");
        return;
      }
      setMembers((prev) =>
        prev.map((m) => (m.id === editMember.id ? response.data! : m))
      );
      setEditMember(null);
    } catch {
      alert("An error occurred while updating the member.");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="members-page" onClick={() => setOpenMenuId(null)}>

      {/* HEADER CARD */}
      <div className="members-header-card">
        <div className="members-header">
          <div className="header-left">
            <div className="icon-circle" onClick={() => navigate("/dashboard")}>
              <ArrowLeft size={20} />
            </div>
            <div className="title-block">
              <h2>Members</h2>
              <p>Total: {members.length} Members</p>
            </div>
          </div>
          <div className="icon-circle">
            <MoreHorizontal size={20} />
          </div>
        </div>

        {/* SEARCH */}
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* MEMBERS LIST */}
      <div className="members-content">
        {loading ? (
          <p className="loading-text">Loading members...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : filteredMembers.length === 0 ? (
          <p className="empty-text">No members found</p>
        ) : (
          filteredMembers.map((member) => (
            <div key={member.id} className="member-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                {/* MEMBER INFO */}
                <div style={{ flex: 1 }}>
                  <h4 style={{ marginBottom: "8px" }}>
                    {member.firstName} {member.lastName}
                  </h4>
                  <div className="member-detail-row">
                    <Phone size={13} color="#9aa0a6" />
                    <span>{member.phone || "—"}</span>
                  </div>
                  <div className="member-detail-row">
                    <MapPin size={13} color="#9aa0a6" />
                    <span>{member.address || "—"}</span>
                  </div>
                  <div className="member-detail-row">
                    <Mail size={13} color="#9aa0a6" />
                    <span>{member.email || "—"}</span>
                  </div>
                </div>

                {/* THREE DOTS MENU */}
                <div className="member-menu-wrap" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="member-menu-btn"
                    onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                  >
                    <MoreHorizontal size={18} />
                  </button>

                  {openMenuId === member.id && (
                    <div className="member-dropdown">
                      <button onClick={() => { setSelectedMember(member); setOpenMenuId(null); }}>
                        View details
                      </button>
                      <button onClick={() => { navigate("/members/create", { state: { member } }); setOpenMenuId(null); }}>
                        Edit
                      </button>
                      <button
                        className="danger"
                        onClick={() => confirmDelete(member.id, `${member.firstName} ${member.lastName}`)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => navigate("/members/create")}>
        <Plus size={24} />
      </button>

      {/* BOTTOM NAV */}
      <div className="bottom-nav">
        <div className="nav-item" onClick={() => navigate("/dashboard")}>
          <Home size={22} /><span>Home</span>
        </div>
        <div className="nav-item active">
          <User size={22} /><span>Members</span>
        </div>
        <div className="nav-item">
          <Calendar size={22} /><span>Calendar</span>
        </div>
        <div className="nav-item" onClick={() => navigate("/settings")}>
          <Settings size={22} /><span>Settings</span>
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      {selectedMember && (
        <div className="modal-overlay" onClick={() => setSelectedMember(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedMember.firstName} {selectedMember.lastName}</h3>
              <button className="modal-close" onClick={() => setSelectedMember(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="member-modal-avatar">
              {`${selectedMember.firstName?.[0] || ""}${selectedMember.lastName?.[0] || ""}`.toUpperCase()}
            </div>

            <div className="detail-rows">
              {[
                { label: "First name", value: selectedMember.firstName },
                { label: "Last name", value: selectedMember.lastName },
                { label: "Phone", value: selectedMember.phone },
                { label: "Address", value: selectedMember.address },
                { label: "Email", value: selectedMember.email },
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
              onClick={() => { navigate("/members/create", { state: { member: selectedMember } }); setSelectedMember(null); }}
            >
              Edit Member
            </button>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editMember && (
        <div className="modal-overlay" onClick={() => setEditMember(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Member</h3>
              <button className="modal-close" onClick={() => setEditMember(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="edit-form">
              {["firstName", "lastName", "phone", "address", "email"].map((field) => (
                <div className="edit-field" key={field}>
                  <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                  <input
                    type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                    value={(editMember as any)[field]}
                    onChange={(e) => setEditMember((prev) => ({ ...prev!, [field]: e.target.value }))}
                  />
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <button className="modal-cancel-btn" onClick={() => setEditMember(null)}>Cancel</button>
              <button className="modal-save-btn" onClick={handleEditSave} disabled={editLoading}>
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="confirm-popup" onClick={(e) => e.stopPropagation()}>
            <p className="confirm-message">
              Are you sure you want to delete <strong>{deleteConfirmName}</strong>? This action cannot be undone.
            </p>
            <div className="confirm-actions">
              <button className="confirm-cancel-btn" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
              <button className="confirm-delete-btn" onClick={handleDeleteMember}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
}