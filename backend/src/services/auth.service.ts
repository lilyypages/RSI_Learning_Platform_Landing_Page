import bcrypt from "bcrypt";
import prisma from "../config/prisma";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  TokenPayload,
} from "../utils/jwt";
import {
  setRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
} from "../config/redis";
import { config } from "../config";
import { SignUpBody, AuthResponse } from "../types";

async function register(body: SignUpBody): Promise<AuthResponse> {
  const { name, email, password, role } = body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Email sudah terdaftar.");
  }

  const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      name,
      isActive: true,
    },
  });

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await setRefreshToken(user.id, refreshToken);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      imageUrl: user.imageUrl,
    },
  };
}

async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("Email atau password salah.");
  }

  if (!user.isActive) {
    throw new Error("Akun telah dinonaktifkan.");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error("Email atau password salah.");
  }

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await setRefreshToken(user.id, refreshToken);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      imageUrl: user.imageUrl,
    },
  };
}

async function refresh(refreshToken: string): Promise<AuthResponse> {
  let payload: TokenPayload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new Error("Refresh token tidak valid.");
  }

  const stored = await getRefreshToken(payload.userId);
  if (!stored || stored !== refreshToken) {
    await deleteRefreshToken(payload.userId);
    throw new Error("Refresh token sudah tidak berlaku.");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });
  if (!user || !user.isActive) {
    throw new Error("User tidak ditemukan.");
  }

  const newPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const newAccessToken = signAccessToken(newPayload);
  const newRefreshToken = signRefreshToken(newPayload);

  await setRefreshToken(user.id, newRefreshToken);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      imageUrl: user.imageUrl,
    },
  };
}

async function logout(userId: string): Promise<void> {
  await deleteRefreshToken(userId);
}

export const authService = { register, login, refresh, logout };
