import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/client";

interface StudentSummary {
  userId: string;
  name: string;
  className: string;
  averageScore: number;
  status: string;
  subjectCount: number;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface ClassSubject {
  id: string;
  class: { id: string; name: string };
  subject: { id: string; name: string };
  semester: number;
  academicYear: number;
}

interface Material {
  id: string;
  title: string;
  orderIndex: number;
  difficulty: string;
  isPublished: boolean;
  _count: { questions: number };
}

interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  difficulty: string;
  orderIndex: number;
}

type Tab = "students" | "subjects" | "materials" | "questions";

const STATUS_LABEL: Record<string, string> = {
  SANGAT_BAIK: "Sangat Baik",
  BAIK: "Baik",
  CUKUP: "Cukup",
  BUTUH_PERHATIAN: "Butuh Perhatian",
};

const STATUS_COLOR: Record<string, string> = {
  SANGAT_BAIK: "text-green-700 bg-green-50",
  BAIK: "text-blue-700 bg-blue-50",
  CUKUP: "text-yellow-700 bg-yellow-50",
  BUTUH_PERHATIAN: "text-red-700 bg-red-50",
};

function TeacherPanelPage() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("students");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Panel Guru</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">Dashboard</Link>
            <Link to="/change-password" className="text-sm text-blue-600 hover:underline">Ubah Password</Link>
            <button onClick={() => { logout(); }} className="text-sm text-red-600 hover:underline">Keluar</button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2">
          {[["students", "Monitoring Siswa"], ["subjects", "Kelola Mapel"], ["materials", "Materi"], ["questions", "Soal"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key as Tab)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
                tab === key ? "bg-white text-blue-600 border border-b-white border-gray-200 -mb-[3px]" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "students" && <StudentMonitoring />}
        {tab === "subjects" && <ManageSubjects />}
        {tab === "materials" && <ManageMaterials />}
        {tab === "questions" && <ManageQuestions />}
      </div>
    </div>
  );
}

function StudentMonitoring() {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    api.get("/teacher/students").then((res) => {
      setStudents(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selected) {
      api.get(`/teacher/students/${selected}/detail`).then((res) => setDetail(res.data)).catch(() => {});
    } else {
      setDetail(null);
    }
  }, [selected]);

  if (selected && detail) {
    const d = detail as {
      name: string; email: string; className: string; nis: string; totalPoints: number;
      perSubject: { subjectName: string; totalScore: number; completionPercent: number; adaptiveLevel: string; lastActivity: string }[];
      recentQuizzes: { materialTitle: string; score: number; correctCount: number; wrongCount: number; resultLevel: string; startedAt: string }[];
    };
    return (
      <div>
        <button onClick={() => setSelected(null)} className="text-sm text-blue-600 hover:underline mb-4">&larr; Kembali</button>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-2">{d.name}</h3>
          <p className="text-sm text-gray-500">NIS: {d.nis} | Kelas: {d.className} | Poin: {d.totalPoints}</p>
        </div>
        <h4 className="font-semibold text-gray-700 mb-2">Per Mapel</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {d.perSubject.map((p, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="font-medium">{p.subjectName}</p>
              <p className="text-sm text-gray-500">Skor: {p.totalScore} | Progress: {p.completionPercent}%</p>
              <p className="text-sm text-gray-500">Level: {p.adaptiveLevel} | Terakhir: {new Date(p.lastActivity).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
        <h4 className="font-semibold text-gray-700 mb-2">Kuis Terakhir</h4>
        <div className="space-y-2">
          {d.recentQuizzes.map((q, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-3 text-sm">
              <span className="font-medium">{q.materialTitle}</span> — Skor: {q.score} ({q.correctCount}/{q.correctCount + q.wrongCount}) — {q.resultLevel}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loading) return <p className="text-gray-500">Memuat...</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full bg-white rounded-xl shadow-sm border border-gray-200">
        <thead>
          <tr className="text-left text-sm text-gray-500 border-b">
            <th className="p-3">Nama</th>
            <th className="p-3">Kelas</th>
            <th className="p-3">Rata-rata</th>
            <th className="p-3">Status</th>
            <th className="p-3">Mapel</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.userId} className="border-b last:border-0 hover:bg-gray-50">
              <td className="p-3 font-medium">{s.name}</td>
              <td className="p-3 text-sm">{s.className}</td>
              <td className="p-3 text-sm">{s.averageScore}</td>
              <td className="p-3">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLOR[s.status] || ""}`}>
                  {STATUS_LABEL[s.status] || s.status}
                </span>
              </td>
              <td className="p-3 text-sm">{s.subjectCount}</td>
              <td className="p-3">
                <button onClick={() => setSelected(s.userId)} className="text-sm text-blue-600 hover:underline">Detail</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ManageSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const fetch = useCallback(() => {
    api.get("/teacher/subjects").then((r) => setSubjects(r.data)).catch(() => {});
    api.get("/teacher/class-subjects").then((r) => setClassSubjects(r.data)).catch(() => {});
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function addSubject(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/teacher/subjects", { name, code });
      setName("");
      setCode("");
      fetch();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || "Gagal menambah mapel.");
      }
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold mb-4">Tambah Mapel Baru</h3>
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <form onSubmit={addSubject} className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama mapel" className="w-full px-4 py-2 border rounded-lg text-sm" />
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Kode mapel (contoh: MTK)" className="w-full px-4 py-2 border rounded-lg text-sm" />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Simpan</button>
        </form>
        <h4 className="font-semibold mt-6 mb-2">Daftar Mapel</h4>
        <div className="space-y-1">
          {subjects.map((s) => (
            <div key={s.id} className="text-sm p-2 bg-gray-50 rounded">{s.name} ({s.code})</div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold mb-4">Mapel yang Diajar</h3>
        {classSubjects.map((cs) => (
          <div key={cs.id} className="text-sm p-2 bg-gray-50 rounded mb-2">
            {cs.subject.name} — {cs.class.name} (Semester {cs.semester} TA {cs.academicYear})
          </div>
        ))}
      </div>
    </div>
  );
}

function ManageMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [classSubjectId, setClassSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [contentText, setContentText] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetch = useCallback(() => {
    api.get("/teacher/class-subjects").then((r) => setClassSubjects(r.data)).catch(() => {});
    api.get("/teacher/materials").then((r) => setMaterials(r.data)).catch(() => {});
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await api.put(`/teacher/materials/${editingId}`, { title, contentText, difficulty });
      } else {
        await api.post("/teacher/materials", { classSubjectId, title, contentText, orderIndex, difficulty });
      }
      setTitle("");
      setContentText("");
      setOrderIndex(0);
      setDifficulty("MEDIUM");
      setEditingId(null);
      fetch();
    } catch {
      setError("Gagal menyimpan materi.");
    }
  }

  function edit(m: Material) {
    setEditingId(m.id);
    setTitle(m.title);
    setDifficulty(m.difficulty);
    setContentText("");
  }

  function cancelEdit() {
    setEditingId(null);
    setTitle("");
    setContentText("");
    setDifficulty("MEDIUM");
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold mb-4">{editingId ? "Edit Materi" : "Tambah Materi"}</h3>
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          {!editingId && (
            <select value={classSubjectId} onChange={(e) => setClassSubjectId(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-sm">
              <option value="">Pilih mapel & kelas</option>
              {classSubjects.map((cs) => (
                <option key={cs.id} value={cs.id}>{cs.subject.name} — {cs.class.name}</option>
              ))}
            </select>
          )}
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul materi" className="w-full px-4 py-2 border rounded-lg text-sm" />
          <textarea value={contentText} onChange={(e) => setContentText(e.target.value)} placeholder="Konten (opsional)" className="w-full px-4 py-2 border rounded-lg text-sm" rows={3} />
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-sm">
            {["EASY", "MEDIUM", "HARD", "EXPERT"].map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          {!editingId && (
            <input type="number" value={orderIndex} onChange={(e) => setOrderIndex(Number(e.target.value))} placeholder="Urutan" className="w-full px-4 py-2 border rounded-lg text-sm" />
          )}
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
              {editingId ? "Update" : "Simpan"}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="text-sm text-gray-500 hover:underline">Batal</button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold mb-4">Daftar Materi</h3>
        <div className="space-y-2">
          {materials.map((m) => (
            <div key={m.id} className="p-3 bg-gray-50 rounded text-sm flex justify-between items-center">
              <div>
                <span className="font-medium">{m.title}</span>
                <span className="text-gray-400 ml-2">({m.difficulty})</span>
                <span className="text-gray-400 ml-2">{m._count.questions} soal</span>
              </div>
              <button onClick={() => edit(m)} className="text-blue-600 hover:underline text-xs">Edit</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ManageQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialId, setMaterialId] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [optionsStr, setOptionsStr] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [orderIndex, setOrderIndex] = useState(0);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetch = useCallback(() => {
    api.get("/teacher/materials").then((r) => setMaterials(r.data)).catch(() => {});
    api.get("/teacher/questions").then((r) => {
      const qs = r.data.map((q: { options: string | string[]; correctAnswer: string }) => ({
        ...q,
        options: typeof q.options === "string" ? JSON.parse(q.options as string) : q.options,
      }));
      setQuestions(qs);
    }).catch(() => {});
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const options = optionsStr.split("\n").map((s) => s.trim()).filter(Boolean);
    if (options.length < 2) {
      setError("Minimal 2 opsi (pisahkan dengan baris baru).");
      return;
    }
    try {
      if (editingId) {
        await api.put(`/teacher/questions/${editingId}`, { questionText, options, correctAnswer, difficulty });
      } else {
        await api.post("/teacher/questions", { materialId, questionText, options, correctAnswer, difficulty, orderIndex, pointReward: 10 });
      }
      setQuestionText("");
      setOptionsStr("");
      setCorrectAnswer("");
      setDifficulty("MEDIUM");
      setOrderIndex(0);
      setEditingId(null);
      fetch();
    } catch {
      setError("Gagal menyimpan soal.");
    }
  }

  function edit(q: Question) {
    setEditingId(q.id);
    setQuestionText(q.questionText);
    setOptionsStr(Array.isArray(q.options) ? q.options.join("\n") : "");
    setCorrectAnswer(q.correctAnswer);
    setDifficulty(q.difficulty);
  }

  function cancelEdit() {
    setEditingId(null);
    setQuestionText("");
    setOptionsStr("");
    setCorrectAnswer("");
    setDifficulty("MEDIUM");
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold mb-4">{editingId ? "Edit Soal" : "Tambah Soal"}</h3>
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          {!editingId && (
            <select value={materialId} onChange={(e) => setMaterialId(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-sm">
              <option value="">Pilih materi</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          )}
          <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="Teks soal" className="w-full px-4 py-2 border rounded-lg text-sm" rows={3} />
          <textarea value={optionsStr} onChange={(e) => setOptionsStr(e.target.value)} placeholder="Opsi jawaban (pisahkan dengan baris baru)" className="w-full px-4 py-2 border rounded-lg text-sm" rows={4} />
          <input value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} placeholder="Jawaban benar (salin dari opsi)" className="w-full px-4 py-2 border rounded-lg text-sm" />
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-sm">
            {["EASY", "MEDIUM", "HARD", "EXPERT"].map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          {!editingId && (
            <input type="number" value={orderIndex} onChange={(e) => setOrderIndex(Number(e.target.value))} placeholder="Urutan" className="w-full px-4 py-2 border rounded-lg text-sm" />
          )}
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
              {editingId ? "Update" : "Simpan"}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="text-sm text-gray-500 hover:underline">Batal</button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-h-[70vh] overflow-y-auto">
        <h3 className="font-semibold mb-4">Daftar Soal</h3>
        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q.id} className="p-3 bg-gray-50 rounded text-sm">
              <p className="font-medium mb-1">{q.questionText}</p>
              <p className="text-gray-400">Opsi: {Array.isArray(q.options) ? q.options.join(", ") : q.options}</p>
              <p className="text-gray-400">Jawaban: {q.correctAnswer} | {q.difficulty}</p>
              <button onClick={() => edit(q)} className="text-blue-600 hover:underline text-xs mt-1">Edit</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TeacherPanelPage;
