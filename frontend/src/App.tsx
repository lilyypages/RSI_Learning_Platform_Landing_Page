import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import QuizPage from "./pages/QuizPage";
import TeacherPanelPage from "./pages/TeacherPanelPage";
import ParentHubPage from "./pages/ParentHubPage";
import ParentChildDetailPage from "./pages/ParentChildDetailPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/register"
            element={
              <ProtectedRoute allowedRoles={["PRINCIPAL"]}>
                <RegisterPage />
              </ProtectedRoute>
            }
          />
          <Route path="/change-password" element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          } />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <QuizPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher-panel"
            element={
              <ProtectedRoute allowedRoles={["TEACHER"]}>
                <TeacherPanelPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent-hub"
            element={
              <ProtectedRoute allowedRoles={["PARENT"]}>
                <ParentHubPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent-hub/child/:id"
            element={
              <ProtectedRoute allowedRoles={["PARENT"]}>
                <ParentChildDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
