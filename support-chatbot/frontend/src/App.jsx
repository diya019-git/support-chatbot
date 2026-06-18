import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, AdminOnlyRoute } from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import FAQManagement from "./pages/FAQManagement";
import ChatHistory from "./pages/ChatHistory";
import ChatDetail from "./pages/ChatDetail";
import UserManagement from "./pages/UserManagement";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/admin/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="chats" element={<ChatHistory />} />
            <Route path="chats/:sessionId" element={<ChatDetail />} />
            <Route path="faqs" element={<FAQManagement />} />
            <Route
              path="users"
              element={
                <AdminOnlyRoute>
                  <UserManagement />
                </AdminOnlyRoute>
              }
            />
          </Route>
          <Route path="*" element={<Landing />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
