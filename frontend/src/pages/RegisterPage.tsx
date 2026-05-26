import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/client";

const ROLE_OPTIONS = [
  { value: "STUDENT", label: "Murid" },
  { value: "PARENT", label: "Orang Tua" },
  { value: "TEACHER", label: "Guru" },
] as const;

interface ClassOption {
  id: string;
  name: string;
}

interface ParentOption {
  userId: string;
  name: string;
}

function RegisterPage() {
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [nis, setNis] = useState("");
  const [nip, setNip] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [classId, setClassId] = useState("");
  const [parentId, setParentId] = useState("");
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [parents, setParents] = useState<ParentOption[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    if (role === "STUDENT") {
      api.get("/teacher/classes").then((res) => {
        setClasses(res.data.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
      }).catch(() => {});

      api.get("/teacher/parents").then((res) => {
        setParents(res.data.map((p: { userId: string; user: { name: string } }) => ({ userId: p.userId, name: p.user.name })));
      }).catch(() => {
        setParents([]);
      });
    }
  }, [role]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Silakan isi semua field.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok.");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    if (role === "STUDENT" && !nis) {
      setError("NIS wajib untuk murid.");
      return;
    }

    setLoading(true);
    try {
      const extra: Record<string, unknown> = {};
      if (role === "STUDENT") {
        extra.nis = nis;
        if (classId) extra.classId = classId;
        if (parentId) extra.parentId = parentId;
      } else if (role === "TEACHER") {
        if (nip) extra.nip = nip;
        if (phone) extra.phone = phone;
      } else if (role === "PARENT") {
        if (phone) extra.phone = phone;
        if (address) extra.address = address;
      }

      await register(name, email, password, confirmPassword, role, extra);

      setSuccess("Akun berhasil dibuat!");
      setCreatedUser({ name, email });

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setNis("");
      setNip("");
      setPhone("");
      setAddress("");
      setClassId("");
      setParentId("");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || "Pembuatan akun gagal.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Pembuatan akun gagal.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Buat Akun Baru
        </h1>
        <p className="text-center text-sm text-gray-500 mb-6">
          Daftarkan akun guru, orang tua, atau murid
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg mb-4">
            {success}
            {createdUser && (
              <p className="mt-1 font-medium">
                {createdUser.name} — {createdUser.email}
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nama lengkap"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="nama@email.com"
            />
          </div>

          {role === "TEACHER" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIP (opsional)</label>
              <input
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="NIP"
              />
            </div>
          )}

          {role === "STUDENT" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIS</label>
                <input
                  type="text"
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="NIS"
                />
              </div>
              {classes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kelas (opsional)</label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Pilih kelas</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {parents.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Orang Tua (opsional)</label>
                  <select
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Pilih orang tua</option>
                    {parents.map((p) => (
                      <option key={p.userId} value={p.userId}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {(role === "TEACHER" || role === "PARENT") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon (opsional)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="No. telepon"
              />
            </div>
          )}

          {role === "PARENT" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat (opsional)</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Alamat"
                rows={2}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Minimal 6 karakter"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ulangi password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "Memproses..." : "Buat Akun"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          <Link to="/dashboard" className="text-blue-600 hover:underline">
            Kembali ke Dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
