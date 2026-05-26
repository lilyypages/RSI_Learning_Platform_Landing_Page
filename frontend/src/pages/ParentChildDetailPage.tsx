import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/client";

interface PerSubject {
  subjectName: string;
  totalScore: number;
  completionPercent: number;
  adaptiveLevel: string;
  lastActivity: string;
}

interface ProgressItem {
  weekStart: string;
  subjectName: string;
  avgScore: number;
  completionRate: number;
  kkmAchieved: boolean;
  recommendation: string | null;
}

interface Message {
  id: string;
  content: string;
  sentAt: string;
  sender: { id: string; name: string; role: string };
}

function ParentChildDetailPage() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<"summary" | "progress" | "messages">("summary");
  const [summary, setSummary] = useState<{ name: string; className: string; nis: string; totalPoints: number; perSubject: PerSubject[] } | null>(null);
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get(`/parent/children/${id}/summary`).then((r) => setSummary(r.data)).catch(() => {}),
      api.get(`/parent/children/${id}/progress`).then((r) => setProgress(r.data)).catch(() => {}),
      api.get("/parent/messages").then((r) => setMessages(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">{summary?.name || "Detail Anak"}</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <Link to="/parent-hub" className="text-sm text-blue-600 hover:underline">Kembali</Link>
            <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">Dashboard</Link>
            <button onClick={() => { logout(); }} className="text-sm text-red-600 hover:underline">Keluar</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {summary && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <p className="text-sm text-gray-500">Kelas: {summary.className} | NIS: {summary.nis} | Poin: {summary.totalPoints}</p>
          </div>
        )}

        <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2">
          {[["summary", "Ringkasan"], ["progress", "Grafik Kemajuan"], ["messages", "Pesan"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key as typeof tab)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
                tab === key ? "bg-white text-blue-600 border border-b-white border-gray-200 -mb-[3px]" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "summary" && summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.perSubject.map((p, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h4 className="font-semibold">{p.subjectName}</h4>
                <p className="text-sm text-gray-500">Skor: {p.totalScore}</p>
                <p className="text-sm text-gray-500">Progress: {p.completionPercent}%</p>
                <p className="text-sm text-gray-500">Level: {p.adaptiveLevel}</p>
                <p className="text-sm text-gray-400">Terakhir: {new Date(p.lastActivity).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "progress" && (
          <div>
            {progress.length === 0 && <p className="text-gray-500">Belum ada data progress.</p>}
            <div className="space-y-3">
              {progress.map((p, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{p.subjectName}</span>
                      <span className="text-sm text-gray-400 ml-2">{new Date(p.weekStart).toLocaleDateString()}</span>
                    </div>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                      p.kkmAchieved ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    }`}>
                      {p.kkmAchieved ? "Tercapai" : "Belum Tercapai"}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Rata-rata: {p.avgScore} | Completion: {Math.round(p.completionRate * 100)}%
                  </div>
                  {p.recommendation && (
                    <p className="text-sm text-gray-500 mt-1 italic">{p.recommendation}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "messages" && (
          <div>
            {messages.length === 0 && <p className="text-gray-500">Belum ada pesan.</p>}
            <div className="space-y-3">
              {messages.map((m) => (
                <div key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>Dari: {m.sender.name} ({m.sender.role})</span>
                    <span>{new Date(m.sentAt).toLocaleString()}</span>
                  </div>
                  <p className="text-gray-700">{m.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ParentChildDetailPage;
