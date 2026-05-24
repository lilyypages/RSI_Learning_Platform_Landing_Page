import { useState } from "react";
import api from "../api/client";

interface Question {
  id: string;
  questionText: string;
  options: string[];
  difficulty: string;
  pointReward: number;
}

interface QuizResult {
  sessionId: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  livesUsed: number;
  streakCount: number;
  resultLevel: string;
  adaptiveLevel: string;
  totalQuestions: number;
}

function QuizPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; correctAnswer: string } | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleStart() {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/quiz/start", {
        materialId: "00000000-0000-0000-0000-000000000001",
        classSubjectId: "00000000-0000-0000-0000-000000000001",
      });
      setSessionId(res.data.sessionId);
      setQuestion(res.data.question);
      setSelectedAnswer("");
      setFeedback(null);
      setResult(null);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || "Gagal memulai kuis.");
      } else {
        setError("Gagal memulai kuis.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAnswer() {
    if (!sessionId || !question || !selectedAnswer) return;

    setError("");
    setLoading(true);
    try {
      const res = await api.post("/quiz/answer", {
        sessionId,
        questionId: question.id,
        answer: selectedAnswer,
      });

      const data = res.data;

      if (data.status === "finished") {
        setResult(data.result);
        setQuestion(null);
        setFeedback(null);
      } else {
        setFeedback({ isCorrect: data.isCorrect, correctAnswer: data.correctAnswer });
        setQuestion(data.question);
        setSelectedAnswer("");
      }
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || "Gagal menjawab.");
      } else {
        setError("Gagal menjawab.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    setFeedback(null);
    setSelectedAnswer("");
  }

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Kuis Selesai!</h1>

          <div className="space-y-2 mb-6">
            <p className="text-lg">
              Skor: <span className="font-bold text-blue-600">{result.score}</span>
            </p>
            <p>
              Benar: <span className="text-green-600">{result.correctCount}</span> |
              Salah: <span className="text-red-600">{result.wrongCount}</span>
            </p>
            <p>Nyawa terpakai: {result.livesUsed}</p>
            <p>Streak: {result.streakCount}</p>
            <p>
              Hasil:{" "}
              <span className={`font-semibold ${
                result.resultLevel === "EXCELLENT" ? "text-green-600" :
                result.resultLevel === "PASSED" ? "text-blue-600" : "text-red-600"
              }`}>
                {result.resultLevel === "EXCELLENT" ? "Sempurna" :
                 result.resultLevel === "PASSED" ? "Lulus" : "Gagal"}
              </span>
            </p>
            <p>
              Level Adaptif:{" "}
              <span className="font-semibold">{result.adaptiveLevel}</span>
            </p>
          </div>

          <button
            onClick={handleStart}
            className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 transition"
          >
            Kuis Baru
          </button>
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Kuis Adaptif</h1>
          <p className="text-gray-500 mb-6">
            Soal akan menyesuaikan tingkat kesulitan berdasarkan jawabanmu.
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>
          )}

          <button
            onClick={handleStart}
            disabled={loading}
            className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "Memulai..." : "Mulai Kuis"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">
        {feedback && (
          <div className={`p-4 rounded-lg mb-4 ${
            feedback.isCorrect ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}>
            <p className="font-semibold">{feedback.isCorrect ? "Benar!" : "Salah"}</p>
            {!feedback.isCorrect && (
              <p className="text-sm mt-1">Jawaban benar: {feedback.correctAnswer}</p>
            )}
            <button
              onClick={handleNext}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Lanjut
            </button>
          </div>
        )}

        {question && !feedback && (
          <>
            <div className="flex justify-between text-sm text-gray-500 mb-4">
              <span>Tingkat: {question.difficulty}</span>
              <span>Poin: {question.pointReward}</span>
            </div>

            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {question.questionText}
            </h2>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>
            )}

            <div className="space-y-3 mb-6">
              {question.options.map((opt, i) => (
                <label
                  key={i}
                  className={`block p-3 border rounded-lg cursor-pointer transition ${
                    selectedAnswer === opt
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="answer"
                    value={opt}
                    checked={selectedAnswer === opt}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    className="mr-2"
                  />
                  {opt}
                </label>
              ))}
            </div>

            <button
              onClick={handleAnswer}
              disabled={loading || !selectedAnswer}
              className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? "Memproses..." : "Jawab"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default QuizPage;
