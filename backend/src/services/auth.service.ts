import bcrypt from "bcrypt";
import prisma from "../config/prisma";
import {
  signAccessToken, signRefreshToken,
  verifyRefreshToken, TokenPayload,
} from "../utils/jwt";
import {
  setRefreshToken, getRefreshToken, deleteRefreshToken,
  recordFailedAttempt, isLockedOut, clearLockout,
} from "../config/redis";
import { config } from "../config";
import { SignUpBody, AuthResponse, ChangePasswordBody } from "../types";

const PASSWORD_HISTORY_LIMIT = 5;

function generateUsername(name: string): string {
  const base = name.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "");
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}.${suffix}`;
}

function validatePasswordStrength(password: string): void {
  if (password.length < 8) {
    throw new Error("Password minimal 8 karakter.");
  }
  if (!/[A-Z]/.test(password)) {
    throw new Error("Password harus mengandung huruf kapital.");
  }
  if (!/[a-z]/.test(password)) {
    throw new Error("Password harus mengandung huruf kecil.");
  }
  if (!/[0-9]/.test(password)) {
    throw new Error("Password harus mengandung angka.");
  }
}

async function logAudit(userId: string | null, action: string, detail: string | null = null, ipAddress: string | null = null): Promise<void> {
  await prisma.auditLog.create({
    data: { userId, action, detail, ipAddress },
  });
}

async function register(body: SignUpBody, ipAddress?: string): Promise<AuthResponse> {
  const { name, email, password, role } = body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Email sudah terdaftar.");
  }

  validatePasswordStrength(password);
  const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);
  const username = generateUsername(name);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      name,
      username,
      forcePasswordChange: true,
      isActive: true,
    },
  });

  await prisma.passwordHistory.create({
    data: { userId: user.id, passwordHash },
  });

  await logAudit(user.id, "REGISTER", `User registered as ${role}`, ipAddress);

  // Email notification placeholder
  console.log(`[EMAIL] Welcome email sent to ${email}`);

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
      forcePasswordChange: true,
    },
  };
}

async function login(email: string, password: string, ipAddress?: string): Promise<AuthResponse> {
  if (await isLockedOut(email)) {
    await logAudit(null, "LOGIN_LOCKED", `Locked out: ${email}`, ipAddress);
    throw new Error("Akun terkunci karena terlalu banyak percobaan. Coba lagi 15 menit.");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await recordFailedAttempt(email);
    await logAudit(null, "LOGIN_FAILED", `Email not found: ${email}`, ipAddress);
    throw new Error("Email atau password salah.");
  }

  if (!user.isActive) {
    throw new Error("Akun telah dinonaktifkan.");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    await recordFailedAttempt(email);
    await logAudit(user.id, "LOGIN_FAILED", "Wrong password", ipAddress);
    throw new Error("Email atau password salah.");
  }

  await clearLockout(email);
  await logAudit(user.id, "LOGIN_SUCCESS", `Login as ${user.role}`, ipAddress);

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
      forcePasswordChange: user.forcePasswordChange,
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

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
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
      forcePasswordChange: user.forcePasswordChange,
    },
  };
}

async function logout(userId: string): Promise<void> {
  await deleteRefreshToken(userId);
  await logAudit(userId, "LOGOUT", "User logged out");
}

async function changePassword(userId: string, body: ChangePasswordBody, ipAddress?: string): Promise<void> {
  const { currentPassword, newPassword, confirmNewPassword } = body;

  if (newPassword !== confirmNewPassword) {
    throw new Error("Password baru dan konfirmasi tidak cocok.");
  }

  if (currentPassword === newPassword) {
    throw new Error("Password baru harus berbeda dari password saat ini.");
  }

  validatePasswordStrength(newPassword);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User tidak ditemukan.");
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw new Error("Password saat ini salah.");
  }

  // Check password history
  const history = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: PASSWORD_HISTORY_LIMIT,
  });

  for (const entry of history) {
    const match = await bcrypt.compare(newPassword, entry.passwordHash);
    if (match) {
      throw new Error("Password pernah digunakan sebelumnya. Gunakan password lain.");
    }
  }

  const newHash = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash, forcePasswordChange: false },
    }),
    prisma.passwordHistory.create({
      data: { userId, passwordHash: newHash },
    }),
    // Keep only last N history entries
    prisma.passwordHistory.deleteMany({
      where: {
        userId,
        id: { notIn: history.slice(0, PASSWORD_HISTORY_LIMIT - 1).map(h => h.id) },
      },
    }),
  ]);

  await logAudit(userId, "CHANGE_PASSWORD", "Password changed", ipAddress);
  await deleteRefreshToken(userId);
}

export const authService = { register, login, refresh, logout, changePassword, logAudit };
