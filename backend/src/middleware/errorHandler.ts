import { Request, Response, NextFunction } from "express";

function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error("[ERROR]", err.message);

  if (
    err.message === "Email sudah terdaftar." ||
    err.message === "Email atau password salah." ||
    err.message === "Akun telah dinonaktifkan." ||
    err.message === "Refresh token tidak valid." ||
    err.message === "Refresh token sudah tidak berlaku." ||
    err.message === "User tidak ditemukan."
  ) {
    res.status(400).json({ message: err.message });
    return;
  }

  res.status(500).json({ message: "Terjadi kesalahan server." });
}

export { errorHandler };
