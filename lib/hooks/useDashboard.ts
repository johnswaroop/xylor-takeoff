"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/contexts/AuthContext";
import { DashboardStats, DashboardLead } from "@/lib/types/dashboard";

// API call functions with auth headers
const fetchDashboardStats = async (userId: string): Promise<DashboardStats> => {
  const response = await fetch("/api/bd/dashboard/stats", {
    headers: {
      "x-user-id": userId,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard stats");
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || "Failed to fetch dashboard stats");
  }

  return data.stats;
};

const fetchDashboardLeads = async (
  userId: string
): Promise<DashboardLead[]> => {
  const response = await fetch("/api/bd/dashboard/leads", {
    headers: {
      "x-user-id": userId,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard leads");
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || "Failed to fetch dashboard leads");
  }

  return data.leads;
};

// React Query hooks
export function useDashboardStats() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["dashboard", "stats", user?._id],
    queryFn: () => fetchDashboardStats(user!._id),
    enabled: isAuthenticated && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

export function useDashboardLeads() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["dashboard", "leads", user?._id],
    queryFn: () => fetchDashboardLeads(user!._id),
    enabled: isAuthenticated && !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Combined hook for dashboard data
export function useDashboardData() {
  const statsQuery = useDashboardStats();
  const leadsQuery = useDashboardLeads();

  return {
    stats: {
      data: statsQuery.data,
      isLoading: statsQuery.isLoading,
      error: statsQuery.error,
      refetch: statsQuery.refetch,
    },
    leads: {
      data: leadsQuery.data,
      isLoading: leadsQuery.isLoading,
      error: leadsQuery.error,
      refetch: leadsQuery.refetch,
    },
    isLoading: statsQuery.isLoading || leadsQuery.isLoading,
    error: statsQuery.error || leadsQuery.error,
    refetchAll: () => {
      statsQuery.refetch();
      leadsQuery.refetch();
    },
  };
}
