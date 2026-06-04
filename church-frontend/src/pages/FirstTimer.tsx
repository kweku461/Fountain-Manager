import { useState, useEffect, useRef } from "react";
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
  Upload,
  SlidersHorizontal,
} from "lucide-react";
import QRCode from "react-qr-code";
import * as XLSX from "xlsx";
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
  basontaChoice: string;
  knownPerson: string;
  visitDate: string;
}

const mapRow = (headers: string[], values: string[], createdBy: string) => {
  const get = (key: string) => {
    const idx = headers.findIndex(
      (h) => h.trim().toLowerCase() === key.trim().toLowerCase()
    );
    return idx !== -1 ? values[idx]?.trim() || "" : "";
  };

  const rawTimestamp = get("Timestamp");
  let visitDate = "";
  if (rawTimestamp) {
    try {
      if (!isNaN(Number(rawTimestamp)) && rawTimestamp.trim() !== "") {
        const excelDate = XLSX.SSF.parse_date_code(Number(rawTimestamp));
        visitDate = `${excelDate.y}-${String(excelDate.m).padStart(2, "0")}-${String(excelDate.d).padStart(2, "0")}`;
      } else {
        const datePart = rawTimestamp.split(" ")[0];
        const parts = datePart.split("/");
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            const [year, month, day] = parts;
            visitDate = `${year.trim()}-${month.trim().padStart(2, "0")}-${day.trim().padStart(2, "0")}`;
          } else {
            const [month, day, year] = parts;
            visitDate = `${year.trim()}-${month.trim().padStart(2, "0")}-${day.trim().padStart(2, "0")}`;
          }
        }
      }
    } catch {
      visitDate = "";
    }
  }

  return {
    fullName: get("Full name"),
    whatsappNumber: get("WhatsApp number"),
    phoneNumber: get("Mobile number") || get("WhatsApp number"),
    course: get("Course/Level (if applicable)"),
    occupation: get("Occupation/Work"),
    area: get("Area of Residence"),
    hostel: get("Hostel name"),
    roomNumber: get("Room number"),
    joinChurch: get("Would you like to join the church?"),
    joinBasonta: get("Would you like to join a Basonta?"),
    basontaChoice: get("Which Basonta would you like to join?"),
    knownPerson: get("Who do you know in church?"),
    visitDate,
    createdBy,
  };
};

export default function FirstTimers() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstTimers, setFirstTimers] = useState<FirstTimer[]>([]);
  const [search, setSearch] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<FirstTimer | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const [showImportModal, setShowImportModal] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; failed: number } | null>(null);

  // ── Filter state ──
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterJoinChurch, setFilterJoinChurch] = useState("");
  const [filterJoinBasonta, setFilterJoinBasonta] = useState("");

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
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) { setFirstTimers([]); return; }
      const data = await res.json();
      setFirstTimers(Array.isArray(data) ? data : []);
    } catch {
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
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setFirstTimers((prev) => prev.filter((ft) => ft.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      showToast("First timer removed successfully", "success");
    } catch {
      showToast("Failed to delete.", "error");
    }
  };

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

    const headers = rows[0];
    const dataRows = rows.slice(1).filter((r) => r.some((v) => v?.trim()));
    setImportProgress({ done: 0, total: dataRows.length });

    let success = 0;
    let failed = 0;
    const token = localStorage.getItem("token");

    for (let i = 0; i < dataRows.length; i++) {
      const mapped = mapRow(headers, dataRows[i], userEmail);
      if (!mapped.fullName) { failed++; continue; }
      try {
        const res = await fetch(`${API_URL}/api/first-timers`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(mapped),
        });
        if (res.ok) { success++; } else { failed++; }
      } catch { failed++; }
      setImportProgress({ done: i + 1, total: dataRows.length });
    }

    setImportResults({ success, failed });
    setImporting(false);
    if (success > 0) fetchFirstTimers();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Filter logic ──
  const getFiltered = () => {
    let result = firstTimers.filter((ft) =>
      ft.fullName.toLowerCase().includes(search.toLowerCase())
    );

    if (filterDateFrom) {
      result = result.filter((ft) => ft.visitDate && ft.visitDate >= filterDateFrom);
    }
    if (filterDateTo) {
      result = result.filter((ft) => ft.visitDate && ft.visitDate <= filterDateTo);
    }
    if (filterJoinChurch) {
      result = result.filter((ft) =>
        ft.joinChurch?.toLowerCase() === filterJoinChurch.toLowerCase()
      );
    }
    if (filterJoinBasonta) {
      result = result.filter((ft) =>
        ft.joinBasonta?.toLowerCase() === filterJoinBasonta.toLowerCase()
      );
    }

    return result;
  };

  const filtered = getFiltered();

  const activeFiltersCount = [
    filterDateFrom,
    filterDateTo,
    filterJoinChurch,
    filterJoinBasonta,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterJoinChurch("");
    setFilterJoinBasonta("");
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div
      className="ft-page"
      onClick={() => { setOpenMenuId(null); setShowFilterMenu(false); }}
    >

      {/* HEADER CARD */}
      <div className="ft-header-card">
        <div className="ft-header-top">
          <button className="ft-back-btn" onClick={() => navigate(-1)}>
            <ChevronLeft size={20} />
          </button>
          <h2 className="ft-title">First Timers</h2>

          {/* FILTER BUTTON */}
          <div className="ft-filter-wrap" onClick={(e) => e.stopPropagation()}>
            <button
              className={`ft-dots-btn ft-filter-btn ${activeFiltersCount > 0 ? "ft-filter-btn--active" : ""}`}
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <SlidersHorizontal size={18} />
              {activeFiltersCount > 0 && (
                <span className="ft-filter-badge">{activeFiltersCount}</span>
              )}
            </button>

            {/* FILTER DROPDOWN */}
            {showFilterMenu && (
              <div className="ft-filter-dropdown" onClick={(e) => e.stopPropagation()}>
                <div className="filter-dropdown-header">
                  <p className="filter-dropdown-title">Filter</p>
                  <button className="filter-reset-btn" onClick={resetFilters}>Reset</button>
                </div>

                {/* DATE RANGE */}
                <p className="filter-section-label">Date range</p>
                <div className="ft-date-range">
                  <input
                    type="date"
                    className="ft-date-input"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    placeholder="From"
                  />
                  <span className="ft-date-sep">→</span>
                  <input
                    type="date"
                    className="ft-date-input"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    placeholder="To"
                  />
                </div>

                {/* JOIN CHURCH */}
                <p className="filter-section-label">Join church</p>
                <div className="filter-options">
                  {["Yes", "No", "Maybe"].map((opt) => (
                    <button
                      key={opt}
                      className={`filter-option-btn ${filterJoinChurch === opt ? "selected" : ""}`}
                      onClick={() => setFilterJoinChurch(filterJoinChurch === opt ? "" : opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {/* JOIN BASONTA */}
                <p className="filter-section-label">Join basonta</p>
                <div className="filter-options">
                  {["Yes", "No", "Maybe"].map((opt) => (
                    <button
                      key={opt}
                      className={`filter-option-btn ${filterJoinBasonta === opt ? "selected" : ""}`}
                      onClick={() => setFilterJoinBasonta(filterJoinBasonta === opt ? "" : opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
      </div>

      {/* ACTIVE FILTER CHIPS */}
      {activeFiltersCount > 0 && (
        <div className="active-filters">
          {filterDateFrom && (
            <div className="filter-chip">
              From: {filterDateFrom}
              <button onClick={() => setFilterDateFrom("")}><X size={12} /></button>
            </div>
          )}
          {filterDateTo && (
            <div className="filter-chip">
              To: {filterDateTo}
              <button onClick={() => setFilterDateTo("")}><X size={12} /></button>
            </div>
          )}
          {filterJoinChurch && (
            <div className="filter-chip">
              Church: {filterJoinChurch}
              <button onClick={() => setFilterJoinChurch("")}><X size={12} /></button>
            </div>
          )}
          {filterJoinBasonta && (
            <div className="filter-chip">
              Basonta: {filterJoinBasonta}
              <button onClick={() => setFilterJoinBasonta("")}><X size={12} /></button>
            </div>
          )}
        </div>
      )}

      {/* CONTENT */}
      <div className="ft-content">
        <div className="ft-action-row">
          <button className="qr-btn" onClick={() => setShowQR(true)}>
            Generate QR Code
          </button>
          <button className="import-btn" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} />
            Import CSV / Excel
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: "none" }}
          onChange={handleFileImport}
        />

        {loading ? (
          <p className="ft-empty">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="ft-empty">No first timers found.</p>
        ) : (
          filtered.map((ft) => (
            <div
              key={ft.id}
              className="ft-card"
              onClick={() => { setSelectedPerson(ft); setOpenMenuId(null); }}
            >
              <div className="ft-card-top">
                <div className="ft-avatar">{getInitials(ft.fullName)}</div>
                <div className="ft-card-info">
                  <p className="ft-name">{ft.fullName}</p>
                  <div className="ft-detail"><Phone size={13} /><span>{ft.phoneNumber}</span></div>
                  {ft.hostel && <div className="ft-detail"><Building2 size={13} /><span>{ft.hostel}</span></div>}
                  {ft.area && <div className="ft-detail"><Mail size={13} /><span>{ft.area}</span></div>}
                </div>
                <div className="ft-menu-wrap" onClick={(e) => e.stopPropagation()}>
                  <button className="ft-menu-btn" onClick={() => setOpenMenuId(openMenuId === ft.id ? null : ft.id)}>
                    <MoreHorizontal size={18} />
                  </button>
                  {openMenuId === ft.id && (
                    <div className="ft-dropdown">
                      <button onClick={() => { setSelectedPerson(ft); setOpenMenuId(null); }}>View details</button>
                      <button className="danger" onClick={() => { setDeleteConfirmId(ft.id); setDeleteConfirmName(ft.fullName); setOpenMenuId(null); }}>Remove</button>
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
        <div className="nav-item" onClick={() => navigate("/dashboard")}><Home size={22} /><span>Home</span></div>
        <div className="nav-item active"><User size={22} /><span>Profile</span></div>
        <div className="nav-item" onClick={() => navigate("/calendar")}><Calendar size={22} /><span>Calendar</span></div>
        <div className="nav-item" onClick={() => navigate("/settings")}><Settings size={22} /><span>Settings</span></div>
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => navigate("/first-timers/register")}>
        <Plus size={24} color="#fff" />
      </button>

      {/* IMPORT MODAL */}
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
                <p className="import-progress-text">Importing {importProgress.done} of {importProgress.total}...</p>
                <div className="import-progress-bar">
                  <div className="import-progress-fill" style={{ width: `${importProgress.total > 0 ? (importProgress.done / importProgress.total) * 100 : 0}%` }} />
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
                <button className="settings-save-btn" onClick={() => setShowImportModal(false)}>Done</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* QR MODAL */}
      {showQR && (
        <div className="modal-overlay" onClick={() => setShowQR(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Scan to Register</h3>
              <button className="modal-close" onClick={() => setShowQR(false)}><X size={20} /></button>
            </div>
            <p className="modal-subtitle">First timers scan this to fill their details</p>
            <div className="qr-wrapper"><QRCode value={REGISTER_URL} size={200} /></div>
            <p className="qr-url">{REGISTER_URL}</p>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedPerson && (
        <div className="modal-overlay" onClick={() => setSelectedPerson(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedPerson.fullName}</h3>
              <button className="modal-close" onClick={() => setSelectedPerson(null)}><X size={20} /></button>
            </div>
            <div className="detail-avatar">{getInitials(selectedPerson.fullName)}</div>
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
                { label: "Basonta choice", value: selectedPerson.basontaChoice },
                { label: "Knows in church", value: selectedPerson.knownPerson },
                { label: "Visit date", value: selectedPerson.visitDate },
              ].filter((row) => row.value).map((row) => (
                <div className="detail-row" key={row.label}>
                  <span className="detail-label">{row.label}</span>
                  <span className="detail-value">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="confirm-popup" onClick={(e) => e.stopPropagation()}>
            <p className="confirm-message">
              Are you sure you want to remove <strong>{deleteConfirmName}</strong>? This action cannot be undone.
            </p>
            <div className="confirm-actions">
              <button className="confirm-cancel-btn" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
              <button className="confirm-delete-btn" onClick={handleDelete}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
}