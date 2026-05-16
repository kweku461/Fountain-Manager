import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import VerifyEmail from "./pages/VerifyEmail";
import Members from "./pages/Members";
import CreateMember from "./pages/CreateMember";
import Services from "./pages/Services";
import CreateService from "./pages/CreateService";
import ProtectedRoute from "./components/ProtectedRoute";
import FirstTimerRegister from "./pages/FirstTimerRegister";
import FirstTimers from "./pages/FirstTimer";
import Attendance from "./pages/Attendance";
import AttendanceMark from "./pages/AttendanceMark";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/SettingsPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";



const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
export { API_URL };

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />


        {/* Public - no login needed, first timers scan and land here */}
        <Route path="/first-timers/register" element={<FirstTimerRegister />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
        <Route path="/members/create" element={<ProtectedRoute><CreateMember /></ProtectedRoute>} />
        <Route path="/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
        <Route path="/services/create" element={<ProtectedRoute><CreateService /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        {/* Attendance */}
        <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
        <Route path="/attendance/mark" element={<ProtectedRoute><AttendanceMark /></ProtectedRoute>} />
        <Route path="/attendance/mark/:serviceId" element={<ProtectedRoute><AttendanceMark /></ProtectedRoute>} />

        {/* First timers admin - protected */}
        <Route path="/first-timers" element={<ProtectedRoute><FirstTimers /></ProtectedRoute>} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}