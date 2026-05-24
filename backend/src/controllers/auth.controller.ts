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

async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = signUpSchema.parse(req.body);
    const result = await authService.register(parsed);
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
    const result = await authService.login(parsed.email, parsed.password);
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

async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true, role: true, imageUrl: true, isActive: true },
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

export const authController = { register, login, refresh, logout, me };
