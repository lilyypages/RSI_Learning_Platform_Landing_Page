import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

const KNOWN_ERRORS = [
  "Email sudah terdaftar.",
  "Email atau password salah.",
  "Akun telah dinonaktifkan.",
  "Refresh token tidak valid.",
  "Refresh token sudah tidak berlaku.",
  "User tidak ditemukan.",
  "Akun terkunci karena terlalu banyak percobaan. Coba lagi 15 menit.",
  "Password minimal 8 karakter.",
  "Password harus mengandung huruf kapital.",
  "Password harus mengandung huruf kecil.",
  "Password harus mengandung angka.",
  "Password baru dan konfirmasi tidak cocok.",
  "Password baru harus berbeda dari password saat ini.",
  "Password saat ini salah.",
  "Password pernah digunakan sebelumnya. Gunakan password lain.",
  "Materi tidak ditemukan.",
  "Tidak ada soal pada materi ini.",
  "Data siswa tidak ditemukan.",
  "Sesi kuis tidak ditemukan.",
  "Sesi kuis sudah selesai.",
  "Bukan sesi kuis kamu.",
  "Soal tidak ditemukan.",
  "Soal ini sudah dijawab.",
  "Masih ada sesi kuis yang aktif.",
];

function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error("[ERROR]", err.message);

  if (KNOWN_ERRORS.includes(err.message)) {
    res.status(400).json({ message: err.message });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ message: "Email sudah terdaftar." });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ message: "Data tidak ditemukan." });
      return;
    }
    if (err.code === "P1001" || err.code === "P1000") {
      res.status(503).json({ message: "Gagal terhubung ke database." });
      return;
    }
  }

  res.status(500).json({ message: "Terjadi kesalahan server." });
}

export { errorHandler };
