import { Request } from "express";

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export interface SignUpBody {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "STUDENT" | "TEACHER" | "PARENT" | "PRINCIPAL";
}

export interface SignInBody {
  email: string;
  password: string;
}

export interface RefreshBody {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    imageUrl: string | null;
  };
}
