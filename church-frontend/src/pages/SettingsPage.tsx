import {
  ArrowLeft,
  User,
  Church,
  Bell,
  Download,
  Lock,
  ChevronRight,
  Home,
  Calendar,
  Settings,
  Check,
  Plus,
  X,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "../styles/SettingsPage.css";
import { apiCall } from "../utils/api";

interface ChurchData {
  churchName: string;
  address: string;
  serviceDay: string;
  serviceTime: string;
  firstTimerAlert: boolean;
  alertEmails: string[];
}

export default function SettingsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  /* ── Profile state ── */
  const [profileForm, setProfileForm] = useState({ username: "", email: "" });
  const [profileOpen, setProfileOpen]       = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError]     = useState("");

  /* ── Password state ── */
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [passwordOpen, setPasswordOpen]       = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError]     = useState("");

  /* ── Church state ── */
  const [churchForm, setChurchForm] = useState<ChurchData>({
    churchName: "", address: "", serviceDay: "Sunday",
    serviceTime: "09:00", firstTimerAlert: true, alertEmails: [],
  });
  const [churchOpen, setChurchOpen]       = useState(false);
  const [churchLoading, setChurchLoading] = useState(false);
  const [churchError, setChurchError]     = useState("");

  /* ── Notifications panel ── */
  const [notifOpen, setNotifOpen]         = useState(false);
  const [togglingAlert, setTogglingAlert] = useState(false);

  /* ── Alert recipients panel ── */
  const [recipientsOpen, setRecipientsOpen] = useState(false);
  const [newEmail, setNewEmail]             = useState("");
  const [emailError, setEmailError]         = useState("");
  const [savingEmails, setSavingEmails]     = useState(false);

  /* ── Ref to always hold latest alertEmails ── */
  const alertEmailsRef = useRef<string[]>([]);

  /* ── Auto-open profile if navigated from Profile nav button ── */
  useEffect(() => {
    if (location.state?.openProfile) {
      setProfileOpen(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  /* ── Toast ── */
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Load profile ── */
  useEffect(() => {
    apiCall<{ username: string; email: string }>("/api/profile", { method: "GET" })
      .then((res) => {
        if (res.ok && res.data) {
          setProfileForm({ username: res.data.username, email: res.data.email });
        }
      });
  }, []);

  /* ── Load church info ── */
  useEffect(() => {
    apiCall<ChurchData>("/api/church", { method: "GET" }).then((res) => {
      if (res.ok && res.data) {
        const emails = Array.isArray(res.data.alertEmails) ? res.data.alertEmails : [];
        alertEmailsRef.current = emails;
        setChurchForm({
          churchName:      res.data.churchName      || "",
          address:         res.data.address         || "",
          serviceDay:      res.data.serviceDay       || "Sunday",
          serviceTime:     res.data.serviceTime      || "09:00",
          firstTimerAlert: res.data.firstTimerAlert  ?? true,
          alertEmails:     emails,
        });
      }
    });
  }, []);

  /* ── Save profile ── */
  const handleProfileSave = async () => {
    setProfileError("");
    if (!profileForm.username.trim()) { setProfileError("Name cannot be empty."); return; }
    setProfileLoading(true);
    const res = await apiCall("/api/profile", {
      method: "PUT",
      body: JSON.stringify({ username: profileForm.username, email: profileForm.email }),
    });
    setProfileLoading(false);
    if (!res.ok) { setProfileError(res.error || "Failed to update profile."); }
    else { setProfileOpen(false); showToast("Profile updated successfully", "success"); }
  };

  /* ── Change password ── */
  const handlePasswordSave = async () => {
    setPasswordError("");
    if (!passwordForm.current) { setPasswordError("Enter your current password."); return; }
    if (passwordForm.next.length < 6) { setPasswordError("New password must be at least 6 characters."); return; }
    if (passwordForm.next !== passwordForm.confirm) { setPasswordError("Passwords do not match."); return; }
    setPasswordLoading(true);
    const res = await apiCall("/api/profile/change-password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword: passwordForm.current, newPassword: passwordForm.next }),
    });
    setPasswordLoading(false);
    if (!res.ok) { setPasswordError(res.error || "Failed to change password."); }
    else {
      setPasswordForm({ current: "", next: "", confirm: "" });
      setPasswordOpen(false);
      showToast("Password changed successfully", "success");
    }
  };

  /* ── Save church info ── */
  const handleChurchSave = async () => {
    setChurchError("");
    if (!churchForm.churchName.trim()) { setChurchError("Church name is required."); return; }
    setChurchLoading(true);
    const res = await apiCall("/api/church", {
      method: "PUT",
      body: JSON.stringify(churchForm),
    });
    setChurchLoading(false);
    if (!res.ok) { setChurchError(res.error || "Failed to save church info."); }
    else { setChurchOpen(false); showToast("Church info saved successfully", "success"); }
  };

  /* ── Toggle first timer alert ── */
  const handleFirstTimerToggle = async () => {
    const newValue = !churchForm.firstTimerAlert;
    setChurchForm((prev) => ({ ...prev, firstTimerAlert: newValue }));
    setTogglingAlert(true);
    const res = await apiCall("/api/church", {
      method: "PUT",
      body: JSON.stringify({ ...churchForm, firstTimerAlert: newValue }),
    });
    setTogglingAlert(false);
    if (!res.ok) {
      setChurchForm((prev) => ({ ...prev, firstTimerAlert: !newValue }));
      showToast("Failed to update notification setting", "error");
    } else {
      showToast(newValue ? "First timer alerts turned on" : "First timer alerts turned off", "success");
    }
  };

  /* ── Add email to recipients list ── */
  const handleAddEmail = () => {
    setEmailError("");
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) { setEmailError("Please enter an email address."); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) { setEmailError("Please enter a valid email address."); return; }
    if (alertEmailsRef.current.includes(trimmed)) { setEmailError("This email is already in the list."); return; }
    if (alertEmailsRef.current.length >= 3) { setEmailError("Maximum of 3 recipients allowed."); return; }
    const updated = [...alertEmailsRef.current, trimmed];
    alertEmailsRef.current = updated;
    setChurchForm((prev) => ({ ...prev, alertEmails: updated }));
    setNewEmail("");
  };

  /* ── Remove email from list ── */
  const handleRemoveEmail = (email: string) => {
    const updated = alertEmailsRef.current.filter((e) => e !== email);
    alertEmailsRef.current = updated;
    setChurchForm((prev) => ({ ...prev, alertEmails: updated }));
  };

  /* ── Save recipients to backend ── */
  const handleSaveRecipients = async () => {
    setEmailError("");

    // Auto-add any typed email before saving
    if (newEmail.trim()) {
      const trimmed = newEmail.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) { setEmailError("Please enter a valid email address."); return; }
      if (alertEmailsRef.current.includes(trimmed)) { setEmailError("This email is already in the list."); return; }
      if (alertEmailsRef.current.length >= 3) { setEmailError("Maximum of 3 recipients allowed."); return; }
      const updated = [...alertEmailsRef.current, trimmed];
      alertEmailsRef.current = updated;
      setChurchForm((prev) => ({ ...prev, alertEmails: updated }));
      setNewEmail("");
    }

    setSavingEmails(true);
    const payload = { ...churchForm, alertEmails: alertEmailsRef.current };
    const res = await apiCall("/api/church", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    setSavingEmails(false);
    if (!res.ok) {
      showToast(res.error || "Failed to save recipients", "error");
    } else {
      setRecipientsOpen(false);
      showToast("Alert recipients saved", "success");
    }
  };

  /* ── Export ── */
  const handleExport = (type: "members" | "attendance" | "firstTimers") => {
    const labels: Record<string, string> = {
      members: "members", attendance: "attendance", firstTimers: "first-timers",
    };
    alert(`Exporting ${labels[type]} data…\n(Connect this to your API export endpoint)`);
  };

  return (
    <div className="settings-page">

      {/* HEADER */}
      <div className="settings-header-card">
        <div className="settings-header">
          <div className="header-left">
            <div className="icon-circle" onClick={() => navigate("/dashboard")}>
              <ArrowLeft size={20} />
            </div>
            <div className="title-block">
              <h2>Settings</h2>
              <p>Manage your app preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-content">

        {/* ── Account ── */}
        <p className="settings-section-label">Account</p>

        {/* Profile */}
        <div className="settings-card">
          <div className="settings-row clickable"
            onClick={() => { setProfileOpen(!profileOpen); setProfileError(""); }}>
            <div className="settings-row-left">
              <div className="settings-icon-bg blue"><User size={18} /></div>
              <div>
                <p className="settings-row-title">Profile</p>
                <p className="settings-row-sub">
                  {profileForm.username || "Name"} · {profileForm.email || "Email"}
                </p>
              </div>
            </div>
            <ChevronRight size={18} className={`settings-chevron ${profileOpen ? "settings-chevron--open" : ""}`} />
          </div>
          {profileOpen && (
            <div className="settings-form">
              {profileError && <p className="settings-error">{profileError}</p>}
              <div className="settings-field">
                <label>Name</label>
                <input type="text" value={profileForm.username}
                  onChange={(e) => setProfileForm((p) => ({ ...p, username: e.target.value }))} />
              </div>
              <div className="settings-field">
                <label>Email address</label>
                <input type="email" value={profileForm.email}
                  onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <button className="settings-save-btn" onClick={handleProfileSave} disabled={profileLoading}>
                {profileLoading ? "Saving…" : "Save changes"}
              </button>
            </div>
          )}
        </div>

        {/* Change Password */}
        <div className="settings-card">
          <div className="settings-row clickable"
            onClick={() => { setPasswordOpen(!passwordOpen); setPasswordError(""); }}>
            <div className="settings-row-left">
              <div className="settings-icon-bg purple"><Lock size={18} /></div>
              <div>
                <p className="settings-row-title">Change password</p>
                <p className="settings-row-sub">Update your login password</p>
              </div>
            </div>
            <ChevronRight size={18} className={`settings-chevron ${passwordOpen ? "settings-chevron--open" : ""}`} />
          </div>
          {passwordOpen && (
            <div className="settings-form">
              {passwordError && <p className="settings-error">{passwordError}</p>}
              <div className="settings-field">
                <label>Current password</label>
                <input type="password" value={passwordForm.current}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))} />
              </div>
              <div className="settings-field">
                <label>New password</label>
                <input type="password" value={passwordForm.next}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, next: e.target.value }))} />
              </div>
              <div className="settings-field">
                <label>Confirm new password</label>
                <input type="password" value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))} />
              </div>
              <button className="settings-save-btn" onClick={handlePasswordSave} disabled={passwordLoading}>
                {passwordLoading ? "Updating…" : "Update password"}
              </button>
            </div>
          )}
        </div>

        {/* ── Church ── */}
        <p className="settings-section-label">Church</p>

        <div className="settings-card">
          <div className="settings-row clickable"
            onClick={() => { setChurchOpen(!churchOpen); setChurchError(""); }}>
            <div className="settings-row-left">
              <div className="settings-icon-bg orange"><Church size={18} /></div>
              <div>
                <p className="settings-row-title">Church info</p>
                <p className="settings-row-sub">
                  {churchForm.churchName || "Name, address & service times"}
                </p>
              </div>
            </div>
            <ChevronRight size={18} className={`settings-chevron ${churchOpen ? "settings-chevron--open" : ""}`} />
          </div>
          {churchOpen && (
            <div className="settings-form">
              {churchError && <p className="settings-error">{churchError}</p>}
              <div className="settings-field">
                <label>Church name</label>
                <input type="text" value={churchForm.churchName}
                  onChange={(e) => setChurchForm((p) => ({ ...p, churchName: e.target.value }))} />
              </div>
              <div className="settings-field">
                <label>Address</label>
                <input type="text" placeholder="e.g. 12 Main Street, Accra"
                  value={churchForm.address}
                  onChange={(e) => setChurchForm((p) => ({ ...p, address: e.target.value }))} />
              </div>
              <div className="settings-field">
                <label>Service day</label>
                <select value={churchForm.serviceDay}
                  onChange={(e) => setChurchForm((p) => ({ ...p, serviceDay: e.target.value }))}>
                  {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map(
                    (d) => <option key={d}>{d}</option>
                  )}
                </select>
              </div>
              <div className="settings-field">
                <label>Service time</label>
                <input type="time" value={churchForm.serviceTime}
                  onChange={(e) => setChurchForm((p) => ({ ...p, serviceTime: e.target.value }))} />
              </div>
              <button className="settings-save-btn" onClick={handleChurchSave} disabled={churchLoading}>
                {churchLoading ? "Saving…" : "Save changes"}
              </button>
            </div>
          )}
        </div>

        {/* ── Notifications ── */}
        <p className="settings-section-label">Notifications</p>

        <div className="settings-card">
          <div className="settings-row clickable" onClick={() => setNotifOpen(!notifOpen)}>
            <div className="settings-row-left">
              <div className="settings-icon-bg green"><Bell size={18} /></div>
              <div>
                <p className="settings-row-title">Notifications</p>
                <p className="settings-row-sub">Email alerts &amp; reminders</p>
              </div>
            </div>
            <ChevronRight size={18} className={`settings-chevron ${notifOpen ? "settings-chevron--open" : ""}`} />
          </div>

          {notifOpen && (
            <div className="settings-form">
              <div className="settings-toggle-row">
                <div>
                  <p className="settings-toggle-label">New first timer registered</p>
                  <p className="settings-toggle-sub">Get an email when someone new registers</p>
                </div>
                <button
                  className={`settings-toggle ${churchForm.firstTimerAlert ? "settings-toggle--on" : ""}`}
                  onClick={handleFirstTimerToggle}
                  disabled={togglingAlert}
                  aria-label="Toggle first timer alert"
                >
                  <span className="settings-toggle-thumb" />
                </button>
              </div>

              {churchForm.firstTimerAlert && (
                <div className="recipients-section">
                  <div
                    className="recipients-header clickable"
                    onClick={() => { setRecipientsOpen(!recipientsOpen); setEmailError(""); setNewEmail(""); }}
                  >
                    <div>
                      <p className="settings-toggle-label">Alert recipients</p>
                      <p className="settings-toggle-sub">
                        {churchForm.alertEmails.length === 0
                          ? "No recipients set — add up to 3 emails"
                          : `${churchForm.alertEmails.length} of 3 recipient${churchForm.alertEmails.length > 1 ? "s" : ""} set`}
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className={`settings-chevron ${recipientsOpen ? "settings-chevron--open" : ""}`}
                    />
                  </div>

                  {recipientsOpen && (
                    <div className="recipients-body">
                      {churchForm.alertEmails.length === 0 ? (
                        <p className="recipients-empty">No recipients yet. Add up to 3 emails below.</p>
                      ) : (
                        <div className="recipients-list">
                          {churchForm.alertEmails.map((email) => (
                            <div key={email} className="recipient-chip">
                              <span>{email}</span>
                              <button
                                className="recipient-remove"
                                onClick={() => handleRemoveEmail(email)}
                                aria-label={`Remove ${email}`}
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {churchForm.alertEmails.length < 3 && (
                        <div className="recipient-add-row">
                          <input
                            type="email"
                            className="recipient-input"
                            placeholder="Enter email address"
                            value={newEmail}
                            onChange={(e) => { setNewEmail(e.target.value); setEmailError(""); }}
                            onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
                          />
                          <button className="recipient-add-btn" onClick={handleAddEmail}>
                            <Plus size={16} />
                          </button>
                        </div>
                      )}

                      {emailError && <p className="settings-error">{emailError}</p>}

                      {churchForm.alertEmails.length === 3 && (
                        <p className="recipients-max-note">Maximum of 3 recipients reached.</p>
                      )}

                      <button
                        className="settings-save-btn"
                        onClick={handleSaveRecipients}
                        disabled={savingEmails}
                      >
                        {savingEmails ? "Saving…" : "Save recipients"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="settings-toggle-row">
                <div>
                  <p className="settings-toggle-label">Attendance reminders</p>
                  <p className="settings-toggle-sub">Coming soon</p>
                </div>
                <button className="settings-toggle" disabled aria-label="Toggle attendance reminder">
                  <span className="settings-toggle-thumb" />
                </button>
              </div>

              <div className="settings-toggle-row">
                <div>
                  <p className="settings-toggle-label">Weekly summary</p>
                  <p className="settings-toggle-sub">Coming soon</p>
                </div>
                <button className="settings-toggle" disabled aria-label="Toggle weekly summary">
                  <span className="settings-toggle-thumb" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Data & Export ── */}
        <p className="settings-section-label">Data &amp; Export</p>

        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-icon-bg teal"><Download size={18} /></div>
              <div>
                <p className="settings-row-title">Export data</p>
                <p className="settings-row-sub">Download records as CSV</p>
              </div>
            </div>
          </div>
          <div className="settings-export-btns">
            <button className="export-btn" onClick={() => handleExport("members")}>Members</button>
            <button className="export-btn" onClick={() => handleExport("attendance")}>Attendance</button>
            <button className="export-btn" onClick={() => handleExport("firstTimers")}>First timers</button>
          </div>
        </div>

        <p className="settings-version">Fountain Manager · v1.0.0</p>
      </div>

      {/* TOAST */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          <Check size={15} />
          {toast.message}
        </div>
      )}

      {/* BOTTOM NAV */}
      <div className="bottom-nav">
        <div className="nav-item" onClick={() => navigate("/dashboard")}>
          <Home size={22} /><span>Home</span>
        </div>
        <div className="nav-item">
          <Calendar size={22} /><span>Calendar</span>
        </div>
        <div className="nav-item active">
          <Settings size={22} /><span>Settings</span>
        </div>
        <div className="nav-item">
          <User size={22} /><span>Profile</span>
        </div>
      </div>
    </div>
  );
}