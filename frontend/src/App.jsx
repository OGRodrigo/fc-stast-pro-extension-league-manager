import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { HelmetProvider } from "react-helmet-async";

import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import MainLayout from "./layout/MainLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Clubs from "./pages/Clubs";
import Tournaments from "./pages/Tournaments";
import TournamentDetail from "./pages/TournamentDetail";
import CreateMatch from "./pages/CreateMatch";
import ImportMatchImage from "./pages/ImportMatchImage";
import MatchDetail from "./pages/MatchDetail";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import PublicTournamentPage from "./pages/PublicTournamentPage";
import StreamModePage from "./pages/StreamModePage";
import LandingPage from "./pages/LandingPage";

import TermsPage from "./pages/legal/TermsPage";
import PrivacyPage from "./pages/legal/PrivacyPage";
import DisclaimerPage from "./pages/legal/DisclaimerPage";

export default function App() {
  return (
    <HelmetProvider>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* Public pages */}
          <Route
            path="/public/tournaments/:slug"
            element={<PublicTournamentPage />}
          />
          <Route
            path="/stream/tournament/:slug"
            element={<StreamModePage />}
          />

          <Route path="/legal/terms" element={<TermsPage />} />
          <Route path="/legal/privacy" element={<PrivacyPage />} />
          <Route path="/legal/disclaimer" element={<DisclaimerPage />} />

          {/* Auth pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Protected app */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clubs" element={<Clubs />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/tournaments/:id" element={<TournamentDetail />} />
            <Route path="/settings" element={<Settings />} />

            <Route
              path="/tournaments/:id/matches/create"
              element={<CreateMatch />}
            />

            <Route
              path="/tournaments/:id/matches/import-image"
              element={<ImportMatchImage />}
            />

            <Route
              path="/tournaments/:id/matches/:matchId"
              element={<MatchDetail />}
            />

            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Global fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background:
                "linear-gradient(180deg, rgba(13,34,43,.96), rgba(6,16,22,.98))",
              color: "#fff",
              border: "1px solid rgba(36,255,122,.18)",
              borderRadius: "18px",
              boxShadow:
                "0 0 0 1px rgba(255,255,255,.03), 0 20px 50px rgba(0,0,0,.45)",
              padding: "14px 16px",
              fontSize: "14px",
            },
            success: {
              iconTheme: {
                primary: "#24ff7a",
                secondary: "#04110b",
              },
            },
            error: {
              iconTheme: {
                primary: "#ff4d6d",
                secondary: "#18060a",
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
    </HelmetProvider>
  );
}