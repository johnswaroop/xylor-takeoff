"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  AuthUserResponse,
  LoginFormData,
  AuthResponse,
} from "@/lib/types/user";
import { UserRole } from "@/lib/types/user-roles";
import { toast } from "sonner";

interface AuthContextType {
  user: AuthUserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    formData: LoginFormData
  ) => Promise<{ success: boolean; redirectUrl?: string; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<AuthUserResponse>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const userId = localStorage.getItem("user_id");
        const userInfo = localStorage.getItem("user_info");

        if (userId && userInfo) {
          const parsedUser = JSON.parse(userInfo) as AuthUserResponse;
          setUser(parsedUser);
        }
      } catch (error) {
        console.error("Error parsing stored auth data:", error);
        // Clear invalid data
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_info");
        localStorage.removeItem("auth_token");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const getRoleBasedRoute = (roles: UserRole[]): string => {
    // If user has BD role, go to BD dashboard
    if (roles.includes(UserRole.BD)) {
      return "/bd/dashboard";
    }
    // If user has Estimator role, go to Estimator dashboard
    if (roles.includes(UserRole.ESTIMATOR)) {
      return "/estimator/dashboard";
    }
    // If user has Admin role, go to Admin dashboard
    if (roles.includes(UserRole.ADMIN)) {
      return "/admin/dashboard";
    }
    // Default fallback
    return "/dashboard";
  };

  const login = async (
    formData: LoginFormData
  ): Promise<{ success: boolean; redirectUrl?: string; error?: string }> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
          rememberMe: formData.rememberMe,
        }),
      });

      const data: AuthResponse = await response.json();

      if (response.ok && data.success && data.user) {
        // Store user info
        localStorage.setItem("user_id", data.user._id);
        localStorage.setItem("user_info", JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem("auth_token", data.token);
        }

        setUser(data.user);

        // Role-based redirection
        const redirectUrl = getRoleBasedRoute(data.user.roles);

        return { success: true, redirectUrl };
      } else {
        return {
          success: false,
          error: data.error || "Invalid email or password.",
        };
      }
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error:
          "Could not connect to server. Please check your internet connection and try again.",
      };
    }
  };

  const logout = async () => {
    try {
      // Optional: Call logout API for server-side cleanup
      if (user?._id) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user._id,
          }),
        }).catch(() => {
          // Ignore API errors during logout - still clean up client side
          console.warn(
            "Logout API call failed, proceeding with client-side cleanup"
          );
        });
      }
    } catch (error) {
      console.warn("Logout API error:", error);
    } finally {
      // Always clean up client-side data regardless of API call success
      localStorage.removeItem("user_id");
      localStorage.removeItem("user_info");
      localStorage.removeItem("auth_token");
      setUser(null);
      toast.success("Logged out successfully");
    }
  };

  const updateUser = (userData: Partial<AuthUserResponse>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem("user_info", JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
