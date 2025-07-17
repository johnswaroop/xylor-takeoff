"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { UserRole } from "@/lib/types/user-roles";

interface UseAuthGuardOptions {
  redirectTo?: string;
  requiredRoles?: UserRole[];
}

export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { redirectTo = "/auth/login", requiredRoles } = options;

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    // Redirect if not authenticated
    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // Check role requirements if specified
    if (requiredRoles && user) {
      const hasRequiredRole = requiredRoles.some((role) =>
        user.roles.includes(role)
      );

      if (!hasRequiredRole) {
        // Redirect to unauthorized page or dashboard
        router.push("/unauthorized");
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, router, redirectTo, requiredRoles]);

  return {
    isAuthenticated,
    isLoading,
    user,
    isAuthorized:
      isAuthenticated &&
      (!requiredRoles ||
        (user && requiredRoles.some((role) => user.roles.includes(role)))),
  };
}
