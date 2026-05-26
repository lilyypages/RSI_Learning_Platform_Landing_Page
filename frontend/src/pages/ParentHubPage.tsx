import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/client";

interface Child {
  userId: string;
  name: string;
  className: string;
  nis: string;
  totalPoints: number;
  quizCount: number;
}

function ParentHubPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/parent/children").then((res) => {
      setChildren(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Parent Hub</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">Dashboard</Link>
            <Link to="/change-password" className="text-sm text-blue-600 hover:underline">Ubah Password</Link>
            <button onClick={() => { logout(); navigate("/login"); }} className="text-sm text-red-600 hover:underline">Keluar</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Anak Saya</h2>

        {loading && <p className="text-gray-500">Memuat...</p>}

        {!loading && children.length === 0 && (
          <p className="text-gray-500">Belum ada data anak.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {children.map((child) => (
            <Link
              key={child.userId}
              to={`/parent-hub/child/${child.userId}`}
              className="block p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition"
            >
              <h3 className="font-semibold text-gray-800 text-lg">{child.name}</h3>
              <p className="text-sm text-gray-500 mt-1">Kelas: {child.className}</p>
              <p className="text-sm text-gray-500">NIS: {child.nis}</p>
              <div className="flex gap-4 mt-3 text-sm">
                <span className="text-blue-600 font-medium">{child.totalPoints} Poin</span>
                <span className="text-gray-400">{child.quizCount} Kuis</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

export default ParentHubPage;
