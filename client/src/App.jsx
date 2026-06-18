import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ComingSoon from "./pages/ComingSoon";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthCallback from "./components/AuthCallback";
import Layout from "./components/Layout";
import HealthEvents from "./pages/HealthEvents"
import Analytics from "./pages/Analytics"
import LogEvents from "./pages/LogEvents"
import Settings from "./pages/Settings"
import SettingsPersonalInfo from "./pages/SettingsPersonalInfo"
import SettingsPassword from "./pages/SettingsPassword"
import SettingsLegal from "./pages/SettingsLegal"
import ResetPassword from "./pages/ResetPassword";
import ProfileOnBoarding from "./pages/ProfileOnBoarding";
import Medications from "./pages/Medications";
import DoctorReports from "./pages/DoctorReports";

const PLACEHOLDER_ROUTES = [
   "/timeline",
  "/community", "/ml-insights",
];

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-center" richColors />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Onboarding — protected but NO Layout */}
          <Route path="/onboarding" element={<ProtectedRoute><ProfileOnBoarding /></ProtectedRoute>} />

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/log-events" element={<LogEvents />} />
            <Route path="/health-events" element={<HealthEvents />} />
            <Route path="/reports" element={<DoctorReports />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/prescriptions" element={<Medications />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/personal-info" element={<SettingsPersonalInfo />} />
            <Route path="/settings/password" element={<SettingsPassword />} />
            <Route path="/settings/legal" element={<SettingsLegal />} />
            
            {PLACEHOLDER_ROUTES.map((path) => (
              <Route key={path} path={path} element={<ComingSoon />} />
            ))}
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
