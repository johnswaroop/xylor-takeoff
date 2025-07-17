import { UserRole } from "@/lib/types/user-roles";

// Legacy form data (keeping for backward compatibility)
export interface UserFormData {
  name: string;
  email: string;
  phone?: string;
  company: string;
  title: string;
}

// New auth-specific interfaces
export interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  roles: UserRole[];
  company?: string;
  phone?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Updated user response for auth
export interface AuthUserResponse {
  _id: string;
  name: string;
  email: string;
  roles: UserRole[];
  company: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}

// Legacy user response (keeping for backward compatibility)
export interface UserResponse {
  _id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

// Auth API responses
export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: AuthUserResponse;
  token?: string;
  error?: string;
  details?: string[];
}

// Legacy API response (keeping for backward compatibility)
export interface ApiResponse {
  message?: string;
  userId?: string;
  user?: Omit<UserResponse, "_id" | "createdAt" | "updatedAt">;
  error?: string;
  details?: string[];
  totalUsers?: number;
}
