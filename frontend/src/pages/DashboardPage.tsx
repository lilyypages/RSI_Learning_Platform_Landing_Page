import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";

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
            <Link
              to="/change-password"
              className="text-sm text-blue-600 hover:underline"
            >
              Ubah Password
            </Link>
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
        <p className="text-gray-600 mb-8">
          Login berhasil. Pilih menu di bawah untuk memulai.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {user?.role === "STUDENT" && (
            <Link
              to="/quiz"
              className="block p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition"
            >
              <h3 className="font-semibold text-gray-800 mb-2">Kuis Adaptif</h3>
              <p className="text-sm text-gray-500">
                Ikuti kuis dengan tingkat kesulitan yang menyesuaikan kemampuanmu.
              </p>
            </Link>
          )}

          <Link
            to="/change-password"
            className="block p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition"
          >
            <h3 className="font-semibold text-gray-800 mb-2">Ubah Password</h3>
            <p className="text-sm text-gray-500">
              Perbarui password akunmu secara berkala.
            </p>
          </Link>

          <div className="block p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2">Profil</h3>
            <p className="text-sm text-gray-500">
              Role: {user?.role}<br />
              Email: {user?.email}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
