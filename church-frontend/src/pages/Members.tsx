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
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import "../styles/Members.css";
import { apiCall, logout } from "../utils/api";
import { API_URL } from "../App";
import * as XLSX from "xlsx";

interface Member {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  email: string;
  birthdate?: string;
  basonta?: string;
}

const BASONTA_OPTIONS = [
  "All",
  "Choir",
  "Ushers/Flowers",
  "Media(High Speed, Photography, Sound, Live Streaming, Content Creation)",
  "Film Stars",
  "Dancing Stars",
  "Light Bearers",
  "Christian Pop Stars",
];

type SortOption = "none" | "az" | "za" | "birthday";

export default function Members() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Filter & sort state
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedBasonta, setSelectedBasonta] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("none");

  // Import state
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const [showImportModal, setShowImportModal] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; failed: number } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      setError("");
      const response = await apiCall<Member[]>("/api/members", { method: "GET" });
      if (!response.ok) {
        if (response.error?.includes("Unauthorized") || response.error?.includes("401")) {
          logout(); return;
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

  // ── Filter + Sort ──
  const getFilteredAndSorted = () => {
    let result = members.filter((m) =>
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase())
    );

    if (selectedBasonta !== "All") {
      result = result.filter((m) => m.basonta === selectedBasonta);
    }

    if (sortBy === "az") {
      result = [...result].sort((a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
      );
    } else if (sortBy === "za") {
      result = [...result].sort((a, b) =>
        `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`)
      );
    } else if (sortBy === "birthday") {
      const today = new Date();
      result = [...result].sort((a, b) => {
        const getDaysUntil = (birthdate?: string) => {
          if (!birthdate) return 999;
          const date = new Date(birthdate);
          const next = new Date(today.getFullYear(), date.getMonth(), date.getDate());
          if (next < today) next.setFullYear(today.getFullYear() + 1);
          return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        };
        return getDaysUntil(a.birthdate) - getDaysUntil(b.birthdate);
      });
    }

    return result;
  };

  const filteredMembers = getFilteredAndSorted();

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
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
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
      alert("First and last name are required."); return;
    }
    setEditLoading(true);
    try {
      const response = await apiCall<Member>(`/api/members/${editMember.id}`, {
        method: "PUT",
        body: JSON.stringify(editMember),
      });
      if (!response.ok) { alert("Failed to update member."); return; }
      setMembers((prev) => prev.map((m) => (m.id === editMember.id ? response.data! : m)));
      setEditMember(null);
    } catch {
      alert("An error occurred while updating the member.");
    } finally {
      setEditLoading(false);
    }
  };

  // ── CSV Parser ──
  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    const lines = text.split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      const values: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') { inQuotes = !inQuotes; }
        else if (line[i] === "," && !inQuotes) { values.push(current.trim()); current = ""; }
        else { current += line[i]; }
      }
      values.push(current.trim());
      rows.push(values);
    }
    return rows;
  };

  // ── File Import ──
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setShowImportModal(true);
    setImportResults(null);

    let rows: string[][] = [];

    try {
      if (file.name.endsWith(".csv")) {
        const text = await file.text();
        rows = parseCSV(text);
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false });
        rows = data.map((row) => row.map((cell) => (cell ?? "").toString()));
      }
    } catch {
      showToast("Failed to read file", "error");
      setImporting(false);
      setShowImportModal(false);
      return;
    }

    if (rows.length < 2) {
      showToast("File is empty or invalid", "error");
      setImporting(false);
      setShowImportModal(false);
      return;
    }

    const headers = rows[0].map((h) => h.toLowerCase().trim());
    const dataRows = rows.slice(1).filter((r) => r.some((v) => v.trim()));
    setImportProgress({ done: 0, total: dataRows.length });

    const get = (row: string[], key: string) => {
      const idx = headers.indexOf(key);
      return idx !== -1 ? row[idx]?.trim() || "" : "";
    };

    let success = 0;
    let failed = 0;
    const token = localStorage.getItem("token");

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const member = {
        firstName: get(row, "firstname") || get(row, "first name") || get(row, "first_name"),
        lastName: get(row, "lastname") || get(row, "last name") || get(row, "last_name"),
        email: get(row, "email"),
        phone: get(row, "phone") || get(row, "phone number") || get(row, "mobile"),
        address: get(row, "address"),
        birthdate: get(row, "birthdate") || get(row, "birth date") || get(row, "dob") || null,
        basonta: get(row, "basonta") || get(row, "department") || null,
      };

      if (!member.firstName && !member.lastName) { failed++; continue; }

      try {
        const res = await fetch(`${API_URL}/api/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(member),
        });
        if (res.ok) { success++; } else { failed++; }
      } catch { failed++; }

      setImportProgress({ done: i + 1, total: dataRows.length });
    }

    setImportResults({ success, failed });
    setImporting(false);
    if (success > 0) {
      const response = await apiCall<Member[]>("/api/members", { method: "GET" });
      if (response.ok) setMembers(response.data || []);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const activeFiltersCount = (selectedBasonta !== "All" ? 1 : 0) + (sortBy !== "none" ? 1 : 0);

  return (
    <div className="members-page" onClick={() => { setOpenMenuId(null); setShowFilterMenu(false); }}>

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

          {/* THREE DOTS → Filter menu */}
          <div className="filter-btn-wrap" onClick={(e) => e.stopPropagation()}>
            <button
              className={`icon-circle filter-btn ${activeFiltersCount > 0 ? "filter-btn--active" : ""}`}
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <SlidersHorizontal size={18} />
              {activeFiltersCount > 0 && (
                <span className="filter-badge">{activeFiltersCount}</span>
              )}
            </button>

            {/* FILTER DROPDOWN */}
            {showFilterMenu && (
              <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                <div className="filter-dropdown-header">
                  <p className="filter-dropdown-title">Filter & Sort</p>
                  <button
                    className="filter-reset-btn"
                    onClick={() => { setSelectedBasonta("All"); setSortBy("none"); }}
                  >
                    Reset
                  </button>
                </div>

                {/* SORT */}
                <p className="filter-section-label">Sort by</p>
                <div className="filter-options">
                  {[
                    { value: "none", label: "Default" },
                    { value: "az", label: "Name A–Z" },
                    { value: "za", label: "Name Z–A" },
                    { value: "birthday", label: "Upcoming Birthday" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      className={`filter-option-btn ${sortBy === opt.value ? "selected" : ""}`}
                      onClick={() => setSortBy(opt.value as SortOption)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* BASONTA FILTER */}
                <p className="filter-section-label">Basonta</p>
                <div className="filter-basonta-list">
                  {BASONTA_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      className={`filter-basonta-btn ${selectedBasonta === opt ? "selected" : ""}`}
                      onClick={() => setSelectedBasonta(opt)}
                    >
                      {opt === "Media(High Speed, Photography, Sound, Live Streaming, Content Creation)"
                        ? "Media"
                        : opt}
                    </button>
                  ))}
                </div>
              </div>
            )}
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

        {/* IMPORT BUTTON */}
        <button className="members-import-btn" onClick={() => fileInputRef.current?.click()}>
          <Upload size={16} />
          Import CSV / Excel
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: "none" }}
          onChange={handleFileImport}
        />
      </div>

      {/* ACTIVE FILTER CHIPS */}
      {(selectedBasonta !== "All" || sortBy !== "none") && (
        <div className="active-filters">
          {selectedBasonta !== "All" && (
            <div className="filter-chip">
              {selectedBasonta === "Media(High Speed, Photography, Sound, Live Streaming, Content Creation)"
                ? "Media" : selectedBasonta}
              <button onClick={() => setSelectedBasonta("All")}><X size={12} /></button>
            </div>
          )}
          {sortBy !== "none" && (
            <div className="filter-chip">
              {sortBy === "az" ? "A–Z" : sortBy === "za" ? "Z–A" : "Upcoming Birthday"}
              <button onClick={() => setSortBy("none")}><X size={12} /></button>
            </div>
          )}
        </div>
      )}

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
                  {member.basonta && (
                    <div className="member-basonta-chip">{
                      member.basonta === "Media(High Speed, Photography, Sound, Live Streaming, Content Creation)"
                        ? "Media" : member.basonta
                    }</div>
                  )}
                </div>

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
        <div className="nav-item" onClick={() => navigate("/calendar")}>
          <Calendar size={22} /><span>Calendar</span>
        </div>
        <div className="nav-item" onClick={() => navigate("/settings")}>
          <Settings size={22} /><span>Settings</span>
        </div>
      </div>

      {/* IMPORT PROGRESS MODAL */}
      {showImportModal && (
        <div className="modal-overlay">
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{importing ? "Importing..." : "Import Complete"}</h3>
              {!importing && (
                <button className="modal-close" onClick={() => setShowImportModal(false)}>
                  <X size={20} />
                </button>
              )}
            </div>
            {importing ? (
              <>
                <p className="import-progress-text">
                  Importing {importProgress.done} of {importProgress.total}...
                </p>
                <div className="import-progress-bar">
                  <div
                    className="import-progress-fill"
                    style={{ width: `${importProgress.total > 0 ? (importProgress.done / importProgress.total) * 100 : 0}%` }}
                  />
                </div>
              </>
            ) : importResults && (
              <>
                <div className="import-results">
                  <div className="import-result-item success">
                    <span className="import-result-number">{importResults.success}</span>
                    <span className="import-result-label">Imported</span>
                  </div>
                  <div className="import-result-item failed">
                    <span className="import-result-number">{importResults.failed}</span>
                    <span className="import-result-label">Skipped</span>
                  </div>
                </div>
                <button className="settings-save-btn" onClick={() => setShowImportModal(false)}>
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}

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
                { label: "Birth date", value: selectedMember.birthdate },
                { label: "Basonta", value: selectedMember.basonta },
              ].filter((row) => row.value).map((row) => (
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