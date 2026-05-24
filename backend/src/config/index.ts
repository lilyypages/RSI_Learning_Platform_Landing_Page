import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "8000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || "access-secret-dev",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "refresh-secret-dev",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "24h",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10),
  },

  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },

  database: {
    url: process.env.DATABASE_URL || "",
  },
};
