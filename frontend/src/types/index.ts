export interface User {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "TEACHER" | "PARENT" | "PRINCIPAL";
  imageUrl: string | null;
  isActive?: boolean;
  forcePasswordChange?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
