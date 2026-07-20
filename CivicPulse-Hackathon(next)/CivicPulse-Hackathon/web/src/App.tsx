import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/AuthContext";
import { IssuesProvider } from "./lib/IssuesContext";
import { MainLayout } from "./layouts/MainLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { OfficerLayout } from "./layouts/OfficerLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Pages
import { Dashboard } from "./pages/Dashboard";
import { ReportIssue } from "./pages/ReportIssue";
import { NearbyIssues } from "./pages/NearbyIssues";
import { Leaderboard } from "./pages/Leaderboard";
import { AIAssistant } from "./pages/AIAssistant";
import { Profile } from "./pages/Profile";
import { Login } from "./pages/Login";
import { Gallery } from "./pages/Gallery";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminUsers } from "./pages/AdminUsers";
import { AdminDepartments } from "./pages/AdminDepartments";
import { OfficerDashboard } from "./pages/OfficerDashboard";

function App() {
  return (
    <AuthProvider>
      <IssuesProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/report" element={<ReportIssue />} />
              <Route path="/nearby" element={<NearbyIssues />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/assistant" element={<AIAssistant />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/departments" element={<AdminDepartments />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["officer", "admin"]} />}>
            <Route element={<OfficerLayout />}>
              <Route path="/officer" element={<OfficerDashboard />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </IssuesProvider>
    </AuthProvider>
  );
}

export default App;
