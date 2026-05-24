import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

const KNOWN_ERRORS = [
  "Email sudah terdaftar.",
  "Email atau password salah.",
  "Akun telah dinonaktifkan.",
  "Refresh token tidak valid.",
  "Refresh token sudah tidak berlaku.",
  "User tidak ditemukan.",
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
    if (err.code === "P1001" || err.code === "P1000") {
      res.status(503).json({ message: "Gagal terhubung ke database." });
      return;
    }
  }

  res.status(500).json({ message: "Terjadi kesalahan server." });
}

export { errorHandler };
