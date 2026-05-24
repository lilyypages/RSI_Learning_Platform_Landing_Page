import Redis from "ioredis";
import { config } from "./index";

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
    });
  }
  return redis;
}

// --- Refresh tokens ---

async function setRefreshToken(userId: string, token: string): Promise<void> {
  const r = getRedis();
  await r.set(`refresh:${userId}`, token, "EX", 7 * 24 * 60 * 60);
}

async function getRefreshToken(userId: string): Promise<string | null> {
  const r = getRedis();
  return r.get(`refresh:${userId}`);
}

async function deleteRefreshToken(userId: string): Promise<void> {
  const r = getRedis();
  await r.del(`refresh:${userId}`);
}

// --- Lockout logic ---

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_WINDOW_SEC = 15 * 60;

async function recordFailedAttempt(email: string): Promise<void> {
  const r = getRedis();
  const key = `lockout:${email}`;
  const attempts = await r.incr(key);
  if (attempts === 1) {
    await r.expire(key, LOCKOUT_WINDOW_SEC);
  }
}

async function isLockedOut(email: string): Promise<boolean> {
  const r = getRedis();
  const key = `lockout:${email}`;
  const attempts = await r.get(key);
  return attempts !== null && parseInt(attempts, 10) >= MAX_LOGIN_ATTEMPTS;
}

async function clearLockout(email: string): Promise<void> {
  const r = getRedis();
  await r.del(`lockout:${email}`);
}

async function getFailedAttempts(email: string): Promise<number> {
  const r = getRedis();
  const val = await r.get(`lockout:${email}`);
  return val ? parseInt(val, 10) : 0;
}

// --- Quiz session state cache (adaptive assessment) ---

interface QuizState {
  sessionId: string;
  currentDifficulty: string;
  correctStreak: number;
  wrongStreak: number;
  questionsAnswered: number;
  livesRemaining: number;
}

async function setQuizState(sessionId: string, state: QuizState): Promise<void> {
  const r = getRedis();
  await r.set(`quiz:${sessionId}`, JSON.stringify(state), "EX", 3600);
}

async function getQuizState(sessionId: string): Promise<QuizState | null> {
  const r = getRedis();
  const raw = await r.get(`quiz:${sessionId}`);
  return raw ? JSON.parse(raw) : null;
}

async function delQuizState(sessionId: string): Promise<void> {
  const r = getRedis();
  await r.del(`quiz:${sessionId}`);
}

export {
  getRedis,
  setRefreshToken, getRefreshToken, deleteRefreshToken,
  recordFailedAttempt, isLockedOut, clearLockout, getFailedAttempts,
  setQuizState, getQuizState, delQuizState, MAX_LOGIN_ATTEMPTS,
};
