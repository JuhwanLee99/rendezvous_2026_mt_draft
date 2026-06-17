import { Navigate, Route, Routes } from "react-router-dom";
import StatusPage from "./pages/StatusPage.jsx";
import CaptainPage from "./pages/CaptainPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import BoardPage from "./pages/BoardPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StatusPage />} />
      <Route path="/board" element={<BoardPage />} />
      <Route path="/team" element={<CaptainPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
