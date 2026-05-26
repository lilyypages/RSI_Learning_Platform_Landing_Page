import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { authService } from "../services/auth.service";
import { AuthRequest } from "../types";
import { z } from "zod";

const signUpSchema = z.object({
  name: z.string().min(1, "Nama harus diisi."),
  email: z.string().email("Email tidak valid."),
  password: z.string().min(6, "Password minimal 6 karakter."),
  confirmPassword: z.string(),
  role: z.enum(["STUDENT", "TEACHER", "PARENT", "PRINCIPAL"]),
  nis: z.string().optional(),
  classId: z.string().optional(),
  parentId: z.string().optional(),
  nip: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password dan konfirmasi password tidak cocok.",
  path: ["confirmPassword"],
});

const signInSchema = z.object({
  email: z.string().email("Email tidak valid."),
  password: z.string().min(1, "Password harus diisi."),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token harus diisi."),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini harus diisi."),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter."),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Password baru dan konfirmasi tidak cocok.",
  path: ["confirmNewPassword"],
});

function getClientIp(req: Request): string | undefined {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.ip;
}

async function register(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = signUpSchema.parse(req.body);
    const result = await authService.register(parsed, req.user!.userId, getClientIp(req));
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: err.errors[0].message });
      return;
    }
    next(err);
  }
}

async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = signInSchema.parse(req.body);
    const result = await authService.login(parsed.email, parsed.password, getClientIp(req));
    res.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: err.errors[0].message });
      return;
    }
    next(err);
  }
}

async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = refreshSchema.parse(req.body);
    const result = await authService.refresh(parsed.refreshToken);
    res.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: err.errors[0].message });
      return;
    }
    next(err);
  }
}

async function logout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await authService.logout(req.user!.userId);
    res.json({ message: "Logout berhasil." });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = changePasswordSchema.parse(req.body);
    await authService.changePassword(req.user!.userId, parsed, getClientIp(req));
    res.json({ message: "Password berhasil diubah. Silakan login kembali." });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: err.errors[0].message });
      return;
    }
    next(err);
  }
}

async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true, role: true, imageUrl: true, isActive: true, forcePasswordChange: true },
    });
    if (!user || !user.isActive) {
      res.status(401).json({ message: "User tidak ditemukan." });
      return;
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export const authController = { register, login, refresh, logout, changePassword, me };
