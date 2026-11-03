
import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./components/layout/Applayout";

import Dashboard from "./pages/Dashboard";
import Campaigns from "./pages/Campaigns";
import CreateCampaign from "./pages/CreateCampaign";
import Emails from "./pages/Emails";
import Senders from "./pages/Senders";
import Search from "./pages/Search";
import Integrations from "./pages/Integrations";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("reachinbox_token");

  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/campaigns/new" element={<CreateCampaign />} />
        <Route path="/emails" element={<Emails />} />
        <Route path="/senders" element={<Senders />} />
        <Route path="/search" element={<Search />} />
        <Route path="/integrations" element={<Integrations />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
