import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

// Navbars
import Navbar from "./components/Navbar.jsx";
import SGNavbar from "./components/SGNavbar.jsx";
import AdminNavbar from "./components/AdminNavbar.jsx";

// Teacher Pages
import TeacherDashboard from "./pages/teacher/Dashboard.jsx";
import SchedulePage from "./pages/teacher/SchedulePage.jsx";
import AbsencePage from "./pages/teacher/AbsencePage.jsx";

// SG Pages
import AbsenceSGPage from "./pages/SG/AbsenceSGPage.jsx";
import SGDashboard from "./pages/SG/SGDashboard.jsx";
import SGStatistics from "./pages/SG/SGStatistics.jsx";
import ManageTrainees from "./pages/SG/ManageTrainees.jsx";
import ManageTheachers from "./pages/SG/ManageTheachers.jsx";
import SGUploadStagiaire from "./pages/SG/UploadStagiaire.jsx";
import TraineeDetailsPage from "./pages/SG/TraineeDetailsPage.jsx";
import TraineesListPage from "./pages/SG/TraineesListPage.jsx";

// Admin Pages
import LoginPage from "./pages/auth/LoginPage.jsx";
import Ajouter from "./pages/admin/Ajouter.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import Gerer from "./pages/admin/Gerer.jsx";
import TraineesList from "./pages/admin/TraineesList.jsx";
import "./index.css";

function App() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem("isAuthenticated") === "true");
  const [userRole, setUserRole] = useState(() => localStorage.getItem("userRole") || null);

  useEffect(() => {
    localStorage.setItem("isAuthenticated", isAuthenticated);
    localStorage.setItem("userRole", userRole);
  }, [isAuthenticated, userRole]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
  };

  const isLoginPage = location.pathname === "/login";
  const isSGRoute = location.pathname.startsWith("/sg");
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isTeacherRoute = !isSGRoute && !isAdminRoute && isAuthenticated && userRole === "teacher" && !isLoginPage;

  return (
    <div className="app">
      {/* Navbars */}
      {isAuthenticated && userRole === "teacher" && isTeacherRoute && <Navbar onLogout={handleLogout} />}
      {isAuthenticated && userRole === "sg" && isSGRoute && <SGNavbar onLogout={handleLogout} />}
      {isAuthenticated && userRole === "admin" && isAdminRoute && <AdminNavbar onLogout={handleLogout} />}

      <main className={`main-content ${!isAuthenticated ? "full-width" : ""}`}>
        <Routes>
          {/* Login */}
          <Route
            path="/login"
            element={
              <LoginPage
                setIsAuthenticated={setIsAuthenticated}
                setUserRole={setUserRole}
              />
            }
          />

          {/* Teacher Routes */}
          <Route
            path="/"
            element={
              isAuthenticated && userRole === "teacher" ? (
                <TeacherDashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/emploi-du-temps"
            element={
              isAuthenticated && userRole === "teacher" ? (
                <SchedulePage />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/gerer-absence"
            element={
              isAuthenticated && userRole === "teacher" ? (
                <AbsencePage />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* SG Routes */}
          <Route
            path="/sg"
            element={
              isAuthenticated && userRole === "sg" ? (
                <SGDashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/sg/dashboard"
            element={
              isAuthenticated && userRole === "sg" ? (
                <SGStatistics />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/sg/gerer-stagiaires"
            element={
              isAuthenticated && userRole === "sg" ? (
                <ManageTrainees />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/sg/gerer-formateurs"
            element={
              isAuthenticated && userRole === "sg" ? (
                <ManageTheachers />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/sg/absence"
            element={
              isAuthenticated && userRole === "sg" ? (
                <AbsenceSGPage />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/sg/upload-stagiaires"
            element={
              isAuthenticated && userRole === "sg" ? (
                <SGUploadStagiaire />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/sg/trainee-details/:cef"
            element={
              isAuthenticated && userRole === "sg" ? (
                <TraineeDetailsPage />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/sg/trainees-list"
            element={
              isAuthenticated && userRole === "sg" ? (
                <TraineesListPage />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              isAuthenticated && userRole === "admin" ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
    
          <Route
            path="/admin/Ajouter"
            element={
              isAuthenticated && userRole === "admin" ? (
                <Ajouter />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/admin/Gerer"
            element={
              isAuthenticated && userRole === "admin" ? (
                <Gerer />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/admin/liste-stagiaires"
            element={
              isAuthenticated && userRole === "admin" ? (
                <TraineesList />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
