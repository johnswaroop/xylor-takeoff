export interface UserFormData {
  name: string;
  email: string;
  phone?: string;
  company: string;
  title: string;
}

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

export interface ApiResponse {
  message?: string;
  userId?: string;
  user?: Omit<UserResponse, "_id" | "createdAt" | "updatedAt">;
  error?: string;
  details?: string[];
  totalUsers?: number;
}
