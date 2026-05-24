import jwt, { type SignOptions } from "jsonwebtoken";
import { config } from "../config";

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

function signAccessToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: config.jwt.accessExpiresIn as unknown as number,
  };
  return jwt.sign(payload, config.jwt.accessSecret, options);
}

function signRefreshToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: config.jwt.refreshExpiresIn as unknown as number,
  };
  return jwt.sign(payload, config.jwt.refreshSecret, options);
}

function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
}

function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
}

export {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  TokenPayload,
};
