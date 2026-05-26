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
  nis?: string;
  classId?: string;
  parentId?: string;
  nip?: string;
  phone?: string;
  address?: string;
}

export interface SignInBody {
  email: string;
  password: string;
}

export interface RefreshBody {
  refreshToken: string;
}

export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
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
    forcePasswordChange?: boolean;
  };
}

export interface StartQuizBody {
  materialId: string;
  classSubjectId: string;
}

export interface AnswerQuizBody {
  sessionId: string;
  questionId: string;
  answer: string;
  timeTakenSec?: number;
}
