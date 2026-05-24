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

export { getRedis, setRefreshToken, getRefreshToken, deleteRefreshToken };
