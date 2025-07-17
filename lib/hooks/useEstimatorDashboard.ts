"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  EstimatorDashboardData,
  EstimatorDashboardResponse,
} from "@/lib/types/dashboard";

// API call function with auth headers
const fetchEstimatorDashboard = async (
  userId: string
): Promise<EstimatorDashboardData> => {
  const response = await fetch("/api/estimator/dashboard", {
    headers: {
      "x-user-id": userId,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch estimator dashboard");
  }

  const data: EstimatorDashboardResponse = await response.json();
  if (!data.success) {
    throw new Error(data.error || "Failed to fetch estimator dashboard");
  }

  return {
    stats: data.stats || null,
    leads: data.leads || [],
    isLoading: false,
    error: null,
  };
};

// React Query hook for estimator dashboard
export function useEstimatorDashboard() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["estimator", "dashboard", user?._id],
    queryFn: () => fetchEstimatorDashboard(user!._id),
    enabled: isAuthenticated && !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Export helper hook for easier usage
export function useEstimatorDashboardData() {
  const dashboardQuery = useEstimatorDashboard();

  return {
    data: dashboardQuery.data,
    stats: dashboardQuery.data?.stats || null,
    leads: dashboardQuery.data?.leads || [],
    isLoading: dashboardQuery.isLoading,
    error: dashboardQuery.error,
    refetch: dashboardQuery.refetch,
  };
}
