import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">SIPANDA</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.name || user?.email} ({user?.role})
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:underline"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Selamat datang di SIPANDA!
        </h2>
        <p className="text-gray-600">
          Login berhasil. Halaman dashboard akan segera dikembangkan.
        </p>
      </main>
    </div>
  );
}

export default DashboardPage;
