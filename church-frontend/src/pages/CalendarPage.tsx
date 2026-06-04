import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Calendar,
  Settings,
  User,
  ArrowLeft,
} from "lucide-react";
import "../styles/CalendarPage.css";
import { API_URL } from "../App";

interface Member {
  id: number;
  firstName: string;
  lastName: string;
  birthdate?: string;
}

interface Birthday {
  name: string;
  day: number;
  month: number;
  year: number;
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch(`${API_URL}/api/members`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setMembers(Array.isArray(data) ? data : []);
      } catch {
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  // Get birthdays for current month
  const getBirthdaysForMonth = (month: number): Birthday[] => {
    return members
      .filter((m) => {
        if (!m.birthdate) return false;
        const date = new Date(m.birthdate);
        return date.getMonth() === month;
      })
      .map((m) => {
        const date = new Date(m.birthdate!);
        return {
          name: `${m.firstName} ${m.lastName}`,
          day: date.getDate(),
          month: date.getMonth(),
          year: date.getFullYear(),
        };
      })
      .sort((a, b) => a.day - b.day);
  };

  // Get birthdays for a specific day
  const getBirthdaysForDay = (day: number, month: number): Birthday[] => {
    return members
      .filter((m) => {
        if (!m.birthdate) return false;
        const date = new Date(m.birthdate);
        return date.getDate() === day && date.getMonth() === month;
      })
      .map((m) => {
        const date = new Date(m.birthdate!);
        return {
          name: `${m.firstName} ${m.lastName}`,
          day: date.getDate(),
          month: date.getMonth(),
          year: date.getFullYear(),
        };
      });
  };

  // Get upcoming birthdays (next 30 days)
  const getUpcomingBirthdays = (): { name: string; date: string; daysUntil: number }[] => {
    const upcoming: { name: string; date: string; daysUntil: number }[] = [];
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();

    members.forEach((m) => {
      if (!m.birthdate) return;
      const date = new Date(m.birthdate);
      const birthMonth = date.getMonth();
      const birthDay = date.getDate();

      // Calculate days until birthday this year
      const thisYearBirthday = new Date(today.getFullYear(), birthMonth, birthDay);
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1);
      }

      const daysUntil = Math.ceil(
        (thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntil <= 30) {
        upcoming.push({
          name: `${m.firstName} ${m.lastName}`,
          date: thisYearBirthday.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
          }),
          daysUntil,
        });
      }
    });

    return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
  };

  // Build calendar days
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const birthdaysThisMonth = getBirthdaysForMonth(currentMonth);
  const upcomingBirthdays = getUpcomingBirthdays();

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear();

  const hasBirthday = (day: number) =>
    getBirthdaysForDay(day, currentMonth).length > 0;

  return (
    <div className="calendar-page">

      {/* HEADER */}
      <div className="calendar-header-card">
        <div className="calendar-header-top">
          <button className="cal-back-btn" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={20} />
          </button>
          <h2 className="calendar-title">Calendar</h2>
          <div style={{ width: 34 }} />
        </div>
      </div>

      <div className="calendar-content">

        {/* MONTH NAVIGATOR */}
        <div className="month-navigator">
          <button className="month-nav-btn" onClick={prevMonth}>
            <ChevronLeft size={20} />
          </button>
          <h3 className="month-title">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          <button className="month-nav-btn" onClick={nextMonth}>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* CALENDAR GRID */}
        <div className="calendar-card">
          {/* Day headers */}
          <div className="calendar-grid">
            {dayNames.map((d) => (
              <div key={d} className="cal-day-header">{d}</div>
            ))}

            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="cal-day empty" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const birthdays = getBirthdaysForDay(day, currentMonth);
              return (
                <div
                  key={day}
                  className={`cal-day ${isToday(day) ? "today" : ""} ${hasBirthday(day) ? "has-birthday" : ""}`}
                >
                  <span className="cal-day-number">{day}</span>
                  {birthdays.length > 0 && (
                    <span className="birthday-dot">🎂</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* BIRTHDAYS THIS MONTH */}
        {birthdaysThisMonth.length > 0 && (
          <div className="birthday-section">
            <p className="section-label">🎂 Birthdays in {monthNames[currentMonth]}</p>
            <div className="birthday-list">
              {birthdaysThisMonth.map((b, i) => (
                <div key={i} className="birthday-item">
                  <div className="birthday-avatar">
                    {b.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div className="birthday-info">
                    <p className="birthday-name">{b.name}</p>
                    <p className="birthday-date">
                      {monthNames[b.month]} {b.day}
                      {b.day === today.getDate() && b.month === today.getMonth()
                        ? " 🎉 Today!"
                        : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* UPCOMING BIRTHDAYS */}
        {upcomingBirthdays.length > 0 && (
          <div className="birthday-section">
            <p className="section-label">⏳ Upcoming — Next 30 Days</p>
            <div className="birthday-list">
              {upcomingBirthdays.map((b, i) => (
                <div key={i} className="birthday-item">
                  <div className="birthday-avatar upcoming">
                    {b.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div className="birthday-info">
                    <p className="birthday-name">{b.name}</p>
                    <p className="birthday-date">{b.date}</p>
                  </div>
                  <div className={`days-badge ${b.daysUntil === 0 ? "today" : ""}`}>
                    {b.daysUntil === 0 ? "Today!" : `${b.daysUntil}d`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && upcomingBirthdays.length === 0 && birthdaysThisMonth.length === 0 && (
          <p className="cal-empty">No birthdays found. Add birthdates to your members!</p>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div className="bottom-nav">
        <div className="nav-item" onClick={() => navigate("/dashboard")}>
          <Home size={22} /><span>Home</span>
        </div>
        <div className="nav-item active">
          <Calendar size={22} /><span>Calendar</span>
        </div>
        <div className="nav-item" onClick={() => navigate("/settings")}>
          <Settings size={22} /><span>Settings</span>
        </div>
        <div className="nav-item" onClick={() => navigate("/settings", { state: { openProfile: true } })}>
          <User size={22} /><span>Profile</span>
        </div>
      </div>
    </div>
  );
}